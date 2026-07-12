# SLL/SLB Analytics
**Module ID:** `sll-slb-v2` · **Route:** `/sll-slb-v2` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sustainability-linked loan and bond KPI tracking with step-up/down coupon mechanics, SPT ambition assessment and ICMA/LMA framework compliance verification.

> **Business value:** Manages the full lifecycle of SLL and SLB KPI monitoring, SPT assessment and coupon adjustment mechanics.

**How an analyst works this module:**
- Register all SLL/SLB instruments with their KPI-SPT pairs and observation dates.
- Collect verified KPI performance data from external verifiers and issuer reports.
- Assess SPT achievement and calculate applicable step-up or step-down coupon adjustments.
- Report SPT performance trend and flag instruments approaching observation date.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `CURRENCIES`, `ISSUERS`, `KPIS`, `SECTORS`, `Stat`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['SLL','SLB','SLL-RCF','SLB-Green','SLL-Term','SLB-Social'];` |
| `KPIS` | `['GHG Scope 1+2 Reduction','Renewable Energy %','Water Intensity','Gender Diversity %','Lost Time Injury Rate','Recycling Rate','Energy Efficiency','Biodiversity Score','Community Investment','Supply Chain Audit %'];` |
| `ISSUERS` | `['Enel SpA','Orsted A/S','Iberdrola SA','NextEra Energy','Schneider Electric','Danone SA','Novartis AG','Holcim Ltd','Suzano SA','Tesco PLC','Engie SA','SSE PLC','AGL Energy','CLP Holdings','Woolworths Group','Natura & C` |
| `facilities` | `Array.from({length:60},(_,i)=>{ const s=sr(i*7); const s2=sr(i*13); const s3=sr(i*19);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createOb` |
| `filtered` | `useMemo(()=>{let d=[...facilities];if(search)d=d.filter(r=>r.issuer.toLowerCase().includes(search.toLowerCase())\|\|r.kpi.toLowerCase().includes(search.toLowerCase()));if(filterSector!=='All')d=d.filter(r=>r.sector===filterSector);if(filterType!=='All')d=d.filter(r=>r.type===filterType);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1` |
| `totalNotional` | `facilities.reduce((s,f)=>s+f.notional,0);` |
| `avgIcma` | `Math.round(facilities.reduce((s,f)=>s+f.icmaAlign,0)/facilities.length);` |
| `sectorAgg` | `useMemo(()=>SECTORS.map(s=>{const fs=facilities.filter(f=>f.sector===s);return {sector:s,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).filter(s=>s.count>0),[]);` |
| `typeAgg` | `useMemo(()=>TYPES.map(t=>{const fs=facilities.filter(f=>f.type===t);return {type:t,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).filter(t=>t.count>0),[]);` |
| `marginScenario` | `useMemo(()=>Array.from({length:scenarioYears},(_,i)=>{ const yr=2026+i;const base=marginSlider;const up=base+stepUpSlider*(i+1);const down=Math.max(base-stepDownSlider*(i+1),0);` |
| `costImpact` | `useMemo(()=>{const notional=500;return marginScenario.map(m=>({year:m.year,baseCost:+(notional*m.base/10000).toFixed(2),stepUpCost:+(notional*m.stepUp/10000).toFixed(2),stepDownCost:+(notional*m.stepDown/10000).toFixed(2` |
| `complianceData` | `useMemo(()=>facilities.map(f=>{const icma=f.icmaAlign>=80;const lma=f.lmaAlign>=75;const verified=f.verifier!=='';const overall=icma&&lma&&verified?'Compliant':icma\|\|lma?'Partial':'Non-Compliant';return {...f,icmaPass:ic` |
| `pct` | `f.kpiBaseline>0?Math.round(((f.kpiBaseline-f.kpiCurrent)/(f.kpiBaseline-f.kpiTarget))*100):50;` |
| `clampPct` | `Math.max(0,Math.min(100,pct));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `sll_slb_v2_engine` (services/sll_slb_v2_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SllSlbV2Engine.assess_sll_slb_quality` | request |  |
| `SllSlbV2Engine.calibrate_spt` | request |  |
| `SllSlbV2Engine.calculate_margin_impact` | request |  |
| `SllSlbV2Engine.screen_greenwashing_flags` | request |  |
| `SllSlbV2Engine._score_kpi_materiality` | kpis, sector |  |
| `SllSlbV2Engine._score_spt_ambition` | spt, sector |  |
| `SllSlbV2Engine._assess_margin_mechanism` | inst |  |
| `SllSlbV2Engine._score_verification` | inst |  |
| `SllSlbV2Engine._quick_greenwash_check` | inst, spts, kpi_mat_scores |  |
| `SllSlbV2Engine._build_recommendations` | comp_scores, gw_flags, inst, kpi_mat_scores, spt_amb_scores |  |

**Engine `sll_slb_v2_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SECTORS_LIST` | `['oil_gas', 'utilities_power', 'metals_mining', 'chemicals', 'automotive', 'aviation', 'shipping', 'real_estate', 'agriculture_food', 'retail_apparel', 'technology_telecom', 'financial_services', 'healthcare_pharma', 'construction', 'forest_paper', 'consumer_goods', 'logistics_transport', 'waste_man` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `FY2024` *(shared)*, `__future__` *(shared)*, `borrower`, `exc` *(shared)*, `fastapi` *(shared)*, `issuer` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `CURRENCIES`, `ISSUERS`, `KPIS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Instruments Tracked | — | SLL/SLB register | Total sustainability-linked loans and bonds under active KPI monitoring. |
| SPT Achievement Rate | — | Verification agent | Share of KPI-SPT pairs achieving target in the most recent observation period. |
| Step-Up Events | — | Coupon tracker | Instruments triggering step-up coupon premium due to SPT failure in the period. |
- **Instrument terms, KPI data, SPT thresholds, verification reports** → SPT assessment, coupon step calculation, trend analysis → **SPT achievement dashboards, step-up alerts, ICMA compliance reports**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sll-slb-v2/ref/icma-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['instrument_type', 'source', 'components', 'spt_calibration_criteria', 'margin_ratchet_types', 'margin_ratchet_market_data', 'greenwashing_red_flags', 'market_reference'], 'n_keys': 8}`

**GET /api/v1/sll-slb-v2/ref/kpi-materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['note', 'source', 'kpi_count', 'sector_count', 'sectors', 'kpi_definitions', 'matrix'], 'n_keys': 7}`

**GET /api/v1/sll-slb-v2/ref/sda-trajectories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'methodology', 'sectors_count', 'trajectories'], 'n_keys': 4}`

**GET /api/v1/sll-slb-v2/ref/verification-agents** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['spo_providers', 'spo_market_share_2023', 'verification_standards', 'external_reviewer_requirements'], 'n_keys': 4}`

**POST /api/v1/sll-slb-v2/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sll-slb-v2/calibrate-spt** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sll-slb-v2/greenwashing-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sll-slb-v2/margin-impact** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SPT Achievement Rate
**Headline formula:** `KPIs Meeting Sustainability Performance Target ÷ Total KPIs × 100`

Proportion of sustainability-linked instrument KPIs achieving their pre-defined Sustainability Performance Targets in the verification period.

**Standards:** ['ICMA SLB Principles', 'LMA SLL Principles']
**Reference documents:** ICMA Sustainability-Linked Bond Principles 2023; LMA/APLMA/LSTA Sustainability-Linked Loan Principles 2023; ICMA KPI Registry; ESMA ESG Rating Regulation 2023

**Engine `sll_slb_v2_engine` — extracted transformation lines:**
```python
kpi_verif = sum(1 for k in kpis if k.is_externally_verifiable) / max(1, len(kpis))
kpi_sci_bench = sum(1 for k in kpis if k.has_science_based_benchmark) / max(1, len(kpis))
predefined_pct = sum(1 for s in spts if s.is_predefined_at_issuance) / max(1, len(spts))
base_verified_pct = sum(1 for s in spts if s.has_independent_base_year_verification) / max(1, len(spts))
weights = [m / sum(max_scores) for m in max_scores]
alignment_pct = sum(w * s for w, s in zip(weights, named_components))
sda_target_at_year = targets[str(years[-1])]
frac = (request.target_year - years[i]) / (years[i + 1] - years[i])
sda_reduction_required = (baseline - sda_target_at_year) / baseline * 100
performance_vs_sda = issuer_reduction - sda_reduction_required
rec_tightening = round(abs(performance_vs_sda) + 2.0, 1)
p_miss = 1.0 - p_hit
base_annual = notional * (base_bps / 10_000)
hit_margin_bps = base_bps - step_down
miss_margin_bps = base_bps + step_up
miss_margin_bps = base_bps + step_up
hit_margin_bps = base_bps - step_down * 0.5
miss_margin_bps = base_bps + step_up * 0.5
hit_annual = notional * (hit_margin_bps / 10_000)
miss_annual = notional * (miss_margin_bps / 10_000)
expected_annual = p_hit * hit_annual + p_miss * miss_annual
ev_mechanism = expected_annual - base_annual
risk_score = min(100.0, major * 20 + moderate * 10 + minor * 5)
reduction_pct = (spt.base_year_value - spt.target_value) / spt.base_year_value * 100
delta = reduction_pct - sda_reduction
delta = reduction_pct - sda_reduction
ambition_score = max(0.0, min(100.0, 50.0 + delta * 2.0))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **48** other module(s).

| Connected module | Shared via |
|---|---|
| `esg-data-quality` | table:FY2024 |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

The page seeds **60 synthetic SLL/SLB facilities** (`sr(i*7)`, `sr(i*13)`, `sr(i*19)` PRNG draws) across 10
sectors and 6 instrument sub-types (`SLL`, `SLB`, `SLL-RCF`, `SLB-Green`, `SLL-Term`, `SLB-Social`). Each
facility carries a KPI (drawn from a 10-item list: GHG reduction, renewable %, water intensity, gender
diversity, LTIR, recycling rate, energy efficiency, biodiversity score, community investment, supply-chain
audit %), a baseline/current/target triple, margin economics (base margin, step-up bps, step-down bps), an
ICMA/LMA alignment score, and a categorical `breachRisk` (High/Medium/Low). Four tabs cover: portfolio
listing, KPI performance tracking, margin-ratchet pricing impact, and ICMA/LMA compliance + a structuring
wizard.

The guide's headline metric — **SPT Achievement Rate = KPIs meeting SPT ÷ Total KPIs × 100** — is not
computed as a single portfolio statistic anywhere in the code. What the code actually computes per facility
is a **progress-to-target percentage** and a binary on-track flag, which is the closest functional analogue:

```js
pct       = kpiBaseline > 0 ? round(((kpiBaseline − kpiCurrent) / (kpiBaseline − kpiTarget)) × 100) : 50
clampPct  = clamp(pct, 0, 100)
onTrack   = pct >= 60
```

This assumes the KPI is a "lower is better" metric (e.g. GHG intensity, LTIR) where `baseline > target`, and
measures how far current performance has closed the baseline→target gap. For "higher is better" KPIs
(renewable %, gender diversity %) the same formula is applied without sign inversion — a latent bug the code
does not guard against, since `kpiBaseline − kpiCurrent` would be negative and `clampPct` would floor to 0
regardless of actual progress.

### 7.2 Parameterisation

| Field | Range / rule | Provenance |
|---|---|---|
| `notional` | $100–1,000M | synthetic (`sr(i*7)`) |
| `marginBps` | 80–300 bps | synthetic |
| `icmaAlign` / `lmaAlign` | 60–95% / 55–95% | synthetic — **no criterion-by-criterion ICMA/LMA scoring exists**; the number is a flat random draw |
| `breachRisk` | High if `sr(i*59) < 0.2`, Medium if `< 0.5`, else Low | synthetic categorical label, **not derived from KPI trajectory or margin data** |
| Compliance thresholds | ICMA pass ≥ 80%, LMA pass ≥ 75%, `verified` = verifier non-empty | hand-set thresholds, no cited source |
| Verifiers | ISS ESG, Sustainalytics, CICERO, DNV, Moody's ESG, S&P Global | real-world SLL/SLB verification agents, used as a label pool only |

### 7.3 Calculation walkthrough

- **KPI progress bar** (`pct`/`clampPct`/`onTrack`) drives the "On Track" vs "At Risk" badge per facility in
  the KPI Performance Tracker tab.
- **Margin ratchet scenario** (Pricing Impact tab): given a user-set base margin (bps) and step-up/step-down
  rates, the page projects `up = base + stepUp×(year offset)` and `down = max(base − stepDown×(year offset), 0)`
  — a simple **linear** (not compounding) ratchet over a 3/5/7/10-year horizon.
- **Cost impact**: `cost = notional($500M assumed) × margin(bps) / 10,000` converts basis points to a dollar
  interest cost on a fixed $500M reference notional, independent of any individual facility's actual notional.
- **Compliance overall status**: `Compliant` if both ICMA and LMA thresholds pass and a verifier is assigned;
  `Partial` if only one passes; else `Non-Compliant`.

### 7.4 Worked example

Facility with `kpiBaseline=60%`, `kpiTarget=20%`, `kpiCurrent=32%` (e.g. GHG intensity reduction pathway),
`marginBps=150`, `stepUpBps=15`, `stepDownBps=10`:

| Step | Computation | Result |
|---|---|---|
| Progress % | round(((60−32)/(60−20))×100) | **70%** |
| Clamp | min(100, max(0, 70)) | 70% |
| On track? | 70 ≥ 60 | **Yes** |
| Year-3 step-up margin | 150 + 15×3 | 195 bps |
| Year-3 step-down margin | max(150 − 10×3, 0) | 120 bps |
| Step-up annual cost ($500M ref) | 500 × 195/10,000 | **$9.75M** |
| Step-down annual cost | 500 × 120/10,000 | **$6.00M** |
| Net saving if SPT met | 9.75 − 6.00 | **$3.75M/yr** |

### 7.5 Compliance & structuring rubric

| Status | Rule |
|---|---|
| Compliant | ICMA ≥ 80% **and** LMA ≥ 75% **and** verifier assigned |
| Partial | ICMA ≥ 80% **or** LMA ≥ 75% (not both) |
| Non-Compliant | Neither threshold met |

The "Structuring Wizard" (5 steps: instrument type → KPI/SPT definition → margin ratchet → verification →
review) is a UI walkthrough only — it does not persist selections into the facility model or recompute
pricing; it is a form-filling demonstration of the SLL/SLB origination workflow.

### 7.6 Data provenance & limitations

- **All 60 facilities are synthetic**, generated by the platform's `sr(seed) = frac(sin(seed+1)×10⁴)` PRNG.
  Issuer names (Enel, Ørsted, Iberdrola, etc.) are real-world SLL/SLB market participants used as label
  pools, not actual deal data.
- `icmaAlign`/`lmaAlign` are flat random scores with **no underlying principle-level assessment** (ICMA SLB
  Principles has 5 core components: KPI selection, SPT calibration, bond characteristics, reporting,
  verification — none are individually scored here).
- `breachRisk` is an independent random draw, **uncorrelated with the facility's own KPI progress** — a
  facility can show 95% progress-to-target yet be labelled "High" breach risk, and vice versa. This is a
  genuine logic gap, not just a simplification.
- The margin ratchet model is linear and does not model compounding step mechanics, multi-KPI margin
  allocation (ICMA allows splitting the total ratchet across multiple KPIs), or the "SPT observation date"
  cliff-edge mechanic used in real facility agreements.

### 7.7 Framework alignment

- **ICMA Sustainability-Linked Bond Principles (2023)** — 5 core components named in the guide; the module
  implements only the "SPT achievement" concept at a facility level and a flat alignment score, not the
  component-by-component checklist.
- **LMA/APLMA/LSTA Sustainability-Linked Loan Principles (2023)** — same partial coverage via `lmaAlign`.
- **Margin ratchet mechanics** (step-up on SPT miss, step-down on SPT hit) are directionally correct to
  market practice but implemented as a flat linear bps schedule rather than the fixed one-time adjustment
  (typically ±5–25bps at the annual observation date) used in actual SLL/SLB documentation.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

A production SLL/SLB analytics engine must support two decisions: (1) **pre-issuance structuring** — is a
proposed KPI/SPT/ratchet combination "ambitious" enough to withstand greenwashing scrutiny (ICMA KPI
materiality + SPT ambition tests), and (2) **ongoing surveillance** — probability that each facility misses
its next SPT observation date and the resulting margin/coupon cash-flow impact. Scope: corporate SLL
revolvers and SLB coupons, single or multi-KPI, annual or semi-annual observation.

### 8.2 Conceptual approach

Benchmark against **ICMA's SPT Ambition Assessment framework** (comparing target trajectory to (a) the
issuer's own historical trend, (b) sector benchmarks/SBTi pathways, and (c) regulatory minimums) and against
**MSCI/Sustainalytics second-party-opinion (SPO) scoring**, which grades each of the 5 ICMA components
0–100 and aggregates to an overall alignment score — rather than a single flat random number. SPT-miss
probability should be modelled analogously to a **covenant-breach / financial-ratio migration model** (as
used in leveraged-loan covenant surveillance): treat the KPI trajectory as a mean-reverting process and
compute a breach probability from the distance-to-target relative to the historical volatility of KPI
delivery, structurally similar to a Merton-style distance-to-default but on a non-financial metric.

### 8.3 Mathematical specification

**SPT ambition score** (0–100), replacing the current flat `icmaAlign`:
```
Ambition = 0.35·TrajectoryScore + 0.25·SectorBenchmarkScore + 0.20·MaterialityScore + 0.20·GovernanceScore
TrajectoryScore = 100 × clip((baseline − target)/(baseline − sectorBestPractice), 0, 1)
```
where `sectorBestPractice` is the SBTi/CRREM-style top-quartile pathway for the issuer's sector.

**SPT-miss probability** at the next observation date `t`:
```
z_t = (target_t − E[KPI_t]) / σ_KPI
P(miss) = Φ(z_t)                      // Φ = standard normal CDF
E[KPI_t] = KPI_0 + trend × t          // trend = OLS slope of last 3 years' disclosed KPI values
σ_KPI = stdev of YoY KPI changes (min 3 years history; else sector-median volatility prior)
```

**Expected margin cash-flow impact**:
```
E[ΔCoupon] = P(miss) × stepUpBps + (1 − P(miss)) × (−stepDownBps)
E[AnnualCost] = Notional × (BaseBps + E[ΔCoupon]) / 10,000
```

| Parameter | Calibration source |
|---|---|
| Sector best-practice pathway | SBTi sector decarbonisation pathways (public) |
| σ_KPI prior (no history) | Sector-median KPI volatility, e.g. IEA/CDP disclosure panels |
| Step-up/down bps | Deal-specific (LMA/ICMA standard range 5–25bps) |
| SPO component weights | Approximate to Sustainalytics/ISS ESG published SPO rubric weighting |

### 8.4 Data requirements

- Time series of KPI disclosures (≥3 years) per issuer — CDP, issuer sustainability reports, or platform's
  `reference_data` OWID/SBTi tables for sector pathways.
- SPO reports (ISS ESG, Sustainalytics, CICERO) for component-level alignment scores — currently only used
  as a label, not ingested as structured data.
- Facility legal terms (step-up/down bps, observation dates, multi-KPI weighting) — would live in a new
  `sll_slb_facilities` schema table (none currently exists for this module beyond the frontend seed).

### 8.5 Validation & benchmarking plan

Backtest `P(miss)` against realised SPT outcomes (Bloomberg SLL/SLB KPI tracker, ICMA's own SPT database)
using a Brier score / calibration plot. Reconcile the ambition score against published SPO scores for the
same issuer-KPI pairs (ISS ESG, Sustainalytics) — target within ±10 points. Stress-test the breach model
under sector-wide shocks (e.g. energy-price spike raising fossil-fuel sector emissions intensity).

### 8.6 Limitations & model risk

Small-sample KPI history (many issuers have <3 years of comparable disclosure) makes σ_KPI unreliable;
fall back to sector-median volatility with a documented conservative haircut. The normal-CDF breach model
does not capture jump risk from M&A, divestment, or KPI-definition changes, which are common SPT-miss
triggers in practice and would need a qualitative overlay flag.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing endpoints and the higher-is-better progress bug, then component-score ICMA (analytics ladder: rung 1 → 3)

**What.** The engine (`sll_slb_v2_engine`, blast radius 48 — one of the most-depended-on on the platform) has genuine methods (`assess_sll_slb_quality`, `calibrate_spt`, `screen_greenwashing_flags`, `calculate_margin_impact`), but the lineage sweep records `POST /assess` and `/greenwashing-screen` as **failed** and the other two POSTs as skipped, so the backend is effectively unexercised. Meanwhile the frontend runs on 60 `sr()`-synthetic facilities with two documented defects: the progress formula `(baseline−current)/(baseline−target)` floors to 0 for higher-is-better KPIs (renewable %, gender diversity) because it lacks sign inversion (§7.1 latent bug), and `breachRisk` is an independent random draw uncorrelated with a facility's own progress (§7.6, "a genuine logic gap"). Evolution A fixes the plumbing and the math.

**How.** (1) Triage the two 500-ing POST routes (the deployment-prep sweep's methodology). (2) Fix the progress formula: detect KPI direction and invert (`(current−baseline)/(target−baseline)` for higher-is-better), guarded. (3) Derive `breachRisk` from computed progress-to-target and time-to-observation-date rather than a draw. (4) Replace the flat `icmaAlign`/`lmaAlign` scores with the engine's real component logic — `_score_kpi_materiality` and `_score_spt_ambition` exist but the page ignores them; surface the ICMA SLBP five-component breakdown. (5) Model the real ±5–25bps one-time observation-date adjustment instead of the linear bps schedule.

**Prerequisites.** The `/assess` and `/greenwashing-screen` failures are the gate; because blast radius is 48, engine edits need the shared-engine regression check. **Acceptance:** all four POST routes pass the lineage sweep; a 90%-renewable-progress facility no longer shows 0%; breachRisk correlates with progress.

### 9.2 Evolution B — Greenwashing-screen and margin-impact analyst (LLM tier 2)

**What.** A tool-calling analyst over the (repaired) endpoints: "screen this SLB for greenwashing flags", "what's the margin impact if this KPI misses at the observation date", "is this SPT ambitious versus the SDA trajectory". Each calls `POST /greenwashing-screen`, `/margin-impact`, or `/calibrate-spt` and narrates the engine's structured output — the five ICMA components, the SDA-benchmarked ambition, the bps ratchet — with the greenwashing verdict grounded in `screen_greenwashing_flags` rather than LLM opinion.

**How.** Tool schemas from the module's OpenAPI operations plus the four `GET /ref/*` endpoints (icma-principles, kpi-materiality, sda-trajectories, verification-agents) as the citation corpus. The no-fabrication validator checks every bps and score against tool outputs; greenwashing flags must each cite the specific principle component that triggered them.

**Prerequisites (hard).** Evolution A — the greenwashing-screen endpoint currently fails, so there is nothing to narrate; and narrating the buggy progress figures would mislabel on-track facilities. **Acceptance:** every flag traces to a `/greenwashing-screen` response component; margin figures match `/margin-impact`; asking to screen a facility while the endpoint 500s surfaces the error, not an invented verdict.