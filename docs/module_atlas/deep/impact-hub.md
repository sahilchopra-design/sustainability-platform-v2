## 7 · Methodology Deep Dive

An **impact-investing hub** dashboard: it enriches each portfolio holding with impact-weighted-account
figures, IRIS+ metric counts, additionality, blended-finance leverage, SDG contribution vectors and an
impact-washing flag count, then aggregates portfolio KPIs. The guide describes an *Impact-Weighted
Return* `IWR = Financial_return + Σ(ImpactKPI × Monetisation × Attribution)`; the code does **not**
compute that — it draws every impact quantity from the seeded PRNG. Flagged below.

> ⚠️ **Guide↔code mismatch flag.** The guide's headline formula `IWR = Financial_return +
> Σ_k(ImpactKPI_k × Monetisation_k × Attribution_k)` (monetised, attribution-discounted impact) is
> **not implemented**. There are no monetisation coefficients and no attribution discount in the code:
> each holding's environmental/employment/product impact ($Mn), additionality score, leverage ratio and
> SDG contributions are independent `seed()` draws. The hub is a synthetic aggregation layer over the
> real sub-modules (impact-weighted-accounts, impact-verification, blended-finance), not a live IWR model.

### 7.1 What the module computes

Per holding, via `enrichHub(company, i)` using `seed(s)=frac(sin(s+1)×10⁴)`:

```js
iwaEnvMn   = round(seed(s·11)·40 − 8)         // −8 … +32 $Mn (env impact, can be negative)
iwaEmplMn  = round(seed(s·13)·25 − 5)
iwaProdMn  = round(seed(s·17)·30 + 2)
iwaTotalMn = iwaEnvMn + iwaEmplMn + iwaProdMn
additionalityScore = round(40 + seed(s·53)·55)        // 40–95
leverageRatio      = round((1 + seed(s·47)·4)·10)/10  // 1.0–5.0× blended-finance leverage
evidenceTier       = min(5, max(1, ceil(seed(s·37)·5)))
impWashFlags       = floor(seed(s·41)·4)              // 0–3 flags
sdgsContrib[j]     = round(seed(s·61+j)·100 · (seed(s·67+j)>0.5 ? 1 : 0))   // sparse SDG vector
```

Portfolio aggregation is weighted by `h.weight`:

```js
tw   = Σ weight ;  wAvg(fn) = Σ fn(h)·weight / tw
totalImpactMn = Σ iwaTotalMn ;  ghgTotal = Σ ghgAvoided ;  totalFlags = Σ impWashFlags
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Range | Provenance |
|---|---|---|
| `iwaEnvMn` | −8 … +32 $Mn | Synthetic (IWA env impact proxy) |
| `additionalityScore` | 40–95 | Synthetic |
| `leverageRatio` | 1.0–5.0× | Synthetic (blended-finance mobilisation) |
| `evidenceTier` | 1–5 | Synthetic (RCT→anecdotal hierarchy label) |
| `impWashFlags` | 0–3 | Synthetic count |
| `sdgsContrib` | 0–100 per SDG, ~50% sparse | Synthetic; `SDGS_17` labels are real |
| `ghgAvoided` | 500–15 500 tCO₂e | Synthetic |

The frameworks referenced (IMP five dimensions, Harvard IWA, IRIS+, blended finance) are real; all
per-holding numbers are PRNG.

### 7.3 Calculation walkthrough

`holdings` = either the user portfolio (from `portfolioRaw`) or the first 40 `GLOBAL_COMPANY_MASTER`
companies, each passed through `enrichHub`. `agg` computes weighted averages of the enriched scores.
Scalar totals (`totalImpactMn`, `envImpactMn`, `ghgTotal`, `benefTotal`, `totalFlags`, `blendedTotal`)
are simple sums. `sdgAgg` sums each holding's `sdgsContrib[sdg.id−1]` across the portfolio to rank SDG
coverage. `iwaComplete` = share of holdings with non-zero IWA total.

### 7.4 Worked example (one holding)

`iwaEnvMn = −5`, `iwaEmplMn = 8`, `iwaProdMn = 12`, `weight = 2.0`, `additionalityScore = 70`,
`leverageRatio = 3.2×`, `blendedMn = 15`:

| Step | Computation | Result |
|---|---|---|
| iwaTotalMn | −5 + 8 + 12 | **$15Mn** net positive impact |
| Contribution to `totalImpactMn` | +15 | |
| Weighted additionality | 70 × 2.0 / tw | into wAvg |
| Mobilised capital | blendedMn × leverageRatio = 15 × 3.2 | **$48Mn** catalysed (concept) |

### 7.5 Data provenance & limitations

- **All impact figures are synthetic** (`seed`), applied over real company names from
  `GLOBAL_COMPANY_MASTER` or the user's uploaded portfolio.
- The guide's **IWR monetisation×attribution model is absent** — no social-cost coefficients, no
  attribution discount. The hub is an aggregation shell wiring together the (also largely synthetic)
  impact sub-modules.
- SDG contributions are a random sparse vector; additionality and leverage are unanchored draws.

**Framework alignment:** IMP *Five Dimensions of Impact* · Harvard *Impact-Weighted Accounts* ·
GIIN *IRIS+* · blended-finance *mobilisation/leverage* (Convergence). All are named and their
taxonomies used for labelling; the quantitative IWR the guide specifies is not implemented — its full
monetisation model is documented in the `impact-weighted-accounts` §8 spec, which this hub would consume.
