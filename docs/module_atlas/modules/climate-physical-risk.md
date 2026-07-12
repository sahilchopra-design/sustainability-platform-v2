# Climate Physical Risk Assessment
**Module ID:** `climate-physical-risk` · **Route:** `/climate-physical-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive physical climate risk assessment covering acute hazards (flood, TC, wildfire) and chronic stressors (heat, SLR, drought) with NatCat loss estimation and TCFD alignment.

> **Business value:** Physical climate risk quantification underpins insurance adequacy, capital planning, TCFD/ISSB disclosure, and climate-adjusted asset valuation. This module provides the actuarial-grade loss modelling needed for credible physical risk disclosure and management.

**How an analyst works this module:**
- Peril Selection chooses hazards to model
- Asset Upload ingests portfolio with geolocation data
- Risk Map overlays assets on hazard probability maps
- Loss Curve shows exceedance probability vs loss amount
- Climate Change Impact compares current vs 2050/2100 risk under SSPs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `PERIL`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERIL` | 8 | `peril`, `rcp26`, `rcp45`, `rcp85` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND` | `Array.from({length:10},(_,i)=>({year:2025+i*3,rcp26Loss:+(1.5+i*0.2+sr(i*7)*0.3).toFixed(1),rcp45Loss:+(2+i*0.5+sr(i*11)*0.4).toFixed(1),rcp85Loss:+(2.5+i*1+sr(i*13)*0.6).toFixed(1)}));` |
| `filtered` | `useMemo(()=>{let d=[...ASSETS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRisk:(filtered.reduce((s,r)=>s+r.compositeRisk,0)/filtered.length\|\|0).toFixed(0),critical:filtered.filter(r=>r.riskLevel==='Critical'\|\|r.riskLevel==='High').length,totalValue:filter` |
| `riskDist` | `useMemo(()=>{const order=['Critical','High','Elevated','Moderate','Low'];const m={};filtered.forEach(r=>{m[r.riskLevel]=(m[r.riskLevel]\|\|0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[filtered]);` |
| `sectorRisk` | `useMemo(()=>{const m={};ASSETS.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,risk:0,n:0};m[r.sector].risk+=r.compositeRisk;m[r.sector].n++;});return Object.values(m).map(s=>({sector:s.s,risk:Math.round(s.risk/s.n)}` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const u` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERIL`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Perils Covered | — | Model | Flood, TC, wildfire, storm surge, drought, heat, SLR, hail |
| Return Periods | — | Loss curve | Loss at 10, 20, 50, 100, 200, 500-year frequency |
| AAL | — | Model output | Annual average loss as % of asset value |
- **Asset geolocation** → Hazard map overlay → **Exposure score per asset**
- **Hazard intensity data** → Damage function → **Loss fraction per event**
- **Loss distribution** → Return period integration → **Annual average loss**

## 5 · Intermediate Transformation Logic
**Methodology:** Hazard-exposure-vulnerability framework
**Headline formula:** `PhysRisk = Hazard × Exposure × Vulnerability; Loss = PhysRisk × AssetValue × DamageFn`

Hazard: climate-modelled intensity (e.g., flood depth, wind speed). Exposure: asset location within hazard footprint. Vulnerability: damage function relating intensity to loss fraction. Output: AAL and loss curve for 10-500yr return periods.

**Standards:** ['IPCC AR6 WGI', 'IPCC AR6 WGII', 'Swiss Re CResta']
**Reference documents:** IPCC AR6 WGI Chapter 12 (Sectoral impacts); Swiss Re Sigma Natural Catastrophes; Munich Re NatCatSERVICE; NOAA NCEI Climate Data

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an actuarial
> hazard-exposure-vulnerability engine: `PhysRisk = Hazard × Exposure × Vulnerability`,
> `Loss = PhysRisk × AssetValue × DamageFn`, and an **exceedance-probability loss curve for
> 10–500-year return periods** yielding **AAL**. **The code implements none of these products.**
> `compositeRisk`, `exposure` and `vulnerability` are each *independent* seeded draws — the
> composite is **not** the product of the other two — and `annualLoss` is a direct seeded number,
> not integrated from any loss curve. There are no damage functions and no return-period
> exceedance curve (the "projection" chart is a time trajectory, not an EP curve). It is a
> synthetic multi-peril *screening* dashboard, documented below.

### 7.1 What the module computes

50 named coastal/industrial assets are generated once. Per asset `i`:

```js
compositeRisk = round(10 + sr(i*7)*85);       // 10–95   (INDEPENDENT draw)
floodRisk     = round(sr(i*11)*100);
heatStress    = round(sr(i*13)*100);
cycloneRisk   = round(sr(i*17)*90);
seaLevelRise  = round(sr(i*19)*100);
wildfire      = round(sr(i*23)*80);
drought       = round(sr(i*29)*90);
assetValue    = round(50 + sr(i*37)*4950);    // $M
annualLoss    = (sr(i*41)*8 + 0.1).toFixed(1);// 0.1–8.1 % (INDEPENDENT draw)
adaptationCost= round(sr(i*47)*200);
resilience    = round(10 + sr(i*53)*80);
exposure      = round(sr(i*59)*100);
vulnerability = round(sr(i*61)*100);
rcp26Impact   = (sr(i*67)*5).toFixed(1);
rcp85Impact   = (sr(i*71)*15).toFixed(1);
riskLevel     = sr(i*7)<0.15?'Critical':<0.35?'High':<0.55?'Elevated':<0.8?'Moderate':'Low';
```

Note `riskLevel` and `compositeRisk` share the `sr(i*7)` draw, so they are consistent with each
other — but neither is a function of the peril sub-scores or of exposure/vulnerability.

### 7.2 Parameterisation & provenance

| Constant | Value | Provenance |
|---|---|---|
| `PERIL` scenario table | 8 perils × (RCP2.6, RCP4.5, RCP8.5) e.g. Coastal Flooding 22/35/62; Heat Stress 25/42/72 | Hard-coded illustrative index scores; RCP-ordering realistic (8.5 ≫ 2.6) but values authored |
| `TREND` | 10 tri-annual points, `rcp26Loss = 1.5 + i·0.2 + sr(i·7)·0.3` etc. | Seeded upward drift; 8.5 slope steepest (`+1.0·i`) |
| `assetValue` | `50 + sr·4950` $M | Synthetic |
| `annualLoss` | `sr·8 + 0.1` % | Synthetic — **not** AAL-integrated |
| Sector labels | 50-element `secs[]` array | Authored mapping (Real Estate / Infrastructure / Tourism heavy) |
| Risk-level cutoffs | 0.15 / 0.35 / 0.55 / 0.80 on `sr(i*7)` | Authored quantile bands |

PRNG: `sr(s) = frac(sin(s+1) × 10⁴)`.

### 7.3 Calculation walkthrough

1. **Filter/sort** `ASSETS` by search + sector into `filtered`.
2. **KPIs**: `avgRisk = mean(compositeRisk)`, `critical = count(riskLevel ∈ {Critical,High})`,
   `totalValue = Σ assetValue`, `avgLoss = mean(annualLoss)`.
3. **Risk distribution** buckets `filtered` by `riskLevel` (fixed order Critical→Low).
4. **Sector risk** averages `compositeRisk` within each sector (over all `ASSETS`).
5. **Scatter views** plot the raw seeded fields against each other (exposure vs vulnerability,
   flood vs SLR, RCP2.6 vs RCP8.5) — purely descriptive.
6. **Value-at-risk bar** ranks assets by `assetValue × annualLoss/100` (the closest thing to a
   loss metric), then shows `annualLoss %` for the top 12.

### 7.4 Worked example — the H×E×V disconnect

Take asset index `i = 1`. The relevant seeds evaluate to approximately
`sr(7) ≈ 0.60`, `sr(11) ≈ 0.34`, `sr(59) ≈ 0.43`, `sr(61) ≈ 0.60`:

| Field | Formula | Value |
|---|---|---|
| compositeRisk | `round(10 + 0.60·85)` | **61** |
| floodRisk | `round(0.34·100)` | 34 |
| exposure | `round(0.43·100)` | 43 |
| vulnerability | `round(0.60·100)` | 60 |
| riskLevel | `sr(7)=0.60 → <0.8` | Moderate |

If the guide's methodology were implemented, composite risk would be
`Hazard × Exposure × Vulnerability ∝ 0.43 × 0.60 ≈ 0.258` → a ~26 on a 0–100 scale — **not the 61
actually shown**. The two numbers come from different PRNG seeds, proving the composite is a
standalone draw. Likewise a "loss" under the guide would be `PhysRisk × AssetValue × DamageFn`;
the code instead shows the independent `annualLoss` seed (here `sr(41)·8+0.1`), so value-at-risk
`= assetValue × annualLoss/100` is the product of two unrelated random fields.

### 7.5 Seed-collision caveat (asset i = 0)

Because every field for `i = 0` uses `sr(0)` (since `0 × k = 0`), the first asset has
`compositeRisk`, `floodRisk`, `heatStress`, … all driven by the single value `sr(0) ≈ 0.47` —
its peril radar is nearly uniform by construction. This is a generator artefact, not a real
hazard profile.

### 7.6 Data provenance & limitations

- **All asset risk, exposure, loss and scenario-impact values are synthetic**, from
  `sr(s)=frac(sin(s+1)×10⁴)`. Asset *names* are real places (NYC Financial District, Jakarta
  Industrial, Tuvalu Infrastructure) chosen for coastal-hazard plausibility, but their scores are
  seeded.
- **No damage functions, no exceedance-probability curve, no AAL integration** — despite the KPI
  legend citing "AAL 0.05–2.0% of AV" and "10–500yr return periods". `annualLoss` is a flat draw.
- **compositeRisk ⟂ (exposure, vulnerability, peril sub-scores)** — the headline metric is not
  derived from its constituents, so drill-downs cannot reconcile to it.
- The `PERIL` and `TREND` tables preserve the correct qualitative **RCP ordering**
  (8.5 > 4.5 > 2.6) but their magnitudes are authored index points, not modelled losses.

**Framework alignment:** *IPCC AR6 risk framing* — risk as the interaction of hazard, exposure and
vulnerability is the conceptual scaffold (fields exist for all three) but is not multiplied
through as AR6 prescribes. *RCP scenarios* (AR5/CMIP5 concentration pathways 2.6/4.5/8.5) — used as
the three scenario columns with correct relative severity. *Swiss Re / Munich Re NatCat practice* —
the guide's AAL + return-period loss-curve language reflects standard catastrophe-model outputs
(EP curve → AAL, PML at 100/250-yr); the module references but does not compute them.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays asset-level physical
risk scores, annual losses, value-at-risk and RCP-scenario impacts used for insurance-adequacy,
capital-planning and TCFD/ISSB disclosure — all `sr()`-seeded. A production build requires a
catastrophe-model-grade hazard-exposure-vulnerability engine.

**8.1 Purpose & scope.** Quantify acute (flood, tropical cyclone, wildfire, storm surge, hail) and
chronic (heat, sea-level rise, drought) physical-climate losses at asset and portfolio level,
producing AAL, loss exceedance curves, and forward-looking loss under RCP/SSP pathways for
underwriting, capital and disclosure.

**8.2 Conceptual approach.** Standard three-module catastrophe model, mirroring
**Swiss Re CatNet / Moody's RMS / Verisk (AIR)** and the **Oasis Loss Modelling Framework**: a
**hazard** module (stochastic event set → intensity footprints), an **exposure** module (asset
location, value, construction), and a **vulnerability** module (intensity→damage-ratio functions).
Climate conditioning follows **NGFS**/**IPCC AR6** by shifting hazard frequency-severity with
scenario/decade, per **CRO-Forum** and **UNEP-FI TCFD** physical-risk guidance.

**8.3 Mathematical specification.**
```
Event loss:      L_{a,e} = V_a · DR_v(I_{e,loc(a)})                 (damage ratio × asset value)
Damage function: DR_v(I)  = beta CDF / lognormal in intensity I, per peril & construction class v
Portfolio EP:    EP(ℓ) = P( Σ_a L_{a,e} > ℓ )    over stochastic event set {e}
AAL:             AAL = ∫₀^∞ ℓ · f_L(ℓ) dℓ = Σ_e rate_e · L_e
Return-period:   Loss(RP) = EP⁻¹(1/RP)                             (100-yr, 250-yr PML…)
Climate shift:   rate_e(scn,t) = rate_e^base · μ_freq(peril,scn,t); I_e ← I_e · μ_sev(peril,scn,t)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Damage functions | `DR_v(I)` | Vendor cat-model vulnerability curves; FEMA Hazus; JRC global flood depth-damage |
| Event rates | `rate_e` | Historical + stochastic sets (EM-DAT, IBTrACS, NOAA) |
| Hazard footprints | `I_{e,loc}` | Fathom/JBA flood, IBTrACS wind fields, FWI wildfire |
| Frequency multipliers | `μ_freq` | IPCC AR6 WGI hazard changes by warming level |
| Severity multipliers | `μ_sev` | NGFS Phase IV / CMIP6 downscaled by RCP-SSP & decade |
| Asset value/geo | `V_a, loc(a)` | Portfolio upload (lat/long, replacement value, occupancy) |

**8.4 Data requirements.** Per asset: geocode, replacement value, construction/occupancy class,
elevation/first-floor height. Hazard layers: flood (Fathom/JBA or free JRC), TC (IBTrACS + wind
field), wildfire (FWI), SLR (NASA/IPCC). Rates: EM-DAT, Swiss Re sigma. The platform has asset
names and values but **lacks geocodes, hazard footprints and vulnerability curves** — all must be
sourced.

**8.5 Validation & benchmarking.** Reconcile modelled AAL and 100/250-yr PML against vendor cat-model
output on a benchmark portfolio (target ±15%). Back-test event losses against historical
catastrophes (Katrina, Harvey, 2011 Thai floods). Sensitivity on damage-function tail and on
climate multipliers; verify EP-curve monotonicity and that AAL = Σ rate·L. Reconcile scenario
uplift against Swiss Re / IPCC published loss-multiplier ranges (2.5×–4× by 2050).

**8.6 Limitations & model risk.** Vulnerability curves dominate loss uncertainty and are sparse
for non-US perils; secondary uncertainty (footprint resolution) is large for pluvial flood and
wildfire; climate multipliers are deeply scenario-dependent. Correlation/aggregation assumptions
drive tail PML. Conservative fallback: report AAL and PML as ranges with explicit model/parameter
uncertainty bands, and flag assets lacking a geocode rather than seeding a score.

## 9 · Future Evolution

### 9.1 Evolution A — Digital-twin composite instead of independent seeded draws (analytics ladder: rung 1 → 3)

**What.** §7 finds the guide's hazard-exposure-vulnerability engine entirely absent:
`compositeRisk`, `exposure`, and `vulnerability` are *independent* seeded draws (the
composite is not even the product of the other two), `annualLoss` is a direct seeded
number, and there are no damage functions or return-period exceedance curves. The
platform, however, has already built exactly the missing substrate twice over: the
Physical Risk Digital Twin (five populated hazard grids + composite scoring engine)
and the physical-risk-pricing module (E104, with return-period loss tables and the
copilot exemplar). Evolution A re-founds this screening dashboard on those: the 50
assets get coordinates, per-peril scores from grid lookups, a composite that is a
documented function of hazard × exposure × vulnerability (finally matching the
guide), and AAL/EP-curve figures delegated to the pricing engine rather than seeded.

**How.** (1) Asset schema gains lat/lon; per-peril scores via the twin's scoring
endpoints with `resolution_tier` shown. (2) Composite implemented as the guide's
H×E×V with exposure from asset value/footprint and vulnerability from asset-class
damage-function parameters shared with E104 — one damage-function library, not two.
(3) The "Climate Change Impact" tab re-based on the grids' scenario layers (SLR
scenarios exist in the twin's IPCC-AR6 data); the seeded TREND series deleted.
(4) Clarify the module's role vs E104 in both guides: screening (this page) vs
pricing (E104) — the interconnection graph should record the dependency.

**Prerequisites (hard).** PRNG purge; coordinates for the asset roster; flood/SLR
grid sparsity honestly surfaced (the twin's known coverage limits). **Acceptance:**
composite equals the documented H×E×V function of its displayed components; two
assets differing only in location differ per the grids; AAL figures reproduce via
the E104 engine; zero seeded risk numbers remain.

### 9.2 Evolution B — Portfolio screening copilot (LLM tier 2)

**What.** A screening assistant one level up from E104's underwriter copilot: "screen
this asset list and rank by composite risk", "which assets sit in cyclone-and-flood
overlap zones?", "why is the Rotterdam warehouse scored lower than the Miami tower?"
(decomposition into grid-sourced hazard terms and the H×E×V arithmetic), with deep
pricing questions ("price the premium") handed off to the physical-risk-pricing
module's copilot per the tier-3 routing pattern — the two modules sharing one
grounding corpus for hazard semantics.

**How.** Tool schemas over the twin's scoring endpoints and the new composite
function; the validator on every score and loss figure; handoff rules in the system
prompt keyed to the atlas interconnection edges; `resolution_tier` always narrated
for sparse-coverage assets.

**Prerequisites (hard).** Evolution A first — the current page's numbers are
independent random draws and any narration of them would be the exemplar's
warned-against failure mode verbatim. **Acceptance:** a ranking answer reproduces by
re-querying the scoring endpoints; comparative explanations cite grid values;
pricing requests route to E104 rather than being answered here.