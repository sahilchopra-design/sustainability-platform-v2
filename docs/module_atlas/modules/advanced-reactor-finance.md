# Advanced Reactor Finance
**Module ID:** `advanced-reactor-finance` · **Route:** `/advanced-reactor-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DU6 · **Sprint:** DU

## 1 · Overview
Financial analytics for Generation IV and fusion reactor concepts covering MSR, HTGR, fast reactors and fusion (ITER/Commonwealth Fusion), including TRL assessment, commercialisation timelines, capital cost uncertainty and DOE ARDP grant structures.

> **Business value:** Gen IV and fusion finance requires TRL-adjusted NPV frameworks given $80–$160M DOE ARDP grants, ±50–100% capital cost uncertainty and commercialisation windows of 2035–2050; industrial heat and hydrogen revenues are key value diversifiers.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARDP_COMPANIES`, `GEN4_TYPES`, `KpiCard`, `LCOE_COMPARISON`, `PROCESS_HEAT_APPS`, `Slider`, `TABS`, `TRISO_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexKw * w / (1 - Math.pow(1 + w, -lt));` |
| `idc` | `Math.pow(1 + w, cy / 2);` |
| `annMwh` | `cf0 / 100 * 8760;` |
| `annMwh` | `cf / 100 * 8760 * capexPerKw / 1000;` |
| `blendRev` | `annMwh * (elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100) / 1000;` |
| `capex` | `capexPerKw * 1000;` |
| `decommPV` | `capex * 0.15 / Math.pow(1 + w, lifetime);` |
| `annMwh` | `cf / 100 * 8760 * capexPerKw / 1000;` |
| `blendRev` | `annMwh * (elecPrice * (1 - heatPct / 100) + heatPrice * heatPct / 100) / 1000;` |
| `capex` | `capexPerKw * 1000;` |
| `annual` | `(blendRev - opexFixed) / 1e3;` |
| `trlRadar` | `GEN4_TYPES.map(g => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/advanced/securities` | `assess_securities` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/fund` | `assess_fund` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices` | `list_indices` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices/{index_key}` | `get_index_profile` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/compare-to-index` | `compare_portfolio_to_index` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/gics-sub-sectors` | `list_gics_sub_sectors` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/sovereign-coverage` | `list_sovereign_coverage` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nze-pathways` | `list_nze_pathways` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nace-gics-mapping` | `list_nace_gics_mapping` | api/v1/routes/pcaf_advanced.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `MSCI` *(shared)*, `active` *(shared)*, `broad` *(shared)*, `core` *(shared)*, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `instrument_type` *(shared)*, `investee` *(shared)*, `pydantic` *(shared)*, `security` *(shared)*, `typing` *(shared)*, `underlying` *(shared)*
**Frontend seed datasets:** `ARDP_COMPANIES`, `COLORS`, `GEN4_TYPES`, `LCOE_COMPARISON`, `PROCESS_HEAT_APPS`, `TABS`, `TRISO_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DOE ARDP Grant Size | `Grant = DOE Share × Total Project Cost (50/50 cost-share)` | DOE ARDP Awards 2020–2022 | Advanced Reactor Demonstration Program awards to TerraPower and X-energy. |
| Commercialisation Timeline | `Based on TRL progression rate and regulatory review duration` | DOE / Fusion Industry Association | Gen IV commercial deployment 2035–2040; fusion pilot plant 2040–2050. |
| Capital Cost Uncertainty Band | `CAPEX Range = Base Estimate × (1 ± Uncertainty Factor)` | IAEA Advanced Reactor Design Review | Wide uncertainty reflects pre-FOAK status; shrinks with ARDP demonstration results. |
- **DOE ARDP grant data + TRL assessments** → TRL-adjusted NPV model + cost uncertainty simulation → **Advanced reactor investment viability dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** TRL-Adjusted NPV
**Headline formula:** `TRL-NPV = Σ[P(success|TRL) × CF_t / (1+r)^t] − I₀`
**Standards:** ['DOE Technology Readiness Assessment Guide', 'Fusion Industry Association — Global Fusion Industry 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **55** other module(s).

| Connected module | Shared via |
|---|---|
| `advanced-report-studio` | table:EDGAR, table:MSCI, table:active, table:broad, table:core, table:data |
| `benchmark-analytics` | table:EDGAR |
| `carbon-aware-allocation` | table:datetime |
| `stranded-assets` | table:datetime |
| `portfolio-optimizer` | table:datetime |
| `carbon-capture-finance` | table:datetime |
| `carbon-credit-audit-trail` | table:datetime |
| `scheduled-reports` | table:datetime |
| `re-portfolio-dashboard` | table:datetime |
| `carbon-wallet` | table:datetime |