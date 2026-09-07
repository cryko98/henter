/* HENTER BODEN — $HENTER */
(function () {
  'use strict';

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- copy contract address ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy')).then(
        function () {
          showToast('Contract address copied');
          if (btn.classList.contains('ca-copy')) {
            var label = btn.querySelector('span');
            btn.classList.add('done');
            if (label) label.textContent = 'Copied';
            setTimeout(function () {
              btn.classList.remove('done');
              if (label) label.textContent = 'Copy';
            }, 1800);
          }
        },
        function () {
          showToast('Copy failed, select it manually');
        }
      );
    });
  });

  /* ---------- price chart ---------- */
  var W = 600;
  var H = 240;
  var PAD = 14;

  var line = document.getElementById('chartLine');
  var fill = document.getElementById('chartFill');
  var dot = document.getElementById('chartDot');
  var chart = document.getElementById('chart');

  /* deterministic pseudo random so the chart looks the same on every load */
  function rng(seed) {
    var s = seed;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  function series(seed, points, drift, noise) {
    var rand = rng(seed);
    var out = [];
    var v = 0.5;
    for (var i = 0; i < points; i++) {
      v += (rand() - 0.5) * noise + drift;
      out.push(v);
    }
    return out;
  }

  var DATA = {
    '1D': series(7, 42, 0.006, 0.12),
    '1W': series(21, 54, 0.008, 0.15),
    '1M': series(53, 64, 0.011, 0.17),
    'ALL': series(99, 80, 0.014, 0.14)
  };

  function toPath(values) {
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = max - min || 1;
    var stepX = (W - PAD * 2) / (values.length - 1);
    var pts = values.map(function (v, i) {
      return [
        PAD + i * stepX,
        PAD + (1 - (v - min) / span) * (H - PAD * 2)
      ];
    });

    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i];
      var b = pts[i + 1];
      var cx = (a[0] + b[0]) / 2;
      d += ' C' + cx.toFixed(1) + ' ' + a[1].toFixed(1) +
           ' ' + cx.toFixed(1) + ' ' + b[1].toFixed(1) +
           ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    return { d: d, last: pts[pts.length - 1] };
  }

  function placeDot(last) {
    if (!dot || !chart) return;
    var box = chart.getBoundingClientRect();
    if (!box.width) return;
    dot.style.left = (last[0] / W) * box.width + 'px';
    dot.style.top = (last[1] / H) * box.height + 'px';
  }

  var currentLast = null;

  function drawRange(key) {
    var res = toPath(DATA[key] || DATA.ALL);
    if (line) line.setAttribute('d', res.d);
    if (fill) {
      fill.setAttribute(
        'd',
        res.d + ' L' + (W - PAD) + ' ' + H + ' L' + PAD + ' ' + H + ' Z'
      );
    }
    currentLast = res.last;
    placeDot(res.last);
  }

  drawRange('ALL');
  window.addEventListener('resize', function () {
    if (currentLast) placeDot(currentLast);
  });

  var ranges = document.getElementById('ranges');
  if (ranges) {
    ranges.addEventListener('click', function (e) {
      var btn = e.target.closest('.rg');
      if (!btn) return;
      ranges.querySelectorAll('.rg').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      drawRange(btn.getAttribute('data-range'));
    });
  }

  /* ---------- live price flicker ---------- */
  var priceEl = document.getElementById('price');
  var base = 0.04206;

  if (priceEl) {
    setInterval(function () {
      var next = base * (1 + (Math.random() - 0.45) * 0.02);
      priceEl.textContent = '$' + next.toFixed(5);
    }, 2600);
  }

  /* ---------- counters ---------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-to')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var start = performance.now();
    var dur = 1400;

    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- scroll reveal ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          entry.target.querySelectorAll('.count').forEach(runCounter);
          if (entry.target.classList.contains('count')) runCounter(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(function (el) {
      io.observe(el);
    });
    document.querySelectorAll('.tk-foot .count').forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('in');
    });
    document.querySelectorAll('.count').forEach(runCounter);
  }

  /* ---------- accordion: one open at a time ---------- */
  var items = document.querySelectorAll('.qa');
  items.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      items.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });
})();
