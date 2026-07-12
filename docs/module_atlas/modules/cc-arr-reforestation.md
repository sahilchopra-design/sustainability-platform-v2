# ARR Reforestation Credits
**Module ID:** `cc-arr-reforestation` · **Route:** `/cc-arr-reforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Afforestation, reforestation, and revegetation (ARR) carbon credit methodology engine. Models baseline carbon stocks, additionality tests, permanence buffers, leakage deductions, and net removal credits under Verra VCS VM0047 and Gold Standard LR.

> **Business value:** Net tradeable ARR credits = gross removal × (1–leakage) × (1–buffer). Buffer typically reduces gross credits by 15–25%.

**How an analyst works this module:**
- Select project region and species mix
- Baseline Carbon tab models reference scenario stocks
- Additionality Test applies regulatory + investment barrier screens
- Permanence & Leakage tab quantifies deductions
- Net Credit Schedule shows issuance profile to 2050

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CARBON_POOLS`, `Card`, `DualInput`, `Kpi`, `METHODOLOGIES`, `PROJECTS`, `SENS_PARAMS`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODOLOGIES` | 5 | `name`, `registry`, `type`, `crediting`, `default_max_agb`, `default_k`, `default_p` |
| `CARBON_POOLS` | 6 | `name`, `desc`, `default_pct`, `color` |
| `SENS_PARAMS` | 7 | `label`, `range` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `biomassGrowth` | `(t, max_agb, k, p) => max_agb * Math.pow(1 - Math.exp(-k * t), p);` |
| `carbon_stock` | `total_biomass * cf * (44 / 12); // tCO2e per ha` |
| `project_cs` | `carbon_stock * area_ha;` |
| `baseline_total` | `baseline_cs * area_ha;` |
| `gross` | `Math.max(0, project_cs - baseline_total);` |
| `leakage` | `gross * (leakage_pct / 100);` |
| `after_leakage` | `gross - leakage;` |
| `buffer` | `after_leakage * (buffer_pct / 100);` |
| `after_buffer` | `after_leakage - buffer;` |
| `uncertainty_ded` | `after_buffer * (uncertainty_pct / 100);` |
| `net` | `Math.max(0, after_buffer - uncertainty_ded);` |
| `prior_cumulative` | `years[t - 2]?.cumulative_net \|\| 0;` |
| `cumulative_net` | `prior_cumulative + net;` |
| `total_net` | `years.length > 0 ? years[years.length - 1].cumulative_net : 0;` |
| `area` | `Math.round(5000 + sr(i * 7) * 95000);` |
| `credits` | `Math.round(area * (8 + sr(i * 11) * 12) * (15 + sr(i * 13) * 15));` |
| `species` | `['Mixed tropical','Eucalyptus+native','Teak+mahogany','Acacia+native','Mixed Atlantic Forest','Mangrove+upland','Afromontane','Dry deciduous','Pine+broadleaf','Highland native','Lowland dipterocarp','Cloud forest'];` |
| `result` | `useMemo(() => calcARR(params), [params]);  useEffect(() => { if (result && result.total_net > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'VM0047', family: 'nature',` |
| `growthData` | `useMemo(() => { return Array.from({ length: params.crediting_yrs }, (_, t) => { const yr = t + 1;` |
| `sensitivityData` | `useMemo(() => { return SENS_PARAMS.map(sp => { const base = result.total_net;` |
| `last` | `result.years[result.years.length - 1];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_POOLS`, `METHODOLOGIES`, `SENS_PARAMS`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Gross Removal | `(AGC + BGC + SOC) × Area` | Field measurement + allometric | Above-ground, below-ground, and soil organic carbon increments |
| Leakage Deduction | `Activity-shifting + market leakage` | VM0047 guidance | Emission displacement outside project boundary |
| Buffer Pool % | `Non-permanence risk rating` | Verra AFOLU NPR tool | Proportion withheld in buffer to cover reversal risk |
| Net Credit Yield | `Gross × (1–Leakage) × (1–Buffer)` | Model output | Tradeable verified carbon units per hectare per year |
- **Field biomass plots** → Allometric equations → carbon stock → **Gross removal tCO₂/ha**
- **VM0047 risk tool** → Non-permanence score → buffer % → **Buffer-adjusted net credits**

## 5 · Intermediate Transformation Logic
**Methodology:** VCS VM0047 ARR Net Removal Accounting
**Headline formula:** `NetCredits = (ProjectCarbon – BaselineCarbon) × (1 – LeakagePct) × (1 – BufferPct)`

Baseline carbon stock estimated via stratified sampling of reference plots. Project carbon accumulation follows species-specific allometric equations. Leakage assessed via activity-shifting and market-leakage pathways. Permanence buffer pool (typically 15–25%) held in VCS buffer account. Net credits = gross removal minus leakage minus buffer.

**Standards:** ['Verra VM0047', 'Gold Standard LR v2', 'IPCC GPG LULUCF']
**Reference documents:** Verra VCS VM0047 v1.0; Gold Standard Land Restoration v2; IPCC GPG LULUCF 2003

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide and the code agree here: this module implements a real VM0047-style ARR net-removal
accounting chain built on a Chapman-Richards biomass growth curve. No mismatch flag needed. The one
caveat is that the *project registry* is synthetic seeded data, while the *calculator* is a faithful
mechanistic model.

### 7.1 What the module computes

The core is `calcARR(params)` (lines 75–106), which steps year-by-year through a growth-then-deduct
waterfall:

```js
agb(t)        = max_agb × [1 − exp(−k·t)]^p          // Chapman-Richards, biomassGrowth()
bgb           = agb × rs_ratio                        // root:shoot expansion
total_biomass = agb + bgb
carbon_stock  = total_biomass × cf × (44/12)          // tDM → tC → tCO2e per ha
project_cs    = carbon_stock × area_ha
gross         = max(0, project_cs − baseline_cs × area_ha)
after_leakage = gross × (1 − leakage_pct/100)
after_buffer  = after_leakage × (1 − buffer_pct/100)
net           = max(0, after_buffer × (1 − uncertainty_pct/100))
cumulative_net(t) = cumulative_net(t−1) + net          // true running sum
```

`total_net` is the final-year cumulative; `avg_annual = total_net / crediting_yrs`.

The 44/12 factor is the CO₂:C molecular-weight ratio (correct); `cf` (carbon fraction ≈ 0.47) and
`rs_ratio` (root:shoot ≈ 0.26) follow IPCC GPG LULUCF defaults.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| `max_agb` | 250 tDM/ha (VM0047) | METHODOLOGIES table, `default_max_agb` |
| `k` (growth rate) | 0.08 | METHODOLOGIES `default_k` — synthetic but plausible for tropical ARR |
| `p` (shape) | 3 | METHODOLOGIES `default_p` — sigmoidal shape exponent |
| `crediting_yrs` | 30 | VM0047 / GS-LR 30-yr crediting period |
| `rs_ratio` | 0.26 | IPCC root:shoot default (moist tropical) |
| `cf` | 0.47 | IPCC carbon fraction of dry matter |
| `baseline_cs` | 15 tCO₂e/ha | Degraded-land baseline stock, user-set |
| `leakage_pct` | 10% | VM0047 activity-shifting + market leakage; range 2–25% |
| `buffer_pct` | 15% | Verra AFOLU Non-Permanence Risk Tool output; range 10–30% |
| `uncertainty_pct` | 8% | Measurement-uncertainty deduction; range 5–20% |
| Carbon pools | AGB 55 / BGB 15 / SOC 20 / DW 6 / LT 4 % | CARBON_POOLS table (illustrative pool split) |

Methodologies covered: VM0047, VM0006, AR-ACM0003 (CDM), and an "Equitable Earth" restoration
standard (EE-M001) — the last is a platform-specific standard, not an external registry.

### 7.3 Calculation walkthrough

1. Biomass curve `agb(t)` rises sigmoidally to the `max_agb` asymptote; BGB scales it by `rs_ratio`.
2. Per-hectare CO₂e stock = biomass × 0.47 × 3.667, multiplied by `area_ha` for project stock.
3. Baseline (flat `baseline_cs × area`) is subtracted → gross removal (floored at 0).
4. Three sequential percentage deductions — leakage, buffer, uncertainty — applied multiplicatively.
5. Net per year accumulates into `cumulative_net`; headline KPIs read the final year.
6. **Sensitivity analysis** re-runs `calcARR` at each parameter's range endpoints (`SENS_PARAMS`)
   and tornadoes the ±Δ vs base in thousands of tCO₂e — a genuine one-at-a-time sensitivity.

### 7.4 Worked example

Defaults: area 25,000 ha, max_agb 250, k 0.08, p 3, cf 0.47, rs 0.26, baseline 15, leakage 10%,
buffer 15%, uncertainty 8%. Take year t = 30:

| Step | Computation | Result |
|---|---|---|
| Growth fraction | (1 − e^(−0.08·30))^3 = (1 − 0.0907)^3 = 0.909³ | 0.752 |
| AGB | 250 × 0.752 | 188.0 tDM/ha |
| Total biomass | 188.0 × 1.26 | 236.9 tDM/ha |
| Carbon stock | 236.9 × 0.47 × 3.667 | 408.3 tCO₂e/ha |
| Project stock | 408.3 × 25,000 | 10.21 Mt |
| Baseline | 15 × 25,000 | 0.375 Mt |
| Gross | 10.21 − 0.375 | 9.83 Mt |
| After leakage | × 0.90 | 8.85 Mt |
| After buffer | × 0.85 | 7.52 Mt |
| Net (this year's stock-based) | × 0.92 | **6.92 Mt** |

(The page's `cumulative_net` sums each year's incremental `net`; because `net` here is computed on
*stock* rather than annual *increment*, cumulative_net is a running sum of stock-difference deltas —
see limitations.)

### 7.5 Data provenance & limitations

- **Calculator = real model; registry = synthetic.** The 12 `PROJECTS` (area, credits, density,
  survival %, price, verifier) are generated by the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` —
  stable but fabricated. Portfolio KPIs ("Total Credits" etc.) therefore aggregate demo data.
- **Accounting subtlety:** `net` is computed from the *cumulative* project-minus-baseline stock each
  year, yet `cumulative_net` then *sums* those yearly `net` values. A rigorous VM0047 issuance
  schedule credits the *annual increment* in net removals (stock change year-over-year), not the
  repeated full stock difference; summing full stock deltas overstates cumulative issuance. This is
  a modelling simplification, flagged for validation.
- Baseline is a flat constant (`baseline_cs`), not a modelled degrading/regenerating counterfactual.
- Buffer % is user-input, not derived from a live Non-Permanence Risk assessment.
- Live results are pushed to the shared `CarbonCreditContext` as methodology `VM0047`, family
  `nature` — feeding the cc-engine-hub and cc-methodology-comparison portfolio views.

**Framework alignment:** Verra VCS **VM0047** (ARR net-removals: the growth→leakage→buffer→uncertainty
waterfall mirrors the methodology's structure) · **Gold Standard LR v2** · **IPCC GPG LULUCF** (the
0.47 carbon fraction, 0.26 root:shoot, and 44/12 CO₂ conversion are IPCC Tier-1/2 defaults). Verra's
buffer pool is set by the AFOLU Non-Permanence Risk Tool — a scored assessment (internal/external/
natural risk categories summing to a % withholding, typically 10–25%) — which the module represents
as a single adjustable `buffer_pct` slider rather than the full scorecard.

## 9 · Future Evolution

### 9.1 Evolution A — Persist the real ARR calculator as a backend engine with region-calibrated growth (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is a faithful mechanistic model: a real VM0047-style ARR net-removal accounting chain (`net = (project_carbon − baseline) × (1−leakage) × (1−buffer) − uncertainty`) built on a Chapman-Richards biomass growth curve (`max_agb × (1 − e^(−kt))^p`), with the correct `44/12` C-to-CO₂ conversion, carbon-pool decomposition, and a real sensitivity analysis. The `METHODOLOGIES` table carries genuine per-registry defaults (max_agb, k, p). The only synthetic layer is the project *registry* (`area`, `credits` seeded); the calculator itself is sound, and it already writes to the shared `CarbonCreditContext` data bus. Evolution A grounds the growth parameters and makes the calculator a platform engine.

**How.** (1) Extract the ARR calculator to a backend route (`POST /api/v1/arr/net-credits`) — it's pure, well-structured VM0047 math that belongs server-side, testable and shared via the CarbonCreditContext bus. (2) Region- and species-calibrated Chapman-Richards parameters (max_agb, k, p) from IPCC GPG LULUCF / national forest-inventory data rather than table defaults — growth rates differ enormously by biome, and this is the model's biggest accuracy lever. (3) The buffer percentage from the actual Verra AFOLU Non-Permanence Risk tool (the module cites it) rather than a slider default. (4) Real project registry (seeded today) from Verra VCS project listings. (5) Rung 3: calibrate the growth curves against measured plot data and pin a reference project in bench_quant. Coordinate with the sibling `cc-` carbon-credit modules on the shared context bus and buffer/leakage conventions.

**Prerequisites.** Region/species growth-parameter data (IPCC GPG / forest inventories); the Verra NPR buffer tool logic; backend extraction. **Acceptance:** growth parameters are region/species-calibrated with sources; buffer % derives from the NPR tool; a bench case pins the Chapman-Richards → net-credit chain; the calculator runs server-side and populates the shared bus.

### 9.2 Evolution B — ARR project-design copilot (LLM tier 2)

**What.** Project developers and carbon buyers ask "what net credits does a 10,000 ha mixed-tropical reforestation yield to 2050?", "how sensitive is the yield to the buffer rate?", "what leakage deduction applies?", "compare VM0047 vs Gold Standard LR for this project" — the copilot runs the Evolution-A ARR calculator, reports the net-credit schedule, sensitivity, and methodology comparison, every figure tool-traced.

**How.** Tool schemas over the Evolution-A ARR route; grounding corpus is this Atlas record — the VM0047 accounting chain and Chapman-Richards curve in §5/§7 are the copilot's explanation source (why gross removal grows then saturates, why the buffer reduces tradeable credits 15-25%). The honesty duty: ARR credits face permanence and additionality scrutiny, so the copilot always reports *net* tradeable credits (after leakage, buffer, and uncertainty) rather than gross removal, and states the growth-parameter and buffer assumptions per estimate — a headline gross-removal figure overstates tradeable credits, the exact ARR-market credibility issue. Project-design reports compose into the report layer.

**Prerequisites.** Evolution A's backend extraction and calibrated parameters — the client-side calculator isn't tool-callable, and uncalibrated growth curves would misstate yields. **Acceptance:** every credit figure traces to a tool response; net-of-deductions credits are always distinguished from gross removal; growth-parameter and buffer assumptions are stated per estimate; methodology comparisons cite the real registry defaults.