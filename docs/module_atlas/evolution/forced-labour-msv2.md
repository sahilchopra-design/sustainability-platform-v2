## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its honest-null compliance engine (analytics ladder: rung 1 → 2)

**What.** §7 documents an engine↔page disconnect: `forced_labour_engine.py` is the platform's reference implementation of honest-null discipline — weighted ILO 11-indicator screening, EU FLR 2024/3015 risk-points, UK MSA Section-54 30-point scoring, 5-pillar compliance maturity, all with unassessed inputs returning `None` and being excluded from aggregates rather than fabricated — but `ForcedLabourPage.jsx` generates 300 supply chains, ILO scores, country risk, and grievances entirely from `sr()`. So a production-grade engine sits behind a page that shows synthetic risk scores. Evolution A wires the page to the engine, replacing the seeded supply-chain panel with real supplier records scored via `full_assessment`/`screen_ilo_indicators`, and reconciling the page's divergent 20-item indicator list to the engine's canonical ILO-11 taxonomy (§7.5 flags the mismatch).

**How.** (1) Persist a suppliers table; the risk dashboard reads `screen_supplier_network` output. (2) The ILO radar reads the engine's renormalised-over-assessed aggregate, showing coverage % so partial assessments are visible. (3) UK MSA and EU FLR tabs call `assess_uk_msa`/`assess_eu_flr` with disclosed evidence; unassessed criteria display as gaps, inheriting the engine's honest-null behaviour.

**Prerequisites.** The 300 seeded chains replaced (all §7-flagged synthetic); indicator taxonomy reconciled to ILO-11. **Acceptance:** a supplier's displayed risk score equals the engine's weighted aggregate for its supplied indicators, with coverage % shown; no `sr()` risk score renders; undisclosed MSA criteria appear as gaps, never credited.

### 9.2 Evolution B — Modern-slavery due-diligence copilot (LLM tier 2)

**What.** A copilot for compliance and procurement teams: "screen this Xinjiang-linked apparel supplier and tell me our UFLPA/CSDDD exposure" tool-calls `assess_eu_flr` (country/sector risk points), `screen_ilo_indicators`, and `assess_uk_msa`, and drafts the remediation action list — every risk figure engine-sourced, every unassessed indicator surfaced as a data gap rather than guessed.

**How.** Tier-2 tool-calling over the engine's endpoints; the grounding corpus is §7, which accurately encodes ILO's 11 indicators, EU FLR 2024/3015 Art 5–8, UK MSA s.54, German LKSG, SA8000, and CSRD ESRS S2/CSDDD linkage. The engine's honest-null design is the copilot's integrity backbone — it cannot fabricate a risk score because the engine returns None for unassessed inputs, so the copilot's answers degrade to explicit data-gap statements. Fabrication validator checks every score.

**Prerequisites.** Evolution A (the copilot must narrate engine output, not the seeded page); RBAC-scoped supplier data given the sensitivity. **Acceptance:** every ILO/MSA/FLR figure traces to an engine tool call; asked about an indicator with no supplied evidence, the copilot states it is not assessed and recommends the assessment, never estimating.
