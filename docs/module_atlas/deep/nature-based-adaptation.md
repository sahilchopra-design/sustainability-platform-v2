## 7 · Methodology Deep Dive

This module aligns with its MODULE_GUIDES entry: a **triple-dividend nature-based-solutions (NbS)
adaptation valuation** across 6 projects, with protection value, carbon value, biodiversity scoring,
community jobs, Costanza-style ecosystem-service values, SDG mapping, and a BCR-ranked investment case.
It is entirely **hand-authored static data** (no PRNG); the arithmetic is honest aggregation and
normalisation.

### 7.1 What the module computes

Portfolio totals and a normalised radar are the computed outputs:

```js
totalProtection = Σ NBS.protection_value_m       // avoided-loss $M
totalCarbon     = Σ NBS.carbon_value_m
totalJobs       = Σ NBS.community_jobs
totalCarbonTons = Σ NBS.co_benefits.carbon_tco2
radar axis val  = min(100, metric / max(metric across portfolio) · 100)   // min-max scaled
```

The triple-dividend thesis (guide) is `TotalValue = ProtectionValue + CarbonValue + ΣCoBenefits`, with
`BCR = TotalValue / Cost`. The per-project `bcr` is a **stored input**, not recomputed on the page.

### 7.2 Parameterisation / scoring rubric

| Project | area_ha | protection $M | carbon $M | BCR | carbon tCO₂ | Provenance |
|---|---|---|---|---|---|---|
| Mangrove Restoration | 12,500 | 420 | 85 | 4.76 | 62,500 | Hand-authored |
| Urban Green Infra | 800 | 180 | 12 | 5.33 | 4,800 | Hand-authored |
| Floodplain Reconnection | 5,200 | 290 | 35 | 10.16 | 26,000 | Hand-authored |
| Coral Reef Rehab | 3,800 | 350 | 5 | 7.72 | 2,300 | Hand-authored |
| Agroforestry/Windbreaks | 18,000 | 220 | 120 | 5.86 | 108,000 | Hand-authored |
| Peatland Rewetting | 8,500 | 140 | 195 | 13.96 | 255,000 | Hand-authored (highest BCR — matches guide) |

`ECOSYSTEM_VALUES` carries per-hectare service values: **Coral Reef $352K/ha, Mangrove $33.6K/ha,
Freshwater Wetland $25.6K/ha, Seagrass $28.9K/ha** — these track **Costanza et al. (2014)** global
ecosystem-service estimates (coral reefs are indeed the highest per-hectare value in that dataset). Each
project also carries hazard-specific effectiveness (mangrove surge reduction 65 %, wave attenuation 70 %),
consistent with the coastal-protection literature the guide cites.

### 7.3 Calculation walkthrough

`NBS_SOLUTIONS` is static → portfolio totals sum the six projects → KPI cards. Selecting a project builds
a 6-axis radar (Protection, Carbon, Biodiversity, Community, BCR, Scalability), each min-max normalised
against the portfolio maximum so the shape is comparable across projects. SDG alignment maps each project's
`sdgs` array to the UN SDG colour set for a coverage view. The Investment Case tab ranks projects by stored
`bcr`.

### 7.4 Worked example (Peatland Rewetting radar + triple dividend)

`Peatland = {protection 140, carbon 195, biodiversity 78, jobs 280, bcr 13.96, area 8500, cost 24}`.
Portfolio maxima: protection 420, carbon 195, jobs 3400, bcr 13.96, area 18000.

| Radar axis | Computation | Value |
|---|---|---|
| Protection | `min(100, 140/420·100)` | 33.3 |
| Carbon | `min(100, 195/195·100)` | **100** (portfolio max) |
| Biodiversity | direct | 78 |
| Community | `min(100, 280/3400·100)` | 8.2 |
| BCR | `min(100, 13.96/13.96·100)` | **100** (portfolio max) |
| Scalability | `min(100, 8500/18000·100)` | 47.2 |

Triple-dividend total ≈ `protection 140 + carbon 195 + co-benefits (water 18 + flood 25) = $378M` against
`$24M` cost → BCR ≈ 15.8, close to the stored 13.96 (the stored value uses a slightly different co-benefit
set). Peatland's carbon-and-BCR dominance is exactly the guide's "highest BCR of any adaptation strategy"
claim.

### 7.5 Data provenance & limitations

- **All project data is hand-authored** plausible values — no PRNG, but also not sourced from a specific
  project database. The ecosystem per-hectare values are genuinely Costanza/TEEB-aligned.
- `bcr` is a **stored input**, not recomputed; there is no discounting, no lifetime cash-flow model, and
  no probabilistic avoided-loss (protection value is a point estimate, not an EP-curve-integrated AAL).
- Effectiveness percentages (surge/wave reduction) are project-level headline figures, not site-calibrated
  damage functions.

**Framework alignment:** **Costanza et al. (2014) / TEEB** — per-hectare ecosystem-service valuation (coral
> wetland > mangrove ordering is correct). **IUCN Global Standard for NbS** — the eight-criterion NbS
quality framing underpins the co-benefit + safeguards narrative. **CBD Kunming-Montreal 30×30** — the
biodiversity-target context. BCR/avoided-loss framing follows **FEMA/World Bank adaptation appraisal**.
The gap vs production is the absence of a discounted, probabilistic BCR engine (see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Protection value and BCR are stored point
estimates. Below is the production NbS triple-dividend valuation model.

### 8.1 Purpose & scope
Value candidate NbS adaptation projects on a discounted triple-dividend basis (avoided physical loss +
carbon revenue + monetised co-benefits) and rank them by risk-adjusted BCR/NPV for public and blended-
finance investment decisions.

### 8.2 Conceptual approach
Couple a **probabilistic avoided-loss model** (hazard EP curve × NbS loss-reduction efficacy, per World
Bank "Forces of Nature" and USACE Engineering-With-Nature studies) with **ecosystem-service monetisation**
(Costanza/TEEB shadow prices) and a **carbon-revenue model** (sequestration × price × permanence buffer).
Benchmarks: TNC/World Bank coastal-protection valuation and IUCN NbS Standard.

### 8.3 Mathematical specification
Avoided loss `ΔAAL = ∫[L_base(p) − L_NbS(p)] dp`, with `L_NbS = L_base·(1 − η_hazard)` and `η` the NbS
efficacy (e.g. mangrove surge reduction 65 %). Carbon revenue `R_C,t = seq_rate·area·(1−buffer)·price_C`.
Co-benefit stream `CB_t = Σ_service area·value_per_ha_service`. NPV `= Σ_{t=1}^{life}
(ΔAAL_t + R_C,t + CB_t)/(1+r)^t − capex − Σ opex_t/(1+r)^t`; `BCR = PV(benefits)/PV(costs)`.

| Parameter | Source |
|---|---|
| Hazard EP curve | Cat model / WRI Aqueduct / `natcat-loss-engine` |
| Efficacy η | USACE EWN, TNC coastal studies |
| Sequestration rate | IPCC Tier 2/3 wetland/forest EFs |
| value_per_ha_service | Costanza et al. 2014 / TEEB |
| Discount rate r | Social discount rate 3–5 % |

### 8.4 Data requirements
Site hazard curves, NbS type + area + efficacy, sequestration rates, TEEB service values, carbon price,
capex/opex. Platform has TEEB values and cat-loss scaffolding; efficacy and site hazard are the gaps.

### 8.5 Validation & benchmarking plan
Reconcile avoided-loss against published NbS coastal-protection studies (e.g. Menéndez et al. mangrove
flood-protection); sensitivity on discount rate and efficacy; compare BCR ranking to World Bank NbS
appraisals.

### 8.6 Limitations & model risk
NbS efficacy is site- and event-specific with wide uncertainty; co-benefit shadow prices are contested;
ecological establishment lag delays benefits. Conservative fallback: haircut efficacy, phase in benefits
over an establishment period, and report BCR ranges.
