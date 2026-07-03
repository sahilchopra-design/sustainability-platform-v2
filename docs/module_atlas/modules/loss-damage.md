# Loss & Damage Finance
**Module ID:** `loss-damage` · **Route:** `/loss-damage` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
COP27 Loss and Damage Fund analytics. Covers climate-vulnerable country needs assessment, fund contribution tracking, liability analysis, and historical attribution of climate losses.

> **Business value:** Loss and damage is the emerging frontier of climate finance, creating potential liability for high-emitting countries and companies. The COP27/28 fund is vastly underfunded relative to need. This module tracks the evolving landscape and helps financial institutions assess sovereign L&D exposure in their bond portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES`, `FUND_COMMITMENTS`, `HAZARDS`, `Kpi`, `PIE_C`, `REGIONS`, `Row`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ndGain` | `Math.round(25+sr(i*7)*45);` |
| `climVulnIdx` | `Math.round(100-ndGain+sr(i*11)*15);` |
| `annualLoss` | `Math.round(100+sr(i*13)*4900);` |
| `gdpPct` | `Math.round(sr(i*17)*120)/10;` |
| `deaths` | `Math.round(50+sr(i*19)*2000);` |
| `displaced` | `Math.round(10+sr(i*23)*500);` |
| `infraDamage` | `Math.round(50+sr(i*29)*3000);` |
| `agriLoss` | `Math.round(20+sr(i*31)*1500);` |
| `needsEstimate` | `Math.round(annualLoss*1.5+sr(i*37)*2000);` |
| `committed` | `Math.round(needsEstimate*sr(i*41)*0.4);` |
| `disbursed` | `Math.round(committed*sr(i*43)*0.6);` |
| `adaptationGap` | `needsEstimate-committed;` |
| `totalPledged` | `FUND_COMMITMENTS.reduce((a,c)=>a+c.pledged,0);` |
| `totalDisbursed` | `FUND_COMMITMENTS.reduce((a,c)=>a+c.disbursed,0);` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].j` |
| `totalLoss` | `COUNTRIES.reduce((a,c)=>a+c.annualLoss,0);` |
| `totalNeeds` | `COUNTRIES.reduce((a,c)=>a+c.needsEstimate,0);` |
| `totalCommitted` | `COUNTRIES.reduce((a,c)=>a+c.committed,0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/loss-damage/frld-eligibility` | `frld_eligibility_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/parametric-design` | `parametric_design_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/wim-access` | `wim_access_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/ld-gap-analysis` | `ld_gap_analysis_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/ld-portfolio` | `ld_portfolio_endpoint` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/v20-members` | `ref_v20_members` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/frld-criteria` | `ref_frld_criteria` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/global-shield` | `ref_global_shield` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/parametric-triggers` | `ref_parametric_triggers` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/loss-event-types` | `ref_loss_event_types` | api/v1/routes/loss_damage.py |

### 2.3 Engine `loss_damage_engine` (services/loss_damage_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_as_float` | value | Coerce to float, returning None for missing/blank/uncoercible inputs. |
| `calculate_frld_eligibility` | country_data, loss_event | Calculate FRLD fund eligibility and indicative allocation for a country/loss event. |
| `design_parametric_trigger` | trigger_data | Design a parametric insurance trigger with payout structure and basis risk assessment. |
| `assess_wim_access` | country_data | Assess WIM function scores and Santiago Network eligibility. |
| `calculate_residual_ld_gap` | country_data, coverage_data | Calculate total L&D and residual gap after insurance, FRLD, and WIM support. |
| `aggregate_ld_portfolio` | portfolio | Aggregate L&D exposure and coverage metrics across a multi-country portfolio. |

### 2.3 Engine `loss_damage_finance_engine` (services/loss_damage_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `LossDamageFinanceEngine._profile` | country_iso |  |
| `LossDamageFinanceEngine._tier` | p |  |
| `LossDamageFinanceEngine._premium_cat` | p |  |
| `LossDamageFinanceEngine._wim_pillars_for_event` | event_type |  |
| `LossDamageFinanceEngine.assess_loss_damage_finance` | country_iso, event_type, economic_loss_usd |  |
| `LossDamageFinanceEngine.calculate_protection_gap` | country_iso, total_loss_usd, insured_loss_usd, sector |  |
| `LossDamageFinanceEngine.design_parametric_trigger` | country_iso, peril, coverage_amount_usd_mn, preferred_payout_speed_days |  |
| `LossDamageFinanceEngine.assess_regional_mechanism` | country_iso, annual_exposure_usd_mn, desired_perils |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Green`, `World`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `recommendations`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FUND_COMMITMENTS`, `HAZARDS`, `PIE_C`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| L&D Fund Pledged | — | COP28 2023 | Significantly less than estimated need of $400B+ annually |
| V20 Country Needs | — | Vulnerable Group | Estimated annual loss and damage in most vulnerable countries |
| Attribution Science Coverage | — | World Weather Attribution | Fraction of major events with rapid attribution analysis |
- **Climate event data** → Attribution analysis → **Climate-attributable loss fraction**
- **Country economic data** → L&D needs assessment → **Vulnerable country financing gap**
- **Fund pledge data** → Gap analysis → **Finance adequacy assessment**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/loss-damage/ref/frld-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['access_criteria', 'fund_initial_capitalisation_bn_usd', 'pledges_at_cop28_bn_usd', 'host_institution', 'governing_board', 'decision', 'note'], 'n_keys': 7}`

**GET /api/v1/loss-damage/ref/global-shield** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'total_committed_bn_usd', 'coverage_countries', 'g7_launch', 'v2_update', 'flagship_instruments', 'target_2025'], 'n_keys': 7}`

**GET /api/v1/loss-damage/ref/loss-event-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['event_types', 'total_types', 'wim_action_areas', 'global_annual_ld_bn_usd', 'insured_pct', 'source'], 'n_keys': 6}`

**GET /api/v1/loss-damage/ref/parametric-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['triggers', 'total_indices', 'standard', 'basis_risk_mitigation', 'settlement_process'], 'n_keys': 5}`

**GET /api/v1/loss-damage/ref/v20-members** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['v20_members', 'total_members', 'combined_gdp_bn_usd', 'combined_population_mn', 'annual_ld_bn_usd', 'description', 'founding', 'secretariat'], 'n_keys': 8}`

## 5 · Intermediate Transformation Logic
**Methodology:** Loss and damage attribution
**Headline formula:** `L&D = Economic_losses + Non_economic_losses attributable to climate change`
**Standards:** ['UNFCCC L&D Fund', 'Shukla & James Attribution Science', 'V20 Vulnerable Group']

**Engine `loss_damage_engine` — extracted transformation lines:**
```python
vuln_mult = 1 + (1 - nd_gain_score) * 0.5
annual_ld = gdp_usd * FRLD_GDP_LOSS_BASE_FRACTION * event_multiplier * freq
frld_coverage_ratio = min(0.80, indicative_alloc / annual_ld)
expected_payout = max_payout * trigger_prob
expected_payout = max_payout * trigger_prob * 0.5
expected_payout = max_payout * trigger_prob * 0.6
payout_at_attach = max_payout * 0.3
loading_factor = DEFAULT_PREMIUM_LOADING_FACTOR + basis_risk * BASIS_RISK_LOADING_COEFF
premium = expected_payout * loading_factor
payout_at_attach = max_payout * 0.3
total_economic_loss = gdp * loss_pct_gdp / 100
insurance_covered = total_economic_loss * ins_penetration
frld_eligible = total_economic_loss * frld_share
global_shield = total_economic_loss * global_shield_share
```

**Engine `loss_damage_finance_engine` — extracted transformation lines:**
```python
attributed_usd = economic_loss_usd * far
unattributed_usd = economic_loss_usd * (1.0 - far)
estimated_insured = economic_loss_usd * insured_pct / 100.0
gap_usd = economic_loss_usd - estimated_insured
estimated_insured = economic_loss_usd * 0.05
gap_usd = economic_loss_usd * 0.95
gap_usd = max(total_loss_usd - insured_loss_usd, 0.0)
gap_pct = (gap_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
actual_pen = (insured_loss_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
feasible_insured = total_loss_usd * feasible_pct / 100.0
residual_gap = max(total_loss_usd - feasible_insured, 0.0)
annual_premium = total_loss_usd * premium_rate
basis = min(basis + 0.08, 0.60)
basis = min(basis + 0.05, 0.55)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).