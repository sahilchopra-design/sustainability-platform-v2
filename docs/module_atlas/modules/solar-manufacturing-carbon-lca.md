# Solar Manufacturing Carbon LCA
**Module ID:** `solar-manufacturing-carbon-lca` · **Route:** `/solar-manufacturing-carbon-lca` · **Tier:** B (frontend-computed) · **EP code:** EP-ED4 · **Sprint:** ED

## 1 · Overview
Lifecycle carbon assessment of solar PV module manufacturing. Quantifies cradle-to-gate carbon intensity (gCO2e/kWh), scope 1/2/3 emissions, energy payback period, and carbon payback across manufacturing locations and technology types per IEC 63274 and ISO 14040/44.

> **Business value:** Used by solar manufacturers seeking EU Taxonomy compliance, project developers requiring EPDs, and ESG investors assessing supply chain scope 3 emissions of solar portfolios.

**How an analyst works this module:**
- Filter LCA profiles by manufacturing country to see grid mix impact
- Review scope 1-2-3 breakdown for carbon hotspot identification
- Examine energy payback by installation location
- Compare EPD certificates across module types

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `LCA_PRODUCTS`, `PAYBACK_SCENARIOS`, `STAGE_BREAKDOWN`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LCA_PRODUCTS` | 13 | `technology`, `energyUse`, `carbonFp`, `carbonPayback`, `waterLPw`, `rawMatIntensity`, `eolRecyclability`, `gridCarbon` |
| `STAGE_BREAKDOWN` | 9 | `gco2e`, `water`, `color` |
| `PAYBACK_SCENARIOS` | 11 | `china550`, `eu290`, `re28` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgCarbon` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonFp, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgPayback` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.carbonPayback, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `avgRecyclability` | `useMemo(() => filtered.length ? (filtered.reduce((a, p) => a + p.eolRecyclability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `minPayback` | `useMemo(() => filtered.length ? Math.min(...filtered.map(p => p.carbonPayback)).toFixed(1) : '0.0', [filtered]);` |
| `totalStageCO2` | `STAGE_BREAKDOWN.reduce((a, s) => a + s.gco2e, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LCA_PRODUCTS`, `PAYBACK_SCENARIOS`, `STAGE_BREAKDOWN`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity (gCO2e/kWh) | `Lifecycle_GHG / (AEP × lifetime); IEC 63274` | NREL LCA Harmonization + IEA PVPS Task 12 | Xinjiang polysilicon (coal) can double CI vs European or US-manufactured polysilicon. |
| Energy Payback Period (years) | `EPBT = E_manufacturing / E_annual` | IEA PVPS Task 12 (2020) | MENA/India 2000+ kWh/m²/yr → 0.5-0.8 yr; central Europe → 1.5-2.5 yr. |
| Scope 3 Share (%) | `Upstream materials extraction + processing` | ISO 14040/44 + GHG Protocol Category 1 | Cell manufacturing 60-70% of module carbon; upstream polysilicon 15-25%. |
- **Manufacturing energy + grid emission factors + irradiance data + ISO 14040 inventory** → LCA carbon intensity + EPBT calculator + scope 1-2-3 breakdown → **Carbon intensity benchmarking for EU Taxonomy, CBAM compliance, and EPD certification**

## 5 · Intermediate Transformation Logic
**Methodology:** Carbon Intensity & Energy Payback Calculation
**Headline formula:** `CI = mfg_emissions_gCO2e / (AEP_kWh × lifetime_yrs); EPBT = E_mfg / P_annual`

Mono-Si module China grid: 35-50 gCO2e/kWh; Europe renewables: 15-25 gCO2e/kWh; CdTe: 15-22 gCO2e/kWh. Energy payback: 0.5-2.5 years. Carbon payback: 0.5-2.0 years. Coal power: 820 gCO2e/kWh.

**Standards:** ['ISO 14040/44 LCA Methodology', 'IEC 63274 Solar PV LCA Standard', 'NREL LCA Harmonization']
**Reference documents:** ISO 14040 (2006) – LCA Principles; IEC 63274 (2022) – LCA for PV Systems; IEA PVPS Task 12 Report (2020)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Parameterised LCA engine with EU Taxonomy screening (analytics ladder: rung 1 → 2)

**What.** This is one of the batch's better tier-B modules: `LCA_PRODUCTS` (12 rows) is hand-curated real-technology data with a methodologically sound comparative design (§7.2 holds manufacturing energy constant and varies only the grid EF, correctly isolating the grid effect — HJT drops from 52 to 8.5 gCO₂e/Wp purely from site decarbonisation), and `STAGE_BREAKDOWN` reconciles internally (Σ = 40.7 vs the 42.0 China-grid Mono-Si total). Its limit is that it is a static lookup: the CI and EPBT formulas are stated in §5 but the page renders pre-computed constants rather than computing from user inputs. Evolution A turns the reference tables into a live LCA calculator and adds the EU Taxonomy screen the overview promises.

**How.** (1) Implement `CI = mfg_emissions / (AEP × lifetime)` and `EPBT = E_mfg / P_annual` as functions taking manufacturing-grid EF, process energy (kWh/Wp), install-location AEP, and lifetime — so a user can compute a specific product/site combination, not just read the 12 preset rows. (2) An EU Taxonomy substantial-contribution screen for PV manufacturing (the overview's stated purpose) with the DNSH check against the actual technical screening criteria. (3) Extend `PAYBACK_SCENARIOS` beyond the three fixed displaced-grid cases to any user grid intensity. (4) Attach IEA-PVPS Task 12 / IEC 63274 vintage citations per coefficient.

**Prerequisites.** EU Taxonomy PV-manufacturing TSC encoding; process-energy defaults per technology (already in the table). **Acceptance:** changing manufacturing-grid EF recomputes CI via the formula (matching the China-vs-EU comparative the table shows); the Taxonomy screen returns aligned/not-aligned with the driving criterion; carbon payback computes for an arbitrary displaced grid.

### 9.2 Evolution B — LCA-and-EPD copilot for procurement and disclosure (LLM tier 1)

**What.** A copilot for the manufacturer/developer/ESG-investor users: "what's the cradle-to-gate carbon intensity of TOPCon made in China vs the EU?", "where are the LCA hotspots?", "does this module meet EU Taxonomy for our procurement spec?" — answered from the `LCA_PRODUCTS` and `STAGE_BREAKDOWN` data and the ISO 14040/44 and IEC 63274 framework structure the module follows.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-manufacturing-carbon-lca/ask`, corpus = this Atlas record (the comparative design, stage breakdown, and framework alignment) plus live page state. Hotspot answers cite the `STAGE_BREAKDOWN` shares (polysilicon 35.6%); grid-effect answers narrate the same-technology-different-grid comparison the data already isolates. Post-Evolution-A, computation questions re-run the LCA calculator. The end-of-life recycling credit (the −0.8 gCO₂e/Wp system-expansion convention) is explained honestly as an LCA credit, not a physical removal.

**Prerequisites.** None hard — the data is real, cited, and internally consistent; Evolution A lets the copilot answer arbitrary product/site queries with computed CI. **Acceptance:** every gCO₂e/Wp figure matches `LCA_PRODUCTS` or a computed run; hotspot shares match `STAGE_BREAKDOWN`; a technology or grid outside the dataset returns a scoped estimate labelled as such.