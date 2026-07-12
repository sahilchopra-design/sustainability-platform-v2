## 9 · Future Evolution

### 9.1 Evolution A — Persist real SKUs and wire the page to its own engine (analytics ladder: rung 1 → 2)

**What.** The module is a genuine tier-A vertical — `DigitalProductPassportEngine` computes ESPR applicability, 25-field DPP completeness, ISO 14067 lifecycle GHG, a 5-dimension circularity index, EU Battery Regulation 2023/1542 checks, and per-country EPR levies across 8 endpoints — but the page ignores it: every UI product is an `sr()`-seeded fabrication (`espr = sr(i*17)*55+35`) and the engine has no persistence (source tables: none). Evolution A replaces the seeded `PRODUCTS` array with a real product registry and turns the sliders into engine-backed scenario sweeps.

**How.** (1) New tables `dpp_products` and `dpp_assessments` (Alembic migration) storing BOM/LCA inputs and `run_full_assessment` outputs per SKU. (2) Page loads `GET .../products` and renders engine-computed `dpp_readiness_score`, not `sr()` derivations. (3) Scenario layer: `POST /full-assessment` gains a `scenario` block (electricity-price, recycled-content, mandate-year shifts) so the existing manufacturing/recycling sliders re-run the engine instead of applying in-page multipliers like `baseCarbon × (1 − mfgSlider/100 × 0.55)`. (4) Fix the lineage-traced failure: `POST /circularity-assessment` returned `failed` in the harness sweep — root-cause before anything builds on it.

**Prerequisites.** The failed circularity endpoint fixed; seed 50–100 realistic SKUs (EPD/PEF public datasets) so the registry isn't empty on day one. **Acceptance:** zero `sr()` calls remain in the page's data path; a re-run lineage sweep shows all 5 POST endpoints `passed` with `dpp_products` as a source table.

### 9.2 Evolution B — Compliance analyst that runs the assessment stack per SKU (LLM tier 2)

**What.** A tool-calling analyst on the DPP page that answers "is this power-tool SKU ESPR-mandatory in 2027, what's missing, and what would the EPR levy be if we sell in 20 member states?" by chaining the module's real endpoints — `POST /espr-compliance` → `/dpp-schema` → `/epr-levy` → `/battery-regulation` when chemistry is present — and narrating only the returned payloads (compliance_gaps, missing_fields, per_country_levy_eur).

**How.** Tool schemas generated from the module's 8 OpenAPI operations; the reference GETs (`/ref/product-categories`, `/ref/epr-rates`, `/ref/battery-targets` — all lineage-`passed`) serve as the copilot's grounding vocabulary so it never invents a category or rate. System prompt assembled from this Atlas record (§2.3 engine docstrings are unusually complete and make good tool descriptions). The no-fabrication validator checks every levy figure and mandate year against tool outputs. Mutating persistence calls (Evolution A's product writes) stay behind explicit user confirmation per the tier-2 RBAC convention.

**Prerequisites.** Evolution A's endpoint fix (a copilot cannot chain through a 500); prompt-cache the stable ref-data responses. **Acceptance:** for a golden SKU fixture, the analyst's stated `dpp_mandatory_year` and total levy match a direct `run_full_assessment` call exactly; asking for a metric the engine doesn't compute (e.g. repair-cost forecasting) triggers the refusal path.
