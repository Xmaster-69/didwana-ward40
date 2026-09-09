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
let posterStream=null,posterBlob=null,posterFacing='user';

function startPosterCamera(){
  navigator.mediaDevices.getUserMedia({video:{facingMode:posterFacing,width:{ideal:1080},height:{ideal:1080}}})
    .then(stream=>{posterStream=stream;$('poster-video').srcObject=stream;})
    .catch(()=>{$('poster-cam-hint').textContent='\u26a0\ufe0f \u0915\u0948\u092e\u0930\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902';});
}
function switchPosterCamera(){
  stopPosterCamera();
  posterFacing=posterFacing==='user'?'environment':'user';
  $('poster-video').style.display='';
  $('poster-captured').classList.add('hidden');
  $('poster-capture-btn').classList.remove('hidden');
  $('poster-retake-btn').classList.add('hidden');
  $('poster-cam-hint').textContent=posterFacing==='user'?'📷 \u0938\u0947\u0932\u094d\u092b\u093c\u0940 \u0915\u0948\u092e\u0930\u093e':'📷 \u092a\u0939\u093e\u0921\u093c \u0915\u0948\u092e\u0930\u093e';
  startPosterCamera();
}
function initPosterCamera(){
  const video=$('poster-video'),captured=$('poster-captured'),hint=$('poster-cam-hint');
  const captureBtn=$('poster-capture-btn'),retakeBtn=$('poster-retake-btn');
  if(!video)return;
  captured.classList.add('hidden');
  video.style.display='';
  captureBtn.classList.remove('hidden');
  retakeBtn.classList.add('hidden');
  hint.textContent='📷 \u0905\u092a\u0928\u0940 \u0907\u0902\u0915 \u0932\u0917\u0940 \u0909\u0902\u0917\u0932\u0940 \u092f\u093e \u0938\u0947\u0932\u094d\u092b\u093c\u0940 \u0932\u0947\u0902';
  $('poster-result').classList.add('hidden');
  $('poster-generate-btn').disabled=true;
  const savedName=Store.get('posterName','');
  const nameInput=$('poster-name-input');
  if(nameInput&&savedName)nameInput.value=savedName;
  if(posterStream)return;
  startPosterCamera();
  captureBtn.onclick=()=>capturePosterPhoto();
  retakeBtn.onclick=()=>retakePosterPhoto();
  $('poster-switch-btn').onclick=()=>switchPosterCamera();
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
  canvas.width=video.videoWidth||1080;canvas.height=video.videoHeight||1080;
  const ctx=canvas.getContext('2d');
  if(posterFacing==='user'){ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,canvas.width,canvas.height);ctx.setTransform(1,0,0,1,0,0);}else{ctx.drawImage(video,0,0,canvas.width,canvas.height);}
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
  $('poster-cam-hint').textContent=posterFacing==='user'?'📷 \u0938\u0947\u0932\u094d\u092b\u093c\u0940 \u0915\u0948\u092e\u0930\u093e':'📷 \u092a\u0939\u093e\u0921\u093c \u0915\u0948\u092e\u0930\u093e';
  $('poster-result').classList.add('hidden');
  startPosterCamera();
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

  // === 1. RICH GRADIENT BACKGROUND ===
  const bg=ctx.createLinearGradient(0,0,W*0.3,H);
  bg.addColorStop(0,'#1a0533');bg.addColorStop(0.3,'#4a148c');bg.addColorStop(0.6,'#7b1fa2');bg.addColorStop(1,'#880e4f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // === 2. DECORATIVE TEXTURE PATTERN ===
  ctx.globalAlpha=0.04;ctx.strokeStyle='#fff';ctx.lineWidth=1;
  for(let i=-H;i<W+H;i+=60){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke();}
  ctx.globalAlpha=1;

  // === 3. DECORATIVE BORDER FRAME ===
  ctx.strokeStyle='rgba(255,193,7,0.5)';ctx.lineWidth=8;ctx.strokeRect(30,30,W-60,H-60);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.strokeRect(50,50,W-100,H-100);
  ctx.strokeStyle='rgba(255,193,7,0.12)';ctx.lineWidth=1;ctx.strokeRect(60,60,W-120,H-120);
  const drawCorner=(x,y,flip)=>{
    ctx.save();ctx.translate(x,y);ctx.scale(flip?1:-1,1);
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(25,0,25,25);ctx.strokeStyle='rgba(255,193,7,0.6)';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(12,12,4,0,Math.PI*2);ctx.fillStyle='rgba(255,193,7,0.7)';ctx.fill();
    ctx.restore();
  };
  drawCorner(70,70,false);drawCorner(W-70,70,true);drawCorner(70,H-70,false);drawCorner(W-70,H-70,true);

  // === 4. DECORATIVE BANDS ===
  const topBand=ctx.createLinearGradient(0,80,W,80);
  topBand.addColorStop(0,'rgba(255,193,7,0)');topBand.addColorStop(0.3,'rgba(255,193,7,0.15)');topBand.addColorStop(0.7,'rgba(255,193,7,0.15)');topBand.addColorStop(1,'rgba(255,193,7,0)');
  ctx.fillStyle=topBand;ctx.fillRect(70,80,W-140,3);

  // === 5. CAMPAIGN BADGE ===
  const bx=W/2,by=140;
  ctx.beginPath();ctx.ellipse(bx,by,200,38,0,0,Math.PI*2);
  ctx.fillStyle='rgba(255,193,7,0.9)';ctx.fill();
  ctx.fillStyle='#1a0533';ctx.font='bold 22px "Noto Sans Devanagari", sans-serif';ctx.textAlign='center';
  ctx.fillText('❗ मतदान मुहिम 2026 · वार्ड 40',bx,by+7);

  // === 6. TITLE WITH DEPTH GLOW ===
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,193,7,0.3)';ctx.font='bold 80px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('मैंने वोट दिया!',W/2+2,282);
  ctx.shadowColor='rgba(255,193,7,0.5)';ctx.shadowBlur=30;
  ctx.fillStyle='#ffeb3b';ctx.fillText('मैंने वोट दिया!',W/2,280);
  ctx.shadowBlur=0;

  drawLotus(ctx,W/2,370,60);
  drawDivider(ctx,W/2,430,400,'rgba(255,193,7,0.5)');

  // === 7. VOTER PHOTO - LARGER 240px PREMIUM FRAME ===
  const cx=W/2,cy=720,cr=240;

  // Warm radial glow
  const warmGlow=ctx.createRadialGradient(cx,cy,cr*0.3,cx,cy,cr+80);
  warmGlow.addColorStop(0,'rgba(255,193,7,0.10)');warmGlow.addColorStop(0.6,'rgba(255,193,7,0.04)');warmGlow.addColorStop(1,'rgba(255,193,7,0)');
  ctx.fillStyle=warmGlow;ctx.fillRect(cx-cr-80,cy-cr-80,(cr+80)*2,(cr+80)*2);

  // Outer glow rings (5)
  for(let r=5;r>=1;r--){
    ctx.beginPath();ctx.arc(cx,cy,cr+22+r*9,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,193,7,${0.06*r+0.02})`;ctx.lineWidth=2;ctx.stroke();
  }

  // Photo clip
  ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.closePath();ctx.clip();
  const scale=Math.max(cr*2/voterImg.width,cr*2/voterImg.height);
  const sw=voterImg.width*scale,sh=voterImg.height*scale;
  ctx.drawImage(voterImg,cx-sw/2,cy-sh/2,sw,sh);
  const vig=ctx.createRadialGradient(cx,cy,cr*0.5,cx,cy,cr);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.3)');
  ctx.fillStyle=vig;ctx.fillRect(cx-cr,cy-cr,cr*2,cr*2);
  ctx.restore();

  // Inner white glow ring
  ctx.beginPath();ctx.arc(cx,cy,cr-2,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.stroke();

  // Gold ring border (thicker)
  ctx.beginPath();ctx.arc(cx,cy,cr+4,0,Math.PI*2);
  ctx.strokeStyle='#ffc107';ctx.lineWidth=6;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,cr+12,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,cr+18,0,Math.PI*2);
  ctx.strokeStyle='rgba(100,180,255,0.15)';ctx.lineWidth=1.5;ctx.stroke();

  // Gold sparkle dots
  [0.3,0.9,1.5,2.1,2.8,3.6,4.4,5.2].forEach(a=>{
    const sx=cx+Math.cos(a)*(cr+35+Math.sin(a*3)*12);
    const sy=cy+Math.sin(a)*(cr+35+Math.cos(a*2)*12);
    ctx.beginPath();ctx.arc(sx,sy,2.5+Math.random()*1.5,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,193,7,${0.35+Math.random()*0.3})`;ctx.fill();
  });

  // Verified badge (larger)
  const bx2=cx+cr-20,by2=cy+cr-20;
  ctx.beginPath();ctx.arc(bx2,by2,32,0,Math.PI*2);ctx.fillStyle='#4caf50';ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';
  ctx.fillText('✓',bx2,by2+12);

  // === 8. VOTER NAME + GOLD UNDERLINE ===
  ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,0.3)';ctx.shadowBlur=10;
  ctx.fillStyle='#fff';ctx.font='bold 58px "Noto Sans Devanagari", sans-serif';
  ctx.fillText(voterName,W/2,1000);
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,193,7,0.4)';
  ctx.fillRect(W/2-100,1015,200,3);

  // === 9. WARD INFO ===
  ctx.font='30px "Noto Sans Devanagari", sans-serif';ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillText('वार्ड 40 · डीडवाना नगर पालिका',W/2,1060);

  // === 10. GOLD DIVIDER ===
  drawDivider(ctx,W/2,1100,360,'rgba(255,193,7,0.4)');

  // === 11. CALL TO ACTION ===
  ctx.shadowColor='rgba(255,193,7,0.4)';ctx.shadowBlur=25;
  ctx.fillStyle='#ffc107';ctx.font='bold 50px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('आपकी बारी है!',W/2,1170);
  ctx.shadowBlur=0;
  ctx.fillStyle='#fff';ctx.font='bold 34px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('9 सितंबर 2026 · सुबह 7AM – शाम 6PM',W/2,1225);

  // === 12. BOOTH INFO ===
  ctx.font='26px "Noto Sans Devanagari", sans-serif';ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.fillText('📍 नेहरू बाल स्कूल, लाडनू रोड, डीडवाना',W/2,1290);

  // === 13. CANDIDATE BRANDING ===
  const panelGrad=ctx.createLinearGradient(0,1390,0,H-60);
  panelGrad.addColorStop(0,'rgba(0,0,0,0)');panelGrad.addColorStop(0.15,'rgba(0,0,0,0.25)');panelGrad.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=panelGrad;ctx.fillRect(0,1390,W,H-1450);

  drawLotus(ctx,W/2,1450,45);
  ctx.fillStyle='#fff';ctx.font='bold 44px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('नीतू चौहान',W/2,1520);
  ctx.font='26px "Noto Sans Devanagari", sans-serif';ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.fillText('भारतीय जनता पार्टी (भाजपा) · कमल 🌷',W/2,1570);
  drawDivider(ctx,W/2,1610,300,'rgba(255,193,7,0.3)');

  // === 14. WATERMARK ===
  ctx.font='18px sans-serif';ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillText(APP_URL,W/2,H-80);

  // === SHOW RESULT ===
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
  shareWhatsApp:function(){window.open('https://wa.me/?text='+encodeURIComponent(`🗳️ *वार्ड 40 — नीतू चौहान*\n\n9 सितंबर 2026 को मतदान अवश्य करें।\n📍 बूथ: ${CONFIG.boothFull}\n🕐 सुबह 7AM – शाम 6PM\n\nवोटर लिस्ट: ${APP_URL}\n🪷 नीतू चौहान — आपकी सेवा में।`),'_blank');},
  shareVoterCard:function(m){const msg=decodeURIComponent(m);if(navigator.share)navigator.share({title:'वोटर कार्ड',text:msg}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');},
  copyLink:function(){navigator.clipboard.writeText(APP_URL).then(()=>alert('✅ लिंक कॉपी हो गया!'));},
  shareSMS:function(){window.open('sms:?body='+encodeURIComponent(`वार्ड 40 — नीतू चौहान\n📍 ${CONFIG.boothFull}\n🕐 9 सितंबर · 7AM–6PM\nवोटर लिस्ट: ${APP_URL}\n🪷 वोट जरूर दें!`),'_blank');},
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
