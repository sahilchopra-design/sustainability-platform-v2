## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide titles this "Biodiversity & Integrated Carbon-Removal
> Suite" and describes *ecosystem-service co-benefit stacking* — TNFD LEAP scoring, SBTN targets,
> co-benefit premiums (10–40%/service), and `StackedValue = CarbonValue + Σ(EcoService × Premium)`.
> **None of that is in the code.** The page (header "BiCRS & Biomass CDR Hub", EP-BU3) implements a
> **biomass carbon-removal-and-storage** calculator, a BECCS pathway view, a cross-CDR technology
> comparison, and a budget→tonnes portfolio builder. "BiCRS" here means *Biomass Carbon Removal &
> Storage*, not "Biodiversity & Integrated Carbon-Removal Suite". Sections below document the code;
> §8 specifies the co-benefit stacking model the guide promises.

### 7.1 What the module computes

The one real mechanistic engine is `bicrsCalc` (lines 80–92):

```js
biomassC     = biomassInput × (carbonContent/100)     // t C in feedstock
cInjected    = min(injectionVol, biomassC)             // capped by injection capacity
cStored      = cInjected × (1 − leakageRate)
co2Equiv     = cStored × (44/12)                       // t C → tCO2e
lifecycleEm  = co2Equiv × (lifecyclePct/100)
finalRemoval = (co2Equiv − lifecycleEm) × (1 − permAdj) × (1 − uncertaintyAdj)
```

`uncertaintyAdj` is fixed at 0.05; `permAdj` comes from the permanence tier. The comment correctly
notes the sequencing: lifecycle emissions are deducted *before* permanence/uncertainty discounts.

The **portfolio builder** (`portfolio`, lines 136–157) converts a $ budget and 5 allocation sliders
into tonnes: `tonnes_m = (budget × alloc_m) / costPerT_m`, plus allocation-weighted permanence and
cost. Allocations are renormalised to 100% (`norm = 100/Σalloc`).

### 7.2 Parameterisation

| Parameter | Value / default | Provenance |
|---|---|---|
| Permanence tiers | Premium adj 0 (1000+ yr) · Standard 0.10 (100–999 yr) · Basic 0.30 (10–99 yr) | `PERM_TIERS` — synthetic discount ladder by storage horizon |
| `carbonContent` | 48% default | Typical dry-biomass carbon fraction |
| `uncertaintyAdj` | 0.05 (fixed) | Hard-coded uncertainty deduction |
| `leakageRate` | 0.03 default | Storage leakage assumption |
| Portfolio `costPerT` | DAC 450 · ERW 120 · BiCRS 200 · Biochar 75 · OAE 180 $/t | Literature midpoints (match `cdrTable` ranges) |
| Portfolio permanence | DAC 95 · ERW 60 · BiCRS 80 · Biochar 55 · OAE 70 /100 | Hard-coded heuristic scores |
| CDR comparison radar | Cost/Perm/Scale/Co-benefit/MRV/TRL per method | Hard-coded expert-judgement scores |
| CDR table | cost, permanence, TRL, co-benefits, maturity per method | Literature values (DAC $250–600/t, biochar TRL 7, OAE TRL 4, etc.) |

### 7.3 Calculation walkthrough

1. **BiCRS Calculator** — feedstock carbon → injectable C (capped) → stored C after leakage →
   CO₂-equivalent → net of lifecycle → net of permanence & uncertainty. Result is pushed to
   `CarbonCreditContext` as methodology `Iso-BiCRS`, family `cdr`.
2. **BECCS Pathway** — 4 named plants (Drax, Stockholm CHP, Mikawa, Illinois Basin) with fully
   synthetic capacity/capture/net-removal; summary totals capture, energy, net removal, avg cost.
3. **CDR Technology Comparison** — static radar + table across DAC/ERW/BiCRS/Biochar/OAE.
4. **Portfolio Builder** — the §7.1 budget→tonnes conversion with weighted permanence/cost.
5. **Hub Dashboard** — aggregates + a 12-month synthetic issuance timeline.

### 7.4 Worked example — BiCRS Calculator

Defaults: biomassInput 10,000 t, carbonContent 48%, injectionVol 5,000, leakage 0.03, permTier 0
(Premium, adj 0), lifecyclePct 10%:

| Step | Computation | Result |
|---|---|---|
| Biomass C | 10,000 × 0.48 | 4,800 t C |
| C injected | min(5,000, 4,800) | 4,800 t C |
| C stored | 4,800 × (1 − 0.03) | 4,656 t C |
| CO₂ equivalent | 4,656 × 3.667 | 17,072 tCO₂e |
| Lifecycle emissions | 17,072 × 0.10 | 1,707 tCO₂e |
| Net of lifecycle | 17,072 − 1,707 | 15,365 |
| × (1 − permAdj 0) | 15,365 × 1 | 15,365 |
| × (1 − 0.05) | 15,365 × 0.95 | **14,596 tCO₂e finalRemoval** |

Conversion efficiency = 4,656 / 10,000 = 46.6%.

### 7.5 Data provenance & limitations

- **BiCRS + portfolio calculators are real; everything else is synthetic or static.** BECCS plants,
  biomass-sustainability feedstock metrics, and the hub timeline all use the PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`. The CDR radar/table are hard-coded literature scores, not
  computed.
- Permanence discount ladder (0/0.10/0.30) is a coarse synthetic proxy — production CDR standards
  (Puro.earth, Isometric) require quantified reversal-risk and durability modelling.
- No TNFD/SBTN/co-benefit logic exists despite the guide (see §8).
- Portfolio builder assumes a single point cost per method; no supply-curve or price-uncertainty.

**Framework alignment (as coded):** IPCC AR6 Ch.12 CDR taxonomy (DAC/ERW/BiCRS/biochar/OAE) ·
Puro.earth / Isometric-style biomass-CDR net accounting (lifecycle-then-permanence sequencing) ·
BECCS as IEA/IPCC negative-emissions pathway. The guide's TNFD/SBTN alignment is unimplemented.

## 8 · Model Specification — Ecosystem-Service Co-Benefit Stacking & Premium Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's promise: value a nature-based credit as carbon + verified co-benefits, and
produce a TNFD-LEAP-aligned nature score. Scope: ARR, REDD+, blue-carbon, soil, and IFM projects
seeking co-benefit premiums in the voluntary market.

### 8.2 Conceptual approach

A hedonic premium model layered on carbon value — mirroring how Ecosystem Marketplace decomposes
observed VCM transaction prices by attribute, and how MSCI/Sylvera rate co-benefit quality. Nature
dependency/impact scoring follows the TNFD LEAP structure (Locate-Evaluate-Assess-Prepare) and SBTN
target hierarchy, benchmarked against IBAT/ENCORE dependency datasets.

### 8.3 Mathematical specification

```
StackedValue = P_carbon × Q + Σ_s  Premium_s × 1{verified_s} × P_carbon × Q
Premium_s    = β_s   (hedonic coefficient per co-benefit s ∈ {biodiversity, water, community, gender})
LEAP_score   = 100 × Σ_d w_d · norm(indicator_d)      d over LEAP dimensions
SBTN_gap     = max(0, Target_ha − Restored_ha)
CoBenefit_premium_total = min(cap, Σ_s Premium_s)      cap ≈ 45% (observed market ceiling)
```

| Parameter | Calibration source |
|---|---|
| `β_s` per co-benefit | Ecosystem Marketplace State-of-VCM attribute regressions (10–40%/service) |
| `cap` (≈45%) | Observed max stacked premium in VCM transaction data |
| LEAP indicator weights `w_d` | TNFD v1.0 LEAP guidance; expert elicitation |
| Dependency/impact data | IBAT, ENCORE, WWF Water Risk Filter (free) |
| SBTN land/freshwater targets | SBTN v1 sector target-setting methodology |

### 8.4 Data requirements

Project geospatial boundary, verified co-benefit certifications (Verra SD VISta, CCB labels),
observed carbon price (Ecosystem Marketplace / Xpansiv CBL). LEAP inputs: proximity to KBAs/
protected areas (IBAT), water-stress (Aqueduct — already in platform reference data), community
FPIC status. Platform already holds carbon price context and Aqueduct water-stress seeds.

### 8.5 Validation & benchmarking plan

Backtest `StackedValue` against realised premium transactions (SD VISta-labelled vs vanilla credits)
by vintage and region; reconcile LEAP_score against Sylvera/BeZero co-benefit sub-ratings; sensitivity
of premium to each `β_s`. Cap must bind rarely (<5% of sample).

### 8.6 Limitations & model risk

Co-benefit premiums are thin-market and self-reported — premium coefficients are unstable and prone
to greenwashing; require verified certification as a hard gate (`1{verified}`). LEAP scoring is
qualitative-to-quantitative and vendor-divergent; disclose methodology and treat as ordinal, not
cardinal. Never let stacked value exceed the empirical market cap.
