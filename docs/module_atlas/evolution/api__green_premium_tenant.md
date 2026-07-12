## 9 · Future Evolution

### 9.1 Evolution A — Market-calibrated greenium curves and EPC transition costing (analytics ladder: rung 2 → 3)

**What.** Two deterministic real-estate engines behind three endpoints:
`GreenPremiumEngine` (`POST /assess`) computes green premium / brown discount via income
capitalisation (`adjusted_value = NOI / (adjusted_cap_rate/100)`), and `TenantESGTracker`
(`POST /tenant-esg`) cascades tenant scope 1+2 carbon into a property/portfolio ESG
score. The premium magnitudes come entirely from static reference tables
(`green_rent_premium_by_certification`, `epc_cap_rate_adjustment_bps`,
`sector_carbon_benchmarks_tco2e_per_employee` — all returned by `/reference-data`).
Evolution A calibrates these against real market and EPC data and adds retrofit costing.

**How.** (1) Replace the static certification-premium and cap-rate-bps tables with
values fit from the platform's ingested UK EPC dataset (`uk_epc` module) and any
transacted rent/yield evidence, versioned with a provenance date. (2) Add a
retrofit-to-green module: cost of moving an EPC E/F/G asset to B, netted against the
avoided `annual_void_cost` and the value uplift the engine already computes — turning a
static premium into a decision (rung 3 with a payback metric). (3) The §5 note that
`best_cert_pct = max (NOT additive)` is a good anti-double-count guard — preserve and
bench-pin it. (4) Pin `/assess` and `/tenant-esg` in bench_quant.

**Prerequisites.** UK EPC data wired in (module exists); transacted rent/yield reference
for greenium calibration (thin — may remain literature-sourced with honest labelling).
**Acceptance:** `/reference-data` returns calibration date and source per premium row;
a retrofit scenario returns a payback period; bench pin reproduces `adjusted_value` and
portfolio roll-up.

### 9.2 Evolution B — Real-estate ESG advisory copilot (LLM tier 2)

**What.** A copilot on the green-premium page that answers "what's this asset worth if
we take it from EPC D to A?" by re-calling `/assess` with the amended certification and
narrating the value_impact and rent uplift, and "which tenants drag our portfolio carbon
score?" by reading the `/tenant-esg` cascade and citing per-tenant
`carbon_per_emp vs benchmark`.

**How.** Three endpoints (two POST engines + `/reference-data`) form the tool set;
`/reference-data`'s six keyed tables are the grounding corpus so the copilot explains
*where* a premium number comes from. What-ifs are cheap — both engines are stateless, so
the copilot mutates the property/tenant payload and re-runs. The income-capitalisation
identity from §7.1 lets it explain sensitivity ("value moves inversely with cap rate").

**Prerequisites.** Two POST endpoints trace as **failed** in §4.2 (validation/payload
issues under the harness) — these must be confirmed working before a copilot invokes
them, or every what-if errors. **Acceptance:** every value/rent figure quoted traces to
an `/assess` or `/tenant-esg` tool response; the copilot presents premiums as
model-based estimates citing the (currently uncalibrated) reference source, and refuses
to state a guaranteed valuation.
