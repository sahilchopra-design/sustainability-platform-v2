# Power Grid & Transmission Finance
**Module ID:** `power-grid-transmission-finance` · **Route:** `/power-grid-transmission-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EL1 · **Sprint:** EL

## 1 · Overview
Regulatory Asset Base (RAB) model for 12 European TSOs, revenue requirement waterfall (RIIO-T2/ACER), capex programme screener with project IRR, 36-month congestion & redispatch cost analytics, credit metric evolution (FFO/Debt, DSCR, gearing), cross-border interconnector portfolio (IFA/NEMO/NordLink/NSL), and RAB-based valuation model with WACC sensitivity.

> **Business value:** Used by infrastructure debt investors modelling RAB-based cash flows, equity analysts covering European TSOs, and energy transition finance teams evaluating interconnector investment economics.

**How an analyst works this module:**
- Select a TSO to compare RAB, allowed ROE, earned ROE, FFO/Debt, and DSCR against European peers
- Use the Capex Programme tab to screen major grid investment projects by type (Growth/Replacement/Technology) and minimum budget
- Review Revenue Waterfall tab for full RIIO-T2 cost build-up including pass-throughs, incentive income, and IQI adjustments
- In Valuation Model tab, adjust WACC, gearing, and scenario to see equity value sensitivity for any selected TSO

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_PROGRAMS`, `CREDIT_METRICS`, `INTERCONNECTORS`, `KpiCard`, `MONTHLY_CONGESTION`, `OPERATORS`, `Pill`, `RAB_BRIDGE`, `RADAR_METRICS`, `REVENUE_WATERFALL`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `OPERATORS` | 13 | `name`, `region`, `rab`, `voltage`, `length`, `allowed_roe`, `earned_roe`, `capex`, `opex`, `dscr`, `ffo_debt`, `lines`, `rating`, `age`, `congestion_cost` |
| `CAPEX_PROGRAMS` | 9 | `type`, `cost`, `timeline`, `irr`, `voltage`, `length_km`, `status` |
| `REVENUE_WATERFALL` | 9 | `value`, `type` |
| `RAB_BRIDGE` | 7 | `opening`, `capex`, `depreciation`, `indexation`, `closing` |
| `INTERCONNECTORS` | 7 | `capacity_mw`, `utilisation`, `congestion_rent`, `owner`, `voltage`, `length`, `status`, `irr` |
| `RADAR_METRICS` | 7 | `value` |

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
| European TSO aggregate RAB | `12 major transmission system operators` | Ofgem/ACER annual reports 2023 | UK RAB growth driven by North Sea offshore HVDC; TenneT NL/DE HVDC Corridor largest single capex programme €25Bn+. |
| Regulatory lag (transmission) | `Formula rate mechanisms eliminate lag for FERC-regulated TSOs` | FERC Form 1 submissions 2023 | RIIO-T2 uncertainty mechanisms (re-openers, indexation) also reduce effective lag; key differentiator vs gas/water networks. |
| Interconnector utilisation | `Operational HVDC interconnectors in Europe` | ENTSO-E Market Report 2023 | Congestion rents €851M/yr across 6 operational interconnectors surveyed; merchant revenue can comprise 30–50% of project economics. |
- **Ofgem RIIO-T2 + ACER CACM + ENTSO-E TYNDP + FERC Form 1 + S&P utility rating criteria + EIB infrastructure debt framework** → 12-TSO RAB comparison + capex programmes + revenue waterfall + congestion analytics + credit metrics + interconnector portfolio + WACC calculator → **Infrastructure debt investors, regulated utility equity analysts, energy transition project finance teams, and sovereign wealth fund infrastructure allocators**

## 5 · Intermediate Transformation Logic
**Methodology:** RAB Valuation & Allowed Return
**Headline formula:** `Allowed_Return = RAB × WACC_real_pre_tax; Revenue_Req = Allowed_Return + Depreciation + Opex + Taxes + Pass-Throughs; Equity_Value = RAB × (1 − Gearing) × Premium_to_RAB; Congestion_Rent = Σ(Price_A − Price_B) × Flow_MW × Hours; DSCR = EBITDA / (Interest + Scheduled_Principal)`

NordLink interconnector (1.4GW Norway-Germany): avg utilisation 85%, annual congestion rent €210M/yr, project IRR 7.8% — benchmark for future HVDC investment economics.

**Standards:** ['Ofgem RIIO-T2 Price Control 2021–2026', 'ACER CACM Regulation (EU) 2015/1222', 'FERC Order 1000 — Transmission Planning']
**Reference documents:** Ofgem (2021) – RIIO-T2 Final Determinations; ACER (2023) – Annual Report on the Results of Monitoring the Internal Electricity Market; ENTSO-E (2023) – Ten-Year Network Development Plan

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is **grounded in real regulatory-finance formulas** applied to curated European TSO data.
The guide and code align: it implements the RAB-based allowed-return and revenue-requirement build-up,
a RAB-premium equity valuation, and DSCR/FFO credit metrics. The only synthetic element is a monthly
congestion series; the 12 TSOs, capex programmes and revenue waterfall are hand-authored real figures.

### 7.1 What the module computes

```js
allowedReturn      = (RAB · wacc/100) · scenarioMultiplier / 1000                     // £/€ bn
revenueRequirement = (RAB · wacc/100 + opex + capex·0.15) · scenarioMultiplier / 1000
equityValue        = (RAB · (1 − gearingTarget/100)) · 1.12                           // RAB premium 1.12×
avgDSCR            = Σ dscr / |OPERATORS|
totalRAB           = Σ rab
avgCongestion      = round( Σ congestion_cost / |OPERATORS| )
```

The `·0.15` on capex is a proxy depreciation+return-of-capital allowance; the `1.12` on equity value
is the market premium-to-RAB that regulated networks typically trade at.

### 7.2 Parameterisation — curated TSO data

| Field | Example values | Provenance |
|---|---|---|
| `rab` | National Grid £14.8B, RTE €28.4B, Terna €18.2B … (12 TSOs) | curated real RAB figures |
| `allowed_roe / earned_roe` | 4.9–5.8 % | curated (RIIO-T2 / ACER-consistent) |
| `dscr`, `ffo_debt` | 1.55–1.73, 0.131–0.162 | curated credit metrics |
| `rating` | Aa2–Baa2 | curated agency ratings |
| `capex`, `opex`, `congestion_cost` | per-TSO $M | curated |
| `CAPEX_PROGRAMS` | 8 programmes, IRR 5.4–8.2 % (HVDC, smart grid…) | curated with project IRRs |
| `REVENUE_WATERFALL` | Allowed rev 4200 + pass-through/incentive − IQI = 5534 | curated RIIO-style build-up |
| `MONTHLY_CONGESTION` | 36-month series | **synthetic** (`sr()`-seeded) |
| equity premium | `1.12` | heuristic RAB-premium constant |
| capex allowance | `0.15` | heuristic return-of-capital proxy |

The `sr()` PRNG only seeds the congestion time series; all financial inputs are curated real data.

### 7.3 Calculation walkthrough

1. Select a TSO → `op`.
2. `allowedReturn = RAB · WACC` (the core RAB regulatory identity), scaled by a scenario multiplier.
3. `revenueRequirement` adds opex and a capex-based allowance to the allowed return.
4. `equityValue` gears down the RAB and applies the 1.12× premium.
5. WACC and gearing sliders flex these outputs live; the capex screener filters `CAPEX_PROGRAMS` by
   type and minimum budget; the revenue waterfall and interconnector portfolio render curated data.

### 7.4 Worked example

Terna: RAB €18,200M, WACC 5.5 %, opex 520, capex 1680, gearing 60 %, scenarioMultiplier 1.0:

| Output | Computation | Result |
|---|---|---|
| allowedReturn | 18,200·0.055/1000 | €1.00B |
| revenueRequirement | (18,200·0.055 + 520 + 1680·0.15)/1000 | (1001 + 520 + 252)/1000 = €1.77B |
| equityValue | 18,200·(1−0.60)·1.12 | 18,200·0.40·1.12 = €8,154M |

The allowed return is the RAB × WACC identity used across UK RIIO and EU incentive regulation.

### 7.5 Data provenance & limitations

- **Real curated TSO data**; the RAB/revenue/equity formulas are standard regulated-utility finance —
  no fabrication of the headline financials. Only the 36-month congestion series is `sr()`-seeded.
- The 1.12 RAB premium and 0.15 capex allowance are single-point heuristics; a production model would
  derive the premium from traded comparables and the capex allowance from the regulatory depreciation
  schedule and totex split.
- No true multi-year DCF of the RAB roll-forward; valuation is a single-period RAB-premium proxy.

**Framework alignment:** Ofgem RIIO-T2 — `Allowed Return = RAB × WACC_real_pre_tax` and the
revenue-requirement build-up (allowed return + depreciation + opex + pass-throughs ± incentives/IQI)
are implemented faithfully · ACER CACM Reg. (EU) 2015/1222 — congestion-rent framing for
interconnectors · FERC Order 1000 — transmission-planning context; the RAB-premium equity valuation
mirrors how regulated networks trade at a premium to RAB. Because the core methodology is genuine
regulated-utility finance, no separate production-model specification (§8) is required.

## 9 · Future Evolution

### 9.1 Evolution A — Live regulatory data and real congestion series (analytics ladder: rung 2 → 3)

**What.** §7 rates this well-grounded: it implements real RAB-based regulatory-finance formulas over curated European TSO data — allowed return (`RAB × WACC`), the RIIO-T2 revenue-requirement build-up, RAB-premium equity valuation (`RAB × (1−gearing) × 1.12`), and DSCR/FFO credit metrics — with 12 real TSOs (National Grid £14.8B, RTE €28.4B, Terna €18.2B), real capex programmes with IRRs, and RIIO-style revenue waterfalls. The only synthetic element is the monthly congestion series. Two soft spots: the `·0.15` capex depreciation proxy and `1.12` RAB premium are hand-set heuristics, and the TSO/interconnector data is hand-authored point-in-time. Evolution A grounds the data and refines the proxies.

**How.** (1) Refresh the TSO RAB/allowed-return/credit-metric data from real regulatory filings — Ofgem RIIO-T2 determinations and ACER monitoring reports (both named in §5) publish these; a periodic ingester keeps them current and dated. (2) Replace the synthetic monthly congestion series with real ENTSO-E cross-border flow and price-spread data (the platform already integrates ENTSO-E per project memory) — congestion rent = `Σ(price_A − price_B) × flow × hours` per §5 from actual market data, making the NordLink/IFA/NEMO interconnector economics real. (3) Refine the `0.15` depreciation proxy and `1.12` RAB premium to per-TSO regulatory depreciation rates and observed market-to-RAB ratios. The RAB/DSCR formulas are correct — keep them.

**Prerequisites.** Ofgem/ACER data ingestion; ENTSO-E flow/price data (already integrated) for real congestion; the core formulas are sound — pin them in `bench_quant`. **Acceptance:** TSO RAB/credit data refreshes from regulatory filings; congestion rent computes from real ENTSO-E flows; the depreciation/premium proxies are per-TSO-sourced.

### 9.2 Evolution B — TSO-finance analyst copilot (LLM tier 2)

**What.** A copilot for the infra-debt/equity-analyst users §1 targets: "what's National Grid's allowed vs earned ROE and DSCR?", "value RTE at 6% WACC and 60% gearing", "which capex programmes have the best IRR?", "what's NordLink's congestion rent at current spreads?" — executed against the RAB/valuation/congestion engine, decomposing each answer into the RIIO revenue-requirement components.

**How.** Tool calls to endpoints wrapping the allowed-return, revenue-requirement, equity-valuation, and congestion functions; system prompt from this Atlas page's §5 formulas and the Ofgem RIIO-T2 / ACER / FERC references named in §5 so regulatory mechanics (RAB, allowed return, IQI incentives) are explained correctly. The WACC/gearing valuation sensitivity (§1) is a recomputation; the capex screener ranks by real IRR. Fabrication validator matches every RAB/ROE/DSCR/IRR figure to a tool response; the congestion answers (post-Evolution-A) cite the ENTSO-E data vintage.

**Prerequisites.** Compute endpoints; the formulas work today on curated data, so a tier-2 analyst is viable now with an as-of disclosure; Evolution A grounds the congestion and refreshes TSO data. **Acceptance:** every RAB/ROE/DSCR/valuation figure traces to a tool call; valuation sensitivities recompute; congestion answers (post-Evolution-A) cite real flow data; the copilot discloses data vintage.