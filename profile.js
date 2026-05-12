
(function () {
  const DURATION = 2800;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
                '!?#%&*+=@$<>[]{}|~^/\\;:.,_-' +
                'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロ';

  function randChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function ease(t) { return 1 - Math.pow(1 - Math.min(t, 1), 3); }

  const BCOLORS = ['#ff0000','#00ff00','#0000ff','#ff00ff','#00ffff','#ffff00','#ff8800','#ffffff'];
  const BSTYLES = ['solid','dashed','dotted','double'];
  const rowEls  = [...document.querySelectorAll('.info-row')];
  const rowData = rowEls.map((row, i) => ({
    row,
    hasTop: i === 0,
    resolveAt: Math.pow(Math.random(), 0.75) * DURATION * 0.88,
    resolved: false,
  }));

  rowData.forEach(d => {
    d.row.style.borderBottomColor = BCOLORS[Math.floor(Math.random() * BCOLORS.length)];
    d.row.style.borderBottomWidth = `${(Math.random() * 6 + 1).toFixed(1)}px`;
    d.row.style.borderBottomStyle = BSTYLES[Math.floor(Math.random() * BSTYLES.length)];
    if (d.hasTop) {
      d.row.style.borderTopColor = BCOLORS[Math.floor(Math.random() * BCOLORS.length)];
      d.row.style.borderTopWidth = `${(Math.random() * 6 + 1).toFixed(1)}px`;
      d.row.style.borderTopStyle = BSTYLES[Math.floor(Math.random() * BSTYLES.length)];
    }
  });

  const items = [];

  document.querySelectorAll('dt, dd').forEach(el => {
    const original = el.innerHTML;
    const text     = el.textContent;
    const charData = [];

    el.innerHTML = '';

    [...text].forEach(ch => {
      if (ch === '\n') { el.appendChild(document.createElement('br')); return; }
      if (ch === ' ')  { el.appendChild(document.createTextNode(' ')); return; }

      const span = document.createElement('span');
      span.style.cssText = 'display:inline-block;will-change:transform;';

      const rx = (Math.random() - 0.5) * window.innerWidth  * 2;
      const ry = (Math.random() - 0.5) * window.innerHeight * 2;
      span.style.transform = `translate(${rx}px,${ry}px)`;
      span.textContent = randChar();
      el.appendChild(span);

      charData.push({
        span, ch, rx, ry,
        resolveAt: Math.pow(Math.random(), 0.75) * DURATION * 0.88,
      });
    });

    items.push({ el, original, charData });
  });

  const start = Date.now();

  function update() {
    const elapsed = Date.now() - start;
    const ep = ease(elapsed / DURATION);
    let anyLeft = false;

    items.forEach(({ charData }) => {
      charData.forEach(d => {
        const tx = d.rx * (1 - ep);
        const ty = d.ry * (1 - ep);

        if (elapsed >= d.resolveAt) {
          if (d.span.textContent !== d.ch) d.span.textContent = d.ch;
        } else {
          d.span.textContent = randChar();
          anyLeft = true;
        }

        if (Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5) {
          d.span.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px)`;
          anyLeft = true;
        } else if (d.span.style.transform) {
          d.span.style.transform = '';
        }
      });
    });

    rowData.forEach(d => {
      if (elapsed >= d.resolveAt) {
        if (!d.resolved) {
          d.row.style.borderBottomColor = '';
          d.row.style.borderBottomWidth = '';
          d.row.style.borderBottomStyle = '';
          if (d.hasTop) {
            d.row.style.borderTopColor = '';
            d.row.style.borderTopWidth = '';
            d.row.style.borderTopStyle = '';
          }
          d.resolved = true;
        }
      } else {
        d.row.style.borderBottomColor = BCOLORS[Math.floor(Math.random() * BCOLORS.length)];
        d.row.style.borderBottomWidth = `${(Math.random() * 6 + 1).toFixed(1)}px`;
        d.row.style.borderBottomStyle = BSTYLES[Math.floor(Math.random() * BSTYLES.length)];
        if (d.hasTop) {
          d.row.style.borderTopColor = BCOLORS[Math.floor(Math.random() * BCOLORS.length)];
          d.row.style.borderTopWidth = `${(Math.random() * 6 + 1).toFixed(1)}px`;
          d.row.style.borderTopStyle = BSTYLES[Math.floor(Math.random() * BSTYLES.length)];
        }
        anyLeft = true;
      }
    });

    if (anyLeft) {
      requestAnimationFrame(update);
    } else {
      startSway(items);
    }
  }

  function startSway(items) {
    const chars = [];
    items.forEach(({ charData }) => {
      charData.forEach(d => {
        d.span.style.transform = '';
        chars.push({
          span:   d.span,
          phase:  Math.random() * Math.PI * 2,
          speedY: 0.7 + Math.random() * 0.6,
          speedX: 0.7 + Math.random() * 0.6,
          ampY:   1.2 + Math.random() * 1.6,
          ampX:   1.2 + Math.random() * 1.6,
        });
      });
    });

    const lines = [];
    const N = 80;

    rowEls.forEach((row, i) => {
      row.style.position = 'relative';
      row.style.borderBottom = 'none';
      row.style.borderTop    = 'none';

      const mkLine = (edge) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = `position:absolute;${edge}:0;left:0;width:100%;height:0;overflow:visible;`;
        row.appendChild(wrap);
        const segs = [];
        for (let k = 0; k < N; k++) {
          const seg = document.createElement('div');
          seg.style.cssText = `position:absolute;top:0;left:${(k/N*100).toFixed(2)}%;width:${(1/N*100+0.1).toFixed(2)}%;height:1px;background:#000;will-change:transform;`;
          wrap.appendChild(seg);
          segs.push(seg);
        }
        lines.push({ segs, phase: Math.random() * Math.PI * 2, speed: 0.8 + Math.random() * 0.6, amp: 4 + Math.random() * 4 });
      };

      if (i === 0) mkLine('top');
      mkLine('bottom');
    });

    const t0 = Date.now();
    (function sway() {
      const t = (Date.now() - t0) / 1000;
      chars.forEach(c => {
        const x = Math.sin(t * c.speedX + c.phase)       * c.ampX;
        const y = Math.sin(t * c.speedY + c.phase + 1.2) * c.ampY;
        c.span.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
      });
      lines.forEach(l => {
        l.segs.forEach((seg, k) => {
          const y = Math.sin(t * l.speed + l.phase + k * 0.25) * l.amp;
          seg.style.transform = `translateY(${y.toFixed(2)}px)`;
        });
      });
      requestAnimationFrame(sway);
    })();
  }

  requestAnimationFrame(update);
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
