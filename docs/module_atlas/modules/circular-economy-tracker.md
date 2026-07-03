# Circular Economy Tracker
**Module ID:** `circular-economy-tracker` · **Route:** `/circular-economy-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Circularity performance measurement and reporting platform aligned with Ellen MacArthur Foundation Material Circularity Indicator (MCI). Tracks material flows, recycled content, waste diversion, and product lifetime extension across 5 supply chain tiers.

> **Business value:** MCI = 1 – LFI. LFI = (V + W) / (2F + 0.09). Fully circular products achieve MCI close to 1.0; industry average typically 0.2–0.4. EU Taxonomy encourages MCI targets above 0.6.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMPANIES`, `KPI`, `MATERIALS`, `PAGE_SIZE`, `PIECLRS`, `RATINGS`, `SECTORS`, `TABS`, `TREND`, `WASTE_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `MATERIALS` | `[{name:'Plastics',recycled:32,virgin:68,flow:4200},{name:'Paper/Card',recycled:65,virgin:35,flow:3800},{name:'Glass',recycled:42,virgin:58,flow:1200},` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,circularity:Math.round(22+i*0.8+sr(i*7)*8),wasteD` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length);return{avgCirc:avg('circularityScore'),avgDiv:avg('wasteDiv` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgCirc:0,avgDiv:0,n:0};m[c.sector].avgCirc+=c.circularityS` |
| `ratingDist` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{m[c.rating]=(m[c.rating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['circularityScore','wasteDiv','recycledInput','recyclability','materialEfficiency','designCircularity'];const avg=(k)=>Math.r` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/circular-economy/esrs-e5` | `esrs_e5` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/mci` | `mci` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/wbcsd-cti` | `wbcsd_cti` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/epr-compliance` | `epr_compliance` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/crm-risk` | `crm_risk` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/lca` | `lca` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/material-flows` | `material_flows` | api/v1/routes/circular_economy.py |
| POST | `/api/v1/circular-economy/overall-circularity` | `overall_circularity` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/crm-list` | `ref_crm_list` | api/v1/routes/circular_economy.py |
| GET | `/api/v1/circular-economy/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/circular_economy.py |

### 2.3 Engine `circular_economy_engine` (services/circular_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CircularEconomyEngine.assess_esrs_e5` | entity_id, resource_inflows_t, recycled_inflows_pct, resource_outflows_t, waste_t, crm_identified | CSRD ESRS E5 — Resource use and circular economy disclosure scoring. |
| `CircularEconomyEngine.calculate_mci` | entity_id, recycled_input_fraction, waste_recovery_fraction, product_lifetime_multiplier, sector | Ellen MacArthur Foundation Material Circularity Indicator (0-1). |
| `CircularEconomyEngine.assess_wbcsd_cti` | entity_id, entity_name, sector, circular_product_design, waste_recovery, recycled_content | WBCSD Circular Transition Indicators v4.0 — 4 dimensions, A-D tier. |
| `CircularEconomyEngine.calculate_epr_compliance` | entity_id, packaging_tonnes, ewaste_tonnes, battery_tonnes, country, compliance_gaps | EU EPR cost calculation for packaging (DIR 94/62/EC), e-waste (WEEE DIR), |
| `CircularEconomyEngine.assess_crm_risk` | entity_id, materials_used, material_data | EU CRM Act 2023 dependency assessment for critical raw materials. |
| `CircularEconomyEngine.perform_lca` | entity_id, product_name, annual_production, sector, circularity_benefit_pct | ISO 14044 Life Cycle Assessment: cradle-to-gate vs cradle-to-cradle. |
| `CircularEconomyEngine.analyse_material_flows` | entity_id, materials | Material flow analysis: for each material compute recycled content % |
| `CircularEconomyEngine.compute_overall_circularity` | entity_id, esrs_score, mci_score, cti_score, lca_benefit_pct, cost_per_score_point_usd | Aggregated circularity score combining ESRS E5, MCI, CTI, and LCA benefit. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `MATERIALS`, `PIECLRS`, `RATINGS`, `SECTORS`, `TABS`, `WASTE_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Material Circularity Indicator | `1 – LFI` | EMF MCI model | Circularity score; 1.0 = fully circular, 0.0 = fully linear |
| Virgin Material Input % | `V / TotalInput` | Supply chain data | Fraction of material inputs sourced as virgin (non-recycled) |
| Recycled Content % | `Recycled / TotalInput` | Material passports | Share of recycled or recovered material in product inputs |
| Waste Diversion Rate | `1 – (Landfill / TotalWaste)` | Waste management records | Fraction of production waste diverted from landfill via reuse, recycling, or composting |
- **Bill of materials** → Virgin vs recycled inputs → V calculation → **Material input composition**
- **Waste management records** → Disposal routes → W calculation → **Unrecoverable waste fraction**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/circular-economy/ref/crm-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_crm_count', 'critical_raw_materials', 'strategic_raw_materials', 'eu_2030_targets', 'regulation', 'review_cycle', 'strategic_stockpiling'], 'n_keys': 7}`

**GET /api/v1/circular-economy/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rates', 'categories', 'currency', 'unit', 'directives', 'note'], 'n_keys': 6}`

**POST /api/v1/circular-economy/crm-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/epr-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/circular-economy/esrs-e5** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Ellen MacArthur Foundation Material Circularity Indicator
**Headline formula:** `MCI = 1 – LFI; LFI = (V + W) / (2F + 0.09); F = M – V – W`
**Standards:** ['EMF Material Circularity Indicator v1.3', 'ISO 14044 LCA', 'EU Circular Economy Action Plan', 'GRI 306 Waste']

**Engine `circular_economy_engine` — extracted transformation lines:**
```python
utility_factor = round(1.0 / plm, 4)
raw_mci = (rif + wrf) / 2.0 * utility_factor
gap = round(benchmark - mci_score, 4)
sector_benchmark = round(MCI_BENCHMARKS[sector_l] * 100.0, 1)
pkg_cost = round(packaging_tonnes * pkg_rate, 0) if packaging_tonnes > 0 else 0.0
ew_cost = round(ewaste_tonnes * ew_rate, 0) if ewaste_tonnes > 0 else 0.0
bat_cost = round(battery_tonnes * bat_rate, 0) if battery_tonnes > 0 else 0.0
total_cost = round(pkg_cost + ew_cost + bat_cost, 0)
c2c = round(c2g * (1 - benefit_pct / 100.0), 2)
annual_co2_saving = round((c2g - c2c) * annual_production / 1000.0, 2)  # tCO2
total = primary + recycled + bio_based
rec_pct = round(recycled / total * 100.0 if total > 0 else 0.0, 2)
portfolio_recycled_pct = round(total_recycled / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
crm_exposure_pct = round(crm_inflow / total_inflow * 100.0 if total_inflow > 0 else 0.0, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `circular_economy_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `circular-economy-finance` | engine:circular_economy_engine |
| `circular-economy-investment` | engine:circular_economy_engine |