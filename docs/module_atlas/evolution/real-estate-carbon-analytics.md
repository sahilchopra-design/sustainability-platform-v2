## 9 · Future Evolution

### 9.1 Evolution A — Server-side whole-life carbon engine on real CRREM/EPC data (analytics ladder: rung 2 → 3)

**What.** The calculation structure is genuinely good — EN 15978 A1-A5/B/C/D staging with the correct Module D credit sign, PCAF Part C attribution, carbon-cost scenarios at €50/100/150 — but §7.7 lists the honest gaps: everything is computed client-side despite a tier-A "backend vertical" label (the engine file's docstring claims a single source of truth it doesn't provide), CRREM budgets are illustrative constants rather than the v2 pathway file values, the PCAF Data Quality score is named in the guide but never computed, both the DB seed and inline `PROPERTIES_SEED` are the same PRNG output, and two unreconciled "improvement by 2050" assumptions (35% OCI decay vs 40% gap closure) coexist. Evolution A makes the backend real.

**How.** (1) Port the whole-life carbon chain to `services/re_carbon_engine.py` behind `POST /api/v1/re-carbon/portfolio` so the numbers are auditable and pinnable; the frontend renders responses. (2) Load actual CRREM v2 pathway values (licensed for use; alternatively the sibling `REPortfolioEngine` pathway tables already exist — reuse, don't re-key). (3) Implement the §8 PCAF DQ spec: score 1–5 per property from its data lineage (actual meter data → EPC-derived estimate → floor-area proxy), replacing the missing metric. (4) Collapse the two improvement assumptions into one retrofit-linked trajectory parameter. (5) UK EPC open data (already a wave-1 platform source) replaces seeded EPC grades for UK assets.

**Prerequisites.** CRREM licensing decision; EPC ingester coverage confirmed. **Acceptance:** bench_quant reproduces the §7.4 worked example server-side; every property reports a PCAF DQ tier; the same portfolio yields identical results from API and export.

### 9.2 Evolution B — Lender disclosure copilot with attribution drill-down (LLM tier 2)

**What.** The module's users are PCAF-reporting banks and GRESB/SFDR reporters. The copilot answers the questions attribution tables provoke: "why did this mortgage's attributed emissions double?" (ownership % change vs OCI change — decomposed from the engine payload), "draft our PCAF Part C disclosure paragraph with the DQ-score distribution", "which assets breach the 1.5°C budget before their loan maturity?" — the last being a genuinely new cross-cut of stranding year × loan term the engine can compute and the copilot can narrate.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; system prompt grounded in §7.2's constants-provenance table and §7.7's framework-alignment notes, so the copilot discloses the ownership-proxy attribution (PCAF's loan-based formula substituted, as documented) whenever quoting attributed tonnes. DQ-score language follows PCAF's own disclosure convention — every emissions figure quoted with its quality tier, which the tier-1 corpus enforces via the refusal path. Report drafts render through the report-studio layer.

**Prerequisites (hard).** Evolution A (client-side numbers cannot be validated by the no-fabrication checker); DQ implementation. **Acceptance:** a drafted disclosure's tonnes and DQ distribution match `/portfolio` output exactly, and the ownership-proxy caveat appears in any attribution answer.
