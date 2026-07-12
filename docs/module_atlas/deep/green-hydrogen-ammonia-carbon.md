## 7 · Methodology Deep Dive

This **tier-A module** shares the rigorous `green_hydrogen_engine.py` (EU RFNBO law, IEA LCOH, ISO
14040/44) for the hydrogen layer, but the **green-ammonia, carbon-credit, SIGHT-incentive and JCM/Article-6
logic is implemented client-side** in the page. Those frontend calculations are transparent formulas over
seeded developer/cost data (`sr()` PRNG); the ammonia LCOP conversion and the Article-6 credit split are
the load-bearing on-page maths. Sections below document the frontend calculations and the engine they sit on.

### 7.1 What the module computes

Carbon-credit engine (frontend):
```js
tonnesH2       = h2ProductionKtpa · 1e6
actualCO2      = tonnesH2 · co2KgPerKgH2                     // kg
greyBaselineCO2 = tonnesH2 · greyBaseline                    // grey SMR ~10 kgCO₂/kgH2
creditsGross   = (greyBaselineCO2 − actualCO2) / 1e6          // MtCO₂e avoided
creditsIndia   = creditsGross · (jcmSplit/100)               // Article-6 ITMO split
creditsJapan   = creditsGross · (1 − jcmSplit/100)
revenue        = creditsGross · creditPrice · 1e6
SIGHT incentive: totalIncentiveCr = productionKtpa · 1e6 · ratePerKg / 1e7    // ₹ crore
```
Ammonia cost (guide formula): `LCOP_NH3 = LCOH($/kgH2)/0.178 + HaberBosch_CAPEX·CRF/output + OPEX`
(17.6 wt% H2 in NH₃). Developer dashboard, GH2/GA cost curves, RFNBO compliance, electrolyser finance,
IRR/project finance are additional tabs over seeded `DEVELOPERS`/`COST_CURVE_*` data.

### 7.2 Parameterisation / provenance

| Element | Value | Provenance |
|---|---|---|
| Grey H2 baseline | ~10 kgCO₂/kgH2 (SMR) | IEA — displacement baseline for credits |
| Green NH₃ carbon intensity | 0.0 vs grey 1.6 tCO₂e/t | Ammonia Energy Association (guide) |
| H2 mass fraction in NH₃ | 0.178 (17.6 wt%) | stoichiometry (NH₃ = 3H per N) |
| SIGHT rates | H2 & NH₃ ₹/kg (e.g. NH₃ ₹30/kg) | India SIGHT scheme (Mission green H2) |
| JCM split | `jcmSplit` slider | Article 6.2 ITMO bilateral split (India–Japan) |
| `DEVELOPERS` (7) | parent, tech, targets, capex, IRR, DSCR | seeded (`sr()`); named developers illustrative |
| `COST_CURVE_H2/NH3` | India/Australia/Chile/ME/EU/grey/blue $/kg | seeded curve anchors |
| RFNBO / electrolyser specs | from engine constants | EU 2023/1184-85, IEA |

### 7.3 Calculation walkthrough

H2 production (ktpa) → tonnes → actual vs grey-baseline CO₂ → gross credits (MtCO₂e) → Article-6 split
(India/Japan via `jcmSplit`) → revenue at `creditPrice`. SIGHT incentive scales production by the per-kg
rate to ₹ crore (÷1e7). Ammonia LCOP takes the engine's LCOH, divides by 0.178 to get $/kg-NH₃ from the
hydrogen input, and adds a Haber-Bosch CAPEX annuity + OPEX. IMO GFI compliance compares fuel well-to-wake
intensity to the reference line.

### 7.4 Worked example (carbon credits)

`h2ProductionKtpa = 100`, `co2KgPerKgH2 = 1.0` (green), `greyBaseline = 10`, `creditPrice = $15/t`,
`jcmSplit = 60`:
- `tonnesH2 = 100·1e6 = 100,000,000 kg` (= 100 kt).
- `actualCO2 = 1e8·1.0 = 1e8 kg`; `greyBaselineCO2 = 1e8·10 = 1e9 kg`.
- `creditsGross = (1e9 − 1e8)/1e6 = 9e8/1e6 = 900 MtCO₂e`… note units: kg÷1e6 = kt, so **900 ktCO₂e** = 0.9
  MtCO₂e avoided (the ÷1e6 converts kg→kt, labelled Mt in code — a unit-label subtlety to verify).
- `creditsIndia = 0.9·0.60 = 0.54`, `creditsJapan = 0.9·0.40 = 0.36`.
- `revenue = 0.9·15·1e6 = $13.5M` (credits × price × 1e6 to restore tonnes).

The avoided-emissions logic (grey baseline − actual, split by Article-6 share) is methodologically sound;
the unit-scaling (kg→kt vs Mt labelling) should be checked against the displayed KPI unit.

### 7.5 Data provenance & limitations

- Hydrogen GHG/LCOH/RFNBO rest on the **real engine**; ammonia, credit and SIGHT layers are **frontend
  formulas over seeded `DEVELOPERS`/`COST_CURVE_*` data** (`sr(seed)=frac(sin(seed+1)·10⁴)`).
- The carbon-credit baseline is a single grey-SMR figure, not a project-specific, additionality-tested
  baseline — real Article-6 crediting requires a validated baseline and corresponding adjustment.
- No leakage, permanence, or buffer treatment on the credits; Article-6 split is a slider, not a treaty term.

**Framework alignment:** EU RFNBO 2023/1184-85 + ISO 14040/44 (H2 layer, via engine); Ammonia Energy
Association / IRENA electrofuels (green-NH₃ cost & carbon intensity); IMO MEPC 80 2023 GHG strategy (GFI
well-to-wake fuel-intensity compliance); Paris Article 6.2 ITMOs and the Japan-Crediting-Mechanism (the
India/Japan credit split); India SIGHT incentive (Green Hydrogen Mission). The avoided-emissions credit
uses a baseline-minus-actual method consistent with Article-6/CDM logic, simplified.

## 8 · Model Specification — Article-6 Green-H2/NH₃ Avoided-Emissions Crediting Model

**Status: specification — not yet implemented in code.** The credit engine here uses a fixed grey baseline;
a bankable Article-6 model needs validated baselines and corresponding adjustments.

### 8.1 Purpose & scope
Quantify issuable, corresponding-adjusted carbon credits (ITMOs) from green-H2/NH₃ displacing grey
production, for bilateral Article-6.2 transfers (e.g. India→Japan) — the volume, price and revenue an
offtake/credit deal can bank.

### 8.2 Conceptual approach
Baseline-and-crediting per **Article 6.4 / CDM methodology** and the **IMO/IRENA well-to-wake accounting**,
benchmarked against Gold Standard / Verra industrial-fuel-switch methodologies: a project-specific,
additionality-tested baseline, monitored actual emissions, leakage, and a corresponding adjustment so the
host country does not also count the reduction.

### 8.3 Mathematical specification
```
Baseline_t   = Production_t · EF_baseline(displaced grey/blue, well-to-wake)     tCO₂e
Actual_t     = Production_t · EF_project(monitored, incl. grid/RE mix)           tCO₂e
Leakage_t    = upstream/indirect emissions not in project boundary
ER_t (emission reductions) = Baseline_t − Actual_t − Leakage_t
Issued_t     = ER_t · (1 − buffer%)                    (permanence buffer if applicable)
ITMO_host    = Issued_t · (1 − corresponding_adj%)      (adjustment retained by host)
ITMO_transfer = Issued_t · adj_share                    (bilateral split, e.g. India/Japan)
Revenue      = ITMO_transfer · Price_ITMO
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `EF_baseline` | displaced-fuel intensity | IEA well-to-wake; grey SMR ~10 kgCO₂/kgH2 |
| `EF_project` | monitored actual | facility RFNBO GHG (engine) |
| `Leakage` | indirect emissions | methodology default (CDM/Verra) |
| buffer% | non-permanence pool | Article 6.4 rules (if applicable) |
| corresponding_adj% | host retention | bilateral Article-6.2 agreement |
| `Price_ITMO` | credit price | JCM/voluntary market |

### 8.4 Data requirements
Production volumes, monitored project emissions (from RFNBO GHG accounting), baseline determination, host-
country adjustment terms, ITMO price. Sources: engine GHG output (present), Article-6 methodology and
bilateral agreement (external), price benchmarks. The module holds production sliders and a grey baseline;
additionality/leakage/adjustment are absent.

### 8.5 Validation & benchmarking plan
Reconcile ER against an approved Article-6.4/CDM methodology worked example; validate baseline against
grey/blue counterfactual; sensitivity to grid EF and displaced-fuel choice; check corresponding-adjustment
accounting sums to zero double-counting.

### 8.6 Limitations & model risk
Baseline and additionality determine credibility — a fixed grey baseline overstates credits where blue H2
is the realistic counterfactual. Corresponding adjustments and buffer pools materially reduce transferable
volume. Conservative fallback: credit against the *lower* of grey- and blue-baseline, apply a leakage
discount, and treat pre-issuance volumes as indicative only.
