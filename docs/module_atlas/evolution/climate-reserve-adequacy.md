## 9 · Future Evolution

### 9.1 Evolution A — Triangle upload for the genuinely actuarial stack (analytics ladder: rung 2 → 3)

**What.** §7 gives this module credit rarely earned in its family: a genuinely
actuarial reserving stack — chain-ladder IBNR (`paid × CDF − paid`),
Bornhuetter-Ferguson (`1/CDF × expUltimate` with climate development loading),
NGFS-scenario climate IBNR, discounting, and a Solvency II cost-of-capital risk
margin — implemented with textbook mechanics over 20 LoBs whose premiums, loss
ratios, and development factors are the only synthetic part. Evolution A supplies
real triangles: an upload path for cumulative paid/incurred development triangles
(the universal actuarial exchange format), from which development factors are
*estimated* (volume-weighted link ratios) rather than seeded, plus tail-factor
selection — turning the existing calculators into a working reserving tool. The
climate loading's `SCEN_MULT` values get an evidence pass against the EIOPA 2022
climate sensitivity and BoE CBES results the §5 references name.

**How.** (1) Triangle schema (LoB, accident year, development month, paid/incurred)
with client- or server-side link-ratio estimation feeding the untouched CL/BF
functions — the §7-verified math is the asset; this evolution feeds it.
(2) Scenario multipliers as a cited reference table (EIOPA/CBES-derived per peril-
line) replacing asserted constants. (3) CRAR threshold logic (the 10% capital-action
flag from the workflow description) implemented as a computed flag per line.

**Prerequisites.** A fixture triangle with published CL results (standard actuarial
teaching datasets exist) as the bench pin; IFRS 17 discounting basis documented.
**Acceptance:** the fixture triangle reproduces its published chain-ladder ultimate;
uploaded triangles drive all downstream figures; scenario multipliers carry
citations; the CRAR flag fires exactly at the documented threshold.

### 9.2 Evolution B — Reserving-review copilot (LLM tier 2)

**What.** An assistant for actuarial review meetings: "why does BF exceed CL for
this immature line?" (the credibility mechanics — low CDF-implied reported fraction —
narrated from the actual function forms), "which lines breach the 10% CRAR threshold
under Disorderly and what drives the loading?", "how sensitive is the risk margin to
reporting lag?" — what-ifs executed by re-invoking the CL/BF/climate-IBNR functions
client-side with modified inputs (this module has no backend routes; Evolution A may
keep it client-side legitimately since the math is light).

**How.** Tool schemas over the five calculators; the validator on every IBNR,
reserve, and margin figure; method-choice explanations grounded in the §5/§7 corpus
(the CL-vs-BF trade-off is standard actuarial pedagogy and the module's real formulas
support teaching it faithfully); refusal on booking recommendations — the copilot
reviews, the signing actuary decides.

**Prerequisites.** Evolution A for real-book relevance; workable today as a
methods explainer since the calculators are genuine. **Acceptance:** a what-if
answer matches the recomputed function outputs; a CRAR-breach list reproduces from
the flag logic; the copilot declines to recommend a booked reserve figure.
