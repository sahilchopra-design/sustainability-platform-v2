## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states
> `JT_Score = 0.25×IncomeEquity + 0.20×EmploymentAccess + 0.20×CommunityVoice + 0.20×HealthSafety +
> 0.15×GenderInclusion` plus `JETP_Leverage = (TotalCommitment − GrantElement)/GrantElement` and
> `Worker_Retraining_Cost = DisplacedWorkers × AvgRetrainingCost`. **None of these three formulas are
> computed anywhere in the code.** The page's per-region `vulnerabilityScore` is a single seeded-random
> draw, not a weighted composite of the five named sub-indicators, and no leverage ratio or
> retraining-cost figure is calculated at all — the "social justice" 6-metric radar (Income Equity,
> Employment Access, Community Voice, Gender Inclusion, Indigenous Rights, Health & Safety) is a
> separate, hand-authored, region-agnostic dataset that is never combined into the per-region score.
> The listed `just_transition_engine.py` backend is not called by this page (no `axios`/`fetch` calls
> exist in the file). Sections below document the code as it actually behaves.

### 7.1 What the module computes

Four independent, unconnected datasets drive six tabs:

1. **22 fossil-dependent regions** (`REGIONS`) — Appalachia, Ruhr Valley, Silesia, Mpumalanga,
   Jharkhand, Inner Mongolia, etc. — each with 8 seeded-random attributes.
2. **8 named finance mechanisms** (`FINANCE_MECHANISMS`) — real programmes (EU JTF, SA/Indonesia/
   India JETP, US IRA §48C, World Bank JTIP, UK JT Platform, ADB ETM) with static, hand-entered
   commitment sizes.
3. **A 6-metric social-justice radar** (`SOCIAL_RADAR`) comparing "Fossil Economy" vs "Just
   Transition" vs "Adaptation Focus" archetypes — static, not tied to any region or country.
4. **8-sector jobs table** (`JOBS_DATA`) and a **7-year investment trend** (`INVESTMENT_TREND`,
   seeded-random) for Fossil / Clean Energy / Adaptation / Just Transition capital flows.

### 7.2 Parameterisation

```js
fossilDependency      = round(sr(i*7)*60 + 30)     // 30-90%
workers                = round(sr(i*11)*80000+5000) // 5,000-85,000
gdpShareFossil          = round(sr(i*5)*35+15)       // 15-50%
vulnerabilityScore      = round(sr(i*13)*40+40)      // 40-80
adaptFinanceGap         = round(sr(i*9)*800+100)     // $100-900M
renewableJobPotential    = round(sr(i*3)*60000+2000) // 2,000-62,000
justicePillar            = ['Procedural','Distributive','Restorative','All Three'][floor(sr(i*17)*4)]
transitionPlan           = ['Yes','Draft','None'][floor(sr(i*19)*3)]
```

| Field | Provenance |
|---|---|
| All 8 per-region attributes | Synthetic demo value, `sr(i×k)` PRNG — 22 real region *names* (Appalachia, Ruhr, Silesia, Mpumalanga, Jharkhand, etc.) paired with fabricated statistics |
| `FINANCE_MECHANISMS` sizes | Real, named programmes with plausible/correct order-of-magnitude commitments (EU JTF €17.5Bn, SA JETP $8.5Bn, Indonesia JETP $20Bn, India JETP — listed here as $15.5Bn, cf. the sibling `jetp-analytics` module's $5Bn figure for India, an internal platform inconsistency) |
| `SOCIAL_RADAR` scores | Hand-authored illustrative values, 3 archetypes × 6 metrics, no per-region linkage |
| `JOBS_DATA` sector jobs | Hand-authored static figures (Solar PV +820K, Coal Mining −420K, Oil & Gas −280K, etc.), no source cited, no year specified |
| `INVESTMENT_TREND` 2020-2026 | `sr()`-perturbed linear trends: fossil declining `1800−80i`, clean energy rising `280+120i`, adaptation `46+22i`, just transition `8+14i`, all ± small noise term |

### 7.3 Calculation walkthrough

- **KPIs**: `totalWorkers = Σ workers` (22 regions), `avgVulnerability = mean(vulnerabilityScore)`,
  `totalFinanceGap = Σ adaptFinanceGap` ($M, displayed in $Bn), and a **hard-coded** "JETP
  Commitments = $147Bn" figure that is not a sum of any in-file array (it does not equal the sum of
  `FINANCE_MECHANISMS` sizes, which totals $80.5Bn — the $147Bn appears to be an externally-sourced
  headline figure pasted in directly, not derived from the visible dataset).
- **Regional Vulnerability tab** — sortable by 4 fields (vulnerability, workers, finance gap, RE job
  potential) and filterable by `transitionPlan` status; purely a table re-sort/filter, no scoring
  logic.
- **Jobs Transition tab** — `JOBS_DATA` rendered as a stacked bar (created vs lost) and 4 net-change
  KPI tiles; `net = jobsCreated − lostFromFossil` is pre-computed in the static data, not derived in
  the render.
- **Social Justice Radar tab** — the 3-archetype × 6-metric comparison, entirely static.
- **Investment Flow tab** — area chart of the 4 seeded-random category trends over 2020–2026.

### 7.4 Worked example

Region `Mpumalanga, ZA` (`i=3`): `vulnerabilityScore = round(sr(3×13)×40+40) = round(sr(39)×40+40)`.
`sr(39) = frac(sin(40)×10000)`; `sin(40 rad) ≈ 0.7451`, so `frac(7451.3) = 0.332` →
`vulnerabilityScore = round(0.332×40+40) = round(53.3) = 53`. `workers = round(sr(33)×80000+5000)`;
`sr(33)=frac(sin(34)*10000)`, `sin(34)≈0.5291` → `frac(5290.8)=0.808` → `workers = round(0.808×80000+
5000) = 69,650`. Both figures are internally consistent (deterministic given the seed) but bear no
relationship to Mpumalanga's actual coal-workforce statistics, which the guide's `dataLineage` claims
come from "ILO JT Guidelines + COP27 JETP frameworks + EU JTF + World Bank JTIP" — none of which are
ingested in code.

### 7.5 Companion analytics

- **Overview tab** juxtaposes the investment-flow area chart with the net-jobs-by-sector bar chart
  side by side, but the two are computed independently with no shared driver.
- **Finance Mechanisms tab** renders `FINANCE_MECHANISMS` as info cards (region, instrument type,
  committed $Bn, policy anchor) — a reference table, not a calculation.
- **Investor Frameworks tab** (tab 5) is pure reference text: 4 static lists of principles (ILO/COP26
  just transition principles, JETP governance structure, adaptation equity assessment steps, investor
  framework citations) with no interactive or computed component.

### 7.6 Data provenance & limitations

- **All 22 regions' quantitative attributes are synthetic**, generated by `sr(seed) =
  frac(sin(seed+1)×10⁴)` — only the region *names* and countries are real.
- The three guide-cited formulas (weighted JT_Score, JETP leverage ratio, worker retraining cost) are
  **entirely absent** from the code; a user cannot derive any of the guide's headline analytics from
  what is actually rendered.
- Cross-module inconsistency: this module's India JETP figure ($15.5Bn) does not match the sibling
  `jetp-analytics` module's synthetic India `pledgedFinance` (which is itself `sr()`-derived and
  unrelated), illustrating that neither module's India figure should be treated as authoritative.
- The `SOCIAL_RADAR` archetype comparison (fossil vs transition vs adaptation) is illustrative
  storytelling, not measured outcome data for any real region or portfolio.

**Framework alignment:** ILO Just Transition Finance Guidelines (2024) and COP26/27 JETP frameworks
are correctly named and their qualitative structure (Investment Plan → IPG → grant-element blending →
conditionality) is accurately summarised in the reference tab, but none of it is operationalised as a
calculation. EU Just Transition Fund and IFC PS2 are correctly cited as real instruments/standards.
The module functions as a **curated reference + illustrative dashboard**, not a quantitative just
transition or adaptation-finance model.
