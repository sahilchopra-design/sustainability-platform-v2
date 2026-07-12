## 9 · Future Evolution

### 9.1 Evolution A — Real book, published shocks, lifetime ECL (analytics ladder: rung 2 → 3)

**What.** The stress structure is genuinely supervisory-shaped — 25 NGFS/ECB/BoE/APRA
scenarios × 31 NACE sectors, IFRS-9 ECL with transition/physical decomposition, CET1
waterfall — but §7.5 is clear about the three gaps: the borrower book is `sr()`-seeded,
the ECL split uses fixed heuristics (0.6 transition weight, 0.2–1.5% physical band)
rather than damage functions, and CET1 components are stored magnitudes, not solved
from ECL/RWA changes. Evolution A calibrates all three: run the stress on a real
portfolio, replace heuristic multipliers with published ECB CST parameters, and make
the capital bridge an output.

**How.** (1) Load obligors from `portfolios_pg` (the roadmap's D0 demo book) instead of
the seeded generator; NACE mapping already exists in `SECTORS`. (2) Source PD/LGD shock
paths from the `/ref/ngfs-scenarios` and `/ref/damage-functions` endpoints — the three
ref GETs already pass the lineage harness — so frontend multipliers and backend engine
stop diverging. (3) Replace the fixed 0.6/physical-band heuristics with the engine's
damage functions; extend single-period PD to a lifetime term structure for IFRS-9
staging. (4) Solve CET1 components from ECL and RWA deltas; pin one full scenario run
in `bench_quant.py`.

**Prerequisites.** The five POST endpoints (`/ecb-cst`, `/boe-cbes`, `/apra-clt`,
`/bcbs-517`, `/cross-framework`) show harness status `failed` — triage whether that is
payload-shape or a live bug before wiring the frontend to them; edits propagate to
`climate-stress-test-suite` via the shared `climate_stress_test_engine`.
**Acceptance:** frontend and `POST /ecb-cst` agree on sector CSL for the same book
within rounding; aggregate RWA loss lands in the ECB's published 4–8% context or the
deviation is explained in the payload.

### 9.2 Evolution B — Supervisory-submission analyst (LLM tier 2)

**What.** A tool-calling analyst for capital planners: "run Delayed Transition on the
lending book and draft the capital-adequacy narrative" executes
`POST /api/v1/climate-stress-test/ecb-cst` (and `/cross-framework` for multi-regulator
comparisons), then writes the submission-style commentary — CSL by sector, ECL staging
migration, CET1 bridge — with every figure sourced from the tool response. Follow-ups
("why is Basic Metals the worst sector?") answer from the sector-multiplier
decomposition the engine returns, citing the NGFS scenario definition used.

**How.** Tool schemas filtered from the module's 9 OpenAPI operations; the three ref
GETs serve as grounding lookups (frameworks, scenarios, damage functions) the model can
cite without computing. System prompt built from §5 (CSL formula, NGFS/ECB standards)
and §7's calculation walkthrough. The no-fabrication validator applies — supervisory
narratives are exactly where an invented basis point is most damaging. Drafts render
through the report-studio layer per the roadmap's Tier-3 output path.

**Prerequisites (hard).** The failed POST endpoints must pass the harness first — an
LLM cannot narrate a 500; Evolution A's real-book wiring so narratives describe an
actual portfolio. **Acceptance:** a generated ECB CST narrative contains zero numerics
absent from the tool-call outputs; the analyst refuses to project beyond the scenario
horizons the engine supports.
