# Supply Chain Carbon Tracker
**Module ID:** `supply-chain-carbon` · **Route:** `/supply-chain-carbon` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tier 1/2/3 supplier GHG mapping using spend-based and supplier-specific methodologies. Covers Scope 3 Category 1/2 hot spots, supplier engagement, and data collection cascade.

> **Business value:** Supply chain emissions (Scope 3 Category 1) are typically the largest emissions source for manufacturing and retail companies, often 5-10x Scope 1+2 combined. This module enables systematic supplier engagement and data collection to upgrade from estimates to measured Scope 3 Cat 1.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITY_CATEGORIES`, `ChartTooltip`, `PIE_COLORS`, `TIER_COLORS`, `TIER_MULTIPLIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tier1Est` | `companyTotal * mult.tier1;` |
| `tier2Est` | `companyTotal * mult.tier2;` |
| `tier3Est` | `companyTotal * mult.tier3;` |
| `grandTotal` | `companyTotal + tier1Est + tier2Est + tier3Est;` |
| `_ILO_MAP` | `Object.fromEntries(ILO_LABOR_INDICATORS.map(l => [l.country, l]));` |
| `fmt` | `(v, d = 0) => v == null ? '-' : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `(v) => { if (v == null) return '-'; const a = Math.abs(v); if (a >= 1e9) return (v / 1e9).toFixed(2) + ' Bt'; if (a >= 1e6) return (v / 1e6).toFixed(2` |
| `pct` | `(v) => v == null ? '-' : (v * 100).toFixed(1) + '%';` |
| `sBadge` | `(bg, fg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color: fg, letterSpacing` |
| `adjTier1` | `scData.tier1.estimated * (1 - tier1Reduction / 100);` |
| `adjTier2` | `scData.tier2.estimated * (1 - tier2Reduction / 100);` |
| `adjScope2` | `scData.company.scope2 * (1 - renewableSwitch / 100);` |
| `adjCompany` | `scData.company.scope1 + adjScope2;` |
| `adjTotal` | `adjCompany + adjTier1 + adjTier2 + scData.tier3.estimated;` |
| `sectorAvg` | `1 + mult.tier1 + mult.tier2 + mult.tier3;` |
| `emissions` | `tierEmissions * ac.pct;` |
| `rev` | `(selectedCompany.revenue_usd_mn \|\| 1) * 1e6;` |
| `compInt` | `scData.company.total / rev * 1e6;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ACTIVITY_CATEGORIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Tier 1 Suppliers | — | Typical portfolio | Direct suppliers receiving primary engagement |
| Data Collection Rate | — | CDP benchmark | Tier 1 suppliers providing actual emissions data |
| EEIO Emission Factors | — | Method | Spend-based proxy for Tier 2+ suppliers |
- **Supplier spend data** → EEIO factor application → **Tier 2/3 estimated emissions**
- **CDP/primary survey** → Supplier actual data → **Tier 1 measured emissions**
- **Full S3 inventory** → Hotspot identification → **Engagement priority list**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Supplier emissions mapping
**Headline formula:** `S3Cat1 = Σ(spend_ij × EF_sector_j); Primary_data = supplier_reported_tCO2e`
**Standards:** ['GHG Protocol Scope 3 Standard', 'PCAF', 'CDP Supply Chain']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-network-viz` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-contagion` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-emissions-mapper` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-resilience` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-map` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-labor-climate` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-esg-hub` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |