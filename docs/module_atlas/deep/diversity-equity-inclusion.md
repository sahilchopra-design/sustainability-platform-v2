## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an *Adjusted Pay Gap* `APG = (Median Male −
> Median Female)/Median Male × 100` that "controls for role, seniority, and tenure to isolate the
> residual unexplained difference." **No regression-adjusted gap is computed.** The page draws all 80
> companies' DEI metrics — pay gaps, female representation, board composition, regulatory status — from
> the seeded PRNG `sr()`. The displayed "gender pay gap" is an *unadjusted* seeded value, not a
> role/seniority-controlled residual. Sections below document the synthetic scorecard.

### 7.1 What the module computes

```js
companies (80): per firm, all metrics seeded from s=sr(i·7), s2=sr(i·13), s3=sr(i·19), s4=sr(i·23):
  femaleTotal   = round(25 + s·30)      // % 25–55
  femaleBoard   = round(10 + s3·40)     // % 10–50
  genderPayGap  = (5 + s·20)            // % 5–25  (UNADJUSTED — drawn, not computed)
  medianPayF    = round(45000 + s·55000) ; medianPayM = round(50000 + s2·60000)
  ceoPayRatio   = round(80 + s2·250) ; bonusGap = 8 + s3·25
  deiScore      = round(30 + s·60)
  euPayTransparency / parkerReview / hamptonAlexander = sr() threshold → Compliant|Partial|Gap etc.
KPIs: avgPayGap = Σ genderPayGap / 80 ; avgFemaleBoard ; avgDeiScore (all /80)
```

Note the internal inconsistency: `medianPayF`/`medianPayM` are seeded *independently* of
`genderPayGap`, so the displayed pay gap does **not** equal `(medianPayM − medianPayF)/medianPayM`.

### 7.2 Parameterisation

| Metric | Range | Provenance |
|---|---|---|
| Female total / senior / board | 25–55 / 15–45 / 10–50 % | synthetic (`sr()`) |
| Gender pay gap | 5–25 % | synthetic |
| CEO pay ratio | 80–330× | synthetic |
| Ethnic minority / LGBTQ / disability | 8–43 / 2–8 / 1–6 % | synthetic |
| Regulatory flags | EU Pay Transparency, Parker Review, Hampton-Alexander | **real** frameworks, seeded status |
| Company names | 80 real multinationals | labels |

Regulatory frameworks referenced are real: the **UK Parker Review** (ethnic diversity on FTSE boards),
**Hampton-Alexander Review** (33% women on FTSE 350 boards), and the **EU Pay Transparency Directive
2023/970** — but each company's compliance status is a seeded draw.

### 7.3 Calculation walkthrough

`companies` seeds 80 rows once. Four tabs filter/sort/search: DEI scorecard (deiScore, female metrics),
pay equity (genderPayGap, bonusGap, ceoPayRatio, median pay), board & leadership (board size, female/
ethnic/independent directors, tenure), regulatory compliance (EU/Parker/Hampton-Alexander flags).
KPIs average pay gap, female board %, and DEI score across all 80 (or filtered) firms. A 24-month
`trendData` line shows improving female-board/DEI and narrowing pay gap (seeded with a linear drift +
`sr()` noise). A per-sector DEI aggregate radar rounds out the scorecard.

### 7.4 Worked example

Company i=0 (Accenture): `s = sr(0) = frac(sin(1)·10⁴) = 0.7099`.
- `femaleTotal = round(25 + 0.7099·30) = round(46.3) = 46%`.
- `genderPayGap = (5 + 0.7099·20).toFixed(1) = 19.2%`.
- `medianPayF = round(45000 + 0.7099·55000) = $84,045`; `medianPayM = round(50000 + sr(13)·60000)`.
  Because F and M medians use *different* seeds, `(M−F)/M` will **not** reproduce the 19.2% gap — the
  gap is an independent draw, exposing that no real pay-distribution calculation occurs.
- `deiScore = round(30 + 0.7099·60) = 73`.

### 7.5 Data provenance & limitations

- **Every DEI metric is synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); only company names and the
  named regulatory frameworks are real.
- The pay gap is unadjusted and internally inconsistent with the median-pay fields — the guide's
  role/seniority/tenure-adjusted residual is not implemented (would require a regression on real
  payroll microdata).
- Board/representation figures are drawn, not sourced from proxy statements or ISS/Refinitiv data.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page shows a "gender pay gap" with no
underlying pay-distribution model. A production DEI analytics engine must compute both the unadjusted
gap and the **regression-adjusted (explained vs unexplained) gap** the guide and the EU Pay
Transparency Directive require — the discipline behind Mercer/Willis Towers Watson pay-equity audits
and Oaxaca-Blinder decomposition.

**8.1 Purpose & scope.** From payroll microdata, compute per-entity unadjusted and adjusted pay gaps by
gender/ethnicity, an explained/unexplained decomposition, and ESRS S1-16 disclosure figures.

**8.2 Conceptual approach.** **Oaxaca-Blinder decomposition** on a log-pay regression — the standard
labour-economics method separating the gap into an "explained" part (differences in role, seniority,
tenure, hours) and an "unexplained" residual (the discrimination-consistent component). Benchmarks:
(a) Oaxaca (1973)/Blinder decomposition; (b) UK GPG statutory methodology (median + mean); (c) EU Pay
Transparency Directive's ">5% unexplained gap ⇒ joint pay assessment" rule.

**8.3 Mathematical specification.**
```
Unadjusted:  G_raw = (median_M − median_F) / median_M · 100
Regression:  ln(pay_i) = α + Σ βₖ Xₖᵢ + γ·Female_i + εᵢ      # X = grade, tenure, hours, function, location
Adjusted gap = 100·(1 − e^γ)                                 # residual gender effect, controls held equal
Oaxaca-Blinder:  Ḡ = [X̄_M − X̄_F]·β_M   +   X̄_F·(β_M − β_F)
                     └ explained ┘         └ unexplained ┘
Trigger: unexplained > 5% ⇒ mandatory joint pay assessment (EU Directive Art. 10)
```

| Parameter | Source |
|---|---|
| Pay & covariates | HRIS payroll microdata (grade, tenure, FTE, function) |
| Grade structure | internal job architecture |
| 5% threshold | EU Pay Transparency Directive 2023/970 Art. 10 |

**8.4 Data requirements.** Employee-level: `pay, gender, ethnicity, grade, tenure_yrs, fte_pct,
function, location`. Sources: HRIS export (needed); no synthetic substitute is acceptable for a
compliance figure.

**8.5 Validation & benchmarking.** Reconcile the unadjusted gap against the entity's statutory UK GPG
filing; sanity-check regression R² and coefficient stability; compare adjusted gaps against sector
benchmarks (Mercer). Backtest that flagged >5% unexplained gaps align with subsequent remediation.

**8.6 Limitations & model risk.** Omitted-variable bias inflates the "unexplained" residual (missing
performance/negotiation covariates); small subgroup n makes ethnicity gaps unstable → suppress below a
privacy threshold. Conservative fallback: report the statutory unadjusted gap when microdata is
insufficient for a stable regression, and label the adjusted gap "indicative".

**Framework alignment:** ESRS S1-16 (remuneration — requires both gender pay gap and CEO pay ratio),
EU Pay Transparency Directive 2023/970 (adjusted gap + >5% joint-assessment trigger), UK Gender Pay Gap
Regulations 2017 (statutory median/mean), Parker Review & Hampton-Alexander (board ethnic/gender
targets) — all named in the module but only the framework *labels*, not the computations, are present.
