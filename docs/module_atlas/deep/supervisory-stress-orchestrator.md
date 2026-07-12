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
