export default class ABFCompendiumBrowser extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'abf-compendium-browser',
      title: 'Buscador de Compendios',
      template: 'systems/animabf/templates/apps/compendium-browser.hbs',
      width: 820,
      height: 620,
      resizable: true,
      classes: ['animabf', 'compendium-browser']
    });
  }

  static FOLDERS = {
    Base:     ['advantages','disadvantages','categories','races','weapons','armors','effects','npcs'],
    Ki:       ['martial_arts','ki_skills','nemesis_skills'],
    Magia:    ['magic','metamagic','summons','magic_items'],
    Psíquica: ['psychic','mental_patterns']
  };

  static PACK_LABELS = {
    advantages: 'Ventajas', disadvantages: 'Desventajas', categories: 'Categorías',
    races: 'Razas', weapons: 'Armas', armors: 'Armaduras', effects: 'Efectos',
    npcs: 'NPCs', martial_arts: 'Artes Marciales', ki_skills: 'Hab. de Ki',
    nemesis_skills: 'Hab. de Némesis', magic: 'Conjuros', metamagic: 'Metamagia',
    summons: 'Invocaciones', magic_items: 'Objetos Mágicos',
    psychic: 'Poderes Psíquicos', mental_patterns: 'Patrones Mentales'
  };

  // Which packs support which filter fields
  static FILTER_FIELDS = {
    magic:          { level: 'level', via: 'via' },
    psychic:        { level: 'level', discipline: 'discipline' },
    npcs:           { level: '_npcLevel', category: '_npcCategory' },
    advantages:     { category: 'category' },
    disadvantages:  { category: 'category' },
    ki_skills:      { level: 'level' },
    martial_arts:   { grade: 'grade' }
  };

  _searchText = '';
  _selectedPack = '';
  _results = [];
  _allDocs = [];
  _loading = false;
  _filters = { levelMin: '', levelMax: '', select1: '' };
  _filterOptions = {};

  async getData() {
    const folders = {};
    for (const [folder, keys] of Object.entries(ABFCompendiumBrowser.FOLDERS)) {
      const packs = {};
      for (const key of keys) {
        const pack = game.packs.get(`animabf.${key}`);
        if (!pack) continue;
        packs[key] = { label: ABFCompendiumBrowser.PACK_LABELS[key], count: (await pack.getIndex()).size };
      }
      if (Object.keys(packs).length) folders[folder] = packs;
    }

    const ff = ABFCompendiumBrowser.FILTER_FIELDS[this._selectedPack] ?? {};
    const hasLevel = !!ff.level;
    const selectField = ff.via || ff.discipline || ff.category || ff.grade || null;
    const selectLabel = ff.via ? 'Vía' : ff.discipline ? 'Disciplina' : ff.category ? 'Categoría' : ff.grade ? 'Grado' : '';

    return {
      folders,
      selectedPack: this._selectedPack,
      selectedLabel: ABFCompendiumBrowser.PACK_LABELS[this._selectedPack] ?? '',
      searchText: this._searchText,
      results: this._results,
      loading: this._loading,
      hasResults: this._results.length > 0,
      resultCount: this._results.length,
      hasLevel,
      selectField,
      selectLabel,
      selectOptions: this._filterOptions,
      filters: this._filters
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Restore select value
    if (this._filters.select1) html.find('.browser-filter-select').val(this._filters.select1);

    html.find('.browser-pack-btn').click(ev => {
      this._selectedPack = ev.currentTarget.dataset.pack;
      this._results = [];
      this._allDocs = [];
      this._searchText = '';
      this._filters = { levelMin: '', levelMax: '', select1: '' };
      this._filterOptions = {};
      this._loadPack();
    });

    html.find('.browser-search-input').on('input', foundry.utils.debounce(ev => {
      this._searchText = ev.target.value;
      this._applyFilters();
    }, 300));

    html.find('.browser-filter-level-min').on('input', foundry.utils.debounce(ev => {
      this._filters.levelMin = ev.target.value;
      this._applyFilters();
    }, 300));

    html.find('.browser-filter-level-max').on('input', foundry.utils.debounce(ev => {
      this._filters.levelMax = ev.target.value;
      this._applyFilters();
    }, 300));

    html.find('.browser-filter-select').on('change', ev => {
      this._filters.select1 = ev.target.value;
      this._applyFilters();
    });

    html.find('.browser-back-btn').click(() => {
      this._selectedPack = '';
      this._results = [];
      this._allDocs = [];
      this._searchText = '';
      this._filters = { levelMin: '', levelMax: '', select1: '' };
      this._filterOptions = {};
      this.render();
    });

    html.find('.browser-result-row').click(async ev => {
      const id = ev.currentTarget.dataset.itemId;
      const pack = game.packs.get(`animabf.${this._selectedPack}`);
      if (!pack) return;
      const doc = await pack.getDocument(id);
      if (doc?.sheet) doc.sheet.render(true);
    });

    html.find('.browser-result-row').each((_, el) => {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', ev => {
        const id = el.dataset.itemId;
        if (!id) return;
        const pack = game.packs.get(`animabf.${this._selectedPack}`);
        const docType = pack?.documentName ?? 'Item';
        ev.dataTransfer.setData('text/plain', JSON.stringify({
          type: docType,
          uuid: `Compendium.animabf.${this._selectedPack}.${docType}.${id}`
        }));
      });
    });
  }

  async _loadPack() {
    const pack = game.packs.get(`animabf.${this._selectedPack}`);
    if (!pack) return;

    this._loading = true;
    this.render();

    const docs = await pack.getDocuments();
    const ff = ABFCompendiumBrowser.FILTER_FIELDS[this._selectedPack] ?? {};
    const isNpc = this._selectedPack === 'npcs';

    this._allDocs = docs.map(d => {
      const s = d.system ?? {};
      let level = null;
      let selectVal = '';

      if (isNpc) {
        const levels = s.general?.levels ?? [];
        level = levels.reduce((sum, l) => sum + (l.system?.level ?? 0), 0);
        selectVal = levels.map(l => l.name).filter(Boolean).join(', ');
      } else {
        if (ff.level) level = s[ff.level]?.value ?? null;
        const sKey = ff.via || ff.discipline || ff.category || ff.grade;
        if (sKey) selectVal = s[sKey]?.value ?? '';
      }

      return {
        id: d.id, name: d.name, img: d.img,
        level: level != null ? Number(level) : null,
        selectVal: String(selectVal),
        subtitle: this._getSubtitle(d, isNpc)
      };
    });

    // Build select options from data
    const selectField = ff.via || ff.discipline || ff.category || ff.grade;
    if (selectField || isNpc) {
      const vals = new Set();
      for (const d of this._allDocs) {
        const v = d.selectVal.trim();
        if (v) vals.add(v);
      }
      this._filterOptions = [...vals].sort().reduce((o, v) => { o[v] = v; return o; }, {});
    }

    this._loading = false;
    this._applyFilters();
  }

  _applyFilters() {
    const search = this._searchText.toLowerCase().trim();
    const levelMin = this._filters.levelMin !== '' ? Number(this._filters.levelMin) : null;
    const levelMax = this._filters.levelMax !== '' ? Number(this._filters.levelMax) : null;
    const sel = this._filters.select1;

    this._results = this._allDocs.filter(d => {
      if (search && !d.name.toLowerCase().includes(search) && !d.subtitle.toLowerCase().includes(search)) return false;
      if (levelMin != null && (d.level == null || d.level < levelMin)) return false;
      if (levelMax != null && (d.level == null || d.level > levelMax)) return false;
      if (sel && !d.selectVal.includes(sel)) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    this.render();
  }

  _getSubtitle(doc, isNpc) {
    if (isNpc) {
      const levels = doc.system?.general?.levels ?? [];
      const total = levels.reduce((s, l) => s + (l.system?.level ?? 0), 0);
      const cats = levels.map(l => l.name).filter(Boolean).join(', ');
      const parts = [];
      if (total > 0) parts.push(`Nv: ${total}`);
      if (cats) parts.push(cats);
      return parts.join(' · ');
    }
    const s = doc.system ?? {};
    const parts = [];
    if (s.level?.value != null) parts.push(`Nv: ${s.level.value}`);
    if (s.cost?.value != null && s.cost.value !== 0) parts.push(`Coste: ${s.cost.value}`);
    if (s.benefit?.value != null && s.benefit.value !== 0) parts.push(`Beneficio: ${s.benefit.value}`);
    if (s.category?.value) parts.push(s.category.value);
    if (s.via?.value) parts.push(s.via.value);
    if (s.discipline?.value) parts.push(s.discipline.value);
    if (s.grade?.value && s.grade.value !== 'base') parts.push(s.grade.value);
    if (s.artType?.value === 'arcana') parts.push('Arcana');
    if (s.branch?.value) parts.push(s.branch.value);
    if (s.summonType?.value) parts.push(s.summonType.value);
    if (s.raceType?.value && s.raceType.value !== 'race') parts.push(s.raceType.value);
    if (s.martialKnowledge?.value) parts.push(`CM: ${s.martialKnowledge.value}`);
    if (s.spheres?.value > 1) parts.push(`Esferas: ${s.spheres.value}`);
    return parts.join(' · ');
  }
}
