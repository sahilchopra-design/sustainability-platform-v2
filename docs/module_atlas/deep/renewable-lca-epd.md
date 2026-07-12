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
