## 9 · Future Evolution

### 9.1 Evolution A — Fix the failed endpoints, complete the ESRS 1 severity construct (analytics ladder: rung 2 → 3)

**What.** §7 calls this "one of the atlas's faithfully-implemented regulatory
modules": genuine dual-axis double-materiality scoring (severity×likelihood impact
score, magnitude×likelihood financial score, either-threshold materiality with no
netting), real ESRS Set 1 reference data with correct datapoint counts, and no
synthetic seeding in the scoring path. Two gaps: three POST endpoints fail the
lineage harness (`/impact-assessment`, `/financial-assessment`, `/full-assessment` —
the server-side scoring path is broken while the client-side works), and §7.5 notes
the severity axis collapses ESRS 1 §43's three sub-dimensions (scale, scope,
irremediability) into one ordinal.

**How.** (1) Endpoint triage first — the failures look like the payload/500 class
the deployment-prep sweep fixed elsewhere; the client and server implementations
must also be reconciled so one scoring engine serves both (server as source of
truth, page as client). (2) Severity completion: score scale, scope, and
irremediable character separately per ESRS 1 §43 and combine them visibly (max or
documented weighting), so IRO-1 documentation can show the full construct — a
material upgrade for assurance readiness. (3) Sector calibration (rung 3): the
`/ref/sector-materiality` endpoint already passes — use it to pre-populate topic
expectations per sector (ESRS sector guidance) as a challenge layer: a company
scoring E1 immaterial in a high-impact sector gets a documented divergence prompt.
(4) Persist assessments with versioning so year-over-year DMA evolution is
auditable; connect the controversy-evidence cross-check from
`controversy-materiality`'s validation output as a second challenge layer.

**Prerequisites.** The three endpoint fixes; persistence schema. **Acceptance:**
server and client produce identical materiality sets for the same inputs; the
worked E1 example reproduces; a sector-expectation divergence renders a visible
flag with the sector source cited.

### 9.2 Evolution B — DMA facilitation copilot with IRO-1 documentation output (LLM tier 2)

**What.** A DMA's cost is facilitation and documentation, not arithmetic. Evolution B
supports both: during scoring, the copilot challenges entries with grounded
prompts ("you scored S2 value-chain workers 'low/unlikely' — your sector's ESRS
guidance and your CSDDD supplier data suggest reviewing; here's why"), drawing on
`/ref/sector-materiality`, the severity-criteria definitions, and cross-module
evidence; afterward, it drafts the IRO-1 process disclosure — methodology,
thresholds, stakeholder engagement conducted, and the materiality conclusions with
their scores — the ESRS 2 documentation every assessment must produce.

**How.** Tool-calling over the module's 10 operations (the four ref GETs ground the
challenges; the POST assessments compute), with the drafter consuming the persisted
assessment record. Challenge prompts must be suggestions with sources, never score
changes — the entity determines materiality, the copilot documents and stress-tests.
Fabrication validation on all scores and datapoint counts; the draft's threshold
statement must match the configured values exactly.

**Prerequisites (hard).** Evolution A's endpoint fixes and persistence (drafting
IRO-1 from unpersisted client state isn't auditable); sector guidance and ESRS 1
text embedded. **Acceptance:** every challenge cites its source (sector table,
severity criterion, or cross-module record); the IRO-1 draft's materiality table
matches the stored assessment exactly; the copilot never modifies a score itself.
