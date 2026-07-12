## 9 · Future Evolution

### 9.1 Evolution A — Real IMF debt-dynamics equation replacing the hand-tuned trajectories (analytics ladder: rung 2 → 3)

**What.** This tier-B module is better than most: `COUNTRIES_RAW` (61 real countries with real 2024 macro data, no `sr()` for the base layer) drives four scenario generators with genuinely differentiated logic by country group (SIDS > LDC > Advanced severity), and the NGFS scenario timing (disorderly back-loaded post-2035, hot-house physical damages front-loaded post-2030) is directionally faithful. Its limits (§7.6) are that the debt trajectory uses hand-tuned linear overlays with a `debtGdp>80 → ×1.3` amplifier rather than IMF's actual debt-dynamics equation, and the vulnerability sub-scores carry `sr()` noise. Evolution A grounds the trajectory in the real DSA math.

**How.** (1) Implement the IMF debt-dynamics identity: `Δ(debt/GDP) = (r−g)/(1+g)·debt/GDP − primary_balance + stock-flow adjustment`, with climate shocks entering through `g` (physical GDP damage), the primary balance (adaptation/disaster spending), and stranded-asset revenue loss — replacing the linear `base + t×(4+s×3)` overlays. (2) Differentiate market-access vs LIC-DSF thresholds per IMF's actual two-track framework (the guide only applies a generic threshold). (3) Source the climate GDP shocks from NGFS macro-financial variable paths rather than the monotonic hand-tuned severity. (4) Remove `sr()` noise from vulnerability sub-scores — compute them from the real macro/climate-exposure inputs.

**Prerequisites.** IMF r−g projections and NGFS GDP-damage paths per country; the LIC-DSF vs MAC-DSA classification per country. **Acceptance:** the debt trajectory reproduces from the r−g identity with climate terms; a change in the growth-damage assumption moves the path through the equation; threshold breaches use the country's correct DSA track.

### 9.2 Evolution B — Climate-DSA analyst copilot (LLM tier 1)

**What.** A copilot for the sovereign-risk / development-finance user: "how does the hot-house scenario change this country's debt trajectory?", "which SIDS breach the IMF sustainability threshold under disorderly transition?", "decompose the climate fiscal cost into adaptation vs disaster vs stranded assets" — answered from the computed trajectories and the 5-category fiscal-cost breakdown, decomposing debt dynamics into their drivers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-debt-sustainability/ask`, corpus = this Atlas record (the scenario-generator logic, the fiscal-cost categories, IMF DSA / NGFS framework notes) plus live page state. Trajectory explanations attribute debt movement to growth damage, fiscal cost, and stranded-asset loss; threshold-breach answers narrate the computed classification. Scenario comparisons narrate the NGFS timing differences. Refusal for countries outside the 61-country set.

**Prerequisites.** Evolution A's r−g equation so the copilot's decomposition reflects real debt dynamics rather than hand-tuned overlays. **Acceptance:** every debt/GDP figure in an answer traces to the computed trajectory; fiscal-cost decompositions sum to the total; a country outside coverage returns a refusal.
