## 9 · Future Evolution

### 9.1 Evolution A — Compute the Climate Equity Score from real EJSCREEN data (analytics ladder: rung 1 → 2)

**What.** §7 flags the gap precisely: the guide advertises
`Climate Equity Score = 0.4·LMI Rate + 0.3·Environmental Justice + 0.3·Energy Burden
Reduction` plus an LMI Targeting Rate, but the code computes only an NMTC 39% benefit
and a trivial climate multiplier — the rest is display of hard-coded CDFI tables plus
an `sr()`-seeded deal pipeline. Evolution A implements the advertised composite on
public data the guide itself names: EPA EJSCREEN tract-level percentiles (public CSV),
FFIEC LMI tract designations, and DOE/ACEEE energy-burden estimates, joined to a
portfolio of loans geocoded to census tracts.

**How.** (1) `ref_ej_tracts(tract_geoid, ej_percentile, lmi_flag, energy_burden_pct)`
reference table from the EJSCREEN + FFIEC public files (a bounded, annual-refresh
ingest). (2) LMI Targeting Rate and the weighted composite as pure functions over a
`cdfi_loans` table (the module's first backend vertical — loan amount, product type,
tract). (3) Delete the `sr()`-seeded pipeline/trend series — the platform guardrail
treats seeded-random-as-data as a defect — replacing them with aggregates over real or
honestly-labelled fixture loans.

**Prerequisites.** The seeded-random series removal is non-negotiable before the score
ships; EJSCREEN vintage pinned (EPA revises annually and has altered availability —
mirror the file). **Acceptance:** a fixture portfolio with known tract mix reproduces a
hand-computed equity score; moving one loan from a non-LMI to an LMI tract moves the
LMI rate by exactly its portfolio weight.

### 9.2 Evolution B — CDFI impact-narrative copilot (LLM tier 1)

**What.** A copilot for certification and impact questions: "does this portfolio meet
Treasury CDFI Fund target-market thresholds?", "explain our NMTC leverage structure"
(the real 39%-credit calculation on page), "which programs in the `CLIMATE_PROGRAMS`
table fit a green-home-improvement strategy?" — grounded in this atlas record, the §5
standards (Treasury CDFI certification 2024, Justice40), and, post-Evolution A, the
computed equity score.

**How.** Tier-1 pattern: atlas record and reference tables as corpus; NMTC answers
walk the actual `calcNmtcBenefit` arithmetic (QEI × 0.39, leverage ratio); threshold
questions cite the certification standard text and compare against computed portfolio
rates — comparison narration, not new math.

**Prerequisites (hard).** Evolution A first for any equity-score claim — today the
score exists only in the guide, and a copilot citing it would be describing vaporware.
**Acceptance:** every percentage in a certification answer traces to a computed
portfolio aggregate or a cited standard threshold; asked to forecast NMTC allocation
awards, the copilot refuses.
