# Physical Risk Portfolio
**Module ID:** `physical-risk-portfolio` · **Route:** `/physical-risk-portfolio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Asset-level physical climate risk assessment across acute (flood, wildfire, tropical cyclone, storm) and chronic (heat, sea level rise, drought) hazards. Covers 6 SSP scenarios to 2100 with financial loss estimation.

> **Business value:** Quantifies the financial impact of climate-driven natural hazards on the physical asset base. Required for TCFD, ISSB S2, and CSRD physical risk disclosure. Enables risk-informed capital allocation, asset acquisition screening, and insurance adequacy assessment.

**How an analyst works this module:**
- Asset Map overlays portfolio on hazard maps (flood/fire/wind)
- Scenario Selector shows risk under SSP1-2.6 to SSP5-8.5
- Loss Estimation shows AAL and PML per asset and portfolio
- Chronic Risk tracks gradual changes (heat, SLR, drought) to 2100
- Adaptation Options shows flood defences, cooling, elevation options

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `KpiCard`, `PERILS`, `PORTFOLIO`, `REGIONS`, `REGULATORY_THRESHOLDS`, `SCENARIOS_MAP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORY_THRESHOLDS` | 5 | `metric`, `threshold`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;` |
| `pct` | `(n, d = 1) => `${(n * 100).toFixed(d)}%`;` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LatAm', 'MENA'];` |
| `value` | `Math.round((sr(i * 17) * 400 + 100) * 1e6);` |
| `perilScores` | `Object.fromEntries(PERILS.map((p, j) => [p, Math.round(sr(i * 9 + j) * 80 + 15)]));` |
| `compositeHazard` | `Math.round(Object.values(perilScores).reduce((a, b) => a + b, 0) / PERILS.length);` |
| `aal` | `Math.round(value * 0.001 * (compositeHazard / 50) * (0.8 + sr(i * 23) * 0.4));` |
| `pml100` | `Math.round(value * 0.08 * (compositeHazard / 50) * (0.9 + sr(i * 31) * 0.2));` |
| `insured` | `sr(i * 7) > 0.35;` |
| `PORTFOLIO` | `isIndiaMode() ? adaptForPhysicalRisk().slice(0, 30).map((c, i) => ({` |
| `scenarioLabels` | `{ current: 'Current', ssp1_26: 'SSP1-2.6 (2050)', ssp2_45: 'SSP2-4.5 (2050)', ssp5_85: 'SSP5-8.5 (2050)', ssp5_2100: 'SSP5-8.5 (2100)' };` |
| `filtered` | `useMemo(() => selectedRegion === 'All' ? PORTFOLIO : PORTFOLIO.filter(a => a.region === selectedRegion), [selectedRegion]);  const totalExposure = filtered.reduce((s, a) => s + a.value, 0);` |
| `totalAAL` | `Math.round(filtered.reduce((s, a) => s + a.aal, 0) * mult);` |
| `totalPML100` | `Math.round(filtered.reduce((s, a) => s + a.pml100, 0) * mult);` |
| `insuredExp` | `filtered.filter(a => a.insured).reduce((s, a) => s + a.value, 0);` |
| `uninsuredAAL` | `Math.round(filtered.filter(a => !a.insured).reduce((s, a) => s + a.aal, 0) * mult);` |
| `highRisk` | `filtered.filter(a => Math.round(a.compositeHazard * mult) > 65);` |
| `byRegion` | `REGIONS.map(r => {` |
| `byPeril` | `PERILS.map(p => ({` |
| `doubleHit` | `useMemo(() => SCENARIOS_MAP, []);  // Regulatory metrics — guard: empty filter (totalExposure = 0) → tier1 = 0 → divide-by-zero in regChecks const tier1 = Math.max(totalExposure * 0.12, 1);` |
| `rwa` | `Math.max(totalExposure * 0.85, 1);` |
| `highRiskPct` | `filtered.length ? highRisk.length / filtered.length : 0;` |
| `maxRegionExp` | `totalExposure > 0 ? Math.max(...byRegion.map(r => r.exposure / totalExposure)) : 0;` |
| `sorted` | `useMemo(() => [...filtered].sort((a, b) => { if (sortBy === 'pml100') return Math.round(b.pml100 * mult) - Math.round(a.pml100 * mult);` |
| `adj` | `Math.min(100, Math.round(a.compositeHazard * mult));` |
| `corr` | `ri === ci ? 1.0 : Math.round((0.1 + sr(ri * 13 + ci * 7) * 0.55) * 100) / 100;` |
| `exp` | `assets.reduce((s, a) => s + a.value, 0);` |
| `adjHazard` | `Math.min(100, Math.round(a.compositeHazard * mult));` |
| `totalPml` | `filtered.reduce((s, x) => s + x.pml100, 0);` |
| `pmlShare` | `totalPml > 0 ? a.pml100 / totalPml : 0; // guard: prevents Infinity when all PML100 = 0` |
| `priority` | `Math.round(adjHazard * 0.4 + pmlShare * 100 * 0.35 + (a.insured ? 0 : 25) * 0.25);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `PERILS`, `REGIONS`, `REGULATORY_THRESHOLDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flood AAL | `Annual Average Loss` | Industry models | Expected annual flood loss as % of asset value |
| Heat Stress Risk | — | IPCC AR6 | Wet-bulb globe temperature threshold for moderate heat stress |
| SLR Exposure by 2100 | — | SSP5-8.5 | Exposure under high-emissions sea level rise scenario |
| PML | `99.9th percentile loss` | Catastrophe model | Loss in an extreme but plausible catastrophe event |
- **Asset geolocation data** → Hazard map overlay → **Site-level exposure score**
- **IPCC AR6 projections** → Damage function application → **Loss estimate per peril**
- **Financial asset values** → Loss monetisation → **Physical risk VaR**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC hazard-damage function
**Headline formula:** `PhysicalLoss = AssetValue × HazardIntensity × VulnerabilityFactor × ExposureFraction`

Hazard probability from downscaled IPCC AR6 climate projections. Vulnerability functions map hazard intensity (e.g., flood depth, wind speed) to damage fraction. Loss distribution = convolution of hazard probability and damage function.

**Standards:** ['IPCC AR6 WGI', 'RMS/AIR industry damage functions', 'TCFD Physical Risk']
**Reference documents:** IPCC AR6 WGI Interactive Atlas; Munich Re NatCatSERVICE; Swiss Re sigma Natural Catastrophes; TCFD Physical Risk Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an IPCC hazard-damage
> methodology (`PhysicalLoss = AssetValue × HazardIntensity × VulnerabilityFactor × ExposureFraction`),
> a WBGT ≥28 °C heat-stress indicator, an "Asset Map" hazard overlay, and an "Adaptation Options"
> tab. **None of these exist in the code.** The page actually implements a **portfolio loss
> aggregator** over 30 synthetic assets: a composite hazard score drives simplified AAL/PML
> scalings, a static peril-correlation matrix, an insurance-gap calculator, and four hard-coded
> regulatory capital-ratio checks (ECB CST, BoE CBES, APRA CPG 229, ECB DFAST). Sections below
> document the code as it actually behaves.

### 7.1 What the module computes

For 30 assets across 5 regions and 5 asset classes, each carries 6 peril scores (Flood, Wildfire,
Heat, Wind, Drought, SLR), a composite hazard, and two loss metrics:

```js
compositeHazard = mean(Flood, Wildfire, Heat, Wind, Drought, SLR)          // 0–100
aal    = value × 0.001 × (compositeHazard / 50) × (0.8 + sr(seed)×0.4)     // ±20% noise band
pml100 = value × 0.08  × (compositeHazard / 50) × (0.9 + sr(seed)×0.2)    // ±10% noise band
insured = sr(seed) > 0.35                                                  // ~65% "insured"
```

A scenario multiplier (`current`=1.0 → `ssp5_2100`=2.42) scales AAL, PML and every peril score
uniformly before display — there is no scenario-specific damage-function reshaping, only a flat
linear stress.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| AAL base rate | 0.1% of asset value at composite=50 | Synthetic demo scaling, not calibrated to a named damage curve |
| PML(100yr) base rate | 8% of asset value at composite=50 | Synthetic demo scaling |
| SSP scenario multipliers | 1.00 / 1.15 / 1.35 / 1.68 / 2.42 | Illustrative, monotonic with SSP severity; not sourced from IPCC AR6 SSP damage tables |
| ECB CST 2022 threshold | PML100/Tier1 > 5% | Cited framework, real name |
| BoE CBES 2021 threshold | AAL/RWA > 1% | Cited framework, real name |
| APRA CPG 229 threshold | High-risk share > 20% | Cited framework, real name |
| Peril correlation | `0.1 + sr(seed)×0.55` off-diagonal | Synthetic seeded, not empirically estimated; text cites IPCC AR6 WGI Ch.11 compound-event framing only qualitatively |

### 7.3 Calculation walkthrough

1. **Filter** by region (or "All") → `filtered` asset list.
2. **Scenario multiplier** `mult` scales every asset's `aal`, `pml100`, and `compositeHazard`
   uniformly (`Math.round(x × mult)`), capped at 100 for hazard scores.
3. **Portfolio KPIs**: `totalExposure` = Σvalue; `totalAAL`/`totalPML100` = Σ(aal/pml100)×mult;
   `insuredExp` = Σvalue where insured; `uninsuredAAL` = Σaal×mult where NOT insured;
   `highRisk` = assets with adjusted composite > 65.
4. **Regulatory checks** divide portfolio AAL/PML100 by proxy capital bases:
   `tier1 = max(totalExposure×0.12, 1)`, `rwa = max(totalExposure×0.85, 1)` — both are flat
   percentage-of-exposure proxies, not actual Basel Tier-1/RWA figures.
5. **Engagement priority** (tab 5): `priority = adjHazard×0.4 + pmlShare×100×0.35 + (uninsured?25:0)×0.25`,
   where `pmlShare = asset.pml100 / Σportfolio.pml100`.

### 7.4 Worked example

Asset: Commercial RE, value=$300M, compositeHazard=60, seed noise at midpoint (factor≈1.0),
scenario = SSP2-4.5 (`mult=1.35`), uninsured.

| Step | Computation | Result |
|---|---|---|
| Raw AAL | 300M × 0.001 × (60/50) × 1.0 | $360,000 |
| Scenario AAL | 360,000 × 1.35 | $486,000 |
| Raw PML100 | 300M × 0.08 × (60/50) × 1.0 | $28.8M |
| Scenario PML100 | 28.8M × 1.35 | **$38.88M** |
| Adjusted hazard | min(100, 60×1.35) | 81 → red tier |
| pmlShare (illustrative, portfolio PML100 total ≈ $600M) | 38.88/600 | 6.5% |
| Priority score | 81×0.4 + 6.5×0.35 + 25×0.25 | 32.4 + 2.3 + 6.3 = **41.0** ("High" tier, >35) |

### 7.5 Regulatory stress rubric

| Check | Formula | Breach threshold |
|---|---|---|
| ECB CST 2022 | PML100 / Tier1-proxy | > 5% |
| BoE CBES 2021 | AAL / RWA-proxy | > 1% |
| APRA CPG 229 | High-risk-asset share | > 20% |
| ECB DFAST 2024 | Max single-region exposure share | > 30% |

### 7.6 Companion analytics

- **Peril correlation matrix** — 6×6, diagonal 1.0, off-diagonal `0.1+sr()×0.55`; used only for
  visual "compound risk" framing, not folded into the AAL/PML arithmetic.
- **Double-hit calculator** (tab 3) — adds three flat percentage add-ons to physical AAL: carbon
  price shock (0.45% of exposure), stranded-asset write-down (3.8% of exposure), and a 25% premium
  uplift on uninsured AAL. All three are static percentages, not scenario- or sector-conditioned.

### 7.7 Data provenance & limitations

- **All 30 assets are synthetic**, generated by the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`;
  values, peril scores and insured flags are illustrative, not real portfolio holdings.
- AAL/PML "base rates" (0.1% / 8% of value) are arbitrary demo scalings, not derived from any named
  catastrophe model (RMS/AIR/Verisk) or vulnerability curve, despite the guide's IPCC hazard-damage
  claim.
- No hazard-specific damage functions: all 6 perils feed a single averaged `compositeHazard` before
  loss is computed, so a portfolio dominated by, say, flood risk is treated identically to one
  dominated by wildfire risk at the same composite score.
- Regulatory capital bases (Tier 1, RWA) are flat 12%/85%-of-exposure proxies, not real prudential
  figures — the breach flags are illustrative only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support capital-adequacy and insurance-adequacy decisions for a real-estate/infrastructure/energy
portfolio exposed to acute physical perils, benchmarked against catastrophe-model-grade loss
estimation (RMS/AIR/Verisk methodology) rather than a flat composite-score scaling.

### 8.2 Conceptual approach
Adopt an **event-set / exceedance-probability (EP) curve** approach per peril per asset — the
industry-standard architecture behind RMS RiskLink and AIR Touchstone, and consistent with
Swiss Re's sigma catastrophe-loss reporting. AAL = the area under the EP curve (expected value of
the loss distribution); PML(RP) = the loss at the RP-year return period on that curve. This
mirrors what `physical_risk_pricing_engine.py` already does elsewhere in the platform (see the
sibling `physical-risk-pricing` deep dive) — this module should reuse that engine's
`_expected_annual_loss` trapezoidal-integration function instead of a flat scalar formula.

### 8.3 Mathematical specification

```
AAL_peril,asset = Σ_i 0.5×(L(rp_i)+L(rp_i+1))×|P(rp_i)-P(rp_i+1)|      (trapezoidal EP integration)
L(rp) = damage_pct(peril, asset_class, rp) × vulnerability(peril, asset_class) × amplifier(scenario, horizon)
PML(rp*) = max_peril [ damage_pct(peril, asset_class, rp*) × vulnerability × amplifier ] × AssetValue
Portfolio_AAL = Σ_assets AAL_peril,asset  (perfect correlation assumption at portfolio level, OR:)
Portfolio_AAL_corr = √(AAL_vector ᵀ · Corr_matrix · AAL_vector)   (correlation-adjusted)
```

| Parameter | Calibration source |
|---|---|
| `damage_pct(peril, class, rp)` | RMS/AIR/Verisk public return-period loss curves (already tabulated in `physical_risk_pricing_engine.RETURN_PERIOD_LOSS_TABLES`) |
| `vulnerability(peril, class)` | Depth-damage / wind-damage vulnerability coefficients (already in `VULNERABILITY_COEFFICIENTS`) |
| `amplifier(scenario, horizon)` | NGFS Physical Damage Amplifiers (already in `NGFS_PHYSICAL_AMPLIFIERS`) |
| `Corr_matrix` | Empirical peril co-occurrence from EM-DAT compound-event frequency, or IPCC AR6 WGI Ch.11 qualitative ranking converted to a calibrated matrix |

### 8.4 Data requirements
Asset geocoordinates + asset class (existing `PORTFOLIO` fields cover class/region); peril hazard
maps (already fetchable via `physical_risk_pricing_engine` reference endpoints); insurance
protection-gap ratios by country/peril (`INSURANCE_PROTECTION_GAPS`, already in the platform).
Missing: real portfolio holdings feed (currently synthetic `PORTFOLIO` array).

### 8.5 Validation & benchmarking plan
Backtest AAL against realised NatCat losses (Munich Re NatCatSERVICE, Swiss Re sigma) for the same
country/asset-class/peril combination over a 10-year window; sensitivity-test PML(100yr) against
±20% vulnerability-coefficient perturbation; reconcile against RMS/AIR benchmark loss ratios where
licensed data is available.

### 8.6 Limitations & model risk
EP-curve tables are static illustrative bands, not asset-specific engineering assessments;
correlation matrix requires empirical calibration before use in regulatory capital add-on
calculations; scenario amplifiers are point-in-time NGFS Phase IV values that should be refreshed
each NGFS phase release.

## Framework alignment

**TCFD Physical Risk Guidance** — the AAL/PML/insurance-gap triad is the right shape of TCFD
physical-risk disclosure, even though the underlying arithmetic is a simplified proxy. **ECB CST /
BoE CBES / APRA CPG 229** — named correctly as real supervisory stress-test frameworks; the
capital-ratio checks are illustrative proxies, not the regulators' actual published methodologies.
**IPCC AR6 WGI Ch.11** — cited for compound-event framing of the peril correlation matrix, which is
descriptive context rather than an implemented compound-hazard model.

## 9 · Future Evolution

### 9.1 Evolution A — Real damage functions and asset-level hazard (analytics ladder: rung 1 → 4)

**What.** §7's mismatch flag: the guide describes an IPCC hazard-damage methodology (`PhysicalLoss = AssetValue × HazardIntensity × VulnerabilityFactor × ExposureFraction`), a WBGT heat indicator, a hazard-overlay Asset Map, and Adaptation Options — none exist. The page is a portfolio loss aggregator over 30 synthetic assets: composite hazard = plain mean of 6 seeded peril scores, `aal = value × 0.001 × (composite/50) × (0.8+sr×0.4)` and `pml = value × 0.08 × …` with noise bands, scaled by a flat scenario multiplier. The genuinely useful parts are the static peril-correlation matrix, insurance-gap calculator, and four real regulatory capital checks (ECB CST, BoE CBES, APRA CPG 229, ECB DFAST). Evolution A replaces the synthetic loss scaling with real damage functions.

**How.** (1) Wire assets to the Physical Risk Digital Twin's `ref_*_zones` grids (flood/wildfire/cyclone/heat/SLR from real USGS/IBTrACS/GWIS/OpenFEMA sources) for per-coordinate hazard intensity, replacing the seeded peril scores. (2) Implement the documented damage function: apply RMS/AIR-style vulnerability curves (hazard intensity → damage fraction by asset class) to compute AAL as the integral over the hazard distribution and PML at return periods — the sibling `physical-risk-pricing` and `natcat-loss-engine` modules share this exact need, so use one damage-function library. (3) Replace the flat scenario multiplier with per-peril AR6 hazard-frequency reshaping (chronic hazards like heat/SLR grow differently from acute). Rung-4: the loss distribution becomes a real convolution of hazard probability and damage function per §5.

**Prerequisites.** Shared damage-function library (build once across the physical-risk family); the flood grid is thin (48 rows) — caveat flood coverage; keep the real regulatory-capital checks. Remove `sr()` noise bands. **Acceptance:** AAL/PML derive from real hazard grids and damage curves, not seeded scaling; two assets at different coordinates produce different losses; scenario stress reshapes per-peril, not uniformly.

### 9.2 Evolution B — Physical-risk disclosure copilot (LLM tier 2)

**What.** A copilot for the TCFD/ISSB/CSRD physical-risk workflows §1 targets: "what's my portfolio AAL and PML under SSP5-8.5?", "which assets breach the ECB CST capital threshold?", "what's my insurance gap?", "draft the TCFD physical-risk disclosure" — executed against the (Evolution-A) loss engine and the real regulatory-capital checks, decomposing portfolio loss by asset and peril.

**How.** Tool calls to endpoints wrapping the AAL/PML computation, insurance-gap calculator, and the four regulatory-capital checks; system prompt from this Atlas page's §5 damage-function formula and the IPCC AR6 / TCFD / Munich Re references named in §5. The regulatory-check answers (ECB CST, BoE CBES, APRA CPG 229) are real tool calls; the disclosure draft templates the TCFD physical-risk section with every figure sourced. Fabrication validator matches all loss/capital figures to responses; the copilot must convey model uncertainty (damage functions are approximate) and flag thin-coverage perils (flood).

**Prerequisites (hard).** Evolution A — a copilot reporting AAL/PML from the current seeded scaling would present fictional losses as TCFD disclosure figures. **Acceptance:** every loss/capital figure traces to a tool call over real hazard data; regulatory-check verdicts come from the real checks; the disclosure draft flags coverage caveats.