# Fossil Fuel Worker Transition Finance
**Module ID:** `fossil-fuel-worker-transition` · **Route:** `/fossil-fuel-worker-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DI1 · **Sprint:** DI

## 1 · Overview
Analyses the financial requirements and investment opportunities in workforce transition from fossil fuel industries. Models retraining costs, pension liability gaps, regional economic multipliers, and just transition fund structures using ILO guidelines and JETP social co-benefit frameworks.

> **Business value:** Essential for coal-region development banks, EU Structural Funds managers, corporate HR directors at fossil fuel companies, and sovereign just transition policy advisors. Provides quantitative cost basis for JTF applications and ILO just transition financing plans.

**How an analyst works this module:**
- Select fossil fuel sector and affected region
- Input workforce size and skill profile
- Calculate per-worker and total transition costs
- Model new green job creation by sector
- Generate ILO just transition framework-aligned finance plan

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `COUNTRY_TRANSITION_DATA`, `FOSSIL_EMPLOYMENT_GLOBAL`, `FOSSIL_REGIONS`, `FUEL_TYPES`, `IEA_CTY`, `IEA_FOSSIL`, `INDIGO`, `PURPLE`, `REGIONS`, `REGION_NAMES`, `RISK_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRY_TRANSITION_DATA` | 7 | `fossil_m`, `clean_m`, `transition_ratio` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Asia-Pacific', 'Europe', 'North America', 'Latin America', 'Middle East', 'Africa'];` |
| `workersEmployed` | `+(5 + sr(i * 7) * 120).toFixed(1);` |
| `projectedJobLoss2030` | `+(workersEmployed * (0.1 + sr(i * 11) * 0.4)).toFixed(1);` |
| `projectedJobLoss2040` | `+(projectedJobLoss2030 * (1.2 + sr(i * 13) * 0.8)).toFixed(1);` |
| `retrainingEligible` | `+(projectedJobLoss2030 * (0.4 + sr(i * 17) * 0.5)).toFixed(1);` |
| `alternativeJobsAvailable` | `+(retrainingEligible * (0.3 + sr(i * 19) * 0.9)).toFixed(1);` |
| `timelineRisk` | `+(1 + sr(i * 23) * 9).toFixed(1);` |
| `retrainingBoost` | `retrainingInvestment / 50;` |
| `totalWorkers` | `filtered.reduce((s, r) => s + r.workersEmployed, 0);` |
| `totalJobLoss2030` | `filtered.reduce((s, r) => s + r.projectedJobLoss2030 * speedMultiplier, 0);` |
| `avgFund` | `filtered.length ? filtered.reduce((s, r) => s + r.transitionFundAllocated, 0) / filtered.length : 0;` |
| `totalAltJobs` | `filtered.reduce((s, r) => s + r.alternativeJobsAvailable * retrainingBoost, 0);` |
| `scatterData` | `filtered.map(r => ({` |
| `altJobsData` | `filtered.slice(0, 15).map(r => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_TRANSITION_DATA`, `FUEL_TYPES`, `REGIONS`, `REGION_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Fossil Fuel Workers | — | IEA World Energy Employment 2023 | Direct fossil fuel sector employment globally — coal 10M, oil&gas 12M, fossil power 43M |
| Average Retraining Cost | — | OECD Skills Outlook 2023 | Per-worker retraining cost for green economy transition varies by prior skill level and target sector |
| EU Just Transition Fund | — | EU JTM Regulation 2021/1056 | EU Just Transition Mechanism total allocation — targeting 100+ coal-dependent regions |
- **Regional employment data by fossil fuel sector** → Transition cost modelling → **Per-worker and total transition finance requirement**
- **Green job creation scenarios by sector/region** → Net employment impact → **Net job creation/loss under 1.5°C/2°C transition scenarios**
- **EU JTF allocation data + Territorial Transition Plans** → Grant eligibility analysis → **Available JTF funding per region and eligible expenditure categories**

## 5 · Intermediate Transformation Logic
**Methodology:** Worker Transition Cost Model
**Headline formula:** `TransitionCost_worker = RetrainingCost + IncomeSupportDuration × AvgWage + PensionLiabilityGap; RegionalMultiplier = DirectJobs × InputOutputMultiplier`

Per-worker transition cost combines retraining (6–24 months), income support bridge, and defined benefit pension gap; input-output multiplier captures community economic ripple effect

**Standards:** ['ILO Guidelines for a Just Transition 2015', 'IPCC AR6 WGIII Chapter 17 — Just Transitions', 'EU Just Transition Mechanism 2021', 'IEA World Energy Employment 2023']
**Reference documents:** ILO Guidelines for a Just Transition towards Environmentally Sustainable Economies (2015); IEA World Energy Employment 2023; EU Just Transition Mechanism — Regulation (EU) 2021/1056; IPCC AR6 WGIII Chapter 17 — Accelerating the Transition in the Context of Sustainable Development

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a *Worker Transition Cost Model*
> (`TransitionCost = RetrainingCost + IncomeSupportDuration × AvgWage + PensionLiabilityGap` and a
> `RegionalMultiplier = DirectJobs × InputOutputMultiplier`). **Neither is computed.** There is no
> per-worker cost build-up, no income-support-duration term, no pension-gap, and no input-output
> multiplier. The module instead blends **real IEA global employment aggregates** with **50 `sr()`-
> seeded fossil regions** and reports filtered sums, ratios and rankings. The sections below document
> what is actually built.

### 7.1 What the module computes

Real IEA data (wired) sits alongside synthetic regional data:

```js
// Real (IEA World Energy Employment 2023, via publicDataSeed):
FOSSIL_EMPLOYMENT_GLOBAL = { coal 11.2M, oil_gas 11.4M, fossil_power 4.3M,
                             total_at_risk 26.9M, clean_energy 35.4M }
COUNTRY_TRANSITION_DATA: transition_ratio = clean_m / fossil_m   // e.g. USA 3.4/1.1 = 3.09

// Synthetic (50 regions, sr()-seeded), aggregated with interactive scalers:
totalJobLoss2030 = Σ projectedJobLoss2030 × speedMultiplier
retrainingPct    = Σ(retrainingEligible × retrainingBoost) / totalJobLoss2030 × 100
totalAltJobs     = Σ alternativeJobsAvailable × retrainingBoost
```

The **interactive scalers are real**: `speedMultiplier` = 1.3 (2030) / 1.0 (2035) / 0.7 (2040) —
faster transitions front-load job losses; `retrainingBoost = retrainingInvestment / 50` scales
retraining capacity linearly with the investment slider.

### 7.2 Parameterisation / scoring rubric

**Real IEA aggregates** (authoritative, from `publicDataSeed`):

| Metric | Value | Source |
|---|---|---|
| Coal jobs | 11.2 M | IEA World Energy Employment 2023 |
| Oil & gas extraction | 11.4 M | IEA WEE 2023 |
| Fossil power generation | 4.3 M | IEA WEE 2023 |
| Clean-energy total | 35.4 M | IEA WEE 2023 (already exceeds fossil) |
| Country transition ratio | clean/fossil | IEA-derived (China 1.12, USA 3.09, India 0.19) |

**Synthetic region fields** (`sr()`-seeded, 50 real-place names like Ruhr Valley, Appalachia, Shanxi):

| Field | Formula | Range |
|---|---|---|
| workersEmployed | `5 + sr(i·7)·120` | 5–125 k |
| projectedJobLoss2030 | `workers × (0.1 + sr(i·11)·0.4)` | 10–50% of workers |
| projectedJobLoss2040 | `jobLoss2030 × (1.2 + sr(i·13)·0.8)` | 1.2–2.0× the 2030 loss |
| retrainingEligible | `jobLoss2030 × (0.4 + sr(i·17)·0.5)` | 40–90% of losses |
| alternativeJobsAvailable | `retrainingEligible × (0.3 + sr(i·19)·0.9)` | 30–120% of eligible |
| avgWage | `35 + sr(i·29)·65` | $35–100 k |
| timelineRisk | `1 + sr(i·23)·9` | 1–10 (banded High/Med/Low) |
| unionisationRate | `10 + sr(i·41)·80` | 10–90% |

The chained structure (loss → eligible → alt jobs) is directionally sensible but every link is random.

### 7.3 Calculation walkthrough

1. Load real IEA global + country data; generate 50 seeded regions.
2. Filter by region/fuel/timeline-risk.
3. Apply speed multiplier to 2030 job loss and retraining boost to retraining/alt jobs.
4. KPIs: total workers, job loss, mean transition fund, retraining %, alt jobs.
5. Rankings (top job-loss regions), scatter (wage vs job loss), country transition-ratio bars.

### 7.4 Worked example (interactive scalers)

A region with `projectedJobLoss2030 = 20k`, `retrainingEligible = 12k`, at `transitionSpeed = 2030`
(speedMult 1.3) and `retrainingInvestment = 100` (boost 2.0):
```
scaledJobLoss   = 20 × 1.3 = 26 k
scaledRetraining= 12 × 2.0 = 24 k
retrainingPct   = 24 / 26 × 100 = 92.3%
```
Doubling retraining investment (boost 2.0) lifts the retraining coverage to 92% of the (accelerated)
job losses — the module's core "policy lever" narrative. But the base 20k loss is `sr()`-random and the
92% can exceed physical eligibility because the boost is unbounded.

### 7.5 Data provenance & limitations

- **IEA global + country employment data is real and correctly wired** (WEE 2023 aggregates).
- **The 50 regions are `sr()`-seeded** — job-loss, retraining, alt-jobs, wages, union rates all random,
  attached to real place names.
- The guide's per-worker transition cost and I/O multiplier are **not implemented**.
- `retrainingBoost` is unbounded, so retraining % can exceed 100%.

**Framework alignment:** ILO Just Transition Guidelines (framing) · IEA World Energy Employment
(the real aggregates — IEA counts jobs by energy sub-sector from national labour surveys + energy
investment data) · GFANZ/transition-finance just-transition principles. The guide's transition-cost and
input-output-multiplier methodology is named but absent.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Regional job losses and retraining are `sr()`-
seeded; the guide's transition-cost model is missing. Below is the production model.

### 8.1 Purpose & scope
Estimate per-worker and per-region fossil-fuel transition cost (retraining + income bridge + pension
gap) and the community economic ripple via an input-output multiplier — for just-transition-fund sizing.

### 8.2 Conceptual approach
A **worker-transition cost model** plus a **regional input-output (I-O) multiplier**, benchmarked against
the **ILO Just Transition** framework, **IEA WEE** employment data, and academic coal-region transition
studies (e.g. Ruhr, Appalachia). Job-loss trajectories come from an energy-scenario capacity-retirement
schedule, not random draws.

### 8.3 Mathematical specification
```
JobLoss_r,t   = DirectJobs_r · retirementSchedule_r,t(scenario)      NGFS/IEA capacity retirement
TransitionCost_worker = RetrainingCost + supportMonths·(AvgWage/12) + PensionGap
   PensionGap = max(0, accruedDBLiability − fundedAssets) per worker
RegionalCost_r = JobLoss_r · TransitionCost_worker
CommunityImpact_r = DirectJobLoss_r · (IO_multiplier_r − 1)          indirect + induced jobs
FundAdequacy_r = allocatedFund_r / RegionalCost_r
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| retirementSchedule | plant/mine closure timing | IEA NZE / NGFS phase-out pathways |
| RetrainingCost | per-worker reskilling | ILO / national programme costs |
| supportMonths | income-bridge duration | just-transition policy (6–24 months) |
| PensionGap | DB pension shortfall | plan actuarial reports |
| IO_multiplier | employment multiplier | regional input-output tables (BEA RIMS II / Eora) |

### 8.4 Data requirements
Per region: direct fossil jobs, wage, pension funding, retirement schedule, I-O multiplier. Sources:
IEA WEE (on platform), national labour statistics, energy-scenario retirement schedules (NGFS/IEA),
BEA RIMS II or Eora MRIO for multipliers. Region names already exist; real employment must replace seeds.

### 8.5 Validation & benchmarking plan
Reconcile transition cost against documented programmes (German Kohleausstieg €40Bn, US POWER+);
validate I-O multipliers against published coal-region studies (typically 1.5–2.5×); backtest job-loss
schedule against realised closures; sensitivity-test support duration and scenario.

### 8.6 Limitations & model risk
I-O multipliers assume fixed regional structure; pension gaps depend on discount rates; alt-job creation
is location-mismatched. Conservative fallback: use the higher support duration (24 months) and full
pension gap, and cap alt-job substitution at observed regional reabsorption rates.

## 9 · Future Evolution

### 9.1 Evolution A — Build the per-worker transition-cost and I/O multiplier model (analytics ladder: rung 1 → 2)

**What.** §7 flags the mismatch precisely: the guide's Worker Transition Cost Model (`TransitionCost = RetrainingCost + IncomeSupportDuration·AvgWage + PensionLiabilityGap`) and `RegionalMultiplier = DirectJobs·InputOutputMultiplier` are not computed — the module blends real IEA World Energy Employment 2023 aggregates (correctly wired: coal 11.2M, oil&gas 11.4M, 26.9M at-risk, clean 35.4M) with 50 `sr()`-seeded fossil regions whose job-loss, retraining, wages, and union rates are random. Evolution A builds the two named models: a per-worker cost build-up from retraining duration, income-support bridge, and pension gap, and a regional employment multiplier applying input-output ripple factors to direct job losses — grounding the regional layer in real employment data instead of PRNG.

**How.** (1) A cost function `TransitionCost = retrain_months·retrain_cost + support_months·avg_wage + pension_gap`, parameterised per fuel type and region. (2) I/O multipliers from published regional input-output tables (or documented sectoral defaults) applied to IEA/national direct-job figures. (3) Bound `retrainingBoost` so retraining % can't exceed 100% (a §7.5-flagged bug), and seed regional job figures from national labour statistics rather than `sr()`.

**Prerequisites.** Regional employment data to replace the 50 seeded regions (all §7-flagged synthetic); I/O multiplier reference table. **Acceptance:** two regions with different wage/pension profiles produce different per-worker transition costs reproducing the §5 formula; the regional multiplier applies to real direct-job counts; retraining % is bounded.

### 9.2 Evolution B — Just-transition planning copilot (LLM tier 1 → 2)

**What.** A copilot for policymakers and transition-finance teams: "what's the transition cost and community employment impact of closing this coal basin by 2030, and how big should the just-transition fund be?" Tier-1 narrates the real IEA global/country employment aggregates and ILO Just Transition framing from the atlas corpus; tier-2 runs the Evolution A cost and multiplier models so the fund-sizing is computed.

**How.** Tier 1 grounds on §5/§7 (ILO Just Transition Guidelines, IEA WEE 2023, EU Just Transition Mechanism, IPCC AR6 Ch17 are cited), with a guardrail disclosing that regional figures are seeded until Evolution A lands — so pre-Evolution-A the copilot uses only the real IEA aggregates and refuses region-specific cost claims. Tier 2 tool-calls the cost/multiplier endpoints; every worker count, cost, and fund figure validated against tool output.

**Prerequisites.** Evolution A for regional cost claims; corpus embedding. **Acceptance:** post-Evolution-A, every transition-cost and employment-impact figure traces to a tool call; pre-Evolution-A, region-specific quantitative asks are refused while IEA-aggregate questions are answered from the wired real data.