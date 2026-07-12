## 9 · Future Evolution

### 9.1 Evolution A — Repair the single-asset path and calibrate the ESG overlay (analytics ladder: rung 2 → 3)

**What.** A 1,604-line single-entry-point valuation engine covering 7 asset classes with 11
methods (RAB perpetuity, PF-DCF, energy yield-DCF with degradation and ETS costs, direct-cap,
cost/NAV approaches) and a mandatory ESG overlay: methods reconcile by engine-authored weights
(e.g. infrastructure RAB 0.45/DCF 0.40/cost 0.15), then
`final = reconciled × (1 + green_premium − brown_discount − physical_risk − transition_risk +
biodiversity_adj)`. All Decimal arithmetic, fully deterministic. The atlas exposes two issues:
`POST /calculate`, `/sensitivity`, and `GET /schema/{asset_class}` trace **failed** (only `/batch`
passes), and both the reconciliation weights and the ESG adjustment magnitudes are engine-authored
constants without market calibration. Evolution A repairs and calibrates.

**How.** (1) Fix the failing single-asset, sensitivity, and schema endpoints — `/batch` passing
while `/calculate` fails suggests a request-model or validation defect on the single path. (2)
Source the ESG overlay components from the platform's dedicated engines rather than internal
constants: physical risk from the digital twin/`re_clvar`, transition from CRREM/EPC data,
green premium from `green_premium_tenant` — with per-component provenance in the response. (3)
Document and sensitivity-test the reconciliation weights (the §8 model-card convention). (4)
Bench-pin one worked valuation per asset class.

**Prerequisites.** The three failing endpoints repaired; engine linkages for the overlay
components. **Acceptance:** `/calculate`, `/sensitivity`, and `/schema/{asset_class}` return
`passed`; each ESG adjustment component cites its source engine or is labelled engine-constant;
seven asset-class bench pins reproduce `final_value` exactly (Decimal determinism makes this
strict).

### 9.2 Evolution B — Valuation copilot with method-level transparency (LLM tier 2)

**What.** A copilot that values an asset and shows its work — "your wind farm values at €142M:
yield-DCF €138M (weight 0.60), cost €149M (0.25), NAV €152M (0.15); the ESG overlay nets −3.2%,
driven by transition risk; here's the sensitivity to the discount rate" — every method value,
weight, and adjustment from `/calculate` and `/sensitivity` tool calls.

**How.** Three POST endpoints (`/calculate`, `/sensitivity`, `/batch`) plus `/asset-classes` and
`/schema/{asset_class}` — the schema endpoint is the copilot's input-gathering tool, letting it
ask the user for exactly the fields the asset class requires. The MethodResult decomposition and
the five-component ESG overlay give a fully attributable narrative; batch serves portfolio
valuation summaries. Cross-links to `re_clvar`, `green_premium_tenant`, and `rics_esg` (whose Red
Book apparatus this engine's outputs feed). Core node for a valuation desk.

**Prerequisites.** Evolution A's endpoint repairs are mandatory — the copilot's primary tools
(`/calculate`, `/sensitivity`, `/schema`) currently fail. **Acceptance:** every method value,
reconciliation weight, and ESG component traces to a tool response; the copilot presents the range
(`[min×0.95, max×1.05]`) alongside the point value; it labels overlay components as
engine-constant vs engine-sourced (per Evolution A) and refuses to present output as a formal
appraisal.
