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
