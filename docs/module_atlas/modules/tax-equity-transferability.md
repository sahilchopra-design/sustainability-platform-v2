# Tax Equity Transferability
**Module ID:** `tax-equity-transferability` · **Route:** `/tax-equity-transferability` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Chk`, `Fld`, `Kpi`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;` |
| `fmtNum` | `(v, d = 2) => (v == null \|\| isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `cash` *(shared)*, `fastapi` *(shared)*, `placed`, `pydantic` *(shared)*, `t`, `typing` *(shared)*, `year` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tax-equity/ref/adder-checklists** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'domestic_content', 'energy_community'], 'n_keys': 3}`

**GET /api/v1/tax-equity/ref/ira-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'itc', 'ptc', 'macrs_5yr_pct', 'bonus_depreciation_phasedown_pct', 'obbba_note', 'itc_recapture_schedule_pct', 'transferability', 'federal_corporate_tax_rate_pct'], 'n_keys': 9}`

**GET /api/v1/tax-equity/ref/transfer-market** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['label', 'rows', 'vintage_adjustment_per_dollar', 'notes'], 'n_keys': 4}`

**POST /api/v1/tax-equity/flip** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/tax-equity/structures** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).

| Connected module | Shared via |
|---|---|
| `financial-modeling-studio` | table:cash, table:year |
| `export-credit-esg` | table:year |
| `project-finance-debt-sizer` | table:year |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`tax-equity-transferability` (`backend/api/v1/routes/tax_equity.py`, 1,201
lines; frontend `TaxEquityTransferabilityPage.jsx`, 722 lines) monetizes US
IRA renewable-energy tax attributes across four real structures — a
**partnership-flip** IRR-bisection solver (`POST /flip`), a **sale-
leaseback** and an **inverted lease** (`POST /structures`), and a direct
**§6418 credit transfer** comparison computed alongside the flip. Every
statutory constant (ITC/PTC rates and adders, MACRS schedule, §168(k) bonus
phase-down, §50(a)(1) recapture vesting, §50(c)(3) basis reduction,
§50(d)(5) income inclusion) is a real, cited IRC parameter; every solver
(flip-year IRR, level-rent, prepaid-rent) is deterministic bisection — "no
PRNG anywhere" is not stated verbatim here but is true by inspection: every
number is arithmetic on the request payload plus the constants below.

### 7.2 Credit sizing (real IRA parameters)

```python
base = 30.0 if req.prevailing_wage_met else 6.0
adder = (10.0 if req.prevailing_wage_met else 2.0)
itc_rate_pct = base + (adder if req.energy_community else 0.0) + (adder if req.domestic_content else 0.0)
gross_itc = eligible_basis * itc_rate_pct / 100.0
depreciable_basis = req.capex_musd - 0.5 * gross_itc          # IRC §50(c)(3)
```
(lines 434–441). PTC mode instead computes `ptc_eff = ptc_rate_usd_mwh × (1 +
0.10×energy_community + 0.10×domestic_content)` — the PTC adders are
**multiplicative on the credit amount**, not additive percentage points like
the ITC adders (module docstring, lines 17–19) — and PTC carries **no**
§50(c)(3) basis haircut (`depreciable_basis = capex_musd` unchanged, line
447).

### 7.3 Depreciation schedules

```python
def _depreciation_schedule(method, basis, pis_year, obbba, sl_years):
    if method == "macrs_5yr":
        return [basis * p / 100.0 for p in MACRS_5YR_PCT]                 # 20/32/19.2/11.52/11.52/5.76
    if method == "bonus":
        bonus_pct = 100.0 if obbba else BONUS_PHASEDOWN_PCT.get(pis_year, 0.0)
        b = basis * bonus_pct / 100.0
        sched = [(basis-b) * p / 100.0 for p in MACRS_5YR_PCT]
        sched[0] += b
        return sched
    return [basis / sl_years] * sl_years                                   # straight_line
```
`BONUS_PHASEDOWN_PCT` = {2022: 100, 2023: 80, 2024: 60, 2025: 40, 2026: 20,
2027: 0} — the real TCJA §168(k) phase-down — with an explicit, *not
silently applied*, `apply_obbba_100pct_bonus` toggle for the OBBBA (P.L.
119-21, July 2025) 100%-bonus restoration, labeled "confirm eligibility...
against final regulations for your facts" (lines 135–140).

### 7.4 Flip-year bisection solver — worked example

Deterministic bisection IRR (`_irr`, lines 363–380): `lo=-0.95, hi=5.0,
tol=1e-7`, 200 iterations max, returns `None` if there's no sign change
(guards against a flip search that never has a positive-NPV region).

**Simplified 4-year example** (small numbers chosen for hand-tracing, not
the page's $180M default): `capex=$100M`, ITC eligible basis 100%,
`prevailing_wage_met=True` ⇒ `itc_rate=30%` ⇒ `gross_itc = 100×0.30 =
$30M`; `depreciable_basis = 100 − 0.5×30 = $85M`. Straight-line over 4 years
⇒ `dep = 85/4 = $21.25M/yr`. Generation 100,000 MWh × $50/MWh PPA (no
escalation) = `$5.0M/yr` revenue; opex `$2.0M/yr` flat; `tax_rate = 21%`.

```
taxable_t = 5.0 − 2.0 − 21.25 = −18.25M            (every year — bonus/SL depreciation swamps revenue)
tax_t     = −18.25 × 0.21 = −3.8325M                (negative = benefit)
credit_1  = 30.0 (ITC, year 1 only);  credit_{2,3,4} = 0
atv_t     = (rev−opex) − tax_t + credit_t = 3.0 − (−3.8325) + credit_t = 6.8325 + credit_t
```
So `atv₁ = 36.8325M`, `atv₂ = atv₃ = atv₄ = 6.8325M`. With `te_investment_pct
= 40%` ⇒ `te_inv = $40M`, `preflip_alloc = 99%`, `target IRR = 7.5%`, the
flip scan builds the TE flow vector year by year and re-solves IRR by
bisection at each step:

| t | TE flow vector (cumulative) | IRR (bisection) | ≥ 7.5%? |
|---|---|---|---|
| 1 | [−40, 36.4642] | **−8.84%** | no |
| 2 | [−40, 36.4642, 6.7642] | **+6.97%** | no |
| 3 | [−40, 36.4642, 6.7642, 6.7642] | **+17.73%** | **yes — flip year = 3** |
| 4 | [−40, 36.4642, 6.7642, 6.7642, 6.7642] | +24.44% | (post-flip) |

(TE cash each year = `atv_t × 0.99`; e.g. year 1 = `36.8325×0.99 =
36.4642`.) The jump from 6.97% at t=2 to 17.73% at t=3 is real, not a
solver artifact: adding one more `$6.7642M` inflow to a `[-40, +36.46]` pair
that was already close to break-even pushes the multi-period IRR sharply
above the two-period figure — exactly the discrete, lumpy dynamic the flip
scan is built to catch year-by-year rather than by interpolation. `flip_year
= 3`, `te_irr_at_flip ≈ 17.73%`; from year 4 onward the allocation would
switch to `postflip_te_alloc_pct` (5% default) had the horizon continued.

### 7.5 §50(a)(1) recapture schedule — worked example

```python
ITC_RECAPTURE_SCHEDULE_PCT = {0: 100.0, 1: 80.0, 2: 60.0, 3: 40.0, 4: 20.0, 5: 0.0}
scenarios = [{"disposition_end_of_year": y,
              "recapture_pct": ITC_RECAPTURE_SCHEDULE_PCT.get(min(y, 5), 0.0)} for y in range(1, 7)]
```
(`_recapture_block`, lines 518–557). Convention: disposition at the **end**
of year `y` means `y` full vesting years have elapsed, vesting 20%/yr — so a
disposition at the end of year 3 has 3 full years vested (60% vested, **40%
recaptured**), not year-4 vesting. Continuing the worked example
(`gross_itc = $30M`): a disposition at end of year 3 claws back `30 × 0.40 =
**$12.0M**`, leaving `30 × 0.60 = $18.0M` permanently vested. The full
ladder for this example: y1→$24.0M clawback (80%), y2→$18.0M (60%),
y3→$12.0M (40%), y4→$6.0M (20%), y5+→$0 (fully vested). The code notes PTC
carries **no** investment recapture (credits accrue on production, not
capital); in a flip the TE partner economically bears recapture risk
(sponsor indemnity is standard), while in a §6418 transfer the **buyer**
bears it under §6418(g)(3) — which is exactly why insurance wraps exist for
transferred ITC deals but are rarely needed for PTC strips.

### 7.6 §704(b) capital-account / DRO tracking

A **book** capital-account roll for the TE partner (book income assumed
equal to taxable income — labeled simplification) is tracked *alongside*
the cash-flow model, not fed back into it:
```python
proposed = cap + book_income - cash_dist - itc_adj
if proposed < -dro_cap:
    realloc = -dro_cap - proposed          # excess loss a real §704(b) deal reallocates to the sponsor
    proposed = -dro_cap
```
(`_capital_account_block`, lines 560–605). This is explicitly informational:
"the roll and DRO reallocation are REPORTED, not re-priced into the cash
flows" — a real deal would reallocate the flagged losses to the sponsor,
delaying the TE partner's tax benefit and pushing the flip later, but this
engine does not iterate to a self-consistent re-solve.

### 7.7 Structure menu — sale-leaseback and inverted lease

**Sale-leaseback**: FMV = `capex × (1 + slb_fmv_stepup_pct/100)` (the
§50(d)(4) 3-month-window step-up, hand-authored ~15% typical). ITC and
depreciable basis are computed on the *stepped-up* FMV (still haircut 50% of
ITC per §50(c)(3) at the lessor). Level rent is solved by bisection
(`_solve_level_payment`) so the lessor's after-tax IRR — `rent×(1−tax) +
depreciation shield + year-1 ITC` — hits the TE target exactly; sponsor
gain-on-sale is taxed at close and residual/repurchase at lease-end is
ignored (documented simplification).

**Inverted lease**: sponsor-lessor keeps full ownership and **full**
depreciation (no §50(c)(3) haircut — the haircut only applies when the
claimant of the ITC also owns the depreciable asset); the TE-lessee takes
the ITC via pass-through election and includes 50% of it in income ratably
over 5 years per §50(d)(5) (`incl_tax = 0.5 × gross_itc / 5 × tax_rate`,
line 1076). The TE's prepaid-rent investment is solved as the exact PV of
its expected flows at the target IRR (`prepay = te_irr_target_flows_pv`,
line 1082) — by construction the TE IRR is exactly the target, not merely
approximately so.

Across the three structures, `subsidy_intensity` ($/tCO2e of federal tax
benefit delivered) typically ranks sale-leaseback highest (FMV step-up
enlarges both ITC and depreciable basis simultaneously), with the inverted
lease giving up the basis haircut but paying it back through the lessee's
income inclusion (`comparison_matrix`, lines 1143–1162) — a genuine
structural trade-off the code surfaces rather than asserts.

### 7.8 §6418 transferability depth

`_table_transfer_price` auto-selects a hand-authored size/type discount
(ITC <$25M→0.905, $25-100M→0.925, >$100M→0.940; PTC prices ~2pp tighter at
every tier — "no recapture exposure and no basis/step-up diligence"). An
insurance-wrap cost (`insurance_wrap_pct_of_credit`, ~1-3% hand-authored
range) nets against the price; forward commitments concede a further
1.5¢/$1 (next year) or 2.5¢/$1 (2+ years) versus spot. A **hybrid**
illustration carves `hybrid_transfer_pct` of credits out of the partnership
and **re-solves the flip end-to-end** on the reduced-credit ATV stream
(`_transfer_market_block`, lines 654–708) — this is a genuine re-solve, not
a linear approximation, so the reported hybrid flip year and IRRs are
internally consistent with the reduced credit stream.

### 7.9 Sustainability × financial overlay

`$/tCO2e = PV(credits + depreciation tax shield, at subsidy discount rate) ÷
lifetime avoided emissions (generation × user grid intensity × horizon)`
(`_sustainability_block`, lines 755–797), computed three ways: full flip
monetization, credits sold at market (net of wrap), and credits-only. The
`transfer` variant is always ≤ the flip variant because the transfer price
(`1 − wrap`) is < 1 — the code notes this delta is "monetization friction,
not a change in the federal expenditure."

### 7.10 Frontend

`TaxEquityTransferabilityPage.jsx` is a pure display layer over five live
endpoints (`POST /flip`, `POST /structures`, `GET /ref/ira-parameters`,
`/ref/transfer-market`, `/ref/adder-checklists`) — no client-side tax math
is duplicated; every KPI, chart and table cell reads directly from the
engine response or echoes a labeled input.

### 7.11 Data provenance & limitations

- **Real IRC constants**: ITC 6%/30% base+PWA, PTC $27.50/MWh (2024 IRS
  published), MACRS 5-yr percentages, §168(k) bonus phase-down, §50(a)(1)
  recapture vesting, §50(c)(3)/§50(d)(4)/§50(d)(5) mechanics — all cited to
  statute/notice in the module docstring and `/ref/ira-parameters`.
- **§6418 transfer-market table is hand-authored** market-observation basis
  (2023-2025 broker commentary), explicitly "APPROXIMATE... not a quote."
- **§704(b) capital-account/DRO model is a documented simplification** —
  single allocation percentage for cash and tax items (real deals often
  split them), book income assumed equal to taxable income, and DRO breaches
  are reported but not re-priced into the cash flows.
- **Both partners assumed to have full, immediate tax appetite** — no
  suspended-loss or passive-activity-limitation modeling.
- **Sale-leaseback ignores residual/repurchase value** at lease-end and
  taxes the step-up gain entirely at close — both explicitly documented
  simplifications that would understate/overstate sponsor economics in a
  real deal with a bargain-purchase option.
- No guide/code mismatch found: `NEXT_USE_CASES_2.md`'s spec ("ITC vs PTC
  economics, partnership-flip structure... MACRS depreciation value,
  transferability-market discount comparison") undersells the implementation,
  which also adds §50 recapture scenarios, §704(b)/DRO tracking, a 3-
  structure menu (sale-leaseback, inverted lease), a hybrid re-solve, and the
  $/tCO2e sustainability overlay.

## 8 · Model Specification

**Status: implemented.**

**8.1 Purpose & scope.** Monetize US IRA renewable-energy tax credits
(§48/§48E ITC or §45/§45Y PTC) across the real structuring alternatives —
partnership flip, sale-leaseback, inverted lease, and direct §6418 credit
transfer — for sponsors and tax-equity investors comparing after-tax IRR,
flip timing, recapture exposure and monetization-friction cost across
structures on the same project economics.

**8.2 Conceptual approach.** A single year-by-year after-tax cash-flow core
(`_flip_core`) computes revenue, opex, depreciation (MACRS/bonus/straight-
line, user-selectable), tax and credits for every year of the analysis
horizon; the partnership-flip year is found by re-solving TE-investor IRR
via bisection at each year until it first reaches the target — a genuine
year-by-year search, not an interpolated estimate. Sale-leaseback and
inverted-lease structures reuse the same core cash flows but re-derive their
own ITC basis (FMV step-up vs full ownership) and solve their financing
term (level rent / prepaid rent) by bisection to hit the same target IRR
exactly. §50 recapture, §704(b) capital accounts and the $/tCO2e overlay are
additive depth blocks computed from the same core outputs, not separate
models.

**8.3 Mathematical specification.**
```
ITC:  rate = (30% or 6%) + adder(EC) + adder(DC),  adder = 10pp (PWA) or 2pp
      gross_ITC = eligible_basis × rate;  depreciable_basis = capex − 0.5×gross_ITC   (§50(c)(3))
PTC:  rate_eff = rate_2024 × (1 + 0.10×EC + 0.10×DC)  (multiplicative adders)
Depreciation: MACRS_5yr[t] | bonus_pct×basis in yr1 + MACRS on remainder | basis/SL_years
Year t:  taxable_t = rev_t − opex_t − dep_t;  tax_t = taxable_t × rate
         credit_t = gross_ITC (t=1 only) | PTC_eff×(1+infl)^(t-1)×gen_t (t≤10)
         atv_t = (rev_t − opex_t) − tax_t + credit_t
Flip year = min t : IRR([-I0, atv_1×pre, ..., atv_t×pre]) ≥ target   (bisection IRR)
Recapture(y) = gross_ITC × (100 − 20y)%,  y = completed vesting years at disposition
Sale-leaseback:  FMV = capex×(1+stepup);  rent solved s.t. IRR([-FMV, fixed_t+rent×(1-tax)]) = target
Inverted lease:  prepay = PV(TE flows at target);  lessee income-inclusion tax = 0.5×ITC/5×tax, yrs 1-5
$/tCO2e = PV(credits + dep_shield, subsidy rate) / (generation × grid_intensity × horizon)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| ITC base/PWA rate | 6% / 30% | IRC §48/§48E |
| ITC/PTC adders | +10pp / +10% | IRC §45(b)(9)(11), §48(a)(12)(14) |
| MACRS 5-yr schedule | 20/32/19.2/11.52/11.52/5.76 | IRC §168, half-year convention |
| Bonus phase-down | 100/80/60/40/20/0% (2022-27) | IRC §168(k), TCJA as amended; OBBBA toggle |
| ITC recapture vesting | 20%/yr, 5yr | IRC §50(a)(1) |
| ITC basis reduction | 50% of ITC | IRC §50(c)(3) |
| SLB FMV step-up window | ~15% (editable) | IRC §50(d)(4), hand-authored typical |
| Inverted-lease income inclusion | 50% of ITC / 5yr | IRC §50(d)(5) |
| §6418 transfer price | $0.90–0.955/$1 by type/size | Hand-authored market-observation table, 2023-2025 |
| Federal corporate tax rate | 21% | IRC §11 (TCJA 2017) |

**8.4 Data requirements.** Capex, ITC-eligible basis %, PWA/energy-
community/domestic-content flags, generation (P50, optional P90 toggle),
PPA price and escalation, opex and escalation, tax rate, depreciation method
and placed-in-service year, TE target IRR and investment share, pre/post-
flip allocation %, analysis horizon, DRO cap %, optional disposition year,
§6418 transfer price and insurance wrap %, hybrid carve-out %, grid
intensity for the sustainability overlay; structure-menu additionally needs
SLB FMV step-up %, inverted-lease strip % and term.

**8.5 Validation & benchmarking.** No external backtest harness exists
in-repo. `/ref/ira-parameters`, `/ref/transfer-market` and
`/ref/adder-checklists` expose every constant for line-by-line comparison
against current IRS guidance and market broker quotes. Production validation
would compare solved flip years and IRRs against closed tax-equity deal
term sheets with comparable capital stacks, and refresh the §6418 discount
table from live broker indications rather than the current hand-authored
snapshot.

**8.6 Limitations & model risk.** Single-allocation-percentage simplification
of the §704(b) waterfall (real deals frequently split cash and tax
allocations); full, immediate tax-appetite assumption for both partners;
book income assumed equal to taxable income in the capital-account roll (no
book/tax timing disparities modeled); sale-leaseback ignores residual value
and taxes the entire step-up gain at close; the §6418 transfer-market table
and insurance-wrap cost range are hand-authored approximations that should
be refreshed from current broker commentary before being used for actual
pricing; the OBBBA 100%-bonus toggle requires the user to independently
confirm acquisition-date eligibility against final Treasury regulations.

**Framework alignment:** IRC §48/§48E (ITC) · §45/§45Y (PTC) · §168/§168(k)
(MACRS, bonus depreciation, TCJA/OBBBA) · §50(a)(1)/(c)(3)/(d)(4)/(d)(5)
(recapture, basis reduction, sale-leaseback step-up, inverted-lease income
inclusion) · §6418 (transferability) · §704(b) partnership-accounting
convention (capital accounts, DRO) — all as enacted/amended through the
2025 OBBBA.

## 9 · Future Evolution

### 9.1 Evolution A — Bench-pinned solvers, self-consistent §704(b) re-solve, and a refreshed §6418 price surface (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's strongest engines — real IRC constants throughout, deterministic bisection solvers, a hybrid carve-out that genuinely re-solves the flip (§7.8), and zero PRNG (§7.1). Its rung-3 gaps are precisely the ones §7.11 and §8.5/§8.6 document: no bench pins exist for the solvers; the §704(b)/DRO capital-account roll is "reported, not re-priced" (§7.6) so a DRO breach doesn't push the flip year the way a real deal's loss reallocation would; and the §6418 transfer-price table is a hand-authored 2023–2025 broker-commentary snapshot.

**How.** (1) Add `bench_quant` pins: the §7.4 worked example (flip year 3, TE IRR 17.73% on the $100M/4-year case) and the §7.5 recapture ladder become golden cases, gating any edit to `_flip_core`, `_irr`, or the depreciation schedules. (2) Implement the iterative §704(b) re-solve as an opt-in mode: reallocate DRO-breaching losses to the sponsor, recompute the TE after-tax vector, re-run the flip scan to fixed point — reporting both "informational" and "re-solved" flip years so the current behaviour stays comparable. (3) Version the transfer-price table (`/ref/transfer-market` already exposes it) with an `as_of` date and a documented refresh procedure from broker indications; add sensitivity bands (±2¢/$1) to the comparison matrix. (4) P50/P90 generation toggle exercised as a true scenario pair in `/flip` responses.

**Prerequisites.** None structural — the engine is ready; the lineage harness currently skips both POST endpoints, so a traced write-path run should confirm behaviour first. **Acceptance:** bench suite reproduces §7.4/§7.5 tables exactly; re-solved mode moves the flip year on a constructed DRO-breach case while the informational mode matches today's output.

### 9.2 Evolution B — Deal-structuring analyst across the four monetization paths (LLM tier 2)

**What.** The module's user decides between flip, sale-leaseback, inverted lease, and §6418 transfer on the same project economics — exactly the multi-tool comparison an LLM analyst handles well. The copilot answers "why does the sale-leaseback show higher subsidy intensity?" from the engine's own `comparison_matrix` reasoning (FMV step-up enlarges both ITC and depreciable basis, §7.7) and runs what-ifs — "drop domestic content, move PIS to 2026, re-compare", "at what wrap cost does transfer beat the flip?" — as tool calls against `POST /flip` and `POST /structures`.

**How.** Tool schemas derive from the module's five existing Pydantic-typed routes; grounding corpus is this Atlas page's exceptional §7/§8 depth (the §50 recapture conventions, §50(d)(5) income inclusion, PTC-vs-ITC adder asymmetry are all documented with statute citations — ideal copilot material). The fabrication validator checks every IRR/flip-year/price figure against tool outputs. The copilot must carry the engine's own disclaimers: transfer prices are "APPROXIMATE... not a quote" (§7.11), the OBBBA bonus toggle requires independent eligibility confirmation, and §704(b) results are informational until Evolution A's re-solve ships.

**Prerequisites.** REQUIRE_AUTH-gated POST access for the copilot's inherited user session; the two POST endpoints verified live (harness-skipped today). **Acceptance:** every numeric traces to a tool call; tax-law questions outside the modeled surface (e.g. passive-activity limitations, which §8.6 lists as unmodeled) are answered with the limitation citation, not improvised tax advice.