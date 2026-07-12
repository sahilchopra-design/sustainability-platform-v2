## 9 · Future Evolution

### 9.1 Evolution A — Real blended-finance and CSA scoring engine (analytics ladder: rung 1 → 2)

**What.** Per §7 this is a navigation/aggregation hub, not the finance engine its title
implies: despite the guide's `BlendedIRR = Concessional_IRR × w_conc + Commercial_IRR ×
w_comm` and `FoodSys_score = Σ w_j × CSA_pillar_j`, **neither formula exists** — the module
shows hard-coded executive KPIs (regenOps 80, avgSoilSeq 1.82, etc.), PRNG-generated
holdings/engagements/alerts, and a "composite" `riskScore` that is its own random draw
rather than a weighted mean of the four sub-risks (§7.5). Evolution A builds the missing
quantitative core: a blended-finance waterfall engine (first-loss tranche sizing,
concessional/commercial IRR blend, cash-flow waterfall) and a CGIAR three-pillar CSA score
(`Σ w_j × pillar_j` over productivity/resilience/mitigation), plus a genuine composite risk
= weighted mean of water/biodiv/deforest/soil.

**How.** `POST /api/v1/agri-finance/blended-irr` (tranche structure → IRR by tranche +
blended return) and `/csa-score` (pillar inputs → composite), backed by an `agri_holdings`
table replacing the synthetic 30-holding array; the executive KPIs become roll-ups over that
table instead of literals. Rung 2 via CMIP6/SSP yield-overlay scenarios on the loan book, as
the guide's climate-risk tab promises.

**Prerequisites (hard).** Purge the `sr()` draws and hard-coded KPI literals per the no-
fabricated-random guardrail; fix the misleading "composite" `riskScore` label. The real
blended-finance logic already exists in sibling modules (blended-finance-structurer,
additionality-assessment) — reuse rather than re-derive. **Acceptance:** blended IRR responds
to first-loss tranche size; the composite risk equals the documented weighted mean of its
sub-risks; executive KPIs reconcile to the holdings table.

### 9.2 Evolution B — Agri-desk orchestrator across the five sub-modules (LLM tier 3)

**What.** This hub sits above five sub-modules (AT1 Regenerative Ag, AT2 Food Supply Chain
Emissions, AT3 Water Risk, AT4 Land Use & Carbon, AT5 Agri Biodiversity) — the natural home
for a desk-orchestrator. "Assess AgriCo Holdings" would route: pull the holding's crop/water/
deforestation exposure, call AT5's biodiversity site-assessment, AT2's Scope 3 commodity
emissions, and AT4's carbon-stock, then synthesise a board-ready agri-finance memo via the
report layer — replacing today's static Board Report tab (whose section-ready flags are
themselves `sr()` draws).

**How.** Tier-3 routing per the roadmap: `module_tags.json` + the Atlas interconnection graph
identify the five sub-modules as the agri cluster; the orchestrator tool-calls each sub-
module's endpoints (post their Evolution-A verticals) and composes output into the audience-
selected board sections (Board/IC/ESG/Operations). No-fabrication validator enforces that
every synthesised figure traces to a sub-module tool call.

**Prerequisites (hard).** The five sub-modules need real backend verticals first (several,
including AT5, are currently synthetic); this hub's own Evolution A; the desk-orchestrator
framework (Phase 2–3). **Acceptance:** a memo for a named holding cites which sub-module
produced each figure; removing a sub-module's data yields an honest gap in the memo, not a
fabricated number.
