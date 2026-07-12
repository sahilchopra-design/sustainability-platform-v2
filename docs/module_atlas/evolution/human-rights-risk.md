## 9 · Future Evolution

### 9.1 Evolution A — Implement the SHRRS the guide promises, on real benchmark data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is severe: all 60 companies carry **real corporate names with fabricated scores** — `riskScore`, `ungpScore` and `dueDiligence` are three independent `sr()` draws, salient issues are coin-flips (`sr(i*100+j*7)>0.5`), and the risk-vs-UNGP scatter is "structurally a random cloud". The promised `SHRRS = Σ P(harm) × Severity × Breadth × Remediability` does not exist. Evolution A builds the §8.3 specification as the module's first backend vertical: severity as the UNGP scale/scope/irremediability composite, `P(harm)` as a logistic over geography risk, sector risk, audit coverage and grievance rate, breadth as normalised people-at-risk.

**How.** (1) Ingest the public benchmark data §8.4 names: KnowTheChain and WBA CHRB scores (published CSVs), US DoL child/forced-labour goods list, ITUC Global Rights Index — replacing every per-company random draw with benchmark-anchored inputs, honest nulls for uncovered issuers. (2) Engine route `POST /human-rights-risk/shrrs` returning per-company issue-level SHRRS with the P×S×B decomposition exposed. (3) Coupling restored: UNGP maturity enters `P(harm)` via the audit-coverage term, so the scatter gains the real risk↔governance relationship. (4) Validation per §8.5: rank correlation against published CHRB ordering.

**Prerequisites.** The real-names-fake-scores combination is a reputational defect and must be purged first (either benchmark scores or anonymised issuers — never both real names and `sr()` values); benchmark ingestion path. **Acceptance:** zero `sr()` calls in scoring; a named company's displayed rank is reproducible from cited benchmark vintages.

### 9.2 Evolution B — CS3D salience copilot with strict provenance (LLM tier 1)

**What.** A copilot answering "why is this issuer's top salient issue forced labour?", "what does CS3D Article 8 require when a salient score exceeds 70?", and "how is severity composed under UNGP Principle 14?" — grounded in this Atlas page's §5/§8 methodology and, post-Evolution-A, each company's SHRRS decomposition. Before Evolution A ships, its binding duty is disclosure: any question about a specific company's score must be answered with the §7.6 caveat that scores are synthetic demo values attached to real names.

**How.** Tier 1 RAG: atlas record into `llm_corpus_chunks`; the filtered-table state (`stats`, sector filter) passes as context. Post-Evolution-A, tier 2: "recompute Nestlé's SHRRS assuming audit coverage rises to 80%" executes against the new endpoint, with the answer showing the logistic-term movement. Guardrail: the copilot never generates a company score itself — the combination of real names and LLM-generated numbers would compound the exact fabrication §7.6 warns about; the no-fabrication validator applies to company-specific numerics with zero tolerance.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for any company-specific quantitative answer. **Acceptance:** pre-Evolution-A, 100% of company-score questions carry the synthetic-data disclosure; post, every SHRRS figure matches a logged tool call and cites its benchmark vintage.
