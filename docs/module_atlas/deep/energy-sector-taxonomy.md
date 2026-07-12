## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide frames this as an **EU Taxonomy alignment** engine —
> `TAS = Σ(Exposure×Aligned)/ΣExposure`, screening power assets against the <100 gCO₂e/kWh lifecycle
> substantial-contribution threshold, the <270 gCO₂e/kWh transitional-gas rule, DNSH hazard checks and
> nuclear TSO criteria. **None of that screening exists in code.** No asset carries a lifecycle GHG
> intensity that is compared to 100/270/550 thresholds; `alignmentPct` is a **synthetic `sr()` draw**
> (18–78% for producers), and "Portfolio Alignment vs NZE" is just its mean. What the module *does*
> contain is a set of genuine energy-finance engines — **LCOE via capital-recovery factor, Wright's-law
> learning curves, NPV/IRR, a merit-order dispatch, MACC** — plus real NGFS/IRENA/NZE reference data.
> Those are documented in §7; the missing taxonomy-alignment model is specified in §8.

### 7.1 What the module computes

**Genuine finance/engineering engines:**

1. **LCOE** (`calcLcoe`) — real levelised-cost formula with a capital-recovery-factor annuity:
   ```
   CRF(r,n) = r·(1+r)^n / ((1+r)^n − 1)
   annualized = capex·CRF + opexFixed
   generation = 8760 · capacityFactor         (kWh/kW·yr)
   energyCost = annualized / generation × 1000      ($/MWh)
   fuelCost   = fuelPrice / efficiency
   LCOE_total = energyCost + opexVar + fuelCost
   ```
2. **Wright's-law learning curves** — the learning exponent is derived correctly from the learning
   rate:
   ```
   b = −ln(1 − lr) / ln(2)
   cost_t = cost0 × (cum_t / cum0)^(−b)
   ```
   e.g. Li-ion `lr=0.16` → `b = −ln(0.84)/ln(2) = 0.251`; cost falls 16% per doubling of cumulative
   capacity.
3. **NPV / IRR** — `npv = Σ cf_t/(1+r)^t`; IRR by 80-iteration bisection on [−0.95, 2.0].
4. **Merit-order dispatch** and **MACC** (marginal-abatement cost curve) tables.

**Synthetic taxonomy layer:**
```js
OG_PRODUCERS[i].alignmentPct = round(18 + sr(i·13+5)·60)   // 18–78%, RANDOM
portfolioAlignment = round( Σ alignmentPct / n )
avoidedEmissionsMt = round(1820 + portfolioAlignment·12)
ngfsOrderlyAlign   = round(activeScenario.renewableShare2050 × (1 − transitionShift·0.03))
transitionPlanQuality = 68 + transitionShift·1.8
```

### 7.2 Parameterisation / scoring rubric

| Object | Source | Real vs synthetic |
|---|---|---|
| `NZE_MILESTONES` (20) | IEA NZE 2050 milestones (2025–2050) w/ status + `gap` | Real milestones; `gap` editorial |
| `NGFS_SCENARIOS` (8) | carbon price 2030/2050, GDP impact, renewable share, stranded $B | Realistic NGFS-style values (hand-authored) |
| `IRENA_TARGETS` | solar/wind/hydro/geo GW by region | Structure real; **GW values `sr()`-random** |
| `TECH_PARAMS` (11) | capex, opex, fuelPrice, efficiency, cf, life | LCOE inputs — realistic |
| `LEARNING_RATES` (8) | lr, cost0, cum0…cum2050 | e.g. Li-ion lr 0.16 (real learning-rate literature) |
| `alignmentPct` | `sr()` 18–78% | **synthetic — not a taxonomy screen** |
| SC thresholds (100/270/550 gCO₂/kWh) | guide only | **not present in code** |

The taxonomy substantial-contribution thresholds the guide describes (Delegated Reg 2021/2139: power
<100 gCO₂e/kWh lifecycle; gas <270 gCO₂/kWh direct AND <550 kg/kW 20-yr average; nuclear CDA
2022/1214) appear nowhere in the computation.

### 7.3 Calculation walkthrough

The Overview KPIs read: `portfolioAlignment` (mean of random `alignmentPct`), `irenaCoverage` (sum of
IRENA solar+wind targets), `ngfsOrderlyAlign` (scenario renewable share × transition-shift factor),
`sbtiDecarb` (mean steel-plant `alignmentPct`). The LCOE/learning/dispatch tabs run the real engines
above on `TECH_PARAMS` and `LEARNING_RATES` with a user WACC slider. So the *transition-economics*
half is quantitatively sound; the *taxonomy-alignment* half is a random display layer.

### 7.4 Worked example (real LCOE engine)

Take a solar tech with `capex = $1,000/kW`, `opexFixed = $15/kW·yr`, `opexVar = $0`, `fuelPrice = 0`,
`cf = 0.25`, `life = 30`, at `wacc = 7%`:
```
CRF = 0.07·1.07^30 / (1.07^30 − 1) = 0.07·7.612 / 6.612 = 0.0806
annualized = 1000·0.0806 + 15 = $95.6/kW·yr
generation = 8760·0.25 = 2,190 kWh/kW·yr
energyCost = 95.6 / 2190 × 1000 = $43.6/MWh
LCOE = 43.6 + 0 + 0 = $43.6/MWh
```
This is a correct utility-scale-solar LCOE — the engine works. By contrast, a producer's headline
`alignmentPct` (say 54%) is simply `round(18 + sr(seed)·60)` with no relation to any emissions
threshold.

### 7.5 Companion analytics

- **Learning-curve projections** to 2030/2040/2050 via Wright's law (real).
- **Merit-order dispatch** (`DISPATCH_STACK` by marginal cost) and **MACC** (`MACC_MEASURES` cost vs
  abatement) — real cost-curve constructions.
- **NZE milestone tracker** — status/gap filter by sector and year.
- **Stranded-asset / avoided-emissions KPIs** — driven off the synthetic `alignmentPct` and scenario
  `strandedAssetB`.

### 7.6 Data provenance & limitations

- **The taxonomy-alignment percentages are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`;
  IRENA regional GW targets are also `sr()`-random around realistic anchors.
- **The LCOE, learning-curve, NPV/IRR and dispatch engines are genuine** and correctly specified —
  these are the module's real analytical content.
- No lifecycle GHG intensity is stored or screened, so the module cannot actually determine EU
  Taxonomy substantial contribution / DNSH / transitional status despite its title.

**Framework alignment:** **EU Taxonomy Regulation 2020/852 + Delegated Reg 2021/2139** — the intended
basis: power activities substantially contribute if lifecycle intensity <100 gCO₂e/kWh; gas is a
time-limited *transitional* activity below 270 gCO₂/kWh direct (and 550 kg CO₂/kW 20-yr avg); nuclear
qualifies under the **Complementary Delegated Act 2022/1214** subject to JRC TSO safety/waste
criteria. The module names these but does not screen against them. **IEA NZE 2050** and **NGFS Phase
V** supply the milestone and scenario reference data; **Wright's law / experience curves** underpin
the (correctly implemented) learning-rate cost projections.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce an auditable EU Taxonomy alignment percentage per energy asset and an exposure-weighted
portfolio Taxonomy Alignment Score (TAS), replacing the current random `alignmentPct`. Scope: power
generation (Taxonomy activities 4.1–4.31), including transitional gas and nuclear.

### 8.2 Conceptual approach
Rules-based screening exactly per the Delegated Regulation technical screening criteria (TSC),
benchmarked to the **EU Taxonomy Compass** activity logic and to vendor implementations
(**MSCI/ISS ESG EU Taxonomy** solutions, **S&P Trucost taxonomy alignment**). Each asset passes three
gates — Substantial Contribution, Do-No-Significant-Harm, Minimum Safeguards — and alignment is the
turnover/capex share meeting all three.

### 8.3 Mathematical specification
Per asset a of technology τ:
```
SC(a) = 1 if  LCA_intensity(a) < threshold(τ)          // 100 gCO₂e/kWh (power),
                                                          gas: direct<270 AND 20yr<550 kg/kW
DNSH(a) = ∏_h  1[hazard_screen(a,h) passed]             // 6 objectives incl. climate adaptation
MS(a)  = 1[OECD MNE / UNGP safeguards met]
Aligned(a) = SC(a)·DNSH(a)·MS(a)
TAS = Σ_a Exposure_a · Aligned_a / Σ_a Exposure_a
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Power SC threshold | 100 gCO₂e/kWh | Del. Reg 2021/2139 Annex I |
| Gas transitional | 270 direct / 550 kg·kW⁻¹ | Del. Reg Annex I 4.29 |
| Nuclear TSC | JRC TSO criteria | CDA 2022/1214 |
| Lifecycle intensity | `LCA_intensity` | IPCC AR6 LCA, ecoinvent, plant EPDs |
| DNSH climate-adaptation hazards | `hazard_screen` | Appendix A physical-risk assessment (ND-GAIN/WRI) |

### 8.4 Data requirements
Per asset: technology, direct + lifecycle GHG intensity (gCO₂e/kWh), 20-yr average emissions (gas),
physical-hazard exposure for DNSH, minimum-safeguards attestation, and taxonomy turnover/capex
exposure. Sources: plant EPD/ecoinvent LCA, IPCC AR6 median LCA factors (free), WRI Aqueduct / ND-GAIN
for DNSH hazards (already in platform reference data), issuer taxonomy disclosures.

### 8.5 Validation & benchmarking plan
Reconcile asset-level SC verdicts against the EU Taxonomy Compass reference thresholds and against a
vendor alignment feed (MSCI/ISS) for a pilot portfolio. Sensitivity: vary LCA intensity ±20 gCO₂/kWh
around the 100 threshold and confirm alignment flips at the boundary, not smoothly. Backtest TAS
against issuers' published GAR/Taxonomy KPIs.

### 8.6 Limitations & model risk
Lifecycle intensity data is scarce and methodology-dependent (attributional vs consequential LCA);
gas 20-yr-average criterion needs forward fuel-switching commitments that are hard to verify. DNSH is
partly qualitative. Conservative fallback: assets lacking a verified LCA intensity are scored
**non-aligned** (SC=0), never defaulted to aligned, so data gaps understate rather than overstate TAS.
