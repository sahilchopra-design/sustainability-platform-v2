## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** A **rigorous backend engine exists**
> (`eudr_engine.py`) implementing a genuine Article-9 traceability scorecard (geolocation, supplier ID,
> production date, quantity, local-law and deforestation-free evidence — each deducting real points),
> country-risk classification, full due-diligence assessment, and DDS generation. **The
> `EudrEnginePage.jsx` frontend does not call it** — it renders 80 fully seeded suppliers
> (`genSuppliers` via `sr()`), and the guide's headline formula `DRS = P(deforestation)·(1−Traceability)·
> CountryRisk` **is never computed**. The frontend's supplier "score" is a seeded band keyed only to the
> country's risk tier. §7 documents the frontend; §8 the backend it should call.

### 7.1 What the frontend computes

`genSuppliers(80)` fabricates suppliers; the only "risk logic" is a country-tier-conditioned seeded score:

```js
country = allCountries[floor(s2·N)]          // from HIGH / STD / LOW lists
tier    = isHigh ? 'High Risk' : isLow ? 'Low Risk' : 'Standard Risk'
score   = isHigh ? floor(sr(i·31+5)·30 + 10)    // 10–40
        : isLow  ? floor(sr(i·37+9)·20 + 75)    // 75–95
        :          floor(sr(i·41+13)·30 + 40)   // 40–70
articles = ARTICLES.filter((_,ai)=> sr(i·43+ai·7) > 0.35)   // random article coverage
geoVerified = sr(i·53+7) > 0.4;  certified = sr(i·59+11) > 0.5
```

Aggregates: `avgScore = mean(score)`, `compliant = count(score ≥ 70)`, tier counts, and per-commodity /
per-article coverage tables — all over the seeded set.

The **country tier lists are real** (EU benchmarking direction): HIGH = Brazil, Indonesia, DRC, Ivory
Coast…; LOW = Germany, France, US, Australia, Canada… So the *ordering* of risk by geography is correct;
the per-supplier numbers are not.

### 7.2 Parameterisation & provenance

| Element | Rows | Provenance |
|---|---|---|
| `COMMODITIES` | 7 | **Real** EUDR Annex I set: cattle, cocoa, coffee, oil palm, rubber, soya, wood |
| Country tiers (HIGH/STD/LOW) | 8/8/8 | Realistic direction; the EU's actual benchmarking (Reg. 2024/3084) is High/Standard/Low — matches the code's three-tier scheme |
| `EVIDENCE_TYPES` | 8 | Real EUDR evidence categories (geolocation polygon, satellite, FSC/RSPO cert, land registry, CoC) |
| `ARTICLES` | 8 | **Real** EUDR articles (Art 4-5 operator obligations, Art 6 info, Art 9 geolocation, Art 10 risk assessment, Art 11 mitigation, Art 12 simplified DD, Art 4(2) DDS, Art 29 benchmarking) |
| Supplier scores/flags | 80 | **Synthetic** `sr()` |
| DRS composite | — | **Not computed** |

### 7.3 Calculation walkthrough (frontend)

1. `genSuppliers(80)` assigns each supplier a commodity, country, tier, and seeded score.
2. Tab 1 filters/sorts and shows KPIs (`avgScore`, `compliant`, tier counts).
3. Tab 2 (Commodity Screener) and Tab 3 (Country Benchmarking) aggregate the same seeded suppliers by
   commodity / country, with `govScore`/`deforestRate` display fields.
4. Tab 4 (Traceability) counts `evidenceItems` per evidence type — seeded.

There is **no** deforestation-probability calculation, no polygon×forest-loss intersection, no
traceability deduction logic in the frontend.

### 7.4 Worked example (supplier i = 5)

| Step | Computation | Result |
|---|---|---|
| s2 = sr(5·13+7) = sr(72) | frac(sin(73)·10⁴) | ≈ 0.30 |
| country index | floor(0.30·24) | 7 → within HIGH list (e.g. "Cameroon") |
| tier | isHigh | High Risk |
| score | floor(sr(160)·30 + 10) | ≈ floor(0.6·30+10) = 28 |
| compliant? | 28 ≥ 70 | No |

So a high-risk-country supplier scores 28 → flagged non-compliant. The score follows the country tier
(good direction) but carries no information about the supplier's *actual* geolocation coverage or forest
overlap — the two things EUDR actually requires.

### 7.5 Data provenance & limitations

- **All supplier data is synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). Commodity list, country tiers,
  evidence types, and article list are real; the scores attached are not.
- **No DRS computation** despite the guide — no deforestation probability, no traceability factor, no
  polygon analysis. Score = seeded band by country tier only.
- **Country benchmarking `govScore`/`deforestRate`** are display fields, not sourced from GFW/Hansen.
- The genuine article-by-article traceability scorer lives in `eudr_engine.py` and is not invoked.

**Framework alignment:** Content references **Regulation (EU) 2023/1115 (EUDR)** correctly — the 7
Annex-I commodities, the enforcement date (30 Dec 2025 for large operators), the three-tier country
benchmarking (Reg. 2024/3084), and the Article-9 evidence categories. The intended-but-absent computation
is the guide's satellite-based DRS (Hansen/Global Forest Watch forest-loss intersection × traceability).

## 8 · Model Specification

**Status: specification — not yet wired into the frontend (backend engine exists).** Route supplier
plot data through `eudr_engine.verify_traceability` / `assess_due_diligence` / `generate_dds` and add a
satellite deforestation-risk layer.

**8.1 Purpose & scope.** Produce a plot- and batch-level EUDR compliance determination (traceability
score, deforestation risk, DDS eligibility) for the 7 regulated commodities, gating placement on the EU
market.

**8.2 Conceptual approach.** Two blocks: (a) the **Article-9 traceability scorecard** exactly as in the
backend engine — deductions for missing geolocation/supplier/date/quantity/local-law/deforestation-free
evidence; (b) a **satellite deforestation-risk block** intersecting plot polygons with Hansen/GFW
post-2020 forest-loss rasters, mirroring Trase/Sourcemap and the guide's DRS. This is the design of
compliance platforms like Meridia, Prewave, and Satelligence.

**8.3 Mathematical specification.**

```
Traceability (Art 9, backend engine):
  score = 100
   − 25 if no geolocation      (Art 9(1)(c)-(d))
   − 10 if plot >4ha and point (not polygon)   (Art 9(1)(d))
   − 15 if supplier not identified   (Art 9(1)(f))
   − 10 if no production date        (Art 9(1)(e))
   − 10 if quantity ≤ 0              (Art 9(1)(b))
   − 15 if no local-law evidence     (Art 9(1)(h))
   − 25 if no deforestation-free evidence  (Art 9(1)(g))
  traceability_score = max(0, score)/100

Deforestation risk (new layer):
  forestLoss_ha = area(plot_polygon ∩ Hansen_loss_post_2020)
  P_defor       = forestLoss_ha / plot_area_ha
  DRS = P_defor · (1 − traceability_score) · CountryRisk        (guide formula)
Gate: enhanced DD required ⇔ DRS > 0.6; DDS blocked ⇔ traceability_score < 1 or DRS high
```

| Parameter | Source |
|---|---|
| Deduction weights | EUDR Article 9 (codified in `eudr_engine.py`) |
| Forest-loss raster | Hansen Global Forest Change / Global Forest Watch (post-2020) |
| Country risk tier | EU benchmarking Reg. 2024/3084 (High/Standard/Low) |
| Plot polygons | Supplier GeoJSON/KML, cadastral validation |

**8.4 Data requirements.** Plot GPS polygons (or points ≤4ha), supplier name/address, production date,
quantity, local-law and deforestation-free evidence, commodity/HS code. Platform has the backend engine
and country benchmarks; needs a geospatial service (polygon×raster intersection) for the DRS layer.

**8.5 Validation & benchmarking plan.** Test the traceability scorer against worked EUDR compliance
cases (each deduction fires correctly); validate polygon-loss intersection against GFW-published loss
for known plots; reconcile country tiers against the EU's published benchmarking list.

**8.6 Limitations & model risk.** Satellite forest-loss has commission/omission error near plot
boundaries — buffer polygons and report confidence. Point geolocation on small plots limits spatial
precision. Conservative fallback: any missing Article-9 evidence → traceability < 100 → DDS not
submittable until remediated.
