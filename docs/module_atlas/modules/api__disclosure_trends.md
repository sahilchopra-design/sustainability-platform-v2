# Api::Disclosure_Trends
**Module ID:** `api::disclosure_trends` · **Route:** `/api/v1/disclosure-trends` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/disclosure-trends/completeness` | `assess_completeness` | api/v1/routes/disclosure_trends.py |
| POST | `/api/v1/disclosure-trends/trends` | `analyse_trends` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/framework-requirements` | `ref_framework_requirements` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/framework-list` | `ref_framework_list` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/kpi-definitions` | `ref_kpi_definitions` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/peer-benchmarks` | `ref_peer_benchmarks` | api/v1/routes/disclosure_trends.py |
| GET | `/api/v1/disclosure-trends/ref/sectors` | `ref_sectors` | api/v1/routes/disclosure_trends.py |

### 2.3 Engine `disclosure_completeness` (services/disclosure_completeness.py)
| Function | Args | Purpose |
|---|---|---|
| `DisclosureCompletenessEngine.assess` | entity_name, provided_dps, frameworks, reporting_year | Assess disclosure completeness. |
| `DisclosureCompletenessEngine.get_framework_requirements` |  |  |
| `DisclosureCompletenessEngine.get_framework_list` |  |  |

### 2.3 Engine `trend_analytics` (services/trend_analytics.py)
| Function | Args | Purpose |
|---|---|---|
| `TrendAnalyticsEngine.analyse` | entity_name, kpi_series, sector, targets | Analyse multi-year KPI trends. |
| `TrendAnalyticsEngine.get_kpi_definitions` |  |  |
| `TrendAnalyticsEngine.get_peer_benchmarks` |  |  |
| `TrendAnalyticsEngine.get_sectors` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/disclosure-trends/ref/framework-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 9, 'item0_keys': ['id', 'framework', 'standard', 'total_dps']}`

**GET /api/v1/disclosure-trends/ref/framework-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ESRS_E1', 'ESRS_E2', 'ESRS_E3', 'ESRS_E4', 'ESRS_E5', 'ISSB_S1', 'ISSB_S2', 'TCFD', 'SFDR_PAI'], 'n_keys': 9}`

**GET /api/v1/disclosure-trends/ref/kpi-definitions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scope1_tco2e', 'scope2_tco2e', 'scope3_tco2e', 'total_ghg_tco2e', 'ghg_intensity_revenue', 'energy_consumption_mwh', 'renewable_share_pct', 'water_consumption_m3', 'waste_total_tonnes', 'waste_recycling_pct', 'board_diversity_pct', 'gender_pay_gap_pct', 'employee_turnove`

**GET /api/v1/disclosure-trends/ref/peer-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_institutions', 'energy', 'manufacturing', 'technology', 'real_estate'], 'n_keys': 5}`

**GET /api/v1/disclosure-trends/ref/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': None}`

**POST /api/v1/disclosure-trends/completeness** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/disclosure-trends/trends** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `disclosure_completeness` — extracted transformation lines:**
```python
pct = (provided_count / total * 100) if total > 0 else 0
overall_pct = (total_prov / total_req * 100) if total_req > 0 else 0
```

**Engine `trend_analytics` — extracted transformation lines:**
```python
latest = data_pts[-1].value
prev = data_pts[i - 1].value
change_abs = curr - prev
change_pct = ((curr - prev) / abs(prev) * 100) if prev != 0 else 0
years_span = data_pts[-1].year - data_pts[0].year
cagr = ((latest / earliest) ** (1 / years_span) - 1) * 100
vs_peer = round((latest - peer_val) / peer_val * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document the two
engines behind `/api/v1/disclosure-trends` — `backend/services/disclosure_completeness.py` and
`backend/services/trend_analytics.py` — routed by `backend/api/v1/routes/disclosure_trends.py`.)*

### 7.1 What the module computes

**Engine 1 — DisclosureCompletenessEngine** (`POST /completeness`): given a map of provided
datapoints `{dp_id: value}`, scores an entity against a 9-framework requirement catalogue:

```
completeness_pct(framework) = provided_count / total_required × 100
overall_pct                 = Σ provided / Σ required across assessed frameworks
```

with per-framework readiness bands and a regulatory-urgency-ranked gap list.

**Engine 2 — TrendAnalyticsEngine** (`POST /trends`): given multi-year KPI series
`{kpi_id: [{year, value}]}`:

```
YoY change_pct = (curr − prev) / |prev| × 100
CAGR           = (latest/earliest)^(1/years_span) − 1
trend          = improving / worsening / stable via a ±3% band on latest vs earliest,
                 direction-aware (lower_better vs higher_better)
on_track       = latest meets target OR CAGR is moving the right way
vs_peer_pct    = (latest − peer_benchmark) / peer_benchmark × 100
```

`GET /ref/*` endpoints expose the framework list/requirements, KPI definitions, peer benchmarks
and sectors.

### 7.2 Parameterisation

**Framework requirement catalogue** (`FRAMEWORK_REQUIREMENTS`, 74 datapoints total):

| Framework ID | Standard | Required DPs |
|---|---|---|
| ESRS_E1 | Climate Change (E1-1 … E1-9 incl. Scope 1/2 LB+MB/3, intensity, removals, ICP, financial effects) | 15 |
| ESRS_E2–E5 | Pollution / Water / Biodiversity / Circular Economy | 6 / 5 / 6 / 5 |
| ISSB_S1 | General (4 pillars) | 4 |
| ISSB_S2 | Climate (governance, scenario analysis, Scope 1/2/3, cross-industry metrics, transition plan) | 8 |
| TCFD | The 11 recommended disclosures (2 gov, 3 strategy, 3 risk mgmt, 3 metrics) | 11 |
| SFDR_PAI | Table-1 mandatory PAI 1–14 | 14 |

These are *condensed* representations of the real catalogues (ESRS Set 1 has ~1,100+
datapoints; the engine tracks headline disclosure requirements), but the TCFD 11 and the SFDR
14 mandatory PAIs match the published counts exactly.

**Thresholds:** per-framework readiness ≥90 compliant · ≥70 near_compliant · ≥40 partial · else
early_stage; overall bands 85/60/30. Datapoint quality: `high` if value > 0, `low` if ≤ 0,
`not_assessed` if missing (a coarse heuristic). Gap urgency weights: CSRD/ESRS 4 > ISSB 3 =
SFDR 3 > TCFD 2 (engine-authored), top 20 gaps returned.

**KPI dictionary:** 20 KPIs with unit, category and improvement direction (e.g. `scope1_tco2e`
lower_better; `renewable_share_pct` higher_better; PCAF `waci_tco2e_per_m` lower_better).
**Peer benchmarks** (`PEER_BENCHMARKS`, explicitly commented *"illustrative"*): 5 sectors with
3–4 anchor values each (financial institutions: financed emissions 1.5 MtCO₂e, WACI 120,
taxonomy alignment 15%, ESRS completeness 55%; energy: Scope 1 2 Mt, renewables 35%…).
**Trend stability band:** ±3% (latest vs earliest ×0.97/×1.03). **Overall trajectory:**
positive if improving > 2×worsening; negative if the reverse; else mixed.

### 7.3 Calculation walkthrough

Completeness: for each requested framework the engine walks its `required_dps`, marks each as
provided/missing (presence in the input map is the only test — values are not validated against
units or plausibility), computes the coverage %, assigns the readiness band, and pools all
missing datapoints into the urgency-sorted `priority_gaps`. Trends: each series is sorted by
year; YoY deltas, CAGR (guarded against zero/negative ratio bases), the ±3% direction test, the
target/on-track test (a *level* test OR a *direction* test — an entity above target but with
negative CAGR on a lower-better KPI still counts as on-track), and peer deviation are computed
per KPI; counts roll up to the trajectory verdict with top-5 improvement/concern highlights.

### 7.4 Worked example — Scope 1 trend

Series: 2021 → 100,000; 2022 → 96,000; 2023 → 91,000; 2024 → 88,000 tCO₂e; target 85,000;
sector `financial_institutions` (no Scope-1 peer anchor → `vs_peer = null`).

| Step | Computation | Result |
|---|---|---|
| YoY 2024 | (88,000 − 91,000)/91,000 × 100 | −3.3% |
| CAGR | (88,000/100,000)^(1/3) − 1 | **−4.17%/yr** |
| Trend | 88,000 < 100,000 × 0.97 (lower_better) | **improving** |
| On track | latest 88,000 > target 85,000, but CAGR < 0 | **True** (direction clause) |

For completeness, an entity providing 12 of ESRS_E1's 15 DPs scores 80.0% →
**near_compliant**; the 3 absent DPs appear in `priority_gaps` with urgency weight 4.

### 7.5 Data provenance & limitations

- **No PRNG, no DB** — both engines are pure functions of caller inputs; the only embedded data
  are the requirement catalogue, KPI dictionary and the peer benchmarks, which are explicitly
  labelled *illustrative* (synthetic anchor values, not survey data).
- Completeness is **presence-based**: supplying `dp_id: 1` for a narrative counts as disclosed;
  there is no NLP/content check, no assurance status, and no materiality filter (real
  CSRD/ESRS applies double-materiality — non-material topics are legitimately omissible, which
  this engine would count as gaps).
- Framework catalogues are headline-level condensations (15 vs hundreds of E1 datapoints);
  scores are comparable within the platform but not to EFRAG-datapoint-level coverage audits.
- Trend direction uses endpoint comparison only (first vs last year, ±3%), so a V-shaped series
  can read "stable"; no regression slope, seasonality or restatement handling (ESRS BP-2 /
  GRI 2-4 restatements are cited as references but not implemented).
- The on-track OR-clause means direction can override level — generous relative to SBTi-style
  trajectory tests.

### 7.6 Framework alignment

- **CSRD / ESRS Set 1 (EFRAG 2023)** — E1–E5 disclosure requirement structure (transition plan,
  policies, actions, targets, metrics per topic); the E1 list mirrors E1-1…E1-9 including
  location- vs market-based Scope 2 and anticipated financial effects.
- **IFRS S1/S2 (ISSB 2023)** — the four-pillar architecture (governance, strategy, risk
  management, metrics & targets) and S2's climate specifics incl. scenario-analysis resilience
  and cross-industry metrics; ISSB S1 §B35 comparative-information requirement motivates the
  trends engine.
- **TCFD (2017)** — all 11 recommended disclosures, correctly split 2/3/3/3 across the four
  pillars.
- **SFDR RTS (2022)** — the 14 mandatory Table-1 PAI indicators (GHG, footprint, intensity,
  fossil exposure, energy, biodiversity, water, waste, social 10–13, controversial weapons);
  real PAI reporting also requires opt-in Table 2/3 indicators not modelled here.
- **PCAF / EU Taxonomy** — appear as KPI definitions (financed emissions, WACI, alignment %)
  for trend tracking; their computation happens in other modules.
- **GRI 2-4 / ESRS BP-2** — cited as the restatement/comparative-period reference for
  multi-year series.

## 9 · Future Evolution

### 9.1 Evolution A — Full-catalog denominators, double-materiality filter, and regression trends (analytics ladder: rung 1 → 3)

**What.** Two clean deterministic engines: `DisclosureCompletenessEngine` (coverage vs a 9-framework,
74-datapoint requirement catalogue) and `TrendAnalyticsEngine` (YoY, CAGR, ±3% trend band, on-track
test, peer deviation) — no PRNG, no DB. §7.5 names the deepening targets: completeness is
**presence-based** (supplying any value counts as disclosed — no content/assurance/materiality check),
so the double-materiality principle CSRD actually applies (non-material topics legitimately omissible)
is scored as gaps; framework catalogues are **headline condensations** (15 vs hundreds of E1
datapoints); trend direction uses **endpoint comparison only** (a V-shaped series reads "stable"); and
peer benchmarks are explicitly *illustrative*. Evolution A adds a double-materiality filter (omit
non-material topics from the denominator), regression-slope trends, and real peer benchmark data.

**How.** `assess` accepts a materiality assessment so the coverage denominator excludes non-material
datapoints (with the omission documented, per ESRS); `analyse` adds a regression slope alongside the
CAGR/endpoint test; peer benchmarks are sourced from the platform's real disclosure corpus (CSRD
extraction, SBTi, CA100+) instead of the labelled illustrative anchors. Rung 3: calibrate against
EFRAG-datapoint-level coverage and implement the ESRS BP-2/GRI 2-4 restatement handling the module
cites but doesn't implement.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /completeness` and `/trends`
both **failed**; the presence-only test and headline-condensed catalogues are documented
simplifications to disclose. **Acceptance:** the §7.4 Scope-1 trend (CAGR −4.17%, improving, on-track)
reproduces; a non-material topic no longer counts as a gap under a materiality filter; a V-shaped
series is detected via slope, not read as stable; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Disclosure-readiness copilot with tool-called scoring (LLM tier 2)

**What.** A copilot for reporting teams: "how complete is our ESRS E1 disclosure and what are the
priority gaps?" (`/completeness` → coverage %, urgency-ranked gaps), "how are our emissions trending
vs target and peers?" (`/trends` → CAGR, on-track, peer deviation) — narrating real coverage and
trend outputs. The gap urgency ranking (CSRD/ESRS 4 > ISSB 3 > TCFD 2) directly answers "what should
we prioritise?"

**How.** Tool schemas over the 2 POST + 5 GET operations; the reference endpoints (framework
requirements, KPI definitions, peer benchmarks, sectors) are ideal RAG grounding. The no-fabrication
validator checks every coverage %, CAGR and gap count against tool output; the copilot must state that
completeness is presence-based (not content-assured) and peer benchmarks are illustrative until
Evolution A. Composable with `csrd_reports` and `cdp_scoring` in a disclosure-readiness workflow.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas + reference
corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; the
priority gaps a copilot names match the urgency-ranked `/completeness` output; a trend verdict matches
`/trends`, with the on-track direction-clause caveat surfaced.