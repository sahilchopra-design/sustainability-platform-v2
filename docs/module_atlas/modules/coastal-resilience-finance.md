# Coastal Resilience Project Finance
**Module ID:** `coastal-resilience-finance` · **Route:** `/coastal-resilience-finance` · **Tier:** B (frontend-computed) · **EP code:** DY/DZ · **Sprint:** DY

## 1 · Overview
Coastal resilience project finance analytics covering seawall, living shoreline, and mangrove buffer investments. Models benefit-cost ratios from avoided storm damage, insurance premium reductions, ecosystem service valuation, and FEMA BRIC grant eligibility.

> **Business value:** Provides comprehensive coastal resilience project finance analytics combining FEMA-methodology avoided loss quantification, nature-based solutions performance data, and insurance market co-benefit valuation.

**How an analyst works this module:**
- Map coastal assets at risk and establish without-project annual expected loss baseline using storm surge models
- Model wave attenuation and flood reduction performance for each intervention type (seawall, living shoreline, mangrove)
- Calculate multi-benefit BCR including avoided damage, insurance premium reduction, and ecosystem service values
- Assess FEMA BRIC grant eligibility and identify co-financing from insurance sector resilience programmes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `FINANCE_INSTRUMENTS`, `Kpi`, `PROTECTION_MEASURES`, `SLR_SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CITIES` | 9 | `name`, `slrM2050`, `floodRisk`, `investedGbn`, `protectedValue`, `bcrAvg`, `adaptation`, `popAtRisk`, `annDamageBn` |
| `PROTECTION_MEASURES` | 8 | `capexMPerKm`, `maintenancePct`, `lifespanYr`, `co2TPerM`, `bcrTypical`, `naturalInfra`, `cobenefit` |
| `SLR_SCENARIOS` | 7 | `slr_rcp26`, `slr_rcp45`, `slr_rcp85`, `assetExposureGtn` |
| `FINANCE_INSTRUMENTS` | 7 | `provider`, `size`, `mechanism`, `trigger`, `bestFor` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pvBenefit` | `lifeYrs > 0 && discountRate > 0 ? annBenefit * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annBenefit * lifeYrs;` |
| `totalProtected` | `CITIES.reduce((s, c) => s + c.protectedValue, 0);` |
| `totalInvested` | `CITIES.reduce((s, c) => s + c.investedGbn, 0);` |
| `avgBcr` | `CITIES.length > 0 ? CITIES.reduce((s, c) => s + c.bcrAvg, 0) / CITIES.length : 0;` |
| `strandedfraction` | `Math.min(0.95, c.floodRisk / 100 * (1 + c.slrM2050));` |
| `strandedValue` | `c.protectedValue * strandedfraction * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `FINANCE_INSTRUMENTS`, `PROTECTION_MEASURES`, `SLR_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coastal Resilience BCR | `(Avoided damage PV + insurance reduction + ecosystem services) / CAPEX` | FEMA BCA and Swiss Re model | Coastal resilience BCR typically 3-8x; living shorelines often higher than grey infrastructure due to co-benefits; FEMA threshold 1.0x |
| Annual Expected Loss Reduction | `AAL without resilience project - AAL with project (expected annual loss from storm events)` | RMS North Atlantic hurricane model | Primary benefit driver; depends on coastal exposure value, hazard intensity, and project attenuation performance |
| Mangrove Storm Attenuation | `Wave height reduction per 100m mangrove belt width` | IUCN / Nature Conservancy coastal protection research | Mangroves reduce wave height 50-70% over 500m; direct analogue to 30-50cm seawall at fraction of cost |
- **RMS / AIR North Atlantic storm surge models** → Probabilistic hazard intensity and damage functions by location → AAL baseline and reduction → **Avoided damage benefit calculation**
- **NOAA coastal bathymetry and asset exposure data** → Coastal topography and asset values → flood inundation modelling → **Physical risk quantification**
- **Swiss Re / Munich Re coastal resilience insurance data** → Premium reduction evidence from coastal protection investments → insurance co-benefit value → **Total BCR including insurance component**

## 5 · Intermediate Transformation Logic
**Methodology:** Coastal Resilience Benefit-Cost Analysis
**Headline formula:** `BCR = (Avoided Storm Damage + Insurance Reduction + Ecosystem Services) / (CAPEX + OPEX); Annual Expected Loss Reduction = AAL(without) - AAL(with)`

Multi-benefit coastal resilience BCR calculation combining engineering-based flood damage reduction with ecosystem service co-benefits and insurance market impacts

**Standards:** ['FEMA Benefit-Cost Analysis Reference Guide 2023', 'NOAA Coastal Resilience Investment Framework', 'Nature-based Solutions for Coastal Resilience — Swiss Re Institute 2023']
**Reference documents:** FEMA (2023) Benefit-Cost Analysis Reference Guide v6.0 — Coastal Flood Section; NOAA (2023) Coastal Resilience Investment Framework; Swiss Re Institute (2023) Nature-based Solutions for Coastal Resilience; Nature Conservancy (2020) Valuing the Coastal Protection Services of Mangroves

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (Sprint DY) computes a genuine **discounted benefit** for coastal protection — it uses an annuity
present-value formula, which is more rigorous than most benefit-cost modules on the platform. The city and
protection-measure datasets are curated demo values; the stranding calculation is a simple heuristic.

### 7.1 What the module computes

Present value of annual resilience benefit uses a closed-form annuity factor:
```js
pvBenefit = (lifeYrs > 0 && discountRate > 0)
   ? annBenefit · (1 − (1 + discountRate/100)^(−lifeYrs)) / (discountRate/100)   // annuity PV
   : annBenefit · lifeYrs                                                        // undiscounted fallback
```
Portfolio and stranding:
```js
totalProtected = Σ CITIES.protectedValue
avgBcr         = Σ CITIES.bcrAvg / CITIES.length        // guard: length>0
strandedfraction = min(0.95, floodRisk/100 · (1 + slrM2050))
strandedValue    = protectedValue · strandedfraction · 0.3
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `CITIES` (9: slrM2050, floodRisk, investedGbn, protectedValue, bcrAvg, popAtRisk, annDamageBn) | seed schema | curated demo (coastal cities) |
| `PROTECTION_MEASURES` (8: capexMPerKm, maintenancePct, lifespanYr, co2TPerM, bcrTypical, naturalInfra) | seed schema | curated (seawall/living-shoreline/mangrove) |
| `SLR_SCENARIOS` (7: slr_rcp26/45/85, assetExposureGtn) | seed schema | RCP sea-level-rise pathways |
| `FINANCE_INSTRUMENTS` (7: provider, mechanism, trigger) | seed schema | FEMA BRIC / cat-bond / resilience-bond reference |
| Stranding cap | `0.95` | heuristic ceiling |
| Stranding realised-loss factor | `0.3` | heuristic (30% of at-risk value actually lost) |

Guide anchors: coastal BCR 3–8× (FEMA/Swiss Re); mangrove wave-height −29%/100m (IUCN/TNC); FEMA BCA
threshold 1.0×.

### 7.3 Calculation walkthrough

User sets `annBenefit`, `lifeYrs`, `discountRate` → `pvBenefit` via the annuity factor → BCR compares
`pvBenefit` to project CapEx (from `PROTECTION_MEASURES`). City-level: `strandedfraction` scales flood risk
by sea-level-rise multiplier, capped at 0.95, and `strandedValue` applies a 30% realised-loss factor to
protected value. `avgBcr`/`totalProtected`/`totalInvested` roll up the 9 cities.

### 7.4 Worked example

Annual avoided-loss benefit `annBenefit = $10M`, `lifeYrs = 30`, `discountRate = 5%`:
```
annuity factor = (1 − 1.05^(−30)) / 0.05 = (1 − 0.2314)/0.05 = 15.372
pvBenefit = 10M · 15.372 = $153.7M
```
Against a seawall CapEx of $26M, `BCR = 153.7/26 = 5.9×` — squarely in the guide's 3–8× coastal range and
above the FEMA 1.0× threshold. City stranding for `floodRisk = 60`, `slrM2050 = 0.5m`:
```
strandedfraction = min(0.95, 0.60·(1+0.5)) = min(0.95, 0.90) = 0.90
strandedValue = protectedValue·0.90·0.3 = 27% of protected value
```

### 7.5 Data provenance & limitations

- City and measure datasets are **curated demo data**; benefits are user-input or stored, not derived from a
  probabilistic storm-surge AAL model (the guide's RMS North Atlantic reference is aspirational).
- `pvBenefit` correctly discounts, but treats benefit as a flat annuity — no growth in AAL under rising SLR,
  no return-period loss curve.
- Stranding uses two fixed heuristics (0.95 cap, 0.3 realised-loss); no insurance-premium co-benefit in the
  PV (unlike the guide's multi-benefit BCR).

**Framework alignment:** FEMA Benefit-Cost Analysis Reference Guide v6.0 (BCR, 1.0× threshold, BRIC grants) ·
NOAA Coastal Resilience Investment Framework · Swiss Re Institute NbS for Coastal Resilience · IUCN/Nature
Conservancy mangrove attenuation (−29%/100m). The annuity-PV benefit mirrors FEMA discounted avoided-loss.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute a FEMA-grade, probabilistic multi-benefit BCR for coastal protection
(seawall / living shoreline / mangrove), including insurance and ecosystem co-benefits, for project finance
and FEMA BRIC eligibility.

**8.2 Conceptual approach.** Probabilistic AAL from a storm-surge exceedance curve (RMS/AIR North Atlantic)
with intervention-specific attenuation, discounted per FEMA BCA, plus monetised ecosystem services (TNC
mangrove valuation) — the multi-benefit coastal BCR standard.

**8.3 Mathematical specification.**
```
AAL = ∫ P(surge > x) · Damage(x, exposure) dx
Benefit_PV = Σ_t [ (AAL_base − AAL_withProject)_t + InsuranceSaving_t + EcoServices_t ] / (1+r)^t
   AAL_withProject uses surge reduced by attenuation η(measure, width)
BCR = Benefit_PV / (CapEx + Σ_t OpEx_t/(1+r)^t)
StrandedValue = exposure · P(inundation | SLR_2050) · lossFraction
```

| Parameter | Source |
|---|---|
| Surge exceedance curve | RMS/AIR or NOAA SLOSH |
| Attenuation η | IUCN/TNC (mangrove −50–70%/500m); engineering specs (seawall) |
| Discount rate r | FEMA/OMB Circular A-94 |
| SLR pathway | IPCC AR6 RCP2.6/4.5/8.5 |

**8.4 Data requirements.** Coastal bathymetry, asset exposure/values, surge model, measure attenuation,
insurance premiums. Free: NOAA SLOSH, IPCC SLR; vendor: RMS/AIR, Swiss Re premium data.

**8.5 Validation & benchmarking.** Reconcile BCR vs FEMA 3–8× and Swiss Re; sensitivity on η and r; backtest
avoided-loss vs post-project claims.

**8.6 Limitations & model risk.** Deep uncertainty in SLR tails; attenuation transfer across sites; ecosystem
valuation contested. Fallback: single return-period (100-yr) benefit with η floor when full loss curve
unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — From flat annuity to SLR-growing AAL and multi-benefit BCR (analytics ladder: rung 1 → 2)

**What.** This Sprint-DY module is more honest than most: the annuity present-value
`pvBenefit = annBenefit·(1−(1+r)^(−n))/r` is a genuine closed-form discounting calc.
But §7.5 lists what's missing against its own guide: benefit is a *flat* annuity with
no AAL growth under rising sea level, there is no return-period loss curve behind
`annBenefit` (it's user-typed), the insurance-premium co-benefit never enters the PV,
and stranding rests on two fixed heuristics (0.95 cap, 0.3 realised-loss factor).
Evolution A upgrades the benefit side to match the FEMA BCA method the module cites.

**How.** (1) Derive `annBenefit` instead of asking for it: without-project AAL from a
return-period damage curve (reusing the depth-damage table the coastal-flood sibling
needs — build once, share), with-project AAL applying each `PROTECTION_MEASURES` row's
attenuation performance (the mangrove −29%/100m IUCN figure is already a guide anchor);
benefit = ΔAAL. (2) Grow AAL along the `SLR_SCENARIOS` RCP paths so the annuity becomes
a growing-benefit PV — the scenario dimension that moves this to rung 2. (3) Add the
guide's other two benefit terms: insurance-premium reduction (parameterized from the
Swiss Re NbS co-benefit ranges, honestly labelled curated) and ecosystem services for
natural-infrastructure measures. (4) Replace the 0.3 stranding factor with a
documented sensitivity range rather than a point heuristic.

**Prerequisites.** The shared depth-damage reference table; no PRNG defect exists here
to purge — this is additive work. **Acceptance:** the §7.4 worked example ($10M, 30yr,
5% → $153.7M) still reproduces as the flat-benefit special case; switching RCP2.6 →
RCP8.5 raises PV benefit monotonically; BCR decomposes into its three benefit terms in
the output.

### 9.2 Evolution B — FEMA BRIC application assistant (LLM tier 1)

**What.** The module already models the finance stack (BRIC grants, cat bonds,
resilience bonds in `FINANCE_INSTRUMENTS`) and the workflow ends at "assess FEMA BRIC
grant eligibility" — a documentation-heavy task. Evolution B drafts the BCA narrative
section of a BRIC application from the module's computed case: project type from
`PROTECTION_MEASURES`, computed BCR versus the FEMA 1.0× threshold, discount-rate and
lifespan assumptions, and the benefit decomposition — each figure cited to the page's
calculation, formatted against the FEMA BCA Reference Guide v6.0 structure the module
already references.

**How.** Tier-1 RAG: corpus is this Atlas record (§5 formula, §7.2 parameter table,
§7.4 worked example) plus the FEMA BCA guide structure; page state (user inputs and
computed PV/BCR) passes into the prompt. No backend exists to tool-call — the module
has zero endpoints — so the assistant is explanation-and-drafting only, and must state
that city-level figures are curated demo data until a real asset baseline is loaded.
Rendering via the existing export path.

**Prerequisites.** Corpus embedding (roadmap D3); Evolution A materially improves
draft quality (derived AAL beats user-typed benefit) but tier 1 can ship before it
with disclosure. **Acceptance:** a generated BCA narrative contains only numbers
present on the page, states the discount rate and lifespan used, and correctly
flags any BCR below 1.0× as failing the FEMA threshold instead of soft-pedalling it.