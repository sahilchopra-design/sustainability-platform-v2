## 9 · Future Evolution

### 9.1 Evolution A — Compute the real SEII from supplier history and fix the two wiring bugs (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's headline `SEII = Σ(ScoreΔ × Spend Weight) / Σ Spend Weight` (spend-weighted average ESG improvement) **is not computed** — the per-supplier `improvementRate` is an independent random draw (`round(−5 + sr(88)×25)`) despite a genuine 12-quarter score `history` existing per supplier from which a real Δscore could be trivially computed. Two more §7.6-flagged bugs: the module computes a real `DIM_WEIGHTS`-weighted score but assigns supplier tiers off the **unweighted** `composite` (the weighted score is dead), and the 150 suppliers are `sr()`-synthetic with no CDP/EcoVadis data. Evolution A fixes the arithmetic and grounds the data.

**How.** (1) Compute `improvementRate` as the real quarter-over-quarter delta (`history[11].value − history[0].value`) already available per supplier, then implement the spend-weighted SEII the guide promises. (2) Fix the tier assignment: either drive `tier` off the weighted score (using the real `DIM_WEIGHTS`) or remove the unused weighted field — one source of truth. (3) Ingest real supplier assessment data (CDP Supply Chain Programme responses, EcoVadis scores) to replace the synthetic 150, feeding real dimension scores and histories. (4) Wire the engagement-pipeline and corrective-action records to real programme data rather than random supplier linkage.

**Prerequisites.** CDP/EcoVadis data access for real assessments; the delta and SEII computations are trivial with the existing history structure. **Acceptance:** `improvementRate` equals the supplier's actual first-to-last quarter delta; SEII is the spend-weighted average of those deltas; tier assignment uses a single (weighted or unweighted) score consistently.

### 9.2 Evolution B — Supplier-programme management copilot (LLM tier 1)

**What.** A copilot for the buyer's sustainable-procurement team: "which suppliers should I prioritise by spend, risk, and ESG gap?", "what's our aggregate supply-chain ESG improvement for CDP/CSRD reporting?", "draft the corrective-action plan for this underperforming supplier" — answered from the (Evolution-A) real SEII, supplier scores, and engagement-pipeline data, grounded in the OECD DDG and GRI 308/414 frameworks the module references.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/supplier-engagement/ask`, corpus = this Atlas record (the SEII formula, the 6 ESG dimensions and weights, CDP/SBTN/OECD/GRI framework notes) plus live supplier data. Prioritisation narrates the deterministic spend × risk × gap ranking; the CDP/CSRD aggregate reports the computed SEII; corrective-action drafts follow the 6-stage pipeline the module already models. The copilot cites the specific ESG dimension driving each supplier's gap.

**Prerequisites.** Evolution A's real SEII and single-source tier so prioritisation and reporting rest on computed improvement rather than a random draw and a dead weighted score. **Acceptance:** every SEII/score figure traces to computed supplier data; the prioritisation ranking reflects the real spend/risk/gap inputs; a supplier outside the programme returns a refusal.
