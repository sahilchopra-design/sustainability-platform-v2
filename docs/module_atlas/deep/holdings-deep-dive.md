## 7 · Methodology Deep Dive

> ✅ **Guide↔code: broadly faithful, with real formulas.** This module computes genuine position-level
> carbon/ESG attribution from actual portfolio holdings (`GLOBAL_COMPANY_MASTER` + user portfolio),
> using the standard PCAF/TCFD intensity and WACI formulas — not seeded data. The guide's
> `ESG_contribution = wᵢ×(ESGᵢ−ESG_port)/ESG_port×100` is a slightly different decomposition than the
> page's primary outputs (WACI contribution, financed-emissions attribution), but the substantive
> methodology is sound. The only `sr()` use is a fallback to *estimate* missing E/S/G pillar scores.

### 7.1 What the module computes

**GHG intensity** (PCAF-style, per $M revenue):
```js
ghgIntensity(h) = ((scope1_mt + scope2_mt) × 1e6) / revenue_usd_mn      // tCO₂e/$M
                  (null if revenue = 0)
```

**Portfolio WACI** (weighted-average carbon intensity, TCFD-recommended):
```js
portfolioWACI = Σ_h ( weight_h/100 × ghgIntensity(h) )                  // over holdings with GI
waciContrib_h = weight_h/100 × ghgIntensity(h)                          // position contribution
pctWACI_h     = waciContrib_h / portfolioWACI × 100                     // % of portfolio WACI
```

**Financed-emissions attribution** (attribution factor `af`):
```js
attrScope12 = af × (scope1_mt + scope2_mt)                              // attributed tCO₂e
pctScope12  = ((scope1_mt+scope2_mt)/portfolioTotalScope12) × 100       // share of portfolio emissions
```

**Temperature bucketing** (implied-temperature proxy from carbon intensity):
```js
tempBucket: <50 "<1.5°C aligned" | <150 "1.5–2°C" | <400 "2–3°C" | <800 "3–4°C" | else "4°C+"
```

### 7.2 Parameterisation

The temperature buckets (50 / 150 / 400 / 800 tCO₂e/$M thresholds) are the key rubric — a coarse
mapping of carbon intensity to an implied warming band. Pillar-score fallbacks (used only when
`env_score`/`soc_score`/`gov_score` are absent) apply a seeded jitter around the composite ESG score:
```js
envScore = c.env_score ?? round(esg×0.9 + (sr(esg)×2−1)×5)     // E slightly below composite
socScore = c.soc_score ?? round(esg×1.05 + (sr(esg+500)×2−1)×3)
govScore = c.gov_score ?? round(esg×1.1 − (sr(esg×5)×2−1)×4)
ghgNorm  = gi!==null ? max(0, min(100, 100 − gi/10)) : 50       // radar normalisation
physNorm = physical_risk_score ? (100 − score) : 50
```

### 7.3 Calculation walkthrough

Holdings come from the user's portfolio (props), enriched from `GLOBAL_COMPANY_MASTER` by ticker (real
scope1/scope2/revenue/ESG). The page computes portfolio totals (scope 1, scope 2, WACI) once, then per
selected holding: GHG intensity, WACI contribution and %, attributed emissions and %, temperature
bucket, and a 5-axis radar (GHG intensity, ESG, T-risk, SBTi, data quality). Comparison mode lets the
user select multiple holdings and highlights the best per metric (lower-better for intensity).

### 7.4 Worked example (two holdings, WACI contribution)

Holding A: weight 5%, scope1+2 = 2.0 Mt, revenue $4,000M → GI = 2.0e6×1e6/4000 wait —
GI = (2.0)×1e6/4000 = 500 tCO₂e/$M. Holding B: weight 3%, scope1+2 = 0.3 Mt, revenue $6,000M →
GI = 0.3×1e6/6000 = 50 tCO₂e/$M.

| Holding | weight | GHG intensity | WACI contrib = w×GI |
|---|---|---|---|
| A | 0.05 | 500 | 25.0 |
| B | 0.03 | 50 | 1.5 |

```
portfolioWACI (these two) = 25.0 + 1.5 = 26.5
pctWACI_A = 25.0 / 26.5 × 100 = 94.3%    // A drives the portfolio's carbon intensity
tempBucket_A = 500 → "3–4°C" ;  tempBucket_B = 50 → "1.5–2°C"
```

Holding A, though only 5% of weight, contributes 94% of the WACI and sits in the 3–4 °C bucket — exactly
the concentration insight the module is built to surface.

### 7.5 Data provenance & limitations

- **Real data path.** GHG intensity, WACI and financed-emissions attribution use actual scope1/scope2/
  revenue from `GLOBAL_COMPANY_MASTER` and the user's holdings/weights — not synthetic.
- **Seeded only as fallback.** E/S/G pillar scores are estimated with an `sr()` jitter around the
  composite *only when* the real pillar scores are missing; if present, real scores are used.
- The temperature bucket is a **carbon-intensity proxy**, not an implied-temperature-rise (ITR) model —
  it does not use SBTi/CRREM pathways or a warming-function; it is a threshold map on GI.
- Attribution factor `af` (EVIC-based) is taken as an input; the page does not compute EVIC itself.

### 7.6 Framework alignment

**PCAF Global Standard** — the financed-emissions attribution (`af × scope1+2`) and per-$M carbon
intensity follow PCAF's attribution-factor methodology; data-quality scoring (radar axis) mirrors PCAF's
1–5 DQ scale. **TCFD** — portfolio WACI is the TCFD-recommended carbon metric (Σ weight × intensity).
**SFDR PAI** — position-level scope emissions and intensities feed mandatory PAI indicators (the guide's
use case). **MSCI ESG** — the E/S/G pillar decomposition mirrors MSCI's pillar structure. The implied-
temperature bucket approximates what SBTi/CRREM derive rigorously (aligning a company's intensity
trajectory to a warming pathway) with a static threshold map — a documented simplification.

*(No §8 model spec required: the module's core outputs — WACI, financed-emissions attribution — are
standard PCAF/TCFD formulas computed on real data. The one heuristic (intensity→temperature bucket) is a
transparent threshold map, caveated in §7.5; a production implied-temperature model would live in the
`paris-alignment`/`portfolio-temperature-score` modules, not here.)*
