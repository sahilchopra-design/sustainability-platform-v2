# SAF Project Finance Modeler
**Module ID:** `saf-project-finance` · **Route:** `/saf-project-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EF2 · **Sprint:** EF

## 1 · Overview
Full project finance model for SAF facilities: DSCR analysis, Newton-Raphson IRR engine, NPV, and blended finance structuring across 20 seeded SAF deals. Interactive sliders for CAPEX, capacity, offtake price, and debt rate. Risk register with probability-impact scatter.

> **Business value:** Used by SAF project developers, infrastructure investors, DFI project officers, and airline finance teams evaluating project economics, debt capacity, and blended finance structuring.

**How an analyst works this module:**
- Review deal overview for pipeline of 20 SAF project deals
- Use financial model tab with CAPEX/price sliders for real-time IRR/NPV
- Analyse DSCR & debt for minimum coverage ratio across debt scenarios
- Examine blended finance structures including DFI, grant, and concessional tranches

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `npv` | `cf.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cf.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `pathway` | `['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 7 + 1) * 4)];` |
| `capMt` | `parseFloat((0.1 + sr(i * 11 + 2) * 0.9).toFixed(2));` |
| `capex` | `parseFloat((capMt * (320 + sr(i * 13 + 3) * 400)).toFixed(0));` |
| `debtPct` | `parseFloat((55 + sr(i * 17 + 4) * 20).toFixed(0));` |
| `irr` | `parseFloat((8 + sr(i * 19 + 5) * 12).toFixed(1));` |
| `dscr` | `parseFloat((1.20 + sr(i * 23 + 6) * 0.80).toFixed(2));` |
| `country` | `['USA', 'EU', 'UK', 'Australia', 'Singapore', 'Norway', 'UAE'][Math.floor(sr(i * 29 + 7) * 7)];` |
| `status` | `['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 31 + 8) * 4)];` |
| `tenor` | `15 + Math.floor(sr(i * 37 + 9) * 10);` |
| `iraCredit` | `country === 'USA' ? parseFloat((capMt * 1.45 * 264).toFixed(0)) : 0;` |
| `filtered` | `useMemo(() => DEALS.filter(d => selStatus === 'ALL' \|\| d.status === selStatus), [selStatus]);  const avgDscr = useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.dscr, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalCapex` | `useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);` |
| `annualRevenue` | `useMemo(() => capMtInput * 1e6 * lcoValue * 264 / 1e6, [capMtInput, lcoValue]);` |
| `annualOpex` | `useMemo(() => capexInput * 0.035, [capexInput]);` |
| `annualDebtService` | `useMemo(() => { const debt = capexInput * 0.65;` |
| `factor` | `Math.pow(1 + r, n);` |
| `equityCF` | `useMemo(() => annualRevenue - annualOpex - annualDebtService, [annualRevenue, annualOpex, annualDebtService]);` |
| `equityAmount` | `useMemo(() => capexInput * 0.35, [capexInput]);` |
| `cashflowData` | `useMemo(() => Array.from({ length: 20 }, (_, yr) => ({ year: `Y${yr + 1}`, revenue: parseFloat(annualRevenue.toFixed(1)), opex: -parseFloat(annualOpex.toFixed(1)), debt: -parseFloat(annualDebtService.toFixed(1)), equity: parseFloat(equityCF.toFixed(1)), })), [annualRevenue, annualOpex, annualDebtService, equityCF]);` |
| `dscrProfile` | `useMemo(() => Array.from({ length: 20 }, (_, yr) => ({ year: `Y${yr + 1}`, dscr: parseFloat((dscr * (1 + yr * 0.012)).toFixed(2)), })), [dscr]);` |
| `rev` | `capMtInput * 1e6 * p * 264 / 1e6;` |
| `debtAmt` | `capexInput * d / 100;` |
| `ecf` | `annualRevenue - annualOpex - ds;` |
| `eqAmt` | `capexInput * (1 - d / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DSCR (min for bankability) | `EBITDA / (Principal + Interest)` | Standard project finance practice | Aviation sector lenders require 1.20–1.25× minimum; DFI blended finance may accept 1.15×. |
| Equity IRR target | `Levered IRR with 60–70% debt` | IFC/BNEF SAF Finance Survey | Higher risk pathways (PtL) require 16–18%; mature HEFA accepts 12–14%. |
| CAPEX range ($/gal/yr) | `Total CAPEX / Nameplate_Capacity_gal_yr` | NREL TEA Benchmarks | HEFA $3–4/gal/yr; FT $5–7/gal/yr; PtL $6–9/gal/yr; learning expected to halve PtL by 2035. |
- **SAF deal database + project finance model + blended finance structures** → IRR/DSCR engine + 20-deal pipeline + risk scatter + blended capital stack → **SAF project developers, infrastructure funds, DFI officers, and airline financiers**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Project IRR (Newton-Raphson)
**Headline formula:** `IRR: NPV(r) = Σ CF_t/(1+r)^t = 0; DSCR = EBITDA / Debt_Service`

Typical unlevered IRR: 8–14% for HEFA; 6–10% for FT/PtL with IRA §40B; DSCR minimum 1.25× for lenders.

**Standards:** ['NREL SAF Techno-Economic Analysis', 'BNEF SAF Market Outlook 2024', 'IFC Blended Finance Principles']
**Reference documents:** NREL (2023) – SAF Techno-Economic Analysis; IFC (2023) – Blended Finance for SAF; BNEF SAF Financing Landscape 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The 20-deal "Deal Overview" universe (`DEALS`) has `irr` and
> `dscr` as **independently seeded PRNG fields** — they are not computed from any cash-flow model.
> A genuinely correct Newton-Raphson IRR solver (`calcIRR`) does exist in the code and **is** used,
> but only in the separate interactive "Financial Model" tab, where a user-adjustable capex/price/
> debt-rate calculator builds a real 21-period equity cash-flow vector and solves for IRR
> numerically. The two views of "IRR" on this page (static deal-log IRR vs interactive-calculator
> IRR) are computed by entirely different mechanisms.

### 7.1 What the module computes

**Interactive financial model** (real calculation):
```
annualRevenue     = capMt x 1e6 x lcoValue($/gal) x 264 gal/t / 1e6        // $M/yr
annualOpex        = capex x 3.5%                                          // fixed opex ratio
debt              = capex x 65%
annualDebtService = debt x r x (1+r)^18 / ((1+r)^18 - 1)                   // 18-yr level annuity, r = debtRate
dscr              = (annualRevenue - annualOpex) / annualDebtService
equityCF          = annualRevenue - annualOpex - annualDebtService         // flat, all 20 years
equityAmount      = capex x 35%
irr               = calcIRR([-equityAmount, equityCF x 20])  x 100         // Newton-Raphson, 200-iter cap
```
Newton-Raphson step: `r_{n+1} = r_n - NPV(r_n)/NPV'(r_n)`, where `NPV(r) = Σ CF_t/(1+r)^t` and
`NPV'(r) = -Σ t·CF_t/(1+r)^{t+1}` — this is a textbook-correct root-finder, converging to 1e-8
tolerance or 200 iterations.

**Deal Overview** (synthetic): each of 20 deals gets independently seeded `capex` ($32-828M,
derived from `capMt × ($320-720/t implied)`), `debtPct` (55-75%), `irr` (8-20%), `dscr` (1.20-2.00),
`tenor` (15-25yr) — `irr` and `dscr` here bear no computed relationship to `capex`/`debtPct`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Opex ratio | 3.5% of capex/yr | Hard-coded assumption, plausible for a SAF plant O&M ratio but uncited |
| Debt fraction | 65% of capex | Matches the guide's "60-70% debt" framing |
| Equity fraction | 35% of capex | Complement of debt fraction |
| Debt tenor | 18 years (fixed, not user-adjustable) | Hard-coded; sits within the guide's cited "15-25yr tenor" deal range but not tied to the `tenor` field shown per deal |
| `iraCredit` (USA deals only) | `capMt x 1.45 x 264` | $1.45/gal, near the middle of the guide's cited $1.25-1.75/gal IRA §40B range, applied as a flat per-deal figure without the CI-reduction-scaled formula the companion `saf-policy-mandate` module uses |
| Newton-Raphson seed | `r_0 = 0.10` (10%) | Standard reasonable starting guess for IRR solvers |

### 7.3 Calculation walkthrough

1. **Debt service**: correct level-annuity mortgage formula, so `annualDebtService` is a genuinely
   fixed payment across the 18-year tenor covering both principal and interest at `debtRate`.
2. **DSCR**: standard project-finance ratio, `(Revenue − Opex)/DebtService`; the page also plots a
   `dscrProfile` (20 years) that **artificially inflates** DSCR over time via `dscr × (1 + yr ×
   0.012)` — a hand-tuned 1.2%/yr growth assumption representing revenue escalation or debt
   amortisation benefit, not derived from the underlying revenue/opex/debt-service calculation
   used elsewhere on the page (those three terms are held flat across all 20 years in
   `cashflowData`).
3. **Equity IRR**: cash-flow vector is `[-equityAmount, equityCF, equityCF, ..., equityCF]` (21
   entries, Y0 outflow then 20 identical inflows) — because `equityCF` is flat, this is
   mathematically an **ordinary annuity IRR**, solvable in closed form
   (`equityAmount = equityCF × [1-(1+IRR)^-20]/IRR`); using Newton-Raphson for this simple case is
   correct but more machinery than strictly necessary — it does, however, generalise correctly to
   any future non-flat cash-flow vector (e.g. price-sensitivity or debt-sensitivity sweeps at
   lines 273/294, which rebuild `cf` per scenario and re-solve).
4. **Sensitivity sweeps**: price sensitivity and debt-fraction sensitivity tabs rebuild the cash-
   flow vector at each price/debt point and re-run `calcIRR`, correctly showing how IRR responds
   nonlinearly to leverage and offtake price — this is the module's strongest analytical feature.

### 7.4 Worked example

At `capexInput=$280M`, `capMtInput=0.3 Mt/yr`, `lcoValue=$2.20/gal`, `debtRate=6.0%`:
```
annualRevenue = 0.3 x 1e6 x 2.20 x 264 / 1e6 = $174.24M/yr
annualOpex    = 280 x 0.035 = $9.8M/yr
debt          = 280 x 0.65 = $182M
r=0.06, n=18: factor = 1.06^18 = 2.8543
annualDebtService = 182 x 0.06 x 2.8543 / (2.8543-1) = 182 x 0.17126 / 1.8543 = $16.81M/yr
dscr          = (174.24 - 9.8) / 16.81 = 164.44/16.81 = 9.78x   (implausibly high — see 7.5)
equityCF      = 174.24 - 9.8 - 16.81 = $147.63M/yr
equityAmount  = 280 x 0.35 = $98M
IRR: cf = [-98, 147.63 x 20]; since equityCF > equityAmount within Year 1 alone, calcIRR converges
     to an IRR well above 100% — a red flag that the default slider inputs are not mutually
     consistent (opex ratio too low and/or offtake price too high relative to a $280M/0.3Mt plant).
```
This worked example shows a **real limitation**: the model has no cross-input plausibility
guardrails, so default or extreme slider combinations can return DSCR/IRR values no real lender or
investor would accept.

### 7.5 Data provenance & limitations

- The interactive calculator's arithmetic (annuity debt service, DSCR, Newton-Raphson equity IRR)
  is genuinely correct project-finance methodology — the strongest technical content in this
  module.
- The static 20-deal "Deal Overview" IRR/DSCR figures are synthetic and disconnected from the real
  calculator — a user comparing "deal universe" IRRs to their own scenario IRR is comparing two
  unrelated data sources.
- No plausibility bounds on default inputs (see worked example) mean the calculator can silently
  produce economically nonsensical DSCR/IRR outputs.
- `dscrProfile`'s 1.2%/yr growth assumption is decorative, not derived from the same
  revenue/opex/debt-service build used for the headline DSCR figure.

**Framework alignment:** standard project-finance DSCR/annuity mathematics (correctly implemented)
· Newton-Raphson IRR solution of `NPV(r)=0` (correctly implemented, textbook root-finding) · IRS
Notice 2023-06 §40B credit (flat $1.45/gal approximation, not CI-scaled) · NREL SAF
Techno-Economic Analysis and IFC Blended Finance Principles (named in the guide as the deal-level
benchmark; not wired into the synthetic Deal Overview universe).

## 9 · Future Evolution

### 9.1 Evolution A — One IRR mechanism, bounded inputs, engine-backed deals (analytics ladder: rung 2 → 3)

**What.** §7 documents a split personality: the interactive Financial Model tab is genuinely correct project finance (annuity debt service, DSCR, a real Newton-Raphson equity IRR over a 21-period cash-flow vector), while the 20-deal "Deal Overview" carries independently seeded IRR/DSCR fields computed by no model at all — users comparing universe IRRs to their scenario IRR are comparing unrelated data sources. §7.5 adds that unbounded default inputs let the calculator silently produce economically nonsensical outputs, and `dscrProfile`'s 1.2%/yr growth is decorative. Evolution A unifies on the real mechanism.

**How.** (1) Deal Overview rows become stored input sets (capex, capacity, offtake price, debt terms) run through the same `calcIRR` chain — one IRR mechanism, the seeded fields deleted; deals and the interactive scenario become directly comparable because they share a solver. (2) Input plausibility bounds with soft warnings (capex $/gal-capacity ranges per pathway from `saf-lcof-engine`'s cost structures; DSCR sanity floor) so nonsensical outputs are flagged at entry, not silently rendered. (3) `dscrProfile` derived from the actual modelled cash flows (revenue escalation and debt amortisation) instead of the decorative growth constant. (4) Port to `POST /api/v1/saf-pf/model` and consider deferring sizing mechanics to the platform's generic `project-finance-debt-sizer` (CFADS in, sculpted debt out) rather than growing a parallel sizer — this module keeps SAF-specific revenue construction.

**Prerequisites.** Deal-input backfill for the 20 rows (or honest reduction to fewer, fully specified deals); bounds research per pathway. **Acceptance:** every displayed deal IRR reproduces via the solver from its stored inputs; out-of-bounds inputs trigger visible warnings; DSCR profile ties to the modelled cash-flow vector year by year.

### 9.2 Evolution B — Blended-finance structuring copilot (LLM tier 2)

**What.** The module's DFI/blended-finance framing is where structuring conversations happen: "at what concessional-debt share does this AtJ project clear a 1.4× DSCR and 12% equity IRR?", "how much does a 50% §40B haircut move the equity case?", "draft the DFI concept-note economics section with the risk register's top-5 items". The copilot solves these as parameter sweeps over `POST /model` and composes the note from computed outputs plus the register.

**How.** Tier-2 tool schemas over the model endpoint and deal register; threshold-clearing questions are solved by sweep enumeration with the binding constraint named (mirroring the debt-sizer's constraint-contest vocabulary where that engine is used). Risk-register items enter drafts verbatim from stored records with their probability-impact coordinates. Guardrails: the input-bounds warnings propagate into copilot answers ("this capex is below the plausible band for FT-MSW — result flagged"); policy-credit assumptions cite the shared SAF credit service; no market offtake prices asserted beyond the entered scenario.

**Prerequisites (hard).** Evolution A's unified solver and bounds — structuring advice from seeded deal IRRs would be fabricated diligence; sweep tooling. **Acceptance:** threshold answers name the binding constraint and reproduce from enumerated calls; concept-note figures match tool output; bound-violation flags appear in answers whenever inputs breach them.