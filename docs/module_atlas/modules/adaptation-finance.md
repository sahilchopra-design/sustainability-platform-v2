# Adaptation Finance Hub
**Module ID:** `adaptation-finance` · **Route:** `/adaptation-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate adaptation finance tracking covering bilateral ODA, MDB climate finance, private adaptation investment, and innovative instruments (catastrophe bonds, weather insurance, resilience bonds).

> **Business value:** The adaptation finance gap is widening as climate impacts worsen. Developing countries need $300-500B/yr but receive $50-60B. This module tracks flows, identifies gaps, and supports impact investors designing climate adaptation finance solutions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `PROJECT_CATEGORIES`, `RCP_SCENARIOS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `projectAlignmentData` | `gfmaCategoryData.map((c, i) => ({` |
| `portfolioBreakdown` | `gfmaCategoryData.map((c, i) => ({` |
| `gfmaTotal` | `gfmaCategoryData.reduce((s, c) => s + c.value, 0);` |
| `gfmaAlignment` | `Math.round(seed(101) * 20 + 72);` |
| `gariComposite` | `Math.round(gariCriteria.reduce((s, c) => s + c.score, 0) / gariCriteria.length);` |
| `avgRiskReduction` | `Math.round(hazardResilienceData.reduce((s, h) => s + h.reduction, 0) / hazardResilienceData.length);` |
| `bcrValue` | `(Math.round(seed(102) * 20 + 18) / 10).toFixed(1);` |
| `costPerBeneficiary` | `Math.round(seed(103) * 200 + 150);` |
| `livesProtected` | `Math.round(seed(104) * 80000 + 40000);` |
| `totalInvestment` | `Math.round(seed(105) * 200 + 150);` |
| `blendedRatio` | `Math.round(seed(106) * 30 + 40);` |
| `napAlignment` | `Math.round(seed(107) * 20 + 72);` |
| `portfolioScore` | `Math.round((gfmaAlignment + gariComposite) / 2);` |
| `reduction` | `r.baseline - r.postInvest;` |
| `pct` | `Math.round((reduction / r.baseline) * 100);` |
| `gap` | `benchmark - c.score;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/adaptation-finance/gfma-alignment` | `gfma_alignment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/resilience-delta` | `resilience_delta` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/gari-scoring` | `gari_scoring` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/adaptation-npv` | `adaptation_npv` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/mdb-eligibility` | `mdb_eligibility` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/nap-ndc-alignment` | `nap_ndc_alignment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/full-assessment` | `full_assessment` | api/v1/routes/adaptation_finance.py |
| POST | `/api/v1/adaptation-finance/portfolio-assessment` | `portfolio_assessment` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/gfma-categories` | `ref_gfma_categories` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/mdb-facilities` | `ref_mdb_facilities` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/nap-profiles` | `ref_nap_profiles` | api/v1/routes/adaptation_finance.py |
| GET | `/api/v1/adaptation-finance/ref/hazard-risk-profiles` | `ref_hazard_risk_profiles` | api/v1/routes/adaptation_finance.py |

### 2.3 Engine `adaptation_finance_engine` (services/adaptation_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AdaptationFinanceEngine.assess_gfma_alignment` | project_data | Assess project alignment with the GFMA Adaptation Finance Framework. |
| `AdaptationFinanceEngine.calculate_resilience_delta` | baseline_risk, project_data, rcp_scenario | Quantify climate risk reduction from an adaptation project. |
| `AdaptationFinanceEngine.score_gari` | project_data | Score project against 6 GARI (Global Adaptation & Resilience Investment) |
| `AdaptationFinanceEngine.calculate_adaptation_npv` | project_data, discount_rate, horizon_years | Compute adaptation project NPV, benefit-cost ratio (BCR), SROI, |
| `AdaptationFinanceEngine.assess_mdb_eligibility` | project_data | Assess project eligibility across 8 MDB climate finance facilities. |
| `AdaptationFinanceEngine.assess_nap_ndc_alignment` | project_data, country_code | Assess alignment of project adaptation measures with the country's |
| `AdaptationFinanceEngine.run_full_assessment` | entity_id, project_data | Orchestrate all adaptation finance sub-modules. |
| `AdaptationFinanceEngine.aggregate_portfolio` | entity_id, projects | Aggregate adaptation metrics across a portfolio of projects. |
| `_parse_score` | value | Convert evidence text or numeric score to 0-100 float. |
| `_approx_irr` | investment, net_annual_benefit, n | Approximate IRR using binary search (simplified DCF). |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `an` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `PIE_COLORS`, `PROJECT_CATEGORIES`, `RCP_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Public Adaptation Finance | — | OECD DAC | Far below UNEP estimated need |
| Adaptation Finance Gap | — | UNEP 2024 | Gap between developing country needs and current flows |
- **OECD DAC data** → Adaptation classification → **Public finance flows**
- **MDB reports** → Adaptation fraction → **MDB adaptation finance**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/adaptation-finance/ref/gfma-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_categories', 'categories'], 'n_keys': 4}`

**GET /api/v1/adaptation-finance/ref/hazard-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_hazards', 'hazard_profiles', 'rcp_hazard_projections', 'gari_scoring_criteria', 'discount_rates_by_context'], 'n_keys': 7}`

**GET /api/v1/adaptation-finance/ref/mdb-facilities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_facilities', 'facilities'], 'n_keys': 4}`

**GET /api/v1/adaptation-finance/ref/nap-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'total_countries', 'nap_submitted_count', 'nap_in_progress_count', 'profiles'], 'n_keys': 6}`

**POST /api/v1/adaptation-finance/adaptation-npv** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation finance tracking
**Headline formula:** `Adaptation_finance = Public_bilateral + MDB_adaptation + Private_tracked`
**Standards:** ['OECD DAC', 'UNFCCC Standing Committee on Finance', 'CBI Adaptation Finance']

**Engine `adaptation_finance_engine` — extracted transformation lines:**
```python
matched_rr = sum(measure_reductions.values()) / len(measure_reductions)  # average
horizon_adj = 1.0 - max(0, (horizon - 20) / 100)
effective_rr = matched_rr * horizon_adj
post_investment_risk = max(baseline_risk * (1 - effective_rr), baseline_risk * residual_floor)
resilience_delta = baseline_risk - post_investment_risk
dr_dec = dr / 100.0
pv_benefits = ann_ben * n
pv_costs = inv + ann_om * n
annuity_factor = (1 - (1 + dr_dec) ** -n) / dr_dec
pv_benefits = ann_ben * annuity_factor
pv_costs = inv + ann_om * annuity_factor
npv = round(pv_benefits - pv_costs, 2)
bcr = round(pv_benefits / pv_costs, 2) if pv_costs > 0 else 0.0
sroi = round(pv_benefits / inv, 2) if inv > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).
**Shared engines (edits propagate!):** `adaptation_finance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `api-gateway-monitor` | engine:adaptation_finance_engine, table:an, table:exc |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |