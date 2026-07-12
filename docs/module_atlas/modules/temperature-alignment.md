# Temperature Alignment
**Module ID:** `temperature-alignment` · **Route:** `/temperature-alignment` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio implied temperature rise (ITR) methodology platform computing company and portfolio-level temperature scores using SBTi methodology, Paris Agreement Capital Transition Assessment and MSCI frameworks.

> **Business value:** Portfolio temperature alignment is the primary investor climate metric; the SBTi reports average portfolio ITR of 2.7°C among institutional investors in 2023, well above the 1.5°C Paris target.

**How an analyst works this module:**
- Download company emissions and SBT status from SBTi registry
- Allocate company carbon budgets proportional to revenue and sector
- Compute company-level ITR from trajectory vs budget
- Aggregate to portfolio ITR using AUM weights
- Report ITR in TCFD disclosures and investor communications

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMPANIES`, `ITR_DIST`, `PATHWAY`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ITR_DIST` | 6 | `range`, `count` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHWAY` | `Array.from({length:8},(_,i)=>({year:2023+i*4,portfolio:+(2.8-i*0.15+sr(i*7)*0.2).toFixed(1),benchmark:+(3.0-i*0.1+sr(i*11)*0.15).toFixed(1),target15:1.5,target2c:2.0}));` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((p` |
| `stats` | `useMemo(()=>({count:filtered.length,avgITR:(filtered.reduce((s,r)=>s+r.itr,0)/filtered.length\|\|0).toFixed(1),aligned:filtered.filter(r=>r.alignment==='1.5C Aligned'\|\|r.alignment==='Below 2C').length,sbtiApproved:filtered` |
| `sectorITR` | `useMemo(()=>{const m={};COMPANIES.forEach(r=>{if(!m[r.sector])m[r.sector]={s:r.sector,itr:0,n:0};m[r.sector].itr+=r.itr;m[r.sector].n++;});return Object.values(m).map(s=>({sector:s.s,itr:+(s.itr/s.n).toFixed(1)})).sort((` |
| `alignDist` | `useMemo(()=>{const order=['1.5C Aligned','Below 2C','2C','Above 2C','Not Aligned'];const m={};filtered.forEach(r=>{m[r.alignment]=(m[r.alignment]\|\|0)+1;});return order.filter(k=>m[k]).map(k=>({name:k,value:m[k]}));},[fil` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=UR` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/temperature-alignment/assess` | `assess_temperature_alignment` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/waci` | `calculate_waci` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/itr` | `calculate_itr` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sbti-fi` | `assess_sbti_fi` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sector-alignment` | `sector_alignment` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sbti-fi-criteria` | `ref_sbti_fi_criteria` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/itr-table` | `ref_itr_table` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/asset-class-methods` | `ref_asset_class_methods` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/pcaf-dqs` | `ref_pcaf_dqs` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-profiles` | `ref_sector_profiles` | api/v1/routes/temperature_alignment.py |

### 2.3 Engine `temperature_alignment_engine` (services/temperature_alignment_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TemperatureAlignmentEngine.assess_temperature_alignment` | portfolio_name, fi_type, total_aum_bn, holdings, methodology, base_year, sbti_targets | Full portfolio temperature alignment assessment. Computes: - WACI (exposure-weighted average carbon intensity) tCO2/$mn - Portfolio-level ITR via WACI interpolation - Sector-level WACI, ITR, and PACTA alignment % - PCAF DQS exposure-weighted quality score - SBTi FI criteria assessment (if targets provided) - Engagement priority list by sector |
| `TemperatureAlignmentEngine.calculate_waci` | holdings | WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn). Exposure-weighted average carbon intensity in tCO2e per USD million revenue. |
| `TemperatureAlignmentEngine.calculate_itr` | waci | Interpolate ITR from WACI using MSCI/Carbon Delta anchor table. Linear interpolation between table anchor points. Returns temperature in degrees Celsius. |
| `TemperatureAlignmentEngine.calculate_pcaf_dqs` | holdings | Exposure-weighted PCAF DQS score 1-5. DQS 1 = best (verified); DQS 5 = worst (EEIO estimate). |
| `TemperatureAlignmentEngine.assess_sbti_fi_criteria` | portfolio_waci, scope1_financed, scope2_financed, scope3_financed, base_year, target_year, sbti_targets, portfolio_name | Score portfolio against all 6 SBTi FI Net-Zero Standard v1.0 criteria. Returns per-criterion compliance status and overall score. |
| `TemperatureAlignmentEngine.calculate_sector_alignment` | sector, current_value, base_year | PACTA % alignment for a single sector vs IEA NZE 2050 trajectory. Returns alignment percentage and gap to 2030 NZE benchmark. |
| `TemperatureAlignmentEngine.get_alignment_benchmarks` |  | Return all sector pathways and ITR interpolation table. |
| `TemperatureAlignmentEngine._pacta_alignment_pct` | current, nze_target, lower_is_better | Calculate % alignment relative to NZE 2030 target. |
| `TemperatureAlignmentEngine._engagement_priority` | itr, weight_pct |  |
| `TemperatureAlignmentEngine._score_sbti_criterion` | crit_id, crit_meta, total_s12, scope3_financed, portfolio_waci, sbti_targets, flag_exposure_pct, companies_with_sbti_pct | Return (score 0-1, status, notes) for a single SBTi FI criterion. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `WACI` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ITR_DIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | — | SBTi Methodology | AUM-weighted portfolio implied temperature rise; target <1.5°C for Paris alignment. |
| SBT-Committed Companies | — | SBTi Registry | Proportion of portfolio AUM in companies with approved or committed science-based targets. |
| Overshoot (GtCO2) | — | Carbon Budget Model | Cumulative emissions overshoot relative to 1.5°C budget across portfolio companies. |
- **Company GHG Data, SBTi Registry, AUM Weights, NGFS Pathways** → Carbon budget allocation + ITR computation + AUM-weighted aggregation → **Portfolio temperature scorecard, company ITR heatmap, TCFD alignment disclosures**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/temperature-alignment/ref/asset-class-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class_methods', 'total_asset_classes', 'pcaf_standard', 'sbti_standard'], 'n_keys': 4}`

**GET /api/v1/temperature-alignment/ref/itr-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['itr_table', 'total_anchors', 'waci_unit', 'temperature_unit', 'methodology', 'key_thresholds', 'engagement_thresholds'], 'n_keys': 7}`

**GET /api/v1/temperature-alignment/ref/pcaf-dqs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pcaf_dqs', 'source', 'note'], 'n_keys': 3}`

**GET /api/v1/temperature-alignment/ref/sbti-fi-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sbti_fi_criteria', 'total_criteria', 'standard', 'validation_body', 'eligible_asset_classes'], 'n_keys': 5}`

**GET /api/v1/temperature-alignment/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_pathways', 'sda_benchmarks', 'total_sectors', 'source', 'methodology'], 'n_keys': 5}`

**GET /api/v1/temperature-alignment/ref/sector-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_profiles', 'total_profiles', 'note'], 'n_keys': 3}`

**POST /api/v1/temperature-alignment/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/temperature-alignment/itr** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Implied Temperature Rise
**Headline formula:** `ITR = T₀ + (GHGₐₜₜᴼᴵᵇᵘᵗᵉᵈ / Budget) × Overshoot Factor`

Company temperature score derived from ratio of actual emissions trajectory to science-based budget; aggregated to portfolio by AUM weight.

**Standards:** ['SBTi Portfolio Temperature Alignment 2022', 'PACTA Methodology 2023']
**Reference documents:** SBTi Portfolio Temperature Alignment Methodology 2022; PACTA for Investors Technical Methodology 2023; MSCI Temperature Alignment Methodology 2022; 2DII Paris Agreement Capital Transition Assessment

**Engine `temperature_alignment_engine` — extracted transformation lines:**
```python
s_weight_pct = (s_exposure / total_aum_bn) * 100 if total_aum_bn > 0 else 0.0
WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn).
weight_norm = h.portfolio_weight_pct / total_weight
total_emissions = h.scope1_emissions_tco2 + h.scope2_emissions_tco2
idx = bisect.bisect_right(_ITR_WACI_LIST, waci) - 1
idx = max(0, min(idx, len(_ITR_WACI_LIST) - 2))
frac = (waci - w0) / (w1 - w0) if (w1 - w0) > 0 else 0.0
weighted_dqs = sum(h.data_quality_score * h.exposure_bn for h in holdings)
total_s12 = scope1_financed + scope2_financed
overall_score = weighted_score / total_weight if total_weight > 0 else 0.0
gap_to_nze_2030 = current_value - nze_2030
gap_to_threshold = current_value - threshold
alignment_pct = max(0.0, 100.0 - ((current_value - nze_2030) / max(cps_2030 - nze_2030, 0.001)) * 100)
gap_to_nze_2030 = nze_2030 - current_value
gap_to_threshold = threshold - current_value
alignment_pct = min(100.0, (current_value / max(nze_2030, 0.001)) * 100)
score = min(sbti_targets.long_term_reduction_pct / req, 1.0)
score = min(sbti_targets.long_term_reduction_pct / req, 1.0) * 0.9
score = min(sbti_targets.near_term_reduction_pct / req, 1.0)
score = max(0.0, 1.0 - (portfolio_waci / 200))
total = total_s12 + scope3_financed
s3_share = (scope3_financed / total * 100) if total > 0 else 0
score = min(s3_share / req, 1.0) * 0.6  # engagement is directional
score = min(companies_with_sbti_pct / req, 1.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `temperature_alignment_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `temperature-alignment-waterfall` | engine:temperature_alignment_engine, table:WACI |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `ITR = T₀ + (GHG_actual/Budget) ×
> Overshoot Factor` — a genuine carbon-budget-based Implied Temperature Rise calculation per SBTi
> Portfolio Temperature Alignment methodology. **No such calculation exists.** Each of the 60
> companies' `itr` values is a **direct `sr()`-seeded random draw** (`itr = sr(i×7)×3+1`, range
> 1.0–4.0°C) — there is no carbon budget, no actual/target emissions ratio, and no overshoot factor
> anywhere in this 57-line file. The 8 real backend API routes listed for this module
> (`ref/itr-table`, `ref/pcaf-dqs`, `ref/sbti-fi-criteria`, `POST /itr`, `POST /assess`, etc., served
> by `backend/services/temperature_alignment_engine.py`) are **never called** — the page contains no
> `fetch`/API call at all. One redeeming detail: `alignment` category labels are bucketed from the
> **same** random draw that produces `itr` (both keyed on `sr(i×7)`), so the two fields are at least
> internally self-consistent with each other, unlike most fields in this dataset.

### 7.1 What the module computes

60 real, named companies (Exxon Mobil, Shell, BP, TotalEnergies, NextEra Energy, Enel, Apple,
Microsoft, JPMorgan, Nestle, etc.) across 7 sectors (Energy, Utilities, Materials, Industrials,
Technology, Financials, Consumer), each independently `sr()`-seeded for `itr` (1.0–4.0°C),
`scope1Intensity`/`scope2Intensity`/`scope3Intensity`, `reductionTarget` %, `targetYear`
(2030/2040/2050), `sbtiStatus` (Approved/Committed/Near-term/None), `alignment` category,
`budgetRemaining` %, `carbonBudget`, `emissionsTrajectory` (Declining/Flat/Rising), `netZeroCommit`,
`greenRevPct`, `transitionPlan` quality, and `credibilityScore`.

### 7.2 The itr↔alignment consistency (the one non-independent pair)

```js
itr       = +(sr(i×7)×3 + 1).toFixed(1)                            // 1.0–4.0°C
alignment = sr(i×7)<0.15 ? '1.5C Aligned'
          : sr(i×7)<0.35 ? 'Below 2C'
          : sr(i×7)<0.55 ? '2C'
          : sr(i×7)<0.75 ? 'Above 2C'
          : 'Not Aligned'
```

Both fields read the **same seed** `sr(i×7)`, so the alignment bucket boundaries translate to
implied ITR cutoffs: `sr<0.15 → itr<1.45` ('1.5C Aligned'), `sr<0.35 → itr<2.05` ('Below 2C'),
`sr<0.55 → itr<2.65` ('2C'), `sr<0.75 → itr<3.25` ('Above 2C'), else 'Not Aligned' (`itr≥3.25`). This
is a genuinely coherent quantile-bucketing of the same underlying random draw into a categorical
label — the one place in this file where two displayed fields are guaranteed consistent with each
other rather than independently random.

### 7.3 Genuine aggregation formulas (over synthetic per-company data)

```js
stats.avgITR       = mean(itr) over filtered companies
stats.aligned       = count(alignment ∈ {'1.5C Aligned','Below 2C'})
stats.sbtiApproved  = count(sbtiStatus === 'Approved')
sectorITR[sector]   = mean(itr) grouped by sector
alignDist[category] = count grouped by alignment, in a fixed display order
```

All correctly implemented unweighted means/counts with `||0` NaN-guard on `avgITR`/`avgCredibility`
when `filtered.length===0`. `PATHWAY` (an 8-point 2023–2051 portfolio-vs-benchmark temperature time
series) is a separately hand-constructed declining series (`2.8−i×0.15+noise`) with no arithmetic
link to the 60-company `itr` values — the "Portfolio Temperature Pathway" chart and the "Portfolio
ITR" KPI in the dashboard tab are **two independent numbers**, not derived from each other.

### 7.4 Worked example

Company `i=0` ('Exxon Mobil', Energy sector): `sr(0) = frac(sin(1)×10⁴)`; `sin(1)≈0.8415`,
×10⁴=8415.0, frac≈0.85 → `itr = round(0.85×3+1, 1) = round(3.55,1) = 3.6°C`. Since `sr(0)=0.85 ≥
0.75`, `alignment = 'Not Aligned'` — consistent with a 3.6°C ITR being far above any Paris-aligned
threshold. This is directionally plausible for a major integrated oil company, though it is
coincidental (a product of the seed value for index 0, not a reflection of Exxon's real disclosed
emissions trajectory).

### 7.5 Companion analytics

- **Credibility vs ITR scatter** — plots `credibilityScore` (an independently `sr()`-seeded field,
  different seed multiplier than `itr`) against `itr`; because the two are drawn independently, any
  visual correlation shown is coincidental, not a modelled relationship (e.g. "low-credibility
  transition plans correlate with high ITR" is not enforced in the generator).
- **SBTi status / emissions trajectory / transition-plan-quality pie charts** — categorical
  breakdowns of independently-seeded fields; the "Transition Plan Quality vs Credibility" bar chart
  computes a real per-category mean credibility score, correctly guarded against empty filter groups
  (`||1` divisor fallback).

### 7.6 Data provenance & limitations

- **All 60 companies' ITR, SBTi status, and emissions data are `sr()`-seeded synthetic figures**
  attached to real company names — illustrative demo data only.
- No carbon-budget-based ITR calculation exists; the backend `temperature_alignment_engine.py` and
  its 8 reference/calculation routes are entirely unused by this page — a real orphaned-capability
  gap (see the sibling `temperature-alignment-waterfall` module, which *does* implement a genuine
  additive ITR formula, albeit also without calling the backend engine).
- `PATHWAY`'s portfolio temperature trajectory is disconnected from the 60-company `itr` dataset
  shown elsewhere on the same page.

**Framework alignment:** SBTi Portfolio Temperature Alignment Methodology and PACTA are correctly
named as the intended basis; MSCI's Temperature Alignment approach is also cited. None of these
methodologies' actual budget-allocation or overshoot-factor mathematics are implemented — this page
functions as a realistic-looking company/portfolio browsing UI over synthetic placeholder scores, not
a working ITR calculation engine.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own unused ITR engine (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents the platform's clearest wiring gap: a real backend engine (`temperature_alignment_engine.py`) implements WACI, ITR-by-interpolation from the MSCI/Carbon Delta anchor table, PCAF DQS weighting, SBTi FI Net-Zero criteria scoring, and PACTA sector alignment — exposed via 11 routes, 6 of which trace green — yet the 57-line frontend makes **zero API calls**, rendering 60 companies whose `itr` is `sr(i×7)×3+1` random noise attached to real names (Exxon 3.6°C by seed coincidence, §7.4). The `PATHWAY` chart is separately hand-constructed, disconnected from the company table on the same page. Evolution A is not building an engine; it is connecting one.

**How.** (1) Replace the seeded `COMPANIES` array with a portfolio flow: holdings (weight, scope 1/2 emissions, revenue) → `POST /waci` → `POST /itr` → per-company and portfolio ITR from the engine's anchor-table interpolation; the internally-consistent alignment bucketing (§7.2's one redeeming detail) becomes derived from real ITR cutoffs. (2) Diagnose the two traced POST failures (`/assess`, `/itr` — live 500s or auth-gating, per the harness) before wiring. (3) Seed real inputs: the SBTi target-status registry export (free) for `sbtiStatus`, disclosed Scope 1/2 for the 60 names. (4) Derive `PATHWAY` from the engine's sector-pathway reference data so the chart and KPI reconcile.

**Prerequisites (hard).** POST failure root-cause; a demo portfolio with real emissions/revenue rows (the D0 credibility-gap seeding in the roadmap). **Acceptance:** page renders no number the engine didn't return; Exxon's ITR responds to its emissions inputs, not its array index; portfolio ITR equals the WACI-interpolated value from `ref/itr-table` anchors.

### 9.2 Evolution B — Portfolio-alignment analyst over the live engine (LLM tier 2)

**What.** Once wired, this module is the investor desk's headline metric surface. The copilot answers "why is our portfolio 2.7°C?" with the engine's decomposition (WACI by sector, worst-contributing holdings, PCAF data-quality caveats), runs what-ifs ("divest the top-3 ITR contributors", "assume Shell hits its 2030 target") as tool calls to `POST /assess`/`/waci`/`/itr`, and explains SBTi FI criterion scores from the engine's per-criterion notes.

**How.** Tool schemas from the 11 existing routes (5 reference GETs already trace green and are the safe first slice); grounding corpus is this Atlas record plus the engine's reference payloads — `ref/itr-table` (anchors + key thresholds), `ref/sbti-fi-criteria`, `ref/pcaf-dqs` — which are precisely the explanatory material a copilot needs to answer "how is ITR interpolated from WACI?" with the actual anchor points. The PCAF DQS score should gate confidence language: high-DQS (poor data) portfolios get hedged phrasing, mirroring the engine's own quality convention. Every numeric passes the fabrication validator against tool outputs.

**Prerequisites (hard).** Evolution A complete — a copilot on today's page would narrate seeded noise about named issuers, the exact failure mode the platform's honest-nulls convention exists to prevent. **Acceptance:** every ITR/WACI figure in an answer traces to a tool call; methodology answers quote the engine's anchor table, not memorised MSCI values; questions about a holding's real-world disclosures outside the portfolio data are refused.