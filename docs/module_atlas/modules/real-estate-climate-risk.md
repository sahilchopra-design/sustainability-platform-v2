# Real Estate Climate Risk
**Module ID:** `real-estate-climate-risk` · **Route:** `/real-estate-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DE2 · **Sprint:** DE

## 1 · Overview
Assesses physical climate hazards (flood, wildfire, heat, subsidence) at property level using geocoded exposure data and IPCC SSP scenarios. Calculates expected annual loss (EAL), insurance affordability cliff, and mortgage default probability uplift.

> **Business value:** Essential for mortgage lenders (ECB Guide on Climate Risk), property valuers (RICS PS1), insurers setting flood premiums, and real estate fund managers under SFDR Article 8/9. Provides property-level EAL to price climate risk into lending margins and asset valuations.

**How an analyst works this module:**
- Upload property addresses for geocoding
- Select SSP scenario and time horizon (2030/2050/2080)
- Review hazard exposure scores by peril
- Analyse EAL and insurance gap by property
- Filter portfolio to high-risk assets for engagement or divestment

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSETS`, `Card`, `KpiCard`, `NGFS`, `REGIONS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `NGFS` | `['Orderly 1.5°C','Disorderly 2°C','Hot House 3°C+'];` |
| `type` | `TYPES[Math.floor(sr(i*7)  * TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i*11) * REGIONS.length)];` |
| `value` | `parseFloat((5 + sr(i*3) * 245).toFixed(1));` |
| `flood` | `parseFloat((sr(i*13)*100).toFixed(1));` |
| `heat` | `parseFloat((sr(i*17)*100).toFixed(1));` |
| `storm` | `parseFloat((sr(i*19)*100).toFixed(1));` |
| `wildfire` | `parseFloat((sr(i*23)*100).toFixed(1));` |
| `coastal` | `parseFloat((sr(i*29)*100).toFixed(1));` |
| `composite` | `parseFloat((flood*0.30+heat*0.25+storm*0.20+wildfire*0.10+coastal*0.15).toFixed(1));` |
| `varOrd` | `parseFloat((composite*0.0012 + sr(i*31)*0.015).toFixed(4));` |
| `varDis` | `parseFloat((composite*0.0025 + sr(i*33)*0.025).toFixed(4));` |
| `varHot` | `parseFloat((composite*0.0050 + sr(i*37)*0.040).toFixed(4));` |
| `spread` | `Math.round(10 + composite*0.8 + sr(i*41)*50);` |
| `adaptCx` | `parseFloat((value*(composite/100)*0.08 + sr(i*43)*0.5).toFixed(2));` |
| `avgComp` | `n ? (filtered.reduce((s,a)=>s+a.composite,0)/n).toFixed(1) : '0';` |
| `totalVal` | `filtered.reduce((s,a)=>s+a.value,0).toFixed(0);` |
| `totalVaR` | `filtered.reduce((s,a)=>s+a.value*a[vk],0).toFixed(1);` |
| `avgSpread` | `n ? Math.round(filtered.reduce((s,a)=>s+a.spread,0)/n) : 0;` |
| `radarData` | `useMemo(() => { const avg = k => n ? parseFloat((filtered.reduce((s,a)=>s+a[k],0)/n).toFixed(1)) : 0;` |
| `hrAvg` | `k => { const hr=filtered.filter(a=>a.band==='High'); return hr.length ? parseFloat((hr.reduce((s,a)=>s+a[k],0)/hr.length).toFixed(1)) : 0; };` |
| `regionRisk` | `useMemo(() => REGIONS.map(r => {` |
| `ngfsVaR` | `useMemo(() => TYPES.map(t => {` |
| `hazardByType` | `useMemo(() => TYPES.map(t => {` |
| `avg` | `k => a.length ? parseFloat((a.reduce((s,x)=>s+x[k],0)/a.length).toFixed(1)):0;` |
| `varTimeline` | `useMemo(() => [2025,2030,2035,2040,2045,2050].map((yr,i) => ({` |
| `floodData` | `useMemo(() => REGIONS.map(r => {` |
| `pct` | `all.length?(a.length/all.length*100).toFixed(0):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS`, `REGIONS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EAL (Flood, 1.5°C) | — | IPCC AR6 + JRC EU Floods Directive | Expected annual flood loss as % of property value — doubles under RCP8.5 by 2050 |
| Insurance Coverage Gap | — | Swiss Re Sigma 2023 | Share of climate-exposed residential properties uninsured or underinsured globally |
| Mortgage Default Uplift | — | ECB Working Paper 2022 | Climate-risk exposure adds 18–34 bps to mortgage default probability in high-hazard zones |
- **Property addresses + valuations** → Geocoding + hazard overlay → **Per-property hazard scores by SSP/year**
- **Catastrophe model loss curves** → EAL integration → **Portfolio EAL, tail risk (TVaR99), insurance premium estimate**
- **Mortgage loan tape** → Default probability overlay → **Loan-level PD uplift and LTV stress under 2050 scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Expected Annual Loss (EAL)
**Headline formula:** `EAL = Σ [P(hazard_i) × Damage_i × AssetValue]; InsuranceAffordabilityRatio = Premium / AnnualRent`

Integrates multi-hazard exceedance probability curves with vulnerability functions to produce asset-level EAL, then aggregates to portfolio level with spatial correlation

**Standards:** ['IPCC AR6 WGI Chapter 12', 'NGFS Physical Risk Framework', 'Flood Re Affordability Model', 'CoreLogic Climate Risk Analytics']
**Reference documents:** IPCC AR6 WGI Chapter 12 — Climate Change Information for Regional Impact Assessment; ECB Working Paper 2022 — Climate Change and the Valuation of Real Estate; NGFS Guide on Climate Scenario Analysis for Central Banks and Supervisors; Swiss Re Sigma 2023 — Natural Catastrophes in 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is titled **"Expected Annual
> Loss (EAL)"**: `EAL = Σ[P(hazard_i) × Damage_i × AssetValue]`, describing exceedance-probability
> curves integrated against vulnerability (damage) functions, plus named data points "Insurance
> Coverage Gap 23%" and "Mortgage Default Uplift +18–34bps" sourced to Swiss Re / ECB. **None of
> this is implemented.** The code instead computes a **linearly-weighted composite hazard score**
> (0–100) and a heuristic **pseudo-VaR** (`composite × small coefficient + noise`) it labels
> "Portfolio VaR" — not an EAL, not built from exceedance curves or damage functions, and with no
> insurance-gap or mortgage-default-uplift field anywhere in the file. The sections below describe
> the composite-score/pseudo-VaR model the code actually runs.

### 7.1 What the module computes

For 80 synthetic UK real-estate assets across 6 types and 8 regions, the module scores five
physical hazards (0–100 each) and combines them into a composite score, then derives an
NGFS-scenario-conditioned "VaR" and an adaptation-capex estimate:

```js
composite = flood×0.30 + heat×0.25 + storm×0.20 + wildfire×0.10 + coastal×0.15
varOrd    = composite × 0.0012 + sr()×0.015     // "Orderly 1.5°C" loss rate
varDis    = composite × 0.0025 + sr()×0.025     // "Disorderly 2°C"
varHot    = composite × 0.0050 + sr()×0.040     // "Hot House 3°C+"
spread    = round(10 + composite×0.8 + sr()×50)  // bps, proxy for credit/yield spread
adaptCx   = value × (composite/100) × 0.08 + sr()×0.5   // £M adaptation capex estimate
band      = composite≥70 'High' : composite≥40 'Medium' : else 'Low'
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Hazard weights (composite) | Flood 30%, Heat 25%, Storm 20%, Wildfire 10%, Coastal 15% | Synthetic demo weighting — ordinally plausible for a UK book (flood dominant) but not fitted or sourced |
| VaR base coefficients | Orderly 0.0012, Disorderly 0.0025, Hot House 0.0050 | Synthetic — increasing by scenario severity (correct ordinal direction: hotter/later scenario ⇒ higher physical loss rate), magnitudes not calibrated to any loss database |
| VaR noise ranges | 0.015 / 0.025 / 0.040 | Synthetic — noise magnitude also scales with scenario, compounding rather than diversifying uncertainty |
| Risk band thresholds | High ≥70, Medium ≥40, Low <40 | UI heuristic |
| `floodZone` / `coastZone` flags | flood>65 / coastal>60 | UI heuristic, not a regulatory flood-zone designation (e.g. UK EA Flood Zone 3) |
| Timeline VaR growth | ×1.03ⁱ / ×1.07ⁱ / ×1.12ⁱ per 5-yr step, i=0..5 (2025–2050) | Synthetic compounding — reflects the intuition that physical risk accelerates faster under worse scenarios, magnitudes unsourced |

### 7.3 Calculation walkthrough

1. **Hazard generation**: five independent `sr()` draws per asset (flood/heat/storm/wildfire/
   coastal, each 0–100), combined into `composite` by the fixed weights above.
2. **Scenario VaR**: for each of the 3 NGFS-labelled scenarios, a loss *rate* is computed from
   `composite` (not from any exceedance-probability × damage-function convolution), then the
   selected scenario's rate multiplies `value` to get a £M "VaR" per asset — `totalVaR =
   Σ(value × rate)` for the filtered book.
3. **Filters**: type / region / risk-band dropdowns subset `ASSETS` before every aggregate.
4. **Portfolio KPIs**: `avgComp` (mean composite), `totalVal`, `highRisk` (count band=High),
   `floodCount` (count floodZone), `totalVaR` (scenario-selected), `avgSpread`.
5. **Radar / by-type / by-region breakdowns**: straightforward group-by means of the five hazard
   scores and composite, split High-risk vs Portfolio-average, by type, and by region.
6. **VaR timeline** (`varTimeline`): projects each scenario's total VaR from 2025 to 2050 in 5-year
   steps using the compounding multipliers above — a stylised acceleration curve, not a re-run of
   the hazard model under future climate data.
7. **Adaptation capex**: `adaptCx` scales with both asset value and composite score/100, i.e.
   larger, higher-hazard assets get proportionally larger capex estimates — directionally sound,
   magnitude synthetic (8% of value at max hazard, plus noise).

### 7.4 Worked example

Asset `i=0` (type=Office/Off, region=London/Lon):

| Field | Formula | Result |
|---|---|---|
| `flood` | `sr(13)×100` | `sr(13)=frac(sin(14)×10⁴)≈0.9906` → **99.1** |
| `heat` | `sr(17)×100` | `sr(17)=frac(sin(18)×10⁴)≈0.9358` → **93.6** |
| `storm` | `sr(19)×100` | ≈ 40 (illustrative) |
| `wildfire` | `sr(23)×100` | ≈ 25 |
| `coastal` | `sr(29)×100` | ≈ 55 |
| `composite` | `99.1×0.30+93.6×0.25+40×0.20+25×0.10+55×0.15` | **29.73+23.4+8+2.5+8.25 = 71.9** |
| `band` | `composite≥70` | **High** |
| `varDis` (Disorderly 2°C) | `71.9×0.0025+noise` | ≈ **0.198** (19.8% loss rate) |
| VaR (£M) at `value=$150M` | `150 × 0.198` | ≈ **$29.7M** "Disorderly 2°C VaR" |
| `spread` | `10+71.9×0.8+noise` | ≈ **77–127 bps** |
| `adaptCx` | `150×(71.9/100)×0.08+noise` | ≈ **£8.6–9.1M** |

A ~20% "VaR" loss rate on a single high-hazard asset is far above the guide's stated EAL range of
0.3–2.1% of asset value — confirming the code's metric is not a calibrated EAL, but an unscaled
composite-score transform whose output magnitude was not benchmarked against the guide's own
cited figures.

### 7.5 Risk-band & scenario rubric

| Band | Composite range | badge colour |
|---|---|---|
| Low | <40 | green |
| Medium | 40–69 | amber |
| High | ≥70 | red |

Scenario key mapping: `scenario.includes('1.5')→varOrd`, `includes('2°')→varDis`, else `→varHot`.

### 7.6 Companion analytics

Hazard radar (portfolio vs high-risk subset), regional composite map, NGFS VaR-by-type bar,
hazard-by-type breakdown, VaR timeline to 2050, flood-zone-% by region. All are group-bys/re-uses
of the same seven per-asset fields — no additional independent data source.

### 7.7 Data provenance & limitations

- **100% synthetic.** All hazard scores, VaR rates, spreads and adaptation capex derive from
  `sr(seed)=frac(sin(seed+1)×10⁴)`; asset names are procedurally generated codes
  (`Off-Lon-A` style), not real properties.
- The "VaR" label is a misnomer for what is actually a deterministic composite-score-to-loss-rate
  transform plus additive noise — there is no simulated loss distribution, no percentile, and thus
  no actual Value-at-Risk in the statistical sense.
- No insurance-gap or mortgage-default-uplift metric exists despite being named guide data points.
- Hazard weights and VaR coefficients are not sourced to any catastrophe model, hazard map, or
  loss database (contrast with `physical-hazard-map`/`catastrophe-modelling` modules elsewhere on
  the platform, which at least use hazard-specific loss curves).

**Framework alignment:** IPCC AR6 WGI hazard categories (flood, heat, storm, wildfire, coastal/SLR)
are represented as named dimensions, not derived from AR6 regional projections · NGFS 3-scenario
framing (Orderly/Disorderly/Hot House) is used as a scenario selector but the loss coefficients are
not NGFS-calibrated · TCFD physical-risk categorisation is followed structurally (hazard →
composite → financial impact) without a TCFD-compliant quantification method behind it.

## 8 · Model Specification — Expected Annual Loss (EAL)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Replace the composite-score pseudo-VaR with a genuine per-asset EAL, supporting lender/investor
decisions on pricing, capital allocation and engagement/divestment for the 80-asset UK real estate
book, consistent with what the guide already promises.

### 8.2 Conceptual approach
Adopt a standard catastrophe-model **exceedance-probability × vulnerability** structure, as used
in **CoreLogic Climate Risk Analytics** and **Swiss Re CatNet**: for each hazard, integrate a
peril-specific damage-ratio function over the asset's exceedance-probability curve at its location,
sum across perils (with a covariance adjustment for compound events), and multiply by asset value.
This mirrors the platform's own `catastrophe-modelling` and `physical-hazard-map` modules, which
already implement hazard-specific loss curves — this module should consume the same primitives
rather than maintaining a parallel composite-score heuristic.

### 8.3 Mathematical specification

```
EAL_i = AssetValue_i × Σ_h [ ∫ P(loss > x | hazard_h, location_i) dx ]              (h ∈ {flood,heat,storm,wildfire,coastal})
      ≈ AssetValue_i × Σ_h [ Σ_k P(RP_k, hazard_h) × DamageRatio_h(RP_k) ]           (discretised over return periods RP_k)
InsuranceGap_i   = max(0, EAL_i − InsuredLimit_i) / EAL_i
MortgageUplift_i = β_h × HazardScore_i(composite)                                    [β_h calibrated to ECB 2022 estimate: 18–34bps at high-hazard]
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `P(RP_k, hazard_h)` | Annual exceedance probability at return period k | JRC EU Floods Directive maps (flood), Aqueduct/ND-GAIN (heat/drought), Swiss Re CatNet (storm/wildfire) |
| `DamageRatio_h(RP_k)` | Fraction of asset value lost at that severity | JRC depth-damage curves; ISO 7933 for heat-driven building/HVAC stress |
| `β_h` mortgage uplift coefficient | bps PD/spread uplift per hazard-score point | ECB Working Paper 2022 ("Climate Change and the Valuation of Real Estate") — cited by the guide but never implemented |

### 8.4 Data requirements
- Asset geocoding (lat/long or postcode) — not currently in `ASSETS` (only region names).
- Hazard exceedance curves per peril per location — available via the platform's
  `reference_data_layer` for some perils (Aqueduct water risk), not yet for UK flood/storm.
- Insured limit per asset — not modelled anywhere in this module family today.

### 8.5 Validation & benchmarking plan
- Reconcile modelled EAL (% of value) against the guide's own cited range (flood EAL 0.3–2.1% of
  value at 1.5°C) — the current pseudo-VaR output (§7.4 worked example, ~20% on a high-hazard
  asset) is roughly an order of magnitude too high and should not be presented as EAL until
  rebuilt.
- Cross-check mortgage uplift output against the ECB 2022 paper's reported 18–34bps range for
  high-hazard postcodes.

### 8.6 Limitations & model risk
- Compound-hazard correlation (e.g. coastal flood + storm surge co-occurring) requires a copula or
  joint-event catalogue; naive summation across perils will overstate tail EAL.
- Return-period data below 1-in-20-years is typically unreliable; floor damage-ratio integration
  at RP≥20 and flag assets relying on sparse short-return-period data.
- Without real insured-limit data, `InsuranceGap` should default to a conservative sector-average
  proxy (e.g. Swiss Re Sigma's ~23% uninsured share cited in the guide) rather than 0%.

## 9 · Future Evolution

### 9.1 Evolution A — Geocoded EAL from the digital twin, replacing the misnamed "VaR" (analytics ladder: rung 1 → 3)

**What.** §7.7 is unambiguous: 100% synthetic (procedural asset codes, `sr()` hazard scores), the "VaR" label is a misnomer for a composite-to-loss-rate transform plus additive noise, and the guide's named outputs — expected annual loss, insurance-affordability cliff, mortgage default-probability uplift — don't exist. Yet the promised workflow (geocode → SSP/horizon → per-peril exposure → EAL) is exactly what the platform's Physical Risk Digital Twin was built for. Evolution A implements the §8 EAL spec on that infrastructure rather than inventing another scoring heuristic.

**How.** (1) Property intake with geocoding; per-peril hazard resolution against the populated `ref_*_zones` grids via `global_physical_risk_engine`, with `resolution_tier` honesty for coarse coverage. (2) EAL per the §8 spec: hazard intensity → damage-ratio curve per peril/property-type → EAL = Σ (event frequency × damage ratio × value), replacing the unsourced 0.30/0.25/0.20/0.10/0.15 weights with documented per-peril curves (the atlas notes `physical-hazard-map`/`catastrophe-modelling` already carry hazard-specific loss curves — reuse them). (3) Mortgage default uplift as a documented add-on: EAL and insurance-cost stress feeding a DTI/LTV-based PD adjustment, clearly labelled a modelling assumption with citation. (4) The NGFS selector maps to scenario-differentiated hazard scaling per peril, not three flat coefficient sets.

**Prerequisites.** Flood-grid coverage upgrade (sparse today) or tier-flagged fallback; damage-curve provenance documented per Atlas §8 convention. **Acceptance:** two assets in different flood zones produce different EALs from coordinates alone; the word "VaR" disappears unless a percentile of a loss distribution is actually computed.

### 9.2 Evolution B — Lending-desk climate screen copilot (LLM tier 2)

**What.** The module's audience — mortgage lenders under the ECB climate guide, valuers under RICS — needs per-asset answers with provenance: "what drives this collateral's EAL and how confident is the flood component?", "list assets where the insurance-cost stress exceeds 1% of value under SSP5-8.5 2050", "explain to credit committee why this margin add-on is 35bps". The copilot serves these from the Evolution-A endpoints, always quoting each peril's resolution tier and damage-curve source.

**How.** Tier-2 tool schemas over the EAL/portfolio endpoints; system prompt embeds the §7.7 lineage so pre-Evolution-A the copilot cannot exist here (every current number is fabricated), and post-A it must attach the coverage caveat for coarse-tier assets. Margin-add-on explanations decompose mechanically: EAL → expected-loss bps → add-on, with the PD-uplift assumption flagged as such. Divest/engage screening runs as filtered tool queries, never as model judgement about specific addresses — the copilot ranks by computed metrics and leaves the decision framing to the user.

**Prerequisites (hard).** Evolution A; per-response provenance fields (tier, curve source) in the API payload. **Acceptance:** every EAL and bps figure in an answer traces to a tool response including its resolution tier; asked about a hazard the grids don't cover at the asset's location, the copilot reports the coverage gap.