# ESG Ratings Hub
**Module ID:** `esg-ratings-hub` · **Route:** `/esg-ratings-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised management platform for ESG rating data across all asset classes, maintaining full rating history, peer comparisons, and provider change logs. Provides workflow tools for internal ESG rating committees, override documentation, and rating committee pack generation. Integrates with portfolio management systems, risk engines, and client reporting platforms as the authoritative ESG data master record.

> **Business value:** Serves as the single source of ESG rating truth for the entire investment organisation, ensuring consistent data governance, full audit trails for regulatory inspection, and efficient rating committee workflows that scale across large issuer universes.

**How an analyst works this module:**
- Onboard new issuer by ISIN/LEI; system automatically loads all available provider ratings and computes initial ICR.
- Review rating committee queue for issuers triggering auto-review (>10 point drift, coverage change, controversy event).
- Submit analyst overlay with documented rationale and evidence; route for committee approval via built-in workflow.
- Publish approved ratings to downstream systems (portfolio management, risk, reporting) via certified API endpoint.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGREEMENT_TREND`, `ALERT_TYPES`, `COLORS`, `COMPANIES`, `COMPANY_NAMES`, `CONTROVERSIES`, `INIT_ALERTS`, `PROVIDERS`, `PROV_COLORS`, `Pill`, `QUARTERS`, `RATING_SCALE`, `SECTORS`, `SEVERITY_TIERS`, `SUB_MODULES`, `SevPill`, `TICKERS`, `TabBoardReport`, `TabConsensus`, `TabCoverage`, `TabExecutive`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUB_MODULES` | 6 | `key`, `title`, `path`, `desc`, `stat`, `color` |
| `REPORT_SECTIONS` | 10 | `key`, `title`, `content`, `fontSize`, `color`, `lineHeight` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sect` | `SECTORS[Math.floor(sr(i*7)*SECTORS.length)];` |
| `numScores` | `PROVIDERS.map((_,pi)=>ratings[PROVIDERS[pi]]?RATING_SCALE.indexOf(ratings[PROVIDERS[pi]]):null).filter(v=>v!==null);` |
| `avgNum` | `numScores.length?numScores.reduce((a,b)=>a+b,0)/numScores.length:3;` |
| `maxDiv` | `numScores.length>1?Math.max(...numScores)-Math.min(...numScores):0;` |
| `history` | `QUARTERS.map((q,qi)=>{` |
| `base` | `avgNum+sr(i*200+qi*11)*1.5-0.75;` |
| `lastQ` | `history.length>1?history[history.length-1].score-history[history.length-2].score:0;` |
| `prov` | `PROVIDERS[Math.floor(sr(i*456)*PROVIDERS.length)];` |
| `AGREEMENT_TREND` | `QUARTERS.map((q,qi)=>{` |
| `avgR` | `active.reduce((a,c)=>a+c.avgScore,0)/n;` |
| `cov` | `active.filter(c=>c.coverage>=3).length/n*100;` |
| `integrity` | `+(100-maxDiv*8-gw*2).toFixed(1);` |
| `contExp` | `active.reduce((a,c)=>a+c.controversies,0);` |
| `firstMover` | `Object.entries(provScores).sort((a,b)=>b[1]-a[1])[0]?.[0]\|\|'MSCI';` |
| `topDiv` | `useMemo(()=>[...COMPANIES].sort((a,b)=>divDir?b[divSort]-a[divSort]:a[divSort]-b[divSort]).slice(0,10),[divSort,divDir]);` |
| `distData` | `useMemo(()=>{ if(drillProvider){ return RATING_SCALE.map(r=>({rating:r,count:COMPANIES.filter(c=>c.ratings[drillProvider]===r).length}));` |
| `providerRadar` | `useMemo(()=>PROVIDERS.map(p=>{` |
| `scores` | `COMPANIES.filter(c=>c.ratings[p]).map(c=>RATING_SCALE.indexOf(c.ratings[p]));` |
| `avg` | `scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:3;` |
| `sectorPerf` | `useMemo(()=>SECTORS.slice(0,8).map(sec=>{` |
| `pillarData` | `useMemo(()=>PROVIDERS.map((p,pi)=>({` |
| `paged` | `filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PER_PAGE);` |
| `heatmapData` | `useMemo(()=>filtered.slice(0,30).map(c=>{` |
| `gapData` | `useMemo(()=>PROVIDERS.map(p=>{` |
| `coverageTrend` | `QUARTERS.map((q,qi)=>{` |
| `rows` | `filtered.map(c=>[c.name,c.ticker,c.sector,...PROVIDERS.map(p=>c.ratings[p]\|\|''),c.coverage,c.avgRating]);` |
| `csv` | `[headers,...rows].map(r=>r.join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `pct` | `+(cov/COMPANIES.filter(c=>c.included).length*100).toFixed(1);` |
| `avgIdx` | `COMPANIES.filter(c=>c.ratings[p]).map(c=>RATING_SCALE.indexOf(c.ratings[p]));` |
| `consensus` | `useMemo(()=>{ const totalW=Object.values(weights).reduce((a,b)=>a+b,0)\|\|1;` |
| `wAvg` | `wDiv>0?wSum/wDiv:3;` |
| `conPaged` | `consensus.slice(conPage*CON_PER_PAGE,(conPage+1)*CON_PER_PAGE);` |
| `conTotalPages` | `Math.ceil(consensus.length/CON_PER_PAGE);` |
| `alertsPaged` | `filteredAlerts.slice(alertPage*10,(alertPage+1)*10);` |
| `alertTotalPages` | `Math.ceil(filteredAlerts.length/10);` |
| `avgScore` | `active.length?active.reduce((a,c)=>a+c.avgScore,0)/active.length:0;` |
| `contTotal` | `active.reduce((a,c)=>a+c.controversies,0);` |
| `lastQAvg` | `avgScore+0.15; // simulated delta` |

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
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Berg` *(shared)*, `ancillary` *(shared)*, `disclosure` *(shared)*, `fastapi` *(shared)*, `multiple` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALERT_TYPES`, `COLORS`, `COMPANY_NAMES`, `PROVIDERS`, `QUARTERS`, `RATING_SCALE`, `REPORT_SECTIONS`, `SECTORS`, `SEVERITY_TIERS`, `SUB_MODULES`, `TABS`, `TICKERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Composite Rating (0â€“100) | — | ESG Ratings Hub | Master ESG score after provider blend and approved analyst overlay; sole authoritative source for downstream systems. |
| Rating Drift (12m change) | — | Historical Rating DB | Year-on-year change in ICR; large positive or negative drift triggers rating committee review obligation. |
| Override Frequency (%) | — | Internal Governance | Proportion of ratings with analyst overlay active; excessive override rate may indicate provider data quality issues. |
| Peer Percentile Rank (%) | — | Sector Peer Group | Issuer ICR rank within GICS sub-industry peer group; primary relative comparison metric for client reporting. |
- **External ESG provider feeds (MSCI, Sustainalytics, ISS, Bloomberg, Refinitiv)** → Daily ingest; normalise, timestamp, and store in immutable rating history table with source audit trail → **Provider score history per issuer with PIT reconstruction capability**
- **Analyst override submissions (rationale text, evidence attachments)** → Store in structured override log with reviewer, approval date, and expiry; compute ICR post-overlay → **ICR with overlay audit trail and committee approval record**
- **Portfolio management system (holdings and mandates)** → Push ICR and peer percentile to PM system via certified API; flag covenant breaches (ICR below mandate minimum) → **Daily ICR feed to downstream systems with change alerts**

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
**Methodology:** Internal Composite ESG Rating
**Headline formula:** `ICR = Σ(w_p × Provider_p) + Δ_analyst`

Weighted blend of external provider scores augmented by an analyst overlay (Δ_analyst) captured through the structured override workflow. Override rationale, evidence, and reviewer sign-off are stored in the audit trail. ICR is the master score disseminated to portfolio management, risk, and reporting systems. Score history is maintained at daily granularity with point-in-time reconstruction capability.

**Standards:** ['ESMA ESG Ratings Regulation 2024', 'PRI Reporting Framework 2023', 'FCA ESG Ratings Code 2023']
**Reference documents:** ESMA Regulation on ESG Rating Activities 2024; PRI Reporting Framework â€” Strategy & Governance Module 2023; FCA ESG Data and Ratings Code of Conduct 2023; ISO 14097 â€” Finance and Investment Climate Change Framework 2021

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
| `esg-ratings-uplift` | engine:esg_ratings_engine, table:Berg, table:ancillary, table:disclosure, table:multiple |
| `credit-spread-climate-monitor` | table:multiple |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (tier A) describes an **Internal Composite ESG Rating**
> `ICR = Σ(w_p × Provider_p) + Δ_analyst` — a *weighted* provider blend plus a stored analyst-override
> workflow with rationale, evidence and reviewer sign-off. **No weighting and no override workflow
> exist.** The frontend's composite is a plain **mean of provider rating-scale indices**, and the
> "150 companies" are `sr()`-synthetic (real names/tickers, seeded ratings), though the module *does*
> honour missing coverage honestly and supports an India real-data adapter. A rigorous backend
> (`esg_ratings_engine.compute_composite_rating`) exists but the frontend does **not** call it (0
> axios/fetch). §8 specifies the weighted ICR + analyst-overlay the guide names.

### 7.1 What the module computes

Per company (from `COMPANY_NAMES`/`TICKERS`, 150 real large-caps):

```js
// Each provider present ~85% of the time (honest coverage gap):
if (sr(i*100+pi*13) > 0.15) ratings[p] = RATING_SCALE[floor(sr(i*17+pi*31)*7)]   // AAA..CCC
numScores = present ratings mapped to index 0(AAA)..6(CCC)
avgNum    = mean(numScores) || 3                          // composite index (equal-weighted)
avgRating = RATING_SCALE[round(avgNum)]                   // → letter
maxDivergence = max(numScores) − min(numScores)           // range in notches
lastQ     = history[-1].score − history[-2].score
momentum  = lastQ>0.2 Upgrade · <−0.2 Downgrade · else Stable
```

Coverage (`covCount`), 12-quarter score history (`avgNum` + `sr()` drift), controversies, greenwash
flag and alerts are all `sr()`-driven. Portfolio KPIs aggregate coverage, divergence and momentum.

### 7.2 Parameterisation

| Element | Source |
|---|---|
| `PROVIDERS` (6): MSCI, S&P Global, Sustainalytics, ISS ESG, CDP, Refinitiv | real providers |
| 150 `COMPANY_NAMES` + `TICKERS` | curated real large-caps (AAPL, MSFT, SHEL…) |
| Provider ratings | `sr()` on RATING_SCALE (AAA–CCC); ~15% honestly missing |
| Composite | **equal-weighted mean of indices** (not the guide's `Σ w_p·Provider_p`) |
| Divergence | max−min notches |
| India mode | `isIndiaMode() ? adaptForESG() : synthetic` — real Indian-issuer data when toggled |
| CONTROVERSIES (90), ALERTS (30) | `sr()`-synthetic event feeds |

Note the low-coverage gate (`> 0.15`) is a nice touch — it models real-world incomplete provider
coverage rather than fabricating a full grid.

### 7.3 Calculation walkthrough

1. 150 companies built from `sr()`; each provider included probabilistically (coverage realism).
2. Composite = equal-weighted mean of present-provider indices → nearest letter.
3. Divergence = notch range across present providers.
4. 12-quarter history drifts around `avgNum`; last-quarter delta sets momentum tag.
5. Controversy overlay maps 90 synthetic incidents to companies; 30 alerts flag downgrades/divergence
   spikes/greenwash; 5 sub-module cards link to divergence, migration, controversy, greenwash, EU-reg
   readiness views.

### 7.4 Worked example — a 5-provider company

Present ratings `{MSCI: A(2), S&P: BBB(3), Sustainalytics: A(2), ISS: AA(1), CDP: BBB(3)}`,
Refinitiv missing. `numScores = [2,3,2,1,3]`; `avgNum = 11/5 = 2.2`; `avgRating = RATING_SCALE[round(2.2)]
= RATING_SCALE[2] = A`; `maxDivergence = 3 − 1 = 2 notches`; coverage 5/6. If the last two quarters
drift `+0.3`, `momentum = Upgrade`. Equal weighting means CDP (a climate-only disclosure score) counts
the same as MSCI's full ESG rating — the very issue the guide's *weighted* ICR was meant to fix.

### 7.5 Data provenance & limitations

- **Default mode is synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); provider ratings, history, controversies
  and alerts are seeded. India mode swaps in real issuer data via `adaptForESG()`.
- **Composite is equal-weighted**, not provider-weighted; **no analyst-override workflow** (Δ_analyst),
  no audit trail — the guide's distinguishing features are absent.
- Coverage gaps are modelled honestly (providers can be missing), a genuine realism improvement.
- The rigorous backend composite/divergence engine is not wired to the frontend.

**Framework alignment:** the six providers are real (**MSCI, S&P Global CSA, Sustainalytics, ISS ESG,
CDP, Refinitiv**). The AK5 sub-module correctly references the **EU ESG Ratings Regulation
(2024/3005)**, which from 2024 requires ESG-rating providers operating in the EU to be ESMA-authorised,
publish methodologies and manage conflicts — the same regime the backend's `assess_esra_compliance`
models across 8 requirements. A production ICR would weight providers by reliability/coverage and
layer an evidenced analyst override.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI.**

**8.1 Purpose & scope.** Produce an internal composite ESG rating per issuer that blends external
providers by reliability and permits an evidenced, audited analyst override, for investment and
exclusion decisions.

**8.2 Conceptual approach.** Reliability-weighted provider blend on a common normalised scale plus a
bounded analyst overlay with mandatory rationale/evidence — mirroring how asset managers construct
proprietary ESG scores over MSCI/Sustainalytics inputs.

**8.3 Mathematical specification.**
- Normalise each present provider `p` to 0–100 (per provider scale); `w_p ∝ coverage_p·reliability_p`,
  `Σw_p=1` over present providers.
- Base composite: `ICR_0 = Σ_p w_p·Score_p`.
- Analyst overlay: `ICR = clamp(ICR_0 + Δ_analyst, 0, 100)`, `|Δ_analyst| ≤ 15` (≈2 notches), stored
  with `{rationale, evidence[], reviewer, timestamp}`.
- Divergence gate: if `σ(Score_p) > 15`, require analyst review before ICR is published.

| Parameter | Source |
|---|---|
| Provider normalisation | provider scales (see esg-ratings-comparator §7.2) |
| Reliability weights | provider coverage/accuracy studies |
| Override cap ±15 | governance policy (≈2 notches) |
| Divergence gate 15 | Berg et al. σ magnitudes |

**8.4 Data requirements.** ≥2 provider raw scores per issuer, provider coverage/reliability metadata,
an override store (rationale/evidence/reviewer). India mode already sources real issuer data.

**8.5 Validation & benchmarking plan.** Compare ICR against realised controversies and rating
migrations; audit override frequency and reversal rate; sensitivity to reliability weights.

**8.6 Limitations & model risk.** Reliability weights are judgemental; analyst overlay introduces
subjectivity (needs governance controls); equal-weight fallback (current code) over-weights narrow
providers like CDP.

## 9 · Future Evolution

### 9.1 Evolution A — Become the rating master record it claims to be (analytics ladder: rung 1 → 2)

**What.** The hub's overview promises data governance — full rating history, committee workflows, override documentation, audit trails, a "certified API" publishing to downstream systems. None of that exists: the page seeds companies, ratings, quarterly histories (`base = avgNum + sr(i·200+qi·11)·1.5 − 0.75`), alerts, and even the "last quarter delta" (`avgScore + 0.15; // simulated delta`), while the shared `esg_ratings_engine` (real: scale normalization, divergence, bias detection, composites) sits behind 10 endpoints the page barely exercises. Evolution A builds the governance layer over the real store.

**How.** (1) Persistence: the `esg_score_history` table (shared with momentum-scanner/comparator Evolutions A) becomes the master record; hub-specific tables `rating_overrides` (analyst overlay, rationale, evidence link, approver, timestamps) and `rating_committee_queue`. (2) Workflow: the auto-review triggers the overview names (>10-point drift, coverage change, controversy event) become real rules over stored history and `esg-controversy` incidents, populating the queue; committee approval transitions are audit-logged (the platform's AuditMiddleware already captures the plumbing). (3) The consensus tab's user-weighted composite calls the engine's `compute_composite_rating` instead of computing in-page. (4) Publish: an org-scoped read API with version stamps so downstream modules (dme-competitive, entity-360) consume governed ratings, not their own copies — this hub is where the ratings-family blast radius should concentrate.

**Prerequisites.** The score-history store; RBAC roles for analyst vs committee member (override approval is the whole point). **Acceptance:** an override survives with full who/when/why trail and appears in the committee pack; a >10-point drift in stored history lands in the queue automatically; zero seeded histories; downstream reads carry the record version.

### 9.2 Evolution B — Committee-pack drafter and queue triage (LLM tier 2)

**What.** Rating committees run on packs — per-issuer summaries of provider ratings, divergence, controversy context, and the analyst's override case. A tool-calling assistant that drafts them: for each queued issuer, it pulls the stored rating panel, the engine's divergence analysis and peer benchmark, open incidents, and the proposed override with its documented rationale, and assembles the committee pack — plus queue triage ("3 of 12 queued items are stale provider-lag artifacts, 2 are controversy-driven — suggest ordering") using the trigger metadata.

**How.** Tools: hub queue/override endpoints from Evolution A plus the engine's existing `divergence-analysis`, `peer-benchmark`, and `bias-detection` operations. Grounding corpus = this Atlas record plus `ref/provider-methodologies`. The governance discipline is the design center: the pack distinguishes provider data (sourced, dated), engine analytics (computed), and analyst judgment (the override rationale, quoted verbatim, never paraphrased into stronger claims). Committee *decisions* are human; the assistant never auto-approves.

**Prerequisites (hard).** Evolution A — drafting committee packs from seeded ratings would formalize fabrication into the org's most audit-sensitive workflow; the override trail must exist before anything summarizes it. **Acceptance:** a golden pack's every rating/divergence figure matches store/engine outputs; the override rationale appears verbatim; triage ordering is reproducible from the documented rules.