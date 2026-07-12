## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-CK6) states the engine computes
> `P(breach│scenario) = P(financial_ratio < threshold │ climate_shock)` — i.e. a distributional
> probability that a stressed ratio crosses its covenant. **The code computes no such probability.** Each
> borrower's four scenario breach probabilities are **directly `sr()`-seeded constants**
> (`breachProb_cp = round(5 + sr·30)`, `_dt`, `_b2c`, `_nz`), unrelated to its own leverage/ICR/DSCR
> ratios (which are themselves seeded). The covenant thresholds are fixed defaults, and the ratios are
> never compared to them to derive a breach probability. So the page *displays* covenant analytics but the
> breach probabilities are fabricated, not modelled. §8 specifies the scenario-conditional breach model.

### 7.1 What the module computes

The only real arithmetic is aggregation over the seeded breach probabilities and a linear early-warning
drift series:

```js
sk        = SCENARIO_KEYS[scenario]                     // cp | dt | b2c | nz
highRisk  = |BORROWERS where breachProb_${sk} > 50|
avgBreach = round( mean(breachProb_${sk}) )
earlyWarnings[i] = { leverageDrift: 0.1 + i·0.08 + sr(i·41)·0.3,   // rising
                     icrDrift:     −0.05 − i·0.06 + sr(i·43)·0.2,  // falling
                     breachProb:   min(95, round(15 + i·3 + sr(i·47)·8)) }  // rising
```

The early-warning `breachProb` trend is a deterministic ramp (`15 + 3·month`) plus noise — it always
climbs, regardless of any borrower's actual ratios.

### 7.2 Parameterisation / scoring rubric

| Field | Formula | Provenance |
|---|---|---|
| `leverage` | `2.5 + sr(i·11)·4` → 2.5–6.5× | Synthetic seeded PRNG |
| `icr` | `1.2 + sr(i·13)·5` | Synthetic seeded PRNG |
| `dscr` | `0.8 + sr(i·17)·1.5` | Synthetic seeded PRNG |
| `breachProb_cp` | `round(5 + sr(i·19)·30)` → 5–35% | Synthetic (not from ratios) |
| `breachProb_dt` | `round(10 + sr·40)` → 10–50% | Synthetic |
| `breachProb_b2c` | `round(20 + sr·50)` → 20–70% | Synthetic |
| `breachProb_nz` | `round(30 + sr·60)` → 30–90% | Synthetic |
| Covenant thresholds | leverage 4.5×, ICR 2.0×, DSCR 1.2× | Fixed defaults |
| `earlyWarning` | `i<5 Red · i<10 Amber · else Green` | Positional, not risk-based |

The **scenario ordering is baked into the seed bases**: breach probability rises Current Policies →
Delayed Transition → Below 2 °C → Net Zero — encoding that *transition* scenarios stress these fossil-heavy
borrowers (CoalCo, PetroGlobal, OilSands…) more than hot-house ones. That directional intuition is sound;
the magnitudes are random.

### 7.3 Calculation walkthrough

1. `BORROWERS` (15 fossil-exposed names) seeded once with ratios + four scenario breach probs.
2. `sk` selects the active scenario's field; KPIs count/average over it.
3. Charts: breach-probability bar (sorted), scenario-comparison (all 4 per borrower), early-warning drift
   line, covenant-headroom table (ratio vs threshold), remediation options, lender-action framework.
4. Remediation (6 options with effectiveness %) and lender actions (5 trigger→action rules) are fixed lists.

### 7.4 Worked example

Borrower `i = 0` (CoalCo Holdings): `leverage = 2.5 + sr(0)·4`. `sr(0)=frac(sin(1)·10⁴)≈0.71`, so
`leverage = 2.5 + 2.84 = 5.34×` — *above* the 4.5× covenant, so the headroom table flags it. But its
`breachProb_nz = round(30 + sr(0·31)·60)` uses an *independent* seed — it is not derived from the 5.34×
breach of the leverage covenant. Under Net Zero, `earlyWarning = 'Red'` because `i<5`, not because its
ratios breached. So a borrower can show a covenant breach in the table yet an unrelated seeded breach
probability — the two are disconnected.

### 7.5 Companion analytics on the page

Six tabs: breach-probability dashboard, financial-covenants-at-risk (ratio vs threshold headroom),
scenario-conditional breach comparison, early-warning signals (drift + lead-time), remediation options
(effectiveness ranked), and lender-action framework (escalation triggers). Scenario selector drives which
seeded breach field is shown. No backend engine or route — client-side.

### 7.6 Data provenance & limitations

- **All ratios and breach probabilities are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. The
  breach probabilities are **independent of the ratios and thresholds** — the module does not compute
  `P(ratio < covenant)`.
- The early-warning trend is a deterministic upward ramp, not a borrower-specific projection.
- `earlyWarning` RAG is positional (`i<5`), not risk-derived. Remediation/lender-action lists are static.

**Framework alignment (named, not implemented):** *IFRS 9* frames the credit-deterioration/SICR context
(a rising breach probability is a significant-increase-in-credit-risk signal). *Basel IV IRB* underpins the
intended PD-style estimation. The three covenant types (leverage, interest-coverage, debt-service-coverage)
are standard leveraged-loan maintenance covenants. The scenario set (Current Policies, Delayed Transition,
Below 2 °C, Net Zero) is *NGFS-consistent*. All are correctly named; the conditional-probability engine
that would connect them is absent.

---

## 8 · Model Specification — Scenario-Conditional Covenant Breach Probability

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Estimate, per borrower and per NGFS scenario, the probability that a maintenance covenant (leverage, ICR,
DSCR) is breached over 6–12 months, with lead-time early warning. Coverage: leveraged corporate loans with
climate-sensitive cash flows (fossil, hard-to-abate).

### 8.2 Conceptual approach
Model each financial ratio as a stochastic process whose drift is shifted by scenario-specific EBITDA/cost
shocks (carbon price, demand, capex), then compute the first-passage probability that the ratio crosses its
covenant. This mirrors **NGFS bank stress-testing** (scenario → cash-flow → ratio) and **Moody's/S&P
covenant-headroom analytics**, and is the guide's own `P(ratio < threshold │ shock)` specification.

### 8.3 Mathematical specification
```
EBITDA_s(t) = EBITDA_0 · (1 + g − CarbonCostShock_s(t) − DemandShock_s(t))
Leverage_s(t) = Debt_s(t) / EBITDA_s(t) ;  ICR_s(t) = EBITDA_s(t)/Interest ;  DSCR_s(t)=CFADS_s(t)/DebtService
Ratio modelled as:  R_s(t) = R̂_s(t) · exp(σ_R · W_t − ½σ_R² t)     (log-normal around scenario path)
P(breach_s over H) = P( min_{t≤H} R_s(t) < Covenant )  ≈ Φ( (ln(Cov/R̂_s(H)) + ½σ_R²H)/(σ_R√H) )   (first-passage)
LeadTime = first t where P(breach up to t) > alert_threshold
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon-cost shock | `CarbonCostShock_s` | NGFS Phase IV carbon-price × emissions intensity |
| Demand shock | `DemandShock_s` | IEA WEO/NZE sector demand paths |
| Ratio volatility | `σ_R` | Historical ratio dispersion by sector/rating |
| Covenant levels | | Loan documentation |

### 8.4 Data requirements
Per borrower: current EBITDA, debt, interest, debt service, CFADS, emissions intensity, covenant levels;
per scenario: NGFS carbon-price and IEA demand paths (both available via the platform's climate-scenario
tables / `climate-credit-integration`). Ratio volatilities from historical financials.

### 8.5 Validation & benchmarking plan
Backtest predicted breaches against realised covenant breaches/waivers in a loan panel; check scenario
ordering (transition-heavy scenarios worse for fossil borrowers) matches NGFS bank stress-test results.
Sensitivity on `σ_R` and shock magnitudes; reconcile against Moody's/S&P headroom analyses.

### 8.6 Limitations & model risk
First-passage approximations assume log-normality and constant volatility — ratios are lumpy (refinancing,
disposals). Scenario shocks are deeply uncertain; report a probability band per scenario. Covenant cure
rights and equity cures reduce realised breach — model them explicitly. Conservative fallback: report
deterministic scenario-path ratio vs covenant (headroom) alongside the probabilistic estimate.
