# UK SDR
**Module ID:** `uk-sdr` · **Route:** `/uk-sdr` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
UK Sustainability Disclosure Requirements compliance analytics platform covering investment product labelling, naming and marketing rules under FCA SDR PS23/16, with anti-greenwashing integration.

> **Business value:** UK SDR labels are operational from July 2024; the anti-greenwashing rule applies to all FCA-authorised firms; non-compliance risks FCA enforcement action and reputational damage in a scrutinised market.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GREENWASH_FLAGS`, `KpiCard`, `PRODUCTS`, `PROVIDERS`, `SDR_LABELS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `adoptionTrend` | `YEARS.map((yr, i) => ({` |
| `TABS` | `['Overview', 'Labels', 'Anti-Greenwashing', 'Product Portfolio', 'Disclosure Tracker', 'Comparatives', 'Compliance'];` |
| `labelBarData` | `useMemo(() => SDR_LABELS.map(l => ({` |
| `gwData` | `useMemo(() => GREENWASH_FLAGS.map(f => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/uk-sdr/assess/batch` | `assess_batch` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/labels` | `ref_labels` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/naming-rules` | `ref_naming_rules` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/timeline` | `ref_timeline` | api/v1/routes/uk_sdr.py |

### 2.3 Engine `uk_sdr_engine` (services/uk_sdr_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `UKSDREngine.assess` | product, assessment_date |  |
| `UKSDREngine._assess_labels` | product |  |
| `UKSDREngine._recommend_label` | label_results | Return the most appropriate eligible label (Impact > Focus > Improvers > Mixed). |
| `UKSDREngine._assess_agr` | product |  |
| `UKSDREngine._assess_naming` | product, recommended_label |  |
| `UKSDREngine._calculate_icis` | product, recommended_label | Proxy for the Independent Claims Integrity Score (ICIS). |
| `UKSDREngine._disclosure_obligations` | product, label |  |
| `UKSDREngine._priority_actions` | product, label_results, agr_results, naming, label |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `SDR`, `__future__` *(shared)*, `fastapi` *(shared)*, `force`, `launch`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `GREENWASH_FLAGS`, `PROVIDERS`, `SDR_LABELS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Products with SDR Label | — | FCA Register | Number of investment products awarded UK SDR sustainability labels (Focus, Improvers, Impact, Mixed Goals). |
| Sustainability Focus % | — | Portfolio Analytics | Proportion of AUM in assets meeting the sustainability focus test across SDR-labelled products. |
| Anti-Greenwashing Alerts | — | Compliance Monitor | Marketing materials flagged for potential breach of FCA anti-greenwashing rule requiring substantiated claims. |
- **Portfolio Holdings, ESG Scores, Marketing Materials, FCA Register** → Label eligibility engine + anti-greenwashing scanner + PDD generator → **Label eligibility reports, PDDs, anti-greenwashing compliance alerts, FCA submission packages**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/uk-sdr/ref/agr-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'blocking', 'effective_date', 'requirements', 'reference'], 'n_keys': 5}`

**GET /api/v1/uk-sdr/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['note', 'mappings', 'uk_taxonomy_status', 'issb_srs_status'], 'n_keys': 4}`

**GET /api/v1/uk-sdr/ref/labels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'labels', 'regime', 'effective_date'], 'n_keys': 4}`

**GET /api/v1/uk-sdr/ref/naming-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['effective_date', 'reference', 'prohibited_without_label', 'key_rules', 'example_compliant', 'example_non_compliant'], 'n_keys': 6}`

**GET /api/v1/uk-sdr/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regime', 'milestones', 'scope', 'reference'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic
**Methodology:** SDR Label Eligibility Score
**Headline formula:** `LES = Min(Sustainability Focus, Paris Alignment, Robustness) ≥ 70`
**Standards:** ['FCA PS23/16 SDR 2023', 'FCA Anti-Greenwashing Rule 2024']

**Engine `uk_sdr_engine` — extracted transformation lines:**
```python
score = min(score * multiplier, 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).