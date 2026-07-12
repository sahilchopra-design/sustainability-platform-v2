## 9 · Future Evolution

### 9.1 Evolution A — Render the E91 engine; fix the discarded POST (analytics ladder: rung 2 → 3)

**What.** §7 documents the now-familiar tier-A pattern at its most frustrating: the
backend engine (E91) is a real rule-based assessment — greenwashing scoring over 20
enumerated red flags with enforcement uplift, log-scaled disclosure liability,
fiduciary-duty breach counting, Meehl-Haugen-Christidis attribution
(`attribution_share = cumulative_emissions / global_industrial_CO2_1850_2023`), and
a weighted exposure aggregation (25/30/20/15/10 contributions visible in the
extracted lines) — behind 6 POSTs and passing ref GETs. But the frontend POSTs
`/assess` and **discards the response** (`catch {} → seed fallback`), rendering
entity-type-seeded demo scores. The guide's Precedent Strength Index, meanwhile,
exists nowhere. Evolution A: bind the page to the engine (delete the seed fallback
path except as an explicit offline mode), and reconcile the guide to the entity-
assessment module that actually exists — PSI moves to §8 as future work or is
dropped.

**How.** (1) Fix the fetch: correct payload schema, surface engine responses in all
tabs, error states instead of silent seed substitution — the platform's honest-nulls
convention applied to API failure. (2) The 29-row `RED_FLAGS` frontend seed
reconciled with the engine's 20-flag taxonomy (one source of truth — the engine's
`/ref/greenwashing-flags`). (3) Calibration pass (rung 3): the engine's rule weights
(flag×10, ×0.15 expected-loss factors) documented per §8 model-card convention
against observed settlement data where public.

**Prerequisites (hard).** The discarded-response wiring is a documented defect and
the gate; guide rewrite mandatory. **Acceptance:** every score rendered matches an
engine response field; killing the backend shows an explicit error, not silent seed
data; the flag taxonomy has one canonical source.

### 9.2 Evolution B — Litigation-exposure analyst (LLM tier 2)

**What.** The engine's five sub-assessments are natural tools: "assess this energy
company — cumulative emissions 1,200 MtCO₂, three unverified green claims, SEC
registrant" becomes calls to `/greenwashing-risk`, `/disclosure-liability`,
`/attribution-science`, and `/litigation-exposure`, with the assistant narrating the
weighted aggregation (which flags fired, what the attribution share implies, where
the insurance gap sits per the engine's IAS 37 provision logic). The red-flag
taxonomy makes interviews concrete: the assistant asks about specific enumerated
flags rather than vibes.

**How.** Tool schemas from the module's OpenAPI routes; every score and $ figure
validator-checked against tool outputs; the legal-advice disclaimer path mandatory;
"show work" lists flags triggered and rule contributions — the engine's rule-based
design makes full explainability achievable, which is precisely why it suits an LLM
front-end.

**Prerequisites (hard).** Evolution A's wiring fix first — the copilot must describe
engine outputs, not the page's current seeded scores. **Acceptance:** an assessment
conversation reproduces via direct POSTs with the stated inputs; the assistant cites
the specific red flags behind a greenwashing score; refusal on outcome prediction for
named live cases.
