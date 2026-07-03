# Biodiversity Credit Market
**Module ID:** `biodiversity-credits` · **Route:** `/biodiversity-credits` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Voluntary biodiversity credit pricing, trading analytics, and ecosystem unit metrics covering habitat banking, species biodiversity units (BDUs), and nature-based solution credits. Integrates TNFD LEAP locate-evaluate outputs, IUCN habitat condition scoring, and UK BNG (Biodiversity Net Gain) metric. Tracks market liquidity, price discovery, and jurisdictional legal frameworks.

> **Business value:** Biodiversity credits are transitioning from voluntary to mandatory mechanisms in multiple jurisdictions. UK mandatory BNG has created the first statutory biodiversity credit market; similar frameworks are emerging in Australia (ACCUs), EU (NBSAP obligations), and Singapore. Investors in development assets face growing BDU procurement obligations that directly affect project economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `HABITAT_DISTINCTIVENESS`, `HABITAT_TYPES`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `_BIO_MAP` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `_HS_MAP` | `Object.fromEntries(BIODIVERSITY_HOTSPOTS.map(d => [d.name, d]));` |
| `baselineUnits` | `parseFloat((areaNum * dist * preC * 0.3).toFixed(2));` |
| `postUnits` | `parseFloat((areaNum * dist * postC * 0.28).toFixed(2));` |
| `bngPct` | `parseFloat(((postUnits - baselineUnits) / Math.max(baselineUnits, 0.01) * 100).toFixed(1));` |
| `habitatBreakdown` | `HABITAT_TYPES.map((h, i) => ({` |
| `composite` | `Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);` |
| `totalVal` | `services.reduce((s, sv) => s + sv.value, 0);` |
| `highLowBar` | `services.map(sv => ({` |
| `disclosureScore` | `Math.round(subTargets.reduce((s, t) => s + t.score, 0) / 6);` |
| `topCredit` | `[...creditTypes].sort((a, b) => b.price - a.price)[0];` |
| `avgPrice` | `Math.round(creditTypes.reduce((s, c) => s + c.price, 0) / creditTypes.length);` |
| `additionalityScore` | `Math.round(seed(141) * 25 + 60);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/biodiversity-credits/bng-metric` | `bng_metric` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/tnfd-disclosure` | `tnfd_disclosure` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/ecosystem-services` | `ecosystem_services` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/gbf-target15` | `gbf_target15` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/credit-quality` | `credit_quality` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/credit-standards` | `ref_credit_standards` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/habitat-tiers` | `ref_habitat_tiers` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/ecosystem-services` | `ref_ecosystem_services` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/biodiversity_credits.py |

### 2.3 Engine `biodiversity_credit_engine` (services/biodiversity_credit_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BiodiversityCreditEngine.assess_bng_metric` | project_data | DEFRA BNG Metric 4.0 — calculate pre/post habitat units, determine whether |
| `BiodiversityCreditEngine.assess_tnfd_disclosure` | entity_data | TNFD v1.0 LEAP process assessment. |
| `BiodiversityCreditEngine.value_ecosystem_services` | project_data | TEEB / SEEA-EA ecosystem service valuation. |
| `BiodiversityCreditEngine.assess_gbf_target15` | entity_data | Kunming-Montreal GBF Target 15 disclosure assessment. |
| `BiodiversityCreditEngine.assess_credit_quality` | credit_data | Biodiversity credit quality assessment: |
| `BiodiversityCreditEngine.run_full_assessment` | entity_data | Orchestrates all sub-assessments and produces a consolidated |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `HABITAT_TYPES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Unit (BDU) | `Area × Condition × Distinctiveness × Connectivity` | UK BNG metric | Standardised measure of biodiversity value per hectare of habitat |
| BNG Credit Price | — | Habitat bank market | Market price per biodiversity unit in registered UK statutory BNG market |
| Net Gain Achievement | `Post – Pre BDU / Pre BDU` | UK EA BNG register | Percentage biodiversity net gain delivered by development project vs pre-development baseline |
- **UK Habitat Bank Registry / IUCN habitat data** → Score each habitat parcel on BNG metric; compute pre- and post-development BDU → **Site-level BDU balance and net gain percentage**
- **Habitat bank market price feeds** → Track BDU spot prices by habitat type; compute portfolio credit valuation → **Market price analytics and portfolio BDU holding valuation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/biodiversity-credits/ref/credit-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['credit_standards', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystem_services', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/habitat-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['habitat_distinctiveness_tiers', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['price_benchmarks', 'count', 'source'], 'n_keys': 3}`

**POST /api/v1/biodiversity-credits/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** BNG biodiversity unit valuation model
**Headline formula:** `BDU = Habitat_area × Condition_score × Distinctiveness_score × Connectivity_multiplier; BNG_net_gain = Post_development_BDU – Pre_development_BDU`
**Standards:** ['UK Environment Act 2021 (BNG)', 'TNFD LEAP v2', 'IUCN Habitat Classification v3.1']

**Engine `biodiversity_credit_engine` — extracted transformation lines:**
```python
distinctiveness_score = (low_s + high_s) / 2.0 if high_s > 0 else 0.0
temporal_factor = min(1.0, legal_agreement_years / 30.0)
net_gain_units = post_units - pre_units
net_gain_pct = (net_gain_units / pre_units * 100.0) if pre_units > 0 else 100.0
mandatory_threshold_units = pre_units * 1.10
saleable_credits = max(0.0, post_units - mandatory_threshold_units)
credit_value_usd = saleable_credits * mid_price
metric_score = min(100.0, p_score * mod)
raw_composite = sum(all_metric_scores) / len(all_metric_scores) if all_metric_scores else 0.0
tnfd_composite = round(raw_composite * 0.8 + leap_score * 100 * 0.2, 2)
value_ha = qty_per_ha * price
total_value = value_ha * area_ha
tev_m = tev_usd / 1_000_000.0
adjusted = min(100.0, completion + boost)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |
| `green-hydrogen-ammonia-carbon` | table:exc |