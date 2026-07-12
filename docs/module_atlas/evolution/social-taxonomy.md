## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing endpoints and implement revenue-based three-test alignment (analytics ladder: rung 1 → 2)

**What.** The engine (`social_taxonomy_engine`) has genuine ILO-composite and three-objective weighting logic (`composite = s1×0.40 + s2×0.35 + s3×0.25`), but the lineage sweep records `POST /assess` and `/supply-chain-screen` as **failed** and `/hrdd` skipped, so the backend is unexercised — and the frontend is worse: §7 flags that the guide's headline `Revenue from Socially Aligned Activities ÷ Total Revenue × 100` is **not implemented**, the per-objective `alignedPct`/`eligiblePct` are hand-set constants, per-activity SC/DNSH/MSSC scores are independent `sr()` draws, and bond `taxonomyAligned` is an arbitrary `index % 3` pattern. No revenue/capex/opex KPI — the EU Taxonomy Article 8 disclosure basis — exists anywhere. Evolution A repairs the routes and builds the real three-test pipeline.

**How.** (1) Triage the two failing POST routes. (2) Implement the three-test scoring pipeline the page only displays as an explainer: an activity's Substantial-Contribution, DNSH, and Minimum-Social-Safeguards scores must derive its eligibility status via a code path, not a hand-set label. (3) Add revenue/capex/opex inputs per activity and compute the aligned-revenue-share headline the guide promises. (4) Replace the `index % 3` bond flag with an assessment against each issuer's actual use-of-proceeds framework. (5) Wire the `ref/country-labour-risk` and `ref/ilo-conventions` tables (which pass) into the MSSC test as real inputs.

**Prerequisites.** The `/assess` and `/supply-chain-screen` failures are the gate; TSC thresholds need encoding from the EU Platform 2022 report; wage data fields must be added to support the adequate-wage objective. **Acceptance:** all three POST routes pass the sweep; an activity's eligibility recomputes from its SC/DNSH/MSSC scores; aligned-revenue-share is computed from a revenue split, not a constant.

### 9.2 Evolution B — Social-taxonomy screening analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired endpoints: "is this company's activity socially aligned?", "run human-rights due diligence on this supply chain", "which ILO conventions gate this jurisdiction". It calls `POST /assess`, `/hrdd`, and `/supply-chain-screen`, narrating the three-test result and citing the specific ILO convention or decent-work criterion from `GET /ref/ilo-conventions` and `/ref/decent-work`.

**How.** Tool schemas from the module's OpenAPI operations (3 POST compute + 4 GET ref); grounding corpus = this Atlas record plus the four reference payloads. The HRDD narrative cites country-labour-risk tiers from the `/ref/country-labour-risk` endpoint; every alignment percentage is validated against tool output. Framework grounding in the EU Platform Social Taxonomy Report and the Adequate Minimum Wages Directive.

**Prerequisites (hard).** Evolution A — `/assess` and `/supply-chain-screen` currently 500, and the alignment percentages are hand-set constants, so there is nothing real to narrate. **Acceptance:** every alignment figure traces to a tool response; each ILO-convention citation matches a `/ref/ilo-conventions` entry; a company with no revenue data yields "cannot assess alignment," not a fabricated percentage.
