# Renewable Energy LCA and EPD Analytics
**Module ID:** `renewable-lca-epd` · **Route:** `/renewable-lca-epd` · **Tier:** B (frontend-computed) · **EP code:** EP-CrossSprint · **Sprint:** Cross-Sprint

## 1 · Overview
Lifecycle assessment and Environmental Product Declaration analytics for renewable energy technologies covering carbon footprint by technology, ISO 14040/44 compliance, carbon payback period and EPD database integration.

> **Business value:** Renewable energy lifecycle carbon intensities are 10-100× lower than fossil fuels: solar PV 20-50 gCO2e/kWh, wind 7-15, nuclear 4-12 versus gas 400-490 and coal 800-1050; carbon payback periods of 0.5-4 years confirm strong climate benefit over 25-30 year project lifetimes per NREL and JRC harmonised LCA data.

**How an analyst works this module:**
- Define system boundary per ISO 14040/44: cradle-to-gate, cradle-to-grave or cradle-to-cradle
- Calculate lifecycle GHG intensity for selected technology using NREL or JRC harmonised LCA data
- Produce EPD-compliant output under relevant PCR (Product Category Rules) for energy products
- Calculate carbon payback period against regional grid emission intensity displaced

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DEFAULTS`, `DEPLOY_COUNTRIES`, `EOL_MULT`, `TRANSPORT_MODES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `bomRows` | `useMemo(() => s.bom.map(b => ({ ...b, ef: EF_LIB[b.material] \|\| 0, kgCO2: (EF_LIB[b.material] \|\| 0) * b.kgPerKw })), [s.bom]);` |
| `bomKgCO2` | `bomRows.reduce((x, r) => x + r.kgCO2, 0);` |
| `mfgKgCO2` | `s.mfgElec * s.gridEF;` |
| `totalBomKg` | `bomRows.reduce((x, r) => x + r.kgPerKw, 0);` |
| `transKgCO2` | `(totalBomKg / 1000) * transDist * transEf;` |
| `cradleToGate` | `bomKgCO2 + mfgKgCO2 + transKgCO2;` |
| `moduleKgCO2PerKw` | `cradleToGate * eolMult;` |
| `assetRows` | `useMemo(() => s.assets.map(a => {` |
| `lifetimeKwh` | `a.mw * 1000 * a.yieldKwhPerKw * s.lifetimeYears * (1 - a.degPct / 100 * s.lifetimeYears / 2);` |
| `totalKgCO2` | `moduleKgCO2PerKw * a.mw * 1000;` |
| `gco2PerKwh` | `lifetimeKwh > 0 ? (totalKgCO2 * 1000) / lifetimeKwh : 0;` |
| `embodiedKwh` | `s.mfgElec * a.mw * 1000;` |
| `annualKwh` | `a.mw * 1000 * a.yieldKwhPerKw;` |
| `epbtYrs` | `annualKwh > 0 ? embodiedKwh / annualKwh : 0;` |
| `totalMwPortfolio` | `Math.max(1, assetRows.reduce((x, r) => x + r.mw, 0));` |
| `wtdGco2` | `assetRows.reduce((x, r) => x + r.gco2PerKwh * r.mw, 0) / totalMwPortfolio;` |
| `wtdEpbt` | `assetRows.reduce((x, r) => x + r.epbtYrs * r.mw, 0) / totalMwPortfolio;` |
| `bestPeer` | `Math.min(...s.peers.map(p => p.gco2PerKwh));` |
| `vsBest` | `wtdGco2 - bestPeer;` |
| `ratio` | `wtdGco2 / gwpRef;` |
| `rowMci` | `Math.max(0, 1 - LFI * F);` |
| `bom` | `bomKgCO2 * bomMult;` |
| `mfg` | `mfgKgCO2 * efMult;` |
| `trans` | `transKgCO2 * bomMult;` |
| `modKg` | `(bom + mfg + trans) * eolMult;` |
| `totalKg` | `modKg * totalMwPortfolio * 1000;` |
| `peerRank` | ``beats ${peerPct}/${LCA_PEER_BENCHMARKS.length} benchmarks`;` |
| `updBom` | `(i, k, v) => sc.update({ bom: s.bom.map((b, j) => j === i ? { ...b, [k]: v } : b) });` |
| `updAsset` | `(i, k, v) => sc.update({ assets: s.assets.map((a, j) => j === i ? { ...a, [k]: v } : a) });` |
| `updPeer` | `(i, k, v) => sc.update({ peers: s.peers.map((p, j) => j === i ? { ...p, [k]: v } : p) });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEPLOY_COUNTRIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Solar PV Carbon Intensity | `LCA boundary: Si purification through decommissioning` | NREL Harmonised LCA 2021 | Variation driven by grid mix for manufacturing (c-Si monocrystalline lower than polycrystalline); improving with clean manufacturing energy. |
| Wind Carbon Intensity | `LCA: steel + concrete + blades + installation + O&M` | JRC 2021 | Onshore wind 7-11 gCO2e/kWh; offshore 8-15 gCO2e/kWh due to marine installation and cable; tower material dominates lifecycle impact. |
| Carbon Payback Period | `CPP = Manufacturing_CO2 / Annual_CO2_displacement` | Ecoinvent 3.9 / NREL 2022 | Solar PV CPP 1-4yr depending on irradiation and grid mix displaced; wind CPP 0.5-1yr; nuclear CPP 1-2yr including fuel cycle. |
- **Ecoinvent database** → → LCA model → **Background process emissions by region**
- **NREL LCA Harmonisation** → → technology benchmarks → **gCO2e/kWh by technology and year**

## 5 · Intermediate Transformation Logic
**Methodology:** Lifecycle Carbon Intensity
**Headline formula:** `LCA_CI(gCO2e/kWh) = Σ(lifecycle_stage_emissions) / Total_lifetime_generation`

Carbon footprint: solar PV 20-50 gCO2e/kWh, wind 7-15, nuclear 4-12, gas 400-490, coal 800-1050; system boundary must include manufacturing, O&M, decommissioning and fuel cycle.

**Standards:** ['ISO 14040:2006 LCA Principles', 'ISO 14044:2006 LCA Requirements', 'JRC Science for Policy: LCA of Electricity Generation']
**Reference documents:** ISO 14040:2006 Life Cycle Assessment — Principles and Framework; JRC Science for Policy Report: LCA of Electricity Generation Technologies 2021; NREL Harmonised Life Cycle Assessment for Utility-Scale Electricity Generation 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the most scientifically well-grounded modules in this batch: a genuine
**bill-of-materials (BOM) cradle-to-gate LCA**, faithfully implementing the guide's own formula
`LCA_CI = Σ(lifecycle_stage_emissions) / Total_lifetime_generation`:

```js
bomKgCO2      = Σ(materialEF[m] × kgPerKw[m])                       // BOM cradle-to-gate, per material EF library
mfgKgCO2      = mfgElec × gridEF                                    // manufacturing electricity × country grid EF
transKgCO2    = (totalBomKg/1000) × transDist × transEf              // transport emissions
cradleToGate  = bomKgCO2 + mfgKgCO2 + transKgCO2
moduleKgCO2PerKw = cradleToGate × eolMult                            // end-of-life multiplier
lifetimeKwh   = mw × 1000 × yieldKwhPerKw × lifetimeYears × (1 − degPct/100 × lifetimeYears/2)
gCO2PerKwh    = (moduleKgCO2PerKw × mw × 1000 × 1000) / lifetimeKwh   // final LCA carbon intensity
epbtYrs       = embodiedKwh / annualKwh                              // Energy Payback Time
```

### 7.2 Parameterisation — real, well-sourced constants (`AdvisoryReference.js`)

| Constant set | Sample values | Provenance |
|---|---|---|
| `IEA_GRID_EF` (kgCO2/kWh by country) | India 0.716, USA 0.369, France 0.052, Norway 0.028, Poland 0.659, Global 0.459 | Genuinely calibrated to real IEA/Ember grid-intensity figures — France's low value (nuclear-dominated) and Norway's near-zero value (hydro-dominated) are both correct, as is Poland's high value (coal-dominated) |
| `LCA_EF` (kgCO2e per kg of material) | Silicon (mono) 25.5, Silver paste **172.0**, Aluminium frame 8.24 vs Aluminium (recycled) 2.31, Copper wiring 4.60, NMC cathode 22.0 | Directionally and magnitude-correct vs published ecoinvent-style material EFs — silver's very high EF (energy-intensive refining) and recycled-vs-virgin aluminium's ~3.6× reduction are both scientifically accurate patterns |
| `PV_ARCHETYPES` (kg material per kW installed) | Referenced to "ITRPV 2024" (International Technology Roadmap for Photovoltaic) | Real industry publication citation |
| `LCA_PEER_BENCHMARKS` (gCO2/kWh) | IEA PVPS global avg 43, EU best-in-class (EPD) 28, China avg 58, India avg 52, US-made (IRA) 35 | Consistent with the guide's cited NREL Harmonised LCA range (20–50 gCO2e/kWh for solar PV) |
| `LCA_IMPACT_CATEGORIES` | GWP (43 gCO2e/kWh ref PV), Acidification, Eutrophication, Ozone Depletion, Photochemical Oxidation, Abiotic Depletion, Water Depletion — full multi-criteria LCIA set | Standard ReCiPe/CML-style impact category taxonomy, correctly structured with PV/Wind/Battery reference values per category |
| `CIRCULARITY` (recycled content %, EoL recovery %) | Aluminium frame 60% recycled content / 95% EoL recovery; EVA backsheet 0% / 20%; Silicon (mono) 5% / 65% | Real circularity-relevant material distinctions — glass and aluminium correctly modelled as highly recyclable, polymer encapsulants correctly modelled as poorly recyclable |

### 7.3 Calculation walkthrough

1. **BOM builder**: user (or scenario default) specifies a bill of materials (kg per kW installed
   per material); each row's `kgCO2 = EF_LIB[material] × kgPerKw`, summed to `bomKgCO2`.
2. **Manufacturing energy**: `mfgKgCO2 = mfgElec(kWh/kW) × gridEF(country)` — correctly ties
   manufacturing carbon footprint to the *manufacturing location's* grid mix, a key real driver of
   why "mono-Si manufactured in China" vs "manufactured in the EU" have materially different LCA
   footprints in the real literature.
3. **Transport**: `transKgCO2 = (totalBomKg/1000) × distance(km) × transportEF(kgCO2/tonne-km)`.
4. **End-of-life**: `moduleKgCO2PerKw = cradleToGate × eolMult` — a single multiplier applied to
   the whole cradle-to-gate footprint (a simplification vs a full cradle-to-grave stage-by-stage
   accounting, but directionally sound).
5. **Lifetime generation**: `lifetimeKwh` correctly discounts for degradation using the average of
   linear degradation over the asset life (`1 − degPct/100 × lifetimeYears/2` — the `/2` correctly
   representing the *average* degradation impact over a linearly-declining output profile, not the
   end-of-life degradation).
6. **Energy Payback Time**: `epbtYrs = embodiedKwh / annualKwh` — this **is** the standard,
   correctly-implemented EPBT metric used throughout the real PV LCA literature (IEA PVPS Task 12).
7. **Portfolio aggregation**: `wtdGco2`/`wtdEpbt` — MW-weighted averages across the asset
   portfolio, correctly guarded (`Math.max(1, totalMwPortfolio)`).
8. **Peer benchmarking**: `vsBest = wtdGco2 − min(peers.gco2PerKwh)`; `peerPct = count(peers with
   higher gco2PerKwh)` → `"beats N/5 benchmarks"` — a genuine relative-performance ranking.
9. **Material Circularity Indicator** (`rowMci = max(0, 1 − LFI×F)`): a **simplified** version of
   the Ellen MacArthur Foundation's real MCI formula (which is `MCI = 1 − LFI×F(X)`, where `LFI`
   is the Linear Flow Index derived from virgin material input `V` and unrecoverable waste `W`,
   and `F(X)` is a utility-adjustment function of product lifetime/intensity of use). The code uses
   `F=0.9` as a **flat constant** rather than computing the real utility function `F(X)`.

### 7.4 Worked example

Solar PV asset: `mw=100`, `yieldKwhPerKw=1,600` (kWh/kW/yr), `lifetimeYears=25`, `degPct=0.5%/yr`,
`mfgElec=2,800 kWh/kW` (China manufacturing), `gridEF(China)=0.581 kgCO2/kWh`:

| Step | Formula | Result |
|---|---|---|
| `mfgKgCO2` (per kW) | `2,800 × 0.581` | **1,626.8 kgCO2/kW** |
| `lifetimeKwh` | `100×1000×1600×25×(1−0.5/100×25/2)` | `4,000,000,000×(1−0.0625)=` **3.75×10⁹ kWh** |
| `annualKwh` | `100×1000×1600` | **160,000,000 kWh/yr** |
| `embodiedKwh` | `2,800×100×1000` | **280,000,000 kWh** |
| `epbtYrs` | `280M/160M` | **1.75 years** — within the guide's cited "solar PV CPP 1-4yr" range |
| Illustrative `gCO2PerKwh` (mfg component only, ignoring BOM/transport/EoL) | `(1,626.8×100×1000×1000)/3.75×10⁹` | **≈43.4 gCO2/kWh** — closely matches `LCA_PEER_BENCHMARKS`'s "IEA PVPS global avg 43" |

### 7.5 Impact category & circularity rubric

7 LCIA categories (GWP, AP, EP, ODP, POCP, ADP, WD) each with PV/Wind/Battery reference values;
circularity tracked per material via recycled-content % and end-of-life recovery %.

### 7.6 Companion analytics

BOM editor with live EF lookup, asset portfolio (multiple technologies/countries), multi-impact
radar (7 LCIA categories vs PV/Wind/Battery references), peer benchmark comparison, circularity/
MCI scoring, Monte Carlo and tornado sensitivity (via shared `AdvisoryToolkit`), EPD-style export.

### 7.7 Data provenance & limitations

- **Emission factors, grid intensities, and peer benchmarks are genuinely well-calibrated** against
  real published sources (IEA grid data, ecoinvent-style material EFs, NREL/JRC harmonised LCA
  ranges) — this module should be treated as a credible LCA screening tool, not a fabricated demo,
  though it has not been independently cross-checked against a licensed ecoinvent database line by
  line and should not substitute for a full third-party-verified LCA/EPD for regulatory use.
- End-of-life is modelled as a single multiplier (`eolMult`) rather than a full stage-by-stage
  cradle-to-grave accounting (recycling credits, landfill emissions, dismantling energy) — a
  simplification vs ISO 14044's full system-boundary requirement.
- The Material Circularity Indicator uses a flat `F=0.9` utility factor rather than the Ellen
  MacArthur Foundation's actual utility function of product lifetime and intensity of use — the
  MCI values shown should be read as illustrative circularity signals, not certified MCI scores.
- No uncertainty/Monte Carlo propagation is applied to the emission factors themselves (though the
  shared toolkit's Monte Carlo/tornado components are available elsewhere in the page for
  scenario-level sensitivity).

**Framework alignment:** ISO 14040:2006 / ISO 14044:2006 — cradle-to-gate system boundary,
functional unit (gCO2e/kWh), and BOM-based inventory approach are all correctly structured per
LCA principles, though full cradle-to-grave and impact-assessment normalisation (ISO 14044 §4.4)
are simplified · ISO 14025 (EPD) — export function references EPD-style output, though full
Product Category Rules (PCR) compliance would require additional declared-unit and system-boundary
documentation not modelled here · NREL Harmonised LCA / JRC LCA of Electricity Generation — the
module's peer benchmarks and technology carbon-intensity ranges are consistent with both sources'
published figures.

## 9 · Future Evolution

### 9.1 Evolution A — Stage-resolved end-of-life and a server-side EPD calculation record (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the most scientifically grounded modules in its batch: a genuine BOM cradle-to-gate LCA (material EFs × kg/kW, manufacturing electricity × country grid EF, transport, EPBT) with well-calibrated factors against IEA/NREL/JRC ranges — a credible screening tool. §7.7's honest ceilings: end-of-life is a single `eolMult` scalar rather than ISO 14044 stage accounting (no recycling credits, dismantling energy, landfill terms), the Material Circularity Indicator uses a flat F=0.9 instead of the EMF utility function, and everything runs client-side, so results aren't pinnable or exportable as an auditable calculation record. Evolution A resolves EoL into stages, fixes the MCI, and creates the server-side record an EPD workflow needs.

**How.** (1) Replace `eolMult` with explicit C1–C4 + Module D terms per technology (dismantling energy, transport, recycling credits with the correct negative sign — the pattern `product-anatomy`'s teardowns and `real-estate-carbon-analytics`' EN 15978 staging already use), each factor cited. (2) MCI per the actual EMF formula, `F = f(lifetime, intensity of use)` from the asset's own lifetime/yield inputs. (3) `POST /api/v1/renewable-lca/assess` porting the calculation chain, storing dated assessment records with full input echo — the "calculation record" third-party EPD verifiers ask for; bench_quant pins a solar reference case against the NREL/JRC harmonised band. (4) Factor library moved to a versioned refdata table so factor updates are diffable.

**Prerequisites.** EoL factor research per technology (public LCA literature; no ecoinvent licence assumed — the §7.7 caveat about line-by-line verification stays honest); factor-version stamps. **Acceptance:** cradle-to-grave = cradle-to-gate + Σ(C-stages) − D-credit, verifiable per stage; the pinned solar case lands within the published harmonised range; two runs with the same inputs and factor version match exactly.

### 9.2 Evolution B — EPD-drafting copilot with ISO-boundary discipline (LLM tier 2)

**What.** EPDs are structured documents built from exactly the numbers this module computes. The copilot drafts them: "produce the climate-change indicator section for this 50MW solar EPD — cradle-to-gate breakdown by material, declared unit, system boundary statement, and the data-quality discussion", pulling every gCO₂e/kWh from the stored assessment record and writing the boundary/assumption prose the ISO 14025 format requires.

**How.** Tier-2 tool calls to `POST /assess` and the factor-library endpoint (so the data-quality section can name factor sources and versions — genuinely required EPD content the module can now supply); document structure follows EN 15804/ISO 14025 section templates in the corpus. Guardrails encoded from §7.7's own language: the output is a *draft supporting a* third-party-verified EPD, never a certified declaration — this disclaimer is structural, not optional; boundary claims (cradle-to-gate vs grave) must match the assessment record's actual stage coverage; MCI values labelled per their formula basis. Comparative assertions between technologies follow ISO 14044's comparability rules or are refused.

**Prerequisites.** Evolution A's assessment records and factor versioning; EPD templates chunked. **Acceptance:** every indicator value in a draft matches the assessment record; the factor-source table in the data-quality section is generated from the version stamps; the non-certification disclaimer is present in every output.