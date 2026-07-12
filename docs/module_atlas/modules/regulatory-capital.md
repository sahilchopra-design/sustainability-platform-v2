# Regulatory Capital
**Module ID:** `regulatory-capital` · **Route:** `/regulatory-capital` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models climate risk capital requirements under BCBS, ECB, and BoE supervisory frameworks, including Pillar 2 add-ons and climate stress test buffers.

> **Business value:** Operationalises BCBS/ECB/BoE climate capital frameworks for banks, translating physical and transition risk into supervisory capital requirements.

**How an analyst works this module:**
- Map portfolio to BCBS climate risk categories.
- Apply climate-adjusted PD/LGD under supervisory scenarios.
- Calculate RWA uplift and Pillar 2 capital add-on.
- Model capital ratio impact and management actions.

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
| GET | `/api/v1/regulatory-capital/ref/climate-p2r` | `get_climate_p2r_parameters` | api/v1/routes/regulatory_capital_optimizer.py |

### 2.3 Engine `regulatory_capital_optimizer_engine` (services/regulatory_capital_optimizer_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RegulatoryCapitalOptimizerEngine._get_sacr_rw` | exposure_class, rating_bucket, ltv | Return SA-CR risk weight as a decimal (e.g. 0.75 for 75%). |
| `RegulatoryCapitalOptimizerEngine._calc_irb_rwa` | exposure_class, ead, pd, lgd, maturity | F-IRB / A-IRB capital formula. Returns RWA amount (same units as EAD). |
| `RegulatoryCapitalOptimizerEngine._calc_irb_rwa_safe` | exposure_class, ead, pd, lgd, maturity | IRB RWA with fallback (no scipy) using normal approximation. |
| `RegulatoryCapitalOptimizerEngine.calculate_rwa` | exposures, approach | Calculate credit risk-weighted assets for a portfolio. Parameters ---------- exposures : list of dict with keys: exposure_id, exposure_class, rating_bucket, ead, ltv (optional), pd (optional), lgd (optional), maturity (optional) approach : "SA-CR" / "F-IRB" / "A-IRB" Returns ------- dict with per-exposure breakdown + portfolio totals + output floor. |
| `RegulatoryCapitalOptimizerEngine.calculate_frtb` | positions, ima_approved, backtesting_exceptions, pla_spearman | FRTB market risk capital — SA and IMA comparison. Parameters ---------- positions : list of dict with keys: desk_id, asset_class, sub_class, notional, long_short (1/-1) ima_approved : whether IMA has supervisory approval backtesting_exceptions : number of back-testing exceptions (250-day) pla_spearman : Spearman correlation from P&L attribution test |
| `RegulatoryCapitalOptimizerEngine.calculate_sa_ccr` | netting_sets | SA-CCR EAD calculation for derivatives portfolios. Parameters ---------- netting_sets : list of dict with: netting_set_id, trades (list of: asset_class, sub_class, notional, maturity_years, market_value, collateral_posted, collateral_type ), has_netting_agreement, has_csa |
| `RegulatoryCapitalOptimizerEngine.calculate_capital_ratios` | credit_rwa, market_rwa, operational_rwa, cet1_capital, at1_capital, t2_capital, leverage_exposure, asf | Calculate all Basel IV regulatory capital and liquidity ratios. |
| `RegulatoryCapitalOptimizerEngine.identify_optimization_actions` | total_rwa, cet1_capital, exposure_classes, has_derivatives, has_irb_approval, has_netting_agreements, has_csa | Identify and rank capital optimization actions. Returns ranked list of applicable optimization techniques with estimated RWA reduction and CET1 ratio uplift. |
| `RegulatoryCapitalOptimizerEngine.apply_climate_p2r_addon` | base_cet1_ratio, physical_risk_score, transition_risk_score, total_rwa, cet1_capital | Apply ECB Pillar 2 Requirement climate overlay. Parameters ---------- base_cet1_ratio : base CET1 ratio (decimal, e.g. 0.12 = 12%) physical_risk_score : 0.0 – 1.0 (higher = more physical risk) transition_risk_score: 0.0 – 1.0 (higher = more transition risk) total_rwa : total RWA cet1_capital : CET1 capital amount |
| `RegulatoryCapitalOptimizerEngine.calculate_operational_risk_rwa` | business_indicator, loss_component | SA-OPR: Operational Risk = BIC × ILM. BIC calculated from BI using marginal coefficient table. If no internal loss data, ILM = 1.0. |
| `RegulatoryCapitalOptimizerEngine.calculate_cva` | counterparties, use_ba_cva | CVA capital charge. Parameters ---------- counterparties : list of dict: sector, ead, maturity_years, notional_hedge (optional) use_ba_cva : True = BA-CVA (reduced formula); False = SA-CVA |

**Engine `regulatory_capital_optimizer_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `IRB_OUTPUT_FLOOR` | `0.725` |
| `FIRB_LGD` | `{'senior_unsecured': 0.45, 'subordinated': 0.75, 'secured_financial_collateral': 0.35, 'secured_re': 0.35, 'secured_eligible_physical': 0.4}` |
| `IRB_CORRELATION_PARAMS` | `{'corporate': {'R_min': 0.12, 'R_max': 0.24, 'k': 50}, 'bank': {'R_min': 0.12, 'R_max': 0.24, 'k': 50}, 'sovereign': {'R_min': 0.12, 'R_max': 0.24, 'k': 50}, 'retail_mortgage': {'R_min': 0.15, 'R_max': 0.15, 'k': 0}, 'retail_qualifying_revolving': {'R_min': 0.04, 'R_max': 0.04, 'k': 0}, 'retail_othe` |
| `IRB_MATURITY_ADJUSTMENT` | `{'b_coefficient_base': 0.11852, 'b_coefficient_pd': -0.05478}` |
| `FRTB_PLA_THRESHOLDS` | `{'spearman_correlation_green': 0.8, 'spearman_correlation_amber': 0.7, 'kolmogorov_smirnov_green': 0.09, 'kolmogorov_smirnov_amber': 0.12}` |
| `FRTB_BACKTESTING_ZONES` | `{'green': {'exceptions_max': 4, 'multiplier': 1.5}, 'amber': {'exceptions_max': 9, 'multiplier': 1.75}, 'red': {'exceptions_max': 999, 'multiplier': 2.0}}` |
| `FRTB_IMA_CRITERIA` | `['Sound risk management culture in trading desk', 'Live P&L data for back-testing (250 day minimum)', 'Pass P&L attribution test (Spearman ≥ 0.80 green zone)', 'Back-testing exceptions ≤ 4 out of 250 days (green zone)', 'Risk factor eligibility assessment (RFEA) complete', 'Model validation by indep` |
| `FRTB_EQUITY_BUCKETS` | `{1: {'description': 'Large cap, advanced economy consumer goods/services/transport', 'rw_spot': 0.55, 'rw_repo': 0.0055}, 2: {'description': 'Large cap, advanced economy telecom/industrials', 'rw_spot': 0.6, 'rw_repo': 0.006}, 3: {'description': 'Large cap, advanced economy basic materials/energy/ag` |
| `SA_CCR_ALPHA` | `1.4` |
| `BA_CVA_SCALAR` | `0.25` |
| `ILM_DEFAULT_NO_DATA` | `1.0` |
| `BI_COMPONENTS` | `{'ILDC': 'Interest, Leases and Dividend Component = \|net_interest_income\| + \|net_lease_income\| + dividend_income', 'SC': 'Services Component = max(fee_income, fee_expense) + max(other_operating_income, other_operating_expense)', 'FC': 'Financial Component = \|net_P&L_trading_book\| + \|net_P&L_b` |
| `LEVERAGE_RATIO_MIN` | `0.03` |
| `LEVERAGE_RATIO_GSII_ADDON` | `0.005` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `CVA_SUPERVISORY_PARAMS`, `FRTB_SA_RISK_WEIGHTS`, `Jan`, `NGFS`, `P`, `SA_CCR_COLLATERAL_HAIRCUTS`, `__future__` *(shared)*, `carbon`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate RWA Add-on (%) | — | Supervisory Scenario | Percentage increase in risk-weighted assets from applying climate transition risk shocks under ECB Pillar 2 scenario. |
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

**GET /api/v1/regulatory-capital/ref/optimization-techniques** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_techniques', 'techniques', 'notes'], 'n_keys': 3}`

**GET /api/v1/regulatory-capital/ref/sa-ccr-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'alpha_factor', 'supervisory_factors', 'collateral_haircuts', 'notes'], 'n_keys': 5}`

**GET /api/v1/regulatory-capital/ref/sa-cr-risk-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'rating_buckets', 'risk_weights_pct', 'residential_re_ltv_table', 'commercial_re_ltv_table', 'output_floor', 'firb_supervisory_lgd', 'notes'], 'n_keys': 8}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Capital Add-on
**Headline formula:** `ΔCET1 = RWA_climate × (CCyB_climate + Pillar2_rate)`

Climate-attributable increase in CET1 capital requirement from regulatory climate Pillar 2 and macro-prudential buffers applied to climate-adjusted RWAs.

**Standards:** ['BCBS d532 Climate Principles (2022)', 'ECB Climate Risk Stress Test (2022)', 'BoE Climate BES 2021']
**Reference documents:** BCBS Principles for the Effective Management of Climate-Related Financial Risks (d532, 2022); ECB Climate Risk Stress Test Aggregate Results (2022); Bank of England Biennial Exploratory Scenario: Financial Risks from Climate Change (2021)

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
ead = SA_CCR_ALPHA * (rc + pfe_addon)
gross_ead_no_netting = SA_CCR_ALPHA * (rc + gross_addon)
total_rwa = credit_rwa + market_rwa + operational_rwa
tier1_capital = cet1_capital + at1_capital
total_capital = tier1_capital + t2_capital
cet1_ratio = cet1_capital / total_rwa if total_rwa > 0 else 0.0
tier1_ratio = tier1_capital / total_rwa if total_rwa > 0 else 0.0
tc_ratio = total_capital / total_rwa if total_rwa > 0 else 0.0
leverage_ratio = tier1_capital / leverage_exposure if leverage_exposure > 0 else 0.0
leverage_min = LEVERAGE_RATIO_MIN + (LEVERAGE_RATIO_GSII_ADDON if is_gsii else 0)
nsfr = asf / rsf if rsf > 0 else 0.0
lcr = hqla / net_cash_outflows_30d if net_cash_outflows_30d > 0 else 0.0
cet1_min = 0.045  # 4.5% + buffers typically 2.5% conservation = 7%
rwa_reduction_est = total_rwa * rw_mid * 0.30  # conservative: 30% portfolio impact
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — backend is real, frontend display is decorative.**
> `backend/services/regulatory_capital_optimizer_engine.py` (1,329 lines) is a genuinely rigorous
> Basel IV / CRR3 capital engine: real SA-CR risk-weight tables (Art. 114/117/122/123/124/126/133
> CRR3), FRTB SA/IMA, SA-CCR, CVA, SA-OPR, leverage ratio, NSFR/LCR, and a real
> `apply_climate_p2r_addon()` implementing the ECB's 0–50bps Pillar 2R climate overlay, all exposed
> via working REST endpoints (`/calculate-ratios`, `/calculate-frtb`, `/calculate-sa-ccr`,
> `/climate-p2r`, `/calculate-cva`, `/optimize`, plus 6 `/ref/*` parameter endpoints).
> **The frontend calls the real `/calculate-ratios` endpoint, stores the response in a `result`
> state variable — and never renders it anywhere in the component.** Every KPI card and pass/fail
> row visible to the user (`cet1`, `t1`, `tc`, `lev`, NSFR, LCR) is instead computed from a
> **module-scope seeded PRNG** (`rng(i, seed=108) = frac(sin(i+seed+1)×10⁴)`) that runs
> independently of the button click or its response. The "Climate P2R Overlay" tab shows the same
> pattern: a real `/climate-p2r` endpoint exists and correctly implements the guide's climate
> capital add-on methodology, but the tab's displayed bps add-on and Climate VaR figures are
> `rng()`-seeded, not fetched from that endpoint. The sections below cover both the real backend
> (which the UI should be, but currently is not, surfacing) and the seeded frontend display.

### 7.1 What the backend engine computes (real, working, not rendered)

```python
composite = 0.40 × physical_risk_score + 0.60 × transition_risk_score        # both in [0,1]
addon_bps = tier_lookup(composite): <0.20→0bps, <0.40→10, <0.60→20, <0.80→35, else 50
addon_capital_required = (addon_bps/10000) × total_rwa
climate_adjusted_cet1  = (cet1_capital − addon_capital_required) / total_rwa
```

This is a faithful, close match to the guide's own formula `ΔCET1 = RWA_climate ×
(CCyB_climate+Pillar2_rate)` — the engine's `addon_bps/10000 × RWA` term *is* the Pillar2_rate
component (no separate CCyB term, but the mechanism is the same: a bps-denominated capital
add-on applied to RWA and netted from CET1 capital).

### 7.2 Parameterisation — backend Climate P2R engine

| Parameter | Value | Provenance |
|---|---|---|
| `physical_risk_weight` | 0.40 | ECB guidance-consistent weighting (transition risk weighted higher, matching ECB's 2022 climate stress test finding that transition risk dominates near-term bank exposures) |
| `transition_risk_weight` | 0.60 | as above |
| Tier thresholds → bps | composite <0.20→0bps, <0.40→10bps, <0.60→20bps, <0.80→35bps, ≥0.80→50bps | Synthetic tiering, capped at the ECB's own stated **maximum 50bps** Pillar 2R climate overlay ceiling — the cap itself is real (ECB SREP guidance), the specific tier breakpoints are a reasonable interpolation not published verbatim by the ECB |
| `max_addon_bps` | 50 | ECB Supervisory Review and Evaluation Process (SREP) climate overlay ceiling |

SA-CR risk weights (spot-checked against CRR3): sovereign 0/20/50/100/100/150/100 by rating
bucket (Art 114 ✓), retail flat 75% (Art 123 ✓), residential RE LTV-banded 20/25/30/40/50/70 (Art
124 ✓), commercial RE LTV-banded 60/80/100/110 (Art 126 ✓) — these match the real CRR3 tables.

### 7.3 What the frontend actually displays

```js
seed = 108
rng  = (i, s=seed) => frac(sin(i+s+1)×10⁴)
cet1 = 12.4 + rng(1)×4        // 12.4–16.4%
t1   = cet1 + 1.2 + rng(2)×0.8
tc   = t1 + 1.2 + rng(3)×1.2
lev  = 4.2 + rng(4)×2
climate_P2R_addon = round(25 + rng(50)×50)     // bps, "Climate P2R Add-On" KPI card
climate_VaR       = round(800 + rng(53)×1200)  // €M, "Climate VaR" KPI card
```

`run()` (the "Calculate Capital Ratios" button handler) does `POST /calculate-ratios`, sets
`result = r.data` on success — **`result` is never referenced again in the file**, so the fetched
real backend response has no visible effect on the page.

### 7.4 Worked example — the disconnect, quantified

For a request with `institution_type='G-SII'`, `total_assets_eur_bn=500`, `approach='SA'`:

| Path | What happens |
|---|---|
| User clicks "Calculate Capital Ratios" | `axios.post(.../calculate-ratios, {...})` fires |
| Backend | Runs real SA-CR/FRTB/leverage calculations against CRR3 tables, returns a JSON `result` |
| Frontend state | `setResult(r.data)` — stored in React state |
| **What the user sees** | Still `cet1 = 12.4+rng(1)×4 = 12.4+frac(sin(2)×10⁴)×4`; `rng(1)=frac(sin(2)×10⁴)≈0.9200` → **cet1=16.08%**, unrelated to the actual 500-EUR-Bn G-SII SA calculation just returned by the server |

The pass/fail badges (`cet1>=7.0 ? 'PASS':'FAIL'`) are therefore evaluated against the **seeded**
value, not the institution the user actually configured — every institution/approach combination
shows the same seeded pass/fail outcome.

### 7.5 Climate risk-tier rubric (backend, correctly implemented, not surfaced)

| Composite score | Tier | Add-on |
|---|---|---|
| < 0.20 | low | 0 bps |
| 0.20–0.40 | moderate | 10 bps |
| 0.40–0.60 | elevated | 20 bps |
| 0.60–0.80 | high | 35 bps |
| ≥ 0.80 | very_high | 50 bps |

### 7.6 Companion analytics

Capital Ratios (gauge + pass/fail table — seeded), RWA Breakdown (Credit/Market/Op/CVA split —
seeded), FRTB SA/IMA (desk-level VaR/SVaR by trading desk — seeded), Climate P2R Overlay (bps
add-on + Climate VaR + CET1 trajectory chart 2024–2030 — seeded), Optimization Actions (SRT
securitisation, CDS hedging, portfolio tilt, netting expansion — descriptive, references the real
`OPTIMIZATION_TECHNIQUES` catalogue's regulatory citations but displayed RWA-reduction figures
appear seeded per institution rather than computed from the actual portfolio).

### 7.7 Data provenance & limitations

- **The backend is production-grade**: real CRR3/Basel IV risk-weight tables, a correctly-capped
  ECB Pillar 2R climate methodology, and 8 working POST/GET endpoints. This is one of the
  strongest backend implementations reviewed in this batch.
- **None of that backend reaches the user.** Every number on the page is `rng(seed=108)`-seeded
  and static across every institution/approach/scenario selection — the interactive controls
  (institution type, total assets, approach) are collected and posted to a real endpoint whose
  response is then discarded from the UI's perspective.
- Fixing this requires only wiring the existing `result` state into the KPI cards/table (replacing
  `cet1`/`t1`/`tc`/`lev` with `result.cet1_ratio_pct` etc., matching whatever field names
  `calculate_capital_ratios()` actually returns) and adding a second `axios.post('/climate-p2r', {
  physical_risk_score, transition_risk_score, total_rwa, cet1_capital })` call for the Climate P2R
  tab — no new backend work is needed.
- Until fixed, no number currently visible on this page should be cited as a real capital-adequacy
  calculation for any institution.

**Framework alignment:** CRR3/Basel IV (SA-CR, FRTB BCBS 457, SA-CCR BCBS 279, CVA BCBS 325,
SA-OPR, NSFR/LCR Basel III) — genuinely implemented in the backend engine with article-level
citations · ECB Pillar 2R climate overlay (ECB guide on climate-related and environmental risks,
2020 + 2022 stress test) — genuinely implemented as a 0–50bps composite-score-tiered add-on ·
BCBS d532 Climate Principles / BoE Climate BES 2021 — cited by the guide as context, not
separately modelled beyond the ECB P2R mechanism already covered.

## 9 · Future Evolution

### 9.1 Evolution A — Render the engine's own response, then scenario-condition the P2R inputs (analytics ladder: rung 2 → 3)

**What.** §7 documents the platform's most extreme wiring absurdity: a production-grade Basel IV/CRR3 engine (1,329 lines — SA-CR risk weights at CRR3 article level, FRTB SA/IMA, SA-CCR, CVA, NSFR/LCR, a correctly capped ECB 0–50bps climate P2R overlay, 8 working endpoints) whose `/calculate-ratios` response the frontend fetches, stores in `result`, and never renders — every visible KPI is an independent `rng(seed=108)` draw, static across all institution/approach/scenario selections. Evolution A is two-stage: the §7.7-prescribed wiring fix (render `result.cet1_ratio_pct` etc.; add the missing `/climate-p2r` POST for that tab — no backend work), then a real upgrade: scenario-conditioned physical/transition risk scores feeding the P2R composite.

**How.** (1) The wiring fix ships first and alone — it converts decorative numbers into real capital ratios in a day. (2) Then connect the P2R composite's inputs (`0.40×physical + 0.60×transition`) to platform engines instead of user-typed scores: transition score from portfolio sector mix vs NGFS pathways, physical score from the digital-twin composite over collateral locations, each documented and overridable. (3) Add the engine's `/optimize` output (already implemented) to the UI so the capital-optimization capability stops being invisible. (4) bench_quant pins a reference institution through `/calculate-ratios` and `/climate-p2r`.

**Prerequisites.** Field-name confirmation against `calculate_capital_ratios()`'s actual response schema (§7.7 flags this); no others for stage 1. **Acceptance:** changing institution inputs changes displayed ratios via the API; the P2R tab's bps add-on equals the endpoint's tier lookup; no `rng(seed=108)` reference remains in the page.

### 9.2 Evolution B — Supervisory-dialogue copilot over the capital stack (LLM tier 2)

**What.** Banks using this module face ICAAP/SREP dialogue. The copilot supports it: "decompose our CET1 movement if we shift €2bn from corporate to covered-bond exposure" (paired `/calculate-ratios` calls), "explain our 35bps climate P2R — which score drives it and what would move us down a tier?", "draft the ICAAP climate-capital section with the methodology description" — the last grounded in the engine's own documented tier ladder (composite <0.20→0bps … ≥0.80→50bps) and the CRR3 article references its risk-weight tables carry.

**How.** Tier-2 tool schemas over all 8 endpoints plus the 6 `GET /ref/*` parameter tables, letting the copilot cite the actual supervisory factor or risk weight applied rather than reciting Basel from memory. System prompt encodes supervisory-communication discipline: computed ratios are model outputs under stated assumptions, not regulatory determinations; the ECB overlay is a supervisory-expectation proxy, and the copilot says so. What-if sweeps (approach comparisons, RWA sensitivity) run as batched tool calls rendered as exhibit tables. Every %, bps, and € figure validated against tool outputs.

**Prerequisites (hard).** Evolution A stage 1 — a copilot must not narrate a page whose numbers §7.7 says "should not be cited as a real capital-adequacy" figure; golden Q&A from the engine's reference case. **Acceptance:** a drafted ICAAP section's every number traces to an endpoint response; tier-boundary questions quote the engine's own lookup table; requests to assert SREP outcomes are declined.