## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes a **Climate-Adjusted Deal Score (CADS)**
> — `CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore` — used to triage deals into
> green-light/amber-watch/red-exclude tiers. **No such composite score, weighting scheme, or triage
> logic exists in the code.** `esgScore` is a single independent random draw per deal
> (`40 + sr(i*41)×55`), never combined with a financial or climate-risk sub-score. The page actually
> implements a **conventional PE fund/deal analytics dashboard**: deal funnel by stage, IRR/MOIC by
> fund, sector allocation, and Public Market Equivalent (PME) benchmarking against Russell 2000 and
> MSCI. Sections below document the code as it behaves; §8 specifies the CADS model the guide
> describes.

### 7.1 What the module computes

```
irr           = 15 + sr(i*19)×25                 // 15–40% synthetic deal IRR
moic           = 1.5 + sr(i*23)×2.5                // 1.5–4.0x synthetic MOIC
ebitda         = ev / (6 + sr(i*13)×6)             // EV/EBITDA multiple 6–12x, inverted for EBITDA
alpha (PME)    = fund.irr − pmeR2k                 // fund IRR minus Russell 2000-equivalent IRR
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `esgScore` | 40–95 | Synthetic demo value; no weighting into any composite |
| `irr`, `moic` | 15–40% / 1.5–4.0× | Synthetic demo value, plausible PE return ranges |
| `pmeR2k`/`pmeMsci` | `fund.irr × (0.7±0.3)` / `(0.65±0.3)` | Synthetic demo value; a crude fraction-of-fund-IRR proxy rather than an actual PME (Kaplan-Schoar) calculation against real index cash flows |
| Fund vintage decay curve | `base = −0.15×e^(−0.3yr) + 0.35×(1−e^(−0.25yr))` | Synthetic demo value: a J-curve-shaped illustrative NAV/return trajectory, standard PE J-curve shape but not fitted to actual fund cash flows |

### 7.3 Calculation walkthrough

1. **Deal generation**: stage, EV, equity check, EBITDA, revenue, IRR, MOIC drawn independently per
   deal via `sr(i*k)` — no cross-field consistency enforcement (e.g. `equity = ev×(0.25+sr×0.35)` is
   internally consistent with EV, but `irr`/`moic` are unrelated to the deal's actual capital
   structure).
2. **Funnel** (`funnelData`): counts deals by `STAGES` — a standard pipeline funnel view (Sourced →
   Screened → LOI → DD → Closed, or similar), a legitimate deal-tracking mechanic.
3. **PME alpha**: `alpha = fund.irr − pmeR2k` compares fund IRR to a synthetic "public market
   equivalent" — this *label* matches a real PE performance-measurement concept (Kaplan-Schoar PME,
   Long-Nickels PME+), but the underlying `pmeR2k` is a scaled fraction of the fund's own IRR
   (`0.7±0.3× fund.irr`), not computed from actual Russell 2000 cash-flow-matched returns — so the
   "alpha" is mechanically guaranteed to look reasonable (bounded near the fund's own IRR) rather
   than reflecting genuine relative performance.
4. **ESG/climate pre-screen**: the only ESG-related field is the standalone `esgScore`; there is no
   sector-exclusion list, no UNGC-violation flag, no climate transition/physical-hazard pre-score
   visible anywhere in the extracted formulas, despite these being explicitly named in the guide's
   `userInteraction` list.

### 7.4 Worked example

A "Closed" deal with `ev=$450M`, seed-drawn `equity=$153M` (34% of EV), `irr=28.4%`, `moic=2.9×`:
these numbers are displayed as-is in the deal table and scatter chart; there is no downstream CADS
computation to trace — the guide's triage step simply does not exist as a calculation.

### 7.5 Data provenance & limitations

- **All deal, fund, and PME data is synthetic demo data**; fund names (`FUNDS`, 5 rows) are
  plausible generic PE fund labels, not real vehicles.
- **The guide's core deliverable (CADS-based deal triage) is entirely absent** — a user cannot
  reproduce green-light/amber/red classification from this page's outputs.
- PME calculation is a labelled placeholder, not a genuine index-matched cash-flow PME.

**Framework alignment:** PRI PE ESG Integration guidance and ILPA ESG Roadmap are cited but not
implemented (no ESG screening logic); EU Taxonomy/SFDR Art.8/9 alignment check is named in the guide
but has no corresponding field in the extracted code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Provide a systematic pre-screen that combines financial attractiveness, ESG quality, and climate
risk into a single triage score at the pipeline stage, before committing full due-diligence
resources — mirrors how infrastructure/PE investors (e.g. Actis, Apollo Sustainable) run climate
pre-screens ahead of IC memo preparation, and parallels MSCI ESG's "controversy + risk" gating logic
used in listed-equity screening, adapted to deal triage.

### 8.2 Conceptual approach
A weighted linear composite over three normalised (0–100) sub-scores, benchmarked against **MSCI
ESG Fund Ratings** methodology (weighted pillar scores with sector-relative normalisation) and
**PRI's PE ESG Integration** staged-diligence framework (screen → assess → monitor).

### 8.3 Mathematical specification

```
FinancialScore  = f(IRR_target, MOIC_target, EV/EBITDA vs sector median)      // 0-100, percentile-ranked vs deal universe
ESGScore        = Σ w_topic × TopicScore_topic   (SASB sector-material topics, see pe-esg-diligence §8)
ClimateRiskScore = 100 − (TransitionExposure×0.5 + PhysicalHazard×0.3 + CarbonIntensityPercentile×0.2)

CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore,   α+β+γ=1
Triage: CADS ≥ 70 → Green-light | 50–70 → Amber-watch | <50 → Red-exclude
```

| Parameter | Calibration source |
|---|---|
| α, β, γ weights | Fund mandate / LPA ESG-integration terms (LP-specific, typically α≈0.5, β≈0.25, γ≈0.25 for generalist funds per PRI PE surveys) |
| TransitionExposure | Sector carbon-intensity percentile vs GICS peers (CDP/Trucost) |
| PhysicalHazard | Asset-location composite hazard score (reuse platform's `physical-hazard-map` engine, §8 spec there) |
| Carbon intensity | tCO₂e/$M revenue vs sector median (SBTi sector pathway) |

### 8.4 Data requirements
Deal financials (IRR/MOIC/multiple targets), target-company sector + asset locations (for climate
score), ESG controversy screen (RepRisk/Sustainalytics), SASB material-topic scores. Financial data
exists in-platform (deal table); ESG/climate inputs require wiring to `pe-esg-diligence` and
`physical-hazard-map`.

### 8.5 Validation & benchmarking plan
Backtest CADS tiering against realised fund IRR outcomes (do Green-light deals outperform
Red-exclude deals that were pursued anyway); benchmark ESG sub-score against Sustainalytics/MSCI
ratings where available for public comparables.

### 8.6 Limitations & model risk
Composite scores can mask a severe single-dimension risk (e.g. a high-IRR deal with a critical ESG
controversy) — recommend a hard override gate (any UNGC violation or severe controversy = automatic
Red-exclude regardless of composite score) rather than relying purely on the linear weighting.
