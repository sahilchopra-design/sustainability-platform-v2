## 9 · Future Evolution

### 9.1 Evolution A — Data-vintage-weighted grid EF and full barrier analysis (analytics ladder: rung 1 → 2)

**What.** A large, faithful CDM calculation toolkit: 43 CDM Executive Board tools (TOOL01–33 +
AR-TOOLs) as deterministic calculators with IPCC/national reference constants, plus a 105-activity
guide mapping economic activities to methodologies and tool chains — no PRNG, defaults echoed in
output so they're never mistaken for real inputs. §7.5 names the simplifications to deepen: TOOL01
additionality uses a single barrier-score threshold (≥0.5) rather than the narrative barrier
analysis a DOE assesses; TOOL05/07 grid EF uses a **fixed OM/BM 50/50 weighting** rather than the
data-vintage-weighted combined margin CDM prescribes; and chain aggregation naively sums any
emissions/reductions-named field, so callers must ensure input consistency. Evolution A implements
the data-vintage-weighted combined margin and a structured multi-barrier additionality analysis.

**How.** `calculate_tool07` gains the CDM data-vintage weighting (generation-weighted OM, most-recent
BM) with the standard 3/5-year OM options; `calculate_tool01` accepts a structured barrier list with
per-barrier evidence rather than a single threshold; `execute_tool_chain` validates unit consistency
across chained tools before summing. Rung 2: parameter sensitivity across the chain (e.g. grid-EF
vintage, fNRB uncertainty) surfaced per methodology.

**Prerequisites.** Fix the lineage-harness failures — §4.2 shows `GET /activities/{id}`,
`/activities/{id}/inputs`, and `/for-methodology/{code}` **failed** (likely path/lookup bugs);
preserve the source-cited factor tables and defaults-echoing discipline. **Acceptance:** the §7.4
TOOL03 worked example (4,824.51 tCO₂) reproduces; TOOL07 grid EF changes with the OM data vintage;
a structured barrier analysis produces a defensible additionality verdict; the failing GET endpoints
pass the harness.

### 9.2 Evolution B — Carbon-methodology copilot that runs the tool chain (LLM tier 2)

**What.** A tool-calling analyst for carbon-project developers: "which methodology and tools apply
to a landfill-gas project?" (`/for-methodology`, activity search), "run the ACM0002 tool chain for
my grid-renewables project" (`/chain/{methodology}`), "calculate CO₂ from this fuel mix" (`/tool03/
calculate`), and "is my project additional?" (`/tool01/calculate`) — narrating the engine's real
deterministic outputs and the methodology-level chain verdict. The 105-activity guide (input
parameters, typical ranges, data sources, real-world examples) is ideal for LLM-guided project
scoping.

**How.** Tool schemas from the ~13 endpoints; the activity catalogue and tool registry are ideal
RAG grounding for "what inputs does TOOL30 fNRB need?" questions — a tier-1 explainer over a tier-2
operator that executes the calculators. The no-fabrication validator checks every tCO₂ and IRR
against tool output; the copilot uses the `inputs_guide` (typical ranges, tooltips) to help the user
supply valid inputs, and surfaces per-tool failures in a chain without hiding them.

**Prerequisites.** Evolution A's harness fixes (working activity/methodology lookups for tool-calling);
Atlas + activity/registry corpus embedded (roadmap D3). **Acceptance:** every figure in an answer
traces to a tool-execution call; a methodology chain's net reduction matches `/chain` output; a
tool run with defaults is flagged as using demo defaults, not real project data.
