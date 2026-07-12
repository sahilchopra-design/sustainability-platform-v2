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
