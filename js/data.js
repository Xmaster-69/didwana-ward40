const CONFIG = {
  ward: 40,
  area: 'डीडवाना',
  parishad: 'डीडवाना नगर पालिका',
  candidate: 'नीतू मारोठिया',
  electionDate: new Date(2026, 8, 9),
  pollStartHour: 7,
  pollEndHour: 18
};

const GUIDANCE = [
  { icon: '🪪', text: 'EPIC पहचान पत्र या मान्य पहचान दस्तावेज़ लेकर जाएं' },
  { icon: '📍', text: 'निर्धारित बूथ पर निर्धारित समय पर पहुंचें' },
  { icon: '🗳️', text: 'ईवीएम पर बटन दबाकर मतदान करें' },
  { icon: '✅', text: 'मतदान के बाद सफ़ेद स्याही से उंगली पर निशान जांचें' }
];

const Store = {
  get(key, def) {
    try {
      const val = localStorage.getItem('w40_' + key);
      return val !== null ? JSON.parse(val) : def;
    } catch { return def; }
  },
  set(key, val) {
    localStorage.setItem('w40_' + key, JSON.stringify(val));
  },
  remove(key) {
    localStorage.removeItem('w40_' + key);
  }
};
