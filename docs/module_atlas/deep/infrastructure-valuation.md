## 7 · Methodology Deep Dive

This module is more genuinely computational than most of its infrastructure siblings: it implements a
real (if simplified) stranding-probability function, a UK RAB regulatory model, a greenfield DCF, and
an ESG-greenium view. The guide's `NAV_climate` formula is only loosely reflected — the code applies
a **stranding-probability haircut to book value**, not a year-by-year discounted climate-adjusted cash
flow. Utility and project data are curated constants; energy-asset book values and several DCF inputs
are `sr()`-seeded.

### 7.1 What the module computes

**Stranding probability** (the analytic core, with source-cited inline comments):

```js
strandingProb(carbonIntensity, cp2030, remainingLife, policyShock=1.0):
  carbonCostRatio   = (carbonIntensity × cp2030) / 1000
  timeDiscountFactor= max(0, 1 − remainingLife/30)          // shorter life ⇒ nearer stranding
  demandSubstitution= min(0.12, carbonIntensity × 0.08)
  base              = carbonCostRatio×0.8 + timeDiscountFactor×0.15 + demandSubstitution
  return min(0.95, base × policyShock)
```

**Stranded value** and portfolio roll-up:

```js
npvHaircut  = prob × 0.85                     // 85% of value at risk if fully stranded
climateValue= bookValue × (1 − npvHaircut)
totalStranded = Σ (bookValue − climateValue)
weightedProb  = Σ prob×bookValue / Σ bookValue
```

**RAB model** (regulated utilities):

```js
allowedRev = editRab × allowedReturn%
regGap     = (actualROCE% − allowedReturn%) × editRab      // over/under-earning vs regulator
rabGrowth  = editRab × (1 + 0.03 + sr(...)×0.04)^i          // 5-period RAB accretion
```

**Greenfield DCF** (project finance):

```js
debt=capex×(1−equity%); annualRev=capex×(0.18+sr×0.12); annualOpex=0.35×annualRev
annualDsvc=debt×0.07;    fcf=annualRev−annualOpex−annualDsvc
irr = targetIRR × (1 − constRisk×0.008)                     // heuristic, NOT a solved IRR
dscr= (annualRev−annualOpex)/max(annualDsvc, 0.001)
npv = Σ_{y=1..25} fcf/1.08^y − equity
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Stranding weights | carbonCost 0.8 / time 0.15 / demand 0.12 cap | Author heuristic; inline-cited to NGFS Phase 4 taxonomy |
| Carbon-cost normaliser | ÷1000 | Scales tCO₂ intensity × $/t to a 0–1 ratio |
| Life horizon | 30 yr | `timeDiscountFactor` denominator |
| Prob cap | 0.95 | Keeps a valid probability |
| NPV haircut fraction | 0.85 | Share of book value lost if stranded |
| `CP_SCENARIOS` carbon prices | NZ2050 250/600/1200; Below2C 150/350/800; …; CurrentPolicy 25/60/120 ($/t 2030/40/50) | NGFS-style scenario ladder; `policyShock` 1.35→0.80 |
| `ENERGY_ASSETS.carbonIntensity` | 0.05–0.88 tCO₂/unit | Curated per asset (coal ~0.85, gas ~0.40, transmission ~0.08) |
| Book values, remaining life | `sr()`-seeded (200–2000 £M; 5–40 yr) | Synthetic |
| DCF revenue yield | `0.18 + sr×0.12` of capex | `sr()`-seeded |
| Debt service rate | 7% of debt | Hard-coded |
| Discount rate | 8% (`1.08^y`) | Hard-coded project WACC |
| RAB values (rab/wacc/allowedReturn/actualROCE) | curated | Real UK utilities (National Grid, Thames Water, Heathrow…) |
| `GREENIUM_DATA` | −45 to +25 bps | Curated by asset type (green assets negative spread, fossil positive) |

### 7.3 Calculation walkthrough

1. **Stranded tab:** pick a scenario → `strandingProb` per energy asset using its carbon intensity,
   the scenario's 2030 carbon price, remaining life, and policy-shock multiplier → haircut → climate
   value → sort by probability; portfolio sums stranded value and builds a 2025–2050 cumulative
   timeline keyed on each asset's `strandYear`.
2. **RAB tab:** select a utility → allowed revenue, regulatory gap (ROCE vs allowed), 5-period RAB
   growth path.
3. **Greenfield tab:** set capex/equity/target IRR/construction risk → DCF returns IRR (heuristic),
   equity IRR, DSCR, payback, 25-year NPV @8%, and a 6-factor tornado.
4. **Greenium tab:** plots curated greenium vs ESG score and GHG intensity.

### 7.4 Worked example (Drax Coal Units, NZ2050)

`carbonIntensity = 0.85`, `cp2030 = 250`, `remainingLife = 12`, `policyShock = 1.35`, `bookValue ≈ £1,600M`:

| Step | Computation | Result |
|---|---|---|
| carbonCostRatio | 0.85 × 250 / 1000 | 0.2125 |
| timeDiscountFactor | max(0, 1 − 12/30) | 0.60 |
| demandSubstitution | min(0.12, 0.85×0.08 = 0.068) | 0.068 |
| base | 0.2125×0.8 + 0.60×0.15 + 0.068 | 0.328 |
| prob (× policyShock, cap 0.95) | 0.328 × 1.35 | **0.443 → 44.3%** |
| npvHaircut | 0.443 × 0.85 | **37.7%** |
| climateValue | 1600 × (1 − 0.377) | **£997M** |
| stranded value | 1600 − 997 | **£603M** |
| strandYear (0.4<prob≤0.7) | 2035 + floor((1−0.443)×15) | **2043** |

### 7.5 Companion analytics on the page

- **Stranded portfolio** timeline (cumulative stranded value 2025–2050) and weighted stranding prob.
- **DCF tornado** — capex/revenue/WACC sensitivity ranked by |impact|.
- **ESG greenium** — spread vs ESG-score / GHG-intensity scatter illustrating the pricing wedge.

### 7.6 Data provenance & limitations

- RAB utility parameters and project pipeline are **curated realistic constants**; energy-asset book
  values, DCF revenue yield, and RAB growth noise are **`sr()`-seeded** (`sr(s)=frac(sin(s+1)×10⁴)`).
- Stranding probability is a transparent heuristic weighting, **not** a structural/reduced-form default
  model; the 85% haircut is a fixed loss-given-stranding, not asset-specific.
- Greenfield `irr = targetIRR × (1 − constRisk×0.008)` is a scaling of the *target*, not a solved
  internal rate of return; only the NPV loop is a genuine discounting.
- Stranding "NAV haircut" is applied to book value in one step, unlike the guide's year-by-year
  `NAV_climate = Σ CF_t(1−strandedProb_t)/(1+r)^t`.

**Framework alignment:** *NGFS Phase IV scenarios* — the carbon-price ladder and policy-shock
multipliers mirror NGFS orderly/disorderly/hot-house logic (aggressive NZ2050 shock 1.35 vs benign
Current Policy 0.80). *IEA NZE stranded-asset analysis* — the carbon-intensity → stranding mapping
approximates IEA's fossil-asset viability screening. *EDHECinfra* — cited for infra valuation but the
code uses simple DCF, not EDHECinfra's calibrated risk-factor NAV. *TCFD physical/transition* — the
stranded-value disclosure shape aligns with TCFD transition-risk reporting.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible **climate-adjusted NAV and stranding-loss distribution** for regulated and
merchant infrastructure assets, replacing the single-step book-value haircut with a scenario-conditioned
discounted cash-flow model and a probabilistic stranding curve.

### 8.2 Conceptual approach
Combine (a) a **structural stranding model** — asset becomes uneconomic when climate-adjusted marginal
cost exceeds market clearing price, per IEA NZE viability analysis and Moody's/Carbon-Tracker stranded-
asset work — with (b) a **year-by-year NGFS-conditioned DCF**, mirroring EDHECinfra's calibrated
infrastructure NAV and MSCI Climate VaR repricing.

### 8.3 Mathematical specification
For asset *a*, year *t*, scenario *s*:

```
MC_a(t,s)   = OpMC_a + CarbonIntensity_a · CarbonPrice_s(t)            // climate-adjusted marginal cost
StrandProb_a(t,s) = Φ( (MC_a(t,s) − Price_s(t)) / σ_price )            // structural, Φ = normal CDF
CF_a(t,s)   = Rev_a(t,s)·(1 − StrandProb_a(t,s)) − Opex_a(t) − Carbon_a(t,s) − Capex_a(t)
NAV_a(s)    = Σ_{t=1}^H CF_a(t,s) / (1 + r_a + φ_phys,a)^t             // physical-risk premium φ
ClimateVaR_a= NAV_a(base) − Percentile_5( {NAV_a(s)} over scenario draws )
DSCR_a(t)   = (Rev_a(t)−Opex_a(t)) / DebtService_a(t)   ;  IRR: solve Σ CF/(1+irr)^t = 0 (Newton)
```

| Parameter | Source |
|---|---|
| Carbon price paths `CarbonPrice_s(t)` | NGFS Phase IV; IEA WEO/NZE |
| Power/commodity price `Price_s(t)` | IEA WEO; national market curves |
| Price volatility `σ_price` | Historical wholesale price vol |
| Asset carbon intensity | Trucost / plant-level data |
| Physical premium `φ_phys` | Swiss Re sigma; hazard exposure by geography |
| Discount rate `r_a` | RAB WACC (regulated) or project WACC |

### 8.4 Data requirements
Asset economics (opex, capex schedule, output, carbon intensity, debt terms), scenario price/carbon
paths, geography for physical premium. Platform has: NGFS-style scenario ladder, curated RAB/WACC,
carbon intensities. Needs: market price curves and IRR solver (currently heuristic).

### 8.5 Validation & benchmarking plan
Reconcile NAV and Climate VaR against EDHECinfra / MSCI Climate VaR for overlapping assets; backtest
stranding calls against historical UK coal/gas retirements (Drax, Fiddlers Ferry); sensitivity of NAV
to carbon path and `σ_price`; verify IRR solver against a spreadsheet DCF.

### 8.6 Limitations & model risk
Structural stranding is sensitive to the price-volatility assumption; single-factor carbon price
ignores basis and regional ETS differences; the 85% loss-given-stranding should be asset-specific
(salvage/repurposing value). Fallback: report NAV as a scenario range and stranding as a probability
band with explicit horizon.
