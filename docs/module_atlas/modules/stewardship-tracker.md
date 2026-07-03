# Stewardship Tracker
**Module ID:** `stewardship-tracker` · **Route:** `/stewardship-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG engagement and proxy voting activity tracker enabling asset managers and asset owners to record, monitor and report stewardship activities in line with stewardship codes.

> **Business value:** The UK Stewardship Code requires FCA-authorised managers to publish annual reports demonstrating purposeful engagement; this tracker automates evidence collection and narrative generation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLANK_FORM`, `ENG_TYPES`, `ESC_COLORS`, `ESC_LABELS`, `LS_KEY`, `MILESTONES`, `OUTCOMES`, `OUTCOME_STYLES`, `PIE_COLORS`, `SAMPLE_ENGAGEMENTS`, `STATUS_COLORS`, `STATUS_PIPELINE`, `TOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ESC_LABELS` | `{ 1: 'Monitoring', 2: 'Watching', 3: 'Engaging', 4: 'Escalating', 5: 'Divest-Ready' };` |
| `TOPICS` | `['Climate Target Setting', 'Coal Phase-Out', 'Board Diversity', 'Supply Chain Labor', 'Deforestation', 'Water Stewardship', 'Executive Remuneration', ` |
| `ENG_TYPES` | `['Letter', 'Meeting', 'Public Statement', 'Collaborative', 'Vote Against', 'Co-filing'];` |
| `uid` | `() => sr(_sc++).toString(36).slice(2, 10);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `avgEsc` | `engagements.length > 0 ? +(engagements.reduce((s, e) => s + e.escalationLevel, 0) / engagements.length).toFixed(1) : 0;` |
| `topSector` | `Object.entries(sectorCount).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `topTopic` | `Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| 'N/A';` |
| `label` | `d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });` |
| `rows` | `engagements.map(e => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/stewardship/engagement` | `assess_single_engagement` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/engagement-types` | `ref_engagement_types` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/proxy-resolutions` | `ref_proxy_resolutions` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/initiatives` | `ref_initiatives` | api/v1/routes/stewardship.py |
| GET | `/api/v1/stewardship/ref/frameworks` | `ref_frameworks` | api/v1/routes/stewardship.py |

### 2.3 Engine `stewardship_engine` (services/stewardship_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `StewardshipEngine.assess_portfolio` | entity_name, engagements, proxy_votes, initiative_memberships, assessment_date | Full portfolio stewardship assessment. |
| `StewardshipEngine.assess_engagement` | e | Assess engagement effectiveness for a single investee company. |
| `StewardshipEngine.assess_proxy_votes` | v | Score proxy voting alignment for an AGM. |
| `StewardshipEngine.assess_escalation` | e | Determine current and recommended escalation level for a company. |
| `StewardshipEngine._engagement_score` | e |  |
| `StewardshipEngine._rating` | score |  |
| `StewardshipEngine._escalation_signal` | e |  |
| `StewardshipEngine._gfanz_milestone` | e, score |  |
| `StewardshipEngine._engagement_gaps` | e |  |
| `StewardshipEngine._assess_initiatives` | memberships, engagements |  |
| `StewardshipEngine._aggregate` | run_id, entity_name, assessment_date, company_results, escalation_plans, proxy_results |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `ownership` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ENG_TYPES`, `MILESTONES`, `OUTCOMES`, `PIE_COLORS`, `SAMPLE_ENGAGEMENTS`, `STATUS_PIPELINE`, `TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Engagements | — | Engagement Log | Number of ongoing ESG engagement programmes with investee companies. |
| Voting Alignment Rate | — | Proxy Voting Records | Proportion of votes cast in line with ESG voting policy; deviations require explanation. |
| Escalation Rate | — | Engagement Log | Share of engagements escalated to collaborative or public action after insufficient progress. |
- **Engagement Logs, AGM Voting Records, Company Disclosures** → Milestone tracking + voting policy alignment engine → **Stewardship reports, escalation registers, PRI Active Ownership disclosures**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stewardship/ref/engagement-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'engagement_types', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/escalation-ladder** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['steps', 'escalation_ladder', 'engagement_type_details', 'reference'], 'n_keys': 4}`

**GET /api/v1/stewardship/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/stewardship/ref/initiatives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'initiatives', 'reference'], 'n_keys': 3}`

**GET /api/v1/stewardship/ref/proxy-resolutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'resolution_types', 'reference'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement Effectiveness Rate
**Headline formula:** `EER = Milestones Met / Total Milestones × 100`
**Standards:** ['UK Stewardship Code 2020', 'PRI Active Ownership 2.0']

**Engine `stewardship_engine` — extracted transformation lines:**
```python
alignment_score = min(100.0, alignment_score / total_weight)
next_level = current + 1
coverage = (engaged / max(len(company_results), 1)) * 100
proxy_align = sum(p.alignment_score for p in proxy_results) / len(proxy_results)
nzami_pct = (nzami_aligned / max(total_nzami, 1)) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `stewardship_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `stewardship-report-generator` | engine:stewardship_engine, table:ownership |