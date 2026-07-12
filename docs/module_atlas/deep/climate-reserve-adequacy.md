## 7 · Methodology Deep Dive

### 7.1 What the module computes

`ClimateReserveAdequacyPage.jsx` (911 lines, EP-DC3) runs a genuinely actuarial — if
synthetically-seeded — reserving stack over 20 lines of business (LoBs): chain-ladder and
Bornhuetter-Ferguson IBNR, climate-loaded IBNR under 6 NGFS scenarios, discounted reserves, and a
Solvency II cost-of-capital risk margin. Core functions, quoted from code:

```js
calcChainLadderIBNR: paid = paidLossRatio/100 × premiumIncome
                     IBNR_CL = paid × CDF − paid                       // CDF = Π devFactors
calcBFIBNR:          unreportedPct = 1 / CDF
                     expUltimate   = premiumIncome × ultimateLossRatio/100
                     IBNR_BF = unreportedPct × expUltimate × (1 + climateDevFactor × SCEN_MULT)
calcClimateIBNR:     IBNR_climate = baseIBNR × (1 + climateDevFactor × SCEN_MULT)
calcDiscountedReserve: PV = baseIBNR / (1 + r)^(reportingLag/12)
calcSolvencyRiskMargin: RM = 0.06 × (0.15 × baseIBNR) × (reportingLag/12)   // CoC × SCR proxy × duration
addPct = (IBNR_climate − baseIBNR) / baseIBNR × 100                     // ≡ CRAR − 1, in %
```

These are the textbook mechanics: chain-ladder grosses paid losses to ultimate via the cumulative
development factor; BF blends an a-priori ultimate with the unreported fraction (Bornhuetter &
Ferguson 1972); the risk margin is Solvency II's 6% cost-of-capital rate applied to a proxy SCR.

### 7.2 Parameterisation

| Parameter | Value / range | Provenance |
|---|---|---|
| NGFS scenarios & multipliers | Net Zero 2050 ×1.05 · Delayed Transition ×1.12 · Divergent NZ ×1.09 · NDC ×1.18 · Current Policies ×1.28 · Fragmented World ×1.38 | Scenario names = NGFS Phase IV set; multipliers are synthetic demo values (ordering — hot-house worst for reserves — is NGFS-consistent) |
| `climateDevFactor` | 0.02–0.17 per LoB | `sr()`-seeded; the climate loading on development |
| Dev factors (7 per LoB) | 1.00–1.15 each | `sr()`-seeded age-to-age factors |
| `baseIBNR` | premium × (5–30%) | `sr()`-seeded |
| Cost-of-capital rate | 6% | Solvency II Delegated Reg. (EU) 2015/35 Art. 39 (real constant) |
| SCR proxy | 15% of base IBNR | synthetic demo value (real SCR comes from the standard formula reserve-risk factors) |
| Reserve percentiles 75/95/99.5 | baseIBNR × (1 + sr(...)×{0.15, 0.35, 0.60}) | random widths, **not** a fitted loss distribution; 99.5% echoes the Solvency II VaR level |
| Horizon scaling | `scale = 1 + (MULT−1)×(hi/2)` for 2025/2030/2040 | linear ramp: full multiplier reached at 2040 (hi=2) |

### 7.3 Calculation walkthrough

Filters (long-tail flag, adequacy-score min, cession min, search) → `filtered` LoB set → KPIs:
mean adequacy score, total climate IBNR at selected scenario, mean climate load (%), total PV at
the discount slider. Development-factor tab charts BF vs CL IBNR per LoB; Run-Off Triangle tab
shows the drill LoB's 8-period paid pattern and cumulative % of premium; discount sensitivity
recomputes total PV across rates 0–5% in 0.5% steps; Scenario Stress builds the 3-horizon ×
6-scenario reserve surface using the linear horizon ramp.

### 7.4 Worked example — one LoB under Current Policies (×1.28)

Take a LoB with `premiumIncome = 500`, `paidLossRatio = 60%`, `ultimateLossRatio = 92%`,
`CDF = 1.45`, `baseIBNR = 75`, `climateDevFactor = 0.10`, `reportingLag = 24 mo`, discount 2%:

| Step | Computation | Result |
|---|---|---|
| Chain-ladder IBNR | paid = 0.60×500 = 300; 300×1.45 − 300 | **135.0** |
| BF IBNR (base) | (1/1.45) × (500×0.92) = 0.6897×460 | 317.2 |
| BF IBNR (climate) | 317.2 × (1 + 0.10×1.28) | **357.8** |
| Climate IBNR | 75 × (1 + 0.10×1.28) | **84.6** (+12.8% = CRAR 1.128) |
| PV reserve | 75 / 1.02^(24/12) | **72.1** |
| Risk margin | 0.06 × (0.15×75) × 2 | **1.35** |
| 99.5th percentile | 75 × (1 + sr(id·31+3)×0.6) | 75–120 (random width) |

Note the BF figure dwarfs the "baseIBNR" because the two are generated independently — in real
reserving BF and CL estimates triangulate the *same* ultimate; here they are unreconciled
synthetic quantities.

### 7.5 Data provenance & limitations

- **All LoB financials are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`): premiums, loss ratios,
  development factors, climate loadings, cessions. LoB names are curated and climate-flavoured
  (Flood Re, Wildfire Reinsurance, Agricultural Index).
- The three IBNR methods are internally inconsistent by construction (independent seeds), so the
  BF-vs-CL comparison chart shows generator noise, not method divergence.
- Reserve percentiles are scaled draws, not quantiles of a bootstrapped (Mack/ODP) reserve
  distribution; there is no triangle-based variability estimate.
- The climate loading multiplies a *scalar* onto IBNR; a production approach would shock the
  age-to-age factors themselves (tail lengthening for litigation-driven climate claims) and
  re-run the triangle.
- Guide↔code: the guide's CRAR ratio and "rerun chain-ladder and BF under climate-adjusted
  development patterns" are implemented in stylised form (uplift % ≡ CRAR−1; the climate
  adjustment applies to the IBNR result, not the pattern). EIOPA/CBES numbers quoted in the guide
  appear nowhere in code. Minor divergence, not a structural mismatch.

**Framework alignment:** Bornhuetter–Ferguson (1972) & chain-ladder (Mack 1993 formalisation) —
implemented in simplified deterministic form · Solvency II (Directive 2009/138/EC; risk margin =
6% CoC on projected SCR — the 6% is faithfully used, the SCR is proxied) · NGFS Phase IV scenario
taxonomy (6 named scenarios incl. Fragmented World) · IFRS 17 (discounting of reserves at current
rates is the standard's requirement; the module's PV slider approximates it) · EIOPA 2022 climate
sensitivity / BoE CBES 2021 (guide-cited context for climate reserve uplifts of the order shown).

## 8 · Model Specification — Climate-Conditioned Stochastic Reserving

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give reserving actuaries and supervisors a defensible climate-adjusted reserve distribution (best
estimate + risk margin + percentiles) per LoB, replacing scalar multipliers and random
percentiles. Scope: P&C LoBs with ≥8 accident years of triangles; NGFS scenario conditioning.

### 8.2 Conceptual approach

Two-layer design: (1) **stochastic base reserving** — Mack chain-ladder or over-dispersed Poisson
bootstrap for the unconditional reserve distribution (England & Verrall 2002), the market-standard
approach embedded in ResQ/Arius and reviewed under Solvency II; (2) **climate conditioning** —
hazard-frequency scaling of future incremental losses per NGFS/RCP pathways, following the EIOPA
2022 climate sensitivity approach and BoE CBES 2021 general-insurance methodology (peril-level
frequency/severity uplifts applied to projected cash flows, not to the booked reserve).

### 8.3 Mathematical specification

```
Base:      f̂_j = Σ_i C_{i,j+1} / Σ_i C_{i,j}                # volume-weighted ATA factors
           R_i = C_{i,n} × (Π_{j≥n−i} f̂_j − 1)              # CL reserve per accident year
           Mack: MSE(R̂) per Mack (1993); or ODP bootstrap → full distribution {R^(b)}
Climate:   for future calendar year t, peril p:
           λ_p,t(s) = λ_p,0 × [1 + β_p × ΔH_p,t(s)]          # frequency scaling, scenario s
           Incremental loss X_{i,j,t} ← X_{i,j,t} × Σ_p w_p,LoB × λ_p,t(s)/λ_p,0
           R_i(s) = climate-scaled projection; CRAR_LoB(s) = E[R(s)] / E[R(base)]
Risk margin: RM = 6% × Σ_t SCR_res(t) / (1+r_t)^t ,  SCR_res(t) = σ_res × V(t) × 3
             σ_res from Solvency II standard-formula reserve-risk factors by LoB
Percentiles: q_75, q_95, q_99.5 read off the bootstrap distribution of R(s)
```

| Parameter | Calibration source |
|---|---|
| β_p hazard sensitivities | EIOPA (2022) climate sensitivity factors; BoE CBES peril uplift tables |
| ΔH_p,t hazard-change paths | NGFS Phase IV physical risk vars; IPCC AR6 regional hazard chapters |
| w_p,LoB peril weights | company cat-model output (RMS/Verisk) or EM-DAT peril mix by LoB/region |
| σ_res | Solvency II Delegated Reg. 2015/35 Annex — e.g. motor 9%, property 10%, liability 11% |
| r_t discount curve | EIOPA risk-free term structure (published monthly, free) |

### 8.4 Data requirements

Paid & incurred triangles by LoB (internal), premiums & a-priori loss ratios, peril mix per LoB,
scenario hazard paths (NGFS — free), EIOPA RFR curves (free). Platform reuse: NGFS scenario tables
in `reference_data`, EM-DAT seed data, existing `climate_stress_test_engine` scenario definitions.

### 8.5 Validation & benchmarking plan

Backtest base reserves vs actual run-off (actual-vs-expected by calendar year, one-year reserve
risk per Merz-Wüthrich); reconcile unconditional percentiles vs Mack analytic MSE; benchmark CRAR
by LoB against EIOPA 2022 published uplift ranges (+18–42% property RCP8.5/2050); scenario
monotonicity (Fragmented World ≥ Current Policies ≥ Net Zero reserve for property lines).

### 8.6 Limitations & model risk

Triangles embed historical climate — conditioning risks double-counting recent hazard trend
(de-trend calendar-year effects first); β_p for liability lines (climate litigation) is deeply
uncertain — hold as an explicit margin, not a modelled quantity; bootstrap understates tail
dependence across LoBs — aggregate with a t-copula or add an explicit correlation load;
conservative fallback: floor climate-conditioned reserves at the unconditional best estimate.
