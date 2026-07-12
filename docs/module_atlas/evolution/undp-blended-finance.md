## 9 · Future Evolution

### 9.1 Evolution A — Persisted deal engine with live Convergence-class benchmarks (analytics ladder: rung 2 → 3)

**What.** This module already computes real methodology — §7.6 singles out the
OECD-DAC grant-element calculator (correct 10% discount rate, real 25%/50% thresholds)
and the leverage/mobilization ratios as its strongest assets, and the scenario blender
gives genuine what-if capability. What's missing is calibration and persistence: the
13-region `MARKETS` table and 7-row `DFI_BENCHMARKS` are illustrative constants, the
DealBuilder's pipeline lives only in component state, and all 2,160 lines are frontend
(Tier B, EP-X4B). Evolution A builds the backend vertical: `blended_finance_engine`
exposing `POST /grant-element`, `POST /capital-stack`, and CRUD on a new
`bf_deals` table so pipelines survive reload, plus a benchmarks refresh path that
replaces the hand-set regional figures with sourced vintages (Convergence State of
Blended Finance annual data, DFI annual-report leverage disclosures) carrying
`as_of` provenance fields.

**How.** Port the amortisation-schedule grant-element math server-side verbatim and
pin the §7.4 worked example ($100M/3%/3yr grace/15yr → GE 40.1%) in `bench_quant`;
Alembic migration for `bf_deals` and `bf_benchmarks`; frontend calculators call the
engine and fall back to local math offline.

**Prerequisites.** Benchmark sourcing is manual-curation-first (Convergence has no
free API); provenance labels required so illustrative rows can't masquerade as
sourced ones. **Acceptance:** bench pin reproduces GE 40.1% exactly; a saved deal
survives reload; every benchmark row displays source + vintage.

### 9.2 Evolution B — Deal-structuring copilot across the six calculators (LLM tier 2)

**What.** The module is really six tools (grant element, leverage, capital-stack
optimizer, additionality scorer, scenario blender, deal scorer) that practitioners use
in sequence — an ideal tool-calling target. The copilot handles requests like
"structure a $75M Kenya solar deal that stays ODA-eligible with minimum
concessionality and beats the Sub-Saharan DFI leverage benchmark": it iterates
`POST /grant-element` and `POST /capital-stack` calls, checks the result against
`DFI_BENCHMARKS` via the engine's comparison route, and returns the tranche structure
with each figure sourced from a tool call — including flagging when a requested
structure falls below the 25% grant-element ODA floor.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; system
prompt grounded in this Atlas page, §7.2's provenance table included so the copilot
distinguishes the correctly-implemented DAC math from the illustrative market tables
and says so when asked about regional data currency. The 10-factor additionality
rubric is narrated, with the caveat (per §7.6) that its weights are platform-defined,
not an external IC standard.

**Prerequisites (hard).** Evolution A endpoints — there is no backend today; the
no-fabrication validator wired in before launch. **Acceptance:** for the structuring
request above, every tranche percentage and GE figure traces to a tool call; a
structure with GE 24% is flagged as non-ODA-eligible, matching the engine's own
classification bands.
