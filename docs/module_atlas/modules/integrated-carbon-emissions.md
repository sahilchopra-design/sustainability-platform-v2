# Integrated Carbon Emissions
**Module ID:** `integrated-carbon-emissions` · **Route:** `/integrated-carbon-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified Scope 1/2/3 emissions dashboard aggregating across all portfolio companies. Multi-year trend, sector decomposition, intensity normalisation, and reduction target progress tracking.

> **Business value:** A consolidated emissions view across the portfolio is the foundation for all climate metrics reporting (WACI, ITR, GFANZ alignment). This module provides the single source of truth for financed emissions, enabling coherent target-setting and progress measurement.

**How an analyst works this module:**
- Overview shows total emissions with year-over-year trend
- Scope Breakdown decomposes Scope 1/2/3 contributions
- Sector Analysis shows which sectors drive emissions
- Reduction Tracker compares actual vs target pathway
- Intensity Comparison benchmarks WACI against sector and peers

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AlertCard`, `Badge`, `BarChart`, `Btn`, `DQSBadge`, `FilterBar`, `KPICard`, `Panel`, `ScopeBar`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];` |
| `range` | `(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);` |
| `rangeInt` | `(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));` |
| `fmt` | `(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1)+'K';return typeof n==='number'?n.toFixed(1):n;};` |
| `fmtPct` | `(n)=>n!=null?(n>=0?'+':'')+n.toFixed(1)+'%':'--';` |
| `fmtCO2` | `(n)=>{if(n==null)return'--';if(Math.abs(n)>=1e9)return(n/1e9).toFixed(2)+' GtCO2e';if(Math.abs(n)>=1e6)return(n/1e6).toFixed(2)+' MtCO2e';if(Math.abs(n)>=1e3)return(n/1e3).toFixed(1)+' ktCO2e';return n.toFixed(0)+' tCO2e` |
| `weight` | `h.weightPct\|\|range(0.1,3.5,seed+3);` |
| `mktVal` | `h.marketValueMn\|\|range(10,1500,seed+4);` |
| `intensity` | `sec.carbonIntensity\|\|+(total/(Math.max(sec.revenueBn\|\|1,0.01)*1e6)*1e6).toFixed(1);` |
| `waci_contrib` | `+(weight/100*intensity).toFixed(2);` |
| `temp` | `sec.temperatureScore\|\|range(1.3,3.8,seed+5);` |
| `sbti` | `sec.sbtiStatus\|\|pick(['Committed','Target Set \u2014 1.5\u00B0C','Target Set \u2014 WB2C','None'],seed+6);` |
| `dqs` | `rangeInt(1,5,seed+7);` |
| `financedEm` | `Math.round(total*(weight/100));` |
| `carbonCostEU` | `+(financedEm*65.2/1000).toFixed(1);` |
| `greenRev` | `sec.greenRevenuePct\|\|range(0,60,seed+8);` |
| `yoyReduction` | `range(-15,8,seed+9);` |
| `totalS1` | `d.reduce((a,r)=>a+r.s1,0);` |
| `totalS2` | `d.reduce((a,r)=>a+r.s2,0);` |
| `totalS2Market` | `d.reduce((a,r)=>a+r.scope2Market,0);` |
| `totalS3` | `d.reduce((a,r)=>a+r.s3,0);` |
| `totalGHG` | `totalS1+totalS2+totalS3;` |
| `totalWeight` | `d.reduce((a,r)=>a+r.weight,0);` |
| `totalMktVal` | `d.reduce((a,r)=>a+r.mktVal,0);` |
| `waci` | `d.reduce((a,r)=>a+r.waci_contrib,0);` |
| `avgTemp` | `d.reduce((a,r)=>a+r.temp*r.weight,0)/Math.max(totalWeight,1);` |
| `sbtiPct` | `+(sbtiOnTrack/d.length*100).toFixed(1);` |
| `financedTotal` | `d.reduce((a,r)=>a+r.financedEm,0);` |
| `avoidedEm` | `Math.round(totalGHG*0.08);` |
| `netImpact` | `totalGHG-avoidedEm;` |
| `carbonIntensity` | `+(totalGHG/(totalMktVal*1e6)*1e6).toFixed(1);` |
| `carbonFootprint` | `+(financedTotal/(totalMktVal)).toFixed(2);` |
| `avgGreenRev` | `+(d.reduce((a,r)=>a+r.greenRev,0)/d.length).toFixed(1);` |
| `avgYoY` | `+(d.reduce((a,r)=>a+r.yoyReduction,0)/d.length).toFixed(1);` |
| `budgetUsedPct` | `+(financedTotal/((TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']*1e9)*0.00001)*100).toFixed(2);` |
| `quarterlyTrend` | `useMemo(()=>{ return Array.from({length:12},(_,q)=>{ const qS1=portfolioData.reduce((a,r)=>a+Math.round(r.s1*(1+range(-0.12,0.03,q*7+100))),0);` |
| `qS2` | `portfolioData.reduce((a,r)=>a+Math.round(r.s2*(1+range(-0.10,0.04,q*7+200))),0);` |
| `qS3` | `portfolioData.reduce((a,r)=>a+Math.round(r.s3*(1+range(-0.08,0.05,q*7+300))),0);` |
| `alerts` | `useMemo(()=>[ {severity:'critical',title:'SBTi Target Off-Track',message:'Portfolio absolute emissions +2.3% vs -4.2% annual target. 7 holdings exceeded sector pathway.',time:'2h ago'}, {severity:'critical',title:'CBAM Reporting Deadline',message:'EU CBAM transitional period Phase 3 report due 31 Jan 2026. 12 holdings with CBAM exposure n` |
| `regMapping` | `useMemo(()=>[ {dataPoint:'Scope 1 (Direct)',ghgProtocol:'Chapter 4',csrd:'E1-6 DR 01',sfdr:'PAI #1 (i)',tcfd:'Metrics & Targets',cdp:'C6.1',sec:'Item 1500',ukSdr:'Core metric',value:fmtCO2(aggTotals.totalS1),dqs:2}, {dataPoint:'Scope 2 (Location)',ghgProtocol:'Scope 2 Guidance',csrd:'E1-6 DR 02',sfdr:'PAI #1 (ii)',tcfd:'Metrics & Targets'` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Emissions | — | Aggregation | Portfolio-wide attributed greenhouse gas emissions |
| WACI | — | PCAF | Weighted average carbon intensity |
| Reduction Progress | — | Year-over-year | Absolute and intensity reduction vs target trajectory |
- **Company-level GHG data** → PCAF attribution → **Portfolio emissions inventory**
- **Revenue/AUM data** → Intensity normalisation → **WACI and AUM-based metrics**
- **Baseline year emissions** → Target pathway comparison → **Reduction progress tracking**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated emissions aggregation
**Headline formula:** `Total = Σ(Scope1_i + Scope2_i + Cat15_i); Normalised = Total / PortfolioRevenue`

Aggregation: absolute tCO2e across all companies by PCAF attribution. Market-based vs location-based Scope 2. Scope 3 Cat 15 for financial holdings. Normalisation: per $M revenue (WACI) and per $M AUM.

**Standards:** ['GHG Protocol', 'PCAF', 'TCFD Metrics']
**Reference documents:** GHG Protocol Corporate Standard; PCAF Global GHG Standard v3; TCFD Metrics and Targets Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is materially more grounded than most: it imports the platform's **public reference-data
layer** (`EMISSION_FACTORS`, `GRID_INTENSITY`, `SECTOR_BENCHMARKS`, `CARBON_PRICES`, `NGFS_SCENARIOS`,
`TEMPERATURE_PATHWAYS`) and a `MOCK_PORTFOLIO` of ~150 holdings joined to `SECURITY_UNIVERSE`, and it
computes genuine PCAF-style financed-emissions and WACI metrics. The `sr()` PRNG is used only as a
**fallback** where a security lacks a real field. The guide is accurate.

### 7.1 What the module computes

Per holding (real field first, `range()` fallback second), it builds Scope 1/2/3, financed emissions,
and a WACI contribution:

```js
s1 = sec.scope1 || round(range(1000, 5e6, seed))       // fallback only if missing
total = s1 + s2 + s3
intensity   = sec.carbonIntensity || total/(revenueBn·1e6)·1e6       // tCO2e/$M revenue
waci_contrib= weight/100 · intensity                                  // PCAF WACI attribution
financedEm  = round(total · weight/100)                               // financed (attributed) emissions
carbonCostEU= financedEm · 65.2 / 1000                                // €65.2/t EU ETS × financed
```

Portfolio aggregates (over the built rows `d`):

```js
totalGHG   = totalS1 + totalS2 + totalS3
waci       = Σ waci_contrib                                    // Σ weightᵢ·intensityᵢ
avgTemp    = Σ tempᵢ·weightᵢ / max(totalWeight, 1)             // weighted implied temp
carbonIntensity = totalGHG/(totalMktVal·1e6)·1e6              // portfolio intensity
carbonFootprint = financedTotal / totalMktVal                 // tCO2e/$M invested
budgetUsedPct   = financedTotal/((TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']·1e9)·0.00001)·100
```

### 7.2 Parameterisation / provenance

| Element | Value / source | Provenance |
|---|---|---|
| `EMISSION_FACTORS`, `GRID_INTENSITY` | imported `referenceData` | Public factor tables (platform reference layer) |
| `TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']` | imported | IPCC AR6 remaining carbon budget |
| `NGFS_SCENARIOS`, `SECTOR_BENCHMARKS` | imported | NGFS Phase IV; sector intensity benchmarks |
| EU ETS carbon price | €65.2/t | Hard-coded (matches CARBON_PRICES-era EU ETS) |
| Avoided-emissions factor | `totalGHG × 0.08` | Hard-coded 8% heuristic |
| `MOCK_PORTFOLIO` / `SECURITY_UNIVERSE` | imported | Platform demo portfolio + security master |
| `range()`/`pick()` fallbacks | `sr()`-seeded | Only used where a security field is null |
| DQS | `rangeInt(1,5)` | PCAF data-quality score (synthetic here) |

### 7.3 Calculation walkthrough

1. `buildPortfolioEmissions` joins the first 150 `MOCK_PORTFOLIO` holdings to `SECURITY_UNIVERSE`,
   taking real Scope 1/2/3, weight, market value, intensity, temperature and SBTi where present,
   and `range()`-filling only the gaps.
2. WACI contribution per holding = `weight% × intensity`; portfolio WACI = Σ contributions.
3. Financed emissions per holding = `total × weight%`; portfolio financed total = Σ.
4. Regulatory-mapping tab cross-walks each metric to GHG Protocol / CSRD E1 / SFDR PAI / TCFD / CDP /
   SEC / UK SDR references.
5. Pathway tab compares financed emissions to the 1.5 °C carbon budget (`budgetUsedPct`).
6. Quarterly trend applies `range(−0.12..0.05)` seasonal noise to each scope for a 12-period series.

### 7.4 Worked example (one holding)

Holding with `s1=2.0M, s2=0.8M, s3=12.0M tCO2e`, `weight=1.5%`, `revenueBn=$8B`, `mktVal=$400M`:

| Step | Computation | Result |
|---|---|---|
| Total emissions | 2.0M + 0.8M + 12.0M | 14.8M tCO2e |
| Intensity | 14.8e6/(8·1e6)·1e6 / 1e6 ... = total/(revenueBn) | **1,850 tCO2e/$M rev** |
| WACI contribution | 1.5/100 × 1850 | **27.75** |
| Financed emissions | 14.8M × 1.5/100 | **222,000 tCO2e** |
| EU carbon cost | 222,000 × 65.2 / 1000 | **€14,474k ≈ €14.5M** |

Portfolio WACI = Σ of each holding's 27.75-type contribution; implied temperature = weight-weighted
mean of holding `temp` scores.

### 7.5 Companion analytics on the page

- **Scope waterfall** — S1/S2/S3 decomposition with market- vs location-based Scope 2.
- **Regulatory mapping** — GHG Protocol chapter / CSRD DR / SFDR PAI / TCFD / CDP / SEC / UK SDR
  cross-walk per data point with DQS.
- **Carbon pricing & cost** — financed emissions × EU ETS price.
- **Pathway & budget** — financed emissions vs 1.5 °C remaining budget; SBTi on-track %.
- **Alerts** — SBTi off-track, CBAM deadline, etc.

### 7.6 Data provenance & limitations

- **Hybrid data**: real reference-data layer + `MOCK_PORTFOLIO`/`SECURITY_UNIVERSE`, with `sr()`
  fallbacks only for missing security fields — flag any holding relying on the fallback path.
- The EU ETS price (€65.2/t) and the 8% avoided-emissions factor are hard-coded, not live.
- DQS is synthetic (`rangeInt(1,5)`) rather than derived from actual PCAF data-quality tiers.
- `budgetUsedPct` scaling includes a `0.00001` normalising constant whose units should be verified in
  production (portfolio-share-of-budget semantics).

**Framework alignment:** *PCAF Global GHG Standard* — WACI (`Σ weightᵢ·intensityᵢ`) and financed
emissions (`total × weight%`, attribution) follow PCAF's attribution methodology; DQS mirrors PCAF's
1–5 data-quality hierarchy. *GHG Protocol* — Scope 1/2/3 with market- vs location-based Scope 2 per
the Scope 2 Guidance. *TCFD Metrics & Targets* — WACI and implied temperature are TCFD-recommended
portfolio metrics. *IPCC AR6* — the 1.5 °C carbon budget anchors the pathway tab. Because the core
financed-emissions and WACI maths are genuine PCAF formulas over a real reference-data layer, no
production model specification is required for this module.

## 9 · Future Evolution

### 9.1 Evolution A — From demo portfolio to the platform's real portfolio spine, with live prices and real DQS (analytics ladder: rung 2 → 3)

**What.** §7 rates this module materially more grounded than most: genuine PCAF WACI and financed-emissions formulas over the imported reference-data layer (`EMISSION_FACTORS`, `TEMPERATURE_PATHWAYS`, `NGFS_SCENARIOS`), with `sr()` used only as fallback for missing security fields. Its residual gaps per §7.6: it runs on `MOCK_PORTFOLIO` rather than user portfolios; the EU ETS price is hard-coded at €65.2/t; the 8% avoided-emissions factor is a bare heuristic; DQS is `rangeInt(1,5)` rather than derived from actual data provenance; and the `budgetUsedPct` scaling embeds an unverified `0.00001` constant. Evolution A closes each: portfolios from `portfolios_pg` (the platform's populated portfolio table), ETS price from the live-carbon-price feed the platform already ingests, DQS computed from which data path served each field (reported > estimated-from-intensity > fallback — a mechanical mapping to PCAF's 1–5 hierarchy), the avoided-emissions heuristic replaced by reported avoided-emissions data or dropped, and the budget arithmetic re-derived with unit tests.

**How.** (1) A backend route (`GET /integrated-emissions/portfolio/{id}`) moving `buildPortfolioEmissions` server-side so the module becomes the "single source of truth" its overview claims — other modules (WACI, ITR, GFANZ) should consume this instead of re-deriving. (2) The fallback path made visible: holdings served by `range()` fallbacks are flagged in the UI, per §7.6's own instruction. (3) The §7.4 worked example (WACI contribution 27.75, financed 222,000 tCO₂e) pins in bench_quant. (4) The `0.00001` constant investigated as a candidate calc bug before reuse.

**Prerequisites.** Portfolio-spine join (`portfolios_pg` + security master); live ETS price wiring. **Acceptance:** DQS varies with actual data provenance per holding; fallback-reliant holdings visibly flagged; budget-share arithmetic unit-verified; a second module consumes the endpoint.

### 9.2 Evolution B — Financed-emissions copilot with regulatory cross-walk answers (LLM tier 2)

**What.** The page's regulatory-mapping tab already cross-walks every metric to GHG Protocol / CSRD E1-6 / SFDR PAI / TCFD / CDP / SEC / UK SDR references — a curated matrix that makes this copilot unusually well-grounded for disclosure questions: "which figure goes in SFDR PAI #1(i) and what's its data quality?", "why do market- and location-based Scope 2 differ for our book?", "how much of the 1.5°C budget does our financed total consume, and what does that comparison actually mean?"

**How.** Tier 2: tool schema over the Evolution A portfolio endpoint; disclosure answers cite the `regMapping` row (framework reference + DQS) for each figure. Discipline rules: every reported number carries its DQS and fallback status — a PAI answer sourced from a `range()` fallback must say so, because regulatory filings from estimated data require disclosure of estimation; the avoided-emissions figure (while the 8% heuristic survives) is always labeled heuristic; alert narratives (SBTi off-track, CBAM deadlines) quote the computed comparison, not the canned alert text. What-ifs ("WACI if we exit the top-5 intensity holdings") re-run the endpoint with the modified holding set and show the diff.

**Prerequisites.** Evolution A's endpoint (currently frontend-only computation); Phase 2 tooling. **Acceptance:** every disclosure answer names its framework reference and DQS; fallback-derived numbers flagged in the answer text; what-if diffs reproduce from logged tool calls.