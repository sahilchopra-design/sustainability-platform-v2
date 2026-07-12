# Mental Health & Climate Risk Analytics
**Module ID:** `mental-health-climate-risk` · **Route:** `/mental-health-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DP5 · **Sprint:** DP

## 1 · Overview
Analyses the growing intersection of climate change and mental health — eco-anxiety, disaster PTSD, solastalgia, and climate grief. Quantifies productivity costs, workforce risk, and the investment case for mental health resilience in climate-impacted communities.

> **Business value:** Relevant for corporate HR directors in climate-exposed industries, health insurers pricing mental health products, and sovereign health policymakers. Provides first systematic financial quantification of climate mental health burden aligned with Lancet Countdown indicator framework.

**How an analyst works this module:**
- Select geographic exposure and disaster type
- Calculate eco-anxiety productivity impact
- Model disaster PTSD prevalence and treatment cost
- Assess workforce climate mental health risk
- Generate Lancet Countdown mental health indicator report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `EVENTS`, `EVENT_DATA`, `KpiCard`, `POPULATIONS`, `POP_TYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `POP_TYPES` | `['Coastal Community', 'Wildfire Zone', 'Agriculture-Dependent', 'Urban Heat Island', 'Island Nation', 'Flood Plain', 'Arctic/Polar', 'Drought-Prone'];` |
| `ptIdx` | `Math.floor(sr(i * 5) * POP_TYPES.length);` |
| `evIdx` | `Math.floor(sr(i * 7) * EVENTS.length);` |
| `ecoAnxiety` | `10 + sr(i * 11) * 85;` |
| `ptsdRate` | `5 + sr(i * 13) * 45;` |
| `insGap` | `20 + sr(i * 17) * 75;` |
| `disasterMH` | `15 + sr(i * 19) * 70;` |
| `treatAccess` | `5 + sr(i * 23) * 80;` |
| `econImpact` | `0.1 + sr(i * 29) * 4.9;` |
| `workdaysLost` | `Math.round(2 + sr(i * 31) * 28);` |
| `popSize` | `Math.round(50000 + sr(i * 37) * 9950000);` |
| `EVENT_DATA` | `EVENTS.map((e, i) => ({` |
| `TABS` | `['Overview', 'Eco-Anxiety Index', 'PTSD & Trauma', 'Disaster MH Impact', 'Insurance Gap', 'Treatment Access', 'Economic Burden', 'Investment Framework'];` |
| `avgEcoAnxiety` | `filtered.length ? (filtered.reduce((a, p) => a + p.ecoAnxiety, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgPtsd` | `filtered.length ? (filtered.reduce((a, p) => a + p.ptsdRate, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgInsGap` | `filtered.length ? (filtered.reduce((a, p) => a + p.insGap, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalEconImpact` | `filtered.reduce((a, p) => a + p.econImpact, 0).toFixed(1);` |
| `avgTreatAccess` | `filtered.length ? (filtered.reduce((a, p) => a + p.treatAccess, 0) / filtered.length).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVENTS`, `POP_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Anxiety Prevalence | — | APA Climate Survey 2023 | 68% of US adults report climate anxiety — 27% say it significantly impacts daily functioning |
| Disaster PTSD Prevalence | — | SAMHSA Disaster Mental Health 2023 | 30–40% of disaster survivors develop PTSD — economic cost $10,000–50,000 per case in treatment |
| Mental Health Climate Cost | — | Wellcome Trust 2023 | Climate-related mental health burden projected at $1Tn/yr in productivity losses by 2030 |
- **Climate disaster event database + mental health surveys** → PTSD and eco-anxiety prevalence → **Population-level mental health burden from climate events**
- **Labour productivity and absenteeism data** → Workforce cost modelling → **Annual productivity loss from climate mental health burden**
- **Mental health system capacity + treatment costs** → Investment case → **Cost-benefit of mental health climate resilience investment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Mental Health Burden
**Headline formula:** `ClimateAnxietyCost = PopAffected × ProductivityLoss_days × DailyGDP; DisasterPTSD_cost = DisasterAffected × PTSDprevalence × TreatmentCost + ProductivityLoss`

Eco-anxiety productivity loss from absenteeism and presenteeism; disaster PTSD modelled using prevalence rates from meta-analysis of post-disaster populations

**Standards:** ['Lancet Countdown Mental Health Indicator 2023', 'APA Climate for Health — Mental Health Impacts', 'IPCC AR6 WGII Chapter 7', 'Wellcome Trust Climate Mental Health Research 2023']
**Reference documents:** Lancet Countdown on Health and Climate Change — Mental Health Indicator 2023; Wellcome Trust — The Climate Crisis and Mental Health 2023; American Psychological Association Climate for Health Toolkit; IPCC AR6 WGII Chapter 7 — Mental Health

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states two explicit cost formulas —
> `ClimateAnxietyCost = PopAffected × ProductivityLoss_days × DailyGDP` and
> `DisasterPTSD_cost = DisasterAffected × PTSDprevalence × TreatmentCost + ProductivityLoss`.
> **Neither is computed.** `econImpact`, `workdaysLost`, and `popSize` are three **independently
> seeded PRNG draws** — the code never multiplies population size by workdays lost by a GDP-per-day
> figure, and there is no treatment-cost variable anywhere in the file. All 65 "populations" and 6
> "events" are synthetic vignettes with no cross-field arithmetic linking them. Sections below
> document the aggregation dashboard as actually implemented.

### 7.1 What the module computes

65 named populations (e.g. "Pacific Islanders", "Bangladesh Delta", "California Wildfire Zone") and
6 climate hazard types are generated once via `sr(s) = frac(sin(s+1)×10⁴)`:

```js
ecoAnxiety   = 10 + sr(i*11) * 85     // 10–95 (0–100 index)
ptsdRate     = 5  + sr(i*13) * 45     // 5–50%
insGap       = 20 + sr(i*17) * 75     // 20–95% (MH insurance coverage gap)
disasterMH   = 15 + sr(i*19) * 70     // 15–85 (unused composite, defined but not surfaced in any tab)
treatAccess  = 5  + sr(i*23) * 80     // 5–85%
econImpact   = 0.1 + sr(i*29) * 4.9   // $0.1–5.0Bn — NOT popSize × workdaysLost × GDP
workdaysLost = round(2 + sr(i*31) * 28)   // 2–30 days — independent of econImpact
popSize      = round(50000 + sr(i*37) * 9950000)  // 50K–10M — independent of econImpact
```

A parallel `EVENT_DATA` array seeds 5 more fields per hazard type (`prevalenceIncrease`, `ptsdRate`,
`chronicAnxiety`, `economicCostBn`, `recoveryYears`) — again independent draws, not derived from the
65 populations.

Every KPI on the page (`avgEcoAnxiety`, `avgPtsd`, `avgInsGap`, `totalEconImpact`, `avgTreatAccess`,
`highAnxiety` count) is a plain `filter`/`reduce`/mean over these seeded fields.

### 7.2 Parameterisation — provenance of ranges

| Field | Range | Provenance |
|---|---|---|
| `ecoAnxiety` base offset | 10–95 | Loosely anchored to the guide's cited "68% of US adults report climate anxiety" (APA 2023) but the range itself is an arbitrary linear PRNG stretch, not derived from survey data |
| `ptsdRate` | 5–50% | Consistent order-of-magnitude with the guide's "30–40% of disaster survivors" (SAMHSA), but individual population values are unconstrained draws, not sampled from that distribution |
| `insGap`, `treatAccess`, `disasterMH` | 5–95% | No cited source; purely illustrative |
| `EVENT_DATA.economicCostBn` | $0.5–20Bn | Illustrative; not reconciled to the guide's "$1Tn/yr by 2030" (Wellcome Trust) aggregate figure |

### 7.3 Calculation walkthrough

1. **Filters** (`popTypeFilter`, `eventFilter`) subset the 65-row `POPULATIONS` array via
   `Array.filter`; all six header KPIs recompute means/sums over the filtered subset — no weighting
   by `popSize`.
2. **Eco-Anxiety Index tab** — sorts and colour-codes populations by the raw `ecoAnxiety` field
   (`>70` = high, purple).
3. **Economic Burden tab** — sorts by `econImpact` and shows `workdaysLost` alongside it in the same
   row, but the two numbers are never combined into a single cost figure (they're independent PRNG
   draws, so any apparent correlation is coincidental).
4. **Investment Framework tab (Tab 7)** — a static reference table of 8 named funding mechanisms
   (WHO SIMH $2.5Bn, Lancet Commission $0.8Bn, UNDP Climate-MH Window $1.2Bn, Parametric Disaster MH
   Insurance pipeline $5Bn, Social Impact Bonds $0.5Bn, IFRC MHPSS $0.3Bn, Corporate programmes market
   $12Bn, GCF MH mainstreaming $0.4Bn) — hard-coded, not computed from the population data above.

### 7.4 Worked example

There is no formula to trace arithmetically — every headline number is a direct lookup or a simple
mean. Illustrating the *intended* (guide) calculation instead, for a hypothetical population of 2M
people losing 10 workdays/year at $150/day GDP-per-capita:

```
ClimateAnxietyCost = 2,000,000 × 10 × $150 = $3.0Bn/yr
```

No such multiplication exists in the shipped code — `econImpact` for any given population is simply
`0.1 + sr(i*29)×4.9`, unrelated to that population's own `popSize` or `workdaysLost` fields.

### 7.5 Companion analytics

- **Event-Type MH Impact (Tab 0 side panel, Tab 3)** — per-hazard cards showing PTSD rate, anxiety
  prevalence increase, and economic cost, all independently seeded per the 6 `EVENTS`.
- **Treatment Access vs Eco-Anxiety (Tab 5)** — juxtaposes the two independently-seeded fields
  side-by-side; no correlation or regression is computed between them despite the tab title implying
  a relationship.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 65 population rows and 6 event rows are generated by the
  platform's seeded PRNG `sr()`; none of the real-world sources cited in the guide (APA Climate
  Survey 2023, SAMHSA, Wellcome Trust, Lancet Countdown, IPCC AR6 WGII Ch.7) feed any computation —
  they inform only the *plausible range* of the PRNG draws.
- No cost-of-illness or productivity-loss model exists; `econImpact`, `workdaysLost`, and `popSize`
  should be causally linked (per §8) but currently vary independently, meaning the page cannot
  support any decision requiring internally consistent economic burden figures.
- `disasterMH` field is computed but never rendered in any tab — dead seed data.

**Framework alignment:** Lancet Countdown Mental Health Indicator (referenced, not computed) · APA
Climate for Health survey methodology (referenced for range calibration only) · IPCC AR6 WGII Ch.7
(named, not implemented) · SAMHSA disaster mental health prevalence statistics (named, not sampled
from).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute an internally consistent climate mental-health economic burden estimate — linking population
exposure, prevalence rates, and productivity/treatment costs — to support corporate HR climate-risk
budgeting and health-insurer product pricing, the two user groups the guide identifies.

### 8.2 Conceptual approach
Adopt a standard **cost-of-illness (COI) model**, the same structural approach WHO uses for its
mental-health economic burden estimates and that Lancet Countdown uses for its annual health-cost
indicators — prevalence × per-case cost, summed across a productivity-loss channel and a
treatment-cost channel, rather than independent scalar draws per population.

### 8.3 Mathematical specification

```
EcoAnxietyCost_p   = PopSize_p × EcoAnxietyPrevalence_p × ProductivityLossDays_p × DailyGDPperCapita_p
DisasterPTSDCost_p = DisasterAffected_p × PTSDPrevalence_p × (TreatmentCost_percase + ProductivityLoss_percase)
TotalBurden_p      = EcoAnxietyCost_p + DisasterPTSDCost_p
```

| Parameter | Calibration source |
|---|---|
| `EcoAnxietyPrevalence_p` | APA Climate for Health survey (68% US baseline; region-adjust via Lancet Countdown regional indicators) |
| `PTSDPrevalence_p` | SAMHSA disaster mental health meta-analysis (30–40% of survivors) |
| `TreatmentCost_percase` | SAMHSA-cited $10,000–50,000 per case range |
| `DailyGDPperCapita_p` | World Bank GDP per capita ÷ 365, by country (already available via the platform's World Bank reference-data pull) |
| `ProductivityLossDays_p` | ILO absenteeism/presenteeism studies for climate-exposed sectors |

### 8.4 Data requirements
Population exposure counts by hazard type (EM-DAT disaster-affected population data — already used
elsewhere on the platform), country-level GDP per capita (World Bank, already in `reference_data`),
and prevalence rates from APA/SAMHSA surveys (not yet ingested).

### 8.5 Validation & benchmarking plan
Reconcile aggregate `TotalBurden` across all populations against the Wellcome Trust's top-down
$1Tn/yr-by-2030 global estimate; sensitivity-test productivity-loss-day assumptions against ILO
absenteeism benchmarks for climate-exposed occupations.

### 8.6 Limitations & model risk
Individual-level mental-health prevalence is not directly observable at population scale — the model
should present cost estimates with explicit confidence bands (using the cited prevalence *ranges*,
not point values) and should never let population size, prevalence, and cost vary independently as
the current implementation does, since that produces internally inconsistent burden estimates that
cannot be reconciled to a per-capita cost figure.

## 9 · Future Evolution

### 9.1 Evolution A — Literature-anchored burden model with linked arithmetic (analytics ladder: rung 1 → 2)

**What.** §7 documents disconnected fabrication: `econImpact`, `workdaysLost` and `popSize` are three independent draws — the guide's own formula (`ClimateAnxietyCost = PopAffected × ProductivityLoss_days × DailyGDP`) is never multiplied out even though all three factors sit in the same object; there is no treatment-cost variable despite the PTSD-cost formula requiring one; the `disasterMH` composite is computed but never surfaced; and 65 real-sounding population vignettes carry unanchored index draws. Evolution A builds the guide's two cost chains honestly: prevalence rates from the *published literature the module already cites* (APA 2023 climate-anxiety prevalence, SAMHSA's 30–40% post-disaster PTSD range, the $10–50k per-case treatment costs in §4.1), population and GDP-per-capita denominators from public statistics, and the arithmetic actually linking them — so the total economic burden is a reproducible product of cited factors, with wide uncertainty bands because the underlying epidemiology is genuinely uncertain.

**How.** (1) A parameter table (hazard type × prevalence range × treatment-cost range × productivity-loss range, each row cited to its study) replacing the per-population draws — this is an evidence-synthesis exercise, well-scoped for a domain with a thin but real literature. (2) `POST /mental-health-climate/burden` computing both cost formulas with low/central/high bands from the parameter ranges. (3) Population exposure from real event footprints where available (EM-DAT affected-population counts) rather than seeded `popSize`. (4) The unused `disasterMH` composite either defined and surfaced or deleted.

**Prerequisites.** Literature-parameter curation (the §4.1 anchors are the starting bibliography); the seeded population generation deleted. **Acceptance:** the burden figure decomposes into cited prevalence × exposure × cost factors; bands reflect parameter ranges, not noise; every parameter row carries a study citation.

### 9.2 Evolution B — Climate-mental-health briefing copilot with epistemic care (LLM tier 1 → 2)

**What.** The module's users (HR directors, health insurers, policymakers) need careful synthesis of an emerging field: "what does the evidence say about PTSD prevalence after wildfire vs flood events?", "estimate the productivity exposure for a 12,000-person workforce in a heat-stressed region", "what would a mental-health resilience investment need to return to clear our threshold?" Tier 1 grounds in the curated parameter bibliography; tier 2 runs the burden calculator for scenario estimates.

**How.** The distinguishing requirement is epistemic care: this is a young evidence base on a sensitive topic, so every prevalence claim carries its study citation and population context (post-disaster PTSD rates from one region don't transfer freely), estimates always render as ranges with the driving uncertainty named, and the copilot explicitly distinguishes established findings (disaster PTSD) from emerging constructs (solastalgia, climate grief — real but less quantified). Investment-case answers show the cost-benefit arithmetic from tool calls; workforce-risk answers avoid individual-level inference entirely — population statistics only, stated as such. Loading-state and copy tone follow the platform's serious-topic conventions.

**Prerequisites.** Evolution A's parameter table (a copilot over independent draws would invent epidemiology); Phase 2 for calculator tool calls. **Acceptance:** every prevalence/cost figure carries a citation; all estimates are ranges with assumptions listed; construct-maturity distinctions present in relevant answers.