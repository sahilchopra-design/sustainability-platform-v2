# AI Governance Hub
**Module ID:** `ai-governance` · **Route:** `/ai-governance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised governance dashboard for ESG AI models deployed on the platform, covering model risk assessment, algorithmic bias detection, explainability (SHAP), and auditability against EU AI Act and NIST AI RMF standards. Tracks model drift, retraining schedules, and fairness metrics across protected demographic attributes. Supports ISO 42001 AI management system certification readiness.

> **Business value:** Rigorous AI governance is essential as ESG ratings, temperature scores, and controversy detectors increasingly rely on ML models whose decisions affect capital allocation. The hub provides the SHAP-based transparency, fairness metrics, and audit trails required by the EU AI Act and institutional-grade model risk management frameworks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AI_INCIDENTS`, `AI_SYSTEMS`, `Badge`, `DOC_STATUS`, `EU_AI_ARTICLES`, `INCIDENT_SEVERITIES`, `INCIDENT_STATUSES`, `INCIDENT_TYPES`, `KpiCard`, `NIST_SUBCATEGORIES`, `PIE_COLORS`, `PROTECTED_CHARACTERISTICS`, `REGIONS_LIST`, `RISK_TIERS`, `SEV_COLOR`, `SYSTEM_TYPES`, `SYS_PREFIXES`, `SYS_SUFFIXES`, `SYS_VERSIONS`, `SectionH`, `TABS`, `TIER_BG`, `TIER_COLOR`, `VENDORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SYS_VERSIONS` | `['-v1', '-v2', '-v3', '-Pro', '-Plus', '-Lite', '-X', ''];` |
| `seed0` | `i * 17 + 3;` |
| `pfx` | `SYS_PREFIXES[Math.floor(sr(seed0) * SYS_PREFIXES.length)];` |
| `sfx` | `SYS_SUFFIXES[Math.floor(sr(seed0 + 1) * SYS_SUFFIXES.length)];` |
| `ver` | `SYS_VERSIONS[Math.floor(sr(seed0 + 2) * SYS_VERSIONS.length)];` |
| `riskIdx` | `Math.floor(sr(seed0 + 3) * 4);` |
| `euScore` | `Math.round(20 + sr(seed0 + 4) * 75);` |
| `nistScore` | `Math.round(25 + sr(seed0 + 5) * 70);` |
| `biasScore` | `Math.round(10 + sr(seed0 + 6) * 80);` |
| `paramsBn` | `parseFloat((sr(seed0 + 7) * 200).toFixed(1));` |
| `energyMwh` | `Math.round(10 + sr(seed0 + 8) * 2000);` |
| `co2e` | `Math.round(energyMwh * (0.2 + sr(seed0 + 9) * 0.4));` |
| `auditYear` | `2023 + Math.floor(sr(seed0 + 10) * 2);` |
| `auditMon` | `String(1 + Math.floor(sr(seed0 + 11) * 12)).padStart(2, '0');` |
| `auditDay` | `String(1 + Math.floor(sr(seed0 + 12) * 28)).padStart(2, '0');` |
| `INCIDENT_TYPES` | `['Bias/Discrimination', 'Data Breach', 'Model Failure', 'Regulatory Breach', 'Transparency Failure', 'Safety Incident'];` |
| `seed0` | `i * 13 + 7;` |
| `sys` | `AI_SYSTEMS[Math.floor(sr(seed0) * AI_SYSTEMS.length)];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ai-governance/assess` | `assess_ai_system` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/eu-ai-act` | `classify_eu_ai_act` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/nist-rmf` | `score_nist_rmf` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/energy-footprint` | `calculate_energy_footprint` | api/v1/routes/ai_governance.py |
| POST | `/api/v1/ai-governance/portfolio` | `aggregate_ai_portfolio` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/eu-ai-act-tiers` | `get_eu_ai_act_tiers` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/nist-rmf-functions` | `get_nist_rmf_functions` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/oecd-principles` | `get_oecd_principles` | api/v1/routes/ai_governance.py |
| GET | `/api/v1/ai-governance/ref/bias-metrics` | `get_bias_metrics` | api/v1/routes/ai_governance.py |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DOC_STATUS`, `EU_AI_ARTICLES`, `INCIDENT_SEVERITIES`, `INCIDENT_STATUSES`, `INCIDENT_TYPES`, `NIST_SUBCATEGORIES`, `PIE_COLORS`, `PROTECTED_CHARACTERISTICS`, `REGIONS_LIST`, `RISK_TIERS`, `SYSTEM_TYPES`, `SYS_PREFIXES`, `SYS_SUFFIXES`, `SYS_VERSIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Model Explainability Score | `Avg SHAP completeness` | Platform AI audit | Percentage of model output variance explained by top-10 SHAP features |
| Fairness Gap | `max_group(acc) – min_group(acc)` | EU AI Act metric | Accuracy disparity across protected demographic groups; <0.05 is acceptable |
| PSI (Model Drift) | `Population stability index` | Monitor pipeline | PSI >0.2 triggers mandatory model retraining review |
- **Model inference logs** → Compute SHAP values per prediction; aggregate fairness metrics → **Explainability reports and bias flags per model**
- **Feature distribution snapshots** → Calculate PSI against training baseline; trigger retraining alerts at PSI>0.2 → **Drift monitoring dashboard with model health status**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ai-governance/ref/bias-metrics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['protected_characteristics', 'fairness_metrics', 'eu_ai_act_requirements', 'references', 'tools'], 'n_keys': 5}`

**GET /api/v1/ai-governance/ref/eu-ai-act-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'risk_tiers', 'high_risk_categories', 'gpai_thresholds', 'key_dates'], 'n_keys': 5}`

**GET /api/v1/ai-governance/ref/nist-rmf-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'published', 'publisher', 'url', 'functions', 'scoring_guidance', 'maturity_tiers', 'cross_reference'], 'n_keys': 8}`

**GET /api/v1/ai-governance/ref/oecd-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'adopted', 'publisher', 'url', 'principles', 'weighting', 'scoring_guidance', 'cross_reference', 'g20_endorsed', 'signatory_countries'], 'n_keys': 10}`

**POST /api/v1/ai-governance/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['system_id', 'system_name', 'eu_ai_act', 'nist_rmf', 'oecd_principles', 'energy_emissions', 'bias', 'model_card', 'esg_composite', 'summary'], 'n_keys': 10}`

## 5 · Intermediate Transformation Logic
**Methodology:** SHAP-based explainability + fairness scoring
**Headline formula:** `SHAP_i = Σ_{S⊆F\{i}}(|S|!(|F|–|S|−1)!/|F|!) × [f(S∪{i})–f(S)]; FairnessGap = max_group(accuracy) – min_group(accuracy)`
**Standards:** ['EU AI Act (2024)', 'NIST AI RMF 1.0', 'ISO 42001:2023']

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
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `ai_governance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `api-gateway-monitor` | engine:ai_governance_engine, table:EU |
| `critical-minerals` | table:EU |
| `climate-policy` | table:EU |
| `critical-minerals-climate` | table:EU |
| `climate-policy-intelligence` | table:EU |