async function fitText() {
  await document.fonts.ready;
  const el = document.querySelector('.text');
  const text = el.textContent.trim();

  el.style.transform = 'none';
  el.style.top = '0';
  el.style.fontSize = '100px';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '900 100px "Noto Sans JP"';
  const m = ctx.measureText(text);

  const glyphHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const glyphWidth = m.width;

  const fontSize = 100;
  const naturalLineHeight = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const halfLeading = (fontSize - naturalLineHeight) / 2;
  const cssBaseline = m.fontBoundingBoxAscent + halfLeading;
  const topGap = cssBaseline - m.actualBoundingBoxAscent;

  const scaleX = window.innerWidth / glyphWidth;
  const scaleY = window.innerHeight / glyphHeight;

  el.style.top = `${-topGap * scaleY}px`;
  el.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
}

fitText();
window.addEventListener('resize', fitText);

if (new URLSearchParams(location.search).get('fade') === '1') {
  document.body.style.opacity = '0';
  document.fonts.ready.then(() => {
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.5s ease';
      document.body.style.opacity = '1';
      setTimeout(() => { document.body.style.transition = ''; }, 600);
    }, 80);
  });
}

// --- 逃げるナビボックス ---
let speedMult       = 1;
let targetSpeedMult = 1;
let navFrozen       = false;

const LABELS = ['CONTACT', 'WORKS', 'PROFILE'];
const FLEE_RADIUS  = 130;
const MAX_SPEED    = 7;
const CRUISE_SPEED = 0.8;
const DAMPING      = 0.97;

const HREFS = { PROFILE: 'profile.html', WORKS: 'works.html', CONTACT: 'https://docs.google.com/forms/d/e/1FAIpQLScGWggfx-XI5iAqtZNB_iRvf7DIoArWMKtYYxsC5hBf22Harw/viewform?usp=header' };

const boxes = LABELS.map(label => {
  const el = document.createElement('div');
  el.className = 'nav-box';
  el.textContent = label;
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const angle = Math.random() * Math.PI * 2;
  const box = { el, x: 0, y: 0, vx: Math.cos(angle) * CRUISE_SPEED, vy: Math.sin(angle) * CRUISE_SPEED, w: 0, h: 0, wanderAngle: angle,
                rotation: 0, scale: 1, shakeX: 0, shakeY: 0, behavior: null, behaviorTimer: 0, behaviorDuration: 1, behaviorData: {}, frozen: false };
  if (HREFS[label]) {
    el.addEventListener('click', () => {
      if (box.frozen) return;
      box.frozen = true;
      el.style.zIndex = '20';

      // Phase 1: 暴れ回る
      const WILD = 90;
      let wx = box.x, wy = box.y;
      let vx = (Math.random() < 0.5 ? 1 : -1) * (120 + Math.random() * 60);
      let vy = (Math.random() < 0.5 ? 1 : -1) * (120 + Math.random() * 60);
      let wRot = box.rotation;
      let wf = 0;

      (function wild() {
        wf++;
        if (wf % 3 === 0) {
          vx += (Math.random() - 0.5) * 180;
          vy += (Math.random() - 0.5) * 180;
        }
        const spd = Math.sqrt(vx * vx + vy * vy);
        if (spd < 80) { vx = vx / spd * 80; vy = vy / spd * 80; }
        if (spd > 180) { vx = vx / spd * 180; vy = vy / spd * 180; }

        wx += vx;
        wy += vy;
        wRot += 22;

        if (wx < 0)                         { wx = 0;                         vx =  Math.abs(vx); }
        if (wy < 0)                         { wy = 0;                         vy =  Math.abs(vy); }
        if (wx + box.w > window.innerWidth) { wx = window.innerWidth - box.w; vx = -Math.abs(vx); }
        if (wy + box.h > window.innerHeight){ wy = window.innerHeight- box.h; vy = -Math.abs(vy); }

        el.style.transform = `translate(${wx}px,${wy}px) rotate(${wRot}deg)`;

        if (wf < WILD) {
          requestAnimationFrame(wild);
        } else {
          // Phase 2: 回転しながら迫ってくる
          const startX  = wx, startY = wy, startRot = wRot;
          const targetX = window.innerWidth  / 2 - box.w / 2;
          const targetY = window.innerHeight / 2 - box.h / 2;
          const ZOOM = 55;
          let zf = 0;
          (function zoom() {
            zf++;
            const t = zf / ZOOM;
            const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const x   = startX + (targetX - startX) * e;
            const y   = startY + (targetY - startY) * e;
            const rot = startRot + t * 720;
            const sc  = 1 + e * 28;
            el.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${sc})`;
            if (zf < ZOOM) requestAnimationFrame(zoom);
            else location.href = HREFS[label];
          })();
        }
      })();
    });
  }
  return box;
});

let mouseX = -9999, mouseY = -9999;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
document.addEventListener('touchmove', e => {
  mouseX = e.touches[0].clientX;
  mouseY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', () => { mouseX = -9999; mouseY = -9999; });

function initBoxPositions() {
  boxes.forEach(box => {
    const rect = box.el.getBoundingClientRect();
    box.w = rect.width;
    box.h = rect.height;
  });
  const maxW = Math.max(...boxes.map(b => b.w));
  boxes.forEach(box => {
    box.el.style.width = `${maxW}px`;
    box.w = maxW;
  });
  boxes.forEach(box => {
    const maxAttempts = 50;
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tx = Math.random() * (window.innerWidth  - box.w);
      const ty = Math.random() * (window.innerHeight - box.h);
      const overlap = boxes.some(other => other.el.style.visibility === 'visible' && (
        tx < other.x + other.w + 20 && tx + box.w + 20 > other.x &&
        ty < other.y + other.h + 20 && ty + box.h + 20 > other.y
      ));
      if (!overlap) {
        box.x = tx;
        box.y = ty;
        placed = true;
        break;
      }
    }
    if (!placed) {
      box.x = Math.random() * (window.innerWidth  - box.w);
      box.y = Math.random() * (window.innerHeight - box.h);
    }
    box.el.style.transform = `translate(${box.x}px,${box.y}px) rotate(0deg) scale(1)`;
    box.el.style.visibility = 'visible';
  });
}

document.fonts.ready.then(() => requestAnimationFrame(initBoxPositions));


function tick() {
  speedMult += (targetSpeedMult - speedMult) * 0.025;

  boxes.forEach(box => {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const dx = cx - mouseX;
    const dy = cy - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < FLEE_RADIUS && dist > 0) {
      const f = ((FLEE_RADIUS - dist) / FLEE_RADIUS) * 9;
      box.vx += (dx / dist) * f;
      box.vy += (dy / dist) * f;
    }

    box.wanderAngle += (Math.random() - 0.5) * 0.08;
    box.vx += Math.cos(box.wanderAngle) * 0.1;
    box.vy += Math.sin(box.wanderAngle) * 0.1;

    box.vx *= DAMPING;
    box.vy *= DAMPING;

    const spd = Math.sqrt(box.vx * box.vx + box.vy * box.vy);
    if (spd > MAX_SPEED)    { box.vx = box.vx / spd * MAX_SPEED; box.vy = box.vy / spd * MAX_SPEED; }
    if (spd < CRUISE_SPEED) { box.vx = box.vx / spd * CRUISE_SPEED; box.vy = box.vy / spd * CRUISE_SPEED; }

    box.x += box.vx * speedMult;
    box.y += box.vy * speedMult;

    if (speedMult > 0.05) {
      if (!box.behavior && Math.random() < 0.004) {
        box.behavior = ['rotate', 'scale', 'scale', 'shake'][Math.floor(Math.random() * 4)];
        const dur = 50 + Math.floor(Math.random() * 70);
        box.behaviorTimer = dur;
        box.behaviorDuration = dur;
        if (box.behavior === 'rotate') {
          box.behaviorData.dir = Math.random() < 0.5 ? 1 : -1;
          box.behaviorData.speed = 3 + Math.random() * 5;
        }
      }

      if (box.behavior) {
        const progress = (box.behaviorDuration - box.behaviorTimer) / box.behaviorDuration;
        if (box.behavior === 'rotate') {
          box.rotation += box.behaviorData.dir * box.behaviorData.speed * speedMult;
        } else if (box.behavior === 'scale') {
          box.scale = 1 + Math.sin(progress * Math.PI) * 0.28;
        } else if (box.behavior === 'shake') {
          box.shakeX = (Math.random() - 0.5) * 10;
          box.shakeY = (Math.random() - 0.5) * 10;
        }
        box.behaviorTimer -= speedMult;
        if (box.behaviorTimer <= 0) {
          box.behavior = null;
          box.scale = 1;
          box.shakeX = 0;
          box.shakeY = 0;
        }
      }
    } else {
      box.scale  = 1;
      box.shakeX = 0;
      box.shakeY = 0;
    }

    if (box.x < 0)                          { box.x = 0;                          box.vx =  Math.abs(box.vx); box.wanderAngle = -box.wanderAngle; }
    if (box.y < 0)                          { box.y = 0;                          box.vy =  Math.abs(box.vy); box.wanderAngle = -box.wanderAngle; }
    if (box.x + box.w > window.innerWidth)  { box.x = window.innerWidth  - box.w; box.vx = -Math.abs(box.vx); box.wanderAngle = Math.PI - box.wanderAngle; }
    if (box.y + box.h > window.innerHeight) { box.y = window.innerHeight - box.h; box.vy = -Math.abs(box.vy); box.wanderAngle = Math.PI - box.wanderAngle; }
  });

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (overlapX < overlapY) {
        const push = overlapX / 2;
        if (a.x < b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
        const tmp = a.vx; a.vx = b.vx; b.vx = tmp;
        a.wanderAngle = Math.PI - a.wanderAngle;
        b.wanderAngle = Math.PI - b.wanderAngle;
      } else {
        const push = overlapY / 2;
        if (a.y < b.y) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; }
        const tmp = a.vy; a.vy = b.vy; b.vy = tmp;
        a.wanderAngle = -a.wanderAngle;
        b.wanderAngle = -b.wanderAngle;
      }
    }
  }

  boxes.forEach(box => {
    if (box.frozen) return;
    box.el.style.transform = `translate(${box.x + box.shakeX}px,${box.y + box.shakeY}px) rotate(${box.rotation}deg) scale(${box.scale})`;
  });
  requestAnimationFrame(tick);
}

tick();

// --- 文字長押し（1.5秒で発動） ---
(function () {
  const HOLD_MS  = 1500;
  const HIT_SIZE = 256;
  const ALPHA_TH = 48;

  // 各文字のグリフをオフスクリーンキャンバスに焼いてピクセル判定に使う
  document.fonts.ready.then(() => {
    document.querySelectorAll('.ch').forEach(el => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = HIT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.font = `900 ${HIT_SIZE * 0.8}px "Noto Sans JP"`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.textContent, HIT_SIZE / 2, HIT_SIZE / 2);
      el._hitCtx = ctx;
    });
  });

  function isOnGlyph(el, mouseX, mouseY) {
    if (!el._hitCtx) return true;
    const rect = el.getBoundingClientRect();
    const nx = (mouseX - rect.left)  / rect.width;
    const ny = (mouseY - rect.top)   / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return false;
    const px = el._hitCtx.getImageData(
      Math.floor(nx * HIT_SIZE),
      Math.floor(ny * HIT_SIZE),
      1, 1
    ).data;
    return px[3] > ALPHA_TH;
  }

  const gauge = document.createElement('div');
  gauge.className = 'press-gauge';
  gauge.innerHTML = '<div class="press-gauge-inner"></div>';
  gauge.style.display = 'none';
  document.body.appendChild(gauge);

  let pressTarget = null;
  let pressStart  = null;
  let rafId       = null;

  function setGaugePos(e) {
    gauge.style.left = (e.clientX + 14) + 'px';
    gauge.style.top  = (e.clientY - 54) + 'px';
  }

  function cancel() {
    pressTarget = null;
    pressStart  = null;
    cancelAnimationFrame(rafId);
    gauge.style.display = 'none';
  }

  function tick() {
    if (!pressStart) return;
    const progress = Math.min((Date.now() - pressStart) / HOLD_MS, 1);
    gauge.style.background = `conic-gradient(#00cc44 ${progress * 360}deg, rgba(0,0,0,0.12) ${progress * 360}deg)`;

    if (progress >= 1) {
      const action = pressTarget.dataset.action;
      const dest   = pressTarget.dataset.dest;
      cancel();
      if (action === 'invert')       document.body.classList.toggle('inverted');
      else if (action === 'round')   document.body.classList.toggle('rounded');
      else if (action === 'crush')   document.body.classList.toggle('crushed');
      else if (action === 'freeze')  { navFrozen = !navFrozen; targetSpeedMult = navFrozen ? 0 : 1; }
      else if (action === 'xmarks')  toggleXmarks();
      else if (action === 'music')   toggleMusic();
      else if (dest)                 location.href = dest;
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  document.querySelectorAll('.ch').forEach(el => {
    el.addEventListener('mousedown', e => {
      if (!isOnGlyph(el, e.clientX, e.clientY)) return;
      e.preventDefault();
      pressTarget = el;
      pressStart  = Date.now();
      setGaugePos(e);
      gauge.style.display = 'block';
      rafId = requestAnimationFrame(tick);
    });
    el.addEventListener('touchstart', e => {
      const t = e.touches[0];
      if (!isOnGlyph(el, t.clientX, t.clientY)) return;
      e.preventDefault();
      pressTarget = el;
      pressStart  = Date.now();
      setGaugePos(t);
      gauge.style.display = 'block';
      rafId = requestAnimationFrame(tick);
    }, { passive: false });
  });

  document.addEventListener('mouseup',   cancel);
  document.addEventListener('touchend',  cancel);
  document.addEventListener('touchcancel', cancel);
  document.addEventListener('mousemove', e => { if (pressTarget) setGaugePos(e); });
  document.addEventListener('touchmove', e => {
    if (pressTarget) setGaugePos(e.touches[0]);
  }, { passive: true });

  const music = new Audio('sounds/aisiteru.mp3');
  music.volume = 0.3;
  let loopTimer    = null;
  let musicActive  = false;
  let heartInterval = null;
  music.addEventListener('ended', () => {
    if (musicActive) loopTimer = setTimeout(() => music.play(), 1000);
  });

  function createHeart() {
    const id   = 'hg' + Math.random().toString(36).slice(2, 9);
    const size = 44 + Math.random() * 72;
    const dur  = 3.5 + Math.random() * 2.5;
    const dx   = (Math.random() - 0.5) * 100;

    const div = document.createElement('div');
    div.className = 'floating-heart';
    div.style.width  = size + 'px';
    div.style.height = size + 'px';
    div.style.left = (Math.random() * 85 + 5) + 'vw';
    div.style.top  = '100vh';
    div.style.setProperty('--dur', dur + 's');
    div.style.setProperty('--dx', dx + 'px');

    div.innerHTML = `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${id}f" cx="38%" cy="30%" r="62%">
          <stop offset="0%"   stop-color="#ffd6ee"/>
          <stop offset="38%"  stop-color="#ff2d88"/>
          <stop offset="100%" stop-color="#8b0045"/>
        </radialGradient>
        <radialGradient id="${id}s" cx="30%" cy="22%" r="30%">
          <stop offset="0%"   stop-color="rgba(255,255,255,0.88)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <path d="M50,82 C25,67 0,52 0,27 C0,10 12,0 25,0 C35,0 43,6 50,15 C57,6 65,0 75,0 C88,0 100,10 100,27 C100,52 75,67 50,82Z" fill="url(#${id}f)"/>
      <path d="M50,82 C25,67 0,52 0,27 C0,10 12,0 25,0 C35,0 43,6 50,15 C57,6 65,0 75,0 C88,0 100,10 100,27 C100,52 75,67 50,82Z" fill="url(#${id}s)"/>
    </svg>`;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), (dur + 0.5) * 1000);
  }

  function toggleMusic() {
    if (!musicActive) {
      musicActive   = true;
      music.play();
      heartInterval = setInterval(createHeart, 500);
    } else {
      musicActive   = false;
      music.pause();
      music.currentTime = 0;
      clearTimeout(loopTimer);
      loopTimer = null;
      clearInterval(heartInterval);
      heartInterval = null;
    }
  }

  function toggleXmarks() {
    let layer = document.getElementById('xmarks-layer');
    if (layer) { layer.remove(); return; }

    layer = document.createElement('div');
    layer.id = 'xmarks-layer';
    document.body.appendChild(layer);

    const COUNT = 40;
    for (let i = 0; i < COUNT; i++) {
      const s = document.createElement('span');
      s.textContent = '×';
      const size = 160 + Math.random() * 240;
      s.style.fontSize   = size + 'px';
      s.style.left       = (Math.random() * 100) + 'vw';
      s.style.top        = (Math.random() * 100) + 'vh';
      s.style.transform  = `rotate(${(Math.random() - 0.5) * 40}deg)`;
      layer.appendChild(s);
    }
  }
})();
