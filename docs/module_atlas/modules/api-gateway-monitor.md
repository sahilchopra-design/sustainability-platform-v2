# API Gateway Monitor
**Module ID:** `api-gateway-monitor` · **Route:** `/api-gateway-monitor` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time monitoring dashboard for platform API health, covering request latency, error rates, rate limiting status, and upstream ESG data provider availability. Tracks SLA compliance per endpoint, surfaces degraded providers, and provides historical performance analytics for capacity planning. Integrates with PagerDuty-compatible alerting for P0 outages.

> **Business value:** API gateway monitoring prevents silent data quality degradation where upstream provider outages or quota exhaustion cause stale or missing ESG data to flow into reports without detection. Proactive SLA tracking and circuit breaker visibility ensure data freshness SLAs are met across all downstream disclosure modules.

**How an analyst works this module:**
- Dashboard shows real-time traffic for all API endpoints
- Latency Distribution tab plots p50/p95/p99 response time histograms
- Error Analysis tab breaks down 4xx/5xx errors by endpoint and provider
- Rate Limiting tab tracks quota consumption with auto-throttle status
- SLA Report tab generates monthly availability and latency compliance report
- Alert Configuration maps P0/P1/P2 thresholds to notification channels

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_CHANGELOG`, `API_DOMAINS`, `CLIENT_USAGE`, `COLORS`, `DEPRECATIONS`, `DOMAIN_GROUPS`, `ENDPOINTS`, `ENDPOINT_PATTERNS`, `GEO_DIST`, `METHODS`, `METHOD_WEIGHTS`, `RATE_LIMIT_HITS`, `STATUS_DIST`, `TABS`, `THROTTLED_LOG`, `TIERS`, `TOP_ENDPOINTS`, `TRAFFIC_24H`, `TRAFFIC_7D`, `WEBHOOK_EVENTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STATUS_DIST` | 7 | `code`, `count`, `color` |
| `GEO_DIST` | 7 | `region`, `pct`, `requests` |
| `TIERS` | 5 | `name`, `reqPerMin`, `reqPerDay`, `burst`, `clients`, `color` |
| `API_CHANGELOG` | 6 | `version`, `date`, `changes` |
| `DEPRECATIONS` | 5 | `endpoint`, `replacement`, `deadline`, `usage` |

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
| `AdaptationFinanceEngine.assess_gfma_alignment` | project_data | Assess project alignment with the GFMA Adaptation Finance Framework. Args: project_data: primary_sector (maps to GFMA category), project_description, co_benefits (list), country_code. Returns: dict with gfma_category, subcategory, alignment_score, co_benefit_mapping, bcr_range, taxonomy_reference. |
| `AdaptationFinanceEngine.calculate_resilience_delta` | baseline_risk, project_data, rcp_scenario | Quantify climate risk reduction from an adaptation project. Args: baseline_risk: current annual average loss or risk score (0-100 or USD M). project_data: hazard_type, adaptation_measure, time_horizon_years. rcp_scenario: '1.5C', '2C', '3C', '4C'. Returns: dict with risk_reduction_pct, post_investment_risk, resilience_delta, residual_risk, maladaptation_risk, rcp_hazard_multiplier. |
| `AdaptationFinanceEngine.score_gari` | project_data | Score project against 6 GARI (Global Adaptation & Resilience Investment) criteria. Args: project_data: additionality_evidence, effectiveness_data, sustainability_plan, scalability_potential, co_benefits_data, governance_structure (each: 0-100 self-assessment score or text). Returns: dict with criterion_scores, composite_gari_score, gari_tier, actionable_gaps. |
| `AdaptationFinanceEngine.calculate_adaptation_npv` | project_data, discount_rate, horizon_years | Compute adaptation project NPV, benefit-cost ratio (BCR), SROI, and human-welfare metrics. Args: project_data: total_investment_m, annual_benefits_m, annual_om_m, beneficiaries_count, discount_rate (%), horizon_years. Returns: dict with npv_m, bcr, sroi, cost_per_beneficiary, lives_protected, payback_years, irr_approx. |
| `AdaptationFinanceEngine.assess_mdb_eligibility` | project_data | Assess project eligibility across 8 MDB climate finance facilities. Args: project_data: country_code, sector, total_investment_m, public_component_m, adaptation_category, gfma_aligned. Returns: dict with eligible_facilities, gcf_gcef_eligibility, estimated_finance_mix. |
| `AdaptationFinanceEngine.assess_nap_ndc_alignment` | project_data, country_code | Assess alignment of project adaptation measures with the country's National Adaptation Plan (NAP) and NDC adaptation component. Args: project_data: adaptation_measures (list), sectors (list). country_code: ISO 3166-1 alpha-2. Returns: dict with nap_priority_match, ndc_adaptation_alignment, country_adaptation_ambition_score, alignment_gap. |
| `AdaptationFinanceEngine.run_full_assessment` | entity_id, project_data | Orchestrate all adaptation finance sub-modules. Composite adaptation_score: GFMA alignment 20% GARI scoring 30% NPV/BCR 25% MDB eligibility 15% NAP/NDC 10% bankability_tier: ≥75 → Highly Bankable ≥55 → Bankable ≥35 → Conditionally Bankable <35 → Pre-Bankable |
| `AdaptationFinanceEngine.aggregate_portfolio` | entity_id, projects | Aggregate adaptation metrics across a portfolio of projects. Args: entity_id: portfolio owner identifier. projects: list of project_data dicts. Returns: dict with portfolio-level weighted scores, total investment, sector diversification, bankability distribution. |
| `_parse_score` | value | Convert evidence text or numeric score to 0-100 float. |
| `_approx_irr` | investment, net_annual_benefit, n | Approximate IRR using binary search (simplified DCF). Returns IRR as a decimal (e.g. 0.15 for 15%). |

### 2.3 Engine `agriculture_risk_calculator` (services/agriculture_risk_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_agriculture_risk` | inp, scenario, horizon_year |  |
| `get_reference_data` |  |  |

### 2.3 Engine `agriculture_risk_engine` (services/agriculture_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_methane_intensity` | inp | Calculate livestock methane emissions (enteric + manure) using IPCC Tier 1 defaults and identify applicable abatement options with costs. |
| `calculate_disease_outbreak_risk` | inp | Assess disease outbreak risk for livestock operations using OIE/WOAH disease profiles, biosecurity scoring, and climate-adjusted probabilities. |
| `_calc_habitat_units` | parcels | Calculate total biodiversity units for a set of habitat parcels. |
| `calculate_biodiversity_net_gain` | inp | Calculate Biodiversity Net Gain using DEFRA Metric 4.0 methodology. Compares baseline vs proposed habitat units and identifies credit requirements. |
| `get_agriculture_engine_reference_data` |  | Return all reference data used by the expanded Agriculture Risk Engine. |

**Engine `agriculture_risk_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_CH4_GWP_100` | `27.9` |
| `_BNG_CREDIT_PRICE_GBP` | `42000.0` |
| `_MANDATORY_NET_GAIN_PCT` | `10.0` |

### 2.3 Engine `ai_governance_engine` (services/ai_governance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `AIGovernanceEngine.assess_ai_system` | system_input | Full AI system ESG governance assessment. Integrates EU AI Act risk classification, NIST RMF scoring, OECD Principles scoring, energy/emissions calculation, model card completeness, and ESG composite scoring. |
| `AIGovernanceEngine.classify_eu_ai_act_risk` | system_input | EU AI Act 2024/1689 risk tier classification. Determines risk tier (unacceptable/high_risk/limited_risk/minimal_risk) based on AI category and derives compliance requirements and score. Art 5: Prohibited practices → unacceptable Annex III + Art 6: High-risk systems → mandatory requirements Art 50: Limited risk → transparency obligations only Remainder: Minimal risk → no mandatory obligations |
| `AIGovernanceEngine.score_nist_rmf` | system_input | NIST AI RMF 1.0 (2023) scoring. Scores the AI system against 4 functions (Govern/Map/Measure/Manage), 19 sub-categories. Scores: 1 = fully met, 0.5 = partially met, 0 = not met. Returns overall score (0-100), tier, and per-function breakdown. |
| `AIGovernanceEngine.score_oecd_principles` | system_input | OECD AI Principles 2023 scoring. Scores across 5 principles (inclusive_growth, human_centred, transparency, robustness, accountability), each weighted 20%. Sub-indicator scores: 1 = met, 0.5 = partial, 0 = not met. |
| `AIGovernanceEngine.calculate_ai_energy` | system_input | AI Energy Consumption and Scope 2 Emissions calculation. Training energy by model parameter scale (one-time, amortised to reporting year). Inference energy: daily_queries × energy_per_query × 365. Annual Scope 2 = (training + inference) × grid carbon factor. |
| `AIGovernanceEngine.assess_algorithmic_bias` | bias_input | Algorithmic Bias Assessment across 7 protected characteristics. Metrics: - Disparate Impact Ratio (DIR) = minority_positive_rate / majority_positive_rate Adverse if DIR < 0.80 (4/5 Rule, US EEOC / EU non-discrimination case law) - Statistical Parity Difference (SPD) = P(Y=1/group=1) - P(Y=1/group=0) Adverse if SPD < -0.10 - Equalized Odds — whether TPR and FPR are equal across groups Bias severity |
| `AIGovernanceEngine.score_model_card` | system_input | Model Card Completeness assessment (NIST/Google standard — 12 fields). Checks which of the 12 required model card fields are present. Returns completeness % and list of missing fields, flagging blocking fields (those required for EU AI Act Art 11/13 compliance). |
| `AIGovernanceEngine.aggregate_ai_portfolio` | portfolio_input | Portfolio-level AI governance assessment. Aggregates ESG scores, energy footprints, EU AI Act risk distributions, and bias flags across all AI systems in the portfolio. Returns portfolio averages, highest-risk systems, and organisational recommendations. |
| `AIGovernanceEngine._governance_pillar` | eu_score, nist_score | Governance pillar: EU AI Act 50% + NIST RMF 50%. |
| `AIGovernanceEngine._environmental_pillar` | annual_tco2e, system_input | Environmental pillar score (0-100). Lower emissions → higher score. Benchmarked against a typical enterprise software workload (~10 tCO2e/yr for large deployments). Rewards low-emission grids and small model sizes. |
| `AIGovernanceEngine._social_pillar` | bias_severity, card_pct, oecd_score | Social pillar: Bias assessment 40% + Model Card 30% + OECD Social 30%. Bias maps: critical=0, high=30, medium=60, low=90. |
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

API health scoring combines availability, error rate, and p95 latency against SLA thresholds. Rate limit utilisation tracks requests against provider quotas to prevent throttling. Circuit breaker pattern implementation is monitored to ensure degraded upstream providers do not cascade failures.

**Standards:** ['ITIL v4 Service Management', 'OpenAPI 3.0', 'RFC 7807 Problem Details']
**Reference documents:** ITIL v4 Service Management Framework; OpenAPI Specification 3.0; RFC 7807 Problem Details for HTTP APIs

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
total_lifecycle_cost_m = inv + ann_om * n
cost_per_beneficiary = round(total_lifecycle_cost_m * 1_000_000 / beneficiaries, 2)
lives_protected = int(pv_benefits * 1_000_000 / 50_000)
net_annual_benefit = ann_ben - ann_om
payback_years = round(inv / net_annual_benefit, 1) if net_annual_benefit > 0 else 999
irr_approx = _approx_irr(inv, ann_ben - ann_om, n)
nap_match_score = round(len(matched_sectors) / max(len(priority_sectors), 1) * 100, 1)
npv_raw_score = min(100, max(0, bcr * 40))   # BCR 2.5 → 100
npv_contrib = npv_raw_score * 0.25
mdb_contrib = mdb_score * 0.15
nap_contrib = nap_score * 0.10
mid = (low + high) / 2
pv = net_annual_benefit * n
pv = net_annual_benefit * (1 - (1 + mid) ** -n) / mid
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
units = base_linear * p.length_km * cond * sig
units = base * p.area_ha * cond * sig
net_change = proposed_units - baseline_units
net_gain_pct = (net_change / baseline_units * 100) if baseline_units > 0 else 0.0
required_gain_units = baseline_units * (inp.mandatory_gain_pct / 100.0)
shortfall = max(0, required_gain_units - net_change)
credit_cost_gbp = shortfall * _BNG_CREDIT_PRICE_GBP
credit_cost_eur = credit_cost_gbp * 1.17  # approximate GBP→EUR
```

**Engine `ai_governance_engine` — extracted transformation lines:**
```python
esg_composite = 0.35 * gov_score + 0.30 * env_score + 0.35 * soc_score
compliance_score = base_score + (met / total) * 50.0
compliance_score = base_score if has_intended_use else base_score - 15.0
func_score_pct = (func_met / func_total) * 100 if func_total > 0 else 0.0
p_score = (sub_met / sub_total) * 100 if sub_total > 0 else 0.0
daily_queries = system_input.daily_queries or 10_000  # default: 10K queries/day
inference_annual_kwh = daily_queries * energy_per_query_wh * 365 / 1_000
inference_annual_mwh = inference_annual_kwh / 1_000
total_annual_mwh = training_mwh + inference_annual_mwh
annual_tco2e = total_annual_mwh * 1_000 * grid_carbon / 1_000_000
benchmark_tco2e = total_annual_mwh * 1_000 * 475.0 / 1_000_000
renewable_target_mwh = total_annual_mwh  # 1:1 renewable match (market-based)
completeness_pct = (met / total) * 100 if total > 0 else 0.0
avg_esg = sum(esg_scores) / total_systems
avg_nist = sum(nist_scores) / total_systems
score = 100 - (annual_tco2e / 100.0) * 100.0
score = min(100, score + 10)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **87** other module(s).
**Shared engines (edits propagate!):** `adaptation_finance_engine` (used by 2 modules), `ai_governance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `adaptation-finance` | engine:adaptation_finance_engine, table:an, table:exc |
| `ai-governance` | engine:ai_governance_engine, table:EU |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes *real-time* gateway
> monitoring — live access-log aggregation, provider polling, circuit breakers, PagerDuty
> alerting, monthly SLA reports. **The page performs no monitoring.** It never calls the platform
> backend (whose real FastAPI routes it nominally represents); every endpoint, latency, error
> rate, client, throttle event and traffic curve is generated client-side by the seeded PRNG at
> module load. It is a *design mock of an API operations console* — a plausible registry of 2,302
> synthetic endpoints across 52 real platform domains. The sections below document the mock as
> coded.

### 7.1 What the module computes

The centrepiece is a generated **endpoint registry**:

```js
ENDPOINTS = Array.from({length: 2302}, (_, i) => {
  domain  = API_DOMAINS[floor(sr(i·3)·52)]           // 52 real platform domain names
  path    = `/api/v1/${slug(domain)}${PATTERN[floor(sr(i·7)·24)]}${SUB[floor(sr(i·11)·8)]}`
  method  = sr(i·13) < 0.5 ? GET : < 0.8 ? POST : < 0.92 ? PUT : DELETE
  avgResp = floor(sr(i·17)·800 + 20)                 // 20–820 ms
  errorRate = sr(i·19)·5                             // 0–5 %
  calls24h  = floor(sr(i·23)·5000 + 10)
  p50 = 0.6·avgResp;  p95 = 1.8·avgResp;  p99 = 3.2·avgResp
  successRate = 100 − errorRate
  health = errorRate > 3 ? 'red' : > 1 ? 'amber' : 'green'
})
```

with `sr(s) = frac(sin(s+1)×10⁴)`. Paths are assembled from 24 REST verb patterns
(`/list`, `/detail/{id}`, `/calculate`, `/simulate` …) and 8 sub-resources, so the registry *looks*
like the platform's actual API surface (the assignment's `route_files` such as
`api/v1/routes/adaptation_finance.py` are real, but never queried). Supporting seeds: 24-hour and
7-day traffic series, an HTTP status distribution (200/201/400/401/404/500), a hardcoded
geographic split (NA 42 %, EU 31 % …), 4 rate-limit tiers, a 40-row throttle log, 20 named API
clients with quota usage, a 5-version changelog, 4 deprecation notices and 10 webhook event types.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Method mix | GET 50 % / POST 30 % / PUT 12 % / DELETE 8 % | Hardcoded cutpoints on `sr(i·13)` |
| Latency percentile ratios | p50 = 0.6×, p95 = 1.8×, p99 = 3.2× mean | Fixed multipliers — a stylised right-skewed latency shape, not measured percentiles |
| Health rubric | error > 3 % red · > 1 % amber · else green | Demo thresholds |
| Rate limits | GET ∈ {100, 500, 1000}/min; mutating ∈ {50, 200, 500}/min | Random pick per endpoint |
| Client tiers | Basic 100/min · Professional 500/min · Enterprise 2000/min · Unlimited | Hardcoded tier table with burst = 1.5× |
| Deprecation probability | `sr(i·59) > 0.95` (~5 % of endpoints) | Random flag |
| Cacheable | GET and `sr(i·53) > 0.4` (~60 % of GETs) | Random flag |
| Geo distribution | NA 42/EU 31/APAC 15/LatAm 7/MEA 3/Other 2 % | Hardcoded literals |

### 7.3 Calculation walkthrough

1. **Endpoint Registry tab** — the 2,302 rows, filterable by domain/method/health and searchable
   by path; sortable columns; `TOP_ENDPOINTS` pre-sorts by `calls24h` (spread-before-sort).
   `domainStats` aggregates per-domain endpoint count, total calls, mean latency and error rate.
2. **Traffic Dashboard** — hourly requests/errors/latency (`TRAFFIC_24H`), weekly totals
   (`TRAFFIC_7D`), status-code distribution pie, method and health distributions, geo table.
3. **Rate Limiting & Throttling** — tier cards, the throttle log (client, tier, endpoint, Rate vs
   Burst limit type, blocked count), hourly rate-limit-hit bars per tier, and the 20-client usage
   table (`quotaUsed = 10–90 %`).
4. **API Documentation** — changelog, deprecation table (usage counts random), webhook event
   catalogue and auth notes.

There are no derived analytics beyond sums/means over the seeds — no SLA availability
computation, no p95 estimation from samples, no quota-vs-limit reconciliation (a client's
`reqToday` is drawn independently of its tier's `reqPerDay`).

### 7.4 Worked example (endpoint i = 1)

| Step | Computation | Result |
|---|---|---|
| Domain | `floor(sr(3)·52)` = floor(0.2073·52) = 10 | **Quantitative ESG** |
| Pattern | `floor(sr(7)·24)` = floor(0.9894·24) = 23 | `/config` |
| Sub-resource | `floor(sr(11)·8)` = floor(0.4634·8) = 3 | `/config` |
| Path | — | `/api/v1/quantitative-esg/config/config` |
| Method | `sr(13) = 0.9563` ≥ 0.92 | **DELETE** |
| avgResp | `floor(sr(17)·800 + 20)` = floor(0.2510·800 + 20) | **220 ms** (p95 = 396, p99 = 704) |
| errorRate | `sr(19)·5` = 0.9129·5 | **4.56 %** → health **red**, successRate 95.44 % |

(The doubled `/config/config` path illustrates that pattern and sub-resource draws can collide —
a cosmetic generation artefact visible in the registry.)

### 7.5 Data provenance & limitations

- **Everything is synthetic**: the page imports nothing from the backend and issues no fetches.
  The 52 domain names are the only reality anchor — they mirror the platform's actual API domain
  taxonomy, and the endpoint count (2,302) is of the same order as the platform's real route
  surface, but no individual row corresponds to a real route.
- Latency percentiles are fixed multiples of the mean; real percentile ratios vary by endpoint
  and load. Success rate is defined as `100 − errorRate`, conflating 4xx and 5xx.
- Rate-limit analytics don't close the loop (throttle log, hit counts and client quotas are
  independent draws), so no capacity conclusion can be drawn.
- A production version would ingest gateway access logs (or FastAPI middleware metrics), compute
  true availability `uptime/total`, sample-based p50/p95/p99, and alert on SLO burn rates.

### 7.6 Framework alignment

- **SLA/SLO practice (ITIL v4 / SRE)** — the guide's `Availability = uptime/total` and p95-based
  SLOs are the industry-standard formulations; the mock displays the vocabulary (tiers, quotas,
  retry-after headers in the changelog) without the measurements.
- **OpenAPI 3.0** — the registry's method/path/payload structure mirrors an OpenAPI catalogue;
  no spec document is generated or parsed.
- **RFC 7807 (Problem Details)** — cited in the guide; the changelog's "Improved error messages
  for 422 responses" nods to it, but response bodies are not modelled.
- **Rate limiting patterns** — tiered per-minute limits with burst allowances follow common API
  gateway design (token bucket semantics implied by "Rate" vs "Burst" limit-hit types).

## 9 · Future Evolution

### 9.1 Evolution A — Real gateway telemetry from FastAPI middleware (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, this page performs **no monitoring**: it never calls the
backend it nominally represents, and every one of its 2,302 synthetic endpoints, latencies, error
rates, throttle events and traffic curves is a seeded PRNG draw at load (§7.5). It is a design mock
over 52 real platform domain names, with fixed latency-percentile multipliers (p50=0.6×, p95=1.8×,
p99=3.2× mean) rather than measured percentiles, and rate-limit analytics that don't close the loop
(throttle log, hit counts and client quotas are independent draws). Evolution A wires it to real
telemetry: the platform's AuditMiddleware (always on, §platform rules) already sees every request —
Evolution A aggregates those access logs into true per-endpoint request counts, sampled p50/p95/p99
latency, real 4xx/5xx breakdowns, and genuine availability `uptime/total`, over the platform's
*actual* route surface rather than a generated registry.

**How.** Materialized views (roadmap D4) over the 18 `audit_*` tables computing per-endpoint
minute-bucketed metrics; `GET /api/v1/gateway/health` and `/sla-report` serving real SLA compliance
against configured thresholds; the endpoint registry populated from the FastAPI OpenAPI spec (which
the Atlas builder already introspects) so every row maps to a real route. Rung 3: SLO burn-rate
alerting (the PagerDuty-compatible P0/P1/P2 the guide describes) computed from real error budgets,
with circuit-breaker state surfaced from actual upstream-provider health polling.

**Prerequisites (hard).** Purge the seeded endpoint/traffic/throttle generators per the
no-fabricated-random guardrail; note the §2.2 endpoint table here is polluted with other domains'
routes (adaptation-finance, ai-governance) because the module shares their engines — the real
gateway surface must be enumerated from OpenAPI, not this list. **Acceptance:** the dashboard shows
real request counts and sampled p95 from audit logs; availability is computed `uptime/total`, not
`100 − errorRate`; an induced 500 on a real endpoint appears in the error breakdown.

### 9.2 Evolution B — Ops copilot over live gateway health (LLM tier 2)

**What.** A copilot for platform operators answering "which endpoints are breaching their latency
SLO?", "what's driving the 5xx spike on the physical-risk domain?", and "which clients are near
their rate-limit quota?" — tool-calling Evolution A's health/SLA endpoints and narrating real
telemetry instead of the mock's seeded curves. It turns the console into a queryable operations
assistant grounded in audit-log truth.

**How.** Tool schemas over the gateway health, SLA-report and rate-limit endpoints; the
no-fabrication validator checks every latency, error-rate and quota figure against tool output.
Read-only queries auto-execute; any mutating action (adjust a rate-limit tier, silence an alert)
renders a confirmation. Because this module's blast radius is 87 modules (it shares
`adaptation_finance_engine` and `ai_governance_engine`), the copilot can cross-reference which
downstream disclosure modules a degraded endpoint feeds — the data-freshness contagion the guide's
business case describes.

**Prerequisites.** Evolution A (real telemetry — today there is nothing to query); Atlas corpus
embedded (roadmap D3); operator-only RBAC on the copilot route. **Acceptance:** every figure in an
answer traces to a health/SLA tool output; "what feeds off this endpoint?" resolves via the real
interconnection graph; an SLO-breach question returns endpoints ranked by actual error-budget burn.