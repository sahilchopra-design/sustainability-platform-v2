# Green Hydrogen Project Finance
**Module ID:** `hydrogen-project-finance` · **Route:** `/hydrogen-project-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DS2 · **Sprint:** DS

## 1 · Overview
Project finance waterfall for green hydrogen assets covering electrolyser, compression, storage and distribution CAPEX with H2 price scenario analysis and IRR sensitivity to electricity costs.

> **Business value:** Green H2 project finance viability hinges on secured offtake at >$4/kg and PPA electricity <$40/MWh; DSCR of 1.25x is achievable with 20-year contracts, enabling investment-grade project bonds under BNEF base case assumptions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `next` | `r - f / df;` |
| `opYear` | `y - constructionYears + 1;` |
| `ebitda` | `revenue * (1 - 0.02 * Math.max(0, opYear - 5)) - opex;` |
| `debtAmt` | `capex * debtRatio / 100;` |
| `equityAmt` | `capex * (1 - debtRatio / 100);` |
| `projectNpv` | `useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);` |
| `ebitdaAvg` | `(revenuePerYear - opexPerYear);` |
| `annualDebtService` | `debtAmt * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor));` |
| `cashflowData` | `useMemo(() => cashflows.map((cf, i) => ({` |
| `revShock` | `0.8 + sr(i * 17) * 0.4;` |
| `opexShock` | `0.9 + sr(i * 11) * 0.3;` |
| `capexShock` | `0.9 + sr(i * 7) * 0.3;` |
| `adjCapex` | `capex * capexShock;` |
| `adjRev` | `revenuePerYear * revShock;` |
| `adjOpex` | `opexPerYear * opexShock;` |
| `cfs` | `buildCashflows({ capex: adjCapex, revenue: adjRev, opex: adjOpex, debtAmt: adjCapex * debtRatio / 100, debtRate: debtRate / 100, tenor, constructionYe` |
| `h2BankTotal` | `h2BankSubsidy * annualOutput * 1000 * 10; // 10yr programme` |
| `ira45v` | `2.0 * annualOutput * 1000 * 10;  // ~$2/kg for tier 1, 10 yr` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/hydrogen/demand-sector` | `demand_sector` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/eu-h2-bank` | `eu_h2_bank` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/cost-trajectory` | `cost_trajectory` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/portfolio` | `portfolio` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/h2-colours` | `ref_h2_colours` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/production-pathways` | `ref_production_pathways` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/country-costs` | `ref_country_costs` | api/v1/routes/hydrogen.py |

### 2.3 Engine `hydrogen_economy_engine` (services/hydrogen_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_annuity_factor` | rate, years | Annuity factor for CAPEX annualisation. |
| `HydrogenEconomyEngine.calculate_lcoh` | entity_id, production_pathway, capacity_mw_el, country_code, capacity_factor_pct, financing_cost_pct |  |
| `HydrogenEconomyEngine.assess_rfnbo_compliance` | entity_id, production_pathway, country_code, re_source, hourly_matching, temporal_correlation |  |
| `HydrogenEconomyEngine.assess_demand_sector` | entity_id, demand_sector, annual_h2_demand_t, country_code, current_fuel_type, green_lcoh_usd_kg |  |
| `HydrogenEconomyEngine.assess_eu_h2_bank` | entity_id, production_pathway, capacity_mw_el, country_code, lcoh_usd_kg, competitive_bid_price_eur_kg |  |
| `HydrogenEconomyEngine.project_cost_trajectory` | entity_id, production_pathway, country_code, base_lcoh_2024_usd_kg |  |
| `HydrogenEconomyEngine.assess_portfolio` | entity_id, projects |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total CAPEX | `Electrolyser+BOP+compression+storage` | BNEF 2023 | Electrolyser typically 40-50% of total CAPEX; BOP and compression add 25-35%. |
| Project IRR | `IRR = solve NPV(FCF)=0` | IEA 2023 | Merchant projects require >10% IRR; contracted offtake with H2 price floor can reach bankable 8-10%. |
| DSCR | `EBITDA/Annual Debt Service` | Project Finance Standard | Lenders typically require minimum DSCR of 1.25x; 1.40x target for investment-grade rating. |
- **H2 spot price forecasts** → → revenue model → **$/kg by year and scenario**
- **Electricity contract** → → LCOH model → **PPA price and volume profile**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/hydrogen/ref/country-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_electricity_costs', 'eu_h2_bank_eligibility', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/h2-colours** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['h2_colours', 'rfnbo_ghg_threshold_kgco2e_kgh2', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/production-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['production_pathways', 'rfnbo_criteria', 'source'], 'n_keys': 3}`

**POST /api/v1/hydrogen/cost-trajectory** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/demand-sector** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Project Finance IRR
**Headline formula:** `IRR: NPV(FCF, r)=0; DSCR=EBITDA/DebtService`
**Standards:** ['BNEF Hydrogen Economy Outlook', 'IEA Project Finance Guidelines', 'Green Bond Principles']

**Engine `hydrogen_economy_engine` — extracted transformation lines:**
```python
r = rate / 100.0
H2_LHV_KWH_PER_KG = 33.33  # kWh/kg LHV
capacity_kw = capacity_mw_el * 1000.0
cf = _clamp(5.0, 95.0, capacity_factor_pct) / 100.0
annual_hours = 8760.0 * cf
annual_h2_kwh = capacity_kw * annual_hours * efficiency
annual_h2_kg = annual_h2_kwh / self.H2_LHV_KWH_PER_KG
annual_h2_t = annual_h2_kg / 1000.0
annual_capex = capex_total_usd * annuity
capex_component = round(annual_capex / max(annual_h2_kg, 1.0), 4)
opex_component = round(annual_opex / max(annual_h2_kg, 1.0), 4)
annual_elec_kwh = capacity_kw * annual_hours
annual_elec_cost = annual_elec_kwh * elec_cost
electricity_component = round(annual_elec_cost / max(annual_h2_kg, 1.0), 4)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **4** other module(s).
**Shared engines (edits propagate!):** `hydrogen_economy_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `hydrogen-market-intelligence` | engine:hydrogen_economy_engine |
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`