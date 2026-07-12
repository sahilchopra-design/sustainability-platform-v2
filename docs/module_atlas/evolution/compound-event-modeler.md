## 9 · Future Evolution

### 9.1 Evolution A — Fit the copulas the page claims to use (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: no Clayton/Gumbel copula is fitted or evaluated — the
joint probabilities `pAB` are hard-coded constants, the displayed "Clayton θ" is the
decorative scaling `depRatio × 0.8`, the scenario-ladder weights are ad-hoc, and the
two headline KPIs (2.3× amp, 4.4× dep) are stale literals inconsistent with the seed
averages (2.19×, 4.66×). The catalogue structure itself is good — 10 pairs typed to
the Zscheischler et al. compound-event classes, with a historical table that broadly
tracks published losses. Evolution A replaces asserted dependence with estimated
dependence.

**How.** (1) Data: the platform already ingests IBTrACS (cyclone tracks/intensities)
and has wildfire/flood grids; pair those with reanalysis-derived marginals (e.g.
Open-Meteo historical extremes, already integrated) to build co-occurrence series for
at least 3 of the 10 pairs — cyclone/surge, heat/drought, drought/wildfire — where
data coverage is honest. (2) Estimation: fit Clayton and Gumbel copulas by maximum
likelihood to the ranked marginals (scipy/statsmodels); report fitted θ, tail
dependence λ, and a goodness-of-fit comparison against independence — the real
version of the Joint Probability Matrix tab. (3) Pairs without adequate data keep
curated `pAB` values but must be labelled curated, with the fitted pairs badged
distinctly. (4) Fix the stale KPI literals by computing them from the table; source
the `HISTORICAL_COMPOUND` losses with citations (EM-DAT IDs).

**Prerequisites.** Co-occurrence data engineering is the real cost — define each
pair's event threshold and window before fitting; document per Atlas §8 model-card
convention. **Acceptance:** fitted θ reproduces under re-run; a fitted pair's
`P(A∩B)` exceeds `P(A)·P(B)` by its estimated (not asserted) ratio; headline KPIs
equal the computed table means.

### 9.2 Evolution B — Compound-scenario narrator for stress-test design (LLM tier 1)

**What.** Compound events are where risk committees most need translation: the
difference between `pAB` and `pA×pB` is exactly the thing executives misjudge.
Evolution B is a copilot that turns a selected pair into a stress-scenario brief:
what the dependence ratio means operationally, which historical precedent
(`HISTORICAL_COMPOUND`) anchors the amplification factor, how the 1.5–3× loss
amplification arises (cascading failures, response saturation — the Zscheischler
framing §5 cites), and a suggested stress-test parameterization the sibling
`climate-stress-test` module could consume.

**How.** Tier-1 RAG: this Atlas record (§7.2's parameter table with its
curated-vs-fitted provenance after Evolution A), the IPCC AR6 Ch.11 typology, and the
historical event table as grounding corpus; selected-pair state passes into the
prompt. The copilot's discipline: quote `pAB`, θ, and amplification only as displayed,
flag curated pairs as uncalibrated, and never extrapolate to unlisted pairs. The
handoff artifact — a scenario parameter block — is structured JSON another module can
ingest, not prose numbers.

**Prerequisites.** Evolution A materially changes the copilot's honesty surface
(fitted vs curated badging must exist first, else every explanation needs a blanket
demo-data caveat); corpus embedding (D3). **Acceptance:** briefs cite the correct
historical precedent rows; a curated pair's brief carries the uncalibrated flag; the
exported scenario block validates against the stress-test module's input schema.
