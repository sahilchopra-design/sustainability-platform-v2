# Land Use Change Finance
**Module ID:** `land-use-change-finance` · **Route:** `/land-use-change-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DG3 · **Sprint:** DG

## 1 · Overview
Quantifies financial exposure to land use change risks including deforestation-linked commodity supply chains, carbon sink degradation, and biodiversity loss. Integrates TNFD LEAP approach, Forest 500 corporate assessments, and jurisdictional deforestation-free sourcing frameworks.

> **Business value:** Critical for consumer goods companies with forest-risk commodity supply chains (EUDR compliance), banks financing agribusiness (TNFD disclosure), and forest carbon investors. Provides quantitative EUDR compliance gap analysis and TNFD LEAP-aligned nature disclosure.

**How an analyst works this module:**
- Map commodity supply chains by country of origin
- Apply deforestation risk scores from GFW/Trase
- Calculate EUDR compliance exposure and revenue at risk
- Model carbon sink value of forest ecosystems
- Generate TNFD LEAP nature disclosure report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `EUDR_COMMODITIES`, `KpiCard`, `REDD_PROJECTS`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EUDR_COMMODITIES` | 8 | `riskPct`, `traceability`, `volumeMt` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview', 'Deforestation Risk', 'EUDR Compliance', 'REDD+ Finance', 'Carbon Markets', 'Portfolio Exposure', 'Mitigation'];` |
| `regions` | `['All', ...new Set(COUNTRIES.map(c => c.region))];` |
| `deforestData` | `useMemo(() => [...filteredCountries] .sort((a, b) => b.deforestRateHa - a.deforestRateHa) .slice(0, 10) .map(c => ({ name: c.name.slice(0, 8), deforest: c.deforestRateHa, carbon: +(c.carbonStockMtCO2 / 1000).toFixed(1) })), [filteredCountries]);` |
| `eudrData` | `useMemo(() => EUDR_COMMODITIES.map(c => ({ name: c.name.split(' ')[0], risk: c.riskPct, trace: c.traceability })), []);` |
| `carbonTrend` | `useMemo(() => YEARS.map((yr, i) => ({` |
| `portfolioData` | `useMemo(() => filteredCountries .slice(0, 10) .map(c => ({ name: c.name.slice(0, 8), exposure: +c.exposureMn, score: c.complianceScore })), [filteredCountries]);` |
| `sortedRedd` | `useMemo(() => [...REDD_PROJECTS].sort((a, b) => b[reddSort] - a[reddSort]), [reddSort]);` |
| `totalExposure` | `filteredCountries.reduce((a, c) => a + +c.exposureMn, 0);` |
| `highRiskExposure` | `filteredCountries.filter(c => ['High', 'Critical'].includes(c.eudrRisk)).reduce((a, c) => a + +c.exposureMn, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EUDR_COMMODITIES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Deforestation Rate | — | FAO Global Forest Resources Assessment 2022 | Global net forest loss 4.7 million hectares per year — agriculture drives 73% of tropical deforestation |
| EUDR Revenue at Risk | — | European Commission EUDR Impact Assessment | EU Deforestation Regulation covers €150Bn of commodity imports; non-compliant supply chains banned from 2025 |
| Tropical Forest Carbon Stock | — | IPCC AR6 WGII Chapter 2 | Tropical forests store 250 GtC — equivalent to 25 years of global CO2 emissions |
- **Supplier GPS coordinates + commodity sourcing data** → Deforestation risk overlay → **Supplier-level deforestation risk score by commodity**
- **GFW tree cover loss by jurisdiction** → EUDR compliance mapping → **Revenue at risk from non-compliant supply chain origins**
- **Forest carbon density maps + carbon price curves** → Carbon sink valuation → **Financial value of intact forest by geography**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Financial Exposure
**Headline formula:** `DeforestExposure = Σ [Revenue_commodity × DeforestationRate_country × CarbonLiability + RegulatoryRisk × RevenueAtRisk]; CarbonSinkValue = AreaForest × CarbonDensity × CarbonPrice`

Revenue at risk quantifies EUDR supply chain compliance exposure; carbon sink value captures financial importance of intact forests for Scope 3 corporate nature targets

**Standards:** ['TNFD Recommendations v1.0 2023', 'Global Forest Watch Deforestation Data', 'EU Deforestation Regulation (EUDR) 2023', 'Forest 500 Corporate Assessment']
**Reference documents:** TNFD Recommendations v1.0 (2023); EU Deforestation Regulation (EUDR) 2023/1115; Global Forest Watch Tropical Tree Cover Loss Data; Forest 500 Corporate Assessment 2023; IPCC AR6 WGII Chapter 2 — Terrestrial and Freshwater Ecosystems

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the exposure product and the carbon-sink valuation (analytics ladder: rung 1 → 2)

**What.** §7 flags the core gap: `exposureMn` is a direct PRNG draw ($30–630M) summed and filtered by a hard-coded EUDR risk flag — not the guide's `DeforestExposure = Σ[Revenue × DeforestationRate × CarbonLiability + RegulatoryRisk × RevenueAtRisk]` product — and `carbonStockMtCO2` exists but is never multiplied by a carbon price, so the promised `CarbonSinkValue = Area × Density × Price` is absent along with any TNFD LEAP output. Evolution A implements both formulas on real inputs: country deforestation rates from FAO FRA (already ingested for the sibling `land-use-deforestation` module via `forestData.js`), commodity revenue exposure from user supply-chain inputs, EUDR risk from the Commission's actual Article 29 benchmarking once published (hard-coded intuition until then, labeled), and sink value priced off the platform's live carbon-price feed instead of the synthetic `4 + i·1.5` path.

**How.** (1) A supply-chain intake (company × commodity × origin country × revenue) so "revenue at risk" means the user's revenue, not a draw. (2) The exposure product computed per the §5 formula with each term's source shown; `highRiskExposure` becomes the product summed over high/critical origins. (3) Carbon-sink tab: `carbonStockMtCO2` re-based on FAO/IPCC densities × area, valued at the selected price scenario. (4) `REDD_PROJECTS` re-pointed at the platform's seeded Verra registry data (real project records exist platform-wide) instead of PRNG credits/prices. (5) A TNFD LEAP-structured export assembling the computed fields.

**Prerequisites.** The `sr()` country numerics deleted; commodity risk/traceability figures cited (Trase publishes them); carbon-price feed join. **Acceptance:** exposure decomposes into revenue × rate × liability terms on screen; sink value moves with the price scenario; REDD rows match registry records.

### 9.2 Evolution B — EUDR exposure copilot for supply-chain and lending teams (LLM tier 2)

**What.** A tool-calling analyst for the module's three stated users: "which of our commodity origins trigger EUDR enhanced due diligence and how much revenue sits there?", "what's the carbon-sink value of the Indonesian sourcing landscape at $80/t?", "draft the TNFD LEAP 'Evaluate' section for our soy exposure." Each answer executes the Evolution A exposure/sink routes over the user's entered supply chain.

**How.** Tier 2: tool schemas over the intake and computation routes; regulatory answers quote the EUDR commodity scope and country classification with vintage — EUDR is新 and shifting, so recalled regulation is dangerous; the curated commodity table (Palm 72% risk / 28% traceability etc.) grounds prioritisation logic with its source cited once Evolution A adds citations. LEAP drafting maps computed fields to the Locate/Evaluate/Assess/Prepare structure with data gaps enumerated per phase — TNFD disclosure candour mirrors the honest-nulls convention. Cross-module routing: parcel-level carbon accounting questions go to `land-use-carbon`, counterparty screening to `land-use-deforestation`, with the module boundary stated.

**Prerequisites (hard).** Evolution A (a copilot summing PRNG exposures would invent EUDR liability for named commodity chains); Phase 2 tooling. **Acceptance:** every €/$ figure traces to a tool call over entered supply-chain data; EUDR classifications carry their legal-source vintage; LEAP sections list data gaps explicitly.