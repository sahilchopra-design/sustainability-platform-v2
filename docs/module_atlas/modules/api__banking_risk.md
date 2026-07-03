# Api::Banking_Risk
**Module ID:** `api::banking_risk` · **Route:** `/api/v1/banking-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/banking-risk/liquidity-risk` | `assess_liquidity_risk` | api/v1/routes/banking_risk.py |
| POST | `/api/v1/banking-risk/market-risk` | `assess_market_risk` | api/v1/routes/banking_risk.py |
| POST | `/api/v1/banking-risk/capital-adequacy` | `assess_capital_adequacy` | api/v1/routes/banking_risk.py |
| POST | `/api/v1/banking-risk/comprehensive` | `comprehensive_assessment` | api/v1/routes/banking_risk.py |
| GET | `/api/v1/banking-risk/pd-term-structures` | `pd_term_structures` | api/v1/routes/banking_risk.py |
| GET | `/api/v1/banking-risk/lgd-collateral-types` | `lgd_collateral_types` | api/v1/routes/banking_risk.py |
| GET | `/api/v1/banking-risk/risk-weights` | `risk_weights` | api/v1/routes/banking_risk.py |
| GET | `/api/v1/banking-risk/tsa-beta-factors` | `tsa_beta_factors` | api/v1/routes/banking_risk.py |

### 2.3 Engine `banking_risk_engine` (services/banking_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BankingRiskEngine.assess_credit_risk` | total_exposure_eur, portfolio_size, avg_rating, collateral_type, avg_maturity_years, stage2_pct | Calculate IFRS 9 ECL across 3 stages with climate overlay. |
| `BankingRiskEngine.assess_liquidity_risk` | hqla_holdings, funding_sources, asset_book | Calculate LCR and NSFR using embedded Basel III factors. |
| `BankingRiskEngine.assess_market_risk` | trading_book_eur, equity_exposure_eur, fx_exposure_eur, interest_rate_dv01_eur, portfolio_volatility_pct, stressed_volatility_pct | Calculate VaR, Stressed VaR, and IRRBB (EVE/NII). |
| `BankingRiskEngine.assess_operational_risk` | gross_income_year1_eur, gross_income_year2_eur, gross_income_year3_eur, business_line_income | Calculate operational risk capital under BIA and TSA. |
| `BankingRiskEngine.assess_aml_risk` | counterparty_countries, exposure_by_country | Screen counterparties against FATF country risk ratings. |
| `BankingRiskEngine.assess_capital_adequacy` | cet1_capital_eur, at1_capital_eur, tier2_capital_eur, credit_rwa_eur, market_rwa_eur, operational_rwa_eur | Assess bank capital adequacy under Basel III/IV framework. |
| `BankingRiskEngine.comprehensive_assessment` | entity_name, total_exposure_eur, cet1_capital_eur, trading_book_eur, gross_income_eur, warming_c | Run all sub-modules and aggregate into a comprehensive bank risk profile. |
| `BankingRiskEngine.get_pd_term_structures` |  | Return available PD term structures by rating. |
| `BankingRiskEngine.get_lgd_collateral_types` |  | Return LGD by collateral type. |
| `BankingRiskEngine.get_risk_weights` |  | Return Basel III/IV risk weights by exposure class. |
| `BankingRiskEngine.get_tsa_beta_factors` |  | Return TSA beta factors by business line. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/banking-risk/lgd-collateral-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['lgd_by_collateral'], 'n_keys': 1}`

**GET /api/v1/banking-risk/pd-term-structures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pd_term_structures'], 'n_keys': 1}`

**GET /api/v1/banking-risk/risk-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['risk_weights'], 'n_keys': 1}`

**GET /api/v1/banking-risk/tsa-beta-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['tsa_beta_factors'], 'n_keys': 1}`

**POST /api/v1/banking-risk/aml-risk** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `banking_risk_engine` — extracted transformation lines:**
```python
GSIB_BUFFER_PCT = 1.0  # default G-SIB surcharge
year_idx = min(avg_maturity_years - 1, len(pd_curve) - 1)
annual_pd_pct = pd_curve[0]  # 1-year PD for Stage 1
lifetime_pd_pct = pd_curve[year_idx]  # maturity-matched PD for Stage 2
stage1_pct = 100.0 - stage2_pct - stage3_pct
stage1_exposure = total_exposure_eur * stage1_pct / 100.0
stage2_exposure = total_exposure_eur * stage2_pct / 100.0
stage3_exposure = total_exposure_eur * stage3_pct / 100.0
ecl_stage1 = stage1_exposure * (annual_pd_pct / 100.0) * (lgd_pct / 100.0)
ecl_stage2 = stage2_exposure * (lifetime_pd_pct / 100.0) * (lgd_pct / 100.0)
ecl_stage3 = stage3_exposure * 1.0 * (lgd_pct / 100.0)  # PD=100% for Stage 3
total_ecl = ecl_stage1 + ecl_stage2 + ecl_stage3
climate_overlay = total_ecl * (climate_mult - 1.0)
avg_ead = total_exposure_eur / portfolio_size if portfolio_size > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).