# Maritime IMO Compliance
**Module ID:** `maritime-imo-compliance` · **Route:** `/maritime-imo-compliance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive compliance analytics for the IMO 2050 decarbonisation strategy, covering CII (Carbon Intensity Indicator) rating computation, EEXI (Energy Efficiency Existing Ship Index) compliance assessment, and EU MRV regulation CO2 reporting. Tracks fleet-level emission intensity trends against IMO trajectory and identifies vessels requiring technical or operational upgrades. Supports Poseidon Principles portfolio alignment for ship finance.

> **Business value:** Provides ship financiers, fleet operators, and ESG analysts with automated IMO compliance assessment and Poseidon Principles portfolio alignment tools to manage regulatory risk and decarbonise maritime lending portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CII_COLORS`, `CII_GRADES`, `CII_REDUCTION`, `CII_REF_PARAMS`, `COMPANIES`, `FLAG_STATES`, `FUELS`, `FUEL_CO2_FACTOR`, `IMO_PATHWAY`, `KPI`, `LOANS`, `PORTS`, `ProgressBar`, `QUARTERS`, `SHIP_TYPES`, `VESSEL_NAMES`

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
| `MaritimeEngine.assess_cii` | entity_id, ship_type, deadweight_tonnes, annual_fuel_consumption_t, annual_distance_nm, annual_cargo_tonnes |  |
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
| EEXI Compliance Gap (% above limit) | — | IMO MEPC.333(76) EEXI calculation | Percentage by which the vessel’s attained EEXI exceeds the required EEXI limit; positive indicates non-complia |
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
Output: `{'type': 'object', 'keys': ['entity_id', 'ship_type', 'fuel_type', 'year', 'cii_attained', 'cii_required', 'cii_ratio', 'cii_rating', 'annual_co2_tonnes', 'improvement_needed_pct', 'corrective_action_deadline', 'regulato`

**POST /api/v1/maritime/eexi-assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_id', 'ship_type', 'fuel_type', 'gross_tonnage', 'installed_power_kw', 'eexi_attained', 'eexi_required', 'eexi_compliant', 'reduction_needed_pct', 'eedi_comparable', 'regulatory_basis',`

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Intensity Indicator
**Headline formula:** `CII = CO₂ Emitted (g) / (Capacity × Distance Sailed (nm))`
**Standards:** ['IMO Resolution MEPC.338(76) CII Guidelines', 'IMO Resolution MEPC.333(76) EEXI Guidelines', 'EU MRV Regulation 2015/757', 'Poseidon Principles Methodology v3.0']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).