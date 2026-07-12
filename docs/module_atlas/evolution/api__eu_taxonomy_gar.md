## 9 · Future Evolution

### 9.1 Evolution A — Correct the GAR denominator and compute technical screening criteria (analytics ladder: rung 1 → 3)

**What.** The Green Asset Ratio engine (E19) — Art 8 Delegated Act GAR/BTAR KPIs for banks, gated by
DNSH and minimum-safeguards checks. Deterministic, no PRNG, with Annex V article citations. §7.6 names
a real **correctness gap**: the code's GAR denominator is Σ exposure over *GAR-eligible classes only*,
but the real Art 8 Delegated Act denominator is **total covered assets** (including exposures that can
never enter the numerator — derivatives, non-NFRD undertakings — with only sovereigns/central banks
excluded), so **excluding derivatives from the denominator overstates GAR** versus a regulatory filing.
Also: DNSH/safeguards are **attestation booleans** with no technical-screening-criteria computation
(the actual EPC/NZEB test for mortgages, the 30% PED test for renovation loans named in the registry
are never computed); BSAR is hardcoded 0.0; there's no turnover-vs-capex dual GAR (the DA requires both
stock views). Evolution A corrects the denominator, computes real technical screening criteria, and
adds the dual GAR.

**How.** `calculate_gar` uses total covered assets (excluding only sovereigns/central banks) as the
denominator per the DA; the mortgage/renovation/auto numerator conditions compute the actual TSC (EPC
band, ≥30% PED improvement, EURO-6d/BEV) against asset attributes rather than trusting a `dnsh_confirmed`
attestation; the turnover-based and capex-based GAR are both reported; BSAR is implemented. Rung 3:
DNSH cross-checks against the `esrs_e2_e5` and physical-risk engines rather than a boolean.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /calculate-gar`, `/assess-dnsh`,
`/assess-min-safeguards` all **failed** (need input payloads to trace); the denominator narrowing is a
correctness fix that changes reported GAR. **Acceptance:** the §7.4 worked example (GAR 16.67% on the
narrow denominator) is recomputed on the correct total-covered-assets denominator (lower, as derivatives
enter it); the mortgage numerator computes the EPC/NZEB TSC rather than trusting an attestation; both
turnover and capex GAR are returned; the failing endpoints pass the harness.

### 9.2 Evolution B — Taxonomy-GAR compliance copilot with tool-called calculation (LLM tier 2)

**What.** A copilot for bank disclosure teams: "compute our Green Asset Ratio and BTAR" (`/calculate-gar`
→ GAR/BTAR/eligible %, per-asset numerator gating, gaps), "assess DNSH for these assets" (`/assess-dnsh`
→ 6-objective pass/fail with descriptions), and "check our minimum safeguards" (`/assess-min-safeguards`
→ UNGC/OECD/UNGP/ILO gates) — narrating real KPI output and the exclusion reasons (which assets failed
DNSH or safeguards and dropped from the numerator).

**How.** Tool schemas over the 4 POST + 4 GET operations; the reference endpoints (asset classes with
Annex V citations, DNSH objectives, minimum safeguards, GAR phases, cross-framework map) are exceptional
RAG grounding for "which asset classes are BTAR-eligible?" or "what are the Art 18 safeguards?"
questions. The no-fabrication validator checks every GAR %, exposure and gate against tool output; the
copilot must flag the documented denominator caveat (GAR overstated vs a regulatory filing) until
Evolution A, and that DNSH/safeguards are attestations not computed TSC. Composable with `eba_pillar3`,
`ecl_gar_pillar3` and `eu_gbs` in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's denominator fix and harness fixes (so narrated GAR is regulation-
faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure/citation traces
to an engine tool call; the GAR matches `/calculate-gar`; the copilot explains why each excluded asset
dropped from the numerator; the denominator caveat is surfaced pre-Evolution A and resolved post.
