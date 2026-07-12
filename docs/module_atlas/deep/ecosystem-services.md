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
