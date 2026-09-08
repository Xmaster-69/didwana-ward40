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
  function scan(){document.querySelectorAll('button,.step-item,.share-card,.eci-link,.pledge-btn').forEach(function(el){if(!el.classList.contains('ripple-host'))addRipple(el);});}
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
  if(id==='poster-screen')initPosterCamera();
  if(id!=='poster-screen')stopPosterCamera();
}
document.querySelectorAll('.bottom-nav button').forEach(btn=>{
  btn.addEventListener('click',()=>showScreen(btn.dataset.nav));
});
$('detail-back').addEventListener('click',()=>showScreen(previousScreen,false));

/* ===== FLIP CLOCK ===== */
function renderCountdown(){
  const clock=$('flip-clock');if(!clock)return;
  const now=new Date(),ps=new Date(2026,8,9,CONFIG.pollStartHour,0,0),pe=new Date(2026,8,9,CONFIG.pollEndHour,0,0);
  if(now<ps){
    const d=ps-now,days=Math.floor(d/864e5),hrs=Math.floor(d%864e5/36e5),min=Math.floor(d%36e5/6e4),sec=Math.floor(d%6e4/1e3);
    clock.innerHTML=`<div class="flip-title">मतदान शुरू होने में</div><div class="flip-row">${fu(days,'दिन')}<span class="flip-colon">:</span>${fu(hrs,'घंटे')}<span class="flip-colon">:</span>${fu(min,'मिनट')}<span class="flip-colon">:</span>${fu(sec,'सेकंड')}</div>`;
  }else if(now>=ps&&now<=pe){
    clock.innerHTML='<div class="countdown-live">🔴 मतदान चल रहा है! अभी जाएं और वोट दें!</div>';
  }else{
    clock.innerHTML='<div class="countdown-ended">✅ मतदान समाप्त — धन्यवाद!</div>';
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

/* ===== REMINDER ===== */
function initReminder(){
  const btn=$('reminder-btn');if(!btn)return;
  if(Store.get('reminder',false)){btn.classList.add('set');btn.innerHTML='✅ याद दिलाया!';btn.style.pointerEvents='none';return;}
  btn.addEventListener('click',()=>{
    const d=new Date(2026,8,9,CONFIG.pollStartHour-1,0,0);if(d<=new Date())return;
    if('Notification' in window){Notification.requestPermission().then(p=>{if(p==='granted')new Notification('🗳️ मतदान याद दिलाएं',{body:'आज मतदान है! सुबह 7AM से वोट दें।',icon:'icons/icon-192.png',tag:'ward40-election'});});}
    Store.set('reminder',true);btn.classList.add('set');btn.innerHTML='✅ याद दिलाया!';
    if('calendar' in navigator){try{navigator.calendar.createEvent({title:'🗳️ वार्ड 40 मतदान — नीतू चौहान',location:CONFIG.boothFull,start:new Date(2026,8,9,7),end:new Date(2026,8,9,18)});}catch(e){}}
  });
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
      const q=input.value.trim().toLowerCase();
      if(q.length<2){results.innerHTML='';return;}
      const matches=VoterDB.search(q);
      if(!matches.length){results.innerHTML='<div class="empty-msg">कोई मतदाता नहीं मिला।<br>सही नाम या EPIC नंबर लिखें।</div>';return;}
      results.innerHTML=matches.slice(0,20).map(v=>`
        <div class="list-item" onclick="App.openVoter('${v._rid||v.epic}')">
          <div class="li-name">${v.name||'—'}</div>
          <div class="li-sub">${v.parent||'—'} · घर ${v.houseCanonical||v.house||'—'}</div>
          ${v.epic?`<div class="li-epic">EPIC: ${v.epic}</div>`:''}
        </div>`).join('');
    },250);
  });
}

/* ===== BOOTH CARD ===== */
function renderBoothCard(){
  const card=$('booth-card');if(!card)return;
  card.innerHTML=`<div class="booth-inner"><div class="booth-left"><div class="booth-icon">📍</div><div class="booth-info"><div class="booth-title">आपका बूथ — ${CONFIG.boothName}</div><div class="booth-addr">${CONFIG.boothAddress}</div><div class="booth-ward">वार्ड 40 · ${CONFIG.parishad}</div></div></div><a href="https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}" target="_blank" rel="noopener" class="booth-map-btn">🗺️ मैप में देखें</a></div>`;
}

/* ===== VOTING STEPS ===== */
function renderVotingSteps(){
  const steps=[
    {n:'1',icon:'🪪',t:'पहचान लेकर जाएं',d:'EPIC कार्ड या मान्य फोटो पहचान पत्र'},
    {n:'2',icon:'📍',t:'बूथ पर पहुंचें',d:`${CONFIG.boothName}, ${CONFIG.boothAddress} — सुबह 7 बजे से`},
    {n:'3',icon:'✅',t:'टोकन लें',d:'लाइन में लगें और टोकन प्राप्त करें'},
    {n:'4',icon:'🗳️',t:'वोट डालें',d:'ईवीएम पर कमल बटन दबाएं'},
    {n:'5',icon:'🤝',t:'जांच करें',d:'सफ़ेद स्याही की जांच करें और घर लौटें'}
  ];
  const el=$('voting-steps');if(!el)return;
  el.innerHTML=steps.map(s=>`<div class="step-item"><div class="step-num">${s.n}</div><div class="step-icon">${s.icon}</div><div class="step-text"><div class="step-title">${s.t}</div><div class="step-desc">${s.d}</div></div></div>`).join('');
}

/* ===== PLEDGE ===== */
function initPledge(){
  const btn=$('pledge-btn');if(!btn)return;
  const pledged=Store.get('pledged',false);
  updatePledgeUI(pledged);
  btn.addEventListener('click',()=>{
    const c=Store.get('pledged',false);
    if(!c){Store.set('pledged',true);Store.set('pledgeCount',(Store.get('pledgeCount',0))+1);updatePledgeUI(true);launchConfetti();}
    else{Store.set('pledged',false);Store.set('pledgeCount',Math.max(0,(Store.get('pledgeCount',1))-1));updatePledgeUI(false);}
  });
}
function updatePledgeUI(pledged){
  const btn=$('pledge-btn'),stats=$('pledge-stats');if(!btn||!stats)return;
  const count=Store.get('pledgeCount',47);
  if(pledged){btn.classList.add('pledged');btn.innerHTML='<span class="pledge-btn-icon">✅</span><span class="pledge-btn-text">वादा किया!</span>';}
  else{btn.classList.remove('pledged');btn.innerHTML='<span class="pledge-btn-icon">✋</span><span class="pledge-btn-text">वादा करें</span>';}
  stats.innerHTML=`<span class="pledge-count">${count}</span> लोगों ने वादा किया है`;
}

/* ===== HOME RENDER ===== */
function renderHome(){renderBoothCard();renderVotingSteps();}

/* ===== VOTER DETAIL ===== */
function openVoterDetail(recordId){
  const v=VoterDB.getVoter(recordId);if(!v)return;
  const detail=$('voter-detail');
  const voterCardMsg=encodeURIComponent(`🗳️ वोटर कार्ड — वार्ड 40\n\nनाम: ${v.name||'—'}\nपिता/पति: ${v.parent||'—'}\nEPIC: ${v.epic||'—'}\nघर नं.: ${v.houseCanonical||'—'}\nआयु: ${v.age!=null?v.age+' वर्ष':'—'}\n\n9 सितंबर 2026 · ${CONFIG.boothFull}\n🪷 नीतू चौहान — वार्ड 40\n\n🔗 ${APP_URL}`);
  detail.innerHTML=`
    <div class="detail-found"><div class="found-icon">✅</div><div class="found-title">आप वार्ड 40 के मतदाता हैं!</div></div>
    <div class="detail-card">
      <div class="detail-row"><span class="dl">नाम</span><span class="dv">${v.name||'—'}</span></div>
      <div class="detail-row"><span class="dl">पिता/पति</span><span class="dv">${v.parent||'—'}</span></div>
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

/* ===== EVM DEMO ===== */
function initEvm(){
  const btn=$('evm-btn'),screen=$('evm-screen');if(!btn||!screen)return;
  let voted=Store.get('evmVoted',false);
  if(voted){btn.classList.add('voted');screen.innerHTML='<div class="evm-voted-msg">✅ वोट दर्ज हो गया!</div>';}
  btn.addEventListener('click',()=>{
    if(Store.get('evmVoted',false))return;
    Store.set('evmVoted',true);voted=true;
    screen.innerHTML='<div class="evm-msg">वोट दर्ज हो रहा है...</div>';
    btn.style.pointerEvents='none';
    setTimeout(()=>{screen.innerHTML='<div class="evm-voted-msg">✅ वोट दर्ज हो गया!</div>';btn.classList.add('voted');},1500);
    launchConfetti();
  });
}

/* ===== SHARE ===== */
function renderShare(){
  const msg=`🗳️ *वार्ड 40 — नीतू चौहान*\n\nवार्ड 40 के सभी मतदाताओं से आग्रह — 9 सितंबर 2026 को मतदान अवश्य करें।\n\n📍 बूथ: ${CONFIG.boothFull}\n🕐 समय: सुबह 7AM – शाम 6PM\n\nवोटर लिस्ट में अपना नाम देखें: ${APP_URL}\n\n🪷 नीतू चौहान — आपके वार्ड की सेवा में।\n\n🔗 ${APP_URL}`;
  $('share-msg').value=msg;
  $('share-preview').innerHTML=`<div class="preview-msg"><div class="preview-title">मैसेज पूर्वावलोकन:</div><div class="preview-body">${msg.replace(/\n/g,'<br>')}</div></div>`;
}

/* ===== POSTER MAKER ===== */
let posterStream=null,posterBlob=null;

function initPosterCamera(){
  const video=$('poster-video'),captured=$('poster-captured'),hint=$('poster-cam-hint');
  const captureBtn=$('poster-capture-btn'),retakeBtn=$('poster-retake-btn');
  if(!video)return;

  // Reset state
  captured.classList.add('hidden');
  video.style.display='';
  captureBtn.classList.remove('hidden');
  retakeBtn.classList.add('hidden');
  hint.textContent='📷 अपनी इंक लगी उंगली या सेल्फ़ी लें';
  $('poster-result').classList.add('hidden');
  $('poster-generate-btn').disabled=true;

  // Pre-fill name from localStorage
  const savedName=Store.get('posterName','');
  const nameInput=$('poster-name-input');
  if(nameInput&&savedName)nameInput.value=savedName;

  // Start camera
  if(posterStream)return; // already running
  navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:640}}})
    .then(stream=>{posterStream=stream;video.srcObject=stream;})
    .catch(()=>{hint.textContent='⚠️ कैमरा उपलब्ध नहीं — कृपया अनुमति दें';});

  captureBtn.onclick=()=>capturePosterPhoto();
  retakeBtn.onclick=()=>retakePosterPhoto();
  $('poster-generate-btn').onclick=()=>generatePoster();
  $('poster-download-btn').onclick=()=>downloadPosterImage();
  $('poster-share-btn').onclick=()=>sharePosterImage();
  $('poster-retry-btn').onclick=()=>{posterBlob=null;$('poster-result').classList.add('hidden');retakePosterPhoto();};
  nameInput.oninput=()=>checkPosterReady();
}

function stopPosterCamera(){
  if(posterStream){posterStream.getTracks().forEach(t=>t.stop());posterStream=null;}
}

function capturePosterPhoto(){
  const video=$('poster-video'),captured=$('poster-captured'),canvas=$('poster-capture-canvas');
  const captureBtn=$('poster-capture-btn'),retakeBtn=$('poster-retake-btn'),hint=$('poster-cam-hint');
  canvas.width=video.videoWidth||640;canvas.height=video.videoHeight||640;
  const ctx=canvas.getContext('2d');
  ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,canvas.width,canvas.height);ctx.setTransform(1,0,0,1,0,0);
  captured.src=canvas.toDataURL('image/jpeg',0.92);
  captured.classList.remove('hidden');
  video.style.display='none';
  captureBtn.classList.add('hidden');
  retakeBtn.classList.remove('hidden');
  hint.textContent='✅ फ़ोटो ले ली! अब नाम लिखें और पोस्टर बनाएं';
  stopPosterCamera();
  checkPosterReady();
}

function retakePosterPhoto(){
  posterStream=null;
  $('poster-captured').classList.add('hidden');
  $('poster-video').style.display='';
  $('poster-capture-btn').classList.remove('hidden');
  $('poster-retake-btn').classList.add('hidden');
  $('poster-cam-hint').textContent='📷 अपनी इंक लगी उंगली या सेल्फ़ी लें';
  $('poster-result').classList.add('hidden');
  navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:640}}})
    .then(stream=>{posterStream=stream;$('poster-video').srcObject=stream;})
    .catch(()=>{});
  checkPosterReady();
}

function checkPosterReady(){
  const captured=$('poster-captured'),name=$('poster-name-input'),btn=$('poster-generate-btn');
  btn.disabled=!(captured&&!captured.classList.contains('hidden')&&name.value.trim().length>0);
}

function generatePoster(){
  const name=$('poster-name-input').value.trim();if(!name)return;
  Store.set('posterName',name);
  const captured=$('poster-captured');
  const img=new Image();img.crossOrigin='anonymous';
  img.onload=()=>drawPoster(img,name);
  img.src=captured.src;
}

function drawPoster(voterImg,voterName){
  const W=1080,H=1920;
  const canvas=$('poster-main-canvas');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');

  // 1. Background gradient
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'#4a148c');grad.addColorStop(0.5,'#7b1fa2');grad.addColorStop(1,'#e91e63');
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  // 2. Decorative circles
  ctx.globalAlpha=0.08;ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(200,300,250,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(880,1600,300,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;

  // 3. "मैंने वोट दिया!" title
  ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.font='bold 72px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('मैंने वोट दिया!',W/2,280);
  ctx.font='bold 80px sans-serif';
  ctx.fillText('🗳️',W/2,380);

  // 4. Divider
  ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(300,420);ctx.lineTo(780,420);ctx.stroke();

  // 5. Voter photo (circular)
  const cx=W/2,cy=700,cr=180;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.closePath();ctx.clip();
  const scale=Math.max(cr*2/voterImg.width,cr*2/voterImg.height);
  const sw=voterImg.width*scale,sh=voterImg.height*scale;
  ctx.drawImage(voterImg,cx-sw/2,cy-sh/2,sw,sh);
  ctx.restore();
  // Photo border
  ctx.strokeStyle='#fff';ctx.lineWidth=6;
  ctx.beginPath();ctx.arc(cx,cy,cr+3,0,Math.PI*2);ctx.stroke();

  // 6. Voter name
  ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.font='bold 56px "Noto Sans Devanagari", sans-serif';
  ctx.fillText(voterName,W/2,960);

  // 7. Ward info
  ctx.font='32px "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillText('वार्ड 40 · डीडवाना नगर पालिका',W/2,1020);

  // 8. Divider
  ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(250,1070);ctx.lineTo(830,1070);ctx.stroke();

  // 9. Call to action
  ctx.font='bold 44px "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle='#fdd835';
  ctx.fillText('आपकी बारी है!',W/2,1160);
  ctx.font='bold 36px "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle='#fff';
  ctx.fillText('9 सितंबर 2026 · सुबह 7AM – शाम 6PM',W/2,1220);

  // 10. Booth info
  ctx.font='28px "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.fillText('📍 नेहरू बाल स्कूल, लाडनू रोड, डीडवाना',W/2,1290);

  // 11. Candidate branding
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.fillRect(0,1380,W,200);
  ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.font='bold 40px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('🪷 नीतू चौहान',W/2,1470);
  ctx.font='28px "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillText('भारतीय जनता पार्टी (भाजपा) · वार्ड 40',W/2,1520);

  // 12. App watermark
  ctx.font='22px sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.fillText(APP_URL,W/2,1850);

  // Show result
  canvas.toBlob(blob=>{
    posterBlob=blob;
    const url=URL.createObjectURL(blob);
    $('poster-preview').src=url;
    $('poster-result').classList.remove('hidden');
    $('poster-result').scrollIntoView({behavior:'smooth'});
  },'image/jpeg',0.92);
}

function downloadPosterImage(){
  if(!posterBlob)return;
  const a=document.createElement('a');a.href=URL.createObjectURL(posterBlob);
  a.download='vote-poster-ward40.jpg';a.click();
}

function sharePosterImage(){
  if(!posterBlob)return;
  const file=new File([posterBlob],'vote-poster-ward40.jpg',{type:'image/jpeg'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:'मैंने वोट दिया! — वार्ड 40'}).catch(()=>{});
  }else{
    const a=document.createElement('a');a.href=URL.createObjectURL(posterBlob);
    a.download='vote-poster-ward40.jpg';a.click();
    setTimeout(()=>window.open('https://wa.me/?text='+encodeURIComponent('🗳️ मैंने वोट दिया! आप भी वोट दें — वार्ड 40 नीतू चौहान'),' _blank'),1000);
  }
}

/* ===== PWA INSTALL ===== */
let deferredPrompt=null;
function initInstall(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('install-banner').classList.remove('hidden');});
  $('install-btn').addEventListener('click',async()=>{
    if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('install-banner').classList.add('hidden');}
  });
}

/* ===== EXPOSED API ===== */
window.App={
  shareApp:function(){const m=encodeURIComponent(`🗳️ वार्ड 40 — नीतू चौहान\n\n📍 बूथ: ${CONFIG.boothFull}\n🕐 9 सितंबर 2026 · सुबह 7AM – शाम 6PM\n\nवोटर लिस्ट: ${APP_URL}`);if(navigator.share)navigator.share({title:'वार्ड 40 — नीतू चौहान',text:decodeURIComponent(m)}).catch(()=>{});else window.open('https://wa.me/?text='+m,'_blank');},
  shareWhatsApp:function(){window.open('https://wa.me/?text='+encodeURIComponent(`🗳️ *वार्ड 40 — नीतू चौहान*\n\n9 सितंबर 2026 को मतदान अवश्य करें।\n📍 बूथ: ${CONFIG.boothFull}\n🕐 सुबह 7AM – शाम 6PM\n\nवोटर लिस्ट: ${APP_URL}\n🪷 नीतू चौहान — आपकी सेवा में।`),'_blank');},
  shareVoterCard:function(m){const msg=decodeURIComponent(m);if(navigator.share)navigator.share({title:'वोटर कार्ड',text:msg}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');},
  copyLink:function(){navigator.clipboard.writeText(APP_URL).then(()=>alert('✅ लिंक कॉपी हो गया!'));},
  shareSMS:function(){window.open('sms:?body='+encodeURIComponent(`वार्ड 40 — नीतू चौहान\n📍 ${CONFIG.boothFull}\n🕐 9 सितंबर · 7AM–6PM\nवोटर लिस्ट: ${APP_URL}\n🪷 वोट जरूर दें!`),'_blank');},
  copyMessage:function(){navigator.clipboard.writeText($('share-msg').value).then(()=>alert('✅ मैसेज कॉपी हो गया!'));},
  openVoter:function(id){openVoterDetail(id);}
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
