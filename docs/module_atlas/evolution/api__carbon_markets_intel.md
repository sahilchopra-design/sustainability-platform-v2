## 9 · Future Evolution

### 9.1 Evolution A — Live credit prices and methodology-level ICVCM assessment (analytics ladder: rung 1 → 3)

**What.** A clean tier-A VCM intelligence engine (E46): VCMI Claims Code tiering, ICVCM 10-CCP
assessment, CORSIA eligibility, Article 6 ITMO classification, credit pricing, portfolio analytics
— all de-fabricated with conservative honest-null defaults (§7.5 documents removed random jitter
now replaced by deterministic tier logic and "no-evidence fail" for missing attestations). §7.5
names the deepening targets: prices are **static benchmark tables** (2015/2020/2023 vintages), not
live market data; the ICVCM assessment is a **portfolio heuristic** inferring CCP pass/fail from
registry identity/audit-flag/vintage rather than evaluating real ICVCM methodology-category
approvals; and the 20 Article 6 bilateral agreements are a fixed snapshot. Evolution A wires live
VCM price feeds and upgrades ICVCM scoring to reference the actual ICVCM programme/methodology
approval registry.

**How.** A VCM-price ingester replaces the static benchmark tables (the platform already wires
market-data feeds); `assess_icvcm_ccps` joins to an ingested ICVCM-approved-methodology table so
CCP verdicts reflect real approvals, keeping the attestation escape-hatch for un-approved credits.
Rung 3: calibrate the additionality/co-benefit premium bands against observed VCM transaction data
and refresh the Article 6 bilateral registry from UNFCCC.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /full-assessment`
**failed** and `/article6`, `/corsia-check`, `/credit-pricing` **skipped**; preserve the honest-null
discipline (a missing CCP attestation stays a no-evidence fail, not a fabricated pass).
**Acceptance:** the §7.4 pricing worked example ($24.30/tCO₂ nature-based Gold credit) reproduces at
legacy benchmarks; a live price feed moves the base price; ICVCM verdicts reflect real methodology
approvals where available; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Carbon-credit quality analyst with tool-called screening (LLM tier 2)

**What.** A tool-calling analyst for VCM buyers: "is this VCMI claim Gold-eligible?" (`/vcmi-claim`),
"assess ICVCM CCP alignment for our credit portfolio" (`/icvcm-ccp`), "are these credits CORSIA-
eligible?" (`/corsia-check`), "price a 2022 nature-based Gold-Standard credit" (`/credit-pricing`),
and "analyse our portfolio" (`/portfolio-analysis`) — narrating the engine's real outputs and its
data-gap flags (`credits_missing_ccp_attestations`, conservative no-data VCMI defaults).

**How.** Tool schemas from the 7 POST + 4 GET operations; the four reference endpoints (VCMI
criteria, ICVCM CCPs, CORSIA schemes, price benchmarks) are ideal RAG grounding for "what does
CCP05 additionality require?" questions — a tier-1 explainer over a tier-2 operator. The
no-fabrication validator checks every price, score and pass-rate against tool output; the copilot
must surface which CCPs failed for lack of attestation (a data gap, not a quality failure).

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the credit price matches `/credit-pricing` exactly; an ICVCM answer distinguishes a
no-attestation data gap from a substantive CCP failure, per the engine's design.
