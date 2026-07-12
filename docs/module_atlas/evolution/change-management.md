## 9 · Future Evolution

### 9.1 Evolution A — Server-side change-control registry (analytics ladder: rung 1 → 2)

**What.** §7 carries a major mismatch flag: the guide describes an organisational
change-management tool (ADKAR composites, Rogers S-curves, 16% critical mass) while
the code is actually a **platform change-control registry** — it logs changes to the
A² platform itself (schema changes, PD coefficient updates, VaR-config changes,
CSRD/ESRS updates) with approval status, lead-time and rollback-rate analytics over 13
seeded requests plus `localStorage` persistence. Evolution A embraces what the module
really is: promote the registry from `localStorage` to a backend vertical
(`platform_change_requests` table + router) so change control survives browsers,
supports multi-user approval workflows via the existing RBAC roles, and can join the
platform's 18 `audit_*` tables — turning "what changed before this number moved?" into
a queryable question.

**How.** (1) CRUD router with state transitions (proposed → approved → implemented →
rolled-back) enforced server-side; category-based approval requirements from the
existing 9-row `CHANGE_CATEGORIES` rubric (model changes require approval; docs
don't). (2) The real analytics (`avgImpl` lead time, `rollbackRate`) recomputed over
DB rows. (3) Rewrite the MODULE_GUIDES entry — §7 explicitly says the guide should be
rewritten; the ADKAR/Rogers text describes a module that does not exist and must not
survive into the LLM corpus.

**Prerequisites (hard).** Guide rewrite is a blocking prerequisite for any copilot
(Evolution B) — RAG over the current guide would answer ADKAR questions about a
change-log tool. **Acceptance:** a change request created in one browser is visible in
another with its approval state; lead-time analytics match SQL over the table; the
mismatch flag clears.

### 9.2 Evolution B — Change-audit copilot (LLM tier 2)

**What.** An assistant for platform-governance questions: "what model changes shipped
last quarter and what was their rollback rate?", "which pending changes touch the VaR
configuration?", "draft the change record for this PD coefficient update" — the first
two as tool calls over the Evolution A registry endpoints, the third as a structured-
draft workflow where the LLM fills the change-record schema and a human approves. This
pairs naturally with the platform's audit posture: every module's engine changes could
be narrated from one place.

**How.** Tool schemas from the new router (list/filter read-only first; the create
endpoint gated behind explicit user confirmation per the tier-2 mutating-endpoint
rule); answers cite change-record IDs; category-rubric questions answer from the
`CHANGE_CATEGORIES` seed with its approval requirements.

**Prerequisites.** Evolution A complete including the guide rewrite; RBAC so the
copilot inherits the user's approval permissions and can never self-approve.
**Acceptance:** a quarterly-summary answer reconciles to a SQL count over the table;
the copilot cannot move a change to approved without a logged human confirmation.
