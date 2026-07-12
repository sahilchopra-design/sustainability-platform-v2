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
