## 7 · Methodology Deep Dive

The `pe_portfolio` domain (`/api/v1/pe-portfolio`) combines two engines: **portfolio-company
ESG KPI monitoring** (`pe_portfolio_monitor.py`) and **ESG value-creation planning**
(`pe_value_creation.py`), with `pe_db_service.py` for persistence. It tracks ILPA ESG KPIs
with traffic-light status and projects exit-value uplift from ESG improvement levers.

### 7.1 What the module computes

**Monitoring:** for each portfolio company, per-KPI YoY change, target attainment and a
green/amber/red traffic light, rolled up to a company and portfolio verdict. **Value
creation:** sector-specific ESG levers with cost/benefit, an implementation timeline, and a
projected exit multiple:

```
exit_multiple = entry_multiple + esg_improvement × 25bps/10000
exit_ev       = (ebitda + Σ ebitda_uplift) × exit_multiple
value_created = exit_ev − entry_ev
```

### 7.2 Parameterisation / scoring rubric

**ILPA KPIs** (`ILPA_KPIS`, 12 metrics) — each with a direction (higher/lower is better) and
ILPA id: Scope 1/2 emissions (GHG-1/2), total energy (E-1), renewable share (E-2), water
(W-1), waste (WS-1/2), board/workforce diversity (D-1/2), injuries/fatalities (S-1/2),
independent board (G-1).

**Traffic-light rules** (`_traffic_light`): with a target, lower-is-better → green ≤target,
amber ≤target·1.2, else red (mirror for higher-is-better with ·0.8); no target but a prior →
trend-based (improve → green, flat → amber, worse → red); neither → amber. **Company overall**
(`_overall_traffic_light`): red if red-share ≥40%, green if green-share ≥60%, else amber.

**Value-creation levers** (`SECTOR_LEVERS`) — per sector, each lever carries a capex range,
annual-savings %, EBITDA-uplift %, and implementation months. Example (Industrials, IND_1
Energy Efficiency Retrofit): capex €0.5-5M, savings 8-20%, EBITDA uplift 2-5%, 18 months.
**Multiple expansion** (`ESG_MULTIPLE_EXPANSION_BPS = 25`): 0.25× per 1.0 ESG-score point.

**Provenance:** ILPA KPI definitions are the real convergence-initiative metrics; lever
cost/benefit ranges are McKinsey/BCG-style expert estimates encoded as constants.

### 7.3 Calculation walkthrough

`monitor_company` loops the 12 ILPA KPIs, computes YoY (`current − prior`, %), on-target
checks by direction, and the traffic light per KPI; counts green/amber/red and derives the
company verdict. `monitor_portfolio` aggregates green/amber/red percentages, best/worst
performers (by green/red count), and ownership-weighted aggregate KPIs. `generate_plan` reads
sector levers, computes mid-point capex/savings/EBITDA per lever (`rev_base·(sav%)`,
`ebitda·(uplift%)`), sums them, builds milestones, then projects exit value from the
score-improvement multiple expansion.

### 7.4 Worked example

Industrials company, EBITDA €20M, entry multiple 8.0×, three sector levers (IND_1/2/3).

- **Lever IND_1 EBITDA uplift:** mid `(2+5)/2 = 3.5%` → `20M·0.035 = €0.70M`.
- Summing three levers' uplifts → say `total_ebitda_uplift = €1.4M`.
- **ESG improvement:** `min(3 levers · 3.0, 20) = 9.0` points.
- **Multiple expansion:** `9.0 · 25 / 10,000 = 0.0225×` → exit multiple `8.0225×`.
- **Exit EV:** `(20 + 1.4) · 8.0225 = 21.4 · 8.0225 = €171.7M`; entry EV `20·8 = €160M` →
  **value created ≈ €11.7M**.

Monitoring: if a company reports 8 green, 2 amber, 2 red of 12 KPIs → green-share `8/12 = 67%
≥ 60%` → **overall GREEN**.

### 7.5 Data provenance & limitations

- Lever cost/benefit ranges and the 25bps multiple-expansion constant are **expert
  estimates**, not company-specific — projections are indicative, not underwriting-grade.
- **No `sr()` PRNG** — all outputs are deterministic functions of supplied KPI values and
  lever definitions. Missing KPIs are simply skipped (not fabricated).
- `rev_base` falls back to `ebitda × 4` when revenue is absent, a rough proxy.
- The multiple-expansion link (ESG score → turns) is a linear heuristic, not an econometric
  estimate of ESG-multiple correlation.

**Framework alignment:** **ILPA ESG Data Convergence Initiative** — the 12 monitored KPIs are
ILPA's standardised metrics with their official metric ids. **UN PRI** — portfolio-company
engagement/monitoring and value-creation planning follow PRI's active-ownership guidance.
**SFDR Art.7** — PAI-relevant KPIs (emissions, diversity, safety) support PAI reporting for
unlisted assets. **GHG Protocol** — Scope 1/2 (and implied Scope 3) emissions tracking aligns
with the corporate standard.
