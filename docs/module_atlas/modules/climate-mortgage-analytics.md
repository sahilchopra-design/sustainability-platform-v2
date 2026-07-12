# Climate Mortgage Analytics
**Module ID:** `climate-mortgage-analytics` · **Route:** `/climate-mortgage-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DE3 · **Sprint:** DE

## 1 · Overview
Integrates physical and transition climate risks into mortgage portfolio analysis. Models climate-adjusted LTV, probability of default (PD) uplift, loss given default (LGD) impact, and regulatory capital implications under Basel IV climate risk add-ons.

> **Business value:** Directly supports ECB supervisory expectations for banks' climate risk integration into credit risk frameworks. Enables IFRS 9 climate-adjusted provisioning, Pillar 2 capital add-on quantification, and EBA climate stress test submissions for mortgage books.

**How an analyst works this module:**
- Load mortgage tape with property EPC ratings and geocodes
- Apply climate beta coefficients to derive PD/LGD uplift
- Calculate climate-adjusted ECL by loan segment
- Model regulatory capital add-on under Pillar 2 climate scenarios
- Generate EBA-format climate stress test output

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COASTAL_SURCH`, `Card`, `EPC`, `FLOOD_SURCH`, `GREEN_DISC`, `KpiCard`, `MORTGAGES`, `PRODUCTS`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PRODUCTS` | `['Standard','Green Mortgage','Buy-to-Let','Right-to-Buy','Shared Ownership'];` |
| `epc` | `EPC[Math.floor(sr(i*7) * EPC.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `product` | `PRODUCTS[Math.floor(sr(i*13) * PRODUCTS.length)];` |
| `propVal` | `Math.round(150000 + sr(i*3) * 1350000);          // £` |
| `ltv` | `parseFloat((0.50 + sr(i*17) * 0.35).toFixed(3)); // 50–85%` |
| `loanAmt` | `parseFloat((propVal * ltv / 1000).toFixed(1));   // £k` |
| `origYear` | `2018 + Math.floor(sr(i*19) * 7);` |
| `tenor` | `20 + Math.floor(sr(i*23) * 10);                  // 20–30yr` |
| `baseRate` | `parseFloat((4.5 + sr(i*37) * 2.0).toFixed(2));  // %` |
| `greenDisc` | `GREEN_DISC[epc] / 100;` |
| `floodSurch` | `floodZone  ? FLOOD_SURCH  / 100 : 0;` |
| `coastSurch` | `coastalZone ? COASTAL_SURCH / 100 : 0;` |
| `climateRate` | `parseFloat((baseRate - greenDisc + floodSurch + coastSurch).toFixed(2));` |
| `adjPropVal` | `propVal * (1 - strandHaircut);` |
| `adjLtv` | `parseFloat((loanAmt * 1000 / adjPropVal).toFixed(3));` |
| `basePd` | `parseFloat((0.005 + sr(i*41) * 0.025).toFixed(4));` |
| `climPdUp` | `(floodZone ? 0.003 : 0) + (epcIdx >= 4 ? 0.005 : 0);` |
| `adjPd` | `parseFloat((basePd + climPdUp).toFixed(4));` |
| `rwaBase` | `parseFloat((loanAmt * basePd * lgd * 12.5).toFixed(1));` |
| `rwaClim` | `parseFloat((loanAmt * adjPd  * lgd * 12.5).toFixed(1));` |
| `totalBook` | `(filtered.reduce((s,m)=>s+m.loanAmt,0)/1000).toFixed(1);     // £M` |
| `avgClimRate` | `n ? (filtered.reduce((s,m)=>s+m.climateRate+rateSens/100,0)/n).toFixed(2) : '0';` |
| `totalRwaUp` | `filtered.reduce((s,m)=>s+m.rwaClim-m.rwaBase,0).toFixed(1);` |
| `epcDist` | `useMemo(() => EPC.map(e => {` |
| `regionData` | `useMemo(() => REGIONS.map(r => {` |
| `rateComp` | `useMemo(() => EPC.map(e => {` |
| `arrData` | `useMemo(() => ['High','Elevated','Normal'].map(risk => {` |
| `valHaircut` | `useMemo(() => EPC.map(e => {` |
| `rwaData` | `useMemo(() => PRODUCTS.map(p => {` |
| `pdTimeline` | `useMemo(() => [2025,2027,2030,2033,2036,2040].map((yr,i)=>({` |
| `totalSave` | `a.reduce((s,m)=>s+m.loanAmt*1000*disc/10000,0).toFixed(0);` |
| `avgSave` | `a.length?(a.reduce((s,m)=>s+m.loanAmt*1000*disc/10000,0)/a.length).toFixed(0):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EPC`, `PRODUCTS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate ECL Uplift | — | EBA Climate Stress Test 2023 | Mortgage ECL increases 8–22% under 3°C disorderly transition scenario by 2050 |
| EPC Premium on Collateral | — | Bank of England Research 2022 | EPC A/B properties carry 12% collateral premium; EPC E/F/G carry 15% discount in stressed LTV |
| Flood Zone PD Uplift | — | ECB Working Paper 2785 (2023) | Flood-zone mortgages show 34 bps higher realised default rate controlling for LTV and income |
- **Mortgage loan tape (EPC, geocode, LTV, PD)** → Climate risk overlay engine → **Loan-level climate PD/LGD uplift**
- **Property value indices + EPC transaction data** → Collateral revaluation → **Climate-adjusted LTV distribution**
- **EBA/ECB scenario parameters** → Capital calculation → **Pillar 2 add-on estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted PD / LGD
**Headline formula:** `PD_climate = PD_base × (1 + β_physical × HazardScore + β_transition × EPC_gap); LGD_climate = max(LGD_base, 1 - ClimateAdjustedLTV)`

Derives climate beta coefficients from empirical flood/EPC studies, applies them to loan-level PD/LGD, aggregates to Expected Credit Loss (ECL) uplift for IFRS 9 provisioning

**Standards:** ['ECB Guide on Climate and Environmental Risks 2020', 'EBA Climate Risk Stress Testing 2023', 'Basel III/IV BCBS Pillar 2 Guidance', 'Bank of England SS3/19']
**Reference documents:** ECB Guide on Climate and Environmental Risks (2020); EBA Report on Climate Risk Stress Testing (2023); Bank of England SS3/19 Climate-Related Financial Risks; BCBS Principles for Effective Management of Climate Risk (2022); IPCC AR6 WGII Chapter 16 — Key Risks

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`

## 7 · Methodology Deep Dive

The guide (EP-DE3) promises a climate-beta PD/LGD engine:
`PD_climate = PD_base × (1 + β_physical·HazardScore + β_transition·EPC_gap)`. The code implements a
**simpler additive** climate PD uplift and a green/flood/coastal **rate spread**, not the multiplicative
beta form — a modelling simplification worth noting, but the direction and Basel/IFRS-9 framing match.

### 7.1 What the module computes

Per synthetic UK mortgage (`i`-indexed), the page prices climate into three layers: **rate**, **PD**, and
**RWA/collateral**.

Climate-adjusted mortgage rate:
```js
climateRate = baseRate − greenDisc + floodSurch + coastSurch
   greenDisc  = GREEN_DISC[epc]/100          // discount for efficient EPC
   floodSurch = floodZone  ? FLOOD_SURCH/100  : 0
   coastSurch = coastalZone? COASTAL_SURCH/100: 0
```
Climate PD uplift (additive, not multiplicative):
```js
climPdUp = (floodZone ? 0.003 : 0) + (epcIdx >= 4 ? 0.005 : 0)   // +30bp flood, +50bp poor-EPC
adjPd    = basePd + climPdUp
```
Collateral / capital:
```js
adjPropVal = propVal * (1 - strandHaircut)                 // stranding haircut on value
adjLtv     = loanAmt*1000 / adjPropVal                     // climate-adjusted LTV
rwaBase    = loanAmt * basePd * lgd * 12.5                 // Basel RWA (1/8% = 12.5)
rwaClim    = loanAmt * adjPd  * lgd * 12.5
```

### 7.2 Parameterisation / scoring rubric

| Constant | Meaning | Provenance |
|---|---|---|
| `GREEN_DISC[epc]` | bp rate discount by EPC band | heuristic (green-mortgage pricing) |
| `FLOOD_SURCH`, `COASTAL_SURCH` | flood/coast rate surcharge | heuristic |
| `+0.003` flood PD, `+0.005` EPC≥E PD | additive PD uplift | heuristic; cf. guide's ECB WP-2785 "+34bp flood" |
| `12.5` | RWA density = 1/(8% capital) | Basel III standardised (BCBS) |
| `basePd` | `0.005+sr(i·41)·0.025` (0.5–3.0%) | synthetic demo value |
| `propVal` | `150k+sr(i·3)·1.35M` (£) | synthetic demo value |
| `ltv` | `0.50+sr(i·17)·0.35` (50–85%) | synthetic demo value |
| `baseRate` | `4.5+sr(i·37)·2.0` (%) | synthetic demo value |

### 7.3 Calculation walkthrough

`sr()` seeds → EPC/region/product/propVal/LTV/baseRate → `loanAmt = propVal·ltv/1000` (£k) →
green/flood/coastal flags set the rate adjustments → additive PD uplift → RWA base vs climate. Portfolio
KPIs: `totalBook` (£M), `avgClimRate` (adds a `rateSens` slider bp), `totalRwaUp` = Σ(rwaClim−rwaBase).
Companion `pdTimeline` projects PD to 2040 across a fixed horizon grid.

### 7.4 Worked example

Loan: `propVal=£400,000`, `ltv=0.70` → `loanAmt=£280.0k`; `basePd=1.2%`, `lgd=0.35`, `baseRate=5.20%`,
EPC "E" (epcIdx=4, GREEN_DISC=−0.10%), flood zone, `strandHaircut=8%`:

| Step | Computation | Result |
|---|---|---|
| Climate rate | 5.20 − (−0.10)? here greenDisc for E ≈ 0 + flood 0.25 | ≈ **5.45%** |
| PD uplift | flood 0.003 + EPC≥E 0.005 | +0.008 |
| adjPd | 0.012 + 0.008 | **2.0%** |
| adjPropVal | 400,000·(1−0.08) | £368,000 |
| adjLtv | 280,000/368,000 | **76.1%** (from 70%) |
| rwaBase | 280·0.012·0.35·12.5 | **£14.7k** |
| rwaClim | 280·0.020·0.35·12.5 | **£24.5k** |
| RWA uplift | 24.5 − 14.7 | **+£9.8k (+67%)** |

The flood + poor-EPC combination nearly doubles PD and lifts effective LTV by 6 pts — the collateral and
capital consequence the module is designed to surface.

### 7.5 Data provenance & limitations

- **All loan-tape data synthetic** (`sr()` PRNG). No real EPC register, geocode, or PD calibration.
- PD uplift is a flat step function (+30bp / +50bp), not a hazard-scaled beta; it ignores income/DTI and
  applies uniform LGD. No lifetime ECL, no IFRS-9 staging on-page, no discounting.
- Rate adjustments are indicative spreads, not derived from a competing-risks prepayment/default model.

**Framework alignment:** Basel III/IV standardised RWA (12.5 density, BCBS) · IFRS 9 ECL = PD·LGD·EAD
framing (guide) · ECB Guide on Climate & Environmental Risks 2020 and EBA Climate Stress Test 2023 as the
supervisory context the additive uplift approximates · BoE SS3/19.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Loan-level climate-adjusted PD, LGD and lifetime ECL for a residential mortgage
book, plus Pillar-2 capital add-on, under NGFS scenarios — the EBA climate-stress deliverable.

**8.2 Conceptual approach.** Multiplicative climate-beta on PD (as the guide states) with hazard-specific
physical damage functions and an EPC-gap transition channel, mirroring **ECB economy-wide CST** loan
transmission and **Bank of England CBES** mortgage modelling; LGD driven by climate-conditioned collateral
revaluation (CRREM-style stranding for the value path).

**8.3 Mathematical specification.**
```
PD_climate,t = PD_base × (1 + β_phys·HazardScore + β_trans·EPC_gap) under scenario s,horizon t
LGD_climate  = max( LGD_base , 1 − CollateralValue_climate/EAD )
CollateralValue_climate = V0 · (1 − depreciation_EPC − physicalDamage_hazard)
ECL_lifetime = Σ_t  PD_marginal,t · LGD_climate,t · EAD_t · DF_t
Pillar2_addon = ECL_climate,scenario − ECL_base
```

| Parameter | Calibration source |
|---|---|
| β_phys, β_trans | ECB WP-2785 flood-PD elasticity; EBA 2023 EPC-default study |
| Hazard damage functions | JRC river-flood depth-damage curves; UKCP18 hazard maps |
| EPC depreciation | BoE 2022 EPC collateral-premium research (−15% to +12%) |
| Scenario paths | NGFS Phase IV carbon-price / GDP / physical variables |

**8.4 Data requirements.** Loan tape with EPC + geocode + LTV + income; flood/coastal hazard layers (EA
flood zones, UKCP18); NGFS scenario variables (platform `climate_scenarios`, migration 088); property price
index. Free: EA/JRC flood maps, NGFS database; vendor: EPC register, AVM values.

**8.5 Validation & benchmarking.** Backtest flood-zone realised default differential; reconcile aggregate
ECL uplift against EBA 2023 "+8–22%" adverse-scenario range; sensitivity on β and stranding haircut.

**8.6 Limitations & model risk.** Sparse EPC coverage; hazard maps static vs forward SLR; behavioural
prepayment omitted. Fallback: regional EPC-band averages and conservative +34bp flood floor when
loan-level data missing.

## 9 · Future Evolution

### 9.1 Evolution A — EPC-register and flood-map grounded loan book (analytics ladder: rung 2 → 3)

**What.** §7's assessment is comparatively kind: the code implements a coherent
three-layer pricing (rate spread via green discount/flood/coastal surcharges,
additive PD uplift of +30bp flood / +50bp poor-EPC, stranding haircut → adjusted
LTV → RWA), differing from the guide's multiplicative beta form as a documented
simplification rather than a fabrication. The gap is inputs: the mortgage tape is
synthetic (`epc = EPC[⌊sr(i·7)·7⌋]`, seeded flood flags). The platform already wired
the two data sources this module needs during the data-sources wave: the UK EPC
register (property-level certificates) and Land Registry price data. Evolution A
builds the real tape path: postcode-level joins to EPC records and Environment
Agency flood-zone classifications, so PD uplifts and stranding haircuts attach to
actual property characteristics.

**How.** (1) Tape-upload schema (loan, postcode, value, product) with server-side
enrichment: EPC band from the register feed, flood zone from EA open flood-map data,
coastal flag from geography — each enrichment carrying `resolution_tier`.
(2) Coefficient evidence pass: the +30bp/+50bp uplifts and EPC rate spreads
benchmarked against published UK studies (BoE and lender research on EPC-rate and
flood-value differentials) — cite or label expert-set per §8 convention. (3) The
EBA-format stress output the guide promises implemented as a structured export over
the computed ECL segments.

**Prerequisites.** EPC feed auth (documented as changed — reverify); EA flood-map
licensing (open government licence). **Acceptance:** two loans differing only in
postcode get different flood surcharges traceable to EA zones; EPC bands match
register records; coefficients carry sources or explicit expert-set labels.

### 9.2 Evolution B — Mortgage-book climate analyst (LLM tier 2)

**What.** An assistant for portfolio managers and stress-test teams: "what's our ECL
uplift under the disorderly scenario and which segments drive it?" (segment
decomposition from the computed book), "why does this G-rated coastal loan carry
+80bp total?" (the additive build-up narrated term by term), "size the Pillar 2
add-on for the flood-zone concentration" — computed via client-side tool calls over
the pricing/PD/RWA functions (or backend routes if Evolution A moves enrichment
server-side, which it should).

**How.** Tool schemas over the three-layer calculators and segment aggregations;
validator on every bp, ECL, and RWA figure; supervisory-framing questions (SS3/19,
EBA templates) answered from the §5 corpus with citations; the coefficient-provenance
labels from Evolution A surface in prose when precision is challenged.

**Prerequisites.** Evolution A's enrichment path for real-book questions; synthetic-
tape mode clearly labelled in the interim. **Acceptance:** a segment-level ECL answer
reconciles to the aggregation function; per-loan explanations sum exactly to the
displayed rate/PD; the copilot refuses origination decisions ("should we approve this
loan?") as out of scope.