## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry — an **NDC ambition/implementation tracker** for 80 countries
benchmarked against Paris 1.5 °C/2 °C pathways. It is a **hybrid**: the *Paris-alignment and
implementation ratings* are hand-curated per-country (Climate Action Tracker-style analyst judgement), and
those ratings then **anchor** otherwise-seeded emissions, targets, and financing figures. So the ordering
is real; the magnitudes are synthetic.

### 7.1 What the module computes

Per country, ratings drive targets and the Paris gap:

```js
parisIdx = PARIS_BASE[name] ?? floor(sr(s)·5)           // 0=1.5C … 4=Crit.Insufficient
implIdx  = IMPL_BASE[name]  ?? floor(sr(s+7)·6)          // 0=A … 5=F
unconditionalTarget = −(10 + parisIdx·5 + sr(s+5)·30)    // % below baseline (worse rating → weaker)
requiredForParis1p5 = baselineEmissions · 0.55           // 45% cut vs baseline
requiredForParis2p0 = baselineEmissions · 0.70           // 30% cut vs baseline
implementationScore = 90 − implIdx·14 + sr(s+8)·10
projections2030     = currentEmissions · (1 − |unconditionalTarget|/100)
```

The **NDC Ambition Gap** (guide's headline) is `projections2030 − requiredForParis1p5` — the difference
between the trajectory implied by the country's NDC and the 1.5 °C-compatible level.

### 7.2 Parameterisation / scoring rubric

| Construct | Basis | Provenance |
|---|---|---|
| `PARIS_BASE` (80 countries) | 0=1.5C … 4=Critically Insufficient | **Hand-curated, CAT-aligned** (Norway/Denmark/Sweden 0; Saudi/Egypt/Nigeria 4) |
| `IMPL_BASE` | 0=A … 5=F implementation grade | Hand-curated |
| `requiredForParis1p5` | baseline × 0.55 | **Real benchmark** — IPCC/UNEP ≈45 % cut by 2030 for 1.5 °C |
| `requiredForParis2p0` | baseline × 0.70 | Real benchmark — ≈30 % cut for 2 °C |
| unconditional/conditional target | −(10 + parisIdx·5 + noise); conditional deeper | Rating-anchored + seeded |
| baselineEmissions | `50 + sr(s+3)·3000` MtCO₂ | Synthetic |
| financingGap | `10 + sr(s+9)·500` $Bn | Synthetic |
| `SECTOR_TREND` | Energy 18,000 +200/yr, Transport 8,000 … | Hand-authored trend + `sr()` jitter |

The `parisAlignmentRating` (1.5C / 2C / NDC / Insufficient / Critically Insufficient) directly mirrors the
**Climate Action Tracker** five-category rating scheme, and the per-country base values reflect real CAT
assessments (e.g. Gulf states Critically Insufficient, Nordics 1.5 °C-compatible).

### 7.3 Calculation walkthrough

1. `COUNTRIES` builds each record: rating indices from the hand-curated bases (seeded fallback only for
   countries absent from the base maps), then rating-anchored targets and seeded emissions/financing.
2. `histEmissions` (2010–2023) is a seeded trajectory around `currentEmissions`.
3. Views: rating distribution, required-vs-projected gap (first 20 countries), sectoral bars, grade
   distribution, financing-gap ranking (top 12), alignment ranking (top 20 by implementation), G20 focus.

### 7.4 Worked example (Saudi Arabia)

`PARIS_BASE['Saudi Arabia'] = 4` (Critically Insufficient), `IMPL_BASE = 3`. With `baselineEmissions ≈
600 MtCO₂`:

| Metric | Computation | Result |
|---|---|---|
| unconditional target | `−(10 + 4·5 + sr·30)` ≈ | ≈ −35 % (weak, as rating implies) |
| required for 1.5 °C | `600 · 0.55` | 330 MtCO₂ |
| required for 2 °C | `600 · 0.70` | 420 MtCO₂ |
| implementation score | `90 − 3·14 + sr·10` ≈ | ≈ 53 (grade D) |
| rating | `PARIS_RATINGS[4]` | **Critically Insufficient** |

The weak unconditional target (−35 %) leaves `projections2030` well above the 330 MtCO₂ 1.5 °C requirement
— a large positive ambition gap, correctly reflecting Saudi Arabia's CAT rating.

### 7.5 Data provenance & limitations

- **Ratings are hand-curated and CAT-consistent**; emissions magnitudes, baselines, targets, financing
  gaps, and histories are **synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`) but *anchored* to the rating so the
  qualitative story is right even though the numbers are illustrative.
- The 1.5 °C requirement is a flat `baseline·0.55` for every country — real CAT/UNEP allocations differ by
  country responsibility, capability, and sector, not a uniform 45 % cut.
- No live UNFCCC NDC registry ingestion; NDC year/baseline year are seeded categorical draws.

**Framework alignment:** **Climate Action Tracker** — the five-category Paris-alignment rating scheme is
reproduced and per-country bases match CAT assessments. **UNEP Emissions Gap Report** — the ambition-gap
concept (`projected − 1.5 °C-required`) and the ≈45 %/30 % 2030 reduction benchmarks are correct.
**UNFCCC NDC registry / WRI Climate Watch** — named as the intended live sources.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Ratings are hand-set and emissions are seeded.
Below is the production NDC-alignment model.

### 8.1 Purpose & scope
Quantify each country's NDC ambition gap vs a fair 1.5 °C/2 °C pathway and score implementation credibility,
from live NDC and emissions data, for sovereign transition-risk and policy analysis.

### 8.2 Conceptual approach
Parse NDC targets, project the implied 2030 trajectory, and compare to a **fair-share national carbon
budget** (effort-sharing: responsibility + capability, per the Climate Equity Reference / CAT allocation).
Benchmarks: **Climate Action Tracker** (rating logic) and **UNEP EGR** (gap aggregation). Implementation
score from policy-coverage and historical target adherence.

### 8.3 Mathematical specification
`AmbitionGap_c = E_proj_c(2030 | NDC) − E_required_c(2030 | 1.5°C)`. `E_required_c` from a national budget
`B_c` allocated by effort-sharing weights `α_c` (grandfathering, capability, responsibility blend) applied
to the global 1.5 °C budget. `E_proj_c` = baseline × (1 − target%), conditional/unconditional split.
Implementation `I_c = Σ_k w_k·coverage_k` over policy domains, discounted by historical
(actual/target) adherence ratio. Rating = bucket of `AmbitionGap_c / E_baseline_c` combined with `I_c`.

| Parameter | Source |
|---|---|
| NDC targets | UNFCCC NDC registry |
| Historical emissions | Climate Watch / EDGAR / IEA |
| Global 1.5 °C budget | IPCC AR6 SPM |
| Effort-share weights α | Climate Equity Reference Project |
| Policy coverage | CAT policy database |

### 8.4 Data requirements
UNFCCC NDC submissions, Climate Watch emissions, IEA energy data, CAT policy assessments. Platform has
hand-curated CAT-style ratings as a starting spine; the gap is live ingestion.

### 8.5 Validation & benchmarking plan
Reconcile ratings against published CAT country ratings; aggregate ambition gap against UNEP EGR global gap
(~23 GtCO₂e 2030); backtest implementation scores against realised policy delivery.

### 8.6 Limitations & model risk
Effort-sharing allocation is ethically contested (choice of α drives results); NDC conditionality and
LULUCF accounting are hard to compare. Conservative fallback: report a range of fair-share allocations and
flag conditional-target dependence.
