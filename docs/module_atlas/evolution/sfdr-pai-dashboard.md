## 9 · Future Evolution

### 9.1 Evolution A — Engine-fed multi-fund dashboard with reconciled coverage (analytics ladder: rung 1 → 2)

**What.** The page carries the platform's best SFDR taxonomy — the complete, correctly asset-class-differentiated 18-indicator Annex I table — but its 8 funds and all 18×2 PAI values are `sr()`-synthetic, and §7.6 flags two structural defects: category averages pool incompatible units and asset classes (company/sovereign/real-estate all tagged "Climate"), and the per-indicator `covered` booleans are uncorrelated with the fund-selector's headline coverage %, so the page's two coverage figures can contradict each other. Evolution A drives the dashboard from the shared `sfdr_pai_engine` (the same 14 routes as `sfdr-pai`) computing over real fund holdings, making trend tracking and coverage single-sourced.

**How.** (1) Per selected fund, call `POST /calculate-all` against holdings in `portfolios_pg`; the headline coverage becomes the engine's own `data_quality_score` — one number, one source. (2) Replace `catGroups`' cross-unit averaging with unit-aware composites: within-category indicators normalised against their `POST /benchmark` peer ratio before averaging, or displayed as a small-multiples panel with no composite where units can't merge. (3) Year-on-year trends via `POST /compare-periods` with persisted reporting-period snapshots (new `pai_period_snapshots` table) replacing the independent `prev` draws. (4) "Material increase" flags derive from the engine's `pct_change`, parameterised by a user-set materiality threshold — the module's first genuine what-if lever.

**Prerequisites.** Seeded demo fund holdings (D0 credibility item); period snapshots require at least two stored reporting dates before trends are real. **Acceptance:** the two coverage figures are always equal because one is derived; a synthetic-data banner disappears only for engine-fed funds.

### 9.2 Evolution B — Material-increase explanation drafter (LLM tier 2)

**What.** SFDR requires managers to explain material year-on-year PAI deteriorations in the annual statement. That explanation is narrative synthesis over structured deltas — the ideal tier-2 slice. The copilot calls `POST /compare-periods`, identifies indicators breaching the materiality threshold, drills into which holdings drove the delta (`POST /calculate` per-holding decomposition), and drafts the Annex I "explanations" column text: "PAI-2 rose 14% driven by two additions in the utilities book; excluding them the footprint fell 3%."

**How.** Tool schemas from the shared OpenAPI spec; grounding corpus = this Atlas record plus `GET /ref/disclosure-requirements`. The drafting template forces the decomposition structure (delta → driver holdings → counterfactual) with every numeric validated against tool outputs. Drafts route to the report-studio layer; nothing is auto-published.

**Prerequisites (hard).** Evolution A's persisted period snapshots — explaining YoY movements between two independent random draws would be fabricating causality for noise. **Acceptance:** every driver holding named in an explanation appears in the per-holding decomposition; an indicator below the materiality threshold gets no explanation paragraph.
