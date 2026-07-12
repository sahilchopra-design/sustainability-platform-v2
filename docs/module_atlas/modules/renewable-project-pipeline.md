# Renewable Project Pipeline Analytics
**Module ID:** `renewable-project-pipeline` · **Route:** `/renewable-project-pipeline` · **Tier:** B (frontend-computed) · **EP code:** EP-DO3 · **Sprint:** DO

## 1 · Overview
Tracks and analyses the global pipeline of renewable energy projects from development through construction to operation. Models permitting timelines, development risk, auction outcomes, and portfolio construction for renewable energy investors targeting diversified geographic and technology exposure.

> **Business value:** Essential for renewable energy funds building development pipelines, investment banks advising on RE M&A, and corporate RE procurement teams planning PPA strategy. Provides portfolio construction analytics optimising geographic and technology diversification.

**How an analyst works this module:**
- Browse global renewable project pipeline by technology/region
- Filter by development stage and capacity
- Apply success probability by jurisdiction and stage
- Model portfolio construction for geographic diversification
- Generate auction calendar and bid strategy analysis

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `GRID_RISKS`, `KpiCard`, `MiniBar`, `PROJECTS`, `REGIONS`, `STAGES`, `TABS`, `TECHNOLOGIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Concept','Scoping','ESIA','Planning Application','Consent Granted','Shovel-Ready','Construction','Operational'];` |
| `tech` | `TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];` |
| `stage` | `STAGES[Math.floor(sr(i*11+2)*STAGES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];` |
| `gridRisk` | `GRID_RISKS[Math.floor(sr(i*17+4)*GRID_RISKS.length)];` |
| `capacityMw` | `Math.round(10 + sr(i*19+5)*990);` |
| `permitMonths` | `Math.round(6 + sr(i*23+6)*42);` |
| `gridConnMonths` | `Math.round(3 + sr(i*29+7)*36);` |
| `codYear` | `2025 + Math.floor(sr(i*31+8)*6);` |
| `capex` | `parseFloat((0.5 + sr(i*37+9)*4.5).toFixed(2));` |
| `permittingRisk` | `parseFloat((10 + sr(i*41+1)*85).toFixed(0));` |
| `gridCapacity` | `parseFloat((60 + sr(i*43+2)*40).toFixed(0));` |
| `envScore` | `parseFloat((40 + sr(i*47+3)*55).toFixed(0));` |
| `probability` | `parseFloat((20 + sr(i*53+4)*75).toFixed(0));` |
| `developerExp` | `Math.round(1 + sr(i*59+5)*9);` |
| `totalMw` | `filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgPermit` | `filtered.reduce((s, p) => s + p.permitMonths, 0) / n;` |
| `avgGrid` | `filtered.reduce((s, p) => s + p.gridConnMonths, 0) / n;` |
| `expectedMw` | `filtered.reduce((s, p) => s + p.capacityMw * p.probability / 100, 0);` |
| `byTech` | `TECHNOLOGIES.map(t => {` |
| `stageFlow` | `STAGES.map(s => ({ stage: s, count: PROJECTS.filter(p => p.stage === s).length, mw: PROJECTS.filter(p => p.stage === s).reduce((ss, p) => ss + p.capacityMw, 0) }));` |
| `avgPR` | `arr.length ? arr.reduce((s,p)=>s+p.permittingRisk,0)/arr.length : 0;` |
| `times` | `[...arr.map(p=>p.permitMonths)].sort((a,b)=>a-b);` |
| `p50` | `times[Math.floor(times.length*0.5)] \|\| 0;` |
| `p90` | `times[Math.floor(times.length*0.9)] \|\| 0;` |
| `mwRisk` | `PROJECTS.filter(p => p.gridRisk === risk).reduce((s, p) => s + p.capacityMw, 0);` |
| `cumMw` | `PROJECTS.filter(p => p.tech === tech).reduce((s, p) => s + p.capacityMw, 0) / 1000;` |
| `avgProb` | `arr.reduce((s,p)=>s+p.probability,0)/n2;` |
| `totalMw2` | `arr.reduce((s,p)=>s+p.capacityMw,0);` |
| `expMw` | `arr.reduce((s,p)=>s+p.capacityMw*p.probability/100,0);` |
| `stageMap` | `STAGES.reduce((acc, s) => { acc[s] = arr.filter(p=>p.stage===s).length; return acc; }, {});` |
| `avgPermit2` | `arr.reduce((s,p)=>s+p.permitMonths,0)/n2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRID_RISKS`, `REGIONS`, `STAGES`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global RE Pipeline | — | BloombergNEF H1 2024 | Total renewable energy projects under development globally — solar 60%, wind 30%, storage 10% |
| Permitting Timeline | — | WindEurope/SolarPower Europe 2023 | Average permitting timeline for large renewable projects in Europe — key bottleneck vs demand |
| Development Success Rate | — | BloombergNEF Project Finance 2023 | Only 30–50% of projects that enter development pipeline reach Final Investment Decision |
- **Project pipeline databases (BloombergNEF, Wood Mac)** → Pipeline analysis → **Pipeline by stage, technology, capacity, and geography**
- **Auction results and PPA price data** → Market pricing → **Cleared auction prices and PPA terms by jurisdiction**
- **Permitting timeline data by jurisdiction** → Development risk → **Stage probabilities and expected timeline by country and technology**

## 5 · Intermediate Transformation Logic
**Methodology:** Pipeline Risk-Adjusted Return
**Headline formula:** `PipelineEV = Σ [ProjectNPV_i × P(success_i) × DevelopmentDiscount_i]; P(success) = f(permitting_stage, jurisdiction, technology, developer_track_record)`

Expected value weights project NPV by probability of successful development — function of stage, jurisdiction risk, and technology maturity; development stage discount reflects illiquidity premium

**Standards:** ['BloombergNEF Renewable Pipeline Database', 'IEA Renewable Energy Progress Tracker', 'IRENA World Energy Transitions Outlook 2024', 'Wood Mackenzie Power & Renewables Pipeline']
**Reference documents:** BloombergNEF — Renewable Energy Pipeline and Project Finance 2024; IEA Renewable Energy Market Update 2024; IRENA World Energy Transitions Outlook 2024; Wood Mackenzie Power and Renewables H1 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `PipelineEV = Σ
> [ProjectNPV_i × P(success_i) × DevelopmentDiscount_i]` with `P(success) = f(permitting_stage,
> jurisdiction, technology, developer_track_record)`. **Neither term exists in the code.** There is
> no NPV calculation anywhere in the module (`grep NPV` returns nothing), and `probability` is an
> **independent seeded draw** (`20 + sr(i×53+4)×75`) with no functional dependency on stage,
> region, technology, or `developerExp` — despite `developerExp` being generated as a per-project
> field, it is never read anywhere else in the file. What the code actually computes is a simple
> **capacity-weighted expected MW** (§7.1), not a risk-adjusted NPV pipeline value.

### 7.1 What the module computes

80 synthetic projects across 6 technologies, 8 development stages, 6 regions, and 4 grid-risk
tiers. The only portfolio-level "expected value" metric is capacity, not currency:

```
expectedMw = Σ (capacityMw_i × probability_i / 100)     // MW-weighted, not $-weighted
avgPermit  = Σ permitMonths_i / n
avgGrid    = Σ gridConnMonths_i / n
```

Each project independently carries `capacityMw` (10–1,000 MW), `permitMonths` (6–48), `capex`
($0.5–5.0M/MW implied by `0.5+sr()×4.5`), `permittingRisk` (10–95), `gridCapacity` (60–100),
`envScore` (40–95), and `probability` (20–95%) — all drawn from independent PRNG seeds, i.e.
uncorrelated with each other and with `stage`.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `capacityMw` | 10–1,000 MW | Synthetic demo |
| `permitMonths` | 6–48 months | Synthetic demo; loosely brackets the guide's cited 3–7yr (36–84mo) EU utility-scale permitting benchmark but the code's ceiling (48mo) undershoots it |
| `gridConnMonths` | 3–39 months | Synthetic demo |
| `capex` | $0.5–5.0M/MW | Synthetic demo |
| `permittingRisk` | 10–95 | Synthetic demo, unrelated to `permitMonths` or `stage` |
| `probability` | 20–95% | Synthetic demo; **not** a function of stage/jurisdiction/tech as the guide claims |
| `developerExp` | 1–10 (years) | Generated but never consumed by any downstream calculation — dead field |
| STAGES | 8-stage pipeline (Concept → Operational) | Standard renewable project development lifecycle taxonomy |

### 7.3 Calculation walkthrough

1. `PROJECTS` (80 rows) built once at module load via `sr(i×k+c)` seeds — stable across renders,
   identical every session.
2. Tab filters (`techFilter`, `stageFilter`, `regionFilter`) subset `PROJECTS` into `filtered`;
   all KPI aggregates (`totalMw`, `avgPermit`, `avgGrid`, `expectedMw`, `highRiskCount`,
   `gridCritical`) recompute over the filtered set with no probability-weighting logic beyond the
   simple `capacityMw × probability/100` product above.
3. `byTech` and `stageFlow` are `TECHNOLOGIES`/`STAGES`-indexed group-bys of the **full unfiltered**
   `PROJECTS` array (independent of the tab filters), each reporting count, MW, and mean
   `probability`.
4. Permitting-timeline percentiles (`p50`, `p90`) are computed per grid-risk or per-stage subgroup
   by sorting `permitMonths` and indexing `Math.floor(times.length × 0.5 / 0.9)`.

### 7.4 Worked example

Filter to `Wind Onshore` with (illustrative) 13 matching projects, `Σ capacityMw = 4,850 MW`,
mean `probability ≈ 58%`. Then:
```
expectedMw = Σ capacityMw_i × probability_i/100
           ≈ 4,850 × 0.58                     (using the mean as an approximation)
           ≈ 2,813 MW
```
This "expected" 2,813 MW is a **capacity-probability blend**, not a risk-adjusted capital value —
it cannot be compared to `capex` or discounted to a $ figure, because no NPV or discount-rate logic
exists in the module.

### 7.5 Companion analytics

- **Stage funnel** (`stageFlow`) — count and MW by development stage across all 80 projects,
  giving a pipeline-conversion view (Concept → Operational) without applying stage-specific
  success probabilities.
- **Permitting risk view** — mean `permittingRisk` and P50/P90 `permitMonths` grouped by grid-risk
  tier; flags projects with `permittingRisk > 70` as `highRiskCount`.
- **Regional/technology cuts** — MW and count cross-tabs; no correlation is enforced between
  region and permitting timeline despite the guide's claim that jurisdiction drives success
  probability.

### 7.6 Data provenance & limitations

- All 80 projects are synthetic (`sr()` PRNG), generated once at load and stable across sessions.
- **No NPV, discount rate, or capital-value calculation exists** despite the guide's `PipelineEV`
  formula — the only "expected" output is an MW quantity, not a dollar figure. A user reading the
  guide would expect a risk-adjusted pipeline valuation; the page cannot produce one.
- `probability` and `developerExp` are decorative fields with no causal link to `stage`,
  `permittingRisk`, or `region`, contrary to the guide's stated dependency function.
- `permitMonths` ceiling (48mo/4yr) is shorter than the cited industry benchmark (3–7yr), likely
  because the seed range was set for UI variety rather than calibrated to BloombergNEF/WindEurope
  data.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

#### 8.1 Purpose & scope
Support renewable-fund pipeline valuation and capital-allocation decisions: which stage-gated
projects to fund, and what the risk-adjusted portfolio capacity/value is, given permitting,
grid-connection, and market risk. Scope: single-country and multi-jurisdiction RE development
pipelines, pre-FID through construction.

#### 8.2 Conceptual approach
Adopt a **stage-gate probability-of-success (PoS) model** analogous to pharma/E&P pipeline
valuation, cross-walked to renewables: each development stage carries a base conversion
probability to the next stage, adjusted by jurisdiction permitting-difficulty and developer
track record — mirroring **BloombergNEF's Project Finance PoS-by-stage tables** and **Wood
Mackenzie's probability-weighted pipeline capacity methodology**. Combine with a standard
**risk-adjusted NPV (rNPV)**, the pharma-industry-standard technique for valuing pipelines with
binary stage-gate risk, as used in infrastructure-fund LP reporting (cf. Aladdin Climate's
project-finance risk overlays).

#### 8.3 Mathematical specification

```
P(success_i) = P_base(stage_i) × J(jurisdiction_i) × D(developerExp_i) × T(technology_i)
NPV_i        = Σ_t [CF_t,i / (1+r_i)^t] − Capex_i
rNPV_i       = NPV_i × P(success_i)
PipelineEV   = Σ_i rNPV_i
```
Where `P_base(stage)` is a monotonic increasing function over the 8 stages (e.g. Concept 15%,
Scoping 25%, ESIA 35%, Planning Application 45%, Consent Granted 70%, Shovel-Ready 90%,
Construction 97%, Operational 100%) calibrated to BNEF's observed 30–50% overall Concept→FID
conversion; `J(jurisdiction)` is a 0.7–1.2 multiplier from a permitting-difficulty index (e.g.
World Bank/RE regulatory-indicator score); `D(developerExp)` a 0.9–1.1 multiplier scaling with
years of track record; `r_i` a technology/geography-specific discount rate (WACC).

| Parameter | Calibration source |
|---|---|
| `P_base(stage)` table | BloombergNEF Project Finance PoS benchmarks; internal deal-log backtest |
| `J(jurisdiction)` | World Bank Doing Business / RE-specific permitting indices, IRENA country profiles |
| `r_i` (WACC) | Country + technology risk premia (Damodaran country risk premium tables, IRENA cost of capital survey) |
| `CF_t,i` | Project-level PPA price × capacity factor × capacity (existing platform fields) |

#### 8.4 Data requirements
- Project-level cash-flow schedule (capex draw, PPA price/tenor, opex) — partially present
  (`capex`, implied revenue via other RE modules) but not wired to this page.
- Stage-transition history (time-in-stage, conversion outcome) for PoS calibration — not present;
  would require a deal-tracking table (new migration).
- Jurisdiction permitting-difficulty index — could be seeded from World Bank/IRENA public data via
  the platform's `reference_data` layer.
- Developer track-record database (projects completed, on-time %) — not present.

#### 8.5 Validation & benchmarking plan
Backtest `P_base(stage)` against the platform's own historical project outcomes (stage → FID
conversion) once real deal data exists; sensitivity-test `PipelineEV` to ±20% moves in `J` and `r`;
reconcile aggregate expected capacity against BloombergNEF's published global pipeline-to-FID
conversion rate (30–50%) as an external sanity check.

#### 8.6 Limitations & model risk
PoS tables are inherently subjective absent a large historical sample; jurisdiction and developer
multipliers risk double-counting if not orthogonalised; rNPV assumes independence across projects
and ignores portfolio-level grid-queue congestion effects (a project's PoS can depend on how many
co-located projects are ahead of it in an interconnection queue) — flag as a known simplification
requiring a queue-position covariate in a later model version.

## 9 · Future Evolution

### 9.1 Evolution A — Risk-adjusted pipeline valuation with stage-dependent success probabilities (analytics ladder: rung 1 → 2)

**What.** §7 shows both halves of the guide's formula missing: no NPV exists anywhere (`grep NPV` empty — the only "expected" output is capacity-weighted MW, not currency), and `probability` is an independent seeded draw with no dependence on stage, jurisdiction, technology, or the `developerExp` field that is generated but never read. The permitting-months ceiling (48mo) also undercuts the cited 3–7yr industry benchmark. Evolution A implements `PipelineEV = Σ[NPV_i × P(success_i) × discount_i]` with an honest probability model.

**How.** (1) `P(success)` as a documented stage-ladder base rate (early-development → ready-to-build attrition rates are published in BloombergNEF/WindEurope pipeline studies; cite the bands) with multiplicative adjustments for permitting-risk tier and technology, so the field finally depends on the drivers the guide names — and `developerExp` either enters the model or is removed. (2) Per-project NPV from the platform's existing project-finance machinery: `renewable_project_engine.assess_project()` already computes IRR/NPV/LCOE from capacity, technology, and PPA price — call it rather than rebuilding; development-stage discounts applied on top. (3) `POST /api/v1/re-pipeline/valuation` returning MW-weighted and $-weighted pipeline views with per-project decomposition. (4) Permitting-month distributions recalibrated to the cited 3–7yr benchmark per region, source stamped.

**Prerequisites.** Stage-attrition sourcing pass; engine-call plumbing for NPV. **Acceptance:** moving a project from "consented" to "early development" reduces its P(success) per the documented ladder; pipeline EV is a currency figure that reproduces from per-project NPV × P × discount; permit-month ranges match the cited benchmark bands.

### 9.2 Evolution B — Pipeline-triage copilot for origination teams (LLM tier 2)

**What.** Development-pipeline management is portfolio triage: "which late-stage projects carry the highest EV-at-risk from grid-connection delays?", "compare our Iberian solar cluster's risk-adjusted value against the Nordic wind cluster", "draft the quarterly pipeline report — EV bridge from last quarter, stage migrations, biggest probability movers". The copilot runs these as valuation-endpoint tool calls plus stage-history queries.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; the EV bridge (this quarter vs last) requires stage-transition history, which the persisted pipeline register provides via timestamped stage changes — the copilot narrates *why* EV moved (stage migration vs assumption change), a decomposition the endpoint exposes. Guardrails: probability bands are quoted with their source citation; the copilot does not forecast auction outcomes or permit decisions (it reports the model's base rates and flags projects deviating from them); cluster comparisons are computed aggregations. Report drafts render through report studio with the model-assumption annexe.

**Prerequisites (hard).** Evolution A's valuation model and a persisted register with stage history — triaging seeded probabilities would misdirect real origination effort. **Acceptance:** the EV bridge's components sum to the observed delta; every probability quoted matches the model's ladder for that project's attributes; assumption-change effects are separated from stage-migration effects.