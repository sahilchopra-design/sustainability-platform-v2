## 9 · Future Evolution

### 9.1 Evolution A — Live supplier records with evidence-based transition scores (analytics ladder: rung 1 → 2)

**What.** §7 confirms a clean implementation: `HHI = Σ(spend_share²)` computed correctly per category, the critical-dependency rule encoded, no PRNG anywhere — over a hand-authored 40-supplier table with real vendor names (Schlumberger, Halliburton, Baker Hughes) but hand-set spend, transition scores (22–74), and engagement statuses. The risk is subtle: real company names carrying editorial scores read as assessments. Evolution A converts the table into maintained records and derives the scores.

**How.** (1) `suppliers` table (org-scoped) with CRUD endpoints — spend from procurement uploads, tier and category user-maintained; supplier entities resolved via `entity_lei`/GLEIF so names link to the platform's entity layer rather than free text. (2) Transition scores become derived: public CDP disclosure status, SBTi target presence (public dataset), and controversy signals from `esg-controversy` combine into a documented scoring rubric — replacing hand-set values with evidence-linked ones, each score expandable to its inputs. (3) Engagement `plan` states become a real workflow (requested → submitted → approved with dates), feeding the CDP Supply Chain-style tracking the guide cites. (4) Rung 2: concentration what-ifs — "if we dual-source refining catalysts, HHI drops from X to Y" — computed over the real spend rows, and Sprint-DN supply-chain tables provide tier-2/3 mapping where available.

**Prerequisites.** Procurement-spend ingestion format agreed; scoring-rubric documentation (§8-style model note) before any score attaches to a named vendor. **Acceptance:** HHI recomputes from stored spends; every displayed transition score expands to its evidence inputs; the critical flag derives from the documented rule rather than a pre-set boolean.

### 9.2 Evolution B — Procurement engagement copilot (LLM tier 2)

**What.** A tool-calling copilot for the procurement/sustainability workflow: "which critical single-source suppliers still haven't submitted transition plans, and draft the escalation for the top three by spend?" It queries Evolution A's supplier and engagement endpoints, applies the module's own criticality rule, and drafts tailored engagement letters citing each supplier's actual evidence gaps (no CDP response, no SBTi target) — the specific asks that would raise their derived score.

**How.** Tools: `query_suppliers(filters)`, `get_supplier_evidence(id)`, `get_concentration(category)`, `update_engagement_status` (mutation, gated behind explicit confirmation per tier-2 convention). Grounding corpus = this Atlas record's §5/§7 (HHI formula, criticality rule, the >2,500 concentration band) so risk framing matches the implemented thresholds. Letters reference only stored evidence gaps — the copilot must not assert a vendor "has no climate target" unless the evidence field says so, with its check date.

**Prerequisites (hard).** Evolution A — drafting escalations to real named vendors based on hand-set editorial scores would put unfounded assessments in outbound correspondence. **Acceptance:** the copilot's critical-supplier list matches the rule-based query exactly; every claim in a drafted letter maps to a stored evidence field with a date; engagement-status changes require the confirmation step.
