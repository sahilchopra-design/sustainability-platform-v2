# Climate Health Risk Analytics
**Module ID:** `climate-health-risk-analytics` · **Route:** `/climate-health-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DP2 · **Sprint:** DP

## 1 · Overview
Analyses the full spectrum of climate impacts on human health — infectious disease range expansion, malnutrition, mental health, heat mortality, and healthcare system capacity stress. Quantifies economic cost using WHO burden of disease methodology and models health system investment needs.

> **Business value:** Essential for health sector impact investors, sovereign development banks programming health adaptation, pharmaceutical companies assessing market expansion from climate-driven disease, and public health authorities quantifying climate health investment ROI.

**How an analyst works this module:**
- Select disease burden category and geography
- Apply climate dose-response functions from IPCC AR6
- Calculate DALY burden and economic cost
- Model healthcare system capacity needs
- Generate WHO-aligned climate health risk investment case

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `COUNTRIES`, `DISEASES`, `DISEASE_BURDEN`, `INCOME_GROUPS`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INCOME_GROUPS` | `['Low Income', 'Lower-Middle', 'Upper-Middle', 'High Income'];` |
| `DISEASES` | `['Malaria', 'Dengue', 'Cholera', 'Respiratory', 'Heat Stroke', 'Malnutrition', 'Vector-borne', 'Mental Health'];` |
| `mortPer100k` | `2 + sr(i * 11) * 48;` |
| `daly` | `500 + sr(i * 13) * 4500;` |
| `whoCost` | `0.1 + sr(i * 17) * 9.9;` |
| `adaptNeed` | `0.05 + sr(i * 19) * 2.95;` |
| `ahi` | `30 + sr(i * 23) * 60;` |
| `vulnerability` | `10 + sr(i * 29) * 90;` |
| `healthExpPct` | `1 + sr(i * 31) * 9;` |
| `rcp85mortality` | `mortPer100k * (1.4 + sr(i * 37) * 1.6);` |
| `DISEASE_BURDEN` | `DISEASES.map((d, i) => ({` |
| `avgMort` | `filtered.length ? (filtered.reduce((a, c) => a + c.mortPer100k, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalDaly` | `filtered.reduce((a, c) => a + c.daly, 0).toLocaleString();` |
| `totalWho` | `filtered.reduce((a, c) => a + c.whoCost, 0).toFixed(1);` |
| `totalAdapt` | `filtered.reduce((a, c) => a + c.adaptNeed, 0).toFixed(2);` |
| `avgVuln` | `filtered.length ? (filtered.reduce((a, c) => a + c.vulnerability, 0) / filtered.length).toFixed(1) : '0.0';` |
| `proj` | `(c.mortPer100k * mult).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DISEASES`, `INCOME_GROUPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Deaths by 2100 | — | IPCC AR6 WGII Chapter 7 | Climate change could cause 5M additional deaths per year by 2100 under high emission scenario |
| Vector-Borne Disease Expansion | — | Lancet Countdown 2023 | Population at risk from malaria expanded 47% since 1950 due to climate change — accelerating |
| Climate Mental Health Cost | — | Wellcome Trust Climate Mental Health 2023 | Climate anxiety and disaster-related PTSD projected to cost $1Tn/yr in lost productivity by 2030 |
- **WHO GHE disease burden data by country and cause** → Climate health burden baseline → **DALY burden and mortality by climate-sensitive disease**
- **Climate dose-response functions (IPCC AR6)** → Attributable fraction calculation → **Climate-attributable increment in disease incidence**
- **Healthcare system capacity and cost data** → Health system investment → **Capacity gap and investment needed for climate resilience**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Health Burden
**Headline formula:** `HealthBurden_climate = Σ [ΔIncidence_disease_i × DALYpercases_i × GDP_per_DALY]; ClimateHealthCost = HealthBurden × VSL_DALY`

DALY (Disability-Adjusted Life Year) combines mortality and morbidity; climate-attributable increment in disease incidence from IPCC dose-response functions; monetised at WHO GDP-per-DALY threshold

**Standards:** ['WHO Climate Change and Health 2023', 'Lancet Countdown on Health and Climate Change 2023', 'IPCC AR6 WGII Chapter 7 — Human Health', 'CDC Climate Effects on Health Database']
**Reference documents:** WHO Climate Change and Health Fact Sheet 2023; Lancet Countdown on Health and Climate Change Annual Report 2023; IPCC AR6 WGII Chapter 7 — Human Health; Wellcome Trust — The Global Mental Health Crisis and Climate Change (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry attributes WHO climate-health cost
> frameworks, a DALY-based disease burden model, an ND-GAIN vulnerability index, and RCP-scenario
> mortality projections calibrated to epidemiology. **None of these are computed.** Every country
> attribute — mortality per 100k, DALYs, WHO cost, adaptation need, vulnerability — is a single
> `sr()`-seeded number, and the only derived quantity is an RCP8.5 mortality multiplier applied to
> the (seeded) base mortality. This is a **country-level climate-health dashboard** over 75 seeded
> countries, not a health-impact model. The sections below document the code.

### 7.1 What the module computes

75 seeded countries (`COUNTRIES`) and 8 seeded disease burdens (`DISEASE_BURDEN`). The one derived
value is the RCP8.5 mortality scenario:

```
mortPer100k     = 2 + sr(i·11)×48                          (seeded base, 2–50 /100k)
rcp85mortality  = mortPer100k × (1.4 + sr(i·37)×1.6)       (1.4–3.0× base — RCP8.5 uplift)
daly            = 500 + sr(i·13)×4500
whoCost         = 0.1 + sr(i·17)×9.9   ($Bn)
vulnerability   = 10 + sr(i·29)×90     (labelled "ND-GAIN composite")
```

Portfolio KPIs are simple aggregates: `avgMort`, `totalDaly`, `totalWho`, `totalAdapt`, `avgVuln`,
and `highRisk = count(vulnerability > 70)`.

### 7.2 Parameterisation / synthetic generation

| Field | Generation | Provenance |
|---|---|---|
| `mortPer100k` | `2 + sr(i·11)×48` | **Seeded** (not excess-deaths) |
| `rcp85mortality` | `mortPer100k × (1.4 + sr(i·37)×1.6)` | Derived from seeded base × seeded multiplier |
| `daly` | `500 + sr(i·13)×4500` | Seeded |
| `whoCost` | `0.1 + sr(i·17)×9.9` $Bn | **Seeded** (not WHO cost framework) |
| `adaptNeed` | `0.05 + sr(i·19)×2.95` $Bn | Seeded |
| `vulnerability` | `10 + sr(i·29)×90` | **Seeded** (labelled ND-GAIN but not ND-GAIN) |
| `DISEASE_BURDEN.climateFraction` | `20 + sr(i·43)×60` % | Seeded |
| `incomeGroup` | `sr(i·7)` pick | Seeded |

### 7.3 Calculation walkthrough

1. `COUNTRIES` builds 75 rows with seeded health attributes and an RCP8.5 mortality uplift.
2. `DISEASE_BURDEN` builds 8 diseases with seeded global DALYs, climate fraction, projected increase.
3. Filter by income group, sort by mortality/DALYs/vulnerability/WHO cost.
4. KPIs aggregate the filtered set; `highRisk` counts vulnerability > 70.
5. Tabs: mortality projections (RCP toggle), disease burden, WHO cost framework, vulnerability index,
   health-system capacity, investment needs, policy tracker — all reading the seeded data.

### 7.4 Worked example — RCP8.5 mortality projection

Country with seeded `mortPer100k = 20.0` and RCP multiplier seed giving `1.4 + sr×1.6 = 2.2`:

| Step | Computation | Result |
|---|---|---|
| Base mortality | seeded | 20.0 /100k |
| RCP8.5 mortality | 20.0 × 2.2 | **44.0 /100k** |
| Implied uplift | 44.0 / 20.0 − 1 | +120 % |
| Vulnerability tier | seeded 78 > 70 | **High-risk** |

The RCP8.5 uplift (1.4–3.0×) is the only scenario logic — a flat multiplicative range, not derived
from a temperature-mortality exposure-response function.

### 7.5 Data provenance & limitations

- **All 75 countries and 8 disease burdens are synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Country names are real; health metrics are fabricated.
- **No WHO cost framework, no DALY model, no ND-GAIN index, no exposure-response mortality** despite
  the guide — the "ND-GAIN composite vulnerability" is `10 + sr(i·29)×90`, not the actual ND-GAIN
  index.
- Base mortality, DALYs, WHO cost and adaptation need are independent draws, so a country's mortality
  and its disease burden carry no relationship.
- The RCP toggle in the UI switches the displayed scenario, but only the RCP8.5 uplift is actually
  parameterised.

**Framework alignment:** The page *references* WHO Climate and Health, the DALY metric, ND-GAIN
vulnerability, and RCP scenarios as labels, but implements none of their methodologies. §8 specifies
the country health-burden model the guide describes (this is the country-resolved analogue of the
`climate-health-hub` model).

## 8 · Model Specification — Country Climate-Health Burden Model

**Status: specification — not yet implemented in code.** The guide's WHO/DALY/ND-GAIN methods have no
implementation (all fields `sr()`-seeded); this specifies them.

### 8.1 Purpose & scope
Estimate country-level climate-attributable mortality, DALYs, and health-system cost under RCP
scenarios, with an ND-GAIN-based vulnerability overlay, for sovereign and DFI health-adaptation
finance decisions.

### 8.2 Conceptual approach
An **attributable-burden model**: temperature-mortality and PM2.5 exposure-response functions produce
excess mortality and DALYs, scaled by RCP scenario and modulated by ND-GAIN adaptive capacity.
Benchmarks: WHO Quantitative Risk Assessment of climate-health and the GBD attributable-risk
framework.

### 8.3 Mathematical specification
```
ExcessMort_c,s = Σ_d Pop_c · baselineMort_c · [ RR(ΔT_c,s(d)) − 1 ]
   RR(ΔT)      = exp( β · ΔT )                                  (log-linear ERF)
DALYs_c        = ExcessMort_c · YLL_perDeath + Morbidity_c · YLD
Vulnerability_c= 100 · (1 − NDGAIN_readiness_c)                 (real ND-GAIN)
AdjustedBurden = ExcessMort_c,s · (1 + Vulnerability_c/100)     (low capacity amplifies)
WHOCost_c      = (ExcessMort_c · VSL_c) + (Morbidity_c · unitCost_c)
AdaptNeed_c    = f( AdjustedBurden, health-system gap )
```
| Parameter | Symbol | Source |
|---|---|---|
| Mortality ERF slope | β | WHO / MCC epidemiological studies |
| Baseline mortality | | WHO / GBD |
| RCP temperature | ΔT_c,s | IPCC AR6 RCP2.6/4.5/8.5 |
| ND-GAIN readiness | | Notre Dame ND-GAIN index |
| VSL | | Country value-of-statistical-life estimates |

### 8.4 Data requirements
Population, baseline mortality, RCP temperature deltas, ND-GAIN readiness, VSL and unit health costs
by country. Country list and income group exist; the epi/climate/ND-GAIN inputs are missing (the
platform's reference-data layer already holds ND-GAIN).

### 8.5 Validation & benchmarking plan
Reconcile excess mortality against WHO climate-health country estimates; validate DALYs against GBD;
compare vulnerability against the actual ND-GAIN ranking; sensitivity-test β and RCP deltas.

### 8.6 Limitations & model risk
ERF transferability across populations; acclimatisation over time; VSL is politically sensitive.
Conservative fallback: report burden as an RCP range and flag countries without baseline-mortality or
ND-GAIN data as out-of-scope.

## 9 · Future Evolution

### 9.1 Evolution A — Real DALY burdens from GBD and WHO data (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's WHO burden-of-disease machinery — DALY model,
ND-GAIN vulnerability, RCP mortality projections — is entirely absent: 75 countries
carry single seeded numbers per attribute (`daly = 500 + sr(i·13)×4500`, a
"vulnerability" labelled ND-GAIN that is a random draw), with the RCP8.5 view a
seeded multiplier on a seeded base. Evolution A grounds the module in the two public
datasets that make it honest: IHME's Global Burden of Disease results (per-country
DALYs and mortality for the module's 8 disease categories — malaria, dengue,
respiratory, heat, malnutrition — downloadable) and the actual ND-GAIN index
(published per country annually, free). The climate-attributable increment then comes
from published attribution studies (WHO's quantitative risk assessment gives
scenario-based attributable-mortality projections per outcome) rather than a seeded
uplift.

**How.** (1) `ref_disease_burden(iso3, disease, daly, mortality_per_100k, source,
year)` from GBD result exports; `ref_nd_gain(iso3, year, score)` from the published
index. (2) The RCP-scenario view re-based on WHO/Lancet-published attributable
fractions per disease-region, with the source and confidence interval carried.
(3) The economic monetisation (`GDP_per_DALY`) implemented as the guide describes,
with the threshold choice documented — it is a contested parameter and must be
visible, not buried.

**Prerequisites (hard).** PRNG purge on all country attributes; GBD/ND-GAIN terms of
use (both permit research use with attribution). **Acceptance:** a country's DALY
figure matches the GBD row it cites; the ND-GAIN column equals the published index;
scenario uplifts cite their attribution study; zero seeded metrics remain.

### 9.2 Evolution B — Health-investment case copilot (LLM tier 1)

**What.** The module's stated deliverable is a "WHO-aligned climate health risk
investment case". Post-Evolution A, a copilot drafts it: "make the adaptation
investment case for dengue control in Southeast Asia" — pulling the GBD burden rows,
the attributable-increment projections, and the monetisation arithmetic the page
computes, assembling them into a structured case with every figure cited. Also the
comparative layer: "which income group carries the highest climate-attributable
respiratory burden?"

**How.** Tier-1 pattern over the reference tables and §5 corpus (WHO, Lancet
Countdown, IPCC AR6 Ch.7); the copilot must carry uncertainty ranges from the
attribution studies into prose (attributable fractions have wide CIs, and dropping
them would manufacture false confidence); refusal on clinical and pharmaceutical
questions outside the burden data.

**Prerequisites (hard).** Evolution A first — an investment case built on seeded
DALYs would be fiction with a WHO label on it. **Acceptance:** every burden figure
in a generated case carries source-year-CI; regenerating yields identical numbers;
the copilot declines to rank interventions the data doesn't cover.