## 7 · Methodology Deep Dive

This module (EP-CT3) is **methodologically sound and matches its guide**. It uses **hand-set (not seeded)**
line-of-business data and computes genuine risk-attribution, revenue-efficiency, and marginal-contribution
metrics. The `sr()` PRNG is imported but not used for the core LOB figures. No fabricated headline metric
drives the analysis; the only limitation is the small, illustrative dataset.

### 7.1 What the module computes

Per LOB (`lobsEnriched`):

```js
riskContrib = exposure·(100 − score) / Σ_L exposure_L·(100 − score_L) · 100    // % of total risk
revShare    = revenue / TOTAL_REVENUE · 100                                     // % of total revenue
efficiency  = revShare / riskContrib                                            // >1 = efficient
```

The **risk contribution** treats `(100 − score)` as a per-LOB risk intensity and weights it by exposure —
a standard risk-attribution decomposition. **Revenue efficiency** (`revShare/riskContrib`) exceeds 1 when
a LOB earns more revenue share than it consumes risk share (return-on-risk).

**Marginal contribution** (adding `marginalAmount` = $100M to a LOB):
```js
oldPortScore = Σ_L exposure_L·score_L / TOTAL_EXPOSURE                          // exposure-weighted portfolio score
newPortScore = (Σ + marginalAmount·score_L) / (TOTAL_EXPOSURE + marginalAmount) // after injection
```
The difference is the LOB's marginal effect on the portfolio's climate/transition score.

### 7.2 Parameterisation & provenance

| LOB | exposure ($M) | revenue ($M) | score | clients | RWA |
|---|---|---|---|---|---|
| Corporate Banking | 12,400 | 680 | 52 | 180 | 9,200 |
| Investment Banking | 8,200 | 520 | 61 | 45 | 6,100 |
| Wealth Management | 5,800 | 340 | 72 | 2,200 | 2,900 |
| Insurance | 4,200 | 280 | 48 | 120 | 3,800 |
| Transaction Banking | 3,600 | 220 | 68 | 850 | 1,800 |
| Markets | 6,800 | 450 | 58 | 65 | 5,200 |

All figures are **hand-set illustrative values** (not seeded), internally consistent (RWA < exposure,
client counts sensible per business line). The 6 LOBs are the real universal-bank business lines.

### 7.3 Calculation walkthrough

1. `lobsEnriched` computes riskContrib, revShare, efficiency per LOB.
2. `radarData` normalises 6 dimensions (exposure/revenue/score/clients/RWA/efficiency) to a 0–100 radar.
3. `marginalData` recomputes portfolio score under a $100M injection into each LOB.
4. `benchmarkData` and `actions` flag LOBs with score < 60 or efficiency < 1 for remediation.

### 7.4 Worked example (Corporate Banking risk contribution)

Denominator `Σ exposure·(100−score)`:

| LOB | exposure·(100−score) |
|---|---|
| Corporate | 12,400·48 = 595,200 |
| IB | 8,200·39 = 319,800 |
| Wealth | 5,800·28 = 162,400 |
| Insurance | 4,200·52 = 218,400 |
| Transaction | 3,600·32 = 115,200 |
| Markets | 6,800·42 = 285,600 |
| **Σ** | **1,696,600** |

Corporate Banking `riskContrib = 595,200/1,696,600 = 35.1%` of portfolio risk.
`revShare = 680/2,490 = 27.3%`; `efficiency = 27.3/35.1 = 0.78` → **inefficient** (consumes more risk than
it earns), flagging it for the action list. (The guide's headline "Corporate Banking 42% of risk" is
close in spirit; exact value 35.1% under this dataset.)

### 7.5 Data provenance & limitations

- **LOB data is hand-set illustrative** (not `sr()` seeded) — internally consistent but not a real bank's
  book.
- **Risk attribution and efficiency math are genuine** and standard.
- The `(100 − score)` risk intensity is a linear proxy; a production model would use RWA-based or
  economic-capital-based risk weights rather than a 0–100 transition score.
- Only 6 LOBs — illustrative granularity.

**Framework alignment:** The risk-attribution and return-on-risk-share design aligns with **RAROC /
economic-capital allocation** practice and **Basel IV / BCBS 239** risk-data aggregation. The marginal-
contribution analysis mirrors incremental-VaR / marginal-RWA thinking. The method is sound; the only
enhancement is substituting real exposure/RWA/PD data and an economic-capital risk weight for the
transition-score proxy — no new model architecture is required, so no §8 specification is warranted here.
