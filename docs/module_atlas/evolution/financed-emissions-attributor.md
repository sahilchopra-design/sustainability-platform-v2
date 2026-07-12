## 9 · Future Evolution

### 9.1 Evolution A — Run PCAF over holdings instead of illustrating it (analytics ladder: rung 1 → 2)

**What.** §7 gives this module a clean methodological verdict: the PCAF attribution formulas (`AF_equity = Outstanding/EVIC`, 100% for project finance, LTV for real estate) are faithfully implemented, but the numbers are curated per-asset-class constants — "the page *illustrates* PCAF rather than *running* it over positions," covers only 5 of 8 PCAF classes, and the trajectory is back-scaled (×1.28…), not observed history. Evolution A makes it an attribution engine: compute financed emissions bottom-up from a holdings ledger, add the three missing classes (Business Loans, Motor Vehicle Loans, Sovereign Debt — the last with PCAF's PPP-adjusted-GDP attribution), and store annual snapshots so the trajectory becomes real.

**How.** (1) Backend route taking holdings from the platform's `portfolios_pg` table (per the critical-rules note, the populated portfolio store) joined to company EVIC/emissions fields; per-position `AF × (S1+S2+S3)` with DQ score assigned by data-observability per the PCAF 1–5 scale the page already documents. (2) A `financed_emissions_snapshots` table written per run, replacing the stylised back-scaling in `trajectoryData`. (3) Company drill-down reads per-position attribution instead of stored class aggregates.

**Prerequisites.** Company-level emissions/EVIC reference data for demo holdings (D0 seed — the 200–500-holding demo portfolio); sovereign attribution needs country GDP/emissions refdata (already partially in the refdata layer). **Acceptance:** class totals equal the sum of position-level attributions; a bench-pinned case (one equity position, known EVIC and scopes) reproduces the PCAF hand calculation; DQ scores derive from data provenance, not storage.

### 9.2 Evolution B — Category-15 disclosure analyst (LLM tier 2)

**What.** A copilot that operates the attribution engine for the two jobs analysts actually have: explaining and disclosing. "Why did our financed emissions rise 8% when the portfolio shrank?" becomes tool calls decomposing the delta into attribution-factor drift (EVIC changes), position changes, and company-emissions changes; "draft our Scope 3 Category 15 disclosure paragraph with DQ caveats" pulls totals, class breakdowns, and the exposure-weighted DQ score into GHG-Protocol-shaped text.

**How.** Tier-2 tool-calling over the Evolution A endpoints; grounding corpus is this page's §5/§7, which already encode the PCAF v3 attribution rules and DQ semantics accurately — the copilot explains EVIC-denominator effects using the module's own Attribution Methodology tab content. The delta-decomposition needs one small additional endpoint (two-snapshot diff), keeping arithmetic server-side per the no-fabrication contract.

**Prerequisites.** Evolution A (there is no API today — the module is tier-B frontend-computed over constants); snapshot history of ≥2 periods for delta questions. **Acceptance:** every tCO₂e figure in a disclosure draft traces to a tool response; the copilot correctly attributes an EVIC-driven decrease as denominator effect, not real-economy reduction, in the bench_llm golden set.
