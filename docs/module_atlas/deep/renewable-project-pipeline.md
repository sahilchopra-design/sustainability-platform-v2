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
