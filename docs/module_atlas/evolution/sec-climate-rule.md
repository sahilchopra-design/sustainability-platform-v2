## 9 · Future Evolution

### 9.1 Evolution A — Repoint gap analysis to live regimes with sourced cost model (analytics ladder: rung 1 → 2)

**What.** The page's primary documented defect (§7 flag) is that it presents a rescinded rule as active law: `COMPLIANCE_PHASES` still shows Phase 1/2/3 as 'Active'/'Upcoming', while the shared `sec_climate_engine` and sibling module `sec-climate-disclosure` correctly carry `current_status: "RESCINDED"`. Evolution A first fixes that banner parity, then converts the module's genuinely useful machinery — item-by-item gap analysis and the Cost Calculator — into a multi-regime scenario tool covering regimes with actual legal force: California SB-253/SB-261, CSRD/ESRS E1, and ISSB S2 adoptions (the page's `INTL_COMPARISON` table already catalogues these accurately).

**How.** (1) Add the sibling's rescission banner and flip `COMPLIANCE_PHASES` statuses to 'Rescinded'. (2) Generalise the gap schema from Reg S-K items to a regime-parameterised item list served by a new `GET /api/v1/sec-climate/ref/regime-items?regime=` endpoint alongside the existing ten routes. (3) Replace the unsourced cost multipliers (`base = 4.2/1.8/0.6 $M`, flagged in §7.6) with cited survey ranges (SEC's own adopting-release cost estimates, ERM/Persefoni CSRD cost studies), returned as low/mid/high scenarios rather than a point estimate. (4) Unify the §7.6-flagged inconsistency where Sector Analysis uses a second independent synthetic dataset.

**Prerequisites.** Banner fix is a hard precondition — no analytics deepening before the page stops misstating legal status. **Acceptance:** no UI element labels 33-11275 as active; cost output shows a cited range per regime; sector view aggregates from the same company set as the company view.

### 9.2 Evolution B — Multi-regime obligations copilot (LLM tier 1)

**What.** A copilot answering "which climate disclosure rules actually apply to us?" — the question this page currently answers misleadingly. Grounded in the `INTL_COMPARISON` table, the six `/ref/*` endpoints of the shared backend, and this Atlas page's regulatory-status note, it walks a user from filer profile (revenue, listing, EU nexus, California nexus) to an honest applicability matrix, explicitly stating that the SEC rule is rescinded and which regimes substitute for it.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sec-climate-rule/ask`, corpus = this module's Atlas record plus the cross-framework reference payloads, prompt-cached. Applicability logic stays deterministic (a small rules table keyed on the user's profile inputs); the LLM narrates and cites, it does not decide thresholds. Refusal path for jurisdictions outside the comparison table.

**Prerequisites (hard).** The Evolution-A rescission fix must ship first — an LLM narrating the current page would confidently restate the stale 'Active' phases, converting a UI defect into authoritative-sounding misinformation. **Acceptance:** the copilot never asserts a live SEC climate obligation; every regime claim traces to the comparison table or a `/ref/*` response.
