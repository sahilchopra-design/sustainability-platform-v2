# Private Assets Transition Risk
**Module ID:** `private-assets-transition` · **Route:** `/private-assets-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CI2 · **Sprint:** CI

## 1 · Overview
PE/VC climate due diligence with LP look-through, GP engagement assessment, and exit value climate haircut.

**How an analyst works this module:**
- Fund Portfolio Overview shows sector and geography allocation
- Deal Climate Screening runs 20-item DD checklist
- Exit Value Adjustment models climate haircut on exit multiples

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DD_CHECKLIST`, `PE_FUNDS`, `PORTFOLIO_COS`, `SECTORS`, `SEC_COLORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PE_FUNDS` | 11 | `name`, `vintage`, `aum`, `strategy`, `companies`, `avgClimate`, `transRisk`, `physRisk` |
| `DD_CHECKLIST` | 21 | `cat`, `item`, `weight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `['Software', 'Healthcare', 'Manufacturing', 'Energy', 'Fintech', 'Consumer', 'Logistics', 'Clean Tech', 'Real Estate', 'Agri-Food'];` |
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Fund Portfolio Overview', 'Deal Climate Screening', 'LP Look-Through', 'GP Engagement Assessment', 'Exit Value Climate Adjustment', 'Vintage Transition Analysis'];` |
| `fundSummary` | `PE_FUNDS.map(f => {` |
| `exitData` | `filteredCos.slice(0, 20).map(c => ({` |
| `vintageData` | `[2018, 2019, 2020, 2021, 2022, 2023].map(v => {` |
| `lpExposure` | `useMemo(() => { const total = PE_FUNDS.reduce((s, f) => s + f.aum, 0);` |
| `ddCats` | `[...new Set(DD_CHECKLIST.map(d => d.cat))];` |
| `gpRadar` | `gpDims.map(d => ({ dim: d, score: gpScores[d] \|\| 50 }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DD_CHECKLIST`, `PE_FUNDS`, `SECTORS`, `SEC_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Funds | — | Demo | PE funds with 50 underlying companies |
| DD Checklist | — | ILPA | Climate due diligence items |

## 5 · Intermediate Transformation Logic
**Methodology:** PE exit value climate adjustment
**Headline formula:** `ExitValue_adj = ExitMultiple × EBITDA × (1 - ClimateHaircut%)`

Pre-acquisition DD: 20-item climate checklist. LP look-through aggregates climate exposure across all fund investments. Exit haircut estimates value reduction under transition scenarios for the exit year.

**Standards:** ['ILPA ESG', 'iCI', 'GRESB PE']
**Reference documents:** ILPA ESG Principles; PRI Private Equity Guide; GRESB PE Benchmark

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — NGFS-anchored exit haircuts on a real fund book (analytics ladder: rung 2 → 3)

**What.** The exit-adjustment formula is real but heuristic: `haircutFrac = anchor[scenario] × (transFlag ? 2 : 1) × (1 − climateScore/100)` with synthetic anchors (0.03/0.08/0.15), applied to 10 hand-authored funds and 50 `_sr()`-seeded portfolio companies; §7.1 also notes the DD checklist displays per-item weights (6–10) but aggregates an unweighted count, and the code uses revenue×multiple rather than the guide's EBITDA basis. Evolution A replaces the scenario anchors with sector-differentiated haircuts derived from the platform's NGFS scenario assets, moves the calculation to a backend, and persists a real fund/PortCo register.

**How.** (1) New `api/v1/routes/private_assets_transition.py` with `POST /exit-adjustment` — haircut = f(sector transition pathway under the chosen NGFS scenario at exit year, company climate score), replacing the flat ×2 transition-flag multiplier with the sector's scenario-implied value-at-risk band; document the derivation per Atlas §8 convention. (2) Tables `pe_funds` / `pe_portfolio_companies` (org-scoped, `portfolios_pg` pattern) so LP look-through aggregates a user's actual book instead of `PE_FUNDS`. (3) Fix the DD aggregation to the weighted score the UI already implies: `Σ(done_i × w_i)/Σw_i`, and align the EV basis (EBITDA input field, revenue fallback flagged).

**Prerequisites.** NGFS sector pathway mapping for the 10 `SECTORS`; the guide's EBITDA claim corrected or implemented. **Acceptance:** bench case where an Energy PortCo's haircut exceeds a Software PortCo's under disorderly-2030 by the documented sector spread; weighted DD score changes when a weight-10 item toggles, unlike today.

### 9.2 Evolution B — Deal-screening copilot for the DD checklist (LLM tier 1 → 2)

**What.** The 20-item ILPA-derived checklist is the natural LLM surface: a copilot that takes a deal description (or uploaded CIM text) and pre-populates checklist assessments — "target discloses Scope 1/2 but no transition plan: items 4, 9 provisionally satisfied, items 12–14 open" — each suggestion citing the checklist item and the source passage, with the analyst confirming every tick (the copilot proposes, never completes DD).

**How.** Tier 1: RAG over this Atlas record plus the checklist items and ILPA/iCI/GRESB-PE reference texts already named in §5, served via `POST /api/v1/copilot/private-assets-transition/ask`. Tier 2 upgrade after Evolution A: "what's the exit haircut range for this deal under all three scenarios?" becomes three `POST /exit-adjustment` tool calls, and "summarize LP look-through for our energy exposure" reads the persisted fund book. Fabrication guardrail: portfolio numbers only from tool outputs; checklist suggestions always marked provisional.

**Prerequisites.** Document-upload path for CIM text (the platform's uploads route exists); Evolution A for any quantitative tool-calling. **Acceptance:** every checklist suggestion cites a specific passage; the copilot refuses to output an exit haircut before Evolution A endpoints exist.