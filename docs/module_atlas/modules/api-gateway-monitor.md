# API Gateway Monitor
**Module ID:** `api-gateway-monitor` · **Route:** `/api-gateway-monitor` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring dashboard for platform API health, covering request latency, error rates, rate limiting status, and upstream ESG data provider availability. Tracks SLA compliance per endpoint, surfaces degraded providers, and provides historical performance analytics for capacity planning. Integrates with PagerDuty-compatible alerting for P0 outages.

> **Business value:** API gateway monitoring prevents silent data quality degradation where upstream provider outages or quota exhaustion cause stale or missing ESG data to flow into reports without detection. Proactive SLA tracking and circuit breaker visibility ensure data freshness SLAs are met across all downstream disclosure modules.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_CHANGELOG`, `API_DOMAINS`, `CLIENT_USAGE`, `COLORS`, `DEPRECATIONS`, `DOMAIN_GROUPS`, `ENDPOINTS`, `ENDPOINT_PATTERNS`, `GEO_DIST`, `METHODS`, `METHOD_WEIGHTS`, `RATE_LIMIT_HITS`, `STATUS_DIST`, `TABS`, `THROTTLED_LOG`, `TIERS`, `TOP_ENDPOINTS`, `TRAFFIC_24H`, `TRAFFIC_7D`, `WEBHOOK_EVENTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `domainIdx` | `Math.floor(sr(i*3)*API_DOMAINS.length);` |
| `domainSlug` | `domain.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-\|-$/g,'');` |
| `patternIdx` | `Math.floor(sr(i*7)*ENDPOINT_PATTERNS.length);` |
| `subResource` | `['','','/metrics','/config','/batch','/stream','/validate','/export'][Math.floor(sr(i*11)*8)];` |
| `path` | ``/api/v1/${domainSlug}${pattern}${subResource}`;` |
| `avgResp` | `Math.floor(sr(i*17)*800+20);` |
| `errorRate` | `+(sr(i*19)*5).toFixed(2);` |
| `calls24h` | `Math.floor(sr(i*23)*5000+10);` |
| `rateLimit` | `method==='GET'?[100,500,1000][Math.floor(sr(i*31)*3)]:[50,200,500][Math.floor(sr(i*37)*3)];` |
| `lastCalled` | `sr(i*41)>0.1?new Date(2026,2,29,Math.floor(sr(i*43)*24),Math.floor(sr(i*47)*60)).toISOString().replace('T',' ').slice(0,16):'Never';` |
| `TOP_ENDPOINTS` | `[...ENDPOINTS].sort((a,b)=>b.calls24h-a.calls24h).slice(0,20);` |
| `pagedEndpoints` | `useMemo(()=>filteredEndpoints.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filteredEndpoints,page]);` |
| `totalPages` | `Math.ceil(filteredEndpoints.length/PAGE_SIZE);` |
| `domainStats` | `useMemo(()=>API_DOMAINS.map(d=>{` |
| `methodDist` | `useMemo(()=>METHODS.map(m=>({method:m,count:ENDPOINTS.filter(e=>e.method===m).length})),[]);` |
| `healthDist` | `useMemo(()=>['green','amber','red'].map(h=>({status:h,count:ENDPOINTS.filter(e=>e.health===h).length})),[]);` |
| `handleSort` | `(col)=>{if(sortCol===col)setSortDir(d=>-d);else{setSortCol(col);setSortDir(-1);}};` |

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
| POST | `/api/v1/agriculture/calculate` | `calculate_agriculture` | api/v1/routes/agriculture.py |
| GET | `/api/v1/agriculture/reference-data` | `reference_data` | api/v1/routes/agriculture.py |
| GET | `/api/v1/agriculture/assessments` | `list_assessments` | api/v1/routes/agriculture.py |
| GET | `/api/v1/agriculture/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/agriculture.py |
| POST | `/api/v1/agriculture-engine/methane` | `methane_intensity` | api/v1/routes/agriculture_expanded.py |
| POST | `/api/v1/agriculture-engine/disease-outbreak` | `disease_outbreak` | api/v1/routes/agriculture_expanded.py |
| POST | `/api/v1/agriculture-engine/biodiversity-bng` | `biodiversity_bng` | api/v1/routes/agriculture_expanded.py |
| GET | `/api/v1/agriculture-engine/reference-data` | `reference_data` | api/v1/routes/agriculture_expanded.py |
| POST | `/api/v1/ai-governance/assess` | `assess_ai_system` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/eu-ai-act` | `classify_eu_ai_act` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/nist-rmf` | `score_nist_rmf` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/energy-footprint` | `calculate_energy_footprint` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/portfolio` | `aggregate_ai_portfolio` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/eu-ai-act-tiers` | `get_eu_ai_act_tiers` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/nist-rmf-functions` | `get_nist_rmf_functions` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/oecd-principles` | `get_oecd_principles` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/bias-metrics` | `get_bias_metrics` | api/v1/routes/ai_governance.py |

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

### 2.3 Engine `agriculture_risk_calculator` (services/agriculture_risk_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_agriculture_risk` | inp, scenario, horizon_year |  |
| `get_reference_data` |  |  |

### 2.3 Engine `agriculture_risk_engine` (services/agriculture_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_methane_intensity` | inp | Calculate livestock methane emissions (enteric + manure) using IPCC Tier 1 |
| `calculate_disease_outbreak_risk` | inp | Assess disease outbreak risk for livestock operations using OIE/WOAH |
| `_calc_habitat_units` | parcels | Calculate total biodiversity units for a set of habitat parcels. |
| `calculate_biodiversity_net_gain` | inp | Calculate Biodiversity Net Gain using DEFRA Metric 4.0 methodology. |
| `get_agriculture_engine_reference_data` |  | Return all reference data used by the expanded Agriculture Risk Engine. |

### 2.3 Engine `ai_governance_engine` (services/ai_governance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AIGovernanceEngine.assess_ai_system` | system_input | Full AI system ESG governance assessment. |
| `AIGovernanceEngine.classify_eu_ai_act_risk` | system_input | EU AI Act 2024/1689 risk tier classification. |
| `AIGovernanceEngine.score_nist_rmf` | system_input | NIST AI RMF 1.0 (2023) scoring. |
| `AIGovernanceEngine.score_oecd_principles` | system_input | OECD AI Principles 2023 scoring. |
| `AIGovernanceEngine.calculate_ai_energy` | system_input | AI Energy Consumption and Scope 2 Emissions calculation. |
| `AIGovernanceEngine.assess_algorithmic_bias` | bias_input | Algorithmic Bias Assessment across 7 protected characteristics. |
| `AIGovernanceEngine.score_model_card` | system_input | Model Card Completeness assessment (NIST/Google standard — 12 fields). |
| `AIGovernanceEngine.aggregate_ai_portfolio` | portfolio_input | Portfolio-level AI governance assessment. |
| `AIGovernanceEngine._governance_pillar` | eu_score, nist_score | Governance pillar: EU AI Act 50% + NIST RMF 50%. |
| `AIGovernanceEngine._environmental_pillar` | annual_tco2e, system_input | Environmental pillar score (0-100). |
| `AIGovernanceEngine._social_pillar` | bias_severity, card_pct, oecd_score | Social pillar: Bias assessment 40% + Model Card 30% + OECD Social 30%. |
| `AIGovernanceEngine._esg_tier` | score | Map ESG composite score to tier label. |
| `AIGovernanceEngine._bias_recommendations` | severity, adverse_flags | Generate bias remediation recommendations. |
| `AIGovernanceEngine._portfolio_recommendations` | esg_tier, high_risk_systems, total_tco2e | Portfolio-level governance recommendations. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EU` *(shared)*, `__future__` *(shared)*, `agriculture_bng_assessments`, `agriculture_disease_assessments`, `agriculture_entities`, `agriculture_methane_assessments`, `agriculture_risk_assessments`, `an` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `API_CHANGELOG`, `API_DOMAINS`, `COLORS`, `DEPRECATIONS`, `ENDPOINT_PATTERNS`, `GEO_DIST`, `METHODS`, `METHOD_WEIGHTS`, `STATUS_DIST`, `TABS`, `TIERS`, `TOP_ENDPOINTS`, `WEBHOOK_EVENTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| API Availability SLA | `(Uptime / Total) × 100` | Platform monitoring | Target monthly uptime for all critical ESG data API endpoints |
| p95 Latency | `95th percentile response time` | APM tool | Latency threshold below which 95% of API requests should complete |
| Rate Limit Utilisation | `Requests / Quota × 100` | Provider API headers | Percentage of provider API quota consumed in current window |
- **API gateway access logs** → Aggregate request counts, latency, and status codes per endpoint per minute → **Real-time health dashboard and SLA compliance reports**
- **Provider API health endpoints** → Poll availability and quota status; trigger circuit breaker on consecutive failures → **Provider availability status and rate-limit headroom indicators**

## 5 · Intermediate Transformation Logic
**Methodology:** SLA compliance and error rate tracking
**Headline formula:** `Availability = (Uptime_mins / Total_mins) × 100; Error_rate = Error_requests / Total_requests × 100; p95_latency = 95th percentile(response_times)`
**Standards:** ['ITIL v4 Service Management', 'OpenAPI 3.0', 'RFC 7807 Problem Details']

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

**Engine `agriculture_risk_calculator` — extracted transformation lines:**
```python
closest_year = min(temp_deltas.keys(), key=lambda y: abs(y - horizon_year))
yield_change_pct = sensitivity * temp_delta * mitigation_factor * 100.0
yield_at_risk = abs(yield_change_pct / 100.0) * (inp.current_yield_t_ha or 5.0) * inp.total_area_ha
crop_fail_prob = min(0.5, 0.02 + abs_loss * 0.008)
seq_potential     = base_seq * regen_multiplier
total_seq_yr      = seq_potential * inp.total_area_ha
credit_value      = total_seq_yr * 65.0
water_cost_risk = (ws_score / 5.0) * (inp.irrigation_dependency_pct / 100.0) * 100.0
water_rev_impact = water_cost_risk * 0.30 * (1 + (temp_delta - 1.0) * 0.1)
rev_at_risk_pct = min(80.0, max(0.0, abs(yield_change_pct) * 0.6 + water_rev_impact * 0.4))
rev_at_risk_eur = inp.annual_revenue_eur * rev_at_risk_pct / 100.0
adapt_capex = inp.total_area_ha * 350.0  # EUR 350/ha baseline
yield_sensitivity_pct_per_c       = round(sensitivity * 100, 2),
```

**Engine `agriculture_risk_engine` — extracted transformation lines:**
```python
enteric_total = enteric_ef * inp.herd_size / 1000.0  # tonnes CH4/yr
manure_total = manure_ef * inp.herd_size / 1000.0
total_ch4 = enteric_total + manure_total
total_co2e = total_ch4 * _CH4_GWP_100
intensity_kg = (enteric_ef + manure_ef)
intensity_tco2e = intensity_kg * _CH4_GWP_100 / 1000.0
sector_avg = base_enteric + base_manure
intensity_vs_sector = ((intensity_kg / sector_avg) - 1.0) * 100 if sector_avg > 0 else 0
climate_adj = 1.0 + max(0, inp.climate_warming_c - 1.0) * 0.15
total_if_outbreak = mortality_loss + cull_loss + trade_loss
expected_loss = adj_prob * total_if_outbreak
insured_amount = inp.herd_value_eur * (inp.insurance_coverage_pct / 100.0)
insurance_gap = max(0, worst_case - insured_amount)
risk_score = min(100, combined_prob * 100 * 2 + (100 - biosec_score) * 0.3)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **95** other module(s).
**Shared engines (edits propagate!):** `adaptation_finance_engine` (used by 2 modules), `ai_governance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-map` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-labor-climate` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-esg-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |