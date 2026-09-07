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

  /* ------------------------------------------------------------------
     LIVE MARKET NUMBERS

     Everything in the market row comes from the Dexscreener pair for the
     $HENTER contract. If the request fails the row simply stays hidden:
     nothing on this page ever shows a made up price.
  ------------------------------------------------------------------ */
  var TOKEN = '0xDC1bebBE6699242e0fD33E5B8ce2D369e582466a';
  var CHAIN = 'robinhood';
  var REFRESH_MS = 45000;

  var market = document.getElementById('market');

  function fmtUsd(n) {
    if (!isFinite(n) || n <= 0) return null;
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + n.toFixed(0);
  }

  function fmtPrice(n) {
    if (!isFinite(n) || n <= 0) return null;
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(4);
    /* keep four significant digits on the small ones */
    return '$' + n.toFixed(Math.min(18, Math.abs(Math.floor(Math.log10(n))) + 4)).replace(/0+$/, '');
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function loadMarket() {
    if (!market) return Promise.resolve();

    return fetch('https://api.dexscreener.com/latest/dex/tokens/' + TOKEN)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var pairs = (data && data.pairs) || [];
        /* deepest pool on the right chain wins */
        var pair = pairs
          .filter(function (p) { return p.chainId === CHAIN; })
          .sort(function (a, b) {
            return ((b.liquidity && b.liquidity.usd) || 0) -
                   ((a.liquidity && a.liquidity.usd) || 0);
          })[0];

        if (!pair) throw new Error('no pair on ' + CHAIN + ' yet');

        setText('mPrice', fmtPrice(parseFloat(pair.priceUsd)));
        setText('mCap', fmtUsd(pair.marketCap || pair.fdv));
        setText('mLiq', fmtUsd(pair.liquidity && pair.liquidity.usd));

        var change = pair.priceChange && parseFloat(pair.priceChange.h24);
        var tile = document.getElementById('mChangeTile');
        if (isFinite(change)) {
          setText('mChange', (change >= 0 ? '+' : '') + change.toFixed(2) + '%');
          if (tile) {
            tile.classList.toggle('up', change >= 0);
            tile.classList.toggle('down', change < 0);
          }
        }

        market.hidden = false;
      })
      .catch(function (err) {
        if (window.console) console.warn('[henter] market data unavailable:', err.message);
      });
  }

  loadMarket();
  setInterval(loadMarket, REFRESH_MS);

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
