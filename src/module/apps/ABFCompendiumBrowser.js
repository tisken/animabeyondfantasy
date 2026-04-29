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

  // Folder assignment for known system packs
  static FOLDER_MAP = {
    'animabf.advantages': 'Base', 'animabf.disadvantages': 'Base',
    'animabf.categories': 'Base', 'animabf.races': 'Base',
    'animabf.weapons': 'Base', 'animabf.armors': 'Base',
    'animabf.effects': 'Base', 'animabf.npcs': 'Base',
    'animabf.martial_arts': 'Ki', 'animabf.ki_skills': 'Ki',
    'animabf.nemesis_skills': 'Ki',
    'animabf.magic': 'Magia', 'animabf.metamagic': 'Magia',
    'animabf.summons': 'Magia', 'animabf.magic_items': 'Magia',
    'animabf.psychic': 'Psíquica', 'animabf.mental_patterns': 'Psíquica'
  };

  // Filter config per pack name (last segment)
  static FILTER_FIELDS = {
    magic:          { level: true, select: 'via',        selectLabel: 'Vía' },
    psychic:        { level: true, select: 'discipline', selectLabel: 'Disciplina' },
    npcs:           { level: true, select: '_category',  selectLabel: 'Categoría' },
    advantages:     { select: 'category', selectLabel: 'Categoría' },
    disadvantages:  { select: 'category', selectLabel: 'Categoría' },
    ki_skills:      { level: true },
    martial_arts:   { select: 'grade', selectLabel: 'Grado' }
  };

  // Actor packs always get level + category filters
  static ACTOR_FILTERS = { level: true, select: '_category', selectLabel: 'Categoría' };

  _searchText = '';
  _selectedPack = '';
  _results = [];
  _allDocs = [];
  _loading = false;
  _filters = { levelMin: '', levelMax: '', select1: '' };
  _filterOptions = {};

  _getPackKey(collection) {
    return collection.split('.').pop();
  }

  _getFilterConfig(collection, pack) {
    const key = this._getPackKey(collection);
    if (ABFCompendiumBrowser.FILTER_FIELDS[key]) return ABFCompendiumBrowser.FILTER_FIELDS[key];
    if (pack.documentName === 'Actor') return ABFCompendiumBrowser.ACTOR_FILTERS;
    return {};
  }

  async getData() {
    // Discover all packs for animabf system
    const folders = {};
    const packEntries = {};

    for (const pack of game.packs) {
      if (pack.metadata.system !== 'animabf') continue;
      const collection = pack.collection;
      if (pack.documentName === 'Macro') continue;

      const folder = ABFCompendiumBrowser.FOLDER_MAP[collection]
        ?? (pack.metadata.packageName !== 'animabf' ? pack.metadata.packageName : 'Otros');

      folders[folder] ??= {};
      folders[folder][collection] = {
        label: pack.metadata.label,
        count: (await pack.getIndex()).size
      };
      packEntries[collection] = folders[folder][collection];
    }

    const selPack = this._selectedPack ? game.packs.get(this._selectedPack) : null;
    const ff = selPack ? this._getFilterConfig(this._selectedPack, selPack) : {};

    return {
      folders,
      selectedPack: this._selectedPack,
      selectedLabel: packEntries[this._selectedPack]?.label ?? '',
      searchText: this._searchText,
      results: this._results,
      loading: this._loading,
      hasResults: this._results.length > 0,
      resultCount: this._results.length,
      hasLevel: !!ff.level,
      selectLabel: ff.selectLabel || '',
      hasSelect: !!ff.select,
      selectOptions: this._filterOptions,
      filters: this._filters
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

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
      const pack = game.packs.get(this._selectedPack);
      if (!pack) return;
      const doc = await pack.getDocument(id);
      if (doc?.sheet) doc.sheet.render(true);
    });

    html.find('.browser-result-row').each((_, el) => {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', ev => {
        const id = el.dataset.itemId;
        if (!id) return;
        const pack = game.packs.get(this._selectedPack);
        const docType = pack?.documentName ?? 'Item';
        ev.dataTransfer.setData('text/plain', JSON.stringify({
          type: docType,
          uuid: `Compendium.${this._selectedPack}.${docType}.${id}`
        }));
      });
    });
  }

  async _loadPack() {
    const pack = game.packs.get(this._selectedPack);
    if (!pack) return;

    this._loading = true;
    this.render();

    const docs = await pack.getDocuments();
    const isActor = pack.documentName === 'Actor';
    const ff = this._getFilterConfig(this._selectedPack, pack);

    this._allDocs = docs.map(d => {
      const s = d.system ?? {};
      let level = null;
      let selectVal = '';

      if (isActor) {
        const levels = s.general?.levels ?? [];
        level = levels.reduce((sum, l) => sum + (l.system?.level ?? 0), 0);
        selectVal = levels.map(l => l.name).filter(Boolean).join(', ');
      } else {
        if (ff.level && s.level?.value != null) level = Number(s.level.value);
        if (ff.select && ff.select !== '_category' && s[ff.select]?.value) {
          selectVal = String(s[ff.select].value);
        }
      }

      return {
        id: d.id, name: d.name, img: d.img,
        level, selectVal,
        subtitle: this._getSubtitle(d, isActor)
      };
    });

    // Build select options
    if (ff.select) {
      const vals = new Set();
      for (const d of this._allDocs) {
        for (const v of d.selectVal.split(',')) {
          const t = v.trim();
          if (t) vals.add(t);
        }
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

  _getSubtitle(doc, isActor) {
    if (isActor) {
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
