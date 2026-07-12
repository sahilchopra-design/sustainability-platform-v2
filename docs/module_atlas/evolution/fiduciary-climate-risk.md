## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised fiduciary risk ratio and remove the noise term (analytics ladder: rung 1 → 2)

**What.** §7 documents that the guide's two headline outputs — `FiduciaryRisk = PortfolioClimateRisk/BenchmarkClimateRisk × (1 + LitigationRisk + RegRisk)` and the ITR-based portfolio temperature score — are entirely absent; the code builds an 8-factor additive scorecard over 55 `sr()`-seeded investors, and §7.5 flags a ±10-point random noise term inside the fiduciary score that "makes the headline score partly a coin-flip." Evolution A does two things: excise the noise term (a documented fabrication defect), and implement the risk ratio for real — litigation and regulatory risk components derived from jurisdiction (the module already carries `COUNTRIES` and the DoL/ClientEarth/McVeigh case-law context), applied to a user-supplied portfolio climate-risk metric vs benchmark.

**How.** (1) Delete the noise addend; keep the 8-factor scorecard, which is a defensible governance rubric once its inputs are real. (2) Build a jurisdiction table (litigation precedent count, regulatory stringency by country — curatable from the module's own case-law/regulatory content) feeding `LitigationRisk`/`RegRisk` multipliers. (3) Accept a portfolio WACI or climate-VaR from the platform's portfolio modules as the numerator, benchmark from stored sector references.

**Prerequisites.** The seeded 55-investor panel replaced by user-entered or imported investor profiles (all attributes are §7-flagged synthetic); the ITR score deferred until a real ITR source exists — say so on-page rather than fake it. **Acceptance:** identical inputs always produce identical fiduciary scores (noise gone); the risk ratio reproduces the §5 formula from inspectable jurisdiction parameters.

### 9.2 Evolution B — Trustee duty-of-care copilot grounded in case law (LLM tier 1)

**What.** The module's strongest real asset is qualitative: PRI *Fiduciary Duty in the 21st Century*, UNEP FI legal frameworks, DoL 2022 ERISA rule, and named cases (McVeigh v REST, ClientEarth v Shell). Evolution B is a tier-1 copilot for trustees and counsel: "as a UK pension trustee, what climate process do I need documented to defend a breach claim?" answered from the embedded atlas corpus and the module's jurisdiction/case-law content, with the scorecard factors used as a documented-process checklist.

**How.** RAG per the roadmap Tier-1 pattern — the corpus is this atlas record plus the module's regulatory reference texts (already in §5's reference list). Guardrails matter unusually here: the system prompt must require jurisdiction qualification, cite the specific case or rule behind every claim, and append a not-legal-advice disclaimer; questions asking for a litigation-probability number are refused because §7 shows the module computes none (litigationRisk is a seeded display field).

**Prerequisites.** Corpus embedding; case-law content structured with jurisdiction/date metadata for citation. **Acceptance:** bench_llm probes confirm every legal assertion carries a source citation from the corpus, and a request to "estimate our chance of being sued" yields a refusal with an explanation of what the module does compute.
