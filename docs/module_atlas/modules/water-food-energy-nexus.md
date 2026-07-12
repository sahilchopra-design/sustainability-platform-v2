# Water-Food-Energy Nexus Analytics
**Module ID:** `water-food-energy-nexus` · **Route:** `/water-food-energy-nexus` · **Tier:** B (frontend-computed) · **EP code:** EP-DG5 · **Sprint:** DG

## 1 · Overview
Analyses interdependencies between water, food, and energy systems under climate stress. Models nexus risk cascades, cross-sector investment priorities, and integrated resource efficiency opportunities using WEF Global Risk Framework and UN SDG interlinkages.

> **Business value:** Critical for sovereign debt analysts assessing political stability risk in water/food-stressed emerging markets, multilateral development banks prioritising nexus investments, and commodity traders modelling supply chain disruption. Provides integrated WEF/UN SDG-aligned nexus risk framework.

**How an analyst works this module:**
- Select country or river basin for nexus analysis
- Apply climate stress scenarios to water, food, and energy
- Calculate nexus cascade risk under compound stress
- Identify cross-sector investment priorities
- Map against SDG 2/6/7 target gaps

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ADAPT_MEASURES`, `BASINS`, `KpiCard`, `NEXUS_YEARS`, `SSP_SCENARIOS`, `STRESS_SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SSP_SCENARIOS` | 5 | `color`, `waterDemand2050`, `foodCalories2050`, `energyIntensity2050` |
| `ADAPT_MEASURES` | 9 | `waterSave`, `energySave`, `foodGain`, `cost`, `coverage` |
| `STRESS_SCENARIOS` | 7 | `water`, `food`, `energy` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Water Stress', 'Energy-Food', 'Irrigation', 'Nexus Risk', 'Stress Tests', 'Adaptation'];` |
| `regions` | `['All', ...new Set(BASINS.map(b => b.region))];` |
| `stressData` | `useMemo(() => [...filteredBasins] .sort((a, b) => b.waterStress - a.waterStress) .slice(0, 10) .map(b => ({ name: b.name.split('-')[0].slice(0, 8), stress: b.waterStress, irrigShare: b.irrigationShare })), [filteredBasins]);` |
| `frac` | `(yr - 2020) / 30;` |
| `adaptData` | `useMemo(() => ADAPT_MEASURES.map(m => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_MEASURES`, `NEXUS_YEARS`, `SSP_SCENARIOS`, `STRESS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Water-Food Nexus Risk | — | WRI AQUEDUCT 2023 | 40% of the global population will live in water-scarce areas by 2030 — directly threatening food production |
| Energy for Water | — | IEA Water-Energy Nexus 2023 | Water treatment and distribution consume 4% of global electricity — rising with desalination |
| Food System Water Use | — | FAO AQUASTAT 2022 | Agriculture accounts for 70% of global freshwater withdrawals — primary driver of water stress |
- **WRI AQUEDUCT basin-level water stress data** → Nexus stress calculation → **Country/basin nexus stress index by scenario and decade**
- **FAO food production and import dependency data** → Food security analysis → **Food import vulnerability index for water-scarce nations**
- **IEA energy access and water-energy intensity data** → Cross-sector cascade modelling → **System-level stress propagation under compound climate shock**

## 5 · Intermediate Transformation Logic
**Methodology:** Nexus Stress Index
**Headline formula:** `NexusStress = w_W × WaterStress + w_F × FoodInsecurity + w_E × EnergyAccess; CascadeRisk = max(WaterStress, FoodInsecurity, EnergyAccess) × CorrelationCoeff`

Weighted nexus stress index captures system interdependency; cascade risk amplifies when multiple systems simultaneously stressed — most dangerous for political stability and financial contagion

**Standards:** ['WEF Global Risks Report 2024', 'UN SDG 2/6/7 Interlinkage Framework', 'WRI AQUEDUCT Food + Water + Energy', 'IPCC AR6 WGII Chapter 5']
**Reference documents:** WEF Global Risks Report 2024; WRI AQUEDUCT Food + Water + Energy Nexus; IPCC AR6 WGII Chapter 5 — Food, Fibre and Other Ecosystem Products; UN SDG Progress Report 2023 — Goals 2, 6, 7

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives explicit formulas —
> `NexusStress = w_W×WaterStress + w_F×FoodInsecurity + w_E×EnergyAccess` and
> `CascadeRisk = max(WaterStress, FoodInsecurity, EnergyAccess) × CorrelationCoeff`. **Neither
> `NexusStress` nor `CascadeRisk` is computed anywhere in the code.** The module instead presents four
> independent static/synthetic datasets — a 20-basin directory, 4 SSP climate scenarios, 8 adaptation
> measures, and 6 compound-stress scenarios — displayed as tables and charts with no cross-basin
> composite index actually calculated.

### 7.1 What the module computes

`BASINS` (20 named river basins: Indus, Yellow River, Tigris-Euphrates, Colorado, Murray-Darling,
Ganges, Nile, Mekong, Rhine, Danube, etc.), each independently seeded: `waterStress` (1–5),
`irrigationShare` (20–90%), `energyForWater` (5–35%), `foodCalorieRisk` (10–60%), `population`,
`gdpPerCapita`. No composite nexus score combines these five fields into a single risk number
anywhere in the component.

`SSP_SCENARIOS` (4 IPCC-named pathways: SSP1-2.6 → SSP5-8.5) carry **hardcoded** 2050 deltas for
water demand (+8% to +45%), food calories (−5% to −35%), and energy intensity (−25% to +30%) — these
are static author-chosen values, not derived from any basin data or climate model output.
`STRESS_SCENARIOS` (6 named compound scenarios: Baseline, +2°C, +3°C, Drought+Heat, Population+3Bn,
Combined Stress) similarly carry hardcoded `water`/`food`/`energy` deltas that compound roughly
additively toward the "Combined Stress" row (`water=7.4` against a `waterStress` scale that elsewhere
tops out at 5, i.e. the combined-stress scenario deliberately exceeds the basin data's own maximum
scale — a labelling inconsistency).

### 7.2 Parameterisation

| Dataset | Rows | Provenance |
|---|---|---|
| `BASINS` | 20 | `sr()`-seeded per-basin fields, real basin names |
| `SSP_SCENARIOS` | 4 | Hardcoded 2050 deltas; SSP naming convention (Shared Socioeconomic Pathways) is real IPCC terminology, deltas are author-estimated, not sourced from a specific IPCC/IIASA SSP database table |
| `ADAPT_MEASURES` | 8 (Drip Irrigation, Rainwater Harvesting, Treated Wastewater Reuse, Desalination-solar, Solar Irrigation Pumps, Aquifer Recharge, Crop Diversification, Precision Fertilization) | Hardcoded `waterSave`/`energySave`/`foodGain`/`cost`/`coverage`, plausible relative ordering (desalination highest water-save at 60%, highest cost $3,500) but no per-measure citation |
| `STRESS_SCENARIOS` | 6 | Hardcoded, `water` axis exceeds `BASINS.waterStress`'s own 1–5 range at the "Combined Stress" row (7.4) |

Note `ADAPT_MEASURES`'s negative `energySave` values for Treated Wastewater Reuse (−10%) and
Desalination (−5%) — correctly encoding that these water-saving measures are net energy-*consuming*,
a realistic and useful nuance even though the underlying numbers are illustrative.

### 7.3 Calculation walkthrough

1. `stressData` sorts `filteredBasins` by `waterStress` descending, takes top 10, for the Water
   Stress tab bar chart.
2. `adaptData` maps `ADAPT_MEASURES` directly (no basin-specific scaling) — the same 8 measures and
   figures display regardless of which basin/region filter is active.
3. Region filter (`filteredBasins`) affects only the `BASINS`-derived charts; `SSP_SCENARIOS`,
   `ADAPT_MEASURES`, and `STRESS_SCENARIOS` are entirely global, unfiltered constants.
4. No tab computes a single nexus-risk number per basin — the "Nexus Risk" tab (per `TABS`) most
   likely juxtaposes the `waterStress`/`foodCalorieRisk`/`energyForWater` fields visually (e.g. a
   radar or scatter) rather than combining them algebraically, since no combining formula exists
   anywhere in the file.

### 7.4 Worked example

Under the guide's stated formula with illustrative weights `w_W=w_F=w_E=1/3`, a basin with
`waterStress=4.0` (rescaled to a 0-100 basis, e.g. ×20=80), `foodCalorieRisk=45`,
`energyForWater=25` (as a % — using it directly as an energy-access-stress proxy) would give
`NexusStress = (80+45+25)/3 = 50.0`. **This computation does not exist in the code** — a user cannot
currently see a single basin-level nexus stress figure anywhere on the page; they must mentally
combine the three separately-displayed fields themselves.

### 7.5 Data provenance & limitations

- **All 20 basins are synthetic**; the 4 SSP scenarios and 6 compound-stress scenarios are hardcoded
  illustrative deltas, not pulled from IIASA's SSP database or an IPCC AR6 WGII chapter table despite
  using correct IPCC terminology.
- **No NexusStress or CascadeRisk composite exists**, despite being the guide's headline methodology
  — the module presents nexus *components* side by side without ever combining them.
- The `STRESS_SCENARIOS.water` axis exceeding the `BASINS.waterStress` scale's own maximum (7.4 vs a
  1–5 basin range) is an internal scale-consistency issue worth fixing before any cross-referencing
  between the two datasets is attempted.

**Framework alignment:** WEF Global Risks Report 2024, WRI AQUEDUCT Food+Water+Energy, IPCC AR6 WGII
Ch.5, and UN SDG 2/6/7 (all named in the guide) inform the *framing* of the module (basin selection,
SSP naming, adaptation-measure categories) but none is wired into a computed cross-domain index — the
core "nexus" calculation the guide promises is not present in code.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the missing NexusStress/CascadeRisk composite (analytics ladder: rung 1 → 2)

**What.** The module presents nexus *components* — 20 basins with `waterStress`,
`foodCalorieRisk`, `energyForWater` — but §7's flag confirms neither headline formula
(`NexusStress = w_W×Water + w_F×Food + w_E×Energy`,
`CascadeRisk = max(...) × CorrelationCoeff`) exists in code; §7.4 notes users must
mentally combine the three fields themselves. Evolution A implements both, with the
inputs made real: `waterStress` joined from the WRI Aqueduct data already wired into
the sibling `water-risk-analytics` module (the basins overlap heavily — Indus, Nile,
Mekong, Murray-Darling), `foodCalorieRisk` proxied from FAO import-dependency
indicators, and the SSP deltas re-sourced from the IIASA SSP database instead of
author-estimated constants. It also fixes the documented scale inconsistency —
`STRESS_SCENARIOS.water` reaches 7.4 against a basin scale that tops out at 5 —
by normalising both to a common 0–100 basis before any cross-referencing.

**How.** A `GET /api/v1/nexus/basins` route (module is Tier B, EP-DG5) serving the
joined per-basin records plus computed NexusStress/CascadeRisk per scenario; the
Nexus Risk tab renders the composite ranking; adaptation measures gain basin
applicability weights so `adaptData` stops being identical regardless of filter
(§7.3's observation).

**Prerequisites.** Weight vector (w_W/w_F/w_E) and correlation coefficient documented
with rationale — uncited weights would reproduce the platform's old habits; Aqueduct
basin-name mapping. **Acceptance:** each basin shows one composite score that moves
when the SSP scenario changes; Combined Stress no longer exceeds the displayed scale;
the same drought filter changes the adaptation tab's ranking.

### 9.2 Evolution B — Sovereign-desk nexus briefing copilot (LLM tier 1 → 2)

**What.** The module's stated audience is sovereign debt analysts assessing political-
stability risk in water/food-stressed markets — a briefing-note workflow. Evolution B
drafts basin/country nexus briefs: "brief me on Tigris-Euphrates under SSP3-7.0 —
which system fails first and what are the SDG 2/6/7 gaps?" Tier-1 first: grounded in
this Atlas page and current page state, with the honest caveat that basin fields are
synthetic until Evolution A lands. Tier-2 then adds `GET /basins` as the single
read-only tool, so the brief's NexusStress and CascadeRisk figures are computed, and
the copilot can compare basins ("rank my sovereign portfolio's five basins by cascade
risk under +2°C").

**How.** Standard copilot stack (`llm_corpus_chunks`, per-module system prompt from
§5/§7); the prompt encodes §7.2's provenance table — including the genuinely useful
nuance that desalination/wastewater-reuse measures carry negative energySave — so
briefs reflect the module's real content, not generic nexus talking points.

**Prerequisites.** pgvector corpus; Evolution A for any numeric claims (tier-1 output
is qualitative until then). **Acceptance:** every score in a brief traces to page
state or the basins endpoint; asked which system "fails first," the answer cites the
max-component logic of CascadeRisk rather than free-form speculation; out-of-coverage
basins get a refusal naming the 20 covered ones.