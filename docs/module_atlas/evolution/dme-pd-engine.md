## 9 · Future Evolution

### 9.1 Evolution A — Server-side engine with genuinely calibrated β/α (analytics ladder: rung 2 → 3)

**What.** The §7 assessment: "the platform's most complete probability-of-default implementation" — four branches (Exponential, Merton DD, Sector Logit, Monte-Carlo GBM with 500 Box-Muller paths) blended 0.25/0.30/0.20/0.25 into a consensus with IFRS 9 staging, LGD-by-collateral, ECL, hazard-rate term structure, and a conviction metric. "The methodology is genuine; the 40-entity universe is synthetic." Worse, the page displays a "β Calibration R²" KPI with no calibration behind it, and the `SECTOR_CFG` logit coefficients are authored, not estimated. Evolution A moves the engine server-side and makes the calibration real.

**How.** (1) Port the four branches verbatim to `services/dme_pd_engine.py` + `api/v1/routes/dme_pd.py` (this is also where dme-entity's and dme-dashboard's §9 entries relocate their duplicated Merton code — one owner, three consumers). (2) Obligors from `portfolios_pg` holdings enriched via the company master; ESG/GHG inputs from real fields, honest-null where absent instead of `sr()` ranges. (3) Calibration: estimate the sector-logit β vector on a public default dataset joined to ESG scores (e.g. rating-transition histories), report actual R²/AUC in the response — the currently-decorative calibration KPI becomes load-bearing. (4) Pin all four branches plus the consensus into `bench_quant.py` with a worked obligor; the MC branch gets a fixed-seed reproducibility test.

**Prerequisites.** A defensible default-history dataset (licensing decision); demo portfolio at D0 scale. **Acceptance:** bench pins pass; the displayed R² equals the persisted calibration run's statistic; conviction metric flags the fixture obligor where branches genuinely disagree.

### 9.2 Evolution B — Credit-review analyst for staging and pricing decisions (LLM tier 2)

**What.** A tool-calling analyst for the workflow in the overview: "which obligors crossed the IFRS 9 staging threshold this quarter and why?" It queries Evolution A's endpoints, decomposes each uplift by branch (was it Merton leverage, the sector logit's GHG term, or transition velocity?), cites the conviction score when branches disagree, and drafts the enhanced-credit-review memo with the ECL delta — every figure from tool output.

**How.** Tool schemas from the new PD route's OpenAPI spec; grounding corpus = this Atlas record's §7.1 branch formulas so the analyst explains `pdC = σ(β0 + β1·ESG + β2·GHG/1000 + β3·revGrowth + β4)` exactly as implemented. What-ifs ("PD if ESG score improves 10 points") are re-computation calls, not in-context arithmetic. Staging *decisions* remain human: the analyst drafts, the credit officer confirms — consistent with ECB expectations that model outputs inform, not replace, judgment.

**Prerequisites (hard).** Evolution A — the current page would have the copilot defending PD uplifts derived from seeded balance sheets, and its uncalibrated "R²" would be quoted as model validation, a supervisory red flag. **Acceptance:** a golden obligor's narrated decomposition matches branch outputs to 5 decimal places; asking for a PD confidence interval (not computed) refuses rather than inventing one.
