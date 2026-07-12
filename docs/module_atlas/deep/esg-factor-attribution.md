## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **Brinson-Hood-Beebower + ESG-tilt attribution**
> — `Active_Return = Allocation + Selection + ESG_Tilt + Interaction`, with the ESG-tilt effect
> `Σ_s (w_ps − w_bs)×(ΔESG_s × β_esg)` and a GIPS-compliant attribution waterfall. **None of the BHB
> decomposition exists in code.** The page fabricates a table of 50 "ESG factors", each with `sr()`-
> drawn `return1Y`, `volatility`, `sharpe`, `infoRatio`, `alpha`, `beta`, `correlation`, etc., and
> computes only category averages and a synthetic 24-month cumulative series. There is no portfolio,
> no benchmark, no allocation/selection split, no ESG-tilt effect. §8 specifies the missing model.

### 7.1 What the module computes

Real computation is limited to descriptive aggregates over the synthetic factor table:

```js
avgRet   = mean(return1Y)      avgSharpe = mean(sharpe)      avgIR = mean(infoRatio)
posAlpha = #(alpha > 0)        avgVol    = mean(volatility)  topFactor = argmax(return1Y)
catPerf  = mean(return1Y, volatility, sharpe) grouped by {Environmental, Social, Governance}
```

Per-factor fields (all seeded):

```js
return1Y   = (sr(i*7) − 0.4)*15                 // ≈ −6 … +9 %
volatility = sr(i*13)*12 + 3                     // 3–15 %
sharpe     = return1Y / (volatility || 1)        // ratio of two draws
infoRatio  = (sr(i*17) − 0.3)*2
tStat      = infoRatio × √12                      // display heuristic, NOT a regression t-stat
alpha      = return1Y*0.6 + sr(i*23)*2 − 1
monthly[m] = (sr(i*100+m*7) − 0.45)*4            // 12-month return path
```

Note `sharpe` *is* correctly derived as `return1Y/volatility` (both synthetic), and `tStat` is
`IR×√12` — a plausible-looking but non-statistical construction (a real t-stat needs the number of
independent observations, not a fixed √12).

### 7.2 Parameterisation

| Element | Source |
|---|---|
| 50 factor names + E/S/G category | curated label list (hand-assigned) |
| return1Y / vol / IR / alpha / beta / correlation / turnover / holdings | synthetic `sr(seed)` draws |
| 12-month `monthly` path per factor | `sr()`-jittered |
| 24-month cumulative ESG-vs-benchmark series | `(m+1)*0.4 + sr(m*7)*3` vs `(m+1)*0.3 + sr(m*11)*2` |

The cumulative-series slopes (ESG 0.4/mo > benchmark 0.3/mo) hard-code a mild ESG outperformance — a
presentational choice, not an estimated result.

### 7.3 Calculation walkthrough

1. `FACTORS` (50 rows) fabricated once from `sr(i·k)`.
2. `stats` averages return/Sharpe/IR/vol and counts positive-alpha factors over the filtered set.
3. `catPerf` groups by E/S/G and averages return/vol/Sharpe.
4. `catDist` counts factors per category; `cumData` renders the synthetic ESG-vs-benchmark cumulative
   lines.
5. Side panel shows a single factor's `monthly` path and its (synthetic) statistics.

### 7.4 Worked example — avgRet KPI

`avgRet = mean(return1Y)`, `return1Y_i = (sr(i*7) − 0.4)×15`. With `E[sr] ≈ 0.5`, `E[return1Y] ≈
(0.5 − 0.4)×15 = +1.5%`, so the dashboard's average factor return sits near +1.5% — again an artefact
of the `−0.4` offset, not a measured premium. `posAlpha` ≈ #(alpha>0) where `alpha ≈ 0.6·return1Y +
noise`, so ≈ 55–60% of factors show positive alpha by construction.

### 7.5 Data provenance & limitations

- **All factor statistics synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); factor names are labels only.
- `tStat = IR×√12` is not a valid significance test (no sample size, no residual variance).
- No BHB attribution, no portfolio/benchmark inputs, no allocation/selection/ESG-tilt decomposition —
  the module's entire stated purpose (attribution) is unimplemented.
- Hard-coded ESG-outperformance slope in the cumulative chart pre-ordains the narrative.

**Framework alignment:** the guide cites **Brinson-Hood-Beebower (1986)**, **GIPS 2020** and **CFA
ESG attestation**; the module references these as labels only. A genuine build would require holdings
and benchmark weights to run the three-effect BHB model plus an ESG-tilt extension (§8).

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Decompose a portfolio's active return vs benchmark into allocation, selection,
interaction and an explicit ESG-tilt effect, for GIPS-compliant client attribution reporting.

**8.2 Conceptual approach.** Classic **Brinson-Hood-Beebower** sector attribution extended with an
ESG-tilt term, mirroring **Barra/FactSet attribution** and CFA-Institute ESG-attestation practice.

**8.3 Mathematical specification.** Per sector s, portfolio/benchmark weights `w_p,w_b`, returns
`R_p,R_b`, benchmark total `R_B`:
- Allocation: `A_s = (w_{ps} − w_{bs})·(R_{bs} − R_B)`.
- Selection: `S_s = w_{bs}·(R_{ps} − R_{bs})`.
- Interaction: `I_s = (w_{ps} − w_{bs})·(R_{ps} − R_{bs})`.
- ESG tilt: `T_s = (w_{ps} − w_{bs})·(ΔESG_s · β_{esg})`, `ΔESG_s` = portfolio-minus-benchmark mean
  ESG z-score in s, `β_{esg}` estimated from the ESG factor regression.
- Active return `= Σ_s (A_s + S_s + I_s + T_s)`; residual folded into interaction for reconciliation.

| Parameter | Source |
|---|---|
| Weights `w_p,w_b` | portfolio management system, month-end |
| Sector returns | Bloomberg / FactSet |
| ESG z-scores | MSCI / Sustainalytics, sector-normalised |
| `β_esg` | ESG-factor regression (see esg-factor-alpha §8) |
| Sector map | GICS |

**8.4 Data requirements.** Daily/monthly holdings and benchmark constituents with weights, security
returns, ESG scores. None present; the module holds only synthetic factor rows.

**8.5 Validation & benchmarking plan.** Reconcile Σ effects to total active return (residual ≈ 0);
cross-check against FactSet/Barra attribution on the same portfolio; sensitivity of ESG-tilt to
`β_esg` estimation window.

**8.6 Limitations & model risk.** BHB is single-period (needs geometric linking across periods);
ESG-tilt depends on the separately estimated `β_esg` (compounding model risk); sector definitions
drive allocation vs selection split.
