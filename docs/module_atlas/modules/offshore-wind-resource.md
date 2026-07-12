# Offshore Wind Resource & Wake Loss Analytics
**Module ID:** `offshore-wind-resource` · **Route:** `/offshore-wind-resource` · **Tier:** B (frontend-computed) · **EP code:** EP-DR1 · **Sprint:** DR

## 1 · Overview
Engineering-grade offshore wind resource assessment covering Weibull wind speed distribution fitting, Jensen wake model array loss calculation, AEP computation via power curve integration, P50/P90 probabilistic yield, IEC 61400-3 site characterisation, and extreme wind event analysis. Covers 8 benchmark offshore markets with 18 analytical tabs for pre-FEED resource assessment.

> **Business value:** Designed for offshore wind developers, independent engineers, and institutional investors conducting pre-FEED wind resource assessment. Replicates the Windographer + WAsP + DNVGL workflow for site characterisation — covering Weibull fitting, Jensen wake modelling, and IEC 61400-3 site categorisation in a single interactive tool with 18 analytical tabs covering all dimensions of offshore wind resource due diligence.

**How an analyst works this module:**
- Select site location (North Sea, US East Coast, Taiwan, Baltic, Australia, Brazil, or Custom) in the left Site panel; set water depth, distance to shore, and hub height
- Configure wind resource in the Turbine Selection panel: choose turbine rating (8-18 MW), select turbine model to see power curve in "Power Curve" tab
- Open "Wind Resource Atlas" tab for Weibull PDF and CDF fitted to site wind speed data; review k and λ statistics and wind power density classification
- Navigate to "Capacity Factor" tab for monthly CF breakdown and hub height sensitivity; "Wake Loss Model" tab shows array wake deficit by row/column using Jensen model with configurable decay constant k
- Check "AEP Calculator" tab for gross → wake-corrected → availability-adjusted net AEP; configure wake model (Jensen/Gaussian/No Wake) and losses in the left panel
- Open "P50/P90" tab for lognormal probabilistic yield with full uncertainty decomposition: interannual variability, satellite vs mast bias, wake model uncertainty, and availability
- Review "Seasonal Analysis" for monthly AEP profile and storm season resource; "Extreme Events" for 50-year return wind speed and IEC turbine class suitability assessment
- Navigate "Environmental" tab for noise, shadow flicker, bird collision risk, and marine mammal impact; "Grid Connection" for cable loss estimate and AC vs HVDC preliminary assessment
- Open "Technology Comparison" for side-by-side rating/rotor/CF/LCOE across 5 turbine models; "Country Comparison" benchmarks your site against 8 offshore wind markets
- Review "Satellite vs Mast" for ERA5 vs mast validation statistics; download "Summary Report" for IE/lender-submission site characterisation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `MARKETS`, `MONTHS`, `SITES`, `SideSection`, `Slider`, `TABS`, `TURBINES`, `TabBar`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TURBINES` | 6 | `mw`, `D`, `hh`, `cutIn`, `rated`, `cutOut` |
| `SITES` | 7 | `lat`, `lon`, `vRef`, `k`, `depth`, `shore` |
| `MARKETS` | 9 | `cf`, `lcoe`, `pipeline`, `policy` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `deficit` | `(1 - Math.sqrt(1 - Ct)) * Math.pow(D / (D + 2 * k * x), 2);` |
| `toggleSec` | `i => setSec(p => p.map((v, j) => j === i ? !v : v));` |
| `vHub` | `useMemo(() => vRef * Math.pow(hubHeight / 80, shearExp), [vRef, hubHeight]);` |
| `lambda` | `useMemo(() => vHub / (Math.pow(1 + 1 / wk, 1 / wk) * 0.9), [vHub, wk]);` |
| `frac` | `Math.pow((v - turbine.cutIn) / (turbine.rated - turbine.cutIn), 3);` |
| `prob` | `weibullPdf(v, wk, lambda) * 0.5;` |
| `gross` | `totalE * n;` |
| `avgWakeDeficit` | `arrRows > 1 ? wakeDeficit / (arrRows - 1) : 0;` |
| `wake` | `gross * (1 - effectiveWakeLoss);` |
| `net` | `wake * (1 - elecLoss / 100) * (avail / 100);` |
| `capacityFactor` | `(net / (turbine.mw * n * 8760)) * 100;` |
| `lcoe` | `useMemo(() => { const capacityMW = turbine.mw * arrRows * arrCols;` |
| `totalCapex` | `capex * capacityMW * 1000; // $` |
| `annualOpex` | `opex * capacityMW * 1000;  // $/yr` |
| `crf` | `r * Math.pow(1 + r, projLife) / (Math.pow(1 + r, projLife) - 1);` |
| `annualCapex` | `totalCapex * crf;` |
| `p90Aep` | `+p90Val(netAEP, p90Sigma / 100).toFixed(1);` |
| `p75Aep` | `+p75Val(netAEP, p90Sigma / 100).toFixed(1);` |
| `monthlyData` | `useMemo(() => MONTHS.map((m, i) => {` |
| `aep` | `(netAEP / 12) * seasonalMult;` |
| `row` | `{ v: +v.toFixed(1) };` |
| `uncertaintyDist` | `useMemo(() => { const sigma = p90Sigma / 100;` |
| `pdf` | `(1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * i * i);` |
| `trendData` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ year: 2015 + i, speed: +(vHub * (1 + (sr(i * 13) - 0.5) * 0.006)).toFixed(2), rcp26: +(vHub * (1 + i * 0.001)).toFixed(2), rcp45: +(vHub * (1 - i * 0.0005)).toFixed(2), rcp85: +(vHub * (1 - i * 0.002)).toFixed(2), })), [vHub]);` |
| `eraVsMast` | `useMemo(() => MONTHS.map((m, i) => ({` |
| `aepByBin` | `useMemo(() => { const n = arrRows * arrCols;` |
| `yearlyAEP` | `useMemo(() => Array.from({ length: projLife }, (_, i) => ({ year: i + 1, aep: +(netAEP * Math.pow(0.995, i)).toFixed(1), })), [netAEP, projLife]);` |
| `meanWind` | `lambda * Math.pow(1 + 1 / wk, 1 / wk);` |
| `powerDensity` | `0.5 * 1.225 * Math.pow(meanWind, 3);` |
| `cfByHub` | `[80,100,120,140,160].map((h, i) => {` |
| `lam` | `v / (Math.pow(1 + 1 / wk, 1 / wk) * 0.9);` |
| `cfH` | `(e / (turbine.mw * 8760)) * 100;` |
| `cfByDepth` | `[10,20,30,40,50,60,70,80].map((d, i) => ({` |
| `cfEst` | `+(cf * (1 + (t.D / turbine.D - 1) * 0.4) + sr(i * 31) * 1).toFixed(1);` |
| `lcoeEst` | `+(lcoe * (1 - (t.mw - turbine.mw) * 0.005)).toFixed(1);` |
| `xDist` | `r * 7 * turbine.D;` |
| `yDist` | `Math.abs(c - arrCols / 2) * 5 * turbine.D;` |
| `lateralFactor` | `Math.exp(-0.5 * Math.pow(yDist / (turbine.D * 3), 2));` |
| `Ueff` | `vHub - (vHub - U) * lateralFactor;` |
| `cell` | `heatmap.find(h => h.row === r + 1 && h.col === c + 1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `MARKETS`, `MONTHS`, `SITES`, `TABS`, `TURBINES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual AEP (P50) | `AEP = ∫ P(v) × f(v,k,λ) × 8760 dv` | Wind atlas + power curve | Gross AEP before wake and availability losses; North Sea 12MW turbine at class I site: ~52 GWh/turbine/yr; capacity factor 45–55% for prime North Sea sites |
| Wake Loss | `Jensen top-hat model: ΣU_deficit/ΣU₀` | Turbine layout + wake model | Strongly dependent on spacing: 5D spacing → ~15% loss; 8D spacing → ~8% loss; offshore wakes persist further (lower TI) than onshore wakes |
| Capacity Factor (net) | `Net AEP / (P_rated × 8760)` | Wind atlas + loss chain | Best offshore CF: 52–58% (prime North Sea Grade A sites); US East Coast: 42–50%; floating sites (deep water high wind): 50–58% |
| P90/P50 ratio | `P90 = P50 × exp(−1.282 × σ_combined)` | Lognormal model | P90 haircut typically 6–12% for offshore; smaller than onshore because maritime wind is more stable; σ includes interannual, wake model, and measurement uncertainty |
| Extreme Wind (50yr) | `Gumbel distribution extreme value fit` | DNVGL-ST-0437 | Site-specific 50-year return period wind speed for turbine structural class selection; IEC Class I turbines rated to U₅₀=50m/s; typhoon-prone sites may require Class S special |
| Wind Power Density | `WPD = ½ρv³; ρ≈1.23 kg/m³ at sea level` | Wind atlas at hub height | Key site quality metric; IEC Class I: WPD >500 W/m²; Class III: <300 W/m²; higher WPD → better economics but higher structural loads |
| Turbine Spacing (optimal) | `Wake loss / land constraint trade-off` | Layout optimisation | Offshore wind turbine rows typically 8–10D downwind spacing, 5–6D cross-wind spacing; tighter spacing reduces cabling cost but increases wake losses |
- **Site coordinates + turbine selection → Weibull k/λ fit (seeded from region)** → Jensen wake model on array layout → **Net AEP after wake + availability; P50/P90 from combined σ**
- **Wind speed bins (0–25m/s) × Weibull pdf × power curve lookup** → Numerical AEP integration → **Gross AEP, wind speed → power contribution histogram, capacity factor**
- **ERA5/MERRA-2 interannual variability (seeded)** → Lognormal P90 with uncertainty RSS → **P50/P75/P90/P99 annual energy, bankability statement**

## 5 · Intermediate Transformation Logic
**Methodology:** Weibull AEP Integration + Jensen Wake Model + P90 Lognormal
**Headline formula:** `AEP = 8760 × P_rated × ∫₀^∞ P(v)/P_rated × f(v,k,λ)dv; Wake: U_wake = U₀(1−(1−√(1−Ct))×(D/(D+2k×x))²); P90 = P50×exp(−1.282×σ)`

Weibull distribution fit: shape k (1.8–2.4 for most offshore sites) and scale λ derived from mean wind speed; AEP integration numerically sums (power_curve × Weibull_pdf × frequency) over 25 m/s speed bins. Jensen top-hat wake model: wake velocity deficit U_deficit = U₀ × (1−√(1−Ct)) × (D/(D+2k×x))², k=0.04 offshore (stable atmosphere); total array wake loss = 1 − ΣU_wake/ΣU₀. P90 uses lognormal with interannual variability σ from ERA5/MERRA-2 historical long-term; combined uncertainty RSS across resource, wake, availability, and measurement bias.

**Standards:** ['IEC 61400-1:2019', 'IEC 61400-3-1:2019 Offshore Wind', 'DNVGL-ST-0437 Wind Conditions', 'MEASNET Cup Anemometry Calibration']
**Reference documents:** IEC 61400-3-1:2019 — Design Requirements for Offshore Wind Turbines; DNVGL-ST-0437:2016 — Loads and Site Conditions for Wind Turbines; BOEM — Offshore Wind Resource Assessment — US East Coast (2023); NREL — Offshore Wind Energy in the United States (2023 Market Report); 4C Offshore — Global Offshore Wind Farm Database & Benchmarks

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A genuine engineering wind-resource assessment pipeline: Weibull distribution fitting, Jensen
top-hat wake-loss modelling, numerical AEP integration, and lognormal P50/P90 uncertainty — matching
the guide's stated methodology closely.

```
V_hub    = V_ref × (hubHeight/80)^shearExp                       // wind shear power law
λ        = V_hub / (Γ(1+1/k) × 0.9)                                // Weibull scale (approx.)
Deficit  = (1 − √(1−Ct)) × (D / (D + 2·k_wake·x))²                 // Jensen top-hat wake model
AEP      = 8760 × Σ_v P(v) × Weibull_pdf(v,k,λ)
P90      = P50 × exp(−1.282 × σ)
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Weibull scale approximation | `λ = vHub / (Math.pow(1+1/wk, 1/wk) × 0.9)` | Approximates `Γ(1+1/k)` without a true gamma function — a numerical shortcut, not exact (true Weibull mean = λ·Γ(1+1/k); code inverts this with a power-based proxy for Γ and an extra ×0.9 fudge factor with no cited derivation) |
| Wake decay constant k | user input, typically 0.04 offshore per guide | Configurable |
| Power curve | cubic ramp `((v−cutIn)/(rated−cutIn))³` between cut-in and rated speed | Standard simplified turbine power-curve shape (real curves are typically S-shaped/manufacturer-specific, not a pure cube law — a modelling simplification) |
| Air density | 1.225 kg/m³ | Standard ISA sea-level value, correctly used in `powerDensity = 0.5×1.225×meanWind³` |
| Degradation | 0.995^year (0.5%/yr) | Consistent with `offshore-wind-finance`/`offshore-wind-om` degradation assumption — good cross-module consistency |
| P90 z-value | 1.282 | Correct standard-normal 90th-percentile one-tailed z-score |

### 7.3 Calculation walkthrough

1. **Hub-height wind speed**: power-law shear extrapolation from the reference height (80m assumed
   reference) to actual hub height — textbook approach, though the guide's cited standard
   (IEC 61400-1) typically also requires site-specific roughness/stability corrections not visible
   in this formula.
2. **AEP integration** (`aepByBin`): numerically sums `power_curve(v) × Weibull_pdf(v) × 0.5`
   (0.5 m/s bin width) across the speed range, multiplied by 8760 hours and turbine count — genuine
   numerical integration, not a closed-form shortcut.
3. **Wake loss** (`deficit` function + `heatmap`): applies the Jensen top-hat model per turbine pair
   using downwind distance `xDist = row×7D` and lateral offset `yDist`, with a Gaussian lateral
   decay `exp(-0.5×(yDist/(3D))²)` moderating the deficit for turbines not directly downwind — a
   reasonable 2D extension of the classic 1D Jensen model. `avgWakeDeficit` averages across array
   rows.
4. **Net AEP**: `gross×(1−wakeLoss)×(1−elecLoss/100)×(avail/100)` — the standard loss-chain
   cascade (gross → wake → electrical → availability).
5. **P50/P90/P75**: `p90Val`/`p75Val` apply the lognormal transform `AEP × exp(−z×σ)` with
   `σ = p90Sigma/100` user-configurable combined uncertainty, and a normal PDF (`uncertaintyDist`)
   visualizes the distribution shape.
6. **LCOE**: CAPEX annuitised via the capital-recovery factor (`crf = r(1+r)^n/((1+r)^n−1)`) plus
   annual OPEX, divided by net AEP — standard LCOE definition, consistent with the sibling
   `offshore-wind-finance` module's LCOE formula.

### 7.4 Worked example

12 MW turbine, hub height 150m, site `V_ref=10.2 m/s` at 80m, Weibull k=2.1, 8×8 array, 7D row
spacing:

| Step | Computation | Result |
|---|---|---|
| Shear-adjusted V_hub | 10.2 × (150/80)^0.12 | ≈ 10.63 m/s |
| Weibull λ (code approximation) | 10.63 / (1.126^0.476 × 0.9) | ≈ 10.85 |
| Gross AEP per turbine | 8760 × Σ power(v)×pdf(v) | site/turbine-specific, ~50–55 GWh/yr for a Class-I North Sea site |
| Wake deficit (row 4, 7D spacing) | (1−√(1−Ct))×(D/(D+2×0.04×4×7D))² | a few % per downwind row, cumulating across the array |
| P90/P50 ratio (σ=8%) | exp(−1.282×0.08) | **≈ 0.902** — a 9.8% P90 haircut, within the guide's 6–12% stated range |

### 7.5 Data provenance & limitations

- **Site table (`SITES`, 7 rows) and turbine table (`TURBINES`, 6 rows) are seed constants** styled
  on real offshore regions (North Sea, US East Coast, Taiwan, etc.) but not ingested from ERA5/
  MERRA-2 as the guide's `dataLineage` claims — there is no live reanalysis data pull.
- The Weibull scale approximation (`0.9` fudge factor substituting for the gamma function) is a
  numerical shortcut that will introduce error versus a true `λ = V̄ / Γ(1+1/k)` calculation,
  especially at low k (high variability) sites — worth reconciling against a proper gamma-function
  implementation for production use.
- The cubic power-curve shape is a simplification of real manufacturer power curves (which have
  inflection points and are rarely a pure cube law across the full ramp range).
- Extreme wind (50-year return period) and satellite-vs-mast validation tabs are described in the
  guide but their specific formulas were not present in the extracted `computed` list.

**Framework alignment:** IEC 61400-3-1 (offshore design site conditions) and the Jensen wake-model
literature are correctly reflected in structure (top-hat deficit, decay constant k); the P90
lognormal convention matches DNVGL-ST-0437/MEASNET bankability-study practice, though the specific
σ inputs (interannual, wake-model, measurement bias) are user-configurable single values rather than
independently sourced uncertainty components combined via root-sum-of-squares as the guide describes.

## 9 · Future Evolution

### 9.1 Evolution A — Exact Weibull integration and real wind data (analytics ladder: rung 2 → 4)

**What.** §7 confirms a genuine engineering pipeline: Weibull fitting, Jensen top-hat wake model, numerical AEP integration, and lognormal P50/P90 uncertainty decomposition — matching the guide. §7.2 flags two honest numerical shortcuts: the Weibull scale uses a power-based proxy for the gamma function `Γ(1+1/k)` plus an unexplained ×0.9 fudge factor (not exact), and the power curve is a pure cube law rather than a manufacturer S-curve. Both bias AEP. And all wind inputs are seed-table site constants, not real met data. Evolution A fixes the math and grounds the resource.

**How.** (1) Replace the Γ proxy with an exact gamma-function evaluation (trivial via `Math` lgamma or a Lanczos approximation) and drop the ×0.9 fudge — the Weibull scale then correctly reproduces the site mean wind speed. (2) Use manufacturer power curves (or an S-curve fit) instead of the cube law for the turbine models in `TURBINES`. (3) Ground site wind resource in real reanalysis data — ERA5/MERRA-2 (already named in §5 for the P90 interannual σ) provide free long-term wind time series per coordinate, replacing the seed-table `SITES`; this also makes the P50/P90 uncertainty decomposition data-driven. Rung-4: the P90 becomes a real probabilistic yield from historical interannual variability.

**Prerequisites.** ERA5/MERRA-2 ingestion (free, coordinate-keyed); a `bench_quant` pin comparing exact-Γ AEP against a hand-computed Weibull case (the current shortcut would fail it). **Acceptance:** Weibull scale reproduces the site mean to <1%; AEP uses a real power curve; P50/P90 derives from ERA5 interannual variability, not an assumed σ.

### 9.2 Evolution B — Resource-assessment copilot for pre-FEED diligence (LLM tier 2)

**What.** A copilot for the developer/IE/investor users §1 targets: "what's the net AEP for an 18MW turbine array at this North Sea site with Jensen wake k=0.04?", "how sensitive is yield to hub height?", "what's the P90 and its uncertainty breakdown?", "is this site IEC Class I suitable?" — executed against the Weibull/wake/AEP/P90 engine, decomposing net AEP into gross → wake-corrected → availability-adjusted.

**How.** Tool calls to endpoints wrapping the Weibull fit, Jensen wake, AEP integration, and P90 functions; system prompt from this Atlas page's §5 formulas and the IEC 61400-3 / DNVGL-ST-0437 references named in §5 so site-characterisation and turbine-class answers cite the right standard. Hub-height and wake-decay sensitivities are recomputations; the P90 uncertainty decomposition (interannual, measurement bias, wake, availability) comes from the engine's RSS combination. Fabrication validator matches every AEP/CF/P90 figure to a tool response; the copilot frames outputs as pre-FEED-grade (replacing Windographer/WAsP screening per §1, not a bankable energy assessment).

**Prerequisites.** Compute endpoints; Evolution A for exact-Γ AEP and real wind data before quoting bankable-looking yields. **Acceptance:** every AEP/P90 figure traces to a tool call; wake/hub-height sensitivities behave monotonically; IEC-class answers cite the standard; the copilot flags pre-FEED scope.