## 9 · Future Evolution

### 9.1 Evolution A — Real projects, engine-anchored risk (analytics ladder: rung 1 → 2)

**What.** EP-DL5's 75 mine projects are fully synthetic — mineral/country pairings
are random rather than real deposits, HHI proxies are `sr()` draws, water intensity
has unlabelled units — while §7.5 notes the fix sitting one import away: "the genuine
IEA reference dataset in `critical_minerals_engine.py` (real HHI 7200 lithium, 8900
cobalt; real top-3 shares) is available but unused". The guide's
`SupplyRisk = (DemandGrowth − Capacity)/Capacity × HHI` and ESG-weighted mining risk
are absent. Evolution A anchors the page to the engine and replaces the fabricated
project universe with real assets.

**How.** (1) Engine anchoring: mineral-level HHI, shares, and demand multipliers
from `GET /ref/iea-minerals` and `/ref/country-concentration` (both passing the
harness) — coordinated with the sibling `critical-minerals` module's identical
rewiring, since the shared engine serves both. (2) Project universe: replace the 75
seeded projects with a curated real-asset table (the S&P/USGS-derived major-mines
lists are public at the top-of-market level; ~50 named mines with real mineral,
country, and capacity beats 75 random ones). (3) Implement the supply-risk formula
per mineral from engine demand growth and capacity; ESG mining risk =
Σ w_j × country-ESG × production share using WGI/EPI country scores (curated,
cited). (4) The two genuinely interactive scalars — the EV-adoption multiplier and
`carbonCostM = Σ(production × intensity) × price` — survive, now over real
production figures with labelled units.

**Prerequisites (hard).** PRNG purge; real-asset table curation with source
citations; cross-module coordination on the shared engine. **Acceptance:** lithium's
displayed HHI equals the engine's 7200; each project row names a real mine with a
citable source; the supply-risk formula reproduces by hand for cobalt.

### 9.2 Evolution B — Responsible-sourcing gap reporter (LLM tier 1 → 2)

**What.** The module's workflow ends at "generate EU CRM Act compliance gap report" —
unbuilt today. Evolution B drafts it from real state: the (post-Evolution A) computed
supply risks against the CRMA Art. 5 benchmarks, the OECD due-diligence step
assessment from the engine's 5-step composite, ESG mining-risk hotspots by producing
country, and the circular-economy levers (recycling rates from the engine's real
tables) — each figure tool-traced, each regulatory requirement quoted from the
`/ref/eu-crm-act` endpoint rather than paraphrased.

**How.** Tier 1 for explanation over the wired page; tier 2 for the report: tool
calls to `POST /assess` and the ref endpoints, output through the report-studio
layer. Shared grounding with the sibling `critical-minerals` module's analyst is
intentional — same engine, same corpus, different framing (this module is
supply-security and ESG-in-mining; the sibling is criticality assessment) — one
prompt family, two configurations, per the roadmap's per-desk specialization
pattern.

**Prerequisites (hard).** Evolution A (a compliance gap report over random
mineral/country pairings would be fiction with a regulation's name on it); the
`/ref/mineral-profile/{name}` route fix shared with the sibling. **Acceptance:**
report figures match tool outputs; CRMA benchmark citations are verbatim from the
ref endpoint; countries appear in the ESG-hotspot section only with cited scores.
