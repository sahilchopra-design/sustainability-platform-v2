# Energy Sector EU Taxonomy Analytics
**Module ID:** `energy-sector-taxonomy` · **Route:** `/energy-sector-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-DW4 · **Sprint:** DW

## 1 · Overview
EU Taxonomy eligibility and alignment analytics for energy sector exposures covering power generation by technology, substantial contribution thresholds, DNSH climate hazard screening, and transitional gas and nuclear classifications.

> **Business value:** Energy sector EU Taxonomy alignment hinges on the <100 gCO2e/kWh lifecycle SC threshold; gas power meets transitional criteria below 270 gCO2e/kWh direct, while nuclear qualifies under the Complementary Delegated Act subject to JRC TSO safety criteria.

**How an analyst works this module:**
- Map energy generation assets to EU Taxonomy activity codes (4.1–4.30)
- Apply substantial contribution lifecycle GHG threshold (<100 gCO2e/kWh) per technology
- Conduct DNSH screening against six environmental objectives using climate hazard assessment
- Apply transitional gas and nuclear criteria with appropriate sunset clauses

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AVIATION_SAF`, `CCUS_PROJECTS`, `CEMENT_PLANTS`, `CRF`, `DISPATCH_DEMAND`, `DISPATCH_HOURS`, `DISPATCH_STACK`, `EnergySectorTaxonomyPage`, `GRID_CAPEX`, `GRID_CAPEX_FLAT`, `GRID_REGIONS`, `HYDROGEN_PROJECTS`, `IRENA_REGIONS`, `IRENA_TARGETS`, `LEARNING_RATES`, `MACC_MEASURES`, `NGFS_SCENARIOS`, `NUCLEAR_FLEET`, `NZE_MILESTONES`, `OG_NAMES`, `OG_PRODUCERS`, `POWER_REGIONS`, `POWER_STACK`, `POWER_STACK_BY_REGION`, `POWER_STACK_YEARS`, `PRICE_PATHS`, `PRICE_PATH_YEARS`, `PROJECT_PIPELINE`, `SHIPPING_CII`, `STEEL_PLANTS`, `STEEL_TECHS`, `STORAGE_CAPACITY`, `STORAGE_REGIONS`, `TECH_PARAMS`, `TRANSPORT`, `TRANSPORT_REGIONS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NZE_MILESTONES` | 21 | `milestone`, `sector`, `status`, `gap` |
| `NGFS_SCENARIOS` | 8 | `carbonPrice2030`, `carbonPrice2050`, `gdpImpact2050`, `renewableShare2050`, `strandedAssetB`, `transitionRisk`, `physicalRisk` |
| `HYDROGEN_PROJECTS` | 16 | `country`, `capacityMw`, `type`, `costKg`, `fidYear` |
| `CCUS_PROJECTS` | 16 | `country`, `capacityMtYr`, `status`, `tech` |
| `TECH_PARAMS` | 11 | `name`, `capex`, `opexFixed`, `opexVar`, `fuelPrice`, `efficiency`, `cf`, `life`, `color`, `family` |
| `LEARNING_RATES` | 8 | `name`, `lr`, `cost0`, `unit`, `cum0`, `cum2030`, `cum2040`, `cum2050`, `color` |
| `MACC_MEASURES` | 21 | `measure`, `sector`, `cost`, `abatement` |
| `DISPATCH_STACK` | 8 | `name`, `mc`, `cap`, `co2`, `color`, `profile` |
| `PROJECT_PIPELINE` | 16 | `project`, `family`, `capex`, `life`, `annCF`, `supportUnit`, `supportUsd` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRENA_TARGETS` | `IRENA_REGIONS.map((region, i) => ({` |
| `POWER_STACK_YEARS` | `Array.from({ length: 30 }, (_, i) => 2020 + i);` |
| `POWER_STACK` | `POWER_STACK_YEARS.map((year, i) => {` |
| `coal` | `Math.max(0, 36 - progress * 36);` |
| `gas` | `Math.max(0, 23 - progress * 18);` |
| `nuclear` | `10 + progress * 4;` |
| `hydro` | `16 - progress * 2;` |
| `solar` | `3 + progress * 32;` |
| `wind` | `6 + progress * 26;` |
| `bio` | `2 + progress * 5;` |
| `other` | `4 + progress * 5;` |
| `POWER_STACK_BY_REGION` | `POWER_REGIONS.map((region, ri) => ({` |
| `regionFactor` | `0.8 + sr(ri * 7 + 3) * 0.4;` |
| `total` | `coal + gas + solar + wind + nuclear + hydro;` |
| `scale` | `total > 0 ? 100 / total : 1;` |
| `OG_PRODUCERS` | `OG_NAMES.map((name, i) => ({` |
| `STEEL_TECHS` | `['BF-BOF', 'EAF-Scrap', 'DRI-NG-EAF', 'HBI-EAF', 'H2-DRI-EAF', 'BF-BOF+CCUS'];` |
| `TRANSPORT` | `TRANSPORT_REGIONS.map((region, i) => ({` |
| `STORAGE_CAPACITY` | `STORAGE_REGIONS.map((region, i) => ({` |
| `GRID_CAPEX` | `GRID_REGIONS.map((region, i) => ({` |
| `GRID_CAPEX_FLAT` | `GRID_CAPEX.map((r) => ({` |
| `lrToB` | `(lr) => -Math.log(1 - lr) / Math.log(2);` |
| `PRICE_PATH_YEARS` | `Array.from({ length: 26 }, (_, i) => 2025 + i);` |
| `DISPATCH_DEMAND` | `DISPATCH_HOURS.map((h) => {` |
| `morn` | `120 * Math.exp(-Math.pow((h - 9) / 3, 2));` |
| `eve` | `180 * Math.exp(-Math.pow((h - 19) / 2.4, 2));` |
| `noise` | `(sr(h * 7 + 3) - 0.5) * 18;` |
| `annualized` | `tech.capex * crf + tech.opexFixed;` |
| `generation` | `Math.max(1, 8760 * tech.cf); // kWh per kW per yr` |
| `energyCost` | `annualized / generation * 1000; // $/MWh` |
| `fuelCost` | `tech.fuelPrice / Math.max(0.01, tech.efficiency);` |
| `wrightCost` | `(cost0, cum0, cum_t, b) => cost0 * Math.pow(Math.max(1, cum_t) / Math.max(1, cum0), -b);` |
| `npv` | `(cashflows, r) => cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + r, i), 0);` |
| `mid` | `(lo + hi) / 2;` |
| `alignmentShift` | `1 - transitionShift * 0.03;` |
| `portfolioAlignment` | `useMemo(() => { const avg = OG_PRODUCERS.reduce((a, b) => a + b.alignmentPct, 0) / Math.max(1, OG_PRODUCERS.length);` |
| `irenaCoverage` | `useMemo(() => { const sum = IRENA_TARGETS.reduce((a, b) => a + b.solar2030 + b.wind2030, 0);` |
| `ngfsOrderlyAlign` | `+(activeScenario.renewableShare2050 * alignmentShift).toFixed(1);` |
| `sbtiDecarb` | `useMemo(() => { const sum = STEEL_PLANTS.reduce((a, b) => a + b.alignmentPct, 0);` |
| `transitionPlanQuality` | `+(68 + transitionShift * 1.8).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AVIATION_SAF`, `CCUS_PROJECTS`, `DISPATCH_STACK`, `GRID_REGIONS`, `HYDROGEN_PROJECTS`, `IRENA_REGIONS`, `LEARNING_RATES`, `MACC_MEASURES`, `NGFS_SCENARIOS`, `NZE_MILESTONES`, `OG_NAMES`, `POWER_REGIONS`, `PROJECT_PIPELINE`, `STEEL_TECHS`, `STORAGE_REGIONS`, `SUPPORT_LEVELS`, `TABS`, `TECH_PARAMS`, `TRANSPORT_REGIONS`, `WACC_GRID`, `WACC_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Substantial Contribution Threshold | `SC = Lifecycle GHG Intensity < 100 gCO2/kWh` | Delegated Regulation (EU) 2021/2139 | Power generation SC criterion for climate change mitigation; applies to solar, wind, hydro, nuclear and gas with CCS. |
| Transitional Gas Threshold | `Gas SC = Direct Emissions < 270 gCO2/kWh AND lifecycle < 550 kg/kW` | Delegated Regulation Annex I 4.29 | Time-limited transitional activity for gas power plants meeting strict emissions and fuel-switching criteria. |
| Nuclear Classification | `Nuclear alignment requires compliance with Joint Research Centre TSO technical screening` | Complementary Delegated Act (EU) 2022/1214 | Nuclear classified as transitional under separate Complementary Delegated Act; eligible until 2045 for existing, 2040 for new. |
- **EU Taxonomy Compass activity database + lifecycle LCA data** → SC threshold screening → DNSH hazard assessment → alignment scoring → **Energy sector taxonomy analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy Alignment Score
**Headline formula:** `TAS = Σ(Exposure_i × Aligned_i) / Σ(Exposure_i)`

Exposure-weighted average of taxonomy alignment across energy sector portfolio.

**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'TEG — Taxonomy Technical Report June 2019']
**Reference documents:** EU Taxonomy Regulation (EU) 2020/852 and Delegated Regulation (EU) 2021/2139; TEG — Taxonomy Technical Report (June 2019); European Commission — EU Taxonomy Compass (online)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Asset-level taxonomy screening wired to the platform's taxonomy engine (analytics ladder: rung 2 → 3)

**What.** The page is a sprawling energy-transition analytics playground with genuinely good in-page math — CRF-annualized LCOE from the 11-row `TECH_PARAMS` table, Wright's-law learning curves (`lrToB = −ln(1−lr)/ln2`), MACC measures, a merit-order dispatch stack, NPV — and real regulatory constants (SC <100 gCO₂e/kWh, gas transitional <270 g direct, nuclear CDA 2022/1214). What's missing is the module's own name: no asset is actually *screened* against activity codes 4.1–4.30; `OG_PRODUCERS` alignment percentages and the DNSH step are generated/asserted, and the power stack is a stylized interpolation with `sr()` regional noise. Evolution A builds the screening path.

**How.** (1) Consume the platform's `eu-taxonomy-engine` backend rather than reimplementing: this module contributes the *energy-specific* layer — activity-code mapping per generation asset (from `energy-asset-registry`'s real GPPD-backed rows), SC lifecycle-intensity screening using the asset's derived CI, gas/nuclear transitional tests with sunset dates. (2) DNSH climate-adaptation screening via the digital twin's hazard grids at asset coordinates — the platform already has the PostGIS layer that most taxonomy tools lack. (3) `TAS = Σ(Exposure·Aligned)/ΣExposure` computed over real screened assets. (4) Rung 3: bench-pin the LCOE/learning-curve math (already correct, deserves pins) and validate screening outcomes against a handful of published issuer taxonomy reports.

**Prerequisites.** Registry and taxonomy-engine Evolutions A; lifecycle vs direct intensity data distinction handled honestly (SC needs lifecycle; registry CI is operational — disclose the gap or add lifecycle factors). **Acceptance:** a fixture CCGT with 240 g direct passes the transitional test and fails SC, with both verdicts citing the regulation article; TAS reproduces from screened rows; `sr()` remains only in chart cosmetics.

### 9.2 Evolution B — Taxonomy-eligibility analyst for energy portfolios (LLM tier 2)

**What.** A tool-calling analyst for the screening workflow: "screen our 14 generation assets — which are aligned, which fail DNSH on physical risk, and what's the portfolio TAS?" It chains Evolution A's endpoints (activity mapping → SC test → DNSH hazard check → transitional criteria → TAS aggregation), and drafts the alignment report citing the specific Delegated Regulation clauses the page already curates (2021/2139 Annex I, 4.29, CDA 2022/1214) per verdict.

**How.** Tool schemas from the screening endpoints; grounding corpus = this Atlas record's §4.1 threshold table (the SC/transitional/nuclear rows are precise and citable) plus the taxonomy-engine's reference data. Verdict explanations must quote the failing criterion and the asset's measured value ("lifecycle 412 g vs 100 g SC bar"), all validator-checked. Borderline cases (data-gap on lifecycle intensity) are reported as "insufficient data — ineligible pending LCA" per taxonomy practice, not guessed.

**Prerequisites (hard).** Evolution A — narrating the current generated alignment percentages would produce a taxonomy report with invented alignment for named O&G producers, exactly the regulatory exposure the module exists to manage. **Acceptance:** a golden 5-asset screen reproduces from scripted tool calls; every verdict carries a regulation citation and a measured value; portfolio TAS matches the aggregation endpoint.