## 9 · Future Evolution

### 9.1 Evolution A — Resolution register with computed alignment and director scoring (analytics ladder: pre-rung-1 static → 2)

**What.** §7 documents a static dashboard: six tabs of hand-curated tables, no runtime computation at all — headline KPIs ("50 climate resolutions", "36% avg support") are string literals, `DIRECTOR_SCORES.score` is a pre-baked value that doesn't equal any formula of its own `expertise`/`training`/`committee` inputs, and the guide's `Alignment = votes_with_climate_policy / total_climate_votes` is never divided. The content is realistic (Shell 80→77, TotalEnergies 89→75 Say-on-Climate), so the evolution preserves it as seed data while making everything derived. Evolution A builds a persisted resolution/vote register with the two guide formulas actually implemented.

**How.** (1) Tables `proxy_resolutions` (company, meeting date, topic, mgmt recommendation, shareholder support %) and `proxy_votes` (fund's own cast votes) with the current hand-curated rows as the initial seed, ingested with source dates. (2) `api/v1/routes/proxy_voting.py`: `GET /alignment` computing the alignment ratio from vote records per framework policy; `GET /director-scores` computing `w₁·expertise + w₂·training + w₃·committee` with declared weights, replacing the inconsistent stored literal §7.4 exposes. (3) Headline KPIs become aggregations of the register (count, mean support, majority count), so adding a resolution updates every tab. Public data path: SEC N-PX filings (machine-readable fund voting records) as a genuinely free ingestion source for real vote data.

**Prerequisites.** Weight rubric for director scoring agreed and documented; N-PX ingest scoped (free, but parsing effort is real). **Acceptance:** deleting a resolution row changes the headline count; the IIGCC alignment figure recomputes from vote rows rather than echoing a stored 82.

### 9.2 Evolution B — Voting-season copilot for stewardship teams (LLM tier 1 → 2)

**What.** Proxy season is deadline-driven document work. The copilot supports it: "summarize this AGM's climate resolutions and how they map to our IIGCC-aligned policy", "draft a vote rationale for opposing the Woodside transition plan, citing its declining support trend (51→48)" — grounded in the register, the fund's policy text, and IIGCC/PRI voting-expectation documents already cited in §5.

**How.** Tier 1: RAG over the Atlas record plus policy/guidance texts; register rows injected as context for company-specific questions. Tier 2 after Evolution A: "how would our alignment score change if we support all Scope-3 target resolutions this season?" runs as a what-if tool call against `GET /alignment` with a hypothetical vote vector. Vote rationales are drafts — the copilot never records a vote; any write path is out of scope until the register has RBAC-gated mutation with explicit confirmation. All support percentages must come from register rows, not model memory (training-data vote figures will be stale or wrong).

**Prerequisites.** Evolution A register; policy documents uploaded per org. **Acceptance:** a drafted rationale cites the specific resolution row and policy clause, and the copilot refuses to state a vote outcome for a company not in the register.
