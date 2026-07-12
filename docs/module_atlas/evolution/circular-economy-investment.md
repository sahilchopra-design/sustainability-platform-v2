## 9 · Future Evolution

### 9.1 Evolution A — Implement the CE business-model NPV/IRR the guide advertises (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's entire methodology — `CE_Revenue = ServiceFee ×
(1−ChurnRate) + MaterialResidualValue + WarrantyExtension`, a `Circular_IRR` solving
NPV=0, `Material_Saving = VirginCost − RecoveredCost` — has **no implementation**:
the page is a curated 6-model catalogue plus a 22-company pipeline whose
valuation/CAGR/savings figures are seeded-PRNG draws, and it never calls the domain's
real backend (`circular_economy_engine.py`, live at `/api/v1/circular-economy/*`).
Evolution A builds the advertised financial model as a new engine function: a
circular-vs-linear cash-flow comparison per business model (PaaS subscription streams
with churn, take-back residual value, repair-revenue extension), returning NPV, the
IRR root, and payback — deterministic, unit-tested, exposed as
`POST /api/v1/circular-economy/business-model-npv` alongside the existing eight routes.

**How.** (1) Cash-flow constructor parameterised by the `CE_MODELS` fields the page
already curates (revenue model, margin uplift, resource saving); IRR via bisection on
the NPV polynomial. (2) The synthetic 22-company pipeline either deleted or re-labelled
as a hand-curated (not PRNG) example set — §7 shows the sr() draws, which the platform
guardrail treats as fabrication. (3) ROI-analysis tab rewired to render engine
responses.

**Prerequisites (hard).** PRNG-metric purge; route added to the module's atlas
endpoint map so tier-2 tooling can discover it. **Acceptance:** a fixture PaaS case
with known cash flows reproduces a hand-computed IRR to 4 decimals; no rendered
valuation metric lacks an engine-response source.

### 9.2 Evolution B — CE investment-screening analyst (LLM tier 2)

**What.** An assistant for investor workflows spanning the existing engine and
Evolution A's new endpoint: "model a take-back program with 12% churn and €40/unit
residual — does it beat linear?", "what's the MCI and ESRS E5 posture of this product
system?" (existing `/mci`, `/esrs-e5` routes), "which of the six business models fits
a capital-light entrant?" (catalogue reasoning from the curated `CE_MODELS` rows).
Every financial figure comes from tool calls; qualitative model-fit reasoning cites
the catalogue and EMF framework corpus.

**How.** Tool schemas from the module's OpenAPI surface (8 existing + 1 new route);
no-fabrication validator on all NPV/IRR/score numerics; the Ellen MacArthur 6-principles
tab and §5 references (EMF CE100, BS 8001) form the RAG corpus for framework questions,
kept clearly separate from computed outputs.

**Prerequisites.** Evolution A first for any valuation talk — today an investment
question could only be answered from PRNG-fabricated company metrics, which is
disqualifying. Guide corrected in the same change. **Acceptance:** an investment-case
answer decomposes into engine-returned NPV components; asked to value one of the 22
pipeline companies, the assistant states their metrics are illustrative examples, not
data.
