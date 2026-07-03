# EUDR Compliance Engine
**Module ID:** `eudr-engine` · **Route:** `/eudr-engine` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates EU Deforestation Regulation compliance workflows including due diligence statement preparation, geolocation data management, supply chain traceability, and risk classification. Covers all seven EUDR-regulated commodities: cattle, cocoa, coffee, palm oil, soya, wood, and rubber, plus derived products. Supports operators and traders in meeting EUDR obligations from December 2024 under Regulation (EU) 2023/1115.

> **Business value:** Enables operators and traders placing forest-risk commodities on the EU market to achieve and demonstrate EUDR compliance at scale, avoiding market access suspension and regulatory fines while building a durable, satellite-verified supply chain traceability infrastructure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `COMMODITIES`, `COMMODITY_COLORS`, `COUNTRIES_HIGH`, `COUNTRIES_LOW`, `COUNTRIES_STD`, `CommodityScreener`, `CountryBenchmarking`, `DueDiligenceAssessment`, `EVIDENCE_TYPES`, `SUPPLIERS`, `TIERS`, `TIER_COLORS`, `TraceabilityStatements`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `EVIDENCE_TYPES` | `['Geolocation Polygon','Satellite Imagery','Certification (FSC/RSPO/RFA)','Government Land Registry','Third-Party Audit Report','Supplier Declaration'` |
| `ARTICLES` | `['Art 4-5: Operator Obligations','Art 6: Information Requirements','Art 9: Geolocation Data','Art 10: Risk Assessment','Art 11: Risk Mitigation','Art ` |
| `commodity` | `COMMODITIES[Math.floor(s*COMMODITIES.length)];` |
| `country` | `allCountries[Math.floor(s2*allCountries.length)];` |
| `score` | `isHigh?Math.floor(sr(i*31+5)*30+10):isLow?Math.floor(sr(i*37+9)*20+75):Math.floor(sr(i*41+13)*30+40);` |
| `articles` | `ARTICLES.filter((_,ai)=>sr(i*43+ai*7)>0.35);` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `avgScore` | `Math.round(SUPPLIERS.reduce((a,s)=>a+s.score,0)/ Math.max(1, SUPPLIERS.length));` |
| `articleCoverage` | `ARTICLES.map((art,ai)=>({name:art.split(':')[0],covered:SUPPLIERS.filter(s=>s.articles.includes(art)).length,pct:Math.round(SUPPLIERS.filter(s=>s.arti` |
| `comData` | `COMMODITIES.map((com,ci)=>{` |
| `avgScore` | `sups.length?Math.round(sups.reduce((a,s)=>a+s.score,0)/sups.length):0;` |
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
| `EUDREngine.verify_traceability` | operator_id, commodity, geolocation_provided, geolocation_type, plot_area_ha, supplier_name | Verify supply chain traceability per Article 9. |
| `EUDREngine.assess_due_diligence` | operator_id, operator_name, operator_type, commodities, countries_of_origin, certifications | Full due diligence assessment per Articles 4-12. |
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
| Geolocation Coverage (%) | — | EUDR Article 9 | Proportion of commodity volume with verified GPS polygon data to plot level; 100% required for legal EUDR comp |
| Deforestation Risk Score (0â€“1) | — | GFW/Hansen Data | Probability-based deforestation exposure score; above 0.6 triggers enhanced due diligence obligation. |
| Supply Chain Traceability Depth | — | Trase/Sourcemap | Deepest supply chain tier with verified origin data; Tier 1 only is insufficient for EUDR high-risk country co |
| DDS Submission Rate (%) | — | EUDR Due Diligence Statements | Proportion of regulated commodity batches with submitted and accepted DDS in the EU Information System; 100% r |
- **GPS polygon data from suppliers (GeoJSON/KML)** → Validate geometry against cadastral boundaries; check for overlaps with forest areas and protected zones → **Verified plot polygons with forest overlay score**
- **Hansen/GFW forest cover loss tiles (annual)** → Intersect plot polygons with post-2020 forest loss raster; compute deforested area and percentage → **Plot-level deforestation risk score and forest loss area (ha)**
- **Supply chain transaction records (commodity batches)** → Link batch volumes to originating plots; compute batch-weighted DRS; generate DDS draft → **DDS package with risk assessment, traceability evidence, and submission status**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRS = P(deforestation) × (1 − Traceability) × CountryRisk`
**Standards:** ['EU Regulation 2023/1115 (EUDR)', 'Global Forest Watch 2024', 'Trase Supply Chain Transparency']

**Engine `eudr_engine` — extracted transformation lines:**
```python
days_until = (deadline_date - date.today()).days
information_score = sum(info_scores) / len(info_scores) if info_scores else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).