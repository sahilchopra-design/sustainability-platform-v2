## 9 · Future Evolution

### 9.1 Evolution A — Evidence-fed supplier signals and geolocation-verified EUDR scoring (analytics ladder: rung 2 → 3)

**What.** The E5 engine orchestrates EUDR + CSDDD + ESRS E4 into one supplier-level workflow: EUDR
traceability (`40·geolocation + 30·system + 20·certification + 10·hs_code`), EUDR risk
(`clamp(base(country_tier) − 0.5·traceability)`, zero if the commodity isn't Annex I), a CSDDD
due-diligence score from boolean controls, and a combined risk
(`0.40·EUDR + 0.40·(100−CSDDD) + 0.20·E4`), rolled to a portfolio workflow score with an ESRS E4
readiness table. It's clean deterministic work whose inputs are all *self-declared booleans*
(geolocation? audit? code of conduct?). Evolution A replaces declarations with platform evidence.

**How.** (1) Verify the geolocation component against actual plot data: the `spatial` module's
`POST /eudr/plot-overlap` (`eudr_geolocation_proofs` table) can confirm a supplier's plots exist
and don't intersect deforestation areas — turning the 40-point geolocation boolean into a verified
check with an evidence tier. (2) Feed deforestation exposure from `nature_data`'s GFW layer per
sourcing country and controversy signals from `gdelt_controversy` into the E4/CSDDD components.
(3) Make the country tiers (high 70 / standard 40 / low 15) track the EU's official EUDR country
benchmarking as it's published, with a provenance date. (4) Bench-pin the three layer scores and
the combined weighting.

**Prerequisites.** `spatial`/EUDR plot data populated; GFW backfill (nature_data's Evolution A);
the official EUDR country benchmarking list. **Acceptance:** geolocation scoring cites plot-overlap
evidence where available; country tiers carry a source and date; combined risk bench-pinned; a
supplier with declared-but-unverifiable geolocation scores visibly lower than a verified one.

### 9.2 Evolution B — Supplier-compliance copilot across EUDR/CSDDD/E4 (LLM tier 2)

**What.** A copilot for procurement/compliance teams: "screen these 40 suppliers — who's high-risk,
why, and what do we do before the EUDR deadline?" (calling `/assess/batch` and narrating the
per-supplier layer decomposition, gaps, and deadline-mapped actions the engine already returns).

**How.** One batch POST plus four reference GETs (ESRS E4 disclosures, EUDR Annex-I commodities,
country tiers, regulatory mapping) that ground every threshold and deadline. The three-layer
decomposition lets the copilot explain *which regulation* drives a supplier's status
(EUDR-traceability gap vs CSDDD control gap vs E4 exposure); the deadline-mapped actions become the
remediation plan. What-ifs ("if this supplier implements geolocation?") re-run statelessly. Node
for a supply-chain desk in the tier-3 orchestrator, chaining GLEIF resolution → this screen →
`sustainable_trade_finance`.

**Prerequisites.** None hard — the engine is honest and reference-complete; evidence-backed
narration needs Evolution A. **Acceptance:** every score, status, and action traces to a batch
response; the copilot names the regulation and reference table behind each gap; it discloses that
control signals are self-declared (pre-Evolution-A) and refuses to assert EUDR legal compliance —
the screen is preparatory, not a due-diligence statement.
