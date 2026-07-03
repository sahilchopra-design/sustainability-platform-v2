# Greenwashing Detector
**Module ID:** `greenwashing-detector` · **Route:** `/greenwashing-detector` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Uses NLP and machine learning to detect greenwashing patterns in sustainability disclosures, corporate reports, and marketing materials by comparing qualitative claims against quantitative evidence, forward guidance against historical performance, and disclosure specificity against regulatory standards.

> **Business value:** Enables compliance teams, ESG analysts, and regulators to systematically screen sustainability disclosures for greenwashing indicators, prioritise enhanced due diligence on high-risk issuers, and prepare evidence packages for regulatory engagement under the FCA SDR and EU Green Claims Directive.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE`, `Badge`, `Btn`, `COMPANIES`, `COUNTRIES`, `Card`, `DISC_DIMS`, `DISC_DIM_SOURCES`, `FLAG_DESC`, `FLAG_REMEDIATION`, `FLAG_SEVERITY`, `FLAG_TYPES`, `REG_REQS`, `SBTI`, `SECTORS`, `Select`, `TIERS`, `TIER_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(s * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(s * 13) * COUNTRIES.length)];` |
| `selfScore` | `45 + Math.floor(sr(s * 3) * 50);` |
| `thirdParty` | `Math.max(15, selfScore - Math.floor(sr(s * 11) * 35) + 5);` |
| `gap` | `selfScore - thirdParty;` |
| `discQuality` | `30 + Math.floor(sr(s * 17) * 65);` |
| `integrity` | `Math.max(10, Math.min(99, Math.floor(` |
| `greenRev` | `Math.floor(sr(s * 19) * 80);` |
| `carbonInt` | `50 + Math.floor(sr(s * 23) * 450);` |
| `sbti` | `SBTI[Math.floor(sr(s * 29) * 3)];` |
| `assurance` | `ASSURANCE[Math.floor(sr(s * 31) * 3)];` |
| `eScore` | `20 + Math.floor(sr(s * 37) * 75);` |
| `sScore` | `20 + Math.floor(sr(s * 41) * 75);` |
| `gScore` | `20 + Math.floor(sr(s * 43) * 75);` |
| `flagCount` | `Math.floor(sr(s * 47) * 6);` |
| `discDims` | `DISC_DIMS.map((_, di) => 20 + Math.floor(sr(s * 59 + di * 11) * 75));` |
| `regStatus` | `REG_REQS.map((_, ri) => {` |
| `bestInClass` | `(dimIdx) => Math.max(...COMPANIES.map(c => c.discDims[dimIdx]));` |

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
**Frontend seed datasets:** `ASSURANCE`, `COUNTRIES`, `DISC_DIMS`, `DISC_DIM_SOURCES`, `FLAG_DESC`, `FLAG_REMEDIATION`, `FLAG_SEVERITY`, `FLAG_TYPES`, `REG_REQS`, `SBTI`, `SECTORS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenwashing Risk Score | — | NLP model output | Composite score; above 65 triggers enhanced due diligence; above 80 flags potential regulatory referral risk b |
| Claim-Evidence Gap (%) | — | NLP claim extraction | Proportion of sustainability claims lacking supporting quantitative evidence in the same or prior-year disclos |
| Vagueness Index | — | Text specificity analysis | Share of sustainability-related sentences containing only vague qualitative language (e.g. 'committed to', 'wo |
| Regulatory Gap Score | — | ESMA/FCA requirements | Deviation of disclosure from minimum regulatory specificity requirements under FCA Sustainability Disclosure R |
- **Sustainability disclosures and reports (PDF/HTML)** → NLP claim extraction, evidence matching, vagueness scoring → **Per-claim greenwashing risk flags**
- **Regulatory minimum disclosure requirements (FCA/ESMA)** → Compare disclosure specificity against regulatory standard → **Regulatory gap score by requirement**
- **Historical performance data (ESG databases)** → Compare forward claims against historical metrics → **Claim-evidence gap quantification**

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
**Methodology:** Greenwashing Risk Score
**Headline formula:** `GWS = w_1 × ClaimEvidenceGap + w_2 × SelectivityIndex + w_3 × VaguenessScore + w_4 × RegulatoryGapScore`
**Standards:** ['EU Green Claims Directive (2024)', 'FCA Greenwashing Rule (2024)', 'ESMA Greenwashing Progress Report (2023)']

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
| `greenwashing-detection` | engine:greenwashing_engine, table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |