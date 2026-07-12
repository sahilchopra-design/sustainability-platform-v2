# Api::Unified_Valuation
**Module ID:** `api::unified_valuation` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/valuation/calculate` | `calculate_valuation` | api/v1/routes/unified_valuation.py |
| POST | `/api/v1/valuation/sensitivity` | `run_sensitivity_analysis` | api/v1/routes/unified_valuation.py |
| POST | `/api/v1/valuation/batch` | `batch_valuations` | api/v1/routes/unified_valuation.py |
| GET | `/api/v1/valuation/schema/{asset_class}` | `get_input_schema` | api/v1/routes/unified_valuation.py |
| GET | `/api/v1/valuation/asset-classes` | `list_asset_classes` | api/v1/routes/unified_valuation.py |

### 2.3 Engine `unified_valuation_engine` (services/unified_valuation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `MarketDefaults.get_commercial_yield` | subtype, country |  |
| `MarketDefaults.get_residential_yield` | subtype, country |  |
| `ESGOverlayEngine.calculate_esg_adjustment` | esg, asset_class, base_value |  |
| `_d` | v | Safe Decimal conversion. |
| `_dcf_pv` | cashflows, discount_rate_pct | Discount a list of annual cashflows to present value. |
| `calc_infrastructure` | inp, country, esg |  |
| `calc_project` | inp, country, esg |  |
| `calc_energy` | inp, country, esg |  |
| `calc_commercial` | inp, country, esg |  |
| `calc_residential` | inp, country, esg |  |
| `calc_agricultural` | inp, country, esg |  |
| `calc_land` | inp, country, esg |  |
| `_reconcile` | method_results | Weighted reconciliation of method results. Returns (value, low, high). |
| `UnifiedValuationEngine._auto_select_methods` | request | Return the standard method set for each asset class. |
| `UnifiedValuationEngine.value` | request |  |
| `run_valuation` | request_dict | Convenience function for API routes. Accepts a flat dict (from JSON body), builds ValuationRequest, runs engine, returns dict. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `inputs`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/valuation/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes', 'esg_scenarios', 'valuation_standards'], 'n_keys': 3}`

**GET /api/v1/valuation/schema/{asset_class}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/valuation/batch** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count_requested', 'count_succeeded', 'count_failed', 'portfolio_total_value', 'avg_esg_adjustment_pct', 'results', 'errors'], 'n_keys': 7}`

**POST /api/v1/valuation/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/valuation/sensitivity** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `unified_valuation_engine` — extracted transformation lines:**
```python
rab_value = rab_return / discount_r  # perpetuity approximation
ebitda = inp.annual_revenue - inp.annual_opex
fcf = ebitda - inp.annual_capex
cashflows = [fcf * (1 + g) ** _d(i) for i in range(inp.projection_years)]
tv_pv = terminal_value / (1 + r) ** _d(inp.projection_years)
total_value = pv_cashflows + tv_pv
rev = inp.annual_revenue * inp.ramp_factor
debt = total_investment - equity_investment
rev = annual_revenues[yr - 1]
equity_cf = rev - inp.annual_opex - annual_debt_service
project_value = pv_equity + debt
mid_revenue = annual_revenues[min(inp.revenue_ramp_years, len(annual_revenues) - 1)]
ebitda = mid_revenue - inp.annual_opex
annual_revenue = ppa_revenue + merchant_revenue
gen_factor = (1 - degradation) ** (yr - 1)
rev_yr = annual_revenue * _d(gen_factor)
ets_cost = inp.annual_co2_tonnes * inp.eu_ets_price_eur_tco2
pv_decomm = decomm / (1 + r) ** _d(inp.asset_life_years)
equity_value = pv_ops - pv_decomm
ebitda = annual_revenue - annual_opex
nav_value = ebitda * ev_ebitda_multiple
capex_reserve = nla * inp.capex_reserve_psm
noi = gross_income - void_cost - mgmt_fee - capex_reserve - inp.service_charge_psm * nla
exit_noi = cashflows[-1] if cashflows else noi
pv_terminal = terminal / (1 + r) ** _d(inp.projection_years)
dcf_value = pv_cf + pv_terminal
build_value = inp.gross_floor_area_m2 * build_cost_psm * (1 - age_depreciation)
cost_value = build_value + land_value
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/unified_valuation_engine.py` (1,604 lines) is a single-entry-point asset valuation engine covering **7 asset classes** (infrastructure, project finance, energy, commercial RE, residential, agricultural, land) with **11 valuation methods** and a **mandatory ESG/climate overlay**. Endpoints: `POST /api/v1/valuation/calculate` (one asset), `/batch`, `/sensitivity`, `GET /valuation/asset-classes`, `GET /valuation/schema/{asset_class}`.

Pipeline per request:

```
asset-class calculator → List[MethodResult]           (each with indicated_value + weight)
reconciled_pre_esg = Σ value_i × (weight_i / Σweight)  (weighted mean)
range = [min(values)×0.95, max(values)×1.05]
net_esg_adj = green_premium − brown_discount − physical_risk − transition_risk + biodiversity_adj
final_value = reconciled_pre_esg × (1 + net_esg_adj)
```

All arithmetic uses `Decimal` (no float drift); everything is deterministic.

### 7.2 Parameterisation

**Auto-selected methods & reconciliation weights** (engine-authored): infrastructure RAB 0.45 / DCF 0.40 / cost 0.15; project PF-DCF 0.70 / cost 0.30; energy yield-DCF 0.60 / cost 0.25 / NAV 0.15; commercial direct-cap 0.35 / DCF / cost; residential direct-cap / DCF / sales comparison; agricultural DCF / comparison / timber-carbon; land residual / comparison / hedonic.

**MarketDefaults** ("Calibrated market defaults… Sources: JLL, CBRE, Knight Frank, Savills, RICS, MSCI. Updated: Q1 2024"): commercial prime yields per country (e.g. GB office prime 5.25%, DE 4.00%, data centre GB 4.25%); residential gross yields (GB multifamily 4.25%); energy opex $/kW-yr (solar 17, nuclear 110), capacity factors (solar 20%, nuclear 90%), capex $/kW (solar 900, nuclear 7,500); agricultural land $/ha (GB arable 12,000); infrastructure regulated WACC (regulated utility 5.5%, airport 8.0%).

**ESG overlay tables** (`ESGOverlayEngine`, citing RICS VPS4, JLL Green Building Premium Study 2023, MSCI Green Premium 2023, CRREM v2):

| Lever | Values |
|---|---|
| Green cert premium | BREEAM Outstanding +10%, LEED Platinum +8%, NABERS 6 +9% … unknown cert +3% |
| EPC brown discount (vs C-neutral) | A −5% (premium), B −2%, C 0, D +3%, E +7%, F +12%, G +18%; F/G set `stranding_risk_year` = assessment+7 / +3 |
| Flood discount | none 0, low 2%, medium 5%, high 10%, extreme 18% |
| Scenario physical multiplier | NZE 3%, Below-2°C 5%, NDC 9%, Current Policies 14% — applied × (physical_score/100), then `max(flood, scenario-scaled)` |
| Transition discount | transition_score/100 × 8%; SBTi-aligned ×0.70 (30% penalty relief) |
| Biodiversity | low 0, medium −1%, high −3%, critical −6% |

### 7.3 Calculation walkthrough (selected methods)

- **RAB (infrastructure):** `value = (RAB × allowed_WACC%) / (discount_rate + reg_risk_bps)` — a perpetuity of the regulator-allowed return (Ofgem/Ofwat style).
- **Energy yield DCF:** generation = MW × CF × 8760, degraded (default 0.5%/yr); revenue = PPA-covered + merchant blend; opex inflated 2%/yr; thermal plants pay `annual_CO₂ × EU-ETS €65/t`; less PV of decommissioning (default 5% of capex). Also reports LCOE (PV cost / PV generation) and an EV/EBITDA NAV cross-check (12× if PPA ≥ 70%, else 9×).
- **Direct capitalisation (commercial):** `NOI / cap_rate`, NOI = gross income − void − management fee (3%) − capex reserve − service charge; NLA defaults to 85% of GFA; exit yield defaults to initial + 25 bps.
- **Material uncertainty** flag (RICS VPGA 10-style) if any method has "low" confidence or only one method ran.

### 7.4 Worked example — 100 MW solar PV (defaults)

Inputs: 100 MW, PPA $50/MWh at 100% coverage, all other fields default (CF 20%, opex $17/kW-yr, capex $900/kW, 7.5% discount, 25-yr life, 0.5% degradation); ESG: EPC D not applied (energy class), no cert, physical score 40, Below-2°C, transition score 50, SBTi-aligned.

| Step | Computation | Result |
|---|---|---|
| Annual generation | 100 × 0.20 × 8,760 | 175,200 MWh |
| Annual revenue | 175,200 × $50 | $8.76M |
| Annual opex (yr 1) | 100,000 kW × $17 | $1.70M |
| Capex (replacement cost) | 100,000 × $900 | $90.0M |
| Yield DCF | PV of 25 degrading/inflating net CFs − PV(decomm $4.5M) | ≈ $69M |
| NAV | ($8.76M − $1.70M) × 12 | $84.7M |
| Reconciled | 0.60×69 + 0.25×90 + 0.15×84.7 | ≈ **$76.6M** |
| Physical risk | max(flood 0, 40/100 × 5%) | 2.0% |
| Transition risk | 50/100 × 8% × 0.70 | 2.8% |
| Net ESG adj | 0 − 0 − 2.0% − 2.8% + 0 | **−4.8%** |
| Final value | 76.6 × 0.952 | ≈ **$72.9M** (≈ $729/kW) |

(The DCF PV is engine-computed; the ESG arithmetic above is exact.)

### 7.5 Data provenance & limitations

- **Deterministic, no PRNG, no seed portfolios** — values derive from caller inputs and the hard-coded MarketDefaults tables. Those tables are static Q1-2024 snapshots attributed to broker research but without per-cell citations, and will stale-date.
- ESG overlay percentages are calibrated approximations of published green-premium/brown-discount research (JLL/MSCI find prime green premia of roughly 5–10%+, consistent with the table), not asset-specific regressions.
- Known code wart: the agricultural/land `carbon_credit_value` in the ESG dataclass is assigned `esg.assessment_year` with a "placeholder — real calc in agri engine" comment — the field is not a meaningful monetary value in this overlay (the timber/carbon method inside `calc_agricultural` does the real work).
- Project IRR is echoed from the *target* input, not solved from cash flows; project value = PV(equity CFs at target IRR) + debt is a shortcut, not a full waterfall.
- Simplifications vs production valuation practice: perpetuity RAB (no regulatory-period modelling), single-scenario ESG haircut (no NGFS path-dependent cash-flow adjustment), value range as ±5% around method extremes rather than statistical confidence intervals.

### 7.6 Framework alignment

- **RICS Red Book (PS1/VPS2/VPS3/VPS4, 2024)** — method bases are cited per result (VPS2 income approach, VPS3 cost approach); VPS4's requirement that ESG factors be considered in valuations is implemented as the mandatory overlay, and the result asserts `rics_vps4_esg_addressed`.
- **IVS 2024 (IVSC)** — IVS 105 cited for cost/income approaches; multi-method reconciliation follows IVS's requirement to consider multiple approaches and reconcile.
- **CRREM v2** — referenced as the stranding-risk basis; the engine's F/G-EPC `stranding_risk_year` is a coarse proxy for CRREM's intensity-pathway crossover year.
- **EU ETS** — thermal-plant carbon cost at a €65/tCO₂ default internalises allowance costs in energy DCF.
- **IPEV Guidelines / INREV NAV / LMA project finance** — cited for project-finance DCF and the EV/EBITDA NAV approach.
- **Basel III / IFRS 13** — named in the module header as compliance context (fair-value hierarchy / prudent valuation); not separately computed.
- **SBTi** — alignment grants a 30% transition-risk-penalty reduction, encoding the view that validated targets de-risk transition exposure.

## 9 · Future Evolution

### 9.1 Evolution A — Repair the single-asset path and calibrate the ESG overlay (analytics ladder: rung 2 → 3)

**What.** A 1,604-line single-entry-point valuation engine covering 7 asset classes with 11
methods (RAB perpetuity, PF-DCF, energy yield-DCF with degradation and ETS costs, direct-cap,
cost/NAV approaches) and a mandatory ESG overlay: methods reconcile by engine-authored weights
(e.g. infrastructure RAB 0.45/DCF 0.40/cost 0.15), then
`final = reconciled × (1 + green_premium − brown_discount − physical_risk − transition_risk +
biodiversity_adj)`. All Decimal arithmetic, fully deterministic. The atlas exposes two issues:
`POST /calculate`, `/sensitivity`, and `GET /schema/{asset_class}` trace **failed** (only `/batch`
passes), and both the reconciliation weights and the ESG adjustment magnitudes are engine-authored
constants without market calibration. Evolution A repairs and calibrates.

**How.** (1) Fix the failing single-asset, sensitivity, and schema endpoints — `/batch` passing
while `/calculate` fails suggests a request-model or validation defect on the single path. (2)
Source the ESG overlay components from the platform's dedicated engines rather than internal
constants: physical risk from the digital twin/`re_clvar`, transition from CRREM/EPC data,
green premium from `green_premium_tenant` — with per-component provenance in the response. (3)
Document and sensitivity-test the reconciliation weights (the §8 model-card convention). (4)
Bench-pin one worked valuation per asset class.

**Prerequisites.** The three failing endpoints repaired; engine linkages for the overlay
components. **Acceptance:** `/calculate`, `/sensitivity`, and `/schema/{asset_class}` return
`passed`; each ESG adjustment component cites its source engine or is labelled engine-constant;
seven asset-class bench pins reproduce `final_value` exactly (Decimal determinism makes this
strict).

### 9.2 Evolution B — Valuation copilot with method-level transparency (LLM tier 2)

**What.** A copilot that values an asset and shows its work — "your wind farm values at €142M:
yield-DCF €138M (weight 0.60), cost €149M (0.25), NAV €152M (0.15); the ESG overlay nets −3.2%,
driven by transition risk; here's the sensitivity to the discount rate" — every method value,
weight, and adjustment from `/calculate` and `/sensitivity` tool calls.

**How.** Three POST endpoints (`/calculate`, `/sensitivity`, `/batch`) plus `/asset-classes` and
`/schema/{asset_class}` — the schema endpoint is the copilot's input-gathering tool, letting it
ask the user for exactly the fields the asset class requires. The MethodResult decomposition and
the five-component ESG overlay give a fully attributable narrative; batch serves portfolio
valuation summaries. Cross-links to `re_clvar`, `green_premium_tenant`, and `rics_esg` (whose Red
Book apparatus this engine's outputs feed). Core node for a valuation desk.

**Prerequisites.** Evolution A's endpoint repairs are mandatory — the copilot's primary tools
(`/calculate`, `/sensitivity`, `/schema`) currently fail. **Acceptance:** every method value,
reconciliation weight, and ESG component traces to a tool response; the copilot presents the range
(`[min×0.95, max×1.05]`) alongside the point value; it labels overlay components as
engine-constant vs engine-sourced (per Evolution A) and refuses to present output as a formal
appraisal.