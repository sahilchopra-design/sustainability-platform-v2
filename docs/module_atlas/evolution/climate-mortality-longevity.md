## 9 · Future Evolution

### 9.1 Evolution A — Age-sex tables and evidenced heat coefficients (analytics ladder: rung 1 → 2)

**What.** §7 flags the structural gaps: the guide promises country age-sex mortality
tables with three additive hazards under SSPs; the code applies a multiplicative
two-hazard chain (heat × air quality) to a single synthetic q₆₀ per country under
NGFS scenarios, and generates cold-snap and flood excess-mortality fields that are
never used. Evolution A supplies the actuarial substance: real life tables (the UN
World Population Prospects and HMD publish full age-sex qₓ tables per country,
downloadable), heat-mortality coefficients from the published epidemiology the §5
references name (Lancet Countdown, IFoA climate mortality working paper — which give
excess-mortality per degree by age band, the crucial structure: heat mortality is
strongly age-skewed and a single q₆₀ cannot express it), and the unused cold/flood
fields either wired into the model or deleted.

**How.** (1) `ref_life_tables(iso3, sex, age_band, qx, source, year)` from
UN WPP; the CAMR chain applied per age band so annuity and term impacts diverge
realistically (annuities are old-age-heavy where heat effects concentrate).
(2) Hazard coefficients from published dose-response studies with citations and CIs;
the multiplicative-vs-additive choice documented and reconciled with the guide.
(3) The repricing tab computes reserve deltas from the full adjusted table (curtate
lifetime, annuity-due factors) — real actuarial arithmetic the current single-rate
shortcut cannot do.

**Prerequisites.** Life-table licensing (UN WPP is open); the dead code fields
resolved; scenario framing (NGFS vs SSP) reconciled with the guide. **Acceptance:**
a 60-year-old vs 80-year-old annuitant show different climate mortality uplifts per
the age-banded coefficients; reserve deltas reproduce textbook annuity math on a
fixture table; unused fields are gone.

### 9.2 Evolution B — Actuarial-assumptions copilot (LLM tier 1 → 2)

**What.** A copilot for pricing and valuation actuaries: "how does SSP5-8.5 heat
stress move our Spanish annuity reserves?" (post-Evolution A, a computed answer with
the age-band decomposition), "why is the term-life impact smaller than the annuity
impact?" (age-skew narration — a genuinely instructive answer the data structure
supports), "what evidence backs the heat coefficient?" (the cited dose-response
studies with CIs). Tier-2 what-ifs re-run the CAMR/repricing functions client-side
with scenario and coefficient inputs.

**How.** Tier 1: atlas record + life-table and coefficient references as corpus;
uncertainty ranges carried into prose. Tier 2: tool schemas over the adjusted-table
and repricing functions; validator on every qₓ, reserve, and premium figure.
Refusal on individual-underwriting and medical questions.

**Prerequisites (hard).** Evolution A first — narrating reserves priced off a
synthetic q₆₀ would misstate both level and structure. **Acceptance:** a reserve
answer decomposes by age band matching the function output; coefficient questions
return citations; the copilot flags when a country's table is a regional proxy.
