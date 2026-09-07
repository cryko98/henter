# HENTER BODEN — $HENTER

Memecoin landing page for **HENTER BODEN**, ticker **$HENTER**, launching on **Robinhood Chain**
(Arbitrum Orbit L2, gas paid in ETH).

Hand drawn comic styling built from the artwork palette: lime `#DAF326`, ink `#101014`,
suit `#1D1E32`, tie `#29416D`, desk `#907B68`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Whole page: hero, price card, lore, tokenomics, how to buy, roadmap, FAQ |
| `styles.css` | Comic look, responsive layout, all colours as CSS variables |
| `script.js` | Copy address, live price, counters, scroll reveal, mobile nav |
| `henter.png` | Logo, favicon and character art |

## Local preview

```
npx --yes serve -l 4321 .
```

Then open http://localhost:4321

## Before launch

- Replace the placeholder contract address (`xxxxx...`) in `index.html` — it appears in the hero,
  the how to buy block and the footer.
- Fill in the real X, Telegram and chart links (currently `href="#"`).
- Update supply, holders and the market stats if they differ.
- Set `CONFIG.token` at the top of `script.js` to the same contract address. The price card
  then pulls the live price and 24h change from the GeckoTerminal API (network `robinhood`)
  every 45 seconds and swaps its PREVIEW badge for LIVE. Until then it shows placeholder numbers.

The site is satire about a fictional cartoon character. Nothing on it is financial advice.
