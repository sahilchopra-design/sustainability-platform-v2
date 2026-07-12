## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **Entity Materiality Score**
> `EMSᵢ = 0.5·FinancialMateriality + 0.5·ImpactMateriality` with a double-materiality matrix, evidence
> trails, and IRO-1 documentation (ESRS 1). **None of that exists in code.** The page implements a
> **four-branch climate-adjusted credit-risk profiler** for a single synthetic entity: PD consensus
> (Exponential + Merton + Tabular + Monte-Carlo), ESG-adjusted WACC, ECL (12-month & lifetime), VaR/CVaR
> and a "DMI" composite. Below documents the code.

### 7.1 What the module computes

`buildEntity(name,i)` derives a per-entity seed `s(k)=sr(hashStr(name) mod 9973 + i·37 + k)` and runs
**four independent PD models**, combined into a consensus:

```js
// A — Exponential real-time (climate velocity)
pdExp    = clamp(pdBase · exp(αT · velocityT), 0.001, 0.85)
// B — Merton distance-to-default (stranded-asset haircut on assets)
adj = assetV·(1 − haircut)
d1  = [ln(adj/debt) + (r + 0.5σ²)·T] / (σ√T) ;  d2 = d1 − σ√T
pdMerton = clamp(Φ(−d2), 0.001, 0.95)
// C — Tabular ESG band multiplier
pdTab = pdBase · {low 1.05, medium 1.30, high 2.00, severe 3.25}[band]
// D — Monte-Carlo (500 deterministic sr()-driven trials)
for k in 0..499:  shock = −3 + sr(seed + 7k)·6
                  simPD = pdBase · exp(αT·velT + βP·velP + 0.05·shock)
                  hits += (simPD > 0.05)
pdMC = hits/500
// Consensus
pdConsensus = clamp(pdExp·0.30 + pdMerton·0.30 + pdTab·0.20 + pdMC·0.20, 0.001, 0.90)
```

Then:
```
WACC_adj = wE·(cE + esgEqPrem) + wD·(cD + esgDebtSpread)·(1 − tax)   ; bpsChange vs baseline
ECL_12m  = PD·LGD·EAD·1.0     ; ECL_life = PD·LGD·EAD·3.2
DMI      = finScore·0.40 + esgScore·0.40 + velScore·0.20            (clamped 10–95)
var95/99/cvar, climateFactor = 1 + αT·max(velocityT,0)
```

### 7.2 Parameterisation / scoring rubric

**Sector coefficients** (adds `betaP` physical elasticity vs the dashboard):

| Sector | αT | βP | baseVol | haircut | LGD |
|---|---|---|---|---|---|
| Energy | 0.18 | 0.14 | 0.35 | 0.25 | 0.55 |
| Materials | 0.14 | 0.11 | 0.28 | 0.18 | 0.48 |
| Financials | 0.09 | 0.12 | 0.24 | 0.10 | 0.50 |
| Technology | 0.07 | 0.06 | 0.32 | 0.05 | 0.35 |
| default | 0.08 | 0.07 | 0.25 | 0.10 | 0.42 |

| Constant | Value | Provenance |
|---|---|---|
| ESG-band PD multipliers | low 1.05 / med 1.30 / high 2.00 / severe 3.25 | `pdTabular` — heuristic |
| Lifetime ECL factor | ×3.2 | `calculateECL` — fixed proxy for lifetime/12m ratio |
| MC trials / threshold | 500 / simPD>0.05 | `pdMonteCarlo` (deterministic via `sr`) |
| Risk-free r | 0.04 | Merton input |
| Consensus weights | 0.30/0.30/0.20/0.20 | hand-set |

Seeded ranges: `pdBase 1–13%`, `velocityT −0.3…+0.3`, `velP −0.2…+0.2`, `assetV $500–5000M`,
`debt 20–80% assets`, scores 20–90, `ead 30–80% assets`.

### 7.3 Calculation walkthrough

Entity picked → `buildEntity` produces the profile above → tiles show pdConsensus, DMI, ECL, WACC,
regime (from z-score bands), IFRS-9 stage. A 12-month `dmiHistory` is `sr()`-seeded around the DMI.
A 9-dimension benchmark radar (`BENCH_DIMS`) and 4 disclosure references round out the view.

### 7.4 Worked example (four-branch consensus)

Energy entity: `pdBase = 0.06`, `αT=0.18`, `velocityT=0.2`, `βP=0.14`, `velP=0.1`, band = high,
`assetV=3000`, `debt=1500`, `haircut=0.25`, `vol=0.35`.

| Branch | Computation | PD |
|---|---|---|
| A Exponential | 0.06·exp(0.18·0.2)=0.06·1.0366 | 0.0622 |
| B Merton | adj=2250, ln(2250/1500)=0.405, d1=(0.405+0.101)/0.35=1.446, d2=1.096, Φ(−1.096) | 0.1365 |
| C Tabular | 0.06·2.00 | 0.1200 |
| D Monte-Carlo | fraction of 500 trials with 0.06·exp(0.036+0.014+0.05·shock)>0.05 ≈ | 0.55 |
| **Consensus** | 0.0622·0.30 + 0.1365·0.30 + 0.12·0.20 + 0.55·0.20 | **0.1696** |

ECL_12m with LGD 0.55, EAD = 3000·0.5 = 1500: `0.1696·0.55·1500 = $139.9M`; lifetime ×3.2 = **$447.7M**.

### 7.5 Data provenance & limitations

- **Single-entity data is synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The **Monte-Carlo branch is not stochastic** — 500 `sr()` draws are deterministic, so `pdMC` is
  reproducible but not a true sampled distribution; it can dominate the consensus (0.55 in the example),
  pulling PD far above the other three branches.
- Merton and the exponential overlay are correctly coded but on random inputs.
- No double-materiality, no evidence trail, no IRO-1 pack — the guide's EMS is unimplemented.

**Framework alignment:** **Merton (1974)/KMV** structural PD; **IFRS 9** ECL (`PD·LGD·EAD`) and 12-month
vs lifetime distinction (§5.5.5); **NGFS/EBA** climate PD-uplift via `exp(αT·velocityT)`; **PCAF**-style
LGD priors. The tabular ESG-band multiplier mimics rating-agency ESG-notching but with invented factors.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Deliver an auditable entity-level climate-adjusted credit profile (PD/LGD/ECL, WACC uplift, VaR) for a
single named obligor, from real financials and NGFS pathways — supporting credit decisions and TCFD/
ISSB financial-effect disclosure.

### 8.2 Conceptual approach
Ensemble PD: **Merton structural** (Moody's KMV/EDF) as the anchor, a **NGFS-calibrated reduced-form
overlay**, and a **rating-migration/ESG-notch** adjustment, combined by inverse-variance weighting rather
than fixed weights. Benchmarks: Moody's climate-adjusted EDF, S&P ESG credit-indicator notching,
Aladdin Climate, EBA 2022 stress-test PD multipliers.

### 8.3 Mathematical specification
```
De-lever equity vol → σ_A (Merton iteration on E = A·Φ(d1) − D·e^{−rT}·Φ(d2))
d2 = [ln(A(1−haircut)/D) + (r − climateDrift − 0.5σ_A²)T]/(σ_A√T)
PD_struct = Φ(−d2)
PD_rf     = PD_base · exp(NGFS_multiplier_s − 1)
PD_ens    = Σ_m (1/σ_m²)·PD_m / Σ_m (1/σ_m²)     (inverse-variance blend)
WACC_adj  = wE·(cE + λ_E·climatePremium) + wD·(cD + λ_D·spread)(1−tax)
ECL_life  = Σ_t PD_t·LGD·EAD_t·DF_t              (term-structure, discounted)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Asset drift/haircut | climateDrift, haircut | NGFS Phase IV transition paths, CRREM stranding |
| NGFS PD multiplier | — | EBA/ECB 2022 climate stress test |
| σ_A | — | de-levered equity vol (market data) |
| LGD | — | PCAF DQ / internal recoveries |
| ESG notch | — | S&P/Moody's ESG credit indicators |

### 8.4 Data requirements
Obligor financials (assets, debt, EAD), equity vol, sector, disclosure texts (for real ESG band vs the
random one), NGFS scenario variables. Platform holds `SECTOR_COEFF`, NGFS labels, `climate_scenarios`
tables, and the disclosure list — real filings would replace synthetic bands.

### 8.5 Validation & benchmarking plan
Reconcile PD_ens vs Moody's EDF and agency PDs on overlap; calibration/backtest against realised
defaults; replace deterministic MC with a real antithetic-variate simulation and check its variance
converges; WACC uplift sanity-checked against green-vs-brown spread evidence.

### 8.6 Limitations & model risk
Merton is weak for financials and thin capital structures; single-name PD is noisy. Fixed consensus
weights over-weight the MC branch. Conservative fallback: if σ_A cannot be inferred, drop the Merton
branch and widen the confidence band rather than emitting a spuriously precise PD.
