## 9 · Future Evolution

### 9.1 Evolution A — Live adaptation BCR engine from cash-flow primitives (analytics ladder: rung 1 → 2)

**What.** EP-EI6 is honestly a curated reference display: `INFRA_SECTORS`,
`ADAPT_RETURNS`, and `IFC_STANDARDS` are stored tables, and §7 confirms the BCR /
NbS-BCR / long-horizon-IRR formulas describe how the seeds were *conceived*, not what
the page computes (`computed` is empty; §8 is an unimplemented spec). Evolution A gives
the module its first real calculation: solve `BCR = Σ PV_Benefits / Σ PV_Costs` and the
25–50-year IRR from user-entered cash-flow primitives, with scenario toggles for
discount rate and hazard frequency.

**How.** (1) First backend vertical: `POST /api/v1/climate-infra/bcr` taking CapEx,
OpEx, land cost, avoided-loss schedule, ecosystem-service and carbon-value streams, and
returning BCR, NbS-BCR, and NPV=0 IRR per horizon — implementing §8.3 as written.
(2) Scenario dimension: discount rate sweep (3–8%) and a hazard-frequency multiplier
sourced from the digital-twin composite scores for the project's coordinates, so
"climate risk reduction" stops being a stored attribute. (3) Frontend keeps the curated
22-project pipeline as comparables but marks the computed panel distinctly; the 6.2×
worked example (310/50) becomes the regression test.

**Prerequisites.** None hard — the module has zero blast radius and no seeded-PRNG
defect to purge; carbon value needs a price-path source (the platform's NGFS carbon
price interpolator already exists in `climate_transition_risk_engine`).
**Acceptance:** entering the §7.4 coastal-barrier inputs reproduces BCR 6.2×; IRR
ordering traditional < climate-smart < NbS emerges from cash flows, not a stored table.

### 9.2 Evolution B — IFC safeguards copilot for project screening (LLM tier 1)

**What.** A copilot answering the questions DFI project teams actually bring to this
page: "which IFC Performance Standards bind for an urban-cooling project?", "why does
NbS BCR widen at 50-year horizons?", "how does the 6.1× World Bank average compare to
this sector?" — grounded strictly in the module's curated corpus (`IFC_STANDARDS` PS
1–8 climate-relevance rows, the UNEP Adaptation Gap / World Bank references §5 cites)
and the page's current filter state.

**How.** Tier-1 RAG per the roadmap: this Atlas record plus the seed datasets
themselves embedded into `llm_corpus_chunks`; served through the standard
`POST /api/v1/copilot/climate-smart-infrastructure/ask` route with prompt-cached module
context. Because the module has no endpoints, there is nothing to tool-call yet —
tier 2 becomes possible only after Evolution A ships, at which point "recompute this
project's BCR at a 6% discount rate" maps to the new `/bcr` operation.

**Prerequisites.** Corpus embedding pipeline (roadmap D3); a disclosure rule so the
copilot states that project IRRs are curated illustrations, not live appraisals.
**Acceptance:** copilot correctly maps a described project to the binding PS numbers
with citations; refuses to invent project-specific BCRs beyond the stored table until
the Evolution A engine exists.
