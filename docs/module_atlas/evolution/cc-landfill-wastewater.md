## 9 · Future Evolution

### 9.1 Evolution A — GWP basis reconciliation and FOD calibration against EPA LMOP (analytics ladder: rung 1 → 3)

**What.** §7 confirms the first-order-decay engine (`calcFOD`) is a real IPCC 2019
year-by-year implementation, but flags a quantitative guide↔code mismatch: the guide
quotes GWP100 CH₄ = 29.8 (AR6 biogenic) while the code hard-codes 27.2 (AR6 fossil) —
a ~9% understatement for biogenic landfill gas. Evolution A fixes the GWP basis as an
explicit, selectable parameter (biogenic 27.0/27.2 vs the guide's 29.8, with the AR6
Table 7.SM.7 citation) and then calibrates the FOD parameters (k per waste fraction,
L₀, collection efficiency) against the EPA LMOP facility database the reference list
already names — LMOP publishes measured LFG collection for ~2,600 US landfills, giving
a real benchmark for the model's 70–85% collection assumption.

**How.** (1) GWP as a first-class input with basis label propagated into every tCO₂e
output. (2) `ref_lmop_facilities` ingest (public CSV); a calibration view comparing
FOD-predicted vs LMOP-reported collected CH₄ for matched waste-in-place, with error
distribution published per §8 model-card convention. (3) The 7-fraction
`WASTE_FRACTIONS` k-values checked against IPCC 2019 Vol.5 Ch.3 defaults.

**Prerequisites.** Resolve the documented 27.2-vs-29.8 discrepancy in one direction and
update the guide accordingly — the mismatch flag must clear. **Acceptance:** switching
GWP basis moves ER by exactly the ratio 29.8/27.2; calibration view reports median
prediction error against ≥100 LMOP facilities.

### 9.2 Evolution B — LFG methodology copilot (LLM tier 1 → 2)

**What.** A copilot explaining the FOD mechanics analysts actually ask about: "why do
credits decline every year even at constant waste intake?" (exponential decay of old
cohorts), "what does raising k for food waste do?", "why is my uncertainty discount 8%?"
— grounded in the atlas §5 formula and the live calculator state. Tier-2 what-ifs
("collection efficiency 78%, oxidation 15%") execute by re-invoking `calcFOD` and the
wastewater COD/B₀ engine client-side, since this module exposes no backend routes.

**How.** Tier 1: atlas record as RAG corpus, page state injected; answers cite ACM0001
v14 / AMS-III.G / IPCC 2019 Waste Volume from §5. Tier 2: tool schemas over the two
calculators with the no-fabrication validator matching answer numerics to logged
invocations.

**Prerequisites (hard).** The GWP mismatch must be resolved first — a copilot asked
"which GWP does this use?" today would have to explain that the guide and code
disagree; Evolution A's fix makes the answer clean. **Acceptance:** the decay-shape
question is answered with the §7 cohort-sum formula cited; every tCO₂e figure in a
what-if traces to a tool return.
