# Flood Resilience Finance
**Module ID:** `flood-resilience-finance` · **Route:** `/flood-resilience-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EK1 · **Sprint:** EK

## 1 · Overview
10-city flood risk exposure (Jakarta/Mumbai/NYC/Shanghai/Miami), BCR screener for 8 intervention types (barriers/NbS/managed retreat/EWS), return period loss under RCP 2.6/4.5/8.5, AAL trend 2025–2034, and blended finance structures (green bond/parametric/CAT DDO/MDB).

> **Business value:** Used by DFI project teams structuring flood resilience infrastructure finance, sovereign risk managers pricing adaptation bonds, and municipal planners prioritising BCR-optimal interventions.

**How an analyst works this module:**
- Filter 10 cities by flood exposure, annual loss, BCR, SLR, and subsidence metrics
- Use intervention screener with CapEx budget and BCR threshold sliders to identify eligible interventions
- Review return period loss by climate scenario (RCP 2.6/4.5/8.5) from 20yr to 500yr events
- Explore 4 blended finance structures: green bond, parametric insurance, cat DDO, and MDB grants

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AAL_TREND`, `FINANCE_DATA`, `FLOOD_RISKS`, `INTERVENTIONS`, `KpiCard`, `LOSS_SCENARIOS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FLOOD_RISKS` | 11 | `country`, `population`, `floodExposure`, `annualLoss`, `adaptCost`, `bcr`, `seaLevelRise`, `subsidence`, `category` |
| `INTERVENTIONS` | 9 | `capexM`, `annualMaint`, `lifeYears`, `protection100yr`, `nbsElement`, `greenPremium`, `exampleBCR` |
| `LOSS_SCENARIOS` | 6 | `rcp26`, `rcp45`, `rcp85` |
| `FINANCE_DATA` | 7 | `amount`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sortedCities` | `useMemo(() => [...FLOOD_RISKS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `totalAnnualLoss` | `FLOOD_RISKS.reduce((a, b) => a + b.annualLoss, 0);` |
| `avgBCR` | `INTERVENTIONS.reduce((a, b) => a + b.exampleBCR, 0) / INTERVENTIONS.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FINANCE_DATA`, `FLOOD_RISKS`, `INTERVENTIONS`, `LOSS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global annual flood loss (2024) | `Average annual economic loss from flooding` | UNEP Adaptation Gap Report 2023 | Flood accounts for 44% of all natural disaster economic loss; increasing 4–5% annually with climate change and urbanisation. |
| Jakarta annual loss | `Annual average flood loss` | World Bank Jakarta Resilience Study 2023 | Jakarta faces compounding risks: coastal flooding + subsidence (2.5cm/yr) + urban pluvial; managed retreat + coastal barrier BCR 4.2x. |
| UNEP Adaptation Finance Gap | `Adaptation finance gap 2030 estimate` | UNEP Adaptation Gap Report 2023 | Developing countries need $215–387Bn/yr by 2030; current adaptation finance from MDBs ~$21Bn/yr; 10:1 gap ratio. |
- **UNEP Adaptation Gap Report + IPCC AR6 + World Bank GFDRR + CCRIF + ICMA Green Bond Principles + CBI Adaptation Finance Criteria** → City exposure table + BCR screener + loss modelling + AAL trend + blended finance guide → **DFI project teams, sovereign risk managers, municipal adaptation planners, and climate insurance structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** Annual Average Loss & BCR
**Headline formula:** `AAL = Σ(P_exceedance × Loss_returnperiod) × dP; BCR = PV_LossAvoided / (CapEx + PV_OpEx); NbS_BCR = (FloodLoss + EcoServices + CarbonValue) / TotalCost; Adaptation_IRR solves NPV=0 over asset life`

NbS flood defense (wetlands, mangroves) commands BCR 7.6x vs grey infrastructure (barriers) 6.2x; early warning systems highest BCR (12.8x) at lowest cost ($18M).

**Standards:** ['UNEP Adaptation Gap Report 2023', 'World Bank GFDRR 2023', 'IPCC AR6 WG2 Chapter 10 Cities']
**Reference documents:** UNEP (2023) – Adaptation Gap Report; World Bank (2023) – GFDRR Flood Resilience Finance Review; Swiss Re Institute (2023) – Natural Catastrophes and Inflation 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives four formulae — an exceedance-probability AAL
> integral (`AAL = Σ P_exc × Loss_RP × dP`), a benefit-cost ratio (`BCR = PV_LossAvoided /
> (CapEx + PV_OpEx)`), an NbS BCR with ecosystem+carbon co-benefits, and an adaptation IRR. **None are
> computed.** `annualLoss`, `adaptCost` and `bcr` are **stored per city**, `exampleBCR` is **stored per
> intervention**, and the loss-return-period table is a static matrix. The page's only live maths is
> summing city AAL, averaging intervention BCR, and threshold-filtering interventions.

### 7.1 What the module computes

```js
totalAnnualLoss = Σ FLOOD_RISKS[c].annualLoss                    // $Bn, 10 cities
avgBCR          = Σ INTERVENTIONS[i].exampleBCR / n              // mean BCR
sortedCities    = [...FLOOD_RISKS].sort(desc by sortField)       // rank by loss/exposure/etc.
eligibleInterventions = INTERVENTIONS.filter(i =>
                    i.capexM ≤ capexBudget && i.exampleBCR ≥ bcrThreshold)   // BCR screener
```

The **BCR screener** (the interactive centrepiece) filters the 8 intervention types by a CapEx budget
slider and a BCR-threshold slider — this is genuine decision logic, but it operates on *stored* BCRs.

### 7.2 Parameterisation / scoring rubric

**City flood-risk table** (`FLOOD_RISKS`, 10 real cities — curated, realistic):

| City | Pop (M) | Flood exposure | Annual loss ($Bn) | Adapt cost ($Bn) | BCR | SLR (m) | Subsidence |
|---|---|---|---|---|---|---|---|
| Jakarta | 10.56 | 92 | 4.8 | 12.4 | 4.2 | 0.48 | 2.5 |
| Shanghai | 26.3 | 65 | 8.4 | 22.1 | 4.9 | 0.41 | 1.8 |
| New York | 8.3 | 48 | 6.8 | 18.6 | 5.6 | 0.44 | 0.3 |
| Rotterdam | 0.65 | 55 | 1.4 | 4.2 | 8.2 | 0.52 | 0.4 |
| Miami | 0.45 | 71 | 4.1 | 10.8 | 3.6 | 0.62 | 0.1 |

These are illustrative but plausible (Jakarta's high subsidence 2.5 cm/yr and SLR are real concerns;
Rotterdam's high BCR reflects mature Dutch flood defence). **Interventions** (`INTERVENTIONS`, 8 types)
carry CapEx, maintenance, life, 100-yr protection flag, NbS flag, and an example BCR — with Early
Warning Systems highest (12.8, low-cost/high-benefit) and Flood Insurance Pools lowest (3.4).

**Loss scenarios** (`LOSS_SCENARIOS`): a 5×3 matrix of return-period loss ($Bn) by RCP — e.g.
1-in-100yr flood: RCP2.6 $34.2Bn → RCP8.5 $88.4Bn (2.6× amplification). **AAL trend** (`AAL_TREND`,
10 yrs) is the only `sr()`-touched series: `baseline = 85 + i·2.8 + sr(i·11)·8` — a linear trend plus
±8 noise, with RCP4.5/8.5 steeper slopes (i·4.2 / i·7.4).

### 7.3 Calculation walkthrough

1. Sum city annual losses → dataset AAL headline.
2. Average intervention BCR.
3. Rank cities by the chosen `sortField`.
4. Screen interventions by budget + BCR sliders.
5. Plot loss-scenario matrix (RCP bars) and AAL trend (area chart).

### 7.4 Worked example (BCR screener)

Set `capexBudget = 200 ($M)`, `bcrThreshold = 4.0`. The 8 interventions filter to those with
`capexM ≤ 200 AND exampleBCR ≥ 4.0`:
- Urban Green Infrastructure (120, 4.8) ✓
- Wetland Restoration NbS (65, 7.6) ✓
- Early Warning Systems (18, 12.8) ✓
- Storm Water Retention (95, 5.9) ✓
- Managed Retreat (280) ✗ (over budget), Coastal Barriers (850) ✗, Levees (450) ✗, Insurance Pools
  (40, 3.4) ✗ (below BCR threshold).

So a $200M budget with a 4× BCR hurdle selects the four low-CapEx / high-benefit options, three of
them nature-based — the "NbS wins at low budgets" narrative. The BCRs themselves are stored inputs,
not computed from loss-avoided.

### 7.5 Data provenance & limitations

- **City AAL, adaptation cost and BCR are stored constants** (realistic, curated), not computed from
  the exceedance-probability integral the guide describes.
- Intervention BCRs are stored `exampleBCR`, not `PV(loss avoided)/(CapEx+PV OpEx)`.
- Only the AAL trend uses `sr()` (small ±8 noise on a linear trend).
- Finance-structure amounts and the global headline figures ($280Bn loss, $194Bn UNEP gap) are
  citations/placeholders.

**Framework alignment (named, mostly not computed):** catastrophe-modelling AAL (loss-exceedance curve
integral) · benefit-cost analysis for adaptation (World Bank / GCA methodology) · IPCC RCP scenarios
(the loss matrix) · UNEP Adaptation Gap Report (the $194Bn/yr figure) · nature-based-solutions valuation
(NbS BCR with ecosystem + carbon co-benefits). The city SLR/subsidence figures echo IPCC AR6 and
InSAR-based subsidence studies.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** AAL and BCR are stored, not derived. Below is
the production flood-loss + adaptation-economics model.

### 8.1 Purpose & scope
Compute per-city annual average loss from a flood loss-exceedance curve under climate scenarios, and
rank adaptation interventions by benefit-cost ratio and IRR (including NbS co-benefits) — for
adaptation-finance allocation.

### 8.2 Conceptual approach
A **catastrophe-model AAL** (hazard × exposure × vulnerability) benchmarked against **Swiss Re / Munich
Re flood models** and the **World Resources Institute Aqueduct Floods** tool, plus an **adaptation BCA**
following **GCA / World Bank** guidance where benefit = discounted avoided loss + monetised co-benefits.

### 8.3 Mathematical specification
```
Loss(RP) = ExposedValue · DamageRatio(depth(RP)) · (1 − protectionEffectiveness)
AAL      = ∫₀¹ Loss(p) dp ≈ Σ_k ½·(Loss_k + Loss_{k+1})·(p_k − p_{k+1})   trapezoidal over RPs
BCR      = PV_LossAvoided / (CapEx + PV_OpEx)
   PV_LossAvoided = Σ_t (AAL_noAdapt,t − AAL_adapt,t) / (1+r)^t
NbS_BCR  = (PV_LossAvoided + PV_EcoServices + PV_CarbonValue) / TotalCost
IRR: solve Σ_t (Benefit_t − Cost_t)/(1+IRR)^t = 0
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| DamageRatio(depth) | depth-damage function | JRC global flood depth-damage curves |
| depth(RP) | flood depth by return period | Aqueduct Floods / GLOFRIS hazard maps |
| ExposedValue | assets in floodplain | national asset registers / LitPop |
| protectionEffectiveness | intervention risk reduction | engineering design standards |
| EcoServices, CarbonValue | NbS co-benefits | TEEB / social cost of carbon |
| r | social discount rate | 3–7% (Stern/Nordhaus range) |

### 8.4 Data requirements
Per city: flood hazard maps by RP and RCP, exposed asset value, depth-damage curves, current protection
standard. Per intervention: CapEx, OpEx, life, risk-reduction, co-benefit quantities. Sources: WRI
Aqueduct (public), JRC depth-damage (public), EM-DAT for validation, GCA cost data.

### 8.5 Validation & benchmarking plan
Reconcile AAL against Swiss Re / Munich Re city flood-loss estimates and historical EM-DAT losses
(target same order); backtest avoided-loss against observed post-defence loss reductions (e.g. Thames
Barrier); sensitivity-test discount rate and damage curves; validate NbS co-benefit values.

### 8.6 Limitations & model risk
Depth-damage curves are region-generic; hazard maps omit compound (pluvial+coastal) events; NbS benefits
are uncertain and slow to accrue. Conservative fallback: report AAL as a range across RCP scenarios and
exclude co-benefits from the core BCR (report NbS_BCR as upside).

## 9 · Future Evolution

### 9.1 Evolution A — Compute AAL and BCR instead of storing them (analytics ladder: rung 1 → 2)

**What.** §7 flags four unimplemented formulae: the exceedance-probability AAL integral (`AAL = Σ P_exc × Loss_RP × dP`), the benefit-cost ratio (`BCR = PV_LossAvoided/(CapEx + PV_OpEx)`), the NbS BCR with ecosystem+carbon co-benefits, and the adaptation IRR. Today `annualLoss`, `adaptCost`, `bcr` are stored per city, `exampleBCR` is stored per intervention, and the loss-return-period table is a static matrix — the only live maths is summing city AAL and averaging BCR. Evolution A makes the four formulae real: integrate AAL from the RCP-scenario loss-return-period matrix the module already carries, and compute each intervention's BCR from PV of loss avoided over CapEx plus PV of maintenance, with the NbS variant adding ecosystem-service and carbon value.

**How.** (1) `AAL = Σ (1/RP_i − 1/RP_{i+1})·0.5·(Loss_i + Loss_{i+1})` over the existing `LOSS_SCENARIOS` matrix, per city and per RCP. (2) BCR from `protection100yr`-implied loss-avoided against `capexM + PV(annualMaint over lifeYears)`; NbS BCR adds carbon value at a documented shadow price and an ecosystem-service term. (3) Adaptation IRR solves NPV=0 over asset life. The BCR screener then filters on computed, not stored, ratios.

**Prerequisites.** The stored `bcr`/`exampleBCR` constants demoted to validation checks; carbon and ecosystem-service prices as documented assumptions. **Acceptance:** an intervention's BCR recomputes from its CapEx/maintenance/protection fields and matches the §5 formula; changing the discount rate or RCP scenario moves AAL and BCR by hand-verifiable amounts.

### 9.2 Evolution B — Adaptation-finance structuring copilot (LLM tier 1 → 2)

**What.** A copilot for DFI and municipal users: "which interventions clear a 5× BCR under RCP 8.5 for Jakarta within a $500M budget, and which blended-finance structure fits?" Tier-1 narrates the city rankings, intervention screener, and the four finance structures (green bond/parametric/CAT DDO/MDB) from the atlas corpus; tier-2 runs the Evolution A AAL/BCR/IRR endpoints so the screening and prioritisation are computed.

**How.** Tier 1 grounds on §5/§7 (World Bank/GCA benefit-cost methodology, UNEP Adaptation Gap, IPCC RCP scenarios, NbS valuation are all cited), with a guardrail that current BCRs are stored constants pre-Evolution-A. Tier 2 tool-calls the BCR screener and IRR solver, and matches interventions to finance structures using the module's own finance-structure descriptions. Numbers validated against tool output.

**Prerequisites.** Evolution A for computed screening; corpus embedding; per-module tool allowlist. **Acceptance:** a prioritisation answer's BCR and IRR figures each trace to a tool call; the global headline figures ($280Bn loss, $194Bn UNEP gap) are cited as external references, never presented as module computations.