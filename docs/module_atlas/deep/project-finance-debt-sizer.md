## 7 · Methodology Deep Dive

### 7.1 What the module computes

`project-finance-debt-sizer` is the platform's generic lender-grade debt-sculpting solver
(`backend/api/v1/routes/pf_debt_sizing.py`, 1,086 lines, single endpoint `POST /size` plus
`GET /ref/dscr-benchmarks`), fronted by an 8-panel React page
(`ProjectFinanceDebtSizerPage.jsx`, 947 lines). Sector-specific PF pages (hydrogen/BESS/
geothermal/CCUS) model *sector economics*; this module is the shared *sizing mechanics*
engine — CFADS in, sized debt + full schedule + covenant/breakeven/sustainability analytics
out. It implements, in one request/response cycle:

1. **CFADS** — supplied directly (P50/P90 arrays) or derived from generation/price/opex
   parameters (`DeriveCfadsParams`).
2. **Multi-metric sculpted sizing** — DSCR sculpting, with optional LLCR/PLCR/gearing
   constraints competing to bind.
3. **Full amortisation schedule** — interest/principal/cash-sweep/DSRA per period, DSCR/
   LLCR/PLCR reported per period on both P50 and P90 CFADS.
4. **Sponsor equity IRR** (bisection-solved) and **lender P90 coverage stats**.
5. Seven optional extension modules, each independently toggleable: **mezzanine tranching**,
   **mini-perm balloon/refi**, **multi-currency FX** conversion + stress, **three breakeven
   solvers**, a **green/SLL sustainability overlay** with carbon-cost re-sizing, and a flat
   **lender report** export.

All math is deterministic; the route docstring states "no PRNG, no fabricated data," and
every hand-authored default (DSCR/gearing/tenor benchmarks, LLCR/PLCR conventions, mezz/
mini-perm/SLL market conventions) is served with its basis via `GET /ref/dscr-benchmarks`.

### 7.2 Parameterisation

**CFADS derivation** (`DeriveCfadsParams` / `_derive_cfads`) blends contracted and merchant
revenue per period: `contracted_share_t = contracted_volume_share_pct` while `t ≤
contracted_tenor_years`, else 0; contracted price escalates at `contracted_escalation_pct`,
merchant at `merchant_escalation_pct`; generation degrades at `degradation_pct_yr` and is
haircut by `curtailment_pct`; opex escalates independently. Cash tax (`_apply_cash_tax`) is
a simplified `rate × max(0, EBITDA − straight-line depreciation)` — **interest shield is
deliberately ignored**, a documented conservative choice that avoids sizing circularity
(computing debt requires debt service, which would require the tax shield, which requires
debt service…).

**Target DSCR blend** — per period, `target_t = w_t·DSCR_contracted + (1−w_t)·DSCR_merchant`
where `w_t` is the period's contracted revenue share — the mechanism the reference
benchmarks explicitly call out ("Blend targets by revenue mix per period — the sculpting
engine on this route does exactly this").

**Hand-authored DSCR/gearing/tenor benchmarks** (`_DSCR_BENCHMARKS`, `GET
/ref/dscr-benchmarks`, "2023–2025 vintage term sheets", explicitly labeled NOT live quotes):

| Contract type | DSCR contracted | DSCR merchant | Max gearing | Typical tenor |
|---|---|---|---|---|
| Fully contracted solar PV (IG offtaker) | 1.20 | — | 85% | 18–22y |
| Fully contracted onshore wind | 1.30 | — | 80% | 15–18y |
| Contracted offshore wind (CfD) | 1.35 | — | 75% | 15–18y |
| Hybrid solar 60–70% contracted | 1.30 | 1.80 | 75% | 15–18y |
| Merchant-heavy renewables (<30%) | 1.35 | 2.00 | 60% | 7–12y (mini-perm) |
| Contracted thermal (tolling) | 1.20 | 1.75 | 80% | 12–17y |
| Availability PPP / social infra | 1.15 | — | 90% | 20–28y |
| BESS tolled / capacity-contracted | 1.35 | 2.25 | 70% | 10–15y |

Plus structuring conventions: LLCR typical target 1.30–1.50x, PLCR 1.50–1.80x; mezz target
1.10–1.30x on total DS (~2.0–3.0x on residual CFADS), priced 300–600bps above senior,
detachment 85–92% of capex; mini-perm balloon year 5–7, refi spread +50–150bps (assumed,
labeled — "never forecast"); SLL margin ratchet ±2.5–10bps, green-loan "greenium" 0–10bps.

### 7.3 Core sculpting math — DS_t = CFADS_t / target_t, and the binding-constraint contest

The heart of the engine (`size_debt`, step 2–3):

```
DS_t         = max(0, CFADS_sizing_t) / target_dscr_t             for t in 1..tenor
D_DSCR       = Σ_t DS_t / (1+r)^t                                  (PV of sculpted DS at the debt rate)
D_gearing    = max_gearing_pct × capex
D_LLCR       = PV(CFADS_sizing, t=1..tenor, at r) / target_LLCR    (optional)
D_PLCR       = PV(CFADS_sizing, t=1..life,  at r) / target_PLCR    (optional)

Debt = min(D_DSCR, D_gearing, D_LLCR?, D_PLCR?)     ← binding_constraint = argmin
```

If a **non-DSCR** constraint binds, the entire `DS_t` path is scaled down proportionally
(`scale = Debt / D_DSCR`), so realized DSCRs run *uniformly above* the target DSCR — the
covenant that actually bound (LLCR or PLCR) is the one at its exact target; DSCR has slack.
Per-period binding is also tracked (`per_period_binding`): at each period the engine computes
DSCR/LLCR/PLCR *headroom* (`ratio/target`) on the **realized** schedule and reports the
argmin — so a deal can be DSCR-bound in early years and LLCR-bound later as the PV tail
shrinks.

The **amortisation loop** (`_build_amort_schedule` logic, inlined in `size_debt`):
```
interest_t   = r · B_{t-1}
principal_t  = min(DS_t − interest_t, B_{t-1})
sweep_t      = min(cash_sweep_pct × max(0, CFADS_t − DS_t_actual), B_{t-1} − principal_t)
B_t          = B_{t-1} − principal_t − sweep_t
```
DSRA target is `(dsra_months/12) × next period's actual debt service`, equity-funded at
close, released as debt amortises (movements flow through the sponsor equity cash flow, not
expensed). Sponsor P50 equity IRR cash flow: `CF_0 = −(capex − debt + DSRA_0)`, `CF_t =
CFADS_P50_t − DS_actual_t − sweep_t − dDSRA_t`, solved by bisection (`_irr`, 200 iterations,
NPV root on `[-0.95, 10.0]`).

### 7.4 Worked example — DSCR vs LLCR binding-constraint contest

Simplified 3-year, fully-contracted deal (illustrative, hand-computed): `capex = $100.0M`,
target DSCR = 1.25x (flat), interest rate `r` = 5%, `CFADS_t = $12.5M` flat for 3 years
(sizing basis P50), `max_gearing_pct` = 75% (⇒ `D_gearing = $75.0M`, clearly non-binding
here), `target_LLCR` = 1.35x.

**Step 1 — sculpted debt service:**
```
DS_t = 12,500,000 / 1.25 = $10,000,000 per year (flat)
```

**Step 2 — PV of sculpted DS at 5% (D_DSCR):**
```
10,000,000/1.05    = 9,523,809.52
10,000,000/1.1025  = 9,070,294.78
10,000,000/1.157625 = 8,638,375.99
D_DSCR = Σ = $27,232,480.29
```

**Step 3 — PV of CFADS over the tenor at 5% (needed for LLCR cap):**
```
12,500,000/1.05     = 11,904,761.90
12,500,000/1.1025   = 11,337,868.48
12,500,000/1.157625 = 10,798,220 (approx)
PV_tenor = Σ ≈ $34,040,850
D_LLCR = PV_tenor / target_LLCR = 34,040,850 / 1.35 ≈ $25,215,444
```

**Step 4 — binding constraint:**
```
candidates = {dscr_sculpting: 27,232,480, llcr: 25,215,444, gearing_cap: 75,000,000}
Debt = min(...) = $25,215,444   ←  binding_constraint = "llcr"
```
The 1.35x LLCR covenant is *tighter* than what 1.25x DSCR sculpting alone would support —
a fully-amortizing DSCR-sculpted structure implicitly has an LLCR at close higher than its
DSCR would suggest only when cash flows are flat; here the LLCR target actually binds
because it demands more cushion (1.35x) than the DSCR-implied cushion at this rate/tenor.

**Step 5 — DS scaling (since LLCR binds, not DSCR):**
```
scale = Debt / D_DSCR = 25,215,444 / 27,232,480.29 = 0.92594
DS_scaled,t = 10,000,000 × 0.92594 ≈ $9,259,400 per year
```

**Step 6 — realized DSCR check:**
```
DSCR_t = CFADS_t / DS_scaled,t = 12,500,000 / 9,259,400 ≈ 1.350x
```
Realized DSCR (1.350x) sits comfortably above the 1.25x target — exactly as expected once a
non-DSCR constraint binds — and (because CFADS is flat here) lands almost exactly at the
1.35x LLCR target itself, confirming the LLCR-at-close identity `PV(CFADS)/Debt =
target_LLCR` by construction. This is the mechanism §7.3 describes: DSCR sculpting proposes
the largest debt the cash flow can nominally support; LLCR/PLCR/gearing are *caps* that can
pull debt down below that proposal, and whichever cap binds becomes the reported
`binding_constraint`, with the schedule rescaled so its own covenant sits exactly at target
and the others show slack.

### 7.5 Extension modules — mechanics

- **Mezzanine tranching** (`MezzanineParams`): mezz DS is sculpted on **residual** CFADS
  (`CFADS_sizing_t − senior_DS_t`) at the (higher) mezz target DSCR, mezz debt = PV(mezz DS)
  at the mezz rate, capped at `max_total_gearing_pct × capex` less senior debt already drawn.
  The senior schedule is untouched by construction, so senior DSCRs are provably unchanged
  by adding mezz (the module explicitly reports `senior_min_dscr_p50` as unchanged).
  Blended cost = balance-weighted coupon `(senior×r_sr + mezz×r_mz)/total`.
- **Mini-perm** (`MiniPermParams`): balloon = the senior schedule's closing balance at
  `balloon_year`. Refi rate = current all-in + `refi_spread_bps` (an explicit **assumed**
  spread, labeled, never forecast). Refi-risk metric = `balloon / PV(post-balloon CFADS over
  the refi tenor at the refi rate)` — ≤1 means post-balloon cash flow covers the balloon in
  PV terms. Hard mini-perm re-amortizes the balloon as a level annuity; soft mini-perm
  switches to 100% cash sweep with no legal balloon and simulates the payoff year.
- **FX** (`FxParams`): `CFADS_debt_t = CFADS_t × (h·fx_0 + (1−h)·fx_t)` where `h` is the
  hedged share (locks the closing spot) and `fx_t` is either a flat drift path or a
  user-supplied per-year array — both explicitly labeled USER ASSUMPTIONS, "no FX forecast
  is fabricated." A stressed-DSCR table applies additional depreciation shocks to the
  **unhedged** share only, holding debt service fixed.
- **Breakevens** (three bisection solvers, debt service held fixed on the *final* schedule):
  (a) uniform CFADS haircut % to reach 1.00x or the lock-up DSCR; (b) merchant price
  (derive-mode only) to the same thresholds, re-running `_derive_cfads` at each candidate
  price; (c) all-in interest rate — balance path held, interest recomputed at the candidate
  rate on each opening balance.
- **Sustainability overlay** (`SustainabilityParams`): SLL two-way margin ratchet
  (`-ratchet_bps` when the emissions-intensity KPI meets its target path, `+ratchet_bps`
  when missed), green-loan margin benefit (labeled market-observation input, "0–10bps... not
  a feed"), and a **carbon cost line** — `emissions_t × carbon_price_t` deducted from CFADS
  and the debt **re-sized** end-to-end with the same targets/caps, reporting a
  "carbon-stressed debt capacity" delta vs the base case.

### 7.6 Companion analytics on the page

- **Lender report** (Extension 7): a flat, exportable (section/metric/value/basis) summary
  of every sizing metric, covenant, tranche, breakeven, FX and sustainability KPI — rendered
  and CSV-exported client-side (`parseArray`/`csv`/`blob` helpers in the frontend).
- **Cross-check panel**: calls the separate `POST /api/v1/project-finance/calculate` engine
  (`services/project_finance_engine.py`, Decimal-based NPV/IRR/annuity, its own DSRA
  threshold table) to sanity-check the sized debt against an independently-implemented
  debt/equity ratio calculator — out of scope for this route but documented as a live
  cross-check in the frontend.
- **Market benchmarks panel**: `GET /ref/dscr-benchmarks` (§7.2 table).

### 7.7 Data provenance & limitations

- **No PRNG, no fabricated data** anywhere in `pf_debt_sizing.py` — the route docstring
  states this and every derived figure traces to a CFADS input or a documented closed-form
  transform.
- **All benchmark tables are hand-authored market conventions** ("2023–2025 vintage term
  sheets"), explicitly labeled "editable starting points, NOT live market quotes" — actual
  terms vary by sponsor, jurisdiction and bank appetite.
- **Cash tax ignores the interest shield** — a documented, conservative simplification that
  avoids a circular dependency between debt sizing and the tax calculation; production use
  would need an iterative or closed-form tax-shield solve.
- **FX and refi-spread assumptions are explicitly user inputs**, never forecasts — the
  module refuses to fabricate an FX path or a refinancing curve.
- **DSRA is modeled as equity-funded** (not a separate facility/LC), and the lender-report
  cross-check against `project_finance_engine` uses a *different* engine with its own DSRA
  threshold table (`[(1.30, 6), (1.40, 3)]` months) — the two are not guaranteed to
  reconcile exactly, since they are independent implementations, not the same code path.
- **Guide/atlas note:** the auto-generated `docs/module_atlas/modules/project-finance-debt-sizer.md`
  function-map lists tokens like `CFADS`, `COD`, `decimal`, `schemas` as "shared database
  tables" — an artifact of the atlas generator parsing import/keyword tokens across both
  `pf_debt_sizing.py` and the separate `project_finance_engine.py`/`project_finance.py`
  files, not a real data-lineage relationship. The reported "blast radius" of 42 modules is
  inflated by this same token-matching artifact (e.g. `decimal`, `schemas` are common Python
  imports, not shared tables) — no narrative guide/code mismatch was found for the sizing
  math itself.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** A lender-grade, sector-agnostic debt-sizing engine for
project-finance transactions: sculpt debt service off CFADS to hit blended DSCR/LLCR/PLCR/
gearing targets simultaneously, build the full amortisation and coverage schedule, and
layer in mezzanine tranching, mini-perm refinancing risk, multi-currency FX exposure,
covenant breakeven analysis, and green/SLL loan economics — for lenders, sponsors and
advisors structuring or diligencing a single project-finance facility.

**8.2 Conceptual approach.** Debt sizing is framed as a **PV-equivalence problem**: a
schedule that pays exactly the sculpted debt service `DS_t` each period amortises the debt
to zero at maturity when interest accrues at the debt rate, so `D = PV(DS_t)` is the maximum
debt supportable by that DSCR path. Multiple lender covenants (DSCR, LLCR, PLCR, gearing)
are modeled as independent *caps* on that debt, each computed as its own PV-based or
ratio-based ceiling; the actual sizing is `min()` across all supplied caps, with the
schedule re-scaled uniformly if a non-DSCR cap binds. Extensions (mezz, mini-perm, FX,
sustainability) each re-use this same PV-sculpting kernel on a modified CFADS or cost-of-debt
input rather than introducing a parallel methodology.

**8.3 Mathematical specification.**
```
Sculpting:
  target_t = w_t · DSCR_contracted + (1-w_t) · DSCR_merchant
  DS_t = max(0, CFADS_sizing_t) / target_t
  D_DSCR = Σ_{t=1}^{tenor} DS_t / (1+r)^t

Multi-metric cap:
  D_LLCR = PV(CFADS_sizing, tenor, r) / target_LLCR
  D_PLCR = PV(CFADS_sizing, life,  r) / target_PLCR
  D_gearing = max_gearing_pct · capex
  Debt = min(D_DSCR, D_LLCR, D_PLCR, D_gearing)

Amortisation:
  interest_t = r · B_{t-1}
  principal_t = min(DS_t - interest_t, B_{t-1})
  sweep_t = min(sweep_pct · max(0, CFADS_t - DS_t), B_{t-1} - principal_t)
  B_t = B_{t-1} - principal_t - sweep_t

Mezzanine:
  Mezz_DS_t = max(0, CFADS_sizing_t - Senior_DS_t) / target_DSCR_mezz
  Mezz_Debt = min(PV(Mezz_DS_t, r_mezz), max_total_gearing·capex - Senior_Debt)

Mini-perm refi risk:
  refi_risk = Balloon / PV(post-balloon CFADS, refi_tenor, r + refi_spread)

FX:
  CFADS_debt,t = CFADS_t · (h·FX_0 + (1-h)·FX_t)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Target DSCR (contracted / merchant) | `target_dscr_{c,m}` | Hand-authored, by contract type (§7.2 table) |
| Target LLCR / PLCR | `target_llcr/plcr` | Market convention 1.30–1.50x / 1.50–1.80x (labeled) |
| Max gearing | `max_gearing_pct` | By contract type, 60–90% (§7.2 table) |
| Mezz DSCR / pricing | `target_dscr_mezz`, spread | 1.10–1.30x on total DS; +300–600bps (labeled) |
| Refi spread at balloon | `refi_spread_bps` | User assumption, default +75bps (labeled, never forecast) |
| SLL ratchet | `ratchet_bps` | ±2.5–10bps (LMA SLL Principles structure, labeled) |
| Green-loan benefit | `green_loan_margin_benefit_bps` | 0–10bps empirical "greenium" range (labeled) |
| Cash tax | `tax_rate_pct` on EBITDA−SL depreciation | Simplified, interest shield ignored (documented) |

**8.4 Data requirements.** Either a CFADS array (P50, optionally P90) or the parameters to
derive one (capacity, capacity factor P50/P90, degradation, curtailment, contracted/merchant
price and tenor/escalation, opex); target DSCR/LLCR/PLCR/gearing; interest rate and tenor;
DSRA months; cash-sweep %. Extensions each need their own inputs (mezz rate/tenor, balloon
year, FX path/hedge share, emissions-intensity path + SPT target, carbon price path).

**8.5 Validation & benchmarking.** `GET /ref/dscr-benchmarks` provides a hand-authored
cross-check table by contract type; a production validation would compare sized gearing/
DSCR/tenor against closed transactions in the same sector and rating band, and stress-test
the mini-perm refi-risk metric and FX-stress table against historical refinancing spread and
FX-volatility regimes for the relevant market.

**8.6 Limitations & model risk.** The cash-tax treatment ignoring the interest shield is
conservative but not exact — a lender relying on precise after-tax debt capacity should
layer in an iterative tax-shield solve. FX and refi-spread paths are user assumptions with
no forecasting model behind them (by design — the module refuses to fabricate a market
view), so sizing is only as good as those inputs. The mezzanine cap uses a single
`max_total_gearing_pct` rather than a full capital-structure optimization; the mini-perm
soft-sweep payoff-year search assumes the *original* rate continues after the balloon year
(no re-pricing step-up modeled), which the docstring documents as excluded. The lender-report
cross-check against `project_finance_engine.py` is an independent implementation with its
own DSRA convention and is not guaranteed to reconcile to the cent with the sizer's own DSRA
calculation.
