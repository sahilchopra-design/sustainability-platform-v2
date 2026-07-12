# EUDR Compliance Engine
**Module ID:** `eudr-engine` · **Route:** `/eudr-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates EU Deforestation Regulation compliance workflows including due diligence statement preparation, geolocation data management, supply chain traceability, and risk classification. Covers all seven EUDR-regulated commodities: cattle, cocoa, coffee, palm oil, soya, wood, and rubber, plus derived products. Supports operators and traders in meeting EUDR obligations from December 2024 under Regulation (EU) 2023/1115.

> **Business value:** Enables operators and traders placing forest-risk commodities on the EU market to achieve and demonstrate EUDR compliance at scale, avoiding market access suspension and regulatory fines while building a durable, satellite-verified supply chain traceability infrastructure.

**How an analyst works this module:**
- Onboard commodity suppliers with GPS polygon data for all production plots; verify against cadastral records.
- Run deforestation risk assessment using GFW satellite forest loss data for each plot polygon after the 2020 cut-off date.
- Generate due diligence statement drafts for each commodity batch; review risk flags and enhanced DD requirements.
- Submit DDS to the EU EUDR Information System and maintain 5-year record retention in the compliance archive.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `COMMODITIES`, `COMMODITY_COLORS`, `COMMODITY_TO_KEY`, `COUNTRIES_HIGH`, `COUNTRIES_LOW`, `COUNTRIES_STD`, `COUNTRY_TO_ISO2`, `CommodityScreener`, `CountryBenchmarking`, `DueDiligenceAssessment`, `EUDR_API`, `EVIDENCE_TYPES`, `SUPPLIERS`, `TIERS`, `TIER_COLORS`, `TraceabilityStatements`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EUDR_API` | `'http://localhost:8001/api/v1/eudr';` |
| `EVIDENCE_TYPES` | `['Geolocation Polygon','Satellite Imagery','Certification (FSC/RSPO/RFA)','Government Land Registry','Third-Party Audit Report','Supplier Declaration','Chain of Custody Certificate','GPS Track Record'];` |
| `ARTICLES` | `['Art 4-5: Operator Obligations','Art 6: Information Requirements','Art 9: Geolocation Data','Art 10: Risk Assessment','Art 11: Risk Mitigation','Art 12: Simplified DD','Art 4(2): DDS Statement','Art 29: Benchmarking'];` |
| `commodity` | `COMMODITIES[Math.floor(s*COMMODITIES.length)];` |
| `country` | `allCountries[Math.floor(s2*allCountries.length)];` |
| `score` | `isHigh?Math.floor(sr(i*31+5)*30+10):isLow?Math.floor(sr(i*37+9)*20+75):Math.floor(sr(i*41+13)*30+40);` |
| `articles` | `ARTICLES.filter((_,ai)=>sr(i*43+ai*7)>0.35);` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `avgScore` | `Math.round(SUPPLIERS.reduce((a,s)=>a+s.score,0)/ Math.max(1, SUPPLIERS.length));` |
| `articleCoverage` | `ARTICLES.map((art,ai)=>({name:art.split(':')[0],covered:SUPPLIERS.filter(s=>s.articles.includes(art)).length,pct:Math.round(SUPPLIERS.filter(s=>s.articles.includes(art)).length/ Math.max(1, SUPPLIERS.length)*100)}));` |
| `comData` | `COMMODITIES.map((com,ci)=>{` |
| `qTrend` | `Array.from({length:8},(_,i)=>({q:`Q${(i%4)+1}-${2023+Math.floor(i/4)}`,score:Math.floor(sr(COMMODITIES.indexOf(selCom)*31+i*7)*30+55)}));` |
| `barData` | `countries.map(c=>({name:c.name,govScore:c.govScore,tier:c.tier,deforestRate:+(c.deforestRate*100).toFixed(1)}));` |
| `evidenceItems` | `EVIDENCE_TYPES.map((et,i)=>({type:et,count:Math.floor(sr(i*61+13)*120+10),pct:Math.floor(sr(i*67+7)*80+10)}));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eudr/commodity-screening` | `screen_commodity` | api/v1/routes/eudr.py |
| POST | `/api/v1/eudr/country-risk` | `classify_country_risk` | api/v1/routes/eudr.py |
| POST | `/api/v1/eudr/traceability-check` | `verify_traceability` | api/v1/routes/eudr.py |
| POST | `/api/v1/eudr/due-diligence` | `assess_due_diligence` | api/v1/routes/eudr.py |
| POST | `/api/v1/eudr/compliance-gap` | `analyse_compliance_gaps` | api/v1/routes/eudr.py |
| POST | `/api/v1/eudr/due-diligence-statement` | `generate_dds` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/commodities` | `ref_commodities` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/country-benchmarks` | `ref_country_benchmarks` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/enforcement-timeline` | `ref_enforcement_timeline` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/certifications` | `ref_certifications` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/requirements` | `ref_requirements` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/eudr.py |
| GET | `/api/v1/eudr/ref/hs-codes` | `ref_hs_codes` | api/v1/routes/eudr.py |

### 2.3 Engine `eudr_engine` (services/eudr_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUDREngine.screen_commodity` | product_name, hs_code | Screen a product by HS code to determine EUDR scope. |
| `EUDREngine.classify_country_risk` | country_iso2, commodity | Classify country risk tier under Article 29. |
| `EUDREngine.verify_traceability` | operator_id, commodity, geolocation_provided, geolocation_type, plot_area_ha, supplier_name, supplier_address, production_date | Verify supply chain traceability per Article 9. |
| `EUDREngine.assess_due_diligence` | operator_id, operator_name, operator_type, commodities, countries_of_origin, certifications, geolocation_provided, geolocation_type | Full due diligence assessment per Articles 4-12. |
| `EUDREngine.analyse_compliance_gaps` | operator_id, dd_result | Produce detailed compliance gap analysis with remediation plan. |
| `EUDREngine.generate_dds` | dd_result | Generate Due Diligence Statement per Article 4(2). |
| `EUDREngine._generate_recommendations` | dd_level, gaps, certifications, max_risk_tier, geolocation_provided, satellite_monitoring |  |
| `EUDREngine._gap_to_remediation` | gap | Map a gap to a remediation action and estimated weeks. |
| `EUDREngine.get_commodities` |  | Return EUDR commodity definitions (Annex I). |
| `EUDREngine.get_country_benchmarks` |  | Return country risk tier benchmarks (Art 29). |
| `EUDREngine.get_enforcement_timeline` |  | Return EUDR enforcement timeline milestones. |
| `EUDREngine.get_certification_schemes` |  | Return recognised certification schemes. |
| `EUDREngine.get_due_diligence_requirements` |  | Return due diligence requirement definitions by article. |
| `EUDREngine.get_cross_framework_map` |  | Return EUDR ↔ ESRS E4 / EU Taxonomy / GRI cross-reference. |
| `EUDREngine.get_hs_code_lookup` |  | Return HS code → commodity mapping for quick lookup. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ARTICLES`, `COMMODITIES`, `COMMODITY_COLORS`, `COUNTRIES_HIGH`, `COUNTRIES_LOW`, `COUNTRIES_STD`, `EVIDENCE_TYPES`, `TABS`, `TIERS`, `TIER_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geolocation Coverage (%) | — | EUDR Article 9 | Proportion of commodity volume with verified GPS polygon data to plot level; 100% required for legal EUDR compliance. |
| Deforestation Risk Score (0â€“1) | — | GFW/Hansen Data | Probability-based deforestation exposure score; above 0.6 triggers enhanced due diligence obligation. |
| Supply Chain Traceability Depth | — | Trase/Sourcemap | Deepest supply chain tier with verified origin data; Tier 1 only is insufficient for EUDR high-risk country compliance. |
| DDS Submission Rate (%) | — | EUDR Due Diligence Statements | Proportion of regulated commodity batches with submitted and accepted DDS in the EU Information System; 100% required pre-placing on market. |
- **GPS polygon data from suppliers (GeoJSON/KML)** → Validate geometry against cadastral boundaries; check for overlaps with forest areas and protected zones → **Verified plot polygons with forest overlay score**
- **Hansen/GFW forest cover loss tiles (annual)** → Intersect plot polygons with post-2020 forest loss raster; compute deforested area and percentage → **Plot-level deforestation risk score and forest loss area (ha)**
- **Supply chain transaction records (commodity batches)** → Link batch volumes to originating plots; compute batch-weighted DRS; generate DDS draft → **DDS package with risk assessment, traceability evidence, and submission status**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRS = P(deforestation) × (1 − Traceability) × CountryRisk`

Deforestation probability is estimated from satellite-based forest loss data (Hansen/GFW) within the polygon of origin. Traceability factor is the proportion of the supply chain with GPS-level geolocation data verified to plot level. Country risk is the EU Commission benchmark classification (Standard/High). DRS above 0.6 requires enhanced due diligence before a due diligence statement can be submitted.

**Standards:** ['EU Regulation 2023/1115 (EUDR)', 'Global Forest Watch 2024', 'Trase Supply Chain Transparency']
**Reference documents:** EU Regulation 2023/1115 on Deforestation-free Products; EU Commission EUDR Guidance Document 2024; Global Forest Watch â€” Hansen Tree Cover Loss Data 2024; Trase Supply Chain Transparency Platform 2024; ZSL SPOTT Supply Chain Transparency Tracker

**Engine `eudr_engine` — extracted transformation lines:**
```python
days_until = (deadline_date - date.today()).days
information_score = sum(info_scores) / len(info_scores) if info_scores else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Plot-level persistence and real satellite forest-loss checks (analytics ladder: rung 2 → 3)

**What.** The backend is a genuine EUDR vertical: HS-code scope screening, Article 29 country-tier classification, Article 9 traceability verification, full Articles 4–12 due-diligence assessment with gap-to-remediation mapping, and DDS generation — 13 endpoints with strong ref data (HS lookup, certification schemes, cross-framework map). Two gaps: the page's supplier table is `sr()`-seeded (scores, article coverage, quarterly trends, evidence counts), and the overview's core promise — "deforestation risk assessment using GFW satellite forest loss data for each plot polygon after the 2020 cut-off" — has no implementation: the engine accepts `geolocation_provided` as a boolean, not polygons.

**How.** (1) Persistence: `eudr_operators`, `eudr_plots` (PostGIS polygons — the digital-twin stack again), `eudr_dds_archive` (5-year retention per the regulation, which *requires* persistence — LocalStorage is non-compliant by design). (2) The satellite check: Global Forest Watch's GLAD/UMD tree-cover-loss data is free via API — intersect each plot polygon with post-2020 loss pixels, producing a per-plot deforestation flag with loss area and year; this upgrades `verify_traceability` from boolean-trust to evidence-checked, the module's rung-3 calibration moment. (3) The page's seeded SUPPLIERS table becomes real operator records; article-coverage charts compute from stored DD assessments. (4) Country benchmarks track the Commission's actual Article 29 classifications as they publish, dated.

**Prerequisites.** GFW API terms and rate limits; polygon-ingestion UX (GeoJSON upload); cut-off-date logic reviewed (Dec 31 2020, plot-level). **Acceptance:** a fixture polygon over a known post-2020 clearing flags with loss area matching GFW's portal; DDS records persist and retrieve after 5 simulated years; zero `sr()` in supplier data.

### 9.2 Evolution B — DDS preparation copilot for operators (LLM tier 2)

**What.** EUDR's operational burden is batch-level: every consignment needs a due-diligence statement backed by plot data, risk assessment, and mitigation records. A tool-calling copilot that walks an operator through it: screens the product (`POST /commodity-screening` via HS code), checks each source plot's satellite flag and country tier, runs the DD assessment, explains any enhanced-DD triggers with their article citations (the engine already maps gaps to remediation actions and timelines), and generates the DDS draft (`POST /due-diligence-statement`) for review before EU Information System submission.

**How.** Tools: the module's 13 existing endpoints plus Evolution A's plot queries — the engine's article-cited outputs make it exceptionally narrable. The copilot's boundaries: flagged plots cannot be talked out of their flags (the satellite check is authoritative; the copilot explains remediation, never negotiates evidence); DDS submission is a gated action; "negligible risk" conclusions quote the engine's assessment, not the model's judgment. Batch questions ("can we ship this cocoa lot?") resolve to the specific plots' and country's stored statuses.

**Prerequisites (hard).** Evolution A — a DDS copilot without plot persistence and real forest-loss checks would help operators generate confident statements about unverified supply chains, the regulation's exact failure mode. **Acceptance:** a golden consignment's walkthrough matches scripted endpoint calls; a deforestation-flagged plot always blocks the negligible-risk conclusion with the flag cited; every article reference in explanations matches the engine's own citations.