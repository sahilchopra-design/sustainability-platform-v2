## 9 · Future Evolution

### 9.1 Evolution A — Propagate the real-data overlay and implement the weighted vulnerability index (analytics ladder: rung 1 → 3)

**What.** This module is partway to grounded but has a documented internal inconsistency: hazard scores are region-biased `sr()` draws (a genuine design choice — South Asia flood base is highest, Middle East heat base is highest), the composite is an **unweighted mean of six hazards** rather than the guide's `(Exposure×0.4)+(Sensitivity×0.35)+(1−Adaptive Capacity)×0.25`, and — critically per §7.6 — once `compositePhysicalRisk` is overwritten with real EM-DAT/ND-GAIN data, the **downstream fields don't recompute**: `gdpAtRisk2030Pct`, infrastructure vulnerability, and RCP splits stay frozen at values derived from the pre-overlay synthetic composite. Plus `agricultureExposurePct` can exceed 100% (no clamp). Evolution A makes the real overlay flow through and implements the actual weighted index.

**How.** (1) Recompute all downstream fields from the EM-DAT/ND-GAIN-overlaid composite so an overlaid country's GDP-at-risk and infrastructure scores are consistent with its real hazard data — the highest-value fix. (2) Implement the guide's three-term weighted vulnerability index (hazard exposure, economic sensitivity via coastal population/agri-GDP, adaptive capacity via ND-GAIN readiness) replacing the unweighted hazard mean. (3) Source hazard severity from IPCC AR6 WG2 regional projections rather than hand-tuned regional bases. (4) Clamp `agricultureExposurePct` at 100%. (5) Add the RCP scenario runs as independent projections rather than fixed multiples of the 2030 figure.

**Prerequisites.** IPCC AR6 regional hazard data and coastal-population/agri-GDP sensitivity inputs; EM-DAT/ND-GAIN are already partially wired. **Acceptance:** an overlaid country's GDP-at-risk recomputes from its real composite; the vulnerability index uses the three-term weighting; no exposure percentage exceeds 100%; RCP scenarios are independent runs.

### 9.2 Evolution B — Sovereign physical-risk copilot (LLM tier 1)

**What.** A copilot for the sovereign-bond risk manager: "which hazards drive this country's physical vulnerability?", "how does GDP-at-risk change from 2030 to 2050 under RCP 8.5?", "rank my sovereign portfolio by adaptive-capacity deficit" — answered from the (Evolution-A consistent) composite, the six-hazard decomposition, and the ND-GAIN readiness data.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-physical-risk/ask`, corpus = this Atlas record (the hazard taxonomy, the vulnerability index, IPCC AR6 / ND-GAIN framework notes) plus live page state. Hazard-driver explanations decompose the composite into the six IPCC AR6 hazards; scenario answers narrate the RCP projections; portfolio rankings narrate deterministic sorts. The copilot flags the region-biased nature of hazard scores honestly.

**Prerequisites (hard).** Evolution A's overlay propagation — narrating GDP-at-risk figures that are frozen at pre-overlay synthetic values for the very countries that have real data would present the module's internal inconsistency as an authoritative answer. **Acceptance:** every hazard/GDP-at-risk figure traces to the consistent computed record; scenario answers cite the RCP run; a country outside the 80-country set returns a refusal.
