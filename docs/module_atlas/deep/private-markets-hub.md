## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **private-markets risk-return
> score** `RR = E(r)_net / σ_returns × ESG_adjustment`, with headline "£12.1Bn AUM", "14.2% net IRR",
> "64% climate coverage". **None of this is computed in the code.** This module is a **static
> presentation dashboard** — every figure is a hand-authored literal mapped straight into recharts.
> There is no returns series, no volatility, no Sharpe/IRR calculation, no ESG adjustment. **The file
> is byte-identical to `private-markets-esg-hub`** (same six ESG-oriented tabs, same constants); the
> only difference between the two routes is the filename. The guide's finance-performance framing
> does not match the ESG-diligence content the page actually renders.

### 7.1 What the module computes

**Nothing is computed.** The page renders six tabs — Strategy Overview, Cross-Strategy Risk, LP
Reporting Suite, ESG DD Workflow, Regulatory Compliance, Value Creation Playbook — from fixed data:

- `STRATEGY_CARDS` (5 strategies with literal AUM strings, coverage, ESG score),
- `RADAR_DATA` (a re-shape of the fixed `STRATEGY_RISKS` 5×6 matrix — the only "derived" object),
- `ESG_BY_STRATEGY`, `STRESS_SCENARIO`, `FRAMEWORK_COMPLETION`, `LP_SATISFACTION`, `DD_STAGES`,
  `RED_FLAGS`, `REGULATIONS`, `REG_TIMELINE`, `VALUE_LEVERS`, `ESG_CHAMPIONS` — all hand-authored.

The guide's IRR (14.2%), risk-return score, and climate-coverage % (64%) **do not appear anywhere in
this file** — they are guide-only figures.

### 7.2 Parameterisation / provenance

| Displayed value | Source | Provenance |
|---|---|---|
| Strategy AUM ($1.0T–$2.1T) | `STRATEGY_CARDS[].aum` (string) | hand-authored demo |
| ESG scores (61–72) | `STRATEGY_CARDS[].esgScore` | hand-authored demo |
| Cross-strategy risk matrix | `STRATEGY_RISKS` (5×6) | hand-authored demo |
| Stress impacts (−1.8…+2.3) | `STRESS_SCENARIO` | hand-authored demo |
| DD workflow (8 stages) | `DD_STAGES` | hand-authored (ILPA/IFC-PS structure) |
| Regulatory register | `REGULATIONS` (6 regimes) | hand-authored (accurate regime names) |

### 7.3 Calculation walkthrough

Constant → chart. No user inputs; only tab switching. `RADAR_DATA` is assembled once from the fixed
risk matrix; every other chart consumes a literal array directly.

### 7.4 Worked example

No numeric pipeline exists. The guide's `RR = E(r)/σ × ESG_adj` cannot be traced because the page
carries neither a return, a volatility, nor an ESG-adjustment factor.

### 7.5 Data provenance & limitations

- **All values are hand-authored demo literals** — no `sr()` seeding, no aggregation, no real data.
- The risk-return score, net IRR, and climate-coverage pipeline in the guide are entirely absent.
- Identical file to `private-markets-esg-hub`; both routes serve the same static ESG dashboard.

**Framework alignment:** Content references **ILPA** (the 8-stage DD-to-monitoring lifecycle),
**GRESB** (RE/Infra benchmark scores as strings), **IFC Performance Standards** (red-flag examples),
**TCFD** (climate-coverage framing), and **SFDR/AIFMD/ELTIF/SEC/UK SDR/CSRD** (regulatory register).
No framework scoring or the guide's risk-return math is implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce an ESG-adjusted, risk-adjusted return metric per private-markets
strategy and a portfolio roll-up, supporting cross-strategy capital allocation and LP performance
reporting. Coverage: PE, Private Credit, Infrastructure, Real Assets, VC.

**8.2 Conceptual approach.** A **private-markets Sharpe analogue with an ESG multiplier**. Because
private funds report smoothed, appraisal-based NAVs, use a **desmoothed** return series (Geltner
unsmoothing) before computing volatility, mirroring (i) Preqin/Burgiss PME-and-risk analytics and
(ii) the modified-IRR / KS-PME literature for illiquid returns. The ESG adjustment is a bounded
multiplier from the AUM-weighted ESG composite (see `private-markets-esg-hub` §8).

**8.3 Mathematical specification.**
Desmoothed return: `r_t^u = (r_t − ρ·r_{t−1}) / (1 − ρ)`, ρ = first-order NAV autocorrelation.
Risk-return: `RR_s = (Ê[r^u]_s − r_f) / σ(r^u)_s`.
ESG-adjusted: `RR_s^{ESG} = RR_s × (1 + λ·(ESG_s − 50)/50)`, λ a small elasticity (e.g. 0.10).
Portfolio: `RR_pm = Σ_s AUM_s·RR_s^{ESG} / Σ_s AUM_s`.
IRR is computed separately from dated cash flows: solve `Σ CF_k/(1+IRR)^{t_k} = 0`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Risk-free | `r_f` | sovereign curve (matched currency/tenor) |
| NAV autocorrelation | ρ | estimated from fund NAV series (Geltner) |
| ESG elasticity | λ | empirical ESG-return studies; keep ≤0.15 |
| ESG score | `ESG_s` | AUM-weighted composite (esg-hub §8) |

**8.4 Data requirements.** Per fund: quarterly NAV series, dated cash flows (calls/distributions),
committed AUM, ESG score. Sources: fund accounting, GP capital-account statements. Platform holds
only static constants today.

**8.5 Validation & benchmarking.** Reconcile IRR against GP-reported net IRR; compare desmoothed
volatility to Preqin/Burgiss strategy benchmarks; test ESG-multiplier sensitivity (λ sweep); PME vs
public-market benchmark for return quality.

**8.6 Limitations & model risk.** Appraisal smoothing understates true volatility (addressed by
desmoothing, itself model-dependent on ρ); IRR is cash-flow-timing sensitive; the ESG multiplier is a
judgemental overlay, not a causal return driver. Conservative fallback: report raw and desmoothed RR
side-by-side and disclose ρ; suppress the ESG multiplier where composite coverage <70% AUM.
