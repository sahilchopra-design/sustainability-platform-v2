# Greenwashing Exposure Monitor
**Module ID:** `greenwashing-exposure-monitor` · **Route:** `/greenwashing-exposure-monitor` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Monitors portfolio exposure to greenwashing risk across holdings by aggregating issuer-level greenwashing scores, tracking regulatory enforcement actions, and quantifying financial contagion risk from greenwashing allegations. Integrates news analytics and regulatory filing analysis to provide early warning of greenwashing-related reputational and financial risk.

> **Business value:** Protects investment portfolios from greenwashing-related regulatory and reputational risk by providing continuous monitoring of issuer greenwashing exposure, regulatory enforcement tracking, and portfolio-level VaR quantification enabling proactive divestment or engagement decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLAIM_CATEGORIES`, `CLAIM_STRENGTHS`, `COUNTRIES`, `ENFORCEMENT_ACTIONS`, `ENTITIES`, `ENTITY_NAMES`, `KpiCard`, `REGULATORS`, `RiskBadge`, `SECTORS`, `TABS`, `TIME_TO_ACTIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CLAIM_CATEGORIES` | `['Net-Zero Pledge', 'Carbon Neutral', 'Green Product', 'Sustainable Investment', 'Eco-Friendly', 'Climate Positive', 'Science-Based', 'Nature-Positive` |
| `TIME_TO_ACTIONS` | `['Imminent', 'Near-Term', 'Medium-Term', 'Low Risk'];` |
| `sectorIdx` | `Math.floor(sr(i * 7) * 10);` |
| `countryIdx` | `Math.floor(sr(i * 11) * 15);` |
| `claimCatIdx` | `Math.floor(sr(i * 13) * 10);` |
| `claimStrIdx` | `Math.floor(sr(i * 17) * 4);` |
| `claimStrengthNorm` | `claimStrIdx / 3;` |
| `greenRevClaimed` | `Math.min(1, sr(i * 19) * 0.8 + 0.1);` |
| `greenRevActual` | `Math.min(greenRevClaimed, Math.max(0, greenRevClaimed * (sr(i * 23) * 0.8)));` |
| `gapScore` | `Math.max(0, Math.min(100, Math.round((greenRevClaimed - greenRevActual) * 100)));` |
| `regId1` | `Math.floor(sr(i * 29) * 5);` |
| `regId2` | `(regId1 + 1 + Math.floor(sr(i * 31) * 4)) % 5;` |
| `enforcementProb` | `Math.min(1, Math.max(0, gapScore / 100 * 0.6 + claimStrengthNorm * 0.2 + sr(i * 37) * 0.2));` |
| `controversyCount` | `Math.floor(sr(i * 41) * 15);` |
| `controversyNorm` | `controversyCount / 15;` |
| `esgImpact` | `-(sr(i * 43) * 15 + 1);` |
| `marketingSpend` | `+(sr(i * 47) * 50 + 0.5).toFixed(1);` |
| `fineEstimate` | `Math.round(enforcementProb * REGULATORS[regId1].avgFineM * 1e6 * (0.5 + sr(i * 53)));` |

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
**Frontend seed datasets:** `CLAIM_CATEGORIES`, `CLAIM_STRENGTHS`, `COUNTRIES`, `REGULATORS`, `SECTORS`, `TABS`, `TIME_TO_ACTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Greenwashing VaR (%) | — | Enforcement precedent analysis | Probability-weighted expected portfolio loss from greenwashing enforcement actions; calibrated to average 5% m |
| High-Risk Issuer AUM (%) | — | Internal greenwashing scores | Portfolio weight in issuers scoring above the high-risk threshold (GWS >65); concentration above 10% triggers  |
| Regulatory Actions (YTD) | — | FCA/SEC/ESMA enforcement tracker | Number of regulatory enforcement actions, investigations, or fines for greenwashing issued by major financial  |
| News Sentiment Score | — | News NLP analytics | Sentiment of greenwashing-related news coverage across portfolio issuers; strongly negative scores precede enf |
- **Issuer greenwashing risk scores** → Weight by portfolio allocation, compute portfolio-level exposure distribution → **Portfolio greenwashing risk heatmap**
- **FCA/SEC/ESMA enforcement action database** → Match enforcement actions to portfolio ISINs, compute financial impact → **Enforcement contagion risk by holding**
- **News and social media sentiment analytics** → Score greenwashing sentiment by issuer, flag trending negative sentiment → **Early warning signals by issuer**

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
**Methodology:** Portfolio Greenwashing VaR
**Headline formula:** `GW_VaR = Σ_i (w_i × P_enforcement_i × FinancialImpact_i)`
**Standards:** ['ESMA Greenwashing Progress Report (2023)', 'FCA Enforcement Actions Database', 'EU Sustainable Finance Disclosure Regulation']

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
| `greenwashing-detection` | engine:greenwashing_engine, table:dataclasses |
| `greenwashing-detector` | engine:greenwashing_engine, table:dataclasses |
| `monte-carlo-var` | table:dataclasses |
| `climate-risk-budget-allocator` | table:dataclasses |
| `monte-carlo-climate` | table:dataclasses |
| `climate-risk-premium` | table:dataclasses |
| `monte-carlo-uncertainty-engine` | table:dataclasses |