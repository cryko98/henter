# HENTER BODEN LAPTOP — $HENTER

Memecoin landing page for **HENTER BODEN LAPTOP**, ticker **$HENTER**, live on **Robinhood Chain**
(Arbitrum Orbit L2, gas paid in ETH).

Hand drawn comic styling built from the artwork palette: lime `#DAF326`, ink `#101014`,
suit `#1D1E32`, tie `#29416D`, desk `#907B68`.

## Token

- Contract: `0xDC1bebBE6699242e0fD33E5B8ce2D369e582466a`
- Chain: Robinhood Chain, traded against ETH on Uniswap
- Chart: https://dexscreener.com/robinhood/0x00d33cec2506c71a74a24c20f48d62dceb9653752998f1016c6474e814ca6839
- Telegram: https://t.me/henterbodenonrh

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Whole page: hero, market row, lore, tokenomics, how to buy, roadmap, FAQ |
| `styles.css` | Comic look, responsive layout, all colours as CSS variables |
| `script.js` | Live market data, copy address, scroll reveal, mobile nav |
| `henter.png` | Logo, favicon and character art |

## Live data

The market row (price, 24h change, market cap, liquidity) reads the Dexscreener pair for the
contract every 45 seconds. On a failed request the row stays hidden rather than falling back to
placeholder numbers, so the page can never display an invented price. The contract address and
chain id sit at the top of `script.js` as `TOKEN` and `CHAIN`.

## Local preview

```
npx --yes serve -l 4321 .
```

Then open http://localhost:4321

The site is satire about a fictional cartoon character. Nothing on it is financial advice.
