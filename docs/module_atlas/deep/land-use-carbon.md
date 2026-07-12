## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises a five-pool IPCC LULUCF stock-change model
> (`ΔC = (Cₜ − Cₜ₋₁) × CF × 44/12` across above-ground biomass, below-ground biomass, dead wood,
> litter and soil organic carbon, with Tier-2/Tier-3 biomass expansion factors). **The code does not
> implement pool-by-pool stock change or the 44/12 conversion.** It generates 40 synthetic parcels
> with a single `carbonStock` number split only two ways (soil 30–50%, biomass = remainder), and
> issues credits by a flat heuristic `annualCredits = eligibleArea × annualFlux × 0.7`. IPCC tier and
> methodology are decorative labels drawn at random. Sections below document the code.

### 7.1 What the module computes

For 40 parcels (`genParcels(40)`), each field is a PRNG draw `sr(s)=frac(sin(s+1)×10⁴)`:

```js
landType   = LAND_TYPES[floor(s1·8)]           // Cropland/Grassland/Forest/Wetland/Urban/Degraded/Peatland/Mangrove
area       = floor(50 + s3·9950)               // ha
carbonStock= { Forest:150+s4·350, Peatland:500+s4·1500, Mangrove:300+s4·700,
               Wetland:100+s4·400, Grassland:30+s4·70, Cropland:20+s4·60,
               Degraded:5+s4·25, else:2+s4·15 }        // tC/ha — land-type-conditioned band
annualFlux = Forest|Mangrove|Wetland: 2+s5·8;  Peatland: (s5>0.4? +3..8 : −2..−10);
             Degraded: −1..−6;  else: 0.5..3.5           // tC/ha/yr (sign = sink/source)
```

The credit engine (Carbon Credit Potential tab):

```js
eligibleArea    = floor(area × (0.3 + sr·0.6))          // 30–90% of parcel eligible
annualCredits   = floor(eligibleArea × annualFlux × 0.7)  // 0.7 = combined buffer/uncertainty haircut
permanenceBuffer= floor(10 + sr·20)   %                 // 10–30% buffer pool
leakageDeduction= floor(5  + sr·15)   %                 // 5–20%
creditPrice     = floor(8  + sr·52)   $/tCO₂            // $8–60
projectedRevenue= floor(annualCredits × creditPrice / 1000)   // $ thousands
soilCarbon      = floor(carbonStock×0.3 + sr·carbonStock×0.2)  // 30–50% of stock
biomassCarbon   = carbonStock − soilCarbon
yearlyStock[yi] = floor(carbonStock + annualFlux·yi + sr·20)   // 8-year projection
```

Note `annualCredits` uses **flux in tC** but is labelled tCO₂ credits — the guide's 44/12 (=3.667)
carbon→CO₂ conversion is **not applied**, so credits are understated ~3.7× relative to a correct
IPCC accounting. The `0.7` factor is the only deduction actually applied to issuance (the separately
computed `permanenceBuffer`/`leakageDeduction` are displayed but not subtracted from `annualCredits`).

### 7.2 Parameterisation / scoring rubric

| Constant | Values | Provenance |
|---|---|---|
| `LAND_TYPES` (8) | Cropland…Mangrove | Hard-coded; IPCC land categories |
| `carbonStock` bands per type | Forest 150–500, Peatland 500–2000, Mangrove 300–1000 tC/ha | **Plausible IPCC-consistent magnitudes** but PRNG-drawn within band, not from `EMISSION_FACTORS` (imported but unused for stock) |
| `IPCC_TIERS` | Tier 1/2/3 | Label only — assigned `IPCC_TIERS[floor(sr·3)]`, no tier-specific maths |
| `METHODOLOGIES` (8) | VCS VM0007, VM0042, Gold Standard AR, CDM AR-AM, Puro.earth Biochar, ACR IFM, Plan Vivo, REDD+ Jurisdictional | Real registry methodology names; assigned at random |
| Issuance haircut | `×0.7` | Synthetic combined buffer proxy |
| Permanence buffer | 10–30% | Verra buffer-pool range (guide cites 10–40%) |

### 7.3 Calculation walkthrough

`PARCELS` built once → filtered by land type/country/methodology/search → four tabs aggregate:
- **Land Carbon Inventory** — `totalStock = Σ carbonStock×area`, avg stock, net-sink %.
- **LULUCF Accounting** — `conversionMatrix` (prior→current land-use counts), tier breakdown,
  `conversionEmissions` (50–550 tC where prior≠current land type).
- **Nature-Based Solutions** — 8 NBS types with PRNG seq rate (2–14 tCO₂/ha/yr), cost/ha, cost/tCO₂.
- **Carbon Credit Potential** — `totalCredits`, `totalRevenue`, methodology & land-type breakdowns.

### 7.4 Worked example (a Forest parcel)

Suppose parcel i gives `landType=Forest, area=4000 ha, carbonStock=300 tC/ha, annualFlux=6 tC/ha/yr,
creditPrice=$30`, with `eligibleArea = floor(4000×0.6)=2400 ha`:

| Step | Formula | Value |
|---|---|---|
| Annual credits | 2400 × 6 × 0.7 | **10,080** (labelled tCO₂, actually tC) |
| Correct IPCC credits | 10,080 × 44/12 | 36,960 tCO₂ (**not** computed by code) |
| Projected revenue | 10,080 × 30 / 1000 | **$302k** |
| Soil carbon | 300×0.3 + sr×300×0.2 (say sr=0.5) | 90 + 30 = **120 tC/ha** |
| Biomass carbon | 300 − 120 | **180 tC/ha** |
| Total stock | 300 × 4000 | **1.2 MtC** |

The 3.7× understatement of issued credits (missing 44/12) is the headline methodological gap.

### 7.5 Data provenance & limitations

- **All 40 parcels are synthetic** (`sr()` PRNG). Land-type carbon-stock bands and NBS rates are
  IPCC-plausible but not sourced from the imported `EMISSION_FACTORS` reference table.
- **No true five-pool ΔC accounting**, no Tier-2/3 biomass expansion factors, no 44/12 conversion —
  credits are a flat `flux × area × 0.7`. Permanence and leakage are shown but not deducted.
- IPCC tier and registry methodology are random labels with no effect on numbers.

**Framework alignment:** IPCC 2006 Guidelines Vol. 4 AFOLU — the module names the five pools and
uses land-category stock bands, but implements only a lumped stock (soil/biomass split), not the
gain-loss or stock-difference methods. Verra VM0007 (REDD+) / VM0042 (ALM) — methodology labels only.
GHG Protocol Land Sector & Removals (2022) — permanence/leakage vocabulary surfaced, not enforced.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (Credits are a synthetic `flux×area×0.7`
with no 44/12 conversion and no pool accounting.)

### 8.1 Purpose & scope
A production LULUCF carbon-accounting model that issues defensible removal/avoidance credits per
land parcel across all five IPCC pools, for REDD+ / ARR / IFM project developers and Scope-3 land
attribution. Coverage: forest, wetland, peatland, mangrove, grassland, cropland parcels.

### 8.2 Conceptual approach
IPCC stock-difference (or gain-loss) accounting with registry buffer/leakage deductions. Benchmarks:
IPCC 2006 Vol. 4 Tier-2/3 methods; Verra VCS VM0007/VM0033 crediting; Trucost/S&P land-use factors
for portfolio attribution; ESA CCI Biomass + ISRIC SoilGrids for spatial calibration.

### 8.3 Mathematical specification

```
For each pool p ∈ {AGB, BGB, deadwood, litter, SOC}:
  ΔC_p = (C_{p,t} − C_{p,t−1}) × Area                  [tC]
Net_ΔC = Σ_p ΔC_p
Gross_removals_tCO2 = max(0, Net_ΔC) × 44/12           ← the missing conversion
Issuable = Gross_removals × (1 − buffer%) × (1 − leakage%) × (1 − uncertainty_deduction%)
BGB = AGB × R (root:shoot);  SOC from IPCC reference SOC × F_LU × F_MG × F_I
Revenue = Issuable × credit_price;  NPV = Σ_t Revenue_t/(1+r)^t − dev_cost
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon fraction | CF ≈ 0.47 | IPCC default |
| C→CO₂ | 44/12 = 3.667 | Stoichiometric |
| Root:shoot ratio | R | IPCC 2006 Table 4.4 by ecozone |
| SOC land-use/mgmt/input factors | F_LU,F_MG,F_I | IPCC 2006 Vol.4 Ch.5 |
| Buffer pool % | 10–40% | Verra non-permanence risk tool |
| Leakage % | 5–20% | Methodology-specific (VM0007) |

### 8.4 Data requirements
- AGB density map (ESA CCI Biomass / national forest inventory), SOC (ISRIC SoilGrids), land-use
  change layers (Hansen/GFW), ecozone → root:shoot, registry buffer tool inputs.
- Platform already has `EMISSION_FACTORS` (`data/referenceData`) — wire it into stock/flux instead
  of PRNG bands.

### 8.5 Validation & benchmarking plan
- Reconcile issued credits against Verra registry issuances for comparable projects.
- Backtest stock projections vs remote-sensed biomass change; report bias.
- Sensitivity on buffer/leakage and SOC factors; Monte-Carlo the uncertainty deduction.

### 8.6 Limitations & model risk
- Greatest risk: baseline/additionality gaming and non-permanence (reversal). Enforce dynamic buffer.
- Tier-1 defaults carry wide uncertainty; require Tier-2 EFs before high-value issuance.
- Peatland can be a large source — sign errors in flux must be caught by mass-balance checks.
