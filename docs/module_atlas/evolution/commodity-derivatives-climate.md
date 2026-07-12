## 9 · Future Evolution

### 9.1 Evolution A — Live curves and WEO-anchored demand paths under the real pricer (analytics ladder: rung 2 → 3)

**What.** EP-CI4's mathematics is genuinely sound — §7.5 confirms the Black-76 pricer
with `erf`-based normal CDF is "correct and real" and the page is deterministic, not
`sr()`-driven. The gaps are the inputs: base prices/vols are curated constants, the
NGFS demand decay is a stylised `max(0.3, 1 − m/(peakYear·12))` rather than an IEA WEO
demand curve, and the vol surface is two fixed coefficients (skew 0.15, term 0.05).
Evolution A calibrates all three so the correct math prices realistic markets.

**How.** (1) Anchor spot/forward levels to EIA series (already integrated in
data-sources wave 1 — WTI, Henry Hub) refreshed by the ingestion framework, replacing
curated `basePrice`. (2) Replace the linear decay with digitised IEA WEO/NZE demand
trajectories per scenario (small curated table, versioned, cited — e.g. the Brent 2030
NZ ≈ $45 anchor §7.5 already quotes) so contango collapse follows a published pathway.
(3) Fit the vol surface: SVI or simple polynomial fit to a curated implied-vol grid per
commodity, documented per the Atlas §8 model-card convention, replacing the fixed
shapers. (4) Move pricing into a backend engine (`commodity_climate_derivatives`) so
the module gains its first endpoints and the §7.4 ATM worked example gets pinned in
`bench_quant.py`.

**Prerequisites.** EIA ingest coverage for the commodity set; an implied-vol data
source (even a quarterly curated grid beats fixed coefficients — label provenance
honestly). **Acceptance:** the ATM Black-76 example reproduces to 4 decimals through
the backend; scenario curves hit the WEO anchor points; put-call parity holds across
the strike grid in an automated test.

### 9.2 Evolution B — Hedging-desk analyst over the pricing engine (LLM tier 2)

**What.** The Hedging Strategy Builder currently offers template put-spreads/collars
with costs as fractions of `comm.base`. Evolution B turns hedging into a dialogue:
"hedge 100kb/d of refining margin against Delayed Transition through 2027" gets
decomposed by the analyst into crack-spread components (the module's `SPREADS`
definitions), priced leg-by-leg via tool calls to the Evolution A pricing endpoints,
and returned as a costed strategy comparison — premium outlay, breakevens, scenario
P&L across the NGFS set — with every option value computed by Black-76, never by the
model.

**How.** Tool schemas over the new engine's price/curve/spread operations; grounding
corpus is §5 (Black-76 formula, σ_adj convention) and §7.2's parameter provenance so
the analyst discloses which inputs are live EIA data versus curated vol grids. The
no-fabrication validator has sharp teeth here — option premia are exactly the numbers
a plausible-sounding LLM would hallucinate — so every $/bbl figure must match a tool
response. Strategy P&L grids render as the module's existing chart payloads.

**Prerequisites (hard).** Evolution A's backend engine — today there are no endpoints
at all, and a tier-2 analyst without tools would be a fabrication machine.
**Acceptance:** a generated collar recommendation where each leg's premium matches an
individual pricing call; the analyst refuses exotic payoffs (Asians, swaptions) the
engine doesn't price rather than approximating them.
