## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DI3) claims
> `Fund Taxonomy Alignment = Σ(Holding Weight × Holding Taxonomy %)`, holding-level GAR/BTAR
> computation, and SFDR Article 8/9 eligibility assessment. **The code does not weight by holdings
> and does not assess Art 8/9**: fund-level eligible/aligned figures are *simple averages* over 40
> synthetic equities, GAR is the ratio of two hard-coded seed tables (not derived from holdings),
> BTAR is a literal string ("BTAR 8.4%"), and no Article 8/9 classification logic exists. That
> said, this is one of the platform's richest pages (20 tabs, EP-Q8 build): real EU Taxonomy
> Compass 2024 reference data partially anchors sector alignment, and the greenium-regression and
> fair-value tabs contain genuine (if simplified) econometrics. The sections below document the
> code as it behaves.

### 7.1 What the module computes

Universe: 40 synthetic bonds (5 types cycling Green/Social/Sustainability/SLB/Conventional across
40 real European issuer names) and 40 synthetic equities. Headline KPIs
(`CapitalMarketsTaxonomyPage.jsx:421-438`):

```js
GAR       = Σ GAR_COMPONENTS.numerator / Σ denominator × 100     // 38,970 / 150,150 = 25.95%
eligAvg   = mean(EQUITIES.eligibleRev);  alignedAvg = mean(EQUITIES.alignedRev)   // unweighted
greenium  = last month of GREENIUM_HISTORY.avg                    // synthetic series
naiveGreenium = mean(spread | Green∪Sustainability) − mean(spread | others)
β_green   = univariate OLS of spread on green dummy (optional sector demeaning)
SLB progress = (baseline − current) / (baseline − SPT) × 100
```

### 7.2 Parameterisation

| Block | Content | Provenance |
|---|---|---|
| Bond generator | coupon 0.5–6.5%, tenor 3–30y, spread 30–280bp, alignment 40–98% (0 for conventional), SPO provider, CICERO shade | Synthetic (`sr()` PRNG) |
| **EU Taxonomy overlay** | `taxonomyAligned` / `eligibleRevenuePct` overridden per sector from `EU_TAXONOMY_SECTOR_ELIGIBILITY` (EU Taxonomy Compass 2024 estimates); CCM/CCA activity match sets `greenBondEligible` | **Real reference data** (`data/euTaxonomyEligibility.js`) |
| `GAR_COMPONENTS` (7 rows) | e.g. NFC loans €18,420M/€68,500M; retail mortgages ("EPC ≥ A or top 15% of stock"); motor loans (Taxonomy 6.5 zero-emission) | Hard-coded demo balance sheet; category definitions faithful to EBA Art 8 DA templates |
| `CTB_PAB_RULES` (14 rows) | CTB ≥30% / PAB ≥50% intensity cut, 7% p.a. trajectory, PAB coal ≥1% / oil ≥10% / gas ≥50% / power >100 gCO₂/kWh exclusions | Accurate restatement of Delegated Regulation (EU) 2020/1818 |
| `WATERFALL_STAGES` | 100 → 62 eligible → 48 SC → 41 DNSH → 38 safeguards → 38 aligned | Hard-coded illustration of the Art 3 gating logic |
| `GREENIUM_HISTORY` (36 mo × 4 ccy) | EUR −2..−10bp, USD −1..−7, GBP −1.5..−7, JPY −0.5..−3.5 | Synthetic; sign convention (negative = greenium) is correct, magnitudes plausible vs empirical −1 to −5bp studies |
| `SLB_TRACKING` (12) | baseline, SPT = 55–80% of baseline, step-up ∈ {25, 37.5, 50, 75}bp, observation dates 2025–2028 | Synthetic; step-up menu matches ICMA SLB market practice |
| `YIELD_CURVE` / `TREASURY_CURVE` | 10 tenors, sovereign 3.05–4.25%, IG green inside IG conventional at every tenor | Hard-coded, internally consistent |
| `NGFS_SHOCKS` | Orderly +20bp/−4% eq; Disorderly +75/−14; Hot House +120/−22; Fragmented +95/−18 | Stylised NGFS-labelled shocks, uncited magnitudes |

### 7.3 Calculation walkthrough — the quantitative tabs

1. **GAR tab** — per-category `GAR_i = num_i/den_i` bars plus the aggregate; "flow-basis GAR" is
   displayed as `stock GAR × 1.12` — a cosmetic multiplier, not a computation.
2. **Greenium regression tab** — builds `green ∈ {0,1}` (Green + Sustainability), rating rank
   1–12, tenor; runs **three separate univariate OLS regressions** of spread on each regressor
   (with closed-form β, SE, t-stat, R²), then forms a "combined" prediction by adding the three
   univariate β contributions around the mean — *not* a multivariate OLS, so collinearity between
   rating and green label is unhandled (the on-page note acknowledges the FE toggle exists to
   control sector composition; demeaning by sector is implemented correctly).
3. **Relative value tab** — fair value discounts coupons + principal at
   `tsy(t) (linear interp) + OAS + 8bp option value − 5bp greenium (GSS only)`; rich/cheap =
   market price vs fair.
4. **SLB tab** — progress % and `onTrack = current ≤ SPT + 0.35×(baseline−SPT)`; a step-up
   waterfall shows coupon penalty cash flows if SPTs are missed.
5. **Stress tab** — applies `NGFS_SHOCKS` spread/equity shocks to the synthetic book.

### 7.4 Worked example (SLB progress + GAR)

SLB with `baseline = 100`, `SPT = 60`, `current = 74`, step-up 50bp on €500M:
progress = (100−74)/(100−60) = **65.0%**; on-track test: 74 ≤ 60 + 0.35×40 = 74 → **On Track**
(boundary-inclusive). If the KPI lands at 75 at observation, coupon steps up 0.50% → +€2.5M/yr.
Aggregate GAR: numerators 18,420+12,300+1,850+2,400+320+480+3,200 = **38,970**; denominators
68,500+45,200+8,100+9,500+1,850+2,400+14,600 = **150,150**; GAR = 38,970/150,150 = **25.95%** —
an order of magnitude above real disclosed bank GARs (EBA observed ~2–8% in 2024), a demo-data
artefact worth noting.

### 7.5 Data provenance & limitations

- Bond/equity metrics are synthetic (`sr(seed) = frac(sin(seed+1)×10⁴)`), attached to real issuer
  names; the EU Taxonomy Compass overlay makes *sector-level* eligibility/alignment realistic but
  issuer-level numbers remain fabricated.
- Fund alignment KPIs are unweighted means (guide claims weight × alignment aggregation); GAR is
  static seed data, not a holdings computation; BTAR and flow-GAR are decorative.
- Greenium regression is univariate-stacked, not multivariate; with N = 40 and randomly drawn
  spreads, the β_green estimate is statistically meaningless (the machinery, however, is correct
  and would work on real data).
- Fair value ignores compounding conventions, day counts, and credit curves beyond a flat OAS.

### 7.6 Framework alignment

- **EU Taxonomy Regulation 2020/852** — the waterfall reproduces the Art 3 test (eligible →
  substantial contribution → DNSH → minimum safeguards); real alignment requires activity-level
  technical screening, which the Compass overlay only approximates at sector level.
- **Art 8 Delegated Act 2021/2178 (GAR)** — GAR = taxonomy-aligned covered assets / total covered
  assets, excluding sovereigns/central banks from the denominator and non-NFRD counterparties from
  the numerator (they enter BTAR instead); the module's 7 asset categories mirror the DA's
  template rows.
- **EU 2020/1818 (CTB/PAB)** — the 14-rule table is an accurate summary (30%/50% intensity
  reduction, 7% p.a. self-decarbonisation, PAB fossil exclusions, 4× green/brown ratio).
- **ICMA GBP/SBP/SBG/SLB Principles** — framework tagging per bond type, SPO/shade fields, and the
  SLB five-component structure (KPI selection, SPT calibration, characteristics, reporting,
  verification) reflect the 2021–2024 ICMA editions.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Two production models this page implies but does not implement: (A) **look-through fund taxonomy
alignment & GAR** from actual holdings; (B) **greenium estimation** robust enough to quote as an
issuance/valuation signal. Users: fund reporting (SFDR/Art 8 DA), DCM syndicate pricing.

### 8.2 Conceptual approach
(A) mirrors the **EBA Art 8 DA reporting templates** and **Clarity AI / MSCI ESG fund look-through**
practice: holding-level alignment (reported first, estimated fallback) aggregated by weight.
(B) mirrors the **matched-pair / curve-based new-issue-premium method** used by Climate Bonds
Initiative pricing studies and AFME/ICMA greenium research, upgraded to panel regression.

### 8.3 Mathematical specification

```
(A) Align_fund^m = Σ_i w_i · a_i^m,  m ∈ {turnover, capex, opex}
    a_i = reported CSRD Art 8 KPI if available; else sector-activity estimate with flag
    GAR = Σ_i 1{covered_i} · EAD_i · a_i^turnover / Σ_i 1{covered_i} · EAD_i
    (sovereign & central-bank exposures excluded from denominator per DA)

(B) spread_b = α + γ·Green_b + β₁·rating_b + β₂·tenor_b + β₃·log(size_b)
             + β₄·liquidity_b + μ_issuer + λ_month + ε_b
    γ̂ = greenium (bps); matched-pair fallback: Δ_b = y_green − ŷ_curve(conventional, same issuer,
    interpolated to same tenor), greenium = median(Δ) with bootstrap CI
```

| Parameter | Calibration source |
|---|---|
| a_i reported | CSRD/Art 8 filings (ESAP when live); Bloomberg/Clarity AI fields |
| Sector estimates | EU Taxonomy Compass activity list (already ingested in `data/euTaxonomyEligibility.js`) |
| Coverage rules | EBA ITS on Pillar 3 ESG disclosure (2022/2453) template 7/8 definitions |
| Liquidity control | bid-ask or Bloomberg CBBT depth; TRACE/ICE for USD |
| Issuer/month fixed effects | panel of ≥ 500 EUR/USD IG bonds, ≥ 24 months (ICE or iBoxx indices) |
| Matching tolerance | same issuer, seniority, ±2y tenor (CBI pricing methodology) |

### 8.4 Data requirements
Holdings with weights and EADs (platform portfolio contexts exist); issuer alignment KPIs (vendor
or ESAP); bond terms & spreads (ICE/Bloomberg; free fallback: FINRA TRACE for USD); green labels
with ICMA framework tags (module's bond schema already carries these fields). Persist alignment
estimates with a source flag (reported / estimated / proxy) per SFDR RTS Annex disclosure rules.

### 8.5 Validation & benchmarking plan
(A) Reconcile fund alignment vs an external provider (Clarity AI/Morningstar) on a 20-fund overlap,
tolerance ±2pp; GAR unit tests against EBA worked examples. (B) γ̂ stability across specifications
(FE on/off, matched-pair vs regression) within ±2bp; backtest greenium forecasts vs realised NIP on
new issues; verify residual diagnostics (heteroskedasticity-robust SEs, no issuer clustering left).

### 8.6 Limitations & model risk
Estimated alignment for non-reporters is the dominant error source — cap estimated share of the
fund KPI and disclose it; greenium is small relative to noise (single-digit bps) so point estimates
must always ship with CIs; label integrity risk (self-labelled bonds without SPO) — restrict the
green dummy to externally reviewed instruments; GAR is highly sensitive to counterparty scoping
(NFRD/CSRD-subject test) — implement the scoping table as versioned reference data.
