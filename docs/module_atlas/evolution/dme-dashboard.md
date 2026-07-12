## 9 · Future Evolution

### 9.1 Evolution A — Make the dashboard read the DME engines it fronts (analytics ladder: rung 1 → 2)

**What.** The §7 flag calls it precisely: this is "a credit-risk dashboard dressed as a materiality dashboard." The guide's Platform Materiality Score (`PMS = Σ topic·weight / Σweight` over 78 topics) doesn't exist; instead 40 synthetic corporates get a seeded Merton-plus-exponential PD consensus, VaR/CVaR, WACC, and a composite "DMI" — competent formulas over fabricated inputs (`pdBase = 0.01 + s(3)·0.12`, `assetV = 500 + s(11)·4500`). Meanwhile the real DME backends this dashboard should front — `dme_alert_engine`, `dme_contagion_engine`, `dme-pd-engine`, `dme-index` — sit uncalled. Evolution A rewires the dashboard as a thin aggregation layer over those engines.

**How.** (1) New `GET /api/v1/dme/dashboard-summary` endpoint aggregating: alert counts from the dme-alerts archive (its Evolution A), PD outputs from the dme-pd-engine backend, contagion centralities from dme-contagion, and topic materiality scores from dme-index — replacing every `s(k)` draw. (2) Implement the guide's PMS honestly as the weighted topic composite once dme-index persists topic scores; admin-configured weights live in a `dme_topic_weights` table. (3) The in-page Merton machinery either moves server-side under dme-pd-engine (where a real implementation belongs) or is deleted — a dashboard should not own a credit model. (4) The seeded regime transition matrix becomes an observed-frequency matrix over persisted regime history.

**Prerequisites.** Sibling DME modules' persistence layers (score history, alert archive) — the dashboard is downstream of everything. **Acceptance:** every KPI on the page traces to a named engine endpoint in a lineage sweep; deleting the local `sr()` helper breaks nothing.

### 9.2 Evolution B — Board-pack copilot over live engine state (LLM tier 1)

**What.** The stated workflow ends at "export the materiality dashboard snapshot for board reporting or ESRS 2 IRO-1 documentation." A tier-1 copilot makes that snapshot self-explaining: "why did the platform score drop 4 points this month?" answered from the real dashboard-summary payload — which topics moved, which entities drove the alert spike, what the regime shift means — with each claim cited to the aggregated engine outputs and the ESRS 1 Chapter 3 framing from the module's own reference corpus.

**How.** Explanation-only over the `dashboard-summary` response plus this Atlas record embedded per the roadmap's tier-1 pattern (pgvector corpus, per-module system prompt, prompt-cached). No tool-calling needed initially — the payload the page already fetched is the grounding context. The IRO-1 draft assist composes the documented topic scores and weights into ESRS 2 boilerplate through the report-studio layer, with uncomputed fields rendered as explicit gaps.

**Prerequisites (hard).** Evolution A first, without exception — today the copilot would eloquently explain a fabricated PD consensus for 40 real company names, the exact fabrication-narration failure the platform's guardrails exist to prevent. **Acceptance:** every numeric in a copilot answer appears verbatim in the dashboard-summary payload; "what's our Scope 3 materiality score?" refuses when the topic isn't in the scored set rather than inventing one.
