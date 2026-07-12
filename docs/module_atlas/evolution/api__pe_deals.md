## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked ESG screening and populated pipeline (analytics ladder: rung 2 → 3)

**What.** A PE/VC deal-pipeline and ESG-screening engine that scores each deal across five
ESG dimensions (environmental, social, governance, transition_risk, physical_risk — four
sub-dimensions each), detects hard/soft red flags, contextualises with a sector risk heatmap
(`SECTOR_ESG_RISK`), and issues proceed/conditions/reject. The composite is an equal-weighted
mean of dimension means, defaulting sub-dimensions to a neutral 3.0 when unassessed. The
scoring is caller-asserted ratings, the sector heatmap is static, and §4.2 shows the persisted
pipeline (`pe_deals`, `pe_sector_risk_heatmap`) is largely **db-empty** with `/db/deals/{id}`
tracing **failed**. Evolution A grounds the screen and activates persistence.

**How.** (1) Pre-populate ESG sub-dimension ratings from the platform's own signals where the
target is identifiable — GLEIF/entity resolution → GDELT controversy score, physical-risk grid
exposure, sector transition risk — so screening isn't purely manual, reporting an
`evidence_tier` per dimension. (2) Replace the equal-weight composite with sector-materiality
weighting (the SASB/heatmap data supports it) so governance vs physical risk matter
differently by sector. (3) Fix the DB persistence path so `/db/deals/{id}` returns `passed`
and the pipeline populates. (4) Bench-pin the composite and red-flag logic.

**Prerequisites.** Entity-resolution linkage for auto-signals; `pe_deals` write path repaired
(D1); sector-materiality weights. **Acceptance:** identifiable targets get auto-populated ESG
signals with an evidence tier; the composite is sector-weighted; `/db/deals/{id}` returns
`passed`; bench pin reproduces the composite and risk band.

### 9.2 Evolution B — Deal-screening copilot for investment teams (LLM tier 2)

**What.** A copilot that screens an inbound deal — "score this target, flag red flags, and
tell me if it's a proceed" (calling `/screen` and citing the five-dimension breakdown and
sector context), compares deals via `/compare`, and summarises the pipeline via
`/pipeline-summary` — each figure tool-sourced.

**How.** Multiple POST endpoints (`/screen`, `/compare`, `/pipeline-summary`,
`/db/screen-and-persist`) plus `/sub-dimensions` and `/sector-heatmap` reference data. The
five-dimension decomposition lets the copilot explain *why* a deal is HIGH risk and which
sub-dimension drives it; the red-flag list drives a diligence checklist. Stage updates
(`PATCH /db/deals/{id}/stage`) are the gated write action. Cross-links to `pe_portfolio` for
post-acquisition value creation. Strong node for a PE desk.

**Prerequisites.** Evolution A's persistence fix for pipeline-level answers; RBAC on the
mutating stage/persist endpoints. **Acceptance:** every dimension score, red flag, and
recommendation traces to a tool response; the copilot discloses when a rating is
neutral-defaulted (3.0) vs assessed; stage changes require confirmation and log to audit; it
refuses to assert investment merit beyond the ESG screen the engine computes.
