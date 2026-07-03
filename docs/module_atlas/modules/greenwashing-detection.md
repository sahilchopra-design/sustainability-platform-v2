# Greenwashing Detection
**Module ID:** `greenwashing-detection` · **Route:** `/greenwashing-detection` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
NLP-powered greenwashing detection scanning sustainability claims against actual performance data. Covers marketing materials, annual reports, and ESG claims with substantiation scoring.

> **Business value:** Greenwashing regulatory risk is escalating globally — EU Green Claims Directive, FCA SDR, ESMA supervisory priorities, ASIC enforcement. This module provides systematic pre-publication claim review to prevent regulatory action, litigation, and reputational damage.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHECKLIST_ITEMS`, `COMPANIES`, `COMPANIES_RAW`, `ENFORCEMENT_ACTIONS`, `EVIDENCE_MAP`, `REGULATIONS`, `REMEDIATION_ACTIONS`, `SECTORS`, `SIGNALS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `raw.id * 100;` |
| `composite` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 7);` |
| `prevComposite` | `Math.round(composite + (sr(seed + 8) - 0.5) * 20);` |
| `COMPANIES` | `COMPANIES_RAW.map(buildCompanyData);` |
| `radarData` | `useMemo(() => SIGNALS.map(s => ({` |
| `rankedCompanies` | `useMemo(() => [...COMPANIES].sort((a, b) => b.composite - a.composite), []);` |
| `sectorBoxData` | `useMemo(() => SECTORS.map(sector => {` |
| `scores` | `cos.map(c => c.composite).sort((a, b) => a - b);` |
| `min` | `scores[0], max = scores[scores.length - 1];` |
| `mid` | `scores[Math.floor(scores.length / 2)];` |
| `signalOverlayData` | `useMemo(() => SIGNALS.map(s => {` |
| `sigScore` | `item.signals.reduce((a, sig) => a + company[sig], 0) / item.signals.length;` |
| `riskScore` | `Math.round(reg.signals.reduce((a, sig) => a + c[sig], 0) / reg.signals.length);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/greenwashing/assess` | `assess` | api/v1/routes/greenwashing.py |
| POST | `/api/v1/greenwashing/screen-claim` | `screen_claim` | api/v1/routes/greenwashing.py |
| POST | `/api/v1/greenwashing/verify-labels` | `verify_labels` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/misleading-terms` | `ref_misleading_terms` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/claim-types` | `ref_claim_types` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/eu-requirements` | `ref_eu_requirements` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/fca-requirements` | `ref_fca_requirements` | api/v1/routes/greenwashing.py |
| GET | `/api/v1/greenwashing/ref/label-rules` | `ref_label_rules` | api/v1/routes/greenwashing.py |

### 2.3 Engine `greenwashing_engine` (services/greenwashing_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenwashingEngine.get_instance` |  |  |
| `GreenwashingEngine.screen_claim` | claim_text, claim_type |  |
| `GreenwashingEngine.verify_labels` | entity_id, labels, sfdr_art, taxonomy_pct |  |
| `GreenwashingEngine.assess` | entity_id, entity_name, claims, product_labels, sfdr_classification, taxonomy_alignment_pct |  |
| `GreenwashingEngine.ref_misleading_terms` |  |  |
| `GreenwashingEngine.ref_claim_types` |  |  |
| `GreenwashingEngine.ref_eu_requirements` |  |  |
| `GreenwashingEngine.ref_fca_requirements` |  |  |
| `GreenwashingEngine.ref_label_rules` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CHECKLIST_ITEMS`, `COMPANIES_RAW`, `ENFORCEMENT_ACTIONS`, `REGULATIONS`, `REMEDIATION_ACTIONS`, `SECTORS`, `SIGNALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Claim Types | — | NLP model | Ambiguous, absolute, certified, aspirational |
| Evidence Score | — | Data matching | How well actual performance supports claims |
| Flag Rate | — | Typical scan | Percentage of claims with insufficient substantiation |
- **Marketing documents** → NLP claim extraction → **Claim inventory**
- **ESG performance data** → Claim substantiation check → **Evidence gap score**
- **Greenwash risk scores** → Remediation prioritisation → **Claim correction actions**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/greenwashing/ref/claim-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['quantitative', 'qualitative', 'label', 'comparative', 'forward_looking'], 'n_keys': 5}`

**GET /api/v1/greenwashing/ref/eu-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['id', 'article', 'requirement', 'description']}`

**GET /api/v1/greenwashing/ref/fca-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': ['id', 'source', 'requirement', 'description']}`

**GET /api/v1/greenwashing/ref/label-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_article_8', 'sfdr_article_9', 'sdr_focus', 'sdr_improvers', 'sdr_impact', 'sdr_mixed_goals', 'eu_taxonomy_aligned'], 'n_keys': 7}`

**GET /api/v1/greenwashing/ref/misleading-terms** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 40, 'item0_keys': ['term', 'risk_level', 'substantiation']}`

## 5 · Intermediate Transformation Logic
**Methodology:** Claim-evidence gap analysis
**Headline formula:** `GreenwashScore = ClaimStrength - EvidenceScore; Flag if gap > threshold`
**Standards:** ['EU Green Claims Directive (draft)', 'ESMA Greenwashing Report (2023)', 'FCA SDR']

**Engine `greenwashing_engine` — extracted transformation lines:**
```python
substantiation_score = max(0.0, 1.0 - (len(issues) * 0.12) - (len(missing_reqs) * 0.08))
avg_claim_risk = total_claim_risk / len(claims) if claims else 0.0
eu_compliance_score = round(max(0.0, 100.0 - len(eu_gaps) * 18 - avg_claim_risk * 20), 1)
fca_compliance_score = round(max(0.0, 100.0 - len(fca_gaps) * 20 - avg_claim_risk * 15), 1)
overall_score = round((avg_claim_risk * 0.5 + (1 - eu_compliance_score / 100) * 0.3 + (1 - fca_compliance_score / 100) * 0.2), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).
**Shared engines (edits propagate!):** `greenwashing_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `greenwashing-exposure-monitor` | engine:greenwashing_engine, table:dataclasses |
| `greenwashing-detector` | engine:greenwashing_engine, table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |