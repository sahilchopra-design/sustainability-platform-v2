## 9 · Future Evolution

### 9.1 Evolution A — Wire the tier-A engine and compute the Pulse Score (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide defines a Climate Pulse Score (`P = 0.4·PhysRisk + 0.4·TransRisk + 0.2·CarbonIntensity`), but no composite is computed — the dashboard reports five weight-averaged metrics (wITR, WACI, physVaR, transVaR, avgGreenRev) over 150 `sr()`-seeded holdings with scope emissions back-derived from a fixed 30/20/25/25 split. Critically, the real tier-A backend (`portfolio_analytics_engine.py`, a genuine PCAF/WACI engine over `portfolios_pg`, shared by 9 modules with 48-module blast radius) is *not invoked* — the frontend is self-contained synthetic data despite 11 real portfolio-analytics endpoints being available.

**How.** (1) Replace the synthetic 150-holding generator with calls to the real endpoints: `GET /portfolios/{id}/holdings`, `/analytics`, and `/dashboard` — so wITR/WACI/physVaR/transVaR come from the PCAF engine over real `portfolios_pg` holdings (the engine already computes estimated Scope 1 from intensity × revenue per §5's extracted lines, replacing the fixed-split back-derivation). (2) Compute the documented Pulse Score (`0.4·Phys + 0.4·Trans + 0.2·CarbonIntensity`) from those real components. (3) The real-time surveillance/alerting (§1) uses the `/scenarios/compare` endpoint for threshold monitoring. Because this engine is shared by 48 modules, wiring it here compounds across the portfolio family.

**Prerequisites.** The endpoints exist and are Pydantic-typed; REQUIRE_AUTH gates them — exercise under auth. Blast radius is 48 modules via the shared engine — pin regression cases before any engine touch. Remove the frontend `sr()` generator. **Acceptance:** the Pulse Score and five metrics compute from real `portfolios_pg` holdings via the engine; changing a holding moves the score; no `sr()` in the metrics.

### 9.2 Evolution B — Real-time climate-surveillance copilot (LLM tier 2)

**What.** A copilot for the surveillance workflow §1 describes: "what's my portfolio's Pulse Score and which component is deteriorating?", "which holdings drive my physical VaR?", "alert me if WACI crosses the threshold", "root-cause the score drop this week" — executed against the real portfolio-analytics engine, decomposing the Pulse Score into its physical/transition/carbon terms and per-holding contributions.

**How.** Tool calls to the 11 portfolio-analytics endpoints (mostly read GETs plus `/scenarios/compare`); system prompt from this Atlas page's §5 Pulse-Score formula and the TCFD/NGFS references named in §5. The root-cause drill-down (§1) is a per-holding contribution query; alerting maps threshold breaches to the real metric values. Fabrication validator matches every score/VaR/WACI to a tool response; because this engine feeds 48 modules, the copilot is a natural tier-3 hub for portfolio-level climate questions. Mutating actions (creating portfolios, adding holdings via POST/PATCH/DELETE) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — the copilot must call the real engine, not narrate the current seeded 150-holding book; the auth blocker on the endpoints must be resolved. **Acceptance:** every metric traces to an endpoint call over real holdings; the Pulse-Score decomposition sums correctly; write actions require confirmation and RBAC.
