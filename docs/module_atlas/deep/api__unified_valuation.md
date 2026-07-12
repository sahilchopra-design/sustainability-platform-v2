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
