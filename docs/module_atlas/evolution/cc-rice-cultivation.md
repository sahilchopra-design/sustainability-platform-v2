## 9 · Future Evolution

### 9.1 Evolution A — Explicit IPCC daily-EF scaling chain (analytics ladder: rung 1 → 2)

**What.** §7 flags a units/parameterisation mismatch: the guide specifies the IPCC
daily formulation `EF = EF₀(1.30 kg/ha/day)·SF_w·SF_s·SF_o·t_season` with GWP 29.8,
while `calcRiceCH4` uses seasonal EFs (200–500 kg/ha/season), a single `awd_scaling`
factor, GWP 27.2, and folds soil/organic factors into opaque per-region multipliers.
The science is directionally right (AWD ≈ halves CH₄), but the module cannot currently
answer "what does adding straw amendment do?" because SF_o is not an explicit input.
Evolution A refactors to the documented IPCC 2019 Ch.5 chain: EF₀ × SF_w × SF_s ×
SF_o × season-days, with each scaling factor a first-class, cited parameter.

**How.** (1) Parameter tables from IPCC 2019 Refinement Tables 5.11–5.14 (SF_w for
single/multiple drainage and AWD; SF_o per amendment type and timing) replacing the
folded `soil_correction`/`variety_factor` numbers in `REGIONAL_EF`. (2) A regression
pin proving the refactored formula reproduces current outputs for the default AWD case
within 2% (the seasonal EFs implicitly contain the same factors). (3) GWP basis made
explicit and reconciled with the guide (27.0/27.2 biogenic vs 29.8), clearing the
mismatch flag.

**Prerequisites.** IPCC table values transcribed with uncertainty ranges, not point
guesses; guide updated in the same change. **Acceptance:** toggling straw amendment
(SF_o 1.0 → ~1.9 fresh-straw case) moves baseline CH₄ by the IPCC-published factor;
default-case regression pin passes.

### 9.2 Evolution B — AWD field-practice copilot (LLM tier 1 → 2)

**What.** A copilot for the practice-design questions in this module's workflow: "why
does AWD cut credits when my season shortens?", "what do pore-water tube readings
verify?" (the monitoring protocol §1 describes), "compare AWD vs aerobic rice on both
credits and the `yield_impact` field" — grounded in atlas §5/§7 and the live
calculator. Tier-2 what-ifs re-invoke `calcRiceCH4` client-side with LLM-proposed
scaling factors; there are no backend routes.

**How.** Tier 1: atlas record as corpus with the current parameterisation honestly
described (seasonal EFs, single scaling factor — until Evolution A, the copilot must
not imply SF_s/SF_o are adjustable). Tier 2: tool schema over the calculator; validator
ties every tCO₂e to a logged invocation. Yield-impact answers cite the `WATER_REGIMES`
seed values as indicative, not measured.

**Prerequisites.** Evolution A makes amendment/soil questions answerable; without it
the copilot's honest reply is "not an input in this module". **Acceptance:** an
amendment what-if is either executed via the explicit SF_o (post-A) or correctly
refused (pre-A); no numeric appears without a tool-call source.
