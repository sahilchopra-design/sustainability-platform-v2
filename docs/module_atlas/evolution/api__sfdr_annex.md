## 9 · Future Evolution

### 9.1 Evolution A — Auto-populate the five RTS templates from platform-computed metrics (analytics ladder: rung 1 → 2)

**What.** The E9 `sfdr_annex_engine` is a disclosure *template* engine, not a metrics calculator: it
maps caller-supplied fund data into the five SFDR RTS templates (Delegated Reg (EU) 2022/1288 —
Annex I PAI statement, II/III Art 8 pre-contractual/periodic, IV/V Art 9) and scores completeness
(`compliant ≥95% / partial ≥60%`), PAI coverage (`populated/14 × 100`), and the asset-allocation pie
(`sus_env = max(pct_sustainable_env − tax_aligned, 0)`). Every number in a generated annex is
caller-typed; the platform computes most of them elsewhere. Evolution A wires the templates to the
engines.

**How.** (1) Auto-populate: PAI indicators from `pcaf_regulatory`/`pcaf_quality`, taxonomy-aligned %
from the taxonomy engines, WACI and sustainable-investment splits from `fund_management` and
`sfdr_exclusion`'s report generator — so a generate call pre-fills computed values with per-field
provenance (engine-sourced vs caller-supplied vs missing). (2) Cross-validate the asset-allocation
pie against the fund's actual holdings so the Annex II/IV commitments are consistent with the
portfolio. (3) Confirm the five `POST /generate/annex-*` endpoints (traced `skipped`) work under
the harness. (4) Bench-pin the completeness and PAI-coverage scoring.

**Prerequisites.** Integration points to the PCAF/taxonomy/fund engines; a per-fund data store to
draw from. **Acceptance:** a generate call pre-fills PAI and taxonomy fields from platform engines
with per-field provenance; the allocation pie reconciles with holdings; completeness scoring
bench-pinned; generate endpoints pass.

### 9.2 Evolution B — RTS-template drafting copilot (LLM tier 2)

**What.** A copilot that assembles an SFDR annex conversationally — "generate the Annex IV
pre-contractual for this Article 9 fund and tell me what's missing" — calling the generator,
narrating the field-level gaps `validate_disclosure` returns, and iterating until completeness
crosses the 95% compliant line.

**How.** Five `POST /generate/annex-*` endpoints plus `validate_disclosure` and three reference GETs
(pai-indicators with the mandatory/optional split, template-fields per annex, frameworks) — a
complete grounding corpus for the RTS structure, so the copilot cites which template section and
which of the 14 mandatory PAIs a gap belongs to. The copilot drafts narrative sections but every
quantitative field must come from the generator payload, never LLM-estimated. Core node for a fund
regulatory-reporting desk with `sfdr_product_reporting` and `pcaf_regulatory`.

**Prerequisites.** Evolution A's auto-population for a genuinely useful draft (otherwise the copilot
narrates completeness of hand-typed input); generate endpoints confirmed callable. **Acceptance:**
every completeness %, PAI coverage figure, and named gap traces to a generator/validator response;
quantitative template fields are engine-sourced or explicitly flagged caller-supplied; the copilot
refuses to invent a PAI value for an unpopulated indicator and reports it as a gap instead.
