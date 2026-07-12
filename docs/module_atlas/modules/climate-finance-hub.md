# Climate Finance Hub
**Module ID:** `climate-finance-hub` · **Route:** `/climate-finance-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated climate finance analytics hub tracking green bond issuance, sustainability-linked loan pricing, blended finance structures, and climate ODA flows. Covers use-of-proceeds verification, KPI step-down mechanics, and OECD Rio Marker accounting.

> **Business value:** Climate finance hub aggregates green bonds, SLLs, blended finance, and ODA. SLL step-down typically 5–15bps per KPI. Blended finance leverage target: 5×–10× private per concessional dollar for infrastructure.

**How an analyst works this module:**
- Green Bond Tracker tab shows issuance and use-of-proceeds allocation
- SLL Pricing tab models KPI step-down schedules
- Blended Finance tab structures first-loss tranche sizing
- ODA Flows tab applies Rio Marker accounting
- Dashboard aggregates total climate finance mobilised

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `FUNDS`, `PROJECTS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TYPES` | `['All','Mitigation','Adaptation','Cross-cutting','Loss & Damage'];const PAGE=12;` |
| `fund` | `FUNDS[i%30];const region=regions[Math.floor(sr(i*7)*regions.length)];const sector=sectors[Math.floor(sr(i*11)*sectors.length)];` |
| `type` | `['Mitigation','Adaptation','Cross-cutting','Loss & Damage'][Math.floor(sr(i*13)*4)];const status=['Active','Completed','Pipeline','Disbursing'][Math.floor(sr(i*17)*4)];` |
| `approved` | `+(sr(i*19)*500+10).toFixed(1);const disbursed=+(approved*(sr(i*23)*0.6+0.2)).toFixed(1);const cofinance=+(approved*(sr(i*29)*2+0.5)).toFixed(1);` |
| `countries` | `Math.round(sr(i*31)*8+1);const beneficiaries=Math.round(sr(i*37)*5+0.1);const emissions=Math.round(sr(i*41)*50+5);const jobs=Math.round(sr(i*43)*20000+1000);` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,approved:+Math.max(0,approved/5+sr(i*100+y)*20-10).toFixed(1),disbursed:+Math.max(0,disbursed/5+sr(i*100+y*3)*10-5).toFixed(1)}));` |
| `filtered` | `useMemo(()=>{let d=[...PROJECTS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())\|\|r.fund.toLowerCase().includes(search.toLowerCase()));if(typeF!=='All')d=d.filter(r=>r.type===typeF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,typeF,sortCol,sortDir]` |
| `stats` | `useMemo(()=>({count:filtered.length,totalApproved:fmt(filtered.reduce((s,r)=>s+r.approvedM,0)*1e6),totalDisbursed:fmt(filtered.reduce((s,r)=>s+r.disbursedM,0)*1e6),avgDisbRate:filtered.length?Math.round(filtered.reduce((` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{m[r.type]=(m[r.type]\|\|0)+r.approvedM;});return Object.entries(m).map(([k,v])=>({name:k,value:Math.round(v)}));},[]);` |
| `regionFlow` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{if(!m[r.region])m[r.region]={region:r.region,approved:0,disbursed:0};m[r.region].approved+=r.approvedM;m[r.region].disbursed+=r.disbursedM;});return Object.values(m).sort((a,b` |
| `fundRank` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{if(!m[r.fund])m[r.fund]={fund:r.fund,total:0,n:0};m[r.fund].total+=r.approvedM;m[r.fund].n++;});return Object.values(m).sort((a,b)=>b.total-a.total).slice(0,15);},[]);` |
| `yearlyTrend` | `useMemo(()=>{const m={};PROJECTS.forEach(p=>p.yearly.forEach(y=>{if(!m[y.year])m[y.year]={year:y.year,approved:0,disbursed:0};m[y.year].approved+=y.approved;m[y.year].disbursed+=y.disbursed;}));return Object.values(m).so` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type` |
| `needs` | `[{region:'Sub-Saharan Africa',need:80,current:25},{region:'South Asia',need:60,current:20},{region:'Southeast Asia',need:45,current:18},{region:'Latin America',need:35,current:15},{region:'Pacific Islands',need:25,curren` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-finance/ref/oecd-markers` | `get_oecd_markers` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/recipient-countries` | `get_recipient_countries` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/cpi-data` | `get_cpi_data` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/mdb-institutions` | `get_mdb_institutions` | api/v1/routes/climate_finance.py |

### 2.3 Engine `climate_finance_engine` (services/climate_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `track_climate_finance` | entity_id, portfolio_name, year, instruments |  |
| `assess_article21c_alignment` | entity_id, portfolio, financial_flows |  |
| `calculate_ncqg_contribution` | entity_id, institution_type, baseline_finance_usd, planned_uplift_pct, mobilisation_multiplier, guarantee_share_of_contribution, equity_share_of_contribution, grant_equivalent_pct | All entity-specific figures (planned uplift over baseline, realised mobilisation multiplier, guarantee/equity split, grant-equivalent share, LDCs/SIDS earmark) must be supplied by the caller. When omitted they are returned as HONEST NULLs — the previous version fabricated them via a hash-seeded RNG. Contributor-tier logic and the $300bn core-goal share are genuine deterministic computations and ar |
| `measure_mobilisation` | entity_id, public_finance_usd, instruments |  |
| `generate_climate_finance_report` | entity_id, year, total_finance_usd, adaptation_finance_usd, private_mobilised_usd, carbon_pricing_coverage_pct, fossil_subsidies_usd_bn, green_budget_tagging_adopted | Builds the UNFCCC Biennial Finance Report structure from CALLER-SUPPLIED reported figures. Every entity-level flow is null unless provided (the previous version fabricated the entire headline and all section figures with a hash-seeded RNG). The reference blocks — $100bn commitment tracking, CPI 2023 gap analysis, and MDB joint tracking — are genuine, data-driven and unchanged. |

**Engine `climate_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `OECD_RIO_MARKERS` | `[{'id': 'RM-01', 'name': 'Climate Change Mitigation', 'code': 'CCM', 'marker_values': [0, 1, 2], 'description': '0=not targeted, 1=significant objective, 2=principal objective'}, {'id': 'RM-02', 'name': 'Climate Change Adaptation', 'code': 'CCA', 'marker_values': [0, 1, 2], 'description': '0=not tar` |
| `CPI_2023_DATA` | `{'total_climate_finance_usd_bn': 1265, 'private_finance_usd_bn': 626, 'public_finance_usd_bn': 639, 'adaptation_usd_bn': 63, 'mitigation_usd_bn': 1202, 'annual_need_2030_usd_bn': 4300, 'annual_gap_usd_bn': 3035, 'by_instrument': {'debt': {'amount_usd_bn': 680, 'share_pct': 53.7}, 'equity': {'amount_` |
| `MDB_INSTITUTIONS` | `[{'name': 'World Bank Group', 'code': 'WBG', 'total_finance_usd_bn': 85, 'climate_share_pct': 35, 'adaptation_target_pct': 50, 'paris_aligned_since': 2023}, {'name': 'Asian Development Bank', 'code': 'ADB', 'total_finance_usd_bn': 22, 'climate_share_pct': 44, 'adaptation_target_pct': 30, 'paris_alig` |
| `RECIPIENT_COUNTRIES` | `[{'iso': 'BD', 'country': 'Bangladesh', 'income_group': 'lower_middle', 'climate_vulnerable': True, 'v20': True}, {'iso': 'ET', 'country': 'Ethiopia', 'income_group': 'low', 'climate_vulnerable': True, 'v20': True}, {'iso': 'KE', 'country': 'Kenya', 'income_group': 'lower_middle', 'climate_vulnerabl` |
| `NCQG_STRUCTURE` | `{'headline_goal_usd_bn_per_year': 300, 'target_year': 2035, 'cop_decision': 'COP29 Baku 2024', 'goal_layers': {'core_goal': {'amount_usd_bn': 300, 'contributors': 'Developed country parties (Annex II)', 'description': 'Public and private finance mobilised by developed countries'}, 'broader_goal': {'` |
| `IPCC_PATHWAYS` | `[{'pathway': '1.5C_no_overshoot', 'description': 'Net zero CO2 by 2050, immediate steep reductions', 'peak_warming_c': 1.5, 'annual_investment_usd_tn': 4.3}, {'pathway': 'well_below_2C', 'description': 'Net zero CO2 by 2070, rapid near-term reductions', 'peak_warming_c': 1.8, 'annual_investment_usd_` |
| `MOBILISATION_MULTIPLIERS` | `{'guarantees': {'min': 3.0, 'max': 8.0, 'typical': 5.0, 'methodology': 'OECD DAC Converged Statistical Reporting Directives'}, 'equity': {'min': 2.0, 'max': 4.0, 'typical': 2.8, 'methodology': 'OECD DCD/DAC(2019)34/FINAL'}, 'concessional_loans': {'min': 1.5, 'max': 3.0, 'typical': 2.0, 'methodology'` |
| `CONVERGENCE_BLENDED_FINANCE_MEDIAN_MULTIPLIER` | `4.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `provider` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `FUNDS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Bond Issuance Volume | `Σ use-of-proceeds allocations` | ICMA tracker | Total proceeds allocated to eligible green projects |
| SLL Step-Down | `Spread reduction per KPI achievement` | Loan documentation | Interest rate reduction triggered by hitting sustainability performance target |
| Blended Finance Leverage Ratio | `Private : concessional capital` | OECD Blended Finance | Ratio of private finance mobilised per unit of concessional capital |
| ODA Climate Finance (Rio Marker) | `Rio II principal + 50%×Rio I` | OECD DAC | Climate-focused ODA calculated using Rio Marker weighting |
- **Bond prospectus data** → Use-of-proceeds categories → allocation tracker → **Green finance deployment**
- **OECD DAC database** → Rio Marker coding → climate ODA total → **Climate finance ODA flow**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-finance/ref/cpi-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'data_year', 'key_findings', 'data', 'ipcc_pathways'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/mdb-institutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'total_mdb_climate_finance_usd_bn', 'institutions_count', 'institutions', 'mobilisation_multipliers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/ncqg-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'cop_decision', 'legal_basis', 'structure', 'predecessor_100bn_tracking'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/oecd-markers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'methodology', 'marker_values', 'markers_count', 'markers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/recipient-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_countries', 'income_group_breakdown', 'v20_members', 'climate_vulnerable', 'countries'], 'n_keys': 5}`

**POST /api/v1/climate-finance/article21c-alignment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-finance/mobilisation** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-finance/ncqg-contribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate finance flow accounting and KPI step-down pricing
**Headline formula:** `SLL_Spread(t) = BaseSpread × (1 – StepDown × KPI_achieved(t)); GreenFinanceTotal = Σ(GreenBonds + SLL + BlendedFinance + ODA)`

Green bond use-of-proceeds tracked via project register against ICMA eligible categories. SLL pricing: KPI step-down (typically 5–15bps) triggered if SPT achieved at measurement date. Blended finance: first-loss tranche sizing uses expected loss coverage model. ODA climate finance: OECD Rio Marker II (principal objective) and I (significant objective) coding drives additionality assessment.

**Standards:** ['ICMA Green Bond Principles 2021', 'LMA/APLMA Sustainability-Linked Loan Principles 2023', 'OECD DAC Rio Marker Guidance', 'EU GBS Regulation 2023']
**Reference documents:** ICMA Green Bond Principles 2021; LMA/APLMA Sustainability-Linked Loan Principles 2023; EU Green Bond Standard Regulation 2023; OECD DAC Rio Markers Handbook

**Engine `climate_finance_engine` — extracted transformation lines:**
```python
fossil_exposure = 0.0            # sum of caller-supplied fossil-fuel amounts
mitigation_counted = amount if ccm_marker == 2 else amount * 0.5 if ccm_marker == 1 else 0
adaptation_counted = amount if cca_marker == 2 else amount * 0.5 if cca_marker == 1 else 0
total_climate_finance = total_mitigation + total_adaptation + total_cross_cutting
contribution_usd = baseline_finance_usd * (1 + effective_uplift_pct / 100)
guarantee_amount = contribution_usd * g_share
equity_amount = contribution_usd * e_share
share_of_core_goal_pct = contribution_usd / core_goal * 100
mobilised = amount * actual_multiplier
weighted_avg_multiplier = total_mobilised / public_finance_usd if public_finance_usd > 0 else 0
additionality_avg = additionality_score / public_finance_usd if public_finance_usd > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_finance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-finance-tracker` | engine:climate_finance_engine, table:provider |

## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page divergence.** This tier-A module has **two layers that do not connect**. The
> backend engine (`climate_finance_engine.py`, E78) is genuinely rigorous — it implements OECD CRS
> Rio-marker counting (principal = 100 %, significant = 50 %), OECD DAC mobilisation multipliers, and
> an explicit *"no metric from a random number generator; honest NULL when input absent"* policy,
> with real CPI 2023 / NCQG reference data. **The React page does not call that engine.** Instead the
> page builds **60 `sr()`-seeded projects** across real fund names (GCF, AF, GEF, CIF…) with
> fabricated approved/disbursed/co-finance figures. So the platform *has* a real climate-finance
> tracking model, but the hub page you see is a seeded dashboard. Both layers are documented below.

### 7.1 What the backend engine computes (rigorous)

`track_climate_finance` — OECD CRS Rio-marker attribution over caller-supplied instruments:
```
ccm/cca_marker ∈ {0,1,2}    (unreported defaults to 0 — conservative, not random)
mitigation_counted = amount            if ccm==2
                   = amount × 0.5       if ccm==1
                   = 0                  if ccm==0
adaptation_counted = same logic on cca_marker
cross-cutting: min(mit, adapt) counted once; remainder split to mit/adapt buckets
climate_relevant = round(mitigation_counted + adaptation_counted)
```
`measure_mobilisation` prefers a **caller-observed** multiplier; only falls back to OECD DAC typical
multipliers (grants 1.5×, etc.) and returns **honest NULL** when the input is absent —
`calculate_ncqg_contribution` likewise nulls total-mobilised without a supplied multiplier.

### 7.2 What the page computes (seeded)

```
approved     = sr(i·19)×500 + 10                 ($10–510 M)
disbursed    = approved × (sr(i·23)×0.6 + 0.2)   (20–80 % of approved)
cofinance    = approved × (sr(i·29)×2 + 0.5)     (0.5–2.5× leverage — seeded, not OECD-derived)
emissions    = round(sr(i·41)×50 + 5)            (MtCO₂ avoided)
yearly[5]    = seeded approved/disbursed path per year
```

### 7.3 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| Engine `OECD_RIO_MARKERS` (12) | CCM/CCA/BD/… markers 0/1/2 | **Real** OECD CRS Rio-marker taxonomy |
| Engine `CPI_2023_DATA` | $1,265 Bn total, $4,300 Bn 2030 need, $3,035 Bn gap | **Real** CPI Global Landscape 2023 |
| Engine `MDB_INSTITUTIONS` (8) | WBG/ADB/EIB… climate share % | Real MDB climate finance data |
| Engine mobilisation multipliers | grants 1.0–2.5 (typ 1.5) | OECD DAC methodology |
| Page `FUNDS` (30) | GCF, AF, GEF… | Real fund names |
| Page `PROJECTS` (60) | approved/disbursed/cofinance/emissions | **`sr()`-seeded** |
| Page project type | Mitigation/Adaptation/Cross-cutting/Loss & Damage | Seeded pick |

### 7.4 Worked example — CRS Rio-marker counting (engine)

Instrument: `amount = $100M`, `ccm_marker = 1` (significant mitigation), `cca_marker = 2` (principal
adaptation):

| Step | Computation | Result |
|---|---|---|
| mitigation_counted | 100 × 0.5 (ccm=1 significant) | $50 M |
| adaptation_counted | 100 (cca=2 principal) | $100 M |
| cross-cutting | min(50, 100) counted once | $50 M |
| net mitigation | 50 − 50 | $0 M |
| net adaptation | 100 − 50 | $50 M |
| climate_relevant | round(50 + 100) | **$150 M** |

This correctly applies CRS avoidance of double-counting: the overlapping $50 M is booked as
cross-cutting, not double-counted into both mitigation and adaptation totals.

### 7.5 Data provenance & limitations

- **The engine follows a strict data-integrity policy** (real computation or honest NULL, no RNG) —
  a model of good practice.
- **The page is `sr()`-seeded** (`sr(seed) = frac(sin(seed+1)×10⁴)`) with real fund names but
  fabricated financials; its co-finance "leverage" (0.5–2.5×) is a seeded scalar, not an OECD DAC
  mobilisation multiplier computed by the engine.
- The page does **not invoke** `track_climate_finance` / `measure_mobilisation`, so the rigorous
  Rio-marker and mobilisation logic never reaches the UI.
- Reference figures (CPI $1,265 Bn, NCQG $300 Bn Baku) are point-in-time and will age.

**Framework alignment:** OECD CRS Rio Markers (the engine implements the 0/1/2 significance counting
exactly); OECD DAC mobilisation methodology (multipliers for private-finance leverage); UNFCCC Art.
2.1(c) alignment (`assess_article21c_alignment`); CPI Global Landscape 2023 and NCQG $300 Bn COP29
Baku reference data; MDB Joint Report tracking. The engine needs no §8 (it is already a valid model);
the production gap is **wiring the page to the engine** so the dashboard shows CRS-counted, honest-
NULL-aware figures instead of seeded projects.

## 8 · Model Specification — Wire the Hub Page to the CRS Tracking Engine

**Status: specification — not yet implemented in code.** The rigorous engine exists but the page runs
on seeded data; this specifies the integration and the mobilisation model the page should surface.

### 8.1 Purpose & scope
Replace the page's seeded `PROJECTS` with engine-computed climate-finance flows: CRS-counted
mitigation/adaptation, OECD DAC private mobilisation, and NCQG contribution accounting.

### 8.2 Conceptual approach
Consume `track_climate_finance` + `measure_mobilisation` from the E78 engine, presenting honest-NULL
where inputs are missing. Benchmarks: OECD CRS/DAC methodology and CPI Global Landscape accounting.

### 8.3 Mathematical specification
```
ClimateRelevant = Σ_inst [ amount·(ccm==2?1: ccm==1?0.5:0) + amount·(cca==2?1: cca==1?0.5:0)
                           − min(mit_i, adapt_i) ]                       (cross-cut netting)
PrivateMobilised = Σ_inst public_i · multiplier_i    (observed multiplier preferred, else OECD typical)
NCQG_contribution= grant_equiv + mobilised_private   (null if multiplier unsupplied)
FossilExposure   = Σ inst.fossil_fuel_amount_usd     (caller-supplied only)
```
| Parameter | Source |
|---|---|
| ccm/cca markers | Reporting entity CRS coding |
| Mobilisation multiplier | Observed (reported) or OECD DAC typical |
| Reference totals | CPI 2023 / NCQG $300 Bn |

### 8.4 Data requirements
Real instrument-level flows with Rio markers, public/private split, and (where available) observed
mobilisation multipliers — fed to the existing engine endpoints. The engine already computes
everything; the page needs an API call, not new maths.

### 8.5 Validation & benchmarking plan
Reconcile engine output against a reporting entity's published CRS climate-finance total; verify
honest-NULL propagation to the UI (no fabricated fills); cross-check aggregate against CPI 2023
sector shares.

### 8.6 Limitations & model risk
CRS marker self-reporting is known to over-count; mobilisation multipliers are contested. Conservative
fallback: display significant-marker flows at 50 % and show NULL rather than a seeded estimate where
mobilisation data is absent — exactly the engine's existing behaviour.

## 9 · Future Evolution

### 9.1 Evolution A — Connect the page to its rigorous Rio-marker engine (analytics ladder: rung 1 → 2, engine already at 2)

**What.** §7 documents the engine↔page divergence precisely: the backend
(`climate_finance_engine.py`, E78) is genuinely rigorous — OECD CRS Rio-marker
counting (principal 100%/significant 50%), DAC mobilisation multipliers, an explicit
honest-NULL policy, real CPI 2023/NCQG reference data behind four passing ref GETs —
while the hub page builds 60 `sr()`-seeded projects over real fund names (GCF, AF,
GEF, CIF) with fabricated approved/disbursed figures and never calls the engine.
Evolution A is a wiring evolution: the page becomes a client of
`track_climate_finance` and the ref endpoints, with an instrument-entry workflow
(amount, ccm/cca markers, channel) whose attribution the engine computes, and the
fund tables re-seeded from the funds' published annual reports (GCF portfolio data is
public) instead of PRNG draws against real fund names.

**How.** (1) Frontend fetch layer to the existing routes; the SLL step-down and
blended-finance tabs either call engine functions (the engine's extracted lines show
guarantee/equity mobilisation logic exists) or display the ref data explicitly.
(2) `ref_fund_portfolios(fund, year, pledged, disbursed, source)` from published
replenishment/annual-report figures. (3) Lineage fixtures so the POST paths move from
`skipped` to `passed` in the harness.

**Prerequisites (hard).** Fabricated-figures-on-real-funds purge (the same defect
class as real-company fabrication); REQUIRE_AUTH posture for POSTs. **Acceptance:**
a Rio-marker attribution on the page reproduces the engine's principal/significant
arithmetic exactly; fund figures cite report vintages; zero `sr()` project rows
remain.

### 9.2 Evolution B — Climate-finance accounting analyst (LLM tier 2)

**What.** The engine's domain — Rio-marker attribution — is genuinely confusing to
practitioners, and a tool-calling analyst adds real value: "how much of this $50M
loan counts as climate finance with ccm=1, cca=2?" (engine call, answer decomposed
into the 50%/100% rules with the OECD handbook citation), "what mobilisation can an
IFC guarantee claim?" (the DAC multiplier logic), "how does the NCQG structure change
what counts?" (the `/ref/ncqg-structure` payload). Every attribution from tool calls
against the live endpoints.

**How.** Tool schemas from this module's OpenAPI routes (4 ref GETs + the engine
POSTs once exposed); the honest-NULL engine policy propagates into copilot behaviour
— unreported markers mean "not countable", and the assistant must say so rather than
estimate; framework questions cite the OECD DAC handbook corpus.

**Prerequisites.** Engine POST routes exposed and fixture-tested (Evolution A);
the guide already matches the engine, so corpus risk is low. **Acceptance:** an
attribution answer reconciles to a direct engine call; an instrument with marker 0
yields "does not count" with the rule cited, never a guessed percentage.