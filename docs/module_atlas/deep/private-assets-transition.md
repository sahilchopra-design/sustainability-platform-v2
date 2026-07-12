## 7 · Methodology Deep Dive

The module implements PE/VC climate due diligence across 10 seeded funds and 50 portfolio companies.
The headline quantitative claim in the guide — `ExitValue_adj = ExitMultiple × EBITDA × (1 −
ClimateHaircut%)` — is present in code, though the code uses **revenue × exit-multiple** (an EV
proxy) rather than EBITDA, and the haircut is a heuristic composite rather than a scenario model.

### 7.1 What the module computes

**Exit value climate adjustment** (the load-bearing formula, Tab 5):

```js
baseEV      = revenue × exitMultiple
haircutFrac = haircutFactor[scenario] × (transFlag ? 2 : 1) × (1 − climateScore/100)
adjustedEV  = baseEV × (1 − haircutFrac)
haircut%    = haircutFrac × 100
```

Three scenario haircut anchors: `conservative 0.03, moderate 0.08, aggressive 0.15`. The haircut is
**doubled** for a transition-flagged company and **scaled by climate-score shortfall** `(1 −
climateScore/100)` — a high-climate-score company (score→100) absorbs almost no haircut; a weak one
(score→25) absorbs 75% of the scenario anchor.

**Due-diligence checklist** (Tab 2): 20 weighted items (weights 6–10) across 6 categories
(Governance, Emissions, Physical Risk, Transition, Strategy, Reporting). Completion is tracked as an
**unweighted count** `ddComplete / 20` — the per-item weights are *displayed* (`wt:{d.weight}`) but
never aggregated into a weighted score.

**LP look-through** (Tab 3): `total = Σ fund.aum`; splits AUM by fund-level `transRisk` bucket
(High/Low). **GP engagement** (Tab 4): 5 dimensions (Strategy, Reporting, Engagement, Targets,
Integration) each a user slider defaulting to 50; overall = simple mean.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Haircut anchors | 0.03 / 0.08 / 0.15 | synthetic demo (scenario labels only) |
| Transition-flag multiplier | ×2 | synthetic heuristic |
| Climate-shortfall factor | `1 − climateScore/100` | synthetic heuristic |
| DD item weights | 6–10 | synthetic; not used in aggregation |
| PortCo revenue | $20–500M | `20 + _sr(i·11)·480` synthetic |
| PortCo climateScore | 25–95 | `25 + _sr(i·17)·70` synthetic |
| transFlag / physFlag | bool | `_sr(i·19)>0.65` / `_sr(i·23)>0.7` |
| exitMultiple | 4–18× | `4 + _sr(i·31)·14` synthetic |
| Fund AUM / vintage / risk | table | hand-authored demo (`PE_FUNDS`) |

### 7.3 Calculation walkthrough

1. **Fund overview** — `fundSummary` joins each fund to its PortCos, computing avg CO₂ intensity and
   flagged-company count. Sector distribution = company count by sector.
2. **Deal screening** — checkbox each of 20 DD items → progress bar `ddComplete/20`.
3. **LP look-through** — AUM aggregated, then split by fund `transRisk` label.
4. **GP engagement** — 5 slider scores → radar + mean.
5. **Exit adjustment** — per company, apply the haircut formula above; chart base vs adjusted EV.
6. **Vintage analysis** — `vintageData` groups funds by vintage year (2018–23), averaging climate
   score and summing AUM.

### 7.4 Worked example (Exit Value, moderate scenario)

Take a transition-flagged PortCo: `revenue = $300M`, `exitMultiple = 10×`, `climateScore = 40`,
`transFlag = true`, scenario = **moderate** (anchor 0.08):

| Step | Computation | Result |
|---|---|---|
| Base EV | 300 × 10 | **$3,000M** |
| Haircut frac | 0.08 × 2 × (1 − 40/100) = 0.08 × 2 × 0.60 | **0.096** |
| Adjusted EV | 3000 × (1 − 0.096) | **$2,712M** |
| Haircut % | 0.096 × 100 | **9.6%** |

A non-flagged company at the same climate score would take `0.08 × 1 × 0.60 = 4.8%`; a strong
(score 90) flagged company `0.08 × 2 × 0.10 = 1.6%`. So the wedge is driven entirely by the
flag-doubling and the climate-score shortfall.

### 7.5 Data provenance & limitations

- **All 50 PortCos are synthetic**, seeded by `_sr(s) = frac(sin(s+1)×10⁴)`. The 10 funds are
  hand-authored demo entries. No real fund/GP/LP data.
- The exit haircut is a **three-point heuristic**, not a scenario-conditioned valuation: no NGFS
  pathway, no sector carbon-cost curve, no discount-rate repricing. `transFlag`-doubling is a
  binary switch, not a continuous transition-risk function.
- DD weights are decorative — a weighted completeness score (the natural production metric) is not
  computed. GP engagement is entirely user-entered (no evidence linkage).
- EBITDA is not modelled; the code uses revenue×multiple as an EV proxy, diverging from the guide's
  `ExitMultiple × EBITDA`.

**Framework alignment:** **ILPA ESG Assessment Framework** (LP-facing DD data conventions) — the
20-item checklist mirrors ILPA/iCI DD topics; **iCI (Initiative Climate International)** private-
equity carbon-footprinting — the emissions items echo iCI's Scope 1–3 expectations; **GRESB PE** —
fund-level ESG benchmarking. **SFDR PAI** and **EU Taxonomy** appear as reporting checklist items.
None of these frameworks' scoring math is implemented; they inform the checklist taxonomy only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the transition-risk haircut to exit enterprise value for private
portfolio companies over a defined hold-to-exit horizon, supporting GP value-bridge planning and LP
look-through risk aggregation. Coverage: all PortCos with sector + emissions + financials.

**8.2 Conceptual approach.** A **discounted-cash-flow repricing under NGFS/IEA transition
scenarios**, mirroring (i) Aladdin Climate's asset-level transition-cost repricing and (ii) CDC/iCI
private-equity carbon value-at-risk. The haircut is the % change in exit EV between a business-as-
usual and a policy scenario, driven by a company-specific carbon-cost pass-through and multiple
compression, not a flat anchor.

**8.3 Mathematical specification.**
For company c, hold to exit year `T`:
`CarbonCost_c(t) = emissions_c(t) × CarbonPrice_s(t) × (1 − passThrough_c)`
`EBITDA_adj_c(T) = EBITDA_c(T) − CarbonCost_c(T)`
`Multiple_adj_c = Multiple_c × (1 − κ·ΔsectorTransitionRisk_s)`  (κ = multiple-compression elasticity)
`ExitEV_adj = EBITDA_adj_c(T) × Multiple_adj_c`
`Haircut_c = 1 − ExitEV_adj / (EBITDA_c(T) × Multiple_c)`

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon price path | `CarbonPrice_s(t)` | NGFS Phase IV shadow-carbon (Net Zero 2050 / Delayed / Current) |
| Emissions path | `emissions_c(t)` | company Scope 1–2 (PCAF DQ-scored) + sector decarb curve (IEA NZE) |
| Pass-through | `passThrough_c` | IEA sector cost pass-through (40–70% industrials) |
| Multiple compression κ | κ | empirical PE exit-multiple regressions on carbon intensity |
| Sector transition risk | `ΔsectorTransitionRisk_s` | NGFS sectoral GVA loss |

**8.4 Data requirements.** Per PortCo: Scope 1–2 emissions (+DQ tier), revenue/EBITDA, sector,
entry multiple, hold horizon. Sources: portfolio monitoring data (GP), PCAF for emissions
estimation, NGFS/IEA for scenario paths. Platform holds seeded analogues only; NGFS carbon paths
exist in `climate_scenario_variables` (migration 088) and could feed this.

**8.5 Validation & benchmarking.** Backtest exit haircuts against realised exit-multiple compression
for carbon-intensive vs clean exits (2018–24 vintages); sensitivity to carbon-price path and κ;
reconcile aggregate LP look-through against iCI PE carbon-VaR benchmarks.

**8.6 Limitations & model risk.** Private emissions data is sparse → DQ-weighted estimation; κ is
regime-dependent and thinly evidenced; scenario carbon prices are highly uncertain post-2035.
Conservative fallback: where emissions unknown, use sector-median intensity and flag DQ tier 5.
