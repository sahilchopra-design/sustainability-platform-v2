## 7 · Methodology Deep Dive

### 7.1 What the module computes

`LCA_PRODUCTS` (12 rows) is a **hand-curated, real-technology dataset** (no `sr()` PRNG for content) covering
Mono-Si PERC/TOPCon, HJT, IBC, CdTe (First Solar), CIGS, Perovskite-Si tandem and Multi-Si BSF, each paired
with the **manufacturing grid** that powers production (China grid ~550 gCO₂/kWh, EU grid ~290, or
renewable-powered <30). Each row carries `energyUse` (kWh/Wp manufacturing energy), `carbonFp` (gCO₂e/Wp
lifecycle footprint), `carbonPayback` (years), water intensity, raw-material intensity, and end-of-life
recyclability %. A `STAGE_BREAKDOWN` (8 rows) decomposes a representative module's footprint by manufacturing
stage (Polysilicon → Wafer → Cell → Module → BOS → Transport → O&M → End-of-Life, the last showing a
**negative** value representing avoided emissions from recycling credit).

### 7.2 Parameterisation

| Field | Illustrative values | Provenance |
|---|---|---|
| Same technology, different grid | Mono-Si PERC: China grid `carbonFp=42.0`, EU grid `carbonFp=22.0` (same `energyUse=28.5` kWh/Wp) | correctly isolates the grid-carbon-intensity effect by holding manufacturing energy constant and varying only the emission factor — a methodologically sound comparative design |
| HJT China vs RE-powered | `carbonFp` 52.0 → 8.5 gCO₂e/Wp (same 35.0 kWh/Wp energy use) | shows the ~6× footprint reduction achievable purely from manufacturing-site decarbonisation, holding process energy intensity fixed |
| `STAGE_BREAKDOWN` totals | Σ gCO₂e = 14.5+7.8+8.2+4.5+3.2+2.1+1.2−0.8 = **40.7 gCO₂e/Wp** | close to the China-grid Mono-Si PERC total of 42.0 in `LCA_PRODUCTS`, i.e. internally consistent between the two datasets |
| Polysilicon share of stage total | 14.5/40.7 ≈ **35.6%** (or 14.5/42 ≈ 34.5% of the headline figure) | consistent with published LCA literature identifying polysilicon production as the single largest lifecycle-carbon contributor |
| End-of-Life credit | −0.8 gCO₂e/Wp | represents avoided virgin-material extraction emissions from recycling — a standard LCA system-expansion credit convention |

### 7.3 Calculation walkthrough — `PAYBACK_SCENARIOS`

The Carbon Payback Period tab traces a **linear carbon-payback curve** under 3 displaced-grid scenarios
(china550, eu290, re28 — the *operating* grid a manufactured panel offsets, distinct from the *manufacturing*
grid):

```
%PaybackAtTime(t) = 100 × t / PaybackYears_scenario
```
Reverse-solving the table's own values: `china550` reaches 100% at `t=1.8yr` (fastest, because it displaces
the most carbon-intensive grid electricity per kWh generated); `eu290` reaches only 87.9% by `t=1.8yr`
(implied full payback ≈ `1.8/0.879 ≈ 2.05yr`); `re28` reaches 76.5% by `t=1.8yr` (implied full payback ≈
`1.8/0.765 ≈ 2.35yr`). This is physically correct: a panel that displaces a dirtier grid earns back its
embodied manufacturing carbon faster than one displacing an already-clean grid, for the same manufacturing
footprint.

### 7.4 Worked example

For the `china550` scenario at `t=1yr`: `%Payback = 100×1/1.8 = 55.5%` — matches the table's `year:1,
china550:55.5` row exactly, confirming the linear-in-time model with a fixed per-scenario payback-year
denominator.

For a Mono-Si PERC panel manufactured on the EU grid (`carbonFp=22.0 gCO₂e/Wp`, `carbonPayback=0.9yr`) vs
the same technology on the China grid (`carbonFp=42.0`, `carbonPayback=1.8yr`): the **EU-grid-manufactured
panel pays back its (lower) embodied carbon in half the time** — both the lower numerator (less embodied
carbon) and the fact that it's generally deployed and offsetting similar grids drives this 2× improvement,
consistent with the module's filter buttons (China ~550g / EU ~290g / RE <30g).

### 7.5 Data provenance & limitations

- **All figures are hand-curated, plausible, internally cross-consistent estimates** grounded in published
  ranges (the guide cites IEA-PVPS Task 12, NREL LCA Harmonization, ISO 14040/44) — not live-sourced from a
  specific LCA database query, and should be treated as illustrative rather than certified EPD-grade figures
  for any specific manufacturer.
- The linear-in-time payback model is a simplification — real carbon payback should account for
  degradation-adjusted annual generation (a panel's output declines ~0.5%/yr), which would make the true
  payback curve slightly concave rather than perfectly linear; the model's <2-year time horizon makes this a
  minor effect but it is not represented.
- `STAGE_BREAKDOWN` is presented as a single representative module profile, not linked to any specific row
  in `LCA_PRODUCTS` by manufacturing grid or technology — a user cannot verify which `LCA_PRODUCTS` entry the
  stage breakdown is meant to explain (its total of 40.7 gCO₂e/Wp is closest to, but not identical to, the
  China-grid Mono-Si PERC row's 42.0).

### 7.6 Framework alignment

- **ISO 14040/44 (LCA methodology)** — the cradle-to-gate stage decomposition (raw material → processing →
  assembly → transport → use-phase O&M → end-of-life) follows the standard's system-boundary structure,
  including the end-of-life recycling credit via system expansion.
- **IEC 63274 (PV system LCA standard)** — cited as the basis for the carbon-intensity and energy-payback
  metrics; the module reports plausible results in the standard's expected range (15–80 gCO₂e/kWh cradle-to-
  gate, per the guide) without re-deriving them from first-principles process data.
- **NREL LCA Harmonization / IEA PVPS Task 12** — the grid-dependency comparative design (same technology,
  different manufacturing-grid carbon intensity) mirrors these projects' own harmonisation methodology of
  isolating grid-mix effects from technology effects.
