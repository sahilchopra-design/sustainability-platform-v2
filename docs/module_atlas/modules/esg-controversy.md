# ESG Controversy Monitor
**Module ID:** `esg-controversy` · **Route:** `/esg-controversy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time controversy monitoring for portfolio companies. Severity classification (1-5), business area tagging, reputational risk scoring, and engagement trigger alerts.

> **Business value:** Controversy monitoring protects portfolios from reputational contagion and regulatory scrutiny. Severe controversies (Bhopal-type) can permanently impair company value. Early detection enables proactive engagement or divestment before reputational damage becomes priced in.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_50_INCIDENT_TYPES`, `API`, `Alert`, `Btn`, `CHART_COLORS`, `COUNTRIES`, `Card`, `CatBadge`, `ENV_INCIDENTS`, `GOV_INCIDENTS`, `Inp`, `KpiCard`, `LEVEL_COLORS`, `LEVEL_LABELS`, `LevelBadge`, `REMEDIATION_OPTS`, `RRI_COLOR`, `SECTORS`, `SOC_INCIDENTS`, `Sel`, `TABS`, `TabDataSources`, `TabEntityAssessment`, `TabFrameworkReference`, `TabIncidentScorer`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `rng` | `(i) => { let x = Math.sin(i + seed + 1) * 10000; return x - Math.floor(x); };` |
| `donutData` | `(val, max=100) => [{ name:'Score', value:val },{ name:'Rem', value:max-val }];` |
| `rri` | `Math.min(100, Math.round(20+ic*10+rng(1)*15));` |
| `breakdownRows` | `incidents.map((id,idx) => {` |
| `sev` | `rng(idx+10) > 0.6 ? 'Critical' : rng(idx+10) > 0.3 ? 'High' : 'Medium';` |
| `fin` | `+(rng(idx+20)*50).toFixed(1);` |
| `totalMv` | `holdings.reduce((s,h)=>s+h.market_value_usd,0);` |
| `ungcPct` | `totalMv ? +(ungcViol.reduce((s,h)=>s+h.market_value_usd,0)/totalMv*100).toFixed(1) : 0;` |
| `noCompPct` | `totalMv ? +(noCompliance.reduce((s,h)=>s+h.market_value_usd,0)/totalMv*100).toFixed(1) : 0;` |
| `wScore` | `totalMv ? +(holdings.reduce((s,h)=>s+h.controversy_level*h.market_value_usd,0)/totalMv).toFixed(2) : 0;` |
| `levelDist` | `[1,2,3,4,5].map(l => ({ level:`Level ${l}`, count:holdings.filter(h=>h.controversy_level===l).length,` |
| `fmt` | `v => v>=1000000 ? (v/1000000).toFixed(1)+'M' : v>=1000 ? (v/1000).toFixed(0)+'K' : v;` |
| `sevScore` | `sevMap[form.severity] + Math.round(rng(3)*10-5);` |
| `incidentTypes` | `ALL_50_INCIDENT_TYPES.map((t,i) => {` |
| `sevRange` | `t.cat==='E' ? 'Medium-Critical' : t.cat==='S' ? 'High-Critical' : 'Medium-High';` |
| `finRange` | `rng(i+50) > 0.5 ? '$10M-$500M+' : '$1M-$100M';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-controversy/assess` | `assess_entity_controversy` | api/v1/routes/esg_controversy.py |
| POST | `/api/v1/esg-controversy/score-incident` | `score_incident` | api/v1/routes/esg_controversy.py |
| GET | `/api/v1/esg-controversy/ref/controversy-levels` | `ref_controversy_levels` | api/v1/routes/esg_controversy.py |
| GET | `/api/v1/esg-controversy/ref/reprisk-methodology` | `ref_reprisk_methodology` | api/v1/routes/esg_controversy.py |
| GET | `/api/v1/esg-controversy/ref/incident-types` | `ref_incident_types` | api/v1/routes/esg_controversy.py |
| GET | `/api/v1/esg-controversy/ref/ungc-violations` | `ref_ungc_violations` | api/v1/routes/esg_controversy.py |

### 2.3 Engine `esg_controversy_engine` (services/esg_controversy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_compute_rri` | incidents, sector, severity_override | Approximate RRI from incident types and sector multiplier. |
| `_rri_to_reprisk_rating` | rri |  |
| `_compute_sustainalytics_level` | incidents, rri |  |
| `_check_ungc_violations` | incidents |  |
| `_compute_revenue_at_risk` | incidents, financial_impact_usd |  |
| `_derive_overall_controversy_tier` | level |  |
| `assess_controversy` | entity_id, entity_name, sector, active_incidents, incident_severities, financial_impact_usd | Comprehensive controversy assessment for a single entity. |
| `score_incident` | incident_type, severity, jurisdiction, financial_impact_usd, remediation_status | Score a single ESG incident for controversy level contribution and financial materiality. |
| `calculate_remediation_score` | acknowledgement, compensation, structural_change, monitoring, third_party_verification, entity_name | Score remediation quality on a 0-100 scale (5 criteria × 0-20 each). |
| `assess_portfolio_controversy_exposure` | holdings | Assess portfolio-level controversy exposure for SFDR PAI 10-11. |
| `get_controversy_trend` | entity_id, incident_history | Derive controversy trend from incident history (12-month trajectory). |
| `ESGControversyEngine.assess` | req |  |
| `ESGControversyEngine.score_incident` | req |  |
| `ESGControversyEngine.remediation_score` | req |  |
| `ESGControversyEngine.portfolio_exposure` | req |  |
| `ESGControversyEngine.controversy_trend` | req |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `incident`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALL_50_INCIDENT_TYPES`, `CHART_COLORS`, `COUNTRIES`, `ENV_INCIDENTS`, `GOV_INCIDENTS`, `REMEDIATION_OPTS`, `SECTORS`, `SOC_INCIDENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Controversies | — | Real-time | Companies with active controversies in portfolio |
| Severity 4-5 Alerts | — | Screening | Severe controversies triggering immediate review |
| Coverage | — | Sources | Multi-source controversy detection |
- **News and NGO sources** → Controversy detection → **Severity classification**
- **Controversy severity** → ESG score adjustment → **Rating impact**
- **Portfolio positions** → Controversy overlap → **Engagement/exclusion trigger**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-controversy/ref/controversy-levels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'levels', 'msci_controversy_impact', 'sfdr_pai_definitions', 'industry_exposure_factors'], 'n_keys': 5}`

**GET /api/v1/esg-controversy/ref/incident-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_incident_types', 'by_category', 'all_incidents', 'ungc_violation_incidents', 'catastrophic_incidents'], 'n_keys': 5}`

**GET /api/v1/esg-controversy/ref/reprisk-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodology', 'total_esg_topics', 'note'], 'n_keys': 3}`

**GET /api/v1/esg-controversy/ref/ungc-violations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ungc_principles', 'total_violation_incident_types', 'violations_by_incident_type', 'incident_types_by_principle', 'sfdr_pai_10_definition', 'sfdr_pai_11_definition', 'sfdr_pai_14_definition',`

**POST /api/v1/esg-controversy/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy severity scoring
**Headline formula:** `ControversyScore = Severity(1-5) × MediaImpact × Duration`
**Standards:** ['RepRisk', 'Sustainalytics Controversies', 'MSCI ESG Controversies']

**Engine `esg_controversy_engine` — extracted transformation lines:**
```python
rri = min(round(total * sector_mult, 1), 100.0)
max_floor = min(max_floor + 1, 5)
total = acknowledgement + compensation + structural_change + monitoring + third_party_verification
weight = mv / total_value
sfdr_pai_10_pct = round(sfdr_pai_10_value_usd / total_value * 100, 2)
sfdr_pai_14_pct = round(sfdr_pai_14_value_usd / total_value * 100, 2)
unresolved = total - resolved
resolution_rate = round(resolved / total * 100, 1) if total else 100.0
mid = total // 2
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).