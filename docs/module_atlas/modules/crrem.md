# CRREM Pathway Analytics
**Module ID:** `crrem` · **Route:** `/crrem` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses real estate portfolio decarbonisation against Carbon Risk Real Estate Monitor (CRREM) stranding pathways, computing asset-level stranding years, retrofit investment requirements, and portfolio-level alignment with 1.5°C and 2°C real estate pathways.

> **Business value:** Enables real estate investors and asset managers to identify stranding risk in their property portfolios, prioritise retrofit investment, and disclose alignment with science-based real estate decarbonisation pathways per TCFD and SFDR requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BULK_IMPORT_PROPERTIES`, `COLORS_8`, `CONSTRUCTION_TYPES`, `COUNTRIES`, `CRREM_PATHWAYS`, `DEFAULT_RE_PORTFOLIO`, `EPC_RATINGS`, `LS_KEY`, `PATHWAY_YEARS`, `PIE_COLORS`, `PROPERTY_TYPES`, `TYPE_FILTER`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});` |
| `fmtPct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `fmtMn` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;` |
| `pts` | `PATHWAY_YEARS.map(y => ({ year: y, val: pathwayObj[y] }));` |
| `frac` | `(y - lower.year) / (upper.year - lower.year);` |
| `badge` | `(bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });` |
| `clamped` | `Math.max(0, Math.min(100, Number(value) \|\| 0));` |
| `diff` | `clamped - oldVal;` |
| `othersTotal` | `others.reduce((s, k) => s + mix[k], 0);` |
| `total` | `Object.values(mix).reduce((s, v) => s + v, 0);` |
| `existing` | `new Set(props.map(p => p.id));` |
| `avgEnergy` | `f.reduce((s,p) => s+p.energy_intensity_kwh,0)/f.length;` |
| `avgCarbon` | `f.reduce((s,p) => s+p.carbon_intensity_kgco2,0)/f.length;` |
| `totalGFA` | `f.reduce((s,p) => s+p.gfa_m2,0);` |
| `totalGAV` | `f.reduce((s,p) => s+p.gav_usd_mn,0);` |
| `totalS1` | `f.reduce((s,p) => s+p.scope1_tco2e,0);` |
| `totalS2` | `f.reduce((s,p) => s+p.scope2_tco2e_location,0);` |
| `avgRenewable` | `f.reduce((s,p) => s+p.renewable_share_pct,0)/f.length;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/crrem/assess` | `crrem_assess` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/retrofit-plan` | `retrofit_plan` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/green-premium` | `green_premium` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/gresb-score` | `gresb_score` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/crrem-pathways` | `ref_crrem_pathways` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/retrofit-measures` | `ref_retrofit_measures` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/epc-benchmarks` | `ref_epc_benchmarks` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/certifications` | `ref_certifications` | api/v1/routes/crrem_green_buildings.py |

### 2.3 Engine `crrem_green_buildings_engine` (services/crrem_green_buildings_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_interpolate_pathway` | pathway_years, year, metric | Linear interpolation between two pathway waypoints for a given year. |
| `_find_stranding_year` | current_intensity, pathway, metric, start_year, end_year | Find the first year where the current (static) intensity exceeds the pathway target. |
| `_get_epc_rating` | energy_intensity, country_iso3 |  |
| `_npv_measure` | annual_saving_eur, capex_eur, lifetime_yr, discount_rate | NPV of a retrofit measure over its lifetime. |
| `assess_crrem_alignment` | asset_data | Assess CRREM pathway alignment for a real estate asset. |
| `calculate_retrofit_plan` | asset_data, target_epc | Rank retrofit measures by NPV and produce a sequenced capex plan to reach target EPC. |
| `calculate_green_premium` | building_type, country_iso3, epc_rating | Return green certification premium and brown discount risk for an asset. |
| `assess_gresb_score` | aspect_scores | Calculate GRESB score and peer positioning. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `__future__` *(shared)*, `aspect`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BULK_IMPORT_PROPERTIES`, `COLORS_8`, `CONSTRUCTION_TYPES`, `COUNTRIES`, `EPC_RATINGS`, `PATHWAY_YEARS`, `PIE_COLORS`, `PROPERTY_TYPES`, `TABS`, `TYPE_FILTER`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio % Stranded (1.5°C, 2030) | — | CRREM v2.0 | Proportion of portfolio by value stranded against 1.5°C pathway by 2030 |
| Average EUI | — | EPCs / energy metering | Portfolio-average energy use intensity; EU standard is <100 kWh/m²/yr for NZEB |
| Retrofit Capex Required | — | BREEAM cost models | Estimated deep retrofit capex to achieve EPC A/B rating and CRREM pathway compliance |
| Stranding Year (median asset) | — | CRREM model | Median year at which portfolio assets become stranded against 1.5°C pathway |
| Carbon Intensity | — | GHG Protocol RE Standard | Operational carbon intensity; CRREM 1.5°C pathway target <10 kgCO₂e/m²/yr by 2050 |
- **EPC certificates and energy meter data** → Compute EUI per asset, match to CRREM country/type pathway → **Asset-level EUI vs pathway gap**
- **CRREM v2.0 pathway database** → Interpolate annual pathway targets by country, type, and scenario → **Stranding year per asset**
- **BREEAM retrofit cost benchmarks** → Estimate retrofit capex to achieve target EUI by asset type → **Retrofit investment requirement per asset**

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM Stranding Analysis
**Headline formula:** `StrandingYear = min{t : EUI(t) > CRREM_pathway(t, asset_type, country)}`
**Standards:** ['CRREM v2.0 2023', 'GRESB Infrastructure Assessment', 'EU EPC Minimum Standards']

**Engine `crrem_green_buildings_engine` — extracted transformation lines:**
```python
t = (year - y0) / (y1 - y0)
pv = annual_saving_eur * lifetime_yr
pv = annual_saving_eur * (1 - (1 + discount_rate) ** (-lifetime_yr)) / discount_rate
ei_gap_pct = ((current_ei - pathway_ei_now) / pathway_ei_now * 100) if pathway_ei_now > 0 else 0.0
ci_gap_pct = ((current_ci - pathway_ci_now) / pathway_ci_now * 100) if pathway_ci_now > 0 else 0.0
yrs_to_strand = stranding_year - base_year
yrs = max(0, stranding_year - base_year)
haircut_pct = min(40.0, 40.0 * (1 - yrs / 25.0)) if yrs < 25 else 0.0
npv_risk = asset_value * haircut_pct / 100
annual_energy_saving_eur = energy_saved_kwh_m2 * energy_cost * floor_area / 1000  # energy_cost per kWh approx
carbon_saved_tonne = energy_saved_kwh_m2 * 0.2 * floor_area / 1000
annual_carbon_saving_eur = carbon_saved_tonne * carbon_price
total_annual_saving = annual_energy_saving_eur + annual_carbon_saving_eur
simple_payback = round(total_capex / total_annual_saving, 1) if total_annual_saving > 0 else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `green-hydrogen-ammonia-carbon` | table:exc |