## 9 · Future Evolution

### 9.1 Evolution A — SGT activity screening with real taxonomy logic and traffic-light gradation (analytics ladder: rung 1 → 2)

**What.** A compact Singapore-regulatory toolkit with no engine file — the methodology
lives in the route module over four embedded reference lists: MAS ERM Guidelines (6
principles), Notice 637 items (5), Singapore Green & Transition Taxonomy (7 sectors ≈ 33
activities, SGT v2.0), and the SLGS "Green Lane" 5-stage pipeline. Only two endpoints
compute (ERM self-assessment score, SLGS progress tracker); the rest serve static
reference data. Evolution A builds out the SGT screening, which is where the analytical
value is, and formalises the ERM scoring.

**How.** (1) Implement `/sgt/check-activity` as a real traffic-light classifier: the SGT
v2.0 is explicitly a *transition* taxonomy with green/amber/red gradation and
sunset-clause dates — encode those thresholds so an activity returns green/amber/red with
the applicable measure and expiry, not just an eligibility boolean. (2) Extract the inline
ERM scoring into a testable engine with weighted principles and a maturity band, mirroring
the platform's other framework engines (IFRS S1/S2). (3) Cross-wire SGT screening to the
EU Taxonomy and SFDR modules so a Singapore-domiciled activity's dual-classification is
visible. (4) Bench-pin the ERM score and SGT classification.

**Prerequisites.** SGT v2.0 threshold/sunset data encoded from the official taxonomy
(reference lists exist; gradation logic does not). **Acceptance:** `/sgt/check-activity`
returns green/amber/red with a sunset date, not a boolean; ERM scoring is engine-backed
and bench-pinned; the POST endpoints (currently `/erm/self-assessment` traces `failed`)
return `passed`.

### 9.2 Evolution B — MAS compliance copilot for Singapore FIs (LLM tier 2)

**What.** A copilot that guides a Singapore financial institution through the four
workflows — "which MAS ERM principles are we weak on?", "is this coal-power activity
SGT-eligible and until when?", "what's the next SLGS stage and its requirements?" — each
answer grounded in the embedded reference lists and computed via the ERM/SGT endpoints.

**How.** Seven endpoints (two POST computational, five GET reference) form the tool set;
the reference endpoints carry official MAS URLs and citations, so the copilot links every
answer to source. `/sgt/check-activity` becomes the tier-2 action for eligibility
questions; `/erm/self-assessment` for maturity scoring. This is a jurisdiction-specific
node the tier-3 Desk Orchestrator routes to for Singapore counterparties, cross-linking
to the EU/UK regulatory copilots for multi-jurisdiction firms.

**Prerequisites.** Evolution A's SGT gradation for credible eligibility answers —
otherwise the copilot can only say "listed/not listed" rather than the green/amber/red
status the transition taxonomy actually assigns. **Acceptance:** every principle, activity
status, and stage requirement traces to a reference or compute endpoint; SGT answers cite
the official taxonomy URL; the copilot refuses to give legal-compliance assurance and
frames outputs as MAS-guidance screening.
