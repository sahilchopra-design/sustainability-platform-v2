## 9 · Future Evolution

### 9.1 Evolution A — Real city geography and a coherent transition index (analytics ladder: rung 1 → 2)

**What.** Two documented defects gate everything else: §7.4 shows the region/country
assignment is round-robin by array index, so Oslo lands in "North America" with
country "America" — every regional rollup is actively misleading — and §7.6 shows the
headline `transitionScore` is statistically independent of the adoption metrics it
supposedly summarises (a city can score 25 with 80% EV share). Evolution A fixes
geography with a real city→country→region lookup table, then makes `transitionScore` a
derived composite of the fields already on the row (weighted EV share, transit share,
cycling km per capita, LEZ/congestion-charge flags), with `transitionLevel` bucketed
from the score instead of drawn separately. The advertised but absent NPV methodology
(`MobilityNPV` with WHO health co-benefits per §5) gets its first implementation: a
modal-shift calculator computing GHG reduction as
`shift × (ICE_factor − EV_factor) × VKT` using the refdata emission-factor layer.

**How.** (1) Static `CITY_GEO` table (60 rows, real countries) replacing
`region.split(' ').pop()`. (2) A small backend route `POST /api/v1/urban-mobility/npv`
(module is Tier B, EP-DM4) implementing the §5 formula with cited WHO/BNEF cost
constants. (3) Delete the scatter of two independent PRNG fields or derive one from
the other, per §7.5's artefact warning.

**Prerequisites.** Acknowledge the geography bug and score-incoherence as fabrication-
adjacent defects; emission-factor refdata keys for transport modes. **Acceptance:**
Oslo aggregates under Europe/Norway; sorting cities by transitionScore and by EV share
produces visibly correlated rankings; the NPV endpoint reproduces a hand-checked
worked example.

### 9.2 Evolution B — Transition-plan copilot for city transport teams (LLM tier 1)

**What.** The module's stated output is a C40/SLOCAT-aligned urban mobility transition
plan. Evolution B adds a copilot that drafts that plan from the selected city's
profile: it reads the current page state (EV gap vs target from the existing EV Gap
tab, LEZ/congestion status, transit share) plus the Atlas record, and produces a
structured plan narrative — where the city stands, which levers close the gap, what
the C40 Electric Bus Declaration and SLOCAT reporting expect — clearly labelling all
figures as demo data until Evolution A replaces the synthetic profiles.

**How.** Tier-1 stack per the roadmap: embed this Atlas page into `llm_corpus_chunks`;
`POST /api/v1/copilot/urban-mobility-transition/ask`; per-module system prompt carries
§7.6's limitations verbatim so the copilot's honesty is structural, not optional. Once
Evolution A's `POST /npv` exists, upgrade to tier 2 with that single tool so "what's
the NPV of shifting 10% of car trips to transit in Jakarta?" is answered by a tool
call, not generation.

**Prerequisites.** pgvector corpus; the geography fix, so the copilot never describes
Oslo as North American. **Acceptance:** every plan section cites either page state or
a tool response; asked for a city's actual (real-world) EV share, the copilot
distinguishes the module's synthetic figure from real published data and refuses to
conflate them.
