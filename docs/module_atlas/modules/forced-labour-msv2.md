# Forced Labour Msv2
**Module ID:** `forced-labour-msv2` · **Route:** `/forced-labour-msv2` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDITORS`, `AUDIT_RECORDS`, `AUDIT_RESULTS`, `BASE_COMPANIES`, `Badge`, `COUNTRY_RISK`, `GRIEVANCES`, `GRIEVANCE_SEVERITIES`, `GRIEVANCE_STATUSES`, `GRIEVANCE_TYPES`, `ILO_INDICATORS`, `INDUSTRIES`, `KpiCard`, `PIE_C`, `Row`, `SOURCE_COUNTRIES`, `SUPPLY_CHAINS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `riskScore` | `Math.round(20 + sr(i * 7) * 75);` |
| `uflpaCompliant` | `sr(i * 11) > 0.4;` |
| `ukMsaQuality` | `Math.round(20 + sr(i * 13) * 70);` |
| `csdddReady` | `sr(i * 17) > 0.5;` |
| `supplierCount` | `Math.round(50 + sr(i * 19) * 450);` |
| `highRiskSuppliers` | `Math.round(supplierCount * 0.05 + sr(i * 23) * supplierCount * 0.15);` |
| `auditsPassed` | `Math.round(supplierCount * 0.5 + sr(i * 29) * supplierCount * 0.4);` |
| `lastAudit` | ``202${3 + Math.floor(sr(i * 31) * 3)}-${String(1 + Math.floor(sr(i * 33) * 11)).padStart(2,'0')}-${String(1 + Math.floor(sr(i * 37) * 27)).padStart(2,` |
| `audFreqs` | `['Annual','Biennial','Ad-hoc'];` |
| `COUNTRY_RISK` | `SOURCE_COUNTRIES.map((c, i) => ({` |
| `csv` | `[h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `avgRisk` | `SUPPLY_CHAINS.length ? Math.round(SUPPLY_CHAINS.reduce((a, s) => a + s.riskScore, 0) / SUPPLY_CHAINS.length) : 0;` |
| `totalWorkers` | `SUPPLY_CHAINS.reduce((a, s) => a + s.workerCount, 0);` |
| `heatData` | `SOURCE_COUNTRIES.slice(0, 15).map((c, ci) => ({` |
| `tierDist` | `['Critical','High','Medium','Low'].map(t => ({ name: t, value: SUPPLY_CHAINS.filter(s => s.tier === t).length }));` |
| `radarData` | `sc.iloScores.map(s => ({ indicator: s.indicator.split(' ').slice(0, 2).join(' '), score: s.score }));` |
| `avgIlo` | `sc.iloScores.length ? Math.round(sc.iloScores.reduce((a, s) => a + s.score, 0) / sc.iloScores.length) : 0;` |
| `crossCompare` | `SUPPLY_CHAINS.slice(0, 20).map(s => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/forced-labour/ilo-screening` | `screen_ilo_indicators` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/eu-flr-assessment` | `assess_eu_flr` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/uk-msa-scoring` | `assess_uk_msa` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/compliance-programme` | `assess_compliance_programme` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/supplier-screening` | `screen_supplier_network` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/full-assessment` | `full_assessment` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/ilo-indicators` | `ref_ilo_indicators` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/country-risk` | `ref_country_risk` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/risk-levels` | `ref_risk_levels` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/uk-msa-areas` | `ref_uk_msa_areas` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/high-risk-countries` | `ref_high_risk_countries` | api/v1/routes/forced_labour.py |
| GET | `/api/v1/forced-labour/ref/high-risk-sectors` | `ref_high_risk_sectors` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/eu-flr-risk` | `eu_flr_risk` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/lksg-assessment` | `assess_lksg` | api/v1/routes/forced_labour.py |
| POST | `/api/v1/forced-labour/supplier-network` | `supplier_network` | api/v1/routes/forced_labour.py |

### 2.3 Engine `forced_labour_engine` (services/forced_labour_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ForcedLabourEngine.screen_ilo_indicators` | entity_id, supplier_data | Score all 11 ILO forced labour indicators (0-10 risk each). |
| `ForcedLabourEngine.assess_eu_flr` | entity_id, country_code, sector, products, audit_evidence | EU Forced Labour Regulation 2024/3015 — import risk assessment. |
| `ForcedLabourEngine.assess_uk_msa` | entity_id, disclosure_data | UK Modern Slavery Act Section 54 — disclosure scoring (0-30). |
| `ForcedLabourEngine.assess_compliance_programme` | entity_id, programme_data | 5-pillar compliance programme maturity assessment. |
| `ForcedLabourEngine.screen_supplier_network` | assessment_id, suppliers | Per-supplier forced labour risk screening. |
| `ForcedLabourEngine.full_assessment` | entity_id, entity_name, sector, country_code, products, audit_evidence | Full forced labour risk assessment. |
| `ForcedLabourEngine.get_ilo_indicators` |  |  |
| `ForcedLabourEngine.get_eu_flr_country_risk` |  |  |
| `ForcedLabourEngine.get_uk_msa_areas` |  |  |
| `ForcedLabourEngine.get_lksg_prohibited_practices` |  |  |
| `ForcedLabourEngine.get_high_risk_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `engine`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `AUDITORS`, `AUDIT_RESULTS`, `BASE_COMPANIES`, `FRAMEWORKS`, `GRIEVANCE_SEVERITIES`, `GRIEVANCE_STATUSES`, `GRIEVANCE_TYPES`, `ILO_INDICATORS`, `INDUSTRIES`, `PIE_C`, `SOURCE_COUNTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/forced-labour/ref/country-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_risk'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/high-risk-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk_countries', 'eu_flr_country_list', 'note'], 'n_keys': 3}`

**GET /api/v1/forced-labour/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk_sectors'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/ilo-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ilo_indicators'], 'n_keys': 1}`

**GET /api/v1/forced-labour/ref/risk-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eu_flr_risk_levels'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `forced_labour_engine` — extracted transformation lines:**
```python
agg_score = aggregate / assessed_weight if assessed_weight > 0 else 0.0
coverage_pct = round(assessed_weight / total_weight * 100, 1) if total_weight > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).