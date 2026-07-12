## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/project_finance_engine.py` (`ProjectFinanceEngine`, Decimal arithmetic at
20-digit precision) builds a full annual cash-flow model for a renewable-energy project and
derives the standard lender ratios, in both a P50 base case and a P90 stress case:

```
DSCR_t = NOI_t / DebtService_t                      (target ≥ 1.25×, BANKABILITY_DSCR_THRESHOLD)
LLCR   = NPV(NOI over loan life) / Debt             (target 1.30×, LLCR_TARGET)
PLCR   = NPV(NOI over project life) / Debt
IRR    = Newton-Raphson root of [−Equity, eqCF_1 … eqCF_n]   (returned in %)
DSRA   = 6 months if min DSCR < 1.30; 3 months if < 1.40; else 0
```

NPV discounts from `t = 1` at the input discount rate (default 8%). `is_bankable` is simply
`min_dscr ≥ 1.25` on the P50 run; `stress_is_bankable` repeats the test on the P90 run.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `BANKABILITY_DSCR_THRESHOLD` | 1.25× | in-code comment "target >= 1.25x" — market convention for contracted renewables |
| `LLCR_TARGET` | 1.30× | in-code comment "target >= 1.30x" |
| `TAX_RATE` (default) | 25% | "default corporate tax rate" |
| `NGFS_CARBON_PRICE_ESCALATION` | 5% p.a. | in-code comment "5% pa for NZE scenario" — applied to carbon-credit price only |
| `DEFAULT_DISCOUNT_RATE` | 8% | engine default (overridable per request) |
| `DSRA_THRESHOLDS` | (<1.30 → 6 mo), (<1.40 → 3 mo) | synthetic rubric encoding "thinner coverage ⇒ larger reserve" |
| Project life default | `loan_tenor + 5` years | code default when `project_life_years` omitted |
| OPEX escalation default | 2.0% p.a. | dataclass default |

Cash-flow mechanics per year `t` (`_build_cashflows`):

```
gen        = capacity_mw × 1000 × CF × 8760 × (1 − curtailment)       # constant; "no degradation for simplicity"
ppa_price_t = ppa_price × (1+esc)^(t−1)   within PPA tenor; frozen at last-escalated price after
etc_rev_t  = annual_etc_tonnes × etc_price × 1.05^(t−1)               # if include_etc_revenue
EBITDA     = ppa_revenue + etc_rev − opex×(1+opex_esc)^(t−1)
tax        = max(0, (EBITDA − straight-line depreciation) × tax_rate) # no loss carry-forward
NOI        = EBITDA − tax                                             # depreciation added back (non-cash)
DS         = interest-only during grace months, else level annuity over (tenor − grace) years
eqCF       = NOI − DS
```

### 7.3 Calculation walkthrough

`POST /calculate` maps the request 1:1 onto `ProjectFinanceInputs`. Debt = capex ×
debt_equity_ratio; equity is the remainder. The annuity payment `P·r/(1−(1+r)^−n)` is sized over
the post-grace amortisation period. The engine then runs `_build_cashflows` twice — once at
`capacity_factor_p50`, once at `capacity_factor_p90` — and reduces each to min/avg DSCR, IRR and
bankability. When carbon revenue is enabled, a third run with `include_etc_revenue=False`
produces `etc_irr_delta_pct` and `etc_dscr_delta` (the IRR and min-DSCR uplift attributable to
carbon credits). `POST /save` is a stub (returns a UUID; "DB table pending migration 021") and
`GET /{power_plant_id}` always 404s. `GET /demo/sample` runs a hard-coded 70 MW solar case
(capex $120M, 70% debt, 15y @ 7.5%, 12-mo grace, PPA $55/MWh × 20y esc 2%, CF 0.27/0.22,
curtailment 3%, opex $2.1M, ETC $18/t × 85,000 t).

### 7.4 Worked example (traced through the code's actual formulas)

Inputs: capex $100M, D/E 0.70, tenor 10y @ 8%, no grace, 10 MW, CF₅₀ 0.30, curtailment 0%,
PPA $50/MWh (0% escalation, 15y), opex $1.5M (0% esc.), tax 25%, project life default 15y.

| Step | Computation | Result |
|---|---|---|
| Debt / equity | 100M × 0.70 | $70M / $30M |
| Annual debt service | 70M × 0.08 / (1 − 1.08⁻¹⁰) | **$10.432M** |
| Generation (as coded) | 10 × 1000 × 0.30 × 8760 | **26,280,000 "MWh"** |
| PPA revenue yr 1 | 26,280,000 × 50 | $1,314.0M |
| EBITDA | 1,314.0 − 1.5 | $1,312.5M |
| Depreciation | 100M / 15 | $6.667M |
| Tax | (1,312.5 − 6.667) × 0.25 | $326.458M |
| NOI | 1,312.5 − 326.458 | $986.042M |
| DSCR yr 1 | 986.042 / 10.432 | **94.52×** |

⚠️ **Unit inconsistency (observed in code, line `capacity_mw * 1000 * capacity_factor * 8760`):**
MW × 8760 h already yields MWh; the extra ×1000 produces kWh but the variable is named
`generation_mwh` and priced at $/MWh, so revenue — and every downstream ratio — is inflated
**1000×**. The physically correct figure here is 26,280 MWh → revenue $1.314M, which against
$1.5M opex would make the project cash-negative. Documented as found; not corrected.

### 7.5 Companion outputs

The response carries the full `year_by_year` table (generation, PPA/ETC revenue, EBITDA,
depreciation, EBIT, tax, NOI, debt service, DSCR, equity cash flow, outstanding debt) for both
cases, so front-end charts can plot the DSCR profile and debt amortisation directly. Outstanding
debt is tracked by splitting each annuity into interest (`outstanding × r`) and principal.

### 7.6 Data provenance & limitations

- **No seeded PRNG** — deterministic on inputs; the only fixture is the `/demo/sample` 70 MW
  solar parameter set (synthetic demo values).
- The ×1000 generation unit error above is the dominant caveat.
- No energy-yield degradation, no loss carry-forward, no working-capital or DSRA cash sweep in
  the flows (DSRA is a sizing recommendation only), no P90 price stress (P90 only lowers the
  capacity factor), and merchant-tail pricing simply freezes the last escalated PPA price.
- IRR uses Newton-Raphson with a 10% seed and 200 iterations; no bisection fallback, so
  pathological cash-flow sign patterns could fail to converge.
- Persistence endpoints are stubs — nothing is written to or read from the database.

### 7.7 Framework alignment

- **Project-finance lender practice** — DSCR/LLCR/PLCR/DSRA are the standard coverage metrics in
  rating-agency and lender term sheets; the 1.25×/1.30× hurdles match typical contracted-
  renewables covenants. LLCR is correctly computed as PV of cash available for debt service over
  the loan life divided by outstanding debt.
- **IFRS 9 ECL compatibility** — claimed in the module docstring; in practice the engine outputs
  the DSCR/coverage inputs a lender's ECL staging would consume, but no PD/LGD/ECL is computed
  here.
- **NGFS Net Zero 2050** — the 5% p.a. carbon-price escalation constant is labelled as the NZE
  assumption; NGFS scenarios express carbon prices as full trajectories, so a single flat
  escalator is a first-order approximation.
- **P50/P90 convention** — mirrors independent-engineer energy-yield exceedance cases used in
  renewable financing (P90 = yield exceeded with 90% probability).
