## 9 · Future Evolution

### 9.1 Evolution A — Engine-fed PAI values and benchmark context (analytics ladder: rung 1 → 3)

**What.** The E22 engine produces product-level SFDR periodic reports (RTS 2022/1288 Annex III/V)
and a sustainable-investment verification, under an explicit data-integrity covenant in its header:
"Every returned metric is either a REAL computation from caller-supplied inputs … or an HONEST NULL
… No metric is drawn at random." Computations are deliberately thin: completeness %, mean PAI
coverage, `vs_benchmark_delta = value − benchmark` (only when both supplied), and
`verified_sustainable_pct = min(dnsh%, social%, governance%)`. The covenant is exemplary; the
limitation is that PAI values and benchmarks are all caller-typed. Evolution A feeds them from the
platform.

**How.** (1) Source the 14 RTS Table-1 PAI values from `pcaf_regulatory`/`pcaf_quality`/
`portfolio_reporting` (which compute them from holdings) so a report's indicators are engine-fed
with per-indicator provenance, honest-null preserved where the pipeline lacks data. (2) Populate
`benchmark_value` from the `peer_benchmark`/refdata layer so `vs_benchmark_delta` is computed
against a real cohort rather than left null. (3) Add year-over-year PAI tracking (the RTS periodic
report requires historical comparison) from stored prior reports. (4) Bench-pin the verification
min-rule and completeness scoring.

**Prerequisites.** PCAF/PAI engine linkage; a stored report history for YoY; a benchmark source.
**Acceptance:** PAI indicators auto-fill from platform engines with provenance and honest nulls;
benchmark deltas computed for covered indicators; YoY comparison from stored reports; the covenant
behaviour (no fabricated metric) regression-tested.

### 9.2 Evolution B — Product-disclosure copilot with verification narrative (LLM tier 2)

**What.** A copilot that generates and explains a product's SFDR periodic report — "your Art 9 fund
verifies at 62% sustainable investment (bound by the DNSH component); PAI coverage is 78%, with
PAI-7 and PAI-13 unpopulated" — each figure from `generate-report`/`verify-sustainable-investment`,
with the RTS section structure from the reference endpoints.

**How.** Two POST endpoints plus rich reference GETs (the 14 PAI indicators with RTS numbering and
units, SFDR articles, sustainable-investment criteria, per-article RTS sections, DNSH objectives,
reporting timeline) — a complete regulatory grounding corpus. The min-rule decomposition lets the
copilot explain which component binds the verified percentage. The engine's honest-null covenant is
the copilot's contract: unpopulated indicators are reported as gaps, never estimated. Pairs with
`sfdr_annex` (templates) and `pcaf_regulatory` (PAI computation).

**Prerequisites.** None hard — the engine's covenant makes it copilot-safe today; Evolution A makes
answers substantive rather than echoing caller input. **Acceptance:** every completeness, coverage,
and verification figure traces to a tool response; null indicators are narrated as gaps with the RTS
indicator name and unit from the reference registry; the copilot refuses to fill a missing PAI value
and refuses to assert RTS filing compliance.
