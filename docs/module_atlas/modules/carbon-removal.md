# Carbon Removal Analytics
**Module ID:** `carbon-removal` · **Route:** `/carbon-removal` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
CDR (Carbon Dioxide Removal) portfolio analytics. Covers BECCS, DAC, enhanced weathering, ocean CDR, biochar, and afforestation. Includes permanence, co-benefits, MRV quality, and cost comparison.

> **Business value:** CDR is unavoidable for Paris Agreement compliance — IPCC scenarios require 5-16 GtCO2/yr of removal by 2050. Companies need CDR for residual emissions in net-zero claims. This module enables rigorous CDR selection, ensuring high permanence and robust MRV before purchase and retirement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_POLICY`, `CDR_TECHNOLOGIES`, `COLORS`, `CORPORATE_BUYERS`, `INTEGRITY_DIMENSIONS`, `KpiCard`, `MARKET_DATA`, `PRICE_HISTORY`, `PROJECTS`, `PROJECT_NAMES_BASE`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MARKET_DATA` | `['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((yr, i) => ({` |
| `PRICE_HISTORY` | `['Q1-22', 'Q2-22', 'Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24'].map((q, i) => ({` |
| `categories` | `['All', 'Engineered', 'Nature-Based', 'Geochemical', 'Hybrid'];` |
| `standards` | `['All', 'Verra VCU', 'Gold Standard', 'Puro.earth', 'Plan Vivo', 'SBTi CDR', 'ISO 14064-2', 'BeZero'];` |
| `totalCap` | `filteredProjects.reduce((s, p) => s + p.capacityKtY, 0);` |
| `avgCost` | `filteredProjects.reduce((s, p) => s + p.costPerTon, 0) / n;` |
| `totalPot2050` | `CDR_TECHNOLOGIES.reduce((s, t) => s + t.potential2050, 0);` |
| `totalRemoved` | `filteredProjects.reduce((s, p) => s + p.co2Removed, 0);` |
| `yearIndex` | `calcYear - 2024;` |
| `yearFactor` | `Math.max(0.4, 1 - yearIndex * 0.04);` |
| `midCost` | `(tech.costLow + tech.costHigh) / 2;` |
| `costAtYear` | `+(midCost * yearFactor).toFixed(0);` |
| `buyerSectors` | `['All', ...Array.from(new Set(CORPORATE_BUYERS.map(b => b.sector)))];` |
| `catColor` | `c => ({ 'Engineered': T.navy, 'Nature-Based': T.sage, 'Geochemical': T.teal, 'Hybrid': T.gold }[c] \|\| T.textSec);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `midCost` | `tech ? (tech.costLow + tech.costHigh) / 2 : 200;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-removal/assess` | `run_full_assessment` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/technology-assessment` | `assess_technology` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/oxford-principles` | `score_oxford_principles` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/article-64` | `assess_article64` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/cdr-economics` | `calculate_economics` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/market-eligibility` | `assess_market_eligibility` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/technology-profiles` | `get_technology_profiles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/oxford-principles` | `get_oxford_principles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/market-benchmarks` | `get_market_benchmarks` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/frontier-criteria` | `get_frontier_criteria` | api/v1/routes/carbon_removal.py |

### 2.3 Engine `carbon_removal_engine` (services/carbon_removal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonRemovalEngine.assess_cdr_technology` | project_data | Match project to CDR technology profile, assess TRL, cost trajectory, |
| `CarbonRemovalEngine.score_oxford_principles` | project_data | Score all 4 Oxford CDR Principles. Returns composite 0-100 score, |
| `CarbonRemovalEngine.assess_article64_eligibility` | project_data | Check all 6 Paris Agreement Article 6.4 requirements. |
| `CarbonRemovalEngine.calculate_cdr_economics` | project_data | Model CAPEX/OPEX, LCOE ($/tCO2), NPV/IRR at credit price scenarios, |
| `CarbonRemovalEngine.assess_market_eligibility` | project_data | Assess CORSIA eligibility, Frontier AMC eligibility, voluntary market tier, |
| `CarbonRemovalEngine.run_full_assessment` | project_data | Comprehensive CDR project assessment producing composite cdr_quality_score, |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `cdr_quality_score` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CDR_POLICY`, `CDR_TECHNOLOGIES`, `COLORS`, `CORPORATE_BUYERS`, `INTEGRITY_DIMENSIONS`, `MARKET_DATA`, `PRICE_HISTORY`, `PROJECT_NAMES_BASE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDR Technologies | — | Taxonomy | BECCS, DAC, EW, ocean CDR, biochar, afforestation |
| Cost Range | — | Market | Wide range from low-tech afforestation to high-tech DAC |
| Permanence | — | Technology | Key quality differentiator between CDR approaches |
- **CDR project data** → Technology assessment → **Quality score per CDR type**
- **Permanence projections** → Net removal calculation → **Adjusted CDR credit value**
- **Cost curves** → Portfolio optimisation → **Lowest-cost CDR mix meeting quality thresholds**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-removal/ref/frontier-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frontier_eligibility_criteria', 'criteria_count', 'total_weight', 'eligibility_threshold', 'founding_members', 'commitment_size_usd', 'source', 'excluded_project_types'], 'n_keys': 8}`

**GET /api/v1/carbon-removal/ref/market-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['market_benchmarks', 'buyer_count', 'article_64_eligibility', 'total_vcm_volume_2024_tco2', 'source'], 'n_keys': 5}`

**GET /api/v1/carbon-removal/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oxford_cdr_principles', 'source', 'quality_tiers', 'article_64_synergy'], 'n_keys': 4}`

**GET /api/v1/carbon-removal/ref/technology-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['technology_profiles', 'count', 'source', 'trl_scale', 'scalability_ratings', 'ipcc_categories'], 'n_keys': 6}`

**POST /api/v1/carbon-removal/article-64** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** CDR technology comparison
**Headline formula:** `NetRemoval = GrossCapture - StorageLeakage - EnergyEmissions`
**Standards:** ['IPCC AR6 WGIII Ch.12', 'CDR.fyi', 'DOE CDR Prize']

**Engine `carbon_removal_engine` — extracted transformation lines:**
```python
cost_reduction_pct = ((cost_current - cost_2050) / cost_current * 100) if cost_current > 0 else 0
co_benefit_score = min(len(co_benefits) * 2.0, 10.0)
trl_score = (trl / 9) * 50
technology_readiness_score = round(trl_score + scalability_score * 0.5 + co_benefit_score * 0.5, 1)
perm = min(perm + 3.0, 25.0)
perm = min(perm + 2.0, 25.0)
annual_capex = capex / project_life if project_life > 0 else capex
total_annual_cost = annual_capex + annual_opex
lcoe = total_annual_cost / annual_removal
blended_grant = capex * blended_finance_grant_pct
effective_capex = capex - blended_grant
lcoe_blended = ((effective_capex / project_life) + annual_opex) / annual_removal if project_life > 0 else lcoe
annual_revenue = credit_price * annual_removal
annual_net_cf = annual_revenue - annual_opex
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `carbon_removal_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `carbon-removal-markets` | engine:carbon_removal_engine, table:cdr_quality_score |