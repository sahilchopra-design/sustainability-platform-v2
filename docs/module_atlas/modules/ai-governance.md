# AI Governance Hub
**Module ID:** `ai-governance` · **Route:** `/ai-governance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised governance dashboard for ESG AI models deployed on the platform, covering model risk assessment, algorithmic bias detection, explainability (SHAP), and auditability against EU AI Act and NIST AI RMF standards. Tracks model drift, retraining schedules, and fairness metrics across protected demographic attributes. Supports ISO 42001 AI management system certification readiness.

> **Business value:** Rigorous AI governance is essential as ESG ratings, temperature scores, and controversy detectors increasingly rely on ML models whose decisions affect capital allocation. The hub provides the SHAP-based transparency, fairness metrics, and audit trails required by the EU AI Act and institutional-grade model risk management frameworks.

**How an analyst works this module:**
- Model Registry lists all deployed ESG AI models with risk tier classification
- Explainability tab shows SHAP waterfall and beeswarm charts per model
- Bias Detection tab computes fairness gap across protected attributes
- Drift Monitoring shows PSI trends with retraining alerts
- EU AI Act Compliance tab maps each model to high-risk categories
- Audit Export generates model card for ISO 42001 evidence pack

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AI_GOV_API`, `AI_INCIDENTS`, `AI_SYSTEMS`, `ALL_CARD_FIELDS`, `API`, `API_TIER_TO_LABEL`, `BIAS_SEVERITY_TO_SCORE`, `Badge`, `DOC_STATUS`, `EU_AI_ARTICLES`, `INCIDENT_SEVERITIES`, `INCIDENT_STATUSES`, `INCIDENT_TYPES`, `KpiCard`, `NIST_ALL_CATEGORY_IDS`, `NIST_SUBCATEGORIES`, `OECD_ALL_SUBINDICATOR_IDS`, `PIE_COLORS`, `PROTECTED_CHARACTERISTICS`, `REGIONS_LIST`, `REGION_GRID_CARBON`, `RISK_TIERS`, `SEV_COLOR`, `SYSTEM_TYPES`, `SYS_PREFIXES`, `SYS_SUFFIXES`, `SYS_VERSIONS`, `SectionH`, `TABS`, `TIER_BG`, `TIER_COLOR`, `TYPE_TO_AI_ACT_CATEGORY`, `VENDORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EU_AI_ARTICLES` | 16 | `title`, `desc` |
| `NIST_SUBCATEGORIES` | 17 | `sub`, `name` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `AI_GOV_API` | ``${API}/api/v1/ai-governance`;` |
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
| `sys` | `AI_SYSTEMS[Math.floor(sr(seed0) * AI_SYSTEMS.length)];` |
| `PROTECTED_CHARACTERISTICS` | `['Gender', 'Race/Ethnicity', 'Age', 'Disability', 'Religion', 'Nationality', 'Sexual Orientation', 'Marital Status', 'Pregnancy/Maternity', 'Socioeconomic Status', 'Language', 'Political Belief'];` |
| `NIST_ALL_CATEGORY_IDS` | `['GV-1', 'GV-2', 'GV-3', 'GV-4', 'GV-5', 'GV-6', 'MP-1', 'MP-2', 'MP-3', 'MP-4', 'MP-5', 'MS-1', 'MS-2', 'MS-3', 'MS-4', 'MG-1', 'MG-2', 'MG-3', 'MG-4'];` |
| `boosted` | `s.humanOversight ? Math.min(1, base + 0.5) : base;` |
| `byId` | `new Map(portfolioLive.system_results.map(r => [r.system_id, r]));` |
| `live` | `byId.get(`SYS-${s.id}`);` |
| `metric_values` | `Object.fromEntries(BIAS_API_CHARACTERISTICS.map(c => [c, {` |
| `avgCompliance` | `enrichedSystems.length ? Math.round(enrichedSystems.reduce((a, s) => a + s.compliancePct, 0) / enrichedSystems.length) : 0;` |
| `totalEnergy` | `enrichedSystems.reduce((a, s) => a + s.energyMwhYr, 0);` |
| `totalCo2e` | `enrichedSystems.reduce((a, s) => a + s.co2eTyr, 0);` |
| `euByType` | `useMemo(() => SYSTEM_TYPES.map(type => {` |
| `tierDist` | `useMemo(() => RISK_TIERS.map(t => ({` |
| `euArticleStatus` | `useMemo(() => EU_AI_ARTICLES.map((art, i) => {` |
| `threshold` | `30 + i * 4;` |
| `status` | `score > threshold + 20 ? 'Met' : score > threshold ? 'Partial' : 'Not Met';` |
| `fineExposure` | `useMemo(() => { // Prefer the engine's real Art 9-49 requirements accounting when live;` |
| `notMetCount` | `euLive ? Math.max(0, euLive.requirements_total - euLive.requirements_met) : euArticleStatus.filter(a => a.status === 'Not Met').length;` |
| `maxFineM` | `Math.max(30, revenueM * 0.06);` |
| `exposure` | `Math.round(maxFineM * (totalReq > 0 ? notMetCount / totalReq : 0));` |
| `nistRadarData` | `useMemo(() => [ { subject: 'Govern', score: Math.round(20 + sr(nistSys.id * 7) * 70), target: 80 }, { subject: 'Map', score: Math.round(20 + sr(nistSys.id * 7 + 1) * 70), target: 80 }, { subject: 'Measure', score: Math.round(20 + sr(nistSys.id * 7 + 2) * 70), target: 80 }, { subject: 'Manage', score: Math.round(20 + sr(nistSys.id * 7 + 3)` |
| `nistTop20` | `useMemo(() => [...enrichedSystems].sort((a, b) => b.nistScore - a.nistScore).slice(0, 20).map(s => ({ name: s.name.substring(0, 10), score: s.nistScore })), [enrichedSystems]);` |
| `avg` | `Math.round(enrichedSystems.reduce((a, s) => a + Math.round(20 + sr(s.id * 7 + fi) * 70), 0) / Math.max(1, enrichedSystems.length));` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALL_CARD_FIELDS`, `BIAS_API_CHARACTERISTICS`, `DOC_STATUS`, `EU_AI_ARTICLES`, `INCIDENT_SEVERITIES`, `INCIDENT_STATUSES`, `INCIDENT_TYPES`, `NIST_ALL_CATEGORY_IDS`, `NIST_SUBCATEGORIES`, `OECD_ALL_SUBINDICATOR_IDS`, `PIE_COLORS`, `PROTECTED_CHARACTERISTICS`, `REGIONS_LIST`, `RISK_TIERS`, `SYSTEM_TYPES`, `SYS_PREFIXES`, `SYS_SUFFIXES`, `SYS_VERSIONS`, `TABS`, `VENDORS`

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

**POST /api/v1/ai-governance/bias-assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['system_id', 'characteristics_assessed', 'characteristic_results', 'adverse_impact_flags', 'overall_bias_severity', 'sample_size', 'assessment_date', 'methodology', 'recommendations'], 'n_keys': 9}`

**POST /api/v1/ai-governance/energy-footprint** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['system_id', 'parameter_scale', 'model_profile', 'training_energy_mwh', 'inference_daily_queries', 'inference_energy_per_query_wh', 'inference_annual_energy_mwh', 'total_annual_energy_mwh', 'deployment_grid_carbon_gco2_kwh', 'annual_scope2_tco2e', 'benchmark_scope2_tco2e_`

**POST /api/v1/ai-governance/eu-ai-act** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SHAP-based explainability + fairness scoring
**Headline formula:** `SHAP_i = Σ_{S⊆F\{i}}(|S|!(|F|–|S|−1)!/|F|!) × [f(S∪{i})–f(S)]; FairnessGap = max_group(accuracy) – min_group(accuracy)`

SHAP (SHapley Additive exPlanations) decomposes model output into additive contributions per feature, enabling regulators and investors to understand AI decision rationale. Fairness gap measures disparate impact across demographic groups. Model drift is detected via population stability index (PSI) on input feature distributions.

**Standards:** ['EU AI Act (2024)', 'NIST AI RMF 1.0', 'ISO 42001:2023']
**Reference documents:** EU AI Act Annex III High-Risk Systems (2024); NIST AI RMF 1.0 (2023); ISO 42001:2023 AI Management Systems; SHAP: Lundberg & Lee (2017)

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
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `ai_governance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `api-gateway-monitor` | engine:ai_governance_engine, table:EU |
| `critical-minerals` | table:EU |
| `critical-minerals-climate` | table:EU |
| `climate-policy` | table:EU |
| `climate-policy-intelligence` | table:EU |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide headlines **SHAP-based explainability**
> (`SHAP_i = Σ ...·[f(S∪{i}) − f(S)]`) and a fairness gap `max_group(acc) − min_group(acc)`.
> **SHAP is not implemented anywhere** (neither the `ai_governance_engine.py` backend nor the
> page); the fairness logic is implemented differently — as a **disparate-impact-ratio (DIR)**
> bias assessment, not an accuracy-gap. Also note the React page is **disconnected from the
> backend**: it renders fully seeded synthetic AI systems and makes zero API calls, while the
> real methodology lives in the engine (exposed via `/api/v1/ai-governance/*`). Sections below
> document the engine (the substantive methodology) and flag the page.

### 7.1 What the module computes (backend engine, E77)

`AIGovernanceEngine.assess_ai_system` produces a per-system governance result combining four
scored frameworks, an energy footprint and a bias severity into an ESG composite:

```
ESG_composite = 0.35·Governance + 0.30·Environmental + 0.35·Social
Governance  = 0.50·EU_AI_Act_score + 0.50·NIST_RMF_score
Environmental = 100 − (annual_tCO2e/100)·100   (clamped 0–100; +10 if grid < 100 gCO₂/kWh)
Social      = 0.40·bias_score + 0.30·model_card_pct + 0.30·OECD_score
ESG tier    = leading ≥75 · advanced ≥55 · developing ≥35 · else initial
```

### 7.2 Parameterisation / scoring rubric

**EU AI Act tiering (`classify_eu_ai_act_risk`):** category → tier → base score —
social scoring → *unacceptable* (base 0, "must not be deployed"); any Annex III high-risk
category → *high_risk* (base 50); GPAI → high_risk (base 55); out-of-scope → *minimal* (90);
else *limited_risk* (75). For high-risk systems, `compliance_score = base + (met/total)·50`
over the 10 Art. 9–49 obligations, each met/unmet via a model-card provision map. 12 high-risk
categories carry real Annex III references (biometric ID, critical infrastructure, employment,
essential services incl. credit scoring, law enforcement, medical devices, GPAI-systemic
>10²⁵ FLOPs).

**NIST AI RMF (`score_nist_rmf`):** 4 functions (Govern/Map/Measure/Manage) each weighted 0.25;
`overall = Σ function_pct × 0.25`; tier advanced ≥80 / … / initial. Unassessed categories
default to 0 (conservative).

**OECD Principles (`score_oecd_principles`):** 5 principles × 20% weight, sub-indicators scored
1/0.5/0 (met/partial/not-met).

**Energy profiles (`MODEL_ENERGY_PROFILES`, cited Patterson 2021 / Samsi 2023):**

| Scale | Training MWh | Inference Wh/query |
|---|---|---|
| sub-1B | 0.5 | 0.0001 |
| 1B–10B | 5.0 | 0.001 |
| 10B–100B | 50.0 | 0.003 |
| >100B | 500.0 | 0.010 |

**Bias thresholds (`assess_algorithmic_bias`):** across 7 protected characteristics —
DIR = minority_rate/majority_rate; severity critical <0.60, high <0.70, medium <0.80 (the
EEOC **4/5 Rule**), else low; SPD < −0.10 and equalized-odds gap > 0.10 also flag. Bias→score:
critical 0, high 30, medium 60, low 90, none 70.

### 7.3 Calculation walkthrough

1. EU AI Act, NIST, OECD, energy and bias are computed independently.
2. Energy: `annual_MWh = training_MWh + daily_queries × Wh/query × 365 / 10⁶`;
   `Scope2_tCO2e = annual_MWh × 1000 × grid_gCO₂/kWh / 10⁶`; benchmarked against a 475 gCO₂/kWh
   EU-average grid.
3. Pillars combine per §7.1; ESG composite and tier returned per system.
4. `assess_portfolio` averages ESG/NIST across systems, sums energy, and distributes EU-AI-Act
   tiers.

### 7.4 Worked example — one high-risk system

Credit-scoring AI (essential_services → high-risk, base 50): 5 of 10 Art. obligations met →
`EU = 50 + (5/10)·50 = 75`. NIST overall 60. Grid 350 gCO₂/kWh, 10B–100B model, training
complete, 50,000 queries/day:

| Step | Computation | Result |
|---|---|---|
| Inference MWh | 50,000 × 0.003 × 365 / 10⁶ | 0.0548 MWh |
| Total MWh | 50 + 0.0548 | 50.05 MWh |
| Scope 2 | 50.05 × 1000 × 350 / 10⁶ | **17.52 tCO₂e/yr** |
| Environmental | 100 − (17.52/100)·100 | 82.5 |
| Governance | 0.5·75 + 0.5·60 | 67.5 |
| Social (bias medium 60, card 70%, OECD 55) | 0.4·60+0.3·70+0.3·55 | 61.5 |
| **ESG composite** | 0.35·67.5 + 0.30·82.5 + 0.35·61.5 | **69.9** → "advanced" |

### 7.5 The frontend page (disconnected)

`AIGovernancePage.jsx` does **not call the engine**. It generates synthetic AI systems from the
PRNG `sr(s)=frac(sin(s+1)×10⁴)` — `euScore = 20+sr·75`, `nistScore = 25+sr·70`,
`biasScore = 10+sr·80`, `energyMwh = 10+sr·2000`, `co2e = energyMwh·(0.2+sr·0.4)`, plus
incidents, vendors, TRL and documentation status. So the dashboard's numbers are random draws,
not the engine's computed scores; the two would need wiring for the page to reflect real
assessments. The route layer (`/api/v1/ai-governance/assess`, `/bias-assessment`,
`/energy-footprint`, `/eu-ai-act`, and four `ref/*` endpoints) exposes the engine to other
callers.

### 7.6 Data provenance & limitations

- **Backend engine:** methodology is real and standards-grounded; scores depend on caller-
  supplied audit evidence (model-card fields, NIST/OECD sub-scores, bias metric values).
  Unassessed inputs default to 0/conservative, so a system with no evidence scores low by design.
- **No SHAP:** neither layer computes Shapley explanations despite the guide; explainability is
  represented only as a model-card completeness percentage.
- **Frontend synthetic:** all page KPIs are seeded PRNG values, disconnected from the engine.
- Energy profiles are order-of-magnitude literature estimates; training energy is one-time and
  should be amortised (the engine notes this) but is added directly to the annual figure here.

### 7.7 Framework alignment

- **EU AI Act (Reg. (EU) 2024/1689)** — correct 4-tier structure (unacceptable/high/limited/
  minimal), Annex III high-risk categories, Art. 5 prohibitions, Art. 9–49 high-risk obligations,
  Art. 51/53/55 GPAI-systemic duties, and the real effective dates (prohibited 2025-02-02,
  high-risk 2026-08-02).
- **NIST AI RMF 1.0 (2023)** — the four Govern/Map/Measure/Manage functions with their
  sub-categories, equal-weighted to an overall profile score and maturity tier.
- **OECD AI Principles (2023)** — five value-based principles, sub-indicator scoring.
- **EEOC 4/5 Rule / EU non-discrimination** — disparate-impact ratio < 0.80 as the adverse-impact
  trigger; SPD and equalized-odds as supplementary fairness metrics (ISO/IEC 24027 referenced for
  external audit).
- **GHG Protocol Scope 2** — AI energy converted to location/market-based Scope 2 emissions with
  a grid carbon factor; ISO 42001:2023 (AI management systems) frames the governance pillar.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the engine + add SHAP explainability (analytics ladder: rung 3 → 4)

**What.** This is a genuine tier-A vertical: `ai_governance_engine` (E77) implements EU AI Act
2024/1689 tiering, NIST RMF, OECD Principles, energy/Scope-2 footprint, and a real disparate-
impact bias assessment (DIR < 0.80 EEOC 4/5 rule, SPD, equalized odds) — standards-grounded,
bench-passing (§4.2 shows `/assess`, `/bias-assessment`, `/energy-footprint` all pass). But §7.5
documents two gaps: the React page is **disconnected** — it renders seeded `sr()` systems and
makes zero API calls — and **SHAP is not implemented** despite the guide's headline
(`SHAP_i = Σ...·[f(S∪{i}) − f(S)]`), with explainability standing in as model-card completeness
only. Evolution A wires the page to the live engine and adds a real SHAP layer for the platform's
own ML models (greenwashing detector, ESG scorers), producing the waterfall/beeswarm the page
already has UI slots for.

**How.** Replace the page's PRNG system generation with calls to `POST /assess` and `/portfolio`;
add `POST /api/v1/ai-governance/explainability` computing SHAP values (the `shap` library over
the platform's sklearn models) and a fairness gap `max_group(acc) − min_group(acc)` alongside the
existing DIR. Rung 4 (predictive): a PSI drift monitor `PSI = Σ(actual% − expected%)·ln(actual/
expected)` over feature snapshots, triggering retraining alerts at PSI > 0.2 as the guide
specifies — the platform has model-inference history to baseline against.

**Prerequisites (hard).** Purge the disconnected page's `sr()` draws per the no-fabricated-random
guardrail; the engine's one-time training energy should be amortised (it notes this) before the
Environmental pillar treats it as annual. **Acceptance:** the §7.4 worked example (credit-scoring
system → ESG composite 69.9 "advanced") renders from a live `/assess` call, not a random draw;
a SHAP waterfall reproduces additive feature contributions summing to model output; PSI > 0.2
raises a retraining flag.

### 9.2 Evolution B — AI Act compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot on the AI Governance Hub that runs real assessments in natural language:
"classify our credit-scoring model under the EU AI Act" tool-calls `/eu-ai-act` (→ high-risk,
Annex III essential-services, Art. 9–49 obligations); "what's its bias exposure?" calls
`/bias-assessment` (→ DIR per protected characteristic, 4/5-rule flags); "estimate its Scope 2"
calls `/energy-footprint`; "assemble the ISO 42001 model card" checks completeness and lists
missing blocking fields. It narrates the engine's real outputs and the fine-exposure calc
(`maxFine = max(30, revenue·0.06)` × unmet/total requirements) — the numbers the page already
computes from `euLive`.

**How.** Tool schemas from the engine's 6 POST operations + 4 `ref/*` endpoints (which already
pass the lineage harness); the no-fabrication validator checks every score, DIR and tCO₂e against
tool outputs. The four `ref/*` endpoints (EU AI Act tiers, NIST functions, OECD principles, bias
metrics) are the ideal RAG grounding for "what does Art. 11 require?" style questions — a tier-1
explainer wrapping a tier-2 operator.

**Prerequisites.** Atlas + `ref/*` corpus embedded (roadmap D3); RBAC so assessments run under the
user's session. **Acceptance:** every numeric in an answer traces to an engine tool call; asking
for a SHAP explanation before Evolution A returns a refusal noting explainability is currently
model-card completeness only; an out-of-scope system is correctly classified minimal-risk with no
fabricated obligations.