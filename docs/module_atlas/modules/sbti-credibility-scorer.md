# SBTi Credibility Scorer
**Module ID:** `sbti-credibility-scorer` · **Route:** `/sbti-credibility-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CM1 · **Sprint:** CM

## 1 · Overview
30 companies scored on 5-pillar SBTi credibility framework with say-do gap quantification.

**How an analyst works this module:**
- Credibility Dashboard shows 30 companies with 5-pillar scores
- Say-Do Gap Quantifier highlights divergence between targets and actions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMBITION`, `COMPANIES`, `INTERIM`, `SCOPE_COV`, `TABS`, `VALIDATION`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 31 | `sector`, `validation`, `ambition`, `scope`, `interim`, `capex` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `VALIDATION` | `{ approved: 20, committed: 10, 'self-declared': 5 };` |
| `SCOPE_COV` | `{ '1+2+3': 25, '1+2': 15 };` |
| `INTERIM` | `{ met: 15, 'on-track': 10, behind: 5, 'no-interim': 0 };` |
| `TABS` | `['Credibility Dashboard','Validation Status Tracker','Target Ambition Analysis','Scope 3 Coverage Audit','Interim Milestone Tracking','Say-Do Gap Quantifier'];` |
| `sectors` | `['All', ...new Set(COMPANIES.map(c => c.sector))];` |
| `validationDist` | `Object.entries(VALIDATION).map(([k]) => ({` |
| `sectorAvgs` | `[...new Set(COMPANIES.map(c => c.sector))].map(s => {` |
| `ambitionDist` | `Object.entries(AMBITION).map(([k]) => ({` |
| `interimDist` | `Object.entries(INTERIM).map(([k]) => ({` |
| `gapData` | `COMPANIES.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | SBTi Database | With target data |
| Say-Do Gap | `Target vs actual progress` | Proprietary | Difference between stated ambition and demonstrated action |

## 5 · Intermediate Transformation Logic
**Methodology:** 5-pillar credibility scoring
**Headline formula:** `Score = Validation(20) + Ambition(25) + Scope(25) + Interim(15) + CapEx(15)`

Validation: approved=20, committed=10, self-declared=5. Ambition: 1.5°C=25, WB2C=15, 2°C=10. Scope: 1+2+3=25, 1+2=15. Interim: met=15, on-track=10, behind=5. CapEx: green ratio alignment.

**Standards:** ['SBTi Corporate Standard', 'CDP']
**Reference documents:** SBTi Corporate Net-Zero Standard v1.2; CDP Climate Change Scores

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module faithfully implements the guide's 5-pillar additive scoring formula — one of the more
code-accurate modules in this batch — applied to a hand-curated (not seeded-PRNG) roster of 30
real, recognisable companies.

### 7.1 What the module computes

```
score = VALIDATION[validation] + AMBITION[ambition] + SCOPE_COV[scope] + INTERIM[interim] + capex
gap   = ambition==='1.5C' ? 100-score : ambition==='WB2C' ? 75-score : 50-score
sectorAvg = mean(score) grouped by sector
```
Each company (`COMPANIES`, 30 rows: Unilever, Microsoft, Nestle, Apple, Shell, TotalEnergies, BP,
BASF, HeidelbergCement, ArcelorMittal, Amazon, Alphabet, Samsung, Volkswagen, Toyota, BMW,
JPMorgan, HSBC, BNP Paribas, Enel, Iberdrola, Orsted, Lafarge, Glencore, Rio Tinto, and others)
carries a hand-assigned `validation`/`ambition`/`scope`/`interim` category and a `capex` (green
capex % of total, 2-15 range) value.

### 7.2 Parameterisation (the 5-pillar rubric)

| Pillar | Max points | Category → points |
|---|---|---|
| Validation | 20 | approved=20, committed=10, self-declared=5 |
| Ambition | 25 | 1.5C=25, Well-below-2C (WB2C)=15, 2C=10 |
| Scope coverage | 25 | 1+2+3=25, 1+2=15 |
| Interim milestone | 15 | met=15, on-track=10, behind=5, no-interim=0 |
| CapEx alignment | 15 (raw value used directly, observed range 2-15) | Green capex % of total capex, used as a direct point contribution — i.e. the company's raw `capex` field caps out near the pillar's max weight by construction (dataset never exceeds 15) |
| **Total** | **100** | Matches the guide's stated `Score = Validation(20) + Ambition(25) + Scope(25) + Interim(15) + CapEx(15)` exactly |

The 30-company `validation`/`ambition`/`scope`/`interim`/`capex` assignments are **editorial
judgement calls** by the module's author, informed by each company's real public climate profile
(e.g. Shell "committed / WB2C / behind" and ArcelorMittal "self-declared / 2C / no-interim" are
plausible characterisations of those companies' actual SBTi status circa the guide's reference
period) rather than a live pull from the SBTi target dashboard — so individual company scores
should be read as illustrative, not as verified current SBTi records.

### 7.3 Calculation walkthrough

1. `score` is computed once per company via direct object-lookup summation — no randomisation, no
   PRNG — a genuinely deterministic, auditable calculation.
2. `rating(score)` buckets the 0-100 score into a qualitative tier (implementation not shown in
   the excerpt but referenced via `ratingColor(rating(c.score))`) for colour-coded display.
3. `sectorAvg` groups the 30 companies by `sector` (Consumer, Tech, Energy, Materials, Auto,
   Finance, Utilities, Mining) and averages `score` — a genuine aggregation.
4. `gapData`'s **say-do gap** is the distance between the company's *stated ambition ceiling*
   (100 for 1.5C-aligned, 75 for WB2C, 50 for 2C) and its *actual achieved score* — i.e. it
   penalises companies that claim a high-ambition pathway (1.5C) but score poorly on validation/
   scope/interim/capex execution, exactly the "credibility gap" concept the guide names. A company
   claiming 1.5C with `score=60` shows `gap=40` — a large say-do gap; a company claiming 2C with
   the same `score=60` shows `gap=-10` (negative, i.e. over-delivering relative to its stated
   ambition).

### 7.4 Worked example

Shell: `validation='committed'` (10) + `ambition='WB2C'` (15) + `scope='1+2+3'` (25) +
`interim='behind'` (5) + `capex=8` = `10+15+25+5+8 = 63/100`.
`gap = 75 - 63 = 12` — a moderate say-do gap, reflecting a company with broad scope coverage and a
validated pathway but weak interim delivery and below-average green capex allocation.

Compare Ørsted: `validation='approved'` (20) + `ambition='1.5C'` (25) + `scope='1+2+3'` (25) +
`interim='met'` (15) + `capex=15` = `20+25+25+15+15 = 100/100`, `gap = 100-100 = 0` — a
best-in-class profile consistent with Ørsted's real-world reputation as a utility sector leader
in renewable transition.

### 7.5 Data provenance & limitations

- The scoring **formula** is correctly and deterministically implemented, exactly matching the
  guide.
- The **company-level input data** (validation/ambition/scope/interim/capex classifications) is
  hand-curated by the module author based on real companies' public climate profiles, not sourced
  from a live SBTi API — this is materially more defensible than seeded-PRNG fabrication (seen in
  most other modules in this batch) but still requires periodic manual refresh as companies'
  actual SBTi status changes (e.g. targets can be validated, extended, or removed).
- `capex` (2-15 range) is used as a raw point contribution without an explicit stated scaling
  formula (e.g. no documented mapping from "% green capex" to "0-15 points"); it appears the
  author simply capped illustrative capex percentages within the pillar's weight range.
- 30 companies is a small, hand-picked sample — not representative of SBTi's full validated-company
  universe (thousands of companies), so sector averages should not be read as market-wide
  statistics.

**Framework alignment:** SBTi Corporate Net-Zero Standard v1.2 (validation tiers, ambition
categories 1.5C/WB2C/2C, and scope coverage requirements are all correctly reproduced) · CDP
Climate Change Scores (referenced as a complementary data source in the guide, not integrated into
the score) · the say-do gap concept is a genuine, defensible methodological addition beyond the
raw SBTi status, though its ambition-ceiling proxy (100/75/50) is the author's own construction,
not a published SBTi or CDP benchmark.

## 9 · Future Evolution

### 9.1 Evolution A — Refreshable inputs from the SBTi public dashboard (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the batch's most code-accurate modules: the 5-pillar additive score (validation + ambition + scope coverage + interim targets + capex) exactly implements the guide, over 30 hand-curated real companies — materially more defensible than PRNG fabrication, but §7.5 notes the inputs need periodic manual refresh as companies' actual SBTi statuses change (targets get validated, extended, removed), and the `capex` pillar (2–15 points) lacks an explicit scaling basis. Evolution A automates the refreshable pillars and documents the judgment-based ones.

**How.** (1) Ingest the SBTi Target Dashboard export (public CSV: company, validation status, ambition classification, scope coverage, target years) on a schedule; the validation/ambition/scope/interim pillars derive from it with as-of dates, expanding coverage beyond 30 names to the full validated universe. (2) The capex pillar — genuinely judgment-based — gets a documented rubric (e.g. disclosed low-carbon capex share bands mapped to point ranges) with per-company evidence links; where no disclosure exists, the pillar reports null and the composite renormalises over available pillars rather than silently defaulting. (3) The say-do gap gains its natural counterpart: actual emissions trajectory vs target path (from disclosure-derived or `sbti-climate-trace` facility data), making "do" measurable rather than inferred from target architecture alone. (4) Backend route with the score decomposition per company; bench pin on a hand-scored reference company.

**Prerequisites.** SBTi export ingester; capex rubric authored with citations; curated 30-company set kept as the validation fixture. **Acceptance:** a company's pillar values match the dashboard export for its as-of date; missing capex renormalises visibly; the bench company's score reproduces by hand.

### 9.2 Evolution B — Engagement-prioritisation copilot (LLM tier 2)

**What.** Credibility scores exist to direct stewardship attention. The copilot operationalises: "rank our holdings by credibility gap and draft engagement asks specific to each company's weakest pillar" — a low interim-target pillar yields a different ask than a low capex pillar, and the score decomposition makes that mapping mechanical; "explain why Company X scores 62 vs the sector average 71, pillar by pillar".

**How.** Tier-2 tool calls over the scoring endpoints; engagement asks are template-mapped from pillar deficits (documented ask library per pillar) and populated with the company's actual values and as-of dates — the LLM personalizes the language, the pillar logic picks the substance. Sector comparisons quote computed averages. Guardrails: SBTi status claims only from the ingested dashboard vintage (statuses change; stale assertions about named companies are the risk); judgment-pillar values (capex) always cite their evidence link; the copilot distinguishes target architecture (what this module scores) from delivered decarbonisation (routing trajectory questions to the say-do extension or `sbti-climate-trace`).

**Prerequisites.** Evolution A's ingested inputs and decomposition endpoint; ask library authored. **Acceptance:** every pillar value in an answer matches the endpoint with its vintage; asks map to the actual weakest pillars; status claims never exceed the ingested data's date.