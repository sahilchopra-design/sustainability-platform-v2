## 9 · Future Evolution

### 9.1 Evolution A — Diff real consecutive loads; compute the VDI (analytics ladder: rung 1 → 2)

**What.** §7's verdict: the mechanics are real — snapshot records with hashes,
field-level before/after change logs, restatement flagging by threshold,
retention — but "the change values themselves are synthetically generated, not
diffed from real consecutive data loads", and the guide's Version Drift Index
(`VDI = Σ|vᵢₜ−vᵢₜ₋₁|/vᵢₜ₋₁/N`) is assembled from seeded parts. Evolution A makes
snapshots and diffs operate on actual platform data.

**How.** (1) Real snapshots: a server-side snapshot service capturing the tracked
tables (company master, captured records, golden records from
`data-reconciliation`) at tag-time — content-hashed, stored with actor and reason
via AuditMiddleware; the `localStorage` seed snapshots retire. (2) Real diffs:
field-level comparison between any two snapshots computed on demand, with
`change_pct` from actual values — the building blocks §7 says exist get real
inputs. (3) VDI computed per the formula over tracked metrics, with the
materiality threshold configurable and each flagged restatement requiring the
justification note the workflow promises. (4) Integration: a locked golden
record's change between snapshots is exactly the trigger for
`data-reconciliation`'s restatement drafter — one restatement pipeline, two
modules' promises fulfilled. (5) Retention policy per the D4/D5 governance
roadmap stages.

**Prerequisites.** Snapshot storage sizing (hash-dedup or column-level deltas —
full copies of 577 tables won't scale); the tracked-table registry decision.
**Acceptance:** tagging a snapshot, changing one company's Scope 1, and tagging
again yields a diff containing exactly that change; VDI reproduces by hand from
the diff; a change above threshold cannot be saved without a justification note.

### 9.2 Evolution B — Restatement-disclosure drafter from version history (LLM tier 1 → 2)

**What.** The module's regulatory purpose — GRI 2-4 and ESRS BP-2 restatement
transparency — culminates in written disclosure: what was restated, why, and the
effect. Evolution B drafts it from the (post-Evolution A) real version history:
the flagged material changes between the disclosure-tagged snapshots, their
justification notes, the affected metrics with before/after values, and the
disclosure-format paragraph per the cited standards — every figure from the diff
record, every rationale from the attached note, nothing reconstructed from memory.

**How.** Tier 1 over the diff payloads and justification notes plus the GRI
2-4/ESRS BP-2 texts (shared corpus with `data-reconciliation`'s drafter —
deliberately the same restatement pipeline); tier 2 adds tool calls to the
snapshot/diff service so "draft the FY25 restatement appendix" retrieves the
tagged snapshot pair itself. The export joins the version-history report the
module already promises for regulator requests.

**Prerequisites (hard).** Evolution A (drafting restatements from seeded change
magnitudes would fabricate the exact artifact regulators use to check honesty);
justification notes present on flagged changes. **Acceptance:** every restated
figure in a draft matches the diff record; changes below the materiality
threshold are excluded per the documented rule; the draft cites each change's
justification note verbatim or summarized with reference.
