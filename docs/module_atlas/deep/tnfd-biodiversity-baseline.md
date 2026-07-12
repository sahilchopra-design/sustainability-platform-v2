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
