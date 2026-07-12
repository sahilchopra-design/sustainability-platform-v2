# Building Energy Performance
**Module ID:** `building-energy-performance` · **Route:** `/building-energy-performance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EPC rating analytics, CRREM (Carbon Risk Real Estate Monitor) pathway alignment, and building-level GHG intensity tracking for commercial and residential real estate portfolios. Identifies stranding risk by comparing current energy performance against CRREM 1.5°C and 2°C pathways by property type and country. Supports EU Taxonomy Article 7 technical screening and TCFD physical risk integration.

> **Business value:** The EPBD recast and EU Taxonomy Article 7 are accelerating regulatory demand for decarbonised buildings, with minimum EPC standards tightening to class D by 2030 for all commercial real estate. CRREM stranding analysis quantifies the financial risk embedded in underperforming properties and provides the CapEx roadmap needed for green loan and green bond refinancing eligibility.

**How an analyst works this module:**
- Portfolio Map shows all properties with CRREM stranding risk RAG status
- CRREM Pathway tab overlays asset intensity trajectory against 1.5/2°C curves
- EPC Distribution shows band breakdown and EPBD minimum standard compliance
- Stranding Year Analysis ranks assets by years to CRREM stranding
- CapEx Roadmap tab estimates retrofit cost to reach EPC B / CRREM alignment
- EU Taxonomy tab checks Article 7 technical screening criteria for buildings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `EPC_COLORS`, `EPC_RATINGS`, `RETROFIT_TECH`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Residential','Industrial','Logistics','Mixed-Use'];` |
| `type` | `TYPES[Math.floor(s*6)];` |
| `epcIdx` | `Math.floor(s2*7);const epc=EPC_RATINGS[epcIdx];` |
| `area` | `Math.floor(500+s3*49500);` |
| `yearBuilt` | `Math.floor(1950+s4*73);` |
| `city` | `CITIES[Math.floor(s5*CITIES.length)];` |
| `baseIntensity` | `{'Office':180,'Retail':220,'Residential':120,'Industrial':280,'Logistics':150,'Mixed-Use':200};` |
| `intensity` | `Math.floor(baseIntensity[type]*(0.5+s*0.8));` |
| `crremTarget` | `Math.floor(baseIntensity[type]*0.35);` |
| `strandingYear` | `intensity>crremTarget*2?2026+Math.floor(s2*4):intensity>crremTarget?2030+Math.floor(s3*5):2040+Math.floor(s4*10);` |
| `annualEnergy` | `Math.floor(intensity*area/1000);` |
| `annualCost` | `Math.floor(annualEnergy*0.15*1000);` |
| `co2` | `Math.floor(annualEnergy*0.21);` |
| `value` | `Math.floor(area*(type==='Office'?4500:type==='Retail'?3200:type==='Residential'?5500:type==='Industrial'?1800:type==='Logistics'?2100:3800)*(0.8+s3*0.4));` |
| `retrofitCost` | `Math.floor(area*(25+s4*75));` |
| `crremPathways15` | `Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*5.2,retail:220-i*6.4,residential:120-i*3.5,industrial:280-i*8.1,logistics:150-i*4.3,mixedUse:200-i*5.8}));` |
| `crremPathways20` | `Array.from({length:28},(_,i)=>({year:2023+i,office:180-i*3.8,retail:220-i*4.7,residential:120-i*2.5,industrial:280-i*5.9,logistics:150-i*3.1,mixedUse:200-i*4.2}));` |
| `retrofitOptions` | `RETROFIT_TECH.map((tech,i)=>{` |
| `epcDist` | `useMemo(()=>EPC_RATINGS.map(r=>({rating:r,count:filtered.filter(b=>b.epc===r).length})),[filtered]);` |
| `typeDist` | `useMemo(()=>TYPES.map(t=>({type:t,count:filtered.filter(b=>b.type===t).length,avgIntensity:Math.floor(filtered.filter(b=>b.type===t).reduce((s,b)=>s+b.intensity,0)/(filtered.filter(b=>b.type===t).length\|\|1))})),[filtered` |
| `avgIntensity` | `useMemo(()=>Math.floor(filtered.reduce((s,b)=>s+b.intensity,0)/(filtered.length\|\|1)),[filtered]);` |
| `totalCo2` | `useMemo(()=>filtered.reduce((s,b)=>s+b.co2,0),[filtered]);` |
| `crremAligned` | `useMemo(()=>filtered.filter(b=>b.strandingYear>=2040).length,[filtered]); const totalValue=useMemo(()=>filtered.reduce((s,b)=>s+b.value,0),[filtered]);` |
| `decay` | `selBldg.intensity*Math.exp(-0.03*(p.year-2023));` |
| `annualSaving` | `selectedRetrofit.reduce((s,idx)=>s+retrofitOptions[idx].energySaving*selBldg.area*0.15/1000,0);` |
| `cost` | `affected.reduce((s,b)=>s+b.retrofitCost,0);` |
| `intensityBenchmark` | `useMemo(()=>TYPES.map(t=>{` |
| `avg` | `blds.length?Math.floor(blds.reduce((s,b)=>s+b.intensity,0)/blds.length):0;` |
| `best` | `blds.length?Math.min(...blds.map(b=>b.intensity)):0;` |
| `worst` | `blds.length?Math.max(...blds.map(b=>b.intensity)):0;` |
| `crrem` | `Math.floor({'Office':63,'Retail':77,'Residential':42,'Industrial':98,'Logistics':52,'Mixed-Use':70}[t]\|\|60);` |
| `newInt` | `Math.floor(selBldg.intensity*sc.factor);` |
| `newStrand` | `newInt>selBldg.crremTarget*2?2026+Math.floor(sr(i*7)*4):newInt>selBldg.crremTarget?2032+Math.floor(sr(i*11)*6):2045+Math.floor(sr(i*13)*5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `EPC_RATINGS`, `RETROFIT_TECH`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Intensity | `Annual_emissions / GFA` | Energy audit | Building GHG intensity; CRREM 1.5°C UK office pathway is ~15 kgCO₂e/m²/yr by 2030 |
| CRREM Pathway Gap | `Intensity – CRREM_pathway(t)` | CRREM v2 | Excess carbon intensity above the 1.5°C/2°C CRREM benchmark for property type |
| EPC Rating | — | National EPC register | Energy Performance Certificate band; EU minimum class E by 2027, D by 2030 under EPBD recast |
- **National EPC registers + building energy audit data** → Map each property to CRREM pathway; compute stranding year from intensity trajectory → **Per-property stranding year and CRREM gap with RAG risk flag**
- **CRREM v2 pathway database** → Select pathway by property type and country; compare against asset intensity → **CRREM stranding analysis and EU Taxonomy Article 7 compliance assessment**

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM carbon intensity stranding model
**Headline formula:** `Stranding_year = first t where intensity(t) > CRREM_pathway(t); Intensity = Annual_emissions_kgCO2 / GFA_m²; EPC_score = 0–100 (A–G)`

CRREM pathways define maximum allowable carbon intensity (kgCO₂e/m²/yr) per property type and country to remain on 1.5°C or 2°C trajectory. Stranding year is the first year asset intensity exceeds the pathway. Energy intensity (kWh/m²) feeds into EPBD Nearly Zero Energy Building thresholds.

**Standards:** ['CRREM v2 Pathways', 'EU Taxonomy Art. 7 Buildings', 'EPBD Recast 2023', 'GRESB Standards']
**Reference documents:** CRREM Carbon Risk Real Estate Monitor v2 (2023); EU Taxonomy Regulation Art. 7 Buildings Technical Screening; EU Energy Performance of Buildings Directive Recast 2023; GRESB Real Estate Assessment Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines stranding as
> `Stranding_year = first t where intensity(t) > CRREM_pathway(t)` using CRREM v2 country ×
> property-type pathways, plus EU Taxonomy Article 7 screening and a portfolio map. **The code does
> not solve a pathway crossing.** Stranding year is assigned by a *ratio bucket rule* with random
> jitter (§7.3), the "CRREM pathways" are synthetic straight lines (not CRREM v2 data, no country
> dimension), there is no EU Taxonomy tab or map, and EPC ratings are drawn independently of energy
> intensity (an EPC-A building can carry worst-quartile intensity). The 4 real tabs are Building
> Portfolio / CRREM Pathway Analysis / Energy Efficiency / MEES & Regulation. The sections below
> document the code as it behaves.

### 7.1 What the module computes

For 150 synthetic European buildings (6 types × 15 cities), per building
(`BuildingEnergyPerformancePage.jsx:14-32`):

```js
intensity     = floor(baseIntensity[type] × (0.5 + s×0.8))      // 50–130% of type base
crremTarget   = floor(baseIntensity[type] × 0.35)               // fixed 65% cut vs base
strandingYear = intensity > 2×target ? 2026 + ⌊s2×4⌋            // 2026–2029
              : intensity > target   ? 2030 + ⌊s3×5⌋            // 2030–2034
              :                        2040 + ⌊s4×10⌋           // 2040–2049
annualEnergy  = floor(intensity × area / 1000)                  // MWh/yr
annualCost    = floor(annualEnergy × 0.15 × 1000)               // £ at £0.15/kWh
co2           = floor(annualEnergy × 0.21)                      // tCO₂e at 0.21 kg/kWh
meesCompliant = epcIdx ≤ 3                                      // EPC A–D
```

Portfolio KPIs (avg intensity, total CO₂, CRREM-aligned count = stranding ≥ 2040, value, MEES
non-compliant count), a per-building pathway chart, a retrofit ROI simulator, and a MEES
cost-of-compliance view.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Base intensity (kWh/m²/yr) | Office 180 · Retail 220 · Residential 120 · Industrial 280 · Logistics 150 · Mixed-Use 200 | Synthetic; plausible vs CIBSE/Better Buildings benchmarks, uncited |
| CRREM target ratio | 0.35 × base (e.g. Office 63) | Authorial; also hard-coded per type in the benchmark tab |
| Electricity price | £0.15/kWh | Synthetic demo value |
| Emission factor | 0.21 kgCO₂e/kWh | Consistent with UK grid electricity (DEFRA 2023 ≈ 0.207) but uncited in code |
| Capital value (£/m²) | Office 4,500 · Retail 3,200 · Resi 5,500 · Industrial 1,800 · Logistics 2,100 · Mixed 3,800 (±20%) | Synthetic demo value |
| Retrofit cost | £25–100/m² | Synthetic demo value |
| "1.5 °C pathway" | linear: base − k×(yr−2023), k = 5.2 (office) … 8.1 (industrial) | Synthetic linearisation — real CRREM curves are convex |
| "2 °C pathway" | shallower slopes (3.8 office … 5.9 industrial) | Synthetic |
| MEES timeline | 2025 min-E · 2027 min-C · 2030 min-B | Approximates UK MEES: EPC E already binding since April 2023; C-2027/B-2030 were consultation proposals |
| Autonomous decarb rate | `intensity × e^(−0.03×(yr−2023))`, −3%/yr | Authorial assumption |
| Retrofit uplift | trajectory × 0.65 (35% cut) | Authorial assumption |

`retrofitOptions` gives 10 technologies with seeded `costPerSqm` (£15–135), `energySaving`
(5–30 kWh/m²/yr), payback (1.5–9.5y) and per-type applicability — all synthetic.

### 7.3 Calculation walkthrough

1. **Portfolio tab** — filter by type/EPC/city/search, sortable table, EPC distribution and
   type-mix charts. Note EPC is an independent draw (`floor(s2×7)`), so EPC and intensity are
   uncorrelated — visible if you filter EPC A and sort by intensity.
2. **CRREM tab** — for the selected building, plots the synthetic 1.5 °C or 2 °C line vs a
   `current` trajectory (exponential −3%/yr decay of today's intensity) and a `withRetrofit`
   trajectory (65% of current). The chart *can* show a crossing, but the headline stranding year
   still comes from the §7.1 bucket rule, so chart and badge can disagree. A stranding timeline
   counts buildings with `strandingYear ≤ y` for 11 milestones (2025–2050); a what-if scenario
   recomputes `newInt = intensity × factor` and re-runs the bucket rule with shifted year bases
   (2026+/2032+/2045+).
3. **Energy Efficiency tab** — retrofit selector; year-by-year 20-year ROI:
   `annualSaving(£k) = Σ_selected energySaving × area × 0.15 / 1000`, one-off
   `cumCost = Σ costPerSqm × area`, `netBenefit = cumSaving − cumCost`.
4. **MEES tab** — pick 2025/2027/2030; affected = buildings with `epcIdx > indexOf(minEPC)`;
   compliance CapEx = Σ their `retrofitCost`.

### 7.4 Worked example

Office, area 10,000 m², draw s = 0.75: intensity = ⌊180×(0.5+0.6)⌋ = **198 kWh/m²/yr**; target =
⌊180×0.35⌋ = **63**. Ratio test: 198 > 126 (2×63) → stranding bucket 2026–2029; with s2 = 0.4 →
2026+⌊1.6⌋ = **2027**. Energy = ⌊198×10,000/1000⌋ = **1,980 MWh**; cost = 1,980×0.15×1000 =
**£297,000/yr**; CO₂ = ⌊1,980×0.21⌋ = **415 t**. Retrofit LED (say cost £40/m², saving
18 kWh/m²): annual saving = 18×10,000×0.15/1000 = **£27k/yr** vs £400k CapEx → simple payback
14.8y; ROI chart's `netBenefit` turns positive in year 15. If a what-if scenario applies factor
0.6: newInt = 118 < 126 but > 63 → re-bucketed to 2032–2037.

### 7.5 Data provenance & limitations

- **All 150 buildings are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); the emission factor
  and MEES thresholds are the only near-real constants.
- **Unit conflation**: `intensity` is generated as an energy intensity (kWh/m²) but is compared
  against "CRREM" targets — real CRREM pathways are *carbon* intensities (kgCO₂e/m²) and separate
  energy-intensity pathways; the module never converts.
- Stranding is bucketed, not solved; alignment counts (`strandingYear ≥ 2040`) therefore reflect
  the ratio rule, not pathway maths. No country dimension despite 15 cities in 5 countries; the
  MEES rule (UK regulation) is applied to Paris/Frankfurt/Madrid assets too.
- Retrofit savings are additive with no interaction/diminishing returns and no discounting in ROI.

### 7.6 Framework alignment

- **CRREM v2** — publishes country × property-type decarbonisation pathways (GHG intensity and
  energy intensity) derived from a 1.5 °C/2 °C global carbon budget allocated to real estate via
  SDA; stranding = first year the asset's projected intensity exceeds its pathway. The module
  mimics the vocabulary with linear proxies and a bucket rule.
- **UK MEES (Energy Efficiency (Private Rented Property) Regulations 2015)** — EPC E minimum for
  continued commercial lettings since 1 Apr 2023; EPC C (2027) and B (2030) are consultation
  proposals, correctly labelled "Proposed" in the code's timeline.
- **EPBD recast (EU/2024/1275)** — minimum energy performance standards for non-residential stock;
  referenced by the guide but not implemented.
- **GRESB / EU Taxonomy Art. 7 (buildings)** — named in the guide only; no screening logic exists.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify transition (stranding) risk and retrofit economics for a commercial real-estate equity/
debt portfolio, producing per-asset stranding years, CRREM gap, and CapEx-to-align — the inputs
lenders need for green-loan eligibility and CRREM-aligned disclosure.

### 8.2 Conceptual approach
Implement the **CRREM v2 methodology** directly (the industry standard adopted by GRESB, INREV,
PCAF real-estate guidance) with asset-level projection, benchmarked against (1) CRREM's own Excel
tool outputs and (2) MSCI Real Estate Climate VaR stranding logic (pathway-crossing with
market-value haircut).

### 8.3 Mathematical specification

```
CI_a(t) = [ E_elec,a(t) × EF_grid,c(t) + E_fuel,a(t) × EF_fuel ] / GFA_a       kgCO₂e/m²/yr
E_x,a(t) = E_x,a(t₀) × (1 − r_a)^(t−t₀) × w(t)                                 asset energy path
Stranding_a = min { t : CI_a(t) > P_type,c^scenario(t) }                        pathway crossing
Gap_a(t) = max(0, CI_a(t) − P(t));   Excess_a = Σ_t Gap_a(t) × GFA_a           cumulative excess
CapEx_align,a = min over retrofit bundles B { Cost(B) : CI_a^B(t) ≤ P(t) ∀ t ≤ 2050 }
```

| Parameter | Value / source |
|---|---|
| `P_type,c(t)` pathways | CRREM v2 global pathways (1.5 °C, 2 °C), country × 8 property types — free download |
| `EF_grid,c(t)` | national grid factors with forward decarbonisation, IEA WEO Stated Policies / Announced Pledges |
| `EF_fuel` | DEFRA 2024 / IPCC 2006 GL fuel factors |
| `r_a` autonomous efficiency | 0.5–1%/yr, CRREM default assumptions |
| `w(t)` weather normalisation | HDD/CDD projection per CRREM climate files |
| Retrofit bundle costs/savings | CRREM retrofit library; UK BEES survey; vendor cost curves (e.g. Arcadis) |
| Value-at-stranding haircut | `ΔV = D × Σ discounted carbon-excess cost`, carbon price from NGFS Phase IV net-zero path |

EPC linkage: map measured intensity to EPC bands per national methodology (SAP/SBEM for UK) rather
than independent draws; MEES exposure = assets below the statutory band per jurisdiction with
effective dates.

### 8.4 Data requirements
Per asset: GFA, type, country, metered electricity/fuel (or EPC-derived estimates with a PCAF-style
data-quality score 1–5), lease structure (landlord vs tenant energy), asset value. Sources: energy
audits/smart meters (client), national EPC registers (free: UK EPC open data), CRREM pathway files
(free), IEA grid factors (platform already ingests OWID/IEA energy data in `reference_data`).

### 8.5 Validation & benchmarking plan
Reconcile stranding years against the official CRREM tool for a 20-asset test set (target: exact
year match given identical inputs); sensitivity: ±10% intensity, ±1 EF revision, scenario switch —
stranding year shifts must be monotone; back-check CapEx-to-align vs realised retrofit projects;
annual pathway-version regression tests when CRREM updates.

### 8.6 Limitations & model risk
Pathway allocation (SDA) is convention, not physics — disclose scenario/version; grid-factor
forecasts dominate late-horizon results (report gross vs market-based Scope 2 variants); estimated
(non-metered) intensities carry ±30% error — propagate to a stranding-year range, not a point;
retrofit optimisation is combinatorial — use greedy marginal-abatement ordering as the conservative
fallback and label optimality accordingly.

## 9 · Future Evolution

### 9.1 Evolution A — Real CRREM pathway-crossing stranding on sourced building data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide defines stranding correctly (`first t where intensity(t) > CRREM_pathway(t)` using CRREM v2 country × property-type pathways) but **the code does not solve a pathway crossing** — stranding year is a ratio-bucket rule with random jitter, the "CRREM pathways" are synthetic straight lines with no country dimension, EPC ratings are drawn **independently of energy intensity** (an EPC-A building can carry worst-quartile intensity — a data-integrity contradiction), and there is no EU Taxonomy tab or portfolio map despite the overview. 150 buildings are fully synthetic. Evolution A implements the real stranding model — and the platform already has strong precedent (`crrem_stranding_engine` appears in the validation-summary methodology registry).

**How.** (1) Use the real `crrem_stranding_engine` (or wire this page to it) to compute stranding as the actual first-crossing of the asset's decarbonisation trajectory over the CRREM v2 pathway for its country and property type — replacing the bucket-plus-jitter rule. (2) Source real CRREM v2 pathways (published per country × type) instead of synthetic lines; add the missing country dimension. (3) Fix the EPC↔intensity independence: EPC band and measured intensity must be consistent (or EPC sourced from national registers where the platform's EPC integration exists — memory notes an EPC data source was wired). (4) Build the promised EU Taxonomy Article 7 screening and portfolio map. (5) Rung 3: calibrate against real EPC-register distributions and CRREM benchmark intensities (the §4.1 "UK office ~15 kgCO₂e/m²/yr by 2030" reference). As a backend vertical, `POST /api/v1/building-performance/stranding`.

**Prerequisites.** CRREM v2 pathway licensing/data; the platform's EPC and building-footprint integrations (EPC and Overture sources exist per memory) for real assets; coordination with the existing CRREM engine to avoid a second divergent implementation. **Acceptance:** stranding year is a computed pathway crossing that varies by country; EPC band and intensity are consistent; the EU Taxonomy Art. 7 screen exists; outputs match CRREM benchmark intensities.

### 9.2 Evolution B — Real-estate stranding and retrofit copilot (LLM tier 2)

**What.** The module's audience (real-asset managers, green-loan underwriters) asks "which assets strand before 2030 and what's the retrofit CapEx to align them?" — a workflow chaining stranding analysis and the retrofit ROI simulator. The copilot runs the Evolution-A stranding engine per asset, ranks by years-to-stranding, and computes the retrofit path to CRREM alignment (the CapEx roadmap the module promises), every intensity, stranding year, and cost tool-traced.

**How.** Tool schemas over the Evolution-A stranding and retrofit routes; grounding corpus is this Atlas record plus the CRREM v2 / EPBD / EU Taxonomy Art. 7 references in §5. The copilot's honesty duty: stranding is pathway- and country-specific, so it states the CRREM pathway and country used, and retrofit savings are engineering estimates (the `RETROFIT_TECH` energy-saving assumptions) that it labels as such. Green-loan eligibility framing (EPC-B / CRREM alignment for refinancing) cites the applicable criterion. Composes CapEx roadmaps into the report layer.

**Prerequisites (hard).** Evolution A — a copilot narrating the current bucket-plus-jitter stranding years and EPC-inconsistent intensities would misstate stranding risk with financing consequences. **Acceptance:** every stranding year and retrofit cost traces to a tool response; the CRREM pathway and country are stated per asset; retrofit savings are labelled engineering estimates.