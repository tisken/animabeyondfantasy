class ABFCompendiumBrowser extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "abf-compendium-browser",
      title: "Buscador de Compendios",
      template: "systems/animabf/templates/apps/compendium-browser.hbs",
      width: 700,
      height: 600,
      resizable: true,
      classes: ["animabf", "compendium-browser"]
    });
  }
  static PACK_CONFIG = {
    advantages: { label: "Ventajas", type: "advantage" },
    disadvantages: { label: "Desventajas", type: "disadvantage" },
    martial_arts: { label: "Artes Marciales", type: "martialArtData" },
    ki_skills: { label: "Hab. Ki", type: "kiSkillData" },
    nemesis_skills: { label: "Hab. Némesis", type: "nemesisSkillData" },
    metamagic: { label: "Metamagia", type: "metamagicData" },
    summons: { label: "Invocaciones", type: "summonData" },
    categories: { label: "Categorías", type: "category" },
    races: { label: "Razas", type: "raceData" },
    mental_patterns: { label: "Patrones Mentales", type: "mentalPattern" },
    magic_items: { label: "Objetos Mágicos", type: "magicItemData" },
    weapons: { label: "Armas", type: "weapon" },
    armors: { label: "Armaduras", type: "armor" },
    magic: { label: "Conjuros", type: "spell" },
    psychic: { label: "Poderes Psíquicos", type: "psychicPower" },
    effects: { label: "Efectos", type: "effect" },
    npcs: { label: "NPCs", type: null }
  };
  _searchText = "";
  _selectedPack = "";
  _results = [];
  _loading = false;
  async getData() {
    const packs = {};
    for (const [key, cfg] of Object.entries(ABFCompendiumBrowser.PACK_CONFIG)) {
      const pack = game.packs.get(`animabf.${key}`);
      if (pack) {
        packs[key] = { ...cfg, count: (await pack.getIndex()).size };
      }
    }
    return {
      packs,
      selectedPack: this._selectedPack,
      selectedLabel: packs[this._selectedPack]?.label ?? "",
      searchText: this._searchText,
      results: this._results,
      loading: this._loading,
      hasResults: this._results.length > 0,
      resultCount: this._results.length
    };
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".browser-pack-btn").click((ev) => {
      this._selectedPack = ev.currentTarget.dataset.pack;
      this._results = [];
      this._searchText = "";
      this._doSearch();
    });
    html.find(".browser-search-input").on("input", foundry.utils.debounce((ev) => {
      this._searchText = ev.target.value;
      this._doSearch();
    }, 300));
    html.find(".browser-back-btn").click(() => {
      this._selectedPack = "";
      this._results = [];
      this._searchText = "";
      this.render();
    });
    html.find(".browser-result-row").click(async (ev) => {
      const itemId = ev.currentTarget.dataset.itemId;
      const pack = game.packs.get(`animabf.${this._selectedPack}`);
      if (!pack) return;
      const doc = await pack.getDocument(itemId);
      if (doc?.sheet) doc.sheet.render(true);
    });
    html.find(".browser-result-row").each((_, el) => {
      el.setAttribute("draggable", "true");
      el.addEventListener("dragstart", (ev) => {
        const itemId = el.dataset.itemId;
        if (!itemId) return;
        ev.dataTransfer.setData("text/plain", JSON.stringify({
          type: "Item",
          uuid: `Compendium.animabf.${this._selectedPack}.Item.${itemId}`
        }));
      });
    });
  }
  async _doSearch() {
    const packKey = this._selectedPack;
    if (!packKey) return;
    const pack = game.packs.get(`animabf.${packKey}`);
    if (!pack) return;
    this._loading = true;
    this.render();
    const docs = await pack.getDocuments();
    const search = this._searchText.toLowerCase().trim();
    let filtered = docs;
    if (search) {
      filtered = docs.filter((d) => {
        if (d.name.toLowerCase().includes(search)) return true;
        const sys = d.system ?? {};
        for (const val of Object.values(sys)) {
          if (typeof val === "object" && val?.value !== void 0) {
            if (String(val.value).toLowerCase().includes(search)) return true;
          }
        }
        return false;
      });
    }
    this._results = filtered.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      img: d.img,
      subtitle: this._getSubtitle(d)
    })).sort((a, b) => a.name.localeCompare(b.name));
    this._loading = false;
    this.render();
  }
  _getSubtitle(doc) {
    const s = doc.system ?? {};
    const parts = [];
    if (s.cost?.value !== void 0 && s.cost.value !== 0) parts.push(`Coste: ${s.cost.value}`);
    if (s.benefit?.value !== void 0 && s.benefit.value !== 0) parts.push(`Beneficio: ${s.benefit.value}`);
    if (s.category?.value) parts.push(s.category.value);
    if (s.grade?.value && s.grade.value !== "base") parts.push(s.grade.value);
    if (s.artType?.value === "arcana") parts.push("Arcana");
    if (s.branch?.value) parts.push(s.branch.value);
    if (s.summonType?.value) parts.push(s.summonType.value);
    if (s.raceType?.value && s.raceType.value !== "race") parts.push(s.raceType.value);
    if (s.tier?.value && s.tier.value !== "minor") parts.push(s.tier.value);
    if (s.martialKnowledge?.value) parts.push(`CM: ${s.martialKnowledge.value}`);
    if (s.level?.value) parts.push(`Nv: ${s.level.value}`);
    if (s.via?.value) parts.push(s.via.value);
    if (s.discipline?.value) parts.push(s.discipline.value);
    if (s.spheres?.value > 1) parts.push(`Esferas: ${s.spheres.value}`);
    return parts.join(" · ");
  }
}
export {
  ABFCompendiumBrowser as default
};
