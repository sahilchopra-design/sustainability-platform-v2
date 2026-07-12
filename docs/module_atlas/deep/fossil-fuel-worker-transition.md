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
