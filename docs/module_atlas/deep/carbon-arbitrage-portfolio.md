## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (substantial).** The guide describes a *long-short equity carbon-factor
> portfolio* — "carbon_alpha = Σ(wᵢ·rᵢ) where wᵢ = +1 if carbon_beta < median", carbon-beta estimated
> "by regressing historical returns on ETS price changes over rolling 3-year windows", MSCI Climate VaR
> signals, WACI net exposure, dollar-neutral construction. **The code implements none of this.** The
> page header actually reads *"EP-EA6 · Cross-Market Carbon Arbitrage & Net-Zero Portfolio Builder"* and
> the logic is **spot-price arbitrage across carbon compliance/voluntary regimes** (EU ETS, India CCTS,
> Japan JCM/GX-ETS, Verra VCS, Gold Standard), Article-6 ITMO conversion, CORSIA eligibility, and a
> parametric VaR on a *regime-weighted* carbon-price portfolio. There is no carbon beta, no return
> regression, no equity. The guide entry describes a different module; the sections below document the
> arbitrage tool as coded.

### 7.1 What the module computes

Two core calculators plus reference tables across 11 tabs:

**Arbitrage revenue** (`calcArbitrageRevenue`):
```js
spread   = dstPrice − srcPrice          // price gap between two carbon regimes
netQty   = qty × (1 − artSixDeductPct/100)   // Article-6 "share of proceeds" haircut
revenue  = spread × netQty
```

**Portfolio VaR** (`calcPortfolioVaR`) — parametric (variance-covariance) VaR on a weighted basket of
regime spot prices:
```js
portfolioPrice = Σ_k  regime_k.price2025 × w_k/100
vol            = 0.25                      // hard-coded annual volatility
z              = {95→1.645, 99→2.326, else→1.282}
varPct         = portfolioPrice × vol × z
varPct1yr      = varPct × √252
```

Note the units are inconsistent in the code: `varPct` is a single-period figure that is then scaled by
`√252` to "1yr" — but `vol=0.25` already reads as an annual number, so the `√252` scaling is a
methodological error (it converts a daily VaR to annual, yet the vol is not daily).

### 7.2 Parameterisation

**Carbon regimes** (`REGIMES`, 6 markets — provenance: published/announced 2024–25 carbon prices and
volumes, directionally real):

| Regime | 2025 | 2030 | 2035 | Unit | Liquidity | 2024 vol (MtCO₂) |
|---|---|---|---|---|---|---|
| EU ETS (EUA) | 70 | 95 | 130 | €/t | Very High | 8,200 |
| India CCTS | 12 | 28 | 55 | $/t | Low (nascent) | 50 |
| Japan JCM (ITMO) | 20 | 35 | 60 | $/t | Medium | 15 |
| Verra VCS (VCU) | 8 | 18 | 40 | $/t | High | 600 |
| Gold Standard | 12 | 25 | 45 | $/t | Medium | 80 |
| Japan GX-ETS | 15 | 30 | 65 | $/t | Low (developing) | 25 |

`PRICE_HISTORY` (2019–25) and `FORWARD_CURVE` (2025–35) are hand-set paths — e.g. EU ETS 25→53→80→62→70
tracks the real 2019–24 EUA trajectory (the 2021 spike, 2022 peak, 2023 pullback). Volatility (0.25) and
the arbitrage `artSixDeductPct` (default 5%, the Article-6.4 share-of-proceeds level) are the only
free parameters. `INDIA_CORPORATE_PATHWAYS` (Tata Steel, Reliance, JSW, etc.) carry real named companies
with illustrative CCTS/JCM/VCS purchase requirements.

`ARBITRAGE_PAIRS` encodes eligibility rules — e.g. `VCS→EU_ETS` = "Ineligible" (voluntary credits cannot
be surrendered into EU ETS), `JAPAN_JCM→JAPAN_GX` = "Low risk, 70% of JCM credit goes to Japan GX" —
which are genuine market-structure facts, not synthetic.

### 7.3 Calculation walkthrough

Arbitrage Calculator tab: pick source + destination regime → `spread = dst.price2025 − src.price2025`
→ apply Article-6 haircut → `revenue = spread × netQty`. Portfolio Builder: user sets integer weights
per regime (`PORTFOLIO_DEFAULTS` sum to 100) → VaR tab computes the weighted spot price and the
parametric VaR. Forward Curve / Article 6 / CORSIA tabs are reference views over the same tables.

### 7.4 Worked example (arbitrage + VaR)

**Arbitrage:** source = India CCTS ($12), destination = EU ETS (€70, treated as $70 in code),
`qty = 100,000`, `artSixDeduct = 5%`:
- `spread = 70 − 12 = 58`
- `netQty = 100,000 × 0.95 = 95,000`
- `revenue = 58 × 95,000 = $5,510,000` (**$5.51M** gross arbitrage, before the ineligibility caveat that
  CCTS→EU-ETS in fact requires an Article-6 corresponding adjustment and is not fungible in practice).

**VaR** on default portfolio `{EU 0, India 30, JCM 25, VCS 30, GS 10, GX 5}` at 95%:
- `portfolioPrice = 0.30·12 + 0.25·20 + 0.30·8 + 0.10·12 + 0.05·15 = 3.6+5.0+2.4+1.2+0.75 = 12.95`
- `varPct = 12.95 × 0.25 × 1.645 = 5.32` (i.e. $5.32/t single-period VaR)
- `varPct1yr = 5.32 × √252 = 84.5` — implausibly large, exposing the √252 double-annualisation flaw.

### 7.5 Data provenance & limitations

- **Prices, volumes, and eligibility rules are real/directional** (published EUA levels, VCS ~680 Mt
  voluntary volume, Article-6 5% SOP, CORSIA eligibility). Named India corporates are real but their
  purchase-requirement figures are illustrative.
- **Volatility is a single hard-coded scalar (0.25) for all regimes** — EU ETS and nascent India CCTS
  cannot share a volatility; there is no covariance matrix, so the "portfolio" VaR ignores diversification
  entirely (it is a weighted-average-price VaR, not a portfolio VaR).
- The `√252` annualisation is dimensionally inconsistent with an annual vol input (see §7.1/§7.4).
- Currency is conflated: EU ETS is €/t, others $/t, but the arbitrage subtracts them directly.

**Framework alignment:** EU ETS / cap-and-trade — the EUA regime and its cap logic · Paris Agreement
Article 6.2/6.4 — ITMO transfers, corresponding adjustments, and the 5% share-of-proceeds haircut applied
in `calcArbitrageRevenue` · CORSIA — offset-unit eligibility flags on each pair · India CCTS — the
intensity-based-plus-offset design and CBAM export exposure in the corporate pathways. The MSCI Climate
VaR / Gorgen carbon-beta methods named in the guide are **not** implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Two distinct models are missing: (a) a real
cross-market carbon-basket VaR (the code has only a single-vol parametric proxy), and (b) the equity
carbon-factor long-short the guide describes. This spec covers the VaR the *coded* tool should run.

### 8.1 Purpose & scope
Estimate the market risk of a multi-regime carbon-credit portfolio (compliance EUAs, ITMOs, voluntary
VCUs) for a corporate compliance buyer or trading desk, capturing regime-specific volatility and cross-
regime correlation, plus Article-6 conversion and eligibility haircuts.

### 8.2 Conceptual approach
Variance-covariance and historical-simulation VaR on a portfolio of heterogeneous carbon instruments,
benchmarked against RiskMetrics parametric VaR and standard commodity-desk practice (ICE/EEX EUA risk
models). Each regime is a risk factor with its own volatility; correlation is estimated from overlapping
price history, not assumed zero or one.

### 8.3 Mathematical specification

```
r_k,t   = ln(P_k,t / P_k,t-1)                       daily log returns per regime k
Σ       = cov(r)                                     K×K covariance (EWMA λ=0.94)
w$      = notional weights (value, not %)
σ_p     = √(w$ᵀ Σ w$)                                 portfolio daily volatility
VaR_α   = z_α · σ_p · √h                              h = holding-period days
ES_α    = σ_p · φ(z_α)/(1−α) · √h                     expected shortfall
Arb_net = (P_dst − P_src·FX) · qty · (1 − SOP) · 1{eligible}
```

| Parameter | Symbol | Source |
|---|---|---|
| Regime volatilities | σ_k | realised from ICE EUA / MCX / Verra price history |
| Correlations | ρ_kj | EWMA on overlapping series (λ=0.94, RiskMetrics) |
| Article-6 SOP | SOP | 5% (Art. 6.4 rules), 0% for 6.2 bilateral |
| Confidence z | z_α | 1.645 (95%), 2.326 (99%) |
| FX | FX | ECB/RBI reference rates (EUR↔USD↔INR) |

### 8.4 Data requirements
Daily settlement prices per regime (ICE/EEX for EUA, MCX/SECI for India CCTS, registry marks for VCS/GS),
FX series, eligibility matrix (Article-6 authorisations, CORSIA phase list), notional positions. Platform
already holds the regime price tables and eligibility flags; missing: real daily series and FX.

### 8.5 Validation & benchmarking plan
Backtest VaR exceptions (Kupiec POF, Christoffersen independence) on EUA history — expect ~5% breaches at
95%. Reconcile single-name EUA VaR against an ICE margin model. Stress the 2021 EUA rally and 2022 gas-
crisis spike. Correlation-stability test across regimes.

### 8.6 Limitations & model risk
Nascent regimes (India CCTS, Japan GX) have too little history for stable covariance — fall back to a
conservative high-vol prior and floor correlations toward compliance-market analogues. Eligibility is
binary and policy-driven; a credit's fungibility can change overnight (regulatory risk), so arbitrage
revenue must be gated on a live eligibility feed, not a static table.
