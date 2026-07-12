## 7 · Methodology Deep Dive

Geothermal Project Finance (EP-DV2) structures a phased debt/equity project-finance model: debt
sizing, DSCR, equity IRR, a well-success probability composite, a 200-path Monte-Carlo IRR
distribution, and a dry-well contingency. The financial engineering is genuine; the Monte-Carlo
input variability uses the `sr()` PRNG. No guide↔code mismatch.

### 7.1 What the module computes

```js
annMwh         = powerMw * cf/100 * 8760;
revenueMyr     = annMwh * ppa / 1e6;
debtM          = capexM * debtPct/100;   equityM = capexM - debtM;
annDebtService = debtM*1e6*(debtRate/100)/(1 - (1+debtRate/100)^-tenor) / 1e6;  // level annuity
ebitda         = revenueMyr - opexMyr;
equityCashflows= [-equityM, ...30×(revenueMyr - opexMyr - annDebtService)];
equityIrr      = irr(equityCashflows);          // Newton-Raphson
projectNpv     = npv([-capexM, ...30×ebitda], wacc);
```

**Well-success probability** (composite of weighted risk factors):
```js
successProb = WELL_RISK_FACTORS.reduce((s,f) => s + f.base*f.weight, 0) / 100;
adj         = f.base * (wellSucc/75);           // rescale to slider success rate
expectedDryCost = capexM * 0.55 * (1 - p/100) * 0.4;   // dry-well write-off (55% is drilling share)
```

**Monte-Carlo** (200 paths):
```js
capexVar   = capexM   * (0.85 + sr(i*3)*0.30);   // ±15% capex
revenueVar = revenueMyr * (0.80 + sr(i*7)*0.40); // ±20% revenue
opexVar    = opexMyr  * (0.90 + sr(i*11)*0.20);  // ±10% opex
cf2        = [-equityVar, ...30×max(0, revenueVar - opexVar - dsVar)];
// distribution → sorted → P10/P50/P90 IRR + histogram (20 bins, −10% to +50%)
```

### 7.2 Parameterisation

| Dataset / constant | Value | Provenance |
|---|---|---|
| `WELL_RISK_FACTORS` | 6 rows (`weight, base, desc`) | Resource, drilling, permitting… composite |
| `FINANCING_STRUCTURES` | 5 rows (`debtPct, debtRate, tenor, minDscr, moody`) | Merchant/PPA/concessional term sheets |
| `RISK_CATEGORIES` | 7 rows (`prob, impact, color`) | Risk-register heat map |
| Drilling share of capex | 0.55 | ~55% of geothermal capex is wells (ESMAP) |
| Dry-cost multiplier | 0.4 | Fraction of drilling cost lost per dry well |
| MC capex band | ±15% | synthetic (`sr()`) |
| MC revenue band | ±20% | synthetic (`sr()`) |
| MC opex band | ±10% | synthetic (`sr()`) |
| Success-rate anchor | 75% | slider baseline well-success |

### 7.3 Calculation walkthrough

1. Sliders set capex, MW, CF, PPA, opex, debt %, debt rate, tenor, WACC, well-success.
2. Debt sized as capex × debt% ; level-payment annuity → annual debt service.
3. Equity cashflows = −equity then 30 years of (revenue − opex − debt service) → equity IRR.
4. `successProb` aggregates `WELL_RISK_FACTORS` (base × weight) → drilling-programme success.
5. `dsWaterfall` shows year-by-year debt service; `mcPaths` runs 200 stochastic scenarios →
   `mcHistogram` (20 bins) and P10/P50/P90 equity IRR.
6. Financing-structure comparison re-runs IRR under each term sheet (`adjIrr`).

### 7.4 Worked example (base case)

capexM $400M, 50 MW, CF 90%, PPA $80/MWh, opexM $18M, debt 65%, debtRate 7%, tenor 15, WACC 9%.

| Step | Computation | Result |
|---|---|---|
| Annual MWh | 50×0.90×8760 | 394,200 |
| Revenue | 394,200×80/1e6 | **$31.5M** |
| Debt | 400×0.65 | $260M |
| Equity | 400−260 | $140M |
| Debt service | 260·0.07/(1−1.07⁻¹⁵) | 260×0.10979 = **$28.5M/yr** |
| EBITDA | 31.5 − 18 | $13.5M |
| Equity CF (yr 1–15) | 31.5 − 18 − 28.5 | **−$15.0M** (negative — over-levered) |

This base case is over-leveraged (debt service exceeds EBITDA), so equity IRR would be deeply
negative — exactly the sizing tension the module surfaces: at $80 PPA and $18M opex the project
cannot support 65% debt at 7%. Lowering debt% or raising PPA restores positive equity cashflow. The
Monte-Carlo then shows the IRR distribution's downside (P10) driven by the ±20% revenue band.

### 7.5 Data provenance & limitations

- **Financial formulas (debt annuity, IRR, NPV, DSCR) are correct**; the term-sheet and risk-factor
  tables are curated benchmarks (ESMAP/IFC), not project-specific.
- **Monte-Carlo input variability is `sr()`-seeded** (±15/20/10% uniform bands), so the IRR
  distribution is a stylised uncertainty envelope, not a calibrated risk model.
- Well-success probability is a weighted-average composite, not a geostatistical resource assessment
  (no P10/P50/P90 flow-rate distribution as the guide's GeothermEx reference implies).
- Dry-well cost is a flat 0.55×0.4 heuristic, not a stochastic drilling-programme simulation.

**Framework alignment:** *World Bank ESMAP Geothermal Handbook* — phased exploration/development/
production capital structure and 30–50% drilling contingency. *IFC Scaling Geothermal / GGSP* —
concessional risk-sharing for exploration wells. *DSCR / project-finance annuity* — standard
level-payment debt sizing with `minDscr` covenant. *Moody's project-finance ratings* — the
`FINANCING_STRUCTURES` credit tiers reference Moody's-style bands.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The Monte-Carlo uses uniform `sr()` bands
and the success probability is a weighted average, so a production resource-and-finance risk model is
specified.

**8.1 Purpose & scope.** Size debt and quantify equity-IRR distribution for a geothermal project
conditioned on drilling/resource risk, to support lender DSCR covenants and GGSP grant sizing.

**8.2 Conceptual approach.** Two-stage: (i) geostatistical **resource Monte-Carlo** yielding a
P10/P50/P90 productive-capacity distribution (per GeothermEx/GNS practice); (ii) **project-finance
cashflow Monte-Carlo** conditioned on that capacity. Benchmarked against **World Bank ESMAP**
geothermal risk-mitigation frameworks and standard **project-finance DSCR** debt-sizing (Moody's
infrastructure methodology).

**8.3 Mathematical specification.**

```
FlowRate_w ~ Lognormal(μ,σ)                      (per-well productivity, P10=2, P50=8, P90=20 kg/s)
Capacity   = Σ_w f(FlowRate_w, enthalpy)          (aggregate MW from successful wells)
p_dry      = Beta(a,b)                            (dry-well probability, frontier 0.3–0.5)
Revenue_t  = Capacity·CF·8760·PPA_t
DebtSize   = min( LTV·Capex, PV(EBITDA)/minDSCR ) (DSCR-constrained sizing)
DebtService_t = annuity(DebtSize, r, tenor)
DSCR_t     = (Revenue_t − Opex_t) / DebtService_t   (covenant: ≥ minDSCR)
EquityIRR  = IRR( −Equity, {Revenue_t−Opex_t−DebtService_t} )
```

| Parameter | Calibration source |
|---|---|
| μ,σ (flow rate) | GeothermEx/GNS Science resource assessments |
| p_dry Beta | ESMAP dry-well statistics (30–50% frontier) |
| drilling share | 0.55 of capex (ESMAP) |
| minDSCR | 1.3–1.5 (Moody's geothermal PF) |
| GGSP grant | up to $1.5M/exploration well (IFC) |

**8.4 Data requirements.** Well test flow rates + enthalpy (project data); regional dry-well
frequencies (ESMAP); PPA price path (platform power-markets); WACC/debt terms. Platform holds IRENA
geothermal reference data.

**8.5 Validation & benchmarking.** Reconcile capacity P50 against as-built plant output; backtest DSCR
against realised project defaults; compare grant-adjusted IRR to IFC-supported project returns.

**8.6 Limitations & model risk.** Resource distributions are thin-data (few wells) — widen σ and flag;
dry-well events are correlated within a field (not independent); PPA and carbon-price paths dominate
long-dated equity value.
