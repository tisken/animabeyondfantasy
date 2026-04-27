import { Templates } from "../utils/constants.js";
import { ABFAttackData } from "../combat/ABFAttackData.js";
import { ABFDefenseData } from "../combat/ABFDefenseData.js";
import { AbilityData } from "../types/AbilityData.js";
import { computeCombatResult } from "../combat/computeCombatResult.js";
import { updateAttackTargetsFlag } from "../../utils/updateAttackTargetsFlag.js";
import { getChatVisibilityOptions } from "../utils/chatVisibility.js";
import ABFFoundryRoll from "../rolls/ABFFoundryRoll.js";
import { FormulaEvaluator } from "../../utils/formulaEvaluator.js";
import { shieldValueCheck } from "../combat/utils/shieldValueCheck.js";
class DefenseConfigurationDialog extends FormApplication {
  constructor(object = {}, options = {}) {
    const base = DefenseConfigurationDialog._buildInitialData(object);
    base.ui.activeTab = DefenseConfigurationDialog._pickBestDefenseTab(base);
    super(base, options);
    this.modalData = base;
    this._claimed = false;
    this._resolved = false;
    this._initialState = null;
    if (base.allowed && base.defender?.actor) {
      DefenseConfigurationDialog._initMysticDefaults(base);
      DefenseConfigurationDialog._initPsychicDefaults(base);
    }
    if (this._tabs?.[0]) {
      this._tabs[0].callback = (_event, _tabs, tabName) => {
        this.modalData.ui.activeTab = tabName;
        this.render(true);
      };
      try {
        this._tabs[0].activate(this.modalData.ui.activeTab);
      } catch (_) {
      }
    }
    this.render(true);
  }
  static _getDocId(docLike) {
    return docLike?._id ?? docLike?.id ?? "";
  }
  static _buildInitialData({
    defender,
    attacker,
    attackData,
    weaponId,
    options = {},
    messageId
  }) {
    if (!defender || !defender.actor) {
      ui.notifications?.error("DefenseConfigurationDialog: defender is required");
      return { allowed: false };
    }
    const defenderActor = defender.actor;
    const weapons = defenderActor.system?.combat?.weapons ?? [];
    const firstWeapon = weapons[0];
    const initialWeaponUsed = weaponId ?? firstWeapon?._id ?? firstWeapon?.id ?? "";
    const initialWeapon = weapons.find((w) => (w?._id ?? w?.id) === initialWeaponUsed) ?? firstWeapon ?? void 0;
    const supernaturalShields = defenderActor.system?.combat?.supernaturalShields ?? [];
    const firstShield = supernaturalShields[0];
    const firstShieldId = DefenseConfigurationDialog._getDocId(firstShield);
    return {
      ui: {
        isGM: !!game.user?.isGM,
        hasFatiguePoints: (defenderActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0) > 0,
        activeTab: "dodge",
        // Computed each getData()
        dodgeValue: 0,
        blockValue: 0,
        shieldValue: 0,
        supernaturalShields: []
      },
      attacker: attacker ? { token: attacker, actor: attacker?.actor } : void 0,
      attackData: attackData ? ABFAttackData.fromJSON(attackData) : new ABFAttackData(),
      defender: {
        token: defender,
        actor: defenderActor,
        withoutRoll: false,
        showRoll: !game.user?.isGM,
        combat: {
          modifier: 0,
          fatigueUsed: 0,
          multipleDefensesPenalty: 0,
          weaponUsed: initialWeaponUsed,
          weapon: initialWeapon,
          unarmed: weapons.length === 0,
          supernaturalShieldUsed: firstShieldId
        },
        mystic: {
          modifier: 0,
          magicProjection: {
            base: defenderActor.system?.mystic?.magicProjection?.imbalance?.defensive?.base?.value ?? 0,
            final: defenderActor.system?.mystic?.magicProjection?.imbalance?.defensive?.final?.value ?? 0
          },
          spellUsed: void 0,
          spellGrade: "base",
          attainableSpellGrades: [],
          spellCasting: {
            zeon: { accumulated: 0, cost: 0 },
            canCast: { prepared: false, innate: false },
            casted: { prepared: false, innate: false },
            override: false
          },
          overrideMysticCast: false,
          supernaturalShield: {
            shieldUsed: void 0,
            shieldValue: 0,
            newShield: true
          }
        },
        psychic: {
          modifier: 0,
          psychicPotential: {
            special: 0,
            base: defenderActor.system?.psychic?.psychicPotential?.base?.value ?? 0,
            final: defenderActor.system?.psychic?.psychicPotential?.final?.value ?? 0
          },
          psychicProjection: defenderActor.system?.psychic?.psychicProjection?.imbalance?.defensive?.final?.value ?? 0,
          powerUsed: void 0,
          supernaturalShield: {
            shieldUsed: void 0,
            shieldValue: 0,
            newShield: true
          },
          mentalPatternImbalance: false,
          eliminateFatigue: false
        }
      },
      defenseSent: false,
      allowed: game.user?.isGM || (options?.allowed ?? true),
      messageId: messageId ?? options?.messageId ?? ""
    };
  }
  static _initMysticDefaults(base) {
    const actor = base.defender.actor;
    const { mystic } = base.defender;
    const spells = actor.system?.mystic?.spells ?? [];
    const supernaturalShields = actor.system?.combat?.supernaturalShields ?? [];
    const mysticSettings = actor.system?.mystic?.mysticSettings ?? {};
    if (spells.length > 0) {
      const lastUsed = actor.getFlag?.(game.animabf.id, "lastDefensiveSpellUsed");
      mystic.spellUsed = spells.find((w) => w._id === lastUsed) ? lastUsed : spells.find((w) => w.system?.combatType?.value === "defense")?._id;
      const override = actor.getFlag?.(game.animabf.id, "spellCastingOverride") || false;
      mystic.spellCasting.override = override;
      mystic.overrideMysticCast = override;
      const spell = spells.find((w) => w._id === mystic.spellUsed);
      if (override) {
        mystic.attainableSpellGrades = ["base", "intermediate", "advanced", "arcane"];
      } else if (spell) {
        const intel = actor.system?.characteristics?.primaries?.intelligence?.value ?? 0;
        const finalIntel = mysticSettings.aptitudeForMagicDevelopment ? intel + 3 : intel;
        for (const grade in spell.system?.grades) {
          if (finalIntel >= (spell.system.grades[grade]?.intRequired?.value ?? 0)) {
            mystic.attainableSpellGrades.push(grade);
          }
        }
      }
    }
    const mysticShield = supernaturalShields.find(
      (w) => w.flags?.animabf?.supernaturalShield?.type === "mystic"
    );
    if (mysticShield) {
      mystic.supernaturalShield = {
        shieldUsed: mysticShield._id,
        shieldValue: mysticShield.system?.shieldPoints?.value ?? mysticShield.system?.shieldPoints ?? 0,
        newShield: false
      };
    }
  }
  static _initPsychicDefaults(base) {
    const actor = base.defender.actor;
    const { psychic } = base.defender;
    const psychicPowers = actor.system?.psychic?.psychicPowers ?? [];
    const supernaturalShields = actor.system?.combat?.supernaturalShields ?? [];
    if (psychicPowers.length > 0) {
      const lastUsed = actor.getFlag?.(game.animabf.id, "lastDefensivePowerUsed");
      psychic.powerUsed = psychicPowers.find((w) => w._id === lastUsed) ? lastUsed : psychicPowers.find((w) => w.system?.combatType?.value === "defense")?._id;
      const power = psychicPowers.find((w) => w._id === psychic.powerUsed);
      psychic.psychicPotential.special = power?.system?.bonus?.value ?? 0;
    }
    const psychicShield = supernaturalShields.find(
      (w) => w.flags?.animabf?.supernaturalShield?.type === "psychic"
    );
    if (psychicShield) {
      psychic.supernaturalShield = {
        shieldUsed: psychicShield._id,
        shieldValue: psychicShield.system?.shieldPoints?.value ?? psychicShield.system?.shieldPoints ?? 0,
        newShield: false
      };
    }
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["animabf-dialog", "defense-config-dialog"],
      submitOnChange: true,
      closeOnSubmit: false,
      width: 600,
      height: "auto",
      resizable: true,
      template: Templates.Dialog.Combat.DefenseConfigDialog,
      title: game.i18n.localize("macros.combat.dialog.defending.defend.title"),
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "dodge"
        }
      ]
    });
  }
  get defenderActor() {
    return this.modalData?.defender?.actor;
  }
  getData() {
    const { defender, ui: ui2 } = this.modalData;
    if (!defender?.actor) return this.modalData;
    ui2.hasFatiguePoints = (this.defenderActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0) > 0;
    const weapons = this.defenderActor.system?.combat?.weapons ?? [];
    defender.combat.unarmed = weapons.length === 0;
    if (!defender.combat.unarmed) {
      const exists = weapons.some((w) => (w?._id ?? w?.id) === defender.combat.weaponUsed);
      if (!exists) defender.combat.weaponUsed = weapons[0]?._id ?? weapons[0]?.id ?? "";
      defender.combat.weapon = weapons.find((w) => (w?._id ?? w?.id) === defender.combat.weaponUsed) ?? weapons[0];
    } else {
      defender.combat.weapon = void 0;
      defender.combat.weaponUsed = "";
    }
    ui2.dodgeValue = Number(this.defenderActor.system?.combat?.dodge?.final?.value ?? 0) || 0;
    ui2.blockValue = defender.combat.unarmed ? Number(this.defenderActor.system?.combat?.block?.final?.value ?? 0) || 0 : Number(defender.combat.weapon?.system?.block?.final?.value ?? 0) || 0;
    const shields = this.defenderActor.system?.combat?.supernaturalShields ?? [];
    ui2.supernaturalShields = shields.map((sh) => {
      const _id = DefenseConfigurationDialog._getDocId(sh);
      const formula = String(sh?.system?.abilityFormula ?? "").trim();
      const value = DefenseConfigurationDialog._evaluateShieldFormula(
        formula,
        this.defenderActor
      );
      return {
        ...sh,
        _id,
        value
      };
    });
    if (ui2.supernaturalShields.length > 0) {
      const selectedId = String(defender.combat.supernaturalShieldUsed ?? "");
      const selected = ui2.supernaturalShields.find((s) => String(s._id ?? "") === selectedId) ?? ui2.supernaturalShields[0];
      defender.combat.supernaturalShieldUsed = selected?._id ?? "";
      ui2.shieldValue = Number(selected?.value ?? 0) || 0;
    } else {
      defender.combat.supernaturalShieldUsed = "";
      ui2.shieldValue = 0;
    }
    const { mystic, psychic } = defender;
    const spells = this.defenderActor.system?.mystic?.spells ?? [];
    const psychicPowers = this.defenderActor.system?.psychic?.psychicPowers ?? [];
    const supShields = this.defenderActor.items ? this.defenderActor.items.filter((i) => i.type === "supernaturalShield").map((i) => ({ _id: i.id, name: i.name, system: i.system, flags: i.flags })) : shields;
    if (!mystic.spellUsed) {
      mystic.spellUsed = spells.find(
        (w) => w.system?.combatType?.value === "defense"
      )?._id;
    }
    const spell = spells.find((w) => w._id === mystic.spellUsed);
    if (spell && this.defenderActor.mysticCanCastEvaluate) {
      mystic.spellCasting = this.defenderActor.mysticCanCastEvaluate(
        spell,
        mystic.spellGrade,
        mystic.spellCasting.casted,
        mystic.spellCasting.override
      );
    }
    if (!mystic.supernaturalShield.shieldUsed) {
      mystic.supernaturalShield.shieldUsed = supShields.find(
        (w) => w.flags?.animabf?.supernaturalShield?.type === "mystic"
      )?._id;
    }
    const mysticShield = supShields.find(
      (w) => w._id === mystic.supernaturalShield.shieldUsed
    );
    mystic.supernaturalShield.shieldValue = mysticShield?.system?.shieldPoints?.value ?? mysticShield?.system?.shieldPoints ?? 0;
    if (!psychic.powerUsed) {
      psychic.powerUsed = psychicPowers.find(
        (w) => w.system?.combatType?.value === "defense"
      )?._id;
    }
    const power = psychicPowers.find((w) => w._id === psychic.powerUsed);
    const psychicBonus = power?.system?.bonus?.value ?? 0;
    psychic.psychicPotential.final = psychic.psychicPotential.special + (this.defenderActor.system?.psychic?.psychicPotential?.final?.value ?? 0) + psychicBonus;
    if (!psychic.supernaturalShield.shieldUsed) {
      psychic.supernaturalShield.shieldUsed = supShields.find(
        (w) => w.flags?.animabf?.supernaturalShield?.type === "psychic"
      )?._id;
    }
    const psychicShield = supShields.find(
      (w) => w._id === psychic.supernaturalShield.shieldUsed
    );
    psychic.supernaturalShield.shieldValue = psychicShield?.system?.shieldPoints?.value ?? psychicShield?.system?.shieldPoints ?? 0;
    this.defenderActor.system.combat.supernaturalShields = supShields;
    return this.modalData;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".send-defense").on("click", async (ev) => {
      ev.preventDefault();
      const raw = ev.currentTarget.dataset.type;
      const type = raw === "block" ? "block" : raw === "shield" ? "shield" : "dodge";
      await this._sendDefenseToChat(type);
    });
    html.find(".send-mystic-defense").on("click", async (ev) => {
      ev.preventDefault();
      await this._sendMysticDefense();
    });
    html.find(".send-psychic-defense").on("click", async (ev) => {
      ev.preventDefault();
      await this._sendPsychicDefense();
    });
  }
  static _pickBestDefenseTab(modalData) {
    const actor = modalData?.defender?.actor;
    if (!actor) return "dodge";
    const dodge = Number(actor.system?.combat?.dodge?.final?.value ?? 0) || 0;
    const weapons = actor.system?.combat?.weapons ?? [];
    const selectedWeaponId = modalData?.defender?.combat?.weaponUsed;
    const weapon = weapons.find((w) => String(w?._id ?? w?.id) === String(selectedWeaponId ?? "")) ?? weapons[0];
    const block = weapon ? Number(weapon.system?.block?.final?.value ?? 0) || 0 : Number(actor.system?.combat?.block?.final?.value ?? 0) || 0;
    const shields = actor.system?.combat?.supernaturalShields ?? [];
    let bestShield = 0;
    for (const sh of shields) {
      const f = String(sh?.system?.abilityFormula ?? "").trim();
      const v = DefenseConfigurationDialog._evaluateShieldFormula(f, actor);
      if (v > bestShield) bestShield = v;
    }
    const spells = actor.system?.mystic?.spells ?? [];
    const magicProj = spells.length > 0 ? Number(
      actor.system?.mystic?.magicProjection?.imbalance?.defensive?.final?.value ?? 0
    ) || 0 : 0;
    const psychicPowers = actor.system?.psychic?.psychicPowers ?? [];
    const psychicProj = psychicPowers.length > 0 ? Number(
      actor.system?.psychic?.psychicProjection?.imbalance?.defensive?.final?.value ?? 0
    ) || 0 : 0;
    const candidates = [
      { tab: "dodge", value: dodge },
      { tab: "block", value: block },
      { tab: "shield", value: bestShield },
      { tab: "mystic", value: magicProj },
      { tab: "psychic", value: psychicProj }
    ];
    candidates.sort((a, b) => b.value - a.value);
    return candidates[0].tab;
  }
  static _evaluateShieldFormula(formula, actor) {
    const v = FormulaEvaluator.evaluate(formula, actor);
    return Number(v ?? 0) || 0;
  }
  _getTargetKeys() {
    const actorUuid = this.defenderActor?.uuid ?? "";
    const tokenDocOrToken = this.modalData?.defender?.token ?? null;
    const tokenUuid = tokenDocOrToken?.document?.uuid ?? tokenDocOrToken?.uuid ?? "";
    return { actorUuid, tokenUuid };
  }
  async _sendDefenseToChat(type) {
    const actor = this.defenderActor;
    if (!actor) return ui.notifications?.warn("Defender no encontrado.");
    const { defender, attackData } = this.modalData;
    const combat = defender?.combat ?? {};
    const weapon = combat.weapon;
    try {
      if (!this._claimed && this.modalData?.messageId) {
        const { actorUuid: actorUuid2, tokenUuid: tokenUuid2 } = this._getTargetKeys();
        await updateAttackTargetsFlag(this.modalData.messageId, {
          actorUuid: actorUuid2,
          tokenUuid: tokenUuid2,
          state: "rolling",
          rolledBy: game.user.id,
          updatedAt: Date.now()
        });
        this._claimed = true;
      }
      this.modalData.defenseSent = true;
      setTimeout(() => this.render(), 0);
      const vis = getChatVisibilityOptions();
      let shieldValue = 0;
      let shieldItemId = "";
      if (type === "shield") {
        const shields = this.defenderActor.system?.combat?.supernaturalShields ?? [];
        const wantedId = String(combat.supernaturalShieldUsed ?? "");
        const selected = shields.find(
          (s) => String(DefenseConfigurationDialog._getDocId(s)) === wantedId
        ) ?? shields[0];
        if (selected) {
          const formula2 = String(selected.system?.abilityFormula ?? "").trim();
          shieldValue = DefenseConfigurationDialog._evaluateShieldFormula(
            formula2,
            this.defenderActor
          );
          shieldItemId = DefenseConfigurationDialog._getDocId(selected);
        }
      }
      const defenseAbility = AbilityData.builder().naturalBase(
        type === "block" ? combat.unarmed ? actor.system?.combat?.block?.base?.value ?? 0 : weapon?.system?.block?.base?.value ?? 0 : type === "shield" ? shieldValue : actor.system?.combat?.dodge?.base?.value ?? 0
      ).finalBase(
        type === "block" ? combat.unarmed ? actor.system?.combat?.block?.final?.value ?? 0 : weapon?.system?.block?.final?.value ?? 0 : type === "shield" ? shieldValue : actor.system?.combat?.dodge?.final?.value ?? 0
      ).build();
      const die = (defenseAbility.naturalBase ?? 0) >= 200 ? actor.system?.general?.diceSettings?.abilityMasteryDie?.value ?? "1d100" : actor.system?.general?.diceSettings?.abilityDie?.value ?? "1d100";
      const mod = Number(combat?.modifier ?? 0);
      const multiPenalty = Number(combat?.multipleDefensesPenalty ?? 0);
      const formula = `${die} + ${Number(defenseAbility.finalBase ?? 0) + mod + multiPenalty}`;
      const roll = new ABFFoundryRoll(formula, actor.system);
      await roll.evaluate({ async: true });
      const tokenDocOrToken = defender?.token ?? null;
      const tokenForSpeaker = tokenDocOrToken?.object ?? tokenDocOrToken ?? null;
      const tokenName = tokenForSpeaker?.name ?? tokenForSpeaker?.document?.name ?? actor.name;
      const speaker = tokenForSpeaker ? { ...ChatMessage.getSpeaker({ token: tokenForSpeaker }), alias: tokenName } : ChatMessage.getSpeaker({ actor });
      await roll.toMessage({
        speaker,
        flavor: "Rolling defense",
        rollMode: vis.rollMode
      });
      const armorType = attackData?.armorType;
      const taFinal = armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;
      const defenseData = ABFDefenseData.builder().defenseAbility(roll.total).armor(taFinal).inmodifiableArmor(false).defenseType(type).defenderId(actor.id).defenderTokenId(defender?.token?.id ?? "").weaponId(weapon?._id ?? weapon?.id ?? "").shieldId(shieldItemId).build();
      const combatResult = computeCombatResult(attackData, defenseData);
      const damageFinal = Number(
        combatResult?.damageFinal ?? combatResult?.damage?.final ?? combatResult?.finalDamage ?? combatResult?.damage ?? 0
      );
      const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.CombatResult, {
        combatResult: { ...combatResult, damageFinal },
        defenderId: actor.id,
        defenderTokenId: defender?.token?.id ?? ""
      });
      await ChatMessage.create({
        content,
        speaker,
        ...vis,
        flags: {
          animabf: {
            kind: "combatResult",
            result: { ...combatResult, damageFinal },
            defender: {
              actorId: actor.id,
              tokenId: defender?.token?.id ?? ""
            },
            damageControl: { appliedOnce: false, apps: [] }
          }
        }
      });
      this._resolved = true;
      const { actorUuid, tokenUuid } = this._getTargetKeys();
      await updateAttackTargetsFlag(this.modalData.messageId, {
        actorUuid,
        tokenUuid,
        state: "done",
        rolledBy: game.user.id,
        defenseResult: defenseData.toJSON?.() ?? defenseData,
        updatedAt: Date.now()
      });
      await this.close();
    } catch (err) {
      console.error(err);
      ui.notifications?.error("No se pudo enviar la defensa al chat.");
    } finally {
      this.modalData.defenseSent = false;
      if (this.rendered) setTimeout(() => this.render(), 0);
    }
  }
  async _sendMysticDefense() {
    const actor = this.defenderActor;
    if (!actor) return ui.notifications?.warn("Defender no encontrado.");
    const { defender, attackData } = this.modalData;
    const {
      mystic: {
        magicProjection,
        modifier,
        spellUsed,
        spellGrade,
        spellCasting,
        supernaturalShield: { shieldUsed, newShield }
      }
    } = defender;
    const { spells } = actor.system?.mystic ?? {};
    const supernaturalShields = actor.system?.combat?.supernaturalShields ?? [];
    let spell;
    if (!newShield) {
      if (!shieldUsed) {
        return ui.notifications?.warn(
          game.i18n.localize(
            "macros.combat.dialog.warning.supernaturalShieldNotFound.mystic"
          )
        );
      }
      spell = supernaturalShields.find((w) => (w._id ?? w.id) === shieldUsed);
    } else if (spellUsed) {
      actor.setFlag?.(game.animabf.id, "spellCastingOverride", spellCasting.override);
      actor.setFlag?.(game.animabf.id, "lastDefensiveSpellUsed", spellUsed);
      spell = (spells ?? []).find((w) => w._id === spellUsed);
      spellCasting.zeon.cost = spell?.system?.grades?.[spellGrade]?.zeon?.value ?? 0;
      if (actor.evaluateCast?.(spellCasting)) {
        defender.mystic.overrideMysticCast = true;
        return;
      }
      const gradeData = spell?.system?.grades?.[spellGrade];
      shieldValueCheck(gradeData);
    }
    try {
      if (!this._claimed && this.modalData?.messageId) {
        const { actorUuid: actorUuid2, tokenUuid: tokenUuid2 } = this._getTargetKeys();
        await updateAttackTargetsFlag(this.modalData.messageId, {
          actorUuid: actorUuid2,
          tokenUuid: tokenUuid2,
          state: "rolling",
          rolledBy: game.user.id,
          updatedAt: Date.now()
        });
        this._claimed = true;
      }
      this.modalData.defenseSent = true;
      setTimeout(() => this.render(), 0);
      const vis = getChatVisibilityOptions();
      const combatModifier = Number(modifier ?? 0);
      let formula = `1d100xa + ${magicProjection.final} + ${combatModifier}`;
      if (defender.withoutRoll) formula = formula.replace("1d100xa", "0");
      if ((magicProjection.base ?? 0) >= 200)
        formula = formula.replace("xa", "xamastery");
      const roll = new ABFFoundryRoll(formula, actor.system);
      await roll.evaluate({ async: true });
      if (defender.showRoll) {
        const flavor = game.i18n.format("macros.combat.dialog.magicDefense.title", {
          spell: spell?.name ?? "?",
          target: this.modalData.attacker?.token?.name ?? "?"
        });
        const speaker2 = this._buildSpeaker();
        await roll.toMessage({ speaker: speaker2, flavor, rollMode: vis.rollMode });
      }
      const armorType = attackData?.armorType;
      const taFinal = armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;
      const defenseData = ABFDefenseData.builder().defenseAbility(roll.total).armor(taFinal).defenseType("mystic").defenderId(actor.id).defenderTokenId(defender?.token?.id ?? "").shieldId(shieldUsed ?? "").build();
      const combatResult = computeCombatResult(attackData, defenseData);
      const damageFinal = Number(combatResult?.damageFinal ?? 0);
      const speaker = this._buildSpeaker();
      const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.CombatResult, {
        combatResult: { ...combatResult, damageFinal },
        defenderId: actor.id,
        defenderTokenId: defender?.token?.id ?? ""
      });
      await ChatMessage.create({
        content,
        speaker,
        ...vis,
        flags: {
          animabf: {
            kind: "combatResult",
            result: { ...combatResult, damageFinal },
            defender: { actorId: actor.id, tokenId: defender?.token?.id ?? "" },
            damageControl: { appliedOnce: false, apps: [] }
          }
        }
      });
      this._resolved = true;
      const { actorUuid, tokenUuid } = this._getTargetKeys();
      await updateAttackTargetsFlag(this.modalData.messageId, {
        actorUuid,
        tokenUuid,
        state: "done",
        rolledBy: game.user.id,
        defenseResult: defenseData.toJSON?.() ?? defenseData,
        updatedAt: Date.now()
      });
      await this.close();
    } catch (err) {
      console.error(err);
      ui.notifications?.error("No se pudo enviar la defensa mística al chat.");
    } finally {
      this.modalData.defenseSent = false;
      if (this.rendered) setTimeout(() => this.render(), 0);
    }
  }
  async _sendPsychicDefense() {
    const actor = this.defenderActor;
    if (!actor) return ui.notifications?.warn("Defender no encontrado.");
    const { defender, attackData } = this.modalData;
    const {
      psychic: {
        psychicPotential,
        powerUsed,
        modifier,
        eliminateFatigue,
        mentalPatternImbalance,
        supernaturalShield: { shieldUsed, newShield }
      }
    } = defender;
    const { psychicPowers } = actor.system?.psychic ?? {};
    const supernaturalShields = actor.system?.combat?.supernaturalShields ?? [];
    let power, psychicFatigue, newPsychicPotential;
    const psychicProjection = actor.system?.psychic?.psychicProjection?.imbalance?.defensive?.final?.value ?? 0;
    const combatModifier = Number(modifier ?? 0);
    let formula = `1d100xa + ${psychicProjection} + ${combatModifier}`;
    if (defender.withoutRoll) formula = formula.replace("1d100xa", "0");
    if ((actor.system?.psychic?.psychicProjection?.base?.value ?? 0) >= 200)
      formula = formula.replace("xa", "xamastery");
    const psychicProjectionRoll = new ABFFoundryRoll(formula, actor.system);
    await psychicProjectionRoll.evaluate({ async: true });
    psychicProjectionRoll.total - psychicProjection - combatModifier;
    if (!newShield) {
      if (!shieldUsed) {
        return ui.notifications?.warn(
          game.i18n.localize(
            "macros.combat.dialog.warning.supernaturalShieldNotFound.psychic"
          )
        );
      }
      power = supernaturalShields.find((w) => (w._id ?? w.id) === shieldUsed);
    } else if (powerUsed) {
      actor.setFlag?.(game.animabf.id, "lastDefensivePowerUsed", powerUsed);
      power = (psychicPowers ?? []).find((w) => w._id === powerUsed);
      const potentialRoll = new ABFFoundryRoll(
        `1d100PsychicRoll + ${psychicPotential.final}`,
        { ...actor.system, power, mentalPatternImbalance }
      );
      await potentialRoll.evaluate({ async: true });
      newPsychicPotential = potentialRoll.total;
      if (defender.showRoll) {
        const speaker = this._buildSpeaker();
        await potentialRoll.toMessage({
          speaker,
          flavor: game.i18n.format("macros.combat.dialog.psychicPotential.title")
        });
      }
      psychicFatigue = await actor.evaluatePsychicFatigue?.(
        power,
        potentialRoll.total,
        eliminateFatigue,
        defender.showRoll
      );
      if (!psychicFatigue) {
        const effStr = power?.system?.effects?.[newPsychicPotential]?.value ?? power?.system?.effects?.[String(newPsychicPotential)]?.value ?? "";
        ({ create: true, shieldPoints: shieldValueCheck(effStr) });
      }
    }
    try {
      if (!this._claimed && this.modalData?.messageId) {
        const { actorUuid: actorUuid2, tokenUuid: tokenUuid2 } = this._getTargetKeys();
        await updateAttackTargetsFlag(this.modalData.messageId, {
          actorUuid: actorUuid2,
          tokenUuid: tokenUuid2,
          state: "rolling",
          rolledBy: game.user.id,
          updatedAt: Date.now()
        });
        this._claimed = true;
      }
      this.modalData.defenseSent = true;
      setTimeout(() => this.render(), 0);
      const vis = getChatVisibilityOptions();
      if (!psychicFatigue && defender.showRoll) {
        const flavor = game.i18n.format("macros.combat.dialog.psychicDefense.title", {
          power: power?.name ?? "?",
          target: this.modalData.attacker?.token?.name ?? "?"
        });
        const speaker2 = this._buildSpeaker();
        await psychicProjectionRoll.toMessage({
          speaker: speaker2,
          flavor,
          rollMode: vis.rollMode
        });
      }
      const armorType = attackData?.armorType;
      const taFinal = armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;
      const defenseData = ABFDefenseData.builder().defenseAbility(psychicFatigue ? 0 : psychicProjectionRoll.total).armor(taFinal).defenseType("psychic").defenderId(actor.id).defenderTokenId(defender?.token?.id ?? "").shieldId(shieldUsed ?? "").build();
      const combatResult = computeCombatResult(attackData, defenseData);
      const damageFinal = Number(combatResult?.damageFinal ?? 0);
      const speaker = this._buildSpeaker();
      const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.CombatResult, {
        combatResult: { ...combatResult, damageFinal },
        defenderId: actor.id,
        defenderTokenId: defender?.token?.id ?? ""
      });
      await ChatMessage.create({
        content,
        speaker,
        ...vis,
        flags: {
          animabf: {
            kind: "combatResult",
            result: { ...combatResult, damageFinal },
            defender: { actorId: actor.id, tokenId: defender?.token?.id ?? "" },
            damageControl: { appliedOnce: false, apps: [] }
          }
        }
      });
      this._resolved = true;
      const { actorUuid, tokenUuid } = this._getTargetKeys();
      await updateAttackTargetsFlag(this.modalData.messageId, {
        actorUuid,
        tokenUuid,
        state: "done",
        rolledBy: game.user.id,
        defenseResult: defenseData.toJSON?.() ?? defenseData,
        updatedAt: Date.now()
      });
      await this.close();
    } catch (err) {
      console.error(err);
      ui.notifications?.error("No se pudo enviar la defensa psíquica al chat.");
    } finally {
      this.modalData.defenseSent = false;
      if (this.rendered) setTimeout(() => this.render(), 0);
    }
  }
  _buildSpeaker() {
    const { defender } = this.modalData;
    const tokenDocOrToken = defender?.token ?? null;
    const tokenForSpeaker = tokenDocOrToken?.object ?? tokenDocOrToken ?? null;
    const tokenName = tokenForSpeaker?.name ?? tokenForSpeaker?.document?.name ?? this.defenderActor.name;
    return tokenForSpeaker ? { ...ChatMessage.getSpeaker({ token: tokenForSpeaker }), alias: tokenName } : ChatMessage.getSpeaker({ actor: this.defenderActor });
  }
  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const prevSpell = this.modalData.defender?.mystic?.spellUsed;
    this.modalData = foundry.utils.mergeObject(this.modalData, expanded, {
      inplace: false,
      overwrite: true,
      insertKeys: true,
      insertValues: true
    });
    if (prevSpell !== this.modalData.defender?.mystic?.spellUsed) {
      const { spells, mysticSettings } = this.defenderActor.system?.mystic ?? {};
      const spell = (spells ?? []).find(
        (w) => w._id === this.modalData.defender.mystic.spellUsed
      );
      this.modalData.defender.mystic.spellGrade = "base";
      this.modalData.defender.mystic.attainableSpellGrades = [];
      const intelligence = this.defenderActor.system?.characteristics?.primaries?.intelligence?.value ?? 0;
      const finalIntelligence = mysticSettings?.aptitudeForMagicDevelopment ? intelligence + 3 : intelligence;
      for (const grade in spell?.system?.grades) {
        if (finalIntelligence >= (spell.system.grades[grade]?.intRequired?.value ?? 0)) {
          this.modalData.defender.mystic.attainableSpellGrades.push(grade);
        }
      }
    }
    if (this.modalData.defender?.mystic?.spellCasting?.override) {
      this.modalData.defender.mystic.attainableSpellGrades = [
        "base",
        "intermediate",
        "advanced",
        "arcane"
      ];
    }
    setTimeout(() => this.render(), 0);
  }
  async render(force, options) {
    const firstRealRender = !this.rendered;
    if (firstRealRender && this.modalData?.messageId && this.defenderActor) {
      try {
        const msg = game.messages.get(this.modalData.messageId);
        const targets = msg?.getFlag(game.animabf.id, "targets") ?? [];
        const { actorUuid, tokenUuid } = this._getTargetKeys();
        const entry = targets.find((t) => t.tokenUuid === tokenUuid) ?? targets.find((t) => t.actorUuid === actorUuid);
        this._initialState = entry?.state ?? null;
        this._claimed = false;
      } catch (e) {
        console.warn("[ABF] render init failed:", e);
      }
    }
    return super.render(force, options);
  }
  async close(options) {
    if (options?.force) return super.close(options);
    if (this._claimed && !this._resolved && this.modalData?.messageId && this.defenderActor) {
      try {
        const msg = game.messages.get(this.modalData.messageId);
        const targets = msg?.getFlag(game.animabf.id, "targets") ?? [];
        const { actorUuid, tokenUuid } = this._getTargetKeys();
        const entry = targets.find((t) => t.tokenUuid === tokenUuid) ?? targets.find((t) => t.actorUuid === actorUuid);
        const current = entry?.state ?? null;
        if (current !== "done") {
          await updateAttackTargetsFlag(this.modalData.messageId, {
            actorUuid,
            tokenUuid,
            state: this._initialState,
            updatedAt: Date.now()
          });
        }
      } catch (e) {
        console.warn("[ABF] rollback failed:", e);
      }
    }
    return super.close(options);
  }
}
export {
  DefenseConfigurationDialog
};
