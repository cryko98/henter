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
