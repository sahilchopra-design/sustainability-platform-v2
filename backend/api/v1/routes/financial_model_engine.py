"""
Financial Modeling Studio — full project-finance model engine (NX2-16 flagship)
===============================================================================
Prefix: /api/v1/financial-model
Tags:   Financial Modeling Studio

An ultra-detailed, bank-grade project/IPP financial model computed entirely
server-side, deterministic and reproducible (NO PRNG anywhere — the quasi-Monte
Carlo endpoint uses a Halton low-discrepancy sequence, i.e. computation, not
fabricated data; passes backend/tools/check_no_fabricated_random.py).

All money amounts are in $M (USD millions) unless a field name says otherwise.

────────────────────────────────────────────────────────────────────────────────
MODEL STRUCTURE & FORMULAS (every formula used, in order of computation)
────────────────────────────────────────────────────────────────────────────────

1. CONSTRUCTION PHASE (monthly, m = 1..M)
   • Capex drawdown S-curve, two documented options:
       linear:   w_m = 1/M
       logistic: w_m = [F(m/M) − F((m−1)/M)] / [F(1) − F(0)],
                 F(x) = 1 / (1 + exp(−k·(x − 0.5))),  k = logistic_steepness (default 8)
     capex_draw_m = total_capex × w_m
   • Funding is drawn PRO-RATA debt/equity each month at the overall gearing g:
       debt_draw_m   = g × (capex_draw_m + IDC_m)   (split across tranches by size)
       equity_draw_m = (1−g) × (capex_draw_m + IDC_m)
   • IDC (interest during construction), capitalized into the depreciable base:
       IDC_m = Σ_tranches  B_{tr,m−1} × r_tr / 12
     where B is the tranche balance drawn so far and r_tr is the tranche
     construction-period annual rate (fixed rate, or base + margin for floating;
     the pay-fixed swap is assumed effective from COD only).
   • At COD the initial DSRA balance (DSRA_0) is funded pro-rata debt/equity and
     is part of total project cost:
       C_total = capex + IDC_total + DSRA_0
       debt_tr = gearing_pct_tr/100 × C_total     (sizing = "gearing")
              or amount_musd                      (sizing = "amount")
       g       = Σ debt_tr / C_total

2. CIRCULARITY — FIXED-POINT ITERATION
   IDC depends on debt drawn, debt sized on total cost including IDC and DSRA_0,
   DSRA targets depend on next-period debt service, and sculpted debt service
   depends on CFADS.  Resolved by fixed-point iteration on the vector
   (IDC_total, DSRA_0, senior+mezz DS arrays):
       x_{k+1} = Model(x_k),  stop when ‖x_{k+1} − x_k‖_∞ < 1e-6  (≤ 50 iters).
   The response reports iterations used, convergence flag and final residual.

3. OPERATIONS PHASE (annual periods t = 1..Y; internals are written per-period
   with a periods_per_year scaling parameter so quarterly becomes a period-
   scaling change, not a rewrite)
   • Volume:  E_t [MWh] = MW × NCF_case × 8760 × (1 − d)^(t−1)
     NCF_case ∈ {P50, P90, P99} exceedance capacity factors; d = degradation.
   • Revenue streams (each optional, $M):
       PPA (t ≤ tenor):      E_t × contracted% × P_ppa × (1+esc_ppa)^(t−1) / 1e6
       Merchant:             E_merch,t × P_mer × (1+esc_mer)^(t−1) × capture% / 1e6
                             E_merch,t = E_t − contracted volume (all of E_t
                             once/if the PPA has expired or is disabled)
       Capacity:             $/MW-yr × MW × (1+esc_cap)^(t−1) / 1e6
       RECs (t ≤ rec tenor): $/MWh × E_t / 1e6
       Carbon:               t/yr × $/t × (1+esc_c)^(t−1) / 1e6
   • Opex ($M):  fixed $/MW-yr×MW×(1+esc)^(t−1) + var $/MWh×E_t + insurance
     (%/yr of capex) + land lease k$×(1+esc)^(t−1), all /1e6 where needed.
   • EBITDA_t = Revenue_t − Opex_t
   • Depreciation (base = capex + IDC; DSRA is cash, not depreciated):
       straight-line: base / sl_years                        (t ≤ sl_years)
       MACRS 5-yr (half-year convention, IRS Pub 946 Table A-1):
         year %: 20.00, 32.00, 19.20, 11.52, 11.52, 5.76     (t ≤ 6)
   • Debt interest per tranche:  Int_t = B_{t−1} × r_eff,t
       fixed:    r_eff = fixed_rate
       floating: r_eff = s×(swap_fixed + margin) + (1−s)×(base_t + margin)
                 s = swap_notional_pct/100 (pay-fixed swap share);
                 base_t = base_rate_curve_pct[t−1] if provided else base_rate_pct
   • Tax with a REAL loss-carryforward ledger:
       taxable_t = EBITDA_t − Dep_t − Int_total,t − MajorMaintenance_t
       if taxable_t < 0:  clf += −taxable_t ; tax_t = 0
       else: used = min(clf, taxable_t); clf −= used;
             tax_t = tax_rate × (taxable_t − used)
   • CFADS_t = EBITDA_t − tax_t − MRA_contribution_t
     (major maintenance is PAID out of the MRA balance, so it is not in CFADS;
      it IS tax-deductible in its event year, see taxable_t above)
   • Debt service per tranche:
       sculpted: DS_t = CFADS_t / target_DSCR  (senior);
                 mezz sculpts on (CFADS_t − senior DS_t) / target_DSCR_mezz
                 Prin_t = clamp(DS_t − Int_t, 0, B_{t−1}); at t = tenor any
                 remaining balance is a final balloon (reported).
       annuity:  A = B_0 × r / (1 − (1+r)^−n) computed at COD with the year-1
                 effective rate (documented approximation for floating);
                 Prin_t = min(A − Int_t, B_{t−1}); balance retires early if
                 swept.  Final scheduled period repays any remainder.
       bullet:   Int only; Prin = B at t = tenor.
   • DSCR by tranche: senior DSCR_t = CFADS_t / DS_senior,t ;
     mezz DSCR_t = (CFADS_t − DS_senior,t) / DS_mezz,t

4. CASH WATERFALL — priority of payments, executed PERIOD BY PERIOD:
     (1) Revenue
     (2) − Opex                                  (→ EBITDA)
     (3) − Tax
     (4) − MRA funding (per schedule)            (→ CFADS)
     (5) − Senior debt service (shortfall drawn from senior DSRA, recorded)
     (6) − Senior DSRA top-up to target (release to cash if above target);
           target_t = dsra_months/12 × next-period senior DS
           (next-period DS from the previous fixed-point iterate — this IS the
           documented DSRA circularity)
     (7) − Mezzanine debt service (shortfall from mezz DSRA if funded)
     (8) − Mezz DSRA top-up / release (same rule)
     (9) − Cash sweep: sweep_pct% of remaining cash prepays senior principal
    (10) Distribution lock-up test: if senior DSCR_t < lockup_dscr the
         remaining cash is TRAPPED (added to a trapped-cash account, shown on
         the balance sheet). When the test passes again, trapped cash releases
         into that period's distribution.
    (11) Distributions to equity.
   Final operating period: DSRA + MRA + trapped balances release to equity
   (after retiring any residual debt).
   Covenant suite reported: lock-up breach periods, default-test
   (DSCR < default_dscr) breach periods, payment defaults (DS unpayable even
   after DSRA draw), min/avg DSCR.

5. THREE-STATEMENT VIEW (per period; the balance sheet is ASSERTED to balance
   to < $1 within 1e-6 $M each period, and the check result is returned):
     IS: Revenue → Opex → EBITDA → D&A → Major maintenance → EBIT → Interest
         → Taxable (pre-carryforward) → Tax → Net income
     CF: Operating = NI + D&A ; Investing = −capex draws (construction);
         Financing = debt draws − principal (incl sweep) − distributions
         + equity draws ; ΔCash = restricted-cash movement (DSRA+MRA+trapped)
     BS: Assets  = net PP&E (capex+IDC − cum. dep.) + DSRA + MRA + trapped cash
         L + E   = debt by tranche + paid-in equity + retained earnings
                   (cum. NI − cum. distributions)
         assert |Assets − (L+E)| < 1e-6 ∀ t

6. RETURN METRICS
   • Equity IRR: irregular-time IRR (XIRR-style) on the equity cash-flow
     vector: monthly equity draws at t = (m − M)/12 years (before COD, so
     negative times) and annual distributions at t = 1..Y.
       f(r) = Σ_i CF_i × (1+r)^(−t_i) = 0
     Solved by NEWTON'S METHOD (analytic derivative
       f'(r) = Σ_i −t_i × CF_i × (1+r)^(−t_i−1))
     with automatic BISECTION FALLBACK on [−0.95, 10] if Newton diverges,
     oscillates or leaves the bracket. No scipy.
   • Project IRR: same solver on unlevered flows: −capex draws (excl. IDC)
     during construction, + (EBITDA_t − tax_t) during operations
     (documented approximation: tax is the levered tax).
   • NPV: equity NPV at the input discount rate, same time grid.
   • LLCR = PV(CFADS, s = year1..last debt period, at the senior all-in
              year-1 rate) / total debt balance at start of year 1
              (loan-life cover, single COD-anchored value — NOT a per-period
              time series; sensitivity/stress therefore moves LLCR itself
              rather than a per-period LLCR path)
   • PLCR = PV(CFADS, s = year1..Y, same rate) / debt balance at start of
              year 1 (project-life cover, same COD-anchored convention)
   • Payback: first operating year where cumulative distributions ≥ total
     equity invested.

7. CLIMATE RISK — TRANSMISSION CHANNELS INTO THE SAME MODEL (optional `climate`
   config; when enabled, the channels below flow through the SAME period loop,
   waterfall, statements and covenant tests — there is no parallel simplified
   model; the climate case is the primary result and a no-climate baseline is
   rerun through the identical code for the delta decomposition):

   TRANSITION channels
   • Carbon price path CP_t [$/tCO2]: either a user array (per operating year)
     or a named NGFS Phase 5 scenario. NGFS paths are loaded server-side from
     the platform's seeded extract (api/v1/routes/ngfs_scenarios_extract.py —
     NGFS Phase 5, IIASA Scenario Explorer, ~REMIND-MAgPIE marker; provenance
     echoed in the response) and LINEARLY INTERPOLATED from the extract's
     5-year steps (2025…2050) to annual, clamped flat outside that range:
       CP(y) = CP_k + (CP_{k+1} − CP_k) × (y − y_k)/(y_{k+1} − y_k)
     Operating year t maps to calendar year = climate.start_year + (t−1).
   • Carbon COST (emitting projects): opex line
       CarbonCost_t = (E_t × EI + FE) × CP_t / 1e6   [$M]
     EI = emissions_intensity_t_per_mwh (own emissions), FE = fixed t/yr.
   • Merchant price uplift (marginal-unit pass-through, stated assumption):
       Uplift_t [$/MWh] = CP_t × grid_marginal_intensity_t_per_mwh
                          × merchant_passthrough_pct/100
     applied additively to the merchant price BEFORE capture rate.
   • Carbon REVENUE indexation (credit-earning projects): if
     index_carbon_revenue_to_path, the carbon stream's $/t follows CP_t
     instead of its own fixed escalator.
   • Demand/GDP channel: merchant price multiplier
       (1 + gdp_beta_merchant × GDPimpact_t/100)
     GDPimpact_t = NGFS 'gdp_impact_pct' (% deviation vs baseline, negative =
     loss), interpolated annually as above. β is the user's stated elasticity.

   PHYSICAL channels (all labeled model assumptions with visible parameters)
   • Chronic derate: E_t further × (1 − chronic_derate_pct_yr/100)^t
     (compounding, ON TOP of technical degradation — heat/resource drift).
   • Acute expected annual loss: opex line
       EAL_t = acute_eal_pct_of_capex/100 × capex × (1+acute_esc)^(t−1)
   • Insurance premium escalation: extra opex
       InsExtra_t = insurance_pct_capex_yr × capex × [(1+ins_esc)^(t−1) − 1]
     (the escalation-only increment over the flat baseline premium line).
   • Downtime: E_t × (1 − downtime_days_per_yr/365).

   The /run response gains `climate` (config echo + annual paths + provenance),
   `baseline` (full no-climate rerun: periods, statements, metrics, covenants)
   and `climate_impact` (per-year deltas climate − baseline for revenue, opex,
   EBITDA, CFADS, senior DSCR, plus explicit channel lines: carbon cost, acute
   EAL, insurance escalation, merchant uplift revenue, volume delta). Covenant
   lock-up/default/payment-default reporting is IDENTICAL in climate runs.

8. REFINANCING EVENT (optional `refinancing` config; senior tranche = tranche 0)
   Executed at the END of operating year N (= refinancing.year), after that
   year's scheduled debt service, DSRA true-up and cash sweep, BEFORE the
   distribution lock-up test (refi proceeds flow through the covenant test —
   covenant continuity):
       B_out       = senior balance after year-N amortization
       NewDebt     = new_gearing_pct/100 × C_total   (gearing-up; if
                     new_gearing_pct is null, NewDebt = B_out — rate/tenor
                     refi only)
       Fee         = fees_pct/100 × NewDebt          (expensed in year N,
                     NOT tax-deductible in-model — documented conservative
                     simplification; paid out of proceeds)
       CashOut     = NewDebt − B_out − Fee           (to equity through the
                     waterfall; negative = equity injection)
   From year N+1 the senior tranche pays interest at new_rate_pct and
   amortizes over new_tenor_years:
       annuity:  A' = NewDebt × r'/(1 − (1+r')^−n'), computed at the refi date
       sculpted: DS_t = CFADS_t / new_target_dscr
   Remaining balance balloons at year N + n' (or is retired by the terminal
   release if beyond the operating life). DSRA targets, lock-up and default
   tests continue UNCHANGED on the new schedule (same fixed-point machinery).
   Balance-sheet identity: Δdebt = Fee + CashOut, retained earnings −Fee
   (through NI), distributions +CashOut ⇒ assertion still holds to 1e-6.
   /run response gains `refinancing`: metrics WITH refi (primary result) vs a
   full no-refi rerun (equity IRR / NPV / min DSCR deltas, cash-out, fee).

9. INFLATION & REAL/NOMINAL VIEW (optional `inflation` config)
   Per-year inflation π_t from `curve_pct` (last value held flat) or flat
   `flat_pct`. Cumulative index I_t = Π_{s≤t} (1 + π_s), I_0 = 1.
   • mode = "nominal" (default): all inputs are nominal, engine unchanged.
   • mode = "real_inputs": the following lines' input prices are treated as
     REAL and are additionally indexed by I_t on top of their own (now real)
     escalators — merchant price, capacity payment, fixed opex, variable
     opex, land lease. PPA, REC and carbon-credit prices stay CONTRACTUAL
     NOMINAL (their own escalators only) — documented convention.
   • Real (deflated) equity IRR is reported alongside nominal whenever
     inflation is enabled: each equity flow at time t ≥ 1yr is deflated by
     I_t (construction flows at t ≤ 0 undeflated, I = 1), then the same IRR
     solver runs:  real_IRR = IRR(CF_t / I_t).  Under positive inflation
     real IRR < nominal IRR.

10. WORKING CAPITAL (optional `working_capital` config)
    AR_t = Revenue_t × receivable_days/365 ; AP_t = Opex_t × payable_days/365
    ΔWC_t = (AR_t − AP_t) − (AR_{t−1} − AP_{t−1})
    CFADS_t = EBITDA_t − tax_t − MRA_t − ΔWC_t   (WC movement consumes cash)
    Terminal unwind: AR_Y = AP_Y = 0 (final-year collection/payment), so the
    last ΔWC releases the net position back to cash.
    BS: AR is an asset, AP a liability; net income stays accrual-based, so
    retained earnings − distributions absorb exactly (AR − AP) and the
    balance-sheet assertion continues to hold to 1e-6.
    CF statement: Operating = NI + D&A − ΔWC.

11. SUSTAINABILITY-LINKED DEBT (SLL) MARGIN RATCHET (per-tranche `sll` config)
    KPI per operating year t (computed from the model's OWN data):
      emissions_intensity: EI_actual,t = (E_t × EI + FE) / E_t   [tCO2e/MWh]
        (EI, FE from climate.transition — used for the KPI even when climate
        channels are disabled; the SLL tests the project's own footprint)
      renewable_share:     RS_actual = generation.renewable_share_pct  [%]
    Target path: linear from target_start (year 1) to target_end (year Y):
      target_t = start + (end − start) × (t−1)/(Y−1)
    Ratchet (±bp step per period):
      adj_bp,t = +step_up_bp   if KPI worse than target_t
                 −step_down_bp otherwise
      ("worse" = intensity above target, or renewable share below target)
    Interest flows: Int_t = B_{t−1} × (r_base,t + adj_bp,t/10000).
    The ratchet interest is an ADD-ON: annuity principal schedules keep the
    base-rate annuity payment (prin_t = A − B×r_base), so a step-up raises
    debt service and therefore lowers DSCR monotonically (worse intensity →
    higher margin → higher DS → lower DSCR). Adjusted interest is what hits
    the income statement, tax deduction, waterfall and covenants. Per-period
    adj_bp is reported on every period row.

12. SUSTAINABILITY ANALYTICS BLOCK (always computed, `sustainability` in /run)
    Own emissions:      Em_t = E_t × EI + FE                    [tCO2e]
    Intensity:          Em_t / E_t                              [tCO2e/MWh]
    Carbon cost share:  climate carbon-cost opex line / total opex
    Avoided emissions vs user grid baseline GB [t/MWh] (stated assumption):
        Avoided_t = E_t × GB − Em_t                             [tCO2e/yr]
    Equity cost of avoidance (lifetime, undiscounted — labeled):
        $/tCO2e = equity_invested × 1e6 / Σ_t Avoided_t
    Carbon-ADJUSTED equity IRR (labeled: unpriced-externality charge at the
    user's shadow price SP, NOT a cash flow of the project):
        IRR of [equity draws; distributions_t − Em_t × SP / 1e6]
    PCAF attribution-ready outputs (PCAF Global Standard, project finance):
        attribution_factor_t = outstanding debt_t / total funded cost at COD
        financed_emissions_debt_t   = attribution_factor_t × Em_t
        financed_emissions_equity_t = (equity / total funded cost) × Em_t
    All parameters (SP, GB) are user inputs in `sustainability` config.

13. PORTFOLIO MODE (POST /consolidate, 2–5 assets)
    Each asset (inline inputs or template ref) is run through the FULL model,
    then consolidated on a common period axis (shorter assets pad with 0):
      Combined line_t = Σ_assets line_t (revenue, opex, EBITDA, CFADS, DS,
      interest, NI, distributions)
      Portfolio DSCR_t = Σ CFADS_t / Σ DS_t (aggregate — mediant of the
      constituent ratios, so min_a DSCR_a,t ≤ portfolio DSCR_t ≤ max_a)
    Cross-asset diversification metric (DOCUMENTED PROXY — CFADS correlation
    proxy from revenue-mix overlap, not an estimated covariance):
      m_a = lifetime revenue mix vector over (PPA, merchant, capacity, REC,
            carbon);  ρ_ab = cos(m_a, m_b) = m_a·m_b / (‖m_a‖‖m_b‖)
      ρ̄ = Σ_{a<b} w_a w_b ρ_ab / Σ_{a<b} w_a w_b,  w_a = lifetime-CFADS share
      diversification_score = 1 − ρ̄  (0 = identical mixes, →1 = disjoint)
    HoldCo debt layer (STRUCTURAL SUBORDINATION — HoldCo is serviced ONLY
    from asset equity distributions, never from asset CFADS):
      UpstreamCF_t = Σ_assets distributions_t
      HoldCo annuity A = D_0 × r/(1 − (1+r)^−n); DS = interest + principal
      HoldCo DSCR_t = UpstreamCF_t / DS_t ; lock-up breach if < holdco
      lockup_dscr; payment shortfall recorded when UpstreamCF_t < DS_t.
      HoldCo equity IRR: aggregated asset equity draws, +HoldCo debt proceeds
      at COD, then UpstreamCF_t − HoldCo DS_t (COD-aligned: all assets reach
      COD simultaneously — documented simplification).

14. SOLVER EXPANSION
    /solve targets: equity_irr | min_dscr | llcr | carbon_adjusted_irr
    /solve instruments: ppa_price | capex | gearing | merchant_price |
      capture_rate (merchant capture-rate multiplier) | refi_year.
      refi_year is DISCRETE: exhaustive scan over feasible years 1..Y−1
      (bisection is for the continuous drivers, all monotone in the metrics).
    /solve-frontier: iso-IRR frontier on (gearing × PPA price). Grid-scan:
      for each gearing level g_k in [gearing_min, gearing_max] (steps points),
      bisect the PPA-price multiplier in [0.2, 5.0] to hit the target metric.
      Returns the (gearing_pct, ppa_price) curve + achieved metric per point.

────────────────────────────────────────────────────────────────────────────────
ENDPOINTS
────────────────────────────────────────────────────────────────────────────────
POST /run          — full model run (everything above; optional climate case
                     + no-climate baseline + delta decomposition; always
                     carries the sustainability analytics block §12; optional
                     refinancing event §8 with no-refi comparison; optional
                     inflation §9 real-IRR view and working capital §10)
POST /consolidate  — portfolio mode §13: 2–5 assets, combined statements,
                     portfolio DSCR, diversification proxy, HoldCo layer
POST /solve-frontier — (gearing × PPA price) iso-metric frontier §14
POST /scenario-matrix — same deal, every NGFS climate future: reruns the FULL
                     model per NGFS scenario (+ no-climate baseline) with the
                     same non-climate inputs; returns per-scenario equity IRR,
                     min/avg DSCR, LLCR, distributions PV, first lock-up and
                     default-test breach period & calendar year, and per-year
                     senior DSCR paths.
POST /sensitivity  — 1D/2D multiplier grids over any driver + tornado (±x% one-
                     at-a-time on 8 key drivers, sorted by |IRR impact|)
POST /simulate     — deterministic quasi-Monte Carlo:
                     Halton low-discrepancy sequence (radical-inverse in prime
                     bases 2,3,5,7,11,13,17,19,23,29 — one base per uncertain
                     dimension, first 20 points skipped to avoid the correlated
                     start of the sequence). Each uniform u∈(0,1) is mapped to
                     the input's distribution by INVERSE CDF:
                       uniform(a,b):        x = a + u(b−a)
                       triangular(a,c,b):   x = a + sqrt(u(b−a)(c−a))     u ≤ F(c)
                                            x = b − sqrt((1−u)(b−a)(b−c)) u > F(c)
                                            F(c) = (c−a)/(b−a)
                     Same inputs ⇒ same sequence ⇒ same results, always.
POST /solve        — goal-seek by BISECTION on a driver multiplier: bracket
                     [lo, hi] with f(lo), f(hi) straddling the target, halve
                     until |x_hi − x_lo| < 1e-6 or ≤ 80 iterations.
GET  /ref/templates — 3 labeled, hand-authored illustrative starting templates
                     (100 MW solar / 400 MWh BESS / 50 MW wind + carbon).
                     Editable defaults — NOT market quotes.
"""
from __future__ import annotations

import copy
import math
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# NGFS Phase 5 seeded extract (real, labeled: IIASA Scenario Explorer) — direct
# function import so climate paths are resolved server-side, not via HTTP.
from api.v1.routes.ngfs_scenarios_extract import _load_extract as _load_ngfs_extract

router = APIRouter(prefix="/api/v1/financial-model", tags=["Financial Modeling Studio"])

HOURS_PER_YEAR = 8760.0
# IRS Pub 946, Table A-1 — 5-year property, half-year convention (real table).
MACRS_5YR = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576]
HALTON_BASES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
HALTON_SKIP = 20          # skip the correlated start of the sequence
FP_MAX_ITERS = 50
FP_TOL = 1e-6


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic input models (all defaults are labeled illustrative values,
# fully editable in the UI)
# ─────────────────────────────────────────────────────────────────────────────
class TimelineConfig(BaseModel):
    construction_months: int = Field(18, ge=1, le=120, description="Construction period, months")
    operations_years: int = Field(25, ge=1, le=40, description="Operating life, years")
    periodicity: str = Field("annual", description="'annual' implemented; internals use periods_per_year so quarterly is a period-scaling parameter")
    periods_per_year: int = Field(1, ge=1, le=4)


class CapexConfig(BaseModel):
    total_capex_musd: float = Field(85.0, gt=0, description="EPC + owner's costs, $M (excl. IDC/DSRA — those are computed)")
    drawdown_curve: str = Field("logistic", description="'logistic' (S-curve) or 'linear'")
    logistic_steepness: float = Field(8.0, gt=0, description="k in F(x)=1/(1+exp(-k(x-0.5)))")


class GenerationConfig(BaseModel):
    capacity_mw: float = Field(100.0, gt=0)
    capacity_factor_p50: float = Field(0.24, gt=0, lt=1, description="Net capacity factor, P50 exceedance")
    capacity_factor_p90: float = Field(0.215, gt=0, lt=1)
    capacity_factor_p99: float = Field(0.198, gt=0, lt=1)
    production_case: str = Field("P50", description="P50 | P90 | P99")
    degradation_pct_yr: float = Field(0.4, ge=0, le=10, description="Annual output degradation, %/yr")
    renewable_share_pct: float = Field(100.0, ge=0, le=100, description="% of generation that is renewable (SLL renewable_share KPI; 100 for pure RE assets)")


class PPAStream(BaseModel):
    enabled: bool = True
    price_usd_mwh: float = Field(58.0, ge=0)
    escalation_pct: float = Field(2.0, ge=-5, le=15)
    contracted_pct: float = Field(85.0, ge=0, le=100, description="% of volume contracted while PPA in tenor")
    tenor_years: int = Field(15, ge=0, le=40)


class MerchantStream(BaseModel):
    enabled: bool = True
    price_usd_mwh: float = Field(45.0, ge=0, description="Wholesale baseload price, year 1")
    escalation_pct: float = Field(2.0, ge=-5, le=15)
    capture_rate_pct: float = Field(90.0, ge=0, le=150, description="Capture price / baseload price (cannibalization)")


class CapacityStream(BaseModel):
    enabled: bool = False
    usd_per_mw_yr: float = Field(0.0, ge=0)
    escalation_pct: float = Field(2.0, ge=-5, le=15)


class RECStream(BaseModel):
    enabled: bool = True
    usd_per_mwh: float = Field(3.0, ge=0)
    tenor_years: int = Field(10, ge=0, le=40)


class CarbonStream(BaseModel):
    enabled: bool = False
    tonnes_per_yr: float = Field(0.0, ge=0)
    usd_per_tonne: float = Field(0.0, ge=0)
    escalation_pct: float = Field(3.0, ge=-5, le=20)


class RevenueConfig(BaseModel):
    ppa: PPAStream = PPAStream()
    merchant: MerchantStream = MerchantStream()
    capacity: CapacityStream = CapacityStream()
    rec: RECStream = RECStream()
    carbon: CarbonStream = CarbonStream()


class MaintenanceEvent(BaseModel):
    year: int = Field(..., ge=1, le=40, description="Operating year of the major-maintenance event")
    cost_musd: float = Field(..., ge=0)


class OpexConfig(BaseModel):
    fixed_usd_per_mw_yr: float = Field(17000.0, ge=0)
    fixed_escalation_pct: float = Field(2.0, ge=-5, le=15)
    variable_usd_per_mwh: float = Field(1.5, ge=0)
    insurance_pct_capex_yr: float = Field(0.5, ge=0, le=5, description="%/yr of total capex")
    land_lease_kusd_yr: float = Field(250.0, ge=0)
    lease_escalation_pct: float = Field(2.0, ge=-5, le=15)
    mra_annual_contribution_musd: float = Field(0.8, ge=0, description="Major-maintenance reserve funding per year")
    mra_funding_years: int = Field(10, ge=0, le=40, description="Contribute in operating years 1..N")
    major_maintenance: List[MaintenanceEvent] = Field(
        default=[MaintenanceEvent(year=12, cost_musd=6.0)],
        description="Events paid FROM the MRA balance; tax-deductible in event year")


class SLLConfig(BaseModel):
    """Sustainability-linked margin ratchet (docstring §11). The KPI is
    computed per period from the model's OWN emissions/generation."""
    enabled: bool = False
    kpi: str = Field("emissions_intensity", description="emissions_intensity (tCO2e/MWh, from climate.transition intensity × generation) | renewable_share (% vs generation.renewable_share_pct)")
    target_start: float = Field(0.05, ge=0, description="KPI target in operating year 1 (t/MWh or %)")
    target_end: float = Field(0.02, ge=0, description="KPI target in the final operating year (linear path)")
    step_up_bp: float = Field(25.0, ge=0, le=500, description="Margin step-UP (bp) per period when the KPI is WORSE than target")
    step_down_bp: float = Field(10.0, ge=0, le=500, description="Margin step-DOWN (bp) per period when the KPI beats target")


class DebtTranche(BaseModel):
    name: str = "Senior"
    sizing: str = Field("gearing", description="'gearing' (% of total funded cost incl IDC+DSRA) or 'amount'")
    gearing_pct: float = Field(70.0, ge=0, le=95)
    amount_musd: float = Field(0.0, ge=0)
    amort_type: str = Field("sculpted", description="sculpted | annuity | bullet")
    target_dscr: float = Field(1.30, ge=1.0, le=3.0, description="Sculpting target (sculpted only)")
    rate_type: str = Field("fixed", description="fixed | floating")
    fixed_rate_pct: float = Field(5.5, ge=0, le=25)
    base_rate_pct: float = Field(4.0, ge=0, le=25, description="Floating base (e.g. SOFR proxy), flat unless curve given")
    base_rate_curve_pct: Optional[List[float]] = Field(None, description="Optional per-operating-year base curve, %")
    margin_pct: float = Field(2.0, ge=0, le=15)
    swap_notional_pct: float = Field(0.0, ge=0, le=100, description="Pay-fixed swap share of floating notional, %")
    swap_fixed_rate_pct: float = Field(3.8, ge=0, le=25)
    tenor_years: int = Field(18, ge=1, le=35)
    dsra_months: int = Field(6, ge=0, le=24, description="DSRA target = months/12 × next-period DS")
    sll: SLLConfig = SLLConfig()


class RefinancingConfig(BaseModel):
    """Optional senior-tranche refinancing event (docstring §8)."""
    enabled: bool = False
    year: int = Field(7, ge=1, le=39, description="Operating year at whose END the refi executes")
    new_rate_pct: float = Field(4.5, ge=0, le=25, description="All-in fixed rate of the refi debt, %")
    new_tenor_years: int = Field(12, ge=1, le=35, description="Amortization tenor from the refi date")
    new_gearing_pct: Optional[float] = Field(None, ge=0, le=95, description="Gearing-up: new debt = % of total funded cost at COD (cash-out to equity). Null = refinance the outstanding balance only")
    fees_pct: float = Field(1.5, ge=0, le=10, description="Arrangement/breakage fees, % of the NEW debt amount (expensed, paid from proceeds)")
    new_amort_type: str = Field("annuity", description="annuity | sculpted")
    new_target_dscr: float = Field(1.30, ge=1.0, le=3.0, description="Sculpting target after refi (sculpted only)")


class WorkingCapitalConfig(BaseModel):
    """Receivable/payable days → ΔWC line (docstring §10)."""
    receivable_days: float = Field(0.0, ge=0, le=180)
    payable_days: float = Field(0.0, ge=0, le=180)


class InflationConfig(BaseModel):
    """Inflation curve + real/nominal view (docstring §9)."""
    enabled: bool = False
    mode: str = Field("nominal", description="nominal (inputs already nominal) | real_inputs (merchant/capacity/opex/lease prices are REAL, indexed by the curve; PPA/REC/carbon stay contractual nominal)")
    flat_pct: float = Field(2.0, ge=-5, le=30, description="Flat annual inflation %, used when no curve given")
    curve_pct: Optional[List[float]] = Field(None, description="Per-operating-year inflation %, last value held flat if shorter than ops")


class SustainabilityConfig(BaseModel):
    """User parameters for the sustainability analytics block (docstring §12).
    Both are stated user assumptions, labeled in the response."""
    shadow_carbon_price_usd_t: float = Field(50.0, ge=0, le=1000, description="Shadow price for the carbon-ADJUSTED equity IRR (unpriced-externality charge, $/tCO2e — NOT a project cash flow)")
    grid_baseline_intensity_t_per_mwh: float = Field(0.45, ge=0, le=1.5, description="User grid-baseline intensity for avoided-emissions accounting, tCO2e/MWh")


class WaterfallConfig(BaseModel):
    cash_sweep_pct: float = Field(0.0, ge=0, le=100, description="% of post-mezz cash prepaying senior principal")


class TaxConfig(BaseModel):
    rate_pct: float = Field(25.0, ge=0, le=60)
    depreciation: str = Field("straight_line", description="straight_line | macrs (5-yr, half-year convention)")
    sl_years: int = Field(25, ge=1, le=40)


class CovenantConfig(BaseModel):
    lockup_dscr: float = Field(1.15, ge=1.0, le=2.5, description="Senior DSCR below this → distributions trapped")
    default_dscr: float = Field(1.05, ge=0.8, le=2.0, description="Senior DSCR below this → default test breach")


class ClimateTransition(BaseModel):
    """Transition-risk channels (see module docstring §7). All parameters are
    stated model assumptions, visible and editable."""
    carbon_price_mode: str = Field("none", description="none | ngfs | custom")
    ngfs_scenario: str = Field("net_zero_2050", description="NGFS Phase 5 scenario id (see /api/v1/ngfs-extract)")
    ngfs_region: str = Field("World", description="World | EU | US | CN")
    custom_carbon_price_path: Optional[List[float]] = Field(None, description="Per-operating-year $/tCO2 (mode=custom; last value held flat if shorter than ops)")
    custom_gdp_impact_pct_path: Optional[List[float]] = Field(None, description="Per-operating-year GDP impact % (mode=custom only; last value held flat; feeds the same GDP-β merchant channel as NGFS paths)")
    emissions_intensity_t_per_mwh: float = Field(0.0, ge=0, le=2, description="Project's OWN emissions per MWh → carbon-cost opex line")
    fixed_emissions_t_per_yr: float = Field(0.0, ge=0, description="Non-generation emissions, t/yr → carbon-cost opex line")
    merchant_passthrough_pct: float = Field(0.0, ge=0, le=100, description="% of marginal-unit carbon cost passed into merchant power price")
    grid_marginal_intensity_t_per_mwh: float = Field(0.35, ge=0, le=1.5, description="Assumed marginal-unit grid intensity for pass-through (stated assumption)")
    index_carbon_revenue_to_path: bool = Field(False, description="Carbon-credit stream $/t follows the carbon price path instead of its own escalator")
    gdp_beta_merchant: float = Field(0.0, ge=-5, le=5, description="Merchant price sensitivity β to NGFS GDP-impact %: price × (1 + β×GDPimpact/100)")


class ClimatePhysical(BaseModel):
    """Physical-risk channels (see module docstring §7)."""
    chronic_derate_pct_yr: float = Field(0.0, ge=0, le=5, description="Extra annual generation derate, compounding (heat/resource drift)")
    acute_eal_pct_of_capex: float = Field(0.0, ge=0, le=10, description="Acute expected annual loss, % of capex/yr → opex line")
    acute_escalation_pct_yr: float = Field(0.0, ge=-5, le=20, description="EAL escalation %/yr (hazard intensification)")
    insurance_escalation_pct_yr: float = Field(0.0, ge=-5, le=25, description="Insurance premium escalation %/yr (increment over the flat base premium)")
    downtime_days_per_yr: float = Field(0.0, ge=0, le=90, description="Expected outage days/yr → volume haircut × (1 − days/365)")


class ClimateConfig(BaseModel):
    enabled: bool = False
    start_year: int = Field(2027, ge=2024, le=2045, description="Calendar year of operating year 1 (maps ops years onto NGFS paths)")
    transition: ClimateTransition = ClimateTransition()
    physical: ClimatePhysical = ClimatePhysical()


class ModelInputs(BaseModel):
    project_name: str = "100 MW Solar PV (illustrative)"
    timeline: TimelineConfig = TimelineConfig()
    capex: CapexConfig = CapexConfig()
    generation: GenerationConfig = GenerationConfig()
    revenue: RevenueConfig = RevenueConfig()
    opex: OpexConfig = OpexConfig()
    tranches: List[DebtTranche] = Field(default=[DebtTranche()], min_length=1, max_length=2)
    waterfall: WaterfallConfig = WaterfallConfig()
    tax: TaxConfig = TaxConfig()
    covenants: CovenantConfig = CovenantConfig()
    discount_rate_pct: float = Field(8.0, ge=0, le=30, description="Equity NPV discount rate")
    climate: ClimateConfig = ClimateConfig()
    refinancing: RefinancingConfig = RefinancingConfig()
    working_capital: WorkingCapitalConfig = WorkingCapitalConfig()
    inflation: InflationConfig = InflationConfig()
    sustainability: SustainabilityConfig = SustainabilityConfig()


class SensitivityRequest(BaseModel):
    inputs: ModelInputs
    param_x: str = Field("ppa_price", description="Driver for grid axis X (see /run docstring driver list)")
    range_x_pct: float = Field(30.0, gt=0, le=90, description="±% around base for X")
    steps_x: int = Field(7, ge=3, le=15)
    param_y: Optional[str] = Field("capex", description="Optional second axis (2D grid); null → 1D")
    range_y_pct: float = Field(20.0, gt=0, le=90)
    steps_y: int = Field(5, ge=3, le=11)
    tornado_pct: float = Field(10.0, gt=0, le=50, description="±% one-at-a-time shock for tornado")
    tornado_params: List[str] = Field(default=[
        "ppa_price", "merchant_price", "capex", "capacity_factor",
        "opex_fixed", "debt_rate", "degradation", "gearing",
    ])


class UncertainInput(BaseModel):
    param: str
    dist: str = Field("triangular", description="uniform | triangular")
    low: float = Field(0.85, gt=0, description="Multiplier on the base input (min)")
    mode: float = Field(1.0, gt=0, description="Multiplier mode (triangular only)")
    high: float = Field(1.15, gt=0, description="Multiplier max")


class SimulateRequest(BaseModel):
    inputs: ModelInputs
    n_scenarios: int = Field(500, ge=16, le=2000)
    hurdle_irr_pct: float = Field(10.0, ge=0, le=40)
    histogram_bins: int = Field(20, ge=5, le=50)
    uncertain: List[UncertainInput] = Field(default=[
        UncertainInput(param="ppa_price", dist="triangular", low=0.85, mode=1.0, high=1.10),
        UncertainInput(param="merchant_price", dist="triangular", low=0.60, mode=1.0, high=1.40),
        UncertainInput(param="capex", dist="triangular", low=0.92, mode=1.0, high=1.15),
        UncertainInput(param="capacity_factor", dist="triangular", low=0.92, mode=1.0, high=1.05),
        UncertainInput(param="opex_fixed", dist="uniform", low=0.90, mode=1.0, high=1.20),
    ], max_length=10)


class SolveRequest(BaseModel):
    inputs: ModelInputs
    solve_for: str = Field("ppa_price", description="ppa_price | capex | gearing | merchant_price | capture_rate | refi_year (discrete scan)")
    target_metric: str = Field("equity_irr", description="equity_irr (fraction, e.g. 0.10) | min_dscr | llcr | carbon_adjusted_irr (fraction)")
    target_value: float = Field(0.10)


class SolveFrontierRequest(BaseModel):
    """(gearing × PPA price) iso-metric frontier — docstring §14."""
    inputs: ModelInputs
    target_metric: str = Field("equity_irr", description="equity_irr | min_dscr | llcr | carbon_adjusted_irr")
    target_value: float = Field(0.12)
    gearing_min_pct: float = Field(45.0, ge=5, le=95)
    gearing_max_pct: float = Field(85.0, ge=5, le=95)
    gearing_steps: int = Field(7, ge=3, le=15)


class CustomScenarioSpec(BaseModel):
    """User-designed climate scenario for /scenario-matrix (docstring §8 of the
    endpoint): a named carbon-price path + optional GDP-impact path."""
    name: str = Field(..., min_length=1, max_length=60)
    carbon_price_path: List[float] = Field(..., min_length=1, description="Per-operating-year $/tCO2e (last value held flat)")
    gdp_impact_pct_path: Optional[List[float]] = Field(None, description="Per-operating-year GDP impact % vs baseline (last held flat); feeds the GDP-β merchant channel")


class ScenarioMatrixRequest(BaseModel):
    inputs: ModelInputs
    scenarios: Optional[List[str]] = Field(None, description="NGFS scenario ids; default = every scenario in the extract")
    custom_scenarios: List[CustomScenarioSpec] = Field(default=[], max_length=8, description="User-designed scenarios run alongside NGFS")
    region: Optional[str] = Field(None, description="NGFS region override; default = inputs.climate.transition.ngfs_region")
    include_no_climate_baseline: bool = Field(True, description="Prepend a no-climate baseline row")


class HoldCoConfig(BaseModel):
    """HoldCo debt layer on asset distributions (structural subordination,
    docstring §13)."""
    enabled: bool = True
    debt_musd: float = Field(30.0, ge=0)
    rate_pct: float = Field(7.5, ge=0, le=25)
    tenor_years: int = Field(10, ge=1, le=35)
    lockup_dscr: float = Field(1.20, ge=1.0, le=3.0, description="HoldCo DSCR below this → breach reported")


class PortfolioAsset(BaseModel):
    name: Optional[str] = None
    template_id: Optional[str] = Field(None, description="solar_100mw | bess_400mwh | wind_50mw_carbon (used when inputs is null)")
    inputs: Optional[ModelInputs] = None


class PortfolioRequest(BaseModel):
    assets: List[PortfolioAsset] = Field(..., min_length=2, max_length=5)
    holdco: HoldCoConfig = HoldCoConfig()
    discount_rate_pct: float = Field(8.0, ge=0, le=30)


# ─────────────────────────────────────────────────────────────────────────────
# Driver override machinery (shared by /sensitivity, /simulate, /solve).
# Each driver applies a MULTIPLIER to the relevant base input(s).
# ─────────────────────────────────────────────────────────────────────────────
def _apply_driver(inp: dict, param: str, mult: float) -> None:
    """Mutate a model-input dict, scaling the named driver by `mult`."""
    if param == "ppa_price":
        inp["revenue"]["ppa"]["price_usd_mwh"] *= mult
    elif param == "merchant_price":
        inp["revenue"]["merchant"]["price_usd_mwh"] *= mult
    elif param == "capex":
        inp["capex"]["total_capex_musd"] *= mult
    elif param == "gearing":
        for tr in inp["tranches"]:
            if tr["sizing"] == "gearing":
                tr["gearing_pct"] = min(95.0, tr["gearing_pct"] * mult)
            else:
                tr["amount_musd"] *= mult
    elif param == "capacity_factor":
        g = inp["generation"]
        for k in ("capacity_factor_p50", "capacity_factor_p90", "capacity_factor_p99"):
            g[k] = min(0.99, g[k] * mult)
    elif param == "opex_fixed":
        inp["opex"]["fixed_usd_per_mw_yr"] *= mult
    elif param == "debt_rate":
        for tr in inp["tranches"]:
            tr["fixed_rate_pct"] *= mult
            tr["base_rate_pct"] *= mult
            tr["swap_fixed_rate_pct"] *= mult
            if tr.get("base_rate_curve_pct"):
                tr["base_rate_curve_pct"] = [r * mult for r in tr["base_rate_curve_pct"]]
    elif param == "degradation":
        inp["generation"]["degradation_pct_yr"] *= mult
    elif param == "carbon_price":
        inp["revenue"]["carbon"]["usd_per_tonne"] *= mult
    elif param == "rec_price":
        inp["revenue"]["rec"]["usd_per_mwh"] *= mult
    elif param == "capture_rate":
        inp["revenue"]["merchant"]["capture_rate_pct"] = min(150.0, inp["revenue"]["merchant"]["capture_rate_pct"] * mult)
    else:
        raise HTTPException(status_code=422, detail=f"Unknown driver '{param}'. "
                            "Valid: ppa_price, merchant_price, capex, gearing, capacity_factor, "
                            "opex_fixed, debt_rate, degradation, carbon_price, rec_price, capture_rate")


def _driver_base_value(inp: dict, param: str) -> float:
    """Absolute base value of a driver (for reporting solved values)."""
    return {
        "ppa_price": lambda: inp["revenue"]["ppa"]["price_usd_mwh"],
        "merchant_price": lambda: inp["revenue"]["merchant"]["price_usd_mwh"],
        "capex": lambda: inp["capex"]["total_capex_musd"],
        "gearing": lambda: inp["tranches"][0]["gearing_pct"],
        "capacity_factor": lambda: inp["generation"]["capacity_factor_p50"],
        "opex_fixed": lambda: inp["opex"]["fixed_usd_per_mw_yr"],
        "debt_rate": lambda: inp["tranches"][0]["fixed_rate_pct"],
        "degradation": lambda: inp["generation"]["degradation_pct_yr"],
        "carbon_price": lambda: inp["revenue"]["carbon"]["usd_per_tonne"],
        "rec_price": lambda: inp["revenue"]["rec"]["usd_per_mwh"],
        "capture_rate": lambda: inp["revenue"]["merchant"]["capture_rate_pct"],
        "refi_year": lambda: float(inp["refinancing"]["year"]),
    }.get(param, lambda: float("nan"))()


# ─────────────────────────────────────────────────────────────────────────────
# IRR solver — Newton's method with bisection fallback (no scipy).
# f(r) = Σ cf_i (1+r)^(−t_i);  f'(r) = Σ −t_i cf_i (1+r)^(−t_i−1)
# ─────────────────────────────────────────────────────────────────────────────
def _npv_at(rate: float, flows: List[float], times: List[float]) -> float:
    return sum(cf * (1.0 + rate) ** (-t) for cf, t in zip(flows, times))


def _irr(flows: List[float], times: List[float]) -> Optional[float]:
    if not flows or all(cf >= 0 for cf in flows) or all(cf <= 0 for cf in flows):
        return None
    # Newton from 8%
    r = 0.08
    for _ in range(60):
        f = _npv_at(r, flows, times)
        fp = sum(-t * cf * (1.0 + r) ** (-t - 1.0) for cf, t in zip(flows, times))
        if abs(fp) < 1e-12:
            break
        r_new = r - f / fp
        if r_new <= -0.95 or r_new > 10.0 or math.isnan(r_new):
            break  # left the sane bracket → bisection fallback
        if abs(r_new - r) < 1e-9:
            return r_new
        r = r_new
    # Bisection fallback on [−0.95, 10]
    lo, hi = -0.95, 10.0
    f_lo, f_hi = _npv_at(lo, flows, times), _npv_at(hi, flows, times)
    if f_lo * f_hi > 0:
        return None
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        f_mid = _npv_at(mid, flows, times)
        if abs(f_mid) < 1e-10 or (hi - lo) < 1e-10:
            return mid
        if f_lo * f_mid <= 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return 0.5 * (lo + hi)


# ─────────────────────────────────────────────────────────────────────────────
# Halton low-discrepancy sequence (deterministic QMC — NOT a PRNG).
# Radical inverse: write i in base b, reflect digits about the radix point.
# ─────────────────────────────────────────────────────────────────────────────
def _halton(index: int, base: int) -> float:
    f, result = 1.0, 0.0
    i = index
    while i > 0:
        f /= base
        result += f * (i % base)
        i //= base
    return result


def _inv_cdf(u: float, spec: dict) -> float:
    """Map a uniform u∈(0,1) to the input distribution via inverse CDF."""
    a, b = spec["low"], spec["high"]
    if spec["dist"] == "uniform":
        return a + u * (b - a)
    c = min(max(spec["mode"], a), b)  # triangular mode clamped into [a,b]
    if b <= a:
        return a
    fc = (c - a) / (b - a)
    if u <= fc:
        return a + math.sqrt(u * (b - a) * (c - a))
    return b - math.sqrt((1.0 - u) * (b - a) * (b - c))


# ─────────────────────────────────────────────────────────────────────────────
# CLIMATE CHANNELS — precomputed per-operating-year arrays (docstring §7).
# These feed the SAME period loop below; nothing about the waterfall/statement
# code path changes, only the revenue/opex/volume primitives it consumes.
# ─────────────────────────────────────────────────────────────────────────────
def _interp_annual(step_years: List[int], step_vals: List[float], start_year: int, n_years: int) -> List[float]:
    """Linear interpolation of the NGFS 5-year steps to annual values for
    calendar years start_year..start_year+n_years−1, clamped flat outside the
    extract's range (docstring §7 formula)."""
    out = []
    for k in range(n_years):
        y = start_year + k
        if y <= step_years[0]:
            out.append(float(step_vals[0]))
        elif y >= step_years[-1]:
            out.append(float(step_vals[-1]))
        else:
            for j in range(len(step_years) - 1):
                y0, y1 = step_years[j], step_years[j + 1]
                if y0 <= y <= y1:
                    w = (y - y0) / (y1 - y0)
                    out.append(float(step_vals[j] + (step_vals[j + 1] - step_vals[j]) * w))
                    break
    return out


def _ngfs_annual_paths(scenario: str, region: str, start_year: int, n_years: int) -> dict:
    """Load the seeded NGFS Phase 5 extract and interpolate carbon_price and
    gdp_impact_pct to annual paths. Raises 422 for unknown scenario/region."""
    extract = _load_ngfs_extract()
    if scenario not in extract["data"]:
        raise HTTPException(status_code=422, detail=f"Unknown NGFS scenario '{scenario}'. Valid: {sorted(extract['data'].keys())}")
    if region not in extract["data"][scenario]:
        raise HTTPException(status_code=422, detail=f"Unknown NGFS region '{region}'. Valid: {sorted(extract['data'][scenario].keys())}")
    cube = extract["data"][scenario][region]
    years = extract["years"]
    return {
        "carbon_price": _interp_annual(years, cube["carbon_price"], start_year, n_years),
        "gdp_impact_pct": _interp_annual(years, cube["gdp_impact_pct"], start_year, n_years),
        "provenance": {
            "source": extract["_meta"].get("source"),
            "release": extract["_meta"].get("release"),
            "scenario": scenario, "region": region,
            "step_years": years,
            "note": "Seeded extract, 5-yr steps linearly interpolated to annual; "
                    "refresh from data.ene.iiasa.ac.at/ngfs for production precision.",
        },
    }


def _build_climate_arrays(inp: dict) -> Optional[dict]:
    """Precompute per-operating-year climate channel arrays from the config.
    Returns None when climate is disabled (baseline path — bit-identical to the
    pre-climate engine). All formulas: module docstring §7."""
    cl = inp.get("climate") or {}
    if not cl.get("enabled"):
        return None
    Y = inp["timeline"]["operations_years"]
    tr, ph = cl["transition"], cl["physical"]

    provenance = None
    if tr["carbon_price_mode"] == "ngfs":
        paths = _ngfs_annual_paths(tr["ngfs_scenario"], tr["ngfs_region"], cl["start_year"], Y)
        cp = paths["carbon_price"]
        gdp = paths["gdp_impact_pct"]
        provenance = paths["provenance"]
    elif tr["carbon_price_mode"] == "custom":
        raw = tr.get("custom_carbon_price_path") or [0.0]
        cp = [float(raw[min(k, len(raw) - 1)]) for k in range(Y)]
        raw_gdp = tr.get("custom_gdp_impact_pct_path")
        gdp = [float(raw_gdp[min(k, len(raw_gdp) - 1)]) for k in range(Y)] if raw_gdp else [0.0] * Y
        provenance = {"source": "user-supplied custom carbon price path"
                      + (" + custom GDP-impact path" if raw_gdp else ""), "scenario": "custom"}
    else:  # "none": no carbon price; physical channels may still be active
        cp = [0.0] * Y
        gdp = [0.0] * Y

    uplift = [c * tr["grid_marginal_intensity_t_per_mwh"] * tr["merchant_passthrough_pct"] / 100.0 for c in cp]
    gdp_factor = [1.0 + tr["gdp_beta_merchant"] * g / 100.0 for g in gdp]
    derate = ph["chronic_derate_pct_yr"] / 100.0
    downtime_f = 1.0 - ph["downtime_days_per_yr"] / 365.0
    volume_factor = [((1.0 - derate) ** (k + 1)) * downtime_f if (derate > 0 or ph["downtime_days_per_yr"] > 0)
                     else 1.0 for k in range(Y)]
    capex = inp["capex"]["total_capex_musd"]
    acute = [ph["acute_eal_pct_of_capex"] / 100.0 * capex * (1.0 + ph["acute_escalation_pct_yr"] / 100.0) ** k
             for k in range(Y)] if ph["acute_eal_pct_of_capex"] > 0 else [0.0] * Y
    ins_base = inp["opex"]["insurance_pct_capex_yr"] / 100.0 * capex
    ins_extra = [ins_base * ((1.0 + ph["insurance_escalation_pct_yr"] / 100.0) ** k - 1.0)
                 for k in range(Y)] if ph["insurance_escalation_pct_yr"] != 0 else [0.0] * Y

    return {
        "carbon_price": cp, "gdp_impact_pct": gdp, "gdp_factor": gdp_factor,
        "merchant_uplift_usd_mwh": uplift, "volume_factor": volume_factor,
        "acute_eal_musd": acute, "insurance_extra_musd": ins_extra,
        "emissions_intensity": tr["emissions_intensity_t_per_mwh"],
        "fixed_emissions": tr["fixed_emissions_t_per_yr"],
        "index_carbon_revenue": bool(tr["index_carbon_revenue_to_path"]) and tr["carbon_price_mode"] != "none",
        "start_year": cl["start_year"], "provenance": provenance,
    }


# ─────────────────────────────────────────────────────────────────────────────
# THE CORE MODEL — one forward evaluation given fixed-point state.
# Then run_model() wraps it in the fixed-point iteration.
# ─────────────────────────────────────────────────────────────────────────────
def _tranche_construction_rate(tr: dict) -> float:
    """Annual construction-period rate (swap effective from COD only)."""
    if tr["rate_type"] == "fixed":
        return tr["fixed_rate_pct"] / 100.0
    return (tr["base_rate_pct"] + tr["margin_pct"]) / 100.0


def _tranche_ops_rate(tr: dict, t_index: int) -> float:
    """Effective annual rate in operating year t (0-based index)."""
    if tr["rate_type"] == "fixed":
        return tr["fixed_rate_pct"] / 100.0
    curve = tr.get("base_rate_curve_pct")
    base = curve[min(t_index, len(curve) - 1)] if curve else tr["base_rate_pct"]
    s = tr["swap_notional_pct"] / 100.0
    swapped = (tr["swap_fixed_rate_pct"] + tr["margin_pct"]) / 100.0
    floating = (base + tr["margin_pct"]) / 100.0
    return s * swapped + (1.0 - s) * floating


def _scurve_weights(months: int, curve: str, k: float) -> List[float]:
    if curve == "linear" or months == 1:
        return [1.0 / months] * months
    def F(x: float) -> float:
        return 1.0 / (1.0 + math.exp(-k * (x - 0.5)))
    f0, f1 = F(0.0), F(1.0)
    return [(F(m / months) - F((m - 1) / months)) / (f1 - f0) for m in range(1, months + 1)]


def _evaluate(inp: dict, state: dict, clim: Optional[dict] = None) -> dict:
    """One forward pass of the full model given fixed-point state:
    state = {idc, dsra0_by_tranche: [..], ds_prev: [tranche][year]}
    clim: optional precomputed climate-channel arrays (_build_climate_arrays);
    when None the pass is the exact pre-climate baseline (identical floats)."""
    tl, cap, gen, rev, opx = inp["timeline"], inp["capex"], inp["generation"], inp["revenue"], inp["opex"]
    tranches, tax_cfg, cov = inp["tranches"], inp["tax"], inp["covenants"]
    Y = tl["operations_years"]
    M = tl["construction_months"]
    n_tr = len(tranches)

    # ── Sizing on total funded cost (uses fixed-point state for IDC + DSRA0) ──
    dsra0_total = sum(state["dsra0_by_tranche"])
    c_total = cap["total_capex_musd"] + state["idc"] + dsra0_total
    debt_sizes = []
    for tr in tranches:
        if tr["sizing"] == "amount":
            debt_sizes.append(min(tr["amount_musd"], 0.95 * c_total))
        else:
            debt_sizes.append(tr["gearing_pct"] / 100.0 * c_total)
    debt_total = sum(debt_sizes)
    if debt_total >= 0.98 * c_total:  # keep ≥2% equity, avoid degenerate model
        scale = 0.95 * c_total / debt_total
        debt_sizes = [d * scale for d in debt_sizes]
        debt_total = sum(debt_sizes)
    g = debt_total / c_total if c_total > 0 else 0.0
    tr_share = [d / debt_total if debt_total > 0 else 0.0 for d in debt_sizes]

    # ── Construction phase (monthly) ──────────────────────────────────────────
    w = _scurve_weights(M, cap["drawdown_curve"], cap["logistic_steepness"])
    con_rows = []
    tr_bal_con = [0.0] * n_tr
    idc_total, equity_drawn, debt_drawn_total = 0.0, 0.0, 0.0
    for m in range(1, M + 1):
        capex_draw = cap["total_capex_musd"] * w[m - 1]
        idc_m = sum(tr_bal_con[i] * _tranche_construction_rate(tranches[i]) / 12.0 for i in range(n_tr))
        fund_need = capex_draw + idc_m
        debt_draw = g * fund_need
        equity_draw = (1.0 - g) * fund_need
        for i in range(n_tr):
            tr_bal_con[i] += debt_draw * tr_share[i]
        idc_total += idc_m
        equity_drawn += equity_draw
        debt_drawn_total += debt_draw
        con_rows.append({
            "month": m, "capex_draw_musd": round(capex_draw, 6), "idc_musd": round(idc_m, 6),
            "debt_draw_musd": round(debt_draw, 6), "equity_draw_musd": round(equity_draw, 6),
            "cum_debt_musd": round(sum(tr_bal_con), 6),
        })
    # DSRA0 funded pro-rata at COD (part of project cost)
    dsra_bal = list(state["dsra0_by_tranche"])
    debt_dsra = g * dsra0_total
    equity_dsra = (1.0 - g) * dsra0_total
    for i in range(n_tr):
        tr_bal_con[i] += debt_dsra * tr_share[i]
    equity_drawn += equity_dsra
    debt_drawn_total += debt_dsra
    equity_total = equity_drawn

    dep_base = cap["total_capex_musd"] + idc_total  # DSRA is cash, not depreciated

    # ── Operations forward pass ───────────────────────────────────────────────
    ncf = {"P50": gen["capacity_factor_p50"], "P90": gen["capacity_factor_p90"],
           "P99": gen["capacity_factor_p99"]}.get(gen["production_case"].upper(), gen["capacity_factor_p50"])
    d = gen["degradation_pct_yr"] / 100.0
    mw = gen["capacity_mw"]
    tax_rate = tax_cfg["rate_pct"] / 100.0
    maint_by_year = {}
    for ev in opx["major_maintenance"]:
        maint_by_year[ev["year"]] = maint_by_year.get(ev["year"], 0.0) + ev["cost_musd"]

    # ── Inflation index I_t (docstring §9) ────────────────────────────────────
    infl = inp.get("inflation") or {}
    infl_on = bool(infl.get("enabled"))
    if infl_on:
        _curve = infl.get("curve_pct") or []
        _flat = infl.get("flat_pct", 0.0)
        pi_path = [(_curve[min(k, len(_curve) - 1)] if _curve else _flat) / 100.0 for k in range(Y)]
    else:
        pi_path = [0.0] * Y
    infl_index = []
    _acc = 1.0
    for k in range(Y):
        _acc *= (1.0 + pi_path[k])
        infl_index.append(_acc)
    index_real = infl_on and infl.get("mode") == "real_inputs"

    # ── Working capital (docstring §10) ───────────────────────────────────────
    wc_cfg = inp.get("working_capital") or {}
    rec_days = float(wc_cfg.get("receivable_days", 0.0))
    pay_days = float(wc_cfg.get("payable_days", 0.0))
    ar_prev, ap_prev = 0.0, 0.0

    # ── Refinancing (docstring §8; senior tranche = tranche 0) ────────────────
    rf = inp.get("refinancing") or {}
    rf_on = bool(rf.get("enabled")) and n_tr >= 1
    rf_year = int(rf.get("year", 0)) if rf_on else 0
    if rf_on and rf_year >= Y:
        rf_on = False   # refi at/after the final year is a no-op
    refi_annuity = 0.0
    refi_event = {"fee_musd": 0.0, "cash_out_musd": 0.0,
                  "balance_refinanced_musd": 0.0, "new_debt_musd": 0.0}

    # ── SLL margin ratchet (docstring §11) — KPI from the model's OWN data ────
    _cl_tr = (inp.get("climate") or {}).get("transition", {}) or {}
    sll_ei = float(_cl_tr.get("emissions_intensity_t_per_mwh", 0.0))
    sll_fe = float(_cl_tr.get("fixed_emissions_t_per_yr", 0.0))

    def _sll_adj_bp(tr: dict, ti: int, energy_mwh: float) -> float:
        s = tr.get("sll") or {}
        if not s.get("enabled"):
            return 0.0
        frac = ti / max(Y - 1, 1)
        target = s["target_start"] + (s["target_end"] - s["target_start"]) * frac
        if s.get("kpi") == "renewable_share":
            actual = float(gen.get("renewable_share_pct", 100.0))
            worse = actual < target
        else:  # emissions_intensity
            actual = (energy_mwh * sll_ei + sll_fe) / energy_mwh if energy_mwh > 0 else 0.0
            worse = actual > target
        return float(s["step_up_bp"]) if worse else -float(s["step_down_bp"])

    def _ops_rate(i: int, ti: int) -> float:
        """Effective BASE rate (pre-SLL) — refi overrides tranche 0 after rf_year."""
        if rf_on and i == 0 and (ti + 1) > rf_year:
            return rf["new_rate_pct"] / 100.0
        return _tranche_ops_rate(tranches[i], ti)

    tr_bal = list(tr_bal_con)              # opening balances at COD
    annuity_pmt = []                       # level payment per annuity tranche
    for i, tr in enumerate(tranches):
        if tr["amort_type"] == "annuity":
            r1 = _tranche_ops_rate(tr, 0)
            n = tr["tenor_years"]
            annuity_pmt.append(tr_bal[i] * r1 / (1.0 - (1.0 + r1) ** (-n)) if r1 > 1e-9 else tr_bal[i] / n)
        else:
            annuity_pmt.append(0.0)

    mra_bal, trapped, clf = 0.0, 0.0, 0.0
    cum_dep, cum_ni, cum_dist = 0.0, 0.0, 0.0
    periods, bs_rows, is_rows, cf_rows = [], [], [], []
    ds_new = [[0.0] * Y for _ in range(n_tr)]
    lockup_periods, default_periods, payment_defaults = [], [], []
    dscr_senior_series, cfads_series, dist_series = [], [], []
    em_series, energy_series, carbon_cost_series, debt_close_series = [], [], [], []
    max_bs_gap = 0.0

    for t in range(1, Y + 1):
        ti = t - 1
        energy_mwh = mw * ncf * HOURS_PER_YEAR * (1.0 - d) ** ti
        if clim is not None:
            # Physical channels: chronic derate + downtime volume haircut (§7)
            energy_mwh *= clim["volume_factor"][ti]

        # Revenue streams ($M)
        ppa, mer, capr, rec, car = rev["ppa"], rev["merchant"], rev["capacity"], rev["rec"], rev["carbon"]
        contracted_mwh = energy_mwh * ppa["contracted_pct"] / 100.0 if (ppa["enabled"] and t <= ppa["tenor_years"]) else 0.0
        merchant_mwh = (energy_mwh - contracted_mwh) if mer["enabled"] else 0.0
        # Real-input indexation (§9): merchant/capacity/opex lines × I_t;
        # PPA, REC and carbon prices stay contractual nominal.
        ix = infl_index[ti] if index_real else 1.0
        r_ppa = contracted_mwh * ppa["price_usd_mwh"] * (1 + ppa["escalation_pct"] / 100.0) ** ti / 1e6
        mer_price = mer["price_usd_mwh"] * (1 + mer["escalation_pct"] / 100.0) ** ti * ix
        uplift_rev = 0.0
        if clim is not None:
            # Transition channels on merchant price: carbon pass-through uplift
            # (additive, $/MWh, before capture) and GDP-impact multiplier (§7)
            mer_price = (mer_price + clim["merchant_uplift_usd_mwh"][ti]) * clim["gdp_factor"][ti]
            uplift_rev = merchant_mwh * clim["merchant_uplift_usd_mwh"][ti] * mer["capture_rate_pct"] / 100.0 / 1e6
        r_mer = merchant_mwh * mer_price * mer["capture_rate_pct"] / 100.0 / 1e6
        r_cap = capr["usd_per_mw_yr"] * mw * (1 + capr["escalation_pct"] / 100.0) ** ti * ix / 1e6 if capr["enabled"] else 0.0
        r_rec = rec["usd_per_mwh"] * energy_mwh / 1e6 if (rec["enabled"] and t <= rec["tenor_years"]) else 0.0
        if car["enabled"]:
            if clim is not None and clim["index_carbon_revenue"]:
                # Carbon revenue indexed to the scenario carbon price path (§7)
                car_price = clim["carbon_price"][ti]
            else:
                car_price = car["usd_per_tonne"] * (1 + car["escalation_pct"] / 100.0) ** ti
            r_car = car["tonnes_per_yr"] * car_price / 1e6
        else:
            r_car = 0.0
        revenue = r_ppa + r_mer + r_cap + r_rec + r_car

        # Opex ($M) — §9: fixed/variable/lease are real-indexed by I_t in
        # real_inputs mode; insurance stays a flat % of (nominal) capex.
        o_fix = opx["fixed_usd_per_mw_yr"] * mw * (1 + opx["fixed_escalation_pct"] / 100.0) ** ti * ix / 1e6
        o_var = opx["variable_usd_per_mwh"] * energy_mwh * ix / 1e6
        o_ins = opx["insurance_pct_capex_yr"] / 100.0 * cap["total_capex_musd"]
        o_lease = opx["land_lease_kusd_yr"] * (1 + opx["lease_escalation_pct"] / 100.0) ** ti * ix / 1e3
        o_carbon_cost, o_acute_eal, o_ins_extra = 0.0, 0.0, 0.0
        if clim is not None:
            # Transition: own-emissions carbon cost; Physical: acute EAL and
            # insurance premium escalation — explicit opex lines (§7)
            o_carbon_cost = (energy_mwh * clim["emissions_intensity"] + clim["fixed_emissions"]) \
                * clim["carbon_price"][ti] / 1e6
            o_acute_eal = clim["acute_eal_musd"][ti]
            o_ins_extra = clim["insurance_extra_musd"][ti]
        opex = o_fix + o_var + o_ins + o_lease + o_carbon_cost + o_acute_eal + o_ins_extra
        ebitda = revenue - opex

        # Own emissions (§12) — always computed from climate.transition intensity
        # (even when climate channels are disabled): Em_t = E_t × EI + FE [tCO2e]
        em_t = energy_mwh * sll_ei + sll_fe

        # Depreciation
        if tax_cfg["depreciation"] == "macrs":
            dep = dep_base * MACRS_5YR[ti] if ti < len(MACRS_5YR) else 0.0
        else:
            sl = min(tax_cfg["sl_years"], Y)
            dep = dep_base / sl if t <= sl else 0.0

        # Interest on opening balances — refi-aware base rate (§8) + SLL margin
        # ratchet ADD-ON (§11): Int_t = B_{t−1} × (r_base,t + adj_bp,t/10000)
        adj_bp_tr = [_sll_adj_bp(tranches[i], ti, energy_mwh) if tr_bal[i] > 1e-12 else 0.0
                     for i in range(n_tr)]
        base_int_tr = [tr_bal[i] * _ops_rate(i, ti) for i in range(n_tr)]
        interest_tr = [base_int_tr[i] + tr_bal[i] * adj_bp_tr[i] / 10000.0 for i in range(n_tr)]
        interest = sum(interest_tr)
        maint = maint_by_year.get(t, 0.0)

        # Tax with carryforward ledger
        taxable = ebitda - dep - interest - maint
        if taxable < 0:
            clf += -taxable
            used, tax_paid = 0.0, 0.0
        else:
            used = min(clf, taxable)
            clf -= used
            tax_paid = tax_rate * (taxable - used)

        # CFADS with working-capital movement (§10):
        # AR = Rev × rec_days/365, AP = Opex × pay_days/365, ΔWC consumes cash.
        # Terminal unwind: AR_Y = AP_Y = 0 (final-year collection/payment).
        mra_c = opx["mra_annual_contribution_musd"] if t <= opx["mra_funding_years"] else 0.0
        ar_t = 0.0 if t == Y else max(revenue, 0.0) * rec_days / 365.0
        ap_t = 0.0 if t == Y else max(opex, 0.0) * pay_days / 365.0
        d_wc = (ar_t - ap_t) - (ar_prev - ap_prev)
        ar_prev, ap_prev = ar_t, ap_t
        cfads = ebitda - tax_paid - mra_c - d_wc

        # Debt service per tranche (senior = tranche 0)
        ds_paid_tr, prin_tr, dscr_tr = [0.0] * n_tr, [0.0] * n_tr, [None] * n_tr
        cash = cfads
        dsra_draws = [0.0] * n_tr
        cfads_avail = cfads  # for tranche-level DSCR numerators
        for i, tr in enumerate(tranches):
            B = tr_bal[i]
            it_i = interest_tr[i]
            post_refi = rf_on and i == 0 and t > rf_year
            if B > 1e-12:
                if post_refi:
                    # §8: senior amortizes on the REFI schedule from year N+1
                    refi_end = rf_year + int(rf["new_tenor_years"])
                    if rf.get("new_amort_type") == "sculpted":
                        target = max(rf.get("new_target_dscr", 1.30), 1.0)
                        ds_target = max(cfads_avail, 0.0) / target
                        prin = min(max(ds_target - it_i, 0.0), B)
                        if t >= refi_end:
                            prin = B  # balloon at refi tenor
                        ds_i = it_i + prin
                    else:  # annuity A' computed at the refi date
                        if t <= refi_end:
                            prin = min(max(refi_annuity - base_int_tr[i], 0.0), B)
                            if t == refi_end:
                                prin = B
                            ds_i = it_i + prin
                        else:
                            prin, ds_i = B, it_i + B
                elif tr["amort_type"] == "sculpted":
                    target = max(tr["target_dscr"], 1.0)
                    ds_target = max(cfads_avail, 0.0) / target
                    prin = min(max(ds_target - it_i, 0.0), B)
                    if t >= tr["tenor_years"]:
                        prin = B  # final balloon: any remaining balance repays at tenor
                    ds_i = it_i + prin
                elif tr["amort_type"] == "annuity":
                    # §11: principal keeps the BASE-rate annuity split, so an SLL
                    # step-up raises DS (adjusted interest + unchanged principal)
                    if t <= tr["tenor_years"]:
                        prin = min(max(annuity_pmt[i] - base_int_tr[i], 0.0), B)
                        if t == tr["tenor_years"]:
                            prin = B
                        ds_i = it_i + prin
                    else:
                        prin, ds_i = B, it_i + B  # safety: repay anything left
                else:  # bullet
                    prin = B if t >= tr["tenor_years"] else 0.0
                    ds_i = it_i + prin
            else:
                ds_i, prin = 0.0, 0.0
            ds_new[i][ti] = ds_i
            dscr_tr[i] = (cfads_avail / ds_i) if ds_i > 1e-9 else None
            # Pay DS from cash; shortfall draws the tranche's DSRA
            pay_from_cash = min(max(cash, 0.0), ds_i)
            shortfall = ds_i - pay_from_cash
            dsra_draw = min(shortfall, dsra_bal[i])
            unpaid = shortfall - dsra_draw
            if unpaid > 1e-9:
                payment_defaults.append({"period": t, "tranche": tr["name"],
                                         "unpaid_musd": round(unpaid, 4)})
            # Unpaid DS defers: first cancels scheduled principal, any unpaid
            # interest beyond that CAPITALIZES onto the balance (prin_eff < 0),
            # which keeps the cash ledger and balance sheet consistent.
            prin_eff = prin - unpaid
            cash -= pay_from_cash
            dsra_bal[i] -= dsra_draw
            dsra_draws[i] = dsra_draw
            ds_paid_tr[i] = pay_from_cash + dsra_draw
            prin_tr[i] = prin_eff
            tr_bal[i] = B - prin_eff
            cfads_avail = max(cfads_avail - ds_i, 0.0)
            # DSRA top-up / release to target = months/12 × next-period DS (prev iterate)
            ds_next = state["ds_prev"][i][ti + 1] if ti + 1 < Y else 0.0
            target_dsra = tr["dsra_months"] / 12.0 * ds_next if tr_bal[i] > 1e-9 else 0.0
            if dsra_bal[i] < target_dsra:
                topup = min(target_dsra - dsra_bal[i], max(cash, 0.0))
                dsra_bal[i] += topup
                cash -= topup
            else:
                release = dsra_bal[i] - target_dsra
                dsra_bal[i] = target_dsra
                cash += release

        # MRA: contribution already out of CFADS; maintenance paid from MRA
        mra_bal += mra_c
        mra_spend = min(maint, mra_bal)
        mra_bal -= mra_spend
        maint_from_cash = maint - mra_spend  # if MRA underfunded, cash covers rest
        cash -= maint_from_cash

        # Cash sweep → senior principal prepay
        sweep_cash = max(cash, 0.0) * inp["waterfall"]["cash_sweep_pct"] / 100.0
        sweep_prepay = min(sweep_cash, max(tr_bal[0], 0.0))
        tr_bal[0] -= sweep_prepay
        cash -= sweep_prepay

        # Refinancing event (§8): executed at the END of year N, after scheduled
        # DS / DSRA true-up / sweep, BEFORE the lock-up test (covenant continuity:
        # refi proceeds flow through the distribution trap like any other cash).
        #   NewDebt = new_gearing%×C_total (or B_out), Fee = fees%×NewDebt,
        #   CashOut = NewDebt − B_out − Fee (negative ⇒ equity injection).
        refi_fee_t, refi_draw = 0.0, 0.0
        if rf_on and t == rf_year:
            b_out = tr_bal[0]
            new_debt = (rf["new_gearing_pct"] / 100.0 * c_total
                        if rf.get("new_gearing_pct") is not None else b_out)
            refi_fee_t = rf["fees_pct"] / 100.0 * new_debt
            refi_draw = new_debt - b_out            # Δdebt on the balance sheet
            cash_out = refi_draw - refi_fee_t       # to equity via the waterfall
            tr_bal[0] = new_debt
            cash += cash_out
            r_new = rf["new_rate_pct"] / 100.0
            n_new = max(int(rf["new_tenor_years"]), 1)
            refi_annuity = (new_debt * r_new / (1.0 - (1.0 + r_new) ** (-n_new))
                            if r_new > 1e-9 else new_debt / n_new)
            refi_event = {"year": rf_year,
                          "balance_refinanced_musd": round(b_out, 4),
                          "new_debt_musd": round(new_debt, 4),
                          "fee_musd": round(refi_fee_t, 4),
                          "cash_out_musd": round(cash_out, 4),
                          "new_rate_pct": rf["new_rate_pct"],
                          "new_tenor_years": n_new,
                          "new_amort_type": rf.get("new_amort_type", "annuity")}

        # Lock-up test on senior DSCR (cash may be negative in stress cases —
        # a negative distribution is an equity make-whole, keeping the ledger tight)
        senior_dscr = dscr_tr[0]
        locked = senior_dscr is not None and senior_dscr < cov["lockup_dscr"]
        if senior_dscr is not None and senior_dscr < cov["default_dscr"]:
            default_periods.append(t)
        if locked:
            lockup_periods.append(t)
            trapped += cash
            dist = 0.0
            if trapped < 0:
                dist, trapped = trapped, 0.0
        else:
            dist = cash + trapped
            trapped = 0.0

        # Final period: release all reserves + trapped, retire residual debt
        terminal_release = 0.0
        if t == Y:
            terminal_release = sum(dsra_bal) + mra_bal + trapped - sum(tr_bal)
            for i in range(n_tr):
                prin_tr[i] += tr_bal[i]
                tr_bal[i] = 0.0
            dsra_bal = [0.0] * n_tr
            mra_bal, trapped = 0.0, 0.0
            dist += terminal_release

        # Net income: refi fee expensed in year N (NOT tax-deductible in-model,
        # documented conservative simplification — taxable computed above)
        ni = ebitda - dep - maint - interest - tax_paid - refi_fee_t
        cum_dep += dep
        cum_ni += ni
        cum_dist += dist

        # Balance sheet + assertion (§10: AR is an asset, AP a liability)
        ppe_net = dep_base - cum_dep
        assets = ppe_net + sum(dsra_bal) + mra_bal + trapped + ar_t
        liab_eq = sum(tr_bal) + ap_t + equity_total + cum_ni - cum_dist
        bs_gap = assets - liab_eq
        max_bs_gap = max(max_bs_gap, abs(bs_gap))

        total_ds = sum(ds_new[i][ti] for i in range(n_tr))
        dscr_senior_series.append(senior_dscr)
        cfads_series.append(cfads)
        dist_series.append(dist)
        em_series.append(em_t)
        energy_series.append(energy_mwh)
        carbon_cost_series.append(o_carbon_cost)
        debt_close_series.append(sum(tr_bal))

        periods.append({
            "period": t, "energy_mwh": round(energy_mwh, 1),
            "revenue_ppa": round(r_ppa, 4), "revenue_merchant": round(r_mer, 4),
            "revenue_capacity": round(r_cap, 4), "revenue_rec": round(r_rec, 4),
            "revenue_carbon": round(r_car, 4), "revenue_total": round(revenue, 4),
            "opex": round(opex, 4), "ebitda": round(ebitda, 4),
            "depreciation": round(dep, 4), "major_maintenance": round(maint, 4),
            "interest": round(interest, 4), "taxable_income": round(taxable, 4),
            "loss_carryforward": round(clf, 4), "tax": round(tax_paid, 4),
            "mra_contribution": round(mra_c, 4), "cfads": round(cfads, 4),
            "ds_by_tranche": [round(ds_new[i][ti], 4) for i in range(n_tr)],
            "principal_by_tranche": [round(prin_tr[i], 4) for i in range(n_tr)],
            "interest_by_tranche": [round(interest_tr[i], 4) for i in range(n_tr)],
            "dscr_by_tranche": [None if v is None else round(v, 4) for v in dscr_tr],
            "debt_balance_by_tranche": [round(b, 4) for b in tr_bal],
            "dsra_balance_by_tranche": [round(b, 4) for b in dsra_bal],
            "dsra_draw_by_tranche": [round(x, 4) for x in dsra_draws],
            "mra_balance": round(mra_bal, 4), "sweep_prepay": round(sweep_prepay, 4),
            "locked_up": locked, "trapped_cash": round(trapped, 4),
            "distribution": round(dist, 4), "terminal_release": round(terminal_release, 4),
            # Climate channel lines (0.0 in baseline runs) — explicit opex/revenue
            # attribution so the impact decomposition can show what each costs
            "climate_carbon_cost": round(o_carbon_cost, 4),
            "climate_acute_eal": round(o_acute_eal, 4),
            "climate_insurance_extra": round(o_ins_extra, 4),
            "climate_merchant_uplift_revenue": round(uplift_rev, 4),
            # Working capital (§10), SLL ratchet (§11), refi (§8), emissions (§12)
            "accounts_receivable": round(ar_t, 4),
            "accounts_payable": round(ap_t, 4),
            "delta_working_capital": round(d_wc, 4),
            "sll_adj_bp_by_tranche": [round(x, 2) for x in adj_bp_tr],
            "refinancing_draw": round(refi_draw, 4),
            "refinancing_fee": round(refi_fee_t, 4),
            "emissions_tco2e": round(em_t, 2),
            "emissions_intensity_t_per_mwh": round(em_t / energy_mwh, 6) if energy_mwh > 0 else 0.0,
        })
        is_rows.append({
            "period": t, "revenue": round(revenue, 4), "opex": round(opex, 4),
            "ebitda": round(ebitda, 4), "depreciation": round(dep, 4),
            "major_maintenance": round(maint, 4), "ebit": round(ebitda - dep - maint, 4),
            "interest": round(interest, 4), "pretax_income": round(taxable, 4),
            "tax": round(tax_paid, 4), "net_income": round(ni, 4),
        })
        cf_rows.append({
            "period": t,
            "operating": round(ni + dep - d_wc, 4),   # §10: Operating = NI + D&A − ΔWC
            "investing": 0.0,
            "financing": round(refi_draw - sum(prin_tr) - sweep_prepay - dist, 4),
            "net_change_in_cash": round(ni + dep - d_wc + refi_draw - sum(prin_tr) - sweep_prepay - dist, 4),
        })
        bs_rows.append({
            "period": t, "ppe_net": round(ppe_net, 4),
            "dsra": round(sum(dsra_bal), 4), "mra": round(mra_bal, 4),
            "trapped_cash": round(trapped, 4),
            "accounts_receivable": round(ar_t, 4), "accounts_payable": round(ap_t, 4),
            "total_assets": round(assets, 4),
            "debt_by_tranche": [round(b, 4) for b in tr_bal],
            "paid_in_equity": round(equity_total, 4),
            "retained_earnings": round(cum_ni - cum_dist, 4),
            "total_liab_equity": round(liab_eq, 4),
            "imbalance": round(bs_gap, 8),
        })

    # ── Metrics ───────────────────────────────────────────────────────────────
    # Equity flows on an irregular time grid (construction months < 0, ops years)
    eq_flows = [-r["equity_draw_musd"] for r in con_rows] + [-equity_dsra] + dist_series
    eq_times = [(r["month"] - M) / 12.0 for r in con_rows] + [0.0] + [float(t) for t in range(1, Y + 1)]
    equity_irr = _irr(eq_flows, eq_times)
    disc = inp["discount_rate_pct"] / 100.0
    equity_npv = _npv_at(disc, eq_flows, eq_times)

    # Project (unlevered) flows: −capex (excl IDC) + (EBITDA − tax); tax is
    # the levered tax (documented approximation)
    pj_flows = [-r["capex_draw_musd"] for r in con_rows] + \
               [p["ebitda"] - p["tax"] + p["terminal_release"] for p in periods]
    pj_times = [(r["month"] - M) / 12.0 for r in con_rows] + [float(t) for t in range(1, Y + 1)]
    project_irr = _irr(pj_flows, pj_times)

    dscr_vals = [v for v in dscr_senior_series if v is not None]
    min_dscr = min(dscr_vals) if dscr_vals else None
    avg_dscr = sum(dscr_vals) / len(dscr_vals) if dscr_vals else None

    # LLCR / PLCR at senior all-in year-1 rate
    r_llcr = _tranche_ops_rate(tranches[0], 0)
    last_debt_year = max((tr["tenor_years"] for tr in tranches), default=0)
    debt_open_1 = sum(tr_bal_con)
    pv_llcr = sum(cfads_series[s] / (1.0 + r_llcr) ** (s + 1) for s in range(min(last_debt_year, Y)))
    pv_plcr = sum(cfads_series[s] / (1.0 + r_llcr) ** (s + 1) for s in range(Y))
    llcr = pv_llcr / debt_open_1 if debt_open_1 > 1e-9 else None
    plcr = pv_plcr / debt_open_1 if debt_open_1 > 1e-9 else None

    payback_year = None
    cum = 0.0
    for t in range(1, Y + 1):
        cum += dist_series[t - 1]
        if cum >= equity_total and payback_year is None:
            payback_year = t

    # ── Real (deflated) equity IRR (§9): CF_t / I_t, construction flows I=1 ──
    real_equity_irr = None
    if infl_on:
        real_flows = [-r["equity_draw_musd"] for r in con_rows] + [-equity_dsra] + \
                     [dist_series[k] / infl_index[k] for k in range(Y)]
        real_equity_irr = _irr(real_flows, eq_times)

    # ── Sustainability analytics block (§12) — always computed ────────────────
    sus_cfg = inp.get("sustainability") or {}
    shadow_p = float(sus_cfg.get("shadow_carbon_price_usd_t", 50.0))
    grid_base = float(sus_cfg.get("grid_baseline_intensity_t_per_mwh", 0.45))
    avoided_series = [energy_series[k] * grid_base - em_series[k] for k in range(Y)]
    total_avoided = sum(avoided_series)
    total_em = sum(em_series)
    total_energy = sum(energy_series)
    # Carbon-ADJUSTED equity IRR: distributions charged Em_t × SP / 1e6 (labeled
    # unpriced-externality charge at the user's shadow price — NOT a cash flow)
    carbon_adj_flows = [-r["equity_draw_musd"] for r in con_rows] + [-equity_dsra] + \
                       [dist_series[k] - em_series[k] * shadow_p / 1e6 for k in range(Y)]
    carbon_adj_irr = _irr(carbon_adj_flows, eq_times)
    sus_rows = []
    for k in range(Y):
        p_opex = periods[k]["opex"]
        af = (debt_close_series[k] / c_total) if c_total > 0 else 0.0
        sus_rows.append({
            "period": k + 1,
            "emissions_tco2e": round(em_series[k], 2),
            "emissions_intensity_t_per_mwh": round(em_series[k] / energy_series[k], 6) if energy_series[k] > 0 else 0.0,
            "carbon_cost_musd": round(carbon_cost_series[k], 4),
            "carbon_cost_share_of_opex": round(carbon_cost_series[k] / p_opex, 6) if p_opex > 1e-9 else 0.0,
            "avoided_emissions_tco2e": round(avoided_series[k], 2),
            "pcaf_attribution_factor_debt": round(af, 6),
            "financed_emissions_debt_tco2e": round(af * em_series[k], 2),
            "financed_emissions_equity_tco2e": round((equity_total / c_total) * em_series[k], 2) if c_total > 0 else 0.0,
        })
    sustainability = {
        "assumptions": {
            "shadow_carbon_price_usd_t": shadow_p,
            "grid_baseline_intensity_t_per_mwh": grid_base,
            "own_emissions_intensity_t_per_mwh": sll_ei,
            "fixed_emissions_t_per_yr": sll_fe,
            "labels": {
                "carbon_adjusted_equity_irr": "IRR of equity flows minus an unpriced-externality charge Em_t × shadow price — an ANALYTICAL adjustment, not a project cash flow",
                "avoided_emissions": "vs the user's stated grid-baseline intensity (avoided = E_t × baseline − own emissions)",
                "equity_cost_per_t_avoided": "total equity invested ÷ lifetime avoided tCO2e, undiscounted",
                "pcaf": "PCAF Global Standard (project finance): financed emissions = attribution factor × project emissions; attribution factor = outstanding debt ÷ total funded cost at COD",
            },
        },
        "per_year": sus_rows,
        "totals": {
            "cumulative_emissions_tco2e": round(total_em, 2),
            "cumulative_avoided_tco2e": round(total_avoided, 2),
            "avg_intensity_t_per_mwh": round(total_em / total_energy, 6) if total_energy > 0 else 0.0,
            "lifetime_carbon_cost_musd": round(sum(carbon_cost_series), 4),
            "equity_cost_per_t_avoided_usd": round(equity_total * 1e6 / total_avoided, 2) if total_avoided > 1e-9 else None,
        },
        "carbon_adjusted_equity_irr": None if carbon_adj_irr is None else round(carbon_adj_irr, 6),
        "nominal_equity_irr": None if equity_irr is None else round(equity_irr, 6),
    }

    # SLL ratchet summary per tranche (§11)
    sll_summary = []
    for i, tr in enumerate(tranches):
        s = tr.get("sll") or {}
        if s.get("enabled"):
            ups = sum(1 for p in periods if p["sll_adj_bp_by_tranche"][i] > 0)
            downs = sum(1 for p in periods if p["sll_adj_bp_by_tranche"][i] < 0)
            sll_summary.append({"tranche": tr["name"], "kpi": s.get("kpi"),
                                "target_start": s.get("target_start"), "target_end": s.get("target_end"),
                                "step_up_bp": s.get("step_up_bp"), "step_down_bp": s.get("step_down_bp"),
                                "periods_stepped_up": ups, "periods_stepped_down": downs})

    return {
        "idc_total": idc_total,
        "ds_new": ds_new,
        "dsra0_by_tranche_new": [
            tranches[i]["dsra_months"] / 12.0 * (ds_new[i][0] if Y > 0 else 0.0) for i in range(n_tr)
        ],
        "result": {
            "project_name": inp["project_name"],
            "sizing": {
                "total_capex_musd": round(cap["total_capex_musd"], 4),
                "idc_musd": round(idc_total, 4),
                "dsra_initial_musd": round(dsra0_total, 4),
                "total_funded_cost_musd": round(c_total, 4),
                "debt_by_tranche_musd": [round(x, 4) for x in debt_sizes],
                "equity_musd": round(equity_total, 4),
                "effective_gearing_pct": round(g * 100.0, 4),
            },
            "construction": con_rows,
            "periods": periods,
            "statements": {"income": is_rows, "cashflow": cf_rows, "balance": bs_rows},
            "sustainability": sustainability,
            "sll": sll_summary,
            "refinancing_event": refi_event if (rf_on and refi_event["new_debt_musd"] > 0) else None,
            "inflation": {"enabled": infl_on, "mode": infl.get("mode", "nominal") if infl_on else "nominal",
                          "index_path": [round(x, 6) for x in infl_index]} if infl_on else {"enabled": False},
            "working_capital": {"receivable_days": rec_days, "payable_days": pay_days,
                                "enabled": (rec_days > 0 or pay_days > 0)},
            "balance_sheet_ok": bool(max_bs_gap < 1e-6),
            "max_balance_sheet_gap_musd": max_bs_gap,
            "metrics": {
                "equity_irr": None if equity_irr is None else round(equity_irr, 6),
                "project_irr": None if project_irr is None else round(project_irr, 6),
                "equity_npv_musd": round(equity_npv, 4),
                "discount_rate_pct": inp["discount_rate_pct"],
                "min_dscr_senior": None if min_dscr is None else round(min_dscr, 4),
                "avg_dscr_senior": None if avg_dscr is None else round(avg_dscr, 4),
                "llcr": None if llcr is None else round(llcr, 4),
                "plcr": None if plcr is None else round(plcr, 4),
                "payback_year": payback_year,
                "real_equity_irr": None if real_equity_irr is None else round(real_equity_irr, 6),
                "carbon_adjusted_equity_irr": None if carbon_adj_irr is None else round(carbon_adj_irr, 6),
                "total_distributions_musd": round(sum(dist_series), 4),
                # PV of distributions at the input discount rate (scenario-matrix metric)
                "distributions_pv_musd": round(
                    sum(dist_series[s] / (1.0 + disc) ** (s + 1) for s in range(Y)), 4),
            },
            "covenants": {
                "lockup_dscr": cov["lockup_dscr"], "default_dscr": cov["default_dscr"],
                "lockup_periods": lockup_periods, "default_test_breach_periods": sorted(set(default_periods)),
                "payment_defaults": payment_defaults,
            },
        },
    }


def _solve_fixed_point(inp: dict, clim: Optional[dict]) -> dict:
    """Fixed-point wrapper: iterate on (IDC, DSRA_0 per tranche, DS arrays)
    until max-norm change < 1e-6 or 50 iterations (see module docstring §2).
    The SAME solver runs baseline and climate cases — clim only changes the
    revenue/opex/volume primitives inside the period loop."""
    Y = inp["timeline"]["operations_years"]
    n_tr = len(inp["tranches"])
    state = {"idc": 0.0, "dsra0_by_tranche": [0.0] * n_tr,
             "ds_prev": [[0.0] * Y for _ in range(n_tr)]}
    iters, residual, converged = 0, float("inf"), False
    out = None
    for k in range(FP_MAX_ITERS):
        iters = k + 1
        out = _evaluate(inp, state, clim)
        residual = abs(out["idc_total"] - state["idc"])
        for i in range(n_tr):
            residual = max(residual, abs(out["dsra0_by_tranche_new"][i] - state["dsra0_by_tranche"][i]))
            for t in range(Y):
                residual = max(residual, abs(out["ds_new"][i][t] - state["ds_prev"][i][t]))
        state = {"idc": out["idc_total"],
                 "dsra0_by_tranche": out["dsra0_by_tranche_new"],
                 "ds_prev": out["ds_new"]}
        if residual < FP_TOL:
            converged = True
            break
    result = out["result"]
    result["convergence"] = {"iterations": iters, "converged": converged,
                             "residual": residual, "tolerance": FP_TOL, "max_iterations": FP_MAX_ITERS}
    return result


def _climate_impact_decomposition(base: dict, clim_res: dict, start_year: int) -> dict:
    """Per-year deltas (climate case − no-climate baseline) for the headline
    lines, plus the explicit channel attributions carried on each period."""
    rows, tot = [], {"revenue": 0.0, "opex": 0.0, "ebitda": 0.0, "cfads": 0.0,
                     "carbon_cost": 0.0, "acute_eal": 0.0, "insurance_extra": 0.0,
                     "merchant_uplift_revenue": 0.0}
    for pb, pc in zip(base["periods"], clim_res["periods"]):
        d_dscr = None
        if pb["dscr_by_tranche"][0] is not None and pc["dscr_by_tranche"][0] is not None:
            d_dscr = round(pc["dscr_by_tranche"][0] - pb["dscr_by_tranche"][0], 4)
        row = {
            "period": pb["period"], "calendar_year": start_year + pb["period"] - 1,
            "revenue_delta": round(pc["revenue_total"] - pb["revenue_total"], 4),
            "opex_delta": round(pc["opex"] - pb["opex"], 4),
            "ebitda_delta": round(pc["ebitda"] - pb["ebitda"], 4),
            "cfads_delta": round(pc["cfads"] - pb["cfads"], 4),
            "dscr_delta": d_dscr,
            "volume_delta_mwh": round(pc["energy_mwh"] - pb["energy_mwh"], 1),
            "carbon_cost": pc["climate_carbon_cost"],
            "acute_eal": pc["climate_acute_eal"],
            "insurance_extra": pc["climate_insurance_extra"],
            "merchant_uplift_revenue": pc["climate_merchant_uplift_revenue"],
        }
        rows.append(row)
        tot["revenue"] += row["revenue_delta"]; tot["opex"] += row["opex_delta"]
        tot["ebitda"] += row["ebitda_delta"]; tot["cfads"] += row["cfads_delta"]
        tot["carbon_cost"] += row["carbon_cost"]; tot["acute_eal"] += row["acute_eal"]
        tot["insurance_extra"] += row["insurance_extra"]
        tot["merchant_uplift_revenue"] += row["merchant_uplift_revenue"]
    mb, mc = base["metrics"], clim_res["metrics"]
    return {
        "per_year": rows,
        "totals": {k: round(v, 4) for k, v in tot.items()},
        "metric_deltas": {
            "equity_irr": None if (mb["equity_irr"] is None or mc["equity_irr"] is None)
            else round(mc["equity_irr"] - mb["equity_irr"], 6),
            "min_dscr_senior": None if (mb["min_dscr_senior"] is None or mc["min_dscr_senior"] is None)
            else round(mc["min_dscr_senior"] - mb["min_dscr_senior"], 4),
            "llcr": None if (mb["llcr"] is None or mc["llcr"] is None) else round(mc["llcr"] - mb["llcr"], 4),
            "equity_npv_musd": round(mc["equity_npv_musd"] - mb["equity_npv_musd"], 4),
        },
    }


def run_model(inp: dict, with_baseline: bool = True) -> dict:
    """Run the model. If climate is enabled the climate case is the PRIMARY
    result (same waterfall/statement code path) and, when with_baseline, a
    no-climate baseline is rerun through the identical code for the
    `climate_impact` decomposition (docstring §7). with_baseline=False is used
    by the grid/QMC/solver loops to avoid doubling their cost."""
    clim = _build_climate_arrays(inp)
    result = _solve_fixed_point(inp, clim)
    if clim is not None:
        result["climate"] = {
            "enabled": True,
            "start_year": clim["start_year"],
            "carbon_price_mode": inp["climate"]["transition"]["carbon_price_mode"],
            "ngfs_scenario": inp["climate"]["transition"]["ngfs_scenario"]
            if inp["climate"]["transition"]["carbon_price_mode"] == "ngfs" else None,
            "carbon_price_path": [round(x, 4) for x in clim["carbon_price"]],
            "gdp_impact_pct_path": [round(x, 4) for x in clim["gdp_impact_pct"]],
            "merchant_uplift_usd_mwh_path": [round(x, 4) for x in clim["merchant_uplift_usd_mwh"]],
            "provenance": clim["provenance"],
            "channel_parameters": {"transition": inp["climate"]["transition"],
                                   "physical": inp["climate"]["physical"]},
        }
        if with_baseline:
            base_inp = copy.deepcopy(inp)
            base_inp["climate"]["enabled"] = False
            baseline = _solve_fixed_point(base_inp, None)
            result["baseline"] = baseline
            result["climate_impact"] = _climate_impact_decomposition(baseline, result, clim["start_year"])

    # §8: refi comparison — full no-refi rerun through the identical code path
    if (inp.get("refinancing") or {}).get("enabled") and with_baseline:
        norf_inp = copy.deepcopy(inp)
        norf_inp["refinancing"]["enabled"] = False
        norf = _solve_fixed_point(norf_inp, _build_climate_arrays(norf_inp))
        m_w, m_n = result["metrics"], norf["metrics"]

        def _d(a, b, nd=6):
            return None if (a is None or b is None) else round(a - b, nd)
        result["refinancing"] = {
            "event": result.get("refinancing_event"),
            "with_refi": {"equity_irr": m_w["equity_irr"], "equity_npv_musd": m_w["equity_npv_musd"],
                          "min_dscr_senior": m_w["min_dscr_senior"], "llcr": m_w["llcr"],
                          "payback_year": m_w["payback_year"]},
            "without_refi": {"equity_irr": m_n["equity_irr"], "equity_npv_musd": m_n["equity_npv_musd"],
                             "min_dscr_senior": m_n["min_dscr_senior"], "llcr": m_n["llcr"],
                             "payback_year": m_n["payback_year"]},
            "deltas": {"equity_irr": _d(m_w["equity_irr"], m_n["equity_irr"]),
                       "equity_npv_musd": _d(m_w["equity_npv_musd"], m_n["equity_npv_musd"], 4),
                       "min_dscr_senior": _d(m_w["min_dscr_senior"], m_n["min_dscr_senior"], 4)},
            "no_refi_dscr_path": [p["dscr_by_tranche"][0] for p in norf["periods"]],
            "no_refi_distributions": [p["distribution"] for p in norf["periods"]],
        }
    return result


def _metric_of(result: dict, metric: str) -> Optional[float]:
    """Solver/frontier metric getter (§14)."""
    m = result["metrics"]
    if metric == "equity_irr":
        return m["equity_irr"]
    if metric == "min_dscr":
        return m["min_dscr_senior"]
    if metric == "llcr":
        return m["llcr"]
    if metric == "carbon_adjusted_irr":
        return m["carbon_adjusted_equity_irr"]
    return m["min_dscr_senior"]


def _run_with_multipliers(base_inp: dict, overrides: Dict[str, float]) -> dict:
    inp = copy.deepcopy(base_inp)
    for param, mult in overrides.items():
        _apply_driver(inp, param, mult)
    # Grid/QMC/solver loops evaluate the active case only (climate case if
    # enabled) — no internal baseline rerun, to keep them performant.
    return run_model(inp, with_baseline=False)


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/run")
def run_endpoint(inputs: ModelInputs) -> Dict[str, Any]:
    """Run the full project-finance model (see module docstring for every
    formula). If `climate.enabled`, the climate case flows through the SAME
    waterfall/statement code path and the response additionally carries the
    no-climate `baseline` run and the per-year `climate_impact` deltas."""
    return {"mode": "computed", "engine": "financial_model_engine",
            "result": run_model(inputs.model_dump())}


@router.post("/scenario-matrix")
def scenario_matrix_endpoint(req: ScenarioMatrixRequest) -> Dict[str, Any]:
    """Same deal, every NGFS climate future.

    Reruns the FULL model (identical waterfall/statement/covenant code path)
    once per NGFS Phase 5 scenario in the platform extract — carbon-price and
    GDP-impact paths swapped per scenario, all other inputs (including the
    user's climate channel parameters: emissions intensity, pass-through, β,
    EAL, derate, downtime) held constant — plus an optional no-climate
    baseline row. Per scenario: equity IRR, min/avg senior DSCR, LLCR,
    equity NPV, PV of distributions, first lock-up and first default-test
    breach period (and calendar year via climate.start_year), payment-default
    count, and the full per-year senior DSCR path. Supervisory-grade scenario
    analysis: e.g. "lock-up triggered 2033 under Delayed Transition"."""
    base_inp = req.inputs.model_dump()
    extract = _load_ngfs_extract()
    scen_names = {s["id"]: s.get("name", s["id"]) for s in extract["scenarios"]}
    ids = req.scenarios or list(scen_names.keys())
    unknown = [s for s in ids if s not in scen_names]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown NGFS scenario(s) {unknown}. Valid: {sorted(scen_names)}")
    region = req.region or base_inp["climate"]["transition"]["ngfs_region"]
    start_year = base_inp["climate"]["start_year"]
    disc = base_inp["discount_rate_pct"] / 100.0

    def summarize(sid: Optional[str], label: str, result: dict) -> dict:
        m, cov = result["metrics"], result["covenants"]
        first_lockup = min(cov["lockup_periods"]) if cov["lockup_periods"] else None
        first_default = min(cov["default_test_breach_periods"]) if cov["default_test_breach_periods"] else None
        # Per-scenario sustainability block (§8 of the endpoint list): cumulative
        # own emissions + PV of the carbon-cost opex line at the input discount rate
        carbon_cost_pv = sum(p["climate_carbon_cost"] / (1.0 + disc) ** p["period"]
                             for p in result["periods"])
        return {
            "scenario": sid, "label": label,
            "equity_irr": m["equity_irr"], "equity_npv_musd": m["equity_npv_musd"],
            "min_dscr_senior": m["min_dscr_senior"], "avg_dscr_senior": m["avg_dscr_senior"],
            "llcr": m["llcr"], "plcr": m["plcr"],
            "distributions_pv_musd": m["distributions_pv_musd"],
            "first_lockup_period": first_lockup,
            "first_lockup_year": (start_year + first_lockup - 1) if first_lockup else None,
            "first_default_period": first_default,
            "first_default_year": (start_year + first_default - 1) if first_default else None,
            "payment_default_count": len(cov["payment_defaults"]),
            "dscr_path": [p["dscr_by_tranche"][0] for p in result["periods"]],
            "converged": result["convergence"]["converged"],
            "sustainability": {
                "cumulative_emissions_tco2e": result["sustainability"]["totals"]["cumulative_emissions_tco2e"],
                "carbon_cost_pv_musd": round(carbon_cost_pv, 4),
                "carbon_adjusted_equity_irr": m["carbon_adjusted_equity_irr"],
            },
        }

    rows = []
    if req.include_no_climate_baseline:
        b_inp = copy.deepcopy(base_inp)
        b_inp["climate"]["enabled"] = False
        rows.append(summarize(None, "No-climate baseline", run_model(b_inp, with_baseline=False)))
    for sid in ids:
        s_inp = copy.deepcopy(base_inp)
        s_inp["climate"]["enabled"] = True
        s_inp["climate"]["transition"]["carbon_price_mode"] = "ngfs"
        s_inp["climate"]["transition"]["ngfs_scenario"] = sid
        s_inp["climate"]["transition"]["ngfs_region"] = region
        rows.append(summarize(sid, scen_names[sid], run_model(s_inp, with_baseline=False)))
    # User-designed scenarios (§ SCENARIO DESIGNER): named carbon-price paths
    # (+ optional GDP-impact paths) run through the SAME custom-mode channels
    for cs in req.custom_scenarios:
        s_inp = copy.deepcopy(base_inp)
        s_inp["climate"]["enabled"] = True
        s_inp["climate"]["transition"]["carbon_price_mode"] = "custom"
        s_inp["climate"]["transition"]["custom_carbon_price_path"] = list(cs.carbon_price_path)
        s_inp["climate"]["transition"]["custom_gdp_impact_pct_path"] = (
            list(cs.gdp_impact_pct_path) if cs.gdp_impact_pct_path else None)
        rows.append(summarize(f"custom:{cs.name}", f"{cs.name} (custom)",
                              run_model(s_inp, with_baseline=False)))

    return {"mode": "computed", "region": region, "start_year": start_year,
            "channel_parameters": {"transition": base_inp["climate"]["transition"],
                                   "physical": base_inp["climate"]["physical"]},
            "provenance": {"source": extract["_meta"].get("source"),
                           "release": extract["_meta"].get("release"),
                           "note": "Seeded NGFS Phase 5 extract; 5-yr steps interpolated to annual."},
            "periods": base_inp["timeline"]["operations_years"],
            "rows": rows}


@router.post("/sensitivity")
def sensitivity_endpoint(req: SensitivityRequest) -> Dict[str, Any]:
    """1D/2D multiplier grid over drivers + one-at-a-time ±x% tornado.

    Grid: param_x is stepped over [1−range_x/100, 1+range_x/100] with steps_x
    points (and param_y likewise if given). Each cell reruns the FULL model.
    Tornado: each listed driver is shocked ±tornado_pct% one-at-a-time; bars
    are sorted by |IRR_high − IRR_low| (largest driver first)."""
    base_inp = req.inputs.model_dump()
    base = run_model(base_inp, with_baseline=False)
    base_irr = base["metrics"]["equity_irr"]

    def steps(rng: float, n: int) -> List[float]:
        lo, hi = 1.0 - rng / 100.0, 1.0 + rng / 100.0
        return [lo + (hi - lo) * i / (n - 1) for i in range(n)]

    xs = steps(req.range_x_pct, req.steps_x)
    ys = steps(req.range_y_pct, req.steps_y) if req.param_y else [1.0]
    grid = []
    for my in ys:
        row = []
        for mx in xs:
            ov = {req.param_x: mx}
            if req.param_y:
                ov[req.param_y] = my
            r = _run_with_multipliers(base_inp, ov)
            row.append({"equity_irr": r["metrics"]["equity_irr"],
                        "min_dscr": r["metrics"]["min_dscr_senior"],
                        "equity_npv_musd": r["metrics"]["equity_npv_musd"]})
        grid.append(row)

    tornado = []
    for p in req.tornado_params:
        lo_r = _run_with_multipliers(base_inp, {p: 1.0 - req.tornado_pct / 100.0})
        hi_r = _run_with_multipliers(base_inp, {p: 1.0 + req.tornado_pct / 100.0})
        irr_lo, irr_hi = lo_r["metrics"]["equity_irr"], hi_r["metrics"]["equity_irr"]
        impact = abs((irr_hi or 0.0) - (irr_lo or 0.0))
        tornado.append({"param": p, "base_value": _driver_base_value(base_inp, p),
                        "irr_low": irr_lo, "irr_high": irr_hi,
                        "dscr_low": lo_r["metrics"]["min_dscr_senior"],
                        "dscr_high": hi_r["metrics"]["min_dscr_senior"],
                        "irr_impact": round(impact, 6)})
    tornado.sort(key=lambda x: -x["irr_impact"])

    return {"mode": "computed", "base_equity_irr": base_irr,
            "base_min_dscr": base["metrics"]["min_dscr_senior"],
            "grid": {"param_x": req.param_x, "x_multipliers": xs,
                     "x_values": [m * _driver_base_value(base_inp, req.param_x) for m in xs],
                     "param_y": req.param_y, "y_multipliers": ys,
                     "y_values": [m * _driver_base_value(base_inp, req.param_y) for m in ys] if req.param_y else [],
                     "cells": grid},
            "tornado": {"shock_pct": req.tornado_pct, "bars": tornado}}


@router.post("/simulate")
def simulate_endpoint(req: SimulateRequest) -> Dict[str, Any]:
    """Deterministic quasi-Monte Carlo via a HALTON low-discrepancy sequence.

    Dimension j uses radical-inverse base HALTON_BASES[j] (primes 2,3,5,7,…);
    scenario i uses sequence index i + HALTON_SKIP + 1. Uniforms map to each
    uncertain input's distribution via the inverse CDF (module docstring).
    NO PRNG anywhere: same request ⇒ identical scenarios ⇒ identical results.
    The FULL model (annual periodicity) is rerun per scenario."""
    if len(req.uncertain) > len(HALTON_BASES):
        raise HTTPException(status_code=422, detail=f"Max {len(HALTON_BASES)} uncertain inputs")
    base_inp = req.inputs.model_dump()
    det = run_model(base_inp, with_baseline=False)

    irrs, dscrs, failed = [], [], 0
    for i in range(req.n_scenarios):
        idx = i + HALTON_SKIP + 1
        overrides = {}
        for j, u_spec in enumerate(req.uncertain):
            u = _halton(idx, HALTON_BASES[j])
            overrides[u_spec.param] = _inv_cdf(u, u_spec.model_dump())
        r = _run_with_multipliers(base_inp, overrides)
        irr, mdscr = r["metrics"]["equity_irr"], r["metrics"]["min_dscr_senior"]
        if irr is None or mdscr is None:
            failed += 1
            continue
        irrs.append(irr)
        dscrs.append(mdscr)

    def stats(vals: List[float]) -> Dict[str, Any]:
        if not vals:
            return {"n": 0}
        v = sorted(vals)
        n = len(v)
        def pct(p: float) -> float:
            # linear-interpolated percentile
            k = (n - 1) * p
            f, c = math.floor(k), math.ceil(k)
            return v[int(k)] if f == c else v[f] + (k - f) * (v[c] - v[f])
        lo, hi = v[0], v[-1]
        width = (hi - lo) / req.histogram_bins if hi > lo else 1.0
        counts = [0] * req.histogram_bins
        for x in v:
            b = min(int((x - lo) / width), req.histogram_bins - 1)
            counts[b] += 1
        return {"n": n, "mean": sum(v) / n, "min": lo, "max": hi,
                "p5": pct(0.05), "p25": pct(0.25), "p50": pct(0.50),
                "p75": pct(0.75), "p95": pct(0.95),
                "histogram": {"bin_edges": [lo + width * k for k in range(req.histogram_bins + 1)],
                              "counts": counts}}

    hurdle = req.hurdle_irr_pct / 100.0
    return {"mode": "computed",
            "method": {"sequence": "Halton (radical inverse, prime bases 2,3,5,7,…)",
                       "skip": HALTON_SKIP, "reproducible": True,
                       "note": "Deterministic low-discrepancy sequence — same inputs, same results. No PRNG."},
            "n_scenarios": req.n_scenarios, "n_failed": failed,
            "deterministic": {"equity_irr": det["metrics"]["equity_irr"],
                              "min_dscr": det["metrics"]["min_dscr_senior"]},
            "equity_irr": stats(irrs), "min_dscr": stats(dscrs),
            "prob_irr_below_hurdle": (sum(1 for x in irrs if x < hurdle) / len(irrs)) if irrs else None,
            "hurdle_irr": hurdle,
            "prob_dscr_below_1": (sum(1 for x in dscrs if x < 1.0) / len(dscrs)) if dscrs else None,
            "uncertain_inputs": [u.model_dump() for u in req.uncertain]}


@router.post("/solve")
def solve_endpoint(req: SolveRequest) -> Dict[str, Any]:
    """Goal-seek by BISECTION on the driver multiplier.

    f(m) = metric(model with driver × m) − target. Start bracket m∈[0.3, 3.0]
    (expanded once to [0.1, 6.0] if the target is not straddled), then halve
    the interval until |hi − lo| < 1e-6 or 80 iterations. The continuous
    drivers are monotone in the supported metrics over the bracket, so
    bisection is globally convergent when a solution exists in the bracket.

    §14 expansion — targets: equity_irr | min_dscr | llcr | carbon_adjusted_irr;
    instruments: ppa_price | capex | gearing | merchant_price | capture_rate |
    refi_year. refi_year is DISCRETE: exhaustive scan over feasible operating
    years 1..Y−1 (refi forced enabled), picking the year whose metric lands
    closest to the target."""
    valid_drivers = ("ppa_price", "capex", "gearing", "merchant_price", "capture_rate", "refi_year")
    valid_metrics = ("equity_irr", "min_dscr", "llcr", "carbon_adjusted_irr")
    if req.solve_for not in valid_drivers:
        raise HTTPException(status_code=422, detail=f"solve_for must be one of {' | '.join(valid_drivers)}")
    if req.target_metric not in valid_metrics:
        raise HTTPException(status_code=422, detail=f"target_metric must be one of {' | '.join(valid_metrics)}")
    base_inp = req.inputs.model_dump()

    # ── refi_year: exhaustive DISCRETE scan (§14) ─────────────────────────────
    if req.solve_for == "refi_year":
        Y = base_inp["timeline"]["operations_years"]
        scan = []
        for y in range(1, Y):
            s_inp = copy.deepcopy(base_inp)
            s_inp["refinancing"]["enabled"] = True
            s_inp["refinancing"]["year"] = y
            r = run_model(s_inp, with_baseline=False)
            v = _metric_of(r, req.target_metric)
            scan.append({"refi_year": y, "metric": v})
        feasible = [s for s in scan if s["metric"] is not None]
        if not feasible:
            raise HTTPException(status_code=422, detail="No feasible refi year: metric undefined at every year 1..Y-1")
        best = min(feasible, key=lambda s: abs(s["metric"] - req.target_value))
        return {"mode": "computed", "solve_for": "refi_year", "target_metric": req.target_metric,
                "target_value": req.target_value,
                "solved_value": best["refi_year"], "achieved_value": best["metric"],
                "base_value": _driver_base_value(base_inp, "refi_year"),
                "iterations": len(scan), "model_evaluations": len(scan),
                "scan": scan,
                "method": "exhaustive discrete scan over refi years 1..Y-1 (refi enabled), closest-to-target"}

    def f(mult: float) -> float:
        r = _run_with_multipliers(base_inp, {req.solve_for: mult})
        v = _metric_of(r, req.target_metric)
        # An undefined metric (e.g. equity flows never turn positive at a very
        # low price multiplier → no IRR) is treated as −∞ for bracketing: the
        # metric is certainly below any finite target there.
        return -1e9 if v is None else v - req.target_value

    lo, hi = 0.3, 3.0
    f_lo, f_hi = f(lo), f(hi)
    evals = 2
    if f_lo * f_hi > 0:
        lo, hi = 0.1, 6.0
        f_lo, f_hi = f(lo), f(hi)
        evals += 2
    if f_lo * f_hi > 0:
        raise HTTPException(status_code=422, detail=(
            f"Target {req.target_metric}={req.target_value} not attainable by scaling "
            f"{req.solve_for} within ×[0.1, 6.0] (f(0.1)={f_lo}, f(6.0)={f_hi})."))
    iters = 0
    for _ in range(80):
        iters += 1
        mid = 0.5 * (lo + hi)
        f_mid = f(mid)
        evals += 1
        if abs(f_mid) < 1e-7 or (hi - lo) < 1e-6:
            lo = hi = mid
            break
        if f_lo * f_mid <= 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    mult = 0.5 * (lo + hi)
    final = _run_with_multipliers(base_inp, {req.solve_for: mult})
    achieved = _metric_of(final, req.target_metric)
    return {"mode": "computed", "solve_for": req.solve_for, "target_metric": req.target_metric,
            "target_value": req.target_value,
            "solved_multiplier": round(mult, 8),
            "solved_value": round(mult * _driver_base_value(base_inp, req.solve_for), 6),
            "base_value": _driver_base_value(base_inp, req.solve_for),
            "achieved_value": achieved, "iterations": iters, "model_evaluations": evals,
            "method": "bisection on driver multiplier, tol 1e-6, ≤80 iterations"}


@router.post("/solve-frontier")
def solve_frontier_endpoint(req: SolveFrontierRequest) -> Dict[str, Any]:
    """(gearing × PPA price) iso-metric frontier (§14).

    GRID-SCAN: for each gearing level g_k spaced evenly over
    [gearing_min_pct, gearing_max_pct] (gearing_steps points), the senior
    tranche is set to sizing='gearing' at g_k and the PPA-price MULTIPLIER is
    bisected in [0.2, 5.0] until the target metric is hit (tol 1e-7 on the
    metric / 1e-6 on the bracket, ≤60 halvings). Points where the target is
    not attainable inside the bracket are returned with attainable=false.
    The result is the iso-metric curve (gearing_pct, ppa_price) — e.g. the
    PPA price required at each gearing to hold equity IRR at the target."""
    if req.target_metric not in ("equity_irr", "min_dscr", "llcr", "carbon_adjusted_irr"):
        raise HTTPException(status_code=422, detail="target_metric must be equity_irr | min_dscr | llcr | carbon_adjusted_irr")
    base_inp = req.inputs.model_dump()
    if req.gearing_max_pct <= req.gearing_min_pct:
        raise HTTPException(status_code=422, detail="gearing_max_pct must exceed gearing_min_pct")
    base_ppa = base_inp["revenue"]["ppa"]["price_usd_mwh"]
    points, evals = [], 0
    for k in range(req.gearing_steps):
        g = req.gearing_min_pct + (req.gearing_max_pct - req.gearing_min_pct) * k / (req.gearing_steps - 1)
        inp_g = copy.deepcopy(base_inp)
        inp_g["tranches"][0]["sizing"] = "gearing"
        inp_g["tranches"][0]["gearing_pct"] = g

        def f(mult: float) -> float:
            r = _run_with_multipliers(inp_g, {"ppa_price": mult})
            v = _metric_of(r, req.target_metric)
            return -1e9 if v is None else v - req.target_value

        lo, hi = 0.2, 5.0
        f_lo, f_hi = f(lo), f(hi)
        evals += 2
        if f_lo * f_hi > 0:
            points.append({"gearing_pct": round(g, 4), "ppa_price_multiplier": None,
                           "ppa_price_usd_mwh": None, "achieved_metric": None, "attainable": False})
            continue
        for _ in range(60):
            mid = 0.5 * (lo + hi)
            f_mid = f(mid)
            evals += 1
            if abs(f_mid) < 1e-7 or (hi - lo) < 1e-6:
                lo = hi = mid
                break
            if f_lo * f_mid <= 0:
                hi = mid
            else:
                lo, f_lo = mid, f_mid
        mult = 0.5 * (lo + hi)
        final = _run_with_multipliers(inp_g, {"ppa_price": mult})
        evals += 1
        points.append({"gearing_pct": round(g, 4),
                       "ppa_price_multiplier": round(mult, 6),
                       "ppa_price_usd_mwh": round(mult * base_ppa, 4),
                       "achieved_metric": _metric_of(final, req.target_metric),
                       "equity_irr": final["metrics"]["equity_irr"],
                       "min_dscr_senior": final["metrics"]["min_dscr_senior"],
                       "attainable": True})
    return {"mode": "computed", "target_metric": req.target_metric, "target_value": req.target_value,
            "base_ppa_price_usd_mwh": base_ppa, "model_evaluations": evals,
            "method": "grid-scan over gearing × bisection on the PPA-price multiplier in [0.2, 5.0] (§14)",
            "points": points}


# ─────────────────────────────────────────────────────────────────────────────
# PORTFOLIO MODE (§13) — consolidate 2–5 assets + HoldCo debt layer
# ─────────────────────────────────────────────────────────────────────────────
def _cosine(a: List[float], b: List[float]) -> float:
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na < 1e-12 or nb < 1e-12:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)


@router.post("/consolidate")
def consolidate_endpoint(req: PortfolioRequest) -> Dict[str, Any]:
    """Portfolio mode (§13): run each asset through the FULL model, then
    consolidate on a common period axis (shorter assets pad with 0).

    • Combined statements: per-period sums of revenue, opex, EBITDA, CFADS,
      DS, interest, NI, distributions (+ emissions for the portfolio
      sustainability roll-up).
    • Portfolio DSCR_t = ΣCFADS_t / ΣDS_t — the aggregate (mediant) ratio,
      which always lies between the min and max constituent DSCR.
    • Diversification (DOCUMENTED PROXY): lifetime revenue-mix vectors over
      (PPA, merchant, capacity, REC, carbon); pairwise cosine similarity
      ρ_ab, CFADS-weighted average ρ̄; score = 1 − ρ̄.
    • HoldCo layer (STRUCTURAL SUBORDINATION): HoldCo debt is serviced ONLY
      from asset equity distributions (UpstreamCF), never from asset CFADS.
      Annuity schedule, HoldCo DSCR_t = UpstreamCF_t / DS_t, lock-up breaches
      and payment shortfalls reported. HoldCo equity IRR: aggregated asset
      equity draws (COD-aligned — assets reach COD simultaneously, documented
      simplification), +HoldCo debt proceeds at COD, then UpstreamCF − DS."""
    template_map = {"solar_100mw": _template_solar, "bess_400mwh": _template_bess,
                    "wind_50mw_carbon": _template_wind_carbon}
    assets = []
    for a in req.assets:
        if a.inputs is not None:
            inp = a.inputs.model_dump()
        elif a.template_id in template_map:
            inp = template_map[a.template_id]().model_dump()
        else:
            raise HTTPException(status_code=422, detail=(
                f"Asset '{a.name or a.template_id}': provide inputs or a valid "
                f"template_id ({sorted(template_map)})"))
        name = a.name or inp["project_name"]
        res = run_model(inp, with_baseline=False)
        assets.append({"name": name, "inputs": inp, "result": res})

    Ymax = max(a["inputs"]["timeline"]["operations_years"] for a in assets)
    streams = ["revenue_ppa", "revenue_merchant", "revenue_capacity", "revenue_rec", "revenue_carbon"]

    def line(a: dict, key: str, t: int) -> float:
        pers = a["result"]["periods"]
        return pers[t][key] if t < len(pers) else 0.0

    combined, port_dscr_path = [], []
    for t in range(Ymax):
        cfads = sum(line(a, "cfads", t) for a in assets)
        ds = sum(sum(line(a, "ds_by_tranche", t)) if t < len(a["result"]["periods"]) else 0.0 for a in assets)
        # Constituent DSCR on the SAME basis as the portfolio ratio (CFADS /
        # TOTAL debt service across tranches) so the mediant bound holds exactly
        dscr_vals = []
        for a in assets:
            if t < len(a["result"]["periods"]):
                p = a["result"]["periods"][t]
                ds_a = sum(p["ds_by_tranche"])
                if ds_a > 1e-9:
                    dscr_vals.append(p["cfads"] / ds_a)
        pd = (cfads / ds) if ds > 1e-9 else None
        port_dscr_path.append(pd)
        combined.append({
            "period": t + 1,
            "revenue": round(sum(line(a, "revenue_total", t) for a in assets), 4),
            "opex": round(sum(line(a, "opex", t) for a in assets), 4),
            "ebitda": round(sum(line(a, "ebitda", t) for a in assets), 4),
            "cfads": round(cfads, 4),
            "debt_service": round(ds, 4),
            "interest": round(sum(line(a, "interest", t) for a in assets), 4),
            "net_income": round(sum(a["result"]["statements"]["income"][t]["net_income"]
                                    if t < len(a["result"]["statements"]["income"]) else 0.0
                                    for a in assets), 4),
            "distributions": round(sum(line(a, "distribution", t) for a in assets), 4),
            "emissions_tco2e": round(sum(line(a, "emissions_tco2e", t) for a in assets), 2),
            "portfolio_dscr": None if pd is None else round(pd, 4),
            "constituent_dscr_min": round(min(dscr_vals), 4) if dscr_vals else None,
            "constituent_dscr_max": round(max(dscr_vals), 4) if dscr_vals else None,
        })

    # ── Diversification proxy (§13, documented) ───────────────────────────────
    mixes, weights = [], []
    for a in assets:
        vec = [sum(p[s] for p in a["result"]["periods"]) for s in streams]
        mixes.append(vec)
        weights.append(max(sum(p["cfads"] for p in a["result"]["periods"]), 1e-9))
    pair_rows, num, den = [], 0.0, 0.0
    for i in range(len(assets)):
        for j in range(i + 1, len(assets)):
            rho = _cosine(mixes[i], mixes[j])
            w = weights[i] * weights[j]
            num += w * rho
            den += w
            pair_rows.append({"a": assets[i]["name"], "b": assets[j]["name"],
                              "revenue_mix_correlation_proxy": round(rho, 6)})
    rho_bar = num / den if den > 0 else 1.0
    diversification = {
        "method": "CFADS correlation PROXY from lifetime revenue-mix overlap: "
                  "ρ_ab = cos(mix_a, mix_b) over (PPA, merchant, capacity, REC, carbon); "
                  "ρ̄ = CFADS-share-weighted mean; score = 1 − ρ̄ (0 = identical mixes, →1 = disjoint). "
                  "NOT an estimated covariance — a stated structural proxy.",
        "pairwise": pair_rows,
        "rho_bar": round(rho_bar, 6),
        "diversification_score": round(1.0 - rho_bar, 6),
        "revenue_mix_by_asset": [
            {"name": assets[i]["name"],
             "mix": {s: round(mixes[i][k], 4) for k, s in enumerate(streams)}}
            for i in range(len(assets))],
    }

    # ── HoldCo debt layer (§13: structural subordination) ─────────────────────
    upstream = [combined[t]["distributions"] for t in range(Ymax)]
    hc = req.holdco.model_dump()
    holdco_block = {"enabled": bool(hc["enabled"])}
    holdco_ds_path = [0.0] * Ymax
    if hc["enabled"] and hc["debt_musd"] > 0:
        r_hc = hc["rate_pct"] / 100.0
        n_hc = min(int(hc["tenor_years"]), Ymax)
        B = hc["debt_musd"]
        A = B * r_hc / (1.0 - (1.0 + r_hc) ** (-n_hc)) if r_hc > 1e-9 else B / n_hc
        rows_hc, breaches, shortfalls = [], [], []
        for t in range(1, Ymax + 1):
            if B <= 1e-12:
                rows_hc.append({"period": t, "interest": 0.0, "principal": 0.0, "ds": 0.0,
                                "balance": 0.0, "upstream_cf": round(upstream[t - 1], 4),
                                "holdco_dscr": None, "net_to_equity": round(upstream[t - 1], 4)})
                continue
            it = B * r_hc
            prin = min(max(A - it, 0.0), B)
            if t == n_hc:
                prin = B
            ds = it + prin
            holdco_ds_path[t - 1] = ds
            dscr = upstream[t - 1] / ds if ds > 1e-9 else None
            if dscr is not None and dscr < hc["lockup_dscr"]:
                breaches.append(t)
            if upstream[t - 1] < ds - 1e-9:
                shortfalls.append({"period": t, "shortfall_musd": round(ds - upstream[t - 1], 4)})
            B -= prin
            rows_hc.append({"period": t, "interest": round(it, 4), "principal": round(prin, 4),
                            "ds": round(ds, 4), "balance": round(B, 4),
                            "upstream_cf": round(upstream[t - 1], 4),
                            "holdco_dscr": None if dscr is None else round(dscr, 4),
                            "net_to_equity": round(upstream[t - 1] - ds, 4)})
        hc_dscrs = [r["holdco_dscr"] for r in rows_hc if r["holdco_dscr"] is not None]
        holdco_block.update({
            "debt_musd": hc["debt_musd"], "rate_pct": hc["rate_pct"],
            "tenor_years": n_hc, "annuity_payment_musd": round(A, 4),
            "lockup_dscr": hc["lockup_dscr"],
            "schedule": rows_hc,
            "min_holdco_dscr": round(min(hc_dscrs), 4) if hc_dscrs else None,
            "avg_holdco_dscr": round(sum(hc_dscrs) / len(hc_dscrs), 4) if hc_dscrs else None,
            "lockup_breach_periods": breaches,
            "payment_shortfalls": shortfalls,
            "note": "Structural subordination: HoldCo debt is serviced ONLY from asset "
                    "equity distributions (UpstreamCF), never from asset-level CFADS.",
        })

    # ── Portfolio + HoldCo equity IRR (COD-aligned aggregation, documented) ───
    eq_flows, eq_times = [], []
    for a in assets:
        con = a["result"]["construction"]
        Ma = a["inputs"]["timeline"]["construction_months"]
        for r in con:
            eq_flows.append(-r["equity_draw_musd"])
            eq_times.append((r["month"] - Ma) / 12.0)
        dsra_eq = a["result"]["sizing"]["equity_musd"] - sum(r["equity_draw_musd"] for r in con)
        eq_flows.append(-dsra_eq)
        eq_times.append(0.0)
    for t in range(1, Ymax + 1):
        eq_flows.append(upstream[t - 1])
        eq_times.append(float(t))
    portfolio_irr = _irr(eq_flows, eq_times)
    disc = req.discount_rate_pct / 100.0
    portfolio_npv = _npv_at(disc, eq_flows, eq_times)

    holdco_irr = None
    if hc["enabled"] and hc["debt_musd"] > 0:
        hc_flows = list(eq_flows) + [hc["debt_musd"]] + [-holdco_ds_path[t] for t in range(Ymax)]
        hc_times = list(eq_times) + [0.0] + [float(t + 1) for t in range(Ymax)]
        holdco_irr = _irr(hc_flows, hc_times)
        holdco_block["holdco_equity_irr"] = None if holdco_irr is None else round(holdco_irr, 6)

    port_dscr_vals = [v for v in port_dscr_path if v is not None]
    total_equity = sum(a["result"]["sizing"]["equity_musd"] for a in assets)
    total_debt = sum(sum(a["result"]["sizing"]["debt_by_tranche_musd"]) for a in assets)
    return {
        "mode": "computed", "engine": "financial_model_engine",
        "n_assets": len(assets), "periods": Ymax,
        "assets": [{"name": a["name"],
                    "operations_years": a["inputs"]["timeline"]["operations_years"],
                    "sizing": a["result"]["sizing"],
                    "metrics": a["result"]["metrics"],
                    "covenants": {"lockup_periods": a["result"]["covenants"]["lockup_periods"],
                                  "payment_defaults": len(a["result"]["covenants"]["payment_defaults"])},
                    "cumulative_emissions_tco2e": a["result"]["sustainability"]["totals"]["cumulative_emissions_tco2e"],
                    "balance_sheet_ok": a["result"]["balance_sheet_ok"]}
                   for a in assets],
        "combined": combined,
        "portfolio_metrics": {
            "portfolio_equity_irr": None if portfolio_irr is None else round(portfolio_irr, 6),
            "portfolio_equity_npv_musd": round(portfolio_npv, 4),
            "discount_rate_pct": req.discount_rate_pct,
            "min_portfolio_dscr": round(min(port_dscr_vals), 4) if port_dscr_vals else None,
            "avg_portfolio_dscr": round(sum(port_dscr_vals) / len(port_dscr_vals), 4) if port_dscr_vals else None,
            "total_equity_musd": round(total_equity, 4),
            "total_debt_musd": round(total_debt, 4),
            "cumulative_emissions_tco2e": round(sum(c["emissions_tco2e"] for c in combined), 2),
            "note": "Portfolio DSCR_t = ΣCFADS_t/ΣDS_t (mediant) — always between the "
                    "min and max constituent DSCR each period. COD-aligned aggregation "
                    "(all assets reach COD simultaneously) — documented simplification.",
        },
        "diversification": diversification,
        "holdco": holdco_block,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Templates — hand-authored ILLUSTRATIVE starting points (editable defaults,
# not market quotes). Values chosen to be plausible 2026 US-market figures.
# ─────────────────────────────────────────────────────────────────────────────
def _template_solar() -> ModelInputs:
    return ModelInputs()  # the field defaults ARE the solar template


def _template_bess() -> ModelInputs:
    return ModelInputs(
        project_name="400 MWh / 100 MW BESS (illustrative)",
        timeline=TimelineConfig(construction_months=12, operations_years=20),
        capex=CapexConfig(total_capex_musd=100.0, drawdown_curve="linear"),
        generation=GenerationConfig(capacity_mw=100.0, capacity_factor_p50=0.115,
                                    capacity_factor_p90=0.10, capacity_factor_p99=0.09,
                                    production_case="P50", degradation_pct_yr=2.5),
        revenue=RevenueConfig(
            ppa=PPAStream(enabled=False, price_usd_mwh=0.0, contracted_pct=0.0, tenor_years=0),
            merchant=MerchantStream(enabled=True, price_usd_mwh=95.0, escalation_pct=2.0, capture_rate_pct=100.0),
            capacity=CapacityStream(enabled=True, usd_per_mw_yr=45000.0, escalation_pct=2.0),
            rec=RECStream(enabled=False, usd_per_mwh=0.0, tenor_years=0),
            carbon=CarbonStream(enabled=False)),
        opex=OpexConfig(fixed_usd_per_mw_yr=9000.0, variable_usd_per_mwh=2.0,
                        insurance_pct_capex_yr=0.6, land_lease_kusd_yr=150.0,
                        mra_annual_contribution_musd=1.6, mra_funding_years=14,
                        major_maintenance=[MaintenanceEvent(year=8, cost_musd=12.0),
                                           MaintenanceEvent(year=14, cost_musd=10.0)]),
        tranches=[DebtTranche(name="Senior", sizing="gearing", gearing_pct=55.0,
                              amort_type="annuity", rate_type="floating",
                              base_rate_pct=4.0, margin_pct=2.5,
                              swap_notional_pct=75.0, swap_fixed_rate_pct=3.9,
                              tenor_years=12, dsra_months=6)],
        waterfall=WaterfallConfig(cash_sweep_pct=15.0),
        tax=TaxConfig(rate_pct=25.0, depreciation="macrs"),
        covenants=CovenantConfig(lockup_dscr=1.20, default_dscr=1.05),
        discount_rate_pct=9.0)


def _template_wind_carbon() -> ModelInputs:
    return ModelInputs(
        project_name="50 MW onshore wind + carbon revenue (illustrative)",
        timeline=TimelineConfig(construction_months=15, operations_years=25),
        capex=CapexConfig(total_capex_musd=65.0, drawdown_curve="logistic"),
        generation=GenerationConfig(capacity_mw=50.0, capacity_factor_p50=0.38,
                                    capacity_factor_p90=0.335, capacity_factor_p99=0.30,
                                    production_case="P50", degradation_pct_yr=0.6),
        revenue=RevenueConfig(
            ppa=PPAStream(enabled=True, price_usd_mwh=56.0, escalation_pct=1.5,
                          contracted_pct=70.0, tenor_years=12),
            merchant=MerchantStream(enabled=True, price_usd_mwh=44.0, escalation_pct=2.0, capture_rate_pct=85.0),
            capacity=CapacityStream(enabled=False),
            rec=RECStream(enabled=True, usd_per_mwh=4.0, tenor_years=12),
            carbon=CarbonStream(enabled=True, tonnes_per_yr=45000.0, usd_per_tonne=12.0, escalation_pct=3.5)),
        opex=OpexConfig(fixed_usd_per_mw_yr=42000.0, variable_usd_per_mwh=2.5,
                        insurance_pct_capex_yr=0.5, land_lease_kusd_yr=300.0,
                        mra_annual_contribution_musd=0.5, mra_funding_years=12,
                        major_maintenance=[MaintenanceEvent(year=13, cost_musd=5.0)]),
        tranches=[DebtTranche(name="Senior", sizing="gearing", gearing_pct=50.0,
                              amort_type="sculpted", target_dscr=1.35,
                              rate_type="fixed", fixed_rate_pct=5.8,
                              tenor_years=16, dsra_months=6),
                  DebtTranche(name="Mezzanine", sizing="gearing", gearing_pct=8.0,
                              amort_type="annuity", rate_type="fixed", fixed_rate_pct=8.5,
                              tenor_years=12, dsra_months=0)],
        waterfall=WaterfallConfig(cash_sweep_pct=25.0),
        tax=TaxConfig(rate_pct=25.0, depreciation="straight_line", sl_years=25),
        covenants=CovenantConfig(lockup_dscr=1.15, default_dscr=1.05),
        discount_rate_pct=8.5)


@router.get("/ref/templates")
def templates_endpoint() -> Dict[str, Any]:
    """Three labeled illustrative starting templates with FULL input sets.
    Hand-authored editable defaults — plausible 2026 figures, NOT market quotes."""
    return {"mode": "reference",
            "label": "Hand-authored illustrative templates (editable defaults, not market data)",
            "templates": [
                {"id": "solar_100mw", "name": "100 MW Solar PV — 70% geared, sculpted senior",
                 "inputs": _template_solar().model_dump()},
                {"id": "bess_400mwh", "name": "400 MWh BESS — merchant + capacity, floating + swap",
                 "inputs": _template_bess().model_dump()},
                {"id": "wind_50mw_carbon", "name": "50 MW Wind + carbon credits — senior + mezz, 25% sweep",
                 "inputs": _template_wind_carbon().model_dump()},
            ]}
