## 9 · Future Evolution

### 9.1 Evolution A — Finish the GSRI: real governance term, de-seeded company layer (analytics ladder: rung 2 → 3)

**What.** §7 calls this "the strongest of the three critical-mineral modules": the
HHI half of `GSRI = Σ(HHI × Governance × TradeConcentration)/n` is genuinely computed
(`Σ share²` over real curated mining/processing shares for 15 minerals), and the
friendshoring transforms are real. Two seeded layers remain: the governance score is
`sr()` keyed to *country-name length* — not World Bank WGI — and all 80 downstream
companies' risk fields (`concentrationRisk`, `chinaProcessingDep`,
`diversificationScore`) are seeded. Evolution A completes the composite and grounds
the company layer.

**How.** (1) Governance term: WGI rule-of-law and political-stability percentiles
per country as a curated refdata table (the guide's own stated source), production-
share-weighted per mineral — replacing the name-length seed. (2) Form the full GSRI
product with the trade-concentration multiplier (China-processing share, already
real) and publish per-mineral scores against the guide's documented thresholds
(>2500 concentrated, >4000 critical chokepoint — consistent with the HHI scale the
module already uses). (3) Company layer: replace seeded fields with a
disclosure-derived mapping — which minerals each company's segments depend on
(curated sector→mineral intensity as the honest first pass, per-company disclosure
extraction later) — or show honest nulls; real company names must stop carrying
random risk scores. (4) EU CRM Act tab: check the real Art. 5 benchmarks (10/40/25/
65) against the module's computed concentration data. (5) Share the HHI engine with
`critical-mineral-geo-risk` per that module's Evolution A.

**Prerequisites (hard).** Seeded company-field purge; WGI curation; single
source of truth for country shares across the three CM modules. **Acceptance:**
gallium (China 80% mining/98% processing, single-source) tops the GSRI ranking via
arithmetic, not assertion; the governance term cites WGI vintage; zero `sr()` calls
feed rendered scores.

### 9.2 Evolution B — CRM Act compliance and diversification advisor (LLM tier 1 → 2)

**What.** The module's EU CRM Act tab and its computed concentration data set up the
question corporates actually face: "are we exposed to a strategic-raw-material
dependency the CRM Act's benchmarks flag, and what diversification is realistic?"
Evolution B answers per mineral: the computed GSRI decomposition, the specific
chokepoint (mining vs processing stage — the module distinguishes them), which
`FRIENDSHORING_POLICIES` and `EXPORT_CONTROLS` entries bear on it, and the
diversification arithmetic (what share shift drops HHI below 2500) — a computation
the HHI engine can serve directly as a what-if.

**How.** Tier 1 grounds on the computed GSRI payloads, the curated policy datasets,
and the CRM Act text (Reg. 2024/1252 in refdata); tier 2 exposes the HHI/GSRI engine
as an endpoint so "what if Australia doubles lithium processing share?" becomes a
tool call re-running `Σ share²` on the adjusted vector — deterministic, auditable
what-if analysis, the cheapest genuine tier-2 win in the critical-minerals family.

**Prerequisites.** Evolution A (the governance term and de-seeded company layer);
the HHI engine served server-side for tier 2. **Acceptance:** diversification
what-ifs reproduce by hand-computing the adjusted HHI; CRM Act benchmark citations
match the regulation's Article 5 numbers; company-specific advice appears only for
companies with grounded (non-seeded) exposure mappings.
