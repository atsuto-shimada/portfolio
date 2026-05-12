(function () {
  // ---- Carousel ----
  const WORKS = [
    { img: 'images/ito.png',      href: 'ito.html' },
    { img: 'images/jenga.png',    href: 'jenga.html' },
    { img: 'images/nanicore.png', href: 'nanicore.html' },
    { img: 'images/paple.png',    href: 'paple.html' },
    { img: 'images/safe.png',     href: 'safe.html' },
    { img: 'images/shoukan.png',  href: 'shoukan.html' },
    { img: 'images/zokei.png',    href: 'zokei.html' },
    { img: 'images/gum.png',      href: 'gum.html' },
    { img: 'images/denki.png',    href: 'denki.html' },
    { img: 'images/breimen.png',  href: 'breimen.html' },
    { img: 'images/av.png',       href: 'av.html' },
    { img: 'images/alphabet.png', href: 'alphabet.html' },
    { img: 'images/aidol.png',    href: 'aidol.html' },
  ];

  const N      = WORKS.length;
  const RADIUS = 500;
  const carousel = document.querySelector('.carousel');

  WORKS.forEach((work, i) => {
    const angle = (i / N) * 360;
    const a = document.createElement('a');
    a.href      = work.href;
    a.className = 'work-item';
    a.style.transform = `rotateY(${angle}deg) translateZ(${RADIUS}px)`;
    const img = document.createElement('img');
    img.src      = work.img;
    img.alt      = '';
    img.loading  = 'lazy';
    img.decoding = 'async';
    a.appendChild(img);
    carousel.appendChild(a);
  });

  let rotY       = 0;
  let isDragging = false;
  let lastDragX  = 0;
  let startDragX = 0;
  let dragMoved  = false;
  let isExiting  = false;
  let exitHref   = '';
  let exitFrame  = 0;
  const DRAG_THRESHOLD = 6;
  const EXIT_FRAMES    = 55;

  document.addEventListener('mousedown', e => {
    if (e.target.closest('.back')) return;
    isDragging = true;
    dragMoved  = false;
    startDragX = e.clientX;
    lastDragX  = e.clientX;
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    if (Math.abs(e.clientX - startDragX) > DRAG_THRESHOLD) dragMoved = true;
    rotY     += (e.clientX - lastDragX) * 0.3;
    lastDragX  = e.clientX;
  });
  document.addEventListener('mouseup',    () => { isDragging = false; });
  document.addEventListener('mouseleave', () => { isDragging = false; });
  document.addEventListener('click', e => {
    const item = e.target.closest('.work-item');
    if (item) {
      e.preventDefault();
      e.stopPropagation();
      if (!dragMoved && !isExiting) {
        exitHref  = item.getAttribute('href');
        isExiting = true;
        exitFrame = 0;
      }
    }
    dragMoved = false;
  }, true);

  document.addEventListener('touchstart', e => {
    isDragging = true;
    dragMoved  = false;
    startDragX = e.touches[0].clientX;
    lastDragX  = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    if (Math.abs(e.touches[0].clientX - startDragX) > DRAG_THRESHOLD) dragMoved = true;
    rotY     += (e.touches[0].clientX - lastDragX) * 0.3;
    lastDragX  = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', () => { isDragging = false; });

  const direct  = new URLSearchParams(location.search).get('direct') === '1';
  const ENTRY   = direct ? 70 : 160;
  const START_Y = direct ? -(window.innerHeight / 2 + 220) : -(window.innerHeight + 600);
  const END_Y   = -40;
  let ef = 0;

  (function spin() {
    if (isExiting) {
      exitFrame++;
      const t    = Math.min(exitFrame / EXIT_FRAMES, 1);
      const ease = t * t;
      const y    = END_Y + (-(window.innerHeight + 500) - END_Y) * ease;
      rotY      += 0.2;
      carousel.style.transform = `translateY(${y}px) rotateX(-5deg) rotateY(${rotY}deg)`;
      if (t < 1) { requestAnimationFrame(spin); return; }
      location.href = exitHref;
      return;
    }

    ef++;
    if (ef <= ENTRY) {
      const t    = ef / ENTRY;
      const ease = 1 - Math.pow(1 - t, 4);
      const y    = START_Y + (END_Y - START_Y) * ease;
      rotY      += 8 * (1 - t) + 0.2;
      carousel.style.transform = `translateY(${y}px) rotateX(-5deg) rotateY(${rotY}deg)`;
    } else {
      rotY += 0.2;
      carousel.style.transform = `translateY(${END_Y}px) rotateX(-5deg) rotateY(${rotY}deg)`;
    }
    requestAnimationFrame(spin);
  })();
})();

document.querySelector('.sub-nav a[href="index.html"]')?.addEventListener('click', e => {
  e.preventDefault();
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#fff;opacity:0;transition:opacity 0.35s ease;pointer-events:none;';
  document.body.appendChild(ov);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ov.style.opacity = '1';
    setTimeout(() => { location.href = 'index.html?fade=1'; }, 360);
  }));
});
