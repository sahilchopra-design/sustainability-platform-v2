# Power Grid & Transmission Finance
**Module ID:** `power-grid-transmission-finance` · **Route:** `/power-grid-transmission-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EL1 · **Sprint:** EL

## 1 · Overview
Regulatory Asset Base (RAB) model for 12 European TSOs, revenue requirement waterfall (RIIO-T2/ACER), capex programme screener with project IRR, 36-month congestion & redispatch cost analytics, credit metric evolution (FFO/Debt, DSCR, gearing), cross-border interconnector portfolio (IFA/NEMO/NordLink/NSL), and RAB-based valuation model with WACC sensitivity.

> **Business value:** Used by infrastructure debt investors modelling RAB-based cash flows, equity analysts covering European TSOs, and energy transition finance teams evaluating interconnector investment economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_PROGRAMS`, `CREDIT_METRICS`, `INTERCONNECTORS`, `KpiCard`, `MONTHLY_CONGESTION`, `OPERATORS`, `Pill`, `RAB_BRIDGE`, `RADAR_METRICS`, `REVENUE_WATERFALL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalRAB` | `useMemo(() => OPERATORS.reduce((s, o) => s + o.rab, 0), []);` |
| `avgDSCR` | `useMemo(() => (OPERATORS.reduce((s, o) => s + o.dscr, 0) / OPERATORS.length).toFixed(2), []);` |
| `totalCapex` | `useMemo(() => OPERATORS.reduce((s, o) => s + o.capex, 0), []);` |
| `avgCongestion` | `useMemo(() => Math.round(OPERATORS.reduce((s, o) => s + o.congestion_cost, 0) / OPERATORS.length), []);` |
| `allowedReturn` | `((op.rab * wacc / 100) * scenarioMultiplier / 1000).toFixed(1);` |
| `revenueRequirement` | `((op.rab * wacc / 100 + op.opex + op.capex * 0.15) * scenarioMultiplier / 1000).toFixed(1);` |
| `equityValue` | `((op.rab * (1 - gearingTarget / 100)) * 1.12).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPEX_PROGRAMS`, `INTERCONNECTORS`, `OPERATORS`, `RAB_BRIDGE`, `RADAR_METRICS`, `REVENUE_WATERFALL`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| European TSO aggregate RAB | `12 major transmission system operators` | Ofgem/ACER annual reports 2023 | UK RAB growth driven by North Sea offshore HVDC; TenneT NL/DE HVDC Corridor largest single capex programme €25 |
| Regulatory lag (transmission) | `Formula rate mechanisms eliminate lag for FERC-regulated TSOs` | FERC Form 1 submissions 2023 | RIIO-T2 uncertainty mechanisms (re-openers, indexation) also reduce effective lag; key differentiator vs gas/w |
| Interconnector utilisation | `Operational HVDC interconnectors in Europe` | ENTSO-E Market Report 2023 | Congestion rents €851M/yr across 6 operational interconnectors surveyed; merchant revenue can comprise 30–50%  |
- **Ofgem RIIO-T2 + ACER CACM + ENTSO-E TYNDP + FERC Form 1 + S&P utility rating criteria + EIB infrastructure debt framework** → 12-TSO RAB comparison + capex programmes + revenue waterfall + congestion analytics + credit metrics + interconnector portfolio + WACC calculator → **Infrastructure debt investors, regulated utility equity analysts, energy transition project finance teams, and sovereign wealth fund infrastructure allocators**

## 5 · Intermediate Transformation Logic
**Methodology:** RAB Valuation & Allowed Return
**Headline formula:** `Allowed_Return = RAB × WACC_real_pre_tax; Revenue_Req = Allowed_Return + Depreciation + Opex + Taxes + Pass-Throughs; Equity_Value = RAB × (1 − Gearing) × Premium_to_RAB; Congestion_Rent = Σ(Price_A − Price_B) × Flow_MW × Hours; DSCR = EBITDA / (Interest + Scheduled_Principal)`
**Standards:** ['Ofgem RIIO-T2 Price Control 2021–2026', 'ACER CACM Regulation (EU) 2015/1222', 'FERC Order 1000 — Transmission Planning']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).