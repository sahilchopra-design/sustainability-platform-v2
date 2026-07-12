# Transition Risk Dashboard
**Module ID:** `transition-risk-dashboard` · **Route:** `/transition-risk-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CE2 · **Sprint:** CE

## 1 · Overview
Executive command centre with 6 KPI cards, sector heatmap, holdings monitor with CRITICAL/HIGH/MEDIUM/LOW/LEADER flags, regulatory readiness tracker, and engagement pipeline with escalation framework.

**How an analyst works this module:**
- Executive Summary shows 6 KPI cards with QoQ trends
- Sector Heatmap displays 8 sectors with score/ITR/VaR
- Holdings Monitor sorts top 10 by weight, score, or ITR with risk flags
- Regulatory Readiness shows TCFD/ISSB/CSRD/SFDR/TPT progress bars
- Engagement Pipeline tracks stewardship actions with P1/P2/P3 priority

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGAGEMENT`, `HOLDINGS`, `KPI_CARDS`, `Kpi`, `RADAR_DATA`, `REG_STATUS`, `SCORE_SERIES`, `SECTOR_HEAT`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `KPI_CARDS` | 7 | `value`, `sub`, `delta`, `up`, `color` |
| `SCORE_SERIES` | 7 | `score`, `itr`, `vaR` |
| `SECTOR_HEAT` | 9 | `score`, `itr`, `vaR`, `stranded`, `gfanz` |
| `REG_STATUS` | 6 | `pillars`, `complete`, `color` |
| `RADAR_DATA` | 7 | `val` |
| `ENGAGEMENT` | 6 | `action`, `due`, `status`, `priority` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HOLDINGS` | `isIndiaMode() ? adaptForTransitionRisk().slice(0, 10).map(c => ({` |
| `sortedHoldings` | `useMemo( () => [...HOLDINGS].sort((a, b) => b[sortField] - a[sortField]), [sortField] );` |
| `total` | `fw.pillars.length * 4;` |
| `done` | `fw.complete.reduce((a, b) => a + b, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT`, `KPI_CARDS`, `RADAR_DATA`, `REG_STATUS`, `SCORE_SERIES`, `SECTOR_HEAT`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio CVaR | `From EP-CE1` | Climate VaR Engine | Portfolio-level climate value-at-risk under NZ2050 |
| ITR | `From EP-CC1` | PACTA/GFANZ | Portfolio implied temperature rise |
| WACI | `From EP-CC2` | PCAF | Weighted average carbon intensity |
| Stranded Exposure | `From EP-CA2` | Carbon Tracker | Total stranded asset exposure under NZ2050 |
| GFANZ Alignment | `From EP-CC1` | Alliance databases | Portfolio percentage aligned with GFANZ commitments |
| Regulatory Readiness | `From EP-BZ3` | AI Compliance Agent | Framework-by-framework disclosure completeness |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-module KPI aggregation
**Headline formula:** `Portfolio_Score = AUM_weighted_avg(entity_scores); Green_Bond_Pass_Rate = Pass_Count / Total_Count`

Aggregates outputs from all Sprint CA-CE modules into 6 executive KPIs. CVaR from EP-CE1, ITR from EP-CC1, WACI from EP-CC2, Stranded from EP-CA2, GFANZ from EP-CC1, Green Bond from EP-CC3. Holdings flagged: CRITICAL (score<35), HIGH (35-50), MEDIUM (50-65), LOW (65-80), LEADER (>80).

**Standards:** ['TCFD', 'ISSB S2', 'CSRD', 'GFANZ']
**Reference documents:** TCFD Recommendations; ISSB IFRS S2; CSRD ESRS E1; GFANZ Sector Pathways

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

An executive "command centre" that aggregates figures **claimed to originate** from other Sprint
CA–CE platform modules (Climate VaR Engine EP-CE1, ITR/GFANZ EP-CC1, WACI EP-CC2, Stranded Assets
EP-CA2, Green Bond Screener EP-CC3) into one dashboard. Every number — KPI cards, sector heatmap,
holdings table, regulatory readiness bars, engagement pipeline — is a **static hardcoded value**,
not a live query against those source modules. There is no PRNG and no backend call; the only
runtime logic is India-mode data substitution (`isIndiaMode()` swaps the 10-holding table for a
localised dataset via `adaptForTransitionRisk()`).

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `KPI_CARDS` | 6 cards: Climate VaR 8.7%, ITR 2.4°C, WACI 182 tCO₂/$M, Stranded $2.1B, GFANZ 61%, Green Bond 23/38 | Hardcoded; these exact figures also appear in `transition-reg-reporting`'s `METRICS_TABLE`, suggesting a shared (manually synchronised) narrative baseline across modules rather than a genuinely shared data pipeline |
| `SCORE_SERIES` | 6-quarter trend (Q1-24→Q2-25): score 48→58, ITR 2.9°C→2.4°C, VaR 11.2%→8.7% | Static, internally consistent improving trend |
| `SECTOR_HEAT` | 8 sectors × {score, ITR, VaR, stranded%, GFANZ%} | Hardcoded; directionally sensible ordering (Energy worst: score 38, ITR 3.4°C, VaR 22%; Technology best: score 74, ITR 1.7°C, VaR 3%) |
| `HOLDINGS` (default, non-India) | 10 real-named companies (Shell, BP, BASF, RWE, Siemens, Vestas, LVMH, Microsoft, Deutsche Bank, Lufthansa) with weight/score/ITR/flag | Hardcoded; India mode substitutes `adaptForTransitionRisk()` output instead |
| `REG_STATUS` | 5 frameworks (TCFD, ISSB S2, CSRD ESRS E1, SFDR Art.9, UK TPT) × 4 pillars each with a completed-count 0–4 | Hardcoded readiness snapshot |
| `flag` thresholds (per the module guide) | CRITICAL <35, HIGH 35–50, MEDIUM 50–65, LOW 65–80, LEADER >80 | **Guide-stated rule; not implemented as a live function in code** — each holding's `flag` is a separately hardcoded string, not derived from its `score` at render time |

### 7.3 Calculation walkthrough

1. **KPI cards**: rendered directly from the static `KPI_CARDS` array (value, sub-label, and a
   hardcoded QoQ delta) — no aggregation occurs across the 10-holding table or sector heatmap to
   produce these headline numbers.
2. **Sector heatmap**: direct render of `SECTOR_HEAT`, not derived from `HOLDINGS` (there are only
   10 holdings but 8 sectors, so a real sector rollup would be sparse/noisy — the module sidesteps
   this by using an independently-authored sector table).
3. **Holdings monitor**: `sortedHoldings` sorts the 10-row `HOLDINGS` table by weight/score/ITR on
   click; each row's `flag` badge colour comes from `flagColor()`, a simple lookup, not a
   threshold evaluation of that row's own `score`.
4. **Regulatory readiness**: `total = pillars.length × 4`, `done = Σ complete[]` per framework — a
   genuinely computed percentage-of-max, but over hand-set `complete` counts (e.g. TCFD 4+4+4+3=15
   of 16 possible → 94%, matching the guide's cited "TCFD 94%").
5. **Engagement pipeline**: static 5-row action list (company, action, due date, status, priority),
   thematically linked to the CRITICAL/HIGH holdings (Shell, Lufthansa, BP, BASF) but not
   programmatically generated from their flags.

### 7.4 Worked example (flag-vs-threshold consistency check)

Testing the guide's stated threshold rule (`CRITICAL<35, HIGH 35–50, MEDIUM 50–65, LOW 65–80,
LEADER>80`) against the actual hardcoded `HOLDINGS` data:

| Holding | Score | Hardcoded flag | Flag per guide's rule | Consistent? |
|---|---|---|---|---|
| Shell PLC | 38 | CRITICAL | HIGH (35–50) | **No** |
| BP PLC | 42 | HIGH | HIGH | Yes |
| BASF SE | 47 | HIGH | HIGH | Yes |
| RWE AG | 58 | MEDIUM | MEDIUM | Yes |
| Siemens AG | 64 | LOW | MEDIUM (50–65) | **No** |
| Vestas Wind | 79 | LEADER | LOW (65–80) | **No** |
| Microsoft | 81 | LEADER | LEADER | Yes |
| Lufthansa | 34 | CRITICAL | CRITICAL (<35) | Yes |

3 of 8 checkable holdings (Shell, Siemens, Vestas) carry a flag inconsistent with the guide's own
stated threshold rule — direct evidence that `flag` is a manually-assigned label, not the output of
a live scoring function, even within the module's own reference dataset.

### 7.5 Companion analytics

- **Radar chart** (`RADAR_DATA`) — 6-axis multi-pillar readiness view (Carbon Exposure, Tech
  Readiness, Policy Risk, Market Dynamics, Capital, Social Licence), static values, not tied to
  any specific holding or sector.
- **India-mode substitution** — when `isIndiaMode()` is true, `adaptForTransitionRisk()` supplies a
  parallel Indian-market holdings dataset with the same schema (`transitionScore`,
  `temperatureAlignment_c`, `flag`), keeping the table structurally intact while swapping content.

### 7.6 Data provenance & limitations

- **No live cross-module data pipeline exists.** Every figure attributed to another EP-code module
  (Climate VaR, ITR, WACI, GFANZ, stranded assets) is a manually copied snapshot value, not a query
  result — see `transition-reg-reporting.md` for the same pattern and the same headline figures
  appearing verbatim in two independent files.
- **Risk flags are not rule-derived**, and where a rule is implied by the guide, the hardcoded data
  itself violates that rule for 3 of 8 checkable holdings (see §7.4) — this would be materially
  misleading in a real risk-management context, where a CRITICAL flag should always correspond to
  the worst-scoring tier.
- All 10 default holdings are real, named public companies with plausible-but-illustrative
  score/ITR/weight figures — not sourced from live financial or ESG data feeds.

### 7.7 Framework alignment

- **TCFD / ISSB S2 / CSRD ESRS E1 / SFDR Art.9 / UK TPT**: the 5-framework regulatory readiness
  tracker correctly lists each framework's real pillar structure; completeness percentages are
  computed correctly from hand-set counts but are not backed by an actual disclosure audit.
- **GFANZ alignment, PCAF financed emissions (WACI), Implied Temperature Rise**: all real,
  standard climate-finance metrics correctly named and contextualised, though — as with the
  regulatory tracker — the values shown are static rather than computed.
- **Stewardship/engagement escalation framework** (P1/P2/P3 priority, board-level escalation for
  CRITICAL holdings): reflects genuine real-world investor stewardship practice (e.g. Climate
  Action 100+ escalation protocols), implemented here as a static illustrative pipeline.

## 9 · Future Evolution

### 9.1 Evolution A — Live cross-module aggregation and rule-derived risk flags (analytics ladder: rung 1 → 2)

**What.** This "command centre" claims to aggregate figures from other Sprint CA–CE modules (Climate VaR EP-CE1, ITR EP-CC1, WACI EP-CC2, Stranded EP-CA2, Green Bond EP-CC3), but §7.6 documents every number is a hardcoded snapshot — the same figures appear verbatim in `transition-reg-reporting`, a shared manual baseline, not a shared pipeline. Worse, §7.4 finds the risk flags aren't rule-derived: testing the guide's own thresholds (CRITICAL<35, HIGH 35–50...) against the hardcoded `HOLDINGS` data, 3 of 8 flags are inconsistent (Shell scores 38 but is flagged CRITICAL, not HIGH; Vestas 79 is LEADER, not LOW) — direct evidence flags are hand-labelled, materially misleading in a real risk context.

**How.** (1) Wire the 6 KPI cards to live queries against the named source modules — the dashboard already documents the EP-code system-of-record for each, so the integration targets are specified; this is the platform's lineage graph made executable (shared prerequisite with `transition-reg-reporting`). (2) Implement `flag = f(score)` as an actual render-time function over the threshold table, eliminating the §7.4 inconsistencies. (3) Derive the sector heatmap from holdings where coverage supports it, or label it an independent reference (§7.3 notes 10 holdings can't populate 8 sectors). (4) Generate the engagement pipeline from flagged holdings rather than a static thematically-linked list. (5) Make regulatory readiness reflect a real disclosure audit, not hand-set completion counts.

**Prerequisites.** Live read access to the ~6 source EP-code modules; the same cross-module-query infrastructure `transition-reg-reporting`'s Evolution A needs — build once, share. **Acceptance:** every KPI card responds to its source module's current output; a holding's flag always matches its score-tier by construction; identical baseline figures no longer diverge between this module and the reg-reporting module.

### 9.2 Executive climate-risk copilot with drill-through (LLM tier 1 → 2)

**What.** An executive-summary copilot: "what's driving our 8.7% Climate VaR?", "which CRITICAL holdings need board escalation this quarter?", "summarise sector heatmap movements QoQ for the board pack" — narrating the dashboard's aggregates and, post-Evolution-A, drilling through to source-module detail via tool calls.

**How.** Tier 1 grounds in this Atlas record and page state; the copilot explains the KPIs, the flag thresholds, and the stewardship escalation framework (P1/P2/P3, board-level for CRITICAL — genuine Climate Action 100+-style practice per §7.7). Tier 2 is the roadmap's desk-orchestration pattern: once Evolution A wires the source modules, the copilot routes drill-through queries ("show the stranded-asset detail behind the $2.1B") as tool calls to EP-CA2 et al., assembling board narratives with every figure source-traced. Hard guardrail pre-Evolution-A: the copilot must not present the hardcoded snapshot as live, and must not narrate flags it can see are internally inconsistent (§7.4) — it should surface that inconsistency, not paper over it.

**Prerequisites.** Evolution A's live wiring and flag fix for trustworthy tier-2 drill-through. **Acceptance:** board-summary figures trace to KPI cards or source-module tool calls; flag references are self-consistent; pre-Evolution-A output carries the snapshot caveat.