## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The guide's formula is a compound-adoption *Protein Transition Market Model*
> (`AltProteinShare_t = AltProteinShare_0 × (1+AdoptionRate)^t`). The **frontend page does not compute
> this** — its scenario engine linearly interpolates hard-coded 2030/2050 reduction endpoints for diet,
> tech and waste. A genuinely rigorous **backend engine** (`food_system_engine.py`) exists (SBTi FLAG,
> FAO GAEZ yield, TNFD LEAP, EUDR, agricultural emissions, LDN) but is **not wired to this page's
> display** — the page renders its own local constants. Company transition scores are `sr()`-seeded.

### 7.1 What the module computes (frontend)

The page is driven by three data blocks and a scenario interpolator:

```js
ghgData    = FOOD_CATEGORIES.map(c => ({ name, ghg }))            // real LCA intensities
stageData  = SUPPLY_CHAIN_STAGES → emissions share + 2030/2050 reduction %
scope3Data = COMPANIES.slice(0,12) → scope3, regenAgPct           // sr()-seeded companies
pathwayData: for each year, interpolate diet/tech/waste reduction to a Total
  frac = (yr − 2024)/26 ;  t30 = 6/26
  interp(v30,v50) = frac ≤ t30 ? v30·frac/t30 : v30 + (v50−v30)·(frac−t30)/(1−t30)
  Total = diet + tech + waste
```

The scenario pathway is a **piecewise-linear interpolation**: reductions ramp linearly to the 2030
endpoint, then linearly from 2030→2050. This is a reasonable transition trajectory but not the guide's
exponential adoption curve.

### 7.2 Parameterisation / scoring rubric

**Food-category LCA intensities** (`FOOD_CATEGORIES`) are **real Poore & Nemecek (2018) figures**:

| Category | GHG (kgCO₂e/kg) | Water (L/kg) | Land (m²/kg) | Scope-3 % | Protein g |
|---|---|---|---|---|---|
| Beef & Lamb | 60.0 | 15,400 | 164 | 88 | 26 |
| Farmed Fish | 13.6 | 3,700 | 3 | 65 | 20 |
| Pork | 7.6 | 5,990 | 11 | 82 | 25 |
| Poultry | 5.7 | 4,330 | 7 | 79 | 27 |
| Soy | 2.0 | 2,145 | 3.5 | 90 | 36 |
| Fruit & Veg | 0.7 | 322 | 0.8 | 58 | 1 |

These match the canonical Poore & Nemecek dataset (beef ~60, the 60× spread over vegetables). **Supply-
chain stages** (`SUPPLY_CHAIN_STAGES`) put Farm Production at 61% of emissions (correct) with stage-
specific 2030/2050 abatement potential. **Transition scenarios** (`TRANSITION_SCENARIOS`) give
diet/tech/waste reduction endpoints — Net Zero Food reaches −72% diet by 2050. **Companies** are
`sr()`-seeded (scope3 20–100%, regenAgPct 0–40%, transitionScore 20–80).

### 7.3 Backend engine (not wired to this page)

`FoodSystemEngine` implements seven rigorous sub-models with honest-null handling:
- **SBTi FLAG:** `land_mitigation = emissions × reduction_pct/100` with real sector targets (cattle/
  crops 30%, forests 72% by 2030). Progress fields return `None` when not supplied — no fabrication.
- **FAO crop yield:** RCP band-midpoint impacts (rcp26 −0.5%, rcp45 −5%, rcp85 −14%; tropical rcp85
  −18.5%) × baseline yield, with adaptation gain (3–8% midpoint).
- **TNFD LEAP:** composite = mean of locate/evaluate/assess/prepare; biodiversity risk banded.
- **EUDR Art 29:** country-risk tiers, deforestation-free flag, compliance-gap score (35 defor + 25
  cutoff + geolocation-shortfall).
- **Agricultural emissions:** Scope1 = livestock×2.5 + area×0.8; Scope2 = area×0.12; Scope3 = area×1.5.
- **LDN:** carbon stock = IPCC AR6 density × area (forest 275, cropland 40 tCO₂e/ha).

### 7.4 Worked example (scenario pathway, Net Zero Food, 2035)

Net Zero Food: `diet2030 −38, diet2050 −72`. For year 2035: `frac = (2035−2024)/26 = 0.423`,
`t30 = 6/26 = 0.231`. Since `frac > t30`:
```
diet = −38 + (−72 − −38)·(0.423 − 0.231)/(1 − 0.231) = −38 + (−34)·0.192/0.769 = −38 − 8.5 = −46.5%
```
Adding tech (interp of −28/−60 ≈ −36%) and waste (interp of −30/−58 ≈ −37%) gives a `Total` decarbon-
isation of roughly −120% (the components are additive levers, so overlap is not netted — a
simplification). The pathway shape is right; the additivity overstates combined effect.

### 7.5 Data provenance & limitations

- **Food-category and stage data are real** (Poore & Nemecek, food-system LCA) — a genuine strength.
- **Companies are `sr()`-seeded** (scope3, regenAg, transitionScore, exposure).
- The scenario pathway adds diet+tech+waste levers without netting overlap (can exceed 100%).
- The rigorous backend engine is **not connected** to this page; the guide's compound-adoption model is
  implemented by neither.

**Framework alignment:** Poore & Nemecek (2018) food LCA (category intensities) · SBTi FLAG v1.0
(backend: 30%/72% targets — SBTi derives FLAG targets from commodity-specific reduction pathways) ·
FAO GAEZ v4 + IPCC AR6 Ch5 (backend yield bands) · TNFD v1.0 LEAP · EUDR Reg (EU) 2023/1115 · PCAF
Agriculture Standard · UNCCD SDG 15.3 LDN. The frontend is a well-sourced descriptive layer; the
backend is production-grade but unwired here.

## 8 · Model Specification

**Status: specification — not yet implemented in code (as wired to this page).** Company transition
scores are `sr()`-seeded and the guide's protein-transition market model is absent. Below is the
production model for the page's headline outputs.

### 8.1 Purpose & scope
Model the alternative-protein market transition and food-company transition/stranded-asset risk,
producing per-company transition scores and a diet-shift emissions pathway — for food-sector investment.

### 8.2 Conceptual approach
A **Bass/logistic diffusion** model for alt-protein adoption (benchmarked against **BCG/Blue Horizon**
and **Good Food Institute** market projections) coupled with a **company transition scorecard** (à la
**FAIRR** protein-producer index and **TPI** management-quality levels) and a diet-shift emissions
model over the real Poore & Nemecek intensities.

### 8.3 Mathematical specification
```
AltShare_t = L / (1 + e^(−k(t − t₀)))                         logistic adoption (L=ceiling, k=speed)
EmissionsReduction_t = Σ_meat (ConvVol_meat − AltVol_meat,t) · (EF_meat − EF_alt)
TransitionScore_c = Σ_j w_j · x_{j,c}    x_j ∈ {scope3 disclosure, SBTi, defor-free, regenAg%, ...}
StrandedRisk_c = ConvProteinRevenue_c · (1 − AltShare_t) → repriced under diet-shift scenario
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| L, k | adoption ceiling & speed | GFI / BCG alt-protein projections |
| EF_meat, EF_alt | protein LCA factors | Poore & Nemecek 2018 (already on page) |
| w_j | scorecard weights | FAIRR Protein Producer Index methodology |
| ConvVol/AltVol | production volumes | company reports, market data |

### 8.4 Data requirements
Per company: protein revenue split, scope-3 disclosure, SBTi/FLAG status, deforestation-free sourcing,
regen-ag %. Market: alt-protein volume history. Sources: FAIRR (public), GFI (public), company reports,
Poore & Nemecek EF (on platform). The backend engine already computes FLAG/EUDR/emissions.

### 8.5 Validation & benchmarking plan
Reconcile adoption curve against GFI historical alt-protein sales; benchmark transition scores against
FAIRR index ranks; validate diet-shift emissions against EAT-Lancet planetary-diet studies; sensitivity-
test logistic k and ceiling L.

### 8.6 Limitations & model risk
Adoption ceilings are highly uncertain; additive lever double-counting must be netted; company self-
disclosure is incomplete. Conservative fallback: use the lower adoption ceiling and net overlapping
decarbonisation levers before summing.
