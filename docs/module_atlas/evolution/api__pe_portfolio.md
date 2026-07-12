## 9 · Future Evolution

### 9.1 Evolution A — Ground the value-creation model and populate KPI history (analytics ladder: rung 2 → 4)

**What.** Two engines: ESG KPI monitoring (`pe_portfolio_monitor.py`) tracks 12 ILPA KPIs with
YoY change and green/amber/red status rolled up to portfolio verdicts, and value-creation
planning (`pe_value_creation.py`) projects exit uplift via `exit_multiple = entry_multiple +
esg_improvement × 25bps/10000`, `value_created = exit_ev − entry_ev`. The value-creation model
has honest shortcuts flagged in §5 — `rev_base = ebitda × 4 # rough estimate`,
`esg_improvement = min(len(levers) × 3.0, 20.0) # ~3 points per lever`, and a fixed
`ESG_MULTIPLE_EXPANSION_BPS`. The KPI store (`pe_portfolio_companies`) is largely db-empty.
Evolution A calibrates the multiple-expansion link and populates history.

**How.** (1) Replace the `~3 points per lever` and fixed multiple-expansion-bps with a
calibration against observed ESG-to-multiple evidence (or clearly label as an assumption set
with a sensitivity range) — the exit-multiple uplift is the model's headline claim and needs
defensibility. (2) Drop the `ebitda × 4` revenue proxy in favour of supplied or sourced
revenue. (3) Add a KPI-trajectory forecast: project whether a company reaches its ESG targets
from its monitored history (rung 4), not just current YoY. (4) Populate `pe_portfolio_companies`
and bench-pin the value-creation arithmetic.

**Prerequisites.** An ESG-multiple calibration source (thin — may stay a documented assumption
with sensitivity); KPI history populated (D1). **Acceptance:** multiple expansion carries
calibration/assumption provenance with a sensitivity range; revenue no longer defaults to
`ebitda × 4` when data exists; KPI trajectories forecast target attainment; bench pins pass.

### 9.2 Evolution B — Portfolio-monitoring and value-creation copilot (LLM tier 2)

**What.** A copilot for deal teams: "how are my portfolio companies tracking on ILPA ESG KPIs?"
(calling `/monitor-portfolio` and citing the traffic-light roll-up), and "build a value-creation
plan for this company" (calling `/value-creation-plan` and narrating the levers, capex, ROI, and
projected exit multiple) — each figure tool-sourced.

**How.** Three POST endpoints plus reference GETs (`/kpi-template` with the 12 ILPA KPIs,
`/sector-levers`) and DB read endpoints (`/db/companies`, `/db/summary`). The ILPA KPI structure
and green/amber/red logic let the copilot explain exactly which metric is red and why; the
value-creation levers drive an actionable plan. What-ifs ("what if we add these two levers?")
re-run statelessly. Pairs with the `pe_deals` copilot across the deal lifecycle.

**Prerequisites.** Evolution A's calibration for credible exit-value narration — presenting the
`~3 points per lever` uplift as a hard projection would overstate; KPI population for portfolio
answers. **Acceptance:** every KPI, traffic-light, and value-creation figure traces to a tool
response; the copilot labels exit-multiple uplift as an assumption-based projection with its
sensitivity; it refuses to present `value_created` as a guaranteed return.
