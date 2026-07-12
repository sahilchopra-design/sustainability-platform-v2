# TNFD Biodiversity Baseline Assessment
**Module ID:** `tnfd-biodiversity-baseline` · **Route:** `/tnfd-biodiversity-baseline` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
TNFD LEAP (Locate, Evaluate, Assess, Prepare) process implementation for biodiversity baseline assessment. Overlays business locations with biodiversity hotspot and KBA databases, evaluates ecosystem service dependencies, assesses impact drivers (land use, pollution, climate, invasive species, overexploitation), and computes TNFD CORE disclosure metrics.

> **Business value:** Used by corporates, financial institutions, and asset managers to implement TNFD recommendations, comply with CSRD ESRS E4, and contribute to Kunming-Montreal Global Biodiversity Framework Target 15.

**How an analyst works this module:**
- Upload operational and supply chain site locations
- Run LEAP spatial analysis against KBA/WDPA/IBAT databases
- Assess ecosystem service dependencies using ENCORE sector mapping
- Generate TNFD CORE metrics and biodiversity risk disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMES`, `DEFAULTS`, `ES_CATS`, `ES_CAT_LABEL`, `GBF_KEY`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BIOMES` | `['Arid / Desert', 'Semi-arid grassland', 'Tropical forest', 'Coastal / Mangrove', 'Temperate forest', 'Wetlands', 'Agricultural mosaic', 'Marine'];` |
| `rows` | `useMemo(() => s.assets.map(a => ({ ...a, priority: priorityOf(a) })), [s.assets]);` |
| `totalArea` | `s.assets.reduce((x, a) => x + a.areaHa, 0);` |
| `leapAvg` | `(s.leap.locate + s.leap.evaluate + s.leap.assess + s.leap.prepare) / 4;` |
| `pillarAvg` | `(s.pillars.governance + s.pillars.strategy + s.pillars.riskMgmt + s.pillars.metrics) / 4;` |
| `msaRows` | `s.assets.map(a => {` |
| `totalMsaHa` | `msaRows.reduce((x, r) => x + r.msaHa, 0);` |
| `waterRows` | `s.assets.map(a => {` |
| `totalBlue` | `waterRows.reduce((x, r) => x + r.blue, 0);` |
| `totalGreen` | `waterRows.reduce((x, r) => x + r.green, 0);` |
| `totalGrey` | `waterRows.reduce((x, r) => x + r.grey, 0);` |
| `mitTotalPct` | `s.mitigation.avoidPct + s.mitigation.minimisePct + s.mitigation.restorePct + s.mitigation.offsetPct;` |
| `mitRows` | `MITIGATION_HIERARCHY.map((m, i) => {` |
| `haAlloc` | `totalMsaHa * (pct / 100);` |
| `cost` | `haAlloc * m.costPerMsaHa;` |
| `totalMitCost` | `mitRows.reduce((x, r) => x + r.cost, 0);` |
| `credibility` | `mitRows.reduce((x, r) => x + (r.credibility * r.pct / 100), 0);` |
| `refinedServices` | `s.services.map(x => ({ ...x, refined: x.revAtRisk * (esMult[x.cat] ?? 1) }));` |
| `totalRaR` | `refinedServices.reduce((x, r) => x + r.refined, 0);` |
| `totalNpv` | `s.opportunities.reduce((x, o) => x + o.npv, 0);` |
| `totalCapex` | `s.opportunities.reduce((x, o) => x + o.capex, 0);` |
| `gross` | `refinedServices.reduce((x, r) => x + r.refined * depScalar, 0);` |
| `updSvc` | `(i, k, v) => sc.update({ services: s.services.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |
| `updOpp` | `(i, k, v) => sc.update({ opportunities: s.opportunities.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMES`, `ES_CATS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KBA Proximity Score | `assets_in_or_adjacent_to_KBA / total_assets × 100` | KBA Partnership database + IUCN WDPA | Higher scores indicate greater biodiversity exposure risk; triggers enhanced disclosure obligations under TNFD and EU CSRD ESRS E4. |
| Ecosystem Service Dependency Score | `weighted avg(ENCORE dependency rating across services)` | ENCORE tool (NCFA/UNEP-WCMC) | Sectors with high dependency (agriculture, food, construction) face material revenue-at-risk if ecosystem services degrade; ENCORE rates 21 ecosystem services. |
| Biodiversity Impact Driver Count | `COUNT(high-intensity impact drivers per site)` | IPBES driver assessment + site data | Sites with 3+ high-intensity drivers require dedicated biodiversity management plans and TNFD CORE metric disclosure. |
- **Operational site data + KBA/WDPA/IBAT spatial databases + ENCORE sector maps** → LEAP spatial overlay → dependency scoring → impact driver assessment → CORE metrics → **TNFD-compliant biodiversity baseline assessment with CORE disclosure metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP Biodiversity Assessment
**Headline formula:** `nature_risk_score = exposure × dependency × impact_driver_intensity`

The LEAP process begins with location mapping of all operated and upstream sites against IUCN WDPA (protected areas), KBA (Key Biodiversity Areas), and IBAT (biodiversity threat database) spatial layers. Ecosystem service dependency is assessed using ENCORE (Exploring Natural Capital Opportunities, Risks, and Exposure) for each NACE sector. Impact drivers are scored using the IPBES direct driver taxonomy (land/sea use change, direct exploitation, climate change, pollution, invasive species).

**Standards:** ['TNFD Final Recommendations v1.0 (2023)', 'KBA Partnership – Key Biodiversity Areas Criteria', 'IPBES Global Biodiversity Framework – Kunming-Montreal Targets']
**Reference documents:** TNFD Final Recommendations v1.0 (September 2023); KBA Partnership Key Biodiversity Areas Criteria and Category Definitions; ENCORE Tool Methodology (NCFA / UNEP-WCMC 2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is an "advisory toolkit" module (`AdvisoryToolkit`/`AdvisoryReference` shared libraries) that
builds a TNFD LEAP biodiversity baseline for a single reporting entity with an editable asset
register (8 seed assets). Unlike most platform pages, its scenario data is **user-editable
worksheet state** (`useScenario`), not a randomly generated portfolio — the 8 default assets are
fixed, hand-authored illustrative records, and every downstream number is a deterministic function
of that state plus reference tables in `AdvisoryReference.js`.

Six calculation blocks run over the asset register:

```
Priority(asset)   = min(5, dep×0.4 + imp×0.4 + (KBA<10km ? 0.8 : 0.2) + min(1, IUCN×0.15))
MSA ha-equiv      = Σ areaHa × MSA_LOSS[sector][biome]
Water (blue/green/grey) = Σ areaHa × WATER_FP[biome].{blue,green,grey}     (m³/yr)
Mitigation cost   = Σ_step (MSA_total × allocPct/100) × costPerMSAHa[step]
Mitigation credibility = Σ_step credibility[step] × allocPct/100
Refined RaR       = Σ_service revAtRisk × ES_SECTOR_MULT[sector][category]
```

### 7.2 Parameterisation / scoring rubric

| Table | Structure | Provenance |
|---|---|---|
| `ENCORE_MATRIX` | 4 sectors × 8 biomes → {dep, imp} 0–5 | Modelled on ENCORE (Exploring Natural Capital Opportunities, Risks & Exposure) dependency/impact ratings; hand-calibrated demo values, not pulled from the live ENCORE API |
| `IUCN_DENSITY` | 8 biomes → threatened-species count / 1000 km² | Illustrative approximation of IUCN Red List density by biome archetype |
| `SBTN_FLAGS` | `kbaDistanceKm: 10`, `iucnSpeciesCount: 3`, `priorityScoreCut: 3.5` | Science Based Targets Network priority-screening thresholds, platform-selected |
| `MSA_LOSS` | 4 sectors × 8 biomes, 0–1 | Encodes GLOBIO-style Mean Species Abundance loss intuition (mining > agriculture > real estate > renewables, coastal/wetland biomes highest); synthetic calibration, not sourced from a GLOBIO model run |
| `WATER_FP` | 8 biomes → {blue, green, grey} m³/ha/yr | Illustrative water-footprint archetypes per WFN (Water Footprint Network) blue/green/grey convention |
| `MITIGATION_HIERARCHY` | Avoid/Minimise/Restore/Offset → cost $/MSA-ha, credibility % | Standard IFC PS6 / mitigation-hierarchy ordering; cost and credibility figures are platform-authored (Avoid=$0/100% credible, Offset=$9,500/40% credible) |
| `GBF_TARGETS` | 10 Kunming-Montreal targets → sector relevance flags | Real GBF target IDs/names (T1, T2, T3, T7...); relevance mapping is platform-curated |
| `ES_SECTOR_MULT` | 4 sectors × 4 ES categories (prov/reg/cult/sup) | Synthetic multiplier set expressing that agriculture has far higher ecosystem-service dependency than mining |
| `DISCLOSURE_CROSSWALK` | 5 TNFD-style items → ESRS E4 / GRI 304 clause refs | Real standard clause numbers (ESRS E4-1..E4-5, GRI 304-1..304-4) |

### 7.3 Calculation walkthrough

1. **Asset priority** combines dependency, impact, KBA proximity and species density into a single
   0–5 score; ≥3.5 counts as "high priority" in the KPI rail.
2. **MSA footprint**: each asset's biome and the entity's declared sector select a loss factor
   (0 = no biodiversity loss, 1 = total loss) from `MSA_LOSS`; multiplying by hectares gives
   "MSA hectare-equivalents" — a simplified stand-in for the biodiversity-intactness metric used in
   GLOBIO/PBL national assessments.
3. **Water footprint** sums blue (extraction), green (rainfall consumption) and grey (pollution
   dilution) water per biome × area, aggregated across all assets.
4. **Mitigation hierarchy**: the user allocates % of the MSA footprint across the four IFC PS6
   mitigation steps (must total 100%, flagged if not); each step's ha allocation × its $/ha cost
   gives total mitigation spend, and each step's credibility % is allocation-weighted into a single
   portfolio credibility score (Avoid is 100% credible/free; Offset is the least credible and most
   expensive per the standard mitigation-hierarchy hierarchy of preference).
5. **Ecosystem-service Rev-at-Risk**: each service's raw revenue-at-risk is scaled by the sector's
   provisioning/regulating/cultural/supporting multiplier, then summed.
6. **Monte Carlo Rev-at-Risk**: a genuine triangular-distribution simulation (`monteCarlo()`,
   `Math.random()`-driven, not the platform's seeded `sr()`) draws `depScalar` (0.7–1.4×),
   realisation `prob` (30–85%) and `mitCredit` (0 to the computed credibility score) per run, and
   evaluates `gross × prob × (1 − mitCredit/100)` where `gross = Σ refinedRaR × depScalar`.
7. **Tornado sensitivity** perturbs `kbaFlags`, `iucnAvg`, `msaFactor`, `mitPct`, `npv` by ±20% one
   at a time against a composite driver function to rank which input most moves the outcome.

### 7.4 Worked example (default 8-asset portfolio)

| Metric | Computation | Result |
|---|---|---|
| Asset 1 priority | `2×0.4+3×0.4+0.2+min(1,2×0.15)` (Rajasthan PV, KBA=15km) | **2.5** |
| Asset 1 MSA ha-equiv | `180 ha × MSA_LOSS[Renewables][Arid/Desert]=0.05` | **9.0 ha** |
| Total MSA ha-equiv (8 assets) | Σ across biomes (0.05/0.12/0.35/0.70/0.02/0.55/0.12/0.05) | **243.1 ha** |
| Refined RaR | `Σ revAtRisk × {prov:0.8, reg:1.2, cult:0.3, sup:1.0}` (6 services) | **$506M** |
| Mitigation cost (30/40/20/10 split) | Avoid $0 + Minimise 97.2ha×$1,200 + Restore 48.6ha×$4,500 + Offset 24.3ha×$9,500 | **≈$566K** |
| Mitigation credibility | `100×0.30+85×0.40+70×0.20+40×0.10` | **82%** |
| DNSH flags | assets #2 (Gujarat) and #4 (Odisha) flagged | **2/8** |

The refined RaR ($506M) then feeds the Monte Carlo as `gross`, discounted by realisation
probability and mitigation credit — so the P50/P95 Monte Carlo output in the rail is materially
lower than the raw $506M figure (typically 30–55% of it, since `prob` ranges 0.3–0.85 and
`mitCredit` further discounts by up to the 82% credibility level).

### 7.5 Companion analytics

- **Sector × biome MSA heatmap** — all 4 sectors × 8 biomes rendered as a reference grid so users
  can see how footprint intensity would change if the entity were reclassified.
- **GBF target crosswalk** — filters the 10 Kunming-Montreal targets to those flagged relevant for
  the entity's sector via `GBF_KEY`.
- **Nature-positive opportunities** — a simple ROI ledger (`NPV / capex`) for restoration/
  stewardship programmes, independent of the MSA/RaR calculations (no explicit link between
  opportunity NPV and footprint reduction).
- **SBTN priority flagging** — counts assets within 10km of a KBA or with ≥3 IUCN-listed species
  density, per `SBTN_FLAGS`.

### 7.6 Data provenance & limitations

- The 8 default assets and their biome/KBA/IUCN/dependency/impact attributes are **hand-authored
  illustrative data**, not sourced from a live IBAT/WDPA/KBA spatial query — the module's LEAP
  "Locate" step (85% in defaults) is a static input slider, not a real spatial overlay.
- `ENCORE_MATRIX`, `MSA_LOSS`, `WATER_FP`, `ES_SECTOR_MULT` are internally consistent, directionally
  sensible calibrations (mining > agriculture > real estate > renewables in impact severity) but are
  **platform-authored approximations**, not pulled from the live ENCORE tool, a GLOBIO model run, or
  the Water Footprint Network's country/product-specific database.
- Monte Carlo and tornado use genuine `Math.random()` triangular sampling and finite-difference
  sensitivity — methodologically sound, but the *inputs* to those simulations (the 0.7–1.4×
  dependency scalar range, 30–85% realisation probability) are itself a judgment call with no
  cited empirical basis.
- No spatial precision: "KBA km" is a single manually entered number per asset rather than a
  computed distance to the nearest polygon in the KBA World Database.

### 7.7 Framework alignment

- **TNFD LEAP** (Locate, Evaluate, Assess, Prepare): the module tracks completion % for all 4
  phases as a manual input; the Evaluate/Assess computations (MSA, water, RaR) are implemented, but
  Locate and Prepare remain self-reported percentages rather than derived outputs.
- **ENCORE** (Natural Capital Finance Alliance / UNEP-WCMC): dependency/impact scores by
  sector-biome pair are the module's core lookup table, modelled on ENCORE's sector-materiality
  matrix (which in the live tool aggregates dependency ratings across 21 ecosystem services per
  economic sector).
- **SBTN** (Science Based Targets Network): the KBA-proximity/species-count priority-flag logic
  mirrors SBTN's materiality screening step used to identify priority locations before setting
  land/freshwater/ocean targets.
- **IFC Performance Standard 6** mitigation hierarchy (Avoid→Minimise→Restore→Offset): implemented
  faithfully as an allocation-and-cost model, with Offset correctly modelled as the least credible,
  most expensive last resort.
- **GBF (Kunming-Montreal Global Biodiversity Framework)**: target IDs and short names (T1, T2, T3,
  T7, T10, T14, T15, T18, T19, T22) are real; sector-relevance mapping is the module's own curation.
- **ESRS E4 / GRI 304**: the disclosure crosswalk cites real clause numbers for location, impact/
  dependency, transition plan, targets and metrics disclosures.

## 9 · Future Evolution

### 9.1 Evolution A — Real spatial "Locate" and calibrated ENCORE/GLOBIO tables (analytics ladder: rung 2 → 3)

**What.** This AdvisoryToolkit module is genuinely scenario-capable — a full deterministic worksheet (user-editable asset register, not PRNG), an IFC PS6 mitigation-hierarchy allocation model, a `Math.random()` triangular Monte Carlo, and tornado sensitivity (§7.3). Its rung-3 gaps per §7.6: the LEAP "Locate" step is a manually-entered "KBA km" number per asset, not a computed distance to the nearest KBA polygon; and `ENCORE_MATRIX`, `MSA_LOSS`, `WATER_FP`, `ES_SECTOR_MULT` are platform-authored approximations, directionally sound but not from the live ENCORE tool, a GLOBIO run, or the Water Footprint Network database.

**How.** (1) Wire real spatial overlay: the platform's physical-risk digital twin already loads PostGIS hazard grids — add KBA/WDPA/protected-area polygons (IBAT/WDPA are the canonical sources) so `kbaDistanceKm` is computed from asset coordinates, turning "Locate" from a slider into a derived output. (2) Replace the four hand-calibrated lookup tables with sourced values: ENCORE's published sector-materiality matrix (dependency/impact across 21 ecosystem services), GLOBIO MSA-loss coefficients, WFN water-footprint archetypes — each cited, with the synthetic version retained only as fallback. (3) Attach data-quality flags per asset (§7.6 notes none exist) and report Monte Carlo P50/P95 with the input-range provenance. (4) Bench-pin the §7.4 worked example (243.1 ha MSA-equiv, $566K mitigation cost, 82% credibility).

**Prerequisites.** WDPA/KBA polygon licensing (KBA data has access terms — verify, per the platform's data-sources lesson that assumed feeds often aren't free); asset coordinates added to the register. **Acceptance:** moving an asset's coordinates changes its KBA proximity and priority score; every lookup cell cites its source; mitigation-cost bench pin reproduces §7.4.

### 9.2 Evolution B — LEAP-narrative copilot for the disclosure step (LLM tier 1)

**What.** The module computes an Evaluate/Assess baseline but its "Prepare" phase (disclosure drafting) is where an LLM adds most: given the computed MSA footprint, water footprint, priority-asset list, mitigation plan, and RaR, the copilot drafts the TNFD/ESRS E4 disclosure narrative, mapping each figure to the `DISCLOSURE_CROSSWALK`'s real clause numbers (ESRS E4-1..E4-5, GRI 304-1..304-4).

**How.** Tier 1 on worksheet state plus this Atlas record: the module's reference layer is unusually well-documented (§7.2's table of ENCORE/SBTN/IFC-PS6/GBF provenance, §7.7's framework alignment), giving the copilot grounded material to explain why an asset is flagged priority (dependency + impact + KBA proximity + species density, per the `Priority` formula) and what GBF target a mitigation action supports. Because the worksheet is deterministic and user-editable, every number the copilot cites is reproducible and stable — a strong no-fabrication position. The copilot must flag that pre-Evolution-A figures rest on hand-authored lookup tables and self-reported Locate completeness, not live spatial data.

**Prerequisites.** None for tier 1; this AdvisoryToolkit family has no backend, so tool-calling (tier 2) awaits a route port. **Acceptance:** every disclosure-draft figure traces to a worksheet computation; clause citations match `DISCLOSURE_CROSSWALK` exactly; the copilot states the Locate step is self-reported until Evolution A's spatial overlay lands.