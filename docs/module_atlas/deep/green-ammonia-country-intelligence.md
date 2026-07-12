## 7 · Methodology Deep Dive

### 7.1 What the module computes

21 countries are hand-entered (not procedurally generated) with 10 fields each: announced/
operational NH₃ capacity (Mt/yr), electrolyser pipeline (GW), a qualitative renewable-cost note, and
four 1–5 readiness scores (`portInfraScore`, `waterAvailabilityScore`, `regulatoryScore`,
`offtakeAgreements` count). The page aggregates these directly — there is no weighted composite
"Country Readiness Score" computed anywhere in code, despite the guide naming one.

```js
totalPipeline    = Σ COUNTRIES.announcedCapacity_mt_yr        // 158 Mt/yr across 21 countries
totalOperational = Σ COUNTRIES.operationalCapacity_mt_yr
totalElectrolyser= Σ COUNTRIES.electrolyser_gw_pipeline
```

### 7.2 Parameterisation — provenance of the country table

| Field | Range / example | Provenance |
|---|---|---|
| `announcedCapacity_mt_yr` | 0.3 (Japan) – 35.0 (Australia) | Cited to "IRENA 2023, Hydrogen Council, IEA Hydrogen Projects Database, AHB" in the page banner; figures are plausible order-of-magnitude estimates matching the guide's stated pipeline totals (Australia 35 Mt, Chile 20 Mt, Morocco 15 Mt) |
| `portInfraScore` / `waterAvailabilityScore` / `regulatoryScore` | 1–5 integers | Editorial judgement scores, no cited scoring rubric — e.g. Australia ports=5, water=2 (arid interior), regulatory=5 |
| `keyProjects` | named real developers (NEOM, HIF Haru Oni, EverWind) | Real named projects, used as descriptive text only, not linked to any calculation |

### 7.3 Calculation walkthrough

1. **Country Pipeline Directory** (Tab 0): sorts `filtered` countries by `announcedCapacity_mt_yr`
   descending — a static table, no derived metric beyond the sort.
2. **Radar (drill-down)**: for the selected country, plots five raw/lightly-rescaled fields on a
   0–5 axis: `portInfraScore`, `waterAvailabilityScore`, `regulatoryScore` (used as-is, already
   1–5), plus two *rescaled* fields —
   `Offtake = min(5, offtakeAgreements/3)` and `Pipeline Size = min(5, announcedCapacity/8)` — both
   linear caps chosen so the largest observed values (12 offtake deals, 35 Mt pipeline) land near
   the top of the 0–5 scale (12/3=4.0, 35/8=4.4).
3. **Cost Competitiveness tab** (`costA`/`costB` comparator, referenced in `computed`):
   `cost = 380 + (20 − portInfraScore×2) × 5 + sr(country.length×7) × 80` — this is the **one
   synthetic element** on the page: a baseline $380/t plus a port-infrastructure penalty (worse
   ports add up to $90/t, since `portInfraScore` ranges 1–5) plus a `sr()`-seeded jitter of up to
   $80/t keyed off the country name's character length (not a real cost driver).
4. Region filter and per-region grouping are simple `Array.filter`/`Set` operations.

### 7.4 Worked example

Australia: `portInfraScore=5`, `waterAvailabilityScore=2`, `regulatoryScore=5`,
`offtakeAgreements=12`, `announcedCapacity_mt_yr=35.0`.

| Radar axis | Formula | Value |
|---|---|---|
| Port Infra | raw | 5.0 |
| Water | raw | 2.0 |
| Regulatory | raw | 5.0 |
| Offtake | `min(5, 12/3)` | 4.0 |
| Pipeline Size | `min(5, 35/8)` | 4.375 |

Cost-competitiveness jitter for "Australia" (9 characters): `sr(9×7) = sr(63)`. Illustratively
`sr(63)≈0.42` → jitter `= 0.42×80 = $33.6/t`; port penalty `= (20 − 5×2)×5 = $50/t`; total
`cost ≈ 380 + 50 + 33.6 = $463.6/t` — broadly consistent with the LCOA range shown in the companion
Production Economics module ($400–900/t) but arrived at through an unrelated, simplified formula
rather than the CRF-based LCOA build-up used elsewhere on the platform.

### 7.5 Companion analytics

- **Production Pipeline / Infrastructure Readiness / Policy Environment / Investment Tracker
  tabs** — further slices of the same 21-row static table (bar charts of capacity by country,
  readiness-score bar charts) with no additional derived metrics.

### 7.6 Data provenance & limitations

- Core country table is **static, hand-curated** (not `sr()`-generated) — the numbers are editorial
  estimates attributed to named public sources (IRENA, Hydrogen Council, IEA) but not directly
  traceable to a specific published table.
- The one dynamic calculation (`cost` in the Cost Competitiveness tab) mixes a real driver
  (port-infrastructure score) with a **synthetic PRNG jitter keyed to country-name string length**
  — a modelling artefact, not a market signal; a reviewer should treat this chart as illustrative
  only.
- No weighted "Country Readiness Score" is computed despite being named in the guide's
  `calculationEngine.formula` (`0.30×RE_resource + 0.25×policy + 0.25×infrastructure +
  0.20×financing`); the four readiness sub-scores are displayed individually, never combined.
- No completion-probability weighting is applied to the "Pipeline 2030" figures (guide claims
  "probability-weighted delivery 15–25 Mt/yr" — the displayed `totalPipeline` of 158 Mt/yr is the
  raw, un-derated announced total).

**Framework alignment:** IEA Global Hydrogen Review (pipeline benchmarking), IRENA Green Hydrogen
Geopolitics (readiness framing), BNEF Hydrogen Market Outlook (cost curve context) — named
correctly as data sources for the static tables, but the guide's weighted readiness formula and
probability-weighted pipeline are not implemented; see §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Provide investors, DFIs and offtakers a defensible, decomposable Country Readiness Score for green
ammonia export capacity, plus a probability-weighted (not raw announced) 2030 supply forecast —
both explicitly promised by the guide but absent from the current static-table implementation.

### 8.2 Conceptual approach
A **weighted multi-factor scorecard** (as named in the guide) combined with a **stage-gated
probability-of-delivery model** for pipeline volumes — the same two-stage pattern IEA and BNEF use
in their hydrogen project trackers: (1) score country attractiveness cross-sectionally; (2)
separately discount each *project's* announced capacity by its FID/permitting stage before
aggregating to a country or global total, rather than summing nameplate announcements.

### 8.3 Mathematical specification

```
Readiness(country) = 0.30×RE_resource + 0.25×policy + 0.25×infrastructure + 0.20×financing   [0–100 each]

RE_resource      = f(solar_CUF, wind_CUF)                — from IRENA capacity-factor atlas
policy           = f(subsidy_$/t, offtake_MOU_count, regulatory_score)
infrastructure   = 0.5×portInfraScore/5×100 + 0.5×waterAvailabilityScore/5×100
financing        = f(sovereign_credit_rating, DFI_commitment_$, green_bond_market_depth)

ProbabilityWeightedPipeline(country) = Σ_projects  announcedCapacity_i × StageWeight(stage_i)
   StageWeight: FID=0.90, FEED=0.55, pre-FEED=0.25, Concept/MOU=0.10   (per BNEF stage-gate convention)
```

| Parameter | Calibration source |
|---|---|
| Sub-weights (0.30/0.25/0.25/0.20) | Matches the guide's stated formula; should be re-derived via regression of realised FID rate against these four factors once ≥3 years of project-outcome data exists |
| `StageWeight` by FID/FEED/pre-FEED | BNEF and IEA hydrogen-project trackers both apply comparable stage-gate discount conventions (~70-90% for FID, ~20-30% for pre-FEED); values here are illustrative and should be recalibrated against realised completion rates |
| RE resource CUF | IRENA Renewable Capacity Statistics / Global Solar Atlas (free) |

### 8.4 Data requirements
- **Project-level stage tracking** (FID/FEED/pre-FEED/concept) per announced project — IEA Hydrogen
  Projects Database (free, partial), BNEF Hydrogen Project Tracker (vendor).
- **Sovereign financing indicators** — World Bank sovereign ratings, DFI commitment registries
  (existing `reference_data` World Bank ingestion could anchor this).
- **RE capacity factors** — Global Solar Atlas / Global Wind Atlas (free, World Bank ESMAP).

### 8.5 Validation & benchmarking plan
- **Backtest**: track how many pre-FEED-stage projects from 2023–24 vintage actually reach FID by
  2026; compare realised conversion rate against the assumed `StageWeight` discount.
- **Benchmark reconciliation**: compare `ProbabilityWeightedPipeline` totals against BNEF's own
  probability-weighted hydrogen supply forecasts for the same country set.

### 8.6 Limitations & model risk
- Stage self-reporting by developers is optimistic by construction (sunk-cost bias); the model
  should discount developer-reported stage by an independent verification signal (e.g. financial
  close announcements, EPC contract awards) where available.
- Country-level scores mask sub-national heterogeneity (e.g. Australia's Pilbara vs. Tasmania have
  very different water/grid access) — a production version should score at the project or
  hub level, not purely at country level.
