## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the Decision Summary and wire permit risk into the IRR (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's most rigorously implemented modules — a genuine
Newton-Raphson `calcIRR` on correctly-constructed incremental cash flows, with real
per-point sensitivity re-solves — so Evolution A is consolidation, not construction.
§7.3(6)/§7.5 document the one internal inconsistency: the Decision Summary tab's Life
Extension row uses fixed multipliers (`irr: incIRR×0.55`, `npv: oldNPV×0.6`) while the
dedicated Life Extension tab independently and correctly solves its own cash flows —
two numbers for the same scenario. Fix: the summary card consumes the tab's solve.
Then close the documented wiring gap: `PERMIT_RULES` (Germany §16b, UK NSIP, DK
fast-track) and the 9 `CASE_STUDIES` sit on the page but never enter the IRR —
Evolution A adds permit-timeline risk adjustment (expected delay shifts the
construction-start year of the incremental cash-flow array; fast-track probability
weights two solved scenarios) and validates the `newCF` uplift model
(`rotorFactor×14 + hub-height term`, currently author-calibrated) against the case
studies' published AEP uplifts, promoting the module to rung 3 with a `bench_quant`
pin on the §7.4 worked example (32.5% uplift, 20×1.5MW → 6×5MW).

**How.** Pure frontend refactor for the reconciliation; the permit adjustment is a
year-shift + probability-blend on existing arrays; calibration is a one-time check of
`rotorFactor` coefficients against the CASE_STUDIES `aepUplift` field already in the
file.

**Prerequisites.** None external — all data is on the page; the multiplier shortcut
acknowledged in the changelog. **Acceptance:** Decision Summary and Life Extension
tab show identical Life-Extension IRR; switching country from Germany to UK visibly
moves incremental IRR via the timeline shift; bench pin reproduces 32.5% uplift.

### 9.2 Evolution B — Repower-vs-extend advisor over the live model (LLM tier 2)

**What.** The module already produces a decision recommendation card; Evolution B
makes it interrogable. Asset managers ask exactly the questions the 18-tab model
answers but can't narrate: "why Repower Now instead of Extend — what PPA price flips
it?", "how much of the IRR comes from grid re-use vs the §16b bonus?", "compare our
fleet to the Altmark case study". The advisor reads the current input-panel state and
computed `metrics`, re-runs what-ifs by adjusting inputs through a `POST /solve`
endpoint exposing the existing `calcIRR`/`calcNPV` machinery server-side, and answers
with decomposed, tool-sourced figures — including the breakeven PPA from the
sensitivity sweep the page already computes.

**How.** Tier-2 stack: the solve endpoint is a thin port of the `metrics` useMemo;
tool schema carries the same input names as the UI panel so answers and page state
stay aligned. Grounding corpus is this Atlas page — §7.5's credit ("would pass a
basic model-validation review") and its caveats (permit rules static, author-
calibrated CF model) both go into the prompt so the advisor represents model maturity
accurately.

**Prerequisites (hard).** Evolution A's reconciliation — an advisor explaining a
summary card that disagrees with its own detail tab would be incoherent; solve
endpoint bounded (fixed iteration cap already exists in calcIRR). **Acceptance:**
every IRR/NPV in an answer traces to a solve call; the breakeven-PPA answer matches
the page's sensitivity table; asked about offshore repowering (out of scope — the
model is onshore), the advisor says so.
