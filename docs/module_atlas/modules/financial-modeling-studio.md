# Financial Modeling Studio
**Module ID:** `financial-modeling-studio` · **Route:** `/financial-modeling-studio` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Chip`, `DRIVERS`, `DRIVER_LABELS`, `Field`, `Kpi`, `Num`, `Panel`, `SLL_DEFAULT`, `SOLVE_METRICS`, `STREAM_COLORS`, `STREAM_LABELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;` |
| `fmtNum` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |
| `fmtPct` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `${(Number(v) * 100).toFixed(d)}%`;` |
| `lerp` | `(a, b) => Math.round(a + (b - a) * x);` |
| `assets` | `portAssets.map((a) => (` |
| `name` | `scenName.trim() \|\| `Scenario ${scenarios.length + 1}`;` |
| `revChart` | `useMemo(() => (viewRes ? viewRes.periods.map((p) => ({` |
| `dscrChart` | `useMemo(() => (viewRes ? viewRes.periods.map((p) => ({` |
| `row` | `{ period: t + 1 };` |
| `vals` | `sens.data.grid.cells.flat().map((c) => c.equity_irr).filter((v) => v != null);` |
| `data` | `h ? h.counts.map((c, i) => ({ bin: fmt((h.bin_edges[i] + h.bin_edges[i + 1]) / 2), count: c })) : [];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/financial-model/run` | `run_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/scenario-matrix` | `scenario_matrix_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/sensitivity` | `sensitivity_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/simulate` | `simulate_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/solve` | `solve_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/solve-frontier` | `solve_frontier_endpoint` | api/v1/routes/financial_model_engine.py |
| POST | `/api/v1/financial-model/consolidate` | `consolidate_endpoint` | api/v1/routes/financial_model_engine.py |
| GET | `/api/v1/financial-model/ref/templates` | `templates_endpoint` | api/v1/routes/financial_model_engine.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `COD` *(shared)*, `MRA`, `THE`, `__future__` *(shared)*, `api` *(shared)*, `asset`, `cash` *(shared)*, `climate`, `data` *(shared)*, `fastapi` *(shared)*, `lifetime`, `merchant`, `mezz`, `proceeds`, `pydantic` *(shared)*, `revenue`, `senior`, `target_start`, `that` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DRIVERS`, `SCEN_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **21** other module(s).

| Connected module | Shared via |
|---|---|
| `project-finance-debt-sizer` | table:COD, table:year |
| `credit-spread-climate-monitor` | table:api, table:that |
| `tax-equity-transferability` | table:cash, table:year |
| `module-navigator` | table:api |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `reference-data-explorer` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |
| `portfolio-dashboard` | table:api |

## 7 · Methodology Deep Dive

> ⚠️ **Docstring↔code mismatch (LLCR/PLCR).** The route's own module docstring (§6 RETURN
> METRICS) states `LLCR_t = PV(CFADS, s=t..last debt period)/total debt balance at start of t`
> and `PLCR_t = PV(CFADS, s=t..Y)/debt balance`, i.e. a **per-period time series**. The actual
> code (`_evaluate`, lines ~1449-1456) computes `llcr`/`plcr` as **one scalar each**, evaluated
> once at COD (`debt_open_1 = sum(tr_bal_con)`, discounted at the senior tranche's year-1 rate
> only) — there is no `llcr_t` array anywhere in the response. `/run`, `/scenario-matrix` and the
> solver/frontier tools all consume this single COD-vintage figure. This is not a bug (a scalar
> LLCR at financial close is a standard bankability metric), but the subscript-*t* notation in the
> docstring overstates what is actually computed — the sections below document the code (a single
> LLCR/PLCR at COD), not a per-period series.

### 7.1 What the module computes — engine map

`financial-modeling-studio` (NX2-16) is the platform's flagship and largest module: one
2,425-line backend route (`backend/api/v1/routes/financial_model_engine.py`, 8 endpoints, no
PRNG — the docstring states this explicitly and `check_no_fabricated_random.py` gates it in CI)
fronted by a 2,110-line, 9-tab React page that renders engine output only ("no financial math in
the browser beyond display formatting" — the page's own closing footnote). It is a full
project/IPP financial model computed server-side: construction S-curve funding with IDC
capitalization resolved by fixed-point iteration, period-by-period cash waterfall with DSRA/MRA
mechanics and a distribution lock-up trap, MACRS/loss-carryforward tax, three-statement output
asserted to balance to 1e-6, XIRR-style equity/project IRR, LLCR/PLCR, an NGFS-scenario climate
layer that runs through the *same* waterfall (not a parallel simplified model), refinancing,
inflation/real-IRR, working capital, a sustainability-linked margin ratchet, a PCAF-ready
sustainability analytics block, portfolio consolidation with HoldCo structural subordination, and
a solver/frontier/QMC toolkit.

| Endpoint | Frontend tab(s) | What it does |
|---|---|---|
| `GET /ref/templates` | Setup | 3 hand-authored illustrative templates (100 MW solar, 400 MWh BESS, 50 MW wind+carbon) |
| `POST /run` | Setup, Statements, Climate, Refi, Sustainability | Full model: sizing, construction, operations, waterfall, statements, metrics, covenants; optional climate case + no-climate baseline + `climate_impact` deltas; optional refinancing with/without comparison; always carries the sustainability block |
| `POST /scenario-matrix` | Climate & Scenarios | Reruns the FULL model once per NGFS Phase 5 scenario (+ user custom carbon/GDP paths) + a no-climate baseline row |
| `POST /consolidate` | Portfolio | 2–5 assets run through the full model, consolidated (ΣCFADS/ΣDS portfolio DSCR, diversification proxy, HoldCo debt layer) |
| `POST /sensitivity` | Sensitivity | 1D/2D multiplier grid + ±x% one-at-a-time tornado on 8 drivers |
| `POST /simulate` | Risk (QMC) | Deterministic Halton low-discrepancy QMC — no PRNG |
| `POST /solve` | Solver | Bisection goal-seek on 6 instruments × 4 target metrics (+ discrete refi-year scan) |
| `POST /solve-frontier` | Solver | Grid-scan (gearing) × bisection (PPA price) iso-metric frontier |

Every dollar figure is in $M unless a field name says otherwise; every hand-authored default
(templates, IDC/DSRA circularity tolerance, Halton bases/skip, MACRS Table A-1) is either
IRS-sourced or explicitly labeled illustrative in the code/docstring.

### 7.2 Parameterisation — input surface

The `ModelInputs` Pydantic tree (lines 383–593) has 20+ nested config blocks; the load-bearing
ones for this deep-dive:

| Block | Key fields | Defaults / basis |
|---|---|---|
| `TimelineConfig` | construction_months, operations_years, periods_per_year | 18mo / 25yr; `periods_per_year` is a scaling knob, annual is the only implemented periodicity |
| `CapexConfig` | total_capex_musd, drawdown_curve, logistic_steepness | logistic S-curve default, k=8 |
| `GenerationConfig` | capacity_mw, P50/P90/P99 CF, degradation_pct_yr | P50=24% (illustrative solar) |
| `RevenueConfig` | ppa/merchant/capacity/rec/carbon sub-streams | each independently enable/escalate/tenor |
| `DebtTranche` (≤2) | sizing (gearing\|amount), amort_type (sculpted\|annuity\|bullet), rate_type (fixed\|floating), swap_notional_pct, dsra_months, `sll` | senior default: gearing 70%, sculpted, target DSCR 1.30, fixed 5.5% |
| `TaxConfig` | rate_pct, depreciation (straight_line\|macrs), sl_years | 25% rate; MACRS = IRS Pub 946 Table A-1, real table |
| `CovenantConfig` | lockup_dscr, default_dscr | 1.15 / 1.05 |
| `ClimateConfig` | enabled, start_year, `transition`, `physical` | disabled by default; NGFS Phase 5 seeded extract when enabled |
| `RefinancingConfig`, `WorkingCapitalConfig`, `InflationConfig`, `SustainabilityConfig` | — | all optional, all off by default |

Templates (`_template_solar/_bess/_wind_carbon`) are labeled "plausible 2026 US-market figures,
NOT market quotes" in the code comment directly above them.

### 7.3 Construction phase & IDC circularity — the fixed-point loop

Monthly capex drawdown weights (`_scurve_weights`, linear = `1/M`; logistic =
`[F(m/M)−F((m−1)/M)]/[F(1)−F(0)]`, `F(x)=1/(1+e^{−k(x−0.5)})`) allocate `total_capex` across the
construction months. Each month, funding need = `capex_draw_m + IDC_m` is split debt/equity at the
**overall gearing g** (debt sizes ÷ total funded cost), drawn pro-rata across tranches by size
share. IDC accrues on the tranche's *construction-period* rate against its balance drawn so far:
`IDC_m = Σ_tr B_{tr,m−1}·r_tr/12`.

The circularity (docstring §2, code `_solve_fixed_point`, lines 1592–1620): debt sizing needs
`C_total = capex + IDC_total + DSRA_0`, but `IDC_total` depends on how much debt is drawn (which
depends on `C_total`), and `DSRA_0` (`= dsra_months/12 × year-1 DS`) depends on year-1 debt service
(which depends on the opening balance, which includes IDC and DSRA_0). This is resolved by
iterating the whole `_evaluate()` pass on state vector `(IDC_total, DSRA_0 per tranche, DS arrays)`
until `‖Δ‖_∞ < 1e-6` or 50 iterations; the response reports `convergence.{iterations, converged,
residual}`.

**Worked example — IDC fixed-point convergence.** A minimal 2-month construction case that
isolates the mechanism (chosen so the debt/equity split itself must move iteration-to-iteration —
see the callout below):

- `total_capex = $10.0M`, linear drawdown (`w = [0.5, 0.5]`)
- Single tranche, **sizing = "amount"**, `amount_musd = 7.0`, fixed rate 6%/yr (monthly 0.5%)
- `dsra_months = 0` ⇒ `DSRA_0 ≡ 0` every iteration, isolating the IDC-only loop

*Why "amount" sizing, not "gearing":* with a single **gearing-%** tranche, `g = debt/C_total` is
scale-invariant (a fixed % of whatever `C_total` turns out to be), so the construction pass would
be bit-identical every iteration and the loop would converge in one extra evaluation. With a fixed
`$` amount tranche, `g = 7.0/C_total` genuinely shrinks as `C_total` grows with capitalized IDC —
this is the real, code-verifiable source of the circularity for that tranche type.

| Iter *k* | `idc_in` | `C_total = 10+idc_in` | `g = 7.0/C_total` | Month-1 draw (idc=0, debt=g·5.0) | Month-2 IDC (`0.5%×bal`) | `idc_out` (=Σ IDC) | Residual |
|---|---|---|---|---|---|---|---|
| 0 | 0.000000 | 10.000000 | 0.700000 | 3.500000 | 3.5×0.005=0.017500 | **0.017500** | 0.017500 |
| 1 | 0.017500 | 10.017500 | 0.698777 | 3.493885 | 3.493885×0.005=0.017469 | **0.017469** | 0.0000306 |
| 2 | 0.017469 | 10.017469 | ≈0.698775 | ≈3.493877 | ≈0.017469 | ≈0.017469 | ≈1e-6 |

Detail on iteration 1: `g_1 = 7.0/10.0175 = 0.698777`. Month 1: `debt_draw = 0.698777×5.0 =
3.493885` (opening balance 0 ⇒ no IDC in month 1). Month 2: `IDC_2 = 3.493885×0.005 = 0.0174694`;
`fund_need_2 = 5.0 + 0.0174694 = 5.0174694`; `debt_draw_2 = 0.698777×5.0174694 = 3.506090`; ending
balance `≈ 3.493885+3.506090 = 6.999975 ≈ 7.0` (Σdebt draws = `g×(capex+IDC) = g×C_total = debt_total`
always, up to rounding — a useful self-check). `idc_out_1 = 0 + 0.0174694 = 0.0174694`.

The residual falls **~572×** from iteration 0→1 (0.0175 → 0.0000306); by the code's actual
convergence criterion (`FP_TOL = 1e-6`, `FP_MAX_ITERS = 50`) this geometrically-shrinking series
crosses tolerance within 2–3 further iterations — well inside the 50-iteration ceiling. This
matches the pattern the engine reports on real (much larger, DSRA-bearing) deals: single-digit
iteration counts, not dozens.

### 7.4 Debt sculpting across tranche types

Per period *t*, per tranche (senior = tranche 0, evaluated first so `cfads_avail` is depleted
before mezz sees it):

```
sculpted:  ds_target_t = max(cfads_avail_t, 0) / target_DSCR
           prin_t = clamp(ds_target_t − Int_t, 0, B_{t−1});  at t ≥ tenor: prin_t = B_{t−1} (balloon)
           DS_t = Int_t + prin_t
annuity:   A = B_0·r_1/(1−(1+r_1)^−n)               (computed at COD, year-1 rate)
           prin_t = clamp(A − Int_t, 0, B_{t−1});  at t = tenor: prin_t = B_{t−1}
bullet:    prin_t = 0 until t = tenor, then prin_t = B_{t−1}
```

**Worked example — one sculpted period.** `CFADS_t = $18.2M`, `target_DSCR = 1.30`, opening senior
balance `B = $150.0M`, effective rate `r = 6.00%/yr`:

| Step | Formula | Result |
|---|---|---|
| Interest | `Int_t = B × r = 150.0 × 0.06` | **$9.00M** |
| DS target | `ds_target = CFADS_t / target = 18.2 / 1.30` | **$14.00M** |
| Principal | `prin = clamp(14.00 − 9.00, 0, 150.0)` | **$5.00M** (unclamped) |
| Debt service | `DS_t = Int_t + prin` | **$14.00M** |
| Realized DSCR | `CFADS_t / DS_t = 18.2 / 14.00` | **1.30×** — exactly the target |
| New balance | `B − prin = 150.0 − 5.0` | **$145.0M** |

This is the general property of sculpted amortization whenever the unclamped principal is
between 0 and `B`: **the realized DSCR equals the target DSCR exactly**, by algebraic
construction (`DS_t = ds_target = CFADS_t/target ⇒ CFADS_t/DS_t = target`) — the code doesn't
"tune toward" the target, it *is* the target every non-edge period. See §7.9's climate example
and the edge-case note below for why this matters for reading covenant results.

### 7.5 Cash waterfall & the distribution lock-up trap

Executed period-by-period in strict priority (docstring §4, code lines ~1276–1342): Revenue →
Opex → Tax → MRA funding (→ CFADS) → senior DS (shortfall drawn from senior DSRA; unpaid balance
recorded as a `payment_default` and — beyond what DSRA absorbs — **capitalized onto the
tranche balance**, `prin_eff = prin − unpaid`, so the balance sheet stays exact) → senior DSRA
top-up/release to `dsra_months/12 × next-period DS` (the *documented* DSRA circularity — it uses
the previous fixed-point iterate) → mezz DS/DSRA (same rule) → cash sweep (`sweep_pct%` of
remaining cash prepays senior principal) → **distribution lock-up test**: if `senior_DSCR_t <
lockup_dscr`, all remaining cash is added to `trapped` (shown on the balance sheet, not
distributed); once the test passes again the trapped balance releases into that period's
distribution. If a period is so cash-negative that `trapped` itself would go negative, the code
allows a negative `dist` — an explicit equity make-whole rather than fabricating cash from
nowhere. Final operating period: DSRA + MRA + trapped release, any residual tranche balance is
force-retired (`prin_tr[i] += tr_bal[i]`), and this hits `distribution` as `terminal_release`.

Covenant reporting: `lockup_periods` (DSCR < lockup), `default_test_breach_periods` (DSCR <
`default_dscr`, a *reporting* test — does not itself halt distributions), and `payment_defaults`
(DS genuinely unpayable after DSRA draw — the only "hard" default in the model).

### 7.6 Tax: MACRS and the real loss-carryforward ledger

```
taxable_t = EBITDA_t − Dep_t − Interest_t − MajorMaintenance_t
if taxable_t < 0:  clf += −taxable_t;  tax_t = 0
else:              used = min(clf, taxable_t);  clf −= used;  tax_t = tax_rate × (taxable_t − used)
```
`Dep_t` is either straight-line (`(capex+IDC)/sl_years`) or **MACRS 5-year, half-year convention**
— `MACRS_5YR = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576]`, the real IRS Publication 946 Table
A-1 schedule (a genuine external constant, not a synthetic placeholder). Major maintenance is
tax-deductible in its event year even though it is *cash-funded from the MRA balance* rather than
CFADS — the docstring is explicit that this decoupling (deductible ≠ CFADS-reducing) is
intentional: `maint` reduces `taxable` but `MRA_contribution` (not `maint` itself) is what reduces
`CFADS_t = EBITDA_t − tax_t − MRA_contribution_t − ΔWC_t`.

### 7.7 Three-statement view

Income statement, cash-flow statement and balance sheet are all populated from the *same* period
loop (no separate reconciliation pass). The balance-sheet identity is asserted every period:
`Assets (PP&E net + DSRA + MRA + trapped + AR) = Liabilities+Equity (debt by tranche + AP +
paid-in equity + retained earnings)`, and the maximum absolute gap across all periods is returned
as `max_balance_sheet_gap_musd` with a boolean `balance_sheet_ok = gap < 1e-6`. Net income
includes the refinancing fee as a **non-deductible** expense line (§7.10) and PP&E net excludes
DSRA (cash, not a depreciable asset) — both explicit, code-verifiable modeling choices.

### 7.8 Return metrics: XIRR solver, LLCR/PLCR, payback

**IRR solver** (`_irr`, lines 759–789): Newton's method from `r₀ = 8%`,
`f(r) = Σcf_i(1+r)^{−t_i}`, analytic `f'(r) = Σ−t_i·cf_i(1+r)^{−t_i−1}`; falls back to bisection
on `[−0.95, 10]` (200 halvings) if Newton leaves the sane bracket, oscillates, or fails to
converge in 60 steps. No `scipy` dependency. Equity flows sit on an **irregular time grid**:
monthly construction draws at `t=(m−M)/12` (negative years before COD), then annual distributions
at `t=1..Y` — a true XIRR-style solve, not an annual-only approximation. Project (unlevered) IRR
reuses the same solver on `−capex_draw + (EBITDA−tax)` flows, with the tax figure being the
*levered* tax — a documented approximation (an unlevered tax recompute is not performed).

**LLCR/PLCR** (see the ⚠️ callout above): one scalar each, `PV(CFADS) / debt balance at COD`,
discounted at the **senior tranche's year-1 effective rate** over `min(last_debt_year, Y)` periods
for LLCR and all `Y` periods for PLCR, where `last_debt_year = max` tenor across tranches (not
necessarily the senior's own tenor).

**Payback**: first operating year where cumulative distributions ≥ total equity invested.

### 7.9 Climate integration layer — same waterfall, same statements

When `climate.enabled`, transition and physical channels are precomputed once per model run
(`_build_climate_arrays`) and feed directly into the *same* revenue/opex/volume lines the
non-climate engine uses — there is no separate "climate model."

**Transition channels:**
```
CP(y) = CP_k + (CP_{k+1}−CP_k)·(y−y_k)/(y_{k+1}−y_k)          [NGFS 5-yr steps → annual, linear interp, clamped flat outside range]
CarbonCost_t = (E_t·EI + FE) × CP_t / 1e6                       [own-emissions opex line]
Uplift_t     = CP_t × grid_marginal_intensity × passthrough%   [$/MWh, additive to merchant price, BEFORE capture]
GDPfactor_t  = 1 + gdp_beta_merchant × GDPimpact_t/100          [multiplies merchant price]
```
**Physical channels:** chronic derate compounds on top of technical degradation
(`E_t ×= (1−chronic_derate%)^t`); acute EAL and insurance-escalation increment are explicit opex
lines; downtime is a flat `(1 − days/365)` volume haircut.

**Worked example — NGFS Net Zero 2050, one operating year.** Simplified single-stream project to
keep every step hand-checkable (isolating the climate channels from debt/tax, which are additive
elsewhere in the model): 10 MW, P50 CF 30% (`d=0`, no debt/tax/other-opex in this trace), merchant
only at $50/MWh flat, capture 90%; `climate.start_year=2027`, `ngfs_scenario="net_zero_2050"`,
`ngfs_region="World"`; own emissions `EI=0.02 tCO2e/MWh`, `merchant_passthrough_pct=50%`,
`grid_marginal_intensity=0.35 t/MWh` (default), `gdp_beta_merchant=0.3`.

From the platform's seeded NGFS Phase 5 extract (`backend/data/ngfs_phase5_extract.json`,
`net_zero_2050/World`, years `[2025,2030,…]`, `carbon_price=[45,160,…]`,
`gdp_impact_pct=[−0.6,−1.8,…]`), operating year 1 → calendar year 2027, interpolation weight
`w=(2027−2025)/(2030−2025)=0.4`:
```
CP(2027)  = 45 + (160−45)×0.4  = 45 + 46.0   = 91.00 $/tCO2
GDP(2027) = −0.6 + (−1.8−(−0.6))×0.4 = −0.6 − 0.48 = −1.08 %
```

| Step | Formula | Result |
|---|---|---|
| Energy (year 1) | `E_1 = 10 × 0.30 × 8760` | 26,280 MWh |
| Merchant uplift | `CP × grid_intensity × passthrough% = 91×0.35×0.50` | $15.925/MWh |
| GDP factor | `1 + 0.3×(−1.08)/100` | 0.99676 |
| Climate merchant price | `(50 + 15.925) × 0.99676` | $65.7114/MWh |
| **Baseline** merchant revenue | `26,280 × 50 × 0.90 / 1e6` | **$1.18260M** |
| **Climate** merchant revenue | `26,280 × 65.7114 × 0.90 / 1e6` | **$1.55421M** |
| Carbon-cost opex | `(26,280×0.02) × 91 / 1e6` | $0.04783M |
| **Climate EBITDA** | `1.55421 − 0.04783` | **$1.50638M** |
| **Baseline EBITDA** | `1.18260 − 0` | **$1.18260M** |
| Δ EBITDA | `1.50638 − 1.18260` | **+$0.32378M (+27.4%)** |

For this modest-emitting asset, the transition scenario is a **net revenue tailwind**: the
carbon-price pass-through into merchant power (`uplift_rev`, a labeled attribution line reported
alongside `revenue_merchant`, not additive to it) outweighs both the project's own small
carbon-cost opex line and the mild GDP-linked demand drag. This is the opposite of the intuitive
"climate scenarios are bad for revenue" prior, and is exactly the kind of result the
`climate_impact` decomposition (per-year deltas + explicit channel lines) is built to surface —
the sign and magnitude of the net effect depends entirely on the asset's own emissions intensity
vs. its exposure to the merchant pass-through channel.

**Covenant read-through — a genuinely important edge case.** With CFADS+27% here, what happens to
senior DSCR depends entirely on the tranche's `amort_type` (§7.4): under the **default sculpted**
amortization, `DS_t = CFADS_t/target` moves *with* CFADS, so senior DSCR stays pinned at the
target — climate stress (or tailwind) shows up as a **change in principal repayment speed /
balloon size, LLCR, equity IRR and distributions**, not in the per-period DSCR number. Under
**annuity or bullet** amortization, `DS_t` is fixed regardless of CFADS, so DSCR *does* move
directly with the climate delta. `/scenario-matrix`'s "first lock-up year" and DSCR-path columns
are therefore only informative for non-sculpted (or already-clamped/balloon-year) tranches — for
a sculpted senior in steady state, expect a flat DSCR line across every NGFS scenario and look at
LLCR/equity IRR/balloon size instead.

`/scenario-matrix` reruns this exact mechanism once per NGFS scenario (5 scenarios in the extract:
Net Zero 2050, Below 2°C, Delayed Transition, NDCs, Current Policies, plus Fragmented World not
default-listed but selectable) plus user-designed custom carbon/GDP paths, holding every other
input constant, and reports equity IRR, min/avg DSCR, LLCR, PLCR, distributions PV, first
lock-up/default breach period+year, payment-default count, the full DSCR path, and a per-scenario
sustainability block (cumulative emissions, carbon-cost PV, carbon-adjusted IRR).

### 7.10 Refinancing events

At the **end** of operating year `N` (`refinancing.year`), after that year's scheduled DS, DSRA
true-up and cash sweep but **before** the lock-up test (so refi proceeds flow through the
covenant test like any other cash — "covenant continuity"): `NewDebt = new_gearing%×C_total`
(gearing-up) or `= B_out` (rate/tenor-only refi if `new_gearing_pct` is null); `Fee =
fees%×NewDebt` (expensed in year N, **not tax-deductible** — a documented conservative
simplification); `CashOut = NewDebt − B_out − Fee` flows to equity (negative = injection). From
year `N+1` the senior tranche pays `new_rate_pct` and amortizes over `new_tenor_years` (annuity or
sculpted, per `new_amort_type`); DSRA/lock-up/default tests continue unchanged on the new
schedule. `/run` reports `refinancing`: with-refi vs. a **full no-refi rerun** through the
identical code path, with equity IRR/NPV/min-DSCR/LLCR/payback deltas.

### 7.11 Sustainability-linked margin ratchet (SLL)

Per-tranche, KPI computed from **the model's own data** (not an external ESG score):
`emissions_intensity_actual,t = (E_t·EI + FE)/E_t` or `renewable_share = generation.renewable_share_pct`.
Target path is linear from `target_start` (year 1) to `target_end` (year Y). Each period, the
margin steps `+step_up_bp` if the KPI is worse than target, `−step_down_bp` otherwise:
`Int_t = B_{t−1} × (r_base,t + adj_bp,t/10000)`. The ratchet is an **add-on to interest only** —
for annuity tranches the principal schedule keeps the *base-rate* annuity split
(`prin = A − base_int`, not `A − adjusted_int`), so a step-up mechanically raises `DS_t` (and
therefore lowers DSCR) rather than silently reshuffling the amortization curve. This interacts
with the sculpted-DSCR-invariance point above: for a **sculpted** tranche the SLL ratchet still
raises `DS_t` proportionally with the higher interest charge inside `ds_target`'s numerator
(CFADS is unaffected by the ratchet itself, only by its own KPI drivers), so DSCR again reverts
toward target rather than dropping — the ratchet bites hardest on annuity/bullet tranches.

### 7.12 Inflation & real/nominal view

Cumulative index `I_t = Π_{s≤t}(1+π_s)` from a flat rate or a per-year curve (last value held
flat). In `mode="real_inputs"`, merchant price, capacity payment, fixed/variable opex and land
lease are indexed by `I_t` **on top of** their own (now-real) escalators; PPA, REC and carbon
prices stay contractual nominal (their own escalator only) — an explicit, documented convention,
not an oversight. A real (deflated) equity IRR is reported alongside nominal whenever inflation is
enabled: `real_IRR = IRR(CF_t/I_t)` (construction flows undeflated, `I=1` there); under positive
inflation this is always ≤ nominal IRR, a basic Fisher-relation sanity check the response
implicitly satisfies.

### 7.13 Working capital

`AR_t = max(Revenue_t,0)×receivable_days/365`, `AP_t = max(Opex_t,0)×payable_days/365`,
`ΔWC_t = (AR_t−AP_t) − (AR_{t−1}−AP_{t−1})`, and `CFADS_t` is reduced by `ΔWC_t` (a WC build
consumes cash). **Terminal unwind**: `AR_Y = AP_Y = 0` by construction (the code special-cases
`t == Y`), so the final year's `ΔWC` releases the entire net working-capital position back to
cash — the balance-sheet identity holds through this unwind exactly as it does every other period.

### 7.14 Sustainability analytics block (always computed) & PCAF

Independent of whether `climate` is enabled, every `/run` carries: own emissions `Em_t = E_t·EI +
FE`; avoided emissions vs. a user grid baseline `Avoided_t = E_t·GB − Em_t`; **carbon-adjusted
equity IRR** — the equity cash-flow vector minus `Em_t × shadow_price/1e6`, explicitly labeled "an
ANALYTICAL adjustment, not a project cash flow"; and PCAF Global Standard attribution:
`attribution_factor_t = outstanding_debt_t / total_funded_cost_at_COD`,
`financed_emissions_debt_t = attribution_factor_t × Em_t`,
`financed_emissions_equity_t = (equity/total_funded_cost) × Em_t`. Both `shadow_carbon_price` and
`grid_baseline_intensity` are user-input assumptions, labeled as such in the response's `labels`
dict — not calibrated to any external carbon market.

### 7.15 Portfolio consolidation & HoldCo structural subordination

`/consolidate` runs each of 2–5 assets through the **full** single-asset model (own fixed-point
solve, own waterfall), then combines on a common period axis (shorter assets pad with 0). Portfolio
DSCR is the **mediant** `Σ CFADS_t / Σ DS_t` — algebraically always between the min and max
constituent DSCR each period (a standard property of ratios-of-sums vs. sums-of-ratios), which the
response verifies isn't violated by also reporting `constituent_dscr_min/max` alongside it.

**Diversification (documented proxy, not a covariance estimate):** lifetime revenue-mix vectors
over (PPA, merchant, capacity, REC, carbon) per asset; pairwise cosine similarity `ρ_ab =
cos(mix_a, mix_b)`; CFADS-share-weighted mean `ρ̄`; `diversification_score = 1 − ρ̄` (0 =
identical mixes, →1 = disjoint). The code's own `diversification.method` string states this
explicitly: "NOT an estimated covariance — a stated structural proxy."

**HoldCo layer (structural subordination):** HoldCo debt is serviced **only** from
`UpstreamCF_t = Σ_assets distributions_t` — never from any asset's CFADS directly. Standard
annuity schedule on `debt_musd`/`rate_pct`/`tenor_years`; `HoldCo_DSCR_t = UpstreamCF_t/DS_t`;
lock-up breaches and payment shortfalls (`UpstreamCF_t < DS_t`) reported separately from the
asset-level covenant tests. HoldCo equity IRR aggregates all assets' equity draws (**COD-aligned**
— every asset is assumed to reach COD simultaneously, a documented simplification when template
assets have different construction periods), adds HoldCo debt proceeds at COD, then nets
`UpstreamCF_t − HoldCo_DS_t` per year.

### 7.16 Solver, frontier & QMC toolkit

**`/solve`** — bisection goal-seek on a driver multiplier `m`: `f(m) = metric(model×m) − target`,
bracket `[0.3, 3.0]` (auto-expanded once to `[0.1, 6.0]` if not straddled), halved until
`|hi−lo| < 1e-6` or 80 iterations; an undefined metric (e.g. IRR never turns positive) is treated
as `−1e9` for bracketing purposes. `refi_year` is handled separately as a **discrete exhaustive
scan** over feasible operating years `1..Y−1` (continuous bisection doesn't apply to an integer
year), picking the year whose achieved metric is closest to target.

**`/solve-frontier`** — grid-scan `gearing_pct` over `[gearing_min, gearing_max]` (`gearing_steps`
points); at each gearing level, bisect the **PPA-price multiplier** in `[0.2, 5.0]` (tol `1e-7` on
the metric / `1e-6` on the bracket, ≤60 halvings) to hold the target metric — answering "what PPA
price is required at each gearing to hold equity IRR (or min-DSCR/LLCR/carbon-adjusted-IRR) at the
target?" Points outside the attainable range are returned with `attainable=false` rather than a
spurious extrapolated value.

**`/simulate`** — deterministic quasi-Monte Carlo via a **Halton low-discrepancy sequence**, not a
PRNG (there is no random-number call anywhere in the file). Dimension *j* (one uncertain input)
uses the radical-inverse in prime base `HALTON_BASES[j] = [2,3,5,7,11,13,17,19,23,29][j]`;
scenario *i* uses sequence index `idx = i + HALTON_SKIP + 1` (`HALTON_SKIP=20`, discarding the
correlated start of the sequence). Radical inverse (`_halton`): write `i` in base `b`, reflect the
digits about the radix point — `Σ_k digit_k · b^{-(k+1)}`.

*Worked trace* — first QMC scenario (`i=0 ⇒ idx=21`), base 2, for the default `ppa_price`
uncertain input (triangular, low=0.85, mode=1.00, high=1.10):
```
21 in base 2 (LSB→MSB): 1,0,1,0,1
radical inverse = 1×2⁻¹ + 0×2⁻² + 1×2⁻³ + 0×2⁻⁴ + 1×2⁻⁵ = 0.5+0.125+0.03125 = 0.65625
```
Inverse-CDF map (`_inv_cdf`, triangular branch): `F(mode) = (1.00−0.85)/(1.10−0.85) = 0.60`.
Since `u=0.65625 > 0.60`, use the upper branch:
```
x = b − √[(1−u)(b−a)(b−c)] = 1.10 − √[(1−0.65625)×0.25×0.10]
  = 1.10 − √0.00859375 = 1.10 − 0.092704 = 1.007296
```
So the first Halton scenario samples a PPA-price multiplier of **1.00730×** base — just above the
mode, as expected from a low-discrepancy point landing near the peak of a triangular density.
Percentiles (`p5/p25/p50/p75/p95`) are linear-interpolated order statistics over the resulting
`n_scenarios` IRR/DSCR values; `prob_irr_below_hurdle` and `prob_dscr_below_1` are simple sample
proportions — no distributional assumption beyond what the Halton/inverse-CDF sampling already
encodes.

### 7.17 Frontend companion — 9 tabs, render-only

The 2,110-line React page's own closing comment states it plainly: **"this page renders engine
output only — no financial math in the browser beyond display formatting."** Verified by
inspection: `heatColor`'s `lerp` is a display-only color interpolation, the histogram/percentile
values it charts are the backend's own `histogram.bin_edges/counts` and `p5/p25/…` fields, and
`portChart`/`climDscrChart`/`matrixDscrChart` are straight `.map()` reshapes of the API response
for Recharts — no independent IRR, DSCR, or waterfall computation exists client-side.

| Tab | Endpoint(s) | Content |
|---|---|---|
| Model Setup | `GET /ref/templates`, `POST /run` | Full `ModelInputs` editor; template picker |
| Statements & Waterfall | (uses `/run` result) | Income/cashflow/balance-sheet views; climate-case ↔ no-climate-baseline toggle |
| Climate & Scenarios | `POST /run` (climate config), `POST /scenario-matrix` | Channel parameters; climate-impact-by-channel chart; DSCR baseline-vs-climate chart; scenario-matrix table + DSCR-path chart; custom scenario designer (name + comma-separated carbon/GDP path) |
| Refinancing | (uses `/run` result) | Refi config; with/without comparison |
| Portfolio | `POST /consolidate` | 2–5 assets (template or "current Model Setup inputs"), HoldCo config, combined statements, diversification pairwise table, HoldCo schedule |
| Sustainability | (uses `/run` result) | Own/avoided emissions, carbon-adjusted IRR, PCAF attribution, SLL ratchet summary |
| Sensitivity | `POST /sensitivity` | 1D/2D grid heatmap + tornado bar chart |
| Risk (QMC) | `POST /simulate` | Uncertain-input table, Halton QMC histogram + percentile KPIs |
| Solver | `POST /solve`, `POST /solve-frontier` | Goal-seek KPIs + iso-metric frontier chart/table |

### 7.18 Edge-case rubrics

- **Sculpted DSCR is structurally pinned at target** (§7.4/§7.9) whenever the unclamped principal
  formula applies — climate/sensitivity/scenario stress shows up in balloon size, LLCR, equity
  IRR and distributions, not the per-period DSCR, for the platform's *default* tranche type.
- **Final-tenor balloon overrides the sculpted formula unconditionally**
  (`if t >= tenor_years: prin = B`), which can spike `DS_t` (and crash DSCR) in the terminal debt
  year even if CFADS is healthy — a deliberate "repay whatever's left" safety net, not a bug.
- **Debt-sizing degenerate-case guard**: if `debt_total ≥ 0.98×C_total`, all tranche sizes are
  scaled down to hold `debt_total = 0.95×C_total`, guaranteeing ≥5% equity — prevents a
  divide-by-zero-adjacent all-debt structure.
- **Unpaid debt service capitalizes**, not vanishes: `prin_eff = prin − unpaid`, so a payment
  default increases the *next* period's opening balance rather than silently breaking the
  balance-sheet identity.
- **Refi at/after the final operating year is a no-op** (`if rf_on and rf_year >= Y: rf_on =
  False`) — silently disabled rather than erroring.
- **`refi_year` is the only discrete solver instrument** — `/solve` exhaustively scans years
  `1..Y-1` instead of bisecting, since a fractional year has no meaning.
- **Tornado impact treats an undefined IRR as 0.0** (`abs((irr_hi or 0.0) − (irr_lo or 0.0))`)
  rather than excluding the shock — a stress large enough to wipe out equity returns will
  understate, not overstate, that driver's true tornado bar.

### 7.19 Data provenance & limitations

- **No PRNG anywhere** — QMC uses a deterministic Halton sequence (radical inverse, prime bases);
  same request ⇒ identical scenarios ⇒ identical results, always. This is CI-gated by
  `backend/tools/check_no_fabricated_random.py`.
- **Real external constants**: MACRS 5-year Table A-1 (IRS Pub 946) for depreciation; NGFS Phase 5
  seeded extract (IIASA Scenario Explorer) for carbon-price/GDP-impact paths — the extract's own
  header labels it "approximate/illustrative — refresh from data.ene.iiasa.ac.at/ngfs for
  production precision," and is linearly interpolated from 5-year steps to annual.
  `check_no_fabricated_random.py`-class scrutiny does not extend to the *values* in that extract,
  only to the absence of randomness in how they're used.
- **Hand-authored, labeled defaults**: the 3 illustrative templates ("plausible 2026 US-market
  figures, NOT market quotes"); Halton skip=20 and bases (a standard QMC convention, not
  calibrated); shadow carbon price / grid baseline intensity (user assumptions, labeled in the
  response); diversification proxy (explicitly "NOT an estimated covariance").
- **Documented approximations, stated in the docstring itself**: project (unlevered) IRR uses the
  *levered* tax figure; construction-period floating rate assumes the pay-fixed swap is effective
  only from COD; refi fee is non-tax-deductible in-model; portfolio/HoldCo IRR assumes all assets
  reach COD simultaneously; LLCR/PLCR are single COD-vintage scalars, not per-period series (see
  the ⚠️ callout).
- **Guide/atlas note**: `docs/module_atlas/modules/financial-modeling-studio.md`'s auto-generated
  function-map lists `COD`, `MRA`, `THE`, `__future__`, `api`, `cash`, `climate`, `data`,
  `fastapi`, `lifetime`, `merchant`, `mezz`, `proceeds`, `pydantic`, `revenue`, `senior`,
  `target_start`, `that`, `typing` as "shared database tables" — this is the atlas generator
  parsing Python identifiers/keywords out of the route file, not a real data-lineage relationship
  (the same artifact documented for `ppa-structuring-desk`). No route exists in `moduleGuides.js`
  for this module (unlike `climate-credit-integration`), so there is no separate narrative
  guide-text to cross-check against the code.

**Framework alignment:** IRS Publication 946 Table A-1 (MACRS 5-year, half-year convention) ·
NGFS Phase 5 scenario framework (IIASA Scenario Explorer) · PCAF Global GHG Accounting and
Reporting Standard (project finance, financed emissions) · standard project-finance conventions
(DSCR sculpting, LLCR/PLCR, DSRA/MRA reserve mechanics, cash-waterfall priority of payments,
XIRR) as used across bank/ECA project-finance credit committees.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** A bank-grade, single-asset (and 2–5-asset portfolio) project/IPP
financial model for origination, structuring, and portfolio risk teams: full construction/
operations cash-flow and three-statement build, debt sculpting across tranche types, covenant
testing with a distribution lock-up trap, tax with MACRS/carryforward, XIRR-class return metrics,
an NGFS-scenario climate layer running through the identical waterfall, refinancing, inflation,
working capital, sustainability-linked debt pricing, PCAF-ready emissions accounting, portfolio
consolidation with HoldCo structural subordination, and deterministic sensitivity/QMC/solver
tooling — covering solar, wind, storage, and any single/dual-tranche project-finance structure the
user parameterizes.

**8.2 Conceptual approach.** One evaluation function (`_evaluate`) computes a **complete** forward
pass — construction funding, operations period loop, waterfall, statements, metrics — given a
fixed-point state vector; a wrapper (`_solve_fixed_point`) iterates that state (IDC, DSRA₀, prior
debt-service arrays) to convergence. Every other capability in the module is this same evaluation
function called differently: the climate case is the *same* period loop fed different
revenue/opex/volume primitives (never a parallel simplified model); refinancing splices a new
amortization schedule into the same tranche-service block; sensitivity/QMC/solver all re-invoke
`run_model()` under input multipliers; portfolio mode runs `N` independent full evaluations and
consolidates the outputs; the sustainability block and SLL ratchet are read-throughs of the same
per-period `energy_mwh`/`Em_t` computed once. This "one engine, many callers" architecture is why
the climate/refi/portfolio layers inherit the full statement/covenant machinery for free rather
than needing their own bespoke logic.

**8.3 Mathematical specification.**
```
Construction:
  capex_draw_m = total_capex · w_m                    (w_m: linear 1/M or logistic S-curve)
  IDC_m = Σ_tr B_{tr,m-1}·r_tr/12
  fixed point on (IDC_total, DSRA_0, DS_prev) until ‖Δ‖∞ < 1e-6, ≤50 iters

Operations (period t, senior=tranche0 sculpted default):
  E_t = MW·NCF·8760·(1-d)^(t-1) [× climate volume factor]
  Revenue_t = PPA_t + Merchant_t + Capacity_t + REC_t + Carbon_t   [× climate uplift/GDP/indexation]
  Opex_t = fixed+variable+insurance+lease [+ carbon-cost + acute EAL + insurance-escalation]
  EBITDA_t = Revenue_t - Opex_t
  Dep_t = straight-line or MACRS(IRS Pub 946 Table A-1)
  Int_t = B_{t-1}·(r_base,t + SLL_adj_bp,t/10000)
  taxable_t = EBITDA_t - Dep_t - Int_t - Maint_t;  tax via loss-carryforward ledger
  CFADS_t = EBITDA_t - tax_t - MRA_t - ΔWC_t
  DS_t (sculpted) = CFADS_t/target_DSCR ; (annuity) fixed A; (bullet) interest-only + balloon
  Waterfall: DS → DSRA → sweep → refi(year N) → lock-up test → distribution
  BS: Assets = PP&E_net+DSRA+MRA+trapped+AR ≡ Debt+AP+Equity+RE  (assert |Δ|<1e-6)

Returns:
  Equity IRR: Newton (analytic f') + bisection fallback on irregular-time CF vector
  LLCR = PV(CFADS, COD..min(last_debt_yr,Y)) / debt_open_COD   (single scalar, not per-period)
  PLCR = PV(CFADS, COD..Y) / debt_open_COD

Climate (transition + physical), Portfolio (ΣCFADS/ΣDS + HoldCo), Solver (bisection/grid-scan),
QMC (Halton radical-inverse + inverse-CDF) — all formulas in §7.
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| MACRS 5-yr schedule | `MACRS_5YR` | IRS Publication 946, Table A-1 (real, exact) |
| NGFS carbon price / GDP impact | `CP(y)`, `GDPimpact(y)` | NGFS Phase 5, IIASA Scenario Explorer (seeded extract, labeled illustrative/approximate) |
| Halton bases / skip | `[2,3,5,7,…,29]`, skip=20 | Standard low-discrepancy QMC convention |
| IDC/DSRA fixed-point tolerance | `1e-6`, ≤50 iters | Engineering convention for this class of circular project-finance model |
| Illustrative templates | solar/BESS/wind+carbon | Hand-authored "plausible 2026 US-market figures," explicitly not market quotes |
| Diversification proxy | `ρ_ab = cos(mix_a, mix_b)` | Documented structural proxy, not an estimated covariance |
| Sustainability shadow price / grid baseline | user input | Stated assumption, labeled in response |

**8.4 Data requirements.** Capex/opex/revenue-stream assumptions, debt-tranche terms (sizing,
amortization, rate, DSRA), tax regime, covenant thresholds — all user-supplied. For the climate
layer: an NGFS scenario id/region (served from the platform's own extract) or a custom
carbon-price/GDP-impact path, plus the project's own emissions intensity and pass-through/physical
parameters. For portfolio mode: 2–5 asset input sets (inline or template) and a HoldCo debt term
sheet. Nothing in this route depends on an external market-data feed at request time — the NGFS
extract is the only externally-sourced dataset, and it is loaded from a local seeded JSON file
(`backend/data/ngfs_phase5_extract.json`), not a live API.

**8.5 Validation & benchmarking.** Internal identities the code itself asserts or that are
independently verifiable from the response: balance-sheet `Assets ≡ L+E` to `1e-6` every period
(returned as `balance_sheet_ok`); sculpted-tranche DSCR ≡ target DSCR exactly in unclamped periods
(§7.4); `Σ debt draws = gearing × total funded cost` during construction (§7.3); portfolio DSCR
mediant property (`min ≤ ΣCFADS/ΣDS ≤ max` of constituents, §7.15); Halton scenario reproducibility
(same inputs ⇒ bit-identical QMC output). External validation would compare: the sculpting/annuity
mechanics and DSRA/MRA conventions against a live project-finance financial model (e.g. an Excel
model reviewed by a lender's financial advisor) for a real transaction; the NGFS carbon-price path
against the live IIASA Scenario Explorer release the seeded extract approximates; MACRS output
against a tax preparer's Form 4562 schedule for the specific asset class.

**8.6 Limitations & model risk — honest comparison to institutional (Charles River/Aladdin-class)
tooling.** This engine reproduces the *structure* of a bank-grade project-finance model (waterfall
priority, DSRA/MRA mechanics, sculpting, three-statement balance, XIRR) with genuine rigor for a
single deterministic scenario tree, but falls short of institutional risk-platform tooling in
specific, documented ways:
- **Deterministic QMC, not full Monte Carlo with correlated factors.** The Halton sequence samples
  each uncertain input **independently** via its own prime base — there is no copula/correlation
  structure between, e.g., PPA price and merchant price shocks, which a production risk platform
  (or a full Monte Carlo engine) would typically model with a covariance matrix or copula. This is
  a genuine simplification, not a bug: the deterministic reproducibility is a stated design choice
  (audit-friendly, no PRNG), traded off against the ability to stress correlated tail scenarios.
- **Single-period ECL-style tax/covenant treatment, no stochastic default modeling.** Covenant
  breaches are deterministic threshold crossings on a single scenario path, not a probability
  distribution over breach outcomes (contrast with the platform's `covenant-breach-predictor`
  module, which does compute `P(breach|scenario)`).
- **LLCR/PLCR are single COD-vintage scalars** (§ callout above), not the full per-period
  refinancing-risk time series a lender's model would typically carry through the life of the loan.
- **Diversification and cross-asset correlation are a documented structural proxy** (revenue-mix
  cosine similarity), not an estimated or historically-calibrated covariance matrix — appropriate
  for an illustrative portfolio view, not for capital allocation decisions at an institutional
  scale.
- **Portfolio/HoldCo IRR assumes simultaneous COD** across all consolidated assets — real
  portfolios have staggered financial closes; the aggregation would need per-asset COD offsets for
  transaction-grade portfolio work.
- **NGFS carbon-price/GDP paths are a seeded, 5-year-step, linearly-interpolated extract**, labeled
  by its own metadata as approximate — production use should refresh from the live IIASA Scenario
  Explorer release.
- **Conservative fallback guidance**: treat the deterministic single-path outputs (equity IRR, min
  DSCR, LLCR) as the base case, the QMC percentile band as an *independent-factor* risk indication
  (not a full joint-distribution VaR), and re-underwrite any climate-scenario or refinancing result
  against a live market curve and a full stochastic (correlated) simulation before using this
  engine's output for a live credit or investment decision.

## 9 · Future Evolution

### 9.1 Evolution A — Per-period LLCR/PLCR series and calibrated NGFS/market inputs (analytics ladder: rung 3 → 4)

**What.** This is the platform's flagship tier-A vertical — a 2,425-line PRNG-free engine with 8 endpoints (`/run`, `/scenario-matrix`, `/consolidate`, `/sensitivity`, Halton-QMC `/simulate`, `/solve`, `/solve-frontier`), real MACRS tables and an NGFS Phase 5 extract. Evolution A closes its own documented gaps and moves it toward predictive inputs: (1) implement the per-period `LLCR_t`/`PLCR_t` series the route's docstring promises but the code reduces to a single COD-vintage scalar (§7's flagged docstring↔code mismatch); (2) refresh the NGFS extract from the IIASA Scenario Explorer, whose header itself says "approximate/illustrative — refresh for production precision," replacing linear 5-year interpolation with the published annual paths; (3) replace the diversification proxy (explicitly "NOT an estimated covariance") in `/consolidate` with a covariance estimated from the ingested market/merchant price history, making portfolio DSCR distribution-aware.

**How.** `_evaluate` gains an `llcr_t[]`/`plcr_t[]` array per period (PV of remaining CFADS over debt balance, discounted at tranche blended rate); NGFS refresh becomes a 20th-ingester job writing a versioned scenario table the engine reads; `/consolidate` accepts a correlation matrix estimated server-side with an honest fallback to the labeled proxy.

**Prerequisites.** IIASA download access and vintage pinning; merchant price history in the DB deep enough to estimate correlations (else the proxy stays, labeled). **Acceptance:** bench_quant extended with an LLCR-series reference case; scenario-matrix outputs change (and say why) when the NGFS vintage field changes; docstring and code now agree.

### 9.2 Evolution B — Structuring analyst that drives the solver conversationally (LLM tier 2)

**What.** The module is the ideal tier-2 flagship because every capability is already an endpoint: "size senior debt so DSCR stays above 1.30 under Net Zero 2050, then show me the equity-IRR cost of that headroom" becomes `/solve` (bisection on 6 instruments × 4 metrics), `/scenario-matrix`, and `/solve-frontier` tool calls, narrated with the engine's own covenant and waterfall outputs. The copilot also explains model mechanics from the atlas record — the deepest §7 in the atlas (19 subsections) is the grounding corpus.

**How.** Tool schemas from the 8 existing OpenAPI operations, all read-only POSTs computing transient models (no mutation gating needed); per-module system prompt carries §7.19's limitations verbatim (illustrative templates, approximate NGFS extract, scalar-IRR approximations) so the copilot qualifies bankability claims. Multi-step chains (run → solve → frontier) log every call for the "show work" expander; the fabrication validator checks each IRR/DSCR figure against tool outputs.

**Prerequisites.** None hard — the backend exists and is CI-guarded; prompt-caching for the large module context (roadmap Tier-1 economics). **Acceptance:** a three-step structuring dialogue produces only tool-traceable numerics; asked for a P50 construction-delay probability (not modeled), the copilot refuses and points to the QMC uncertain-input table as the supported alternative.