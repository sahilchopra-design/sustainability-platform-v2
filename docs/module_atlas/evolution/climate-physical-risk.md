## 9 · Future Evolution

### 9.1 Evolution A — Digital-twin composite instead of independent seeded draws (analytics ladder: rung 1 → 3)

**What.** §7 finds the guide's hazard-exposure-vulnerability engine entirely absent:
`compositeRisk`, `exposure`, and `vulnerability` are *independent* seeded draws (the
composite is not even the product of the other two), `annualLoss` is a direct seeded
number, and there are no damage functions or return-period exceedance curves. The
platform, however, has already built exactly the missing substrate twice over: the
Physical Risk Digital Twin (five populated hazard grids + composite scoring engine)
and the physical-risk-pricing module (E104, with return-period loss tables and the
copilot exemplar). Evolution A re-founds this screening dashboard on those: the 50
assets get coordinates, per-peril scores from grid lookups, a composite that is a
documented function of hazard × exposure × vulnerability (finally matching the
guide), and AAL/EP-curve figures delegated to the pricing engine rather than seeded.

**How.** (1) Asset schema gains lat/lon; per-peril scores via the twin's scoring
endpoints with `resolution_tier` shown. (2) Composite implemented as the guide's
H×E×V with exposure from asset value/footprint and vulnerability from asset-class
damage-function parameters shared with E104 — one damage-function library, not two.
(3) The "Climate Change Impact" tab re-based on the grids' scenario layers (SLR
scenarios exist in the twin's IPCC-AR6 data); the seeded TREND series deleted.
(4) Clarify the module's role vs E104 in both guides: screening (this page) vs
pricing (E104) — the interconnection graph should record the dependency.

**Prerequisites (hard).** PRNG purge; coordinates for the asset roster; flood/SLR
grid sparsity honestly surfaced (the twin's known coverage limits). **Acceptance:**
composite equals the documented H×E×V function of its displayed components; two
assets differing only in location differ per the grids; AAL figures reproduce via
the E104 engine; zero seeded risk numbers remain.

### 9.2 Evolution B — Portfolio screening copilot (LLM tier 2)

**What.** A screening assistant one level up from E104's underwriter copilot: "screen
this asset list and rank by composite risk", "which assets sit in cyclone-and-flood
overlap zones?", "why is the Rotterdam warehouse scored lower than the Miami tower?"
(decomposition into grid-sourced hazard terms and the H×E×V arithmetic), with deep
pricing questions ("price the premium") handed off to the physical-risk-pricing
module's copilot per the tier-3 routing pattern — the two modules sharing one
grounding corpus for hazard semantics.

**How.** Tool schemas over the twin's scoring endpoints and the new composite
function; the validator on every score and loss figure; handoff rules in the system
prompt keyed to the atlas interconnection edges; `resolution_tier` always narrated
for sparse-coverage assets.

**Prerequisites (hard).** Evolution A first — the current page's numbers are
independent random draws and any narration of them would be the exemplar's
warned-against failure mode verbatim. **Acceptance:** a ranking answer reproduces by
re-querying the scoring endpoints; comparative explanations cite grid values;
pricing requests route to E104 rather than being answered here.
