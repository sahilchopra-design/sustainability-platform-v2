## 9 · Future Evolution

### 9.1 Evolution A — Country-data-fed vulnerability and calibrated instrument parameters (analytics ladder: rung 2 → 3)

**What.** The E69 engine structures four climate-linked sovereign-debt instruments: CRDC
(trigger probability `100/return_period` with a vulnerability-scaled return period), debt-for-nature
swaps (fund/discount/CO₂ economics), IMF RST access (quota × 150%), and a SIDS composite
(`0.35·INFORM + 0.35·(1−ND-GAIN) + 0.30·(1−fiscal_resilience)`), plus a portfolio aggregator
(`climate_VaR = exposure × vuln × 0.10`). The design is honest (the §5 extract even notes
"deterministic; no random jitter"), but the vulnerability, INFORM, and ND-GAIN inputs are
caller-supplied, and the linear calibration constants (0.15 exposure haircut, 0.10 VaR factor,
0.6/0.4 relief weights) are platform conventions. Evolution A grounds inputs and calibrates.

**How.** (1) Feed INFORM, ND-GAIN, fiscal, and quota inputs from the refdata layer (country
indices are Tier-1 public data — `dh_country_risk_indices` / `public_reference_data`) so a country
assessment needs only an ISO code, with source and vintage attribution. (2) Calibrate the CRDC
return-period scaling against actual disaster-frequency data (EM-DAT / the platform's peril grids)
per country and peril rather than the `(1 − vuln + 0.2)` heuristic. (3) Ground the `× 0.10`
climate-VaR factor in observed sovereign-spread reactions to climate events, or label it
explicitly as a convention with sensitivity. (4) Bench-pin the four instrument calculators.

**Prerequisites.** Country-index ingestion (INFORM/ND-GAIN are freely available); disaster-frequency
linkage; the refdata points store populated. **Acceptance:** a country assessment resolves indices
from stored data with vintages; CRDC trigger probabilities cite a disaster-frequency basis; the VaR
factor carries provenance or an explicit convention label; instruments bench-pinned.

### 9.2 Evolution B — Sovereign climate-debt structuring copilot (LLM tier 2)

**What.** A copilot for sovereign-debt desks: "structure a debt-for-nature swap for this SIDS —
what's the vulnerability composite, the plausible conservation fund, the CRDC trigger probability,
and our portfolio's climate-adjusted exposure?" — calling the five POST endpoints, each figure
tool-sourced, grounded in the precedent registries.

**How.** Five POST instruments plus reference GETs (SIDS list, CRDC trigger types with precedents,
DfN frameworks with the largest-deal and market-size facts, IMF-RST eligible countries and access
limits) — the reference endpoints carry real market precedents the copilot cites instead of
inventing deal history. The portfolio aggregator serves the investor view. What-ifs ("raise the
deferral fraction", "assume RST approval") re-run statelessly. Node for a sovereign/EM desk,
cross-linking to the country-risk and nature copilots.

**Prerequisites.** None hard — the engine is deterministic and honest; country answers are far
stronger after Evolution A's data feed. **Acceptance:** every score, probability, and structured
amount traces to a tool response; precedent claims cite the reference registries; the copilot
labels vulnerability inputs as caller-supplied vs data-resolved and refuses to present structuring
outputs as executable deal terms.
