# Supervisory Stress Orchestrator
**Module ID:** `supervisory-stress-orchestrator` · **Route:** `/supervisory-stress-orchestrator` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Regulatory climate stress test workflow engine that orchestrates multi-scenario, multi-horizon supervisory exercises across NGFS and central bank scenarios including ECB, PRA and ACPR methodologies.

> **Business value:** Central banks globally now require climate stress tests; the ECB 2022 exercise covered €4.2 trillion in bank exposures; orchestration tooling cuts submission preparation time by 60–70%.

**How an analyst works this module:**
- Configure scenario library from NGFS/central bank feeds
- Map portfolio exposures to scenario-sensitive sectors
- Run credit, market and operational risk modules
- Aggregate results and perform QA on model outputs
- Generate supervisory submission package and management report

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `GRADE_ADVERSE`, `GRADE_BASE_LOSS`, `GRADE_SEVERE`, `INSTITUTIONS`, `INST_NAMES`, `INST_TYPES`, `JURISDICTIONS`, `KpiCard`, `LOAN_GRADES`, `MANAGEMENT_ACTIONS`, `Pill`, `REGULATORS`, `SectionTitle`, `Select`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MANAGEMENT_ACTIONS` | 9 | `name`, `cet1ImpactPct`, `feasibility`, `timeline`, `cost` |
| `REGULATORS` | 7 | `name`, `threshold`, `adverseMult`, `creditLossRate`, `niiImpact`, `opRiskAddon`, `ppnrShock`, `feeShock`, `tradingShock`, `eclMultiplier`, `scenarioType`, `scenarios`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSTITUTIONS` | `INST_NAMES.map((name, i) => {` |
| `type` | `INST_TYPES[Math.floor(sr(i * 7)  * INST_TYPES.length)];` |
| `jurisdiction` | `JURISDICTIONS[Math.floor(sr(i * 11) * JURISDICTIONS.length)];` |
| `totalAssets` | `20  + sr(i * 13) * 980;` |
| `regulatoryCapital` | `0.08 + sr(i * 17) * 0.08;` |
| `climateExposurePct` | `0.05 + sr(i * 19) * 0.40;` |
| `physRisk` | `15  + sr(i * 23) * 75;` |
| `transRisk` | `10  + sr(i * 29) * 80;` |
| `dataQualityScore` | `0.50 + sr(i * 41) * 0.50;` |
| `managementActionCapacity` | `0.10 + sr(i * 43) * 0.40;` |
| `templateCompletionPct` | `40   + sr(i * 37) * 60;` |
| `capitalRaisePotential` | `0.010 + sr(i * 47) * 0.030;` |
| `rwaPct` | `0.45 + sr(i * 53) * 0.30;` |
| `dividendYield` | `0.02 + sr(i * 59) * 0.05;` |
| `ppnrPct` | `0.015 + sr(i * 61) * 0.025;` |
| `feePct` | `0.005 + sr(i * 67) * 0.015;` |
| `niiMargin` | `0.010 + sr(i * 71) * 0.020;` |
| `tradingRevPct` | `0.003 + sr(i * 73) * 0.012;` |
| `ecl_baseline` | `0.008 + sr(i * 79) * 0.020;` |
| `ecl_adverse` | `ecl_baseline * (1.4 + sr(i * 83) * 0.5);` |
| `ecl_severe` | `ecl_baseline * (1.9 + sr(i * 89) * 0.6);` |
| `lastSubmission` | ``2024-0${1 + Math.floor(sr(i * 97) * 8)}-${10 + Math.floor(sr(i * 101) * 18)}`;` |
| `nextDeadline` | ``2025-0${1 + Math.floor(sr(i * 103) * 8)}-30`;` |
| `baseQ1` | `regulatoryCapital * 100;` |
| `drift` | `-0.20 * sr(i * 107 + q * 3);` |
| `recover` | `q > 5 ? 0.10 * sr(i * 113 + q) : 0;` |
| `baseCET1` | `inst.regulatoryCapital * 100;` |
| `creditDrain` | `mult * clr * inst.climateExposurePct * 100;` |
| `niiDrain` | `Math.abs(nii) * inst.niiMargin * 100;` |
| `stressedCET1` | `baseCET1 - creditDrain - niiDrain - opDrain;` |
| `shortfall` | `Math.max(0, regulator.threshold - stressedCET1);` |
| `managementUplift` | `inst.managementActionCapacity * 2.0;` |
| `cet1AfterActions` | `stressedCET1 + managementUplift;` |
| `toggleSort` | `col => { if (sortCol === col) setSortDir(d => -d); else { setSortCol(col); setSortDir(-1); } };` |
| `stressMatrix` | `useMemo(() => INSTITUTIONS.map(inst => ({` |
| `passRates` | `useMemo(() => REGULATORS.map(r => {` |
| `col` | `stressMatrix.map(row => row.byReg[r.id]);` |
| `avgBase` | `allStress.reduce((s, x) => s + x.baseCET1, 0) / (allStress.length \|\| 1);` |
| `avgStress` | `allStress.reduce((s, x) => s + x.stressedCET1, 0) / (allStress.length \|\| 1);` |
| `totalShortfall` | `allStress.reduce((s, x) => s + x.shortfall, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRADE_ADVERSE`, `GRADE_BASE_LOSS`, `GRADE_SEVERE`, `INST_NAMES`, `INST_TYPES`, `JURISDICTIONS`, `LOAN_GRADES`, `MANAGEMENT_ACTIONS`, `REGULATORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenarios Loaded | — | NGFS Phase IV | Number of supervisory scenario pathways available for stress projection. |
| Portfolio sCVaR (Orderly) | — | ECB Methodology | Capital impact under NGFS Orderly 1.5°C scenario expressed as CET1 ratio reduction. |
| Estimated Completion | — | Workflow Engine | Proportion of stress test data collection, modelling and QA stages completed. |
- **Portfolio Exposures, NGFS Scenario Data, Macro Projections** → Scenario mapping + credit/market risk engines + QA workflows → **Supervisory submission packages, management dashboards, capital impact reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Supervisory Climate VaR
**Headline formula:** `sCVaR = Σ (Exposure × PDΔ × LGD) + MarketΔ`

Aggregated credit loss from PD migration under transition/physical shocks plus market value change from repricing.

**Standards:** ['ECB Climate Stress Test 2022', 'PRA SS3/19', 'BIS CGFS 2021']
**Reference documents:** ECB Climate Stress Test Methodology 2022; PRA Supervisory Statement SS3/19; NGFS Phase IV Scenarios 2023; BIS CGFS Climate Stress Testing 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide's formula, `sCVaR = Σ(Exposure × PDΔ × LGD) +
> MarketΔ`, implies a full PD/LGD credit-risk decomposition. The code's `computeStress()` uses a
> coarser, single-factor approximation — `creditDrain = adverseMult × creditLossRate ×
> climateExposurePct × 100` — which conflates exposure, loss rate, and scenario severity into one
> multiplicative term rather than separately modelling probability-of-default delta and
> loss-given-default. This is a reasonable simplification for a capital-planning dashboard, but it is
> not literally "PD×LGD," and no market-value (`MarketΔ`) term exists in the formula at all.

### 7.1 What the module computes

80 real-named financial institutions (`INST_NAMES` — Barclays, Deutsche Bank, HSBC, JPMorgan Chase,
Goldman Sachs, MUFG, DBS, UBS, Allianz, etc.) across 6 real institution types and 8 real
jurisdictions, each independently `sr()`-seeded:

```
totalAssets ($Bn)        = 20 + sr(i×13)×980
regulatoryCapital (CET1) = 0.08 + sr(i×17)×0.08          // 8–16%
climateExposurePct       = 0.05 + sr(i×19)×0.40           // 5–45% of book
managementActionCapacity = 0.10 + sr(i×43)×0.40           // 10–50%
niiMargin                = 0.010 + sr(i×71)×0.020          // 1.0–3.0%
ecl_baseline/adverse/severe = tiered ECL rates, adverse = baseline×[1.4–1.9], severe = baseline×[1.9–2.5]
cet1Path (9 quarters)     = drift + a mid-window shock (Q2–Q5) + a late recovery (Q6+)
```

6 real regulatory frameworks (`REGULATORS`): **ECB 2024** (8.0% threshold), **PRA Exploratory**
(10.0%), **OSFI B-15** (9.0%), **Fed DFAST** (7.0%), **APRA CPG229** (8.0%), **MAS TRM** (8.0%) —
each with its own `adverseMult`, `creditLossRate`, `niiImpact`, `opRiskAddon`, `ppnrShock`,
`feeShock`, `tradingShock`, `eclMultiplier` — a genuinely differentiated, plausible parameter set per
regulator (thresholds and multiplier magnitudes are broadly consistent with the real relative
severity of these programmes: PRA's exploratory scenario and severity multiplier are the harshest,
Fed DFAST's threshold the most lenient).

**Stress computation** (`computeStress`):
```
baseCET1     = regulatoryCapital × 100
creditDrain  = adverseMult × creditLossRate × climateExposurePct × 100
niiDrain     = |niiImpact| × niiMargin × 100
opDrain      = opRiskAddon × 100
stressedCET1 = baseCET1 − creditDrain − niiDrain − opDrain
shortfall    = max(0, threshold − stressedCET1)
managementUplift  = managementActionCapacity × 2.0
cet1AfterActions  = stressedCET1 + managementUplift
passes            = cet1AfterActions ≥ threshold
```

This is a genuine, internally consistent capital-depletion waterfall: three drain terms (credit,
NII, operational risk) subtract from starting capital, compared to a regulator-specific threshold,
with a management-action buffer applied afterward — a legitimate simplified capital-planning
methodology, just not literally the guide's PD×LGD decomposition.

### 7.2 Parameterisation

| Regulator | Threshold | `adverseMult` | `creditLossRate` | Provenance |
|---|---|---|---|---|
| ECB 2024 | 8.0% | 1.45 | 2.8% | Plausible, consistent with real ECB SREP Pillar 2 CET1 requirements in the 8–11% range |
| PRA Exploratory | 10.0% | 1.55 (highest) | 3.2% (highest) | Plausible — UK's Climate Biennial Exploratory Scenario is widely regarded as one of the more severe designs |
| Fed DFAST | 7.0% (lowest) | 1.35 (lowest) | 2.2% | Plausible — US regulatory minimum CET1 + buffer is typically lower than EU/UK equivalents |
| `MANAGEMENT_ACTIONS` (8 named levers, e.g. Common Equity Raise +2.2pp CET1, Dividend Suspension +0.8pp) | — | — | Real, standard bank capital-management levers with plausible CET1 impact magnitudes and feasibility/timeline tags |
| `GRADE_BASE_LOSS/ADVERSE/SEVERE` (7 loan grades AAA→CCC) | 0.1%→28% base loss rate | — | Real credit-grade ordering with monotonically increasing loss rates across baseline/adverse/severe — directionally correct even if not calibrated to a named transition matrix |

### 7.3 Calculation walkthrough

1. **Institution generation** — 80 institutions with the fields above; `cet1Path` gives each a
   9-quarter (Q1-2024→Q1-2026) CET1 trajectory with a scripted mid-window stress dip and late
   recovery — illustrative, not itself feeding `computeStress`.
2. **Stress matrix** — `stressMatrix` runs `computeStress(inst, regulator)` for every institution ×
   regulator pair (80×6 = 480 combinations), producing pass/fail flags per cell.
3. **Pass rates** — `passRates` aggregates the % of institutions passing each regulator's threshold.
4. **Portfolio aggregates** — `avgBase`, `avgStress`, `totalShortfall` across all computed
   institution-regulator pairs.
5. **What-if calibration** — sliders (implied by the `Slider` component) let a user override
   `creditLossRate`/`niiImpact`/`opRiskAddon`/`adverseMult` per regulator, feeding the same
   `computeStress` function with the overridden `calibration` object.
6. **Management actions** — the 8 `MANAGEMENT_ACTIONS` presumably let a user compose a remediation
   package summing `cet1ImpactPct` contributions on top of the flat `managementActionCapacity×2.0`
   uplift already in `computeStress` (full wiring not confirmed in the reviewed portion of the file).

### 7.4 Worked example — Institution 0 ("Barclays PLC"), ECB 2024

```
regulatoryCapital = 0.08+sr(17)×0.08 = 13.68%   →  baseCET1 = 13.68
climateExposurePct = 0.05+sr(19)×0.40 = 33.39%
niiMargin = 0.010+sr(71)×0.020 = 2.42%
managementActionCapacity = 0.10+sr(43)×0.40 = 38.39%

creditDrain = 1.45 × 0.028 × 33.39 = 1.36 pp
niiDrain    = |−0.15| × 2.42 = 0.36 pp
opDrain     = 0.006 × 100 = 0.60 pp
stressedCET1 = 13.68 − 1.36 − 0.36 − 0.60 = 11.36%          →  passes (11.36% ≥ 8.0% ECB threshold), no management action needed
managementUplift = 38.39% × 2.0 = 0.77 pp  →  cet1AfterActions = 12.13%
```

This institution is comfortably above the ECB threshold even pre-action — a realistic outcome for a
well-capitalised synthetic bank under a moderate climate-adverse multiplier.

### 7.5 Companion analytics

- **Quarterly CET1 path** — a scripted stress-and-recovery shape (mid-window shock, late recovery)
  used for trend visualisation, not the source of `computeStress`'s point-in-time result.
- **Submission status tracker** — per-institution, per-regulator submission status
  (Submitted/In Progress/Not Started) via an independent `sr()` threshold — descriptive workflow
  tracking, not scored.

### 7.6 Data provenance & limitations

- All institution-level financial parameters (CET1, climate exposure, NII margin, management
  capacity) are `sr()`-synthetic; only institution *names*, regulator *names*, and regulator
  *threshold* values are real/plausible.
- The credit-loss term conflates exposure, severity multiplier, and loss rate into a single linear
  product rather than a true PD-migration × LGD decomposition — acceptable for illustrative
  capital-planning, insufficient for actual regulatory submission-grade modelling.
- `GRADE_BASE_LOSS/ADVERSE/SEVERE` (loan-grade loss-rate tables) are defined but not confirmed to be
  wired into `computeStress` — if unused, they represent a partially-built feature.

**Framework alignment:** ECB Climate Stress Test methodology / SREP · BoE PRA Climate Biennial
Exploratory Scenario (SS3/19) · Fed DFAST · OSFI B-15 · APRA CPG 229 · MAS TRM — all 6 real named
regulatory climate stress-testing programmes, correctly differentiated by threshold and severity
ordering, computed via a simplified (not PD/LGD-decomposed) capital-depletion waterfall.

## 9 · Future Evolution

### 9.1 Evolution A — Real PD/LGD decomposition with a market-value term and a backend vertical (analytics ladder: rung 1 → 3)

**What.** This tier-B module has a genuinely strong reference layer — 80 real-named institutions across 6 real institution types and 8 jurisdictions, and 6 correctly-differentiated regulatory frameworks (ECB 2024, PRA Exploratory, OSFI B-15, Fed DFAST, APRA CPG229, MAS TRM) with plausible per-regulator thresholds and multipliers matching real relative severity. But §7 flags that the guide's `sCVaR = Σ(Exposure × PDΔ × LGD) + MarketΔ` is not implemented: `computeStress()` uses a single-factor `creditDrain = adverseMult × creditLossRate × climateExposurePct × 100` that conflates exposure, loss rate, and severity, with **no market-value term at all**, and the institution-level financials are `sr()`-synthetic. `GRADE_BASE_LOSS/ADVERSE/SEVERE` loan-grade tables are defined but possibly unused (a partially-built feature). Evolution A builds the real credit-risk decomposition and gives the module a backend.

**How.** (1) Decompose the credit loss into a true PD-migration × LGD × EAD structure (the sibling `stress-test-orchestrator` engine already has a PD-migration formula to share) and wire in the defined-but-unused `GRADE_*` loss-rate tables. (2) Add the missing `MarketΔ` term — repricing of climate-exposed holdings under the scenario. (3) Lift `computeStress` into a backend engine so the sCVaR is server-computed, auditable, and consumable, replacing `sr()` institution financials with real balance-sheet inputs where available. (4) Bench-pin against the ECB 2022 exercise structure.

**Prerequisites.** PD-migration engine reuse; LGD/EAD inputs per exposure; the `GRADE_*` tables need wiring. **Acceptance:** the sCVaR decomposes into PDΔ × LGD × EAD plus MarketΔ; the loan-grade tables feed the loss calculation; per-regulator results differ by their real threshold/multiplier parameters.

### 9.2 Evolution B — Supervisory submission-package analyst (LLM tier 2)

**What.** A tool-calling analyst for the central-bank stress-test workflow the module targets: "run the ECB 2024 scenario on this book and report CET1 depletion", "compare capital impact across ECB, PRA, and Fed thresholds", "generate the supervisory submission package" — calling the (Evolution-A) stress engine, narrating the PD/LGD-decomposed sCVaR and the per-regulator threshold breaches, never inventing capital figures.

**How.** Tier-2 pattern once the engine exists: the stress-run and comparison become tools; the copilot narrates CET1 paths, sCVaR decomposition, and which regulator thresholds are breached, citing each framework's real parameters. Submission-package drafts route to the report-studio layer per the Tier-3 composability pattern; the no-fabrication validator checks every capital/PD figure against tool output.

**Prerequisites (hard).** Evolution A — with a single-factor loss proxy, no market term, and synthetic financials, the analyst would narrate capital numbers that aren't submission-grade and lack the PD/LGD structure regulators require. **Acceptance:** every sCVaR/CET1 figure traces to an engine call with its PD/LGD decomposition; threshold-breach findings cite the regulator's real threshold; an institution without balance-sheet inputs returns "insufficient data," not a fabricated capital path.