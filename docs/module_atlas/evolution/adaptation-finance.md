## 9 · Future Evolution

### 9.1 Evolution A — Climate-escalated NPV with RCP feedback and calibrated BCRs (analytics ladder: rung 2 → 3)

**What.** The `AdaptationFinanceEngine` is already a genuine tier-A vertical (8 sub-modules,
12 routes) with scenario inputs — but §7.6 documents two honest gaps: the RCP hazard
multipliers are computed yet **not fed back** into the resilience-delta arithmetic, and the
NPV is a flat annuity with no hazard-frequency escalation or benefit ramp-up. Evolution A
closes both and calibrates: avoided-loss benefits escalate along the chosen RCP's
intensity/frequency multipliers inside `calculate_adaptation_npv`, and the hand-authored
BCR ranges (NbS 5.0–15.0, coastal 4.0–11.0) get benchmarked against published GCF funding
proposals and CPI adaptation-finance datasets, with machine-readable citations replacing
docstring references.

**How.** (1) `calculate_resilience_delta` applies `rcp_hazard_multiplier` to baseline risk
before the `effective_rr` reduction, reporting both unadjusted and RCP-adjusted deltas.
(2) NPV gains a `benefit_escalation_pct` derived from the RCP damage-%GDP trajectory, so
PV_benefits is a growing annuity. (3) A `bench_quant` pin locks the §7.4 worked example
($13.14M NPV, BCR 1.45) as the zero-escalation reference case; calibration deltas versus
GCF-approved project BCRs are published in the `/ref/gfma-categories` payload.

**Prerequisites.** Lineage harness shows `POST /full-assessment` currently **fails** — fix
that before layering escalation on top; NAP profiles (static ~2023–24 snapshot, 30
countries) refreshed from the UNFCCC registry. **Acceptance:** same project under '1.5C'
vs '4C' produces different NPV and resilience delta; the pinned legacy case still
reproduces; each BCR range carries a source citation retrievable via the ref endpoint.

### 9.2 Evolution B — Bankability analyst that runs the full assessment (LLM tier 2)

**What.** A tool-calling analyst on the Adaptation Finance Hub that executes natural-
language appraisals — "assess a $25M Bangladesh flood-protection project with $4M annual
benefits over 20 years" — by calling `POST /gfma-alignment`, `/gari-scoring`,
`/adaptation-npv`, `/mdb-eligibility`, `/nap-ndc-alignment` and `/full-assessment`, then
narrating the composite (`0.20·GFMA + 0.30·GARI + 0.25·min(100,BCR×40) + 0.15·MDB +
0.10·NAP/NDC`) and bankability tier from real engine output. It can also chain the four
`GET /ref/*` endpoints to answer "which MDB facilities fit this ticket size and geography?"

**How.** Tool schemas from the module's 12 OpenAPI operations; the no-fabrication validator
checks every numeric against tool outputs; the GARI text-evidence fields are a natural LLM
fit — the copilot drafts structured `additionality_evidence`/`governance_structure` text
from user narrative, but the engine's `_parse_score` keyword rubric remains the scorer, so
the LLM shapes inputs, never scores.

**Prerequisites (hard).** The §7.5-documented page defect first: dashboard KPIs are locally
seeded (`gfmaAlignment = seed(101)·20+72`, `bcrValue`, `livesProtected`) and
`portfolioScore` uses a page-only formula that contradicts the engine composite — the page
must render engine responses before an LLM narrates them; `/full-assessment` failure fixed.
**Acceptance:** every numeric in an answer traces to a tool call in-conversation; the
copilot's composite matches `run_full_assessment` exactly, not the legacy page average.
