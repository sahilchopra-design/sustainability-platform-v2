## 9 · Future Evolution

### 9.1 Evolution A — Entity-specific double materiality and standard-native metrics (analytics ladder: rung 1 → 2)

**What.** The CSRD ESRS E2–E5 Environment Topics engine — disclosure-completeness and derived-metric
assessment for Pollution, Water, Biodiversity, Circular Economy, in the honest-null style (quantities
are "reported figures, never fabricated"; the only calculations are genuine mass-balances plus one
composite). §7.5 names the deepening targets: the **NACE materiality matrix is a coarse 20-division
default** — ESRS 1 requires an entity-specific double-materiality process, and non-material topics
scoring 100% completeness **inflates `overall_completeness_pct`** for narrow-footprint sectors (a K64
bank scores 100% with zero data); completeness is presence-based (no unit/plausibility checks); the E3
consumption mass-balance can go negative (unguarded); and the circularity score is a **platform
composite, not an ESRS metric**. Evolution A wires an entity-specific double-materiality determination
and reports standard-native metrics rather than the blended composite.

**How.** `assess_materiality` accepts an entity's impact + financial materiality inputs (from the
platform's double-materiality engine) rather than defaulting to the NACE matrix; `overall_completeness`
is computed only over material topics with data (so a bank's non-material 100%s don't inflate it), or
reported separately; the circularity composite is demoted to a supplementary indicator with the ESRS-
prescribed individual inflow/outflow metrics primary; the E3 consumption balance is guarded. Rung 2:
add unit validation and plausibility checks to the completeness scoring.

**Prerequisites (hard).** Fix the harness — §4.2 shows `POST /assess`, `/assess-e2`, `/assess-e3` all
**failed** (need input payloads to trace); the NACE matrix's "platform-authored default, not a published
EFRAG table" caveat must stay visible. **Acceptance:** the §7.4 E5 worked example (circularity 40.8,
80% completeness) reproduces; a K64 bank no longer scores 100% overall completeness on zero data; the
E3 consumption balance can't go spuriously negative; materiality reflects an entity double-materiality
input where supplied; the failing endpoints pass the harness.

### 9.2 Evolution B — ESRS E2–E5 disclosure copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for sustainability reporting teams: "which of E2–E5 are material for our sector and
what's our disclosure completeness?" (`/assess` → materiality, per-topic completeness, gaps), "assess
our water disclosure" (`/assess-e3` → consumption mass-balance, Aqueduct stress tier), and "assess our
circular economy metrics" (`/assess-e5` → diversion rate, circularity, gaps with DR citations) —
narrating real derived metrics and honest nulls.

**How.** Tool schemas over the 6 POST + 5 GET operations; the disclosure registers (E2-1…E5-6 DR
ladders, metric schemas, Aqueduct tiers, materiality triggers) are exceptional RAG grounding for "what
does ESRS E4-5 require?" or "what's the Aqueduct high-stress threshold?" questions. The no-fabrication
validator checks every volume, rate and completeness % against tool output; the copilot must state that
materiality uses a sector default (not entity double-materiality) until Evolution A, and that
non-material-topic 100%s can inflate the headline. Composable with `csrd_reports` and `eba_pillar3` in
a disclosure-readiness desk.

**Prerequisites.** Evolution A's harness fixes and materiality/completeness improvements (so narrated
completeness is meaningful); Atlas + register corpus embedded (roadmap D3). **Acceptance:** every figure
cited traces to an engine tool call; the derived metrics match `/assess-e3`/`/assess-e5`; the copilot
flags sector-default materiality and the non-material-100% caveat; a gap is reported with its DR
citation.
