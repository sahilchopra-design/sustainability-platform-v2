## 7 · Methodology Deep Dive

> **Frontend↔backend disconnect note.** This is a tier-A module with a genuine backend engine
> (`backend/services/climate_insurance_engine.py`, E79) exposing 8 endpoints under
> `/api/v1/climate-insurance/*` — but the page (`ClimateInsurancePage.jsx`) imports no HTTP client
> and never calls them. Everything rendered in the 10 tabs is computed client-side from seeded and
> hand-coded data. The guide's methodology (Protection Gap Ratio, RCP loss multipliers, pure-risk
> premium) **is implemented** — the PGR on the Cat Modelling tab and the full RCP/premium machinery
> in the engine — so no guide↔code mismatch flag is raised; the gap is wiring, not methodology.

### 7.1 What the module computes

**Frontend (10 tabs, 30 insurers × 6 asset classes × 12 perils × 6 NGFS scenarios):**

```
PGR            = (1 − Σ insured_loss_bn / max(Σ economic_loss_bn, 1)) × 100      // Cat Modelling KPI
scr_stressed   = max(100, solvencyRatio × (1 − capitalImpact_pct/100))           // Solvency tab
baseScr        = assets_usd_bn × 0.08
climateScr     = baseScr × (1 + |capitalImpact_pct|/100)
buffer         = assets_usd_bn × solvencyRatio/100 − climateScr
ORSA stressed  = max(100, round(solvencyRatio × (1 − |capitalImpact_pct|/100) − carbonPrice × 0.015))
PML(rp)        = return_period_100yr × log10(rp)/log10(100) × (0.9 + sr(...)×0.2)
premium(rp)    = AAL × log10(rp)/log10(100) × 0.015 × (1 + sr(rp×7)×0.3)
```

**Backend engine (E79) — the production-shaped logic:**

```
IAIS overall     = Σ_pillar avg(item scores 0/0.5/1) × weight_pillar            // ×100 → %
Parametric prem  = AAL × climate_adj × (1 + loading%);  climate_adj = 1 + rcp85_loading × (yrs/26)
NatCat           = exposure × aal_pct;  climate_loading = 1 + loading_rcp85 × rcp_mult × (horizon−2024)/26
Climate VaR      = physical (PC × PML₁₀₀ ratio × natcat_uplift) + transition + liability + life
                   − 15% diversification benefit
ORSA SCR uplift  = total×0.10×natcat_uplift + inv×|equity_shock|×0.40 + total×0.05×liab_uplift
Post-stress SR   = 185% × SCR_base / (SCR_base + uplift)
```

### 7.2 Parameterisation

| Frontend NGFS scenario | claimsImpact % | investmentImpact % | capitalImpact % |
|---|---|---|---|
| Orderly | +8 | −3 | −5 |
| Disorderly | +15 | −12 | −18 |
| Hot House | +35 | −8 | −25 |
| Net Zero 2050 | +5 | +2 | −2 |
| Delayed Transition | +20 | −18 | −22 |
| Current Policies | +30 | −6 | −20 |

Ordering follows NGFS logic (hot-house worst for claims; disorderly worst for investments), but the
values are synthetic demo constants, not published NGFS output. Backend equivalents
(`NGFS_SCENARIOS`): equity shock −10…−30%, bond spread +40…180 bps (duration 5 applied), real-estate
−8…−20%, NatCat uplift +12…35%, liability reserve uplift +5…20%.

| Backend constant | Value | Provenance |
|---|---|---|
| IAIS pillar weights | Gov 0.25 / Strategy 0.25 / Risk Mgmt 0.30 / Disclosure 0.20 | Engine-authored, mapped to ICP 7/8/9/16/20 |
| IAIS RAG thresholds | green ≥80%, amber ≥60%, red <40% | Engine convention |
| RCP multipliers | rcp26 0.30 · rcp45 0.55 · rcp85 1.00 | Scales the country RCP8.5-2050 loading |
| Country AAL / PML₁₀₀ / PML₂₅₀ | 20-country table, e.g. India flood AAL 0.40%, PML₁₀₀ 2.0% | "Swiss Re sigma NatCat 2023 + EIOPA profiles" (per docstring; hand-coded) |
| Protection gap (global 2022) | $275bn economic / $125bn insured → 54.5% | Swiss Re sigma No 1/2023 (cited in-code) |
| Parametric premium loading | 35% | "standard loading for expenses + profit" |
| SCR baseline / solvency baseline | 15% of exposure / 185% | Engine assumptions |
| Casualty: D&O exposure, reserve, loading | 8% of P&C × 3% × 1.20; growth 25%/yr | Lloyd's 2022 report cited; values heuristic |

### 7.3 Calculation walkthrough

Frontend: `INSURERS` (17 Indian + 13 global names) get all risk primitives from
`sr(i×7+k)`-seeded draws (GWP $0.5–30bn, solvency 140–300%, physical 10–70, transition 5–60).
Filters (insurer/type/country) recompute KPI means with division guards; the scenario select swaps
one of six impact rows into every stressed-SCR/buffer formula; the carbon-price slider feeds pure
scaling heuristics (`carbonPrice×0.032` SCR uplift, `×0.018` solvency pts, `×0.045` $B loss).
Backend: `full_assessment()` chains IAIS → climate VaR → ORSA → casualty → NatCat (largest country/
peril exposure) → parametric design → protection gap, then blends an overall score
`0.35×IAIS + 0.35×max(0, 1 − VaR%/20) + 0.30×ORSA-checklist`.

### 7.4 Worked example (backend NatCat: India flood, $1,000M insured, RCP4.5, 2040)

| Step | Computation | Result |
|---|---|---|
| Base AAL | 1,000 × 0.40% | **$4.00M** |
| Years factor | (2040 − 2024) / 26 | 0.6154 |
| Climate loading | 1 + 0.35 × 0.55 × 0.6154 | **1.118** |
| Climate-adjusted AAL | 4.00 × 1.118 | **$4.47M** |
| PML 1-in-100 (base → adj) | 1,000 × 2.0% → × 1.118 | $20.0M → **$22.37M** |
| Premium loading recommendation | (1.118 − 1) × 100 | **+11.8%** |

Frontend cross-check (Cat Modelling KPI, deterministic hand-coded events): Σ insured = $397.4B,
Σ economic = $1,097.7B → protection gap = (1 − 397.4/1097.7) × 100 = **64%** — consistent with
Swiss Re sigma's reported 54–62% multi-year global gap range.

### 7.5 Climate VaR channel decomposition (engine)

`physical = PC × PML₁₀₀-ratio × (1 + natcat_uplift)` — the code comments explicitly note the prior
AAL×10 heuristic was replaced so the 99th-percentile figure is grounded in the loss-exceedance
curve. `transition = inv × (hc×equity×0.5 + hc×spread·dur×0.3 + 0.10×re×0.2)`;
`liability = PC × 0.002 × (1 + uplift/200)`; `life = life_exposure × 0.0015 (hot-house) or 0.0008`.
Aggregation subtracts a flat 15% diversification benefit.

### 7.6 Companion analytics on the page

Reinsurance & ILS tab (seeded cat-bond market series 2018–24, hand-coded 8-bond table with real
sponsor names, spreads 320–580 bps); Realistic Disaster Scenarios table (8 RDS with gross/net/
recovery splits, Lloyd's-RDS style); IAIS & Regulatory tab (12 hand-coded framework rows with
`sr`-seeded compliance %); Climate Litigation tab (20 hand-coded real cases — Milieudefensie v
Shell, KlimaSeniorinnen, Held v Montana — with exposure $M and insurer-relevance tags).

### 7.7 Data provenance & limitations

- **All 30 insurer profiles, portfolios and trend series are synthetic**, generated by the platform
  PRNG `sr(seed) = frac(sin(seed+1)×10⁴)` — deterministic across renders, not real company data.
  Insurer names are real; their numbers are not.
- PERILS, CAT_EVENTS and LITIGATION_CASES are hand-coded but broadly faithful to public records
  (Katrina $82B insured, Ian $60B, European floods 2021 $13B; attribution % values are plausible
  but not sourced to specific WWA studies).
- What-if outputs (carbon price → SCR/premium/stranded) are single-coefficient heuristics with no
  model behind them; the return-period curves use a log₁₀ interpolation, not a fitted EP curve.
- The backend engine is deterministic and reference-anchored but uses fixed baselines (SCR 15%,
  solvency 185%) rather than reported figures, and the page never consumes it.

**Framework alignment:** IAIS Application Paper on climate risk supervision (2021) — the engine
scores 20 items full/partial/absent (1/0.5/0) across the four ICP-mapped pillars and weights them,
mirroring how IAIS members structure supervisory self-assessments · Solvency II Art 45a — ORSA
climate stress produces post-stress SCR coverage with 100%/150% breach tests, the actual Pillar-2
mechanic · NGFS scenarios (both layers, parameterised not simulated) · TCFD — four-pillar
disclosure status feeds the compliance score · PCAF Part B insurance-associated emissions and
Swiss Re sigma protection-gap data are cited as anchors in the engine's reference tables.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace the page's heuristic stress numbers with a climate-conditioned
NatCat pricing and solvency model supporting (i) technical premium adequacy by peril/geography and
(ii) ORSA-grade post-stress solvency for a multi-insurer book. Coverage: P&C and reinsurance
portfolios with location-level or country-level exposure.

**8.2 Conceptual approach.** Event-set frequency–severity simulation with climate-conditioned
hazard frequencies, in the style of **Moody's RMS Climate Change Models** and **Verisk (AIR)
climate-conditioned catalogs**, feeding the **Solvency II standard-formula NatCat sub-module**
(SCR_cat) and an NGFS-conditioned market-risk shock per **EIOPA 2022 climate stress-test**
parameters. Premium adequacy follows Swiss Re sigma / actuarial pure-premium practice.

**8.3 Mathematical specification.**

```
N_p(t)  ~ Poisson(λ_p × m_p(s, t))                      // events of peril p, scenario s
X_p     ~ LogNormal(μ_p, σ_p)  truncated at exposure    // severity per event
L       = Σ_p Σ_{i≤N_p} min(X_p,i × V_p, PML cap)       // annual portfolio loss
AAL     = E[L];   PML_rp = quantile(L, 1 − 1/rp)
PurePrem= AAL_climate;  GrossPrem = PurePrem × (1 + expense + capital charge + profit)
SCR_cat = PML_200 − AAL   (1-in-200 VaR net of expected, per Solvency II calibration)
SR_post = OwnFunds − ΔMV(NGFS s) − ΔReserves(s) ) / (SCR_base + ΔSCR_cat(s))
```

| Parameter | Description | Calibration source |
|---|---|---|
| λ_p | Baseline annual event frequency by peril | EM-DAT 1980–2023; Swiss Re sigma catalogues |
| m_p(s,t) | Climate frequency multiplier | IPCC AR6 WG1 Ch.11 scaling; NGFS Phase IV acute-risk add-ons |
| μ_p, σ_p | Severity distribution | Fitted to Swiss Re sigma insured-loss history, CPI/exposure-trended |
| Equity/spread/RE shocks | Transition market shocks | EIOPA 2022 climate stress parameters; NGFS Phase IV (NiGEM outputs) |
| Duration, hc share | Bond repricing inputs | Portfolio data; EIOPA QRT S.06.02 asset templates |
| Expense/profit loading | Premium loadings | Historical combined-ratio decomposition (company SFCRs) |

**8.4 Data requirements.** Exposure by country×peril (exists: engine `country_exposures` /
`peril_exposures` inputs); insured/economic loss history (partially exists: `PROTECTION_GAP_DATA`,
platform EM-DAT seeds); asset allocation and duration (page `PORTFOLIOS` schema, needs real data —
vendor: EIOPA QRTs, S&P Capital IQ; free: SFCR filings); NGFS Phase IV scenario variables (free,
already used elsewhere in the platform's reference-data layer).

**8.5 Validation & benchmarking.** Backtest modelled AAL/PML against 10 years of sigma insured
losses per region (target: modelled AAL within ±25% of trended empirical mean); reconcile SCR_cat
against the Solvency II standard-formula factor grid and against published EIOPA 2022 stress
results for matched portfolios; sensitivity: ±20% on λ climate multipliers must move PML₂₀₀
sub-linearly (concavity check); stability: seed-invariance of Monte Carlo at 100k years (<1% s.e.).

**8.6 Limitations & model risk.** Poisson–lognormal ignores clustering (serial hurricanes) —
mitigate with negative-binomial frequency as conservative fallback; climate multipliers are
scenario-conditional trends applied to a stationary catalogue, not dynamical downscaling; market
and NatCat shocks are combined without estimated dependence (assume perfect correlation as the
conservative bound); litigation/casualty channel remains expert-judgement scaled and should be
capped at reserve-adequacy materiality until a liability model (see litigation modules) exists.
