# Regulatory Capital
**Module ID:** `regulatory-capital` · **Route:** `/regulatory-capital` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models climate risk capital requirements under BCBS, ECB, and BoE supervisory frameworks, including Pillar 2 add-ons and climate stress test buffers.

> **Business value:** Operationalises BCBS/ECB/BoE climate capital frameworks for banks, translating physical and transition risk into supervisory capital requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Inp`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `rng` | `(i, s=seed) => { let x = Math.sin(i + s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Capital Ratios','RWA Breakdown','FRTB SA/IMA','Climate P2R Overlay','Optimization Actions'];` |
| `cet1` | `+(12.4 + rng(1)*4).toFixed(1);` |
| `lev` | `+(4.2 + rng(4)*2).toFixed(1);` |
| `rwaData` | `['Credit Risk','Market Risk','Op Risk','CVA'].map((cat,i)=>({` |
| `desks` | `['FX Options','IR Rates','Credit Books','Equities','Commodities','Exotics'].map((d,i)=>({` |
| `lineData` | `years.map((y,i)=>({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/regulatory-capital/calculate-rwa` | `calculate_rwa` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/calculate-frtb` | `calculate_frtb` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/calculate-sa-ccr` | `calculate_sa_ccr` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/calculate-ratios` | `calculate_capital_ratios` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/optimize` | `optimize_capital` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/climate-p2r` | `apply_climate_p2r` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/operational-risk` | `calculate_operational_risk` | api/v1/routes/regulatory_capital_optimizer.py |
| POST | `/api/v1/regulatory-capital/calculate-cva` | `calculate_cva` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/sa-cr-risk-weights` | `get_sacr_risk_weights` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/frtb-parameters` | `get_frtb_parameters` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/sa-ccr-parameters` | `get_sa_ccr_parameters` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/cva-parameters` | `get_cva_parameters` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/nsfr-lcr-parameters` | `get_nsfr_lcr_parameters` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/optimization-techniques` | `get_optimization_techniques` | api/v1/routes/regulatory_capital_optimizer.py |
| GET | `/api/v1/regulatory-capital/ref/operational-risk` | `get_operational_risk_parameters` | api/v1/routes/regulatory_capital_optimizer.py |

### 2.3 Engine `regulatory_capital_optimizer_engine` (services/regulatory_capital_optimizer_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryCapitalOptimizerEngine._get_sacr_rw` | exposure_class, rating_bucket, ltv | Return SA-CR risk weight as a decimal (e.g. 0.75 for 75%). |
| `RegulatoryCapitalOptimizerEngine._calc_irb_rwa` | exposure_class, ead, pd, lgd, maturity | F-IRB / A-IRB capital formula. |
| `RegulatoryCapitalOptimizerEngine._calc_irb_rwa_safe` | exposure_class, ead, pd, lgd, maturity | IRB RWA with fallback (no scipy) using normal approximation. |
| `RegulatoryCapitalOptimizerEngine.calculate_rwa` | exposures, approach | Calculate credit risk-weighted assets for a portfolio. |
| `RegulatoryCapitalOptimizerEngine.calculate_frtb` | positions, ima_approved, backtesting_exceptions, pla_spearman | FRTB market risk capital — SA and IMA comparison. |
| `RegulatoryCapitalOptimizerEngine.calculate_sa_ccr` | netting_sets | SA-CCR EAD calculation for derivatives portfolios. |
| `RegulatoryCapitalOptimizerEngine.calculate_capital_ratios` | credit_rwa, market_rwa, operational_rwa, cet1_capital, at1_capital, t2_capital | Calculate all Basel IV regulatory capital and liquidity ratios. |
| `RegulatoryCapitalOptimizerEngine.identify_optimization_actions` | total_rwa, cet1_capital, exposure_classes, has_derivatives, has_irb_approval, has_netting_agreements | Identify and rank capital optimization actions. |
| `RegulatoryCapitalOptimizerEngine.apply_climate_p2r_addon` | base_cet1_ratio, physical_risk_score, transition_risk_score, total_rwa, cet1_capital | Apply ECB Pillar 2 Requirement climate overlay. |
| `RegulatoryCapitalOptimizerEngine.calculate_operational_risk_rwa` | business_indicator, loss_component | SA-OPR: Operational Risk = BIC × ILM. |
| `RegulatoryCapitalOptimizerEngine.calculate_cva` | counterparties, use_ba_cva | CVA capital charge. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `CVA_SUPERVISORY_PARAMS`, `FRTB_SA_RISK_WEIGHTS`, `Jan`, `NGFS`, `P`, `SA_CCR_COLLATERAL_HAIRCUTS`, `__future__` *(shared)*, `carbon`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate RWA Add-on (%) | — | Supervisory Scenario | Percentage increase in risk-weighted assets from applying climate transition risk shocks under ECB Pillar 2 sc |
| CET1 Impact (bps) | — | Capital Engine | Estimated CET1 ratio reduction from climate capital add-on under adverse supervisory scenario. |
| Stranded Asset Provision (£M) | — | Credit Risk Engine | Expected credit loss provision uplift from high-carbon stranded asset exposures in loan book. |
- **Loan book + climate hazard scores + supervisory scenarios** → Climate PD/LGD adjustment; RWA uplift; capital ratio impact modelling → **Climate capital add-on report and stress-tested capital ratio outputs**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/regulatory-capital/ref/climate-p2r** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'max_addon_bps', 'weighting', 'tier_thresholds', 'notes'], 'n_keys': 5}`

**GET /api/v1/regulatory-capital/ref/cva-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'ba_cva_scalar', 'supervisory_counterparty_pairs', 'notes'], 'n_keys': 4}`

**GET /api/v1/regulatory-capital/ref/frtb-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'sa_risk_weights', 'equity_buckets', 'pla_test_thresholds', 'backtesting_zones', 'ima_criteria', 'notes'], 'n_keys': 7}`

**GET /api/v1/regulatory-capital/ref/nsfr-lcr-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nsfr', 'lcr', 'leverage_ratio'], 'n_keys': 3}`

**GET /api/v1/regulatory-capital/ref/operational-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'bic_marginal_coefficients', 'ilm_formula', 'ilm_floor', 'ilm_default_no_internal_data', 'notes'], 'n_keys': 6}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Capital Add-on
**Headline formula:** `ΔCET1 = RWA_climate × (CCyB_climate + Pillar2_rate)`
**Standards:** ['BCBS d532 Climate Principles (2022)', 'ECB Climate Risk Stress Test (2022)', 'BoE Climate BES 2021']

**Engine `regulatory_capital_optimizer_engine` — extracted transformation lines:**
```python
bucket = max(0, min(rating_bucket, len(rw_list) - 1))
exp_term = math.exp(-k_param * pd)
R = R_min * (1 - exp_term) / (1 - math.exp(-k_param)) + R_max * (1 - (1 - exp_term) / (1 - math.exp(-k_param)))
rwa = K * 12.5 * ead
K = lgd * (pd * 2.326 / math.sqrt(1 - R)) * 0.08  # rough proxy
exp = ExposureItem(**{k: v for k, v in exp_dict.items() if k in ExposureItem.__dataclass_fields__})
sa_rwa = sa_rw * exp.ead
floor_rwa = IRB_OUTPUT_FLOOR * sa_rwa
output_floor_rwa = IRB_OUTPUT_FLOOR * total_sa_rwa
sa_rwa = notional * rw
rc = max(total_mv - total_collateral, 0)
sd_factor = min(math.sqrt(maturity / 10), 1.0)
adj_notional = notional * sd_factor
pfe_addon = multiplier * gross_addon
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).