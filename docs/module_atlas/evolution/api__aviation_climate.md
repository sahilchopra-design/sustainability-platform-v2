## 9 · Future Evolution

### 9.1 Evolution A — Live carbon prices, sectoral CORSIA growth, and real §45Z formula (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: seven deterministic sub-models (CORSIA offsetting, ReFuelEU SAF
blending, IRA §45Z credits, EU ETS aviation, IATA NZ2050 alignment, aircraft stranding, full
assessment) with regulatory reference tables faithfully encoded and honest-null handling (no
`unit_sourcing_mix` → `unallocated_tco2` + `insufficient_data`, not a fabricated split). §7.5
documents the simplifications to lift: the two price constants (EUA €65, CORSIA $8.5) are
point-in-time snapshots not live feeds; CORSIA uses operator-own growth vs 2019 rather than the
real *sectoral* growth factor; the ReFuelEU penalty is a flat 50 €/GJ heuristic; §45Z is four
discrete CI tiers rather than the continuous emissions-factor formula; and EUR→USD is fixed at
1.10. Evolution A wires live carbon/EUA prices, implements the sectoral CORSIA growth factor and
the continuous §45Z formula, and adds a live FX rate.

**How.** Price constants become inputs sourced from a market-data ingester (the platform already
wires EIA/ENTSO-E-style feeds); `calculate_corsia_obligation` gains the sectoral-vs-individual
growth blend the scheme actually phases in; `calculate_ira_45z` implements the continuous
`(50 − CI)/50`-style credit with prevailing-wage multipliers. Rung 3: calibrate the aircraft
stranding years (currently uncited scenario assumptions) and SAF-pathway cost premiums against
published fleet-transition and BNEF SAF data.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /full-assessment`
**failed** and `/corsia`, `/eu-ets`, `/aircraft-stranding` **skipped**; the fixed 2025 valuation
date in stranding should be parameterised. **Acceptance:** the §7.4 worked example ($1,648,250 total
exposure) reproduces at legacy price constants; changing the live EUA price moves the ETS cost;
CORSIA obligation reflects sectoral growth; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Aviation-decarbonisation analyst with tool-called assessment (LLM tier 2)

**What.** A tool-calling analyst for airline sustainability and aviation-finance teams: "what's our
CORSIA offsetting cost this year?" (calls `/corsia`), "are we ReFuelEU-compliant and what's the
penalty exposure?" (`/saf-compliance`), "value our §45Z SAF credits" (`/ira-45z`), "model stranding
risk for our A320 fleet" (`/aircraft-stranding`), and "give me the full compliance score" (`/full-
assessment`) — narrating the engine's real deterministic outputs across the whole aviation-
decarbonisation stack.

**How.** Tool schemas from the 7 POST + 4 GET operations; the four `ref/*` endpoints (CORSIA
phases, SAF mandates, aircraft intensity, IATA pathway) are ideal RAG grounding for "what's the
2035 ReFuelEU mandate?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication
validator checks every tonne, dollar and score against tool output; the honest-null design (§45Z
runs only with a certified `lifecycle_ci`) means the copilot must ask for missing certified inputs
rather than assume them.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas + `ref/*`
corpus embedded (roadmap D3). **Acceptance:** every numeric in an answer traces to an engine tool
call; the compliance score cited matches `/full-assessment` exactly; a §45Z query without lifecycle
CI returns the engine's honest-null with the copilot requesting the certified figure, not inventing
one.
