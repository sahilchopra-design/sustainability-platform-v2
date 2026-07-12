# Client Transition Command Center
**Module ID:** `client-transition-command-center` · **Route:** `/client-transition-command-center` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated transition plan monitoring and execution dashboard for institutional clients. Tracks decarbonisation milestones, interim SBTi targets, engagement actions, and portfolio reallocation progress against Paris-aligned transition pathways.

> **Business value:** Pathway gap = actual CI minus SBTi target CI. Negative gap = ahead of pathway. Command center integrates engagement actions, portfolio reallocation, and milestone tracking in single dashboard.

**How an analyst works this module:**
- Dashboard shows pathway gap trend and milestone completion
- Engagement Tracker tab manages active company engagement workflows
- Reallocation Monitor tracks green vs brown portfolio shift
- Milestone Planner sets and tracks transition action items
- Alert Centre flags pathway gap breaches and overdue milestones

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIENTS`, `CLIENT_NAMES`, `CLIENT_TYPES`, `ENGAGEMENT_STAGES`, `REPORTING_FRAMEWORKS`, `RISK_QUADRANTS`, `SBTI_STATUSES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RISK_QUADRANTS` | `['Leaders','Transitioners','Laggards','At-Risk'];` |
| `typeIdx` | `Math.floor(sr(i * 7) * CLIENT_TYPES.length);` |
| `stageIdx` | `Math.floor(sr(i * 11) * ENGAGEMENT_STAGES.length);` |
| `aum` | `parseFloat((0.5 + sr(i * 13) * 499).toFixed(1)); // $Bn` |
| `portfolioITR` | `parseFloat((1.3 + sr(i * 17) * 3.2).toFixed(2));` |
| `climateScore` | `parseFloat((10 + sr(i * 19) * 90).toFixed(1));` |
| `transitionBudget` | `parseFloat((aum * 0.01 + sr(i * 23) * aum * 0.1).toFixed(1));` |
| `greenAllocation` | `parseFloat((sr(i * 29) * 35).toFixed(1));` |
| `regulatoryReadiness` | `parseFloat((sr(i * 31) * 100).toFixed(1));` |
| `netZeroTarget` | `2030 + Math.floor(sr(i * 37) * 20);` |
| `sbtiIdx` | `Math.floor(sr(i * 41) * SBTI_STATUSES.length);` |
| `frameworkCount` | `Math.floor(1 + sr(i * 43) * REPORTING_FRAMEWORKS.length);` |
| `daysLastEngagement` | `Math.floor(sr(i * 47) * 180);` |
| `nextReviewDays` | `Math.floor(30 + sr(i * 53) * 150);` |
| `aggregateKPIs` | `useMemo(() => { const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);` |
| `wITR` | `totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.portfolioITR * c.aum, 0) / totalAUM : 0;` |
| `atRisk` | `CLIENTS.filter(c => c.riskQuadrant === 'At-Risk').length;` |
| `avgReadiness` | `CLIENTS.reduce((s, c) => s + c.regulatoryReadiness, 0) / CLIENTS.length;` |
| `totalGreenAlloc` | `totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.greenAllocation * c.aum, 0) / totalAUM : 0;` |
| `engagementPipeline` | `useMemo(() => { return ENGAGEMENT_STAGES.map(stage => { const clients = CLIENTS.filter(c => c.engagementStage === stage);` |
| `totalAUM` | `clients.reduce((s, c) => s + c.aum, 0);` |
| `avgITR` | `clients.length > 0 ? clients.reduce((s, c) => s + c.portfolioITR, 0) / clients.length : 0;` |
| `avgScore` | `clients.length > 0 ? clients.reduce((s, c) => s + c.engagementScore, 0) / clients.length : 0;` |
| `frameworkHeatmap` | `useMemo(() => { return REPORTING_FRAMEWORKS.map(fw => { const adopted = CLIENTS.filter(c => c.reportingFrameworks.includes(fw)).length;` |
| `typeStats` | `useMemo(() => { return CLIENT_TYPES.map(type => { const clients = CLIENTS.filter(c => c.type === type);` |
| `avgBudget` | `clients.length > 0 ? clients.reduce((s, c) => s + c.transitionBudget, 0) / clients.length : 0;` |
| `itrDecomposition` | `useMemo(() => { const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);` |
| `baseITR` | `totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.portfolioITR * c.aum, 0) / totalAUM : 0;` |
| `shiftedClients` | `[...CLIENTS].sort((a, b) => b.aum - a.aum).slice(0, leadershipShift);` |
| `itr` | `isShifted ? Math.max(1.5, c.portfolioITR - 0.3) : c.portfolioITR;` |
| `quadrantColor` | `(q) => ({ Leaders: T.green, Transitioners: T.blue, Laggards: T.amber, 'At-Risk': T.red }[q] \|\| T.muted);` |
| `scatterData` | `CLIENTS.map(c => ({` |
| `sufficiency` | `c.requiredCapex > 0 ? c.transitionBudget / c.requiredCapex * 100 : 100;` |
| `byType` | `CLIENT_TYPES.map(type=>{` |
| `wReadiness` | `totalAUM>0 ? typeClients.reduce((s,c)=>s+c.regulatoryReadiness*c.aum,0)/totalAUM : 0;` |
| `avgGap` | `typeClients.length>0 ? typeClients.reduce((s,c)=>s+Math.max(0,c.frameworksRequired-c.reportingFrameworks.length),0)/typeClients.length : 0;` |
| `totalBudget` | `typeClients.reduce((s,c)=>s+c.transitionBudget,0);` |
| `totalRequired` | `typeClients.reduce((s,c)=>s+c.requiredCapex,0);` |
| `ratio` | `totalRequired>0 ? totalBudget/totalRequired : 1;` |
| `gap` | `totalRequired - totalBudget;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIENT_NAMES`, `CLIENT_TYPES`, `ENGAGEMENT_STAGES`, `REPORTING_FRAMEWORKS`, `RISK_QUADRANTS`, `SBTI_STATUSES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Pathway Gap | `Actual CI – SBTi target CI` | SBTi SDA | Deviation from science-based emission intensity pathway |
| Milestone Completion Rate | `Completed / total milestones` | Platform tracking | Progress on defined transition plan milestones |
| Engagement Score | `CA100+ benchmark weighted` | CA100+ Net Zero Benchmark | Issuer-level engagement progress on net-zero commitment and action |
| Green Asset Allocation | `Green AUM / Total AUM` | Portfolio classification | Share of portfolio in Paris-aligned or EU Taxonomy-aligned assets |
- **SBTi pathway database** → Sector targets → pathway benchmarks → **SBTi CI targets by year**
- **CA100+ benchmark data** → Engagement indicators → engagement score → **Issuer transition progress**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition milestone tracking with SBTi pathway gap
**Headline formula:** `PathwayGap(t) = ActualCI(t) – SBTiTarget(t); MilestoneCompletion = CompletedMilestones / TotalMilestones`

Carbon intensity trajectory benchmarked against SBTi sector-specific 1.5°C pathway. Pathway gap = actual portfolio-level CI minus required SBTi CI target at each year. Engagement actions tracked via CA100+ benchmark indicators. Portfolio reallocation monitors shift in green vs brown asset allocation. Milestone completion ratio drives overall transition score.

**Standards:** ['SBTi Corporate Net-Zero Standard v1.2', 'Paris Agreement Art. 4', 'TCFD Transition Plan Guidance 2023', 'CA100+ Net Zero Benchmark']
**Reference documents:** SBTi Corporate Net-Zero Standard v1.2; TCFD Guidance on Climate Transition Plans 2023; Climate Action 100+ Net Zero Benchmark v2.0; EU Taxonomy Regulation (2020/852)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an *SBTi pathway-gap* engine:
> `PathwayGap(t) = ActualCI(t) − SBTiTarget(t)`, "carbon intensity trajectory benchmarked against
> SBTi sector-specific 1.5 °C pathway", CA100+ engagement-benchmark scores, and milestone-completion
> ratios. **None of that is in the code.** There is no SBTi SDA pathway, no per-year CI trajectory,
> no CA100+ indicator set, and no milestone tracker. What the page implements is a **60-client
> transition CRM dashboard** driven by seeded-random client attributes: an AUM-weighted portfolio
> ITR, a 4-way risk-quadrant classifier, an engagement pipeline, a framework-adoption heatmap, a
> transition-budget-vs-capex sufficiency table, and an ITR "leadership shift" what-if. The sections
> below document the code as written.

### 7.1 What the module computes

60 clients are generated once outside the component (`CLIENTS`), each with `sr()`-seeded attributes.
The headline aggregates (`aggregateKPIs`):

```
totalAUM       = Σ aum                                      ($Bn)
wITR           = Σ (portfolioITR × aum) / totalAUM          (AUM-weighted implied temperature rise)
leaders        = count(riskQuadrant == 'Leaders')
atRisk         = count(riskQuadrant == 'At-Risk')
avgReadiness   = Σ regulatoryReadiness / N
totalGreenAlloc= Σ (greenAllocation × aum) / totalAUM       (AUM-weighted green %)
```

The **AUM-weighted ITR** is the genuinely meaningful metric — a value-weighted portfolio implied
temperature rise, the standard institutional rollup.

### 7.2 Parameterisation / synthetic client generation

Every client field is a `sr(i·k)` draw (all synthetic demo values, no external source):

| Field | Generation | Range |
|---|---|---|
| `aum` | `0.5 + sr(i·13)×499` | $0.5–500 Bn |
| `portfolioITR` | `1.3 + sr(i·17)×3.2` | 1.3–4.5 °C |
| `climateScore` | `10 + sr(i·19)×90` | 10–100 |
| `transitionBudget` | `aum×0.01 + sr(i·23)×aum×0.1` | 1–11 % of AUM |
| `greenAllocation` | `sr(i·29)×35` | 0–35 % |
| `regulatoryReadiness` | `sr(i·31)×100` | 0–100 |
| `netZeroTarget` | `2030 + ⌊sr(i·37)×20⌋` | 2030–2049 |
| `requiredCapex` | `aum×(0.05 + sr(i·73)×0.15)` | 5–20 % of AUM |
| `sbtiStatus`, `type`, `engagementStage`, `frameworks` | index picks via `sr()` | categorical |

### 7.3 Calculation walkthrough — the risk quadrant

The one non-trivial derived classifier is `riskQuadrant`, a cascade on `portfolioITR` and
`climateScore`:

```
Leaders        if ITR ≤ 1.8  AND  climateScore ≥ 70
Transitioners  else if ITR ≤ 2.5  AND  climateScore ≥ 40
Laggards       else if ITR ≤ 3.0  AND  climateScore ≥ 20
At-Risk        otherwise
```

The thresholds map ITR to Paris ambition (1.8 ≈ well-below-2 °C, 3.0 ≈ hot-house) crossed with a
composite climate score — but both inputs are seeded-random, so the quadrant mix is an artefact of
the PRNG, not observed data.

Other derived views:
- **Engagement pipeline** — group by 4 stages (Awareness→Commitment→Action→Leadership); per stage
  report count, ΣAUM, mean ITR, mean engagement score.
- **Framework heatmap** — per framework, `adopted/N × 100` adoption %.
- **Budget sufficiency** — `sufficiency = requiredCapex > 0 ? transitionBudget/requiredCapex × 100 : 100`,
  green if ≥ 100 %.

### 7.4 Worked example — ITR "leadership shift" what-if

The `itrDecomposition` what-if shifts the top-`leadershipShift` clients by AUM to leadership, cutting
each one's ITR by 0.3 (floored at 1.5). With `leadershipShift = 5`:

| Step | Computation | Result |
|---|---|---|
| Base wITR | Σ(ITR×aum)/Σaum over all 60 | e.g. ≈ 2.90 °C |
| Shifted clients | top 5 by AUM get `max(1.5, ITR−0.3)` | 5 largest reduced |
| Shifted wITR | recompute weighted mean with reduced ITRs | e.g. ≈ 2.85 °C |
| Delta | baseITR − shiftedITR | ≈ +0.05 °C improvement |

Because only the largest-AUM clients are shifted, the delta is dominated by a handful of holdings —
a reasonable "engage the biggest emitters first" intuition, but the 0.3 °C cut is a flat assumption
with no abatement model behind it.

### 7.5 Companion analytics

- **Command Center scatter** — ITR (x) × climateScore (y) × AUM (bubble), coloured by quadrant.
- **Client Portfolio Table** — sortable/filterable 60-row table (search, type, stage, AUM range,
  ITR range).
- **Transition Finance** — top-20 budget-vs-required-capex bar + the sufficiency table (§7.3).
- **Regulatory Readiness** — framework heatmap + per-type weighted readiness/gap.
- **Summary & Export** — per-type and quadrant rollups.

### 7.6 Data provenance & limitations

- **All 60 clients are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`. Stable across
  renders, but the quadrant distribution, ITR, budgets and readiness are PRNG artefacts.
- ITR, transition budget, required capex and climate score are **independent random draws** — e.g. a
  client can show high green allocation and high ITR simultaneously with no internal consistency.
- No SBTi pathway, CI trajectory, CA100+ engagement benchmark, or milestone completion exists
  despite the guide; the "engagement score" is `sr(i·71)×100`, not a benchmarked value.

**Framework alignment:** The page references **SBTi** status (Committed/Approved/…), **ITR** (implied
temperature rise, the SBTi/CDP-WWF portfolio-temperature metric — normally derived from company
target ambition vs a sector 1.5 °C budget), and disclosure frameworks (TCFD, CSRD, SFDR, ISSB) as
categorical tags. It approximates the *institutional transition-monitoring* view but computes none of
the underlying science-based targets; the real SBTi pathway gap is specified in §8.

## 8 · Model Specification — SBTi Portfolio Pathway-Gap Engine

**Status: specification — not yet implemented in code.** The guide's headline `PathwayGap(t) =
ActualCI(t) − SBTiTarget(t)` has no implementation; this section specifies it.

### 8.1 Purpose & scope
For each client portfolio, compute the year-by-year gap between actual carbon intensity and the
SBTi sector-specific 1.5 °C decarbonisation pathway, and roll it up to a portfolio ITR and
milestone-completion score, to drive engagement prioritisation.

### 8.2 Conceptual approach
Combine the **SBTi Sectoral Decarbonisation Approach (SDA)** convergence pathway with a
**target-based portfolio-temperature (ITR)** rollup, benchmarked against CA100+ Net Zero Benchmark
indicators. Mirrors: SBTi Financial Institutions target-setting (SDA/TPA) and the CDP-WWF
temperature-rating method used by MSCI Implied Temperature Rise.

### 8.3 Mathematical specification
```
SBTiTarget_s(t) = CI_s(2020) · [ CI_s(2050)/CI_s(2020) ]^{(t−2020)/30}      (SDA convergence)
ActualCI_p(t)   = Σ_i w_i · CI_i(t)                                          (portfolio weighted CI)
PathwayGap(t)   = ActualCI_p(t) − Σ_s share_{p,s}·SBTiTarget_s(t)
ITR_i           = 1.5 + β · ( cumEmissions_i − carbonBudget_i,1.5 ) / carbonBudget_i,1.5
Temperature_p   = Σ_i w_i · ITR_i
Milestone%      = completed milestones / total milestones
```
| Parameter | Source |
|---|---|
| `CI_s(2020)`, `CI_s(2050)` | SBTi SDA sector pathways (steel, power, cement, …) |
| `carbonBudget_i,1.5` | IPCC AR6 1.5 °C remaining budget allocated by SDA |
| `β` (budget→temp) | CDP-WWF Temperature Rating calibration |
| `share_{p,s}` | portfolio sector weights |
| CA100+ indicators | Climate Action 100+ Net Zero Benchmark v2 |

### 8.4 Data requirements
Per-holding sector, revenue, Scope 1/2/3 and validated SBTi target (ambition, base/target year);
SBTi SDA sector pathway tables; IPCC 1.5 °C budget. SBTi status is already a field here; the pathway
tables and company CI trajectories are the missing inputs.

### 8.5 Validation & benchmarking plan
Reconcile portfolio ITR against MSCI Implied Temperature Rise for an overlapping universe; backtest
PathwayGap sign against realised sector CI declines (IEA sector tracking); sensitivity-test the SDA
convergence exponent and β; verify default 3.2 °C assignment for non-SBTi issuers.

### 8.6 Limitations & model risk
SDA convergence assumes intensity convergence, biased for fast-growing firms; ITR is highly
sensitive to target-ambition inputs and default temperature for non-committers; CA100+ indicators
are qualitative. Conservative fallback: report PathwayGap only where ≥ 70 % of portfolio weight has
validated SBTi targets, else flag as low-coverage.

## 9 · Future Evolution

### 9.1 Evolution A — Real SBTi pathway-gap engine over linked portfolios (analytics ladder: rung 1 → 2)

**What.** §7 splits this module cleanly: the aggregation machinery is real (AUM-
weighted ITR, 4-quadrant classifier, engagement pipeline, budget-vs-capex table, an
ITR what-if) but it runs over 60 `sr()`-fabricated clients, and the guide's headline
engine — `PathwayGap(t) = ActualCI(t) − SBTiTarget(t)` against sector-specific 1.5°C
pathways — does not exist. Evolution A builds the pathway engine and re-bases the
dashboard: SBTi's published SDA sector pathways (power, steel, cement intensity
trajectories — public technical annexes) encoded as a reference table; per-client
carbon-intensity trajectories computed from linked `portfolios_pg` holdings via the
platform's portfolio-analytics endpoints; the gap series and milestone-completion
ratio computed per the guide's formulas.

**How.** (1) `ref_sbti_sda_pathways(sector, year, intensity, scenario_version)` table
from the SBTi technical annexes with version pinning (pathways get revised).
(2) `pathwayGap(clientPortfolio, sector, year)` joining actual CI to the interpolated
pathway; the existing quadrant classifier re-keyed to computed gap + engagement stage
instead of PRNG attributes. (3) The 60 fabricated clients replaced by real client links
(the `client-portal` Evolution A account table is the natural source) or clearly-
labelled fixtures.

**Prerequisites (hard).** PRNG client purge; portfolio CI data requires holdings
emissions coverage — clients with insufficient coverage must show "insufficient data",
not an imputed gap. **Acceptance:** a fixture portfolio tracking exactly the power-
sector SDA path shows gap ≈ 0 across years; the quadrant assignment changes when and
only when computed inputs change; the mismatch flag clears.

### 9.2 Evolution B — Transition-desk orchestrator (LLM tier 3)

**What.** This command centre is a natural tier-3 surface: its questions span modules.
"Prepare the quarterly transition review for client X" decomposes into pathway-gap
retrieval (this module, post-Evolution A) → engagement-status summary (its pipeline) →
portfolio reallocation analysis (portfolio-analytics module) → milestone/alert roundup,
synthesized into a review memo through the report-studio render layer. Alert triage is
the daily-use slice: "which clients breached pathway thresholds this week and why?"

**How.** Routing per the tier-3 pattern: the atlas interconnection graph and
`module_tags.json` identify the sibling modules; each sub-answer comes from that
module's own tools (the orchestrator never computes); memo numerics validated against
the underlying tool outputs; CA100+ benchmark language cited from the §5 corpus.

**Prerequisites (hard).** Evolution A first, plus tier-2 capability on
portfolio-analytics — an orchestrator is only as honest as its leaf tools; today every
leaf under this module is seeded. **Acceptance:** a generated review memo's every
figure traces to a named module's tool response; a client without a computed pathway
gap appears in the memo as data-gapped, not silently omitted or invented.