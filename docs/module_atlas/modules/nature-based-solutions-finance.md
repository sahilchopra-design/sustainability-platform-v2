# Nature-Based Solutions Project Finance
**Module ID:** `nature-based-solutions-finance` · **Route:** `/nature-based-solutions-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DX4 · **Sprint:** DX

## 1 · Overview
NbS project finance covering REDD+, reforestation, blue carbon, and peatland restoration. Models carbon credit revenue, biodiversity and watershed co-benefit valuation, ICROA and Verra VCS standard compliance, and NbS blended finance structures.

> **Business value:** Provides integrated NbS project finance modelling combining carbon, biodiversity, and ecosystem service revenues with rigorous VCS/ICROA compliance, enabling impact investor decision-making.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE6_PIPELINE`, `COBENEFIT_CATEGORIES`, `FI_STRUCTURES`, `NBS_TYPES`, `VCU_BENCHMARKS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDevCost` | `projectHa * devCostHa;` |
| `annVcus` | `projectHa * vcuYield;` |
| `annPermanenceBuffer` | `annVcus * (permanenceBuffer / 100);` |
| `netAnnVcus` | `annVcus - annPermanenceBuffer;` |
| `cobenPrem` | `vcuPrice * (cobenefitPremPct / 100);` |
| `effectivePrice` | `vcuPrice + cobenPrem;` |
| `annRevenue` | `netAnnVcus * effectivePrice;` |
| `annOpex` | `projectHa * annOpexHa;` |
| `annEbitda` | `annRevenue - annOpex;` |
| `annCapexAmort` | `totalDevCost / projectLifeYr;` |
| `discFactor` | `wacc / 100;` |
| `lcoc` | `totalDevCost > 0 ? (totalDevCost * (discFactor / (1 - Math.pow(1 + discFactor, -projectLifeYr))) + annOpex) / Math.max(1, netAnnVcus) : 0;` |
| `priceSensData` | `useMemo(() => [6, 8, 10, 12, 15, 18, 22, 28, 35, 45].map(p => {` |
| `cobenValData` | `useMemo(() => NBS_TYPES.map(t => ({` |
| `art6Data` | `useMemo(() => ARTICLE6_PIPELINE.map(p => ({` |
| `costY` | `y === 0 ? finResult.totalDevCostM : finResult.totalDevCostM / projectLife * 0.04 * projectHa / 1e6 * projectHa / 1e6;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-based-solutions/iucn-assessment` | `iucn_assessment` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/redd-plus` | `redd_plus` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/blue-carbon` | `blue_carbon` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/soil-carbon` | `soil_carbon` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/arr-assessment` | `arr_assessment` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/afolu-balance` | `afolu_balance` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/credit-quality` | `credit_quality` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/sequestration-timeseries` | `sequestration_timeseries` | api/v1/routes/nature_based_solutions.py |
| GET | `/api/v1/nature-based-solutions/ref/ecosystem-types` | `ref_ecosystem_types` | api/v1/routes/nature_based_solutions.py |
| GET | `/api/v1/nature-based-solutions/ref/methodologies` | `ref_methodologies` | api/v1/routes/nature_based_solutions.py |

### 2.3 Engine `nature_based_solutions_engine` (services/nature_based_solutions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureBasedSolutionsEngine.assess_iucn_gs` | entity_id, criteria_scores | IUCN GS v2.0 — 8 criteria, each scored 0-100. |
| `NatureBasedSolutionsEngine.assess_redd_plus` | entity_id, area_ha, reference_level_tco2_pa, actual_emissions_tco2_pa, jurisdictional, leakage_belt_pct | VCS VM0007 REDD+ avoided deforestation methodology. |
| `NatureBasedSolutionsEngine.assess_blue_carbon` | entity_id, ecosystem_type, area_ha, tidal_hydrology_restored, co_benefit_score | Blue carbon accounting for coastal/marine ecosystems. |
| `NatureBasedSolutionsEngine.assess_soil_carbon` | entity_id, area_ha, land_use_change, ipcc_tier | IPCC Tier 1-3 soil organic carbon methodology. |
| `NatureBasedSolutionsEngine.assess_arr` | entity_id, area_ha, species_type, above_ground_rate_tco2_ha_pa, co_benefit_score | ARR carbon accounting: above-ground, below-ground, soil. |
| `NatureBasedSolutionsEngine.compute_afolu_balance` | entity_id, sequestration_tco2_pa, land_area_ha | AFOLU (Agriculture, Forestry & Other Land Use) net GHG accounting. |
| `NatureBasedSolutionsEngine.assess_credit_quality` | entity_id, iucn_score, redd_net_credits, co_benefits | Credit quality rating combining IUCN score, co-benefits, and volume. |
| `NatureBasedSolutionsEngine.project_sequestration_timeseries` | entity_id, annual_seq_tco2, project_years, annual_variation_pct | Project-level sequestration projection with a deterministic ramp-up |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ARTICLE6_PIPELINE`, `COBENEFIT_CATEGORIES`, `FI_STRUCTURES`, `NBS_TYPES`, `VCU_BENCHMARKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Credit Revenue | `Net credits issued × carbon price × (1 - buffer contribution)` | Verra VCS project documentation | Dependent on verified emissions reductions; REDD+ typically 0.5-5 tCO2/ha/yr net of leakage and buffer |
| Biodiversity Co-benefit Premium | `Price premium for CCB-certified vs standard VCS credits` | Ecosystem Marketplace data | CCB (Climate, Community & Biodiversity) certification adds $2-8/credit; biodiversity credits (BioCarbon) separ |
| Ecosystem Service Value | `Watershed protection + pollination + flood regulation services valued at shadow prices` | TEEB / Natural Capital Project | Co-benefits critical for blended finance from impact investors; watershed services often fundable via water ut |
- **Verra VCS project database** → Issued credits, buffer contributions, methodology details → carbon revenue model → **Project-level carbon revenue schedule**
- **Ecosystem Marketplace transaction data** → Historical NbS credit prices by certification type → revenue assumptions → **Price deck and premium analysis**
- **Natural Capital Project / TEEB valuations** → Ecosystem service shadow prices by habitat type → co-benefit monetisation → **Total economic value and blended finance attractiveness**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-based-solutions/ref/ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystems', 'source'], 'n_keys': 2}`

**GET /api/v1/nature-based-solutions/ref/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'certification_schemes', 'icvcm_ccp_standard'], 'n_keys': 3}`

**POST /api/v1/nature-based-solutions/afolu-balance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/arr-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/blue-carbon** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** NbS Financial Modelling
**Headline formula:** `NbS IRR = f(Carbon Revenue + Ecosystem Service Revenue - CAPEX - OPEX - Buffer Contribution); Carbon Revenue = Credits × Price × (1 - Buffer%)`
**Standards:** ['Verra VCS REDD+ Methodology VM0007', 'SBTN Guidance on Nature Targets', 'TNFD v1.0 Framework']

**Engine `nature_based_solutions_engine` — extracted transformation lines:**
```python
composite = round(sum(supplied) / criteria_supplied, 2)
avoided_deforestation = reference_level_tco2_pa - actual_emissions_tco2_pa
net_credits = avoided_deforestation * (1 - leakage / 100) * (1 - buffer / 100)
per_ha = round(net_credits / area_ha, 2) if area_ha > 0 else 0.0
total_seq = round(area_ha * seq_rate, 2)
net_credits = round(total_seq * (1 - buffer_pct / 100), 2)
total_tco2_pa = round(area_ha * delta, 2)
lower_bound = round(total_tco2_pa * (1 - uncertainty_pct / 100), 2)
upper_bound = round(total_tco2_pa * (1 + uncertainty_pct / 100), 2)
above_ground = round(area_ha * above_ground_rate, 2)
below_ground = round(above_ground * 0.26, 2)  # IPCC root-to-shoot ratio
soil_carbon = round(area_ha * 0.5, 2)
total = round(above_ground + below_ground + soil_carbon, 2)
net_credits = round(total * (1 - buffer_pct / 100), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).