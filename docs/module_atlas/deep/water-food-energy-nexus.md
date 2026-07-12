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
