# Asset Exposure Explorer
**Module ID:** `asset-exposure-explorer` · **Route:** `/asset-exposure-explorer` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BUILDINGS`, `Badge`, `CITY_COST_FACTOR`, `DEMO_EAL_BPS`, `DEMO_PERIL_SHARE`, `GPR_API`, `HORIZONS`, `KpiCard`, `OCCUPANCY_CLASSES`, `OM_API`, `OVERTURE_API`, `PERILS`, `PERIL_COLORS`, `PRP_API`, `SCENARIOS`, `SectionH`, `TABS`, `TIER_COLOR`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 4 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `PRP_API` | ``${API}/api/v1/physical-risk-pricing`;` |
| `OM_API` | ``${API}/api/v1/open-meteo`;` |
| `GPR_API` | ``${API}/api/v1/global-physical-risk`;` |
| `OVERTURE_API` | ``${API}/api/v1/overture-buildings`;` |
| `dLat` | `radiusKm / 111.32;` |
| `dLon` | `radiusKm / (111.32 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));` |
| `withValue` | `(data.buildings \|\| []).map((b) => {` |
| `value` | `Math.round(gfaM2 * OCCUPANCY_CLASSES[queryOccupancy].baseUsdM2 * (CITY_COST_FACTOR[b.city] \|\| 1.0));` |
| `priceResults` | `await Promise.allSettled(withValue.map((b) =>` |
| `eal` | `value * (DEMO_EAL_BPS[queryCountryIso] \|\| 12) / 10000;` |
| `results` | `await Promise.all(BUILDINGS.map(b =>` |
| `rows` | `useMemo(() => BUILDINGS.map(b => {` |
| `cities` | `useMemo(() => ['All', ...Array.from(new Set(BUILDINGS.map(b => b.city)))], []);` |
| `totalValue` | `filteredRows.reduce((a, r) => a + r.value, 0);` |
| `totalEal` | `filteredRows.reduce((a, r) => a + r.eal, 0);` |
| `totalVar` | `filteredRows.reduce((a, r) => a + r.var95, 0);` |
| `totalGap` | `filteredRows.reduce((a, r) => a + r.insGap, 0);` |
| `topExposures` | `useMemo(() => [...filteredRows].sort((a, b) => b.eal - a.eal).slice(0, 10) .map(r => ({ name: r.name.length > 22 ? `${r.name.slice(0, 21)}…` : r.name, eal: Math.round(r.eal), city: r.city })), [filteredRows]);` |
| `perilBreakdown` | `useMemo(() => PERILS.map(p => ({` |
| `scatterData` | `useMemo(() => filteredRows.map(r => ({` |
| `selPerilData` | `useMemo(() => PERILS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUILDINGS`, `HORIZONS`, `PERILS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The explorer prices 26 named, real landmark commercial buildings (One World Trade Center, The
Shard, Marina Bay Financial Centre Tower 3, Roppongi Hills Mori Tower, etc.) individually through
the same live **E104 Physical Risk Pricing Engine** documented in the Climate Underwriting
Workbench (`POST /api/v1/physical-risk-pricing/price`, `services/physical_risk_pricing_engine.py`).
The module's own contribution is two-fold: (1) a **replacement-value proxy** that converts each
building's gross floor area (GFA) into a rebuild-cost asset value the pricing engine can consume,
and (2) portfolio-level aggregation/visualisation (top exposures, peril mix, EAL-by-city,
value-vs-intensity scatter) computed locally from the 26 live engine responses.

### 7.2 Replacement-value proxy (`replacementValueUsd`)

```js
value = gfaM2 × OCCUPANCY_CLASSES[occupancy].baseUsdM2 × (CITY_COST_FACTOR[city] || 1.0)
```

Four occupancy classes carry hand-authored $/m² base rates cited to Turner & Townsend
International Construction Market Survey 2024 (office $3,800/m², retail $2,600/m², mixed-use
$3,400/m²) and the T&T Data Centre Cost Index 2024 (data centre $9,500/m², reflecting shell +
M&E fit-out). Thirteen cities carry relative construction-cost factors from the same survey
family (Mumbai 0.45× the reference up to New York 1.35×). The page is explicit that this proxies
**rebuild cost**, the correct basis for physical-damage modelling, not market/transaction value —
an important and correct methodological distinction, since insurance/CAT pricing should be
anchored to reinstatement cost, not market price.

### 7.3 Per-asset hazard pricing (delegated to E104)

Each building calls `/price` with `asset_class: 'property'`, its ISO-3 country, computed
replacement value, lat/lng, and the page's selected NGFS scenario/horizon. The engine (see the
Climate Underwriting Workbench deep-dive §7.3 for the full formula set) returns composite risk
score, EAL via trapezoidal EP-curve integration, PML(100yr) as the worst single-peril 100yr loss,
Climate VaR 95% as a tier-table percentage of asset value, insurance protection gap, and a
risk-premium spread in bps. The explorer's own code adds **no new hazard physics** — it is purely
a per-asset fan-out of the same engine used elsewhere on the platform, with country-level (not
micro-location) hazard scoring, which the page's own Methodology tab explicitly flags as a known
limitation ("two Miami towers and a Houston tower differ by value and class, not micro-location").

### 7.4 Worked example — One World Trade Center

`gfaM2 = 325,000`, `occupancy = office` ($3,800/m²), `city = New York` (cost factor 1.35):

```
value = 325,000 × 3,800 × 1.35 = $1,667,250,000
```

Calling `price_physical_risk(entity_id='BLDG-7', asset_class='property', country_iso='USA',
asset_value_usd=1,667,250,000, ngfs_scenario='hot_house', time_horizon='2050')` directly (matching
the page's default scenario selector) returns:

| Metric | Value | How it was derived |
|---|---|---|
| Baseline composite score | 0.4414 | Weighted blend of USA's 7 peril baselines (see workbench deep-dive §7.3 weights) |
| Stressed composite score | **0.746** | 0.4414 × average hot_house/2050 acute-peril amplifier |
| Risk tier | **extreme** | 0.746 ≥ 0.72 |
| Expected Annual Loss | **$8,200,037.76** | Trapezoidal EP-curve integration across 5 perils |
| PML(100yr) | **$83,629,260** | = wildfire's 100yr loss: 8.0%×0.60(baseline)×1.90(amp)×0.55(vuln)×$1.6673B — the single largest of the 5 per-peril 100yr losses, confirming the engine picks wildfire (not flood) as USA/office's worst 100yr peril under hot-house/2050 |
| Climate VaR 95% | $416,812,500 | 25.0% of asset value (extreme-tier table percentage) |
| Avg. insured ratio | 0.39 | Mean of USA's 6 peril protection-gap ratios (flood .40, cyclone .62, wildfire .55, earthquake .35, heatwave .12, drought .30) |
| Insurance gap | $5,002,023.03 | EAL × (1 − 0.39) |

All figures above were confirmed by a direct call to the real engine function, not estimated —
the wildfire-dominant PML(100yr) result is a genuine, code-verified consequence of the hot-house/
2050 amplifier set (wildfire ×1.90 is the largest amplifier of the five acute perils) combined
with New York's moderate-to-high (0.60) wildfire baseline in the reference table, not an
artefact specific to this one building.

### 7.5 Portfolio aggregation (local, derived from 26 live responses)

- **Top 10 exposures by EAL** — simple sort/slice of the 26 per-building EAL values.
- **Peril contribution (pie)** — sum of each peril's `pml_100yr_usd` across all 26 buildings,
  from the engine's `acute_peril_breakdown`.
- **EAL intensity by city** — `Σ EAL / Σ replacement value × 10,000` (bps), grouped by city; this
  isolates the *geographic* hazard signal from the *size* signal (a small building in Bangladesh
  can show a higher bps intensity than a large one in a low-hazard city).
- **Value vs. risk-intensity scatter** — bubble chart with value ($M) on X, EAL bps on Y, EAL $ as
  bubble size, to visually separate "large but safe" from "small but exposed" assets.
- **Demo-mode fallback** — if the engine is unreachable, EAL switches to a flat, explicitly-
  labelled illustrative rate per country (`DEMO_EAL_BPS`, e.g. USA 18bps, India 25bps) and a fixed
  peril-share split (`DEMO_PERIL_SHARE`); the page clearly badges this as "○ Demo — not engine
  output," and none of these fallback numbers feed the live-mode calculations.

### 7.6 Data provenance & limitations

- **Buildings:** the page states plainly that the 26 buildings are real, named, verifiable
  landmark commercial buildings with **approximate published** GFA and coordinates — an
  "illustrative real-building sample," not a full-market extract. Production upgrade path is
  named explicitly (Google Open Buildings / Microsoft Building Footprints / Overture Maps, ODbL/
  CC-BY, full-city polygon footprints × estimated storeys).
- **Replacement-value rates:** cited to a real, named external source (Turner & Townsend 2024
  survey series) but the specific $/m² figures and city factors are hand-transcribed midpoints,
  not a live cost-index feed.
- **Hazard pricing:** fully live, calling the same production E104 engine used by the
  Underwriting Workbench — no fabricated numbers in live mode. Hazard resolution is country-level,
  a known and disclosed limitation (no asset-level flood-map or micro-location hazard layer is
  wired in, e.g. FEMA NFHL or JRC flood maps at the specific building coordinates).
- **Demo fallback:** used only when the engine is unreachable, clearly labelled, and structurally
  simplistic (flat bps rate × fixed peril-share split) — never presented as a substitute for the
  live composite calculation.

**Framework alignment:** NGFS CGFI Physical Risk Assessment 2021/2023, Swiss Re sigma 1/2024,
IPCC AR6 WGI Ch.11, INFORM Risk Index 2023, ND-GAIN 2023 (hazard pricing, inherited from E104) ·
Turner & Townsend International Construction Market Survey 2024 / Data Centre Cost Index 2024
(replacement-value proxy).

## 8 · Model Specification

**Status: implemented.** The replacement-value proxy and portfolio aggregation are fully
implemented client-side logic; the hazard-pricing core is the same fully implemented, live
`physical_risk_pricing_engine.py` used elsewhere on the platform (see the Climate Underwriting
Workbench deep-dive §8 for that engine's own specification).

**8.1 Purpose & scope.** Give a portfolio manager or real-assets underwriter an asset-level (not
just country/sector-level) view of physical climate risk across a real-estate/data-centre
portfolio, using a defensible, source-cited rebuild-cost proxy where true insured/appraised
values are unavailable.

**8.2 Conceptual approach.** Convert floor area into rebuild cost using published construction-
cost survey data, then feed that value through the platform's existing NGFS-amplified physical
risk pricing engine per building, and finally aggregate the 26 independent live results into
portfolio-level views (concentration by exposure, by peril, by city, and a size-vs-intensity
scatter) — no new hazard model is introduced at this layer.

**8.3 Mathematical specification.**
```
Replacement value = GFA_m2 × base_rate_usd_per_m2[occupancy_class] × city_cost_factor
EAL, PML100, VaR95, risk_tier, insurance_gap = E104.price_physical_risk(country, asset_class='property',
                                                                         value, ngfs_scenario, horizon)
EAL_bps_by_city = Σ(EAL in city) / Σ(value in city) × 10,000
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base $/m² by occupancy | 4 classes | Turner & Townsend Construction Market Survey 2024 / Data Centre Cost Index 2024 |
| City cost factor | 13 cities | Same T&T survey family, relative index |
| Hazard scoring, amplifiers, vulnerability coefficients | — | Inherited unchanged from E104 (see workbench deep-dive) |

**8.4 Data requirements.** Per building: name, city, country ISO-3, lat/lng, occupancy class, and
GFA (all currently hand-authored in the frontend `BUILDINGS` array). Production requires a real
building-footprint dataset (polygon geometry × estimated storeys → GFA) at whatever scale the
portfolio requires, plus ideally asset-level (not country-level) hazard layers.

**8.5 Validation & benchmarking.** The 26 buildings' GFA figures should be reconciled against
each building's actual published floor-area figures (own developer/press disclosures) for
production use; the replacement-value proxy itself could be benchmarked against actual insured
values or independent quantity-surveyor rebuild estimates where available. No such benchmarking
harness currently exists in-repo.

**8.6 Limitations & model risk.** (1) Country-level (not asset/coordinate-level) hazard
resolution means two buildings in the same city and occupancy class differ only by value, not by
true micro-location flood/wildfire exposure — a real building on a floodplain and one on high
ground score identically today. (2) The $/m² rates and city factors are point-in-time survey
midpoints, not a live cost index — construction-cost inflation will erode accuracy over time
without a refresh. (3) The 26-building sample is illustrative, not a full-market extract;
portfolio-level KPIs should not be read as representative of a real book of business. (4) Demo-
mode EAL rates are flat placeholders with no peril-specific hazard basis and must never be
conflated with the live engine's tail-risk output.

## 9 · Future Evolution

### 9.1 Evolution A — Footprint-scale portfolios with coordinate-level hazard (analytics ladder: rung 2 → 3)

**What.** The explorer is already genuinely live: 26 real landmark buildings priced per-asset through the E104 engine (`POST /api/v1/physical-risk-pricing/price`) with NGFS scenario/horizon selection (rung 2), a source-cited Turner & Townsend replacement-value proxy, and an honestly-badged demo fallback. §8.6 names its two binding limitations: country-level hazard resolution (a floodplain building and a hilltop building in the same city score identically) and a hand-authored 26-building sample. Evolution A scales both, using the API constants the page has already wired (`OVERTURE_API`, `GPR_API`, `OM_API`).

**How.** (1) Swap the static `BUILDINGS` array for the Overture buildings route (`/api/v1/overture-buildings`): polygon footprint × estimated storeys → GFA, feeding the existing `value = GFA × baseUsdM2 × cityFactor` proxy unchanged — the radius query math (`dLat`/`dLon`) is already in the file. (2) Resolve hazard per coordinate via the global-physical-risk digital twin (`GPR_API`, the populated `ref_*_zones` grids) so same-city assets differentiate by micro-location, reporting `resolution_tier` when falling back to country baselines. (3) Calibration (rung 3): reconcile the 26 landmark GFAs against published floor-area disclosures and benchmark proxy values against insured/quantity-surveyor values where obtainable — §8.5 notes no such harness exists; add a bench_quant case pinning one building's full pipeline.

**Prerequisites.** E104's own coordinate-resolution evolution (this module inherits its physics — see physical-risk-pricing §9.1); a $/m² refresh path, since the T&T midpoints are point-in-time and §8.6 flags cost-inflation drift. **Acceptance:** two Overture-sourced buildings in the same city with different coordinates produce different EAL; the bench case pins value → EAL → PML for one landmark; demo-fallback numbers remain excluded from live-mode aggregates.

### 9.2 Evolution B — Portfolio concentration analyst over live repricing (LLM tier 2)

**What.** The explorer's aggregations (top-10 EAL, peril pie from `acute_peril_breakdown`, EAL-bps-by-city, value-vs-intensity scatter) are exactly the objects a real-assets analyst interrogates. Evolution B is a tool-calling analyst that answers "what drives our tail risk — size or location?" from the scatter's underlying rows, and executes portfolio what-ifs — "reprice everything under disorderly 2040", "drop the two Mumbai assets and show the new peril mix" — as batched `POST /price` fan-outs, exactly the `Promise.allSettled` pattern the page already runs, never generating loss numbers itself.

**How.** Tool schemas from the E104 OpenAPI operations plus a thin portfolio-aggregate endpoint (moving the client-side reductions server-side so the LLM gets one consistent tool result instead of re-deriving sums). Grounding corpus: this Atlas record — §7.4's fully code-verified worked example (1WTC: EAL $8.2M, wildfire-dominant PML under hot-house/2050) gives the copilot a canonical explanation template, and §8.6's limitations list supplies mandatory caveats (country-level resolution, illustrative sample, "portfolio KPIs should not be read as representative of a real book"). Demo-mode responses carry their badge into tool output so the copilot can never narrate fallback rates as engine output.

**Prerequisites.** The portfolio-aggregate endpoint (small); no hard blockers — live mode works today. **Acceptance:** every EAL/PML figure in an answer traces to a `/price` response in-conversation; a what-if answer states scenario, horizon, and asset set explicitly; in demo mode the copilot refuses quantitative comparisons and says why.