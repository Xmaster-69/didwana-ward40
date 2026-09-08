(function() {
  const $ = id => document.getElementById(id);
  let previousScreen = 'home-screen';
  let flipTimer = null;
  let clockStarted = false;

  const APP_URL = typeof APP_LINK !== 'undefined' ? APP_LINK : 'https://xmaster-69.github.io/didwana-ward40/';
  const AUDIO_FILE = 'audio/welcome.mp3';

  // ===== NAVIGATION =====
  function showScreen(id, pushPrev) {
    const prev = document.querySelector('.screen.active');
    if (pushPrev !== false && prev) previousScreen = prev.id;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    document.querySelectorAll('.bottom-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === id);
    });
    window.scrollTo(0, 0);
    if (id === 'home-screen') { renderHome(); startFlipClock(); }
    if (id === 'share-screen') renderShare();
  }

  document.querySelectorAll('.bottom-nav button').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.nav));
  });
  $('detail-back').addEventListener('click', () => showScreen(previousScreen, false));

  // ===== SPLASH SCREEN + AUDIO =====
  function initSplash() {
    if (sessionStorage.getItem('splashShown')) {
      hideSplash();
      return;
    }
    $('splash-tap').addEventListener('click', () => {
      playSplashAudio();
      sessionStorage.setItem('splashShown', '1');
      hideSplash();
    });
  }

  function playSplashAudio() {
    try {
      const audio = new Audio(AUDIO_FILE);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch(e) {}
  }

  function hideSplash() {
    const s = $('splash-screen');
    if (s) s.classList.add('hidden');
  }

  // ===== FLIP CLOCK COUNTDOWN =====
  function renderCountdown() {
    const clock = $('flip-clock');
    if (!clock) return;
    const now = new Date();
    const pollStart = new Date(2026, 8, 9, CONFIG.pollStartHour, 0, 0);
    const pollEnd = new Date(2026, 8, 9, CONFIG.pollEndHour, 0, 0);

    if (now < pollStart) {
      const diff = pollStart - now;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      clock.innerHTML = `
        <div class="flip-title">मतदान शुरू होने में</div>
        <div class="flip-row">
          ${flipUnit(days, 'दिन')}
          <span class="flip-colon">:</span>
          ${flipUnit(hours, 'घंटे')}
          <span class="flip-colon">:</span>
          ${flipUnit(mins, 'मिनट')}
          <span class="flip-colon">:</span>
          ${flipUnit(secs, 'सेकंड')}
        </div>`;
    } else if (now >= pollStart && now <= pollEnd) {
      clock.innerHTML = `<div class="countdown-live">✅ मतदान चल रहा है — वोट जरूर दें!</div>`;
    } else {
      clock.innerHTML = `<div class="countdown-ended">✅ मतदान का समय समाप्त</div>`;
    }
  }

  function flipUnit(val, label) {
    const str = String(val).padStart(2, '0');
    return `
      <div class="flip-unit">
        <div class="flip-card">
          <div class="flip-face top">${str}</div>
          <div class="flip-face bottom">${str}</div>
        </div>
        <div class="flip-label">${label}</div>
      </div>`;
  }

  function startFlipClock() {
    if (flipTimer) clearInterval(flipTimer);
    renderCountdown();
    flipTimer = setInterval(() => {
      const home = $('home-screen');
      if (home && home.classList.contains('active')) renderCountdown();
    }, 1000);
  }

  // ===== HERO PARTICLES =====
  function createParticles() {
    const container = $('hero-particles');
    if (!container) return;
    const emojis = ['🗳️', '✨', '💜', '🌸', '⭐', '🪷'];
    let html = '';
    for (let i = 0; i < 10; i++) {
      const left = Math.floor(Math.random() * 90) + 5;
      const delay = (Math.random() * 5).toFixed(1);
      const dur = (Math.random() * 4 + 5).toFixed(1);
      const emoji = emojis[i % emojis.length];
      html += `<span class="particle" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s">${emoji}</span>`;
    }
    container.innerHTML = html;
  }

  // ===== VOTE PLEDGE =====
  function initPledge() {
    const btn = $('pledge-btn');
    if (!btn) return;
    const pledged = Store.get('pledged', false);
    updatePledgeUI(pledged);

    btn.addEventListener('click', () => {
      const current = Store.get('pledged', false);
      if (!current) {
        Store.set('pledged', true);
        Store.set('pledgeCount', (Store.get('pledgeCount', 0)) + 1);
        updatePledgeUI(true);
        launchConfetti();
      } else {
        Store.set('pledged', false);
        Store.set('pledgeCount', Math.max(0, (Store.get('pledgeCount', 1)) - 1));
        updatePledgeUI(false);
      }
    });
  }

  function updatePledgeUI(pledged) {
    const btn = $('pledge-btn');
    const stats = $('pledge-stats');
    if (!btn || !stats) return;
    const count = Store.get('pledgeCount', 47);
    if (pledged) {
      btn.classList.add('pledged');
      btn.innerHTML = '<span class="pledge-btn-icon">✅</span><span class="pledge-btn-text">वादा किया!</span>';
    } else {
      btn.classList.remove('pledged');
      btn.innerHTML = '<span class="pledge-btn-icon">✋</span><span class="pledge-btn-text">वादा करें</span>';
    }
    stats.innerHTML = `<span class="pledge-count">${count}</span> लोगों ने वादा किया है`;
  }

  // ===== EVM DEMO =====
  function initEvm() {
    const btn = $('evm-btn');
    const screen = $('evm-screen');
    if (!btn || !screen) return;

    btn.addEventListener('click', () => {
      if (screen.classList.contains('vote-confirm') || screen.classList.contains('vote-done')) return;
      screen.classList.add('vote-confirm');
      screen.innerHTML = `
        <div class="evm-confirm">
          <span class="evm-confirm-symbol">🪷</span>
          <div class="evm-confirm-party">भारतीय जनता पार्टी (भाजपा) · कमल</div>
          <div class="evm-confirm-name">नीतू मारोठिया</div>
          <div class="evm-confirm-q">क्या आप अपना वोट इसे देना चाहते हैं?</div>
          <div class="evm-confirm-actions">
            <button class="evm-yes" id="evm-yes">हाँ, वोट करें</button>
            <button class="evm-no" id="evm-no">नहीं</button>
          </div>
        </div>`;
      $('evm-yes').addEventListener('click', () => {
        screen.classList.remove('vote-confirm');
        screen.classList.add('vote-done');
        screen.innerHTML = '<div class="evm-success"><b>✓</b><p>आपका वोट दर्ज!</p><p class="evm-note">नीतू मारोठिया — वार्ड 40 की आवाज़</p></div>';
        launchConfetti();
        btn.disabled = true;
        btn.style.opacity = '0.6';
        setTimeout(resetEvm, 4000);
      });
      $('evm-no').addEventListener('click', resetEvm);
    });

    function resetEvm() {
      screen.classList.remove('vote-confirm', 'vote-done');
      screen.innerHTML = '<div class="evm-msg">मतदान के लिए नीचे<br>अपना वोट दबाएं</div>';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  function launchConfetti() {
    const colors = ['#e91e63', '#9c27b0', '#ff9800', '#4caf50', '#2196f3', '#fdd835'];
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
      c.style.animationDuration = (Math.random() * 2 + 2).toFixed(2) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4500);
    }
  }

  // ===== HOME =====
  function renderHome() {
    renderTrustCard();
    renderVotingSteps();
    renderSocialProof();
  }

  function renderTrustCard() {
    const card = $('trust-card');
    if (!card) return;
    card.innerHTML = `
      <div class="trust-item"><span class="trust-icon">✅</span><div><strong>वोटर लिस्ट में अपना नाम देखें</strong><p>नाम या EPIC नंबर से खोजें</p></div></div>
      <div class="trust-item"><span class="trust-icon">🗳️</span><div><strong>9 सितंबर को वोट जरूर दें</strong><p>सुबह 7AM – शाम 6PM · वार्ड 40</p></div></div>
      <div class="trust-item"><span class="trust-icon">🤝</span><div><strong>नीतू मारोठिया — आपकी सेवा में</strong><p>वार्ड 40 की बेटी, आपके विकास के लिए</p></div></div>`;
  }

  function renderVotingSteps() {
    const steps = [
      { n: '1', icon: '🪪', t: 'पहचान लेकर जाएं', d: 'EPIC कार्ड या मान्य फोटो पहचान पत्र' },
      { n: '2', icon: '📍', t: 'बूथ पर पहुंचें', d: 'अपने निर्धारित बूथ पर सुबह 7 बजे से' },
      { n: '3', icon: '✅', t: 'टोकन लें', d: 'लाइन में लगें और टोकन प्राप्त करें' },
      { n: '4', icon: '🗳️', t: 'वोट डालें', d: 'ईवीएम पर कमल बटन दबाएं' },
      { n: '5', icon: '🤝', t: 'जांच करें', d: 'सफ़ेद स्याही की जांच करें और घर लौटें' }
    ];
    $('voting-steps').innerHTML = steps.map(s => `
      <div class="step-item"><div class="step-num">${s.n}</div><div class="step-icon">${s.icon}</div>
        <div class="step-text"><div class="step-title">${s.t}</div><div class="step-desc">${s.d}</div></div></div>`).join('');
  }

  function renderSocialProof() {
    const total = (VoterDB.voters && VoterDB.voters.length) || (window.VOTERS_DATA && VOTERS_DATA.length) || 1388;
    $('social-proof').innerHTML = `
      <div class="proof-item"><span class="proof-num">${total}</span><span class="proof-lbl">वार्ड 40 मतदाता</span></div>
      <div class="proof-item"><span class="proof-num">1</span><span class="proof-lbl">उम्मीदवार — नीतू मारोठिया</span></div>
      <div class="proof-item"><span class="proof-num">9 सितं.</span><span class="proof-lbl">मतदान दिवस</span></div>`;
  }

  // ===== VOTER DETAIL =====
  function openVoterDetail(recordId) {
    const v = VoterDB.getVoter(recordId);
    if (!v) return;
    const detail = $('voter-detail');
    detail.innerHTML = `
      <div class="detail-found"><div class="found-icon">✅</div><div class="found-title">आप वार्ड 40 के मतदाता हैं!</div></div>
      <div class="detail-card">
        <div class="detail-row"><span class="dl">नाम</span><span class="dv">${v.name || '—'}</span></div>
        <div class="detail-row"><span class="dl">पिता/पति</span><span class="dv">${v.parent || '—'}</span></div>
        <div class="detail-row"><span class="dl">EPIC नंबर</span><span class="dv">${v.epic || '—'}</span></div>
        <div class="detail-row"><span class="dl">घर नं.</span><span class="dv">${v.houseCanonical || '—'}</span></div>
        <div class="detail-row"><span class="dl">आयु</span><span class="dv">${v.age != null ? v.age + ' वर्ष' : '—'}</span></div>
      </div>
      <div class="detail-card voting-call">
        <div class="call-icon">🗳️</div>
        <div class="call-text"><strong>9 सितंबर 2026 को वोट दें</strong><p>सुबह 7AM – शाम 6PM · वार्ड 40</p></div>
      </div>
      <div class="detail-card">
        <button class="cta-btn" onclick="App.shareApp()">📲 अपने परिवार को यह ऐप भेजें</button>
      </div>`;
    showScreen('voter-detail-screen');
  }

  // ===== ENHANCED SEARCH (Name + EPIC/Voter ID) =====
  function bindSearch(inputId, resultsId) {
    $(inputId).addEventListener('input', function() {
      const q = this.value.trim();
      const results = $(resultsId);
      if (!q || q.length < 2) { results.innerHTML = ''; return; }
      const voters = VoterDB.search(q).slice(0, 25);
      if (!voters.length) {
        results.innerHTML = '<div class="search-empty">😕 कोई परिणाम नहीं मिला।<br>नाम या EPIC नंबर सही लिखें।<br><a href="https://electoralsearch.eci.gov.in/" target="_blank" style="color:#9c27b0;font-weight:700;">आधिकारिक साइट पर खोजें →</a></div>';
        return;
      }
      results.innerHTML = voters.map(v => `
        <div class="voter-result" data-rid="${v.recordId}">
          <div class="vr-name">${v.name || ''} ${v.parent ? '(' + v.parent + ')' : ''}</div>
          <div class="vr-meta">
            ${v.epic ? '<span class="vr-tag">EPIC: ' + v.epic + '</span>' : ''}
            ${v.houseCanonical ? '<span class="vr-tag">घर ' + v.houseCanonical + '</span>' : ''}
            ${v.age != null ? '<span class="vr-tag">' + v.age + ' वर्ष</span>' : ''}
          </div>
        </div>`).join('');
      results.querySelectorAll('.voter-result').forEach(el => {
        el.addEventListener('click', () => openVoterDetail(Number(el.dataset.rid)));
      });
    });
  }

  // ===== EDUCATION =====
  function renderEducation() {
    const roles = [
      { icon: '🏗️', title: 'सड़क, नाली, बिजली', desc: 'बुनियादी ढांचे का विकास और रखरखाव।' },
      { icon: '💧', title: 'पानी और सफ़ाई', desc: 'पेयजल आपूर्ति और स्वच्छता सुनिश्चित करना।' },
      { icon: '🏫', title: 'शिक्षा और स्वास्थ्य', desc: 'स्कूल, अस्पताल और सामुदायिक सेवाओं का विकास।' },
      { icon: '🌳', title: 'पार्क और सार्वजनिक स्थान', desc: 'हरित क्षेत्र और सार्वजनिक सुविधाओं का निर्माण।' }
    ];
    const rc = $('role-cards');
    if (rc) {
      rc.innerHTML = roles.map(r => `
        <div class="role-card"><div class="role-icon">${r.icon}</div>
          <div class="role-text"><h4>${r.title}</h4><p>${r.desc}</p></div></div>`).join('');
    }

    const faqs = [
      { q: 'पार्षद कौन होता है?', a: 'पार्षद वह जनप्रतिनिधि होता है जिसे आप सीधे अपने वार्ड से चुनते हैं। वह आपके क्षेत्र की समस्याओं को नगर पालिका में उठाता है और उनका समाधान कराता है।' },
      { q: 'पार्षद कैसे चुना जाता है?', a: 'प्रत्येक वार्ड से एक पार्षद का चुनाव सीधे मतदान द्वारा होता है। ईवीएम पर अपने पसंदीदा उम्मीदवार को वोट दें।' },
      { q: 'चुनाव कब हो रहा है?', a: '9 सितंबर 2026, सुबह 7 बजे से शाम 6 बजे तक। डीडवाना नगर पालिका, वार्ड 40।' },
      { q: 'मैं वोट कैसे डालूं?', a: 'EPIC पहचान पत्र लेकर अपने निर्धारित बूथ पर जाएं। ईवीएम पर कमल बटन दबाएं। मतदान के बाद सफ़ेद स्याही से उंगली पर निशान जांचें।' },
      { q: 'पहचान पत्र नहीं है तो क्या करें?', a: 'मतदाता सूची में नाम होना ज़रूरी है। आधार कार्ड, पासपोर्ट, ड्राइविंग लाइसेंस जैसे अन्य दस्तावेज़ भी चलेंगे।' }
    ];
    const fq = $('faq-list');
    if (fq) {
      fq.innerHTML = faqs.map((f, i) => `
        <div class="faq-item">
          <div class="faq-q" data-i="${i}"><span>${f.q}</span><span class="faq-arrow">›</span></div>
          <div class="faq-a">${f.a}</div></div>`).join('');
      fq.querySelectorAll('.faq-q').forEach(el => {
        el.addEventListener('click', () => {
          const a = el.parentElement.querySelector('.faq-a');
          const open = a.style.display === 'block';
          a.style.display = open ? 'none' : 'block';
          el.querySelector('.faq-arrow').textContent = open ? '›' : '⌄';
        });
      });
    }
  }

  // ===== SHARE =====
  function renderShare() {
    const msg = `🗳️ *वार्ड 40 — नीतू मारोठिया*\n\nवार्ड 40 के सभी मतदाताओं से आग्रह — 9 सितंबर 2026 को मतदान अवश्य करें।\n\nवोटर लिस्ट में अपना नाम देखें: ${APP_URL}\n\nसुबह 7AM – शाम 6PM · वार्ड 40\n\nनीतू मारोठिया — आपके वार्ड की सेवा में।\n\n🔗 ${APP_URL}`;
    $('share-msg').value = msg;
    $('share-preview').innerHTML = `<div class="preview-msg"><div class="preview-title">मैसेज पूर्वावलोकन:</div><div class="preview-body">${msg.replace(/\n/g, '<br>')}</div></div>`;
  }

  // ===== PWA INSTALL PROMPT =====
  let deferredPrompt = null;
  function initInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      $('install-banner').classList.remove('hidden');
    });
    $('install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        $('install-banner').classList.add('hidden');
      }
    });
  }

  // ===== EXPOSED API =====
  window.App = {
    shareApp: function() {
      const msg = encodeURIComponent(`🗳️ वार्ड 40 के मतदाताओं के लिए जरूरी जानकारी — वोटर लिस्ट में अपना नाम देखें: ${APP_URL}`);
      if (navigator.share) {
        navigator.share({ title: 'वार्ड 40 — नीतू मारोठिया', text: decodeURIComponent(msg) }).catch(() => {});
      } else {
        window.open('https://wa.me/?text=' + msg, '_blank');
      }
    },
    shareWhatsApp: function() {
      const msg = encodeURIComponent(`🗳️ *वार्ड 40 — नीतू मारोठिया*\n\nवार्ड 40 के सभी मतदाताओं से आग्रह — 9 सितंबर 2026 को मतदान अवश्य करें।\n\nवोटर लिस्ट में अपना नाम देखें: ${APP_URL}\n\nसुबह 7AM – शाम 6PM · वार्ड 40\n\nनीतू मारोठिया — आपके वार्ड की सेवा में।\n\n🔗 ${APP_URL}`);
      window.open('https://wa.me/?text=' + msg, '_blank');
    },
    sharePoster: function() {
      const msg = encodeURIComponent(`🗳️ वार्ड 40 · नीतू मारोठिया\n\nआधिकारिक पोस्टर — 9 सितंबर 2026 को अपना वोट जरूर दें।\n\nसुबह 7AM – शाम 6PM\n\n🖼️ ${APP_URL}candidate_poster.jpg`);
      if (navigator.share) {
        navigator.share({ title: 'वार्ड 40 — नीतू मारोठिया', text: decodeURIComponent(msg) }).catch(() => {});
      } else {
        window.open('https://wa.me/?text=' + msg, '_blank');
      }
    },
    copyLink: function() {
      navigator.clipboard.writeText(APP_URL).then(() => alert('✅ लिंक कॉपी हो गया!'));
    },
    shareSMS: function() {
      window.open('sms:?body=' + encodeURIComponent(`वार्ड 40 के सभी मतदाताओं से आग्रह — 9 सितंबर 2026 को वोट जरूर दें।\nवोटर लिस्ट में अपना नाम देखें: ${APP_URL}\nनीतू मारोठिया — वार्ड 40 की आवाज़।`), '_blank');
    },
    copyMessage: function() {
      navigator.clipboard.writeText($('share-msg').value).then(() => alert('✅ मैसेज कॉपी हो गया!'));
    }
  };

  // ===== INIT =====
  bindSearch('voter-search', 'search-results');
  renderHome();
  renderEducation();
  renderShare();
  createParticles();
  initEvm();
  initInstall();
  initPledge();
  initSplash();
  renderCountdown();
  startFlipClock();
  VoterDB.load().then(() => renderHome()).catch(() => {});
})();
