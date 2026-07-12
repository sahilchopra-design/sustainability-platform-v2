## 9 · Future Evolution

### 9.1 Evolution A — Wire the frontend to the existing engine and fix the failing endpoints (analytics ladder: rung 1 → 3)

**What.** This module has a paradox documented in its §7 flag: a fully-worked backend engine (`sovereign_climate_risk_engine`, blast radius 2) exists with a genuine weighted composite (physical 30% + transition 25% + fiscal 25% + adaptation 20%), rating-notch mapping, and spread-delta calibration — but **the frontend page never calls it**, instead hand-rolling two simpler client-side functions (`computeStrandedRevenue`, `computeClimateSpread`) against an independent 51-country dataset that duplicates-but-disagrees-with the backend's 60-country `SOVEREIGN_PROFILES`. Worse, the lineage sweep records both `POST /assess` and `/portfolio` as **failed**. So users see a weaker, inconsistent model while the better one sits unused and broken. Evolution A fixes the endpoints and makes the page consume the real engine.

**How.** (1) Triage the two failing POST routes (deployment-prep methodology). (2) Repoint the frontend to `POST /assess` and `/portfolio` so the displayed scores use the engine's real composite, notch mapping, and spread calibration — eliminating the duplicate `COUNTRIES` table and the guide↔code weight mismatch in one move. (3) Fix the hard-coded `itr` (implied temperature rise) displayed against a "1.5°C Target" line as if computed: derive it from the NDC ambition gap or drop it (honest-null). (4) Ground `SOVEREIGN_PROFILES` in live ND-GAIN/IMF feeds and calibrate the stranded-revenue and spread multipliers against realised sovereign CDS/spread moves around climate-policy events (currently uncited monotonic multipliers).

**Prerequisites.** The `/assess` and `/portfolio` failures are the gate; ND-GAIN/IMF ingestion; a spread-event dataset for calibration. **Acceptance:** both POST routes pass the sweep; the frontend and backend show identical scores because the page calls the engine; `itr` is computed or removed.

### 9.2 Evolution B — Sovereign-bond climate-risk analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired engine: "assess Brazil's sovereign climate risk under delayed transition", "what's the notch adjustment and spread delta for my sovereign portfolio?", "which holdings drive the portfolio's transition risk?" — each a call to `POST /assess` or `/portfolio`, narrating the composite, notch, and spread outputs, never computing them itself.

**How.** Tool schemas from the module's OpenAPI operations (2 POST compute + 3 GET ref); grounding corpus = this Atlas record plus `GET /ref/profiles`, `/ref/scenarios`, `/ref/countries`. Portfolio answers narrate the exposure-weighted composite and tier concentration from the engine's `assess_portfolio` output; the no-fabrication validator checks every score/notch/spread against tool responses. NGFS scenario framing per the reference endpoints.

**Prerequisites (hard).** Evolution A — both compute endpoints currently fail, and the frontend's parallel model disagrees with the engine, so there is no consistent surface to narrate. **Acceptance:** every score/notch/spread traces to an engine call; portfolio attribution matches `assess_portfolio`; a country outside `SOVEREIGN_PROFILES` returns "not covered," not an estimate.
