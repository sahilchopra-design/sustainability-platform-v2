# ESG Controversy Monitor
**Module ID:** `esg-controversy` · **Route:** `/esg-controversy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time controversy monitoring for portfolio companies. Severity classification (1-5), business area tagging, reputational risk scoring, and engagement trigger alerts.

> **Business value:** Controversy monitoring protects portfolios from reputational contagion and regulatory scrutiny. Severe controversies (Bhopal-type) can permanently impair company value. Early detection enables proactive engagement or divestment before reputational damage becomes priced in.

**How an analyst works this module:**
- Controversy Dashboard shows all portfolio companies with controversy status
- Alert Feed shows new and escalating controversies in real-time
- Company Profile shows full controversy history with severity timeline
- Engagement Trigger flags companies requiring stewardship action
- Exclusion Assessment evaluates whether controversy warrants removal

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_50_INCIDENT_TYPES`, `API`, `Alert`, `Btn`, `CHART_COLORS`, `COUNTRIES`, `Card`, `CatBadge`, `ENV_INCIDENTS`, `GOV_INCIDENTS`, `Inp`, `KpiCard`, `LEVEL_COLORS`, `LEVEL_LABELS`, `LevelBadge`, `REMEDIATION_OPTS`, `RRI_COLOR`, `SECTORS`, `SOC_INCIDENTS`, `Sel`, `TABS`, `TabDataSources`, `TabEntityAssessment`, `TabFrameworkReference`, `TabIncidentScorer`, `TabPortfolioExposure`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENV_INCIDENTS` | 7 | `label` |
| `SOC_INCIDENTS` | 7 | `label` |
| `GOV_INCIDENTS` | 7 | `label` |

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
| `assess_controversy` | entity_id, entity_name, sector, active_incidents, incident_severities, financial_impact_usd, remediation_status | Comprehensive controversy assessment for a single entity. Returns: Sustainalytics level 1-5, RepRisk RRI, RepRisk rating, media intensity, litigation risk, revenue at risk %, UNGC violations, remediation adequacy, overall controversy tier. |
| `score_incident` | incident_type, severity, jurisdiction, financial_impact_usd, remediation_status | Score a single ESG incident for controversy level contribution and financial materiality. Returns: ESG category, UNGC violation flag, financial materiality, RepRisk source weighting, controversy level contribution. |
| `calculate_remediation_score` | acknowledgement, compensation, structural_change, monitoring, third_party_verification, entity_name, incident_type | Score remediation quality on a 0-100 scale (5 criteria × 0-20 each). Criteria: 1. Acknowledgement — public admission of fault, apology (0-20) 2. Compensation — payment to affected parties (0-20) 3. Structural Change — policy, process, or governance reforms (0-20) 4. Monitoring — ongoing monitoring and progress reporting (0-20) 5. Third-party Verification — independent audit of remediation (0-20) |
| `assess_portfolio_controversy_exposure` | holdings | Assess portfolio-level controversy exposure for SFDR PAI 10-11. Returns: Portfolio-weighted controversy score, high-risk holdings, SFDR PAI 10 and PAI 11 values, PAI 14 (controversial weapons). |
| `get_controversy_trend` | entity_id, incident_history | Derive controversy trend from incident history (12-month trajectory). incident_history items: {date: ISO str, incident_type: str, resolved: bool} Returns: trend (improving/stable/deteriorating), 12-month trajectory, peak period, resolution rate. |
| `ESGControversyEngine.assess` | req |  |
| `ESGControversyEngine.score_incident` | req |  |
| `ESGControversyEngine.remediation_score` | req |  |
| `ESGControversyEngine.portfolio_exposure` | req |  |
| `ESGControversyEngine.controversy_trend` | req |  |

**Engine `esg_controversy_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_SEVERITY_MAP` | `{'critical': 3, 'high': 2, 'medium': 1, 'low': 0}` |
| `_REPRISK_SEVERITY_TO_SCORE` | `{'critical': 20, 'high': 13, 'medium': 7, 'low': 2}` |

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
Output: `{'type': 'object', 'keys': ['ungc_principles', 'total_violation_incident_types', 'violations_by_incident_type', 'incident_types_by_principle', 'sfdr_pai_10_definition', 'sfdr_pai_11_definition', 'sfdr_pai_14_definition', 'oecd_guidelines_reference'], 'n_keys': 8}`

**POST /api/v1/esg-controversy/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-controversy/controversy-trend** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-controversy/portfolio-exposure** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-controversy/remediation-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy severity scoring
**Headline formula:** `ControversyScore = Severity(1-5) × MediaImpact × Duration`

Severity 5 = severe (criminal conviction, mass fatality, regulatory ban). Business areas: environmental, employees, supply chain, business ethics, customers. Impact on ESG rating: severe controversy can downgrade a company 1-2 rating levels.

**Standards:** ['RepRisk', 'Sustainalytics Controversies', 'MSCI ESG Controversies']
**Reference documents:** Sustainalytics ESG Controversies Methodology; MSCI ESG Controversy Score; RepRisk ESG Risk Platform

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

## 7 · Methodology Deep Dive

This is a **tier-A module with a genuinely standards-grounded backend** (`esg_controversy_engine.py`,
~1,680 lines). The guide's headline formula (`ControversyScore = Severity × MediaImpact × Duration`)
is a simplification; the real engine implements the **Sustainalytics 5-level framework**,
**RepRisk RRI** (0–100) approximation, a **50-incident-type** E/S/G library with severity floors and
UNGC/SFDR-PAI mappings, a **5-criteria remediation score**, and **SFDR PAI 10/11/14** portfolio
exposure. The frontend's `rng()` is used only for a demonstration incident-catalogue table; the
`assess`/`portfolio`/`remediation`/`trend` panels call the real backend. No blanket ⚠️ flag — the
guide understates the engine rather than mismatching it.

### 7.1 What the module computes

**(a) RRI approximation** (`_compute_rri`):

```python
rri = min(100, round( Σ_incidents [ severityScore(inc) × source_weight("national_media"=1.0) ]
                       × sector_multiplier , 1))
```

`severityScore` maps `reprisk_severity ∈ {low, medium, high, critical}` → numeric via
`_REPRISK_SEVERITY_TO_SCORE` (medium default = 7); `sector_multiplier` from
`INDUSTRY_EXPOSURE_FACTORS` (e.g. mining/oil&gas > 1). `rri → RepRisk rating` (AAA 0–25 … CCC 86–100)
via range lookup.

**(b) Sustainalytics level** (`_compute_sustainalytics_level`): the max per-incident level floor,
escalated by incident count (≥5 → +1) and by RRI (≥75 → level 4, ≥60 → level 3).

**(c) Remediation score** (`calculate_remediation_score`): five criteria × 0–20 = 0–100, with adequacy
tiers and a Sustainalytics level deduction (≥80 → −2 notches, ≥60 → −1).

**(d) Portfolio exposure** (`assess_portfolio_controversy_exposure`): value-weighted level and RRI,
SFDR PAI-10 (value in UNGC-violating names), PAI-14 (controversial weapons), high-risk holding list.
The frontend mirrors the weighted score as:

```js
wScore = Σ (controversy_level × market_value) / totalMv
ungcPct = Σ (mv of UNGC violators) / totalMv × 100
```

### 7.2 Parameterisation / scoring rubric

**Sustainalytics 5-level** (with real ESG-rating-impact and materiality bands):

| Level | Label | ESG-rating impact | Review cycle | Revenue at risk |
|---|---|---|---|---|
| 1 | Low | 0 | 6 mo | Negligible |
| 2 | Moderate | 2 | 6 mo | 0–2% |
| 3 | Significant | 5 | 3 mo | 2–5% |
| 4 | High | 10 | 1 mo | 5–15% |
| 5 | Catastrophic | 20 | 1 mo | >15% (viability risk) |

**RepRisk RRI dimensions** (documented, partially applied): novelty (first 1.0 / repeat-14d 0.5 /
repeat-30d 0.25), reach (international-media ×1.5), severity, sharpness. **RepRisk rating** ranges are
authentic (AAA 0–25, AA 26–45, A 46–55, BBB 56–65, BB 66–75, B 76–85, CCC 86–100).

**Provenance:** these are **real published methodologies**, cited in the engine docstring
(Sustainalytics ESG Risk Rating 2023, RepRisk RRI 2023, UNGC Ten Principles, OECD Guidelines 2023,
SFDR RTS 2022/1288 PAI 10–11, MSCI 2023). The 50 incident types carry `sustainalytics_level_floor`,
`reprisk_severity`, `ungc_violation`, `ungc_principles`, `sfdr_pai_indicator` and revenue-at-risk
ranges — a curated reference library, not PRNG.

### 7.3 Calculation walkthrough

1. User selects entity, sector, active incidents (from 50-type catalogue), optional severity
   overrides, financial impact, remediation status → `POST /assess`.
2. Backend: `rri = _compute_rri`; `rating = _rri_to_reprisk_rating`; `level =
   _compute_sustainalytics_level`; `ungc = _check_ungc_violations`; `rev_at_risk =
   _compute_revenue_at_risk`; overall tier from level.
3. Remediation panel: 5 sliders (0–20 each) → `/remediation-score` → adequacy tier + notch deduction.
4. Portfolio panel: holdings with `active_incidents` and `market_value_usd` → `/portfolio-exposure`
   → weighted level/RRI, SFDR PAI values, high-risk names.
5. Trend panel: 12-month incident history → trajectory.

### 7.4 Worked example — mining entity, oil spill + bribery

Incidents = `[oil_spill, bribery]`, sector = mining. Suppose severities are `critical` (score 20) and
`high` (score 12), and mining `sector_multiplier = 1.2`, source weight national_media = 1.0:

| Step | Computation | Result |
|---|---|---|
| Σ severity × source | 20×1.0 + 12×1.0 | 32 |
| × sector mult | 32 × 1.2 | 38.4 |
| RRI | min(100, 38.4) | **38.4** |
| RepRisk rating | 26–45 band | **AA** |
| Level floor | max(oil_spill floor, bribery floor) — say 4 | 4 |
| Escalation | n=2 (<5), RRI 38 (<60) → no bump | **Level 4 (High)** |
| Revenue at risk | max of incident ranges (High → 5–15%) | **15%** |

If remediation scores 85/100, the Sustainalytics level is deducted 2 notches (→ effectively level 2
management overlay). Every step is deterministic engine logic — no random draws.

### 7.5 Data provenance & limitations

- **Backend is curated real-standard data**, not synthetic. The only PRNG (`rng(i)=frac(sin(i+seed+1)
  ×10⁴)`) in the frontend seeds a *demonstration* incident-catalogue table (`sev`, `fin` sample
  columns) and the reputational-risk-illustration donut — not the assess/portfolio results.
- RRI is an **approximation**: it applies only the `national_media` source weight and a sector
  multiplier; the documented novelty/reach/sharpness decay weights are defined but not fully applied
  in `_compute_rri` (real RepRisk RRI is a time-decayed daily index).
- Duration/recency (the guide's "Duration" term) is not in the assess score; it appears only in the
  separate trend module.
- Incident severities default to the catalogue floor unless the user overrides — real controversy
  scoring is event-specific and source-verified.

**Framework alignment:** **Sustainalytics ESG Risk Rating** — the 5-level controversy framework with
per-level ESG-rating impact and review cycles is implemented directly · **RepRisk RRI/Rating** — the
0–100 index and AAA–CCC rating bands are authentic, with a simplified severity×source×sector scoring ·
**UN Global Compact** — incident→UNGC-principle mapping drives norms-based exclusion flags ·
**OECD Guidelines for MNEs** — referenced for the ESG due-diligence framing · **SFDR RTS PAI 10**
(UNGC/OECD violations) and **PAI 14** (controversial weapons) — computed as value-weighted portfolio
exposure. MSCI's own controversy score (0–10, event-flag driven, capping the ESG letter rating) is
approximated by the level→rating-impact mapping.

## 9 · Future Evolution

### 9.1 Evolution A — A persisted incident feed under a genuinely good scoring engine (analytics ladder: rung 2 → 3)

**What.** The backend is substantive: `esg_controversy_engine` computes RRI approximations with sector multipliers, RepRisk-style ratings, Sustainalytics 1–5 levels, UNGC violation checks, a 5-criterion remediation score, portfolio exposure for SFDR PAI 10/11/14, and trend derivation from incident history — 6 endpoints over a 50-type incident taxonomy. What's missing is the "real-time monitoring" of the overview: there is no incident store or feed — assessments are stateless calls on caller-supplied incidents, and the page decorates with `rng()` severities and financial impacts (`fin = rng(idx+20)·50`). Evolution A adds the data spine.

**How.** (1) `controversy_incidents` table (entity via LEI, incident type from the 50-type taxonomy, severity, date, source URL, resolved flag) — populated by the GDELT ingestion built in `dme-nlp-engine`'s Evolution A (one news pipeline, two consumers: pulse scoring there, incident records here) plus manual analyst entry. (2) The alert feed and controversy timeline become queries over stored incidents; `get_controversy_trend` finally receives real `incident_history` instead of nothing. (3) The page's seeded severity/financial-impact decorations are deleted — the engine's `score_incident` produces those properly from stored data. (4) Rung 3: validate the RRI approximation against a labeled set of public historical controversies (severity rankings for known cases — Bhopal-class vs minor fines) and publish rank-correlation; calibrate sector multipliers on the same set.

**Prerequisites.** GDELT entity-matching quality gate (shared with dme-nlp-engine); incident-taxonomy mapping from GDELT event codes documented. **Acceptance:** a stored incident flows through assess → portfolio PAI → trend endpoints end-to-end; the validation rank-correlation is published in `ref/reprisk-methodology`; zero `rng()` in rendered severities.

### 9.2 Evolution B — Exclusion-assessment analyst for stewardship committees (LLM tier 2)

**What.** The workflow's hardest step — "evaluate whether controversy warrants removal" — is a structured judgment over computed evidence. A tool-calling analyst assembles the exclusion case: entity assessment (`POST /assess`), remediation quality (`calculate_remediation_score`'s 5×20 rubric), trend (`get_controversy_trend`), UNGC status, and portfolio impact of removal (`assess_portfolio_controversy_exposure` re-run without the holding) — then drafts the committee memo with the engine's numbers and a clearly-labeled recommendation section citing the fund's own exclusion policy thresholds.

**How.** Tools: the module's existing 6 endpoints plus Evolution A's incident queries. Grounding corpus = this Atlas record's §2.3 (the remediation rubric and severity maps are precise) and the fund's exclusion policy as per-org context. The memo's structure enforces the decision discipline: evidence (computed) → policy test (rule application, cited) → recommendation (drafted, labeled as analysis). Divestment PAI deltas come from actual re-computation, not estimation. This module's copilot and `engagement-outcome-tracker`'s share an escalation boundary: engagement recommendations route there.

**Prerequisites (hard).** Evolution A's incident store — an exclusion memo needs a citable incident history; today the engine would be assessing whatever the caller typed, with no provenance. **Acceptance:** a golden exclusion case's every score matches endpoint outputs; the policy test cites the specific threshold applied; the removal-impact PAI delta reproduces from the two portfolio runs.