# Api::Sat_Coal_Checker
**Module ID:** `api::sat_coal_checker` · **Route:** `/api/v1/sat-coal` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sat-coal/check` | `check_coal_phase_out` | api/v1/routes/sat_coal_checker.py |
| GET | `/api/v1/sat-coal/thresholds` | `get_thresholds` | api/v1/routes/sat_coal_checker.py |
| GET | `/api/v1/sat-coal/gem-summary` | `get_gem_summary` | api/v1/routes/sat_coal_checker.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_reference_data` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `reference`, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sat-coal/gem-summary** — status `passed`, provenance ['real-db'], source tables: `dh_reference_data`
Output: `{'type': 'object', 'keys': ['message'], 'n_keys': 1}`

**GET /api/v1/sat-coal/thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['revenue_thresholds', 'phase_out_deadlines', 'pipeline_risk_categories', 'criteria'], 'n_keys': 4}`

**POST /api/v1/sat-coal/check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`api/v1/routes/sat_coal_checker.py` is a self-contained route module (no separate engine file)
implementing a **coal phase-out alignment checker** against IEA NZE / NZBA / PPCA criteria.
`POST /api/v1/sat-coal/check` scores each counterparty on 5 criteria (10 points each) and rolls
up a portfolio view; `GET /thresholds` returns the rubric; `GET /gem-summary` reads the Global
Energy Monitor Coal Plant Tracker rows from the `dh_reference_data` table.

```
coal_revenue_pct  = thermal_coal_revenue / total_revenue × 100      (unless supplied directly)
overall_score     = Σ criterion_score / 50 × 100                    (0–100)
entity RAG        = GREEN (5/5 met) · AMBER (≥3/5) · RED (<3)       + two RED overrides
portfolio_coal %  = Σ (FI exposure × coal_rev_pct) / Σ FI exposure  (FI exposure defaults to revenue)
portfolio RAG     = RED if any exclusion entity or >10% · AMBER if any watchlist or >5% · GREEN
```

### 7.2 Scoring rubric

**Revenue classification** (`COAL_REVENUE_THRESHOLDS`): ≥25% Exclusion, ≥10% Watchlist,
≥5% Engagement, <5% Acceptable — the 25% exclusion line matches common bank coal policies /
NZBA practice. **Phase-out deadlines**: OECD 2030, non-OECD 2040, no-new-coal from 2021 (IEA
NZE). **Five criteria** (each `met` boolean + partial-credit score):

| # | Criterion | Met condition | Partial credit | Cited source (in code) |
|---|---|---|---|---|
| C1 | No New Coal | `no_new_coal_since_2021` and 0 announced projects | 5.0 if ≤1 project | IEA NZE 2050 §3.2 |
| C2 | Phase-out timeline | commitment and target year ≤ deadline (2030/2040) | 5.0 if committed but late/undated | IEA NZE + NZBA |
| C3 | Credible transition plan | plan exists **and** verified | 6.0 if unverified plan | NZBA / GFANZ framework |
| C4 | Just Transition | just-transition plan exists | none (0/10) | ILO Guidelines / PPCA |
| C5 | Revenue declining | coal rev < 25% **and** declining YoY | 5.0 if declining but ≥25% | NZBA coal sub-sector guidance |

**RED overrides** (applied after the criteria count): (a) announced projects > 0 *and*
expansion capex > 0 → "ACTIVE COAL EXPANSION DETECTED"; (b) coal revenue ≥ 25% and not
declining → exclusion-threshold breach. Expansion risk is separately labelled HIGH (projects
announced) / MEDIUM (capex only) / LOW, with the 9-state GEM pipeline-status legend
(`PIPELINE_RISK`: announced/pre-permit/permitted HIGH, construction CRITICAL, operating MEDIUM,
mothballed/shelved LOW, retired/cancelled NONE) served as reference.

### 7.3 Calculation walkthrough

For each entity: derive coal revenue % (input override wins), classify it, derive coal capacity
% and generation % (input override wins for capacity), evaluate the 5 criteria, sum scores into
`overall_score`, count met criteria into the RAG, apply the two RED overrides, and generate a
recommendation string (GREEN → monitor; AMBER → "Escalated engagement… Address: {first 3 failed
criteria}"; RED with ≥25% revenue → "EXCLUSION CANDIDATE… Divest or set binding engagement
timeline (max 2 years)"). Portfolio aggregation weights each entity's coal revenue share by its
FI exposure (`fi_outstanding_eur`, falling back to total revenue when the financed amount is
unknown). Finally `_get_gem_coal_summary` pivots `dh_reference_data` rows where
`source_name = 'GEM Coal Plant Tracker'` into `{country: {kpi: value}}` — real ingested
reference data, returned as `None` (and `"No GEM coal data loaded"`) when absent.

### 7.4 Worked example

Utility, OECD, revenue €10bn of which €1.8bn thermal coal (18%); 1 announced project, no
expansion capex; phase-out committed for 2032; unverified transition plan; no just-transition
plan; revenue declining YoY; FI exposure €500M.

| Criterion | Met? | Score |
|---|---|---|
| C1 no new coal | No (1 project) | 5.0 |
| C2 phase-out ≤2030 | No (2032 > 2030) | 5.0 (committed) |
| C3 transition plan | No (unverified) | 6.0 |
| C4 just transition | No | 0.0 |
| C5 revenue <25% & declining | Yes (18%, declining) | 10.0 |
| **Totals** | 1/5 met | 26/50 → **overall 52.0** |

RAG: criteria_met = 1 < 3 → **RED** ("Significant Phase-Out Gaps — only 1/5 criteria met");
neither override fires (no capex; revenue <25%). Revenue class = Watchlist. Recommendation:
intensive engagement, board escalation in 12 months. Portfolio contribution: €500M × 18% =
€90M coal-weighted exposure.

Note the interplay: an entity can be RED by criteria count while its `overall_score` (52) looks
mid-range — the RAG is the governing signal.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic entities** — all entity data is caller-supplied; the GEM summary is
  real ingested reference data (Global Energy Monitor tracker) with an honest null fallback.
- GREEN requires a perfect 5/5 — there is no 4/5 tier, so one missing just-transition plan
  caps an otherwise aligned utility at AMBER (deliberately conservative).
- The portfolio metric proxies financed coal exposure by *revenue share*, not by asset-level
  attribution (a PCAF-style approach would attribute by outstanding/EVIC); using total revenue
  as the FI-exposure fallback mixes units (€ revenue vs € lending) in the weighting.
- CCS inputs (`has_ccs`, `ccs_capture_rate_pct`) are accepted but **unused** in scoring — the
  "unabated" qualifier of IEA NZE is not yet operationalised.
- Thresholds are policy conventions, not physical constants: 25%/10%/5% revenue tiers and
  2030/2040 deadlines are faithful to NZBA/IEA/PPCA norms but simplified (e.g. IPCC AR6's
  −80%-by-2030 pathway is cited in the policy reference block, not tested per entity).

### 7.6 Framework alignment

- **IEA Net Zero by 2050 (2021)** — headline milestones implemented: no new unabated coal
  approvals from 2021 (C1) and coal phase-out in advanced economies by 2030 / globally by 2040
  (C2's OECD/non-OECD deadlines).
- **NZBA (UNEP FI, 2022)** — the Net-Zero Banking Alliance expects members to set sectoral
  coal policies with phase-out timelines and declining exposure; C2/C3/C5 and the
  engagement-vs-divestment recommendations mirror this supervision-by-engagement model.
- **GFANZ transition-plan framework** — C3's "published and verified" test is a proxy for
  GFANZ's credibility criteria (targets, implementation, governance).
- **ILO Just Transition Guidelines / PPCA** — C4 checks for worker/community provisions, the
  PPCA membership hallmark.
- **IPCC AR6 WGIII** — cited as the scientific anchor (~80% coal power reduction by 2030 vs
  2020) in the response's `policy_reference`.
- **Global Energy Monitor Coal Plant Tracker** — the authoritative open dataset for coal
  pipeline status; ingested into `dh_reference_data` and surfaced via `/gem-summary`, with the
  pipeline-status taxonomy matching GEM's categories.

## 9 · Future Evolution

### 9.1 Evolution A — GEM-plant-linked phase-out assessment with pipeline risk (analytics ladder: rung 2 → 3)

**What.** A self-contained coal phase-out alignment checker (no separate engine) scoring
counterparties against IEA NZE / NZBA / PPCA criteria: `POST /check` scores 5 criteria (10 pts
each) → `overall = Σ/50 × 100` with entity RAG (5/5 GREEN, ≥3/5 AMBER, else RED, plus two RED
overrides) and a portfolio roll-up (RED if any exclusion entity or >10% coal exposure). The
revenue thresholds (≥25% Exclusion, ≥10% Watchlist) match NZBA practice. `GET /gem-summary` reads
the Global Energy Monitor Coal Plant Tracker from `dh_reference_data`. The gap: the check is
counterparty-input-driven and doesn't yet cross-reference the GEM plant data to detect undisclosed
coal capacity or expansion pipelines. Evolution A links them.

**How.** (1) Cross-reference the counterparty (via entity resolution) against the GEM Coal Plant
Tracker rows already in `dh_reference_data`, so the checker flags operating capacity and — critically
— *pipeline* (announced/under-construction) plants that a self-reported coal-revenue % would miss.
This makes the pipeline-risk criterion evidence-based rather than declared. (2) Add a forward
phase-out trajectory check: does the counterparty's retirement schedule meet the OECD-2030 /
global-2040 deadlines the thresholds encode? (3) Confirm `/check` (traces `skipped`) works
end-to-end. (4) Bench-pin the 5-criterion scoring and portfolio roll-up.

**Prerequisites.** Entity resolution to link counterparties to GEM plant rows; GEM tracker fully
loaded in `dh_reference_data`. **Acceptance:** the check flags GEM-recorded pipeline capacity not in
the self-reported revenue %; a retirement-schedule vs deadline verdict is returned; `/check` returns
`passed`; scoring bench-pinned.

### 9.2 Evolution B — Coal-policy screening copilot (LLM tier 2)

**What.** A copilot that screens a counterparty or portfolio against coal policy — "this utility
fails NZBA: 18% thermal-coal revenue (Watchlist) plus 2 GEM-tracked plants under construction, no
2030 retirement plan" — each figure from a tool call, citing the GEM evidence and the threshold
rubric.

**How.** Three endpoints (`/check`, `/thresholds`, `/gem-summary`) form the tool set; the
`/thresholds` rubric grounds every RAG band and deadline, and `/gem-summary` provides the plant-level
evidence. The 5-criterion decomposition lets the copilot explain exactly why a counterparty is
excluded. Portfolio what-ifs ("if we divest this name, does our coal exposure drop below 5%?") re-run
statelessly. Node for a financing/exclusions desk, cross-linking to `sfdr_exclusion` and
`gdelt_controversy`.

**Prerequisites.** Evolution A's GEM linkage for evidence-based pipeline claims; `/check` fix.
**Acceptance:** every revenue %, criterion score, and plant reference traces to a tool response; the
copilot cites GEM plant evidence for capacity claims rather than only self-reported revenue; it
frames verdicts as policy-alignment screening against the stated thresholds, not investment advice.