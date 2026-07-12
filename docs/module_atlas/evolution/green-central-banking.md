## 9 · Future Evolution

### 9.1 Evolution A — Compute the Green QE tilting score and source the trend data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's Green QE Tilting Score (`Tilt = (GreenShare_portfolio − GreenShare_market)/GreenShare_market × 100`) is not computed — there's no portfolio green-share, market benchmark, or tilt ratio; the page is a cross-central-bank scorecard ranking ~130 NGFS members on pre-assigned dimension scores (a curated/analyst scorecard), with the 24-month `TREND` synthetically `sr()`-seeded. Evolution A builds the tilt score for real: model a central bank's asset-purchase portfolio green-share against a market benchmark green-share, computing the tilt per §5 — turning the descriptive scorecard into an analytical tool that quantifies how far a CB's purchases deviate from market-neutral (the ECB pre-2021 baseline). It also replaces the seeded trend with a sourced time series of NGFS supervisory-progress milestones.

**How.** (1) A backend route computing tilt from a CB's holdings green-share vs a benchmark green-share (both parameterisable, sourced from CB disclosures where available). (2) The scorecard dimension scores kept as curated reference, but the trend backed by dated NGFS milestone data rather than `sr()`. (3) Collateral-framework and green-QE-design analytics tied to the computed tilt.

**Prerequisites.** CB portfolio green-share and benchmark data (curated to start); NGFS milestone dates for the trend. The seeded `TREND` (§7-flagged) replaced. **Acceptance:** the tilt score computes per §5 from portfolio and benchmark green-shares; the trend is a sourced milestone series, not `sr()`; the scorecard remains curated reference with provenance.

### 9.2 Evolution B — Central-bank climate-policy copilot (LLM tier 1 → 2)

**What.** A copilot for policy analysts and CB watchers: "how does the ECB's green-QE tilt compare to the BoE's, and which NGFS members lag on supervisory expectations?" narrates the cross-CB scorecard and NGFS membership analytics from the atlas corpus, with tier-2 computing tilt scores via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (NGFS framework, green-QE design, climate-aligned collateral, the ECB pre/post-2021 approach). The copilot's value is comparative central-bank analysis — where each CB sits on supervisory expectations and monetary-tool adoption. Guardrail, pre-Evolution-A: the tilt score isn't computed and the trend is seeded, so it must present scorecard dimensions as curated analyst judgement and refuse tilt figures. Tier 2 tool-calls the tilt endpoint. Every figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for computed tilt. **Acceptance:** post-Evolution-A, every tilt figure traces to a tool call; the scorecard comparisons cite the curated dimension data; pre-Evolution-A the copilot declines tilt-score questions.
