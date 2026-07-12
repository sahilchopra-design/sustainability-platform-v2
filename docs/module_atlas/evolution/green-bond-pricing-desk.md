## 9 · Future Evolution

### 9.1 Evolution A — Live primary-issuance pricing with calibrated greenium and book-building (analytics ladder: rung 3 → 4)

**What.** §7 rates this a genuine tier-A primary-issuance workbench: backend math in `green_bond_analytics.py` (473 lines, 3 POST endpoints) with no PRNG anywhere, live rating-bucket OAS comps from `GET /api/v1/fred-spreads/series` (real ICE BofA series via FRED, Live/Demo badged on `FRED_API_KEY`), a real EuGB compliance verdict, an order-book allocation optimizer, and use-of-proceeds impact-yield analytics — every fabricated-looking number is either a labeled reference table or a user-editable input. Evolution A deepens it toward predictive pricing: calibrate the greenium adjustment against observed new-issue-concession data (rather than a hand-authored `GREENIUM_TABLE`), and add a forward-pricing layer that projects the likely re-offer spread from the live comp curve plus issuer-specific factors.

**How.** (1) Replace the static `GREENIUM_TABLE` with a greenium estimated from a panel of recent green vs conventional new issues by rating/sector, refreshed from market data. (2) A pricing model that forecasts re-offer spread from the FRED comp curve, tenor, rating, and greenium, with a confidence band. (3) Extend the order-book optimizer with real allocation-preference weighting (green-mandate investors). (4) Keep the honest Live/Demo badging on all live-data paths.

**Prerequisites.** A new-issue-concession dataset for greenium calibration; the FRED key for live comps (already integrated with graceful demo fallback). **Acceptance:** the greenium is calibrated to observed concessions with a documented method (not a hand-authored table); the forward re-offer spread reproduces from the comp curve plus adjustments; live-data badging remains accurate.

### 9.2 Evolution B — Syndicate-desk pricing copilot (LLM tier 2)

**What.** A copilot for DCM/syndicate desks: "price a 7-year A-rated green bond off today's comps, estimate the greenium, and run the order-book allocation at 2× cover" tool-calls the three pricing endpoints and narrates the re-offer spread, EuGB compliance verdict, and allocation, with the live FRED comp curve as the spine.

**How.** Tier-2 tool-calling over the existing 3 POST endpoints (pricing, allocation, impact) — the module is already backend-complete, making it a strong tier-2 candidate now. The grounding corpus is §7, which documents the FRED comp integration, EuGB verdict logic, and allocation optimizer. The copilot must respect the Live/Demo badge — if FRED is unavailable it states comps are demo. Every spread and allocation figure validated against tool output; the fabrication guard checks basis points against the pricing endpoint.

**Prerequisites.** None hard — the backend exists and is PRNG-free; prompt-caching for the module context. Evolution A's calibrated greenium strengthens answers. **Acceptance:** every spread, greenium, and allocation figure traces to a tool call; the copilot surfaces the EuGB compliance verdict verbatim from the endpoint; it flags demo comps when FRED is absent.
