## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The module correctly documents 4 real SBTi target-setting
> methodologies (`METHODS`, with accurate formulas — Absolute Contraction's 4.2%/yr minimum linear
> rate for 1.5C, the SDA convergence formula, Temperature Rating, Portfolio Coverage) and ships
> genuinely well-sourced reference data (`SECTOR_PATHS` — 10 sectors' real IEA NZE/MPP/GCCA/ICAO
> LTAG/IMO/CRREM/IAI/CEPI pathway intensities; `CARBON_BUDGETS` — real IPCC AR6 WG1 remaining
> carbon budget figures). **But no company's individual near-term/long-term target is actually
> computed via any of the 4 documented methods.** Every company's `nearTermS12`, `nearTermS3`,
> `longTermS3`, `scope1/2/3`, and `tempScore` are independent `sr()`-seeded random draws — the SDA
> convergence formula and Absolute Contraction linear-rate formula shown in the `METHODS` table are
> never applied to derive them.

### 7.1 What the module computes

**Company-level (synthetic, despite real company names via `SECURITY_UNIVERSE`):**
```
scope1  = 50,000 + sr(base+5) x 9,950,000
scope2  = 20,000 + sr(base+7) x 2,000,000
scope3  = scope1 x 2 + sr(base+9) x scope1 x 5
nearTermS12 = 25 + sr(base+11) x 30           // 25-55% by 2030 -- NOT derived from SECTOR_PATHS
nearTermS3  = 10 + sr(base+13) x 30
longTermS3  = 60 + sr(base+15) x 10           // ~67% per NZ Standard, hard-coded band
tempScore   = 1.3 + sr(base+17) x 2.0          // implied temperature, 1.3-3.3C
onTrack     = currentReduction >= (nearTermS12 x (2026-baseYear)/(2030-baseYear)) x 0.85
```
**Portfolio fair-share carbon budget (real, genuinely computed):**
```
totalPortEmissions = Sum(COMPANIES[i].totalEmissions)
globalEmissions     = 40e9 tCO2e/yr                          // hard-coded global annual estimate
portfolioShare       = totalPortEmissions / globalEmissions
portfolioBudget      = remainingGt x 1e9 x portfolioShare     // company/portfolio's "fair share" of the remaining global budget
```

### 7.2 Parameterisation

| Reference table | Content | Provenance |
|---|---|---|
| `CARBON_BUDGETS` (6 rows) | 1.5C@50%: 400Gt remaining, 1.5C@67%: 300Gt, 2C@50%: 1,150Gt, 2C@67%: 900Gt, 2.5C@50%: 2,300Gt — all cited `source: 'IPCC AR6 WG1'` | **Real, correctly cited IPCC AR6 WG1** remaining carbon budget figures (broadly matching AR6 Table SPM.2, which reports ~500Gt for 1.5C/50% and ~1,150Gt for 2C/50% from Jan 2020 — the module's figures are close approximations of the actual published table) |
| `SECTOR_PATHS` (10 sectors, 61 rows incl. milestones) | Power Generation 450→138 gCO2/kWh by 2030 (IEA NZE), Steel 1.85→1.18 tCO2/t (IEA NZE+MPP), Cement 0.61→0.42 (IEA NZE+GCCA), Aviation 90→72 gCO2/RPK (IEA NZE+ICAO LTAG), Shipping (IMO GHG Strategy), Buildings (IEA NZE+CRREM), Aluminium (IAI Roadmap), Pulp & Paper (CEPI Roadmap) | **Real, well-sourced sector decarbonisation pathway intensities**, correctly attributed to the actual industry-body roadmaps (IEA Net Zero Emissions scenario, Mission Possible Partnership, Global Cement and Concrete Association, ICAO Long-Term Aspirational Goal, IMO GHG Strategy, CRREM) |
| `METHODS` (4 rows) | Absolute Contraction (4.2%/yr min for 1.5C), SDA (`Target Intensity = Current + (Benchmark-Current) x (t/T)`), Temperature Rating, Portfolio Coverage | **Correct, real SBTi Criteria v5.1 formulas** — genuinely accurate methodology documentation |
| `COMPANIES` roster | 80 real equities filtered from `SECURITY_UNIVERSE` | Real company universe (not `sr()`-generated names), but each company's emissions/target fields are synthetic as shown in §7.1 |
| `globalEmissions` | 40 GtCO2e/yr | Reasonable order-of-magnitude approximation (real global GHG emissions ~53-57 GtCO2e/yr including all gases and LULUCF; 40Gt is closer to CO2-only, so this likely understates the true denominator by ~25-30%) |

### 7.3 Calculation walkthrough

1. **Sector pathways tab** correctly plots each sector's real IEA/MPP/GCCA/ICAO/IMO/CRREM/IAI/CEPI
   intensity trajectory from 2020 base to 2030/2050 targets — genuine reference data, no PRNG.
2. **Target-setting tab**: for each of the 80 real companies, `nearTermS12`/`nearTermS3` are drawn
   independently per §7.1 — **the SDA formula shown in `METHODS` is never invoked here**, so a
   Power-sector company's near-term target bears no relationship to the Power Generation sector's
   real 450→138 gCO2/kWh convergence pathway shown two tabs over.
3. **FLAG tab** (`FLAG_COMMODITIES`, 9 rows: commodity base/target2030/flagRate/deforestation
   target/land-use scope) follows the same pattern — plausible commodity-level reference structure,
   individual company FLAG exposure flagged via `sr()`.
4. **Carbon budget tab**: `portfolioBudget` (§7.1) is a genuinely computed **fair-share allocation**
   — the one place in the module where a company/portfolio-level number is derived through a real
   formula (global-budget-times-emissions-share) rather than fabricated outright, though the
   allocation is flat/global rather than sector-weighted as a rigorous SDA-style budget would
   require.

### 7.4 Worked example

Portfolio with `totalPortEmissions = 850,000,000 tCO2e` (aggregated Scope 1+2+3 across the 80
companies), evaluating the 1.5C/50%-probability budget (`remainingGt=400`):
```
portfolioShare  = 850,000,000 / 40,000,000,000 = 0.02125   (2.125% of global emissions)
portfolioBudget = 400 x 1e9 x 0.02125 = 8,500,000,000 tCO2e   (8.5 GtCO2e "fair share")
```
This tells the portfolio manager: at the current portfolio-wide emissions run-rate, the portfolio's
1.5C-consistent fair share of the remaining global carbon budget would be exhausted in
`8.5Gt / 0.85Gt/yr ≈ 10 years` from Jan 2020 (i.e. around 2030) — a genuinely useful, correctly
derived headline figure.

### 7.5 Data provenance & limitations

- `CARBON_BUDGETS`, `SECTOR_PATHS`, and `METHODS` are the module's strongest content: real,
  correctly-cited IPCC AR6 / IEA NZE / sector-body roadmap data and formulas.
- Individual company target/emissions fields are synthetic and **do not apply** the documented SDA
  or Absolute Contraction formulas — a company's displayed "near-term target %" cannot be traced
  back to its sector's real convergence pathway.
- `globalEmissions=40Gt` likely understates real total GHG emissions (~53-57Gt including all gases/
  LULUCF), which would overstate `portfolioShare` and thus overstate `portfolioBudget` allocations
  if global emissions figures are corrected to the fuller scope.
- FLAG (Forest, Land, Agriculture) commodity exposure is flagged per company via PRNG, not from
  actual sector/commodity-exposure classification data.

**Framework alignment:** SBTi Corporate Net-Zero Standard v1.2 and Criteria v5.1 (methodology
formulas correctly documented) · SBTi Sectoral Decarbonisation Approach (correctly documented
formula, not applied at the company level) · IPCC AR6 WG1 carbon budgets (correctly cited and used
in the fair-share calculation) · IEA Net Zero Emissions scenario / MPP / GCCA / ICAO LTAG / IMO GHG
Strategy / CRREM / IAI / CEPI sector roadmaps (correctly reproduced as reference pathways, not
linked to individual company targets) · SBTi FLAG Guidance (commodity structure correct, exposure
assignment synthetic).
