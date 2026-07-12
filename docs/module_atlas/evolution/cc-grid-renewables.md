## 9 · Future Evolution

### 9.1 Evolution A — Published grid emission factors and hourly marginal signal (analytics ladder: rung 1 → 3)

**What.** §7 confirms the Combined Margin engine is real (`cm = omEF×w_OM + bmEF×w_BM`,
`netGen = capacity × 8760 × cf × (1−aux)`), but the OM/BM inputs come from seeded
`GRID_REGIONS` values and the dispatch model is a stylised sine-curve demand with fixed
coal/gas splits and hard-coded marginal EFs (0.55/0.85). Evolution A grounds both: a
reference table of published grid EFs (UNFCCC harmonized IFI dataset + national CDM
standardized baselines) keyed by country/grid and vintage, and an hourly marginal-EF
series derived from the ENTSO-E generation-mix feed the platform already ingests for
European grids.

**How.** (1) `ref_grid_emission_factors(grid, om_ef, bm_ef, cm_ef, source, vintage)`
via the refdata pattern; the Grid Data tab selects from it with source displayed.
(2) For ENTSO-E-covered grids, compute hourly marginal EF from the actual dispatch
stack rather than the synthetic `demand = D×(0.6+0.4·sin(...))` profile; keep the
synthetic path clearly labelled as illustrative for uncovered grids. (3) Solar/wind
capture-weighted EF: weight the hourly marginal series by the technology's generation
shape, which materially changes solar ER in gas-marginal grids.

**Prerequisites.** EF source licensing check (IFI dataset is public); vintage handling
so 2021 factors are never silently applied to 2026 issuance. **Acceptance:** selecting
India vs Norway pulls different, cited CM factors; a solar project's capture-weighted
ER differs from the flat-CM ER and the delta is displayed.

### 9.2 Evolution B — ACM0002 methodology copilot (LLM tier 1 → 2)

**What.** A copilot answering "why is my CM factor 0.71?", "when can I deviate from
50/50 OM/BM weighting?" (ACM0002 v19 rules are in the §5 reference list), and "what
happens to ER if auxiliary consumption rises to 8%?" — the last executed by re-invoking
the page's real `calcCombinedMargin` and grid-EF-builder functions with LLM-proposed
inputs, since this module has no backend routes to call.

**How.** Tier 1: atlas §5/§7 corpus plus live page state (selected region, OM/BM
values, dispatch chart). Tier 2 (client-side tools): schemas over `calcCombinedMargin`
and `gridEFResult`; the no-fabrication validator matches every tCO₂ figure against a
logged invocation. REC-issuance questions route to the standards text (I-REC v1.5),
never to invented registry balances.

**Prerequisites.** Evolution A's cited EF table, so the copilot attributes factors to
UNFCCC/IFI sources instead of seed values. **Acceptance:** a weighting-deviation
question is answered with the ACM0002 citation; every numeric in a what-if answer
matches a tool return; "what's the I-REC spot price?" is refused.
