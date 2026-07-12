## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a deforestation-exposure formula
> `DeforestExposure = Σ[Revenue_commodity × DeforestationRate_country × CarbonLiability +
> RegulatoryRisk × RevenueAtRisk]` and `CarbonSinkValue = AreaForest × CarbonDensity × CarbonPrice`.
> **Neither formula is implemented.** The page carries a per-country `exposureMn` field (a direct
> PRNG draw, not a product of revenue × deforestation-rate × carbon liability) and aggregates it.
> There is no carbon-sink valuation and no TNFD LEAP output. Sections document the actual code.

### 7.1 What the module computes

A 24-country `COUNTRIES` table, each row PRNG-seeded `sr(s)=frac(sin(s+1)×10⁴)`:

```js
deforestRateHa   = sr(i·7)·500 + 50           // 50–550 ha/yr (illustrative)
carbonStockMtCO2 = sr(i·11)·8000 + 200        // 200–8200 MtCO₂
exposureMn       = sr(i·19)·600 + 30          // $30–630M — the "portfolio exposure"
complianceScore  = sr(i·23)·60 + 25           // 25–85
eudrRisk         = hard-coded Low/Medium/High/Critical per country
```

Portfolio aggregation (Portfolio Exposure tab):

```js
totalExposure    = Σ exposureMn                                    // over region-filtered set
highRiskExposure = Σ exposureMn where eudrRisk ∈ {High, Critical}  // the headline "revenue at risk"
```

So `highRiskExposure` is a **sum of pre-drawn exposure figures filtered by a categorical risk flag**,
not the guide's revenue × rate × liability product. `carbonStockMtCO2` exists but is never multiplied
by a carbon price to produce a sink value.

### 7.2 Parameterisation / reference data provenance

| Table | Contents | Provenance |
|---|---|---|
| `COUNTRIES` (24) | Brazil, Indonesia, DR Congo… with region tag | Real forest-risk geographies; **all numerics PRNG-drawn** |
| `eudrRisk` per country | Low→Critical | Hard-coded, roughly matches EUDR benchmarking intuition |
| `EUDR_COMMODITIES` (7) | Cattle 68% risk / 32% trace, Palm 72/28, Soy 55/48, Timber 61/41, Cocoa 58/44, Coffee 42/55, Rubber 45/38 | Hard-coded; risk/traceability magnitudes plausible, uncited |
| `REDD_PROJECTS` (12) | credits, priceUSD, verification (Gold Standard/VCS/Plan Vivo/CCB), permanence 60–90% | PRNG credits/price; verification cycled `[i%4]` |
| `carbonTrend` | 2020–30 volume `sr·50+20`, price `4 + i·1.5 + sr·2` | Synthetic upward carbon-price path |

### 7.3 Calculation walkthrough

`COUNTRIES` built once → `filteredCountries` by region → the seven tabs render:
- **Overview / Deforestation Risk** — top-10 by `deforestRateHa`, carbon in GtCO₂.
- **EUDR Compliance** — commodity risk-vs-traceability bars from `EUDR_COMMODITIES`.
- **REDD+ Finance** — `sortedRedd` (sort by credits/price/permanence).
- **Carbon Markets** — `carbonTrend` volume/price lines.
- **Portfolio Exposure** — `totalExposure`, `highRiskExposure`, per-country exposure vs compliance.

### 7.4 Worked example (Portfolio Exposure, region = All)

`totalExposure = Σ exposureMn` over 24 countries; each `exposureMn ∈ [30,630]`, so the sum lands
≈ $7–8bn. `highRiskExposure` filters to `eudrRisk ∈ {High, Critical}`. With ~11 countries flagged
High/Critical in the hard-coded array, and mean exposure ≈ $330M, `highRiskExposure ≈ 11 × 330 ≈
$3.6bn` — displayed as the EUDR "revenue at risk". No revenue, deforestation rate, or carbon
liability enters this figure; it is a filtered sum of independent random exposures.

### 7.5 Data provenance & limitations

- **Every quantitative field is synthetic** (`sr()` PRNG); country names and EUDR risk tiers are the
  only curated inputs. Unlike sibling `land-use-deforestation`, this page imports **no** real forest
  dataset (no FAO/GFW anchoring).
- The guide's two headline formulas (deforestation financial exposure; carbon-sink value) are not in
  code; `carbonStockMtCO2` is displayed but never valued.
- No TNFD LEAP output, no supplier-level supply-shed attribution.

**Framework alignment:** EU Deforestation Regulation 2023/1115 — risk tiers and commodity list
mirror the seven EUDR commodities, but no Article-29 benchmarking logic runs. TNFD v1.0 (LEAP) —
named in the guide, not produced. Global Forest Watch / Trase — cited as intended sources; the page
uses none of them.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (`exposureMn` is a PRNG draw; the guide's
exposure and sink formulas are absent.)

### 8.1 Purpose & scope
A deforestation financial-exposure and forest-carbon-sink valuation model for lenders/traders with
forest-risk-commodity supply chains, producing EUDR revenue-at-risk and TNFD-aligned nature metrics
at counterparty and portfolio level.

### 8.2 Conceptual approach
Two linked engines mirroring the guide and industry practice:
1. **Deforestation exposure** — attribute revenue to commodity × sourcing geography, weight by
   deforestation rate and carbon liability, add regulatory (EUDR) revenue-at-risk. Benchmarks:
   Trase supply-shed attribution; Forest 500 corporate scoring; S&P Trucost land-use factors.
2. **Carbon-sink value** — `AreaForest × CarbonDensity × CarbonPrice`, per TNFD dependency valuation.

### 8.3 Mathematical specification

```
DeforestExposure_c = Σ_commodity [ Revenue_{c,k} · DeforestRate_geo(k) · CarbonLiability
                                    + RegRisk_EUDR(k) · RevenueAtRisk_{c,k} ]
CarbonLiability   = tCO₂_at_risk · shadow_carbon_price
RevenueAtRisk     = Revenue · share_from_high_risk_origin · P(non-compliance)
CarbonSinkValue   = Σ_geo AreaForest_geo · CarbonDensity_geo · CarbonPrice
PortfolioExposure = Σ_c EAD_c · DeforestExposure_c / Revenue_c
```

| Parameter | Calibration source |
|---|---|
| DeforestRate by geography | Hansen/GFW tree-cover-loss rasters |
| Commodity → deforestation share | Trase supply-shed data |
| EUDR non-compliance probability | Country Art.29 benchmark tier |
| Shadow carbon price | EU ETS forward / NGFS carbon-price path |
| CarbonDensity | ESA CCI Biomass / IPCC defaults |

### 8.4 Data requirements
- Counterparty revenue by commodity + sourcing geography (GPS/jurisdiction).
- GFW tree-cover-loss, Trase flows, EUDR benchmark list, forest carbon density maps, carbon price.
- Platform: sibling `land-use-deforestation` already ingests FAO FRA 2020 — reuse that; add GFW.

### 8.5 Validation & benchmarking plan
- Reconcile counterparty deforestation scores against Forest 500 published ratings.
- Backtest EUDR revenue-at-risk against realised import rejections/compliance costs post-2025.
- Sensitivity on shadow carbon price and non-compliance probability.

### 8.6 Limitations & model risk
- Supply-shed attribution is the dominant uncertainty — require GPS-level traceability before
  high-confidence exposure; fall back to jurisdictional averages with a conservatism loading.
- Carbon-sink value is highly price-sensitive; disclose price assumption prominently.
