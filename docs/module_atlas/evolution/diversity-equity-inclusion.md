## 9 · Future Evolution

### 9.1 Evolution A — Compute the pay gap instead of drawing it (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents both a fabrication and an internal inconsistency: all 80 companies' DEI metrics are `sr()`-seeded, and the displayed `genderPayGap` is drawn *independently* of the seeded `medianPayF`/`medianPayM` fields, so `(M−F)/M` does not reproduce the shown gap — proof no pay-distribution calculation exists. The guide's adjusted pay gap (role/seniority/tenure-controlled residual, required under ESRS S1-16 and EU Pay Transparency Directive 2023/970) is unimplemented. Evolution A builds the first backend vertical: real gap computation from workforce microdata.

**How.** (1) New tables `dei_workforce_records` (org-scoped: grade, tenure, gender, ethnicity, pay band) and `dei_survey_scores`; CSV/HRIS upload endpoint. (2) `services/dei_engine.py` computes the unadjusted median gap directly from the distribution (fixing the inconsistency by construction) and the adjusted gap via OLS on log-pay with role/seniority/tenure controls (statsmodels is already in the environment; model card per Atlas §8 convention — regulators will ask). (3) Benchmarking: replace seeded peer values with the UK Gender Pay Gap public dataset (gov.uk, ~10k employers, free) so percentile ranks are calibrated to observed reporting, earning rung 3. (4) Regulatory flags (Parker, Hampton-Alexander, EU PTD) become rule evaluations over computed metrics, not `sr()` threshold draws.

**Prerequisites.** Org-scoped RBAC on pay microdata (most sensitive table in the platform — D2 multi-tenancy hardening applies); demo dataset synthesized *transparently* (labeled synthetic, not seeded real-company names). **Acceptance:** unadjusted gap equals the median arithmetic on a fixture payroll exactly; adjusted gap reproduces a published statsmodels reference case; the 80 real-company seeded scorecard is removed.

### 9.2 Evolution B — ESRS S1 data-pack drafter with computed-figures-only contract (LLM tier 2)

**What.** The workflow the overview promises ("generate the ESRS S1 workforce diversity disclosure data pack") is an LLM-native deliverable: a tool-calling assistant that pulls Evolution A's computed metrics (S1-6 headcount characteristics, S1-16 remuneration ratios, adjusted/unadjusted gaps) and drafts the sustainability-statement narrative around them, mapping each figure to its ESRS datapoint ID from the refdata catalog already in the DB.

**How.** Tool surface = the new DEI engine's read endpoints plus `/api/v1/refdata` ESRS datapoint lookups; the draft renders through the report-studio layer per the roadmap's tier-3 output pattern. The no-fabrication validator is strict here: every percentage in the draft must match a tool output — a fabricated pay-gap figure in a regulated filing is the worst-case failure mode for this platform. Uncomputed datapoints render as explicit gaps ("S1-9 not yet collected"), mirroring the honest-nulls convention.

**Prerequisites (hard).** Evolution A shipped — there is currently nothing real to draft from, and the seeded scorecard attributes fabricated compliance statuses to named multinationals. **Acceptance:** a golden fixture produces a data pack where every numeric cross-checks against engine responses; missing survey data yields a disclosed gap, never an estimated Inclusion Index.
