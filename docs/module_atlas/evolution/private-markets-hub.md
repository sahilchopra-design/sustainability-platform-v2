## 9 · Future Evolution

### 9.1 Evolution A — Desmoothed risk-return engine from fund cash flows (analytics ladder: pre-rung-1 static → 3)

**What.** §7 documents a static dashboard: constant → chart, no user inputs, and the guide's headline metrics (14.2% IRR, risk-return score, 64% climate coverage) appear nowhere in code; the file is byte-identical to `private-markets-esg-hub`. Evolution A implements the §8 spec this atlas page already wrote: an IRR solver over dated fund cash flows, Geltner-desmoothed volatility from quarterly NAV series, and the ESG-adjusted Sharpe analogue `RR_s^ESG = RR_s × (1 + λ·(ESG_s − 50)/50)` with the documented λ ≤ 0.15 bound.

**How.** (1) New tables `pm_funds`, `pm_fund_cashflows`, `pm_fund_navs` (org-scoped) — the platform holds only static constants today per §8.4, so the data model is the real work; the D1 write-side activation sweep should exercise these. (2) `api/v1/routes/private_markets.py`: `POST /irr` (Newton/bisection on `Σ CF_k/(1+IRR)^t_k = 0`), `GET /risk-return/{strategy}` (desmoothed per §8.3, reporting ρ), `GET /rollup` (AUM-weighted, suppressing the ESG multiplier where composite coverage <70% per §8.6's own rule). (3) Resolve the duplicate-file situation with `private-markets-esg-hub` in the same change — this module takes the quantitative role, the sibling takes the ESG-composite/playbook role.

**Prerequisites.** Fund cash-flow/NAV data source (GP statements or seeded demo book, clearly labelled); dedup decision recorded. **Acceptance:** bench case where the IRR solver reproduces a hand-computed cash-flow IRR to 1bp, and desmoothed σ exceeds raw appraisal σ for an autocorrelated NAV series (ρ disclosed in the payload).

### 9.2 Evolution B — Cross-strategy allocation copilot (LLM tier 2)

**What.** With Evolution A live, this hub becomes where a CIO asks portfolio-shaped questions: "rank our five strategies by desmoothed risk-return, with and without the ESG multiplier", "what does the roll-up look like if we grow private credit AUM 20%?" — each answered by tool calls to `/risk-return`, `/rollup`, and `/irr`, with the copilot explaining the desmoothing adjustment (ρ, raw vs unsmoothed σ) in LP-meeting language.

**How.** Tier-2 tool schemas from the Evolution-A OpenAPI operations; system prompt grounded in §8.2–8.6 so the model-risk caveats (appraisal smoothing, cash-flow-timing sensitivity, "the ESG multiplier is a judgemental overlay, not a causal return driver") appear in answers by construction. The λ-sweep sensitivity in §8.5 becomes a canned tool the copilot can invoke for "how sensitive is this ranking to the ESG elasticity?". No fabrication: every RR, IRR, and σ traces to a tool call; strategy questions beyond the five covered classes are refused.

**Prerequisites (hard).** Evolution A shipped — today there are no endpoints and the on-page numbers are hand-authored literals a copilot must not cite as portfolio fact. **Acceptance:** a generated allocation memo carries raw and desmoothed RR side-by-side (the §8.6 fallback rule) and every figure matches a tool response.
