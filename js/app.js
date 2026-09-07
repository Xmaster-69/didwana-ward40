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
    if (id === 'search-screen') $('search2-input').focus();
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
      // Try to play audio (medium volume)
      playSplashAudio();
      sessionStorage.setItem('splashShown', '1');
      hideSplash();
    });
  }

  function playSplashAudio() {
    try {
      const audio = new Audio(AUDIO_FILE);
      audio.volume = 0.5; // medium volume
      audio.play().catch(() => { /* silent fallback if no file yet */ });
    } catch(e) { /* noop */ }
  }

  function hideSplash() {
    const s = $('splash-screen');
    if (s) s.classList.add('hidden');
  }

  // ===== FLIP CLOCK COUNTDOWN (with seconds, New Year style) =====
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
          <div class="flip-fold"></div>
        </div>
        <div class="flip-label">${label}</div>
      </div>`;
  }

  function startFlipClock() {
    if (flipTimer) clearInterval(flipTimer);
    renderCountdown();
    flipTimer = setInterval(() => {
      // Only update if home screen active & user has passed splash
      const home = $('home-screen');
      if (home && home.classList.contains('active')) renderCountdown();
    }, 1000);
  }

  // ===== HERO PARTICLES =====
  function createParticles() {
    const container = $('hero-particles');
    if (!container) return;
    const emojis = ['🗳️', '✨', '💜', '🌸', '⭐', '🎀'];
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

  // ===== EVM DEMO =====
  function initEvm() {
    const btn = $('evm-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const screen = $('evm-screen');
      screen.innerHTML = '<div class="evm-success"><b>✓</b><p>आपका वोट दर्ज!</p><p class="evm-note">नीतू मारोठिया — वार्ड 40 की आवाज़</p></div>';
      screen.classList.add('vote-done');
      // confetti
      launchConfetti();
      btn.disabled = true;
      btn.style.opacity = '0.6';
      setTimeout(() => {
        screen.innerHTML = '<div class="evm-msg">दबाएं और देखें</div>';
        screen.classList.remove('vote-done');
        btn.disabled = false;
        btn.style.opacity = '1';
      }, 3500);
    });
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
      <div class="trust-item"><span class="trust-icon">✅</span><div><strong>अपना नाम खोजें</strong><p>नीचे सर्च बॉक्स में अपना नाम टाइप करें</p></div></div>
      <div class="trust-item"><span class="trust-icon">🗳️</span><div><strong>9 सितंबर को वोट जरूर दें</strong><p>सुबह 7AM – शाम 6PM · वार्ड 40</p></div></div>
      <div class="trust-item"><span class="trust-icon">🤝</span><div><strong>नीतू मारोठिया — आपकी सेवा में</strong><p>वार्ड 40 की बेटी, आपके विकास के लिए</p></div></div>`;
  }

  function renderVotingSteps() {
    const steps = [
      { n: '1', icon: '🪪', t: 'पहचान लेकर जाएं', d: 'EPIC कार्ड या मान्य फोटो पहचान पत्र' },
      { n: '2', icon: '📍', t: 'बूथ पर पहुंचें', d: 'अपने निर्धारित बूथ पर सुबह 7 बजे से' },
      { n: '3', icon: '✅', t: 'टोकन लें', d: 'लाइन में लगें और टोकन प्राप्त करें' },
      { n: '4', icon: '🗳️', t: 'वोट डालें', d: 'ईवीएम पर नीतू मारोठिया का बटन दबाएं' },
      { n: '5', icon: '🤝', t: 'जांच करें', d: 'सफ़ेद स्याही की जांच करें और घर लौटें' }
    ];
    $('voting-steps').innerHTML = steps.map(s => `
      <div class="step-item"><div class="step-num">${s.n}</div><div class="step-icon">${s.icon}</div>
        <div class="step-text"><div class="step-title">${s.t}</div><div class="step-desc">${s.d}</div></div></div>`).join('');
  }

  function renderSocialProof() {
    const total = (window.VOTERS_DATA && VOTERS_DATA.length) || 1388;
    $('social-proof').innerHTML = `
      <div class="proof-item"><span class="proof-num">${total}</span><span class="proof-lbl">वार्ड 40 मतदाता</span></div>
      <div class="proof-item"><span class="proof-num">1</span><span class="proof-lbl">उम्मीदवार — नीतू</span></div>
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

  // ===== GENERIC SEARCH BINDER =====
  function bindSearch(inputId, resultsId) {
    $(inputId).addEventListener('input', function() {
      const q = this.value.trim();
      const results = $(resultsId);
      if (!q || q.length < 2) { results.innerHTML = ''; return; }
      const voters = VoterDB.search(q).slice(0, 25);
      if (!voters.length) {
        results.innerHTML = '<div class="search-empty">😕 कोई मेल नहीं मिला।<br>नाम सही लिखें।</div>';
        return;
      }
      results.innerHTML = voters.map(v => `
        <div class="list-item voter-result" data-rid="${v.recordId}">
          <div class="voter-avatar female">${(v.name || '?').substring(0, 1)}</div>
          <div class="voter-info"><div class="voter-name">${v.name || 'अज्ञात'}</div>
          <div class="voter-meta">घर ${v.houseCanonical || '—'}</div></div>
          <div class="check-badge">✅</div></div>`).join('');
      results.querySelectorAll('.list-item').forEach(el => {
        el.addEventListener('click', () => {
          $(inputId).value = '';
          results.innerHTML = '';
          openVoterDetail(parseInt(el.dataset.rid));
        });
      });
    });
  }

  // ===== VIDEO =====
  function initVideo() {
    const savedUrl = Store.get('videoUrl', '');
    if (savedUrl && $('video-placeholder')) {
      $('video-placeholder').innerHTML = `<video controls style="width:100%;border-radius:12px;background:#000" src="${savedUrl}"></video>`;
    }
    if ($('video-save-btn')) {
      $('video-save-btn').addEventListener('click', () => {
        const url = $('video-url').value.trim();
        if (!url) return;
        Store.set('videoUrl', url);
        alert('✅ वीडियो सेव हो गया!');
        location.reload();
      });
    }
  }

  // ===== EDUCATION =====
  function renderEducation() {
    const roles = [
      { icon: '🛣️', t: 'सड़कें', d: 'गलियों और सड़कों का विकास व मरम्मत' },
      { icon: '💧', t: 'पानी', d: 'नल का पानी और पेयजल व्यवस्था' },
      { icon: '🧹', t: 'सफाई', d: 'कचरा संग्रहण, नालियों की सफाई' },
      { icon: '💡', t: 'रोशनी', d: 'गली-मोहल्ले की स्ट्रीट लाइटें' },
      { icon: '🏫', t: 'शिक्षा', d: 'स्कूल और युवाओं की सुविधाएं' },
      { icon: '🏥', t: 'स्वास्थ्य', d: 'स्वास्थ्य केंद्र व्यवस्था' },
      { icon: '📑', t: 'प्रमाण पत्र', d: 'जन्म, मृत्यु, आय और निवास प्रमाण पत्र' }
    ];
    const rc = $('role-cards');
    if (rc) {
      rc.innerHTML = roles.map(r => `
        <div class="role-card"><div class="role-icon">${r.icon}</div>
        <div class="role-title">${r.t}</div><div class="role-desc">${r.d}</div></div>`).join('');
    }

    const faqs = [
      { q: 'EPIC कार्ड नहीं है तो?', a: 'किसी भी मान्य फोटो पहचान पत्र के साथ जाएं — आधार, पैन, ड्राइविंग लाइसेंस।' },
      { q: 'कितनी बार वोट दे सकते हैं?', a: 'सिर्फ एक बार। एक बार डालने के बाद दोबारा नहीं।' },
      { q: 'नाम सूची में नहीं आ रहा?', a: 'बूथ पर मतदान अधिकारी से संपर्क करें। सूची में नाम होना जरूरी है।' },
      { q: 'बूथ कहां है?', a: 'मतदाता परिचय पत्र पर बूथ का पता लिखा होता है। या जिला निर्वाचन कार्यालय से संपर्क करें।' },
      { q: 'मैं किसके लिए वोट देता/देती हूं?', a: 'आप अपने वार्ड के लिए एक पार्षद चुनते हैं जो सड़क, पानी, सफाई जैसी समस्याएं हल करेगा।' }
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
    const msg = `🗳️ *वार्ड 40 — नीतू मारोठिया*\n\nदोस्तों! अपना नाम चेक करें और 9 सितंबर 2026 को वोट जरूर दें।\n\nसुबह 7AM – शाम 6PM\n\nनीतू मारोठिया — आपके वार्ड की सेवा में।\n\n🔗 ${APP_URL}`;
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
      const msg = encodeURIComponent(`🗳️ वार्ड 40 के दोस्तों! अपना नाम यहां चेक करें: ${APP_URL}`);
      if (navigator.share) {
        navigator.share({ title: 'वार्ड 40 — नीतू मारोठिया', text: decodeURIComponent(msg) }).catch(() => {});
      } else {
        window.open('https://wa.me/?text=' + msg, '_blank');
      }
    },
    shareWhatsApp: function() {
      const msg = encodeURIComponent(`🗳️ *वार्ड 40 — नीतू मारोठिया*\n\nदोस्तों! अपना नाम चेक करें और 9 सितंबर को वोट जरूर दें।\n\nसुबह 7AM – शाम 6PM\n\n*नीतू मारोठिया* — आपके वार्ड की सेवा में।\n\n🔗 ${APP_URL}`);
      window.open('https://wa.me/?text=' + msg, '_blank');
    },
    copyLink: function() {
      navigator.clipboard.writeText(APP_URL).then(() => alert('✅ लिंक कॉपी हो गया!'));
    },
    shareSMS: function() {
      window.open('sms:?body=' + encodeURIComponent(`वार्ड 40 के दोस्तों! अपना नाम चेक करें:\n${APP_URL}\n9 सितंबर को वोट जरूर दें। नीतू मारोठिया को वोट दें।`), '_blank');
    },
    copyMessage: function() {
      navigator.clipboard.writeText($('share-msg').value).then(() => alert('✅ मैसेज कॉपी हो गया!'));
    }
  };

  // ===== INIT =====
  bindSearch('voter-search', 'search-results');
  bindSearch('search2-input', 'search2-results');
  renderHome();
  renderEducation();
  initVideo();
  renderShare();
  createParticles();
  initEvm();
  initInstall();
  initSplash();
  renderCountdown();
  startFlipClock();
})();
