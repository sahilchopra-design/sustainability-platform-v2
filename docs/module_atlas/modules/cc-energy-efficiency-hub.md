# Energy Efficiency Carbon Credits Hub
**Module ID:** `cc-energy-efficiency-hub` · **Route:** `/cc-energy-efficiency-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Emission reduction quantification for industrial and building energy efficiency projects under IPMVP Option A/B/C/D measurement and verification protocols. Covers baseline setting, adjustment factors, and credit issuance under ISO 50001 and CDM AMS-II series.

> **Business value:** Verified ER = (adjusted baseline – project energy) × grid EF. Adjustment factors typically explain 70–90% of baseline variation in industrial applications.

**How an analyst works this module:**
- Select M&V option: A, B, C, or D
- Baseline Setting tab runs regression against adjustment variables
- Project Period tab meters post-implementation consumption
- Adjustment Calculator normalises for changed conditions
- Credit Issuance tab applies grid EF and exports to registry

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUILDING_TYPES`, `Badge`, `CATEGORIES`, `CAT_COLORS`, `Card`, `DER_TYPES`, `DualInput`, `INDUSTRIAL_TYPES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `DER_TYPES` | `['Rooftop Solar','Battery Storage','CHP System','Micro-Wind'];` |
| `subtype` | `cat===CATEGORIES[0]?BUILDING_TYPES[i%BUILDING_TYPES.length]:cat===CATEGORIES[1]?INDUSTRIAL_TYPES[(i-4)%INDUSTRIAL_TYPES.length]:DER_TYPES[(i-7)%DER_TYPES.length];` |
| `capacity` | `Math.round(50+sr(i*7)*950);` |
| `opHours` | `Math.round(2000+sr(i*11)*6000);` |
| `blEff` | `parseFloat((0.50+sr(i*17)*0.30).toFixed(2));` |
| `pjEff` | `parseFloat((0.75+sr(i*19)*0.20).toFixed(2));` |
| `gridEF` | `parseFloat((0.3+sr(i*23)*0.7).toFixed(3));` |
| `blEnergy` | `Math.round(capacity*opHours*lf/blEff);` |
| `pjEnergy` | `Math.round(capacity*opHours*lf/pjEff);` |
| `savings` | `blEnergy-pjEnergy;` |
| `credits` | `Math.round(savings*gridEF*1e-3*0.92);` |
| `savingsPct` | `(1-pjEnergy/blEnergy)*100;` |
| `ratio` | `hddNormal/Math.max(hddActual,1);` |
| `adjusted` | `measured*ratio;` |
| `eeResult` | `useMemo(()=>calcEnergyEff(ep),[ep]);  useEffect(() => { if (eeResult && eeResult.netCredits > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'AMS-II.C', family: 'energy',` |
| `derResult` | `useMemo(()=>{ const generation=derCapacity*derHours*derLF;` |
| `selfConsumed` | `generation*selfConsume;` |
| `exported` | `generation-selfConsumed;` |
| `storageLoss` | `selfConsumed*(1-storageEff)*0.3;` |
| `netGeneration` | `generation-storageLoss;` |
| `seasonalFactor` | `0.7+0.6*Math.sin((m-2)*Math.PI/6);` |
| `mGen` | `Math.round(generation/12*seasonalFactor);` |
| `mSelf` | `Math.round(mGen*selfConsume);` |
| `sensitivity` | `[1500,2000,2500,3000,3500,4000,4500].map(hdd=>{` |
| `hubStats` | `useMemo(()=>{ const totalCredits=PROJECTS.reduce((s,pr)=>s+pr.credits,0);` |
| `totalSavings` | `PROJECTS.reduce((s,pr)=>s+pr.savings,0);` |
| `totalInvestment` | `PROJECTS.reduce((s,pr)=>s+pr.investmentUSD,0);` |
| `avgPayback` | `parseFloat((PROJECTS.reduce((s,pr)=>s+pr.paybackYrs,0)/PROJECTS.length).toFixed(1));` |
| `byCat` | `CATEGORIES.map(c=>{const ps=PROJECTS.filter(pr=>pr.category===c);return {category:c,count:ps.length,credits:ps.reduce((s,pr)=>s+pr.credits,0),savings:ps.reduce((s,pr)=>s+pr.savings,0)};});` |
| `cddNorm` | `Math.round(pr.cdd*1.1);` |
| `adjEnergy` | `Math.round(pr.pjEnergy*(cddNorm/pr.cdd));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUILDING_TYPES`, `CATEGORIES`, `DER_TYPES`, `INDUSTRIAL_TYPES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Baseline Energy Intensity | `Regression vs production variable` | Utility metering | Energy per unit production in reference period |
| Adjustment Factors | `Regression coefficients` | IPMVP 2022 | Variables used to normalize baseline for changed conditions |
| Grid Emission Factor | `Regional annual average` | IEA Electricity EF database | Carbon intensity of grid electricity displaced by efficiency measures |
| Verified Savings | `Baseline – Project (adjusted)` | M&V report | Energy savings verified under selected IPMVP option |
- **Utility bills / smart meters** → Consumption data → baseline model → **Adjusted baseline kWh**
- **Grid operator data** → Regional EF → tCO₂ per MWh → **Verified ER tCO₂e**

## 5 · Intermediate Transformation Logic
**Methodology:** IPMVP M&V baseline-adjusted ER
**Headline formula:** `ER = (BaselineEnergy – ProjectEnergy) × EF_grid; BaselineAdj = Baseline × Σ(Adj_i)`

Baseline energy consumption established over 12-month reference period with regression-based adjustment for production, weather, and occupancy variables. IPMVP Option B: metered savings at system level. Option C: whole-facility utility billing. Adjustment factors normalize for changed conditions. Grid emission factor applies regional annual average or marginal factor per GHG Protocol.

**Standards:** ['IPMVP 2022', 'CDM AMS-II.A/C/E', 'ISO 50001', 'GHG Protocol Scope 2']
**Reference documents:** IPMVP 2022 International Performance Measurement & Verification Protocol; CDM AMS-II.A Industrial Energy Efficiency; ISO 50001:2018 Energy Management Systems; GHG Protocol Scope 2 Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Guide and code align: an IPMVP / CDM AMS-II series energy-efficiency emission-reduction calculator,
a distributed-energy-resource (DER) generation model, and a weather-normalisation (HDD/CDD) engine.
Calculators are real; the 10-project portfolio is synthetic.

### 7.1 What the module computes

**Energy-efficiency ER** (`calcEnergyEff`, lines 60–77):

```js
blEnergy   = capacity × opHours × lf / blEff       // baseline energy at baseline efficiency
pjEnergy   = capacity × opHours × lf / pjEff        // project energy at improved efficiency
savings    = max(0, blEnergy − pjEnergy)            // kWh saved (clamped ≥ 0)
be         = savings × gridEF × 1e-3                // tCO2 (gridEF tCO2/MWh, kWh→MWh)
netCredits = be × 0.92                              // 8% buffer/uncertainty deduction
savingsPct = (1 − pjEnergy/blEnergy) × 100
```

**Weather normalisation** (`calcWeatherNorm`):

```js
ratio    = hddNormal / max(hddActual, 1)
adjusted = measured × ratio                          // IPMVP routine adjustment to normal-year weather
```

**DER model** (`derResult`): `generation = capacity × hours × lf`, self-consumption split, storage
loss `selfConsumed × (1−storageEff) × 0.3`, credits on net generation × gridEF × 0.92.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `blEff` / `pjEff` | 0.60 / 0.85 | Baseline vs improved system efficiency (illustrative) |
| `gridEF` | 0.55 tCO₂/MWh | Regional grid emission factor (IEA-style; ~550 gCO₂/kWh) |
| `lf` (load factor) | 0.55 | Operating load factor |
| `opHours` | 4,500 h/yr | Annual operating hours |
| Buffer | ×0.92 (8% deduction) | Conservativeness proxy |
| Storage loss coefficient | ×0.3 of round-trip loss | DER self-consumption storage penalty |
| DER load factor | 0.20 | Rooftop-solar-style capacity factor |
| Seasonal factor | `0.7 + 0.6·sin((m−2)·π/6)` | Sinusoidal monthly generation shape |

### 7.3 Calculation walkthrough

1. Baseline and project energy computed from the same demand (`capacity × opHours × lf`) divided by
   respective efficiencies; the efficiency gain is the energy saving.
2. Savings × grid EF → baseline emissions avoided; ×0.92 buffer → net credits.
3. Result pushed to `CarbonCreditContext` as methodology `AMS-II.C`, family `energy`.
4. **Weather normalisation** rescales measured consumption by the ratio of normal-year to actual-year
   heating degree-days — the IPMVP routine-adjustment step — with a sensitivity sweep over HDD.
5. **DER model** builds generation, self-consumption/export split, storage loss, and a 12-month
   seasonal profile.

### 7.4 Worked example — Energy-Efficiency Calculator

Defaults: capacity 200, opHours 4,500, lf 0.55, blEff 0.60, pjEff 0.85, gridEF 0.55:

| Step | Computation | Result |
|---|---|---|
| Demand | 200 × 4,500 × 0.55 | 495,000 |
| Baseline energy | 495,000 / 0.60 | 825,000 kWh |
| Project energy | 495,000 / 0.85 | 582,353 kWh |
| Savings | 825,000 − 582,353 | 242,647 kWh |
| Baseline emissions (be) | 242,647 × 0.55 × 1e-3 | 133.5 tCO₂ |
| Net credits | 133.5 × 0.92 | **≈122.8 tCO₂e** |
| Savings % | (1 − 582,353/825,000) | **29.4%** |

### 7.5 Data provenance & limitations

- **Calculators are real; the 10-project registry is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Baseline is engineering-estimated from efficiency ratios, not a regression against production/
  weather/occupancy variables as full IPMVP Option B/C requires — the weather-normalisation tab is a
  standalone HDD ratio, not integrated into the ER baseline.
- Grid EF is a single annual-average value; marginal or hourly EFs (which the guide mentions) are not
  modelled.
- Buffer is a flat 8%; no measurement-uncertainty propagation.
- DER storage loss uses a `×0.3` heuristic scalar on round-trip loss, not a dispatch model.

**Framework alignment:** **IPMVP 2022** (the weather-normalisation ratio is the IPMVP routine
adjustment; the baseline-minus-project structure is IPMVP Option B/C) · **CDM AMS-II.A/C/E**
(small-scale energy efficiency) · **ISO 50001** energy-management baseline concept · **GHG Protocol
Scope 2** for the grid emission factor applied to saved kWh. The methodology tag written to the data
bus is `AMS-II.C` (industrial demand-side efficiency).

## 9 · Future Evolution

### 9.1 Evolution A — Regression baselines on real degree-day data (analytics ladder: rung 1 → 3)

**What.** The guide promises IPMVP Option C regression baselines ("adjustment factors
typically explain 70–90% of baseline variation"), but §7 shows the code implements a
simpler efficiency-ratio model (`blEnergy = capacity × opHours × lf / blEff`) and a
one-line weather normalisation (`adjusted = measured × hddNormal/hddActual`). Evolution
A closes that gap: an actual multivariate baseline regression (energy ~ HDD + CDD +
production + occupancy) fitted on 12–24 months of consumption history, with HDD/CDD
computed from the platform's already-wired Open-Meteo/NASA POWER weather feeds instead
of user-typed degree-day totals.

**How.** (1) Backend endpoint (this module currently has none) accepting a monthly
consumption series + site coordinates; statsmodels OLS with coefficient table, R², and
CV(RMSE) against the ASHRAE Guideline 14 thresholds the M&V world actually gates on.
(2) The existing `calcEnergyEff` path stays as the Option A/B engineering-estimate
route; the new regression is Option C, selected by the M&V option tab that already
exists. (3) Savings uncertainty from regression standard errors replaces the flat 8%
`netCredits = be × 0.92` buffer when Option C is used.

**Prerequisites.** Weather-feed lookup by site coordinates; demo consumption series
seeded honestly as fixtures. **Acceptance:** a fitted baseline reports R² and CV(RMSE),
and a synthetic site with known coefficients recovers them within tolerance
(bench-pinned regression case).

### 9.2 Evolution B — M&V analyst copilot (LLM tier 2)

**What.** An analyst-tier assistant for the M&V workflow: "which IPMVP option fits a
site with sub-metered chillers?", "re-run the adjustment with normal-year HDD 2,100",
"why did verified savings fall below the engineering estimate?". It explains from the
atlas corpus (IPMVP 2022 / AMS-II.A / ISO 50001 standards in §5) and, once Evolution
A's endpoint exists, executes re-runs as tool calls against the regression and
`calcEnergyEff` paths, narrating only returned numbers.

**How.** Tier-1 slice first: RAG over this atlas page plus current page state (the DER
model, weather-norm inputs, credit results are all on screen). Tier-2 slice adds the
Evolution A endpoint to the tool schema; the no-fabrication validator checks that every
kWh and tCO₂ figure in an answer appears in a tool response from the same conversation.

**Prerequisites.** Evolution A for the tool-calling step — today there is no backend
route to call, so tier 2 cannot ship first. **Acceptance:** copilot recommends an M&V
option with a §5-cited rationale; a requested re-run produces numbers byte-identical to
the endpoint response it cites.