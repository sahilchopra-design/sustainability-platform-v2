# Geothermal Project Finance
**Module ID:** `geothermal-project-finance` · **Route:** `/geothermal-project-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DV2 · **Sprint:** DV

## 1 · Overview
Project finance structuring for geothermal developments covering exploration-development-production CAPEX phases, well productivity uncertainty, resource risk insurance, IFC GGSP concessional support and country IRR benchmarks.

> **Business value:** Geothermal project finance requires phased capital structures separating exploration risk (GGSP grants) from development debt; 30–50% drilling contingency and P10/P50/P90 productivity scenarios drive lender sizing and IRR outcomes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FINANCING_STRUCTURES`, `KpiCard`, `RISK_CATEGORIES`, `Slider`, `TABS`, `WELL_RISK_FACTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `revenueMyr` | `annMwh * ppa / 1e6;` |
| `debtM` | `capexM * debtPct / 100;` |
| `equityM` | `capexM - debtM;` |
| `annDebtService` | `debtM * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;` |
| `ebitda` | `revenueMyr - opexMyr;` |
| `projectNpv` | `useMemo(() => npv([-capexM, ...Array(30).fill(ebitda)], wacc), [capexM, ebitda, wacc]);` |
| `composite` | `WELL_RISK_FACTORS.reduce((s, f) => s + f.base * f.weight, 0) / 100;` |
| `capexVar` | `capexM * (0.85 + sr(i * 3) * 0.3);` |
| `revenueVar` | `revenueMyr * (0.8 + sr(i * 7) * 0.4);` |
| `opexVar` | `opexMyr * (0.9 + sr(i * 11) * 0.2);` |
| `debtVar` | `capexVar * debtPct / 100;` |
| `equityVar` | `capexVar - debtVar;` |
| `dsVar` | `debtVar * 1e6 * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor)) / 1e6;` |
| `cf2` | `[-equityVar, ...Array(30).fill(Math.max(0, revenueVar - opexVar - dsVar))];` |
| `sorted` | `[...mcPaths].sort((a, b) => a - b);` |
| `bins` | `Array.from({ length: 20 }, (_, i) => ({ irr: -10 + i * 3, count: 0 }));` |
| `idx` | `Math.min(19, Math.max(0, Math.floor((r + 10) / 3)));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FINANCING_STRUCTURES`, `RISK_CATEGORIES`, `TABS`, `WELL_RISK_FACTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Drilling Cost Contingency | `Contingency = Base Drilling Cost × Contingency Factor` | World Bank ESMAP 2012 | Reflects geological uncertainty; EGS and frontier areas require higher contingency than proven hydrothermal fi |
| Well Productivity P10/P50/P90 | `Productivity Distribution = Resource Assessment Monte Carlo` | GeothermEx / GNS Science | P-value spread drives project capacity uncertainty and lender sizing of debt. |
| IFC GGSP Grant Size | `GGSP Grant = Well Cost × Coverage Ratio` | IFC Global Geothermal Support Program | Concessional risk-sharing for exploration wells reducing private sector exposure. |
- **ESMAP geothermal benchmarks + IFC GGSP terms** → Phase-gate CAPEX model → IRR sensitivity → **Geothermal project finance term sheet dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal IRR Model
**Headline formula:** `Project IRR = f(Resource Risk, Drilling CAPEX, PPA Price, CF, Concessional Debt Share)`
**Standards:** ['World Bank ESMAP — Geothermal Handbook 2012', 'IFC — Scaling Geothermal 2013']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-market-intelligence` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-aware-allocation` | table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:sqlalchemy |
| `carbon-wallet` | table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:db, table:sqlalchemy |