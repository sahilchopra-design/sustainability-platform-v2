## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine, then feed the engine real sovereign data (analytics ladder: rung 2 → 3)

**What.** The backend is a serious 13-endpoint vertical — `EMClimateRiskEngine` computes country composites with GEMS climate-adjusted loss estimates, IFC PS6 applicability, eligibility across 8 concessional facilities, NDC alignment, and green-finance market depth (with an exemplary honest-null: `pipeline_to_market_ratio=None` returns nulls "rather than fabricated"). But the page ignores it: every rendered score is a `seed()` draw (`physicalRisk = seed(ci·7)·40+40`, seeded PS6 scores, seeded green-bond figures), so users see numbers the engine never produced. Evolution A closes that gap, then upgrades the engine's data anchors.

**How.** (1) Replace all seeded page derivations with calls to `POST /assess`, `/country-risk`, `/portfolio` — the endpoints exist and the ref GETs already trace `passed`. (2) Data: the engine's `EM_COUNTRY_PROFILES` constants become a table refreshed from ND-GAIN (already among the platform's ETL sources) and IMF WEO fiscal/fossil-export series, per the §4 lineage sketch that names exactly these sources. (3) Rung 3: calibrate the GEMS multipliers against the published GEMS Consortium default statistics they're named for, and backtest EMCRI rank ordering against realized sovereign spread widening in climate-event years; publish both in `ref/gems-multipliers`.

**Prerequisites.** ND-GAIN/IMF ingester scheduling; portfolio exposures from `portfolios_pg` for `/portfolio`. **Acceptance:** lineage sweep shows the 7 POSTs `passed`; a country's page score equals a direct engine call; grep finds zero `seed()` in the page's data path; GEMS multipliers carry source citations.

### 9.2 Evolution B — DFI due-diligence analyst chaining the assessment stack (LLM tier 2)

**What.** The overview's end state — "export the EM climate risk report for investment committee or DFI due diligence" — as a tool-calling analyst: "assess a $40M agribusiness exposure in Kenya: climate risk tier, PS6 obligations, and which concessional windows could blend down the cost?" It chains `POST /country-risk` → `/ifc-ps6` → `/concessional-finance` → `/ndc-alignment`, then drafts the DD memo with the composite decomposition (the five weighted dimensions), the PS6 offset requirement if triggered, and the top-3 facility pipeline from the engine's prioritization.

**How.** Tool schemas from the module's 13 existing OpenAPI operations — this is among the platform's most tool-ready modules, needing no new backend for tier 2. Grounding corpus = this Atlas record's §2.3 (engine docstrings specify inputs/outputs precisely) and the IFC PS6 / GCF reference thresholds from the ref endpoints. The honest-null behavior propagates: where the engine returns null pipeline metrics, the memo says "no pipeline data anchor" — the engine's own convention, narrated. Every figure validator-checked against tool responses.

**Prerequisites (hard).** Evolution A's page-wiring first, so the copilot and the page describe the same numbers (a copilot citing engine output beside a page showing seeded scores would visibly contradict itself). **Acceptance:** a golden Kenya-exposure memo reproduces a scripted endpoint chain exactly; asking for a country outside the engine's profile set refuses with the covered-universe list.
