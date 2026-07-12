# Solar Cell Technology Analyzer
**Module ID:** `solar-cell-technology-analyzer` · **Route:** `/solar-cell-technology-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-ED2 · **Sprint:** ED

## 1 · Overview
Solar cell technology comparison and market analysis. Benchmarks efficiency, cost, temperature coefficient, and degradation rate across BSF, PERC, TOPCon, HJT, IBC, Perovskite-Si tandem, CdTe, and CIGS. Tracks market share transition and projects technology roadmaps to 2030.

> **Business value:** Used by solar developers, EPCs, equipment buyers, and technology investors to select solar cell technologies based on efficiency, cost, reliability, and bankability.

**How an analyst works this module:**
- Review technology overview for efficiency and cost across 8 technologies
- Examine efficiency roadmap for NREL record progression
- Use cost trajectory for Wright's Law projection
- Analyse market share for PERC→TOPCon transition forecast

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EFFICIENCY_ROADMAP`, `KpiCard`, `TABS`, `TECHNOLOGIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECHNOLOGIES` | 9 | `name`, `efficiencyRecord`, `commercialEff`, `costPerWp`, `tempCoeff`, `bifaciality`, `degradationYr`, `maturity`, `trl`, `keyPlayer`, `marketShare2024`, `color` |
| `EFFICIENCY_ROADMAP` | 10 | `PERC`, `TOPCon`, `HJT`, `IBC`, `CdTe`, `CIGS` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `radarData` | `useMemo(() => [ { metric: 'Efficiency', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.commercialEff])) }, { metric: 'Bifaciality', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.bifaciality])) }, { metric: 'Maturity', ...Object.fromEntries(TECHNOLOGIES.map(t => [t.name, t.maturity * 20])) }, { metric: 'Low Degradation', .` |
| `marketShareData` | `useMemo(() => TECHNOLOGIES.map(t => ({ name: t.name, value: t.marketShare2024 })), []);` |
| `COLORS` | `TECHNOLOGIES.map(t => t.color);` |
| `costEffData` | `useMemo(() => TECHNOLOGIES.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EFFICIENCY_ROADMAP`, `TABS`, `TECHNOLOGIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cell Efficiency Record (%) | `Measured at STC (25°C, 1000 W/m², AM1.5G)` | NREL Best Research-Cell Efficiency Chart 2024 | Commercial module efficiency lags cell by 2-4pp; Perovskite-Si tandem target 30%+ commercialization by 2027. |
| Temperature Coefficient (%/°C) | `Δη/ΔT per IEC 60904-5` | Module datasheets + NREL | HJT best: -0.26%/°C; PERC -0.35%; BSF worst: -0.45%; critical for hot climates. |
| Learning Rate (%) | `1 - 2^(-b) from log-log regression` | Lafond et al. 2018 | Module cost $76/W (1977) → $0.16/W (2023); 99.8% cost reduction. |
- **NREL efficiency chart + BNEF cost data + market share tracker** → Technology benchmarking + Wright's Law cost projection + market share transition model → **Technology selection for solar project developers, procurement, and investment decisions**

## 5 · Intermediate Transformation Logic
**Methodology:** Technology Efficiency Roadmap & Learning Curve
**Headline formula:** `Wright_Law: C(Q) = C_0 × (Q/Q_0)^(-b); b = log2(1-LR), LR = 24% for c-Si`

NREL 2024 records: PERC 24%, TOPCon 26%, HJT 26.7%, IBC 26.7%, Perovskite-Si tandem 33.9%. PERC ~83% production 2022; TOPCon ~35% by 2024. Wright's Law: each capacity doubling → 24% cost reduction.

**Standards:** ['NREL Best Research-Cell Efficiency Chart', 'IEA Technology Roadmap Solar PV 2023']
**Reference documents:** NREL Best Research-Cell Efficiency Chart (2024); IEA Technology Roadmap: Solar PV 2023; Haegel et al. (2023) Terawatt-Scale Photovoltaics, Science

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this batch, `TECHNOLOGIES` (8 rows: PERC, TOPCon, HJT, IBC, Perovskite-Si Tandem, BSF
Monofacial, CdTe, CIGS) is **entirely hand-curated from real published sources** — the file's own header
comment cites NREL record efficiencies (TOPCon 26.1%, HJT 26.8%, IBC 26.7%, Tandem 33.9%), the PERC→TOPCon
2022→2024 market-share transition, and Wright's Law at a 24% learning rate. The platform's `sr()` PRNG
function is defined in this file but **never called** — every efficiency, cost, temperature-coefficient,
bifaciality, degradation, and market-share figure is a manually entered constant, not randomly generated.
`EFFICIENCY_ROADMAP` (2010–2025, 9 vintage years × 6 technologies) similarly traces real NREL Best Research-
Cell Efficiency Chart progression.

### 7.2 Parameterisation

| Field | Values (illustrative rows) | Provenance |
|---|---|---|
| `efficiencyRecord` | PERC 24.5%, TOPCon 26.1%, HJT 26.8%, IBC 26.7%, Tandem 33.9%, CdTe 22.3%, CIGS 23.4% | NREL Best Research-Cell Efficiency Chart (cited in-file) |
| `commercialEff` | consistently 1.5–5.4pp below `efficiencyRecord` | realistic lab-to-commercial gap, hand-set per technology |
| `costPerWp` | $0.14 (BSF, legacy) – $0.45 (Tandem, pre-commercial) | plausible BNEF-consistent cost ordering, not cited to a specific BNEF report edition |
| `tempCoeff` | −0.20%/°C (Tandem) to −0.40%/°C (BSF) | consistent with published module datasheets (HJT/TOPCon typically outperform PERC/BSF on temp coefficient) |
| `marketShare2024` | PERC 35%, TOPCon 40%, HJT 8%, IBC 3%, Tandem 0.1%, BSF 10%, CdTe 3%, CIGS 1% | matches the file header's cited PERC→TOPCon transition narrative |
| `maturity` (1–5) / `trl` (1–9) | hand-set, e.g. Tandem maturity=2/trl=6 vs PERC/TOPCon maturity=5/trl=9 | qualitative technology-readiness judgment, not a formal TRL assessment methodology |

### 7.3 Calculation walkthrough

- **Radar chart** (Technology Comparison tab): derives 5 axes from the raw fields via hand-set linear
  rescalings, not sourced constants:
  ```
  Bifaciality axis    = bifaciality (as-is, 0-100 already)
  Maturity axis        = maturity × 20                              (1-5 scale → 20-100)
  Low-Degradation axis = max(0, 100 − degradationYr × 60)            (0.38%/yr → ~77; 1.20%/yr → 28)
  Low-TempCoeff axis    = max(0, 100 + tempCoeff × 150)               (−0.20 → 70; −0.40 → 40)
  ```
  These rescaling constants (×20, ×60, ×150) are chosen so each axis spans roughly 0–100 given the observed
  data range — a cosmetic normalisation, not a benchmarked scoring methodology.
- **Cost-efficiency scatter**: plots `costPerWp` vs `commercialEff` sized/coloured by `marketShare2024` — a
  direct, unmodified visualisation of the input data (no derived calculation).
- **Efficiency Roadmap**: line chart of `EFFICIENCY_ROADMAP` by technology across the 9 vintage years —
  again a direct rendering of curated historical data, not a projection or fit.

### 7.4 Worked example

HJT technology radar scores:

| Axis | Formula | Result |
|---|---|---|
| Efficiency | `commercialEff` | 24.5 |
| Bifaciality | as-is | 92 |
| Maturity | `4 × 20` | 80 |
| Low Degradation | `100 − 0.40×60` | 76 |
| Low TempCoeff | `100 + (−0.24)×150` | 64 |

HJT scores strongly on bifaciality and degradation, moderately on temp coefficient — consistent with the
technology's real-world reputation for high bifacial gain and low mid-life degradation (LeTID resistance),
even though the specific numeric transform is a hand-tuned display convenience rather than a cited formula.

### 7.5 Data provenance & limitations

- **This is one of the more evidence-grounded modules in the batch** — all headline technology figures
  trace to real, named, citable sources (NREL efficiency chart, market-share transition narrative) rather
  than a PRNG.
- The radar-axis rescaling constants (×20, ×60, ×150) are **not published benchmarks** — they are cosmetic
  linear transforms chosen to fit the observed data into a 0–100 display range, and would need re-tuning if
  new technologies with more extreme values were added (e.g. a hypothetical >2%/yr degradation technology
  would drive the Low-Degradation axis negative before the `max(0,·)` floor).
- No live data refresh mechanism — NREL/BNEF figures will drift from the platform's snapshot over time
  without a documented update cadence.
- `maturity`/`trl` scores are qualitative judgments, not derived from a formal technology-readiness-level
  assessment framework (e.g. DOE TRL definitions applied criterion-by-criterion).

### 7.6 Framework alignment

- **NREL Best Research-Cell Efficiency Chart** — the primary source for all `efficiencyRecord` values;
  correctly and consistently applied.
- **IEA Technology Roadmap: Solar PV (2023) / Haegel et al. (2023) Terawatt-Scale Photovoltaics** — cited in
  the guide as supporting references for the market-transition and learning-rate narrative; the Wright's Law
  24% learning rate mentioned in the file header is **descriptive context, not applied in any calculation**
  in this file (contrast with `solar-module-manufacturing-economics`, which does implement a learning curve).
- **IEC 60904-5 (temperature coefficient measurement standard)** — the guide cites this for
  `tempCoeff`; the module reports the values but does not perform or simulate the measurement.

## 9 · Future Evolution

### 9.1 Evolution A — Apply the Wright's-Law curve the page only narrates, with live NREL refresh (analytics ladder: rung 1 → 2)

**What.** This is a well-grounded tier-B module: `TECHNOLOGIES` (8 cell types) and `EFFICIENCY_ROADMAP` (2010–2025) are entirely hand-curated from cited real sources (NREL Best Research-Cell Efficiency Chart, IEA Solar PV Roadmap 2023), and the `sr()` PRNG is defined but never called — every efficiency, cost, and market-share figure is a real constant. Its honest gap (§7.6) is that the Wright's-Law 24% learning rate in the file header is **descriptive context, not applied in any calculation**, and the cost/market-share data is a frozen snapshot. Evolution A activates the learning curve as a real projection engine and makes the reference data refreshable.

**How.** (1) Implement the cost-trajectory tab as an actual Wright's-Law projection: `C(Q) = C₀ × (Q/Q₀)^b` with `b = log₂(1−LR)`, per-technology LR configurable (the sibling `solar-module-manufacturing-economics` already does this — share the helper rather than fork). (2) Turn the PERC→TOPCon market-share narrative into a forecast: a logistic adoption curve fit to the 2022→2024 transition data the page already carries, projected to 2030. (3) A light refresh path — NREL updates the efficiency chart periodically; a small ingester keeps `efficiencyRecord` and `EFFICIENCY_ROADMAP` current with cited vintages rather than a hardcoded 2024 snapshot. (4) Attach BNEF-edition citations to `costPerWp` (currently plausible but uncited).

**Prerequisites.** LR priors per technology; a decision on NREL data cadence (annual). **Acceptance:** the cost tab projects future $/Wp from the learning-rate formula, not a static table; changing LR moves the projection; every efficiency value carries its NREL vintage.

### 9.2 Evolution B — Technology-selection copilot for developers and buyers (LLM tier 1)

**What.** A copilot for the EPC/equipment-buyer/investor users the module targets: "TOPCon or HJT for a hot-climate utility project?", "when does perovskite-Si tandem reach bankable maturity?", "which technology has the best temperature coefficient and lowest degradation?" — answered from the real `TECHNOLOGIES` fields (efficiency, tempCoeff, degradation, TRL/maturity, bifaciality) and the NREL/IEA framework context, never inventing datasheet numbers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-cell-technology-analyzer/ask`, corpus = this Atlas record (§7.2 parameter table and the radar-axis rescalings) plus live page state. Comparison answers narrate deterministic sorts/filters over the technology table; the bankability/maturity discussion cites the TRL and maturity fields explicitly, with the honest caveat that TRL here is a qualitative judgment, not a formal assessment. Refusal for technologies outside the 8 covered.

**Prerequisites.** None hard — the data is already real and cited; Evolution A's live projections let the copilot answer forward-looking cost questions with computed values instead of caveated estimates. **Acceptance:** every efficiency/cost/tempCoeff figure in an answer matches the `TECHNOLOGIES` table; a roadmap question about a cell type not in the set returns a scoped refusal.