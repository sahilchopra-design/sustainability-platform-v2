## 9 · Future Evolution

### 9.1 Evolution A — Compute the DQ score from platform telemetry (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch: the module's genuinely computed logic is
operational scheduling — real `nextDue` date arithmetic for the 16-policy register
and the 6-model MRM validation calendar — while the guide's headline
`DQ = 0.30·Completeness + 0.25·Accuracy + 0.25·Timeliness + 0.20·Consistency` is
peripheral: data-owner quality "actuals" are `target − sRand·8`, vendor scorecards
and the trend series are static. The irony is that the platform generates exactly
the telemetry the formula needs. Evolution A computes DQ from it.

**How.** (1) Completeness from the `data-capture-hub` coverage computations and the
CSRD collection ledger (both real); Timeliness from record timestamps vs reporting
period (the >6-month penalty the guide specifies is date arithmetic this module
already does well); Consistency from `comprehensive-reporting`'s 20 cross-framework
consistency rules (real engine, real deviation statistics); Accuracy from
validation pass rates in the capture layer. (2) The weighted DQ score per data
domain then drives the steward workflow: scores below the documented 70 threshold
open quality issues assigned per the owner matrix — connecting the module's real
scheduling machinery to real quality signals. (3) De-seed the owner "actuals";
vendor scorecards become entered assessments or leave. (4) The MRM register gains
platform teeth: link each registered model to its actual engine (the Atlas engine
inventory) and its bench status from `bench_quant` — validation due-dates then
track real artifacts.

**Prerequisites (hard).** The upstream telemetry sources' own Evolutions A
(capture persistence, collection ledger); seed purge on owner actuals.
**Acceptance:** a domain's DQ score decomposes into four sub-scores each traceable
to a telemetry query; a stale record moves Timeliness; the MRM register's
next-due list names real platform engines.

### 9.2 Evolution B — Governance-audit evidence assembler (LLM tier 1 → 2)

**What.** The module's last promise — "Governance Audit Report generates compliance
evidence for external assurance" — is an evidence-assembly task over the module's
own registers. Evolution B drafts it: policy-compliance status from the real
scheduling logic (which policies are overdue and why), model-validation posture
from the MRM register (validations due, findings open), DQ scores with their
telemetry decomposition (post-Evolution A), and the classification register's
access-control posture — organized against DAMA DMBOK2/ISO 8000 structure the
module cites, every claim referencing a register row or computed score.

**How.** Tier 1 over register state plus this Atlas record; tier 2 if registers
move server-side, with the drafter versioning reports against register snapshots
so year-over-year governance improvement is demonstrable — the thing assurers
actually ask for. The honesty rule: overdue policies and open findings must appear
prominently; a governance report that hides its own reds is worse than none.

**Prerequisites.** Evolution A's computed DQ (an audit report quoting seeded
quality actuals would undermine the module's entire purpose); register
persistence. **Acceptance:** every status in a draft matches the live register;
overdue items are listed with their computed `nextDue` dates; DQ figures decompose
on demand to their telemetry sources.
