# Ecosystem Services Valuation
**Module ID:** `ecosystem-services` · **Route:** `/ecosystem-services` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Natural capital accounting and ecosystem service valuation using TEEB, InVEST, and SEEA-EA methodologies. Quantifies the economic value of provisioning, regulating, cultural, and supporting services for corporate and portfolio nature-related risk assessment. Supports TNFD LEAP framework disclosure and CBD Kunming-Montreal targets.

> **Business value:** Enables companies to quantify their dependence on and impact to nature in monetary terms, meeting TNFD LEAP framework requirements and informing nature-positive strategy. Ecosystem service valuation provides the economic case for biodiversity conservation and habitat restoration investments.

**How an analyst works this module:**
- Map all asset locations to biome types using the spatial overlay tool
- Assign ecosystem condition scores per site using remote sensing data or site assessments
- Calculate ecosystem service values using TEEB coefficients and review by service category
- Export the natural capital account and TNFD LEAP dependency/impact assessment for disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SERVICES`, `Badge`, `Btn`, `Card`, `CustomTooltip`, `DEP_MATRIX`, `ECOSYSTEM_SERVICES`, `KpiCard`, `PIE_COLORS`, `RATING_BG`, `RATING_COLORS`, `RATING_SCORES`, `RATING_TEXT_COLORS`, `SBTN_STATUS_MAP`, `SECTORS_LIST`, `SERVICE_FINANCIAL`, `Section`, `SortHeader`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `totalScore` | `deps.reduce((s, d) => s + d.score, 0);` |
| `topService` | `deps.sort((a, b) => b.score - a.score)[0]?.service?.name \|\| 'N/A';` |
| `sbtnStatus` | `sbtnOptions[Math.floor(s * sbtnOptions.length)];` |
| `valAtRisk` | `Math.round(totalScore * (company.weight \|\| 0.01) * 42 + s * 50);` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map((c, i) => { const result = scoreEcosystemDependency(c, i);` |
| `uniqueServices` | `new Set(allDeps.map(d => d.service.id));` |
| `vhTotal` | `scoredHoldings.reduce((s, h) => s + h.vhCount, 0);` |
| `avgScore` | `scoredHoldings.length ? Math.round(scoredHoldings.reduce((s, h) => s + h.totalScore, 0) / scoredHoldings.length) : 0;` |
| `topSector` | `Object.entries(sectorScores).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `totalValAtRisk` | `scoredHoldings.reduce((s, h) => s + h.valAtRisk, 0);` |
| `totalReplacement` | `ALL_SERVICES.reduce((s, sv) => s + (SERVICE_FINANCIAL[sv.id]?.replacementCost \|\| 0), 0);` |
| `dataCoverage` | `scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.totalScore > 0).length / scoredHoldings.length) * 100) : 0;` |
| `sectorCards` | `useMemo(() => { const represented = [...new Set(scoredHoldings.map(h => h.sector))];` |
| `deps` | `row.map((r, i) => ({ service: ALL_SERVICES[i]?.name, rating: r, score: RATING_SCORES[r] })).sort((a, b) => b.score - a.score);` |
| `scatterData` | `useMemo(() => { return SECTORS_LIST.map(sector => { const row = DEP_MATRIX[sector];` |
| `depScore` | `row.reduce((s, r) => s + (RATING_SCORES[r] \|\| 0), 0);` |
| `impactScore` | `Math.round(depScore * 0.7 + s * 20);` |
| `lossMultiplier` | `scenarioDegradation / 100;` |
| `totalImpact` | `affectedHoldings.reduce((s, h) => s + h.valAtRisk * lossMultiplier, 0);` |
| `header` | `['Sector', ...ALL_SERVICES.map(s => s.name)].join(',');` |
| `rows` | `SECTORS_LIST.map(sec => [sec, ...DEP_MATRIX[sec]].join(','));` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `data` | `{ matrix: DEP_MATRIX, services: ALL_SERVICES, holdings: sorted.map(h => ({ name: h.name, sector: h.sector, totalScore: h.totalScore, natureRisk: h.natureRisk, valAtRisk: h.valAtRisk })) };` |
| `pct` | `scoredHoldings.length ? Math.round((count / scoredHoldings.length) * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SECTORS_LIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Ecosystem Service Value | — | ESV calculation (TEEB coefficients) | Annual monetary value of ecosystem services across all assets in the corporate footprint |
| Highest-Value Service | — | Service category breakdown | Ecosystem service category generating the largest attributed economic value |
| Dependencies on High-Risk Biomes | — | Biome dependency assessment | Share of total ESV drawn from biomes with ecosystem condition score below 0.50 |
| Biodiversity Intactness Index (Avg) | — | Natural History Museum BII data | Mean Biodiversity Intactness Index across all assessed asset locations; global safe boundary is 0.90 |
- **Asset location database (GPS coordinates or boundary polygons)** → Spatial overlay against global biome classification (WWF Ecoregions) → **Asset-biome mapping with area in hectares per biome type**
- **TEEB/de Groot (2012) ecosystem service coefficient database** → Biome-coefficient assignment and condition multiplier application → **ESV per service category, per asset, and portfolio total**
- **Remote sensing ecosystem condition data (ESA, NDVI, habitat maps)** → Condition score derivation and BII lookup for each asset location → **Condition-adjusted ESV with uncertainty bounds and TNFD dependency assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** Ecosystem Service Value
**Headline formula:** `ESV = Σᵢ (Areaᵢ × BiomeCoefficientᵢ × ConditionMultiplierᵢ)`

Ecosystem service value is calculated by multiplying land area by biome-specific service coefficients ($/ha/yr from TEEB/de Groot 2012 database) adjusted by an ecosystem condition multiplier (0–1) derived from remote sensing or site assessment data. The total economic value encompasses use and non-use values across all service categories.

**Standards:** ['TEEB (2010) The Economics of Ecosystems and Biodiversity', 'SEEA EA (2021) System of Environmental-Economic Accounting', 'TNFD LEAP Framework v1.1']
**Reference documents:** TEEB (2010) The Economics of Ecosystems and Biodiversity â€” Synthesis Report; SEEA EA (2021) System of Environmental-Economic Accounting â€” Ecosystem Accounts; TNFD (2023) Recommendations for Nature-related Financial Disclosures v1.1; de Groot et al. (2012) Global Estimates of the Value of Ecosystems and their Services â€” Global Environmental Change

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Ecosystem Services scores corporate **dependency on nature** using the **ENCORE** framework: a
21-service × 11-sector dependency matrix (Very High → None), financial value-at-risk / replacement-cost
proxies per service, SBTN status, and a nature-risk classification. The ENCORE matrix and service
taxonomy are real; per-company value-at-risk is partly seeded. No guide record supplied → no mismatch flag.

### 7.1 What the module computes

For each company, its sector's ENCORE dependency row is scored:
```js
RATING_SCORES = { VH:5, H:4, M:3, L:2, N:0 }
totalScore = Σ over 21 services  RATING_SCORES[dependency_rating]
natureRisk = totalScore>60 VeryHigh | >45 High | >30 Medium | else Low
valAtRisk  = round( totalScore · (company.weight||0.01) · 42 + s·50 )      // $M, s = seeded
```
Where `s = seed(idx+7) = frac(sin(idx+8)×10⁴)`. `topService` = highest-scoring dependency; `vhCount`/
`hCount` count Very-High / High dependencies. SBTN status is drawn from a weighted option list
(committed/target_set/in_progress/none×3) by the same seed.

### 7.2 Parameterisation / scoring rubric

**ENCORE dependency matrix** (`DEP_MATRIX`, 11 GICS sectors × 21 services) — the core real data. Examples:

| Sector | Water supply | Climate reg. | Pollination | Flood protection | Nature-risk tendency |
|---|---|---|---|---|---|
| Consumer Staples | VH | H | VH | H | Very High (food/ag dependency) |
| Utilities | VH | VH | N | VH | Very High |
| Materials | VH | M | L | M | High |
| Financials | L | M | L | L | Low (indirect) |

**21 ENCORE services** in 4 categories: Provisioning (5), Regulating (7), Supporting (4), Cultural (5) —
following the Millennium Ecosystem Assessment / ENCORE classification with units (megalitres/yr, tCO₂e,
USD Mn avoided damage, hectares…).

**Financial proxies** (`SERVICE_FINANCIAL`) — per-service value-at-risk and replacement cost, e.g.
Climate regulation (ES06) $510M at risk / $950M replacement; Pollination (ES09) $240M / $890M. These are
**authored proxy magnitudes** (order-of-magnitude ecosystem-valuation estimates), not per-company data.

| Constant | Value | Provenance |
|---|---|---|
| Rating scores | VH 5 / H 4 / M 3 / L 2 / N 0 | ENCORE ordinal → numeric |
| Nature-risk bands | 60 / 45 / 30 (of max ~105) | heuristic thresholds |
| valAtRisk scalar | ×42 + seeded ×50 | heuristic $M mapping |
| SBTN option weights | committed/target/in_progress + none×3 | seeded (skewed to "none") |

### 7.3 Calculation walkthrough

1. Each company inherits its sector's ENCORE dependency row (or Financials as default).
2. `scoreEcosystemDependency` sums the 21 ratings → `totalScore` → `natureRisk` band.
3. `valAtRisk` combines total score, portfolio weight and a seeded term into a $M figure.
4. Aggregations: dependency heatmap (sector × service), value-at-risk by service, SBTN status
   distribution, top-dependency ranking.

### 7.4 Worked example (Consumer Staples company)

Consumer Staples ENCORE row ratings map to scores. Counting the row `['VH','H','M','VH','H','H','H','VH',
'VH','H','VH','M','VH','VH','H','H','L','L','L','M','L']`:
VH×7 = 35, H×7 = 28, M×3 = 9, L×4 = 8 → **totalScore = 80**. 80 > 60 → **Very High** nature risk.
With weight 0.02 and seed s≈0.6: `valAtRisk = round(80·0.02·42 + 0.6·50) = round(67.2 + 30) = $97M`.
`vhCount = 7`, top service = one of the VH dependencies (e.g. Water supply / Food provision).

### 7.5 Data provenance & limitations

- The **ENCORE dependency matrix and service taxonomy are real** (ENCORE / Natural Capital Finance
  Alliance), giving defensible sector-level dependency ratings.
- **Per-company value-at-risk is synthetic** (`seed(idx+7)`-driven) and the financial proxies are authored
  order-of-magnitude figures, not company-specific ecosystem valuations.
- Dependency is at **sector granularity** — all companies in a sector share the same ratings, ignoring
  geography/operations that ENCORE's full workflow would incorporate (asset-level location vs ecosystem).
- SBTN status is seeded, skewed to "none".

**Framework alignment:** **ENCORE** (Exploring Natural Capital Opportunities, Risks and Exposure) sector
dependency scoring — ENCORE actually rates dependencies of ~180 production processes on ecosystem services
at VH→N, which the module collapses to sector rows; **TNFD LEAP** (Locate-Evaluate-Assess-Prepare) nature
risk; **SBTN** (Science Based Targets for Nature) commitment tracking; **Natural Capital Protocol**
value-at-risk / replacement-cost valuation. The 21-service list follows the **Millennium Ecosystem
Assessment** provisioning/regulating/supporting/cultural taxonomy.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (asset-level nature VaR).**

### 8.1 Purpose & scope
Asset- and portfolio-level nature dependency and impact scoring with a defensible nature value-at-risk,
for TNFD disclosure and nature-related credit/portfolio risk. Scope: covered issuers with location data.

### 8.2 Conceptual approach
Combine **ENCORE** dependency ratings with **asset-location × ecosystem-condition** overlays (WWF Water
Risk Filter, IBAT biodiversity, MSA) to move from sector-average to asset-specific, then monetise via
ecosystem-service valuation. Benchmarks: TNFD LEAP, ENCORE, WWF Biodiversity Risk Filter, Natural Capital
Protocol, NGFS nature scenarios.

### 8.3 Mathematical specification
```
Dependency_i = Σ_s ENCORE(sector_i, s) · materiality_s
Impact_i     = Σ_s driverPressure(asset_i, s) · ecosystemSensitivity(location_i)
NatureVaR_i  = Σ_s P(serviceDisruption_s | location_i) · valueDependent_{i,s} · timeFactor
Portfolio    = Σ_i w_i · NatureVaR_i
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| ENCORE ratings | — | ENCORE database (public) |
| Ecosystem condition | — | WWF Water Risk Filter, IBAT, MSA |
| Service value | valueDependent | Natural Capital Protocol / TEEB valuations |
| Disruption probability | — | NGFS nature scenarios, IPBES drivers |

### 8.4 Data requirements
Asset locations, revenue-by-process (ENCORE mapping), ecosystem condition layers, service-valuation
factors. Free: ENCORE, IBAT, WWF filters; the platform holds the ENCORE matrix and financial proxies.

### 8.5 Validation & benchmarking plan
Reconcile dependency scores against ENCORE reference outputs; nature VaR sensitivity to ecosystem-condition
inputs; compare portfolio nature risk vs a TNFD pilot disclosure; backtest disruption events (drought,
pollinator loss) against realised operational impacts where available.

### 8.6 Limitations & model risk
Nature valuation is deeply uncertain and non-fungible; sector-average dependencies mask asset-level
variation. Conservative fallback: report dependency ratings and a value-at-risk *range*, flag low-location
-data assets, and avoid presenting a single precise nature-VaR figure.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the TEEB valuation the guide promises, on real asset locations (analytics ladder: rung 1 → 2)

**What.** The page's real asset is the ENCORE dependency matrix (21 services × 11 sectors, honest ratings) driving `totalScore` and nature-risk classes. But the guide's headline methodology — `ESV = Σ Area × BiomeCoefficient × ConditionMultiplier` with TEEB/de Groot 2012 coefficients, spatial overlay, and BII condition scores — is not implemented: the monetary layer is a heuristic (`valAtRisk = totalScore·weight·42 + s·50`, part-seeded) and SBTN status is a PRNG draw. Evolution A builds the actual valuation vertical.

**How.** (1) New backend `api/v1/routes/ecosystem_services.py` + tables `es_asset_locations` (PostGIS points/polygons — the digital-twin work already proved this stack) and `es_biome_coefficients` seeded from the public de Groot et al. (2012) ESVD coefficient set ($/ha/yr by biome × service). (2) Spatial overlay: asset coordinates → WWF terrestrial-ecoregion biome (public shapefile) → coefficient row; condition multiplier from a coarse public proxy first (Natural History Museum BII raster) with `resolution_tier` disclosure, mirroring the physical-risk resolution-cascade pattern. (3) Replace `valAtRisk` with computed ESV-at-risk; SBTN status becomes a user-entered field or an honest null. (4) Rung 2: the existing degradation-scenario slider becomes a server-side sweep (condition multiplier −10/−25/−50%) over real ESV.

**Prerequisites.** ESVD licensing check (the database is free for research; verify commercial terms); asset-location capture UX (portfolios currently lack coordinates — the energy-asset-registry pattern applies). **Acceptance:** a fixture asset (1,000 ha temperate forest, condition 0.7) reproduces the TEEB arithmetic by hand; two same-sector companies with different geographies produce different ESV; zero `seed()` in the valuation path.

### 9.2 Evolution B — TNFD LEAP walkthrough assistant (LLM tier 2)

**What.** TNFD's LEAP process (Locate → Evaluate → Assess → Prepare) is a guided workflow, not a single calculation — ideal for a tool-calling assistant that walks an analyst through it against this module's data: Locate (query `es_asset_locations` overlays for priority biomes), Evaluate (pull the ENCORE dependency row and computed ESV per site), Assess (rank value-at-risk under the degradation scenarios), Prepare (draft the TNFD disclosure sections with every figure from tool output, gaps disclosed).

**How.** Tools from Evolution A's endpoints plus a `get_encore_dependencies(sector)` reference call; grounding corpus = this Atlas record's §5/§7 (TEEB formula, ENCORE rating scale, the RATING_SCORES mapping) and the TNFD v1.1 reference text. The assistant tracks LEAP-stage state so a session resumes where it left off; the Prepare stage renders through report-studio. Refusal behavior matters here: asked for species-level impact metrics (not computed), it says so and points to the biodiversity-footprint roadmap rather than inventing a mean-species-abundance figure.

**Prerequisites (hard).** Evolution A — a LEAP walkthrough over the current seeded `valAtRisk` and PRNG SBTN statuses would produce a TNFD disclosure with fabricated commitments attributed to real companies. **Acceptance:** a golden two-site walkthrough produces a Prepare draft where every $ figure and dependency rating matches tool responses; ungeocoded assets are listed as Locate-stage gaps, not silently skipped.