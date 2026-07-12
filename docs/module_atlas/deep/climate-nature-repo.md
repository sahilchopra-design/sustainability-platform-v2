## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *spatial data
> repository*: an Integrated Risk Index `IRI = α×ClimateRisk + β×NatureRisk`, harmonisation
> of 60+ datasets onto a `0.1° × 0.1°` grid, asset linkage by lat/long, and API endpoints
> for downstream modules. **None of that exists in the code.** There is no `IRI` formula, no
> geospatial grid, no lat/long linkage, and no API (`engines: []`, `route_files: []`). What
> the page actually implements is a **commodity life-cycle-assessment (LCA) explorer**: 25
> commodities × 6 supply-chain stages × 8 nature-impact categories of seeded intensity data,
> a hard-coded planetary-boundaries dashboard, a WRI-Aqueduct-styled water-stress table, a
> deforestation-country table, a toy GHG-regression "ML predictor", and a portfolio-footprint
> cross-reference. The sections below document the code as it behaves.

### 7.1 What the module computes

Per commodity `ci`, `genImpacts(ci)` builds a six-stage impact vector (Extraction → End of Life),
each stage carrying eight impacts. The core generator is:

```js
base = ci*31 + 7;  sb = base + si*8;
extractionMult = [2.5, 1.8, 1.2, 0.3, 0.1, 0.4][si];   // stage weight
ghg           = round(seed(sb)   * 15000 * extractionMult + 500);
water         = round(seed(sb+1) * 500000* extractionMult + 5000);
land          =      (seed(sb+2) * 0.5   * extractionMult).toFixed(3);
biodiversity  =      (seed(sb+3) * 0.4   * extractionMult).toFixed(3);
deforestation =      (seed(sb+4) * 0.15  * extractionMult).toFixed(4);
pollution     = round(seed(sb+5) * 200   * extractionMult + 10);
waste         = round(seed(sb+6) * 100   * extractionMult + 5);
ocean         = round(seed(sb+7) * 30    * extractionMult + 2);
```

Commodity totals are `Σ` over the six stages (`totalGHG`, `totalWater`, …). Two derived
circularity scalars are drawn directly: `recyclingRate = round(seed(ci*19+3)*60+10)` (10–70%)
and `circularScore = round(seed(ci*19+4)*50+20)` (20–70).

### 7.2 Parameterisation & provenance

| Constant | Value | Provenance |
|---|---|---|
| Stage multipliers | `[2.5, 1.8, 1.2, 0.3, 0.1, 0.4]` | Hard-coded — front-loads impact to Extraction/Processing (plausible LCA shape, not sourced) |
| GHG scale | `seed×15000×mult + 500` kg CO₂e/t | Synthetic demo range |
| Water scale | `seed×500000×mult + 5000` L/t | Synthetic demo range |
| Planetary boundaries | 12 rows (`safe`, `current`) | Real Stockholm Resilience Centre 2023 values (e.g. CO₂ 350 safe / 421 current ppm; BII 90/75; N-fixation 62/150 Tg/yr) |
| Water-stress regions | 30 rows (`wriScore`, `water_per_t`) | WRI-Aqueduct-styled; region/commodity pairings realistic (Atacama Li 2.0 ML/t, Salar de Uyuni 98% stress) but scores are authored, not pulled |
| Deforestation countries | 11 rows | Realistic magnitudes (Brazil 1,550 kha/yr loss, 820 MtCO₂; GFW-2024 alert counts) — authored constants |
| ML coefficients | `0.35 / 0.25 / 0.15 / 0.15 / 0.10` | Hard-coded ensemble weights (see §7.4); no fitted model |

The `sr`/`seed` PRNG is `seed(s) = frac(sin(s+1) × 10⁴)` — deterministic, not stochastic.

### 7.3 Calculation walkthrough

1. **Selector** picks a commodity `selCommodity`; `cd = ALL_COMMODITY_DATA[selCommodity]`.
2. **KPI band** shows `cd.totalGHG`, `totalWater`, `totalLand`, `totalBio`, `totalDefor`,
   `totalPollution`, `totalWaste`, `circularScore`, plus a repository-wide
   `boundariesExceeded / 12` count (`status === 'beyond'`).
3. **Radar** normalises each impact against the cross-commodity max:
   `value = round(total_impact / maxVal × 100)`, so the shape is *relative* to the worst commodity.
4. **Biodiversity flow** area chart accumulates stage MSA loss: `cumulative[i] = cumulative[i-1] + stage.biodiversity`.
5. **Net climate impact** applies an end-of-life recycling credit:
   `eolCredit = round(stage[5].ghg × recyclingRate/100 × −1)`; `netGHG = totalGHG + eolCredit`.
6. **Portfolio footprint** maps each holding's GICS sector to a commodity basket
   (`sectorCommodityMap`), averages those commodities' `totalGHG`, and scales by holding weight:
   `ghgFootprint = round(avgGHG × weight/100)`.

### 7.4 Worked example — the "ML predictor"

`mlPredictGHG` is deterministic linear arithmetic, not a trained model. For the default sliders
(extraction 60, processing 50, recycling 30, transport 5000 km):

| Term | Formula | Value |
|---|---|---|
| learner1 | `60×180 + 2000` | 12,800 |
| residual1 | `50×(−50) + 1500` | −1,000 |
| residual2 | `30×(−120) + 800` | −2,800 |
| residual3 | `5000×2.5 + 200` | 12,700 |
| residual4 | `(60×50)×0.8 − 500` | 1,900 |
| **prediction** | `0.35·12800 + 0.25·(−1000) + 0.15·(−2800) + 0.15·12700 + 0.10·1900` | 4,480 − 250 − 420 + 1,905 + 190 = **5,905** |

Clamped to `[500, 60000]` → **5,905 kg CO₂e/t**. The "5 learners + residuals" framing is
cosmetic: it is a fixed weighted sum of the four inputs (recycling reduces, transport increases),
with no learned parameters, no training data, and no error term.

### 7.5 Companion analytics on the page

- **BII table** — `biiLoss = biiPreProduction − biiPostProduction` per commodity, plus seeded
  IUCN-red-list and protected-area-overlap fields.
- **Scope 3 categories** — six GHG-Protocol categories (Cat 1, 4, 5, 10, 11, 12) as seeded
  percentage splits across the first 15 commodities.
- **Planetary-boundary ratio** — `ratio = current / safe`; drives the "beyond boundary" flag.

### 7.6 Data provenance & limitations

- **All life-cycle intensities are synthetic**, generated by `seed(s)=frac(sin(s+1)×10⁴)`.
  Stable across renders, but no commodity's GHG/water/land figure is a real LCA measurement.
- The **planetary-boundary, water-stress, and deforestation tables carry realistic
  authored constants** — they read correctly against Stockholm Resilience Centre / WRI Aqueduct
  / Global Forest Watch magnitudes, but are not live-pulled and are not dated.
- The **ML predictor has no model** — fixed coefficients, no fit, no uncertainty.
- No spatial resolution, no asset geolocation, no `IRI`, no TNFD LEAP scoring engine — the guide's
  headline methodology is absent.

**Framework alignment:** *TNFD LEAP* (Locate-Evaluate-Assess-Prepare) — the page addresses the
Evaluate/Assess layers descriptively (impact/dependency by commodity) but implements no LEAP
scoring; *Planetary Boundaries* (Stockholm Resilience Centre) — nine-boundary framework whose
"safe operating space" thresholds are reproduced faithfully as static reference data;
*WRI Aqueduct 4.0* — baseline water-stress categories mirrored in the regions table;
*GHG Protocol / ISO 14064-1* — Scope 3 category taxonomy used for the emissions split;
*IPBES* — cited as the biodiversity conceptual basis (MSA loss units) but not computed.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays commodity-level
nature-impact intensities and a portfolio footprint that steer capital-allocation and
TNFD-disclosure decisions, yet every intensity is `sr()`-seeded and the "ML predictor" has no
fitted model. A production build needs a real LCA + nature-risk engine.

**8.1 Purpose & scope.** Produce defensible cradle-to-grave environmental intensities (GHG,
water, land, biodiversity/MSA, deforestation) per commodity and per supply-chain tier, and roll
them up to a portfolio nature-impact and nature-dependency profile for TNFD reporting and
transition-risk screening across the equity/credit book.

**8.2 Conceptual approach.** Two coupled models. (i) **Attributional LCA** on a
process-inventory basis (ISO 14040/44), mirroring **ecoinvent** unit-process datasets and the
**WRI/WBCSD GHG Protocol Scope 3** category structure. (ii) **Nature dependency & impact
scoring** using **ENCORE** (Natural Capital Finance Alliance) production-process → ecosystem-service
dependency ratings, combined with **GLOBIO/MSA** biodiversity-intactness modelling as used in the
**PBAF** (Partnership for Biodiversity Accounting Financials) standard. Portfolio roll-up follows
**PCAF**-style attribution (financed impact = exposure ÷ enterprise value × asset impact).

**8.3 Mathematical specification.**
```
Stage impact:   I_{c,s,k} = A_{c,s} · EF_{s,k}                       (activity × emission/impact factor)
Commodity total: I_{c,k}  = Σ_s I_{c,s,k}
MSA loss:       ΔMSA_c    = Σ_lu area_{c,lu} · (1 − MSA_lu)          (GLOBIO land-use coefficients)
Water risk:     WR_c      = WF_c · AqueductStress(region_c)          (m³/t × [0..5] scarcity weight)
Dependency:     Dep_{c,e} = ENCORE_rating(process_c, service_e) ∈ {VL..VH}
Portfolio:      NF_{p,k}  = Σ_h (exposure_h / EVIC_h) · I_{sector(h),k}   (PCAF attribution)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Emission/impact factors | `EF_{s,k}` | ecoinvent v3.10; EPA/IPCC AR6 EFs; Poore & Nemecek (2018) for agri-commodities |
| Land-use MSA coefficients | `MSA_lu` | GLOBIO 3.5 / PBL Netherlands |
| Water scarcity weights | `AqueductStress` | WRI Aqueduct 4.0 baseline water stress (0–5) |
| Dependency ratings | `Dep` | ENCORE (NCFA) process-service matrix |
| Attribution factor | `exposure/EVIC` | PCAF Global Standard Part A |
| Deforestation risk | `rate_pct` | Global Forest Watch / Hansen-UMD annual loss |

**8.4 Data requirements.** Per commodity: production geography, extraction/processing route,
tonnage; per holding: ISIN, GICS sector, exposure, EVIC/enterprise value (already in
`GLOBAL_COMPANY_MASTER` + `ra_portfolio_v1`). External: ecoinvent licence, WRI Aqueduct API
(free), ENCORE (free), GFW API (free), PBL GLOBIO coefficients. The platform already holds the
planetary-boundary and Aqueduct reference tables and the portfolio reader.

**8.5 Validation & benchmarking.** Reconcile commodity GHG intensities against published LCAs
(Poore & Nemecek for beef/soy/palm; IEA critical-minerals LCA for Li/Co/Ni). Benchmark portfolio
nature-footprint magnitude against **MSCI Nature & Biodiversity** and **Iceberg Data Lab** BIA
outputs. Sensitivity test on EF uncertainty (ecoinvent lognormal σ) and on land-use allocation
choices. Back-cast deforestation exposure against GFW alert history.

**8.6 Limitations & model risk.** LCA factor uncertainty is large (±50% common for land-use
change); ENCORE ratings are ordinal, not cardinal; MSA aggregation loses taxon-specific signal;
commodity→sector mapping is coarse (the current `sectorCommodityMap` is one-to-many and averaged).
Conservative fallback: report ranges not point estimates, and flag any commodity lacking a
matched ecoinvent process rather than seeding a value.
