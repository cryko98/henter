/* HENTER BODEN — $HENTER */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     LIVE DATA CONFIG

     Paste the contract address below once the token is deployed and the
     price and percentage on the card switch from placeholder numbers to
     real market data (GeckoTerminal onchain API, no key needed).

     token : the $HENTER contract address on Robinhood Chain
     pool  : optional. Leave empty and the deepest pool is picked
             automatically. Set it to pin one specific pair.

     While token is empty, or if the API is unreachable, the card keeps
     the placeholder numbers and labels itself PREVIEW.
  ------------------------------------------------------------------ */
  var CONFIG = {
    network: 'robinhood',
    token: '',
    pool: '',
    refreshMs: 45000
  };

  var API = 'https://api.geckoterminal.com/api/v2';

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

  /* ---------- price card ---------- */
  var priceEl = document.getElementById('price');
  var deltaEl = document.getElementById('delta');
  var badgeEl = document.querySelector('.tk-badge');
  var poolAddress = '';

  function formatPrice(n) {
    if (!isFinite(n) || n <= 0) return '$0.00';
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(4);
    /* tiny numbers: keep four significant digits */
    var decimals = Math.min(18, Math.abs(Math.floor(Math.log10(n))) + 4);
    return '$' + n.toFixed(decimals);
  }

  function formatPct(n) {
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }

  function setBadge(text) {
    if (badgeEl) badgeEl.textContent = text;
  }

  function setDelta(pct, label) {
    if (!deltaEl) return;
    var span = deltaEl.querySelector('span');
    var em = deltaEl.querySelector('em');
    var arrow = deltaEl.querySelector('svg path');
    if (span) span.textContent = formatPct(pct);
    if (em && label) em.textContent = label;
    deltaEl.classList.toggle('up', pct >= 0);
    deltaEl.classList.toggle('down', pct < 0);
    if (arrow) {
      arrow.setAttribute(
        'd',
        pct >= 0 ? 'M12 19V5M12 5l-6 6M12 5l6 6' : 'M12 5v14M12 19l-6-6M12 19l6-6'
      );
    }
  }

  /* placeholder flicker until a real pool is wired up */
  var demoTimer = setInterval(function () {
    if (!priceEl || poolAddress) return;
    var next = 0.04206 * (1 + (Math.random() - 0.45) * 0.02);
    priceEl.textContent = '$' + next.toFixed(5);
  }, 2600);

  function api(path) {
    return fetch(API + path, { headers: { accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  function resolvePool() {
    if (CONFIG.pool) return Promise.resolve(CONFIG.pool);
    return api('/networks/' + CONFIG.network + '/tokens/' + CONFIG.token + '/pools')
      .then(function (res) {
        var pools = (res && res.data) || [];
        if (!pools.length) throw new Error('no pools for this token yet');
        pools.sort(function (a, b) {
          return parseFloat(b.attributes.reserve_in_usd || 0) -
                 parseFloat(a.attributes.reserve_in_usd || 0);
        });
        /* ids come back as "network_address" */
        var attr = pools[0].attributes || {};
        return attr.address || String(pools[0].id).split('_').pop();
      });
  }

  function loadStats() {
    return api('/networks/' + CONFIG.network + '/pools/' + poolAddress)
      .then(function (res) {
        var a = (res && res.data && res.data.attributes) || {};
        var price = parseFloat(a.base_token_price_usd);
        if (priceEl && isFinite(price)) priceEl.textContent = formatPrice(price);

        var h24 = a.price_change_percentage && parseFloat(a.price_change_percentage.h24);
        if (isFinite(h24)) setDelta(h24, 'Last 24h');
      });
  }

  function goLive() {
    if (!CONFIG.token) return;

    resolvePool()
      .then(function (addr) {
        poolAddress = addr;
        clearInterval(demoTimer);
        setBadge('LIVE');
        return loadStats();
      })
      .then(function () {
        setInterval(function () {
          loadStats().catch(function () {});
        }, CONFIG.refreshMs);
      })
      .catch(function (err) {
        /* no pool yet, rate limited, offline: keep the placeholder numbers */
        setBadge('PREVIEW');
        if (window.console) console.warn('[henter] live data unavailable:', err.message);
      });
  }

  setBadge(CONFIG.token ? 'LIVE' : 'PREVIEW');
  goLive();

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
