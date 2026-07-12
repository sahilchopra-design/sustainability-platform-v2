## 9 · Future Evolution

### 9.1 Evolution A — Salience-weighted residual risk with firm-level DD data (analytics ladder: rung 2 → 3)

**What.** The page's country×issue risk tables (BD forced-labour 0.85, DE 0.08…) are curated real data and the weighted 15-item UNGP checklist (104 points) is a defensible rubric — but §7.5 documents two gaps: per-holding variation is a deterministic `(h % N)` index jitter, not firm data (two same-country/same-sector firms differ only by portfolio position), and the risk form is an average × sector multiplier, not the guide's `Severity × Likelihood × Vulnerability` product. Evolution A implements the §8 spec: severity weights (scale/scope/irremediability) multiplied in per issue, firm-level DD maturity from actual assessment data, and `ResidualRisk = CompanyHRRisk × (1 − DD_maturity)`.

**How.** (1) A backend vertical with tables for firm HR assessments (checklist item × holding, sourced from user input or CHRB/KnowTheChain public benchmark scores for covered issuers) replacing the `(h%N)` jitter and the `85 − hrRiskScore` UNGP fallback. (2) Country factors upgraded from the hard-coded table to ingested Global Slavery Index / ITUC Rights Index vintages with version stamps. (3) The engagement-priority ranking becomes `ResidualRisk × weight`, so strong DD demonstrably reduces priority — the behaviour CSDDD Article 10 rewards. (4) Calibration check: score ordering reconciled against published CHRB ranks per §8.5.

**Prerequisites.** CHRB/KnowTheChain benchmark ingestion (public CSVs); an assessment-input UI or import path, since firm DD data cannot be synthesized honestly. **Acceptance:** two same-country/sector holdings with different DD records score differently for a documented reason; the jitter terms are gone.

### 9.2 Evolution B — CSDDD readiness copilot with article-level traceability (LLM tier 1 → 2)

**What.** A copilot for compliance officers working the 7 mapped CSDDD articles, 5 Modern Slavery Act regimes and the 13-event regulatory timeline this page already curates: "does our Bangladesh exposure trigger UFLPA import risk?", "which checklist gaps cost us the most UNGP points?", "what does Article 8 require by 2027?" Answers ground in the page's regulatory tables and each holding's computed scores.

**How.** Tier 1: atlas record (the §7.2 issue/country tables and §7.6 framework alignment are strong grounding corpus) into `llm_corpus_chunks`; the scored-holdings state passes as context so "our worst holding" resolves to the actual top of the engagement-priority list. Tier 2 adds tool calls to the Evolution A residual-risk endpoint for what-ifs ("if we complete supply-chain audits (+10 weight), what happens to residual risk?"). Regulatory answers must cite the specific article/act row from the page's `CSDDD_HR_ARTICLES`/`MODERN_SLAVERY_REQS` datasets — no free-recall regulation, since thresholds (UK £36M, AU $100M) are exactly the kind of figure LLMs misremember.

**Prerequisites.** Copilot infrastructure (Phase 1); tier 2 gated on Evolution A. **Acceptance:** every regulatory threshold quoted matches the page's curated rows; checklist what-ifs recompute via tool call, with the 104-point weighting arithmetic shown.
