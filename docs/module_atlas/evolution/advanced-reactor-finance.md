## 9 · Future Evolution

### 9.1 Evolution A — Real TRL-adjusted NPV with fixed dimensional model (analytics ladder: rung 1 → 2)

**What.** The page's LCOE branch is internally consistent, but §7.5 documents that the NPV
branch is illustrative only: plant capacity is implicitly `capexPerKw/1000` MW so raising
unit CAPEX *raises revenue*, O&M is omitted from the discounted stream, and `blendRev`
($k) is netted against a $/kW-yr slider. Meanwhile the guide's headline
`TRL-NPV = Σ[P(success|TRL)·CF_t/(1+r)^t] − I₀` is not implemented at all — TRL appears
only as badges. Evolution A delivers both: a dimensionally correct DCF with an explicit
`capacity_mw` input, O&M in the discounted stream, and TRL-conditional success
probabilities (DOE TRA-style P(success) table per TRL band) weighting the cash flows,
plus a CAPEX uncertainty band (±50–100% pre-FOAK per the IAEA framing) swept as scenarios.

**How.** Port `calcLcoe` and the corrected NPV into a small backend engine
(`gen4_finance_engine`) with `POST /api/v1/gen4/npv` and `GET /api/v1/gen4/reference`
serving GEN4_TYPES/ARDP/LCOE_COMPARISON as cited reference data; the 2025–2044 deployment
fan — currently a seeded-random growth curve (`sr(i·k)·scale + slope·i`), documented as
decoration — is replaced by a logistic diffusion parameterised per technology's TRL and
first-deployment year, or removed.

**Prerequisites.** Purge the `sr()` timeline per the platform's no-fabricated-random
guardrail; note the §2.2 endpoint table currently lists `pcaf_advanced.py` routes that are
not this module's vertical. **Acceptance:** the §7.4 LCOE case still yields ≈$75.0/MWh;
doubling CAPEX/kWe at fixed capacity now *lowers* NPV; TRL 4 vs TRL 7 designs with
identical cash flows produce different probability-weighted NPVs.

### 9.2 Evolution B — Reactor-economics copilot on the slider model (LLM tier 1)

**What.** A chat panel that explains the live slider state — "why did LCOE jump when I
moved construction time from 4 to 8 years?" (IDC factor `(1+w)^(cy/2)` compounding),
"which Gen IV design fits a 950 °C process-heat offtake?" (join of GEN4_TYPES temperatures
against PROCESS_HEAT_APPS requirements), "what did X-Energy actually get from ARDP?"
($1.2B, from the seeded awards table). Grounded strictly in this Atlas page and current
slider values; it must volunteer that the NPV branch is illustrative (per §7.5) until
Evolution A ships, and that LCOE-2040 figures are labelled projections.

**How.** Tier-1 roadmap pattern: §7.1 formulas, §7.2 reference tables and §7.5 limitations
embedded as the module corpus; slider state passed as structured context so the copilot
decomposes the actual on-screen LCOE into capital annuity, IDC and O&M terms rather than
recomputing. Served via `POST /api/v1/copilot/advanced-reactor-finance/ask`; refusal path
for questions the module cannot answer (e.g. fusion economics — §7 notes fusion appears in
one investor row and is not modelled). After Evolution A, graduate to tier 2: "run the NPV
at TRL 5 with a −30% CAPEX case" becomes a tool call to `POST /gen4/npv`.

**Prerequisites.** Atlas corpus embedded (roadmap D3 pgvector). **Acceptance:** the copilot
reproduces the §7.4 worked decomposition ($404.15/kW-yr annuity × 1.1664 IDC) from page
state; asking for a probability-of-success-weighted NPV before Evolution A returns a
refusal citing the guide↔code mismatch.
