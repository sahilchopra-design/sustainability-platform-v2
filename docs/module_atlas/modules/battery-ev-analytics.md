# Battery & EV Analytics
**Module ID:** `battery-ev-analytics` · **Route:** `/battery-ev-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Lifecycle emissions, critical mineral supply risk, and battery GHG intensity analytics for EV and energy storage investments. Covers LCA from raw material extraction through end-of-life recycling, cobalt/lithium supply chain resilience scoring, and charging infrastructure carbon intensity. Supports EU Battery Regulation carbon footprint declaration requirements.

> **Business value:** Battery LCA and critical mineral risk are central to institutional due diligence on EV and energy storage investments. The EU Battery Regulation mandates carbon footprint declarations for batteries above 2kWh by 2025, making accurate LCA methodology a compliance necessity rather than optional disclosure for manufacturers and investors alike.

**How an analyst works this module:**
- Select EV model or battery type to load LCA parameters
- Production Emissions tab breaks down mining, processing, and manufacturing phases
- Critical Minerals tab shows supply chain concentration (HHI) and ESG risk per mineral
- Use Phase tab models charging carbon intensity by grid region and time-of-day
- EU Battery Regulation tab generates carbon footprint declaration per battery model
- Portfolio Impact tab aggregates EV fleet LCA across all holdings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `CHEM_MIX`, `COST_CURVE`, `EV_PENETRATION`, `EV_SALES`, `GIGAFACTORIES`, `Kpi`, `STATUS_C`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EV_PENETRATION` | 7 | `pen2024`, `pen2030`, `sales_m`, `target` |
| `GIGAFACTORIES` | 12 | `country`, `gwh`, `status`, `chemistry` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `usd` | `(n, d = 0) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: d })}`;` |
| `COST_CURVE` | `[2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({` |
| `EV_SALES` | `[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030].map((yr, i) => ({` |
| `CHEM_MIX` | `[2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `CHEM_MIX`, `COST_CURVE`, `EV_PENETRATION`, `EV_SALES`, `GIGAFACTORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Battery Carbon Intensity | `LCA production + use + EOL / km` | ISO 14044 LCA | Lifecycle GHG intensity per km driven; target <50gCO₂e/km for low-carbon EV |
| Cobalt Supply Risk Score | `HHI × ESG_country_risk` | OECD mineral risk | Supply concentration and geopolitical risk for cobalt sourcing from DRC |
| Charging Carbon Intensity | — | IEA/eGRID by region | Grid emission factor at dominant charging location; determines use-phase emissions |
- **Battery chemistry and material intensity data** → Apply emission factors per kg of material; sum production phase LCA → **Battery production carbon intensity by chemistry type (NMC, LFP, NCA)**
- **IEA/eGRID regional grid emission factors** → Map charging location to grid factor; compute use-phase emissions over lifetime km → **Full lifecycle GHG profile and EU Battery Regulation carbon footprint declaration**

## 5 · Intermediate Transformation Logic
**Methodology:** ISO 14040/44 LCA battery carbon intensity
**Headline formula:** `Battery_LCA_gCO2e_per_km = (Production_emissions + Use_phase_emissions + EOL_emissions) / Lifetime_km; Production_emissions = Material_kg × EF_material`

Battery LCA allocates production emissions (mining, processing, cell manufacturing) to kWh capacity, then distributes over vehicle lifetime km driven. Use phase intensity depends on grid emission factor at charging location. End-of-life credit applies recycling recovery rate for cobalt, lithium, nickel.

**Standards:** ['ISO 14040/14044 LCA', 'EU Battery Regulation 2023/1542', 'IEA EV Outlook']
**Reference documents:** ISO 14040:2006 / 14044:2006 Life Cycle Assessment; EU Battery Regulation (EU) 2023/1542; IEA Global EV Outlook 2024; OECD Due Diligence Guidance for Mineral Supply Chains

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an ISO 14040/44 **lifecycle
> assessment engine** (`Battery_LCA_gCO2e_per_km = (Production + Use + EOL) / Lifetime_km`), a
> cobalt supply-risk score (`HHI × ESG_country_risk`), charging-grid carbon intensity by region,
> and an EU Battery Regulation carbon-footprint declaration generator. **None of this exists in
> code.** The page (EP-BO2) is a five-tab *market-intelligence dashboard*: battery cost learning
> curves, EV sales/penetration, chemistry mix forecast, a gigafactory capacity table, and a
> chemistry comparison. There is no LCA, no gCO₂e anywhere, no HHI computation, and no supply-risk
> scoring (that lives in the sibling module `battery-tech-supply-chain`). Sections below document
> the code.

### 7.1 What the module computes

Only one dataset is *computed* (the rest are curated constants):

```js
// Battery cost learning curve, i = 0..10 over years 2010–2030 (2-year steps)
pack_avg    = round(1100 × 0.82^i)          // 18% decline per 2-year step
nmc         = round(1050 × 0.81^i)
lfp         = round(980  × 0.80^i)
solid_state = i < 7 ? null : round(380 − (i−7)×60)   // linear from 2024: 380, 320, 260, 200
```

This is a geometric (Wright/learning-curve-style) decay in *time*, not in cumulative production —
a visual approximation of the BNEF price-survey trend rather than a true experience curve.

### 7.2 Parameterisation — curated datasets

| Dataset | Content | Provenance |
|---|---|---|
| `CHEMISTRIES` (7 rows) | LFP / NMC 811 / NMC 622 / NCA / LMFP / Solid State / Na-Ion with energy density (140–400 Wh/kg), cell cost 2024/2030 ($55–280 → $38–100/kWh), cycle life (1,200–5,000), safety score, maturity, key minerals | inline comment cites "IEA Global EV Outlook 2024 / BloombergNEF Battery Price Survey"; values are hand-curated, plausible magnitudes |
| `EV_SALES` (12 rows) | BEV/PHEV/total sales 2018–2030, 2.2M → 59M | curated forecast-shaped literals |
| `EV_PENETRATION` (6 regions) | 2024 vs 2030 penetration (China 38→72%, Europe 22→55%, USA 9→28%, …) with policy targets (ICE ban 2035, IRA, FAME III) | curated; policy labels are real regulations |
| `GIGAFACTORIES` (11 rows) | CATL 660 GWh, BYD 380, Tesla 270, … Northvolt 60 (status "Distressed") | curated capacity estimates |
| `CHEM_MIX` (6 rows) | market-share forecast 2020–2030: LFP 20→56%, NMC 62→28%, NCA 12→2%, LMFP 0→8%, solid 0→3%, Na-ion 0→3% | curated |

No PRNG is used for the displayed data (`sr` is defined but effectively unused for the headline
datasets) — this module's numbers are *editorial* rather than seeded-random.

### 7.3 Calculation walkthrough

1. **Battery Cost Curves tab** — plots the §7.1 series with a log-ish decline; KPI cards read
   specific curve points.
2. **EV Adoption** — stacked BEV/PHEV area chart + regional penetration bars (2024 vs 2030) with
   target annotations.
3. **Chemistry Mix** — stacked-area market-share forecast from `CHEM_MIX`.
4. **Gigafactories** — capacity table/bars, colour-coded by status
   (Operating/Construction/Distressed/Planned).
5. **Chemistry Comparison** — scatter/table over `CHEMISTRIES` (energy density vs cost vs cycle
   life vs safety).

There are no derived risk scores, aggregations or user-driven calculations beyond tab selection.

### 7.4 Worked example — cost curve points

For `pack_avg = 1100 × 0.82^i`:

| Year | i | 0.82^i | pack_avg |
|---|---|---|---|
| 2010 | 0 | 1.000 | $1,100/kWh |
| 2018 | 4 | 0.4521 | $497 |
| 2024 | 7 | 0.2493 | **$274** |
| 2030 | 10 | 0.1374 | **$151** |

Note the internal inconsistency this creates: the curve says the 2024 *pack average* is $274/kWh,
while the `CHEMISTRIES` table says 2024 *cell* costs are $55–92/kWh (solid-state excepted) — and
the real 2024 BNEF survey pack average was ≈$115/kWh. The decay constant was evidently chosen for
visual shape from the $1,100 2010 anchor (which is accurate) rather than calibrated to recent
survey points.

### 7.5 Data provenance & limitations

- All data is **hand-curated demo content**; the only cited sources are an inline comment (IEA
  Global EV Outlook 2024, BNEF Battery Price Survey) with no vintages or per-value citations.
  Gigafactory capacities and the Northvolt "Distressed" status reflect roughly the 2024 news
  cycle and will go stale.
- The 2024 pack-average point overshoots the BNEF survey by ~2.4× (§7.4).
- Nothing in the guide's methodology section is implemented: no lifecycle stages, no material
  emission factors, no lifetime-km allocation, no recycling credits, no mineral concentration
  math, no grid-EF lookup.
- No interactivity beyond tabs — no model selection, sliders, or portfolio aggregation as the
  guide's user-interaction list describes.

### 7.6 Framework alignment

- **ISO 14040/14044 (guide reference)** — not implemented; a compliant battery LCA would define a
  functional unit (kWh delivered or km driven), system boundary (cradle-to-grave), and allocate
  production emissions over lifetime energy throughput. Nothing on the page performs this.
- **EU Battery Regulation 2023/1542 (guide reference)** — mandates carbon-footprint declarations
  for EV batteries (phased from 2025) using PEFCR-based rules; no declaration output exists in
  code.
- **IEA Global EV Outlook / BNEF** — the module's actual (informal) alignment: its sales,
  penetration and chemistry-mix shapes track those publications' 2024 base-case narratives.
- **OECD mineral due-diligence / HHI (guide reference)** — implemented in the companion module
  `battery-tech-supply-chain` (which carries per-mineral HHI fields), not here.

## 9 · Future Evolution

### 9.1 Evolution A — Build the promised battery LCA engine (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is total: the guide describes an ISO 14040/44 LCA engine (`gCO₂e/km = (Production + Use + EOL)/Lifetime_km`), HHI-based cobalt supply risk, charging-grid intensity, and an EU Battery Regulation declaration generator — **none exist**. The page is a five-tab market-intelligence dashboard over curated editorial data (cost learning curves, EV sales, chemistry mix, gigafactory table), whose only computation is a geometric cost decay in time. Supply risk already lives in sibling `battery-tech-supply-chain`, so Evolution A scopes to what this module uniquely promises: the LCA and the Regulation declaration, as its first backend vertical.

**How.** (1) `POST /api/v1/battery-lca/footprint`: production phase = Σ material_kg × EF_material per chemistry (the `CHEMISTRIES` table already carries key-mineral lists; material intensities per kWh come from published LCA literature, cited per factor); use phase = lifetime_km × kWh/km × grid EF from the platform's grid-carbon routes (regional factors already served at `/api/v1/grid-carbon/regional`); EOL credit = recovery rates × avoided-primary-production factors. (2) Scenario capability (rung 2): grid-decarbonisation trajectories shift use-phase intensity by charging region and year. (3) The EU Battery Regulation tab renders the declaration from engine output (kgCO₂e/kWh by lifecycle stage, per Annex II methodology structure). (4) The curated market data stays — it is honest editorial content — but gains vintage labels.

**Prerequisites.** Sourced emission-factor set for battery materials (no such refdata exists on-platform today); the cost "learning curve" should be relabelled as a time trend or refit against cumulative GWh (§7.1 notes it is not a true experience curve). **Acceptance:** an NMC 811 vs LFP pack of equal kWh produces different production footprints with per-factor citations; the same pack charged in Poland vs Norway produces different lifecycle gCO₂e/km; a declaration export lists every factor and vintage.

### 9.2 Evolution B — Battery-market copilot with honest scope (LLM tier 1 → 2)

**What.** Tier 1 first: a copilot over the curated intelligence — "why is LFP share forecast to reach 56% by 2030?", "what does Northvolt's Distressed status mean for European capacity?" — answered from the page's tables with the mandatory disclosure that figures are hand-curated forecast-shaped values (BNEF/IEA-magnitude, not live feeds). Crucially, the refusal path covers the guide's phantom features: asked for a carbon footprint or cobalt risk score, the tier-1 copilot states this module does not compute them (and routes supply-risk questions to `battery-tech-supply-chain`).

**How.** Standard Tier-1 pattern grounded in this Atlas record — §7.2's provenance table is the corpus core, since every answer's caveat structure ("curated capacity estimates", "policy labels are real regulations") is already written there. After Evolution A, tier 2 adds tool calls to `/battery-lca/footprint`: "declaration for a 75 kWh NMC pack, EU grid, 200k km" runs the engine and narrates the stage breakdown, every gCO₂e figure from the tool response, validated by the no-fabrication checker.

**Prerequisites.** Copilot router (tier 1 ships on the existing record); Evolution A for tier 2. **Acceptance:** tier-1 answers distinguish curated data from computation and refuse LCA questions with a correct redirect; tier-2 declarations trace every factor to the engine's cited refdata.