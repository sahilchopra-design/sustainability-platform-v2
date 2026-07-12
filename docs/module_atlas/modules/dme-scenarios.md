# DME Scenarios
**Module ID:** `dme-scenarios` · **Route:** `/dme-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scenario-based materiality evolution projections showing how ESG topic scores are expected to change under different macro, policy, and physical climate futures. Integrates NGFS, IEA, and IPCC scenario pathways with DME topic drivers to produce forward materiality trajectories. Scenario comparison highlights which topics diverge most between pathways.

> **Business value:** Equips strategy and risk teams with a forward-looking view of how ESG materiality will evolve under different macro scenarios, supporting resilient strategy design and TCFD scenario analysis disclosure requirements.

**How an analyst works this module:**
- Select the entity or portfolio scope and the forward horizon (2025, 2030, 2035, 2050)
- Choose scenarios from the NGFS library or define a custom scenario in Scenario Settings
- Review the topic trajectory chart showing materiality score evolution under each scenario
- Compare scenarios side-by-side and export the divergence analysis for TCFD strategy disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CATEGORY_COLORS`, `KpiCard`, `LS_PORTFOLIO`, `NGFS_SCENARIOS`, `SECTOR_PATHWAYS`, `SectionHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 7 | `name`, `category`, `color`, `temp`, `physical_weight`, `transition_weight`, `carbon_price_2030`, `carbon_price_2050`, `emissions_2030`, `emissions_2050`, `renewable_2050`, `gdp_impact`, `sea_level_2100` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(v, d = 1) => v == null ? '—' : typeof v === 'number' ? (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(d)) : v;` |
| `exposureFactor` | `fossilRevPct * carbonIntensity * carbonPrice / 1e6;` |
| `pdDelta` | `scenarioPD - basePD;` |
| `exposure` | `(c.market_cap_usd_mn \|\| 500) * (0.01 + sr(h, 1) * 0.04);` |
| `basePD` | `0.005 + sr(h, 2) * 0.04;` |
| `baseWACC` | `0.06 + sr(h, 3) * 0.06;` |
| `physExposure` | `0.1 + sr(h, 4) * 0.6;` |
| `transExposure` | `0.1 + sr(h, 5) * 0.7;` |
| `fossilRevPct` | `c.sector === 'Energy' ? 0.4 + sr(h, 6) * 0.5 : c.sector === 'Utilities' ? 0.2 + sr(h, 6) * 0.4 : sr(h, 6) * 0.15;` |
| `carbonIntensity` | `(c.ghg_intensity_tco2e_per_mn \|\| 200 + sr(h, 7) * 800);` |
| `timeH` | `(horizon - 2025) / 5;` |
| `entityResults` | `targetHoldings.map(h => {` |
| `sectorMult` | `1 + sp.carbon_price_sensitivity * (carbonPrice / 100);` |
| `strandProb` | `strandedAssetProbability(h.fossilRevPct, carbonPrice, h.carbonIntensity / 1000, timeH);` |
| `scenPD` | `scenarioAdjustedPD(h.basePD, sectorMult, sc.physical_weight, sc.transition_weight, h.physExposure * (timeH / 5), h.transExposure * (timeH / 5));` |
| `sectorComparison` | `useMemo(() => { return Object.entries(SECTOR_PATHWAYS).map(([sector, sp]) => ({ sector: sector.length > 16 ? sector.slice(0, 14) + '..' : sector, fullSector: sector, carbonSensitivity: Math.round(sp.carbon_price_sensitivity * 100), strandedRisk: Math.round(sp.stranded_asset_risk * 100), techReadiness: Math.round(sp.tech_readiness * 100), ` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `rows` | `scenarioResults.map(r => ({` |
| `avgStrand` | `r.entityResults.length > 0 ? r.entityResults.reduce((s, e) => s + e.strandProb, 0) / r.entityResults.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scenario Set | — | NGFS scenario library | Number and source of macro-climate scenarios used as inputs to materiality evolution modelling |
| Highest Divergence Topic | — | Scenario comparison engine | Topic with the largest materiality score difference between the most and least stringent scenarios |
| Portfolio Avg Materiality (2030, NZ2050) | — | DME scenario projection | Projected exposure-weighted portfolio materiality score in 2030 under Net Zero 2050 scenario |
| Portfolio Avg Materiality (2030, HHW) | — | DME scenario projection | Projected portfolio materiality score in 2030 under Hot House World (3°C+) scenario |
- **NGFS/IEA/IPCC scenario parameter sets (policy, physical, technology)** → Topic driver mapping: which scenario parameters affect which DME topic scores → **Topic-scenario sensitivity matrix**
- **DME current materiality scores (baseline)** → Forward projection using scenario parameter trajectories and topic driver sensitivities → **Materiality score time series per topic per scenario to 2050**
- **Scenario comparison engine** → Cross-scenario materiality divergence calculation → **Divergence heatmap and ranking of topics by scenario sensitivity**

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario Materiality Shift
**Headline formula:** `SMSₛᵢ = EMSᵢᵀ − EMSᵢ₀ = f(Policyₛ, Physicalₛ, Technologyₛ)`

The scenario materiality shift captures the projected change in entity topic score from the current baseline to a future horizon T under scenario s, driven by policy stringency, physical hazard intensity, and technology cost trajectory parameters. Scenarios span Orderly (Net Zero 2050), Disorderly, and Hot House World NGFS categories.

**Standards:** ['NGFS Scenarios 2023', 'IPCC AR6 SSP Pathways', 'TCFD Scenario Analysis Guidance']
**Reference documents:** NGFS (2023) Scenarios for Central Banks and Supervisors â€” Phase 4; IPCC AR6 WG3 (2022) SSP Pathways and Mitigation Scenarios; TCFD (2021) Guidance on Scenario Analysis for Non-Financial Companies; IEA (2023) World Energy Outlook â€” Net Zero by 2050 Scenario

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The DME NGFS Scenario Engine (EP-U3) reprices a portfolio under **6 NGFS Phase IV scenarios**, computing
scenario-adjusted PD, stranded-asset probability, WACC uplift, VaR, EL and valuation impact, with sector
transition pathways and a 2030→2050 carbon-price/emissions interpolation. It carries genuinely detailed
scenario parameter tables. No guide record supplied → no mismatch flag; caveat is on synthetic holdings.

### 7.1 What the module computes

```js
scenarioAdjustedPD = basePD · sectorMult · (1 + physWeight·physExposure + transWeight·transExposure)
strandedAssetProb  = min(0.99, 1 − exp(−exposureFactor·timeHorizon/10)),
                     exposureFactor = fossilRevPct · carbonIntensity · carbonPrice / 1e6
WACC_scenario      = baseWACC + (scenarioPD − basePD)·0.5
VaR                = exposure · scenarioPD · 0.45 · confidence         // LGD fixed 45%
EL                 = exposure · scenarioPD · 0.45
valuationImpact    = −exposure · (scenarioPD − basePD)·2.5             // 2.5× DCF-style repricing
```
Scenario values are **time-interpolated** linearly between the 2030 and 2050 anchors:
`carbonPrice(h) = cp2030 + t·(cp2050 − cp2030)`, `t = (h−2030)/20`.

### 7.2 Parameterisation / scoring rubric

**NGFS Phase IV scenarios** — the core, well-populated table:

| Scenario | Category | Temp | Phys wt | Trans wt | Carbon $2030 | Carbon $2050 | GDP impact | SLR 2100 |
|---|---|---|---|---|---|---|---|---|
| Net Zero 2050 | Orderly | 1.5°C | 0.20 | 0.80 | 130 | 250 | −1.5% | 43 cm |
| Below 2°C | Orderly | 1.7°C | 0.35 | 0.65 | 80 | 200 | −2.0% | 55 cm |
| Divergent Net Zero | Disorderly | 1.5°C | 0.25 | 0.75 | 150 | 300 | −2.5% | 45 cm |
| Delayed Transition | Disorderly | 1.8°C | 0.40 | 0.60 | 20 | 350 | −3.5% | 60 cm |
| NDCs | Hot House | 2.5°C | 0.70 | 0.30 | 30 | 50 | −4.5% | 82 cm |
| Current Policies | Hot House | 3.0°C | 0.85 | 0.15 | 10 | 15 | −8.0% | 110 cm |

**Sector pathways** (`SECTOR_PATHWAYS`, 11 GICS) — carbon-price sensitivity, stranded-asset risk, capex,
workforce transition, tech readiness, peak-risk year. E.g. Energy: sensitivity 0.85, stranded 0.75, peak
2030; IT: sensitivity 0.15, stranded 0.05, peak 2040.

| Constant | Value | Provenance |
|---|---|---|
| Fixed LGD | 0.45 | VaR/EL |
| WACC-PD elasticity | 0.5 | heuristic (½ of PD delta) |
| Valuation multiple | 2.5× | DCF-style repricing heuristic |
| Stranding time-scaling | /10 | exponential hazard shaping |

Scenario physical/transition weights and carbon-price paths are **NGFS-consistent** (orderly early carbon
price, disorderly late spike in Delayed Transition, hot-house minimal price + high GDP loss). GDP impacts
and SLR are plausible NGFS/IPCC-order magnitudes.

### 7.3 Calculation walkthrough

1. `buildHoldings` enriches up to 60 master companies with seeded exposure, basePD, baseWACC, physical/
   transition exposure, fossil-revenue % (sector-conditioned) and carbon intensity.
2. For the selected scenario + horizon, each holding's scenarioPD is computed, then WACC/VaR/EL/valuation
   and stranded-asset probability.
3. Portfolio KPIs aggregate; a timeline tab interpolates carbon price/emissions across 2030–2050; a
   stranded-asset tab ranks fossil-exposed holdings.

### 7.4 Worked example (Energy holding, Delayed Transition, 2050)

Holding: basePD 2%, sectorMult (carbon sensitivity) 0.85, physExposure 0.4, transExposure 0.6, exposure
$800M, fossilRevPct 0.5, carbonIntensity 600. Delayed Transition: physWt 0.40, transWt 0.60, carbon 2050 = 350.
```
scenarioPD = 0.02·0.85·(1 + 0.40·0.4 + 0.60·0.6) = 0.017·(1 + 0.16 + 0.36) = 0.017·1.52 = 0.02584
WACC_scenario = baseWACC + (0.02584 − 0.02)·0.5 = baseWACC + 0.00292 (≈ +29 bps)
VaR (conf 2.33 ≈ 99%) = 800·0.02584·0.45·2.33 = $21.7M
EL = 800·0.02584·0.45 = $9.30M
valuationImpact = −800·(0.02584 − 0.02)·2.5 = −800·0.00584·2.5 = −$11.68M
strandedFactor = 0.5·600·350/1e6 = 0.105 ;  prob = 1 − exp(−0.105·(2050−… )/10)
```
With a 20-year horizon: `1 − exp(−0.105·20/10) = 1 − exp(−0.21) = 1 − 0.811 = 18.9%` stranded probability.

### 7.5 Data provenance & limitations

- **Holdings are synthetic**: exposure, basePD, WACC, physical/transition exposure, fossil-rev % and
  carbon intensity are `sr(seed)=frac(sin(seed+1)×10⁴)` fallbacks (real fields used where the master has them).
- LGD is fixed 45%; the valuation multiple (2.5×) and WACC elasticity (0.5) are heuristics, not calibrated
  DCF sensitivities.
- Timeline interpolation is **linear** between 2030 and 2050 — real NGFS paths are non-linear (carbon
  price ramps accelerate late in Delayed Transition).
- Scenario parameter *tables* are NGFS-consistent and are the module's real value; the *repricing maths*
  is reduced-form.

**Framework alignment:** **NGFS Phase IV** scenarios (Orderly/Disorderly/Hot-House families with carbon
price, emissions, GDP and physical variables — NGFS derives these from coupled IAM+climate models
REMIND/MESSAGE/GCAM + NiGEM macro); **TCFD/ISSB** transition-scenario analysis; stranded-asset framing per
Carbon Tracker / IEA (fossil revenue × carbon price × intensity → impairment hazard); PD/EL uplift in the
style of EBA/ECB climate stress tests.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production NGFS scenario-repricing engine giving PD/WACC/VaR/EL and stranded-asset impairment for the
covered book across the 6 NGFS scenarios and multiple horizons — supporting ICAAP climate stress and
TCFD/ISSB scenario disclosure.

### 8.2 Conceptual approach
Map NGFS scenario variables (carbon price, GDP, physical hazard) to obligor-level repricing via a
**sector-specific transmission function**, anchoring credit impact on EBA/ECB PD-uplift factors and
stranding on IEA/Carbon Tracker impairment curves. Benchmarks: NGFS Phase IV, EBA 2022 climate stress
test, ECB economy-wide stress test, MSCI Climate VaR, IEA WEO/NZE.

### 8.3 Mathematical specification
```
PD_s,t = PD_base · f_sector(carbonPrice_s,t, GDP_s,t, hazard_s,t)     (calibrated transmission)
strandedValue = assetValue · impairmentCurve_sector(carbonPrice_s,t, remainingLife)
ECL_s,t = PD_s,t · LGD_sector · EAD
ΔValue = DCF(cashflows | scenario) − DCF(cashflows | base)           (full re-DCF, not ×2.5)
Portfolio: Σ w_i · metric_i ; VaR from the scenario loss distribution across obligors
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon price / GDP / hazard | — | NGFS Phase IV variable set (public) |
| PD transmission | f_sector | EBA/ECB climate stress-test elasticities |
| Impairment curves | — | IEA NZE stranded-capacity, Carbon Tracker |
| LGD_sector | — | PCAF / recoveries |

### 8.4 Data requirements
Obligor exposure, sector, fossil-revenue share, carbon intensity, cash-flow projections for re-DCF, and
NGFS scenario variable tables (already partly encoded here). Free: NGFS scenario explorer, IEA WEO;
platform holds the scenario/sector tables and `climate_scenarios` migration.

### 8.5 Validation & benchmarking plan
Reconcile portfolio VaR against MSCI Climate VaR; sanity-check PD uplift vs EBA published stress results;
stranded-asset probabilities vs Carbon Tracker sector estimates; verify monotonicity (hot-house physical
loss ≥ orderly) and non-linear carbon-path interpolation.

### 8.6 Limitations & model risk
Scenario transmission at obligor level is deeply uncertain; linear interpolation understates late spikes;
fixed LGD and ×2.5 valuation are placeholders. Conservative fallback: report ranges across scenarios and
flag Current Policies physical loss as a floor, not a point estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings and calibrated repricing constants under NGFS vintages (analytics ladder: rung 2 → 3)

**What.** The scenario machinery is genuinely rung 2: six NGFS Phase IV scenarios with well-populated parameter tables (carbon prices, physical/transition weights, GDP impact, SLR), linear 2030→2050 interpolation, and coherent repricing formulas (`scenarioAdjustedPD`, `strandedAssetProb = 1 − exp(−exposureFactor·t/10)`, WACC uplift, EL). The weaknesses: holdings and exposures are seeded (`basePD = 0.005 + sr(h,2)·0.04`, seeded `physExposure`/`fossilRevPct`), and three load-bearing constants are asserted, not calibrated — LGD fixed at 45%, the 2.5× valuation repricing multiple, and the `/10` stranding time-scale. Evolution A grounds inputs and constants.

**How.** (1) Holdings from `portfolios_pg`; `fossilRevPct` and carbon intensity from company-master fields with honest nulls (no sector-guess fallbacks); baseline PDs from the dme-pd-engine vertical rather than seeds. (2) Scenario parameters read from the platform's ingested NGFS dataset (the Financial Modeling Studio's climate-integrated PF model already consumes NGFS vintages) so Phase V updates propagate without hand-editing the 7-row table. (3) Calibration: LGD by seniority/sector from public LGD studies instead of flat 45%; the 2.5× repricing multiple derived from a documented DCF duration argument with sensitivity bounds published in the response. (4) Server-side endpoint (`POST /api/v1/dme-scenarios/reprice`) with bench-pinned worked example per scenario.

**Prerequisites.** dme-pd-engine Evolution A (baseline PD supply); NGFS ingester coverage check. **Acceptance:** fixture portfolio repricing reproduces the §7.1 formulas by hand under Net Zero 2050 and Hot House; changing NGFS vintage changes outputs without code edits; the three formerly-hard-coded constants carry documented provenance.

### 9.2 Evolution B — TCFD scenario-analysis narrator with divergence drill-down (LLM tier 2)

**What.** The module's export step — "divergence analysis for TCFD strategy disclosure" — becomes a tool-calling analyst: "compare our portfolio under Delayed Transition vs Net Zero 2050 at 2035; which names drive the divergence and why?" It runs Evolution A's reprice endpoint per scenario, decomposes deltas by driver (carbon-price path vs physical weight vs sector multiplier), and drafts the TCFD Strategy-section narrative with the scenario descriptions taken from the stored NGFS metadata, never from model memory (scenario definitions drift between phases — a real hazard).

**How.** Tool schemas from the reprice endpoint plus a scenario-metadata GET; grounding corpus = this Atlas record's §7.1–7.2 (formulas + the scenario parameter table). Each narrative claim carries the scenario/horizon/entity triple it derives from; the no-fabrication validator checks PD deltas, stranding probabilities, and valuation impacts against tool outputs. Custom scenarios ("carbon price 30% above NZ2050") are expressed as typed parameter overrides to the endpoint — the analyst may not free-hand a scenario.

**Prerequisites (hard).** Evolution A — narrating divergence between seeded exposures would produce a TCFD disclosure built on fabricated fossil-revenue shares. **Acceptance:** a golden two-scenario comparison memo has every figure tool-traceable; asking about a scenario not in the loaded NGFS vintage refuses with the list of available scenarios.