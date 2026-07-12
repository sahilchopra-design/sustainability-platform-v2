## 9 · Future Evolution

### 9.1 Evolution A — Hash-chained tamper-evidence and product analytics (analytics ladder: rung 1 → 4)

**What.** This is a governance/evidence domain, not a quant engine — an append-only audit trail
over live operational data (no PRNG anywhere), with a per-row SHA-256 checksum binding timestamp,
actor, action, entity and sanitised body, key-level redaction of secrets, and role-gated read
access. Its §7.5 integrity limitations are precise: the checksum is **per-row, not chained** (no
previous-row hash), so whole-row deletion is not self-evidencing; GET requests are unaudited by
design (read access to sensitive data leaves no trace); and before-images (`old_values`) exist in
the schema but the middleware only writes `new_values`. Evolution A hardens the trail into a hash
chain (each row's checksum incorporates the prior row's hash → deletion/reordering detectable) and,
separately, mines the 18 `audit_*` tables into product analytics per roadmap D4.

**How.** Extend `_make_checksum` to a chained construction `sha256(prev_checksum | row_fields)`
with a periodic anchor; capture `old_values` before-images on UPDATE/DELETE; optionally audit
sensitive-GET reads under a configurable allowlist. Rung 4: materialized views over the trail
computing module DAU, calc volumes, error hot-spots and (once LLM tiers ship) copilot-deflection
metrics — the analytics warehouse posture the roadmap's D4 stage describes, with this domain as the
source.

**Prerequisites.** Fix the harness failure — §4.2 shows `GET /{entry_id}` **failed** (db-empty);
seed representative rows. The documented `CALCULATE`/`EXPORT`/`ADMIN` action-classes are advertised
by the route filter but never emitted by the middleware (§7.2) — either emit them or drop them from
the filter. **Acceptance:** deleting a mid-chain row is detectable by chain re-verification; an
UPDATE captures its before-image; a materialized view returns per-module 30-day active users.

### 9.2 Evolution B — Compliance-investigator copilot over the trail (LLM tier 2)

**What.** A copilot for admin/compliance users answering "who deleted portfolios in the last week?",
"show all AUTH events for this user", "what changed on this entity and by whom?", and "verify the
integrity of this record" — tool-calling the audit read endpoints (`/`, `/stats`, `/{entry_id}`)
and narrating real trail data with checksum verification. It turns forensic queries that today
require hand-built `WHERE` filters into natural-language investigation.

**How.** Tool schemas over the 3 read endpoints (already role-gated to admin/compliance — the
copilot inherits that RBAC, never a service account); the copilot can recompute a row's SHA-256
from its stored columns to confirm tamper-evidence on demand. The no-fabrication validator checks
every count and timestamp against tool output; because the trail is the platform's evidence layer,
the copilot must never summarise beyond what the rows state (an unattributed NULL-user row is
reported as unattributed, not guessed). Read-only by construction — there are no mutating tools
here.

**Prerequisites.** Evolution A's harness fix (a working detail endpoint for record inspection);
strict admin/compliance RBAC on the copilot route; Atlas corpus (capture rules, redaction policy,
checksum formula) embedded (roadmap D3). **Acceptance:** every figure in an answer traces to an
audit-read tool output; a non-admin session is refused; an integrity-verification request recomputes
the stored checksum and reports match/mismatch, never a guess.
