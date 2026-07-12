## 9 · Future Evolution

### 9.1 Evolution A — NGFS-anchored exit haircuts on a real fund book (analytics ladder: rung 2 → 3)

**What.** The exit-adjustment formula is real but heuristic: `haircutFrac = anchor[scenario] × (transFlag ? 2 : 1) × (1 − climateScore/100)` with synthetic anchors (0.03/0.08/0.15), applied to 10 hand-authored funds and 50 `_sr()`-seeded portfolio companies; §7.1 also notes the DD checklist displays per-item weights (6–10) but aggregates an unweighted count, and the code uses revenue×multiple rather than the guide's EBITDA basis. Evolution A replaces the scenario anchors with sector-differentiated haircuts derived from the platform's NGFS scenario assets, moves the calculation to a backend, and persists a real fund/PortCo register.

**How.** (1) New `api/v1/routes/private_assets_transition.py` with `POST /exit-adjustment` — haircut = f(sector transition pathway under the chosen NGFS scenario at exit year, company climate score), replacing the flat ×2 transition-flag multiplier with the sector's scenario-implied value-at-risk band; document the derivation per Atlas §8 convention. (2) Tables `pe_funds` / `pe_portfolio_companies` (org-scoped, `portfolios_pg` pattern) so LP look-through aggregates a user's actual book instead of `PE_FUNDS`. (3) Fix the DD aggregation to the weighted score the UI already implies: `Σ(done_i × w_i)/Σw_i`, and align the EV basis (EBITDA input field, revenue fallback flagged).

**Prerequisites.** NGFS sector pathway mapping for the 10 `SECTORS`; the guide's EBITDA claim corrected or implemented. **Acceptance:** bench case where an Energy PortCo's haircut exceeds a Software PortCo's under disorderly-2030 by the documented sector spread; weighted DD score changes when a weight-10 item toggles, unlike today.

### 9.2 Evolution B — Deal-screening copilot for the DD checklist (LLM tier 1 → 2)

**What.** The 20-item ILPA-derived checklist is the natural LLM surface: a copilot that takes a deal description (or uploaded CIM text) and pre-populates checklist assessments — "target discloses Scope 1/2 but no transition plan: items 4, 9 provisionally satisfied, items 12–14 open" — each suggestion citing the checklist item and the source passage, with the analyst confirming every tick (the copilot proposes, never completes DD).

**How.** Tier 1: RAG over this Atlas record plus the checklist items and ILPA/iCI/GRESB-PE reference texts already named in §5, served via `POST /api/v1/copilot/private-assets-transition/ask`. Tier 2 upgrade after Evolution A: "what's the exit haircut range for this deal under all three scenarios?" becomes three `POST /exit-adjustment` tool calls, and "summarize LP look-through for our energy exposure" reads the persisted fund book. Fabrication guardrail: portfolio numbers only from tool outputs; checklist suggestions always marked provisional.

**Prerequisites.** Document-upload path for CIM text (the platform's uploads route exists); Evolution A for any quantitative tool-calling. **Acceptance:** every checklist suggestion cites a specific passage; the copilot refuses to output an exit haircut before Evolution A endpoints exist.
