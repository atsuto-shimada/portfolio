(function () {
  const wraps = Array.from(document.querySelectorAll('.img-wrap'));
  const ASSEMBLE_MS = 700;
  const EXIT_MS     = 180;

  function randomOffset() {
    const dirs = [
      { dx:  0,    dy: -900 },
      { dx:  0,    dy:  900 },
      { dx: -900,  dy:  0   },
      { dx:  900,  dy:  0   },
    ];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  const offsets = wraps.map(() => randomOffset());

  wraps.forEach((el, i) => {
    el.style.transition = 'none';
    el.style.transform  = `translate(${offsets[i].dx}px, ${offsets[i].dy}px)`;
    el.style.opacity    = '0';
  });

  setTimeout(() => {
    wraps.forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = `transform ${ASSEMBLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease`;
        el.style.transform  = 'translate(0, 0)';
        el.style.opacity    = '1';
      }, i * 80);
    });
  }, 50);

  function disassemble(callback) {
    const order = wraps.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((idx, step) => {
      setTimeout(() => {
        wraps[idx].style.transition = `transform ${EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1), opacity ${EXIT_MS}ms ease`;
        wraps[idx].style.transform  = `translate(${offsets[idx].dx}px, ${offsets[idx].dy}px)`;
        wraps[idx].style.opacity    = '0';
      }, step * EXIT_MS);
    });
    setTimeout(callback, wraps.length * EXIT_MS);
  }

  document.querySelectorAll('.sub-nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const raw = e.currentTarget.getAttribute('href');
      if (raw === 'index.html') {
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#fff;opacity:0;transition:opacity 0.35s ease;pointer-events:none;';
        document.body.appendChild(ov);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          ov.style.opacity = '1';
          setTimeout(() => { location.href = 'index.html?fade=1'; }, 360);
        }));
      } else {
        disassemble(() => { location.href = e.currentTarget.href; });
      }
    });
  });

  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  wraps.forEach(el => {
    el.addEventListener('click', () => {
      lightboxImg.src = el.querySelector('img').src;
      lightbox.classList.add('open');
    });
  });

  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') lightbox.classList.remove('open');
  });
})();
