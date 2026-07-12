# Climate-Smart Infrastructure Finance
**Module ID:** `climate-smart-infrastructure` · **Route:** `/climate-smart-infrastructure` · **Tier:** B (frontend-computed) · **EP code:** EP-EI6 · **Sprint:** EI

## 1 · Overview
Infrastructure resilience analytics: 6 sectors with climate risk and adaptation BCR, 22 projects including coastal barriers/urban cooling/NbS drainage, IFC Performance Standards PS 1–8, 6 climate finance funds (GCF/Adapt/IFC/AIIB/EU GG/WB), and long-horizon IRR comparison (5–50yr).

> **Business value:** Used by infrastructure investors evaluating climate-resilient projects, DFI project teams applying IFC performance standards, and government adaptation planners prioritising resilience investments.

**How an analyst works this module:**
- Review 6 infrastructure sectors with climate risk scores and NbS integration rates
- Analyse 22 project pipeline with type, CapEx, IRR, climate risk reduction, and status
- Review IFC Performance Standards PS 1–8 with climate relevance and E&S safeguard requirements
- Compare long-horizon IRR: traditional vs climate-smart vs NbS over 5–50 year periods

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADAPT_RETURNS`, `IFC_STANDARDS`, `INFRA_SECTORS`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INFRA_SECTORS` | 7 | `climateRisk`, `adaptCost`, `adaptBenefit`, `resilienceScore`, `nbs` |
| `ADAPT_RETURNS` | 6 | `traditional`, `climateSmart`, `nbs` |
| `IFC_STANDARDS` | 9 | `title`, `climate` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADAPT_RETURNS`, `IFC_STANDARDS`, `INFRA_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Adaptation infrastructure BCR (avg) | `Across World Bank 2022 project portfolio` | World Bank Adaptation Finance Review 2022 | Average $1 invested in adaptation returns $6.10 in avoided losses; early warning systems show highest BCR (12–32x) at lowest cost. |
| GCF adaptation window | `Of GCF portfolio allocated to adaptation` | GCF Resource Mobilisation 2024 | GCF 50% allocation target for adaptation; SIDS/LDCs prioritised; grant element up to 100% for most vulnerable countries. |
| IFC PS 4 involuntary resettlement | `At replacement value for affected persons` | IFC Performance Standard 4 2012 | PS 4 requires livelihood restoration to pre-project level; non-compliance triggers E&S action plan and can delay financing. |
- **IFC PS 2012 + GCF Framework + Adaptation Fund + AIIB CSF + World Bank GBs + UNEP Adaptation Gap** → Sector analytics + project pipeline + IFC PS table + long-horizon IRR + climate finance guide → **Infrastructure investors, DFI project teams, MDB climate finance officers, and government adaptation planners**

## 5 · Intermediate Transformation Logic
**Methodology:** Adaptation BCR
**Headline formula:** `BCR = Σ(PV_Benefits) / Σ(PV_Costs); NbS_BCR = (FloodLossAvoided + EcosystemServices + CarbonValue) / (CapEx + OpEx + LandCost); Long_Horizon_IRR solves NPV=0 over 25–50yr period`

NbS infrastructure commands BCR 4–8x vs grey infrastructure 3–6x over 50-year asset lives; increasingly preferred by MDBs for adaptation finance.

**Standards:** ['UNEP Adaptation Gap Report 2023', 'IFC Performance Standards 2012', 'World Bank Green Bonds Adaptation Framework 2021']
**Reference documents:** UNEP (2023) – Adaptation Gap Report; IFC (2012) – Performance Standards on Environmental and Social Sustainability; World Bank (2021) – Green Bonds for Climate Adaptation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live adaptation BCR engine from cash-flow primitives (analytics ladder: rung 1 → 2)

**What.** EP-EI6 is honestly a curated reference display: `INFRA_SECTORS`,
`ADAPT_RETURNS`, and `IFC_STANDARDS` are stored tables, and §7 confirms the BCR /
NbS-BCR / long-horizon-IRR formulas describe how the seeds were *conceived*, not what
the page computes (`computed` is empty; §8 is an unimplemented spec). Evolution A gives
the module its first real calculation: solve `BCR = Σ PV_Benefits / Σ PV_Costs` and the
25–50-year IRR from user-entered cash-flow primitives, with scenario toggles for
discount rate and hazard frequency.

**How.** (1) First backend vertical: `POST /api/v1/climate-infra/bcr` taking CapEx,
OpEx, land cost, avoided-loss schedule, ecosystem-service and carbon-value streams, and
returning BCR, NbS-BCR, and NPV=0 IRR per horizon — implementing §8.3 as written.
(2) Scenario dimension: discount rate sweep (3–8%) and a hazard-frequency multiplier
sourced from the digital-twin composite scores for the project's coordinates, so
"climate risk reduction" stops being a stored attribute. (3) Frontend keeps the curated
22-project pipeline as comparables but marks the computed panel distinctly; the 6.2×
worked example (310/50) becomes the regression test.

**Prerequisites.** None hard — the module has zero blast radius and no seeded-PRNG
defect to purge; carbon value needs a price-path source (the platform's NGFS carbon
price interpolator already exists in `climate_transition_risk_engine`).
**Acceptance:** entering the §7.4 coastal-barrier inputs reproduces BCR 6.2×; IRR
ordering traditional < climate-smart < NbS emerges from cash flows, not a stored table.

### 9.2 Evolution B — IFC safeguards copilot for project screening (LLM tier 1)

**What.** A copilot answering the questions DFI project teams actually bring to this
page: "which IFC Performance Standards bind for an urban-cooling project?", "why does
NbS BCR widen at 50-year horizons?", "how does the 6.1× World Bank average compare to
this sector?" — grounded strictly in the module's curated corpus (`IFC_STANDARDS` PS
1–8 climate-relevance rows, the UNEP Adaptation Gap / World Bank references §5 cites)
and the page's current filter state.

**How.** Tier-1 RAG per the roadmap: this Atlas record plus the seed datasets
themselves embedded into `llm_corpus_chunks`; served through the standard
`POST /api/v1/copilot/climate-smart-infrastructure/ask` route with prompt-cached module
context. Because the module has no endpoints, there is nothing to tool-call yet —
tier 2 becomes possible only after Evolution A ships, at which point "recompute this
project's BCR at a 6% discount rate" maps to the new `/bcr` operation.

**Prerequisites.** Corpus embedding pipeline (roadmap D3); a disclosure rule so the
copilot states that project IRRs are curated illustrations, not live appraisals.
**Acceptance:** copilot correctly maps a described project to the binding PS numbers
with citations; refuses to invent project-specific BCRs beyond the stored table until
the Evolution A engine exists.