# Natural Capital Accounting
**Module ID:** `nature-capital-accounting` · **Route:** `/nature-capital-accounting` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
TEEB-aligned ecosystem service valuation for portfolio companies. Covers provisioning, regulating, cultural, and supporting services with monetary impact pathway analysis.

> **Business value:** Companies currently externalise natural capital costs — forests degraded, water consumed, species lost. Mandatory TNFD disclosures and CSRD biodiversity requirements will force internalisation. Natural capital accounting provides the methodology to quantify and disclose these previously hidden impacts.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `ECOSYSTEMS`, `ECO_SERVICES`, `LEAP_STEPS`, `Stat`, `TABS`, `TNFD_PILLARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `accounts` | `Array.from({length:40},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);` |
| `eco` | `ECOSYSTEMS[Math.floor(s*ECOSYSTEMS.length)];` |
| `_BIO_MAP_NCA` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `portfolioCompanies` | `Array.from({length:30},(_,i)=>{const s=sr(i*53);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>` |
| `totalArea` | `accounts.reduce((s,a)=>s+a.areaHa,0);` |
| `totalAssets` | `accounts.reduce((s,a)=>s+a.totalAssetValueMn,0);` |
| `avgCondition` | `Math.round(accounts.reduce((s,a)=>s+a.conditionIndex,0)/40);` |
| `totalCarbon` | `accounts.reduce((s,a)=>s+a.carbonStockTc,0);` |
| `ecoAgg` | `useMemo(()=>ECOSYSTEMS.map(e=>{const as=accounts.filter(a=>a.ecosystem===e);return {ecosystem:e,count:as.length,area:as.reduce((s,a)=>s+a.areaHa,0),va` |
| `serviceAgg` | `useMemo(()=>ECO_SERVICES.map(svc=>{let total=0;accounts.forEach(a=>{const sv=a.serviceValues.find(s=>s.service===svc);if(sv)total+=sv.annualMn;});retu` |
| `tnfdScores` | `useMemo(()=>TNFD_PILLARS.map((p,i)=>({pillar:p,avgScore:Math.round(accounts.reduce((s,a)=>s+(40+sr(a.id*97+i)*50),0)/40),readyPct:Math.round(accounts.` |
| `trendData` | `useMemo(()=>Array.from({length:8},(_,i)=>({year:2018+i,totalValue:Math.round(totalAssets*(0.7+i*0.043)),carbonStock:Math.round(totalCarbon*(0.85+i*0.0` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-capital-accounting/seea-accounts` | `seea_accounts` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/ncp-assess` | `ncp_assess` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/tev` | `tev` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/tnfd-leap` | `tnfd_leap` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/sbtn-readiness` | `sbtn_readiness` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/seea-ecosystem-types` | `ref_seea_ecosystem_types` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/encore-dependencies` | `ref_encore_dependencies` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/valuation-benchmarks` | `ref_valuation_benchmarks` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/tnfd-leap-framework` | `ref_tnfd_leap_framework` | api/v1/routes/nature_capital_accounting.py |

### 2.3 Engine `nature_capital_accounting_engine` (services/nature_capital_accounting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureCapitalAccountingEngine.conduct_seea_accounting` | entity_data, land_area_ha, ecosystem_types, condition_observations | Produce SEEA Ecosystem Accounts for an entity. |
| `NatureCapitalAccountingEngine.apply_natural_capital_protocol` | entity_data, scope, assessment_type, impact_score, dependency_trend, business_case_score | NCP 2016 — 4-step assessment. |
| `NatureCapitalAccountingEngine.calculate_tev` | ecosystem_type, land_area_ha, country_iso, option_rate, existence_rate, bequest_rate | TEV decomposition: direct use + indirect use + option + existence + bequest. |
| `NatureCapitalAccountingEngine.score_tnfd_leap` | locate_data, evaluate_data, assess_data, prepare_data | TNFD LEAP scoring: 4 steps × 25 points each = 0-100 total. |
| `NatureCapitalAccountingEngine.assess_sbtn_readiness` | entity_data, target_types | SBTN 5-step readiness assessment. |
| `NatureCapitalAccountingEngine.ref_seea_ecosystem_types` |  |  |
| `NatureCapitalAccountingEngine.ref_encore_dependencies` |  |  |
| `NatureCapitalAccountingEngine.ref_valuation_benchmarks` |  |  |
| `NatureCapitalAccountingEngine.ref_tnfd_leap_framework` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `direct`, `fastapi` *(shared)*, `peer` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `ECOSYSTEMS`, `ECO_SERVICES`, `LEAP_STEPS`, `TABS`, `TNFD_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ecosystem Services | — | TEEB/CICES | Provisioning, regulating, cultural, supporting |
| Typical Shadow Price | — | TEEB | Wide range by ecosystem type and service |
| Impact Pathways | — | Natural Capital Protocol | GHG, air, water use, waste, land use, water pollution |
- **Operational activities** → Ecosystem service dependency mapping → **Impact pathway identification**
- **TEEB shadow prices** → Ecosystem service monetisation → **Natural capital cost/benefit**
- **Natural capital P&L** → Enterprise value adjustment → **True cost accounting**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-capital-accounting/ref/encore-dependencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/seea-ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/tnfd-leap-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/valuation-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**POST /api/v1/nature-capital-accounting/ncp-assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** TEEB ecosystem service monetisation
**Headline formula:** `NaturalCapitalValue = Σ(service_area × value_per_ha); Impact = Dependency × ChangeInService`
**Standards:** ['TEEB', 'SEEA', 'TNFD', 'Natural Capital Coalition']

**Engine `nature_capital_accounting_engine` — extracted transformation lines:**
```python
normalised = {k: v / total_frac for k, v in ecosystem_types.items()}
area = round(land_area_ha * frac, 2)
area = land_area_ha * frac
physical_flow = round(area * ci, 1)
monetary_flow = round(area * mid_rate * ci, 0)
annuity_factor = (1 - (1 + discount_rate) ** -time_horizon_yr) / discount_rate
total_asset_value_usd = round(total_monetary_value_usd * annuity_factor, 0)
weighted_dep = sum(dependency_scores.values()) / max(len(dependency_scores), 1)
revenue_at_risk_pct = weighted_dep * 0.25
revenue_at_risk_usd = round(revenue_usd * revenue_at_risk_pct, 0)
dependency_value_usd = round(revenue_usd * weighted_dep * 0.15, 0)
val = land_area_ha * mid * country_mult
val = land_area_ha * mid * country_mult
option_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * option_rate_used
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `company-profiles` | table:peer |