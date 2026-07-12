## 7 · Methodology Deep Dive

### 7.1 What the module computes

A full offshore wind project-finance model: CfD revenue mechanics, a self-implemented
Newton-Raphson IRR solver, a 25-year DSCR schedule, LCOE, and Monte Carlo IRR distribution — this
closely matches the guide's stated methodology.

```
IRR (Newton-Raphson): r_{n+1} = r_n − NPV(r_n) / NPV'(r_n)
NPV(r)   = Σ CF_t / (1+r)^t
NPV'(r)  = −Σ t·CF_t / (1+r)^(t+1)
DSCR_t   = CFADS_t / AnnualDebtService_t
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Blade/turbine degradation | 0.5%/yr (`Math.pow(1-0.005, y-1)`) | Standard offshore wind industry assumption, consistent with guide narrative |
| Reference/strike price escalation | user input, applied as `referencePrice × (1+escalation/100)^(y-1)` | Configurable, not hard-coded |
| OPEX escalation | 2%/yr | Synthetic demo value, plausible inflation-linked O&M escalator |
| Tax treatment | `cfads = ebitda − interest − max(0, ebitda−interest)×taxRate/100` | Correct: tax applied only to positive taxable income, guarded against negative EBIT |
| DSCR floor sentinel | 999 when `annDS ≤ 0` (no debt service due) | Prevents divide-by-zero, standard guard pattern |
| Country table (`COUNTRIES`, 7 rows) | CfD strike, reference price, PTC base, currency, tax rate | Modelled on real UK/EU/US regimes per guide (AR5 ~£82/MWh, US IRA PTC $27.50/MWh base) |

### 7.3 Calculation walkthrough

1. **Cash-flow build**: for each year, `spot = referencePrice×(1+escalation/100)^(y-1)`,
   `aep = annualAEP × 0.995^(y-1)` (degradation-adjusted energy), `opex` escalates at 2%/yr,
   `ebitda = revenue − opex`, `interest = debtBal×intRate/100`, `cfads` nets tax, `fcf = cfads −
   princPay`.
2. **DSCR**: computed per year as `cfads/annDS`; `minDSCR` is the minimum across the operating years
   (`slice(1)` excludes year 0 construction), used against the lender covenant bands the guide
   documents (1.20× minimum, 1.10× cash-trap).
3. **Equity vs project IRR**: `equityIRR` runs Newton-Raphson on the post-debt `fcf` series;
   `projectIRR` runs it on the pre-debt series (`year 0 = −totalCapex`, then `cfads`) — the
   standard unlevered-vs-levered IRR distinction.
4. **LCOE**: `(totalCapex + NPV(OPEX)) / NPV(AEP)` where both OPEX and AEP are discounted at the
   project interest rate — the textbook LCOE definition, with AEP discounted using the same
   degradation curve as the cash-flow build (`(1-0.005)^i`).
5. **Monte Carlo**: `pertCapex/pertRef` perturb CAPEX (±7.5%) and reference price (±6%) using
   `sr(seed)`-based uniform draws per simulation bucket, then re-run the full IRR solver per draw to
   build an IRR histogram; `irrP10`/`irrP90` are read off the sorted, bucket-expanded distribution.
5. **Construction drawdown**: an S-curve `3×(mo/totalMo)² − 2×(mo/totalMo)³` (the standard smoothstep
   function) allocates monthly capital calls, used for the IDC (interest-during-construction) build.

### 7.4 Worked example

500 MW, capacity factor 48%, CfD strike £82/MWh, CAPEX £2,800/kW, 15-year CfD term, 70% debt at 5.5%:

| Step | Computation | Result |
|---|---|---|
| Total CAPEX | 500,000 kW × £2,800 | £1.40bn |
| Annual AEP (yr 1) | 500,000 kW × 0.48 × 8760 | 2,102,400 MWh |
| Year-1 revenue (at strike) | 2,102,400 × £82 | £172.4M |
| Debt amount | 70% × £1.40bn | £980M |
| Annual debt service | 980M × 0.055 / (1−1.055⁻¹⁵) | ≈ £97.4M |
| Year-1 CFADS (illustrative, after OPEX/tax) | revenue − OPEX − tax | ≈ £115M |
| DSCR (yr 1) | 115M / 97.4M | **≈ 1.18×** — below the 1.20× covenant floor the guide describes, flagging a lender-case sizing issue at these illustrative inputs |

### 7.5 Data provenance & limitations

- **Country CfD/PTC terms are seed constants** modelled on real regimes (UK AR4/AR5, US IRA) but
  not live-updated from DESNZ or IRS publications.
- **Comparable transactions** (Dogger Bank, Vineyard Wind, Hornsea 3, etc.) are named real projects
  with **seeded illustrative financial metrics**, not sourced from actual financial-close disclosures.
- Newton-Raphson has no explicit iteration cap/convergence-failure fallback visible in the extracted
  formulas beyond the guide's stated "200 iterations, 1e-8 tolerance" — if the true IRR doesn't
  converge (e.g. non-standard cash-flow sign changes), the solver's behaviour is not guarded in the
  visible code.
- Monte Carlo CAPEX/CF/rate perturbations use the platform's deterministic `sr()` PRNG, not a proper
  Box-Muller/Gaussian sampler despite the guide's dataLineage claiming "Box-Muller" — this is a
  guide/code terminology mismatch worth flagging (the perturbation is a bounded uniform-ish draw via
  `sr()`, not a Gaussian).

**Framework alignment:** the CfD settlement mechanic (`revenue = min(strike,...) `-style top-up)
mirrors the UK CfD Allocation Round design; DSCR/CFADS terminology and covenant bands match S&P RE
Project Finance rating criteria; EU Taxonomy/SFDR alignment fields exist as a separate tab but are
outside the formulas extracted here.
