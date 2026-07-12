# Green Hydrogen Project Finance
**Module ID:** `hydrogen-project-finance` · **Route:** `/hydrogen-project-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DS2 · **Sprint:** DS

## 1 · Overview
Project finance waterfall for green hydrogen assets covering electrolyser, compression, storage and distribution CAPEX with H2 price scenario analysis and IRR sensitivity to electricity costs.

> **Business value:** Green H2 project finance viability hinges on secured offtake at >$4/kg and PPA electricity <$40/MWh; DSCR of 1.25x is achievable with 20-year contracts, enabling investment-grade project bonds under BNEF base case assumptions.

**How an analyst works this module:**
- Structure CAPEX waterfall across electrolyser, compression, storage and distribution
- Model H2 offtake price under base ($4/kg), bull ($6/kg) and bear ($2/kg) scenarios
- Run IRR sensitivity grid across electricity price ($20-80/MWh) and capacity factor (40-95%)
- Size project bond (tenor 15-20yr) and calculate DSCR covenant compliance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `next` | `r - f / df;` |
| `opYear` | `y - constructionYears + 1;` |
| `ebitda` | `revenue * (1 - 0.02 * Math.max(0, opYear - 5)) - opex;` |
| `debtAmt` | `capex * debtRatio / 100;` |
| `equityAmt` | `capex * (1 - debtRatio / 100);` |
| `cashflows` | `useMemo(() => buildCashflows({ capex, revenue: revenuePerYear, opex: opexPerYear, debtAmt, debtRate: debtRate / 100, tenor, constructionYears: constructYrs, lifetime }), [capex, revenuePerYear, opexPerYear, debtAmt, debtRate, tenor, constructYrs, lifetime]);` |
| `projectIrr` | `useMemo(() => { const r = irr([-capex, ...cashflows.slice(constructYrs)]);` |
| `projectNpv` | `useMemo(() => +npv(cashflows, wacc / 100).toFixed(1), [cashflows, wacc]);` |
| `equityCashflows` | `useMemo(() => { const cfs = [-equityAmt];` |
| `ebitdaAvg` | `(revenuePerYear - opexPerYear);` |
| `annualDebtService` | `debtAmt * (debtRate / 100) / (1 - Math.pow(1 + debtRate / 100, -tenor));` |
| `cashflowData` | `useMemo(() => cashflows.map((cf, i) => ({` |
| `dscrData` | `useMemo(() => Array.from({ length: tenor }, (_, i) => ({ year: `Y${constructYrs + i + 1}`, ebitda: +(revenuePerYear - opexPerYear).toFixed(1), debtService: +annualDebtService.toFixed(1), dscr: +dscr(revenuePerYear - opexPerYear, annualDebtService).toFixed(2), })), [revenuePerYear, opexPerYear, annualDebtService, tenor, constructYrs]);` |
| `mcData` | `useMemo(() => Array.from({ length: 200 }, (_, i) => { const revShock = 0.8 + sr(i * 17) * 0.4;` |
| `opexShock` | `0.9 + sr(i * 11) * 0.3;` |
| `capexShock` | `0.9 + sr(i * 7) * 0.3;` |
| `adjCapex` | `capex * capexShock;` |
| `adjRev` | `revenuePerYear * revShock;` |
| `adjOpex` | `opexPerYear * opexShock;` |
| `cfs` | `buildCashflows({ capex: adjCapex, revenue: adjRev, opex: adjOpex, debtAmt: adjCapex * debtRatio / 100, debtRate: debtRate / 100, tenor, constructionYears: constructYrs, lifetime });` |
| `subsidyStack` | `useMemo(() => { const h2BankTotal = h2BankSubsidy * annualOutput * 1000 * 10; // 10yr programme const ira45v = 2.0 * annualOutput * 1000 * 10;  // ~$2/kg for tier 1, 10 yr const grantsCapex = capex * 0.3;  // 30% IPCEI grant assumption const totalSubsidy = h2BankTotal + grantsCapex;` |
| `subsidisedCapex` | `capex - grantsCapex;` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/hydrogen/demand-sector` | `demand_sector` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/eu-h2-bank` | `eu_h2_bank` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/cost-trajectory` | `cost_trajectory` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/portfolio` | `portfolio` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/h2-colours` | `ref_h2_colours` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/production-pathways` | `ref_production_pathways` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/country-costs` | `ref_country_costs` | api/v1/routes/hydrogen.py |

### 2.3 Engine `hydrogen_economy_engine` (services/hydrogen_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_annuity_factor` | rate, years | Annuity factor for CAPEX annualisation. |
| `HydrogenEconomyEngine.calculate_lcoh` | entity_id, production_pathway, capacity_mw_el, country_code, capacity_factor_pct, financing_cost_pct, year |  |
| `HydrogenEconomyEngine.assess_rfnbo_compliance` | entity_id, production_pathway, country_code, re_source, hourly_matching, temporal_correlation, year, measured_ghg_intensity_kgco2e_kgh2 |  |
| `HydrogenEconomyEngine.assess_demand_sector` | entity_id, demand_sector, annual_h2_demand_t, country_code, current_fuel_type, green_lcoh_usd_kg |  |
| `HydrogenEconomyEngine.assess_eu_h2_bank` | entity_id, production_pathway, capacity_mw_el, country_code, lcoh_usd_kg, competitive_bid_price_eur_kg |  |
| `HydrogenEconomyEngine.project_cost_trajectory` | entity_id, production_pathway, country_code, base_lcoh_2024_usd_kg |  |
| `HydrogenEconomyEngine.assess_portfolio` | entity_id, projects |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total CAPEX | `Electrolyser+BOP+compression+storage` | BNEF 2023 | Electrolyser typically 40-50% of total CAPEX; BOP and compression add 25-35%. |
| Project IRR | `IRR = solve NPV(FCF)=0` | IEA 2023 | Merchant projects require >10% IRR; contracted offtake with H2 price floor can reach bankable 8-10%. |
| DSCR | `EBITDA/Annual Debt Service` | Project Finance Standard | Lenders typically require minimum DSCR of 1.25x; 1.40x target for investment-grade rating. |
- **H2 spot price forecasts** → → revenue model → **$/kg by year and scenario**
- **Electricity contract** → → LCOH model → **PPA price and volume profile**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/hydrogen/ref/country-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_electricity_costs', 'eu_h2_bank_eligibility', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/h2-colours** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['h2_colours', 'rfnbo_ghg_threshold_kgco2e_kgh2', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/production-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['production_pathways', 'rfnbo_criteria', 'source'], 'n_keys': 3}`

**POST /api/v1/hydrogen/cost-trajectory** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/demand-sector** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/eu-h2-bank** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/lcoh** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Project Finance IRR
**Headline formula:** `IRR: NPV(FCF, r)=0; DSCR=EBITDA/DebtService`

H2 price scenarios ($2-8/kg) drive revenue; electricity cost sensitivity is the primary IRR lever for green H2 projects.

**Standards:** ['BNEF Hydrogen Economy Outlook', 'IEA Project Finance Guidelines', 'Green Bond Principles']
**Reference documents:** BNEF Hydrogen Economy Outlook 2023; IEA Hydrogen Projects Database 2023; Hydrogen Council Project Finance Guidelines

**Engine `hydrogen_economy_engine` — extracted transformation lines:**
```python
r = rate / 100.0
H2_LHV_KWH_PER_KG = 33.33  # kWh/kg LHV
capacity_kw = capacity_mw_el * 1000.0
cf = _clamp(5.0, 95.0, capacity_factor_pct) / 100.0
annual_hours = 8760.0 * cf
annual_h2_kwh = capacity_kw * annual_hours * efficiency
annual_h2_kg = annual_h2_kwh / self.H2_LHV_KWH_PER_KG
annual_h2_t = annual_h2_kg / 1000.0
annual_capex = capex_total_usd * annuity
capex_component = round(annual_capex / max(annual_h2_kg, 1.0), 4)
opex_component = round(annual_opex / max(annual_h2_kg, 1.0), 4)
annual_elec_kwh = capacity_kw * annual_hours
annual_elec_cost = annual_elec_kwh * elec_cost
electricity_component = round(annual_elec_cost / max(annual_h2_kg, 1.0), 4)
lcoh = round(capex_component + opex_component + electricity_component, 4)
doublings_to_year = max(0.0, (year - 2024) / 3.0)
learning_factor = (1.0 - 0.18) ** doublings_to_year
lcoh_adjusted = round(lcoh * learning_factor, 4)
abatement_tco2_pa = round(annual_h2_demand_t * abatement_factor * 10, 2)
green_premium_usd_kg = round(green_premium_base - incumbent_cost, 2)
co2_per_kg_h2_abated = abatement_factor * 10
breakeven_carbon = round(green_premium_usd_kg / max(co2_per_kg_h2_abated, 0.001), 2)
lcoh_eur_kg = round(lcoh_usd_kg * eur_usd, 3)
subsidy_eur_kg = round(_clamp(0.0, max_subsidy, lcoh_eur_kg - target_price), 3)
annual_h2_kg = capacity_mw_el * 1000 * 8760 * 0.30 * 0.70 / self.H2_LHV_KWH_PER_KG
total_subsidy_eur = round(subsidy_eur_kg * annual_h2_kg * 10 / 1e6, 2)  # 10-year contract
gap_to_grid_parity = round(lcoh_eur_kg - target_price, 3)
base_lcoh = 4.0  # reference green-electrolysis LCOH, 2024
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **4** other module(s).
**Shared engines (edits propagate!):** `hydrogen_economy_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `hydrogen-market-intelligence` | engine:hydrogen_economy_engine |
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

This is one of the platform's **genuinely-modelled** finance pages: a green-H₂ project-finance model
with a real discounted-cashflow engine (NPV, Newton-Raphson IRR, DSCR, mortgage-style debt annuity),
a Monte-Carlo risk overlay, subsidy stacking (EU H₂ Bank, IRA §45V, IPCEI grants) and a comparables
table. Code and guide (EP-DS2) agree; no mismatch flag needed.

### 7.1 What the module computes

**Cashflow construction** (`buildCashflows`) — construction drawdown then operating EBITDA less debt:

```js
if (y < constructionYears)  cf = −capex / constructionYears
else {
  opYear  = y − constructionYears + 1
  debtSvc = opYear ≤ tenor ? debtAmt·debtRate / (1 − (1+debtRate)^−tenor) : 0   // level annuity
  ebitda  = revenue·(1 − 0.02·max(0, opYear−5)) − opex                          // 2%/yr degradation after Y5
  cf      = ebitda − debtSvc
}
```

**NPV** and **IRR** (real numerics, not closed-form approximations):

```js
npv = Σ_t  cf_t / (1+rate)^(t+1)
irr : Newton-Raphson,  r ← r − f(r)/f'(r),  f(r)=Σ cf_t/(1+r)^t,  200 iters, 1e-8 tol
```

**DSCR** = EBITDA / annual debt service; **annualDebtService** uses the standard capital-recovery
(annuity) factor `debtAmt·i / (1 − (1+i)^−tenor)`.

### 7.2 Parameterisation (model inputs & assumptions)

| Input | Default | Range (slider) | Note |
|---|---|---|---|
| CAPEX | €800M | — | electrolyser + BOP |
| Electrolyser scale | 100 MW | — | |
| Revenue/yr | €120M | | H₂ offtake × price |
| OPEX/yr | €25M | | |
| Debt ratio | 70% | | gearing |
| Debt rate | 5.5% | | |
| Tenor | 18 yr | | debt amortisation |
| Construction | 3 yr | | |
| Lifetime | 25 yr | | |
| WACC | 9% | | NPV discount |
| H₂ Bank subsidy | €1.0/kg | | 10-yr programme |
| Annual output | 15 000 t/yr | | |

Embedded assumptions (from code comments): **2%/yr revenue degradation after Year 5** (electrolyser
stack ageing proxy), **IRA §45V ≈ $2/kg** for 10 years (Tier-1 credit), **IPCEI grant = 30% of capex**.

### 7.3 Calculation walkthrough

Inputs → `buildCashflows` → `cashflows[]`. Project IRR uses `[−capex, ...cashflows.slice(constructYrs)]`
(i.e. upfront capex then operating cashflows); equity IRR uses `[−equityAmt, ...operating cf]`.
`projectNpv = npv(cashflows, wacc)`. `minDscr` = level EBITDA / annuity debt service. The Monte-Carlo
draws 200 scenarios shocking revenue (×0.8–1.2), opex (×0.9–1.2) and capex (×0.9–1.2) via the seeded
PRNG, rebuilds cashflows and records IRR/NPV, filtering to −50%<IRR<100%. Subsidy stacking computes
H₂ Bank total (`€/kg × t/yr × 1000 × 10yr`), §45V total and the capex grant, then `subsidisedCapex`.

### 7.4 Worked example (defaults)

```
debtAmt   = 800 × 0.70 = €560M ; equity = €240M
annuity i = 0.055, N = 18 → factor = 0.055/(1−1.055^−18) = 0.055/0.6216 = 0.08847
debtSvc   = 560 × 0.08847 = €49.5M/yr
ebitda(Y6)= 120·(1−0.02·1) − 25 = 117.6 − 25 = €92.6M   (Y6 = opYear 4 → no degrade yet; Y10 = opYear 8 → 120·0.94)
DSCR(level) = (120−25)/49.5 = 95/49.5 = 1.92×    (well above 1.25 covenant)
```

So at default inputs the project services debt comfortably (DSCR ≈ 1.9×). Reducing revenue to €70M
(bear H₂ price) drops DSCR to (70−25)/49.5 = **0.91×** — a covenant breach, illustrating the module's
core sensitivity (H₂ offtake price is the binding lever, as the guide states).

### 7.5 Companion analytics

- **DSCR profile** over the debt tenor; **cashflow waterfall** (annual + cumulative).
- **Monte-Carlo** IRR/NPV cloud (200 draws) — the only synthetic element.
- **Subsidy stacking** bar (H₂ Bank + §45V + IPCEI) and grant-adjusted capex.
- **Comparables** — 6 real flagship projects (NEOM/Air Products, HIF Matagorda, Ørsted H2RES, AREH,
  NortH2) with published scale/capex/IRR — a useful reality-check band.

### 7.6 Data provenance & limitations

- The **finance engine is real** — NPV/IRR/DSCR/annuity are correctly implemented; this page is not a
  fabrication. Comparables are real announced projects.
- **Revenue and opex are user inputs, not modelled** — there is no LCOH build-up, no electricity-price
  or capacity-factor link (the guide's "electricity cost is the primary IRR lever" is described but the
  revenue figure is entered directly, not derived from a PPA price × volume stack).
- Degradation is a flat 2%/yr revenue haircut after Y5, not a stack-replacement capex event.
- Monte-Carlo shocks are uniform, independent and seeded (`sr`) — deterministic across renders and
  ignoring correlation between capex and revenue shocks.

**Framework alignment:** standard **project-finance** practice — DSCR covenant ≥1.25× (lenders),
level-payment debt amortisation, unlevered vs equity IRR split · **EU Hydrogen Bank** fixed-premium
auction (€/kg) · **US IRA §45V** production tax credit (up to $3/kg by carbon intensity; the model
uses $2/kg Tier-1) · **IPCEI** capex grant regime. BNEF *Hydrogen Economy Outlook* informs the
comparables band. The engine is sound; the missing piece is an endogenous revenue (LCOH/PPA) model —
noted rather than specified in §8 since the DCF core itself is production-grade.

## 9 · Future Evolution

### 9.1 Evolution A — Endogenous LCOH-driven revenue and correlated risk (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the platform's genuinely-modelled finance pages — real Newton-Raphson IRR, NPV, DSCR, annuity debt service, Monte-Carlo overlay, subsidy stacking. Its documented gaps: revenue (€120M/yr) and opex are direct user inputs with no LCOH build-up, so "electricity cost is the primary IRR lever" is asserted but not wired; degradation is a flat 2%/yr revenue haircut rather than a stack-replacement capex event; and the 200-draw MC uses uniform, independent seeded shocks ignoring capex↔revenue correlation. Evolution A closes all three: revenue derived as `annual_h2_kg × (offtake price + subsidies)` with `annual_h2_kg` from the shared `hydrogen_economy_engine.calculate_lcoh` production math (electricity price and capacity factor become the actual levers), a stack-replacement capex at the electrolyser lifetime-hours boundary, and correlated sampling via the QMC/scenario-matrix pattern already built for the Financial Modeling Studio.

**How.** (1) Move `buildCashflows` server-side as `POST /hydrogen/project-finance` composing the engine's LCOH components with the DCF core — additive to the shared engine (5-module blast radius, §6). (2) Rank-correlated shocks (capex↔revenue via electricity price) replacing independent uniforms. (3) Calibration: the 6-project comparables band (NEOM, HIF Matagorda, AREH…) becomes a §8.5-style sanity check — default-input IRR must fall inside it; the §7.4 worked example (DSCR 1.92×, bear-case 0.91× breach) pins in bench_quant.

**Prerequisites.** None blocking; regression tests on sibling hydrogen modules before the shared-engine merge. **Acceptance:** moving the electricity-price slider changes IRR through the LCOH chain; MC P10–P90 IRR band reported with the correlation matrix disclosed.

### 9.2 Evolution B — Structuring analyst for bankability screening (LLM tier 2)

**What.** A tool-calling analyst for project sponsors and lenders: "at what H₂ price does DSCR breach 1.25×?", "how much EU H₂ Bank subsidy makes this Spanish project investment-grade?", "compare 70/30 vs 60/40 gearing at 6.5% debt." These are root-finding and comparison loops over the DCF — mechanical once the model is a backend endpoint, and dangerous as LLM arithmetic, which is exactly what tier 2 prevents.

**How.** Tool schemas over the Evolution A `POST /hydrogen/project-finance` route plus the existing `/eu-h2-bank` endpoint (its `subsidy_eur_kg`/`total_subsidy_eur` fields answer the subsidy questions directly). Breakeven questions execute as bisection over repeated tool calls, with the answer showing the bracketing points. System prompt grounded in this page's §7.2 defaults table and §7.6 caveats — the analyst must flag that MC shocks are screening-grade and that IRA §45V is modelled at the $2/kg Tier-1 rate, not the full $3/kg schedule. Covenant answers quote the 1.25×/1.40× thresholds from §4.1's cited project-finance standards.

**Prerequisites.** Evolution A's backend route (the DCF currently lives only in the frontend, so there is nothing to tool-call yet); Phase 2 tool-calling infrastructure. **Acceptance:** a breakeven answer's bisection trail is fully logged; every IRR/DSCR figure matches a tool response to the reported precision.