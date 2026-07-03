# Digital Product Passport
**Module ID:** `digital-product-passport` · **Route:** `/digital-product-passport` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Digital Product Passport (DPP) compliance module for product lifecycle sustainability data including materials, repairability, carbon footprint, and end-of-life instructions. Generates machine-readable DPP records conforming to the ESPR framework. Supports QR-code linked consumer disclosure and supply chain data collection.

> **Business value:** Enables manufacturers and brand owners to meet EU ESPR Digital Product Passport obligations ahead of phased product category deadlines. Centralised DPP management reduces compliance cost and surfaces sustainability improvement priorities across the product portfolio.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BATTERY_CHEM`, `Badge`, `COUNTRIES_MFG`, `DPP_FIELDS`, `DPP_STATUSES`, `EPR_COUNTRIES`, `FIELD_GROUPS`, `KpiCard`, `LIFECYCLE_STAGES`, `MANDATE_YEARS`, `PIE_COLORS`, `PRODUCTS`, `PRODUCT_CATEGORIES`, `SC_COMPANIES`, `STATUS_COLOR`, `SUPPLY_CHAIN_NODES`, `SectionTitle`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BATTERY_CHEM` | `['Li-ion', 'NiMH', 'Lead-acid', 'Solid-state'];` |
| `cat` | `PRODUCT_CATEGORIES[Math.floor(sr(i * 7) * PRODUCT_CATEGORIES.length)];` |
| `country` | `COUNTRIES_MFG[Math.floor(sr(i * 11) * COUNTRIES_MFG.length)];` |
| `isBattery` | `cat === 'Batteries & Accumulators' \|\| (cat === 'Electronics & ICT' && sr(i * 3) > 0.6);` |
| `brandIdx` | `Math.floor(sr(i * 13) * 20);` |
| `espr` | `Math.round(sr(i * 17) * 55 + 35);` |
| `FIELD_GROUPS` | `['Identity', 'Carbon Footprint', 'Materials', 'Repairability', 'End-of-Life', 'Compliance'];` |
| `avg` | `arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;` |
| `fieldFilled` | `useMemo(() => DPP_FIELDS.map((_, i) => sr(i * 157 + 3) > 0.30), []);` |
| `avgEspr` | `fmt1(avg(PRODUCTS.map(p => p.espr_score)));` |
| `avgCarbon` | `Math.round(avg(PRODUCTS.map(p => p.carbonFootprint)));` |
| `esprByCategory` | `useMemo(() => PRODUCT_CATEGORIES.map(cat => {` |
| `mandateCounts` | `useMemo(() => MANDATE_YEARS.map(y => ({` |
| `sortedByEspr` | `useMemo(() => [...PRODUCTS].sort((a, b) => b.espr_score - a.espr_score), []);` |
| `bottom15` | `sortedByEspr.slice(-15);` |
| `fieldGroupStats` | `useMemo(() => FIELD_GROUPS.map(grp => {` |
| `grpIdxs` | `grpFields.map(f => DPP_FIELDS.indexOf(f));` |
| `dppReadiness` | `Math.min(100, Math.round((fieldSlider / 100) * 85 + 15));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/digital-product-passport/espr-compliance` | `espr_compliance` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/dpp-schema` | `dpp_schema` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/battery-regulation` | `battery_regulation` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/epr-levy` | `epr_levy` | api/v1/routes/digital_product_passport.py |
| POST | `/api/v1/digital-product-passport/full-assessment` | `full_assessment` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/product-categories` | `ref_product_categories` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/epr-rates` | `ref_epr_rates` | api/v1/routes/digital_product_passport.py |
| GET | `/api/v1/digital-product-passport/ref/battery-targets` | `ref_battery_targets` | api/v1/routes/digital_product_passport.py |

### 2.3 Engine `digital_product_passport_engine` (services/digital_product_passport_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DigitalProductPassportEngine.assess_espr_compliance` | product_data | Assess ESPR (Regulation (EU) 2024/1781) applicability and compliance |
| `DigitalProductPassportEngine.build_dpp_schema` | product_data | Evaluate completeness of a product's Digital Product Passport data |
| `DigitalProductPassportEngine.calculate_lifecycle_ghg` | product_data, lifecycle_stages | Calculate product carbon footprint per ISO 14067:2018 / PEF methodology. |
| `DigitalProductPassportEngine.assess_circularity` | product_data | Compute a circularity index (0-100) across 5 weighted dimensions. |
| `DigitalProductPassportEngine.assess_battery_regulation` | battery_data | Assess compliance with EU Battery Regulation 2023/1542. |
| `DigitalProductPassportEngine.calculate_epr_levy` | product_data, countries | Calculate EPR scheme levy exposure across EU Member States. |
| `DigitalProductPassportEngine.run_full_assessment` | entity_id, product_data | Orchestrate all sub-modules and compute composite dpp_readiness_score. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BATTERY_CHEM`, `COUNTRIES_MFG`, `DPP_FIELDS`, `DPP_STATUSES`, `EPR_COUNTRIES`, `FIELD_GROUPS`, `LIFECYCLE_STAGES`, `MANDATE_YEARS`, `PIE_COLORS`, `PRODUCT_CATEGORIES`, `SC_COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DPP Records Issued | — | DPP registry | Total Digital Product Passport records generated and registered in the EU DPP system |
| Avg Product Carbon Footprint | — | ISO 14067 PCF calculation | Mean product carbon footprint across all registered SKUs in the current portfolio |
| Repairability Index (Avg) | — | EU Repairability Score methodology | Average repairability score across registered products; EU threshold is ≥6.0 |
| DPP Completeness | — | Mandatory field audit | Share of DPP records with all ESPR-mandatory data fields populated |
- **Bill of materials (material composition per SKU)** → Material sustainability scoring against ESPR restricted substance lists and recyclability databases → **Materials dimension score and chemical safety flag**
- **ISO 14067 PCF study data** → Cradle-to-gate / cradle-to-grave emission factor application → **Product carbon footprint in kgCO₂e per functional unit**
- **EU DPP registry API** → Formatted DPP record upload with UPI assignment → **Registered DPP with QR code and public disclosure URL**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/digital-product-passport/ref/battery-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'priority_materials', 'targets', 'description', 'all_requirements_overview'], 'n_keys': 6}`

**GET /api/v1/digital-product-passport/ref/dpp-mandatory-fields** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_mandatory_fields', 'fields', 'fields_by_section'], 'n_keys': 5}`

**GET /api/v1/digital-product-passport/ref/epr-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_countries', 'currency', 'unit', 'rates_by_country'], 'n_keys': 6}`

**GET /api/v1/digital-product-passport/ref/product-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_categories', 'categories'], 'n_keys': 4}`

**POST /api/v1/digital-product-passport/battery-regulation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Product Sustainability Score
**Headline formula:** `PSS = Σ wᵢ × Sᵢ across {Carbon, Materials, Repairability, Recyclability, Chemical Safety}`
**Standards:** ['EU ESPR Regulation 2024/1781', 'ISO 14040/14044 LCA', 'EU Ecodesign Directive']

**Engine `digital_product_passport_engine` — extracted transformation lines:**
```python
cert_coverage = min(len(existing_certs) * 20, 60)
completeness_pct = round(len(completed) / total * 100, 1)
stage_emissions[stage] = round(base_ef * weight_factor / 1000, 4)  # convert kg→tonne
annual_total_tco2e = round(total_per_unit * annual_units / 1000, 2)
score = max(0.0, min(100.0, (raw_val - low) / (high - low) * 100))
improvement_potential = round(100 - circularity_index, 1)
overall_score = round(checks_passed / 5 * 100)
lca_score = lca_score_raw * 0.20
dpp_readiness_score = round(espr_score + dpp_score + lca_score + circ_score, 1)
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
| `crrem` | table:exc |