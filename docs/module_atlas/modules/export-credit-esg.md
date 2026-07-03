# Export Credit ESG
**Module ID:** `export-credit-esg` · **Route:** `/export-credit-esg` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages environmental and social compliance for export credit agency transactions under the OECD Common Approaches on Officially Supported Export Credits and Equator Principles requirements. Covers Category A/B/C project classification, ESIA benchmarking against applicable host country and IFC standards, and public disclosure obligations. Supports ECA lenders, exporters, and project developers navigating Arrangement compliance.

> **Business value:** Enables export credit agencies, banks, and exporters to navigate the complex OECD Common Approaches framework efficiently, ensure IFC PS benchmarking rigour for Category A transactions, and satisfy public information requirements that protect ECA reputational and legal standing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `ECA_NAMES`, `EP_CATS`, `ESG_CATS`, `IFC_PS`, `PROJ_NAMES`, `SECTORS`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ECA_NAMES` | `['Euler Hermes (DE)','Bpifrance (FR)','US EXIM (US)','UKEF (GB)','NEXI (JP)','K-EXIM (KR)','SACE (IT)','CESCE (ES)','Atradius (NL)','EDC (CA)','Sinosu` |
| `PROJ_NAMES` | `['Mekong Solar Farm','Trans-Saharan Pipeline','Baltic Wind Park','Andean Copper Mine','Jakarta Mass Transit','Lagos Port Expansion','Patagonia Wind Co` |
| `transactions` | `Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];const eca=ECA_NAMES[Math.floor(s2*ECA_NAMES.length)];` |
| `esgCat` | `ESG_CATS[Math.floor(s3*3)];const epCat=EP_CATS[Math.floor(s4*3)];` |
| `countries` | `Array.from({length:40},(_,i)=>{const s=sr(i*11);const s2=sr(i*17);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>` |
| `totalValue` | `transactions.reduce((s,t)=>s+t.valueMn,0);` |
| `avgOecd` | `Math.round(transactions.reduce((s,t)=>s+t.oecdScore,0)/50);` |
| `sectorAgg` | `useMemo(()=>SECTORS.map(s=>{const ts=transactions.filter(t=>t.sector===s);return {sector:s,count:ts.length,value:ts.reduce((a,t)=>a+t.valueMn,0)};}).f` |
| `geoAgg` | `useMemo(()=>{const m={};transactions.forEach(t=>{if(!m[t.hostCountry])m[t.hostCountry]={country:t.hostCountry,count:0,value:0};m[t.hostCountry].count+` |
| `regions` | `[...new Set(countries.map(c=>c.region))].sort();` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/export-credit-esg/assess` | `assess_export_credit` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/fossil-fuel-screen` | `fossil_fuel_screen` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/equator-principles` | `equator_principles` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/green-classification` | `green_classification` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/eca-profiles` | `ref_eca_profiles` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/oecd-arrangement` | `ref_oecd_arrangement` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/ifc-performance-standards` | `ref_ifc_performance_standards` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/fossil-fuel-exclusions` | `ref_fossil_fuel_exclusions` | api/v1/routes/export_credit_esg.py |

### 2.3 Engine `export_credit_esg_engine` (services/export_credit_esg_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_is_designated_country` | country_iso2 |  |
| `_resolve_oecd_category` | sector, project_value_usd, country_iso2 | Heuristic OECD Common Approaches category based on sector and project size. |
| `_check_ifc_ps_compliance` | sector, ps_checked | Check IFC PS compliance given sector and which standards were reviewed. |
| `_classify_fossil_fuel` | sector, subsector | Map sector/subsector to fossil fuel exclusion matrix key. |
| `_derive_esg_risk_tier` | oecd_category, fossil_fuel_classified, ifc_compliant, country_iso2 |  |
| `assess_export_credit_esg` | transaction | Full ESG assessment for an export credit / trade finance transaction. |
| `screen_fossil_fuel_exposure` | sector, subsector, eca_name | Screen a transaction for fossil fuel exposure and ECA exclusion status. |
| `apply_equator_principles` | project_value_usd, country_iso2, sector, has_existing_esia, community_affected, indigenous_peoples_affected | Determine Equator Principles IV applicability and requirements. |
| `classify_green_trade_instrument` | instrument_type, use_of_proceeds, sector, project_value_usd, eca_name | Classify a trade finance instrument for green eligibility. |
| `get_eca_sustainability_profile` | eca_name | Retrieve full ECA sustainability profile. |
| `ExportCreditESGEngine.assess` | data |  |
| `ExportCreditESGEngine.fossil_fuel_screen` | sector, subsector, eca_name |  |
| `ExportCreditESGEngine.equator_principles` | project_value_usd, country_iso2, sector, has_existing_esia, community_affected, indigenous_peoples_affected |  |
| `ExportCreditESGEngine.green_classification` | instrument_type, use_of_proceeds, sector, project_value_usd, eca_name |  |
| `ExportCreditESGEngine.eca_profile` | eca_name |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `year`
**Frontend seed datasets:** `COLORS`, `ECA_NAMES`, `EP_CATS`, `ESG_CATS`, `IFC_PS`, `PROJ_NAMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OECD CA Category (A/B/C) | — | OECD Common Approaches Â§4 | Project impact category determining depth of E&S review required; Category A requires full ESIA; >$10M thresho |
| IFC PS Compliance Score (%) | — | ESIA Audit | Weighted IFC PS compliance across applicable standards; minimum 85% required for ECA cover endorsement. |
| Public Information Availability Score | — | OECD CA Â§24 | Scoring of public disclosure completeness: ESIA summary, monitoring reports, and corrective action disclosure. |
| Host Country Gap Assessment Count | — | OECD CA Â§6 | Number of IFC PS requirements exceeding host country regulatory standard; gaps drive enhanced ESAP obligations |
- **Project information memorandum and ESIA documents** → Apply OECD CA categorisation criteria; map ESIA findings to IFC PS sub-requirements → **OECD CA category determination and IFC PS compliance gap matrix**
- **Host country E&S regulations database** → Compare project mitigation requirements against applicable national law; identify E&S gaps requiring enhanced measures → **Host country gap count by PS and corresponding ESAP obligations**
- **OECD CA monitoring reports and corrective actions** → Ingest annual monitoring updates; update compliance scores and public disclosure inventory → **Updated ECA ESG compliance score and public information availability rating**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/export-credit-esg/ref/eca-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'eca_profiles', 'berne_union_framework', 'miga_overview'], 'n_keys': 4}`

**GET /api/v1/export-credit-esg/ref/fossil-fuel-exclusions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fossil_fuel_types', 'exclusion_matrix', 'notes'], 'n_keys': 3}`

**GET /api/v1/export-credit-esg/ref/ifc-performance-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'standards', 'equator_principles', 'designated_country_note', 'ep_applicability_threshold_usd'], 'n_keys': 5}`

**GET /api/v1/export-credit-esg/ref/oecd-arrangement** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_understandings', 'common_approaches', 'ep_signatory_banks', 'ep_threshold_usd', 'green_trade_instruments', 'sector_risk_matrix'], 'n_keys': 6}`

**POST /api/v1/export-credit-esg/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ECA ESG Compliance Score
**Headline formula:** `ECA_ESG = (IFC_PS_Score × w_ps + OECD_CA_Score × w_ca) / (w_ps + w_ca)`
**Standards:** ['OECD Common Approaches 2016 (TAD/ECG(2003)2)', 'IFC Performance Standards 2012', 'Equator Principles IV 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).