## 9 · Future Evolution

### 9.1 Evolution A — Honest auto-calculation from real taxonomy evidence (analytics ladder: rung 2 → 3)

**What.** The `GARCalculator` core (CRR Art. 449a stock/flow/eligible ratios with
objective and KPI-type breakdowns) is sound deterministic work, but the §5 extract
exposes the weak link in `gar_db_service`: auto-calculation fabricates alignment via
`turnover_aligned = ead × aligned_pct if has_eligible_nace` and, worse,
`turnover_eligible = ead × aligned_pct × 1.5` — a synthetic 1.5× multiplier with no
regulatory basis. Evolution A makes `GET /auto-calculate/{entity_id}` derive alignment
from stored per-activity SC/DNSH/MSS flags instead of NACE-keyed heuristics.

**How.** (1) Rework `GARDBService` to aggregate `eu_taxonomy_activities` rows
per counterparty (the table already carries substantial-contribution and DNSH flags)
into eligible/aligned amounts, dropping the 1.5× shortcut; report `evidence_tier`
(activity-level vs NACE-inferred) per exposure, mirroring the GLEIF resolution-tier
pattern. (2) Reconcile against the sibling `eu_taxonomy_gar` Art. 8 engine so the two
GAR figures are explainably different (denominator scope), not accidentally different.
(3) Pin a reference bank book in bench_quant covering all four exclusion classes
(SOVEREIGN, CENTRAL_BANK, INTERBANK, HEDGING_DERIVATIVE).

**Prerequisites.** `eu_taxonomy_activities` populated for the demo counterparty set
(D0 seeding); a documented mapping note for NACE fallback cases. **Acceptance:** no
response contains the 1.5× eligible multiplier; every auto-calculated exposure carries
`evidence_tier`; bench pin reproduces GAR_stock to 6 decimals.

### 9.2 Evolution B — Counterparty screening analyst across score and ratio (LLM tier 2)

**What.** A tool-calling analyst on the GAR page that handles both engines
conversationally: "score this counterparty and tell me which component drags it below
BBB" (calling `POST /counterparty/score` and citing the 40/30/20/10 composite weights
from `/counterparty/weights`), and "what does our GAR become if these five exposures
reach full alignment" (re-calling `POST /calculate` with amended exposures).

**How.** The module's 13 endpoints are a rich, mostly read-only tool surface; the six
GET reference endpoints (`/objectives`, `/nace-mapping`, `/excluded-types`,
`/kpi-types`, `/alignment-classifications`, `/counterparty/rating-scale`) double as the
copilot's grounding corpus, so definitional questions never leave the module. Batch
what-ifs route through `POST /counterparty/batch`. The scorer's documented
band-boundary bug fix (§2.3 — float scores like 89.5 falling between integer bands) is
exactly the class of subtlety the copilot should surface when asked "why is 89.5 an A
not A+".

**Prerequisites.** Evolution A first for any question touching `/auto-calculate` —
narrating the 1.5× synthetic eligible figure would launder fabrication through fluent
prose. **Acceptance:** every score component quoted matches a tool-call breakdown;
a GAR what-if answer includes the re-calculated ratio from a fresh `/calculate` call;
questions about Art. 8 Delegated Act reporting are redirected to the `eu_taxonomy_gar`
sibling module by name.
