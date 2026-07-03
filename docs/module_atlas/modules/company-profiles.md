# Company Profiles
**Module ID:** `company-profiles` · **Route:** `/company-profiles` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive ESG company profiles aggregating ESG scores, controversy flags, CDP disclosure status, board composition, SBTi commitment status, and historical engagement notes across thousands of investee companies. Serves as the central data hub for issuer-level ESG intelligence across the platform.

> **Business value:** Provides portfolio managers, ESG analysts, and engagement teams with a single authoritative view of each investee company’s ESG posture, enabling informed engagement prioritisation, proxy voting decisions, and issuer-level risk reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CompletenessMeter`, `DQS_COLOR`, `DataSourceConfig`, `EnrichPill`, `EsgBar`, `ManualDataEntry`, `RISK_COLOR`, `Row`, `SECTOR_COLOR`, `Section`, `SourceBadge`, `Spinner`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '—' : n >= 1e6 ? `₹${(n/1e5).toFixed(0)}K Cr` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K Cr` : `₹${n} Cr`;` |
| `fmtCO2` | `n => n == null ? '—' : n >= 1e6 ? `${(n/1e6).toFixed(2)}M tCO₂e` : n >= 1000 ? `${(n/1000).toFixed(0)}K tCO₂e` : `${n} tCO₂e`;` |
| `pct` | `Math.min(100, Math.max(0, score));` |
| `pct` | `Math.round((filled.length / KEY_FIELDS.length) * 100);` |
| `dir` | `sortDir === 'desc' ? -1 : 1;` |
| `totalMktCap` | `COMPANY_MASTER.reduce((s, c) => s + (c.market_cap_inr_cr \|\| 0), 0);` |
| `totalScope1` | `COMPANY_MASTER.reduce((s, c) => s + (c.scope1_co2e \|\| 0), 0);` |
| `range` | `selected.week52_high_inr - selected.week52_low_inr;` |
| `pos` | `range > 0 ? ((selected.stock_price_inr - selected.week52_low_inr) / range) * 100 : 50;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/company-profiles/` | `list_profiles` | api/v1/routes/company_profiles.py |
| GET | `/api/v1/company-profiles/{profile_id}` | `get_profile` | api/v1/routes/company_profiles.py |
| POST | `/api/v1/company-profiles/extract-from-reports` | `extract_from_reports` | api/v1/routes/company_profiles.py |
| POST | `/api/v1/company-profiles/seed-from-engine` | `seed_from_engine` | api/v1/routes/company_profiles.py |
| PUT | `/api/v1/company-profiles/{profile_id}` | `update_profile` | api/v1/routes/company_profiles.py |

### 2.3 Engine `peer_benchmark_engine` (services/peer_benchmark_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `score_to_rag` | score |  |
| `PeerBenchmarkEngine._weighted_score` | scores |  |
| `PeerBenchmarkEngine._group_scores` | scores |  |
| `PeerBenchmarkEngine.get_all_institutions` |  |  |
| `PeerBenchmarkEngine.get_institution` | slug |  |
| `PeerBenchmarkEngine.get_comparison_table` | slugs, region, institution_type |  |
| `PeerBenchmarkEngine.get_heatmap` | slugs |  |
| `PeerBenchmarkEngine.get_regional_averages` |  |  |
| `PeerBenchmarkEngine.get_framework_coverage` |  | Which institutions have which mandatory / voluntary frameworks. |
| `PeerBenchmarkEngine.get_top_gaps` | slug, top_n |  |
| `PeerBenchmarkEngine._to_summary` | inst |  |
| `PeerBenchmarkEngine._to_comparison_row` | inst |  |
| `PeerBenchmarkEngine._to_detail` | inst |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CSRD`, `__future__` *(shared)*, `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `cursor`, `datetime` *(shared)*, `db` *(shared)*, `dict`, `fastapi` *(shared)*, `mapped`, `one`, `peer` *(shared)*, `peer_benchmark_engine`, `processed`, `real`, `registry`, `services` *(shared)*, `set_clauses`, `specific`
**Shared context buses:** `CompanyEnrichmentContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score | — | MSCI / Sustainalytics | Composite ESG rating; 70+ = Leader, 50–70 = Average, <50 = Laggard |
| Controversy Severity | — | RepRisk / MSCI | Peak controversy severity in past 36 months; 5 = most severe category |
| SBTi Status | — | SBTi Database | Status of company’s science-based emissions reduction target |
| CDP Score | — | CDP | Disclosure and performance score across Climate, Water, and Forest questionnaires |
| Board Independence | — | Company proxy filings | Percentage of board members classified as independent non-executive directors |
- **MSCI/Sustainalytics ESG data feeds** → Normalise scores to 0–100 scale, apply controversy penalty → **Composite ESG score per issuer**
- **RepRisk/GRI controversy database** → Classify by severity, map to SASB materiality topics → **Controversy log per company**
- **SBTi and CDP public databases** → Match by LEI/ISIN, extract status and score → **SBTi status and CDP score per issuer**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/company-profiles/** — status `passed`, provenance ['real-db'], source tables: `company_profiles`
Output: `{'type': 'object', 'keys': ['profiles', 'total', 'limit', 'offset'], 'n_keys': 4}`

**GET /api/v1/company-profiles/{profile_id}** — status `failed`, provenance ['db-empty'], source tables: `company_profiles`
Output: `None`

**POST /api/v1/company-profiles/extract-from-reports** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/company-profiles/seed-from-engine** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PUT /api/v1/company-profiles/{profile_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite ESG Profile Score
**Headline formula:** `ESG_profile = 0.40×E_score + 0.35×S_score + 0.25×G_score`
**Standards:** ['MSCI ESG Methodology', 'SASB Standards', 'GRI Universal Standards']

**Engine `peer_benchmark_engine` — extracted transformation lines:**
```python
avg_scores[cat_key] = round(sum(vals) / len(vals), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **64** other module(s).

| Connected module | Shared via |
|---|---|
| `carbon-aware-allocation` | table:datetime, table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:datetime, table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:datetime, table:db, table:sqlalchemy |
| `carbon-wallet` | table:datetime, table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:datetime, table:db, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-map` | table:datetime, table:db, table:sqlalchemy |
| `carbon-adjusted-valuation` | table:datetime, table:db, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:sqlalchemy |
| `carbon-storage-geology` | table:datetime, table:db, table:sqlalchemy |