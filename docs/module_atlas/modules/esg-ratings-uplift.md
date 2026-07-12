# ESG Ratings Uplift Analytics
**Module ID:** `esg-ratings-uplift` · **Route:** `/esg-ratings-uplift` · **Tier:** A (backend vertical) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Analyses gaps between current ESG scores and peer benchmarks across MSCI, Sustainalytics, CDP, and ISS rating systems, quantifies the impact of controversies, and models achievable score uplift through disclosure improvements. Accounts for the known 0.61 average Spearman correlation between major ESG data providers when synthesising cross-provider recommendations.

> **Business value:** Used by investor relations officers, sustainability managers, and ESG advisory teams to prioritise disclosure investments and set measurable ESG rating improvement targets.

**How an analyst works this module:**
- Connect ESG score feeds or manually enter current scores across providers
- Select peer benchmark group (GICS sub-industry or custom)
- Review score gap decomposition and controversy impact waterfall
- Generate uplift roadmap with prioritised disclosure actions by provider

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalW` | `s.issues.reduce((x, i) => x + i.weight, 0) \|\| 1;` |
| `currentScoreRaw` | `s.issues.reduce((x, i) => x + i.current * i.weight, 0) / totalW;` |
| `peerScore` | `s.issues.reduce((x, i) => x + i.peer * i.weight, 0) / totalW;` |
| `currentScore` | `Math.max(0, Math.min(100, currentScoreRaw + controvAdj));` |
| `gap` | `peerScore - currentScore;` |
| `plan` | `useMemo(() => [...s.actions].map(a => ({ ...a, roi: a.costMn > 0 ? a.uplift / a.costMn : 0 })).sort((a, b) => b.roi - a.roi), [s.actions]);` |
| `totalUplift` | `plan.reduce((x, a) => x + a.uplift, 0) * (totalW > 0 ? 15 / totalW : 0);` |
| `projectedScore` | `Math.min(100, currentScore + totalUplift);` |
| `totalCost` | `plan.reduce((x, a) => x + a.costMn, 0);` |
| `agencyCurrent` | `useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {` |
| `agencyProjected` | `useMemo(() => Object.keys(AGENCY_CROSSWALK).reduce((x, ag) => {` |
| `MSCI_ORDER` | `AGENCY_CROSSWALK.MSCI.map(b => b[2]);` |
| `uplifts` | `Math.max(0, projMsciIdx - curMsciIdx);` |
| `depResolution` | `useMemo(() => { const actionNames = s.actions.map(a => a.action);` |
| `indexElig` | `useMemo(() => Object.entries(INDEX_ELIGIBILITY).map(([name, cfg]) => {` |
| `unlock` | `projEligible && !curEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * 3 : (projEligible ? s.aumPassive * (cfg.flowPctPerNotch / 100) * uplifts : 0);` |
| `totalIndexUnlock` | `indexElig.reduce((x, r) => x + r.unlock, 0);` |
| `percentile` | `Math.round(Math.max(0, Math.min(100, 50 + (currentScore - sectorMedian) * 2)));` |
| `updIssue` | `(i, k, v) => sc.update({ issues: s.issues.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |
| `updAct` | `(i, k, v) => sc.update({ actions: s.actions.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |
| `ganttSpan` | `Math.max(...plan.map(a => (a.start \|\| 0) + a.months), 12);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esg-ratings/esra-compliance` | `esra_compliance_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/divergence-analysis` | `divergence_analysis_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/bias-detection` | `bias_detection_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/composite-rating` | `composite_rating_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/e-pillar-divergence` | `e_pillar_divergence_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/peer-benchmark` | `peer_benchmark_endpoint` | api/v1/routes/esg_ratings.py |
| POST | `/api/v1/esg-ratings/divergence-report` | `divergence_report_endpoint` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/esra-requirements` | `get_esra_requirements` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/provider-methodologies` | `get_provider_methodologies` | api/v1/routes/esg_ratings.py |
| GET | `/api/v1/esg-ratings/ref/divergence-research` | `get_divergence_research` | api/v1/routes/esg_ratings.py |

### 2.3 Engine `esg_ratings_engine` (services/esg_ratings_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | val, lo, hi |  |
| `_round` | val, digits |  |
| `_normalise_score` | provider, raw_score | Normalise provider score to 0-100 scale (higher = better). |
| `_composite_rating` | score |  |
| `assess_esra_compliance` | entity_id, provider_name, methodology_published, conflict_mgmt, regulatory_supervised, requirement_status |  |
| `analyse_rating_divergence` | entity_id, ratings, provider_correlations |  |
| `detect_rating_bias` | entity_id, scores, entity_size, region, sector, reporting_bias_adjustment, peer_stats |  |
| `compute_composite_rating` | entity_id, provider_scores, methodology, provider_market_weights |  |
| `assess_e_pillar_divergence` | entity_id, scores_by_pillar |  |
| `benchmark_against_peers` | entity_id, sector, composite_score, n_peers, peer_scores |  |
| `generate_divergence_report` | entity_id, entity_name, sector, ratings, peer_scores |  |

**Engine `esg_ratings_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ESRA_REQUIREMENTS` | `[{'id': 'R01', 'category': 'governance', 'requirement': 'Separation of ancillary services from ratings', 'weight': 0.15}, {'id': 'R02', 'category': 'methodology', 'requirement': 'Methodology publication and transparency', 'weight': 0.15}, {'id': 'R03', 'category': 'data_sources', 'requirement': 'Dat` |
| `PROVIDER_SCALE_NORMALISATION` | `{'msci': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'sustainalytics': {'min': 0, 'max': 50, 'direction': 'lower_better'}, 'sp': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'bloomberg': {'min': 0, 'max': 100, 'direction': 'higher_better'}, 'refinitiv': {'min': 0, 'max': 100, 'dir` |
| `COMPOSITE_RATING_THRESHOLDS` | `[(85, 'AAA'), (75, 'AA'), (65, 'A'), (55, 'BBB'), (45, 'BB'), (35, 'B'), (0, 'CCC')]` |
| `SECTOR_PEER_DISTRIBUTION` | `{'oil_gas': {'mean': 45, 'std': 18}, 'utilities': {'mean': 52, 'std': 16}, 'mining': {'mean': 42, 'std': 20}, 'finance': {'mean': 60, 'std': 15}, 'technology': {'mean': 65, 'std': 14}, 'healthcare': {'mean': 58, 'std': 16}, 'retail': {'mean': 55, 'std': 17}, 'manufacturing': {'mean': 48, 'std': 18},` |
| `E_PILLAR_SUBPILLARS` | `['carbon_E1', 'water_E2', 'biodiversity_E3', 'waste_E4', 'energy_E5']` |
| `SIZE_BIAS_ADJUSTMENTS` | `{'large': -3.0, 'mid': 0.0, 'small': +4.0, 'micro': +7.0}` |
| `REGION_BIAS_ADJUSTMENTS` | `{'western_europe': -2.0, 'north_america': -1.5, 'asia_pacific': +2.5, 'emerging_markets': +5.0, 'other': +3.0}` |
| `SECTOR_BIAS_ADJUSTMENTS` | `{'services': -3.0, 'manufacturing': +2.5, 'extractives': +4.0, 'finance': -1.0, 'technology': -2.5, 'other': 0.0}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Berg` *(shared)*, `ancillary` *(shared)*, `disclosure` *(shared)*, `fastapi` *(shared)*, `multiple` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score Gap vs Peer Median | `company_score − GICS_sector_peer_median` | MSCI/Sustainalytics/CDP benchmarks | Negative values indicate underperformance vs sector peers; gaps >15 pts signal material rating risk. |
| Achievable Uplift Score | `Σ(weight_i × max_disclosure_gain_i)` | Provider methodology weights | Maximum score improvement achievable through disclosure gap closure alone, without operational change; sets realistic target for reporting improvement programmes. |
| Provider Divergence Index | `1 − avg(Spearman ρ across provider pairs)` | Cross-provider rating comparison | Higher values indicate greater inter-provider disagreement; >0.5 suggests the company sits in contested scoring territory requiring provider-specific investor outreach. |
- **MSCI/Sustainalytics/CDP/ISS score feeds → company ESG scores** → Peer group median calculation → gap decomposition → uplift weighting → **Prioritised ESG improvement roadmap with estimated score impact per action**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esg-ratings/ref/divergence-research** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_study', 'key_finding', 'divergence_sources', 'esra_impact', 'additional_studies'], 'n_keys': 5}`

**GET /api/v1/esg-ratings/ref/esra-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regulation', 'regulator', 'entry_into_force', 'authorisation_deadline', 'scope', 'requirements'], 'n_keys': 6}`

**GET /api/v1/esg-ratings/ref/provider-methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'providers'], 'n_keys': 2}`

**POST /api/v1/esg-ratings/bias-detection** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ratings/composite-rating** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ratings/divergence-analysis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['normalised_scores', 'divergence_score', 'divergence_sources', 'correlation_matrix', 'correlation_data_available', 'consensus_rating', 'average_normalised_score', 'confidence_interval', 'missing_scores'], 'n_keys': 9}`

**POST /api/v1/esg-ratings/divergence-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/esg-ratings/e-pillar-divergence** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Score Gap Decomposition & Uplift Modelling
**Headline formula:** `uplift = Σ(weight_i × disclosure_gap_i) + Σ(weight_j × controversy_discount_j)`

Score gaps are decomposed into three drivers: disclosure coverage gaps (topics not reported), controversy discounts (active or resolved incidents), and management assessment gaps (policy vs practice divergence). Uplift potential for each driver is weighted by its contribution to the provider-specific scoring model. Provider divergence analysis uses Spearman rank correlation across concurrent ratings to identify systematic differences in scope and weighting.

**Standards:** ['MSCI ESG Ratings Methodology 2024', 'Sustainalytics ESG Risk Rating Framework', 'Berg et al. (2022) Aggregate Confusion']
**Reference documents:** Berg, Koelbel, Rigobon (2022) Aggregate Confusion: The Divergence of ESG Ratings; MSCI ESG Ratings Methodology 2024; Sustainalytics ESG Risk Rating Methodology

**Engine `esg_ratings_engine` — extracted transformation lines:**
```python
norm = (raw_score - lo) / (hi - lo) * 100
norm = 100 - norm
compliance_score = _round(weighted_score / assessable_weight, 1) if assessable_weight > 0 else None
ci_half_width = 1.96 * (divergence_score / math.sqrt(len(scores))) if scores else 10.0
REPORTING_BIAS_MODEL_CONSTANT = -2.5  # midpoint of Berg et al. (2022) -4.0..-1.0 range
bias_adjusted_score = _round(_clamp(raw_composite + total_adjustment), 1)
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
weights = {p: _round(usable[p] / total, 4) for p in providers}
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
each = remaining / len(non_spec) if non_spec else 0
weights = {p: _round(1.0 / n, 4) for p in providers} if n else {}
rank = sum(1 for s in clean_peers if s < entity_score) + 1
percentile = _round(rank / (actual_n + 1) * 100, 1)
p75_idx = min(actual_n - 1, int(actual_n * 0.75))
gap_to_median = _round(sector_median - entity_score, 1)
gap_to_leader = _round(sector_leader - entity_score, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `esg_ratings_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `esg-ratings-comparator` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `esg-ratings-hub` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `credit-spread-climate-monitor` | table:multiple |
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

This is the strongest of the three ratings modules and one of the most genuinely functional tools in
the atlas: a **rating-uplift advisory model with no PRNG**. It runs a real MSCI-style weighted
key-issue score, applies a controversy discount, ROI-ranks a remediation action plan, projects the new
score, crosswalks it across four agencies, and computes **notch-based passive-AUM unlock** from index-
eligibility gates. All parameters come from a shared reference library (`AdvisoryReference.js`) with
authentic MSCI crosswalk boundaries and real index thresholds. The guide's formula
(`uplift = Σ w_i·disclosure_gap_i + Σ w_j·controversy_discount_j`) is broadly implemented, with one
scaling heuristic flagged in §7.5.

### 7.1 What the module computes

```js
totalW        = Σ issue.weight
currentScoreRaw = Σ (issue.current × issue.weight) / totalW      // MSCI-style weighted key-issue score
peerScore       = Σ (issue.peer × issue.weight) / totalW
controvAdj      = controversyImpact(level)                        // None 0 / Low −2 / Med −6 / High −12 / Severe −25
currentScore    = clamp(currentScoreRaw + controvAdj, 0, 100)
gap             = peerScore − currentScore

plan          = actions sorted by roi = uplift / costMn (desc)
totalUplift   = Σ action.uplift × (15/totalW)                     // ⚠ scaling heuristic (see §7.5)
projectedScore= min(100, currentScore + totalUplift)

agencyCurrent[ag]  = letterForAgency(ag, currentScore)            // MSCI/Sustainalytics/ISS/CDP crosswalk
agencyProjected[ag]= letterForAgency(ag, projectedScore)
uplifts = max(0, MSCI_index(projected) − MSCI_index(current))    // notches gained

// Index-eligibility → AUM unlock:
projEligible = projectedScore ≥ minScore && !controversyExceeds(level, excludeControv)
unlock = (newly eligible) ? aumPassive × flowPctPerNotch/100 × 3
                          : projEligible ? aumPassive × flowPctPerNotch/100 × uplifts : 0
```

### 7.2 Parameterisation — real reference data

| Constant | Value | Provenance |
|---|---|---|
| MSCI crosswalk | CCC 0–14.3, B 14.3–28.6, BB …, AAA 85.7–100 | exact MSCI 7-band linear normalisation |
| Controversy tariff | None 0 / Low −2 / Med −6 / High −12 / Severe −25 | curated MSCI-deduction-style scale |
| Index thresholds | MSCI World ESG Leaders ≥57, SRI ≥71, FTSE4Good ≥42, DJSI ≥65, STOXX ≥55 | real index inclusion floors |
| `flowPctPerNotch` | 1.0–2.2% AUM per notch | curated passive-flow sensitivity |
| Issue weights | `MSCI_ISSUE_WEIGHTS[sector]` | MSCI-style sector materiality weights |
| Sector medians | `SECTOR_MEDIAN_SCORES` | curated peer medians |
| Action dependencies | `ACTION_DEPS` (e.g. SBTi ← Scope 3 Cat 11) | real logical prerequisites |

The crosswalk band boundaries (0/14.3/28.6/42.9/57.1/71.4/85.7/100) are the exact 7-way linear split
MSCI uses — genuine provenance.

### 7.3 Calculation walkthrough

1. Load sector → pulls `MSCI_ISSUE_WEIGHTS` and median; issues carry current/peer/weight.
2. `currentScore` = weighted key-issue mean + controversy discount, clamped.
3. Actions ROI-ranked (`uplift/costMn`); `projectedScore = current + totalUplift`.
4. Both scores crosswalked to four agencies; MSCI notches gained = `uplifts`.
5. Each index: eligible iff `score ≥ minScore` and controversy ≤ exclusion tier; newly-eligible
   indices unlock `aumPassive × flowPctPerNotch/100 × 3`; already-eligible add per-notch flow.
6. Dependency check: flags actions whose prerequisite is missing or scheduled too late (`ACTION_DEPS`).
7. Percentile: `50 + (currentScore − sectorMedian)×2`.

### 7.4 Worked example — ACME Group (Utilities-Renewables)

Default issues weighted-average to `currentScoreRaw` ≈ 52; controversy Low → `−2` →
`currentScore ≈ 50`. `peerScore` ≈ 63 → `gap ≈ 13`. Actions total `uplift = 12+18+10+14+6+5 = 65`;
`totalUplift = 65 × (15/totalW)`. With `totalW = 100`, `= 65×0.15 = 9.75` → `projectedScore ≈ 59.75`.
Crosswalk: current 50 → MSCI **BBB** (42.9–57.1); projected 59.75 → MSCI **A** (57.1–71.4) → `uplifts =
1 notch`. Newly crossing the MSCI World ESG Leaders floor (≥57): `unlock = 4500 × 2.2/100 × 3 = $297 M`
passive-flow potential. All deterministic, no random draws.

### 7.5 Data provenance & limitations

- **No PRNG** — every number is user input or curated reference data; this is a genuine advisory
  calculator, not a synthetic demo.
- **`totalUplift` scaling heuristic:** the action uplifts are re-scaled by `15/totalW`. When
  `totalW = 100`, this shrinks the summed uplifts by 0.15 — an ad-hoc normalisation that couples the
  aggregate uplift to the *sum of issue weights* rather than to the specific issues each action
  targets. A cleaner design would apply each action's `uplift` to its named `issue` and re-weight.
- AUM unlock uses a simple `flowPctPerNotch × 3` (3× multiplier for newly-eligible) — a stylised
  passive-flow assumption, not a fitted flow-elasticity.
- Peer scores are user-entered defaults, not live provider data.

**Framework alignment:** **MSCI ESG Ratings** — the weighted key-issue score, industry materiality
weights and the exact AAA–CCC crosswalk boundaries are implemented faithfully; MSCI derives its rating
by scoring exposure×management on 35 industry key issues, weighting by materiality, deducting for
controversies, then mapping the 0–10 industry-adjusted score to the letter scale. **Sustainalytics /
ISS / CDP** crosswalks let the same 0–100 score render in each provider's native bands. **Index
inclusion** (MSCI ESG Leaders/SRI, FTSE4Good, S&P DJSI, STOXX, Euronext Vigeo) floors are real, and the
notch→passive-flow link captures the genuine mechanism by which rating upgrades unlock index-tracking
AUM. Actions map to real frameworks (**TCFD**, **SBTi 1.5°C**, **Scope 3 Cat 11**).

*(No §8 model specification required — this module implements a genuine, parameter-grounded model; the
only refinement recommended is replacing the `15/totalW` aggregate-uplift heuristic with per-issue
uplift attribution and a calibrated passive-flow elasticity.)*

## 9 · Future Evolution

### 9.1 Evolution A — Persist uplift scenarios and put evidence behind the flow multipliers (analytics ladder: rung 2 → 3)

**What.** This page genuinely computes: weighted issue-level current-vs-peer scores, controversy adjustment, an ROI-sorted action plan (`roi = uplift/cost`), agency crosswalk projection across MSCI/Sustainalytics/CDP/ISS scales, dependency resolution between actions, a Gantt, and an index-eligibility "AUM unlock" estimate — all live, user-editable arithmetic, honestly rung 2. The soft spots: scenarios live in page state, and the money-shot numbers rest on undocumented heuristics — `unlock = aumPassive × flowPctPerNotch/100 × 3` (why 3×?), a percentile linearization (`50 + (score − median)·2`), and per-action `uplift` values that are user guesses presented with engine-like confidence.

**How.** (1) Persist: `uplift_scenarios` table (org-scoped) so an IR team's roadmap survives sessions and versions across quarters — progress against the plan becomes trackable. (2) Calibrate the crosswalk and peer inputs against the real rating panel: peer scores from `esg_score_history` (sector distributions replacing the engine's authored `SECTOR_PEER_DISTRIBUTION` means/stds), the 0.61 Spearman the overview cites computed from the actual panel. (3) Evidence the heuristics: the index flow-per-notch and the ×3 multiplier get sourced anchors (published index-flow studies) or get relabeled "illustrative — configure your assumption"; per-action uplift estimates gain a reference library of observed rating responses to disclosure improvements (CDP score jumps after first full response are documented publicly). (4) Bench-pin the crosswalk mappings — scale-conversion drift would silently corrupt every projection.

**Prerequisites.** The shared score-history store; a curated action→uplift evidence library (start small, cite everything). **Acceptance:** a saved scenario reloads and diffs against a later quarter's actual scores; crosswalk pins pass; every flow/percentile figure displays its provenance class (computed / sourced / user assumption).

### 9.2 Evolution B — IR uplift-roadmap advisor with assumption transparency (LLM tier 2)

**What.** A tool-calling advisor for the IR officer's planning loop: "we have $2M and 18 months — which disclosure actions maximize our MSCI notch probability, and what index eligibility could that unlock?" It runs Evolution A's scenario engine across action combinations (respecting the dependency graph the page already models), reports ROI-ranked plans with the agency-crosswalk projections, and — its defining rail — surfaces every assumption class in the answer: computed gap (from real peer data), sourced flow anchor, or user-supplied uplift guess.

**How.** Tools: `evaluate_scenario(actions)`, `get_gap_decomposition(entity)`, `project_agency_ratings(scenario)`, `get_index_eligibility(scenario)`, `get_action_evidence(action)`. Grounding corpus = this Atlas record's §2.1 formula set and the evidence library. Combinatorial recommendations come from actual scenario re-evaluation (the action set is small enough to enumerate), not model intuition; the AUM-unlock figure is always presented with its anchor and labeled an estimate. Board-ready output through report-studio.

**Prerequisites (hard).** Evolution A's persistence and evidence library — an advisor optimizing over unlabeled guess-uplifts would launder user assumptions into recommendations. **Acceptance:** a golden budget query's recommended plan matches exhaustive scenario evaluation; every uplift figure in the answer carries its provenance label; dependency-violating plans are never proposed.