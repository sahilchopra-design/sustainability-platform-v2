## 7 · Methodology Deep Dive

This is one of the platform's **genuinely-modelled** finance pages: a green-H₂ project-finance model
with a real discounted-cashflow engine (NPV, Newton-Raphson IRR, DSCR, mortgage-style debt annuity),
a Monte-Carlo risk overlay, subsidy stacking (EU H₂ Bank, IRA §45V, IPCEI grants) and a comparables
table. Code and guide (EP-DS2) agree; no mismatch flag needed.

### 7.1 What the module computes

**Cashflow construction** (`buildCashflows`) — construction drawdown then operating EBITDA less debt:

```js
if (y < constructionYears)  cf = −capex / constructionYears
else {
  opYear  = y − constructionYears + 1
  debtSvc = opYear ≤ tenor ? debtAmt·debtRate / (1 − (1+debtRate)^−tenor) : 0   // level annuity
  ebitda  = revenue·(1 − 0.02·max(0, opYear−5)) − opex                          // 2%/yr degradation after Y5
  cf      = ebitda − debtSvc
}
```

**NPV** and **IRR** (real numerics, not closed-form approximations):

```js
npv = Σ_t  cf_t / (1+rate)^(t+1)
irr : Newton-Raphson,  r ← r − f(r)/f'(r),  f(r)=Σ cf_t/(1+r)^t,  200 iters, 1e-8 tol
```

**DSCR** = EBITDA / annual debt service; **annualDebtService** uses the standard capital-recovery
(annuity) factor `debtAmt·i / (1 − (1+i)^−tenor)`.

### 7.2 Parameterisation (model inputs & assumptions)

| Input | Default | Range (slider) | Note |
|---|---|---|---|
| CAPEX | €800M | — | electrolyser + BOP |
| Electrolyser scale | 100 MW | — | |
| Revenue/yr | €120M | | H₂ offtake × price |
| OPEX/yr | €25M | | |
| Debt ratio | 70% | | gearing |
| Debt rate | 5.5% | | |
| Tenor | 18 yr | | debt amortisation |
| Construction | 3 yr | | |
| Lifetime | 25 yr | | |
| WACC | 9% | | NPV discount |
| H₂ Bank subsidy | €1.0/kg | | 10-yr programme |
| Annual output | 15 000 t/yr | | |

Embedded assumptions (from code comments): **2%/yr revenue degradation after Year 5** (electrolyser
stack ageing proxy), **IRA §45V ≈ $2/kg** for 10 years (Tier-1 credit), **IPCEI grant = 30% of capex**.

### 7.3 Calculation walkthrough

Inputs → `buildCashflows` → `cashflows[]`. Project IRR uses `[−capex, ...cashflows.slice(constructYrs)]`
(i.e. upfront capex then operating cashflows); equity IRR uses `[−equityAmt, ...operating cf]`.
`projectNpv = npv(cashflows, wacc)`. `minDscr` = level EBITDA / annuity debt service. The Monte-Carlo
draws 200 scenarios shocking revenue (×0.8–1.2), opex (×0.9–1.2) and capex (×0.9–1.2) via the seeded
PRNG, rebuilds cashflows and records IRR/NPV, filtering to −50%<IRR<100%. Subsidy stacking computes
H₂ Bank total (`€/kg × t/yr × 1000 × 10yr`), §45V total and the capex grant, then `subsidisedCapex`.

### 7.4 Worked example (defaults)

```
debtAmt   = 800 × 0.70 = €560M ; equity = €240M
annuity i = 0.055, N = 18 → factor = 0.055/(1−1.055^−18) = 0.055/0.6216 = 0.08847
debtSvc   = 560 × 0.08847 = €49.5M/yr
ebitda(Y6)= 120·(1−0.02·1) − 25 = 117.6 − 25 = €92.6M   (Y6 = opYear 4 → no degrade yet; Y10 = opYear 8 → 120·0.94)
DSCR(level) = (120−25)/49.5 = 95/49.5 = 1.92×    (well above 1.25 covenant)
```

So at default inputs the project services debt comfortably (DSCR ≈ 1.9×). Reducing revenue to €70M
(bear H₂ price) drops DSCR to (70−25)/49.5 = **0.91×** — a covenant breach, illustrating the module's
core sensitivity (H₂ offtake price is the binding lever, as the guide states).

### 7.5 Companion analytics

- **DSCR profile** over the debt tenor; **cashflow waterfall** (annual + cumulative).
- **Monte-Carlo** IRR/NPV cloud (200 draws) — the only synthetic element.
- **Subsidy stacking** bar (H₂ Bank + §45V + IPCEI) and grant-adjusted capex.
- **Comparables** — 6 real flagship projects (NEOM/Air Products, HIF Matagorda, Ørsted H2RES, AREH,
  NortH2) with published scale/capex/IRR — a useful reality-check band.

### 7.6 Data provenance & limitations

- The **finance engine is real** — NPV/IRR/DSCR/annuity are correctly implemented; this page is not a
  fabrication. Comparables are real announced projects.
- **Revenue and opex are user inputs, not modelled** — there is no LCOH build-up, no electricity-price
  or capacity-factor link (the guide's "electricity cost is the primary IRR lever" is described but the
  revenue figure is entered directly, not derived from a PPA price × volume stack).
- Degradation is a flat 2%/yr revenue haircut after Y5, not a stack-replacement capex event.
- Monte-Carlo shocks are uniform, independent and seeded (`sr`) — deterministic across renders and
  ignoring correlation between capex and revenue shocks.

**Framework alignment:** standard **project-finance** practice — DSCR covenant ≥1.25× (lenders),
level-payment debt amortisation, unlevered vs equity IRR split · **EU Hydrogen Bank** fixed-premium
auction (€/kg) · **US IRA §45V** production tax credit (up to $3/kg by carbon intensity; the model
uses $2/kg Tier-1) · **IPCEI** capex grant regime. BNEF *Hydrogen Economy Outlook* informs the
comparables band. The engine is sound; the missing piece is an endogenous revenue (LCOH/PPA) model —
noted rather than specified in §8 since the DCF core itself is production-grade.
