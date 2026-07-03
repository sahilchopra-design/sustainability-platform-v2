# Solar Project Finance Engine
**Module ID:** `solar-project-finance` · **Route:** `/solar-project-finance` · **Tier:** B (frontend-computed) · **EP code:** RE-PF1 · **Sprint:** RE

## 1 · Overview
End-to-end project finance model for utility-scale solar IPP transactions. Computes LCOE, IRR (equity/project), NPV, DSCR, LLCR, and PLCR from user-defined capital structure, ITC/PTC IRA 2022 incentives, MACRS depreciation, and LP/GP 4-tier waterfall. Supports Monte Carlo P10/P50/P90 energy generation and scenario stress-testing across 12 analytical tabs.

> **Business value:** Designed for infrastructure investors, tax equity investors, independent power producers, and project finance lenders evaluating utility-scale solar transactions under IRA 2022. Replaces traditional Excel-based financial models with an interactive, real-time engine covering all ITC/PTC scenarios, DSCR covenants, and LP/GP structures typical of 50–500 MW US solar IPP deals.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Badge`, `CF_BY_LOC`, `CollapseSection`, `DataTable`, `HEADER_BG`, `HeatCell`, `IRENA_SOLAR`, `InputSelect`, `KpiCard`, `LOCATIONS`, `MACRS15`, `MACRS5`, `NAV_BG`, `SOLAR_GOLD`, `SectionTitle`, `SliderRow`, `TABS`, `TECHNOLOGIES`, `TOP_SOLAR_MARKETS`, `TabComps`, `TabConstruction`, `TabDscr`, `TabESG`, `TabFinancialModel`, `TabIRA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LOCATIONS` | `['ERCOT-West','CAISO-SP15','PJM-West','MISO-Central','NYISO','ISO-NE'];` |
| `CF_BY_LOC` | `{ 'ERCOT-West':25.5,'CAISO-SP15':22.0,'PJM-West':19.5,'MISO-Central':20.0,'NYISO':17.0,'ISO-NE':15.5 };` |
| `IRENA_SOLAR` | `Object.fromEntries((IRENA_RENEWABLE_CAPACITY_2023\|\|[]).map(c=>[c.country,c.solar_pv_gw]));` |
| `TOP_SOLAR_MARKETS` | `(IRENA_RENEWABLE_CAPACITY_2023\|\|[]).sort((a,b)=>(b.solar_pv_gw\|\|0)-(a.solar_pv_gw\|\|0)).slice(0,15).map(c=>({country:c.country,solar_gw:c.solar_pv_gw,y` |
| `npv` | `cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);` |
| `dnpv` | `cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);` |
| `factor` | `Math.pow(1 + r, n);` |
| `annualEnergy` | `cf * 8760 * mw * 1000; // kWh` |
| `annualCapex` | `capex * crf;` |
| `fmtPct` | `n => isFinite(n) && n !== null ? (n * 100).toFixed(1) + '%' : '—';` |
| `fmtPctD` | `n => isFinite(n) && n !== null ? (n).toFixed(1) + '%' : '—';` |
| `fmtM` | `n => isFinite(n) && n !== null ? '$' + (n \|\| 0).toFixed(1) + 'M' : '—';` |
| `fmtX` | `n => isFinite(n) && n !== null ? (n \|\| 0).toFixed(2) + 'x' : '—';` |
| `fmtK` | `n => isFinite(n) && n !== null ? '$' + Math.round(n \|\| 0).toLocaleString() + 'k' : '—';` |
| `fmtMWh` | `n => isFinite(n) && n !== null ? '$' + (n \|\| 0).toFixed(2) + '/MWh' : '—';` |
| `fmtGWh` | `n => isFinite(n) && n !== null ? (n \|\| 0).toFixed(2) + ' GWh' : '—';` |
| `ratio` | `max > min ? (value - min) / (max - min) : 0;` |
| `totalTaxRate` | `(fedTaxRate + stateTaxRate) / 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LOCATIONS`, `MACRS15`, `MACRS5`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOE | `LCOE = (ΣCapex+ΣOPV) / ΣE_t×(1+r)^-t` | Project finance model | Levelized Cost of Energy — all-in breakeven price per MWh over project life; competitive solar is $28–42/MWh f |
| Equity IRR | `Newton-Raphson on post-tax equity CFs` | Calculated from inputs | After-tax equity internal rate of return; institutional RE funds target 10–14%; merchant projects may reach 16 |
| DSCR (min) | `CFADS / Annual Debt Service` | Cash flow model | Minimum DSCR over loan tenor; lenders typically require ≥1.25× on PPA projects, ≥1.35× on merchant; covenant b |
| LLCR | `NPV(CFADS, loan life) / Outstanding Debt` | Cash flow model | Loan Life Coverage Ratio — forward-looking; if LLCR falls below 1.0 the project cannot service remaining debt  |
| ITC Basis | `IRA 2022 §48E stack: Base + DC + EC + LIC` | IRS Notice 2023-29 | Investment Tax Credit percentage; domestic content (+10%) requires ≥40% US-manufactured steel/iron/components; |
| P90 Energy Yield | `Monte Carlo Box-Muller, combined σ across 6 uncertainty sources` | Resource + engineering | P90 (1-in-10 exceedance) used by lenders for debt sizing; P50 used for equity returns; gap reflects GHI variab |
| MOIC (equity) | `Total equity distributions / equity invested` | Waterfall model | Multiple on invested capital; typical RE equity fund target 2.0–2.5× over 7-year hold; includes carried intere |
- **User inputs: CAPEX $/Wdc, O&M, PPA price, debt terms, ITC toggles** → Financial model engine (Newton-Raphson IRR, MACRS, ITC stack) → **Project IRR, DSCR schedule, LLCR, LCOE, waterfall distributions**
- **Monte Carlo engine: combined σ across 6 uncertainty sources** → Box-Muller normal sampling (1,000 runs) → **P10/P50/P90/P99 annual generation and revenue distributions**
- **IRA 2022 adder rules: domestic content, energy community, low-income** → ITC basis calculator → **Applicable ITC %, half-basis MACRS reduction, net tax equity benefit**

## 5 · Intermediate Transformation Logic
**Methodology:** Newton-Raphson IRR + DSCR/LLCR/PLCR Project Finance
**Headline formula:** `IRR: Σ CF_t/(1+IRR)^t = 0 (Newton-Raphson 200 iter); LCOE = (CAPEX + Σ O&M_t/(1+r)^t) / Σ E_t/(1+r)^t; DSCR = CFADS / DebtService; LLCR = NPV(CFADS) / Outstanding Debt`
**Standards:** ['IRA 2022 §48E ITC', 'MACRS 5-yr GDS', 'FERC Filing', 'AICPA SSVS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`