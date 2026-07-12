## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **ESG Financial Risk Score**
> `EFRS = Σᵢ Materialityᵢ · Magnitudeᵢ · Likelihoodᵢ` mapping material topics to EBITDA-at-risk with a
> topic waterfall. **No EFRS, no topic-magnitude/likelihood library exists in code.** The page is a
> **bank-treasury risk console**: historical-simulation VaR/CVaR, Basel III LCR/NSFR, IFRS 9 ECL and
> staging, a climate-adjusted WACC, interest-rate risk (duration/DV01), operational risk (BIA), and
> NGFS scenario stress — over 40 synthetic entities. The maths below is genuine; the *inputs* are seeded.

### 7.1 What the module computes

Per entity (`ENTITIES`, 40 rows), from seed `sr(i·k)`:

**Market risk — historical simulation (252-day window):**
```js
returns = [252]: (sr(i·1000+d) − 0.5)·0.04           // ±2% daily band
sorted  = returns ascending
var95   = |sorted[⌊252·0.05⌋]| = |sorted[12]|         // 5th-percentile loss
var99   = |sorted[⌊252·0.01⌋]| = |sorted[2]|
var10d  = var95·√10                                   // √-time scaling to 10 days
cvar95  = |mean(sorted[0..12])|                       // expected shortfall (tail mean)
```
**Liquidity — Basel III:**
```
LCR  = HQLA / net30d-outflows · 100   (999 if outflows=0)
NSFR = ASF / RSF · 100                (999 if RSF=0)
```
**Credit — IFRS 9 ECL & WACC:**
```
ECL_12m  = PD·LGD·EAD·DF ;  ECL_life = ECL_12m·(3 + sr·5)     // lifetime multiplier 3–8×
WACC     = Ke·eRatio + Kd·(1−tax)·dRatio ,  Ke = Rf + β·ERP + climatePremium,
                                            Kd = creditSpread + strandedHaircut
waccBps  = (WACC − WACC_base)·10⁴    // climate premium in bps
```
**Interest-rate & operational risk:**
```
Macaulay duration = Σ t·PV(cf_t) / Σ PV(cf_t) ;  DV01 = duration·price/10⁴
OpRisk capital (BIA) = grossIncome·0.15                       // Basel Basic Indicator Approach
```
**Portfolio roll-up** uses **normalised weights** `wNorm = weight/Σweight`, then
`portVaR95 = Σ var95ᵢ·wNorm` (linear aggregation — no correlation), similarly CVaR and WACC.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance (standard) |
|---|---|---|
| VaR window | 252 trading days | historical-simulation convention |
| VaR percentiles | 95% / 99% | Basel market-risk / regulatory VaR |
| 10-day scaling | ×√10 | Basel √-time rule |
| OpRisk factor | 15% of gross income | Basel II **Basic Indicator Approach** (α=15%) |
| LCR/NSFR floor | 100% | Basel III LCR/NSFR minimum |
| Lifetime ECL mult. | 3–8× (`3 + sr·5`) | synthetic proxy for lifetime/12m |
| Seeded ranges | weight 1.5–5%, β 0.6–1.8, climPrem 0.5–3%, creditSp 1–5%, LGD 25–70%, EAD 10–500 | `sr()`-seeded demo values |

### 7.3 Calculation walkthrough

Filter/select entity → tiles show VaR95/99, CVaR, LCR, NSFR, ECL, WACC (with bps climate uplift),
duration/DV01, opRisk. `RISK_LIMITS` (16 rows current vs limit) drives a limit-utilisation dashboard.
NGFS scenario tab applies scenario shocks; a concentration tab uses Herfindahl on weights. Portfolio tab
aggregates via `wNorm`.

### 7.4 Worked example (VaR & WACC)

Entity i=0: returns are `(sr(d)−0.5)·0.04` for d=0..251. After sorting, suppose `sorted[12] = −0.0185`
and `sorted[2] = −0.0262`. Then `var95 = 1.85%`, `var99 = 2.62%`, `var10d = 1.85%·√10 = 5.85%`.
CVaR95 = mean of the 13 worst returns, say −0.0208 → **2.08%**.

WACC: `Rf=0` in code's `waccBase`, `β=1.1`, `ERP` implicit, `climPrem=0.015`, `creditSp=0.03`,
`strandHc=0.008`, `eRatio=0.6`, `tax=0.25`. Ke = Rf+β·ERP+climPrem; Kd = creditSp+strandHc = 0.038.
`WACC = Ke·0.6 + 0.038·0.75·0.4`. The **climate wedge** `waccBps = (WACC − WACC_base)·10⁴` isolates the
`climatePremium + strandedHaircut` contribution in basis points.

### 7.5 Data provenance & limitations

- **All 40 entities synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`. Even the 252-day return
  series is `sr()`-generated (symmetric ±2% uniform band), so VaR reflects that band, not real markets.
- Portfolio VaR is a **weighted sum** of single-name VaRs — it ignores diversification/correlation and
  therefore overstates portfolio VaR (no sub-additivity benefit captured).
- Lifetime-ECL multiplier (3–8×) is a placeholder, not a discounted term-structure.
- LCR/NSFR/BIA/DV01 formulas are correct Basel/IRRBB definitions; only the inputs are fabricated.

**Framework alignment:** **Basel III** LCR (§ liquidity coverage), NSFR (net stable funding), market-risk
VaR + √-time scaling; **Basel II Basic Indicator Approach** for operational risk (15% of gross income);
**IFRS 9** ECL = PD·LGD·EAD and 12-month/lifetime staging; **IRRBB** duration/DV01; **NGFS** scenario
labels for transition stress. WACC uses the standard CAPM cost of equity (Rf + β·ERP) plus an ESG
premium and a stranded-asset debt spread.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A climate-integrated treasury/credit risk engine producing regulatory-grade VaR/CVaR, LCR/NSFR, ECL and
WACC for the covered book, with NGFS/EBA scenario overlays — supporting ICAAP/ILAAP and TCFD financial
effects.

### 8.2 Conceptual approach
Replace uniform-band pseudo-returns with **filtered historical simulation** (empirical returns with
EWMA vol scaling) and add a **variance-covariance / copula** portfolio aggregation so diversification is
captured. Benchmarks: RiskMetrics (EWMA VaR), Basel FRTB (ES at 97.5%), IFRS 9 ECL practice, EBA
2022 climate stress test.

### 8.3 Mathematical specification
```
r_t observed; scaled r̃_t = r_t · σ_today/σ_t   (EWMA σ, λ=0.94)
VaR_α = −quantile_α(r̃) ; ES_97.5 = −mean(r̃ | r̃ ≤ VaR_97.5)
Portfolio: L = wᵀr ; VaR_p = −quantile_α(historical wᵀR)      (full-revaluation)
ECL_life = Σ_t (Π_{s<t}(1−PD_s))·PD_t·LGD·EAD_t·DF_t          (marginal-PD term structure)
WACC = wE(Rf+βERP+climatePrem) + wD(cD+greenSpread)(1−tax)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| EWMA decay | λ=0.94 | RiskMetrics standard |
| ES level | 97.5% | Basel FRTB |
| PD term structure | PD_t | rating-migration matrices (S&P/Moody's) |
| LGD | — | PCAF / recovery data |
| Climate premium | — | green-vs-brown bond spread evidence |

### 8.4 Data requirements
Real historical returns per position, HQLA/outflow classification (Basel LCR schedule), ASF/RSF factors,
obligor PD/LGD/EAD, cash-flow schedules for duration. Free: ECB/BIS liquidity templates; vendor:
RiskMetrics, Bloomberg. Platform holds NGFS labels and reference-data spreads.

### 8.5 Validation & benchmarking plan
VaR backtest (Kupiec POF, Christoffersen independence) at 95/99%; ES backtest (Acerbi-Székely);
reconcile ECL against audited provisions; LCR/NSFR tie-out to the regulatory templates; portfolio VaR
sub-additivity check vs the sum of standalone VaRs.

### 8.6 Limitations & model risk
Historical simulation is backward-looking and misses regime shifts; EWMA underestimates tail clustering.
Linear portfolio VaR (current code) violates sub-additivity — the spec's full-revaluation fixes this.
Conservative fallback: where correlation is unknown, use the (conservative) undiversified sum and flag it.
