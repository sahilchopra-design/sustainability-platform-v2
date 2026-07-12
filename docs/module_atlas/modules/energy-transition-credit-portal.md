# Energy Transition Credit Portal
**Module ID:** `energy-transition-credit-portal` · **Route:** `/energy-transition-credit-portal` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `DEFAULT_B`, `DEFAULT_BOOK`, `DEFAULT_PCAF`, `DEFAULT_PROBS`, `EditCell`, `EditSelect`, `EditText`, `Field`, `Kpi`, `MatrixTable`, `NGFS_YEARS`, `NON_DEFAULT_RATINGS`, `OFFTAKER_SCORE`, `RATINGS_ALL`, `RATING_COLORS`, `RATING_LADDER`, `RQ_WEIGHTS`, `SA_FALLBACK_RW`, `SCENARIO_IDS`, `SCEN_LABEL`, `SECTORS`, `SECTORS_EXT`, `SelectField`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RATING_LADDER` | 8 | `pdPct`, `cqs` |
| `DEFAULT_BOOK` | 8 | `sector`, `rating`, `ead_m`, `margin_bps`, `lgd_pct`, `tenor_years`, `revenue_m`, `evic_m`, `emissions_tco2`, `data_quality`, `itr_c` |
| `DEFAULT_PCAF` | 5 | `sector`, `outstanding_m`, `evic_m`, `total_equity_debt_m`, `revenue_m`, `emissions_tco2`, `scope3_tco2`, `data_quality`, `itr_c` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(v, d = 1) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;` |
| `fmtNum` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtT` | `(v, d = 0) => (v == null \|\| isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })} t`;` |
| `NON_DEFAULT_RATINGS` | `RATING_LADDER.map((r) => r.rating);` |
| `SECTORS` | `['Solar IPP', 'Wind IPP', 'Hydro IPP', 'Geothermal', 'Storage + Solar hybrid', 'Biomass / WtE', 'Gas CCGT (transition)'];` |
| `SECTORS_EXT` | `[...SECTORS, 'Coal power', 'Oil & Gas', 'Grid / Networks', 'Other'];` |
| `total` | `ppa + merchant + carbon;` |
| `shContract` | `ppa / total, shMerchant = merchant / total, shCarbon = carbon / total;` |
| `sContracted` | `shContract * 100;` |
| `sMerchant` | `Math.max(0, 100 - shMerchant * 100 * (num(merchantVolPct) / 35));` |
| `sCarbon` | `Math.max(0, 100 - shCarbon * 100 * 1.5);` |
| `composite` | `RQ_WEIGHTS.contracted * sContracted + RQ_WEIGHTS.offtaker * sOfftaker` |
| `elBps` | `ead > 0 ? (el / ead) * 10000 : null;` |
| `merchant` | `Math.max(0, num(base.merchantRev) * (1 + (num(gdpBeta) * gdpImpact) / 100));` |
| `carbon` | `Math.max(0, num(base.carbonRev) * (1 + num(carbonPass) * ((carbonPrice - pRef) / pRef)));` |
| `capital` | `rwa * (num(capRatioPct) / 100);` |
| `netBps` | `num(marginBps) - elBps - num(opexBps);` |
| `netIncome` | `(netBps / 10000) * ead;` |
| `rarocPct` | `capital > 0 ? (netIncome / capital) * 100 : null;` |
| `floorBps` | `elBps + num(opexBps) + (num(hurdlePct) / 100) * (num(capRatioPct) / 100) * rw * 10000;` |
| `alpha` | `Math.min(Math.max(c / 100, 0), 1);` |
| `csv` | `rows.map((r) => r.map((c) => {` |
| `blob` | `new Blob([csv], { type: 'text/csv;charset=utf-8;' });` |
| `maturity` | `Math.min(Math.max(num(b.tenor), 1), 5); // Basel effective maturity clamp 1-5y` |
| `scenIds` | `(data.scenarios \|\| []).map((s) => s.id);` |
| `stressedPds` | `scenIds.map((sid) => {` |
| `rws` | `await Promise.all(stressedPds.map((pd) => (pd == null ? null` |
| `exposures` | `pcafRows.map((r) => ({` |
| `probSum` | `useMemo(() => SCENARIO_IDS.reduce((s, k) => s + num(probs[k]), 0), [probs]);` |
| `setBookCell` | `(i, k) => (v) => setBook((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));` |
| `setPcafCell` | `(i, k) => (v) => setPcafRows((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));` |
| `addBookRow` | `() => setBook((prev) => (prev.length >= 10 ? prev : [...prev, { name: `Borrower ${prev.length + 1}`, sector: 'Other', rating: 'BBB', ead_m: 100, margin_bps: 250, lgd_pct: 45, tenor_years: 7, revenue_m: 50, evic_m: 250, e` |
| `addPcafRow` | `() => setPcafRows((prev) => (prev.length >= 10 ? prev : [...prev, { name: `Exposure ${prev.length + 1}`, sector: 'Other', outstanding_m: 100, evic_m: 250, total_equity_debt_m: '', revenue_m: 50, emissions_tco2: 50000, sc` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/basel-capital/risk-weight-sa` | `risk_weight_sa` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/risk-weight-irb` | `risk_weight_irb` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-requirement` | `capital_requirement` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/liquidity` | `liquidity` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-adequacy` | `capital_adequacy` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/exposure-classes` | `ref_exposure_classes` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/sa-risk-weights` | `ref_sa_risk_weights` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/irb-parameters` | `ref_irb_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-requirements` | `ref_capital_requirements` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-buffers` | `ref_capital_buffers` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/lcr-parameters` | `ref_lcr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/nsfr-parameters` | `ref_nsfr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/climate-adjustments` | `ref_climate_adjustments` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/regulatory-frameworks` | `ref_regulatory_frameworks` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/operational-risk` | `ref_operational_risk` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/energy-transition/fleet-transition` | `fleet_transition` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/grid-ef-projection` | `grid_ef_projection` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/avoided-emissions` | `avoided_emissions` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/country-comparison` | `country_comparison` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/nze-milestones` | `ref_nze_milestones` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/replacement-options` | `ref_replacement_options` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-countries` | `ref_grid_countries` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-scenarios` | `ref_grid_scenarios` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/transition-credit/ref/pd-term-structure` | `ref_pd_term_structure` | api/v1/routes/transition_credit_analytics.py |
| GET | `/api/v1/transition-credit/ref/climate-multipliers` | `ref_climate_multipliers` | api/v1/routes/transition_credit_analytics.py |
| POST | `/api/v1/transition-credit/climate-matrix` | `climate_matrix` | api/v1/routes/transition_credit_analytics.py |
| POST | `/api/v1/transition-credit/pcaf` | `pcaf` | api/v1/routes/transition_credit_analytics.py |
| POST | `/api/v1/transition-credit/pricing` | `pricing` | api/v1/routes/transition_credit_analytics.py |
| POST | `/api/v1/transition-credit/portfolio` | `portfolio` | api/v1/routes/transition_credit_analytics.py |

### 2.3 Engine `basel_capital_engine` (services/basel_capital_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_norm_cdf` | x | Standard normal cumulative distribution function using math.erf. |
| `_norm_inv` | p | Inverse standard normal CDF (quantile function). Uses the rational approximation by Peter Acklam (2003) which is accurate to approximately 1.15e-9 in the full range (0, 1). Reference: Abramowitz & Stegun, Handbook of Mathematical Functions, refined by P.J. Acklam. |
| `BaselCapitalEngine.calculate_sa_risk_weight` | exposure_class, credit_quality_step, secured_by_property | Return SA risk weight as decimal for a given exposure class and CQS. Parameters ---------- exposure_class : str One of the 13 CRR Art. 112 exposure class IDs. credit_quality_step : int 0 = unrated, 1-6 = external credit quality step (ECAI mapping). secured_by_property : str or None If the exposure is "secured_immovable_property", specify "residential" or "commercial" to select the appropriate weig |
| `BaselCapitalEngine.calculate_irb_risk_weight` | pd, lgd, maturity, exposure_class | Calculate IRB risk weight per CRR Article 153 (corporate formula). Implements: R = 0.12 * f(PD) + 0.24 * (1 - f(PD)) where f(PD) = (1 - e^{-50*PD}) / (1 - e^{-50}) b = (0.11852 - 0.05478 * ln(PD))^2 K = [LGD * N(sqrt(1/(1-R)) * G(PD) + sqrt(R/(1-R)) * G(0.999)) - PD * LGD] * (1 + (M - 2.5) * b) / (1 - 1.5 * b) RW = K * 12.5 Parameters ---------- pd : float Probability of Default, range (0, 1). lgd |
| `BaselCapitalEngine._irb_retail_rw` | pd, lgd, subclass | IRB risk weight for retail exposures (CRR Art 154), routed by sub-class: - residential_mortgage : R = 0.15 fixed (Art 154(3)) - qualifying_revolving / qrre : R = 0.04 fixed (Art 154(4)) - other_retail : R = 0.03·f(PD) + 0.16·(1-f(PD)), f uses the -35 exponent (Art 154(1)) No maturity adjustment applies to any retail sub-class. |
| `BaselCapitalEngine.calculate_operational_risk_rwa` | business_indicator, average_annual_losses | Calculate operational risk RWA using the Standardised Measurement Approach. Parameters ---------- business_indicator : float BIC = ILDC + SC + FC (EUR). average_annual_losses : float 10-year average annual operational losses (EUR). Returns ------- float Operational risk RWA (capital charge * 12.5). |
| `BaselCapitalEngine.calculate_capital_requirement` | entity_name, reporting_date, exposures, capital, approach, climate_adjusted, buffers, market_risk_rwa | Calculate full capital adequacy per CRR Article 92. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). exposures : list[dict] Each dict: counterparty_name, exposure_class, ead_eur, pd (0-1), lgd (0-1), maturity_years, credit_quality_step (0-6), sector (NACE letter), physical_risk_zone (optional: high_risk/medium_risk/low_risk), is_green (op |
| `BaselCapitalEngine.calculate_liquidity` | entity_name, reporting_date, assets, liabilities | Calculate LCR and NSFR per BCBS d295/d396. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). assets : dict Keys: level1_hqla, level2a_assets, level2b_assets, residential_mortgages, retail_loans, wholesale_loans, corporate_loans_lt1yr, corporate_loans_gt1yr, other_assets, sovereign_bonds_cqs2, fixed_assets, sme_loans. liabilities : dict Key |
| `BaselCapitalEngine.run_capital_adequacy` | entity_name, reporting_date, exposures, capital, assets, liabilities, approach, climate_scenarios | Run full capital adequacy assessment: credit + liquidity + climate stress. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). exposures : list[dict] Credit exposures (see calculate_capital_requirement). capital : dict Capital components (see calculate_capital_requirement). assets : dict HQLA / asset composition (see calculate_liquidity). li |
| `BaselCapitalEngine._score_bcbs239` | exposures, capital, assets, liabilities | Score BCBS 239 compliance (0-100) based on data completeness. Principles assessed: 1. Governance (10 pts) — capital dict completeness 2. Data architecture (15 pts) — exposure field coverage 3. Accuracy (20 pts) — PD/LGD/CQS populated 4. Completeness (20 pts) — sector / maturity / physical risk coverage 5. Timeliness (10 pts) — assumed OK (static assessment) 6. Adaptability (10 pts) — climate field |
| `BaselCapitalEngine._generate_pillar2_recommendations` | cap, liq, climate | Generate Pillar 2 supervisory recommendations. |
| `BaselCapitalEngine._determine_rag_status` | cap, liq | Determine overall RAG status. GREEN: All ratios above minimum + combined buffer AMBER: All ratios above minimum but at least one below combined buffer RED: At least one ratio below regulatory minimum |
| `BaselCapitalEngine.get_exposure_classes` |  | Return CRR Article 112 exposure class definitions. |
| `BaselCapitalEngine.get_sa_risk_weights` |  | Return Standardised Approach CQS-to-risk-weight mapping tables. |
| `BaselCapitalEngine.get_irb_parameters` |  | Return IRB formula parameters per CRR Article 153. |
| `BaselCapitalEngine.get_capital_requirements` |  | Return minimum capital ratio requirements per CRR Article 92. |
| `BaselCapitalEngine.get_capital_buffers` |  | Return capital buffer requirements per CRD V. |
| `BaselCapitalEngine.get_lcr_parameters` |  | Return LCR parameters per BCBS d295 / CRR Art. 412. |
| `BaselCapitalEngine.get_nsfr_parameters` |  | Return NSFR parameters per BCBS d396 / CRR II Art. 428a. |
| `BaselCapitalEngine.get_climate_adjustments` |  | Return climate risk capital adjustment parameters per EBA GL/2022/02. |
| `BaselCapitalEngine.get_regulatory_frameworks` |  | Return regulatory framework references. |
| `BaselCapitalEngine.get_operational_risk_parameters` |  | Return SMA operational risk parameters per BCBS d563. |

### 2.3 Engine `generation_transition` (services/generation_transition.py)
| Function | Args | Purpose |
|---|---|---|
| `GenerationTransitionPlanner.plan_transition` | fleet_name, plants, target_year, replacement_tech, carbon_price_eur_t, base_year | Generate a fleet transition plan. |
| `GenerationTransitionPlanner._auto_replace` | fuel_type | Select replacement technology based on original fuel type. |
| `GenerationTransitionPlanner._interpolate_nze` | year, base_emissions, base_year | Interpolate NZE target emissions for a given year. |
| `GenerationTransitionPlanner.get_fuel_types` |  |  |
| `GenerationTransitionPlanner.get_nze_milestones` |  |  |
| `GenerationTransitionPlanner.get_replacement_options` |  |  |

**Engine `generation_transition` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `REPLACEMENT_PRIORITY` | `['solar_pv', 'wind_onshore', 'wind_offshore', 'battery', 'gas_ccgt', 'gas_ccgt_ccs', 'hydro', 'nuclear']` |

### 2.3 Engine `grid_ef_trajectory` (services/grid_ef_trajectory.py)
| Function | Args | Purpose |
|---|---|---|
| `GridEFTrajectoryEngine.project_grid_ef` | country, scenario, start_year, end_year | Project grid EF trajectory for a country under a scenario. |
| `GridEFTrajectoryEngine.avoided_emissions` | country, scenario, annual_generation_mwh, start_year, project_lifetime_years | Calculate avoided emissions for a renewable project. |
| `GridEFTrajectoryEngine.compare_countries` | countries, scenario | Compare grid EF trajectories across countries. |
| `GridEFTrajectoryEngine._interpolate_ef` | year, ef_base, scen, base_year | Interpolate grid EF for a given year using scenario target factors. |
| `GridEFTrajectoryEngine.get_countries` |  |  |
| `GridEFTrajectoryEngine.get_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `functools` *(shared)*, `pathlib` *(shared)*, `pydantic` *(shared)*, `renewable` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DEFAULT_BOOK`, `DEFAULT_PCAF`, `NGFS_YEARS`, `RATINGS_ALL`, `RATING_LADDER`, `SECTORS`, `SECTORS_EXT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_keys': 14}`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**POST /api/v1/energy-transition/avoided-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/country-comparison** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/fleet-transition** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `basel_capital_engine` — extracted transformation lines:**
```python
a1 = -3.969683028665376e+01
a2 = 2.209460984245205e+02
a3 = -2.759285104469687e+02
a4 = 1.383577518672690e+02
a5 = -3.066479806614716e+01
a6 = 2.506628277459239e+00
b1 = -5.447609879822406e+01
b2 = 1.615858368580409e+02
b3 = -1.556989798598866e+02
b4 = 6.680131188771972e+01
b5 = -1.328068155288572e+01
c1 = -7.784894002430293e-03
c2 = -3.223964580411365e-01
c3 = -2.400758277161838e+00
c4 = -2.549732539343734e+00
c5 = 4.374664141464968e+00
c6 = 2.938163982698783e+00
d1 = 7.784695709041462e-03
d2 = 3.224671290700398e-01
d3 = 2.445134137142996e+00
d4 = 3.754408661907416e+00
p_high = 1.0 - p_low
q = math.sqrt(-2.0 * math.log(p))
q = math.sqrt(-2.0 * math.log(1.0 - p))
0 = unrated, 1-6 = external credit quality step (ECAI mapping).
R  = 0.12 * f(PD) + 0.24 * (1 - f(PD))   where f(PD) = (1 - e^{-50*PD}) / (1 - e^{-50})
b  = (0.11852 - 0.05478 * ln(PD))^2
K  = [LGD * N(sqrt(1/(1-R)) * G(PD) + sqrt(R/(1-R)) * G(0.999)) - PD * LGD]
```

**Engine `generation_transition` — extracted transformation lines:**
```python
p.annual_generation_mwh = p.capacity_mw * 8760 * p.capacity_factor_pct / 100
years_available = target_year - base_year
retire_year = base_year + int((i + 1) * years_available / num_fossil) if num_fossil > 0 else base_year
age = retire_year - plant.commissioning_year
co2_avoided = plant.annual_generation_mwh * ef
remaining_life = max(0, plant.commissioning_year + expected_life - retire_year)
stranded_frac = remaining_life / expected_life if expected_life > 0 else 0
stranded_value = plant.book_value_eur * stranded_frac
rep_cap = plant.capacity_mw * multiplier
yr_emissions = current_emissions - cumulative_saved
frac = (year - y0) / (y1 - y0) if y1 > y0 else 0
ef_yr = ef0 + (ef1 - ef0) * frac
```

**Engine `grid_ef_trajectory` — extracted transformation lines:**
```python
reduction = (1 - ef_2050 / ef_base) * 100 if ef_base > 0 else 0
yr = start_year + i
avoided = annual_generation_mwh * ef
avg_ef = ef_sum / project_lifetime_years if project_lifetime_years > 0 else 0
frac = (year - base_year) / (2030 - base_year) if 2030 > base_year else 0
factor = 1 + (f_2030 - 1) * frac
frac = (year - 2030) / 20
factor = f_2030 + (f_2050 - f_2030) * frac
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **10** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 4 modules), `grid_ef_trajectory` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-dashboard` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-analytics` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-lending` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `module-navigator` | table:functools, table:pathlib |
| `infra-debt-portfolio-manager` | table:functools, table:pathlib |
| `sanctions-climate-finance` | table:pathlib |
| `platform-analytics` | table:pathlib |
| `sanctions-trade-monitor` | table:pathlib |
| `sanctions-screening-desk` | table:pathlib |
| `sanctions-watchlist` | table:pathlib |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`energy-transition-credit-portal` composes **two** distinct backend
surfaces behind one 5-tab frontend (`EnergyTransitionCreditPortalPage.jsx`,
1,817 lines): (1) a **client-side revenue-quality credit scorecard** (Single
Borrower tab) that maps a project's PPA/merchant/carbon revenue mix to an
implied rating and then calls the *live* `basel_capital` IRB/SA engine and
the seeded NGFS scenario extract for capital and stress pricing; and (2) the
**new** `transition_credit_analytics.py` engine (931 lines, `POST
/lifetime-el`, `/climate-matrix`, `/pcaf`, `/pricing`, `/portfolio`) that
powers the Single Borrower lifetime-ECL panel plus the Portfolio, Climate
Matrix, PCAF & Disclosure, and Pricing Lab tabs. The backend docstring states
the design goal directly: "NO PRNG anywhere — every figure is a documented
closed-form mapping of the inputs and the hand-authored reference tables...
all exposed via the `/ref/*` endpoints."

### 7.2 PD term structure & IFRS 9-style lifetime ECL

```python
def cum_pd_curve(rating, years=10):
    # linear interpolation between hand-authored anchors at years 1/3/5/7/10; flat beyond 10
def lifetime_el_rows(marginal_pds, lgd, eads, rate):
    for t, (mpd, e) in enumerate(zip(marginal_pds, eads), start=1):
        df = (1.0 + rate) ** -(t - 0.5)          # mid-year discounting
        el = mpd * lgd * e * df
```
(lines 239–288). `ecl_12m = rows[0]["el"]` (stage-1, year-1 marginal PD only)
vs `ecl_lifetime = sum(r["el"] for r in rows)` (stage-2, full tenor) — the
exact IFRS 9 12-month-vs-lifetime ECL contrast (`/lifetime-el` endpoint,
lines 509–530).

**Worked example (BBB, 5-year tenor, bullet EAD $420M, LGD 45%, discount
6%):** anchors `[0.17, 0.75, 1.44, 2.08, 2.94]%` at years `[1,3,5,7,10]`.
Linear interpolation gives cumulative PD `[0.17%, 0.46%, 0.75%, 1.095%,
1.44%]` for years 1–5 (year 2 interpolates halfway between the year-1 and
year-3 anchors: `0.17 + 0.5×(0.75−0.17) = 0.46`; year 4 halfway between
year-3 and year-5: `0.75 + 0.5×(1.44−0.75) = 1.095`). Marginal PDs:
`[0.17%, 0.29%, 0.29%, 0.345%, 0.345%]`.

| t | marginal PD | DF = 1.06⁻⁽ᵗ⁻⁰·⁵⁾ | EL = mPD×0.45×420×DF ($M) |
|---|---|---|---|
| 1 | 0.170% | 0.97129 | 0.3121 |
| 2 | 0.290% | 0.91631 | 0.5022 |
| 3 | 0.290% | 0.86444 | 0.4739 |
| 4 | 0.345% | 0.81551 | 0.5318 |
| 5 | 0.345% | 0.76935 | 0.5017 |

**ECL₁₂ₘ (stage 1) = $0.3121M**; **ECL_lifetime (stage 2, 5y) =
0.3121+0.5022+0.4739+0.5318+0.5017 = $2.3215M** — a **lifetime-to-12-month
ratio of 7.44x**, i.e. recognizing full lifetime ECL on a Stage-2 asset
raises the loss allowance roughly seven and a half times over the 12-month
Stage-1 figure for this rating/tenor/discount combination, purely from the
term-structure shape (marginal PD roughly doubles by year 5) plus five years
of exposure instead of one.

### 7.3 Climate-adjusted transition matrix — the analytical core

The baseline annual migration matrix (`BASELINE_MATRIX_PCT`, 8×8 including
absorbing `D`) is hand-authored to approximate S&P's 1981-2023 NR-adjusted
global corporate transition study; its default column is asserted to equal
the desk's own 1-yr PD ladder. The climate overlay:

```python
def stress_matrix(multiplier):
    for i, row in ...:
        upgrades = sum(row[j] for j in range(0, i))
        downgrades = [row[j] * multiplier for j in range(i+1, len(RATINGS))]
        available = 1.0 - upgrades
        if sum(downgrades) > available:            # cap: rescale so mass never goes negative
            downgrades = [d * available/sum(downgrades) for d in downgrades]
        new_row = upgrades_unchanged + [available - sum(downgrades)] + downgrades   # diagonal absorbs
```
(lines 185–218) — every downgrade cell (including default) is scaled by a
scenario×sector multiplier; the diagonal absorbs the difference so each row
still sums to exactly 1 (asserted at runtime), with a proportional cap so
extreme multipliers can never push a cell negative. `NGFS scenario ×
climate-exposure-class` multipliers (`CLASS_MULTIPLIERS`) range from 0.85
(green generators, Net Zero 2050 — an orderly-transition tailwind) to 3.60
(fossil_high sectors, Delayed Transition — the disorderly scenario hits
carbon-intensive borrowers hardest).

**Toy 3×3 hand-trace** (a simplified 3-state analog of the real 8-state
engine — states A / BBB / D, since the full matrix is too large to trace by
hand):
```
Baseline M:      A→[0.90, 0.08, 0.02]   BBB→[0.05, 0.85, 0.10]   D→[0, 0, 1]
```
Starting at `A` (`v₀ = [1,0,0]`), evolve `v_t = v_{t-1} @ M`:
```
v1 = [0.90, 0.08, 0.02]
v2[A]   = 0.90×0.90 + 0.08×0.05 + 0.02×0   = 0.8140
v2[BBB] = 0.90×0.08 + 0.08×0.85 + 0.02×0   = 0.1400
v2[D]   = 0.90×0.02 + 0.08×0.10 + 0.02×1   = 0.0460     (sums to 1.000 ✓)
```
**Baseline cumulative PD(2y) = 4.60%.** Now apply a climate multiplier
`m=1.5` to row A (`i=0`, no upgrades since it's the best rating): downgrades
`[0.08×1.5, 0.02×1.5] = [0.12, 0.03]`, total `0.15 ≤ available(1.0)`, no cap
needed; diagonal `= 1−0.15 = 0.85` ⇒ stressed row A `= [0.85, 0.12, 0.03]`.
Row BBB (`i=1`): upgrades `= row[0] = 0.05`; downgrades `=
[0.10×1.5]=[0.15]`, available `= 1−0.05 = 0.95 ≥ 0.15`; diagonal `=
0.95−0.15 = 0.80` ⇒ stressed row BBB `= [0.05, 0.80, 0.15]`. Evolving the
**stressed** matrix from `A`:
```
v1_stress = [0.85, 0.12, 0.03]
v2_stress[A]   = 0.85×0.85 + 0.12×0.05 + 0.03×0 = 0.7285
v2_stress[BBB] = 0.85×0.12 + 0.12×0.80 + 0.03×0 = 0.1980
v2_stress[D]   = 0.85×0.03 + 0.12×0.15 + 0.03×1 = 0.0735  (sums to 1.000 ✓)
```
**Stressed cumulative PD(2y) = 7.35%** vs baseline **4.60%** — a 1.5x
per-cell multiplier compounds to roughly a **1.6x cumulative PD outcome**
over just two years purely through the matrix-power mechanic (each year's
extra downgrade mass is itself exposed to a second year of stressed
downgrade probability). This is exactly the compounding effect the engine's
real 8-state, 10-year evolution captures at full scale.

### 7.4 PCAF financed emissions

```python
af = min(e.outstanding_m / denom, 1.0)             # denom = EVIC (1a) or total equity+debt (1b)
fin12 = af * e.emissions_tco2
```
(lines 605–663) with an automatic basis fallback (uses whichever of EVIC/
total-equity-debt is supplied, warns if it had to substitute), an ITR proxy
that defaults to a hand-authored sector table when the borrower doesn't
supply one, and outstanding-weighted portfolio WACI, data quality and ITR.

### 7.5 Sustainability-adjusted pricing

Climate-adjusted RAROC probability-weights `annualized_el_bps` across all
six NGFS scenarios using the user's own scenario probabilities (must sum to
1, ±0.01, else `422`). The carbon-cost margin-erosion panel reads **live
seeded NGFS Phase 5 carbon prices** (`_ngfs_carbon_prices`, cached from
`backend/data/ngfs_phase5_extract.json`) and links absorbed carbon cost to a
coverage-based notch downgrade: `1 notch down per 20% relative ICR
deterioration, capped at 4` (lines 720–726) — a documented, hand-authored
agency-coverage-band approximation, not a live rating action. The green-
supporting/penalizing risk-weight panel is explicitly framed
"POLICY-DEBATE WHAT-IF, not current law." The SLL margin-ratchet computes an
`expected_adjustment_bps = p_meet×(−step_down) + (1−p_meet)×step_up`,
discounted mid-year at the EIR across the EAD profile.

### 7.6 Portfolio mode + TCFD/ISSB disclosure

Book-level EL/RAROC aggregate per-borrower 1-year EL (`PD_ladder × LGD ×
EAD`) and SA-risk-weight capital; scenario book EL sums each borrower's
lifetime EL under each of the six stressed matrices; an OLS
(`margin_bps ~ financed-emissions intensity`) tests whether the book
actually prices transition risk (positive slope + meaningful R² = pricing
reflects risk; flat/negative = a mispricing candidate — the engine computes
this from first principles, no library, using the standard
`Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²` slope and `R² = (Σxy)²/(Σxx·Σyy)` formulas). HHI
concentration is computed on both sector and rating EAD shares. The TCFD/
ISSB panel's `climate_var_proxy` is explicitly labeled: "Scenario
lifetime-EL range across the six NGFS scenarios (max − min)... not a
distributional VaR."

### 7.7 The frontend's own client-side credit scorecard (Single Borrower tab)

Distinct from the backend engine, the Single Borrower tab runs a **local**
revenue-quality composite:
```js
const sContracted = shContract * 100;
const sMerchant = Math.max(0, 100 - shMerchant*100*(merchantVolPct/35));
const sCarbon = Math.max(0, 100 - shCarbon*100*1.5);
const composite = RQ_WEIGHTS.contracted*sContracted + RQ_WEIGHTS.offtaker*sOfftaker
                + RQ_WEIGHTS.merchant*sMerchant + RQ_WEIGHTS.carbon*sCarbon;
const rating = scoreToRating(composite);   // capped at 'A' — project borrowers rarely rate above A
```
(`revenueQuality`/`scoreToRating`, lines 122–207), weights
`{contracted:0.40, offtaker:0.25, merchant:0.20, carbon:0.15}`. The resulting
rating's PD/CQS (from a client-side `RATING_LADDER` explicitly noted to use
the **same** year-1 PD values as the backend's anchors) then feeds live
calls to `POST /basel-capital/risk-weight-irb` and `/risk-weight-sa` for
capital, and — under an NGFS scenario re-run — the same revenue-quality
function is re-evaluated on scenario-stressed merchant/carbon revenue
(`stressRevenues`, lines 219–227) to produce a scenario-conditional rating
and re-priced Basel risk weight. This is a genuinely separate, documented
scoring layer from the `transition_credit_analytics.py` engine — the two
coexist on the same tab by design (client-side scorecard for a single
illustrative borrower's revenue mix; server-side engine for the PD-term-
structure, climate-matrix, PCAF and portfolio depth).

### 7.8 Data provenance & limitations

- **All PD anchors and the migration matrix are hand-authored approximations**
  of the S&P Global "Default, Transition and Recovery" 1981-2023 study —
  explicitly labeled "APPROXIMATE — refresh from the published study for
  production" on both `/ref/pd-term-structure` and `/ref/transition-matrix`.
- **NGFS scenario×sector multipliers are a hand-authored judgment overlay**
  "in the spirit of NGFS/ECB climate stress-test practice," not a published
  NGFS multiplier table — editable per-request via `multiplier_override`.
- **NGFS carbon prices are a seeded Phase 5 extract** (IIASA Scenario
  Explorer, CC BY 4.0) — a real but static, approximate snapshot, not a live
  feed.
- **ICR-to-notch elasticity (20% relative deterioration per notch, capped at
  4) is a hand-authored approximation** of agency coverage-band medians, not
  a calibrated transition matrix.
- **Green-supporting/penalizing RW panel is explicitly a policy-debate
  sensitivity**, not current Basel law.
- **The Single-Borrower client-side scorecard and the backend engine use
  independent but internally consistent PD ladders** (explicitly cross-
  checked in the frontend header comment) — a reader should not mistake the
  two for the same computation path; the scorecard drives Basel IRB/SA
  pricing on the illustrative borrower, while the backend engine drives the
  portfolio/climate-matrix/PCAF/pricing-lab tabs.
- No guide/code mismatch found: the atlas spec ("Integrated single-borrower
  credit view: PPA-backed project loan + carbon revenue + merchant exposure
  → PD/LGD/EL, Basel RWA + RAROC pricing floor, NGFS scenario deltas")
  matches the Single Borrower tab; the four *additional* tabs (Portfolio,
  Climate Matrix, PCAF & Disclosure, Pricing Lab) built on the new
  `transition_credit_analytics.py` engine go well beyond that original scope.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Provide a climate-conditioned IFRS 9 credit-risk
platform for energy-transition lending — single-borrower and book-level
PD/EL, a climate-stressed rating-migration matrix with multi-year
distribution evolution, PCAF-compliant financed-emissions attribution, and
sustainability-adjusted RAROC/pricing — for banks pricing and provisioning
transition-exposed credit books under IFRS 9 and preparing TCFD/ISSB
climate-risk disclosures.

**8.2 Conceptual approach.** A single hand-authored PD term structure and
migration matrix anchor every downstream calculation (lifetime ECL, climate
stress, portfolio EL), so the static (12-month/lifetime) and
climate-conditioned views are always mutually consistent by construction —
the migration matrix's default column is asserted equal to the PD ladder's
year-1 values. Climate risk enters through a single, auditable mechanism (a
downgrade-cell multiplier with diagonal absorption, row-stochasticity
enforced by assertion) rather than a black-box scenario model, so every
NGFS scenario × sector combination reduces to one documented multiplier the
user can override. PCAF attribution and RAROC/pricing reuse the same
lifetime-EL machinery so the portfolio-level and single-borrower views never
diverge in methodology, only in inputs.

**8.3 Mathematical specification.**
```
Cum_PD(rating, t) = linear interp of hand-authored anchors at t∈{1,3,5,7,10}; flat beyond 10
Marginal_PD_t = Cum_PD(t) − Cum_PD(t−1)
EL_t = marginal_PD_t × LGD × EAD_t × (1+rate)^-(t−0.5)                 (mid-year discounting)
ECL_12m = EL_1;  ECL_lifetime = Σ_t EL_t
Stress_matrix(M, mult): for each row i, downgrade cells (j>i) × mult (capped to available mass),
                        diagonal = 1 − upgrades − Σ downgrades           (row-stochastic, asserted)
v_t = v_{t-1} @ M_stressed  (matrix powers on one-hot start vector, each v_t asserted Σ=1)
Marginal default mass_t = v_t[D] − v_{t-1}[D];  scenario lifetime EL = Σ_t (that mass) × LGD × EAD_t × DF_t
PCAF: attribution_factor = min(outstanding/EVIC, 1);  financed_emissions = factor × borrower_emissions
RAROC = (margin_bps − EL_bps − opex_bps)/10^4 × EAD / (RW × EAD × capital_ratio)
Climate RAROC = RAROC using Σ_scenario P(scenario) × EL_bps(scenario)     (probability-weighted)
Carbon margin erosion = emissions × max(P_scenario − P_today, 0) × absorption_share / EAD
OLS: margin_bps ~ β·(financed emissions intensity) + α                    (closed-form least squares)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cumulative PD anchors (7 ratings × 5 tenors) | `CUM_PD_ANCHORS_PCT` | Hand-authored approximation, S&P Global 1981-2023 study |
| Baseline migration matrix (8×8) | `BASELINE_MATRIX_PCT` | Hand-authored approximation, S&P 1981-2023 NR-adjusted transition study |
| NGFS scenario × sector-class multipliers | `CLASS_MULTIPLIERS` | Hand-authored judgment overlay, NGFS/ECB stress-test spirit |
| NGFS carbon prices | seeded Phase 5 extract | IIASA Scenario Explorer, CC BY 4.0 (real, static snapshot) |
| ICR-to-notch elasticity | 20%/notch, cap 4 | Hand-authored approximation of agency coverage-band medians |
| SA risk weights by rating | `SA_RW_BY_RATING` | Basel CRE20.16 / CRR Art 122 (real, hand-transcribed) |
| PCAF data-quality ladder | `PCAF_DQ_LADDER` | PCAF Global GHG Standard Part A, Table 5-2 (paraphrased) |
| Sector default ITR proxies | `SECTOR_ITR_DEFAULT` | Hand-authored, labeled proxy (used only if borrower ITR absent) |

**8.4 Data requirements.** Rating, LGD, EAD, tenor and amortization profile
for lifetime ECL; scenario, sector and rating for the climate matrix;
per-exposure outstanding/EVIC-or-total-equity-debt/emissions/data-quality/
ITR for PCAF; margin, opex, capital ratio, hurdle, scenario probabilities,
EBITDA/interest (for the carbon-coverage link), and SLL KPI terms for
pricing; a borrower list (sector/rating/EAD/margin/LGD/tenor/revenue/EVIC/
emissions/data-quality) for portfolio mode.

**8.5 Validation & benchmarking.** `/ref/pd-term-structure`,
`/ref/transition-matrix` and `/ref/climate-multipliers` expose every
hand-authored table for direct comparison against a bank's own agency
subscription or internal transition-risk framework. Runtime assertions
(row-stochasticity of both baseline and stressed matrices, distribution-path
sums to 1 at every evolution year, PCAF attribution consistency) function as
regression guards rather than external validation. Production validation
would compare the climate-stressed transition matrix and NGFS multiplier
table against a live NGFS/ECB climate stress-test parameterization and
refresh the carbon-price extract from a live IIASA feed.

**8.6 Limitations & model risk.** The PD anchors and migration matrix are
hand-authored approximations, not licensed agency data — both are explicitly
labeled for refresh before production use. The climate-stress mechanism
(uniform downgrade-cell multiplier per scenario×sector class) is a
first-order approximation of genuinely idiosyncratic transition risk — real
borrowers within a sector class vary far more than a single multiplier can
capture. The ICR-to-notch coverage elasticity and the green-supporting/
penalizing RW panel are explicitly labeled hand-authored/policy-debate
sensitivities, not calibrated or current-law figures. The client-side Single
Borrower revenue-quality scorecard uses a different code path (frontend JS)
from the server-side engine, sharing only the underlying PD ladder values —
a reader must not conflate the two when tracing a specific number back to
its source. The TCFD "climate-VaR proxy" is a scenario-range heuristic, not
a true probabilistic Value-at-Risk.

**Framework alignment:** IFRS 9 §5.5 (12-month vs lifetime ECL, stage
migration) · S&P Global "Default, Transition and Recovery" long-term
corporate studies (approximated) · NGFS Phase 5 scenario framework (real
carbon-price extract; hand-authored downgrade-multiplier overlay) · PCAF
Global GHG Accounting and Reporting Standard, Part A · Basel CRE20.16/CRR
Art 122 SA risk weights (real) · TCFD Metrics & Targets / ISSB IFRS S2
disclosure structure.

## 9 · Future Evolution

### 9.1 Evolution A — Persist the loan book and calibrate the climate multipliers (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's most complete verticals: the page drives a real Basel engine (SA risk weights per CRR Art. 112, the full IRB Art. 153 formula with Acklam's inverse-normal, SMA op-risk, LCR/NSFR, BCBS 239 scoring) plus the transition-credit engine (climate PD matrix, PCAF, RAROC pricing with floor economics) — ~30 endpoints, scenario-probability weighting in the UI, editable borrower book. The gaps are persistence and calibration: the book lives in page state (10-row cap, `DEFAULT_BOOK` seed), and the climate PD multipliers and revenue-quality weights (`RQ_WEIGHTS`, offtaker scores) are authored parameters with no empirical anchor.

**How.** (1) Persist: `tc_loan_books` / `tc_book_positions` tables so a desk's book survives sessions, with org-scoped RBAC and an audit trail on edits (a pricing tool without an audit trail can't face a credit committee). (2) Calibrate: the climate multipliers in `ref/climate-multipliers` get sourced anchors — rating-agency transition-risk rating-migration studies and the EBA GL/2022/02 parameters the Basel engine already references — with provenance in the ref payload; the merchant/carbon revenue-quality haircuts validated against observed IPP margin data where public. (3) Bench: pin the IRB formula (a worked CRR Art. 153 example), the RAROC floor arithmetic, and one full scenario-weighted stress into `bench_quant.py` — this module's math is exactly what the pin regime exists to protect. (4) Book-level lineage: the scenario-probability sum check (`probSum`) becomes a server-side validation.

**Prerequisites.** Alembic migration; decision on multi-desk book sharing semantics. **Acceptance:** a saved book reloads identically; the IRB pin reproduces the CRR worked example to 1e-6; every climate multiplier row cites a source; edits appear in the audit log.

### 9.2 Evolution B — Deal-pricing analyst over the full capital stack (LLM tier 2)

**What.** A tool-calling analyst for the portal's core loop: "price a $150M BB solar-IPP loan, 7y tenor, 60% contracted — what margin clears the 12% RAROC hurdle across the scenario set, and what does it do to portfolio capital?" It chains the existing endpoints — `POST /transition-credit/pricing` → `/climate-matrix` for stressed PDs → `/basel-capital/risk-weight-irb` → `/capital-requirement` → `/transition-credit/portfolio` — and drafts the pricing memo with the floor decomposition (EL bps + opex + capital charge) exactly as the engine computes it.

**How.** Tool schemas auto-generated from the three route files' OpenAPI specs (all Pydantic-typed; this module is the platform's best tier-2 candidate by endpoint readiness). Grounding corpus = this Atlas record's engine docstrings — the CRR/BCBS citations in them make regulatory explanations verifiable. Book mutations (adding the priced position) gate behind explicit confirmation. The validator covers bps, RW%, and RAROC figures; scenario probabilities must sum to 1 before any stress narration, mirroring the UI's own check.

**Prerequisites.** Evolution A's persistence (so priced deals land in a durable book); prompt-cached ref-data responses (the SA tables and buffers are stable). **Acceptance:** a golden pricing memo reproduces a scripted endpoint chain exactly, floor components summing to the quoted floor; asking for a Pillar 2 capital *decision* (supervisory judgment) refuses and quotes the engine's recommendation field instead.