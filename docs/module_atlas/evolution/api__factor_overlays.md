## 9 · Future Evolution

### 9.1 Evolution A — Registry calibration and the tariff-drag placeholder (analytics ladder: rung 2 → 3)

**What.** The engine's 12 overlay methods already sweep ESG/geo/tech scenarios over base
metrics, but all 30 factor registries are static dictionaries with source *labels* (PRI
IPR 2024, CBI State of the Market 2024) rather than calibrated values, and §5 documents
`tariff_drag = 0.0  # placeholder; real version uses holding-level country weights` in
`overlay_portfolio_management`. Evolution A calibrates the highest-impact registries
against ingested data and closes the placeholder.

**How.** (1) Replace the hardcoded `GREEN_BOND_PREMIUM_BPS` curve with a greenium fit
from the platform's ingested market data (yfinance/EDGAR tables already serve
`financial_data`); recalibrate `ESG_TRANSITION_PD_MULTIPLIER` against NGFS scenario
outputs the platform already extracts. (2) Implement tariff_drag from actual
holding-level country weights passed in the request, wired to the sovereign-risk
registry it already consults. (3) Pin each calibrated overlay in `bench_quant` with a
reference case, and stamp registry version + calibration date in every response's
existing audit-trail block.

**Prerequisites.** Registry provenance table (registry → source dataset → refresh date)
replacing string labels; agreement on which of the 12 overlays are tier-A (only 5 are
exposed via POST endpoints today — the rest are engine-only). **Acceptance:**
`GET /factor-registries` returns calibration metadata per registry; the
portfolio-management overlay produces nonzero, country-weight-dependent tariff drag;
bench_quant pins pass for ECL-credit and ALM-treasury overlays.

### 9.2 Evolution B — Overlay-aware adjustment explainer (LLM tier 1 → 2)

**What.** A copilot on the factor-overlays page that explains any adjustment
decomposition — "why did ECL rise 22%?" — by citing the per-factor breakdown and formula
strings the engine already returns in its audit trail, then executes what-ifs ("re-run
insurance-uw with tropical biome", "assume full AI adoption") as tool calls against the
13 POST endpoints.

**How.** The engine is unusually copilot-ready: every response already carries an audit
trail of formula strings and a per-factor decomposition, so tier 1 is pure narration of
existing payload fields — no new backend. Tier 2 derives tool schemas from the module's
OpenAPI operations (all read-only POSTs with typed Pydantic inputs);
`GET /available-overlays` and `/factor-registries` become the grounding corpus alongside
this Atlas page's §5 extracted transformations. The no-fabrication validator checks
answer numerics against tool outputs per the roadmap's tier-2 contract.

**Prerequisites.** None hard for tier 1 (payloads are self-describing); for tier 2, the
seven engine-only overlays (risk-management, pe-deal, real-estate-valuation, etc.) need
route exposure before the copilot can invoke them — otherwise it must refuse.
**Acceptance:** every numeric in a copilot answer traces to an overlay response in the
same conversation; asking for an overlay without a route (e.g. trade-advisory variants
not exposed) produces an explicit refusal naming the gap.
