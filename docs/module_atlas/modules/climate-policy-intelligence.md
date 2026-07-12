# Climate Policy Intelligence
**Module ID:** `climate-policy-intelligence` · **Route:** `/climate-policy-intelligence` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks NDC ambition, carbon pricing mechanisms, climate legislation pipelines, and policy implementation progress across 190+ countries to support transition risk assessment.

> **Business value:** Provides actionable policy intelligence for transition risk modelling, sovereign bond analysis, and regulatory horizon scanning in climate-exposed investment portfolios.

**How an analyst works this module:**
- Aggregate NDC submissions and climate law databases by country and sector
- Score NDC ambition: 1.5°C compatibility, conditionality, economy-wide coverage
- Map carbon pricing instruments: ETS cap trajectory, tax rate, revenue use
- Compute policy risk delta: gap between current policy trajectory and Paris-compatible pathway

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CARBON_PRICING`, `CONTINENT`, `COUNTRIES`, `INCOME`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CARBON_PRICING` | 15 | `mechanism`, `type`, `price`, `coverage`, `region` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPrice:Math.round(30+i*2+sr(i*7)*15),newPolicies:Math.round(3+sr(i*11)*12),stringency:Math.round(35+i*0.8+sr(i*13)*8)` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(cont!=='All')d=d.filter(r=>r.continent===cont);if(incF!=='All')d=d.filter(r=>r.income===incF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,cont,incF,sortCol,sor` |
| `cpFiltered` | `useMemo(()=>{let d=[...CARBON_PRICING];if(cpSearch)d=d.filter(r=>r.mechanism.toLowerCase().includes(cpSearch.toLowerCase()));d.sort((a,b)=>cpDir==='asc'?(a[cpSort]>b[cpSort]?1:-1):(a[cpSort]<b[cpSort]?1:-1));return d;},[cpSearch,cpSort,cpDir]); const doCpSort=useCallback((col)=>{setCpSort(col);setCpDir(d=>cpSort===col?(d==='asc'?'desc':'a` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);const withEts=COUNTRIES.filter(c=>c.etsActive==='Yes').length;const withTax=COUNTRIES.filter(c=>c.carbonTax==='Yes').length;retur` |
| `contChart` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.continent])m[c.continent]={continent:c.continent,avgStr:0,avgNdc:0,n:0};m[c.continent].avgStr+=c.policyStringency;m[c.continent].avgNdc+=c.ndcAmbition;m[c.continent].` |
| `targetDist` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.tempTarget]=(m[c.tempTarget]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['policyStringency','ndcAmbition','ndcProgress','renewableTarget','climateFinance','adaptationSpend'];const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);return dims.map(` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-policy/countries` | `countries` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/country/{iso3}` | `country` | api/v1/routes/climate_policy_radar.py |
| GET | `/api/v1/climate-policy/status` | `status` | api/v1/routes/climate_policy_radar.py |
| POST | `/api/v1/climate-policy/assess-jurisdiction` | `assess_jurisdiction` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/score-ndc` | `score_ndc` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/carbon-price-gap` | `carbon_price_gap` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/policy-pipeline` | `policy_pipeline` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/portfolio-impact` | `portfolio_impact` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/jurisdictions` | `get_jurisdictions` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/fit-for-55` | `get_fit_for_55` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ira-credits` | `get_ira_credits` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/repowereu` | `get_repowereu` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/carbon-price-corridor` | `get_carbon_price_corridor` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ngfs-policy-scenarios` | `get_ngfs_policy_scenarios` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/g20-carbon-pricing` | `get_g20_carbon_pricing` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/sector-policy-map` | `get_sector_policy_map` | api/v1/routes/climate_policy_tracker.py |

### 2.3 Engine `climate_policy_tracker_engine` (services/climate_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimatePolicyTrackerEngine._get_jurisdiction` | iso |  |
| `ClimatePolicyTrackerEngine._is_advanced_economy` | iso |  |
| `ClimatePolicyTrackerEngine._get_nze_price` | iso, year |  |
| `ClimatePolicyTrackerEngine.assess_jurisdiction_policy` | jurisdiction | Full jurisdiction policy assessment: NDC ambition, carbon price gap vs IEA NZE, policy stringency, transition risk. |
| `ClimatePolicyTrackerEngine.score_ndc_ambition` | jurisdiction, target_pct, base_year, conditional | Score NDC ambition 0-100 and assess Paris 1.5°C consistency. Uses provided target_pct/base_year if given, otherwise falls back to jurisdiction profile data. |
| `ClimatePolicyTrackerEngine._compute_ambition_score` | target_pct, base_year, ndc_status, net_zero_year | Internal ambition score computation (0-100). |
| `ClimatePolicyTrackerEngine.track_policy_pipeline` | jurisdiction, entity_sector | Track applicable regulations and compliance deadlines for a given jurisdiction + sector combination. |
| `ClimatePolicyTrackerEngine._sector_to_fit55_keywords` | sector |  |
| `ClimatePolicyTrackerEngine._get_applicable_policies` | iso |  |
| `ClimatePolicyTrackerEngine._get_upcoming_deadlines` | iso |  |
| `ClimatePolicyTrackerEngine.calculate_carbon_price_gap` | jurisdiction, current_price | Calculate gap between jurisdiction's carbon price and IEA NZE corridor. Returns gap amount, trajectory analysis, and economic impact estimate. |
| `ClimatePolicyTrackerEngine.assess_policy_portfolio_impact` | portfolio_countries, portfolio_sectors, weights | Assess portfolio-level transition risk from climate policy exposure. Parameters ---------- portfolio_countries : list of ISO2 country codes portfolio_sectors : list of sector names (matching SECTOR_POLICY_MAP keys) weights : exposure weights (must sum to 1); defaults to equal weight |

**Engine `climate_policy_tracker_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PARIS_15C_BENCHMARK_PCT_FROM_2010` | `43` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EU` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `those` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICING`, `CONTINENT`, `INCOME`, `PIECLRS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Pricing Jurisdictions | — | World Bank CPD 2024 | Number of jurisdictions with operational carbon taxes or emissions trading systems as of 2024. |
| Global Weighted Carbon Price | — | World Bank CPD 2024 | GDP-weighted average carbon price across all operational pricing instruments globally. |
- **UNFCCC NDC registry, World Bank CPD, Grantham climate laws database** → Ambition scoring, carbon price normalisation, trajectory gap analysis → **Country policy dashboards, sector transition risk flags, carbon price forecasts**

## 5 · Intermediate Transformation Logic
**Methodology:** Policy Ambition Score
**Headline formula:** `PAS = Σ wᵢ × Policyᵢ / MaxScore`

Weighted composite of NDC unconditional/conditional targets, carbon price level, sectoral coverage, and enforcement track record.

**Standards:** ['Climate Action Tracker', 'World Bank Carbon Pricing Dashboard']
**Reference documents:** UNFCCC NDC Registry; Climate Action Tracker Country Assessments; World Bank Carbon Pricing Dashboard 2024; Climate Change Laws of the World (Grantham Institute)

**Engine `climate_policy_tracker_engine` — extracted transformation lines:**
```python
frac = (year - y0) / (y1 - y0)
base_year_adjustment = max(0, (b_year - 2010) * 0.5)
adjusted_paris_benchmark = PARIS_15C_BENCHMARK_PCT_FROM_2010 - base_year_adjustment
gap_vs_15c = max(adjusted_paris_benchmark - t_pct, 0)
target_score = min(70.0, (target_pct / 55) * 70)
base_year_penalty = max(0, (base_year - 2010) * 0.3)
gap = max(nze_price - actual_price, 0)
years_to_close = max(2030 - 2024, 1)
annual_increase_required = gap / years_to_close if year == 2030 else None
gap_2030 = max(self._get_nze_price(iso, 2030) - actual_price, 0)
gap_2050 = max(self._get_nze_price(iso, 2050) - actual_price, 0)
gdp_risk_pct = gap_2030 / 50 * 1.0 if is_ae else gap_2030 / 50 * 0.5
weights = [1.0 / n] * n
weights = [w / total for w in weights]
w = weights[i] if i < len(weights) else 1.0 / n
sector_risk_modifier = max(sector_risk_modifier, 1.0 + overlap * 0.05)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **6** other module(s).
**Shared engines (edits propagate!):** `climate_policy_tracker_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-policy` | engine:climate_policy_tracker_engine, table:EU, table:those |
| `critical-minerals` | table:EU |
| `ai-governance` | table:EU |
| `critical-minerals-climate` | table:EU |
| `api-gateway-monitor` | table:EU |
| `sovereign-corporate-bridge` | table:those |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Policy Ambition Score**
> `PAS = Σ wᵢ × Policyᵢ / MaxScore` — a weighted composite of NDC targets, carbon-price level,
> sectoral coverage and enforcement track record. **No composite score is computed anywhere in this
> page.** Every country-level score (`policyStringency`, `ndcAmbition`, `ndcProgress`, ...) is an
> independent draw from the platform's seeded PRNG, not a weighted function of the others. The
> guide also claims 190+ country coverage; the code holds exactly 50 countries. A genuine
> jurisdiction-scoring implementation *does* exist in the shared backend engine
> (`climate_policy_tracker_engine.py`, documented under `climate-policy`), but this page does not
> call it. The sections below document the code as it behaves.

### 7.1 What the module computes

`ClimatePolicyIntelligencePage.jsx` (135 lines) renders a 50-country policy screening table, a
15-mechanism carbon-pricing table, and dashboard aggregates. The country dataset is generated at
module load:

```js
sr = (s) => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };   // platform PRNG
policyStringency = Math.round(15 + sr(i*7)  * 80)      // 15–95
carbonPrice      = Math.round(     sr(i*11) * 180)     // $0–180/t
ndcAmbition      = Math.round(10 + sr(i*13) * 85)      // 10–95
ndcProgress      = Math.round( 5 + sr(i*17) * 90)      // 5–95 %
renewableTarget  = Math.round(10 + sr(i*19) * 80)
emissionsGt      = sr(i*59)*12 + 0.1                   // 0.1–12.1 Gt
netZeroYear      = 2030 + floor(sr(i*71)*30)           // 2030–2059
tempTarget       = sr(i*67)<0.3 ? '1.5C' : sr(i*67)<0.7 ? '2.0C' : 'Insufficient'
parisAligned     = sr(i*7) > 0.5 ? 'Yes' : 'No'
```

Note the **seed reuse**: `parisAligned` uses seed `i*7`, the same as `policyStringency` — so a
country is "Paris Aligned" exactly when its stringency exceeds ~55. This is the only (accidental)
internal consistency in the dataset; ambition, progress and emissions are mutually independent.

### 7.2 Parameterisation

| Dataset | Rows | Nature |
|---|---|---|
| `COUNTRIES` | 50 (real names, continents, World-Bank income groups) | All numeric fields `sr()`-synthetic |
| `CARBON_PRICING` | 15 mechanisms | Hand-curated, plausible vs World Bank CPD (EU ETS $85/40% coverage, Sweden tax $137, China ETS $9) |
| `TREND` | 24 months | `avgPrice = 30 + 2i + sr(i*7)*15` — a deterministic +$2/month drift plus noise; `stringency = 35 + 0.8i + noise` |

Badge thresholds `[25, 50, 70]` colour-code stringency/ambition (red < 25 ≤ amber < 50 ≤ gold <
70 ≤ green) — display heuristics with no external provenance.

### 7.3 Calculation walkthrough

1. **Screening** — text/continent/income filters, sortable columns, 15-per-page pagination; row
   expansion shows the 12 detail fields plus a per-country radar (note `Finance` is plotted as
   `climateFinance*5` and `Adaptation` as `adaptationSpend*7` to stretch $0–20Bn values onto the
   0–100 radar axis).
2. **KPIs** — arithmetic means over all 50 countries: `avgStringency`, `avgNdc`; counts of ETS
   (`etsActive==='Yes'`), carbon-tax and Paris-aligned countries.
3. **Continental chart** — group-by continent, mean stringency and ambition per group.
4. **Temperature-target pie** — frequency count of the `tempTarget` label (expected split ≈ 30%
   1.5C / 40% 2.0C / 30% Insufficient by construction of the thresholds).
5. **NDC Tracker tab** — top-20 slice by ambition (note: `COUNTRIES.slice(0,20).sort(...)` sorts
   the *first 20 by id*, not the global top 20) and a top-15 emitters area chart.

### 7.4 Worked example — country i = 0 (United States)

| Field | Formula | Value |
|---|---|---|
| policyStringency | 15 + sr(0)·80; sr(0)=frac(sin(1)·10⁴)=frac(8414.71)=0.7098 | 15+56.8 → **72** |
| parisAligned | sr(0)=0.7098 > 0.5 | **Yes** (consistent: stringency 72 > 55) |
| carbonPrice | sr(0·11)=sr(0)=0.7098 → 0.7098·180 | **$128/t** (US actual: no federal price — illustrates synthetic nature) |
| ndcAmbition | 10 + sr(0·13)·85 = 10+0.7098·85 | **70** |

(All seeds `i*k` collapse to `sr(0)` for i=0, so country #1's scores are perfectly correlated —
another seed-design artifact.)

### 7.5 Data provenance & limitations

- **All 50-country scores are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); only the country
  names, continents and income groups are real. The carbon-pricing mechanism table is curated and
  broadly accurate as of ~2024 but static.
- No composite PAS, no weighting, no enforcement/track-record input, no UNFCCC/Grantham data feed.
- The `TREND` series' upward drift is a design choice (carbon prices trending up), not data.
- i=0 seed collapse and the `i*7` seed reuse (§7.1) mean several columns are correlated by
  accident rather than by economics.
- The NDC Tracker's "top 20" is a slice-then-sort bug (shows first 20 ids, sorted).

**Framework alignment:** Climate Action Tracker (guide's named standard — CAT actually rates
countries by comparing policies/NDCs against modelled domestic pathways and fair-share equity
ranges, producing the critically-insufficient→1.5°C-compatible bands; nothing equivalent is
computed here) · World Bank Carbon Pricing Dashboard (the CARBON_PRICING table mirrors its
instrument/price/coverage schema) · UNFCCC NDC Registry (conceptual source of the tracked fields).

## 8 · Model Specification — Policy Ambition Score (PAS)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce the composite Policy Ambition Score the guide promises, for ~120 jurisdictions with
adequate data, refreshed annually, to feed sovereign transition-risk tilts and the
`climate-policy` portfolio exposure screen.

### 8.2 Conceptual approach

Weighted multi-pillar index in the style of the **OECD Environmental Policy Stringency index**
(instrument-level scoring aggregated with fixed weights) cross-checked against **Climate Action
Tracker** ratings and the **Grantham Climate Change Laws of the World** legislation counts.
Pillars: (A) NDC ambition, (B) carbon pricing, (C) sectoral regulation coverage, (D) enforcement/
track record — exactly the four the guide names.

### 8.3 Mathematical specification

```
A = 100 × min(1, r_NDC / r_1.5(base_year))          # r_1.5 = 43% from 2010 (IPCC AR6), rebased
B = 100 × min(1, P_eff / 130) ,  P_eff = Σ_i price_i × coverage_i   # $130 = IEA NZE AE 2030
C = 100 × (Σ_s 1{sector s regulated} × share_s)     # s ∈ {power, industry, transport, buildings, AFOLU}, share_s = sector emission share
D = 100 × min(1, achieved_reduction / pledged_reduction_track_record)   # last completed pledge cycle
PAS = 0.35·A + 0.25·B + 0.25·C + 0.15·D
Bands: ≥75 leader · 55–74 advancing · 35–54 lagging · <35 minimal
```

| Parameter | Source |
|---|---|
| r_NDC, base years | UNFCCC NDC Registry |
| 43% / $130 anchors | IPCC AR6 WGIII SPM; IEA WEO NZE corridor (already in `climate_policy_tracker_engine.py`) |
| price_i, coverage_i | World Bank Carbon Pricing Dashboard annual data |
| sector regulation flags | Grantham CCLW + IEA Policies database |
| share_s | UNFCCC inventories / OWID sectoral emissions (in platform `reference_data`) |
| weights (0.35/0.25/0.25/0.15) | initial expert prior; re-fit by regressing on CAT numeric bands (§8.5) |

### 8.4 Data requirements

Per country-year: NDC target %, base/target year, instrument prices & coverage, sector regulation
dummies, sector emission shares, historical pledge outcomes. All free (UNFCCC, World Bank, CCLW,
OWID). Platform reuse: OWID reference tables, engine jurisdiction profiles, `useReferenceData`
hook for delivery to this page.

### 8.5 Validation & benchmarking plan

Rank-correlate PAS against OECD EPS (expect ρ > 0.7 on OECD members) and CAT ordinal ratings
(expect monotone band mapping); weight re-calibration by ordered logit on CAT bands; stability:
year-on-year PAS moves > 15 pts must trace to an identifiable policy event (audit log).

### 8.6 Limitations & model risk

Regulation dummies ignore stringency-within-instrument (a weak ETS scores as covered); enforcement
pillar is thin for countries with one pledge cycle; index weights are judgemental — publish
sensitivity fan (weights ±10pp). Fallback: where pillar D is missing, renormalise A–C weights and
flag coverage tier.

## 9 · Future Evolution

### 9.1 Evolution A — Replace the seeded screener with engine-scored countries (analytics ladder: rung 1 → 2)

**What.** §7's finding is a wiring irony: this page fabricates what its own domain
already computes. The guide's `PAS = Σ wᵢ×Policyᵢ/MaxScore` is not formed — all 50
countries' `policyStringency`/`ndcAmbition`/`ndcProgress` are independent seeded
draws (and the guide claims 190+ countries vs the coded 50) — while the shared
`climate_policy_tracker_engine` (documented under `climate-policy`) implements
genuine NDC scoring, carbon-price-gap, and jurisdiction assessment behind live
`/api/v1/climate-policy/*` routes this page never calls. Evolution A deletes the
seeded generator and rebuilds the screening table as an engine client: per-country
rows populated from `score-ndc` and `assess-jurisdiction` outputs over the curated
country corpus, the 15-mechanism carbon-pricing table replaced by the World Bank
dashboard reference data the sibling module's Evolution A establishes, and coverage
stated honestly (as many countries as the engine's corpus supports — not "190+"
until true).

**How.** (1) Batch-scoring endpoint or client loop over the country list; results
cached with engine version. (2) The PAS either implemented in the engine as a
documented weighted composite of its existing sub-scores, or the guide rewritten to
the engine's actual outputs — one canonical scoring story across both policy modules.
(3) Screening filters (continent, income group) retained over the new rows.

**Prerequisites (hard).** PRNG purge; deduplication decision with `climate-policy`
(two pages, one engine, one data layer — their split of roles recorded in both
guides). **Acceptance:** every country score reproduces via a direct engine call;
the stated coverage count equals the corpus size; zero seeded scores remain.

### 9.2 Evolution B — Transition-risk screening copilot (LLM tier 2)

**What.** A screening assistant for sovereign and portfolio analysts: "rank our
sovereign exposures by policy-implementation gap", "which middle-income countries
have carbon prices within $10 of NZE-2030 needs?", "explain why country X scores
low" (the engine's decomposition — target score, base-year penalty, price gap — is
fully explainable). Batch questions run as tool-call loops over the engine routes;
comparative narration cites per-country engine outputs.

**How.** Tool schemas over the tracker POSTs (shared with the `climate-policy`
copilot — one tool registry, two module surfaces per the atlas endpoint map);
validator on every score and gap; screening results carry engine version and corpus
vintage so ranks are reproducible; refusal on policy forecasts.

**Prerequisites (hard).** Evolution A first — screening over seeded draws would rank
countries by noise while wearing a CAT-flavoured costume; coordination with the
sibling copilot to avoid contradictory answers from the same engine. **Acceptance:**
a ranking regenerates identically from the logged tool calls; a low-score explanation
cites the engine's sub-score contributions; coverage questions get the honest corpus
count.