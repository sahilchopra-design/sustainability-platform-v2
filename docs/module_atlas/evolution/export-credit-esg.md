## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine and compute the promised ECA_ESG composite (analytics ladder: rung 1 → 2)

**What.** The module already has a rigorous backend (`export_credit_esg_engine.py` with `/assess`, `/equator-principles`, `/fossil-fuel-screen`, `/green-classification`, `/eca-profile`), but the §7 flag documents that `ExportCreditESGPage.jsx` never calls it — it renders 50 `sr()`-seeded transactions and 40 seeded countries, and the guide's headline composite `ECA_ESG = 0.6·IFC_PS + 0.4·OECD_CA` is never computed anywhere. Evolution A closes that wiring gap and adds a scenario layer: assess a real transaction payload through `assess_export_credit_esg()`, compute the weighted composite server-side, and sweep it across OECD category (A/B/C), host-country designation, and IFC PS coverage to show which lever moves eligibility.

**How.** (1) Add the composite to the engine's `assess` response (IFC PS score from `_check_ifc_ps_compliance`, OECD CA procedural score from `_resolve_oecd_category` inputs, weights 0.6/0.4 per §5). (2) Replace the seeded transaction tab with a form-driven assessment calling `POST /assess`, keeping the seeded book only as a clearly badged demo portfolio. (3) Add a what-if grid endpoint that re-runs the assessment over the 3×2×2 category/fossil/ESIA matrix.

**Prerequisites.** None structural — the engine exists; this is frontend wiring plus one engine field. The §7 host-country-gap KPI needs a real host-country standards table (currently display-only). **Acceptance:** the page shows an ECA_ESG value that reproduces the §5 formula from engine-returned pillar scores, and changing `country_iso2` or `sector` in the form changes the composite; no `sr()` value feeds any headline KPI.

### 9.2 Evolution B — Common Approaches compliance copilot (LLM tier 2)

**What.** An ECA-desk copilot that answers "is this transaction Category A, and what does that obligate us to?" by tool-calling the module's five endpoints and narrating real engine output: the OECD category with its `_resolve_oecd_category` evidence, the EP IV applicability from `apply_equator_principles` (>$10M threshold, designated-country logic), fossil-fuel exclusion status per ECA from `screen_fossil_fuel_exposure`, and the action-item list the engine already returns.

**How.** Tool schemas generated from the module's OpenAPI operations (all read-only, Pydantic-typed); the system prompt is grounded in this atlas page's §5/§7 (OECD Common Approaches 2016, IFC PS 2012, EP IV citations are already in the reference list). The copilot's distinctive value is regime navigation: it maps engine flags to the specific OECD CA obligations (ESIA benchmarking, public-information package, independent review for Category A) and drafts the disclosure checklist — text generation grounded in structured engine output, never invented scores. Numbers pass the fabrication validator against tool responses.

**Prerequisites.** Evolution A's wiring (the copilot must narrate engine assessments, not the seeded page state); pgvector corpus per roadmap Tier 1. **Acceptance:** for a test transaction, every category, threshold, and exclusion the copilot cites appears verbatim in a logged tool response; asked for a host-country gap score the engine doesn't compute, it refuses.
