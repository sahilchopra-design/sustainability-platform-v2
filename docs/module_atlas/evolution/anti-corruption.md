## 9 · Future Evolution

### 9.1 Evolution A — Real CRI composite from TI CPI and enforcement data (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's composite
`CRI = 0.40×(100−CPI) + 0.30×Controversy + 0.20×Enforcement + 0.10×ABMS_maturity` **does not
exist**: company `corruptionRisk` is a direct PRNG draw, the country `cpi` field is random (not
Transparency International data), there is no controversy feed, no ISO 37001 maturity scoring, and
enforcement fines are never normalised by revenue. The module's one genuinely valuable asset is a
30-case enforcement table of **real, verifiable FCPA/UKBA settlements** (Airbus $4,000M, BNP
Paribas $8,900M, Odebrecht $3,500M — matching public DOJ/SEC/SFO records). Evolution A builds the
guide's real CRI: ingest actual TI CPI and World Bank WGI/CPIA scores by country, normalise
enforcement fines by revenue, and compute the four-component weighted composite with a genuine ISO
37001 ABMS maturity input.

**How.** A `corruption_risk_engine` with `POST /api/v1/anti-corruption/cri` (company + country
exposure + ABMS self-assessment → CRI, component decomposition) and `GET /ref/cpi` +
`/ref/enforcement` (the real enforcement table promoted to a cited reference dataset); TI CPI and
WGI seeded from their public annual releases. Rung 3: calibrate the enforcement-score normalisation
against the DOJ/SEC settlement distribution the table already contains.

**Prerequisites (hard).** Purge the `sr()` company/country draws per the no-fabricated-random
guardrail; fix the small-index seed collisions (GlobalBank's fields all reuse `sr(0)`, §7.4);
source real CPI values (the current 10–65 range is plausible but fabricated). **Acceptance:** a
company's CRI recomputes from its country CPI, controversy count, revenue-normalised fines and ABMS
maturity (not a single draw); the enforcement table's real fines feed the enforcement component;
raising a country's CPI lowers its contribution to CRI.

### 9.2 Evolution B — Bribery-risk screening copilot over the enforcement corpus (LLM tier 1 → 2)

**What.** A copilot answering "which holdings have the highest corruption risk and why?", "what
happened in the Airbus FCPA case?" (the real enforcement table is ideal RAG grounding), and "how
does entering this high-risk market change portfolio CRI?" — grounded in the page's screening tables
and the enforcement corpus. Since company/country scores are synthetic today, the tier-1 copilot
must state that CRI figures are demo draws and only the enforcement cases are real.

**How.** Tier-1 roadmap pattern: the 30-case enforcement table (real, hand-curated) plus §7.2
parameters and §7.6 framework alignment (TI CPI, FCPA/UKBA, ISO 37001, UNGC Principle 10) embedded
as the module corpus; page state (filtered companies, selected country) as context; served via
`POST /api/v1/copilot/anti-corruption/ask` with the standard refusal path. After Evolution A,
graduates to tier 2 by tool-calling `POST /cri` for real scenario analysis ("model CRI impact of a
Nigeria entry"), with the no-fabrication validator checking every score and fine.

**Prerequisites.** Atlas + enforcement corpus embedded (roadmap D3); grounding carries the §7
mismatch note so the copilot never presents random `corruptionRisk` as a computed CRI.
**Acceptance:** every enforcement fact cited matches the real case table; every CRI figure is
flagged synthetic until Evolution A; a request for a revenue-normalised enforcement score before
Evolution A returns a refusal naming the absent composite.
