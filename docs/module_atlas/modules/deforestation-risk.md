# Deforestation Risk Analytics
**Module ID:** `deforestation-risk` · **Route:** `/deforestation-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Commodity-linked deforestation risk for 8 forest-risk commodities. Covers EUDR compliance, satellite monitoring, supply chain exposure, and No Deforestation, No Peat, No Exploitation (NDPE) policy tracking.

> **Business value:** Deforestation drives 10-15% of global GHG emissions and is a Scope 3 material risk for food, retail, and finance sectors. The EUDR creates direct legal risk for EU-market companies. This module provides EUDR compliance infrastructure and supply chain deforestation risk management.

**How an analyst works this module:**
- Commodity Exposure shows portfolio supply chain exposure by commodity
- Country Risk Map shows deforestation hotspots and risk ratings
- EUDR Compliance Checker applies 5-step due diligence
- NDPE Policy Tracker shows which suppliers have NDPE commitments
- Satellite Monitor shows forest cover change alerts in supply chain

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_RISK`, `Card`, `DEFORESTATION_COMMODITIES`, `DEFORESTATION_TREND`, `EUDR_CHECKLIST`, `KpiCard`, `PIE_COLORS`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFORESTATION_COMMODITIES` | 8 | `name`, `icon`, `risk_score`, `primary_countries`, `area_loss_mha`, `sectors_exposed`, `supply_chain_depth`, `color` |
| `COUNTRY_RISK` | 14 | `name`, `forest_loss_kha`, `governance_score`, `eudr_benchmarked`, `commodities` |
| `EUDR_CHECKLIST` | 11 | `requirement`, `article`, `criticality` |
| `DEFORESTATION_TREND` | 12 | `palm_oil`, `soy`, `cattle`, `cocoa`, `coffee`, `rubber`, `timber`, `total` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_FAO_MAP` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `_COMM_DEF_MAP` | `Object.fromEntries(COMMODITY_DEFORESTATION_RISK.map(d => [`${d.commodity}::${d.country}`, d]));` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `avgRisk` | `exposedCommodities.reduce((s, c) => s + c.risk_score, 0) / exposedCommodities.length;` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map(c => { const exposure = scoreDeforestationExposure(c);` |
| `avgScore` | `scoredHoldings.length > 0 ? Math.round(scoredHoldings.reduce((s, h) => s + h.score, 0) / scoredHoldings.length) : 0;` |
| `exposedPct` | `scoredHoldings.length > 0 ? Math.round((scoredHoldings.filter(h => h.score > 20).length / scoredHoldings.length) * 100) : 0;` |
| `totalForestLoss` | `DEFORESTATION_COMMODITIES.reduce((s, c) => s + c.area_loss_mha, 0);` |
| `portfolioForestLoss` | `scoredHoldings.reduce((s, h) => {` |
| `heatmapData` | `useMemo(() => { const sectors = [...new Set(scoredHoldings.map(h => h.sector).filter(Boolean))].slice(0, 10);` |
| `row` | `{ sector: sector.length > 16 ? sector.substring(0, 14) + '..' : sector };` |
| `engagementRecs` | `useMemo(() => { return scoredHoldings.filter(h => h.score >= 50).slice(0, 10).map(h => { const actions = [];` |
| `rows` | `scoredHoldings.map(h => [` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `data` | `{ exportDate: new Date().toISOString(), holdings: scoredHoldings.map(h => ({ name: h.name \|\| h.ticker, sector: h.sector, score: h.score, commodities: h.commodities, eudrApplicable: h.eudrApplicable, tier: h.tier })), eud` |
| `attributed` | `exposure.reduce((s, h) => s + c.area_loss_mha * (h.weight \|\| 0.01), 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_RISK`, `DEFORESTATION_COMMODITIES`, `DEFORESTATION_TREND`, `EUDR_CHECKLIST`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest-Risk Commodities | — | EUDR | Cattle, cocoa, coffee, palm oil, soya, wood, rubber + derivatives |
| EUDR Deadline | — | EU Regulation | Dec 2025 for SMEs |
| High-Risk Countries | — | GFW | Countries with high deforestation exposure |
- **Supply chain sourcing data** → Country and commodity mapping → **Deforestation exposure**
- **GFW satellite data** → Forest cover change detection → **EUDR compliance alert**
- **EUDR due diligence** → Geolocation verification → **Deforestation-free declaration**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation risk scoring
**Headline formula:** `DefoRisk = SourceCountry_risk × Commodity_sensitivity × ProducerVerification`

EUDR: applies to cattle, cocoa, coffee, palm oil, soya, wood, rubber (and derivatives) entering EU market from Dec 2024. Due diligence: geolocation of production lots + deforestation-free statement. Risk countries: Brazil, Indonesia, DRC, Cameroon, Bolivia.

**Standards:** ['EU Deforestation Regulation', 'GFW Global Forest Watch', 'RSPO', 'RTRS']
**Reference documents:** EU Deforestation Regulation (EUDR) 2023/1115; Global Forest Watch; RSPO Principles and Criteria; TNFD Sector Guidance for Food, Agriculture, Forestry

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements the guide's deforestation scoring — `DefoRisk = SourceCountry_risk ×
Commodity_sensitivity × ProducerVerification` — as a **commodity-sector exposure score anchored to
real FAO FRA 2020 forest data**. It is mostly a genuine analytic: the commodity/country risk tables
are curated real EUDR data, and country forest metrics are overlaid from `FAO_FOREST_AREA_2020`. The
per-holding score is a simplified two-factor version of the guide formula (country-risk enters as a
binary high-risk multiplier, not a continuous factor). No ⚠️ mismatch, but §7.1 notes the
simplification.

### 7.1 What the module computes

```js
scoreDeforestationExposure(company):
  exposed = DEFORESTATION_COMMODITIES.filter(c => c.sectors_exposed.includes(company.sector))
  if none → {score: 5, eudrApplicable:false, tier:'N/A'}
  avgRisk = mean(exposed.risk_score)
  hasHighRiskCountry = exposed.some(c => c.primary_countries ∩ {BR, ID, CG})
  score = min(100, round(avgRisk × (hasHighRiskCountry ? 1.1 : 0.8)))
  eudrApplicable = sector ∈ {Consumer Staples, Materials}
```

Portfolio aggregates: `avgScore`, `exposedPct` (share with score > 20), and `portfolioForestLoss`
(commodity area-loss attributed by holding weight). The country layer merges FAO FRA 2020 real metrics
(`forest_cover_pct`, `annual_deforestation_rate_pct`, `primary_forest_pct`) onto the curated
`COUNTRY_RISK` rows.

### 7.2 Parameterisation

| Commodity | risk_score | area_loss_mha | primary countries | EUDR |
|---|---|---|---|---|
| Palm Oil | 92 | 4.2 | ID, MY, NG | ✔ |
| Cattle/Beef | 88 | 5.5 | BR, AR, AU | ✔ |
| Soy | 85 | 3.8 | BR, AR, PY | ✔ |
| Cocoa | 78 | 1.2 | CI, GH, ID | ✔ |
| Rubber | 75 | 1.5 | TH, ID, VN | ✔ |
| Coffee | 72 | 0.8 | BR, VN, CO | ✔ |
| Timber | 68 | 2.8 | BR, CG, ID | ✔ |

Country risk (13 rows) carries real forest-loss (Brazil 1,695 kha, Indonesia 824 kha, DRC 512 kha),
governance scores, and EUDR benchmark tier (High/Standard/Low). The high-risk multiplier set is
`{BR, ID, CG}` (Brazil/Indonesia/DR-Congo — the three largest tropical-forest nations). The 10-item
EUDR checklist maps each requirement to its Regulation 2023/1115 article (Art. 3 cutoff, Art. 9
geolocation, Art. 10 risk assessment).

### 7.3 Calculation walkthrough

Each holding's sector selects the exposed commodities (via `sectors_exposed`); `avgRisk` is their mean
risk_score; the high-risk-country flag applies a ×1.1 uplift or ×0.8 discount; score caps at 100.
`eudrApplicable` is set for Consumer Staples / Materials sectors. Portfolio forest-loss attribution
sums each commodity's `area_loss_mha × holding weight`. The trend and heatmap tabs use the real
2015–2025 `DEFORESTATION_TREND` (declining totals 1,980 → 1,589 kha) and per-sector exposure grids.

### 7.4 Worked example

A **Consumer Staples** holding (weight 2%):
- Exposed commodities = Palm Oil (92), Soy (85), Cattle (88), Cocoa (78), Coffee (72) → `avgRisk =
  (92+85+88+78+72)/5 = 415/5 = 83.0`.
- High-risk country? Palm Oil→ID, Soy→BR, Cattle→BR, Cocoa→ID, Coffee→BR → yes → ×1.1.
- `score = min(100, round(83.0 × 1.1)) = round(91.3) = 91` → tier from Palm Oil's `Tier 2-3`,
  `eudrApplicable = true`.
- Forest-loss attribution: `Σ area_loss × 0.02` = `(4.2+3.8+5.5+1.2+0.8)·0.02 = 15.5·0.02 = 0.31 Mha`
  attributed to this holding.

A **Health Care** holding matches no commodity → `score = 5`, EUDR N/A.

### 7.5 Data provenance & limitations

- Commodity/country risk tables and the EUDR checklist are **curated real data**; country forest
  metrics are anchored to **FAO FRA 2020** (real). The `seed()` PRNG is defined but only lightly used
  (heatmap/engagement decoration); scores are deterministic from the curated tables.
- The score is a **simplification** of the guide formula: country risk enters as a binary ×1.1/×0.8
  multiplier keyed only to {BR, ID, CG}, not a continuous `SourceCountry_risk` factor, and
  `ProducerVerification` is absent (no supplier-level NDPE/certification input reaches the score).
- Sector→commodity mapping is coarse (all Consumer Staples get the same commodity basket); real EUDR
  exposure needs SKU/supplier-level sourcing data.

**Framework alignment:** EU Deforestation Regulation (EUDR) 2023/1115 — the 7 commodities, the Dec-31-
2020 deforestation-free cutoff, and the Art. 9/10 geolocation + due-diligence-statement requirements
are implemented as the compliance checklist. Global Forest Watch (WRI) and FAO FRA 2020 supply the
forest-loss/cover data. TNFD sector guidance for Food/Agriculture/Forestry frames the nature-risk
dependency; RSPO/RTRS certification would be the `ProducerVerification` input a production version
should ingest.

## 9 · Future Evolution

### 9.1 Evolution A — Continuous country risk and the missing verification factor (analytics ladder: rung 2 → 3)

**What.** §7 assesses this as "mostly a genuine analytic": curated real EUDR
commodity/country tables, real FAO FRA 2020 forest metrics overlaid, an
article-mapped 10-item EUDR checklist, and a deterministic exposure score — with
two documented simplifications: country risk enters as a binary ×1.1/×0.8
multiplier keyed only to {BR, ID, CG} rather than the continuous
`SourceCountry_risk` factor, and `ProducerVerification` is absent (no supplier
NDPE/certification input reaches the score despite the guide's three-factor
formula). Sector→commodity mapping is coarse. Evolution A completes the formula.

**How.** (1) Continuous country factor: score each origin country from its own
curated row (deforestation rate, governance, EUDR benchmark tier — the data is
already on the page) instead of the three-country binary, so Paraguay-soy and
Ghana-cocoa risk differentiate properly. (2) Verification factor: supplier-level
NDPE commitment and RSPO/RTRS certification inputs (entered or imported) discount
the score per a documented rubric — the guide's third factor, and the input §7.5
explicitly says a production version should ingest. (3) Mapping refinement:
holdings carry commodity-exposure weights (revenue share where disclosed) rather
than flat sector baskets. (4) Benchmark: the EUDR country-benchmark tiers the EU
publishes become the calibration check for the computed country factor — rung 3's
external anchor. (5) Coordinate with `commodity-deforestation`'s GFW-ingest
evolution: one forest-loss data layer, two scoring consumers.

**Prerequisites.** Supplier certification data entry/import; the shared GFW/FAO
layer; rubric documentation. **Acceptance:** two same-commodity holdings with
different origin countries score differently via the continuous factor; adding a
verified RSPO supplier visibly discounts the score per the rubric; computed
country tiers correlate with the EU's published benchmarks.

### 9.2 Evolution B — EUDR due-diligence checklist walker (LLM tier 1)

**What.** The module's article-mapped checklist (Art. 3 cutoff, Art. 9
geolocation, Art. 10 risk assessment) is the right skeleton for the guided
workflow operators need: "walk me through EUDR readiness for our cocoa line."
Evolution B does the walk: item by item, what the article requires, what evidence
the operator has (from the checklist state and, post-Evolution A, the supplier
verification records), what's missing, and the risk-classification consequence —
producing the gap summary a compliance officer takes to procurement, with every
requirement quoted from Regulation 2023/1115.

**How.** Tier-1 RAG: the regulation text (shared corpus with
`commodity-deforestation` and `conflict-minerals` — the supply-chain DD family),
the checklist state, and the computed exposure scores as context. Division of
labor with the sibling module is explicit: `commodity-deforestation` evolves the
statement drafter; this module owns the readiness walk — the copilots should
cross-reference, not duplicate.

**Prerequisites.** Regulation text embedded; Evolution A for
verification-evidence answers. **Acceptance:** each walk item quotes its article;
gap findings match the checklist's actual unmet state; commodity-scope questions
(is rubber derivative X covered?) answer from Annex I text, not recall.