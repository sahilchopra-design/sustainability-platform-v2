## 9 · Future Evolution

### 9.1 Evolution A — Pro-rated GAR, JRC depth-damage curves, and probability-weighted ECL (analytics ladder: rung 2 → 3)

**What.** The ECL→GAR→Pillar 3 orchestrator (E1) — a three-stage bank compliance chain: climate-
conditioned IFRS 9 ECL, EU Taxonomy Green Asset Ratio classification, and an auto-populated CRR Art.
449a / EBA ITS 2022/01 disclosure pack. The AR6 flood amplifiers are genuinely IPCC-sourced. §7.5
names the deepening targets: GAR uses **whole-EAD attribution** for aligned exposures rather than
pro-rating by `taxonomy_aligned_pct` (real Art. 8 apportions by counterparty turnover/CapEx KPI); the
LGD flood component uses a log damage-scale, not the **JRC depth-damage curves** the P3-C narrative
claims (intent, not implementation); ECL is **single-period, one-scenario** with no discounting or
staging (that lives in the sibling `ecl_climate`); and the PD multipliers/CCF uplifts/flood haircuts
are synthetic calibrations. Evolution A adds KPI-pro-rated GAR, real JRC depth-damage curves, and
probability-weighting across scenarios.

**How.** Stage 2 numerator pro-rates each aligned exposure by its `taxonomy_aligned_pct` per the
Disclosures DA; the LGD flood component uses ingested JRC depth-damage curves keyed to hazard depth
(the platform's physical-risk digital twin has flood grids); Stage 1 runs probability-weighted across
scenarios like `ecl_climate` rather than one scenario per call. Rung 3: calibrate the PD multipliers
and CCF uplifts against observed climate-credit data; extend BTAR to the ITS non-NFRD counterparty
numerator.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /ecl-only`, `/gar-only`,
`/orchestrate` all **skipped** (need input payloads to trace); the AR6 amplifiers stay (real), the
synthetic PD/CCF calibrations get documented. **Acceptance:** the §7.4 SEVERE worked example (€2.922M
climate ECL, +265% uplift, LGD 65.02%) reproduces at legacy calibrations; GAR pro-rates by aligned %
(a 50%-aligned exposure contributes half its EAD, not all); the LGD flood component derives from a
JRC curve; the endpoints pass the harness.

### 9.2 Evolution B — Integrated ECL-GAR-Pillar3 disclosure copilot (LLM tier 2 → 3)

**What.** This orchestrator already chains three domains — its LLM evolution is a tier-3-flavoured
copilot that runs the full compliance chain: "assess our portfolio's climate ECL, GAR and generate
the Pillar 3 pack" (`/orchestrate` → ECL uplift, GAR/BTAR, 11 KPI rows, 4 narrative sections,
assurance-readiness score with gaps), or the `/ecl-only` and `/gar-only` subsets — narrating real
outputs and the assurance-readiness deductions (which directly answer "what's blocking our sign-off?").

**How.** Tool schemas over the 3 POST + 2 GET operations; the `ref/kpis` and `ref/nace-eligible`
endpoints ground "which NACE codes are GAR-eligible for CCM?" questions. The no-fabrication validator
checks every ECL, GAR %, uplift and KPI against tool output; the copilot surfaces the assurance-
readiness gaps (e.g. −15 if <50% of exposures taxonomy-assessed) as an actionable checklist. Because
it orchestrates ECL + Taxonomy + Pillar 3, it composes with the sibling `ecl_climate`, `eu_taxonomy_gar`
and `eba_pillar3` domains in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and pro-rated GAR (so narrated ratios are ITS-faithful);
Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an
orchestrator tool call; the GAR and ECL uplift match `/orchestrate`; the assurance-readiness gaps a
copilot names match the engine's deductions; the P3-D governance boilerplate is flagged as fixed
narrative, not entity-specific.
