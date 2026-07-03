# TNFD LEAP Assessment
**Module ID:** `tnfd-leap` · **Route:** `/tnfd-leap` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Full TNFD LEAP framework implementation: Locate (interface with nature), Evaluate (dependencies/impacts), Assess (material risks/opportunities), Prepare (strategy/targets/disclosure).

> **Business value:** TNFD is the emerging standard for nature risk disclosure, designed to drive capital flows toward nature-positive outcomes. Many jurisdictions (UK, EU, Australia) are moving toward mandatory nature disclosure. This module provides the complete LEAP workflow needed for TNFD Early Adopter and future regulatory compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_BII`, `ECOSYSTEM_SERVICES`, `KpiCard`, `NATURE_SCENARIOS`, `PIE_COLORS`, `SCENARIO_TREND`, `SECTOR_KEYS`, `SECTOR_NATURE_INTERFACES`, `Section`, `TNFD_DISCLOSURES_INIT`, `TnfdLeapPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_BIO_MAP_TNFD` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `statusLabel` | `s => s === 'compliant' ? 'Compliant' : s === 'partial' ? 'Partial' : s === 'gap' ? 'Gap' : s === 'na' ? 'N/A' : 'Pending';` |
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : n;` |
| `depScore` | `sd.dep_score + ((c.isin \|\| '').charCodeAt(3) % 15 - 7);` |
| `impScore` | `sd.impact_score + ((c.isin \|\| '').charCodeAt(4) % 12 - 6);` |
| `topRisk` | `(sd.risks[0] \|\| {}).risk \|\| 'N/A';` |
| `topOpp` | `(sd.opportunities[0] \|\| {}).type \|\| 'N/A';` |
| `avgDep` | `scoredHoldings.reduce((s, h) => s + h.dep_score, 0) / scoredHoldings.length;` |
| `avgImp` | `scoredHoldings.reduce((s, h) => s + h.impact_score, 0) / scoredHoldings.length;` |
| `rows` | `scoredHoldings.map(h => [h.company_name \|\| h.name, h.isin, h.gics_sector \|\| h.sector, h.dep_score, h.impact_score, h.biomes, h.topRisk, h.topOpp, h.na` |
| `csv` | `[headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tnfd_leap_report_${new` |
| `data` | `{ assessment_date: new Date().toISOString(), disclosures, holdings: scoredHoldings.map(h => ({ name: h.company_name \|\| h.name, isin: h.isin, sector: h` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.` |
| `overall` | `Math.round((h.physRisk + h.transRisk + h.sysRisk + h.litRisk) / 4 * 25);` |
| `overall` | `Math.round(((3 - q1) + (3 - q2) + (3 - q3) + (3 - q4)) / 12 * 100);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tnfd-leap/assess` | `run_leap_assessment` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/assessments/{entity_id}` | `list_assessments` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/biomes` | `get_biomes` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/impact-drivers` | `get_impact_drivers` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/sector-materiality` | `get_sector_materiality` | api/v1/routes/tnfd_leap.py |
| GET | `/api/v1/tnfd-leap/ref/cross-framework` | `get_cross_framework` | api/v1/routes/tnfd_leap.py |

### 2.3 Engine `tnfd_leap_engine` (services/tnfd_leap_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TNFDLEAPEngine._get_sector_profile` | sector |  |
| `TNFDLEAPEngine._score_to_magnitude` | score |  |
| `TNFDLEAPEngine._score_to_maturity` | score |  |
| `TNFDLEAPEngine._level_to_magnitude` | level | Map a caller-supplied qualitative level to an ordinal 0–100 magnitude. |
| `TNFDLEAPEngine._num` | value | Coerce a supplied value to float, or None if not numeric. |
| `TNFDLEAPEngine.locate_assessment` | entity_id, sector, value_chain_scope, locations | Step L — Locate: identify interfaces with nature across value chain. |
| `TNFDLEAPEngine.evaluate_assessment` | entity_id, sector, locate_result, dependencies, impacts | Step E — Evaluate: assess dependencies and impacts using ENCORE. |
| `TNFDLEAPEngine.assess_material_risks` | entity_id, sector, evaluate_result, risks, opportunities | Step A — Assess: identify material nature-related risks and opportunities. |
| `TNFDLEAPEngine.prepare_response` | entity_id, assess_result, strategy_response, targets, disclosures_met | Step P — Prepare: strategy, targets, and disclosure completeness. |
| `TNFDLEAPEngine._derive_improvement_areas` | strategy, targets, disclosure_pct | Deterministically flag improvement areas from observed gaps. |
| `TNFDLEAPEngine.run_full_leap` | entity_id, sector, reporting_period | Run all 4 LEAP steps and return comprehensive assessment dict. |
| `TNFDLEAPEngine.get_reference_data` |  | Return all reference constants for front-end consumption. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `tnfd_leap_assessments`, `typing` *(shared)*
**Frontend seed datasets:** `COUNTRY_BII`, `ECOSYSTEM_SERVICES`, `NATURE_SCENARIOS`, `PIE_COLORS`, `SCENARIO_TREND`, `TNFD_DISCLOSURES_INIT`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TNFD Recommended Metrics | — | TNFD V1.0 | Including land use, water, pollution, biodiversity indicators |
| LEAP Phases | — | TNFD | Locate, Evaluate, Assess, Prepare |
| Sector Guidance Modules | — | TNFD | Agriculture, chemicals, financials, food, metals, O&G, pharma, RE, utilities |
- **Activity mapping** → ENCORE interface identification → **Nature interface locations**
- **Ecosystem dependencies** → TNFD materiality assessment → **Material nature risks**
- **Nature risk assessment** → Strategy and target setting → **TNFD-aligned disclosure**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tnfd-leap/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/tnfd-leap/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/tnfd-leap/ref/biomes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['biomes', 'count'], 'n_keys': 2}`

**GET /api/v1/tnfd-leap/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework'], 'n_keys': 1}`

**GET /api/v1/tnfd-leap/ref/impact-drivers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['impact_drivers', 'count'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP four-phase process
**Headline formula:** `Locate → Evaluate → Assess → Prepare (iterative)`
**Standards:** ['TNFD V1.0 (2023)', 'GBF Kunming-Montreal', 'TNFD Sector Guidance']

**Engine `tnfd_leap_engine` — extracted transformation lines:**
```python
mean_opp = sum(opp_values) / len(opp_values)
period = reporting_period or str(date.today().year - 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `esg-data-quality` | table:SET |