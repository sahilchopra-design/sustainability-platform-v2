## 9 · Future Evolution

### 9.1 Evolution A — Real BFFI LC-impact and full GBF/LEAP coverage (analytics ladder: rung 1 → 3)

**What.** A materially deeper engine than v1 (E44): full TNFD LEAP, PBAF portfolio attribution,
ENCORE 23-service scoring, MSA footprint, GBF 30×30 alignment, BNG Metric 4.0, and a BFFI portfolio
intensity — all on strict honest-null discipline (§7.5 records the prior random values are now
deterministic lookups or flagged nulls). §7.5 names the deepening targets: the BFFI "model"
footprint is a crude linear `exposure × magnitude × 10` proxy, **not a real LC-impact (PDF·m²·yr)
computation**, transparently counted separately; GBF alignment scores only 4 of 23 targets
(T01/T02/T07/T15) even when data exists; ENCORE ratings are qualitative sector averages over just
12 NACE codes; and BNG post-development distinctiveness defaults to baseline, understating
trading-down penalties Metric 4.0 enforces. Evolution A implements a real PDF·m²·yr BFFI via a
LC-impact characterisation dataset and extends GBF scoring to all 23 targets.

**How.** `calculate_bffi` gains a proper characterisation-factor lookup (ReCiPe/LC-IMPACT PDF·m²·yr
per pressure) so reported and modelled footprints share units; `assess_gbf_alignment` scores the
remaining 19 targets where inputs exist; ENCORE dependency ratings gain sub-sector/geography
resolution beyond the 12 NACE codes. Rung 3: calibrate the BFFI intensity constants (explicitly
labelled "MODEL calibration constants") against published financed-biodiversity-impact studies.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /bffi-score` and
`/full-assessment` **failed** and `/bng-calculation`, `/encore-scoring` **skipped**; fix the BNG
distinctiveness-default so trading-down penalties apply; note the v1/v2 MSA lookups use different
factors and are not comparable (document or reconcile). **Acceptance:** the §7.4 BNG worked example
(+140% net gain, no deficit) reproduces; the BFFI footprint is in PDF·m²·yr for both reported and
modelled holdings; GBF alignment scores more than 4 targets when data is supplied; the failing POST
endpoints pass the harness.

### 9.2 Evolution B — Biodiversity portfolio analyst with tool-called attribution (LLM tier 2)

**What.** A tool-calling analyst for nature-finance teams: "run our TNFD LEAP assessment"
(`/leap-assessment`), "attribute our portfolio's biodiversity footprint" (`/pbaf-attribution` with
EV/ownership/total-assets methods), "score ENCORE dependencies for these sectors" (`/encore-
scoring`), "calculate BNG units for this development" (`/bng-calculation`), and "give me the full
composite" (`/full-assessment`) — narrating the engine's real outputs and its data-completeness
flags (reported vs modelled footprint, insufficient-data holdings).

**How.** Tool schemas from the 8 POST + 4 GET operations; the four reference endpoints (ecosystem
services, GBF targets, PBAF methods, BNG habitats) are ideal RAG grounding. The no-fabrication
validator checks every unit, footprint and score against tool output; the engine's transparent
split between `holdings_reported_footprint` and `holdings_modelled_footprint` means the copilot must
distinguish entity-reported from model-proxied figures in every answer. Composable into an ESG/
Nature-desk orchestrator alongside the CSRD E4 modules.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call and carries its reported-vs-modelled provenance; the BNG net-gain % matches `/bng-calculation`
exactly; a PBAF attribution missing the method denominator returns the engine's `insufficient_data`
with the copilot requesting it, not inventing an attribution factor.
