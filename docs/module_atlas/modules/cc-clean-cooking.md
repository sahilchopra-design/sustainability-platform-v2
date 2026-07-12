# Clean Cooking Carbon Credits
**Module ID:** `cc-clean-cooking` · **Route:** `/cc-clean-cooking` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for clean cookstove projects under Gold Standard Metered Methodology and UNFCCC CDM AMS-II.G. Models baseline fuel consumption, stove efficiency, fNRB factors, and household monitoring protocols.

> **Business value:** Annual ER per household = (baseline – project fuel) × NCV × EF × fNRB. fNRB is the single largest uncertainty driver (CV ±15%).

**How an analyst works this module:**
- Select country and fuel type (woodfuel, charcoal, LPG displacement)
- fNRB tab shows country factor and data source
- Household Model computes per-HH emission reductions
- Scale-up tab aggregates across project households
- Monitoring Protocol shows KPT frequency and sampling design

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES_CC`, `Card`, `DualInput`, `Kpi`, `PROJECTS_CC`, `SDG_GOALS`, `Section`, `TECH_TYPES_CC`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_TYPES_CC` | 5 | `id`, `name`, `baseline_eff`, `project_eff`, `fuel`, `color` |
| `SDG_GOALS` | 5 | `sdg`, `name`, `icon`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `stoves` | `Math.round(5000+sr(i*7)*95000);` |
| `adoption` | `parseFloat((0.60+sr(i*11)*0.35).toFixed(2));` |
| `fnrb` | `parseFloat((0.50+sr(i*13)*0.45).toFixed(2));` |
| `fuelKg` | `parseFloat((3.5+sr(i*17)*4.5).toFixed(1));` |
| `stackFactor` | `parseFloat((0.70+sr(i*19)*0.25).toFixed(2));` |
| `rebound` | `parseFloat((0.05+sr(i*23)*0.12).toFixed(2));` |
| `blFuel` | `fuelKg*365;` |
| `pjFuel` | `blFuel*(tech.baseline_eff/tech.project_eff)*stackFactor;` |
| `sdgScores` | `SDG_GOALS.map(g=>Math.round(40+sr(i*31+g.sdg*7)*55));` |
| `blFuelAnnual` | `fuelKg*365;` |
| `bePerHH` | `blFuelAnnual*ncv*ef*1e-6*fnrb;` |
| `pjFuelAnnual` | `blFuelAnnual*(blEff/pjEff)*stackFactor;` |
| `pjEmissions` | `pjFuelAnnual*ncv*ef*1e-6*fnrb;` |
| `erPerHH` | `bePerHH*(1-rebound)-pjEmissions;` |
| `totalER` | `erPerHH*stoves*adoption;` |
| `TABS` | `['Methodology Overview','Baseline Emissions Calculator','Emission Reductions','fNRB Assessment','SDG Co-Benefits','Usage Monitoring'];` |
| `cookResult` | `useMemo(()=>calcCleanCooking(cp),[cp]);  useEffect(() => { if (cookResult && cookResult.netCredits > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'AMS-II.G', family: 'energy',` |
| `fnrbCalc` | `useMemo(()=>{ const fnrb=Math.min(1,Math.max(0,(fnrbDemand-fnrbSupply)/Math.max(fnrbDemand,1)));` |
| `adjusted` | `fnrb*(fnrbForest/100);` |
| `sensitivity` | `[20,30,40,50,60,70,80].map(d=>{` |
| `sdgAvg` | `useMemo(()=>SDG_GOALS.map((g,gi)=>{` |
| `avg` | `Math.round(PROJECTS_CC.reduce((s,pr)=>s+pr.sdgScores[gi],0)/PROJECTS_CC.length);` |
| `portStats` | `useMemo(()=>{ const totalCredits=PROJECTS_CC.reduce((s,pr)=>s+pr.credits,0);` |
| `totalStoves` | `PROJECTS_CC.reduce((s,pr)=>s+pr.stoves,0);` |
| `avgAdoption` | `parseFloat((PROJECTS_CC.reduce((s,pr)=>s+pr.adoption,0)/PROJECTS_CC.length).toFixed(2));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_CC`, `SDG_GOALS`, `TABS`, `TECH_TYPES_CC`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| fNRB Factor | `Country-level WISDOM analysis` | Gold Standard fNRB tool | Fraction of wood fuel harvested unsustainably; drives net credit calculation |
| Baseline Fuel Use | `Kitchen Performance Test` | Field survey | Daily wood or charcoal consumption on traditional stove |
| Stove Efficiency Gain | `(FC_base – FC_proj) / FC_base` | Controlled Cooking Test | Efficiency improvement of improved cookstove vs baseline |
| Annual ER per HH | `ER_HH formula` | Model output | Verified emission reductions per household per year |
- **WISDOM database** → Country wood balance → fNRB → **Non-renewable fraction**
- **KPT field data** → Fuel weighing surveys → consumption rates → **Baseline and project fuel use**

## 5 · Intermediate Transformation Logic
**Methodology:** Gold Standard Metered Cookstove Methodology
**Headline formula:** `ER_HH = (FC_baseline – FC_project) × NCV × EF_fuelwood × fNRB`

Baseline fuel consumption estimated via kitchen performance tests (KPT) on traditional stoves. Project consumption measured on metered improved stoves. Net calorific value (NCV) and emission factor per fuel type applied. fNRB (fraction of non-renewable biomass) is a country/region-specific factor (0.4–0.95) representing unsustainable wood harvest. ER = household emission reductions per year.

**Standards:** ['Gold Standard Metered v2', 'CDM AMS-II.G', 'IPCC Tier 2']
**Reference documents:** Gold Standard Metered Methodology v2.0; CDM AMS-II.G Cookstove Methodology; IPCC 2006 Stationary Combustion EF; WISDOM Woodfuel Analysis Tool

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Guide and code agree: a Gold Standard Metered / CDM AMS-II.G clean-cookstove emission-reduction
model with an explicit fraction-of-non-renewable-biomass (fNRB) engine. The calculator is a real
implementation; the 8-project portfolio and usage-monitoring series are synthetic.

### 7.1 What the module computes

`calcCleanCooking` (lines 70–90) implements the AMS-II.G / Gold Standard emission-reduction identity:

```js
blFuelAnnual = fuelKg × 365
bePerHH      = blFuelAnnual × NCV × EF × 1e-6 × fNRB          // baseline emissions/household
pjFuelAnnual = blFuelAnnual × (blEff/pjEff) × stackFactor     // project fuel via efficiency ratio
pjEmissions  = pjFuelAnnual × NCV × EF × 1e-6 × fNRB
erPerHH      = bePerHH × (1 − rebound) − pjEmissions
totalER      = erPerHH × stoves × adoption
netCredits   = max(0, round(totalER × 0.90))                  // 10% conservativeness/buffer
```

The `1e-6` converts kg fuel × (MJ/kg) × (kgCO₂/TJ… i.e. gCO₂/MJ scaled) into tCO₂e. The fNRB is
applied to *both* baseline and project fuel (both are biomass) — the inline comment flags this as a
correction over an earlier arbitrary ×0.1.

**fNRB engine** (`fnrbCalc`, lines 125–133):

```js
fNRB     = clip01((demand − supply) / max(demand, 1))         // non-renewable share of woodfuel
adjusted = fNRB × (forest_fraction / 100)
```

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `NCV` (net calorific value) | 15.6 MJ/kg | IPCC default woodfuel NCV (2006 GL, ~15.6 GJ/t) |
| `EF` (emission factor) | 112.0 (tCO₂/TJ ≡ gCO₂/MJ scaled) | IPCC default for wood/biomass combustion (~112 tCO₂/TJ) |
| `fNRB` | 0.72 default | Country WISDOM/CDM TOOL30 value; range 0.40–0.95 |
| `blEff` / `pjEff` | 0.10 / 0.40 | Three-stone fire ~10% vs improved stove ~40% thermal efficiency |
| `stackFactor` | 0.80 | Fuel-stacking: households partly keep old stove |
| `rebound` | 0.10 | Increased cooking after efficiency gain |
| `adoption` | 0.75 | Fraction of distributed stoves in active use |
| Conservativeness | ×0.90 (netCredits) | 10% deduction proxy (buffer/uncertainty) |

### 7.3 Calculation walkthrough

1. Baseline household emissions from annual woodfuel × NCV × EF × fNRB.
2. Project fuel = baseline fuel scaled by efficiency ratio (`blEff/pjEff` < 1) × stacking factor;
   project emissions computed identically.
3. Per-household ER = baseline (net of rebound) − project emissions.
4. Scaled to programme by `stoves × adoption`, then ×0.90 conservativeness → issuable credits.
5. **fNRB tab** derives the non-renewable fraction from woodfuel demand-supply balance and adjusts by
   forest cover; a sensitivity sweep varies demand 20–80.
6. Result pushed to `CarbonCreditContext` as methodology `AMS-II.G`, family `energy`.

### 7.4 Worked example

Defaults: fuelKg 5.0, NCV 15.6, EF 112, fNRB 0.72, blEff 0.10, pjEff 0.40, stack 0.80, rebound 0.10,
stoves 20,000, adoption 0.75:

| Step | Computation | Result |
|---|---|---|
| Baseline fuel | 5.0 × 365 | 1,825 kg/yr |
| bePerHH | 1,825 × 15.6 × 112 × 1e-6 × 0.72 | 2.296 tCO₂e |
| Project fuel | 1,825 × (0.10/0.40) × 0.80 | 365 kg/yr |
| pjEmissions | 365 × 15.6 × 112 × 1e-6 × 0.72 | 0.459 tCO₂e |
| erPerHH | 2.296 × (1 − 0.10) − 0.459 | 1.607 tCO₂e |
| totalER | 1.607 × 20,000 × 0.75 | 24,105 tCO₂e |
| netCredits | 24,105 × 0.90 | **≈21,695 tCO₂e** |

### 7.5 Data provenance & limitations

- **Calculator is a real AMS-II.G/GS model; portfolio and monitoring are synthetic** (`sr(seed)=
  frac(sin(seed+1)×10⁴)` for the 8 `PROJECTS_CC` and the 12-month usage series).
- The ER waterfall's "Stacking Loss" term carries a `×0.3` presentation fudge (line 84) that is not
  part of the headline `totalER` — cosmetic only.
- fNRB, the single largest uncertainty driver (guide notes CV ±15%), is a single value, not a
  probabilistic distribution; no Monte Carlo.
- Conservativeness is a flat 10% ×0.90, not a metered-methodology usage-survey drop-out adjustment.

**Framework alignment:** **CDM AMS-II.G** and **Gold Standard Metered & Measured Methodology** — the
`BE − PE` structure with NCV × EF × fNRB is the canonical cookstove ER identity · **CDM TOOL30 /
WISDOM** for fNRB (here approximated by a demand-supply woodfuel balance) · **IPCC 2006 Stationary
Combustion** EFs (NCV 15.6 MJ/kg, EF 112 tCO₂/TJ). fNRB in the real standard is a nationally gazetted
value from a woodfuel supply-demand model; the module reproduces that logic in miniature.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrated fNRB with propagated uncertainty (analytics ladder: rung 1 → 3)

**What.** The module's own overview names fNRB as the single largest uncertainty driver
(CV ±15%), and §7 shows `calcCleanCooking` is a real AMS-II.G / Gold Standard
implementation with an explicit `fnrbCalc` engine — but fNRB currently comes from an
in-page heuristic over seeded `COUNTRIES_CC` values. Evolution A replaces this with a
country reference table seeded from the published CDM TOOL30 default values and the
Bailis et al. WISDOM/MoFuSS estimates the reference list already cites, then propagates
fNRB and KPT sampling uncertainty through `erPerHH` as a distribution, not a point.

**How.** (1) `ref_fnrb_country(iso3, fnrb_default, fnrb_low, fnrb_high, source,
vintage)` table + refdata endpoint, following the platform's Tier-1 reference-data
pattern. (2) Monte Carlo over fNRB, baseline fuel (KPT CV), and rebound — the platform's
standardized PRNG conventions apply — reporting P5/P50/P95 net credits alongside the
existing deterministic `netCredits = totalER × 0.90`. (3) Show which conservativeness
deduction binds: the flat 10% buffer or the P25 statistical bound.

**Prerequisites.** fNRB source vintages documented per §8 model-card convention; the
synthetic 8-project portfolio labeled as demo data. **Acceptance:** same inputs with
Kenya vs Ghana fNRB defaults produce different, source-cited ER ranges; P50 matches the
deterministic path within 1%.

### 9.2 Evolution B — Methodology copilot with in-page what-ifs (LLM tier 1 → 2)

**What.** A copilot that explains the AMS-II.G identity the page actually implements
(`erPerHH = bePerHH × (1 − rebound) − pjEmissions`, fNRB applied to both baseline and
project — a subtlety §7 documents as a deliberate correction) and answers "why did
credits drop when I raised stove efficiency?" from the live calculator state. Because
`calcCleanCooking` is a real deterministic function, the tier-2 step can execute
what-ifs ("assume fNRB 0.55, 40% adoption") by re-invoking the page calculator with
LLM-proposed parameters and narrating only the returned numbers.

**How.** Tier 1: atlas §5/§7 as RAG corpus, current input panel + results passed as
context. Tier 2: a client-side tool schema wrapping `calcCleanCooking` and `fnrbCalc`
(no backend exists to call — this module has no API routes), with the no-fabrication
validator checking answer numerics against tool returns.

**Prerequisites.** Evolution A's fNRB reference table, so the copilot cites sources
rather than seed values. **Acceptance:** every ER figure in an answer matches a
calculator invocation logged in the conversation; "what's the VER price?" is refused as
outside the module's computed surface.