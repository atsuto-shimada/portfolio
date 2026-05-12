window.__loaderActive = !sessionStorage.getItem('loaderDone');

(function () {
  const overlay = document.getElementById('loader-overlay');
  if (!overlay) return;

  if (!window.__loaderActive) {
    overlay.remove();
    return;
  }

  const percentEl = document.getElementById('loader-percent');
  let percent = 0;
  let done = false;
  const DECAY_RATE = 15; // %/秒で減少

  // ニコニコ風コメント（10秒後に未完了なら開始）
  setTimeout(() => {
    if (done) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes nicoScroll {
        from { transform: translateX(100vw); }
        to   { transform: translateX(calc(-100% - 20px)); }
      }
      .nico-comment {
        position: fixed;
        left: 0;
        white-space: nowrap;
        font-family: 'Noto Sans JP', sans-serif;
        font-size: 35px;
        font-weight: 580;
        color: #fff;
        text-shadow:
          1px  0   #000, -1px  0   #000,
          0    1px #000,  0   -1px #000,
          1px  1px #000, -1px  1px #000,
          1px -1px #000, -1px -1px #000;
        pointer-events: none;
        z-index: 10001;
        animation: nicoScroll linear forwards;
      }
    `;
    document.head.appendChild(style);

    const FIRST = 'ロードが長いとイライラして画面を"連打"してしまうんよな';
    const singles = [
      'ギャルかよ',
      'あれうぜえ',
      '短気で草',
      'ピキるな',
      'ドパガキ',
      '高橋名人',
      '音ゲー？',
      '画面割れるぞ',
    ];
    const multis = ['わかる', 'あー', 'うん', '確かに', '草', 'wwwww'];

    const pool = [
      ...singles,
      ...multis, ...multis, ...multis, ...multis,
    ].sort(() => Math.random() - 0.5);

    const SPREAD = 22000;
    const schedule = [
      { text: FIRST, delay: 0, slow: true },
      ...pool.map((text, i) => ({
        text,
        delay: Math.round(800 + (i / pool.length) * SPREAD + Math.random() * (SPREAD / pool.length)),
      })),
    ];

    const activePos = [];
    const MIN_GAP = 5.5; // %（35pxフォント分の余白）

    function spawn(text, slow = false) {
      if (done) return;
      const el = document.createElement('span');
      el.className = 'nico-comment';
      el.textContent = text;

      let top, attempts = 0;
      do {
        top = 3 + Math.random() * 42;
        attempts++;
      } while (attempts < 30 && activePos.some(p => Math.abs(p - top) < MIN_GAP));

      activePos.push(top);
      el.style.top = top + '%';
      const base = 5 + text.length * 0.15;
      el.style.animationDuration = (slow ? base * 1.5 : base) + 's';
      overlay.appendChild(el);
      el.addEventListener('animationend', () => {
        const idx = activePos.indexOf(top);
        if (idx !== -1) activePos.splice(idx, 1);
        el.remove();
      });
    }

    schedule.forEach(({ text, delay, slow }) => {
      setTimeout(() => { if (!done) spawn(text, slow); }, delay);
    });
  }, 10000);

  function update() {
    const t = percent / 100;
    const bg = Math.round(t * 255);
    const fg = 255 - bg;
    overlay.style.background = `rgb(${bg},${bg},${bg})`;
    percentEl.style.color = `rgb(${fg},${fg},${fg})`;
    percentEl.textContent = Math.floor(percent) + '%';
  }

  function increment() {
    if (done) return;
    percent = Math.min(100, percent + 3 + Math.random() * 3);
    if (percent >= 100) {
      done = true;
      update();
      complete();
      return;
    }
    update();
  }

  // 毎フレーム減少ループ
  let lastTime = null;
  function decayLoop(now) {
    if (done) return;
    if (lastTime !== null && percent > 0) {
      const dt = (now - lastTime) / 1000;
      const next = Math.max(0, percent - DECAY_RATE * dt);
      if (next !== percent) {
        percent = next;
        update();
      }
    }
    lastTime = now;
    requestAnimationFrame(decayLoop);
  }
  requestAnimationFrame(decayLoop);

  function complete() {
    percent = 100;
    overlay.style.background = '#fff';
    percentEl.style.color = '#000';
    percentEl.textContent = '100%';
    sessionStorage.setItem('loaderDone', '1');

    setTimeout(() => {
      overlay.style.transition = 'opacity 1s ease';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        overlay.remove();
        if (typeof window.triggerEntryAnimation === 'function') {
          window.triggerEntryAnimation();
        }
      }, 1100);
    }, 400);
  }

  overlay.addEventListener('click', increment);
  overlay.addEventListener('touchstart', e => {
    e.preventDefault();
    increment();
  }, { passive: false });

  update();
})();
