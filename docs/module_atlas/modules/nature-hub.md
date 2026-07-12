# Nature Risk & Opportunities Hub
**Module ID:** `nature-hub` · **Route:** `/nature-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated hub for nature-related risk and opportunity assessment following the TNFD LEAP (Locate, Evaluate, Assess, Prepare) framework. Combines biodiversity footprint analysis, ecosystem service dependency mapping, and nature-positive target tracking across portfolio companies. Integrates IBAT biodiversity data, ENCORE ecosystem service database, and TNFD disclosure templates to support A15 nature disclosures and SBTN target alignment.

> **Business value:** Gives corporate sustainability teams and institutional investors the framework, data, and analytics to identify, assess, and disclose nature-related financial risks and opportunities in line with TNFD recommendations and emerging regulatory requirements.

**How an analyst works this module:**
- Complete the TNFD LEAP Locate step by mapping operational and supply chain footprints to biomes and ecosystems
- Run the ENCORE dependency screen to identify high and very high ecosystem service dependencies by business segment
- Conduct IBAT critical habitat proximity analysis for priority operational sites
- Complete the Assess step by quantifying nature-related financial risks (physical, regulatory, reputational) from TNFD risk register
- Prepare TNFD disclosure aligned with recommended disclosures A-M across governance, strategy, risk management, and metrics pillars

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ITEMS`, `PAGE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `filtered` | `useMemo(()=>{let d=[...ITEMS];if(search)d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));if(f1!=='All')d=d.filter(x=>x.sector===f1);if(f2!=='All')d=d.filter(x=>x.region===f2);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,f1,f2]); const page` |
| `kpis` | `useMemo(()=>[{l:'Entities',v:filtered.length},{l:'Avg Biodiv Score',v:filtered.length?(filtered.reduce((s,x)=>s+parseFloat(x.biodivScore),0)/filtered.length).toFixed(1):'0.0'},{l:'TNFD Aligned',v:filtered.filter(x=>x.tnf` |
| `dist1` | `useMemo(()=>{const m={};F1.forEach(s=>m[s]=0);filtered.forEach(x=>m[x.sector]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name:name.length>12?name.slice(0,12)+'..':name,value}));},[filtered]);` |
| `dist2` | `useMemo(()=>{const m={};F2.forEach(r=>m[r]=0);filtered.forEach(x=>m[x.region]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name,value}));},[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Footprint Score (MSA·km²) | — | GLOBIO / GBS methodology | Mean Species Abundance impact per square kilometre; higher values indicate greater biodiversity loss contribution |
| Critical Habitat Proximity (%) | — | IBAT spatial overlay | Proportion of operational sites within or adjacent to IUCN Key Biodiversity Areas or critical habitats |
| Ecosystem Service Dependency (High/Med/Low) | — | ENCORE database | Level of business model dependency on ecosystem services (water, pollination, climate regulation, etc.) |
| Nature-Positive Target Progress (%) | — | SBTN Step 3 target tracking | Progress toward company-level nature-positive commitments relative to SBTN no-net-loss baseline |
- **Corporate facility location data** → Geocode to biome and ecoregion; overlay IBAT KBA and critical habitat layers → **Site-level critical habitat proximity flags and biome classification**
- **ENCORE dependency database** → Match sector to ecosystem service dependency matrix; rank services by dependency level → **Ecosystem service dependency profile by business segment and sector**
- **Supply chain commodity data** → Map sourcing geographies to deforestation and ecosystem degradation risk by commodity → **Upstream nature impact footprint by commodity and sourcing region**

## 5 · Intermediate Transformation Logic
**Methodology:** Biodiversity Footprint Score
**Headline formula:** `BFS = Σᵢ (Impact Driverᵢ × Ecosystem Sensitivityᵢ × Areaᵢ)`

Biodiversity Footprint Score aggregates the product of land-use impact driver intensity, ecosystem sensitivity weight, and affected area across all operational footprints and upstream supply chains. Ecosystem sensitivity weights derive from IUCN threat categories and IBAT critical habitat proximity. The score enables portfolio-level nature impact comparison and SBTN Step 1 scoping.

**Standards:** ['TNFD LEAP Approach v1.1 2023', 'SBTN Science-Based Targets for Nature 2023', 'ENCORE Ecosystem Services Database (UNEP-WCMC)', 'IBAT Integrated Biodiversity Assessment Tool', 'GBS Global Biodiversity Score (CDC Biodiversité)']
**Reference documents:** TNFD Recommendations of the Taskforce on Nature-related Financial Disclosures v1.0 2023; SBTN Science-Based Targets for Nature â€” Initial Guidance for Business 2023; ENCORE Exploring Natural Capital Opportunities, Risks and Exposure â€” UNEP-WCMC; IBAT Integrated Biodiversity Assessment Tool â€” IUCN/BirdLife/UNEP-WCMC/CI; GBS Global Biodiversity Score Methodology â€” CDC Biodiversité 2020

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a **Biodiversity Footprint
> Score** formula, `BFS = Σᵢ (Impact Driverᵢ × Ecosystem Sensitivityᵢ × Areaᵢ)`, sourced to
> GLOBIO/GBS (CDC Biodiversité) methodology, plus a full TNFD LEAP workflow (Locate/Evaluate/
> Assess/Prepare) fed by ENCORE, IBAT and SBTN data. **None of this is implemented.**
> `NatureHubPage.jsx` (94 lines) is a flat, filterable table of 55 named companies with every
> numeric field an independent `sr()` PRNG draw — there is no impact-driver × sensitivity × area
> product anywhere in the file, no ENCORE dependency matrix, no IBAT spatial overlay, and no LEAP
> step logic beyond four cosmetic tab labels borrowed from the framework's name.

### 7.1 What the module computes

`ITEMS` — 55 rows, each a real-world company name (Cargill, Shell, Nestlé, Marriott, …, names
recycled cyclically via `names[i % names.length]` once past index 54) — cross-joined with a
`sr()`-seeded sector (`F1`, 10 sectors) and biome/region (`F2`, 10 regions). Twelve numeric fields
per row (`biodivScore`, `speciesImpact`, `habitatLoss`, `dependency`, `deforestRisk`, `waterDep`,
`pollinDep`, `soilDep`, `disclosure`, `revAtRisk`) and two booleans (`tnfd`, `sbtn`) are each drawn
from an *independent* `sr(i×k)` call (k ∈ {3,7,11,13,17,19,23,29,31,37,41,43,47,59}) — meaning
**no field is derived from any other**: `biodivScore` has no algebraic relationship to
`habitatLoss`, `dependency`, or `deforestRisk` despite the UI juxtaposing them as if correlated
(e.g. the "Biodiversity vs Revenue at Risk" scatter plot).

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `biodivScore` | `sr(i×11)×60+20` | 20–80 |
| `speciesImpact` | `floor(sr(i×13)×50+5)` | 5–54 |
| `habitatLoss` | `sr(i×17)×40+5` | 5–45% |
| `dependency` | `sr(i×19)×80+10` | 10–90 |
| `deforestRisk` | `sr(i×23)×60+5` | 5–65 |
| `waterDep`/`pollinDep`/`soilDep` | `sr()×{70,50,60}+{15,5,10}` | independent |
| `tnfd` / `sbtn` (boolean) | `sr(i×41)>0.3` / `sr(i×43)>0.35` | ~70%/~65% true |
| `disclosure` | `sr(i×47)×40+40` | 40–80 |

All ranges are round-number synthetic bands with no cited source; the guide's GLOBIO/GBS/ENCORE/
IBAT citations do not attach to any specific constant in this list.

### 7.3 Calculation walkthrough

1. Filter/sort/paginate `ITEMS` by search text, sector (`F1`), region (`F2`).
2. **Dashboard tab** — KPI strip is arithmetic means/counts over the *filtered* set (`avg biodivScore`,
   `TNFD Aligned` count, `avg habitatLoss`, `SBTN Committed` count) — legitimate aggregation, but
   over inputs that are themselves uncorrelated random numbers.
3. **`TS` time series** (12 points, 2014–2025) — three more independent `sr()` series
   (`v1`=Biodiv Index, `v2`=Habitat %, `v3`=Threat Level) with **no connection to `ITEMS`** at all;
   it is a decorative trend chart, not a rollup of the entity data.
4. **Dependency Analysis tab** — per-sector mean of `dependency`; per-service mean of
   `waterDep`/`pollinDep`/`soilDep` across the filtered set — correct aggregation mechanics, random
   underlying data.
5. **Mitigation Tracker tab** — counts/means of `tnfd`, `sbtn`, `disclosure`, and a
   `deforestRisk>30` threshold count; a bar chart of the first 15 filtered rows' `disclosure` vs
   `deforestRisk` (again, two uncorrelated PRNG series plotted together).
6. Row-expand panel renders a 6-axis radar (`Biodiv`, `Habitat=100−habitatLoss`, `Dependency`,
   `Deforest`, `Disclosure`, `Water`) purely for visual effect — no weighting or compositing.

### 7.4 Worked example

Row `i=0` ("Cargill"): `s_sector = sr(0)=0.7096` → `floor(0.7096×10)=7` → `F1[7]="Pharma"`
(Cargill mapped to Pharma sector purely by PRNG collision — illustrates that sector assignment is
decorrelated from the real company). `biodivScore = sr(11)×60+20`: `sin(12)=-0.5366`,
×10000=-5366.3, `frac(-5366.3)` in JS `x-Math.floor(x)` → `Math.floor(-5366.3)=-5367`, so
`frac = -5366.3-(-5367)=0.7`. `biodivScore = 0.7×60+20 = 62.0`. `speciesImpact = floor(sr(13)×50+5)`:
`sin(14)=0.9906`, ×10000=9906.7, frac=0.6733 → `floor(0.6733×50+5)=floor(38.67)=38`. These two
"related" nature metrics for the same company (62.0 biodiversity score, 38 species impacted) have
no algebraic link — they are simply two different PRNG seeds.

### 7.5 Data provenance & limitations

- **100% synthetic.** No `fetch`/API call exists in the file; no ENCORE, IBAT, GBS, or SBTN dataset
  is loaded. All 12 numeric fields per entity are independent `sr(seed)=frac(sin(seed+1)×10⁴)` draws.
- Company names are real (55 recognisable agribusiness/mining/consumer/energy/hospitality/chemicals
  firms) but every metric attached to them is fabricated — this is the platform's highest-risk
  presentation pattern: real entity + fake number, easy to mistake for a real assessment.
- The scatter/bar juxtapositions (biodiversity vs. revenue-at-risk, disclosure vs. deforestation
  risk) visually imply correlation between variables that are mathematically independent draws.

**Framework alignment:** TNFD LEAP — tab names only (Locate/Evaluate/Assess/Prepare is not even
literally used as the tab set; actual tabs are Overview/Species & Habitats/Dependency
Analysis/Mitigation Tracker) · ENCORE, IBAT, GBS, SBTN — named in the guide, absent from code.

## 8 · Model Specification — Biodiversity Footprint Score (BFS)

**Status: specification — not yet implemented in code.** The guide's formula
(`BFS = Σᵢ Impact Driverᵢ × Sensitivityᵢ × Areaᵢ`) is a real, well-established approach (it mirrors
CDC Biodiversité's **Global Biodiversity Score** and the **GLOBIO** MSA-loss model) but has zero
implementation; this spec describes how to build it.

**8.1 Purpose & scope.** Score portfolio-company biodiversity impact per operational site,
aggregating to a company-level footprint comparable across sectors, for SBTN Step 1 scoping and
TNFD Metrics & Targets disclosure.

**8.2 Conceptual approach.** Compute impact in **MSA·km² lost** (Mean Species Abundance, the
GLOBIO/GBS standard unit) by combining a sector/activity-specific impact-driver intensity with a
site-specific ecosystem sensitivity weight and the disturbed area — the same architecture as CDC
Biodiversité's GBS and consistent with the **ENCORE** dependency/impact taxonomy for driver
selection (land-use change, water use, GHG, pollution, disturbance).

**8.3 Mathematical specification.**
```
Driverᵢ,d          = activity intensity of driver d at site i (e.g. ha converted, m³ water withdrawn)
Sensitivityᵢ,d      = MSA-loss coefficient for driver d in site i's biome (GLOBIO regression coefficients)
SiteImpactᵢ         = Σ_d Driverᵢ,d × Sensitivityᵢ,d                    [MSA·km²]
CompanyBFS          = Σᵢ SiteImpactᵢ  (own operations) + Σⱼ SupplyChainWeightⱼ × SiteImpactⱼ (Tier-1 suppliers)
CriticalHabitatFlag = 1{ site i intersects an IUCN KBA / IBAT critical-habitat polygon }
```
| Parameter | Calibration source |
|---|---|
| `Sensitivityᵢ,d` (MSA-loss per driver per biome) | GLOBIO model coefficients (PBL Netherlands, public) |
| `Driverᵢ,d` inputs | Company-reported land-use/water/emissions data, or ENCORE sector-average intensity as fallback |
| `CriticalHabitatFlag` | IBAT spatial query (IUCN/BirdLife/UNEP-WCMC) against site lat/long |
| `SupplyChainWeightⱼ` | Spend-based or physical-flow allocation from supply-chain mapping |

**8.4 Data requirements.** Site-level geocoordinates and land-use/water/emissions activity data
(often absent — realistic fallback is sector-average ENCORE intensity by NAICS/GICS code); GLOBIO
sensitivity layers (public download, PBL Netherlands); IBAT API access (paid, IUCN/BirdLife/
UNEP-WCMC) for critical-habitat overlay — the platform has no current IBAT integration.

**8.5 Validation & benchmarking plan.** Compare company-level BFS against CDC Biodiversité's
published GBS scores for overlapping constituents (large caps with public GBS results); sanity
check sector ranking against known high-impact sectors (mining, agriculture, forestry should rank
above tourism, consumer staples) as a directional test.

**8.6 Limitations & model risk.** GLOBIO sensitivity coefficients are regional averages, not
site-specific field measurements; supply-chain attribution requires spend or physical-flow data
most companies do not disclose, forcing reliance on sector-average proxies that mute company-level
differentiation; without real IBAT access, critical-habitat proximity cannot be verified and should
be flagged as "unknown" rather than defaulted to false.

## 9 · Future Evolution

### 9.1 Evolution A — Build the Biodiversity Footprint Score over real ENCORE/IBAT data (analytics ladder: rung 1 → 3)

**What.** §7 is severe: `NatureHubPage.jsx` is 94 lines rendering 55 companies (names recycled cyclically past index 54) where all 12 numeric fields are *independent* `sr()` draws — no field derives from another, so the "Biodiversity vs Revenue at Risk" scatter plots two unrelated randoms. None of the promised BFS formula (`BFS = Σ Impact Driver × Ecosystem Sensitivity × Area`), ENCORE dependency matrix, IBAT overlay, or LEAP logic exists. Evolution A builds the module's first real analytical vertical.

**How.** (1) Stand up `POST /api/v1/nature-hub/bfs` computing the documented product from actual inputs: company operational footprint (area by biome), ENCORE impact-driver intensities per sector, and IUCN/IBAT-derived ecosystem sensitivity weights — the sibling `nature-capital-accounting` module already exposes `/ref/encore-dependencies`, so reuse that reference layer rather than duplicating it. (2) Replace the 55-row PRNG table with a computed screen where `biodivScore`, `habitatLoss`, and `dependency` are algebraically linked through the BFS decomposition, so cross-field charts become meaningful. (3) Sector-resolve the real company names via the GLEIF/OpenFIGI layer to attach ENCORE materiality ratings.

**Prerequisites.** This is effectively a greenfield backend — the current page has zero salvageable computation; ENCORE licensing/attribution for redistribution; IBAT spatial data access (IBAT is subscription-gated — scope to sensitivity weights derivable from open IUCN threat categories if IBAT access is unavailable). **Acceptance:** BFS reproduces from visible driver/sensitivity/area inputs; no `sr()` remains; the biodiversity-vs-revenue relationship reflects a real dependency, not two independent randoms.

### 9.2 Evolution B — TNFD-LEAP guidance copilot (LLM tier 1, scoped honestly)

**What.** Given the module has essentially no real computation today, the near-term LLM value is a framework-guidance copilot: it walks a user through the TNFD LEAP steps and explains what ENCORE, IBAT, SBTN, and GBS each contribute — grounded in the TNFD v1.1, SBTN, and ENCORE reference documents named in §5. It must not pretend to score the user's portfolio until Evolution A exists.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot answers "what does the Locate step require?", "which ecosystem services does the beverage sector depend on per ENCORE?", "how does BFS relate to SBTN Step 1 scoping?" with citations to the framework texts. The system prompt must encode the module's honest current state so the copilot refuses "score my companies" with a pointer to the (post-Evolution-A) BFS endpoint — a hard refusal path, because the page's existing scatter plots would otherwise invite the LLM to narrate noise as insight.

**Prerequisites.** Standards-text ingestion; explicit current-capability statement in the system prompt. Any portfolio-scoring behaviour is strictly gated on Evolution A. **Acceptance:** every framework answer cites a named reference; asking the copilot to interpret the current 55-company table's numbers yields a refusal explaining they are placeholder values.