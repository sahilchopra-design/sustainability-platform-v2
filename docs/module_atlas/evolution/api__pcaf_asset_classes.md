## 9 · Future Evolution

### 9.1 Evolution A — Data-sourced attribution and Monte Carlo uncertainty (analytics ladder: rung 3 → 4)

**What.** An investor-grade PCAF Part A financed-emissions engine covering all seven asset
classes: per holding it computes `financed_emissions = attribution_factor × investee_emissions`
(attribution = outstanding/EVIC for listed equity/bonds), auto-derives the PCAF Data Quality
Score via a provenance waterfall (`_auto_dqs_corporate`: verified→1, reported→2, physical→3,
revenue→4, sector proxy→5), applies DQS uncertainty bands (`low/high = central × (1 ∓
DQS_uncertainty)`), and aggregates to portfolio footprint, WACI, and implied temperature.
This is already rung-3 (benchmarked, PCAF-standard-aligned). The bands are deterministic
±multipliers rather than a real distribution, and EVIC/emissions are caller-supplied.
Evolution A raises it to predictive.

**How.** (1) Auto-source EVIC and investee emissions from the platform's `financial_data`
(yfinance EVIC extract) and EDGAR fundamentals, so attribution factors are computed from
stored market data with an `evidence_tier`, not hand-entered. (2) Replace the ±DQS-band
approximation with a Monte Carlo propagation: sample per-holding emissions from a
distribution whose width is set by the DQS, and report portfolio-level confidence intervals
(rung 4) — the QMC pattern the roadmap names. (3) Auto-derive DQS improvement pathways from
the `/dqs-improvement-guidance` waterfall (which data upgrade most cuts portfolio
uncertainty). (4) Bench-pin all seven asset-class attribution formulas.

**Prerequisites.** `financial_data` EVIC/emissions linkage (module exists); a DQS→variance
mapping for the Monte Carlo. **Acceptance:** attribution factors trace to stored market data
with an evidence tier; portfolio financed emissions carry a real confidence interval, not a
±band; the guidance endpoint ranks data upgrades by uncertainty reduction; bench pins pass.

### 9.2 Evolution B — Financed-emissions accounting copilot (LLM tier 2)

**What.** A copilot that runs the per-asset-class endpoints and portfolio aggregate, then
explains the number a bank actually reports — "your financed emissions are X tCO₂e at
portfolio DQS 3.2; the biggest uncertainty driver is the 40% of business loans on revenue
proxies; upgrading them to reported data cuts the band by Y" — each figure tool-sourced.

**How.** Eight POST endpoints (one per asset class + `/portfolio-aggregate`) plus reference
GETs (asset-classes, methodology, DQS-improvement-guidance, EPC-benchmarks) that ground every
PCAF constant. The DQS waterfall lets the copilot explain *why* a holding scored 4 and what
data would improve it. What-ifs ("what if we get verified emissions for our top-10 holdings?")
re-run statelessly. Cross-links to `pcaf_quality`, `pcaf_ecl_bridge`, and `financial_data`
copilots — a core node for a financial-institution desk.

**Prerequisites.** None hard — engine is PCAF-aligned and honest; stronger once Evolution A
sources data automatically. **Acceptance:** every attribution factor, DQS, and emissions
figure traces to a tool response; the copilot cites the specific PCAF table behind each DQS
from the reference endpoint; it presents implied temperature and bands as PCAF estimates with
their uncertainty, and refuses to assert a precision the DQS doesn't support.
