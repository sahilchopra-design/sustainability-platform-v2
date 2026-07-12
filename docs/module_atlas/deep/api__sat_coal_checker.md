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
