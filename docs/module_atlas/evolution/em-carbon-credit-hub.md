## 9 · Future Evolution

### 9.1 Evolution A — From authored tracker to refreshed registry-backed dataset (analytics ladder: rung 1 → 2)

**What.** §7 classifies this correctly: a structured Article 6 intelligence tracker whose substantive tables (25 bilateral ITMO deals with real buyer/seller pairs and verifiers, 12-type ITMO pricing, 15-country CA status, JCM projects, MRV challenges) are **authored realistic data**, with honest aggregations on top (volume-weighted price, CA coverage %). The seeded parts are the NDC gap figures (`uncond = 15 + sr·20`), the deal-flow time series, and the political-risk-premium slider output. Evolution A moves the tables to the DB with source-dated refresh, and replaces the seeded derivations.

**How.** (1) Tables `em_itmo_deals`, `em_ca_status`, `em_itmo_pricing` (Alembic migration), each row carrying `source` and `as_of_date` — the authored data is good enough to seed them, but becomes maintainable and citable. Refresh path: UNEP-CCC's Article 6 Pipeline database (public CSV) as an ingester, reconciling new bilateral agreements quarterly. (2) NDC gaps from the actual NDC registry figures (Climate Watch API, free) instead of `sr()` ranges around plausible values. (3) The political-risk premium becomes a documented function of the CA-status fields already in the table (framework yes/partial/no, ETS/tax presence) rather than a slider-plus-noise, giving the page its first honest what-if (rung 2): "premium if country X adopts a CA framework."

**Prerequisites.** Source-tier decision (UNEP pipeline vs UNFCCC CDM/6.4 registry coverage differs); the seeded `dealFlowArea` chart deleted or rebuilt from deal `startYear` fields it already has. **Acceptance:** every table row displays a source and date; total pipeline volume recomputes from DB rows; zero `sr()` outside chart cosmetics.

### 9.2 Evolution B — Article 6 deal-desk copilot (LLM tier 2)

**What.** A tool-calling copilot for the questions EM carbon desks actually field: "which host countries can deliver corresponding-adjusted cookstove ITMOs above 5 Mt with Gold Standard verification, and what's the price range?" It composes filtered queries over Evolution A's deal/pricing/CA tables, cross-references CA status with the buyer's requirements, and drafts a sourcing memo — each deal cited with its registry source and as-of date, price ranges quoted from the pricing table's min/max rather than invented.

**How.** Tools: `query_deals`, `get_ca_status(country)`, `get_itmo_pricing(project_type)`, `get_ndc_gap(country)` from the new backend. Grounding corpus = this Atlas record's §7 (the aggregation definitions and mechanism taxonomy: Art6.2/6.4/JCM/bilateral) plus the MRV_CHALLENGES table for integrity caveats — the copilot attaches the relevant MRV risk to every recommended host country. The validator checks volumes/prices against tool outputs; staleness is disclosed ("CA status as of 2026-Q1").

**Prerequisites (hard).** Evolution A — recommending sourcing strategies from authored 2024-era tables presented as current would mislead a real desk; the as-of-date plumbing is what makes answers defensible. **Acceptance:** a golden sourcing query returns only deals present in the DB with correct aggregates; asking about a country absent from `em_ca_status` yields "not tracked," not an inferred CA position.
