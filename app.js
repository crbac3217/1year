'use strict';
const KEY = 'anniv-state';
const app = document.getElementById('app');
const $ = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// 힌트 저장 키: 스테이지 id+제목. 스토리를 개편해도 예전 힌트 기록이 엉뚱한 스테이지에 붙지 않게 함
const hk = st => st.id + ':' + st.title;

/* ---------- 상태 ---------- */
let state = { i: 0, hints: {} };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

/* ---------- 해시 ---------- */
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s.trim().toLowerCase()));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* ---------- 화면 전환 / 타자기 ---------- */
let cleanup = null; // 스테이지 떠날 때 정리(카메라, 센서 등)
let typeToken = 0;

async function swap(build) {
  app.classList.remove('show');
  await sleep(450);
  if (cleanup) { cleanup(); cleanup = null; }
  app.innerHTML = '';
  window.scrollTo(0, 0);
  await build();
  app.classList.add('show');
}

async function typeText(el, text, onDone) {
  const my = ++typeToken;
  el.classList.add('typing');
  let skip = false;
  el.onclick = () => { skip = true; };
  for (let k = 1; k <= text.length; k++) {
    if (skip || my !== typeToken) break;
    el.textContent = text.slice(0, k);
    await sleep(35);
  }
  el.textContent = text;
  el.classList.remove('typing');
  if (my === typeToken) onDone();
}

/* ---------- 스테이지 렌더 ---------- */
function show(i) {
  state.i = Math.max(0, Math.min(i, STAGES.length - 1));
  save();
  if (state.done && state.i >= STAGES.length - 1) return interstitial(STAGES[state.i], false);
  const st = STAGES[state.i];
  document.body.dataset.theme = st.theme || 'dark';
  const tc = document.querySelector('meta[name=theme-color]');
  if (tc) tc.content = st.theme === 'warm' ? '#2a1710' : '#0b0f14';

  swap(() => {
    viewIndex = state.i; updateNav(state.i);
    app.append($('div', 'step', `STAGE ${String(st.id).padStart(2, '0')} / ${STAGES.length}`), $('h1', '', st.title));
    const story = $('div', 'story');
    const body = $('div', 'body');
    app.append(story, body);
    if (st.image) body.append(photo(st.image));
    buildBody(st, body);
    typeText(story, st.story, () => body.classList.add('show'));
  });
}

/* ---------- 하단 네비 / 지난 스테이지 다시 보기 ---------- */
const navEl = document.getElementById('nav');
const navPrev = document.getElementById('nav-prev');
const navNext = document.getElementById('nav-next');
const navMid = document.getElementById('nav-mid');

function updateNav(view) {
  const reviewing = view < state.i;
  navPrev.disabled = view <= 0;
  navNext.disabled = !reviewing;
  navMid.textContent = reviewing ? `기록 ${view + 1}/${STAGES.length} · 현재로` : `${view + 1}/${STAGES.length}`;
  navMid.disabled = !reviewing;
}
navPrev.onclick = () => goView(viewIndex - 1);
navNext.onclick = () => goView(viewIndex + 1);
navMid.onclick = () => goView(state.i);
let viewIndex = 0;

function goView(idx) {
  idx = Math.max(0, idx);
  if (idx >= state.i) return show(state.i);
  viewIndex = idx;
  const st = STAGES[idx];
  document.body.dataset.theme = st.theme || 'dark';
  typeToken++; // 진행 중인 타자기 중단
  swap(() => {
    updateNav(idx);
    app.append($('div', 'step', `기록 · STAGE ${String(st.id).padStart(2, '0')}`), $('h1', '', st.title));
    app.append($('div', 'story', st.story));
    if (st.image) app.append(photo(st.image));
    const n = state.hints[hk(st)] || 0;
    if (st.hints && n) {
      const box = $('div', 'hints');
      st.hints.slice(0, n).forEach((h, k) => box.append($('div', 'hint', `💡 ${k + 1}. ${h}`)));
      app.append(box);
    }
    if (st.nextStory || st.nextImage) {
      const sec = $('div', 'recap');
      sec.append($('div', 'step', '클리어 후 지령'));
      if (st.nextStory) sec.append($('div', 'story', st.nextStory));
      if (st.nextImage) sec.append(photo(st.nextImage));
      app.append(sec);
    }
  });
}

function photo(src, thumb) {
  const img = $('img', 'photo' + (thumb ? ' thumb' : ''));
  img.src = src; img.alt = '';
  if (thumb) img.onclick = () => { // 탭하면 크게 보기
    const lb = $('div'); lb.id = 'lb';
    const big = $('img'); big.src = src;
    lb.append(big); lb.onclick = () => lb.remove();
    document.body.append(lb);
  };
  return img;
}

function nextBtn(label, fn) {
  const b = $('button', '', label);
  b.onclick = fn;
  return b;
}

// 클리어 후 지령/사진 화면. 마지막 스테이지면 버튼 없이 끝(따뜻한 톤)
function interstitial(st, withBtn) {
  swap(() => {
    document.body.dataset.theme = withBtn ? (STAGES[state.i].theme || 'dark') : 'warm';
    viewIndex = state.i; updateNav(state.i);
    const story = $('div', 'story');
    const body = $('div', 'body');
    app.append($('div', 'step', withBtn ? 'MISSION UPDATE' : 'MISSION COMPLETE'), $('h1', '', '✔ 통과'), story, body);
    if (st.nextImage) body.append(photo(st.nextImage));
    if (withBtn) body.append(nextBtn('다음', () => show(state.i)));
    typeText(story, st.nextStory || '', () => body.classList.add('show'));
  });
}

function complete() {
  const st = STAGES[state.i];
  if (state.i >= STAGES.length - 1) { state.done = true; save(); return interstitial(st, false); }
  state.i++; save();
  if (!st.nextStory && !st.nextImage) return show(state.i);
  interstitial(st, true);
}

function buildBody(st, body) {
  if (st.type === 'info-only') {
    if (state.i < STAGES.length - 1) body.append(nextBtn('다음', complete));
    return;
  }
  if (st.type === 'text-input' || st.type === 'multi-input') buildInputs(st, body);
  if (st.type === 'qr-scan') buildScan(st, body);
  if (st.type === 'gps') buildGps(st, body);
  if (st.type === 'ar') buildAr(st, body);
  buildHints(st, body);
}

/* ---------- 힌트 ---------- */
function buildHints(st, body) {
  if (!st.hints || !st.hints.length) return;
  const box = $('div', 'hints');
  const btn = $('button', 'ghost');
  const render = () => {
    const n = state.hints[hk(st)] || 0;
    box.innerHTML = '';
    st.hints.slice(0, n).forEach((h, k) => box.append($('div', 'hint', `💡 ${k + 1}. ${h}`)));
    btn.textContent = n >= st.hints.length ? '힌트를 모두 열었어요' : `💡 힌트 보기 (${n}/${st.hints.length})`;
    btn.disabled = n >= st.hints.length;
  };
  btn.onclick = () => { state.hints[hk(st)] = (state.hints[hk(st)] || 0) + 1; save(); render(); };
  render();
  body.append(btn, box);
}

/* ---------- 입력 퍼즐 ---------- */
// 숫자가 돌아가는 자물쇠 UI. ▲▼ 버튼 또는 숫자를 위아래로 드래그
function makeDial(n, colors) {
  const wrap = $('div', 'dial');
  const vals = Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    const col = $('div', 'wheel' + (colors && colors[k] ? ' ' + colors[k] : ''));
    const up = $('button', '', '▲'), dn = $('button', '', '▼'), num = $('div', 'digit', '0');
    const set = d => { vals[k] = (vals[k] + d + 10) % 10; num.textContent = vals[k]; };
    up.onclick = () => set(1);
    dn.onclick = () => set(-1);
    let y = null;
    num.onpointerdown = e => { y = e.clientY; num.setPointerCapture(e.pointerId); };
    num.onpointermove = e => {
      if (y == null) return;
      if (Math.abs(e.clientY - y) >= 24) { set(e.clientY < y ? 1 : -1); y = e.clientY; }
    };
    num.onpointerup = num.onpointercancel = () => { y = null; };
    col.append(up, num, dn);
    wrap.append(col);
  }
  wrap.value = () => vals.join('');
  return wrap;
}

function buildInputs(st, body) {
  const fields = st.type === 'multi-input' ? st.fields
    : [{ label: '', answerHash: st.answerHash, placeholder: st.placeholder, dial: st.dial, dialColors: st.dialColors, uppercase: st.uppercase }];
  const inputs = [];
  let host = body;
  if (st.row) { host = $('div', 'row'); body.append(host); }
  const getters = fields.map(f => {
    const cell = st.row ? $('div', 'cell') : body;
    if (st.row) host.append(cell);
    if (f.image) cell.append(photo(f.image, true));
    if (f.label) cell.append($('label', f.dial ? 'dial-label' : '', f.label));
    if (f.dial) {
      const d = makeDial(f.dial, f.dialColors);
      cell.append(d);
      return () => d.value();
    }
    const inp = $('input');
    inp.placeholder = f.placeholder || st.placeholder || '정답 입력';
    inp.autocomplete = 'off'; inp.autocapitalize = f.uppercase ? 'characters' : 'off'; inp.spellcheck = false;
    if (f.uppercase) inp.style.textTransform = 'uppercase';
    if (f.numeric) { inp.inputMode = 'numeric'; inp.pattern = '[0-9]*'; }
    if (f.color) inp.classList.add('c-' + f.color);
    cell.append(inp);
    inputs.push(inp);
    return () => inp.value;
  });
  const msg = $('div', 'msg');
  const go = $('button', '', '확인');
  body.append(go, msg);

  const check = async () => {
    if (!(window.crypto && crypto.subtle)) { msg.textContent = 'HTTPS 또는 localhost 에서 열어주세요.'; return; }
    go.disabled = true;
    let ok = true;
    for (let k = 0; k < fields.length; k++) {
      if ((await sha(getters[k]())) !== fields[k].answerHash) ok = false;
    }
    go.disabled = false;
    if (ok) {
      msg.className = 'msg ok'; msg.textContent = '맞았어요!';
      go.disabled = true;
      await sleep(600);
      complete();
    } else {
      msg.textContent = st.failMsg || '음… 아직 아닌 것 같아요. 다시 천천히 살펴볼까요?';
      body.classList.remove('shake'); void body.offsetWidth; body.classList.add('shake');
    }
  };
  go.onclick = check;
  inputs.forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
}

/* ---------- QR 스캔 ---------- */
// QR 안의 글자를 trim+소문자 해시로 비교. 카메라가 안 되면 직접 입력.
function buildScan(st, body) {
  const msg = $('div', 'msg');
  const start = $('button', '', st.scanLabel || '📷 QR 스캔');
  const manual = $('button', 'ghost', '카메라가 안 돼요 (코드 직접 입력)');
  manual.style.display = 'none';
  body.append(start, msg, manual);
  let done = false;

  const accept = async text => {
    if (!(window.crypto && crypto.subtle)) { msg.className = 'msg'; msg.textContent = 'HTTPS(또는 localhost) 주소로 열어야 확인할 수 있어요.'; return null; }
    if ((await sha(text)) !== st.answerHash) return false;
    done = true;
    msg.className = 'msg ok'; msg.textContent = '확인했어요!';
    if (navigator.vibrate) navigator.vibrate(150);
    await sleep(700);
    complete();
    return true;
  };

  manual.onclick = () => {
    manual.remove();
    const inp = $('input'); inp.placeholder = 'QR 코드 글자'; inp.autocapitalize = 'off'; inp.spellcheck = false;
    const ok = $('button', '', '확인');
    ok.onclick = async () => { if ((await accept(inp.value)) === false) { msg.className = 'msg'; msg.textContent = '이 코드가 아닌 것 같아요.'; } };
    body.insertBefore(inp, msg); body.insertBefore(ok, msg);
  };

  start.onclick = async () => {
    start.disabled = true;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch (e) {
      msg.textContent = window.isSecureContext ? '카메라를 켤 수 없어요. 권한을 확인하거나 직접 입력해 주세요.' : 'HTTPS 주소가 아니라서 카메라를 켤 수 없어요.';
      manual.style.display = ''; start.disabled = false; return;
    }
    start.remove();
    const box = $('div'); box.id = 'qrbox';
    const video = $('video'); video.setAttribute('playsinline', ''); video.muted = true; video.autoplay = true;
    video.srcObject = stream;
    box.append(video);
    body.insertBefore(box, msg);
    video.play().catch(() => {});
    manual.style.display = '';
    msg.textContent = 'QR 코드를 사각형 안에 맞춰 주세요.';

    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    let busy = false, lastBad = '';
    const timer = setInterval(async () => {
      if (busy || done || video.readyState < 2 || !video.videoWidth) return;
      const w = Math.min(640, video.videoWidth), h = Math.round(w * video.videoHeight / video.videoWidth);
      cv.width = w; cv.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (!code || !code.data) return;
      busy = true;
      const r = await accept(code.data);
      if (r === false && code.data !== lastBad) {
        lastBad = code.data; msg.className = 'msg';
        let dbg = ''; try { if (localStorage.getItem('anniv-debug') === '1') dbg = ' [' + code.data + ']'; } catch (e) {}
        msg.textContent = '이 QR은 아닌 것 같아요. 다른 곳에 있는 걸까요?' + dbg;
      }
      busy = false;
    }, 200);
    cleanup = () => { clearInterval(timer); stream.getTracks().forEach(t => t.stop()); };
  };
}

/* ---------- 위치 (GPS / AR 공용) ---------- */
function distanceM(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// 반환: stop 함수. onUpdate(거리m), onError(메시지)
function watchGeo(geo, onUpdate, onError) {
  if (!navigator.geolocation) { onError('이 기기는 위치 기능을 지원하지 않아요.'); return () => {}; }
  const id = navigator.geolocation.watchPosition(
    p => onUpdate(distanceM({ lat: p.coords.latitude, lng: p.coords.longitude }, geo)),
    e => onError('위치 권한/신호를 확인해주세요.'),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

function buildGps(st, body) {
  const msg = $('div', 'msg', '위치 확인 중…');
  const done = nextBtn('도착! 다음으로', complete);
  done.style.display = 'none';
  const skip = nextBtn('위치가 안 잡혀요 (수동 진행)', complete);
  skip.className = 'ghost'; skip.style.display = 'none';
  body.append(msg, done, skip);
  const stop = watchGeo(st.geo,
    d => {
      if (d <= st.geo.radius) { msg.className = 'msg ok'; msg.textContent = '목적지에 도착했어요!'; done.style.display = ''; }
      else { msg.className = 'msg'; msg.textContent = `목적지까지 약 ${Math.round(d)}m`; }
    },
    m => { msg.textContent = m; skip.style.display = ''; });
  cleanup = stop;
}

/* ---------- AR ---------- */
// 카메라가 향한 방향(나침반 각도) 계산 (Android deviceorientationabsolute)
function headingFromEuler(alpha, beta, gamma) {
  const r = Math.PI / 180, a = alpha * r, b = beta * r, g = gamma * r;
  const rA = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g);
  const rB = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g);
  let h = Math.atan(rA / rB);
  if (rB < 0) h += Math.PI; else if (rA < 0) h += 2 * Math.PI;
  return h * 180 / Math.PI;
}
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

function buildAr(st, body) {
  const cfg = st.ar;
  const msg = $('div', 'msg');
  const start = $('button', '', '📷 카메라 시작');
  const skip = nextBtn('센서가 안 돼요 (수동 진행)', complete);
  skip.className = 'ghost'; skip.style.display = 'none';
  body.append(start, msg, skip);

  const fail = m => { msg.className = 'msg'; msg.textContent = m; skip.style.display = ''; start.disabled = false; };

  start.onclick = async () => {
    start.disabled = true;
    // iOS: 버튼 탭 안에서 바로 권한 요청해야 함
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return fail('방향 센서 권한이 필요해요. (설정 > Safari 에서 허용)');
      }
    } catch (e) { return fail('방향 센서 권한 요청에 실패했어요.'); }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch (e) { return fail('카메라를 켤 수 없어요. 권한을 확인해주세요.'); }

    start.remove();
    const box = $('div'); box.id = 'arbox';
    const video = $('video'); video.setAttribute('playsinline', ''); video.muted = true; video.autoplay = true;
    video.srcObject = stream;
    const obj = $('div'); obj.id = 'arobj';
    obj.append($('div', 'icon', cfg.objectEmoji), $('div', 'txt', cfg.hintText));
    const info = $('div'); info.id = 'arinfo';
    box.append(video, obj, info);
    body.insertBefore(box, msg);
    video.play().catch(() => {});

    const t0 = Date.now();
    let heading = null, since = 0, gpsOk = !cfg.useGps, gpsText = '', got = false, stopGeo = null, gotSensor = false;

    const onOri = e => {
      let h = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;          // iOS
      else if (e.absolute && e.alpha != null) h = headingFromEuler(e.alpha, e.beta, e.gamma); // Android
      if (h == null) return;
      heading = h; gotSensor = true;
    };
    window.addEventListener('deviceorientationabsolute', onOri, true);
    window.addEventListener('deviceorientation', onOri, true);

    if (cfg.useGps) {
      stopGeo = watchGeo(cfg.geo,
        d => { gpsOk = d <= cfg.geo.radius; gpsText = gpsOk ? '' : `📍 목표 지점까지 약 ${Math.round(d)}m`; },
        m => { gpsText = m; skip.style.display = ''; });
    }

    const timer = setInterval(() => {
      if (got) return;
      if (!gotSensor) { info.textContent = '방향 센서 신호 대기 중…'; if (Date.now() - t0 > 5000) skip.style.display = ''; return; }
      const inRange = heading != null && angDiff(heading, cfg.heading) <= cfg.tolerance && gpsOk;
      obj.classList.toggle('on', inRange);
      info.textContent = gpsText || (cfg.showHeading ? `방향 ${Math.round(heading)}° (목표 ${cfg.heading}°±${cfg.tolerance})` : '');
      if (inRange) {
        if (!since || since < 0) since = Date.now();
        if (Date.now() - since >= cfg.holdMs) win();
      } else since = 0;
    }, 100);

    function win() {
      got = true;
      box.classList.add('got');
      obj.classList.add('on');
      obj.querySelector('.txt').textContent = cfg.rewardText;
      msg.className = 'msg ok'; msg.textContent = cfg.rewardText;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      body.append(nextBtn('다음', complete));
    }

    cleanup = () => {
      clearInterval(timer);
      window.removeEventListener('deviceorientationabsolute', onOri, true);
      window.removeEventListener('deviceorientation', onOri, true);
      if (stopGeo) stopGeo();
      stream.getTracks().forEach(t => t.stop());
    };
  };
}

/* ---------- 테스트 패널 (#debug 로 켜기, #debug=off 로 끄기) ---------- */
function setupDebug() {
  let on = false;
  try { on = localStorage.getItem('anniv-debug') === '1'; } catch (e) {}
  const old = document.getElementById('dbg');
  if (old) old.remove();
  if (!on) return;
  const wrap = $('div'); wrap.id = 'dbg';
  const toggle = $('button', '', '🛠');
  const panel = $('div', 'panel'); panel.hidden = true;
  const sel = $('select');
  STAGES.forEach((s, k) => { const o = $('option', '', `${s.id}. ${s.title}`); o.value = k; sel.append(o); });
  const btn = (label, fn) => { const b = $('button', '', label); b.onclick = fn; return b; };
  panel.append(
    sel,
    btn('이 스테이지로 이동', () => { state.i = +sel.value; state.done = false; save(); show(state.i); panel.hidden = true; }),
    btn('⏭ 이 스테이지 통과', () => { complete(); panel.hidden = true; }),
    btn('💡 힌트 전부 열기', () => {
      const st = STAGES[state.i];
      if (st.hints) { state.hints[hk(st)] = st.hints.length; save(); show(state.i); }
      panel.hidden = true;
    }),
    btn('🔄 진행 초기화', () => { state = { i: 0, hints: {} }; save(); show(0); panel.hidden = true; }),
    btn('🧹 캐시/SW 삭제 후 새로고침', async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      for (const k of await caches.keys()) await caches.delete(k);
      location.reload();
    }),
    btn('디버그 끄기', () => { try { localStorage.removeItem('anniv-debug'); } catch (e) {} setupDebug(); })
  );
  toggle.onclick = () => { sel.value = state.i; panel.hidden = !panel.hidden; };
  wrap.append(panel, toggle);
  document.body.append(wrap);
}

/* ---------- 디버그 해시 ---------- */
function handleHash() {
  const h = location.hash;
  if (h === '#debug' || h === '#debug=off') {
    try { h === '#debug' ? localStorage.setItem('anniv-debug', '1') : localStorage.removeItem('anniv-debug'); } catch (e) {}
    history.replaceState(null, '', location.pathname);
    setupDebug();
    return false;
  }
  if (h === '#reset') {
    state = { i: 0, hints: {} }; save(); history.replaceState(null, '', location.pathname); return true;
  }
  const m = h.match(/^#stage=(\d+)/);
  if (m) { state.i = Math.max(0, Math.min(+m[1] - 1, STAGES.length - 1)); state.done = false; save(); return true; }
  return false;
}
window.addEventListener('hashchange', () => { if (handleHash()) show(state.i); });

/* ---------- 오프라인 배지 ---------- */
function setupOffline() {
  const badge = document.getElementById('badge');
  if (!('serviceWorker' in navigator)) { badge.textContent = '오프라인 미지원'; return; }
  // 새 버전이 설치되어 제어권을 넘겨받으면 한 번 자동 새로고침 (처음 설치할 때는 제외)
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.addEventListener('message', e => {
    const d = e.data;
    if (!d || d.total == null) return;
    if (d.cached >= d.total) { badge.textContent = '✔ 오프라인 준비 완료'; badge.className = 'ok'; }
    else { badge.textContent = `캐싱 중 ${d.cached}/${d.total}`; setTimeout(ask, 1000); }
  });
  const ask = async () => { const reg = await navigator.serviceWorker.ready; reg.active && reg.active.postMessage('CHECK'); };
  navigator.serviceWorker.register('sw.js').then(ask).catch(() => { badge.textContent = '오프라인 등록 실패 (HTTPS 필요)'; });
}

/* ---------- 시작 ---------- */
handleHash();
setupDebug();
setupOffline();
show(state.i);
