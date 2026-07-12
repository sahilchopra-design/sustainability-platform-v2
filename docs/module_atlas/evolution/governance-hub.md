## 9 · Future Evolution

### 9.1 Evolution A — Real governance composite from sourced board/proxy data (analytics ladder: rung 1 → 2)

**What.** §7 flags a fabricated composite: the guide describes `GQS = w1·BoardInd + w2·AuditQuality + w3·RemunAlign + w4·ShareholderRights` (board independence + audit at 55%, remuneration at 15%), but the code draws `govScore` and each of 18 governance attributes independently from the seeded PRNG — the headline score is statistically unrelated to its supposed drivers and cannot be reconstructed from the displayed fields (a model-risk reviewer's red flag). Audit-committee independence and ISS/Glass Lewis vote-alignment are named in the guide but entirely absent, and say-on-pay appears as two unrelated random series. Evolution A builds the real composite: source board composition, audit-committee independence, remuneration-sustainability linkage, and shareholder-rights data per issuer, then compute `GQS` as the documented weighted sum so the score is auditable from its inputs.

**How.** (1) A governance-attributes table per issuer (independence %, women %, tenure, audit-committee independence, say-on-pay outcome, remuneration-KPI linkage) sourced from proxy filings / a governance data provider. (2) Compute `govScore` as the weighted composite of those fields — never an independent draw — so it reconstructs exactly. (3) Add the missing ISS/Glass Lewis vote-alignment and audit-committee-independence fields; reconcile the duplicate say-on-pay series into one.

**Prerequisites.** Real issuer governance data (proxy/ISS feed, or a curated demo set); the 60 seeded companies with real-name labels replaced by actual sourced data (a §7-flagged fabrication where real names sit on random metrics). **Acceptance:** `GQS` recomputes exactly from its four weighted drivers for every issuer; audit-committee independence and vote-alignment fields exist and populate; no `sr()` drives the headline score.

### 9.2 Evolution B — Stewardship and proxy-voting copilot (LLM tier 2)

**What.** A copilot for active-ownership teams: "rank our holdings by governance-score gap and portfolio weight for this proxy season, and flag remuneration misalignments" tool-calls the Evolution A governance endpoints, ranks engagement priorities, and drafts the stewardship brief with each metric sourced from filings.

**How.** Tier-2 tool-calling over the governance-composite and issuer-detail endpoints; the grounding corpus is §5/§7, which name ICGN Global Governance Principles, ISS GQS methodology, MSCI Governance Pillar, and ESRS G1. The copilot's value is turning the composite into a prioritised proxy/engagement agenda tied to say-on-pay outcomes and board deficiencies. Guardrail, pre-Evolution-A: because §7 shows the scores are fabricated and reuse real issuer names, the copilot must refuse issuer-specific governance claims to avoid libel-adjacent fabrication about named companies.

**Prerequisites.** Evolution A (governance metrics on real names must be sourced before an LLM narrates them); RBAC-scoped portfolio; corpus embedding. **Acceptance:** every governance metric in a stewardship brief traces to a sourced tool response; pre-Evolution-A the copilot declines to characterise any named issuer's governance, explaining the data is illustrative.
