## 9 · Future Evolution

### 9.1 Evolution A — Live clock, real register, per-item escalation (analytics ladder: rung 1 → 2)

**What.** The scoring is unusually defensible for tier B: the code's tiered urgency × priority × incompletion risk score is a legitimate discretisation of the guide's `DR = (1−completion) × (1/days) × materiality` (§7.1 notes it even avoids the near-deadline division blow-up). But §7.7 flags a disqualifying defect — `TODAY` is a frozen constant (2026-04-07), so every days-remaining figure silently went wrong the day after it was written — plus an all-synthetic 80-item register and a risk score computed only at portfolio level, with no per-item escalation path. Evolution A fixes the clock, persists a real register, and completes the escalation workflow.

**How.** (1) The one-line-fix first: `TODAY = new Date()` (or server time), with days-remaining recomputed per render — nothing else on the page is trustworthy until this ships. (2) Converge on the platform's regulatory-calendar backend as the obligation source (its 26 article-referenced records with live `_compute_urgency` are exactly what this tracker's synthetic rows imitate) and add this module's workflow layer on top: owner, completion %, evidence attachments, per-item risk score using the existing tiered formula. (3) Escalation becomes real: threshold breaches on per-item scores generate persisted alerts with an audit trail (the module's stated purpose). (4) The guide's stale figures (41 deadlines, 83% on-track) replaced by live aggregates.

**Prerequisites.** Coordination with `regulatory-calendar`'s Evolution A (shared register, two surfaces: calendar view vs workflow view — deliberately not two registers); org-scoped status tables. **Acceptance:** days-remaining changes overnight without a deploy; per-item risk scores reproduce from the formula; an item crossing the critical tier generates a timestamped alert row.

### 9.2 Evolution B — Compliance-workload triage copilot (LLM tier 2)

**What.** Compliance managers start the week asking "what needs attention?". The copilot answers from live state: "top-10 items by risk score with owners and blockers", "which CSRD items are behind their historical completion pace?", "draft the escalation email for the two overdue BRSR items with their evidence status" — operational triage where every claim comes from register rows and computed scores.

**How.** Tier-2 tool schemas over the register/score/alert endpoints; the drafted escalation uses the item's stored owner, deadline, completion %, and alert history — the copilot composes, never invents status. Pace analysis (behind/ahead) requires completion history, which the Evolution-A status table provides via timestamped updates. Guardrails: the copilot cannot mark items complete or reassign owners without the confirmation-gated mutation path; deadline authority remains the linked calendar record, cited per answer. This module and the calendar concierge share a corpus but differ in verbs — the calendar explains obligations, this copilot manages execution.

**Prerequisites (hard).** Evolution A (triage over the frozen-clock synthetic register would misprioritize by construction); completion-history timestamps. **Acceptance:** the top-10 list matches the score endpoint's ordering; escalation drafts contain only stored facts; mutation requests route through confirmation.
