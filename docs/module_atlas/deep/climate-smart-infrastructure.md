## 7 · Methodology Deep Dive

This module (EP-EI6) is largely a **curated reference display**: it presents pre-populated sector, project,
IFC-standard and IRR-comparison tables rather than running a live calculation engine (`computed` is empty).
The guide's BCR/NbS-BCR/long-horizon-IRR formulae describe how the seeded figures were *conceived*, but the
page does not solve them at runtime — the numbers are stored in the seed schemas.

### 7.1 What the module computes

The page renders three curated datasets and lets the user compare them:

| Seed schema | Fields | Role |
|---|---|---|
| `INFRA_SECTORS` (7) | climateRisk, adaptCost, adaptBenefit, resilienceScore, nbs | sector adaptation BCR = adaptBenefit/adaptCost (implicit) |
| `ADAPT_RETURNS` (6) | traditional, climateSmart, nbs | IRR comparison across 5–50 yr horizons |
| `IFC_STANDARDS` (9) | title, climate | IFC Performance Standards PS 1–8 climate relevance |

The core relationship the guide names is `BCR = Σ PV_Benefits / Σ PV_Costs`, with the NbS variant adding
flood-loss-avoided + ecosystem services + carbon value in the numerator; these are represented by the stored
`adaptBenefit`/`adaptCost` and the three IRR columns, not computed from cash-flow primitives on the page.

### 7.2 Parameterisation / scoring rubric

| Value | Guide anchor | Provenance |
|---|---|---|
| Sector adaptation BCR (adaptBenefit/adaptCost) | 4–8× grey, higher for NbS | curated from World Bank / UNEP figures |
| Portfolio average BCR | 6.1× (World Bank 2022) | curated demo value |
| GCF adaptation window | 50% allocation | curated (GCF Resource Mobilisation 2024) |
| IRR by horizon | traditional < climateSmart < nbs | curated demo series |

### 7.3 Calculation walkthrough

There is no seeded PRNG here; the page is data-driven. User selects a sector/horizon → the stored BCR,
resilience score and IRR triplet are surfaced and compared. The "long-horizon IRR" (25–50 yr NPV=0) is a
stored outcome per pathway, illustrating that NbS advantage widens over long asset lives.

### 7.4 Worked example

A coastal-barrier sector row with `adaptCost = $50M`, `adaptBenefit = $310M` (PV of avoided losses +
ecosystem services over asset life):

```
BCR = adaptBenefit / adaptCost = 310 / 50 = 6.2×
```
Consistent with the guide's 6.1× World Bank portfolio average and the 4–8× grey-infrastructure band; an NbS
variant of the same project would show a higher BCR because ecosystem-service and carbon co-benefits enter
the numerator at low incremental cost.

### 7.5 Data provenance & limitations

- Values are **curated demo data** drawn from World Bank / UNEP / IFC public figures, not computed from an
  asset-level cash-flow model; no `sr()` PRNG is used, but the numbers are illustrative constants.
- No discounting engine, no probabilistic AAL loss curve, and no project-specific hazard modelling on-page —
  BCR is a stored ratio, not a solved NPV.
- IFC PS climate-relevance column is descriptive mapping, not a compliance score.

**Framework alignment:** IFC Performance Standards PS 1–8 (E&S risk management; PS 4 involuntary
resettlement cited) · GCF adaptation-window allocation · World Bank Green Bonds for Climate Adaptation /
Adaptation Finance Review 2022 (6.1× BCR) · UNEP Adaptation Gap Report 2023. The BCR concept mirrors FEMA/
World Bank adaptation appraisal.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Turn the curated sector table into a live adaptation-infrastructure appraisal
engine that computes discounted BCR and long-horizon IRR per project (grey vs climate-smart vs NbS),
supporting DFI/MDB project selection.

**8.2 Conceptual approach.** Discounted cash-flow project finance with a probabilistic avoided-loss benefit
(Economics of Climate Adaptation, Swiss Re/World Bank) and monetised co-benefits, benchmarked against World
Bank adaptation-finance appraisals and IFC project economics.

**8.3 Mathematical specification.**
```
Benefit_PV = Σ_t [ (AAL_base − AAL_adapted)_t + EcoServices_t + CarbonValue_t + InsuranceSaving_t ] · DF_t
Cost_PV    = CapEx + Σ_t OpEx_t·DF_t + LandCost
BCR = Benefit_PV / Cost_PV ;   IRR solves Σ_t NetBenefit_t/(1+IRR)^t = 0 over 25–50 yr
NbS_BCR = (FloodLossAvoided + EcosystemServices + CarbonValue) / (CapEx + OpEx + LandCost)
```

| Parameter | Source |
|---|---|
| AAL curves | RMS/AIR or JRC hazard × exposure |
| Ecosystem-service value | TEEB / Nature Conservancy per-ha valuations |
| Carbon value | EU-ETS / social cost of carbon |
| Discount rate | HM Treasury Green Book / MDB hurdle rate |

**8.4 Data requirements.** Project CapEx/OpEx, asset exposure, hazard curves, ecosystem extent, carbon
sequestration rate. Free: JRC hazard, TEEB; vendor: RMS.

**8.5 Validation & benchmarking.** Reconcile BCR against World Bank 6.1× average and UNEP 4–12× ranges;
sensitivity on discount rate and AAL; NbS-vs-grey crossover analysis over asset life.

**8.6 Limitations & model risk.** Long-horizon discounting dominates results; co-benefit monetisation
contested; AAL under deep uncertainty. Fallback: undiscounted BCR band with conservative co-benefit = 0.
