## 9 · Future Evolution

### 9.1 Evolution A — Real patent counts from public IP databases (analytics ladder: rung 1 → 2)

**What.** §7 flags a partial mismatch: the guide's
`InnovationIndex = Σ Citations × TRL_weight × MarketSize` and the diffusion metric
are unimplemented — the coded `innovScore` is a different fixed blend (citation index,
forward citations, R&D intensity, collaboration) — and all 60 entities' patent
counts, citations, and R&D figures are `sr()`-seeded, with the WIPO/EPO sources named
but not connected. The realistic domain growth-rate table is the one structured
asset. Evolution A grounds the counts: the EPO's Open Patent Services API and the
Google Patents public dataset expose real filing/grant counts and citations, and the
CPC Y02 classification scheme (climate-change mitigation technologies) maps directly
onto the module's 9 `TECH_DOMAINS` — so entity-level patent portfolios and domain
time series become queryable facts rather than seeds.

**How.** (1) An ingest of Y02-classified counts by assignee, CPC subclass, and year
into `ref_climate_patents(assignee, cpc_domain, year, filings, grants, citations)` —
batched offline, not per-request (patent APIs are rate-limited). (2) The `innovScore`
recomputed over real inputs, with the formula reconciled to the guide (implement the
TRL/market-size weighting with cited weights, or rewrite the guide to the coded
blend — one canonical formula). (3) R&D intensity from disclosed financials where
available via the entity spine, else honest-null.

**Prerequisites.** EPO OPS registration (free tier) or Google Patents BigQuery
access; assignee-name → entity resolution (GLEIF spine plus manual mapping for the
top assignees). **Acceptance:** an entity's patent count reconciles to the public
database query; domain trends reproduce published EPO climate-patent statistics
directionally; zero seeded patent fields remain.

### 9.2 Evolution B — IP due-diligence copilot (LLM tier 1 → 2)

**What.** A copilot for cleantech investors: "who leads solid-state battery patents
and how concentrated is the field?" (real counts and shares post-Evolution A),
"how has the hydrogen domain's grant rate trended vs deployment?" (the diffusion
question the guide promises, answerable once both series exist), "summarise entity
X's climate patent posture for a DD memo" — aggregation narration plus structured
drafting, with every count citing the patent-table query that produced it.

**How.** Tier 1: atlas record + patent reference table as corpus/context; DD-memo
drafts through the report layer with the validator on all counts and shares. Tier 2:
parameterised patent-table queries as tools (filter by domain/assignee/year). The
copilot must state the classification basis (CPC Y02) and its known limitation —
classification lags and coverage vary by office — rather than presenting counts as
complete.

**Prerequisites (hard).** Evolution A first: an IP DD memo over seeded patent counts
would be fabricated diligence. **Acceptance:** every count in an answer reproduces
via the stated query; the copilot discloses the Y02 basis when asked about coverage;
valuation-of-IP questions are declined as outside the module's computed surface.
