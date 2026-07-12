## 9 · Future Evolution

### 9.1 Evolution A — Compute the advertised composite score, sourced not seeded (analytics ladder: rung 1 → 2)

**What.** The §7 flag is explicit: the guide advertises a weighted 8-dimension
composite (`Score = Σ w_d·Rating_md`, weights 20/20/15/15/10/10/5/5, normalised 0–100)
but **no composite is computed** — the page sorts and plots hard-coded per-attribute
integers from the 20-row `CLUSTERS` seed, and the "Integrity Scoring" tab has no
integrity field at all. Evolution A implements the composite exactly as the guide
specifies, and moves the underlying ratings from invented integers to sourced values:
permanence horizons and buffer rates from registry methodology documents, price and
abatement-cost fields from the Ecosystem Marketplace State of VCM data the §5 reference
list already cites, integrity bands mapped from published BeZero/Sylvera rating
distributions.

**How.** (1) Pure scoring function with the documented weight vector, unit-tested; user
-adjustable weights as a rung-2 sensitivity feature (re-rank as weights slide).
(2) `ref_methodology_ratings(cluster, dimension, rating, source, as_of)` table replacing
the in-page integers; each matrix cell shows its source on hover. (3) The MACC sort and
permanence comparison keep working unchanged — they already use real per-attribute
logic.

**Prerequisites.** Rating-agency data used at band level only (published distributions,
not paywalled per-project scores); the mismatch flag must clear. **Acceptance:** the
composite for REDD+ conservation-grade reproduces the guide's worked 78/100 example
under default weights; changing the additionality weight from 20% to 30% re-ranks
observably.

### 9.2 Evolution B — Procurement advisor copilot (LLM tier 1)

**What.** A copilot that turns the comparison matrix into procurement reasoning: "we
need 50kt for CORSIA with permanence >100y and budget $15/t — which families survive?"
answered by narrating the page's real filter/sort mechanics over the (post-Evolution A,
sourced) ratings table, and "why does DAC score 82 on permanence but 45 on cost?" from
the dimension definitions in §5. Strictly explanatory — this module computes no
emissions and has no backend endpoints, so tier 1 is the honest scope.

**How.** Atlas record plus the ratings table (with sources) as RAG corpus; the current
filter state and visible ranking injected as context. Constraint-screening questions
are answered by restating which rows pass the user's stated thresholds — verifiable
against the on-screen table — never by inventing scores. Export questions route to the
existing CSV path.

**Prerequisites (hard).** Evolution A first: a copilot narrating today's hard-coded
integers as "ICVCM-aligned scores" would misrepresent seed data as assessments.
**Acceptance:** every score cited in an answer matches the rendered matrix cell and
carries its source; a request for a specific project's Sylvera rating is refused
(cluster-level data only).
