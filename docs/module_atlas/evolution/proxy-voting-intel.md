## 9 · Future Evolution

### 9.1 Evolution A — Vote ledger with a computed alignment ratio (analytics ladder: rung 1 → 2)

**What.** The page is a competent filter/sort/paginate workbench doing correct aggregate arithmetic over fabricated inputs: 80 real company names and a real proposal taxonomy (As You Sow, Follow This, ICCR filers; 12 proposal types), but every quantity is `sr()`-seeded, and — the §7 flag's core point — `issVote`/`glassLewis` are seeded binary flags (`sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'`), so the guide's `VA = (votes_aligned_to_policy / total_votes) × 100` is never computed from a vote ledger. Evolution A builds that ledger and derives alignment properly, sharing infrastructure with `proxy-voting-climate` (whose evolution proposes the same `proxy_resolutions`/`proxy_votes` tables) rather than duplicating it — this module takes the workflow role: recommendations, overrides with rationale, outcome tracking.

**How.** (1) Extend the shared register with `proxy_vote_recommendations` (policy-derived recommended vote per resolution) and `proxy_vote_overrides` (analyst rationale, timestamped — the "document rationale for deviations" workflow §1 promises but nothing stores). (2) `GET /alignment` computes VA as cast-vs-policy over ledger rows, per period and per proxy-advisor benchmark; ISS/GL alignment becomes a comparison against ingested advisor recommendations where available, or is dropped — not simulated. (3) SEC N-PX filings as the free real-data seed for cast votes; the seeded book retired to demo fixtures.

**Prerequisites.** Coordination with `proxy-voting-climate`'s Evolution A (one register, two surfaces); policy-rule encoding for recommendation generation. **Acceptance:** VA changes when one override flips a vote; the recommendation for a resolution cites the policy rule that produced it.

### 9.2 Evolution B — AGM-season triage analyst (LLM tier 2)

**What.** The 12-type proposal taxonomy and filer list make this the right surface for a triage analyst: "list next month's AGMs where our policy recommends against management, grouped by proposal type", "which overrides this season lack a documented rationale?", "draft the quarterly stewardship-outcomes summary from the ledger". Each is a tool call over the Evolution-A endpoints, with the summary composed from computed aggregates (pass rates, VA trend, override count) rather than recalled figures.

**How.** Tier-2 tool schemas from the ledger/alignment/recommendation endpoints; resolution-text summarization (the genuinely LLM-shaped task — proposal texts are long and formulaic) grounded in the stored resolution text field with the proposal-type taxonomy as the classification target. Override-quality checks are read-only; the copilot flags missing rationales but cannot write votes or overrides without the confirmation-gated mutation path. System prompt carries the §7 caveat until real data lands: seeded-book numbers must never be cited as stewardship fact.

**Prerequisites (hard).** Evolution A ledger with real or clearly-fixture data; resolution text stored (today only type labels exist). **Acceptance:** the quarterly summary's every statistic matches a ledger aggregate endpoint response, and proposal-type classifications agree with the stored taxonomy on a golden set.
