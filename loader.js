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
      if (typeof window.triggerEntryAnimation === 'function') {
        window.triggerEntryAnimation();
      }
      overlay.style.transition = 'opacity 1s ease';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => overlay.remove(), 1100);
    }, 400);
  }

  overlay.addEventListener('click', increment);
  overlay.addEventListener('touchstart', e => {
    e.preventDefault();
    increment();
  }, { passive: false });

  update();
})();
