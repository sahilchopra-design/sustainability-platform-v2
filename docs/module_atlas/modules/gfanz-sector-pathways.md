# GFANZ Sector Pathways
**Module ID:** `gfanz-sector-pathways` · **Route:** `/gfanz-sector-pathways` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides analytics for assessing portfolio and counterparty alignment with Glasgow Financial Alliance for Net Zero sector decarbonisation pathways, covering power, steel, cement, aviation, shipping, agriculture, and real estate. Enables financial institutions to measure and report on portfolio alignment to sector-specific net-zero pathways as required under GFANZ membership commitments.

> **Business value:** Enables financial institutions to fulfil GFANZ membership reporting obligations, demonstrate portfolio alignment with IEA NZE sector pathways, and identify priority engagement targets in high-emitting sectors including power, steel, cement, aviation, and shipping.

**How an analyst works this module:**
- Select the sectors present in your portfolio and load issuer-level production and intensity data for each.
- Map issuers to GFANZ sector pathway benchmarks using the IEA NZE or NGFS 1.5°C scenario trajectory.
- Compute sector alignment scores and identify issuers whose current intensity exceeds the pathway target.
- Generate the GFANZ-format sector pathway alignment report for annual climate commitment reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `CO_NAMES`, `CompanyAlignmentTab`, `CustomTooltip`, `KPI`, `MILESTONES_DATA`, `MilestoneMonitorTab`, `MiniBar`, `Pill`, `PortfolioPathwayTab`, `SECTORS`, `SECTOR_2020`, `SECTOR_2050_15`, `SECTOR_2050_2C`, `SECTOR_2050_NDC`, `SECTOR_COLORS_MAP`, `SECTOR_DESC`, `SECTOR_TECHS`, `SECTOR_UNITS`, `SectorPathwaysTab`, `TABS`, `TierBadge`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MILESTONES_DATA` | 37 | `id`, `sector`, `name`, `year`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTOR_UNITS` | `{Power:'gCO2/kWh',Steel:'tCO2/t steel',Cement:'kgCO2/t cement','O&G':'kgCO2e/boe',Aviation:'gCO2/RPK',Shipping:'gCO2/t-nm',Auto:'gCO2/km',Buildings:'kgCO2/m\u00B2'};` |
| `seed` | `si*100+ci;` |
| `progress` | `sr(seed)*0.6+0.2;` |
| `current` | `base2020-(base2020-tgt2050)*progress;` |
| `targetNow` | `base2020-(base2020-tgt2050)*((2026-2020)/(2050-2020));` |
| `gap` | `((current-targetNow)/targetNow*100);` |
| `alignment` | `Math.max(0,Math.min(100,100-gap*1.5+sr(seed+50)*20-10));` |
| `capexAlign` | `sr(seed+99)*60+20;` |
| `milestonesAchieved` | `Math.floor(sr(seed+77)*4);` |
| `scope1` | `+(sr(seed+111)*base2020*0.4).toFixed(1);` |
| `scope2` | `+(sr(seed+222)*base2020*0.15).toFixed(1);` |
| `scope3` | `+(current-scope1-scope2).toFixed(1);` |
| `region` | `['Europe','North America','Asia Pacific','Latin America','Middle East'][Math.floor(sr(seed+333)*5)];` |
| `sbtiStatus` | `['Committed','Targets Set','SBTi Validated','Not Committed'][Math.floor(sr(seed+444)*4)];` |
| `transitionPlanPublished` | `sr(seed+555)>0.4;` |
| `val` | `base-(base-tgt)*Math.min(1,curve);` |
| `sBadge` | `(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});` |
| `offTrack` | `sectorCos.length-onTrack;` |
| `avgAlign` | `sectorCos.length?+(sectorCos.reduce((a,c)=>a+c.alignment,0)/sectorCos.length).toFixed(1):'0.0';` |
| `companyDots` | `useMemo(()=>sectorCos.map(c=>({` |
| `maturity` | `Math.floor(sr(SECTORS.indexOf(activeSector)*50+i)*4);` |
| `avgIntensity` | `Math.max(1,cos.length)?cos.reduce((a,c)=>a+c.currentIntensity,0)/Math.max(1,cos.length):0;` |
| `pct` | `base!==tgt?((base-avgIntensity)/(base-tgt))*100:100;` |
| `avg` | `cos.length?+(cos.reduce((a,c)=>a+c.alignment,0)/cos.length).toFixed(0):0;` |
| `pathVal` | `base-(base-tgt)*t;` |
| `minYear` | `2024;const maxYear=2052;const yearSpan=maxYear-minYear;` |
| `statusCounts` | `useMemo(()=>{ const c={achieved:0,'on-track':0,'at-risk':0,missed:0};` |
| `leftPct` | `Math.max(0,Math.min(97,((m.year-minYear)/yearSpan)*100));` |
| `barColor` | `m.status==='achieved'?T.green:m.status==='on-track'?T.sage:m.status==='at-risk'?T.amber:T.red;` |
| `onTrack` | `secMs.filter(m=>m.status==='on-track').length;` |
| `atRisk` | `secMs.filter(m=>m.status==='at-risk').length;` |
| `pctGreen` | `total?((achieved+onTrack)/total*100).toFixed(0):0;` |
| `sectorStats` | `useMemo(()=>SECTORS.map(sec=>{` |
| `avgGap` | `cos.length?+(cos.reduce((a,c)=>a+c.gap,0)/cos.length).toFixed(1):'0.0';` |
| `avgCapex` | `cos.length?+(cos.reduce((a,c)=>a+c.capexAlign,0)/cos.length).toFixed(0):0;` |
| `totalWeight` | `useMemo(()=>Object.values(sliders).reduce((a,b)=>a+b,0),[sliders]);` |
| `baselineAlignment` | `useMemo(()=>{ const eq=100/SECTORS.length;` |
| `topLaggards` | `useMemo(()=>[...COMPANIES].sort((a,b)=>a.alignment-b.alignment).slice(0,10),[]);` |
| `topLeaders` | `useMemo(()=>[...COMPANIES].sort((a,b)=>b.alignment-a.alignment).slice(0,5),[]);` |
| `handleSlider` | `(sec,val)=>setSliders(prev=>({...prev,[sec]:+val}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MILESTONES_DATA`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Power Sector Alignment Score | — | IEA NZE Pathway | Scores above 0.70 indicate the financed power generation mix is consistent with net-zero by 2050; coal-heavy portfolios typically score below 0.30. |
| Steel Sector Carbon Intensity (tCO2/t steel) | — | IEA / worldsteel | Global average is 1.85 tCO2/t; NZE pathway target is 0.4 tCO2/t by 2050, requiring ~80% intensity reduction. |
| Aviation Sector SAF Blend (%) | — | IATA / ICAO CORSIA | Sustainable aviation fuel blend rate; GFANZ pathway requires 65% SAF by 2050; current industry average is under 1%. |
| Shipping Alignment (CII Rating) | — | IMO CII / Poseidon Principles | Carbon Intensity Indicator rating; Poseidon Principles alignment target requires fleet average CII rating of A or B by 2030. |
- **Issuer production and emissions data (CDP / company reports)** → Normalise intensity by sector-specific production metric, compare to pathway → **Sector alignment scores by issuer**
- **IEA NZE / NGFS scenario trajectories by sector** → Interpolate pathway intensity at current and target years → **Pathway benchmark intensities**
- **Portfolio holdings with sector classification** → Weight issuer alignment scores by portfolio exposure → **Portfolio-level GFANZ sector alignment report**

## 5 · Intermediate Transformation Logic
**Methodology:** Sector Alignment Score
**Headline formula:** `Alignment_s = 1 - (Intensity_portfolio_s - Intensity_pathway_s(t)) / (Intensity_baseline_s - Intensity_pathway_s(t))`

Measures the fractional progress of each sector toward its net-zero pathway target, where 1.0 indicates full alignment and 0.0 indicates no progress from baseline. The pathway intensity at time t is interpolated from the IEA NZE or NGFS 1.5°C-aligned scenario trajectory for each sector.

**Standards:** ['GFANZ Guidance on Use of Sectoral Pathways (2022)', 'IEA Net Zero by 2050 (2021)', 'NGFS Climate Scenarios Phase 4']
**Reference documents:** GFANZ â€” Guidance on Use of Sectoral Pathways for Financial Institutions (2022); IEA Net Zero by 2050 â€” A Roadmap for the Global Energy Sector (2021); NGFS Climate Scenarios Phase 4 (2023); Poseidon Principles â€” Climate Alignment Assessment (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry describes a real GFANZ sector-
> alignment score `Alignment_s = 1 − (Intensity_portfolio − Intensity_pathway(t)) / (Intensity_baseline
> − Intensity_pathway(t))` computed from *issuer-level production and emissions data*. The **pathway
> maths is real and correctly implemented** (linear interpolation of IEA-NZE-style sector
> trajectories), but every **company's current intensity, alignment, capex-alignment, SBTi status and
> milestone progress is fabricated by the `sr()` PRNG** — there is no issuer emissions data. So the
> framework is right; the inputs are synthetic. Sections below document the real formulas and flag the
> synthetic inputs.

### 7.1 What the module computes

Per company, per sector (JSX ~line 1850+):

```js
seed      = sectorIndex*100 + companyIndex;
progress  = sr(seed)*0.6 + 0.2;                                  // SYNTHETIC 20–80% progress
current   = base2020 - (base2020 - tgt2050)*progress;           // implied current intensity
targetNow = base2020 - (base2020 - tgt2050)*((2026-2020)/(2050-2020));  // pathway at t=now
gap       = (current - targetNow)/targetNow * 100;              // % above/below pathway
alignment = clamp(100 - gap*1.5 + sr(seed+50)*20 - 10, 0, 100); // alignment score (+ noise)
scope1/2/3 = sr(seed+…)*base2020*{0.4,0.15}; scope3 = current - s1 - s2;   // SYNTHETIC
```

The pathway interpolation (`current`, `targetNow`) is exactly the guide's formula — a straight-line
draw-down from the 2020 baseline to the 2050 target. The alignment score is `100 − gap×1.5` (gap
above pathway penalised 1.5×), but with an `sr()×20 − 10` noise band bolted on, so the score is not
reproducible from the pathway alone.

### 7.2 Parameterisation (IEA-NZE-consistent sector pathways)

| Sector | Unit | 2020 baseline | 2050 1.5°C | 2050 2°C | 2050 NDC | Provenance |
|---|---|---|---|---|---|---|
| Power | gCO₂/kWh | 450 | 0 | 50 | 180 | IEA NZE / NGFS |
| Steel | tCO₂/t | 1.85 | 0.08 | 0.35 | 0.9 | worldsteel / IEA |
| Cement | kgCO₂/t | 620 | 120 | 200 | 380 | GCCA / IEA |
| O&G | kgCO₂e/boe | 55 | 8 | 18 | 32 | IEA |
| Aviation | gCO₂/RPK | 95 | 20 | 40 | 60 | IATA/ICAO |
| Shipping | gCO₂/t-nm | 12.5 | 1.8 | 3.5 | 6.5 | IMO/Poseidon |
| Auto | gCO₂/km | 180 | 0 | 20 | 65 | IEA |
| Buildings | kgCO₂/m² | 38 | 3 | 8 | 18 | CRREM/IEA |

These baseline and target intensities are **real and IEA-NZE consistent** (Power 450→0, Steel
1.85→0.08). The module also imports `SECTOR_BENCHMARKS` from the platform reference-data layer.
`MILESTONES_DATA` (37 real GFANZ/IEA milestones with `year` and `status`) is curated, not PRNG.

| Synthetic (PRNG) input | Formula |
|---|---|
| company progress | `sr(seed)*0.6 + 0.2` |
| alignment noise | `sr(seed+50)*20 − 10` |
| capex alignment | `sr(seed+99)*60 + 20` |
| region / SBTi status / transition-plan | `sr(seed+…)` categorical picks |
| scope 1/2/3 split | `sr(seed+…)*base2020*{0.4,0.15}` |

### 7.3 Calculation walkthrough

1. For each sector, interpolate the pathway intensity at "now" (`targetNow`) from 2020→2050 line.
2. Each company's `current` intensity is drawn from a synthetic `progress` fraction of that line.
3. `gap` = % by which current exceeds the pathway; `alignment` = 100 − 1.5×gap ± noise.
4. Aggregate: `avgAlign`, on-track vs off-track counts, sector stats, top leaders/laggards.
5. Milestone timeline positions each of 37 milestones by year and colours by status.
6. What-if sliders reweight sectors to show baseline-vs-adjusted portfolio alignment.

### 7.4 Worked example (a Power company)

Power: base2020 = 450, tgt2050(1.5°C) = 0. Suppose `sr(seed) = 0.5` → progress = 0.5×0.6+0.2 = 0.50.

| Step | Computation | Result |
|---|---|---|
| Current intensity | 450 − (450−0)×0.50 | 225 gCO₂/kWh |
| Pathway now (2026) | 450 − 450×(6/30) | 450 − 90 = 360 |
| Gap | (225 − 360)/360 × 100 | **−37.5%** (below pathway = ahead) |
| Alignment (no noise) | clamp(100 − (−37.5)×1.5 − 10, 0, 100) | clamp(146.25, 0, 100) = **100** |

The company is *ahead* of the linear pathway (225 < 360), so gap is negative and alignment caps at
100. Note the pathway draw-down is linear, whereas IEA NZE power decarbonisation is front-loaded —
a real GFANZ implementation would use the actual non-linear NZE curve, not a straight line.

### 7.5 Data provenance & limitations

- **Sector baseline/target intensities and the 37 milestones are real** (IEA NZE / sector bodies);
  `SECTOR_BENCHMARKS` is imported from the platform reference-data layer.
- **All company-level current intensity, alignment, capex-alignment, scope split, SBTi status and
  region are `sr()`-seeded synthetic** — no issuer emissions data enters the module.
- The pathway is **linear** 2020→2050; real sector pathways (esp. Power, Auto) are convex/front-loaded.
- The alignment score adds an `sr()×20 − 10` noise term, so it is not a deterministic function of the
  gap — two companies with identical gap get different alignment.

**Framework alignment:** *GFANZ Guidance on Use of Sectoral Pathways (2022)* — the alignment metric
(portfolio vs pathway vs baseline) follows GFANZ's fractional-progress definition. *IEA Net Zero by
2050* — sector baseline/target intensities are NZE-consistent; the pathway *should* interpolate the
real NZE curve rather than a straight line. *SBTi* — the sector decarbonisation approach and
company SBTi-status field reference SBTi validation tiers. *Poseidon Principles / IMO CII* — shipping
pathway. *CRREM* — buildings intensity pathway.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Company alignment is `sr()`-seeded with a
noise term and a linear pathway; below is the production sector-alignment model.

**8.1 Purpose & scope.** Compute issuer- and portfolio-level GFANZ sector-pathway alignment from real
production/emissions data for GFANZ membership reporting and engagement targeting across 8 hard-to-
abate sectors.

**8.2 Conceptual approach.** Physical-intensity convergence against the *actual* IEA-NZE (or NGFS
1.5°C) sector curve, benchmarked against **TPI's Carbon Performance** methodology and **PACTA/SBTi
SDA** (Sectoral Decarbonisation Approach). Portfolio alignment is production-weighted issuer
alignment.

**8.3 Mathematical specification.**

```
Pathway_s(t) = NZE_curve_s(t)                         (interpolated from published NZE points, non-linear)
Intensity_i  = Emissions_i / Production_i             (physical intensity, real data)
Alignment_i  = 1 − (Intensity_i − Pathway_s(t)) / (Baseline_s − Pathway_s(t))   (clamp 0–1)
ITR_i        = temperature at which Pathway_s(ITR) = Intensity_i   (implied temperature rise, SDA)
PortfolioAlign_s = Σ_i (Production_i/ΣProduction)·Alignment_i
```

| Parameter | Calibration source |
|---|---|
| NZE_curve_s(t) | IEA NZE 2023 sector intensity trajectories (free) |
| Baseline_s | 2020 sector intensity (IEA/worldsteel/GCCA) |
| Intensity_i | issuer CDP / annual-report emissions + production |
| ITR mapping | SBTi SDA / TPI carbon-performance benchmarks |

**8.4 Data requirements.** Issuer physical production + Scope 1–3 emissions (CDP, company reports —
free/vendor); IEA NZE sector curves (free); portfolio holdings with sector tags. Platform holds
`SECTOR_BENCHMARKS` and NGFS scenario tables; issuer intensity must be sourced (no synthetic).

**8.5 Validation & benchmarking.** Reconcile issuer alignment against TPI carbon-performance bands and
SBTi-validated targets; verify ITR against MSCI Implied Temperature Rise; backtest portfolio alignment
trend against realised emissions disclosures.

**8.6 Limitations & model risk.** Scope 3 data is sparse and inconsistent (flag DQ); production
metrics differ across issuers (normalise carefully); linear vs NZE-curve choice materially changes
alignment for front-loaded sectors — always use the published curve.

## 9 · Future Evolution

### 9.1 Evolution A — Real issuer emissions data and convex NZE pathways (analytics ladder: rung 2 → 3)

**What.** §7 flags a partial mismatch: the GFANZ alignment formula (`Alignment_s = 1 − (Intensity_portfolio − Intensity_pathway(t))/(Intensity_baseline − Intensity_pathway(t))`) is real and correctly implemented, and the sector baselines/targets plus the 37 milestones are genuine IEA-NZE reference content (`SECTOR_BENCHMARKS` from the refdata layer) — but every company's current intensity, alignment, capex-alignment, SBTi status, and milestone progress is `sr()`-fabricated, with an `sr()×20−10` noise term making even the alignment score non-deterministic in the gap. Two additional flags: the pathway is linear 2020→2050 (real Power/Auto pathways are convex/front-loaded), and there's no issuer emissions data. Evolution A feeds real issuer intensity data (from the platform's company master and financed-emissions modules) into the already-correct formula, removes the noise term, and interpolates the actual NZE curve rather than a straight line.

**How.** (1) Replace the seeded company panel with issuer production/intensity from the company master (or PCAF-attributed emissions), so alignment is computed from real inputs. (2) Delete the `sr()×20−10` noise addend — alignment must be a deterministic function of the gap. (3) Interpolate the real NZE/NGFS sector trajectories (convex where published) instead of linear; SBTi status read from the module's SBTi data rather than seeded.

**Prerequisites.** Issuer emissions/intensity data (company master + financed-emissions vertical); NZE curve points per sector in refdata. **Acceptance:** two issuers with identical intensity gaps get identical alignment (noise gone); the pathway matches published NZE convexity; no `sr()` value drives any company metric.

### 9.2 Evolution B — GFANZ alignment and engagement copilot (LLM tier 2)

**What.** A copilot for FI net-zero teams: "which steel issuers in our book are off the GFANZ pathway, and who should we prioritise for engagement?" tool-calls the Evolution A alignment endpoint, ranks laggards by intensity gap and portfolio weight, and drafts the GFANZ-format sector alignment report.

**How.** Tier-2 tool-calling over the alignment/sector endpoints; the grounding corpus is §5/§7 (GFANZ Guidance 2022, IEA NZE, NGFS Phase 4, Poseidon Principles for shipping, CRREM for buildings are cited). The copilot's value is turning the fractional-progress score into a prioritised engagement list and milestone-monitoring narrative, every intensity and alignment figure tool-sourced. Guardrail: pre-Evolution-A it must disclose that company-level figures are synthetic and refuse issuer-specific alignment claims.

**Prerequisites.** Evolution A (no real issuer data today); RBAC-scoped portfolio data; corpus embedding. **Acceptance:** post-Evolution-A, every alignment and gap figure in a report traces to a tool call; the milestone-monitor narrative cites the real 37-milestone dataset; pre-Evolution-A, issuer alignment questions are refused.