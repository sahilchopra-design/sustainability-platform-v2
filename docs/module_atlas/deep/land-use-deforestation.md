## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula `DRSᵢ = ForestLossᵢ × CommodityLinkᵢ ×
> JurisdictionRiskᵢ` — a multiplicative Deforestation Risk Score — **is never computed in code**.
> There is no `DRS` field or calculation anywhere in the page; `eudrRisk` is an independent seeded
> value, not a product of forest-loss, commodity-link, and jurisdiction-risk terms. The guide also
> describes satellite Hansen/GFW alert ingestion and Trase supply-shed attribution — the page has no
> such data pipeline; alerts are synthetic. Sections below document the code as it actually behaves.

### 7.1 What the module computes

30 countries across 8 regions each carry 19 synthetic attributes generated once via `sr(i×k) =
frac(sin(i×k+1)×10⁴)`, keyed to array index `i`. **Four of those 19 fields are then overwritten with
real FAO Forest Resources Assessment (FRA) 2020 data** where a country match exists in
`FAO_FOREST_AREA_2020`:

```js
r.forestCover        = f.forest_cover_pct ?? r.forestCover
r.deforestationKha    = |f.annual_change_rate_pct| × f.forest_area_mha × 10000   // when both present
r.primaryForestLoss    = f.primary_forest_mha / f.forest_area_mha × 100          // when forest_area_mha>0
r.protectedArea        = f.forest_certification_pct ?? r.protectedArea
```

The remaining 15 fields (alerts/month, tree gain, fire alerts, EUDR risk, commodity exposure,
traceability, governance, enforcement, indigenous land, carbon stock, 4 commodity exposure %s, and
`riskRating`) stay purely synthetic.

### 7.2 Parameterisation

| Field | Formula | Provenance |
|---|---|---|
| `deforestationKha` (pre-FAO) | `10 + sr(i×7)×990` | Synthetic; **overwritten by FAO** for matched countries |
| `alertsMonth` | `50 + sr(i×11)×4950` | Synthetic demo value |
| `forestCover` | `20 + sr(i×13)×70` | Synthetic; **overwritten by FAO** `forest_cover_pct` |
| `eudrRisk`, `commodityExposure`, `traceability`, `governance`, `enforcement` | `sr(i×{29,31,37,41,43})` scaled to various 5–90 ranges | Synthetic demo values, no FAO or EU benchmarking-list anchor |
| `riskRating` | tri/penta-band split of **`sr(i×7)`** — the *same seed* used for the raw `deforestationKha` draw | Synthetic; see §7.6 for the resulting logic defect |
| FAO anchor fields | `forest_cover_pct`, `forest_area_mha`, `annual_change_rate_pct`, `primary_forest_mha`, `forest_certification_pct` | **Real** — FAO Global Forest Resources Assessment 2020, via `frontend/src/data/forestData.js` |
| `COMMODITIES` (10 rows) | Static hand-entered % deforestation contribution, volume (Mt), traceability %, EUDR scope flag | Plausible orders-of-magnitude (Palm Oil 28%, Soy 22%, Cattle/Beef 35% deforestation contribution) but not cited to Trase/GFW in code |

### 7.3 Calculation walkthrough

- **Dashboard tab**: KPIs are straight sums/means over the 30-country array
  (`totalDeforest=Σ deforestationKha`, `totalAlerts=Σ alertsMonth`, `avgTrace=mean(traceability)`,
  `critical=count(riskRating∈{Critical,High})`). The Governance Radar averages 6 fields
  (`eudrRisk, traceability, governance, enforcement, protectedArea, commodityExposure`) across all 30
  countries — a portfolio-wide mean, not a per-country weighted score.
- **Country Screening tab**: client-side search/filter/sort/paginate (15 rows/page) over the 30-row
  table; expanding a row shows an 11-field detail panel plus two mini-charts (a 6-axis radar
  re-normalising `protectedArea×2.5` and `carbonStock/2.5` to fit a 0–100 scale, and a 4-commodity
  exposure bar).
- **EUDR Tracker tab**: ranks the top-15 countries by `eudrRisk` descending; renders a badge using
  `badge(100 − eudrRisk, [25,55,75])` — i.e. the badge colour is computed on the **complement** of
  the risk score (100−risk), so a badge threshold table calibrated for a "goodness" metric is reused
  to colour a "riskiness" metric, inverted at the call site to compensate.
- **Commodity Traceability tab**: renders the static `COMMODITIES` table as paired bar (deforestation
  contribution % vs traceability %) and line (volume Mt) charts — no computed ranking or score, pure
  visualisation of hand-entered figures.

### 7.4 Worked example

Brazil (`i=0`): FAO override applies (Brazil is in `FAO_FOREST_AREA_2020`), so `forestCover`,
`deforestationKha`, `primaryForestLoss`, and `protectedArea` all come from real FRA 2020 figures
rather than the synthetic draw. But `riskRating` is **not** FAO-anchored — it still derives from
`sr(0×7) = sr(0) = frac(sin(1)×10000) = frac(8414.7) = 0.7095`. Since `0.7095` falls in the
`sr(i×7) < 0.85` band, Brazil is assigned **`riskRating = 'Moderate'`** — a rating computed from a
throwaway random seed, completely decoupled from Brazil's real (FAO-sourced) deforestation rate
displayed two columns to the left in the same table row.

### 7.5 Companion analytics

- **Alert Trend area chart** — 24 months (2023–2024) of synthetic monthly alerts/deforestation/fire
  counts, `Math.round(5000+sr(i*7)*15000)` etc. — a smooth-looking trend with no actual GFW/Hansen
  ingestion.
- **Risk Distribution pie** — counts of the 5 `riskRating` buckets across all 30 countries; inherits
  the seed-collision issue from §7.6.

### 7.6 Data provenance & limitations

- **Field-naming defects in the FAO overlay** are worth flagging precisely:
  - `primaryForestLoss` is computed as `primary_forest_mha / forest_area_mha × 100` — this is the
    **share of remaining forest that is primary forest**, not a loss rate. A country with a high,
    well-preserved primary-forest share would show a *high* "primaryForestLoss" value under this
    code, which is the opposite of the field's name.
  - `protectedArea` is set from `forest_certification_pct` — FSC/PEFC **certification** coverage is a
    market-based sustainable-sourcing signal, not a **legally protected area** designation; the two
    concepts are conflated.
- **`riskRating` seed collision**: `riskRating` and the pre-override `deforestationKha` both derive
  from `sr(i×7)` with no decorrelation. For any country without a FAO match (14 of the 30 — Bolivia,
  Peru, Malaysia, Myanmar, Cambodia, Laos, Honduras, Nicaragua, Ghana, Liberia, Sierra Leone,
  Mozambique, Papua New Guinea, Paraguay, Guyana per the static list, exact FAO coverage unverified),
  a **higher** synthetic deforestation figure produces a **lower**-severity risk rating (Low/Moderate)
  because the threshold direction is inverted relative to the underlying draw — the opposite of the
  intended risk semantics.
- All alert/fire/traceability/governance/EUDR-risk figures are synthetic; no live Global Forest Watch
  alert feed, Copernicus imagery, or Trase supply-shed attribution is ingested despite being named in
  the guide.
- `COMMODITIES` figures are static and undated — deforestation-attribution percentages for
  palm/soy/cattle should be periodically refreshed against Trase or FAOSTAT.

**Framework alignment:** EU Deforestation Regulation (EUDR 2023/1115) is referenced by the "EUDR
Risk"/"EUDR Scope" fields and tab naming but no actual EU country-benchmarking list (Article 29
high/standard/low classification) is implemented — risk is a synthetic scalar, not a regulatory
classification lookup. FAO FRA 2020 is genuinely and correctly used for 4 of 19 country fields (a
real public-data anchor, consistent with the platform's broader reference-data layer). TNFD LEAP and
Trase are named in the guide but not operationalised.
