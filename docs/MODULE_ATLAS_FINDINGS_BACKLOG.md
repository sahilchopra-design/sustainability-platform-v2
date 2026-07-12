# Module Atlas — Findings Backlog

Consolidated from the deep-dive documentation pass (2026-07-03). Every module's methodology
was reconciled against its actual code by an independent agent; this file aggregates what they
found that warrants a fix, beyond what's already covered by the 11 tasks spawned earlier in this
session (listed in §0 for completeness — those are already running).

**Status:** DEEP-DIVE PASS COMPLETE — all 963/963 `docs/module_atlas/deep/*.md` files written and
verified against source. This backlog captures the significant findings surfaced along the way;
it is not exhaustive of every `mismatch: true` flag (those live per-module in the deep-dive files
themselves) — it's the subset worth a human triage pass before scheduling fixes.
Next: rebuild `atlas.json` + wiki pages from the expanded corpus, then re-push all 963 to Notion.

---

## 0 · Already spawned as background tasks (running, no action needed here)
1. project_finance_engine.py — 1000× generation unit bug
2. aquaculture-climate-finance — missing `ReferenceLine` import
3. insurance_risk engine — peril-name mismatch makes climate scaling a no-op
4. data_intake — PCAF dedup keeps only first row; dcm AMS-III.E self-cancelling term
5. shipping_maritime — CII formula deviates from IMO MEPC.353(78); supply_chain_workflow EUDR list stale
6. eu_ets — `/ets2-readiness` crashes (AttributeError); gar assessed_pct never decrements + rating-band gap; eu_gbs enforces 100% alignment vs regulation's 15% flexibility pocket
7. ai-governance — real backend engine (EU AI Act/NIST/bias) never called by frontend
8. bess-grid-analytics — LCOS ×365 double-count + inert Arrhenius term; bess-project-finance stray ×1000; asset-valuation-engine MC ignores its own vol/correlation inputs; assurance_readiness_engine.py duplicate dict keys
9. client-pitch — engine-result cards read flat keys against nested object, render "N/A"
10. metrics-data-architecture — fabricates ESRS/GRI/ISSB citation codes via PRNG (integrity risk)
11. issb-tcfd — Pydantic schema mismatch breaks the honest-by-construction backend; ldes-investment — 1000× kWh/MWh unit error in IRR

---

## 1 · Fabricated statistics presented as real (highest severity — misleads a user into trusting a number)
- **macro-esg-intelligence** — displays a hard-coded "F-stat: 24.8 (p<0.001)" as an estimated regression result; the underlying data was generated FROM the same coefficients, so the "test" is circular.
- **ml-risk-scorer** — "TRAIN MODEL" button is a pure animation; ignores its own hyperparameter inputs entirely.
- **carbon-credit-audit-trail** — claims a SHA-256 hash-chain audit trail; actually a PRNG "simHash" simulation with no real hashing/immutability.
- **cascading-default-modeler** — guide claims Eisenberg-Noe network contagion; code runs a pre-scripted linear cascade, not an iterative fixed-point solve.
- **portfolio-climate-var** — "Climate VaR/CVaR" are raw `sr()` draws, simply averaged; no loss distribution, no percentile, no `Σw·V·δ`.
- **peer-clustering-segmentation** — "k-means" clusters are `floor(i/4)`; silhouette scores are random with a hard-coded bonus at k=5.
- **ensemble-prediction-engine** — guide advertises live XGBoost/LightGBM/MLP with 5-fold CV + conformal intervals; no ML runs at all.
- **governance-hub** — composite governance score is fabricated, not computed from inputs.

## 2 · Real backend engine exists but frontend never calls it (wiring gap — high value to fix, low risk)
Pattern: a genuinely correct, standards-grounded engine sits in `backend/services/`, but the React
page renders `sr()`-seeded data instead of calling its own API.
- physical_risk_pricing_engine.py (real EP-curve integration, NGFS amplifiers, 30-country baselines)
- dme_contagion (real Hawkes multi-layer) / dme_nlp_engine (real pulse-score/decay) — both shown seeded on frontend
- eu_taxonomy_engine.py + eudr_engine.py (real Article-3 TSC test, Article-9 traceability) — 3 frontend pages bypass with heuristics
- forced_labour_engine.py, food_system_engine.py — honest-null backends, seeded frontends
- corporate_nature_strategy_engine.py (production-grade TNFD/SBTN) — frontend renders 55 generic seeded items
- insurance_climate_risk.py (Solvency II CAT/SCR/TP) — no insurance-* page calls it
- issb_s2_engine.py — real completeness formula; issb-tcfd page doesn't wire to it (see §0.11 for the schema-break half of this)
- re_portfolio_engine.py (real CRREM) — re-portfolio-dashboard never calls it
- green_securitisation engine (E81) — silently swallows API failures, falls back to seeded data
- greenwashing_engine.py — real NLP-style screening exists, pages don't call it
- esg_ratings_engine.py (Berg-et-al divergence) + esg_data_quality (PCAF DQS, honest nulls) — esg-data-quality fires the assessment POST then discards the response
- green_hydrogen_engine.py (real EU RFNBO Delegated Regs, IEA LCOH) — frontends use a dimensionally-broken approximation instead (masked by a `max(1.5,…)` floor); green-hydrogen-lcoh also uses HHV vs engine's LHV (~18% divergence)
- critical_minerals_engine.py, crypto_climate_engine.py — IEA/CBECI-calibrated, bypassed by seeded pages
- vcm-integrity — real ICVCM CCP weighting engine exists; page runs a simpler disconnected local calc
- water-risk — real WRI Aqueduct proxying engine exists; page bypasses it
- xbrl-export-wizard / xbrl-ingestion — real ESRS→XBRL taxonomy mapping with actual ESMA rejection-reason logic, and a real regex iXBRL parser, both disconnected from their pages
- reporting-hub, residential-re-assessment, scheduled-reports — real backend engines/routes with ZERO fetch/axios references from their frontends
- sovereign-climate-risk — frontend ignores its own well-built backend engine

## 7 · Cross-module inconsistencies
- **sovereign-esg** vs **sovereign-esg-hub** — score the same countries differently despite covering the same domain.

## 3 · Calculation/unit bugs (concrete, fixable)
- municipal-green-bond — greenium = `sr()·12`, always positive; can't represent a bond trading tighter (wrong sign convention vs its sibling module which gets it right)
- industrial-hydrogen-integration — `netCost` formula contains a self-cancelling term
- green-hydrogen-ammonia-carbon — `creditsGross` divides by 1e6 (kg→kt) but is labelled "Mt" — likely a display-unit bug
- solar-project-finance — real ITC double-counting bug in the tax calculation (otherwise a correct Newton-Raphson IRR + IRS MACRS + Box-Muller MC engine)
- structured-credit-climate — tranche loss waterfall processes Senior before Equity, **inverting subordination**: a 3% pool loss lands entirely on AAA Senior while Equity shows 0% loss
- stress-test-orchestrator — severity multiplier uses `severity.length` (string character count) instead of the severity value, so "Medium" (6 chars) produces a larger simulated impact than "High" (4 chars)
- transition-finance-engine — loan-pricing formula doubles the base rate and mixes $M/absolute-$ units
- urban-climate-adaptation — Adaptation ROI formula is mathematically guaranteed to always be negative
- regional-carbon-market-hub — CBAM cost formula understated by ~1,000× (one row ~33,500×) due to a unit-conversion typo
- regulated-utility-rate-case — lag-cost formula doesn't reproduce the guide's own cited PG&E figure ($436M computed vs $328M claimed)
- sector-sustainability-benchmark — real JS bug: local `sectorRadarData` shadows the `useMemo` import, plus its IQR-normalisation claim isn't implemented (shows unparsed descriptive strings)
- virtual-power-plant — headline KPI and its own revenue-stack chart disagree by a 144× annualisation factor
- vc-impact — "IRR%"/"MOIC" are cosmetic relabels of generic random fields; no cash-flow model behind them

## 4 · Structural issues
- **private-markets-esg-hub** / **private-markets-hub** — byte-identical static dashboards; one's export function is even mis-named after the other component. Candidate for dedup/merge.
- **industrial-ccs**, **ccus-market-intelligence**, **ccus-project-finance**, **carbon-storage-geology**, **direct-air-capture** — empty feature directories / dead routes with no implementation at all (some superseded by a `-finance` sibling, some genuinely orphaned).
- **technology-risk** — a genuine three-way divergence: the guide describes clean-tech stranded-asset risk, the frontend page actually implements cyber/IT risk, and a separate orphaned backend engine implements AI/data-centre carbon accounting. All three disagree on what this module is.

## 8 · Found during §2 wiring-gap remediation (new)
- **regulatory_obligation_calendar.py (E3)** — 4 of 6 endpoints (`/obligations`, `/alerts`, `/frameworks`, `/obligations/{id}`) crash server-side with `AttributeError` (route reads `._obligations` on objects lacking that attribute), confirmed via direct Python invocation. Only `/summary` and `/module-coverage` work. reporting-hub was wired only to the working two; the broken four still need a real fix.
- **water-risk-analytics** — despite being suggested as a "correctly wired" reference for the water-risk fix, it turns out this sibling page ALSO isn't wired to any live backend — it only imports a static public seed array. Not fixed (out of scope for that task), flagged for a future wiring pass.

## 6 · Regulatory-accuracy / stale-content issues
- metrics-data-architecture — separate `INTEROP_METRICS` array (Interoperability Matrix tab, untouched by the crosswalk fix) uses BRSR `P-VII` (Principle 7, "Public Policy") for environmental metrics like GHG/water/waste; per SEBI BRSR framework these should map to Principle 6 ("Environment").
- **sec-climate-rule** — still presents the SEC's climate disclosure rule as active law; the rule was rescinded and its sibling module `sec-climate-disclosure` reflects that correctly. This one didn't get the update.
- **shareholder-resolution-analyzer** — page claims "100 resolutions" but the underlying array holds only 8, backed by 4 disconnected static aggregate tables.
- **sfdr-pai** — still missing PAI-17/18 (real-estate indicators) and a possibly-mislabelled PAI-16, despite the AUM-guard/Infinity fixes from REM-38/39 being genuinely present.
- **sfdr-v2-reporting** — inconsistent $/€ currency symbols; only 14 of 18 PAI indicators covered.
- **sentiment-pipeline** — a numeric confusion-matrix/accuracy inconsistency.
- **sentiment-alpha-engine** — non-standard Sortino-ratio formula.

## 5 · Guide↔code domain mismatches (lower severity — wrong description, not wrong math)
Large long-tail of modules where the MODULE_GUIDES entry describes a different methodology than
the code implements (e.g. climate-credit-integration described as carbon-offset integration but
is actually NGFS credit risk; dme-* family described as ESG materiality but implements credit-risk
engines; article6-markets described as double-entry NDC accounting but is a browse dashboard).
These are documented per-module in `docs/module_atlas/deep/*.md` with the ⚠️ blockquote — full
list is queryable from the deep-dive corpus once the pass completes (search for `mismatch: true`
in each batch's returned JSON, captured in this session's transcript).

---
*Next update: append remaining batches' findings here once the final deep-dive wave completes,
then triage into P0 (crashes/fabrication)/P1 (wiring gaps)/P2 (mismatches) for a future remediation sprint.*
