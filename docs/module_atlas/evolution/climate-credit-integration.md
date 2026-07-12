## 9 · Future Evolution

### 9.1 Evolution A — Resolve the identity crisis, then deepen the IFRS 9 engine (analytics ladder: rung 2 → 3)

**What.** §7's finding is unusual: the guide describes carbon-credit offset
integration (ICVCM screening, VCMI tiers, net financed emissions) but the code is a
different — and genuinely decent — module: climate-conditioned IFRS 9 credit risk with
NGFS PD/LGD multipliers, ECL uplift (`ECL = PD×LGD×EAD`), SICR staging, a hazard ×
sector matrix, and transition-cost projections over 40 synthetic obligors. The
offset methodology properly lives in the cc-* family. Evolution A therefore has a
mandatory step zero — rewrite the guide to describe the IFRS 9 module that exists
(the §7 flag says exactly this) — then deepens it: the scenario PD/LGD multipliers in
`SCENARIOS_CC` are currently asserted constants; calibrate them against the published
ECB climate stress-test results and NGFS-vintage transition paths so the
scenario-conditioned ECL uplift carries a citable basis.

**How.** (1) Guide rewrite + atlas regeneration so RAG corpora stop describing
phantom VCMI logic. (2) `ref_scenario_pd_multipliers(scenario, sector, multiplier,
source, vintage)` replacing hard-coded values; sector granularity added (a utilities
obligor and a tech obligor should not share one multiplier). (3) The 40 synthetic
obligors kept as clearly-labelled fixtures, or linked to real obligors via the GLEIF
spine where portfolio data exists.

**Prerequisites (hard).** The guide↔code identity mismatch is the platform's worst
RAG hazard on this page and blocks everything downstream. **Acceptance:** the guide
describes the implemented module; scenario multipliers cite calibration sources; a
fixture obligor's ECL uplift decomposes into PD and LGD channels reproducibly.

### 9.2 Evolution B — IFRS 9 climate-overlay copilot (LLM tier 1 → 2)

**What.** A copilot for credit officers: "why did this obligor migrate to Stage 2
under Disorderly?" (SICR trigger narration from the staging logic), "decompose the
ECL uplift into PD and LGD channels", "which sector-hazard cells drive our matrix?" —
grounded in the (corrected) atlas record and page state. Tier-2 what-ifs re-run the
scenario conditioning with LLM-proposed carbon-price/scenario inputs as client-side
tool calls over the ECL functions.

**How.** Tier 1 after the guide rewrite: §5/§7 corpus plus the live obligor table;
staging explanations must follow the coded SICR triggers, not IFRS 9 generalities.
Tier 2: tool schemas over the ECL/staging functions; validator ties every ECL and
uplift figure to invocations. Offset/VCMI questions get routed to the cc-* modules'
copilots per the interconnection graph — this module must decline them.

**Prerequisites (hard).** Guide rewrite first; without it the copilot would be
grounded on a description of a module that doesn't exist. **Acceptance:** a staging
explanation cites the specific trigger that fired; a VCMI claims question is
redirected to the correct module rather than answered here.
