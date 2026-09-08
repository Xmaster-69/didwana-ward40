const VoterDB = {
  voters: [],

  async load() {
    const saved = Store.get('voters', null);
    if (saved && saved.length > 100) {
      this.voters = saved;
      return true;
    }
    if (window.VOTERS_DATA && window.VOTERS_DATA.length > 100) {
      this.voters = window.VOTERS_DATA;
      this.voters.forEach(v => {
        v.fieldStatus = v.fieldStatus || '';
        v.note = v.note || '';
      });
      this.save();
      return true;
    }
    try {
      const resp = await fetch('data/voters.json');
      this.voters = await resp.json();
      this.voters.forEach(v => {
        v.fieldStatus = v.fieldStatus || '';
        v.note = v.note || '';
      });
      this.save();
      return true;
    } catch (e) {
      console.warn('Data load failed:', e);
      return false;
    }
  },

  save() {
    Store.set('voters', this.voters);
  },

  search(query) {
    if (!query) return this.voters;
    const q = query.toLowerCase().trim();
    const isNumeric = /^\d+$/.test(q);
    return this.voters.filter(v => {
      if (v.name && v.name.toLowerCase().includes(q)) return true;
      if (v.parent && v.parent.toLowerCase().includes(q)) return true;
      if (v.epic && v.epic.toLowerCase().includes(q)) return true;
      if (v.houseSource && v.houseSource.toLowerCase().includes(q)) return true;
      if (isNumeric) {
        if (v.houseCanonical != null && String(v.houseCanonical) === q) return true;
        if (v.recordId != null && String(v.recordId) === q) return true;
        if (v.age != null && String(v.age) === q) return true;
      }
      if (v.gender && v.gender.includes(q)) return true;
      return false;
    });
  },

  getVoter(recordId) {
    return this.voters.find(v => v.recordId === recordId);
  },

  getFieldStatus(recordId) {
    const v = this.getVoter(recordId);
    return v ? v.fieldStatus : '';
  },

  setFieldStatus(recordId, status) {
    const v = this.getVoter(recordId);
    if (v) {
      v.fieldStatus = v.fieldStatus === status ? '' : status;
      this.save();
    }
  },

  saveNote(recordId, note) {
    const v = this.getVoter(recordId);
    if (v) {
      v.note = note;
      this.save();
    }
  },

  getStats() {
    const total = this.voters.length;
    const visited = this.voters.filter(v => v.fieldStatus === 'visited').length;
    const revisit = this.voters.filter(v => v.fieldStatus === 'revisit').length;
    const pending = total - visited - revisit;
    return { total, visited, revisit, pending };
  },

  getHouses() {
    const map = {};
    this.voters.forEach(v => {
      const h = v.houseCanonical;
      if (h == null) return;
      if (!map[h]) map[h] = [];
      map[h].push(v);
    });
    return map;
  },

  getHouseStatus(house) {
    const members = this.voters.filter(v => v.houseCanonical === house);
    if (!members.length) return 'none';
    const statuses = members.map(m => m.fieldStatus).filter(Boolean);
    if (statuses.length === 0) return 'none';
    if (statuses.every(s => s === 'visited')) return 'visited';
    if (statuses.some(s => s === 'revisit')) return 'revisit';
    if (statuses.some(s => s === 'visited')) return 'visited';
    return 'none';
  },

  getHouseStats(house) {
    const members = this.voters.filter(v => v.houseCanonical === house);
    const visited = members.filter(m => m.fieldStatus === 'visited').length;
    const revisit = members.filter(m => m.fieldStatus === 'revisit').length;
    return { total: members.length, visited, revisit };
  },

  getPendingHouses() {
    const houses = this.getHouses();
    return Object.entries(houses)
      .map(([h, members]) => [Number(h), members])
      .filter(([h]) => this.getHouseStatus(h) !== 'visited')
      .sort((a, b) => b[1].length - a[1].length)
      .map(([house, members]) => ({
        house,
        members,
        visited: members.filter(m => m.fieldStatus === 'visited').length,
        total: members.length
      }));
  },

  getNextPendingHouse(afterHouse) {
    const pending = this.getPendingHouses();
    if (!pending.length) return null;
    if (afterHouse == null) return pending[0];
    const numAfter = Number(afterHouse);
    const next = pending.find(p => p.house > numAfter);
    return next || pending[0];
  },

  getMapProgress() {
    const houses = this.getHouses();
    const totalHouses = Object.keys(houses).length;
    const visitedHouses = Object.keys(houses).filter(h => this.getHouseStatus(Number(h)) === 'visited').length;
    const revisitHouses = Object.keys(houses).filter(h => this.getHouseStatus(Number(h)) === 'revisit').length;
    const pendingHouses = totalHouses - visitedHouses - revisitHouses;
    const unknownHouse = this.voters.filter(v => v.houseCanonical == null).length;
    return { totalHouses, visitedHouses, revisitHouses, pendingHouses, unknownHouse };
  },

  exportData() {
    const data = this.voters.map(v => ({
      recordId: v.recordId,
      name: v.name,
      houseCanonical: v.houseCanonical,
      fieldStatus: v.fieldStatus || '',
      note: v.note || ''
    }));
    return {
      app: 'ward40',
      version: 1,
      exportedAt: new Date().toISOString(),
      voters: data
    };
  },

  importData(jsonData) {
    if (!jsonData || !jsonData.voters || !Array.isArray(jsonData.voters)) {
      return { success: false, msg: 'अमान्य फ़ाइल — सही backup फ़ाइल चुनें।' };
    }
    const importVoters = jsonData.voters;
    let updated = 0, imported = 0, skipped = 0;
    importVoters.forEach(iv => {
      const existing = this.voters.find(v => v.recordId === iv.recordId);
      if (!existing) { skipped++; return; }
      const ivStatus = iv.fieldStatus || '';
      const ivNote = iv.note || '';
      const curStatus = existing.fieldStatus || '';
      const curNote = existing.note || '';
      if (ivStatus && !curStatus) {
        existing.fieldStatus = ivStatus;
        updated++;
      }
      if (ivNote && !curNote) {
        existing.note = ivNote;
        updated++;
      }
      imported++;
    });
    this.save();
    return {
      success: true,
      msg: `${importVoters.length} में से ${imported} मिले | ${updated} अपडेट हुए | ${skipped} नए नहीं जोड़े गए।`
    };
  },

  resetFieldStatuses() {
    this.voters.forEach(v => {
      v.fieldStatus = '';
      v.note = '';
    });
    this.save();
  }
};
