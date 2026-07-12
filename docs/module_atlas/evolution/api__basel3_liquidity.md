## 9 · Future Evolution

### 9.1 Evolution A — Cash-flow-level stress and correct IRRBB outlier test (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: four calculators (LCR with climate haircut overlay, NSFR, ALM
gap/IRRBB, liquidity stress) plus a full-assessment orchestrator and six reference endpoints, with
Basel/CRR2 factor tables faithfully encoded and a notably honest post-remediation posture — inline
comments document that earlier random draws (climate haircuts, stress bases, monitoring status) were
deliberately replaced with deterministic constants or honest nulls. §7.5 names the remaining
simplifications: IRRBB uses linear PV01 (no convexity) with heuristic non-parallel-shock scalars and
a **20%-of-assets materiality test instead of the regulatory 15%-of-Tier-1 outlier test**; NII uses
the total cumulative gap rather than the <1y repricing gap; and stressed ratios are reduced-form
scalings, not cash-flow-level recomputation, with seven unsourced scenario multiplier sets.
Evolution A implements full-revaluation IRRBB with the correct Tier-1-based outlier test and a
cash-flow-level stress engine.

**How.** `assess_alm_gap` adds convexity and the ±200bp full-revaluation ΔEVE the BCBS 368 standard
prescribes, with the materiality flag re-based to 15% of Tier 1; `run_liquidity_stress` recomputes
outflows at the cash-flow level from the funding stack rather than scaling base ratios. Rung 3:
calibrate the seven stress scenario multiplier sets against EBA stress-test parameters and validate
climate HQLA haircuts once a supervisory standard emerges (the 10/18bps add-ons are honestly flagged
as platform assumptions — no standard prescribes them yet).

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /alm-gap` and
`/full-assessment` **failed**; the full-assessment demo defaults (flat 450/450 ALM buckets) are
illustrative and must stay flagged in `data_assumptions`. **Acceptance:** the §7.4 worked example
(LCR 186.4%, NSFR 234.3%, strong) reproduces; the IRRBB materiality test uses 15% of Tier 1;
stressed LCR is recomputed from cash flows, not a reduced-form scaling; the failing POST endpoints
pass the harness.

### 9.2 Evolution B — Liquidity-risk analyst with tool-called Basel ratios (LLM tier 2)

**What.** A tool-calling analyst for treasury/ALM teams: "what's our LCR under a disorderly climate
scenario?" (calls `/lcr` with the climate overlay), "compute NSFR from this funding stack"
(`/nsfr`), "run the ALM gap and IRRBB EVE sensitivity" (`/alm-gap`), "stress us under a combined
run" (`/liquidity-stress`), and "give me the full liquidity assessment" (`/full-assessment`) —
narrating the engine's exact Basel outputs including cap events, breach registers (citing CRR2 Art
412/428b) and survival-horizon bands.

**How.** Tool schemas from the domain's endpoints; the six reference endpoints (HQLA factors/
haircuts, run-off/outflow rates, monitoring tools, rate shocks) are ideal RAG grounding for "what's
the Level 2B haircut and cap?" questions. The no-fabrication validator checks every ratio, PV01 and
horizon figure against tool output; the engine's honest-null design (stress needs real funding bases
or returns `insufficient_data`) means the copilot must request missing bases rather than assume them.
Composable into a Financial-desk orchestrator alongside `banking_risk`.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces to an engine
tool call; the LCR cited matches `/lcr` including any cap events; a stress query without funding
bases returns the engine's honest-null with the copilot requesting them, not inventing a stressed
ratio.
