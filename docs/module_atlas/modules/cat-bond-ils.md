# CAT Bond & ILS Analytics
**Module ID:** `cat-bond-ils` · **Route:** `/cat-bond-ils` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Catastrophe bond pricing, ILS (Insurance-Linked Securities) portfolio analytics, and parametric trigger design covering hurricane, earthquake, flood, and wildfire perils. Models expected loss, attachment/exhaustion probabilities, and spread-to-risk ratios. Integrates RMS/AIR loss exceedance probability curves and tracks secondary market price movements.

> **Business value:** CAT bonds and ILS provide institutional investors with non-correlated yield in low-rate environments while transferring catastrophic weather risk from insurers to capital markets. Climate change is increasing hurricane intensification and wildfire frequency, requiring investors to apply climate-adjusted loss distributions rather than historical average to correctly price expected loss and attachment probability.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAT_BONDS`, `Kpi`, `LOSS_EVENTS`, `MARKET_SIZE`, `PERILS`, `PERIL_PIE`, `PIE_COLORS`, `RATINGS`, `RATING_COLORS`, `RatingBadge`, `SPREAD_CURVE`, `Section`, `StatusBadge`, `TRIGGER_TYPES`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFixed(d)}`;` |
| `pct` | `(n) => `${(n * 100).toFixed(2)}%`;` |
| `PERILS` | `['Multi-Peril', 'US Wind', 'EU Windstorm', 'Japan EQ', 'US EQ', 'Flood', 'Wildfire'];` |
| `RATINGS` | `['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'NR'];` |
| `RATING_COLORS` | `{ 'BB+': '#059669', 'BB': '#0f766e', 'BB-': '#0369a1', 'B+': '#b45309', 'B': T.orange, 'B-': T.red, 'NR': T.gray };` |
| `issueYear` | `2021 + Math.floor(sr(i * 3) * 4);` |
| `tenor` | `3 + Math.floor(sr(i * 7) * 2);` |
| `attachment` | `0.02 + sr(i * 11) * 0.06;` |
| `exhaustion` | `attachment + 0.03 + sr(i * 13) * 0.05;` |
| `eloss` | `(exhaustion - attachment) * (0.15 + sr(i * 17) * 0.35); // EL as fraction of layer thickness, not attachment trigger (actuarially correct)` |
| `spread` | `eloss * (2.5 + sr(i * 19) * 2.0);` |
| `SPREAD_CURVE` | `[1, 2, 3, 4, 5].map((tenor, i) => ({` |
| `PERIL_PIE` | `PERILS.map((p, i) => ({` |
| `totalOutstanding` | `Math.round(62.4 * 1e9);` |
| `totalIssuance2024` | `Math.round(17.8 * 1e9);` |
| `avgSpread` | `activeBonds.length ? activeBonds.reduce((a, b) => a + parseFloat(b.spread), 0) / activeBonds.length : 0;` |
| `avgMultiple` | `activeBonds.length ? activeBonds.reduce((a, b) => a + parseFloat(b.multipleOfEL), 0) / activeBonds.length : 0;` |
| `attach` | `attachInput / 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOSS_EVENTS`, `PERILS`, `PIE_COLORS`, `RATINGS`, `SPREAD_CURVE`, `TABS`, `TRIGGER_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Expected Loss (EL) | `Σ P(Loss_i) × Loss_i` | RMS/AIR cat model | Probability-weighted average annual loss as percentage of notional; drives CAT bond pricing |
| Attachment Probability | `P(loss > attachment point)` | Catastrophe model | Probability that losses breach the lower trigger threshold, activating partial payout |
| Spread Multiple (multiple-of-EL) | `Spread / EL` | Artemis ILS market | Market-implied risk premium above expected loss; reflects investor risk appetite and supply/demand |
- **RMS/AIR catastrophe model outputs (LEP curves)** → Compute EL from LEP; calibrate attachment/exhaustion probabilities; price risk spread → **Expected loss, spread, and probability metrics per CAT bond tranche**
- **Artemis ILS market data (secondary prices, new issuance)** → Track spread multiple vs EL; monitor secondary price movements → **ILS portfolio mark-to-market and spread-to-risk ratio analytics**

## 5 · Intermediate Transformation Logic
**Methodology:** Loss exceedance probability pricing model
**Headline formula:** `Expected_loss = Σ_i P(Loss_i) × Loss_i; Spread = Risk_spread + Margin; Risk_spread ≈ EL × (1+loading_factor)`
**Standards:** ['RMS/AIR CAT model outputs', 'Artemis ILS Market Data', 'IAIS Insurance Capital Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).