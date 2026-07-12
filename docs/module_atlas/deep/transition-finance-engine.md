## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most transition-finance pages on this platform, this module's headline "Transition Loan
Pricing" calculator (`calcTransitionLoan()`) is a **genuine deterministic financial formula**, not a
PRNG draw — but it contains what appears to be a real unit/formula defect (see §7.4/§7.6). The rest
of the page (sector pathway table, taxonomy alignment matrix, bond-type navigator, credibility
scoring weights) is static reference content; only the credibility default scores and the 8-row
demo loan portfolio use the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`.

```js
allIn        = baseRate/100 + (baseRate/100 − greeniumBps/10000)   // see §7.4 — likely doubles baseRate
annInt       = principalM × allIn
carbonSaving = (ghgIntensityNow − ghgIntensityTarget) × revenue/1000 × carbonPriceFwd
pvSaving     = carbonSaving × (1 − (1+w)^−maturityYr) / w            // standard annuity PV factor
effectiveCost = annInt − carbonSaving
```

### 7.2 Parameterisation

| Input | Default | Role |
|---|---|---|
| `principalM` | $300M | Loan principal |
| `baseRate` | 5.5% | Reference lending rate |
| `greeniumBps` | 15bps | Rate discount for meeting transition KPIs |
| `carbonPriceFwd` | $100/tCO2 | Forward carbon price used to value avoided emissions |
| `ghgIntensityNow` / `ghgIntensityTarget` | 850 / 550 (units unspecified — implied tCO2e per $M revenue) | Emissions-intensity glide path |
| `maturityYr` | 7 years | Loan tenor |
| `wacc` | 6% | Discount rate for the PV of carbon savings |
| `CREDIBILITY_CRITERIA` weights | Paris-Aligned Pathway 25%, CapEx Plan 20%, Carbon Lock-In 20%, Revenue Exposure 15%, Governance 10%, Regulatory Alignment 10% | Platform-defined, sums to 100%; conceptually mirrors GFANZ/ICMA transition-credibility dimensions |
| `credScores` defaults | `round(50 + sr(criterion.weight)×40)` | Seeded per-criterion default (weight value reused as PRNG seed — same 6 defaults for every user/session) |
| `TRANSITION_SECTORS` | 8 hard-to-abate sectors with real emissions intensity figures (Agriculture 5,800, Real Estate 3,900, Steel 2,600...) and named pathways/frameworks | Hand-curated, directionally realistic reference table |
| Paris-aligned decline rate | 7.2%/yr (`Math.pow(1-0.072, y)`) | Closely matches the widely-cited ~7.6%/yr global emissions cut required for 1.5°C (UNEP Emissions Gap Report) — a genuinely well-calibrated constant |

### 7.3 Calculation walkthrough

1. **All-in rate**: intended to be "base rate net of greenium discount"; see §7.4 for the formula
   defect.
2. **Annual interest cost**: `principalM × allIn`, in $M since `principalM` is denominated in $M.
3. **Carbon saving**: `(intensity gap) × revenue/1000 × carbon price` — if intensity is tCO2e/$M
   revenue and `revenue` is in $M, this yields an **absolute dollar figure** (not $M), because
   dividing revenue by 1000 converts $M→$Bn while the intensity gap is per-$M — the two scales are
   not obviously reconciled in the formula as written.
4. **PV of carbon savings**: correctly applies the standard growing/level annuity present-value
   factor `(1−(1+w)^−n)/w` to the (potentially mis-scaled) `carbonSaving` figure.
5. **Effective cost**: `annInt − carbonSaving` nets the $M-scale interest cost against the
   (likely $-scale, ~1000× larger in absolute terms once revenue is large) carbon saving — see the
   worked example, where this produces a nonsensical sign/magnitude.
6. **Sector pathway chart** (`pathwayData`): three curves per year — autonomous 2%/yr intensity
   decline (business-as-usual glide), linear interpolation to the target by maturity, and a 7.2%/yr
   "Paris-aligned" decline — purely descriptive, not fed by `calcTransitionLoan`.
7. **Credibility score**: `Σ credScores[i] × weight[i] / 100` — this piece is a correctly implemented
   weighted average (unlike several sibling modules that only claim to be weighted).

### 7.4 Worked example (default sliders)

| Step | Computation | Result |
|---|---|---|
| All-in rate | `5.5/100 + (5.5/100 − 15/10000)` | **10.85%** — note this is *higher* than the 5.5% base rate despite a positive greenium discount, because the formula adds a second copy of `baseRate/100` instead of subtracting the greenium from a single copy |
| *(intended formula)* | `5.5/100 − 15/10000` | 5.35% — the economically sensible "base rate minus greenium" result |
| Annual interest | `300 × 0.1085` | **$32.55M** |
| Carbon saving | `(850−550) × 2000/1000 × 100` | **60,000** (units ambiguous — reads as $ if intensity is tCO2e/$M and revenue $M) |
| PV of saving (7yr, 6% WACC) | `60,000 × (1−1.06⁻⁷)/0.06` | **334,943** |
| Effective cost | `32.55(−$M) − 60,000` | **−59,967** |

The effective cost calculation mixes an $M-scale quantity (`annInt`) with what reads as an
absolute-dollar-scale quantity (`carbonSaving`), producing a deeply negative "effective cost" whose
magnitude (−$60,000, i.e. a huge implied *profit* from carbon savings) is not economically credible
at these input scales — a genuine unit-consistency defect, not merely synthetic-data noise.

### 7.5 Companion analytics

- **Sector Pathways tab** — the 8-sector reference table with real, directionally-calibrated
  emissions-intensity figures and named decarbonisation pathways/frameworks (Hydrogen DRI/EAF for
  steel, CCS for cement, SAF for aviation).
- **Taxonomy Alignment tab** — 4 real taxonomy frameworks (EU Taxonomy DNSH, ICMA Climate Bonds,
  ASEAN Taxonomy, Singapore-Asia Taxonomy) each with eligible/transitional/excluded activity lists —
  descriptive reference content, not applied to any specific deal.
- **Bond Type Navigator** — 5 instrument types with greenwash-risk and market-acceptance labels.
- **Portfolio Monitoring tab** — 8 synthetic borrower rows (`sr()`-seeded exposure/credibility/
  on-track flag), independent of the pricing calculator.

### 7.6 Data provenance & limitations

- The **loan-pricing calculator's core formula appears to contain a defect**: `allIn` effectively
  doubles the base rate before applying the greenium discount rather than subtracting the greenium
  from a single base rate, and `carbonSaving`/`pvSaving`/`effectiveCost` mix $M-scale and
  absolute-dollar-scale quantities without reconciliation. This is exactly the kind of formula a
  bank model-validation function (SR 11-7 / SS1/23 effective-challenge review) would reject — see
  §8 for a corrected specification.
- Sector emissions-intensity figures and taxonomy eligibility lists are hand-curated and
  directionally reasonable but not cited to a specific data vintage or source document.
- `credScores` defaults reuse each criterion's *weight* value as its own PRNG seed, so the same 6
  starting scores appear for every user on every session — not a meaningful per-deal default.

### 7.7 Framework alignment

- **GFANZ Transition Finance Principles**: the 6 listed principles (1.5°C alignment, whole-economy
  view, no new carbon lock-in, just transition, credible plans, annual disclosure) are accurately
  restated from GFANZ's actual published framework.
- **EU Taxonomy / ICMA Climate Bonds / ASEAN / Singapore-Asia Taxonomy**: eligible/transitional/
  excluded classifications are broadly accurate high-level summaries of each real framework's
  current stance on gas, nuclear, and coal.
- **ICMA SLB Principles / LMA Green & Transition Loan Principles**: correctly cited as the governing
  standards for the 5 bond/loan types in the navigator.

## 8 · Model Specification — Transition Loan Pricing & Carbon-Adjusted Cost of Capital

**Status: specification — not yet implemented in code.** (The current `calcTransitionLoan()`
function is a defective placeholder per §7.4/§7.6; this section specifies the production model that
should replace it.)

### 8.1 Purpose & scope
Prices a bank's transition/sustainability-linked loan by (a) setting the KPI-contingent coupon
discount ("greenium") and (b) quantifying the borrower-level and lender-level value of the
emissions-intensity glide path financed by the loan. Scope: single-name corporate transition loans
in hard-to-abate sectors (steel, cement, chemicals, shipping, aviation, power).

### 8.2 Conceptual approach
Mirrors two industry precedents: (1) **LMA/APLMA Sustainability-Linked Loan Principles** pricing
grids, where the margin adjusts ±X bps based on KPI/SPT performance against a baseline — used here
for the coupon side; (2) **carbon-adjusted DCF / shadow-carbon-pricing** practice (as used in
Moody's transition-risk-adjusted credit metrics and MSCI Climate VaR revenue-at-risk models), used
here to value the avoided-carbon-cost cash flow stream separately from the loan's interest cash
flows, then combine both into a single lender NPV rather than netting mismatched units.

### 8.3 Mathematical specification

```
allIn_rate(t)   = baseRate − greeniumBps(t)/10000                      [dimensionless annual rate]
greeniumBps(t)  = greeniumBps_max × KPI_performance_ratio(t)           [KPI ratchet, capped]
annInt(t)       = principal × allIn_rate(t)                            [$, same currency unit as principal]

carbonSavingAnnual(t) = ΔIntensity(t) × outputVolume(t) × carbonPriceFwd(t)
  where ΔIntensity(t) = intensityNow − intensityPath(t)   [tCO2e per unit output]
        outputVolume(t) in physical/revenue units consistent with ΔIntensity's denominator
        — CRITICAL: outputVolume and ΔIntensity must share the same denominator (e.g. both
          per-$M-revenue, or both per-tonne-output); never divide revenue by an ad hoc scalar.

PV(carbonSaving) = Σ_{t=1}^{n} carbonSavingAnnual(t) / (1+wacc)^t     [level-annuity or path-specific]

LenderNPV = -principal + Σ_t annInt(t)/(1+r_lender)^t + principal/(1+r_lender)^n
BorrowerNetCost = Σ_t [annInt(t) − carbonSavingAnnual(t)] / (1+wacc)^t   [only valid once units reconciled]
```

| Parameter | Calibration source |
|---|---|
| `greeniumBps_max` | LMA SLLP market survey (typical 10–50bps net range) |
| `carbonPriceFwd(t)` | NGFS Phase IV / IEA NZE carbon price trajectories by scenario |
| `intensityPath(t)` | SBTi Sectoral Decarbonization Approach (SDA) pathway for the borrower's sector |
| `wacc`, `r_lender` | Borrower-specific WACC (CAPM) / bank's internal cost of funds |

### 8.4 Data requirements
Borrower emissions intensity time series (Scope 1+2, ideally 3), sector SDA pathway, forward carbon
curve (already available via the platform's `reference_data` carbon-price tables), loan terms
(principal, tenor, base rate, greenium grid), and borrower revenue/output volume in a denominator
consistent with the intensity metric.

### 8.5 Validation & benchmarking plan
Unit-consistency assertion tests (dimensional analysis on every intermediate quantity) as a
pre-commit gate; backtest greenium-adjusted spreads against LMA SLLP market survey medians;
reconcile `PV(carbonSaving)` against the platform's own `carbon-price-ets-engine` forward curve
outputs for the same scenario.

### 8.6 Limitations & model risk
Emissions-intensity glide paths are inherently uncertain (execution risk on capex plans); carbon
price forward curves are scenario-dependent and can diverge materially from realised prices;
greenium ratchets create an incentive-compatibility risk if KPIs are set unambitiously (already
flagged as a real-world SLB market concern in `transition-bond-credibility`).
