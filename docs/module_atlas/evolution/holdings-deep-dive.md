## 9 · Future Evolution

### 9.1 Evolution A — From intensity buckets to a real implied-temperature and PAI engine (analytics ladder: rung 2 → 3)

**What.** This module is one of the healthier tier-B pages: WACI, GHG intensity and financed-emissions attribution are genuine PCAF/TCFD formulas over real `GLOBAL_COMPANY_MASTER` data, with `sr()` used only as a pillar-score fallback. Its two documented simplifications are the targets: (a) the temperature bucket is a static threshold map on carbon intensity (50/150/400/800 tCO₂e/$M), not an implied-temperature-rise model; (b) the PCAF attribution factor `af` is taken as input because the page cannot compute EVIC. Evolution A moves both server-side: an ITR calculation using company intensity *trajectories* against SBTi/CRREM sector pathways, and EVIC-based attribution computed from balance-sheet data, plus PAI indicator coverage scoring the §4 lineage promises.

**How.** (1) A backend `holdings_attribution` route accepting the holdings payload, returning per-position WACI contribution, attributed scope 1+2, ITR (trajectory vs sector decarbonisation pathway), and PCAF data-quality tier — the frontend's radar DQ axis becomes computed rather than displayed. (2) EVIC from the refdata layer's market/fundamentals tables where available; honest `resolution_tier` fallback to revenue-based intensity otherwise. (3) Pin the §7.4 worked example (holding A: GI 500, 94.3% of WACI) as a bench_quant reference case.

**Prerequisites.** Balance-sheet/EVIC coverage in the company master; the pillar-score `sr()` jitter replaced by explicit "estimated" flags so estimates are visible, not silent. **Acceptance:** ITR for a holding changes when its trajectory (not just level) changes; PCAF DQ tier reported per position; bucket map retired.

### 9.2 Evolution B — Engagement-targeting analyst over the attribution waterfall (LLM tier 2)

**What.** The module's purpose is root-cause analysis — "which holdings drive our ESG/carbon underperformance?" — which is inherently conversational. Evolution B: a tool-calling analyst that answers "why is holding A 94% of our WACI at 5% weight?", "which 5 divestments halve financed emissions with least tracking-error weight?", and "draft the PAI escalation list for IC" by calling the Evolution A attribution endpoint and the existing CSV-export data path, narrating only computed contributions.

**How.** Tier 2 per the roadmap: tool schemas from the new attribution route; system prompt grounded in this page's §7.1 formulas (WACI contribution, `pctScope12`, attribution factor) so explanations use the exact decomposition the page computes. The comparison-mode state (selected holdings) passes as context so "these three" resolves correctly. The no-fabrication validator checks every tCO₂e and percentage against tool output; engagement recommendations must cite the `engagementPriority`-style risk×weight arithmetic, not model intuition.

**Prerequisites.** Evolution A's backend route (the page is currently frontend-computed, so there is nothing to tool-call); copilot router from Phase 1. **Acceptance:** an IC-ready answer's every figure matches the attribution response; asked for Scope 3 attribution (not computed today), the analyst states the module doesn't compute it.
