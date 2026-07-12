# Nuclear Market Intelligence
**Module ID:** `nuclear-market-intelligence` · **Route:** `/nuclear-market-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DU3 · **Sprint:** DU

## 1 · Overview
Global nuclear market intelligence covering 440 operating reactors, 60+ units under construction, lifetime-extension economics, SMR order pipeline, uranium spot markets and national policy comparison.

> **Business value:** The 440-reactor global fleet (390 GW) is growing via 60+ units under construction; uranium spot prices at $80–$100/lb reflect post-Fukushima supply restarts and policy-driven demand from SMR programmes.

**How an analyst works this module:**
- Aggregate IAEA PRIS fleet data by region and technology generation
- Assess lifetime-extension decisions (60→80 year licence applications)
- Map SMR order pipeline by developer and country
- Analyse uranium spot/term price divergence and enrichment market capacity

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COP28_COMMITMENTS`, `EXPORT_MARKETS`, `FINANCING`, `GLOBAL_FLEET`, `KpiCard`, `NEW_BUILD`, `Slider`, `TABS`, `VENDORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GLOBAL_FLEET` | 11 | `operating`, `building`, `planned`, `gwNet`, `pctElec`, `vendor` |
| `NEW_BUILD` | 9 | `country`, `mw`, `vendor`, `status`, `capex_bn`, `cod`, `reactor` |
| `EXPORT_MARKETS` | 9 | `reactor`, `vendor`, `gwPlanned`, `policy`, `risk` |
| `VENDORS` | 9 | `reactor`, `plants`, `mw_export`, `share`, `color` |
| `COP28_COMMITMENTS` | 5 | `signatories`, `gwTarget`, `baseGW`, `status` |
| `FINANCING` | 7 | `provider`, `term`, `cost`, `suitable` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fleetGrowth` | `useMemo(() => Array.from({ length: 26 }, (_, i) => ({ year: 2025 + i, operable: +(372 + annualAddition * i - 4 * i).toFixed(0), building: +(90 - 2 * i + sr(i * 5) * 20).toFixed(0), })), [annualAddition]);` |
| `vendorPie` | `VENDORS.filter(v => v.share > 0).map(v => ({ name: v.vendor.split(" ")[0], value: v.share, fill: v.color }));` |
| `exportPipelineData` | `EXPORT_MARKETS.map(m => ({` |
| `smrPipeline` | `useMemo(() => [ { design:"NuScale VOYGR",  mw_per:77,  units:3, total_mw:231,  cod:2030, country:"Poland / Romania" }, { design:"GEH BWRX-300",   mw_per:300, units:4, total_mw:1200, cod:2031, country:"Canada / Sweden / UK" }, { design:"Rolls-Royce SMR",mw_per:470, units:5, total_mw:2350, cod:2033, country:"UK + exports" }, { design:"X-Ene` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COP28_COMMITMENTS`, `EXPORT_MARKETS`, `FINANCING`, `GLOBAL_FLEET`, `NEW_BUILD`, `TABS`, `VENDORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operating Reactor Fleet | `Fleet GW = Σ(Unit Capacity × Availability)` | IAEA PRIS 2024 | Global installed nuclear capacity tracking unit-by-unit status. |
| Units Under Construction | `Pipeline GW = Σ(Under-construction Unit Capacity)` | IAEA PRIS 2024 | Active construction projects including Chinese and Eastern European programmes. |
| Uranium Spot Price | `Spot = Exchange-cleared short-term transactions` | UxC / TradeTech 2024 | Benchmark spot price for natural uranium concentrate. |
- **IAEA PRIS + UxC price feeds** → Fleet status → uranium demand projection → **Market intelligence dashboard by region and technology**

## 5 · Intermediate Transformation Logic
**Methodology:** Uranium Spot Price Model
**Headline formula:** `U₃O₈ Spot = Supply–Demand Balance + Speculative Premium + Policy Shift Indicator`

Structural supply-demand balance with policy-driven premium component.

**Standards:** ['UxC Uranium Market Outlook', 'World Nuclear Association Fuel Report']
**Reference documents:** IAEA PRIS — Power Reactor Information System; World Nuclear Association — World Nuclear Performance Report 2023; UxC Uranium Market Outlook Q1 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is almost entirely **static, real-world reference data** — it is closer to a curated
market almanac than a calculation engine. The guide's "Uranium Spot Price Model" formula
(`Spot = Supply–Demand Balance + Speculative Premium + Policy Shift Indicator`) is descriptive
framing for the module's *content*, not an implemented pricing model; there is no spot-price
calculation anywhere in the file (uranium price series live in the separate `nuclear-fuel-cycle`
module).

### 7.1 What the module computes

Nine static reference tables carry almost all of the module's informational content:

- **`GLOBAL_FLEET`** (10 countries) — operating/building/planned reactor counts, net GW, % of
  national electricity, primary vendor. Figures (USA 93 operating/95.5 GW, France 56/61.4 GW,
  China 56 operating + 27 building, Germany phased out 2023) match real IAEA PRIS-class fleet
  statistics closely.
- **`NEW_BUILD`** (8 flagship projects) — Hinkley Point C ($46bn, EPR, 2029 COD), Vogtle 3+4
  (complete 2023/24, $35bn), Akkuyu, El-Dabaa, Rooppur, Barakah, Paks II, Flamanville 3 — capex and
  COD figures are consistent with widely reported project cost overruns (Hinkley's $46bn and
  Vogtle's $35bn both match commonly cited public figures for these specific projects).
- **`EXPORT_MARKETS`** (8 emerging nuclear markets) — Poland, Czech Republic, Saudi Arabia,
  Indonesia, Ghana/Kenya, Kazakhstan, India, Brazil — with a qualitative `risk` rating (Low/Medium/
  High), not a scored risk model.
- **`VENDORS`** (8 reactor vendors) — Rosatom 28% export share, CGN/CNNC 20%, Westinghouse 14%,
  KEPCO 9%, EDF/Framatome 7% — plausible relative rankings (Rosatom's dominant export share and
  Westinghouse's post-Vogtle position are consistent with the real vendor landscape) with a
  supporting `mw_export` figure per vendor.
- **`COP28_COMMITMENTS`** — the real **"Triple Nuclear Capacity by 2050"** declaration (25
  signatories, 372 GW baseline → 600 GW target, adopted December 2023 at COP28) — this is an
  accurate real-world figure and date.
- **`FINANCING`** (6 structures) — CfD/PPA, Export Credit Agency, MDB development finance, ATOM
  bonds, DOE Loan Programs Office guarantees, and the UK's Regulated Asset Base (RAB) model
  (Sizewell C, ~6.5% allowed return) — correctly named real nuclear-project financing mechanisms.

### 7.2 Parameterisation — the two derived series

```js
fleetGrowth[i]  = { operable: 372 + annualAddition×i − 4×i,        // linear net-addition model
                    building: 90 − 2×i + sr(i×5)×20 }              // linear decline + small PRNG jitter
exportPipelineData[m] = { capex: gwPlanned × 6 }                    // flat $6bn/GW capex assumption
```

`372` (2025 baseline operable reactors) and the `600` GW 2050 target slider default both trace
directly to the real COP28 declaration figures above — a genuine anchor point, even though the
year-by-year interpolation between them is a simple linear model, not a project-by-project pipeline
roll-up.

### 7.3 Calculation walkthrough

1. User sets `annualAddition` (net new reactors/yr) and `gwTarget2050` sliders.
2. `fleetGrowth` extrapolates `operable` reactor count linearly from the 372-unit 2025 baseline,
   netting a flat "4 retirements/yr" assumption against the slider's addition rate — a first-order
   approximation with no country-level or reactor-lifetime detail.
3. `exportPipelineData` values each `EXPORT_MARKETS` row's implied capex at a flat $6bn/GW — a
   single blended rate that doesn't differentiate reactor technology (AP1000 vs. VVER vs. SMR) or
   country risk premium, despite the same table carrying a `risk` field that isn't fed into the
   capex estimate.
4. All other tabs (Vendor Landscape, Policy & COP28, Fuel Supply Chain reference, Financing
   Structures, SMR Market) render the static tables directly with filtering/sorting, no additional
   computation.

### 7.4 Worked example

`annualAddition=15` (default), year `i=5` (2030): `operable = 372+15×5−4×5 = 372+75−20 = 427`
reactors. `building = 90−2×5+sr(25)×20`. `sr(25)`: `sin(26)=0.7626`, ×10000=7626.3, `frac=0.2628`
(`floor(7626.3)=7626`, remainder 0.3, recompute precisely: `sin(26 rad)`; using radians,
`sin(26)≈0.7626`) → `building ≈ 90−10+0.2628×20 = 80+5.26=85.3 → 85` (rounded). By 2030 the model
projects **427 operable reactors** (net +55 from the 372 baseline) — a materially slower ramp than
the COP28 600 GW-by-2050 target implies if reactors averaged ~1 GW each (600−372=228 net reactor-
equivalents needed over 25 years ≈ 9.1/yr net, close to the 15/yr gross addition minus 4/yr
retirement = 11/yr net assumed here, so the default slider is roughly consistent with, if slightly
ahead of, the COP28 pace).

### 7.5 Data provenance & limitations

- The module's principal value is its **curated, broadly accurate static dataset** — fleet counts,
  flagship project costs, vendor export shares, and the real COP28 declaration — rather than any
  computation.
- `fleetGrowth`'s linear model has no country-level granularity, no reactor-specific construction
  timeline, and a flat retirement-rate assumption (4/yr) that doesn't vary with slider inputs.
- `exportPipelineData`'s flat $6bn/GW capex ignores the very real technology/country cost spread
  visible elsewhere on the same page (Hinkley's EPR at ~$14bn/GW vs. VVER-1200 projects at
  ~$5–6bn/GW in `NEW_BUILD`) — a self-inconsistency between two tabs of the same module.
- No live uranium spot-price feed exists in this file, despite the guide's "Uranium Spot Price
  Model" framing (that content lives in the sibling `nuclear-fuel-cycle` module's `u3o8Spot` series,
  itself `sr()`-seeded, not live).

**Framework alignment:** IAEA PRIS (Power Reactor Information System) — fleet counts are consistent
with PRIS-class real statistics · COP28 Declaration to Triple Nuclear Energy Capacity (Dec 2023) —
accurately represented, real signatory count and target · World Nuclear Association *World Nuclear
Performance Report* — vendor/export-market framing consistent with WNA's annual reporting structure.

## 9 · Future Evolution

### 9.1 Evolution A — Live fleet data and a real uranium price model (analytics ladder: rung 1 → 3)

**What.** §7 is candid: this module is a curated market almanac, not a calculation engine — nine static reference tables (`GLOBAL_FLEET`, `NEW_BUILD`, `EXPORT_MARKETS`, `VENDORS`, `COP28_COMMITMENTS`, `FINANCING`) carrying genuinely accurate real-world data (USA 93 reactors/95.5 GW, France 56/61.4 GW, the real COP28 triple-nuclear declaration 372→600 GW), but the guide's "Uranium Spot Price Model" (`Spot = Supply–Demand + Speculative Premium + Policy Shift`) is descriptive framing with no implemented calculation. Evolution A makes the almanac live and builds the one real model the guide names.

**How.** (1) Refresh the fleet tables from IAEA PRIS (named in §5) on a schedule rather than hand-maintaining — PRIS publishes machine-readable reactor status; a small ingester keeps `GLOBAL_FLEET`/`NEW_BUILD` current and dated, eliminating staleness. (2) Implement the supply-demand uranium balance as an actual model: reactor requirements (from the fleet data) vs mine + secondary supply, producing a structural balance the speculative/policy premia adjust — the price series that today lives only in `nuclear-fuel-cycle` should be shared, not duplicated. (3) Score `EXPORT_MARKETS` risk (currently a qualitative Low/Medium/High label) from real indicators — political-risk, financing-availability, grid-readiness — rather than hand assignment.

**Prerequisites.** IAEA PRIS ingestion; uranium supply data (WNA Nuclear Fuel Report, UxC — the latter is subscription-gated, so scope the balance to public WNA figures); the market-intelligence and fuel-cycle modules should share one uranium price source. **Acceptance:** fleet figures update from PRIS without code edits; the uranium balance responds to a fleet-growth change; export-market risk derives from named indicators.

### 9.2 Evolution B — Nuclear-market-briefing copilot (LLM tier 1 → 2)

**What.** A copilot for the analyst users §1 targets: "summarise the global new-build pipeline and its cost overruns", "which vendors dominate export markets?", "what did COP28 commit on nuclear capacity?", "compare Poland and Saudi Arabia as emerging nuclear markets" — grounded in the module's genuinely accurate reference tables and the IAEA PRIS / WNA references named in §5.

**How.** Tier 1 is strong immediately because the underlying data is real and factual: system prompt from this Atlas page plus the serialized fleet/new-build/vendor/COP28 tables; the copilot answers market-structure and project questions with citations to specific rows (Hinkley $46bn, Vogtle $35bn, Rosatom 28% export share — all real per §7.1). Tier 2, post-Evolution-A: tool calls against the live PRIS-refreshed tables and the uranium balance model for current figures, with the fabrication validator matching quoted GW/counts/prices to data. The copilot must date its fleet figures (PRIS vintage) and refuse forward price predictions the structural model does not produce.

**Prerequisites.** Tier 1 works on current curated data but must disclose the as-of date; live figures and price answers need Evolution A. **Acceptance:** every fleet/project statistic cites a table row and vintage; uranium-balance answers (post-Evolution-A) trace to the model; refusal on speculative spot-price forecasts.