# Offshore Wind Project Finance & CfD Analytics
**Module ID:** `offshore-wind-finance` · **Route:** `/offshore-wind-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DR3 · **Sprint:** DR

## 1 · Overview
Institutional project finance model for offshore wind transactions covering CfD structure, Newton-Raphson IRR, DSCR/LLCR covenant analysis, P50/P90 lender case, Monte Carlo IRR distribution, LP/GP waterfall, EU Taxonomy and SFDR PAI alignment, and comparable transaction benchmarking across 18 analytical tabs. Supports UK CfD, European CF+ contracts, and US IRA PTC structures.

> **Business value:** Designed for offshore wind project finance bankers, infrastructure equity investors, and developers structuring the financial close for 500MW–3GW offshore wind transactions. Covers the full financial model from CfD contract structure through Newton-Raphson IRR, DSCR covenant analysis, construction finance, LP/GP waterfall, and EU Taxonomy green bond packaging — replicating the offshore wind financial model typically built in 3-month Excel-based processes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COUNTRIES`, `IRENA_OFFSHORE`, `SideSection`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cfs.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `next` | `r - npv / dnpv;` |
| `totalCapex` | `capMW * 1000 * capexPerKw;` |
| `annualAEP` | `capMW * 1000 * (cfPct / 100) * 8760;` |
| `debtAmt` | `totalCapex * debtPct / 100;` |
| `equityAmt` | `totalCapex * eqPct / 100;` |
| `annDS` | `debtAmt * intRate / 100 / (1 - Math.pow(1 + intRate / 100, -tenor));` |
| `deg` | `Math.pow(1 - 0.005, y - 1);` |
| `aep` | `annualAEP * deg;` |
| `spot` | `referencePrice * Math.pow(1 + escalation / 100, y - 1);` |
| `opex` | `opexPerKw * capMW * 1000 / 1e6 * Math.pow(1.02, y - 1);` |
| `ebitda` | `revenue - opex;` |
| `interest` | `debtBal * intRate / 100;` |
| `cfads` | `ebitda - interest - Math.max(0, ebitda - interest) * taxRate / 100;` |
| `fcf` | `cfads - princPay;` |
| `dscr` | `annDS > 0 ? cfads / annDS : 999;` |
| `capexPerKw` | `turbinePerKw + foundationPerKw + installPerKw + gridPerKw + softPerKw;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPEX_ITEMS`, `COLORS`, `COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Equity IRR (offshore) | `Newton-Raphson on post-tax equity CFs` | Project finance model | Target equity IRR: 9–11% for CfD-contracted offshore wind (low risk); 12–14% for merchant/post-CfD; floating o |
| LCOE (offshore fixed) | `CAPEX + NPV(OPEX) / NPV(AEP)` | Industry benchmarks 2024 | Best UK/Dutch offshore fixed-bottom 2024: $65–75/MWh; US East Coast: $80–100/MWh (higher labor + supply chain  |
| CfD Strike (fixed offshore) | `UK AR4/AR5 auction results` | DESNZ CfD allocations | UK AR4 (2023) fixed-bottom strike: ~£73/MWh (2012 prices); AR5 2024: ~£82/MWh; US IRA PTC: $27.50/MWh base + a |
| DSCR (min, offshore) | `CFADS / Annual Debt Service` | Lender terms | CfD-contracted wind: lenders comfortable at 1.20× minimum due to revenue certainty; merchant periods require 1 |
| Construction Cost | `Turbine + foundation + installation + cabling` | BNEF/NREL 2024 | US offshore: higher than Europe due to Jones Act vessel constraints and limited supply chain; monopile: $2,200 |
| Project Finance Tenor | `Typical debt amortisation schedule` | Lender market norms | Offshore wind project finance tenor matches CfD duration (15yr) for maximum revenue certainty period; tail cas |
- **Project CAPEX stack + CfD strike + capacity factor → Annual revenue model** → Project finance cash flow: Revenue − OPEX − tax − DS → CFADS → **DSCR schedule, equity IRR, NPV**
- **Monte Carlo: CAPEX ±15%, CF ±8%, OPEX ±10%, interest rate ±1% (Box-Muller)** → Newton-Raphson IRR on perturbed equity cash flows × 1,000 runs → **IRR distribution P10/P50/P90, NPV at risk, DSCR breach probability**
- **10 comparable offshore wind transactions (seeded: Dogger Bank A/B/C, Vineyard Wind 1, Hornsea 3, Sofia OWF)** → LCOE, IRR, leverage, CfD strike benchmarking → **Comparable transaction range for IRR/LCOE/DSCR validation**

## 5 · Intermediate Transformation Logic
**Methodology:** Newton-Raphson IRR + CfD Revenue Model + DSCR Covenant Analysis
**Headline formula:** `IRR: Σ CF_t/(1+IRR)^t = 0; CfD: Revenue_t = min(E_t × strike, E_t × spot + max(0, strike−spot) × E_t); DSCR = CFADS / DS_t`
**Standards:** ['UK Contracts for Difference (CfD) Allocation Round 5', 'FERC Order 2023', 'S&P RE Project Finance Rating Criteria']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).