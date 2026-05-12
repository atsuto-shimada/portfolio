(function () {
  const loader     = document.getElementById('loader');
  const pctEl      = document.getElementById('loader-pct');
  const completeEl = document.getElementById('loader-complete');
  const hintEl     = document.getElementById('loader-hint');

  if (sessionStorage.getItem('loaderShown')) {
    loader.remove();
    return;
  }

  const S1_GAIN  = 0.06;
  const S1_DRAIN = 0.004;

  let progress   = 0;
  let finished   = false;
  let completing = false;

  // ---- ヒント ----
  let hintTimer   = null;
  let hintVisible = false;

  function showHint(html) {
    hintEl.innerHTML     = html;
    hintEl.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      hintEl.style.transition = 'opacity 0.5s ease';
      hintEl.style.opacity    = '1';
      hintVisible = true;
    }));
  }

  function hideHint() {
    clearTimeout(hintTimer);
    hintTimer = null;
    if (!hintVisible) { hintEl.style.display = 'none'; return; }
    hintEl.style.transition = 'opacity 0.3s ease';
    hintEl.style.opacity    = '0';
    hintVisible = false;
    setTimeout(() => { hintEl.style.display = 'none'; }, 300);
  }

  function scheduleHint(html, delay) {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => showHint(html), delay);
  }

  // ---- 色・背景 ----
  function applyProgress(p) {
    const b = Math.round(255 * Math.min(p, 1));
    loader.style.backgroundColor = `rgb(${b},${b},${b})`;
    const c = `rgb(${255 - b},${255 - b},${255 - b})`;
    pctEl.style.color      = c;
    completeEl.style.color = c;
    hintEl.style.color     = c;
  }

  // ---- COMPLETE ----
  function showComplete(callback) {
    hideHint();
    pctEl.style.opacity      = '0';
    completeEl.style.opacity = '0';
    completeEl.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      completeEl.style.transition = 'opacity 0.3s ease';
      completeEl.style.opacity    = '1';
      setTimeout(() => {
        completeEl.style.opacity = '0';
        setTimeout(() => {
          completeEl.style.display = 'none';
          callback();
        }, 300);
      }, 500);
    }));
  }

  // ---- イベント ----
  document.addEventListener('mousedown', e => {
    if (finished || completing || e.button !== 0) return;
    progress = Math.min(1, progress + S1_GAIN);
  });
  document.addEventListener('touchstart', e => {
    if (finished || completing) return;
    e.preventDefault();
    progress = Math.min(1, progress + S1_GAIN);
  }, { passive: false });

  // ---- finish ----
  function finish() {
    if (finished) return;
    finished = true;
    sessionStorage.setItem('loaderShown', '1');
    setTimeout(playAssembly, 300);
  }

  function playAssembly() {
    const textEl = document.querySelector('.text');
    Array.from(textEl.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const chars = node.textContent.split('').filter(c => c.trim());
      node.remove();
      chars.forEach(char => {
        const s = document.createElement('span');
        s.textContent = char;
        textEl.appendChild(s);
      });
    });

    const allSpans = Array.from(textEl.querySelectorAll('span'));
    allSpans.forEach(span => {
      span.style.display   = 'inline-block';
      const rx = (Math.random() - 0.5) * window.innerWidth  * 2.2;
      const ry = (Math.random() - 0.5) * window.innerHeight * 2.2;
      const rr = (Math.random() - 0.5) * 360;
      span.style.transform = `translate(${rx}px,${ry}px) rotate(${rr}deg)`;
      span.style.opacity   = '0';
    });

    loader.classList.add('done');
    loader.addEventListener('transitionend', () => {
      loader.remove();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        allSpans.forEach((span, i) => {
          setTimeout(() => {
            span.style.transition = 'transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease';
            span.style.transform  = 'none';
            span.style.opacity    = '1';
          }, i * 55);
        });
        setTimeout(() => {
          allSpans.forEach(span => { span.style.transition = ''; });
          document.dispatchEvent(new CustomEvent('loaderAssemblyDone'));
        }, allSpans.length * 55 + 700);
      }));
    }, { once: true });
  }

  // ---- メインループ ----
  let frame = 0;
  function draw() {
    if (finished) return;
    frame++;

    if (!completing) {
      if (progress >= 1) {
        completing = true;
        showComplete(() => {
          completing = false;
          finish();
        });
      } else {
        if (frame % 4 === 0) progress = Math.max(0, progress - S1_DRAIN);
        pctEl.textContent = Math.floor(progress * 100) + '%';
      }
    }

    applyProgress(progress);
    requestAnimationFrame(draw);
  }

  applyProgress(0);
  scheduleHint('連打', 6000);
  requestAnimationFrame(draw);
})();
