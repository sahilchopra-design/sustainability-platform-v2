# Stress Test Orchestrator
**Module ID:** `stress-test-orchestrator` · **Route:** `/stress-test-orchestrator` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-framework stress test management platform. Coordinates ECB, BoE, Fed, APRA, and internal stress tests with scenario libraries, results aggregation, and regulatory submission packages.

> **Business value:** Managing multiple simultaneous regulatory stress tests is operationally complex. This orchestrator eliminates duplication, ensures consistent scenario application, and generates the submission packages needed for ECB SREP, BoE CBES, and other regulatory processes.

**How an analyst works this module:**
- Framework Hub shows all active stress test requirements
- Scenario Library stores NGFS and regulator-specific parameter sets
- Results Consolidator aggregates outputs from model runs
- Submission Package generates regulatory report templates
- Gap Analysis compares internal vs regulatory capital estimates

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `HOLDINGS`, `SCENARIOS`, `SECTORS_DATA`, `SECTOR_IMPACT`, `SEVERITY_MULT`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 8 | `id`, `name`, `type`, `source`, `horizon`, `carbonPrice`, `tempC`, `gdpImpact`, `severity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `SCENARIOS` | `[{id:1,name:'NGFS Net Zero 2050',type:'Orderly',source:'NGFS',horizon:'2050',carbonPrice:250,tempC:1.5,gdpImpact:-2.1,severity:'Medium'},{id:2,name:'NGFS Delayed Transition',type:'Disorderly',source:'NGFS',horizon:'2050'` |
| `SECTOR_IMPACT` | `SCENARIOS.map(s=>({scenario:s.name,...Object.fromEntries(SECTORS_DATA.map(sec=>[sec,+((sr(s.id*100+SECTORS_DATA.indexOf(sec)*7)-0.5)*SEVERITY_MULT[s.severity]*4).toFixed(1)]))}));` |
| `impacts` | `SCENARIOS.map(s=>{const sIdx=SECTORS_DATA.indexOf(secs[i]);const base=(sr(s.id*100+i*7)-0.5)*20;return{scenario:s.name,impact:+(base-SEVERITY_MULT[s.severity]*1.5).toFixed(1)};});` |
| `holdingsWithImpact` | `useMemo(()=>HOLDINGS.map(h=>{const imp=h.impacts.find(i=>i.scenario===scenarioF);return{...h,impact:imp?imp.impact:0};}),[scenarioF]);` |
| `filtered` | `useMemo(()=>{let d=[...holdingsWithImpact];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[holdingsWithImpact,search,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,` |
| `stats` | `useMemo(()=>({holdings:filtered.length,portfolioImpact:(filtered.reduce((s,r)=>s+r.impact*r.weight/100,0)).toFixed(1),worstHolding:filtered.length?[...filtered].sort((a,b)=>a.impact-b.impact)[0].name:'-',bestHolding:filtered.length?[...filtered].sort((a,b)=>b.impact-a.impact)[0].name:'-',avgImpact:(filtered.length?filtered.reduce((s,r)=>s` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='impacts');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{typ` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/stress-test-orchestrator/ref/sector-risk-profiles` | `get_sector_risk_profiles_ref` | api/v1/routes/stress_test_orchestrator.py |
| GET | `/api/v1/stress-test-orchestrator/ref/transmission-channels` | `get_transmission_channels_ref` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/run` | `run_full_stress_test` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/scenario-comparison` | `compare_all_scenarios` | api/v1/routes/stress_test_orchestrator.py |
| POST | `/api/v1/stress-test-orchestrator/pd-migration` | `compute_pd_migration` | api/v1/routes/stress_test_orchestrator.py |

### 2.3 Engine `stress_test_orchestrator_engine` (services/stress_test_orchestrator_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_sector_profile` | sector | Return sector profile; fall back to financial_services if unknown. |
| `calculate_pd_migration` | sector, scenario_id, time_horizon_year | Compute stressed PD for a sector under a given NGFS Phase IV scenario. Formula: pd_uplift = carbon_intensity × carbon_price_multiplier + physical_damage × physical_multiplier stressed_PD = baseline_PD × (1 + pd_uplift / 100) |
| `calculate_lgd_uplift` | sector, scenario_id, jurisdiction, baseline_lgd_pct | Compute stressed LGD incorporating stranded-asset and physical-damage channels. |
| `calculate_cet1_depletion` | expected_loss_bn, rwa_bn, baseline_cet1_pct | Compute stressed CET1 after expected credit loss absorption. Formula: stressed_CET1% = baseline_CET1% - (EL_bn / RWA_bn × 100) |
| `_run_single_scenario` | scenario_id, sectors, total_exposure_bn, baseline_cet1_pct, jurisdiction, regulatory_framework, time_horizon_year | Run one scenario and return full result dict. |
| `_map_sector_to_framework_category` | sector | Map NACE sector key to framework's sector risk weight category. |
| `run_stress_test` | request | Run full climate stress test across requested NGFS Phase IV scenarios. Returns pass/fail, CET1 depletion, and submission-ready dict. |
| `run_scenario_comparison` | request | Compare all NGFS Phase IV scenarios side-by-side at a single time horizon. |
| `get_regulatory_submission_template` | regulatory_framework | Return structured disclosure template for the specified regulatory framework. |
| `get_ngfs_phase4_scenarios` |  | Return full NGFS Phase IV scenario library. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sector` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `SCENARIOS`, `SECTORS_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks | — | Compliance | ECB, BoE, Fed, APRA plus internal models |
| Climate Scenarios | — | NGFS | Standard scenario set used across frameworks |
| Submission Deadlines | — | Regulatory calendar | Varies by regulator and institution size |
- **Scenario parameters** → Risk model application → **P&L and capital impact estimates**
- **Multiple regulator results** → Aggregation and reconciliation → **Consolidated stress report**
- **Stress test results** → Regulatory template population → **Submission package**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/stress-test-orchestrator/ref/ngfs-phase4-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['vintage', 'published_by', 'publication_date', 'scenarios', 'scenario_count', 'temperature_range_c', 'types'], 'n_keys': 7}`

**GET /api/v1/stress-test-orchestrator/ref/regulatory-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'framework_count', 'framework_ids', 'jurisdictions_covered'], 'n_keys': 4}`

**GET /api/v1/stress-test-orchestrator/ref/sector-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'sector_count', 'sector_ids', 'highest_carbon_intensity', 'highest_stranded_asset_risk'], 'n_keys': 5}`

**GET /api/v1/stress-test-orchestrator/ref/transmission-channels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['channels', 'channel_count', 'channel_ids', 'primary_risks'], 'n_keys': 4}`

**POST /api/v1/stress-test-orchestrator/pd-migration** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/stress-test-orchestrator/run** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/stress-test-orchestrator/scenario-comparison** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory stress test aggregation
**Headline formula:** `Combined_result = Σ(test_i × weight_i) across parallel test runs`

Each regulator has distinct methodology: ECB (3yr projection, sector-specific shocks), BoE CBES (early/late action, 3 scenarios), DFAST (adverse macro scenarios). Climate overlay applied on top of baseline stress.

**Standards:** ['ECB SREP', 'BoE PRA SS3/19', 'Fed DFAST', 'APRA CPG 229']
**Reference documents:** ECB Supervisory Review and Evaluation Process; BoE PRA Supervisory Statement SS3/19; Fed DFAST Stress Test Methodology; APRA CPG 229 Climate Risk Management

**Engine `stress_test_orchestrator_engine` — extracted transformation lines:**
```python
pd_uplift = carbon_intensity × carbon_price_multiplier + physical_damage × physical_multiplier
stressed_PD = baseline_PD × (1 + pd_uplift / 100)
horizon_scale = min(horizon_scale + (time_horizon_year - 2030) * 0.02, 1.5)
scaled_uplift = raw_uplift * horizon_scale
stressed_pd = baseline_pd + scaled_uplift
carbon_channel_pd = (carbon_intensity / 5000) * (carbon_price_2030 / 150) * 0.4
physical_channel_pd = (physical_damage / 10) * 0.3
total_stressed_pd = max(stressed_pd + carbon_channel_pd + physical_channel_pd, 0.05)
avg_peril_multiplier = sum(perils.values()) / len(perils)
stressed_lgd = base_lgd * lgd_multiplier * (1 + physical_adj)
el_over_rwa_pct = (expected_loss_bn / rwa_bn) * 100
stressed_cet1 = baseline_cet1_pct - el_over_rwa_pct
systemic_pd_uplift = gdp_dev * 0.15 + max(unemp_shock, 0) * 0.08
el_bn = sec_exp.exposure_bn * (stressed_pd / 100) * (stressed_lgd / 100) * fw_weight
rwa_bn = total_exposure_bn * avg_risk_weight
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).

| Connected module | Shared via |
|---|---|
| `sovereign-swf` | table:sector |
| `infra-debt-portfolio-manager` | table:sector |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch + confirmed defect.** The guide's formula is `Combined_result =
> Σ(test_i × weight_i)` across parallel regulator-specific test runs (ECB/BoE/Fed/APRA methodologies)
> — none of that multi-framework aggregation exists here. More importantly, **a real bug was found
> while grounding this section in code**: the severity multiplier used for both sector- and
> holding-level impact draws is `s.severity.length` — the **character count of the severity label
> string**, not a severity-ordered numeric scale. `'Medium'.length=6 > 'High'.length=4`, so scenarios
> labelled "Medium" severity are structurally capable of *larger* simulated impacts than scenarios
> labelled "High" severity — the exact opposite of the intended ordering.

### 7.1 What the module computes

8 scenarios (`SCENARIOS`) mixing real NGFS names (Net Zero 2050, Delayed Transition, Current
Policies, Below 2°C), real IEA names (Net Zero, Stated Policies), and 2 custom scenarios (Sudden
Carbon Tax, Physical Risk Extreme), each with a real-plausible `carbonPrice`, `tempC`, `gdpImpact`,
and a categorical `severity` (Low/Medium/High/Critical).

```
sectorImpact[scenario][sector]  = (sr(scenario.id×100 + sectorIdx×7) − 0.5) × severity.length × 4
holding.impacts[scenario]       = (sr(scenario.id×100 + holdingIdx×7) − 0.5) × 20  −  severity.length × 1.5
```

40 real-named holdings (Apple, Microsoft, JPMorgan, ExxonMobil, Shell, BHP, Tesla, NVIDIA, etc.),
each with a plausible sector, portfolio weight (0.5–3.5%), and current value ($50–550M), and one
`impact %` per scenario computed with the buggy severity term above.

### 7.2 Parameterisation

| Scenario | Real name? | `severity` label | `.length` (the bug's actual multiplier) | Intended severity rank |
|---|---|---|---|---|
| NGFS Below 2°C | Real | Low | 3 | 1 (mildest) |
| NGFS Delayed Transition | Real | High | 4 | 3 |
| NGFS Net Zero 2050 | Real | Medium | 6 | 2 |
| NGFS Current Policies | Real | Critical | 8 | 4 (worst) |
| IEA Net Zero | Real | Medium | 6 | 2 |
| IEA Stated Policies | Real | High | 4 | 3 |
| Sudden Carbon Tax | Custom | Critical | 8 | 4 |
| Physical Risk Extreme | Custom | Critical | 8 | 4 |

The `.length`-derived multiplier sequence by *label* is `Low=3 < High=4 < Medium=6 < Critical=8` —
**"Medium" (6) exceeds "High" (4)**, inverting the intended `Low<Medium<High<Critical` severity
ordering for two of the eight scenario cards.

### 7.3 Calculation walkthrough

1. **Scenario Dashboard** — KPI strip (temperature, carbon price, GDP impact, portfolio impact
   `Σ(holding.impact×weight/100)`, count "at risk" `<-10%`) plus a scenario-comparison table and two
   charts (sector impact bar, scenario-type pie).
2. **Portfolio Impact tab** — sortable/searchable 40-holding table with per-scenario impact %,
   CSV export, and a drill-down side panel showing one holding's impact across all 8 scenarios.
3. **Sector Stress tab** — `SECTOR_IMPACT` (precomputed for all 8 scenarios × 10 sectors) rendered
   as a stacked bar (first 5 sectors) and a "most vulnerable sectors" radar for the currently
   selected scenario, plus a carbon-price-vs-GDP-impact scatter across the 8 scenarios (using the
   scenarios' real, non-buggy `carbonPrice`/`gdpImpact` fields).
4. **Historical Comparison tab** — a static bar chart comparing "Climate Stress" (computed as
   `curScenario.gdpImpact×5`, an arbitrary ×5 scaling with no stated rationale) against 5 real
   historical crisis GDP/market impacts (GFC 2008 −37%, COVID 2020 −34%, Tech Bust 2000 −45%, etc.)
   — the historical figures are real reference points; the climate-scenario comparator is an ad-hoc
   scalar multiple of the scenario's own GDP-impact field.

### 7.4 Worked example — the severity-multiplier bug in numbers

Theoretical maximum |impact| for the sector-impact formula (`sr()∈[0,1]` so `|sr()−0.5|≤0.5`):

| Severity label | `.length` | Max |sectorImpact| = `0.5×length×4` |
|---|---|---|
| Low | 3 | **6.0** |
| High | 4 | **8.0** |
| Medium | 6 | **12.0** |
| Critical | 8 | **16.0** |

A "Medium"-severity scenario (max amplitude ±12.0) can swing sector impacts **50% further** than a
"High"-severity scenario (max amplitude ±8.0) purely because the word "Medium" has more characters
than the word "High" — a defect entirely orthogonal to actual climate-transition severity, and one
that would mislead any user comparing NGFS Net Zero 2050 (labelled Medium) against NGFS Delayed
Transition or IEA Stated Policies (both labelled High) using this page's sector/holding impact
figures.

### 7.5 Companion analytics

- **Scenario comparison table** — real `carbonPrice`/`tempC`/`gdpImpact` fields per scenario, all
  unaffected by the severity-length bug (only the sector/holding *impact* draws use it).
- **Temperature pathway chart** — 3 stylised 2025–2060 warming trajectories (Net Zero, Delayed,
  Current Policies) at fixed annual slopes (0.04/0.08/0.25°C per 5-yr step) — illustrative, not
  IPCC-AR6-sourced.

### 7.6 Data provenance & limitations

- **Confirmed defect:** fix `s.severity.length` to a proper ordinal map (e.g.
  `{Low:1, Medium:2, High:3, Critical:4}`) before this module's sector/holding impact figures can be
  trusted for relative-severity comparison.
- Sector- and holding-level impacts are otherwise `sr()`-fabricated, not derived from any factor
  model or the real `carbonPrice`/`tempC`/`gdpImpact` fields on the same scenario record.
- "Climate Stress" in the historical-comparison chart is an arbitrary ×5 scalar of `gdpImpact`, not a
  methodologically comparable figure to the real historical crisis impacts it's plotted alongside.

**Framework alignment:** NGFS Phase-consistent scenario names (real, correctly labelled) · IEA WEO
scenario names (real) · ECB SREP / BoE PRA SS3/19 / Fed DFAST / APRA CPG 229 (named in guide as the
multi-framework aggregation this module is supposed to orchestrate — not implemented; see the
disconnected real DFAST/CBES-style logic potentially present in
`backend/services/stress_test_orchestrator_engine.py`, not reviewed in this pass).

## 9 · Future Evolution

### 9.1 Evolution A — Fix the severity-string bug, wire the real engine, and fix the failing routes (analytics ladder: rung 1 → 3)

**What.** The §7 flag records a confirmed defect plus a disconnect: the frontend's sector- and holding-impact draws multiply by `s.severity.length` — the **character count of the severity label** — so `'Medium'.length=6 > 'High'.length=4`, meaning Medium-labelled scenarios can produce *larger* impacts than High ones, inverting the intended ordering. Meanwhile a real backend engine (`stress_test_orchestrator_engine`) implements a genuine PD-migration formula (`stressed_PD = baseline_PD × (1 + pd_uplift/100)` with carbon-intensity and physical-damage drivers and horizon scaling), but `POST /run`, `/scenario-comparison`, and `/pd-migration` are all recorded as **failed**, and the frontend fabricates sector/holding impacts rather than calling it. Evolution A fixes the bug, repairs the routes, and wires the page.

**How.** (1) Replace `s.severity.length` with a proper ordinal map (`{Low:1, Medium:2, High:3, Critical:4}`) — the single highest-priority fix. (2) Triage the three failing POST routes. (3) Wire the page to `POST /pd-migration` and `/run` so impacts come from the real PD-migration engine (carbon-intensity × price-multiplier + physical-damage × physical-multiplier, horizon-scaled) rather than `sr()` draws. (4) Implement the multi-framework `Combined = Σ(test_i × weight_i)` aggregation across ECB/BoE/Fed/APRA the guide promises via `/scenario-comparison`. (5) Fix the "Climate Stress" chart's arbitrary ×5 `gdpImpact` scalar to a methodologically comparable figure.

**Prerequisites.** The severity bug and the three route failures are the gates; the engine already exists. **Acceptance:** High-severity scenarios always produce larger impacts than Medium; sector/holding impacts come from `/pd-migration`; all three POST routes pass the sweep.

### 9.2 Evolution B — Multi-framework stress-orchestration analyst (LLM tier 2)

**What.** A tool-calling analyst for the regulatory-submission workflow: "run the ECB and BoE scenarios and compare capital depletion", "what's the stressed PD for the energy sector under NGFS Delayed Transition?", "generate the ECB SREP submission package" — calling `POST /run`, `/pd-migration`, and `/scenario-comparison`, narrating the real PD migration and the cross-framework comparison, never inventing capital numbers.

**How.** Tool schemas from the module's OpenAPI operations plus the `GET /ref/*` endpoints (NGFS Phase 4 scenarios, regulatory frameworks, sector-risk profiles, transmission channels) as the citation corpus; grounding = this Atlas record. Submission-package drafts route to the report-studio layer; the no-fabrication validator checks every PD/capital figure against tool output; provenance shows the engine version and scenario parameters.

**Prerequisites (hard).** Evolution A — the compute endpoints fail, the frontend impacts are fabricated, and the severity bug inverts ordering, so an analyst would narrate wrong-signed stress results. **Acceptance:** every PD/capital figure traces to an engine call; cross-framework comparisons use `/scenario-comparison`; a scenario or sector outside the reference set returns "not in scenario library," not an estimate.