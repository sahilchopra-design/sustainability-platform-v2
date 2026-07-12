# Maritime IMO Compliance
**Module ID:** `maritime-imo-compliance` · **Route:** `/maritime-imo-compliance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive compliance analytics for the IMO 2050 decarbonisation strategy, covering CII (Carbon Intensity Indicator) rating computation, EEXI (Energy Efficiency Existing Ship Index) compliance assessment, and EU MRV regulation CO2 reporting. Tracks fleet-level emission intensity trends against IMO trajectory and identifies vessels requiring technical or operational upgrades. Supports Poseidon Principles portfolio alignment for ship finance.

> **Business value:** Provides ship financiers, fleet operators, and ESG analysts with automated IMO compliance assessment and Poseidon Principles portfolio alignment tools to manage regulatory risk and decarbonise maritime lending portfolios.

**How an analyst works this module:**
- Import fleet register with vessel type, size class, flag state, build year, and installed engine specifications
- Upload EU MRV or IMO DCS voyage-level fuel consumption data for the reporting year
- Review automatically computed CII ratings, EEXI attained values, and trajectory alignment per vessel
- Identify vessels rated D/E and model corrective action options (speed reduction, engine power limitation, alternative fuels)
- Export Poseidon Principles climate alignment report and EU MRV aggregate CO2 emission disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CII_COLORS`, `CII_GRADES`, `CII_REDUCTION`, `CII_REF_PARAMS`, `COMPANIES`, `FLAG_STATES`, `FUELS`, `FUEL_CO2_FACTOR`, `IMO_PATHWAY`, `KPI`, `LOANS`, `PORTS`, `ProgressBar`, `QUARTERS`, `SHIP_TYPES`, `VESSEL_NAMES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FUELS` | 11 | `name`, `cost`, `availability`, `emReduction`, `infraReady`, `safety`, `scalability`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FUEL_CO2_FACTOR` | `{ HFO:3114, VLSFO:3151, MGO:3206, LNG:2750, Methanol:1375 }; // gCO2/kg fuel` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `names` | `['Maersk Line','MSC Shipping','CMA CGM','Hapag-Lloyd','COSCO Shipping',` |
| `typeIdx` | `Math.floor(sr(i*13)*8);` |
| `compIdx` | `Math.floor(sr(i*17)*20);` |
| `dwt` | `Math.floor(sr(i*31)*180000)+20000;` |
| `built` | `Math.floor(sr(i*43)*25)+2000;` |
| `speed` | `Math.floor(sr(i*47)*10)+10;` |
| `flagIdx` | `Math.floor(sr(i*51)*10);` |
| `fuelType` | `['HFO','VLSFO','MGO','LNG','Methanol'][Math.floor(sr(i*79)*5)];` |
| `voyages` | `Math.floor(sr(i*61)*40)+5;` |
| `lastDrydock` | `2021+Math.floor(sr(i*63)*4);` |
| `distance_nm` | `Math.round((BASE_DISTANCE[shipType]\|\|20000) * (0.7 + sr(i*89)*0.6));` |
| `annualEmissions` | `Math.floor(sr(i*81)*50000+5000); // tCO2` |
| `ciiRatio` | `ciiValue != null ? ciiValue / ciiRequired : 1.0;` |
| `ciiHist` | `QUARTERS.map((q,qi)=>{` |
| `hist_ratio` | `ciiRatio * (0.92 + qi * 0.006 + sr(i*53+qi*7)*0.12);` |
| `amt` | `Math.floor(sr(i*89)*400+50);` |
| `align` | `Math.floor(sr(i*91)*40+40);` |
| `ciiCov` | `CII_GRADES[Math.floor(sr(i*97)*3)];` |
| `bau` | `base-(i/30)*15;` |
| `vessels` | `useMemo(()=>genVessels(),[]);  /* Tab 1 state */ const [filterType,setFilterType]=useState('All');` |
| `pageCount` | `Math.ceil(filtered.length/25);` |
| `pageData` | `filtered.slice(page*25,(page+1)*25);` |
| `sumCII` | `vessels.reduce((a,v)=>a+avg[v.ciiGrade],0);` |
| `acRate` | `vessels.filter(v=>['A','B','C'].includes(v.ciiGrade)).length/total*100;` |
| `eexiRate` | `vessels.filter(v=>v.eexiCompliant).length/total*100;` |
| `totalEmissions` | `vessels.reduce((a,v)=>a+v.annualEmissions,0);` |
| `gradeDist` | `CII_GRADES.map(g=>({grade:g,count:vessels.filter(v=>v.ciiGrade===g).length,color:CII_COLORS[g]}));` |
| `typeDist` | `SHIP_TYPES.map(t=>({type:t,count:vessels.filter(v=>v.type===t).length}));` |
| `flagDist` | `FLAG_STATES.map(f=>({flag:f,count:vessels.filter(v=>v.flag===f).length}));` |
| `companyComparison` | `useMemo(()=>COMPANIES.map(c=>{` |
| `score` | `cv.reduce((a,v)=>a+avg[v.ciiGrade],0)/cv.length;` |
| `fuelPriceProjections` | `useMemo(()=>QUARTERS.map((q,qi)=>({` |
| `selected` | `simVessels.map(id=>vessels.find(v=>v.id===id)).filter(Boolean);` |
| `totalConvCost` | `selected.reduce((a,v)=>a+v.retrofitCost*(fuel.cost/60),0);` |
| `totalEmRed` | `selected.reduce((a,v)=>a+v.co2Reduction*(fuel.emReduction/50),0)/selected.length;` |
| `annualSavings` | `selected.reduce((a,v)=>a+v.fuelSavings*10000*(fuelPriceAdj/100),0)+carbonPrice*100*selected.length;` |
| `payback` | `annualSavings>0?totalConvCost/annualSavings:99;` |
| `portFuelData` | `useMemo(()=>PORTS.map((p,pi)=>({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/maritime/eu-ets` | `eu_ets` | api/v1/routes/maritime.py |
| POST | `/api/v1/maritime/fueleu` | `fueleu` | api/v1/routes/maritime.py |
| POST | `/api/v1/maritime/stranding-risk` | `stranding_risk` | api/v1/routes/maritime.py |
| POST | `/api/v1/maritime/fleet-assessment` | `fleet_assessment` | api/v1/routes/maritime.py |
| GET | `/api/v1/maritime/ref/ship-types` | `ref_ship_types` | api/v1/routes/maritime.py |
| GET | `/api/v1/maritime/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/maritime.py |
| GET | `/api/v1/maritime/ref/regulatory-timeline` | `ref_regulatory_timeline` | api/v1/routes/maritime.py |

### 2.3 Engine `maritime_engine` (services/maritime_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_cii_rating` | ratio |  |
| `_eu_ets_cost` | co2, coverage, route_share, price |  |
| `_get_fueleu_target` | year |  |
| `MaritimeEngine.assess_cii` | entity_id, ship_type, deadweight_tonnes, annual_fuel_consumption_t, annual_distance_nm, annual_cargo_tonnes, fuel_type, year |  |
| `MaritimeEngine.assess_eexi` | entity_id, ship_type, gross_tonnage, installed_power_kw, design_fuel_consumption_g_kwh, fuel_type |  |
| `MaritimeEngine.assess_eu_ets` | entity_id, ship_type, annual_co2_tonnes, eu_route_share_pct, year, eua_price_eur |  |
| `MaritimeEngine.assess_fueleu` | entity_id, ship_type, fuel_type, annual_energy_mj, year |  |
| `MaritimeEngine.assess_stranding` | entity_id, ship_type, build_year, fuel_type, gross_tonnage, retrofit_cost_usd_per_gt |  |
| `MaritimeEngine.assess_fleet` | entity_id, ships, eua_price_eur |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CII_GRADES`, `FLAG_STATES`, `FUELS`, `PORTS`, `QUARTERS`, `SHIP_TYPES`, `VESSEL_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CII Rating | — | IMO MEPC.338(76) | Annual carbon intensity rating; D or E for three consecutive years requires an approved corrective action plan |
| EEXI Compliance Gap (% above limit) | — | IMO MEPC.333(76) EEXI calculation | Percentage by which the vessel’s attained EEXI exceeds the required EEXI limit; positive indicates non-compliance |
| AER (g CO2/dwt·nm) | — | EU MRV and IMO DCS reporting | Annual Efficiency Ratio; key metric for Poseidon Principles climate alignment scoring |
| IMO 2050 Trajectory Alignment (%) | — | Poseidon Principles sigma methodology | Fleet deviation from IMO decarbonisation pathway; positive score means above (worse than) trajectory |
- **EU MRV / IMO DCS voyage data** → Aggregate fuel consumption by voyage; apply IMO CO2 conversion factors; compute transport work → **Annual CII and AER per vessel**
- **EEXI technical file data** → Extract installed power, MCR, and shaft power limitations; apply ship-type EEXI formula → **Attained EEXI vs. required EEXI compliance status per vessel**
- **Poseidon Principles sigma model** → Apply AER to ship-type and size specific decarbonisation trajectory; compute alignment delta → **Portfolio-level Poseidon Principles climate alignment score**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/maritime/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fuel_emission_factors', 'alternative_fuel_capex_usd_per_kw', 'description', 'source'], 'n_keys': 4}`

**GET /api/v1/maritime/ref/regulatory-timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cii_reduction_targets', 'eu_ets_phase_coverage', 'fueleu_ghg_targets_gco2e_mj', 'key_milestones', 'source'], 'n_keys': 5}`

**GET /api/v1/maritime/ref/ship-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ship_types', 'eexi_reference_values', 'description', 'source'], 'n_keys': 4}`

**POST /api/v1/maritime/cii-assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'ship_type', 'fuel_type', 'year', 'cii_attained', 'cii_required', 'cii_ratio', 'cii_rating', 'annual_co2_tonnes', 'improvement_needed_pct', 'corrective_action_deadline', 'regulatory_basis'], 'n_keys': 12}`

**POST /api/v1/maritime/eexi-assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'ship_type', 'fuel_type', 'gross_tonnage', 'installed_power_kw', 'eexi_attained', 'eexi_required', 'eexi_compliant', 'reduction_needed_pct', 'eedi_comparable', 'regulatory_basis', 'compliance_status'], 'n_keys': 12}`

**POST /api/v1/maritime/eu-ets** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/maritime/fleet-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/maritime/fueleu** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Intensity Indicator
**Headline formula:** `CII = CO₂ Emitted (g) / (Capacity × Distance Sailed (nm))`

CII is computed from annual voyage-level fuel consumption data converted to CO2 using IMO fuel-specific conversion factors. Capacity is deadweight tonnage for bulk carriers and tankers, or gross tonnage for passenger ships. The CII rating (A–E) is determined by comparing computed CII against ship-type and size-specific required CII with annual tightening factors through 2030.

**Standards:** ['IMO Resolution MEPC.338(76) CII Guidelines', 'IMO Resolution MEPC.333(76) EEXI Guidelines', 'EU MRV Regulation 2015/757', 'Poseidon Principles Methodology v3.0']
**Reference documents:** IMO Resolution MEPC.338(76) â€” 2021 Guidelines on the Operational Carbon Intensity Indicator (CII); IMO Resolution MEPC.333(76) â€” 2021 Guidelines on the Energy Efficiency Existing Ship Index (EEXI); EU MRV Regulation No. 2015/757 on Monitoring, Reporting and Verification of CO2 Emissions from Maritime Transport; Poseidon Principles Methodology v3.0 2023

**Engine `maritime_engine` — extracted transformation lines:**
```python
annual_co2_t = annual_fuel_consumption_t * cf
cii_attained = round((annual_co2_t * 1e6) / (capacity * distance), 4)
cii_required = round(cii_ref * reduction_factor, 4)
cii_ratio = round(cii_attained / max(cii_required, 0.001), 4)
improvement_needed_pct = round(max(0.0, (cii_ratio - 1.0) * 100.0), 2)
deadline_year = year + 1
deadline_year = year + 3
p_ae = installed_power_kw * 0.05  # auxiliary engine ≈ 5% of ME
sfcae = sfcme * 1.1
numerator = ((installed_power_kw * sfcme) + (p_ae * sfcae)) * cf
denominator = max(gross_tonnage * v_ref, 1.0)
eexi_attained = round(numerator / denominator, 4)
reduction_needed_pct = round(max(0.0, (eexi_attained - eexi_required) / max(eexi_required, 0.001) * 100.0), 2)
eedi_comparable = round(eexi_attained * 0.92, 4)
route_share = _clamp(0.0, 100.0, eu_route_share_pct) / 100.0
allowances_required = round(annual_co2_tonnes * coverage * route_share, 2)
price_high = price_base * 1.50   # +50% scenario (model multiplier)
price_stress = price_base * 2.0  # +100% stress scenario (model multiplier)
cost_base = round(allowances_required * price_base, 2)
cost_high = round(allowances_required * price_high, 2)
cost_stress = round(allowances_required * price_stress, 2)
ghg_intensity = round(ttw + wtt, 4)
intensity_gap = round(ghg_intensity - target, 4)
surplus_gj = (intensity_gap / 1000.0) * (annual_energy_mj / 1e3)
penalty_eur = round(max(0.0, surplus_gj * 2400.0), 2)
ship_age = current_year - build_year
combined_annual_stress = annual_deterioration + annual_tightening
years_to_d_rating = max(1, int(0.20 / combined_annual_stress))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Maritime IMO Compliance module implements the real IMO operational carbon-intensity
framework — the CII reference-line formula of MEPC.339(76) and the A–E rating boundaries — over a
synthetic 150-vessel fleet, plus an IMO-2023 trajectory tracker, an alternative-fuel decision
matrix, and a Poseidon-Principles ship-finance tab. A companion FastAPI engine
(`maritime_engine.py`) computes CII, EEXI, EU-ETS, FuelEU and stranding assessments on
caller-supplied vessel data. The guide's four headline metrics (CII rating, EEXI gap, AER,
trajectory alignment) all map to code, so **no guide↔code mismatch flag is raised** — the only
caveat is that the *volumetric inputs* (annual emissions, distance) are seeded demo data while the
*conversion mathematics* are authentic.

### 7.1 What the module computes

Attained CII follows MEPC.338(76) exactly:

```
CII_attained = Annual CO₂ (g) / (DWT × Distance_nm)        // gCO₂ / (tonne·nm)
CII_ref      = a × DWT^(−c)                                  // MEPC.339(76) reference line
CII_required = CII_ref × (1 − reduction_factor[year])
CII_ratio    = CII_attained / CII_required
```

Annual CO₂ is derived from fuel mass × a fuel-specific carbon factor
(`FUEL_CO2_FACTOR = { HFO:3114, VLSFO:3151, MGO:3206, LNG:2750, Methanol:1375 }` gCO₂/kg — the
IMO MEPC.364(79) Cf values ×1000). In the frontend the annual emission tonnage is drawn from the
seeded PRNG rather than voyage fuel logs; the backend `assess_cii` instead computes it faithfully
as `annual_fuel_consumption_t × cf`.

### 7.2 Parameterisation / scoring rubric

**CII reference-line coefficients** (`CII_REF_PARAMS`, frontend) — these are the genuine
MEPC.339(76) Table-1 `a` and `c` values:

| Ship type | `a` | `c` | Provenance |
|---|---|---|---|
| Bulk Carrier | 4745 | 0.622 | MEPC.339(76) reference line |
| Container | 1984 | 0.489 | MEPC.339(76) |
| Tanker | 5247 | 0.610 | MEPC.339(76) |
| LNG Carrier | 144050 | 0.7345 | MEPC.339(76) (≥100k DWT branch) |
| Car Carrier | 5739 | 0.631 | MEPC.339(76) |
| Cruise | 930 | 0.383 | MEPC.339(76) (GT-based class) |
| RoRo | 10952 | 0.637 | MEPC.339(76) |
| Offshore | 3627 | 0.590 | approximation |

**Annual reduction factor** `CII_REDUCTION = {2023:0.05, 2024:0.07, 2025:0.09, 2026:0.11}` —
the MARPOL Annex VI Reg 28.6 Z% tightening path (5→11 %) off the 2019 baseline.

**Rating boundaries** — frontend uses `A<0.82, B<0.94, C<1.06, D<1.18, E≥1.18`; the backend uses
`A≤0.85, B≤0.95, C≤1.05, D≤1.15`. Both are *fixed-vector approximations* of MEPC.354(78), which
in reality publishes ship-type-and-size-specific `d1–d4` boundary vectors rather than a single set
of universal ratios. The frontend vector is closer to the average bulk-carrier boundary set.

**Fuel decision matrix** (`FUELS`, 10 rows) — cost/availability/emReduction/infraReady/safety/
scalability on 0–100 scales are **synthetic expert-judgement demo values**, not sourced tables.

### 7.3 Calculation walkthrough

Per vessel (`genVessels`, 150 rows): ship type, DWT (20k–200k), build year, flag and fuel are
seeded; `distance_nm` = `BASE_DISTANCE[type] × (0.7 + sr()·0.6)` (bulk 18k, container 58k nm/yr
base); `annualEmissions` is seeded 5k–55k tCO₂. Then `ciiValue → ciiRequired → ciiRatio → ciiGrade`
run through the real formulas above. Twelve quarters of history trend the ratio via
`hist_ratio = ciiRatio × (0.92 + qi·0.006 + sr()·0.12)`.

Fleet KPIs (`fleetStats`): average grade maps A→5…E→1 and averages; `acRate` = share graded A/B/C;
`eexiRate` = share EEXI-compliant; `totalEmissions` sums annual CO₂. Company league table
(`companyComparison`) averages the same 5→1 grade scale within each of 20 shipping lines.

### 7.4 Worked example (one bulk carrier, 2025)

Vessel: Bulk Carrier, `DWT = 100,000`, `annualEmissions = 30,000 tCO₂`, `distance_nm = 20,000`.

| Step | Computation | Result |
|---|---|---|
| CII attained | 30,000 ×10⁶ / (100,000 × 20,000) | **15.0 gCO₂/(t·nm)** |
| CII ref | 4745 × 100000^(−0.622) | 4745 / 1774 ≈ **2.675** |
| CII required (2025, ×0.91) | 2.675 × 0.91 | **2.435** |
| CII ratio | 15.0 / 2.435 | **6.16** |
| Grade | 6.16 ≥ 1.18 | **E** |

The unrealistically high ratio flows directly from the *seeded* emission tonnage being decoupled
from DWT/distance — an artefact of demo data, not the formula. With a realistic ~2.5 gCO₂/(t·nm)
attained value the ratio would sit near 1.0 (grade C). The reference-line arithmetic itself is
correct and reproducible.

### 7.5 Companion analytics on the page

- **IMO-2023 pathway tracker** — `IMO_PATHWAY` (2020–2050) draws three carbon-intensity index
  curves: `ambition` (net-zero-aligned, −20 % by 2030 then steepening), `wb2` (well-below-2 °C),
  and `bau`. Curves are piecewise-linear index constructions, not published IMO absolute numbers.
- **Alternative-fuel explorer** — radar over the 10-fuel matrix; a retrofit simulator scales each
  vessel's `retrofitCost` by `fuel.cost/60`, emission reduction by `fuel.emReduction/50`, and
  computes `payback = totalConvCost / annualSavings` where savings blend a fuel-price slider and a
  `carbonPrice × 100 × n` term. These scalings are heuristic demo calibrations.
- **Poseidon Principles & finance** — 20 synthetic ship-finance facilities (`LOANS`) with
  alignment scores, CII covenants, FuelEU compliance flags and 8-year alignment trajectories; a
  bank league table ranks lenders by portfolio alignment.

### 7.6 Backend engine (`maritime_engine.py`)

Five genuine assessors, each returning its regulatory basis string:
`assess_cii` (real Cf × fuel mass), `assess_eexi` (P·SFC·Cf / (GT·Vref) proxy vs `EEXI_REFERENCE`
table), `assess_eu_ets` (phase-in coverage 40/70/100 % × route share; **cost fields return `None`
when no EUA price is supplied — an explicit honesty guard against fabricating a price**),
`assess_fueleu` (WtW intensity vs the real `FUELEU_GHG_TARGETS` glide-path 89.34→1.89 gCO₂e/MJ,
€2400/GJ penalty per Art 23), and `assess_stranding` (CII-deterioration vs target-tightening race
to a D-rating year, deterministic USD 120/GT retrofit calibration). `assess_fleet` aggregates and
reports the *worst* CII rating as the fleet rating.

### 7.7 Data provenance & limitations

- **Fleet, company and loan data are synthetic**, generated by `sr(s)=frac(sin(s+1)×10⁴)`. Only
  the CII reference coefficients, Cf fuel factors, reduction path and FuelEU glide-path are real.
- Frontend annual emissions are decoupled from operational drivers, so *individual* ratios/grades
  are not physically calibrated; the *distributional shape* and the formula are correct.
- Rating boundaries use a single universal vector, not MEPC.354(78) ship-type/size-specific
  `d`-vectors. EEXI in the frontend is a boolean seed (`sr(i·41)>0.25`), not a computed index — the
  real EEXI computation lives only in the backend.

**Framework alignment:** IMO CII — MEPC.338(76) intensity formula + MEPC.339(76) reference lines +
MEPC.354(78) rating boundaries (approximated) · EEXI — MARPOL Annex VI Reg 25 (backend proxy) ·
EU-ETS Maritime — Reg (EU) 2023/957 phase-in · FuelEU Maritime — Reg (EU) 2023/1805 WtW targets ·
Poseidon Principles — AER-vs-trajectory alignment scoring (the Principles compute a portfolio
"climate alignment" as the AUM-weighted % deviation of each vessel's AER from its ship-class
decarbonisation trajectory; here approximated by the seeded alignment scores).

## 9 · Future Evolution

### 9.1 Evolution A — Fleet register on the real engine, retiring the seeded vessel generator (analytics ladder: rung 2 → 3)

**What.** Familiar platform split, well-instrumented here: a real `MaritimeEngine` implements CII rating, EEXI, EU-ETS cost (with phase-in coverage), FuelEU targets by year, stranding risk and fleet assessment behind 7 live routes with sourced reference data (`ref/fuel-types` returns emission factors with source) — while the page's fleet is `genVessels()` seeded draws: DWT, build year, fuel type, `annualEmissions = sr·50000+5000` and crucially the CII history applying noise multipliers rather than computed ratings; real carrier names (Maersk, MSC, CMA CGM) carry fabricated compliance grades — the real-names problem again, in a regulated domain. The retrofit simulator's economics (`retrofitCost × fuel.cost/60`, `fuelSavings × 10000 × adj`) are heuristic scalings. Evolution A: a persisted fleet register (vessel × type × DWT × build year × engine/fuel) with MRV/DCS fuel-consumption upload per the §1 workflow, every vessel's CII/EEXI/ETS/FuelEU computed by `assess_fleet`, and Poseidon Principles AER alignment added to the engine (the §4.1 lineage names the sigma methodology; the engine has the inputs).

**How.** (1) `fleet_vessels`/`vessel_fuel_reports` tables; the page's grade distributions, company comparisons and trajectory views recompute from engine output. (2) EU MRV's public THETIS-MRV dataset ingested as an optional real-fleet seed — actual per-vessel CO₂/AER for EU-calling ships is published annually, making this one of the few modules whose real-world per-asset data is free. (3) Retrofit economics re-derived: candidate fuels priced per the `FUELS` table with sources, savings from computed consumption deltas, EU-ETS cost avoidance from the engine's `_eu_ets_cost`. (4) Real carrier names decoupled from fabricated grades until THETIS data backs them.

**Prerequisites.** THETIS-MRV ingestion (public CSV); the `genVessels` seeding deleted; Poseidon sigma trajectory tables added to the engine. **Acceptance:** a vessel's CII grade traces to its reported fuel/distance via the engine; THETIS-sourced vessels show real AERs with vintage; retrofit paybacks decompose into priced components.

### 9.2 Evolution B — Ship-finance compliance analyst for Poseidon portfolios (LLM tier 2)

**What.** The stated flagship user — ship financiers managing Poseidon Principles alignment — asks portfolio questions the engine family answers: "which vessels in our loan book rate D/E and what corrective options close the gap?" (speed reduction/EPL/fuel-switch scenarios via `assess_cii` re-runs), "what's our fleet's EU-ETS cost at €90 EUAs as coverage phases in?", "score the portfolio's Poseidon alignment and draft the annual disclosure." Regulatory-timeline questions ground in the `ref/regulatory-timeline` route.

**How.** Tier 2: tool schemas over all 7 maritime routes; corrective-action modelling runs parameterised `assess_cii`/`assess_eexi` what-ifs with the changed input named per scenario. Poseidon disclosure drafting maps computed alignment to the Principles' reporting format with data-coverage stated per vessel (vessels lacking fuel reports are excluded and counted — the engine-family honest-null convention). Regulatory facts (CII D/E three-year corrective-plan rule, FuelEU targets by year) quote the engine's reference payloads with their MEPC citations, not recall — IMO regulation is amendment-heavy and vintage-sensitive. Fuel-transition advice carries the `FUELS` table's availability/infrastructure caveats alongside cost.

**Prerequisites.** Evolution A's register (portfolio answers need real vessels; the engine works today for single-vessel what-ifs, so a scoped tier-2 slice could ship earlier); Phase 2 tooling. **Acceptance:** every grade/€ figure traces to an engine call; disclosure drafts state per-vessel data coverage; regulatory citations match reference-route payloads.