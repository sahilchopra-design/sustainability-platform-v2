## 9 · Future Evolution

### 9.1 Evolution A — Carbon-stacked IRR with live CEA grid factors and scenario prices (analytics ladder: rung 1 → 2)

**What.** This module is genuinely sound: no `sr()` usage, 6 real named Indian solar IPPs with hand-curated figures, and a textbook-correct ACM0002 avoided-emissions implementation (`annGenMwh × gridEf`, methodology conservativeness discount, guarded DSCR). Its grid EF (0.82 tCO₂/MWh, 0.94→0.62 trajectory) and `CREDIT_METHODOLOGIES` are cited to CEA and the CCTS framework. What it lacks is the promised integration: the overview says carbon revenue "improves project IRR by 1–3 percentage points," but the module computes carbon revenue and DSCR separately without a unified project-finance model layering carbon on PPA income across the `PROJECT_FINANCE_WATERFALL`. Evolution A builds that stacked model and makes the grid factors live.

**How.** (1) A backend endpoint computing project IRR with and without carbon revenue over the full capital stack (senior debt/green bond/mezzanine/equity the page already tabulates), quantifying the carbon uplift the overview claims. (2) Scenario dimension over credit price (the $5–20 VCM band the guide cites) and CCTS vs VCS vs JCM pathway — each has a different price and discount in `CREDIT_METHODOLOGIES`. (3) A CEA grid-EF refresh: CEA publishes state-wise combined-margin factors annually — a small ingester keeps `GRID_EF_HISTORY` current with cited vintages rather than a static series. (4) REC + carbon bundling economics as a joint revenue optimisation rather than parallel displays.

**Prerequisites.** CEA data cadence (annual); the stacked model needs a debt-schedule assumption per tranche. **Acceptance:** the model reports carbon's IRR contribution in pp, matching the overview's claimed range for realistic inputs; switching methodology changes price/discount and revenue; grid EF carries its CEA vintage.

### 9.2 Evolution B — India solar carbon-structuring copilot (LLM tier 1)

**What.** A copilot for the developer/advisor/broker users: "how much carbon revenue can this 200MW Rajasthan project earn?", "CCTS or VCS for a project targeting EU buyers?", "what's the IRR uplift at $15/tCO₂?" — answered from the ACM0002 calculator and the cited methodology/grid-factor tables, never inventing avoided-emissions figures.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-developer-carbon-finance/ask`, corpus = this Atlas record (§7.1 ACM0002 formula, the CEA grid EF, `CREDIT_METHODOLOGIES`) plus live calculator state. What-if requests re-run `calcCarbonCredits`/`calcDscr` with the user's capacity/PLF/grid-EF/price and narrate the result; pathway-selection guidance cites the specific registry, price band, and JCM-compatibility from the methodology table. Refusal for non-India grids where the CEA factor doesn't apply.

**Prerequisites.** None hard — the calculator is already correct; Evolution A's stacked model lets the copilot answer IRR-uplift questions with computed pp rather than the overview's generic 1–3pp. **Acceptance:** every avoided-emissions and revenue figure traces to a calculator run; methodology recommendations cite the `CREDIT_METHODOLOGIES` row; a non-Indian project prompts a grid-factor caveat.
