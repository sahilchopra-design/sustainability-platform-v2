# Climate Tech Intelligence
**Module ID:** `climate-tech` · **Route:** `/climate-tech` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the climate technology investment landscape including venture capital flows, patent activity, startup ecosystem mapping, and technology readiness progression across mitigation and adaptation sectors.

> **Business value:** Provides climate investors, corporate strategists, and policy makers with data-driven intelligence on the climate technology ecosystem to guide investment allocation, partnership decisions, and innovation policy.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `CO_NAMES`, `CPC_CLASSES`, `GEOS`, `KpiCard`, `MARKET_TAM`, `MATURITY`, `PATENT_DATA`, `PIE_C`, `Panel`, `RISK_LEVELS`, `Row`, `SECTORS`, `STAGES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Pre-IPO', 'Public'];` |
| `stage` | `STAGES[Math.floor(sr(i * 7) * STAGES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 11) * GEOS.length)];` |
| `founded` | `2010 + Math.floor(sr(i * 13) * 15);` |
| `trl` | `1 + Math.floor(sr(i * 17) * 9);` |
| `funding` | `Math.round(5 + sr(i * 19) * 995);` |
| `irr` | `Math.round(4 + sr(i * 23) * 36);` |
| `co2AvoidedMtpa` | `Math.round((0.01 + sr(i * 29) * 4.99) * 100) / 100;` |
| `waterSavedMn` | `Math.round(sr(i * 31) * 500);` |
| `jobsCreated` | `Math.round(50 + sr(i * 37) * 4950);` |
| `landHaMn` | `Math.round((sr(i * 41) * 2) * 100) / 100;` |
| `ipoReadiness` | `Math.round(10 + sr(i * 43) * 88);` |
| `revenue` | `Math.round(1 + sr(i * 47) * 499);` |
| `scalabilityScore` | `Math.round(15 + sr(i * 53) * 84);` |
| `patentCount` | `Math.round(sr(i * 59) * 120);` |
| `techRisk` | `RISK_LEVELS[Math.floor(sr(i * 61) * 3)];` |
| `marketRisk` | `RISK_LEVELS[Math.floor(sr(i * 67) * 3)];` |
| `policyRisk` | `RISK_LEVELS[Math.floor(sr(i * 71) * 3)];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-tech/assess-technology` | `assess_technology` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/investment-opportunity` | `analyse_investment_opportunity` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/portfolio-analysis` | `build_portfolio_analysis` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/learning-curve` | `calculate_learning_curve` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/ctvc-taxonomy` | `get_ctvc_taxonomy` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/iea-deployment` | `get_iea_deployment` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/mac-curves` | `get_mac_curves` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/vc-market-data` | `get_vc_market_data` | api/v1/routes/climate_tech.py |

### 2.3 Engine `climate_tech_engine` (services/climate_tech_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateTechEngine.assess_technology` | technology_name, category | Assess a climate technology: TRL, costs, abatement, MAC, IEA NZE gap, attractiveness. |
| `ClimateTechEngine.analyse_investment_opportunity` | technology, stage, geography, investment_size_usd | VC/PE market context, comparable deal multiples, patent position, risk-return. |
| `ClimateTechEngine.build_portfolio_analysis` | technology_list, investment_amounts | Diversification across CTVC sectors, combined abatement, portfolio MAC, EU Taxonomy alignment. |
| `ClimateTechEngine.calculate_learning_curve` | technology, current_cumulative_capacity, target_cumulative_capacity | Project cost at target cumulative capacity using Wright's Law. |
| `ClimateTechEngine._get_technology_risks` | tech_key, trl, mac, deployment_gap |  |
| `ClimateTechEngine._get_technology_opportunities` | tech_key, abatement, learning_rate, trl |  |
| `ClimateTechEngine._build_investment_thesis` | tech_key, stage, ctvc_sector, trl |  |
| `ClimateTechEngine._generate_rebalancing_suggestions` | sector_alloc, eu_pct, avg_trl, abatement |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `most`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CO_NAMES`, `CPC_CLASSES`, `GEOS`, `MATURITY`, `PIE_C`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Climate Tech VC Investment (2023) | — | Bloomberg NEF 2024 | Total venture and growth equity invested in climate technology companies globally in 2023. |
| Patent Filings Growth (Clean Energy) | — | EPO Patent Index 2024 | Compound annual growth rate in clean energy patent applications filed with major patent offices. |
- **Crunchbase/Dealroom VC data, EPO/USPTO patent databases, startup self-reporting, BNEF market intelligence** → Investment flow aggregation, patent trend analysis, TRL scoring, ecosystem mapping → **Investment dashboards, patent heat maps, startup scorecards, sector maturity curves**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-tech/ref/ctvc-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'sector_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/climate-tech/ref/iea-deployment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'reporting_year', 'technology_count', 'technologies'], 'n_keys': 4}`

**GET /api/v1/climate-tech/ref/mac-curves** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'technology_count', 'total_abatement_potential_2030_gtco2', 'total_abatement_potential_2050_gtco2', 'cost_tiers', 'curves'], 'n_keys': 6}`

**GET /api/v1/climate-tech/ref/vc-market-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'reporting_year', 'total_climate_tech_investment_usd_bn', 'total_deal_count', 'sectors', 'bnef_learning_curve_count', 'patent_intensity_technologies', 'trl_definitions', 'green_taxon`

**POST /api/v1/climate-tech/assess-technology** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Tech Investment Growth Rate
**Headline formula:** `CTIGR = (Investmentₜ – Investmentₜ₋₁) / Investmentₜ₋₁ × 100`
**Standards:** ['Bloomberg NEF ClimateTech 2024', 'PwC State of Climate Tech 2023']

**Engine `climate_tech_engine` — extracted transformation lines:**
```python
cost_reduction_2030 = round((cost_2024 - cost_2030) / max(cost_2024, 1) * 100, 1)
cost_reduction_2050 = round((cost_2024 - cost_2050) / max(cost_2024, 1) * 100, 1)
weight = amount / total_investment
eu_taxonomy_pct = round(eu_taxonomy_count / max(len(technology_list), 1) * 100, 1)
hhi = sum(v ** 2 for v in sector_allocation.values())
diversification_score = round((1 - hhi) * 100, 1)
avg_trl = round(sum(trl_values) / max(len(trl_values), 1), 1)
temperature_contribution = round(max(0.05, 2.0 - total_abatement_2050 * 0.15), 2)
ctvc_sector_allocation={k: round(v * 100, 1) for k, v in sector_allocation.items()},
capacity_ratio = target_cumulative_capacity / current_cumulative_capacity
projected_cost = current_cost * (capacity_ratio ** learning_exp)
cost_reduction_pct = round((current_cost - projected_cost) / max(current_cost, 1) * 100, 1)
lcoe_current = round(current_cost * lcoe_factor / 1000, 2)
lcoe_target = round(projected_cost * lcoe_factor / 1000, 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).