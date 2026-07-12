## 9 · Future Evolution

### 9.1 Evolution A — Model-derived SPT-miss probability with calibrated ratchet pricing (analytics ladder: rung 2 → 3)

**What.** The page's `calcSllPricing` engine is genuinely scenario-capable (11-point `ratchetSensitivity` sweep, 7-size `ratchetBySize` decomposition) but its single most important input — `stepUpProb` — is a raw user slider, not a modelled quantity (§7.6). Replace the guessed miss-probability with a KPI-trajectory-derived one, and calibrate it against observed SLB step-up events, moving the module from what-if to benchmarked.

**How.** (1) Reuse the Monte Carlo `sptProb` machinery the sibling `sustainability-linked-finance` module already has (both share `sustainability_calculator` per §6): simulate the selected KPI's path from baseline to target date using sector decarbonisation rates from the 8 `KPI_TEMPLATES`, output P(miss) with a confidence band. (2) Feed that probability into `calcSllPricing` as the default, keeping the slider as an override with a "modelled vs assumed" badge. (3) Calibrate against the public record of SLB coupon step-up events (Enel, PKN Orlen et al.) as a small curated table; report calibration error. (4) Fix the documented internal inconsistency: discount the FI fee stream (`fiRevenue`) at the same `wacc` used for coupon PV.

**Prerequisites.** A backend home for the pricing calc — today the whole engine lives in the React page; the mapped `sustainability.py` endpoints are real-estate certification calculators, not SLI pricing. **Acceptance:** with slider untouched, changing KPI/sector changes the priced greenium; a `bench_quant` pin reproduces the §7.5 worked example ($421.7M PV at 30%/5.5%) exactly.

### 9.2 Evolution B — SLL structuring analyst with tool-called term-sheet what-ifs (LLM tier 2)

**What.** A copilot on the 10-tab page that answers "why is the greenium 5.25 bps?" by citing the live `calcSllPricing` decomposition (expectedStepUp/StepDown, coupon spread vs base spread), and executes structuring what-ifs — "price this at 20 bps ratchet, 7-year tenor", "which of the 8 template KPIs gives the largest expected step-down at my miss probability?" — as tool calls, never by inventing numbers.

**How.** First shippable slice is tier 1: explanation-only, grounded in this Atlas page (§7.2 formula, §7.5 worked example, §7.4 tab walkthrough as corpus) plus the page's computed state — no backend needed. Tier 2 requires Evolution A's prerequisite: a Pydantic-typed `POST /api/v1/sli/price` wrapping `calcSllPricing` server-side, exposed via the OpenAPI-derived tool schema per the Tier-2 pattern. The ICMA/LMA checklist tabs (greenwashing due-diligence, documentation requirements) become a retrieval corpus so the copilot can answer "does this structure meet ICMA 2023 SPT ambition requirements?" with citations to the checklist rows, flagging that SPO scoring is guidance text, not computed.

**Prerequisites.** The endpoint-map mismatch must be corrected in the Atlas registry — tool schemas auto-generated from the currently-mapped certification endpoints would give the copilot the wrong tools entirely. **Acceptance:** every numeric in an answer traces to a tool response or a named static table (`SLB_MARKET`, `ISSUER_SECTORS`); the copilot refuses to output an SPO score, which this module does not compute.
