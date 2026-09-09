/* ===== Material Ripple ===== */
(function(){
  function addRipple(el){
    el.classList.add('ripple-host');
    el.addEventListener('pointerdown', function(e){
      var r=el.getBoundingClientRect(),x=((e.clientX-r.left)/r.width*100).toFixed(0),y=((e.clientY-r.top)/r.height*100).toFixed(0);
      el.style.setProperty('--ripple-x',x+'%');el.style.setProperty('--ripple-y',y+'%');
      el.classList.remove('rippling');void el.offsetWidth;el.classList.add('rippling');
    });
    el.addEventListener('animationend',function(){el.classList.remove('rippling');});
  }
  function scan(){document.querySelectorAll('button,.share-card,.eci-link').forEach(function(el){if(!el.classList.contains('ripple-host'))addRipple(el);});}
  document.addEventListener('DOMContentLoaded',scan);
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();

(function(){
const $=id=>document.getElementById(id);
let previousScreen='home-screen',flipTimer=null;
const APP_URL='https://xmaster-69.github.io/didwana-ward40/';
const MAP_QUERY=encodeURIComponent(CONFIG.boothFull+', '+CONFIG.area);

/* ===== NAVIGATION ===== */
function showScreen(id,pushPrev){
  const prev=document.querySelector('.screen.active');
  if(pushPrev!==false&&prev)previousScreen=prev.id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===id));
  window.scrollTo(0,0);
  if(id==='home-screen'){renderHome();startFlipClock();}
  if(id==='share-screen')renderShare();
  
  
}
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.addEventListener('click',()=>showScreen(btn.dataset.nav));
});
$('detail-back').addEventListener('click',()=>showScreen(previousScreen,false));

/* ===== FLIP CLOCK ===== */
function renderCountdown(){
  const clock=$('flip-clock');if(!clock)return;
  const now=new Date(),resultsDate=new Date(2026,8,14,12,0,0);
  if(now<resultsDate){
    const d=resultsDate-now,days=Math.floor(d/864e5),hrs=Math.floor(d%864e5/36e5),min=Math.floor(d%36e5/6e4),sec=Math.floor(d%6e4/1e3);
    clock.innerHTML=`<div class="flip-title">📊 परिणाम आने में</div><div class="flip-row">${fu(days,'दिन')}<span class="flip-colon">:</span>${fu(hrs,'घंटे')}<span class="flip-colon">:</span>${fu(min,'मिनट')}<span class="flip-colon">:</span>${fu(sec,'सेकंड')}</div>`;
  }else{
    clock.innerHTML='<div class="countdown-live">🎉 परिणाम आ गए! धन्यवाद!</div>';
  }
}
function fu(v,l){const s=String(v).padStart(2,'0');return`<div class="flip-unit"><div class="flip-card"><div class="flip-face top">${s}</div><div class="flip-face bottom">${s}</div></div><div class="flip-label">${l}</div></div>`;}
function startFlipClock(){if(flipTimer)clearInterval(flipTimer);renderCountdown();flipTimer=setInterval(()=>{const h=$('home-screen');if(h&&h.classList.contains('active'))renderCountdown();},1000);}

/* ===== PARTICLES ===== */
function createParticles(){
  const c=$('hero-particles');if(!c)return;
  const emojis=['🗳️','✨','💜','🌸','⭐','🪷'];
  let h='';for(let i=0;i<10;i++){const l=Math.floor(Math.random()*90)+5,d=(Math.random()*5).toFixed(1),dur=(Math.random()*4+5).toFixed(1);h+=`<span class="particle" style="left:${l}%;animation-delay:${d}s;animation-duration:${dur}s">${emojis[i%emojis.length]}</span>`;}
  c.innerHTML=h;
}

/* ===== CONFETTI ===== */
function launchConfetti(){
  const c=document.createElement('div');c.style.cssText='position:fixed;inset:0;z-index:9999;pointer-events:none;';
  document.body.appendChild(c);
  const emojis=['🗳️','✨','🎉','🪷','💜'];
  for(let i=0;i<30;i++){
    const s=document.createElement('span');s.textContent=emojis[i%emojis.length];
    s.style.cssText=`position:absolute;font-size:${16+Math.random()*20}px;left:${Math.random()*100}%;top:-20px;animation:floatDown ${3+Math.random()*3}s linear forwards;animation-delay:${Math.random()*0.5}s;`;
    c.appendChild(s);
  }
  setTimeout(()=>c.remove(),6000);
}

/* ===== VOTER SEARCH ===== */
let searchTimeout=null;
function bindSearch(inputId,resultId){
  const input=$(inputId),results=$(resultId);if(!input||!results)return;
  input.addEventListener('input',()=>{
    clearTimeout(searchTimeout);
    searchTimeout=setTimeout(()=>{
      const q=input.value.trim();
      if(q.length<2){results.innerHTML='';return;}
      const ql=q.toLowerCase();
      const matches=VoterDB.search(q);
      const enMatches=VoterDB.searchEnglish(q);
      // Deduplicate by EPIC
      const seen=new Set();
      const merged=[];
      matches.forEach(v=>{const k=v.epic||'_h'+v.recordId;if(!seen.has(k)){seen.add(k);merged.push(v);}});
      enMatches.forEach(v=>{const k=v.epic||'_e'+v.name;if(!seen.has(k)){seen.add(k);merged.push(v);}});
      if(!merged.length){results.innerHTML='<div class="empty-msg">कोई मतदाता नहीं मिला।<br>सही नाम, EPIC या क्रम संख्या लिखें।</div>';return;}
      results.innerHTML=merged.slice(0,30).map(v=>{
        const isEn=v.source==='en';
        const recId=v.recordId||'en_'+(v.epic||v.name);
        if(isEn){
          return `<div class="list-item" onclick="App.openEnVoter('${v.epic||''}')">
            <div class="li-kram">क्रम संख्या: ${v.kramSankhya||'—'}</div>
            <div class="li-name">${v.name||'—'}</div>
            <div class="li-sub">${v.parent||'—'} · ${v.age?v.age+' वर्ष':''} ${v.family?' · '+v.family:''}</div>
            <div class="li-epic">EPIC: ${v.epic||'—'}</div>
          </div>`;
        }
        const enName=(v.nameEn||'');
        return `<div class="list-item" onclick="App.openVoter('${v.recordId}')">
          <div class="li-kram">क्रम संख्या: ${v.kramSankhya||v.recordId||'—'}</div>
          <div class="li-name">${v.name||'—'}${enName?' <span class="li-name-en">('+enName+')</span>':''}</div>
          <div class="li-sub">${v.parent||'—'} · घर ${v.houseCanonical||v.house||'—'}</div>
          ${v.epic?`<div class="li-epic">EPIC: ${v.epic}</div>`:''}
        </div>`;
      }).join('');
    },250);
  });
}

/* ===== BOOTH CARD ===== */
function renderBoothCard(){
  const card=$('booth-card');if(!card)return;
  card.innerHTML=`<div class="booth-inner"><div class="booth-left"><div class="booth-icon">📍</div><div class="booth-info"><div class="booth-title">आपका बूथ — ${CONFIG.boothName}</div><div class="booth-addr">${CONFIG.boothAddress}</div><div class="booth-ward">वार्ड 40 · ${CONFIG.parishad}</div></div></div><a href="https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}" target="_blank" rel="noopener" class="booth-map-btn">🗺️ मैप में देखें</a></div>`;
}

/* ===== HOME RENDER ===== */
function renderHome(){renderBoothCard();}

/* ===== VOTER DETAIL ===== */
function openVoterDetail(recordId){
  const v=VoterDB.getVoter(recordId);if(!v)return;
  const detail=$('voter-detail');
  const voterCardMsg=encodeURIComponent(`🗳️ वोटर कार्ड — वार्ड 40\n\nक्रम संख्या: ${v.recordId||'—'}\nनाम: ${v.name||'—'}\nपिता/पति: ${v.parent||'—'}\nEPIC: ${v.epic||'—'}\nघर नं.: ${v.houseCanonical||'—'}\nआयु: ${v.age!=null?v.age+' वर्ष':'—'}\n\n9 सितंबर 2026 · ${CONFIG.boothFull}\n🪷 नीतू चौहान — वार्ड 40\n\n🔗 ${APP_URL}`);
  detail.innerHTML=`
    <div class="detail-found"><div class="found-icon">✅</div><div class="found-title">आप वार्ड 40 के मतदाता हैं!</div></div>
    <div class="detail-card">
      <div class="detail-row"><span class="dl">क्रम संख्या</span><span class="dv">${v.recordId||'—'}</span></div>
      <div class="detail-row"><span class="dl">नाम</span><span class="dv">${v.name||'—'}${v.nameEn?' <small>('+v.nameEn+')</small>':''}</span></div>
      <div class="detail-row"><span class="dl">पिता/पति</span><span class="dv">${v.parent||'—'}${v.fatherEn?' <small>('+v.fatherEn+')</small>':''}</span></div>
      <div class="detail-row"><span class="dl">EPIC नंबर</span><span class="dv">${v.epic||'—'}</span></div>
      <div class="detail-row"><span class="dl">घर नं.</span><span class="dv">${v.houseCanonical||'—'}</span></div>
      <div class="detail-row"><span class="dl">आयु</span><span class="dv">${v.age!=null?v.age+' वर्ष':'—'}</span></div>
    </div>
    <div class="detail-card voting-call"><div class="call-icon">🗳️</div><div class="call-text"><strong>9 सितंबर 2026 को वोट दें</strong><p>${CONFIG.boothFull}</p></div></div>
    <div class="detail-card detail-actions">
      <button class="cta-btn" onclick="App.shareVoterCard('${voterCardMsg}')">🗳️ वोटर कार्ड शेयर करें</button>
      <button class="cta-btn secondary-cta" onclick="App.shareApp()">📲 ऐप शेयर करें</button>
    </div>`;
  showScreen('voter-detail-screen');
}

/* ===== SHARE ===== */
function renderShare(){
  const msg=`\ud83e\udeb7 *\u0935\u093e\u0930\u094d\u0921 40 \u2014 \u0928\u0940\u0924\u0942 \u091a\u094c\u0939\u093e\u0928*\n\n\u092e\u0924\u0926\u093e\u0928 \u0938\u0902\u092a\u0928\u094d\u0928! \u0905\u092c \u092a\u0930\u093f\u0923\u093e\u092e \u0915\u093e \u0907\u0902\u0924\u091c\u093c\u093e\u0930 \u2014 14 \u0938\u093f\u0924\u0902\u092c\u0930 2026\u0964\n\n\ud83d\udcca \u092a\u0930\u093f\u0923\u093e\u092e: 14 \u0938\u093f\u0924\u0902\u092c\u0930 2026\n\ud83d\udccd \u092c\u0942\u0925: ${CONFIG.boothFull}\n\n\u090f\u092a ${APP_URL} \u092a\u0930 \u092a\u0930\u093f\u0923\u093e\u092e \u0926\u0947\u0916\u0947\u0902\n\n\ud83e\udeb7 \u0928\u0940\u0924\u0942 \u091a\u094c\u0939\u093e\u0928 \u2014 \u0935\u093e\u0930\u094d\u0921 40 \u00b7 \u0921\u0940\u0921\u0935\u093e\u0928\u093e\n\n\ud83e\udd70 \u0906\u092a \u0938\u092d\u0940 \u0915\u093e \u0938\u0939\u092f\u094b\u0917 \u0905\u092e\u0942\u0932\u094d\u092f \u0939\u0948\u0964`;
  $('share-msg').value=msg;
  $('share-preview').innerHTML=`<div class="preview-msg"><div class="preview-title">\u092e\u0948\u0938\u0947\u091c \u092a\u0942\u0930\u094d\u0935\u093e\u0935\u0932\u094b\u0915\u0928:</div><div class="preview-body">${msg.replace(/\n/g,'<br>')}</div></div>`;
}

/* ===== PWA INSTALL ===== */
let deferredPrompt=null;
function initInstall(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('install-banner').classList.remove('hidden');});
  $('install-btn').addEventListener('click',async()=>{
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('install-banner').classList.add('hidden');}
  });
}

function openEnVoter(epic){
  if(!window.EN_VOTERS)return;
  const v=window.EN_VOTERS.find(x=>x.e===epic);
  if(!v)return;
  const detail=$('voter-detail');
  detail.innerHTML=`
    <div class="detail-found"><div class="found-icon">✅</div><div class="found-title">मतदाता विवरण मिला!</div></div>
    <div class="detail-card">
      <div class="detail-row"><span class="dl">क्रम संख्या</span><span class="dv">${v.k||'—'}</span></div>
      <div class="detail-row"><span class="dl">नाम (English)</span><span class="dv">${v.n||'—'}</span></div>
      <div class="detail-row"><span class="dl">पिता/पति</span><span class="dv">${v.f||'—'}</span></div>
      <div class="detail-row"><span class="dl">EPIC नंबर</span><span class="dv">${v.e||'—'}</span></div>
      <div class="detail-row"><span class="dl">आयु</span><span class="dv">${v.a!=null?v.a+' वर्ष':'—'}</span></div>
      ${v.c?`<div class="detail-row"><span class="dl">समुदाय</span><span class="dv">${v.c}</span></div>`:''}
    </div>
    <div class="detail-card voting-call"><div class="call-icon">🗳️</div><div class="call-text"><strong>9 सितंबर 2026 को वोट दें</strong><p>${CONFIG.boothFull}</p></div></div>
    <div class="detail-card detail-actions">
      <button class="cta-btn" onclick="App.shareApp()">📲 ऐप शेयर करें</button>
    </div>`;
  showScreen('voter-detail-screen');
}

/* ===== EXPOSED API ===== */
window.App={
  shareApp:function(){const m=encodeURIComponent(`🗳️ वार्ड 40 — नीतू चौहान\n\n📍 बूथ: ${CONFIG.boothFull}\n🕐 9 सितंबर 2026 · सुबह 7AM – शाम 6PM\n\nवोटर लिस्ट: ${APP_URL}`);if(navigator.share)navigator.share({title:'वार्ड 40 — नीतू चौहान',text:decodeURIComponent(m)}).catch(()=>{});else window.open('https://wa.me/?text='+m,'_blank');},
  shareWhatsApp:function(){window.open('https://wa.me/?text='+encodeURIComponent(`🪷 *वार्ड 40 — नीतू चौहान*\n\nमतदान संपन्न! परिणाम 14 सितंबर।\n📍 बूथ: ${CONFIG.boothFull}\n\nऐप: ${APP_URL}\n🙏 धन्यवाद!`),'_blank');},
  shareVoterCard:function(m){const msg=decodeURIComponent(m);if(navigator.share)navigator.share({title:'वोटर कार्ड',text:msg}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');},
  copyLink:function(){navigator.clipboard.writeText(APP_URL).then(()=>alert('✅ लिंक कॉपी हो गया!'));},
  shareSMS:function(){window.open('sms:?body='+encodeURIComponent(`🪷 वार्ड 40 — नीतू चौहान\nपरिणाम 14 सितंबर\n📍 ${CONFIG.boothFull}\nऐप: ${APP_URL}`),'_blank');},
  copyMessage:function(){navigator.clipboard.writeText($('share-msg').value).then(()=>alert('✅ मैसेज कॉपी हो गया!'));},
  openVoter:function(id){openVoterDetail(id);},openEnVoter:function(epic){openEnVoter(epic);}
};

/* ===== INIT ===== */
bindSearch('voter-search','search-results');
renderHome();
renderShare();
createParticles();
initEvm();
initInstall();
initPledge();
initReminder();
startFlipClock();
VoterDB.load().then(()=>renderHome()).catch(()=>{});
})();
