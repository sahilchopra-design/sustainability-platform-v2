## 7 · Methodology Deep Dive

The Geopolitical-Transition Risk Nexus (EP-CV5) blends a country's *transition-readiness*
score with its *geopolitical* score into a single "combined" ranking, then layers a fossil-state
screen and a policy-reversal scenario table on top. Everything runs on a hand-curated 25-country
seed table; there is no backend engine and no PRNG — the numbers are fixed synthetic demo values.

### 7.1 What the module computes

The one load-bearing formula is the weighted blend (JSX line 65):

```js
const w = geoWeight / 100;                                   // slider, default 0.15
const score = Math.round((1 - w) * c.transition + w * (100 - c.geopolitical));
combined = max(0, min(100, score));
```

Note the sign convention: `transition` is *higher = better* (more transition-ready), and
`geopolitical` is *higher = more stable*, so the blend uses `(100 − geopolitical)` — i.e. it
converts stability into a *risk* contribution before mixing. Higher combined = better positioned.

Two derived series:

```js
FOSSIL_STATES = COUNTRIES.filter(c => c.fossil_rev_pct > 30)
                         .sort((a,b) => b.fossil_rev_pct - a.fossil_rev_pct);
highBothRisk  = combined.filter(c => c.transition < 40 && c.geopolitical < 40);
wRisk         = +(c.portfolio_exp * (100 - c.combined) / 100).toFixed(2);   // portfolio overlay
```

`wRisk` re-reads combined as a risk (100 − combined) and scales it by portfolio exposure %,
producing an exposure-weighted risk contribution per country.

### 7.2 Parameterisation

| Field | Range in seed | Meaning | Provenance |
|---|---|---|---|
| `transition` | 5–82 | Transition-readiness (0–100) | Synthetic; guide cites TPI / NGFS as intended anchors |
| `geopolitical` | 4–94 | Political-stability score (0–100) | Synthetic; guide cites World Bank WGI / V-Dem |
| `fossil_rev_pct` | 1–95 | Fossil revenue as % of exports/GDP | Synthetic demo value |
| `portfolio_exp` | 0–22.5 | Portfolio exposure % | Synthetic demo value |
| `geoWeight` (w) | slider 5–50%, default 15% | Geopolitical contribution to blend | User-configurable |

The `POLICY_REVERSALS` table (6 rows) carries `probability` (5–40%), a narrative `impact`, and a
`transition_delta` (−8 to +2 points) applied to a scenario's transition scores.

### 7.3 Calculation walkthrough

1. Slider sets `w`; each country's `combined` is recomputed and the list re-sorted descending.
2. KPI cards read `combined.length`, `highBothRisk.length` (dual low-transition/low-stability
   states), `FOSSIL_STATES.length`, and echo the weight split.
3. Fossil-state tab lists the `fossil_rev_pct > 30` subset — the "stranded-state" candidates whose
   fiscal base is most exposed to a global demand-side transition.
4. Policy-reversal tab applies `transition_delta` to show how a government change reshuffles the
   ranking.

### 7.4 Worked example (Saudi Arabia, default w = 0.15)

`transition = 25`, `geopolitical = 49`, `portfolio_exp = 8.2`, `fossil_rev_pct = 62`.

| Step | Computation | Result |
|---|---|---|
| Geo risk contribution | 100 − 49 | 51 |
| Combined | round(0.85 × 25 + 0.15 × 51) | round(21.25 + 7.65) = **29** |
| wRisk | 8.2 × (100 − 29) / 100 | **5.82** |
| Fossil-state? | 62 > 30 | **Yes** — top of FOSSIL_STATES |

Raise the slider to w = 0.30 and combined becomes round(0.70 × 25 + 0.30 × 51) = round(32.8) = 33 —
Saudi Arabia *improves* because its stability (49) exceeds its transition score (25), so weighting
stability more actually helps it. That inversion is a genuine artefact of the blend and worth
flagging to users.

### 7.5 Data provenance & limitations

- **All 25 country rows are fixed synthetic demo values.** No `sr()` PRNG is used here — the numbers
  are literals, stable but not sourced from WGI/TPI/NGFS despite the on-page "Source:" citation.
- The blend is a linear convex combination with no interaction term: a country cannot be penalised
  for being *both* fossil-dependent *and* unstable beyond what the two additive terms give.
- `transition_delta` is applied as a flat additive shift, not a scenario-conditioned re-derivation.
- Fossil-state screen is a single hard threshold (30%), not a fiscal break-even or reserves-life
  model.

**Framework alignment:** *World Bank WGI* — the geopolitical axis mirrors WGI's political-stability
percentile (WGI aggregates six governance dimensions from ~30 underlying sources into 0–100
percentiles); the module uses a single pre-baked stability score rather than the six sub-indicators.
*NGFS / TPI* — the transition axis is meant to proxy Transition Pathway Initiative management-quality
/ carbon-performance bands and NGFS orderly-vs-disorderly logic, but is implemented as a static
score. *Stranded-nation risk* (IRENA, *Geopolitics of the Energy Transformation*) motivates the
fossil-revenue screen.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays transition,
geopolitical, and combined scores as fixed heuristics with no underlying model.

**8.1 Purpose & scope.** Rank ~25–50 sovereigns on combined transition-plus-geopolitical risk to
guide sovereign/quasi-sovereign allocation and fossil-state stranding risk. Coverage: countries
holding material portfolio exposure plus systemic exporters.

**8.2 Conceptual approach.** Two independently-calibrated composite indices combined by a
supervised weight, benchmarked against (i) **World Bank WGI** percentile construction (unobserved-
components model aggregating multiple sources with source-specific precision) for the geopolitical
axis, and (ii) **Transition Pathway Initiative** carbon-performance alignment plus **NGFS** scenario
GDP-at-risk for the transition axis. The stranding overlay mirrors **IRENA** stranded-nation and
**Carbon Tracker** fossil-fuel-demand analysis.

**8.3 Mathematical specification.**

```
Geo_c    = Σ_k π_k · WGI_{c,k}                       (k = 6 WGI dims, π = precision weights)
Trans_c  = 0.5·TPI_mq_c + 0.5·(1 − GDPatRisk_c)      (0–100 scaled)
Combined_c = (1−w)·Trans_c + w·(100 − Geo_c)
Stranding_c = f · fossilRev%_c + (1−f) · (1 − reservesLifeAdj_c) , with interaction
Risk_c   = Combined_c · (1 + λ · 1[Stranding_c > τ])   (interaction penalty)
```

| Parameter | Value / source |
|---|---|
| π_k (WGI dim precision) | World Bank WGI source-precision weights |
| GDPatRisk_c | NGFS Phase IV "Delayed/Current Policies" GDP loss by region |
| TPI_mq_c | TPI Management Quality band (0–4 → 0–100) |
| w | governance overlay 0.15 (calibrate to historical spread betas) |
| f, λ, τ | stranding blend 0.6, interaction penalty 0.15, threshold 60 |

**8.4 Data requirements.** WGI six-dimension percentiles (World Bank, free); NGFS scenario GDP
paths (free, NGFS portal); TPI company/sovereign bands (free); fossil-revenue share (IMF Article IV,
EITI); reserves life (Rystad/BP Statistical Review). Platform already holds NGFS scenario tables
(migration 088) and `reference_data` OWID energy — reusable for the transition axis.

**8.5 Validation & benchmarking.** Backtest combined rank against realised sovereign CDS spread
changes 2018–2024; reconcile geo axis against WGI released percentiles; stability-test the weight
`w` (spread-beta regression). Benchmark stranding output vs Carbon Tracker fossil-demand scenarios.

**8.6 Limitations & model risk.** Linear blend suppresses tail interactions (handled via the λ
penalty); WGI is annual and lagged; TPI coverage is thin for frontier sovereigns — fallback to
sector-average bands with a data-quality flag.
