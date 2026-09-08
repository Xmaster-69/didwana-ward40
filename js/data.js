const CONFIG = {
  ward: 40,
  area: 'डीडवाना',
  parishad: 'डीडवाना नगर पालिका',
  candidate: 'नीतू मारोठिया',
  electionDate: new Date(2026, 8, 9),
  pollStartHour: 7,
  pollEndHour: 18,
  boothName: 'नेहरू बाल स्कूल',
  boothAddress: 'लाडनू रोड, डीडवाना',
  boothFull: 'नेहरू बाल स्कूल, लाडनू रोड, डीडवाना'
};

const TEAM = [
  { name: 'गोरी शंकर', role: 'समर्थक' },
  { name: 'धर्मराज सैनी', role: 'समर्थक' },
  { name: 'रमेश सैनी', role: 'समर्थक · ऐप निर्माता', highlight: true },
  { name: 'कृष्ण मारोठिया', role: 'समर्थक' },
  { name: 'ताराचंद मारोठिया', role: 'समर्थक' },
  { name: 'दुर्गा दत्त', role: 'समर्थक' },
  { name: 'रामनिवास मारोठिया', role: 'समर्थक' },
  { name: 'सीताराम मारोठिया', role: 'समर्थक' },
  { name: 'मनोज बागरी', role: 'समर्थक' },
  { name: 'दिनेश भाटी', role: 'समर्थक' }
];

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
