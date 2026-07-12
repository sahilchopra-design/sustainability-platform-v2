# Nature Loss Risk
**Module ID:** `nature-loss-risk` · **Route:** `/nature-loss-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies portfolio exposure to financial risks arising from nature loss and ecosystem service degradation through supply chain dependency mapping and physical nature risk scoring. Assesses how biodiversity decline, deforestation, soil degradation, and freshwater stress translate to revenue disruption, cost escalation, and regulatory liability for investee companies. Supports TNFD Assess pillar and CSRD ESRS E4 biodiversity disclosure.

> **Business value:** Helps portfolio managers and sustainability analysts translate the abstract risk of nature loss into quantified revenue-at-risk estimates, enabling prioritised engagement with high-exposure companies and credible TNFD and ESRS E4 disclosures.

**How an analyst works this module:**
- Select companies or portfolio for nature loss risk screening using the ENCORE sector dependency tool
- Map each company to its ecosystem service dependencies and review degradation status per service
- Overlay operational and supply chain geographies onto freshwater stress, soil degradation, and deforestation risk maps
- Compute NLFRS and identify the ecosystem services driving highest financial risk per company
- Prepare CSRD ESRS E4 disclosure data on biodiversity impacts, dependencies, and nature-related financial risks

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BIO_DRIVERS`, `COMPANIES`, `KPI`, `PAGE_SIZE`, `SECTORS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BIO_DRIVERS` | 5 | `driver`, `impact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#059669';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgDep:Math.round(40+sr(i*7)*15),avgImpact:Math.round(35+sr(i*11)*18),tnfdAdoption:Math.round(10+i*2+sr(i*13)*5)}));` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,secF,sortCol,sortDir]); const paged=filtered.slice((page-1)*PAGE_SIZE,page` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length));return{avgDep:avg('natureDep'),avgImpact:avg('natureImpact'),avgTnfd:avg('tnfdReadiness'),committed:COMPANIES.filte` |
| `sectorChart` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,avgDep:0,avgImp:0,n:0};m[c.sector].avgDep+=c.natureDep;m[c.sector].avgImp+=c.natureImpact;m[c.sector].n++;});return Object.values` |
| `radarData` | `useMemo(()=>{const dims=['natureDep','natureImpact','tnfdReadiness','leapScore','waterDep','supplyChainNature'];const avg=(k)=>Math.round(COMPANIES.reduce((s,c)=>s+c[k],0)/ Math.max(1, COMPANIES.length));return dims.map(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIO_DRIVERS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NLFRS (0–100) | — | ENCORE + IPBES composite | Composite nature loss financial risk score; above 60 indicates material revenue exposure to ecosystem degradation |
| High Dependency Services Count | — | ENCORE sector dependency matrix | Number of ecosystem services on which the business has high dependency, heightening nature loss exposure |
| Revenue at Risk from Nature Loss (%) | — | WEF ecosystem service valuation | Proportion of business revenue dependent on ecosystem services that are in significant decline globally |
| Freshwater Stress Exposure (%) | — | WRI Aqueduct water risk overlay | Share of operations or supply chain sourcing in high or extremely high water stress basins |
- **ENCORE ecosystem service dependency database** → Match company sector to dependency intensity matrix; rank services by dependency level → **Ecosystem service dependency profile per company and sector**
- **IPBES ecosystem degradation assessments** → Extract service-specific degradation index by geography; map to company supply chain sourcing regions → **Ecosystem service degradation trajectory per dependency and geography**
- **Operational and supply chain geographies** → Overlay with freshwater stress, soil carbon, and forest cover datasets → **Nature risk spatial exposure heatmap by site and sourcing region**

## 5 · Intermediate Transformation Logic
**Methodology:** Nature Loss Financial Risk Score
**Headline formula:** `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)`

Nature Loss Financial Risk Score aggregates revenue exposure-weighted products of ecosystem service dependency level (High=3, Medium=2, Low=1) and ecosystem service degradation trajectory (IPBES degradation index) across all services on which each company’s operations and supply chain depend. Higher scores indicate greater revenue vulnerability to ecosystem decline.

**Standards:** ['TNFD LEAP Approach v1.1 2023', 'CSRD ESRS E4 Biodiversity and Ecosystems 2023', 'ENCORE Ecosystem Service Dependency Data', 'WEF Nature Risk Rising Report 2020', 'IPBES Global Assessment Report on Biodiversity 2019']
**Reference documents:** TNFD Recommendations v1.0 2023; CSRD ESRS E4 â€” Biodiversity and Ecosystems Standard 2023; ENCORE Methodology â€” UNEP-WCMC 2021; WEF Nature Risk Rising: Why the Crisis Engulfing Nature Matters for Business and the Economy 2020; IPBES Global Assessment Summary for Policymakers 2019

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a **Nature Loss Financial Risk
> Score**, `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)`, built on an
> ENCORE sector-dependency matrix and an IPBES ecosystem-degradation index, with a headline
> "Revenue at Risk (%)" and "Freshwater Stress Exposure (%)" tied to WRI Aqueduct. **None of this
> exists in code.** `NatureLossRiskPage.jsx` has no revenue field, no degradation index, no
> Aqueduct overlay, and no `Dependency × Degradation × Exposure` product anywhere — every metric
> for the 50 named companies is an independent `sr()` PRNG draw with no cross-field arithmetic.

### 7.1 What the module computes

`COMPANIES` — 50 real company names (Nestlé, Cargill, BHP, Shell, Stora Enso, Thai Union, Merck,
…) hard-mapped to 8 sectors via a parallel `secs[]` array (index-aligned, not derived). Each company
gets 16 independently `sr(i×k)`-seeded fields: `natureDep`, `natureImpact`, `biodivFootprint`,
`tnfdReadiness`, `leapScore`, `waterDep`, `soilDep`, `pollinatorDep`, `carbonSeq`, `landUse`,
`speciesRisk`, `deforestLink`, `supplyChainNature` (all 0–100 scales), `msa` (Mean Species
Abundance, 0.1–0.9), plus categorical `sbtNature` (`sr(i×59)>0.6→'Committed'`,
`>0.3→'Exploring'`, else `'None'`) and `naturePlan` (`sr(i×61)>0.5→'Published'`).

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `natureDep` | `10+sr(i×7)×85` | 10–95 |
| `natureImpact` | `5+sr(i×11)×90` | 5–95 |
| `tnfdReadiness` | `5+sr(i×17)×85` | 5–90 |
| `leapScore` | `10+sr(i×19)×80` | 10–90 |
| `msa` | `sr(i×67)×0.8+0.1` | 0.1–0.9 |
| `sbtNature` | `sr(i×59)` thresholds 0.6/0.3 | Committed/Exploring/None |

`BIO_DRIVERS` — a fixed 5-slice donut (Land Use Change 30%, Resource Exploitation 23%, Climate
Change 19%, Pollution 17%, Invasive Species 11%) — plausible IPBES-style driver-attribution shares
but hard-coded constants, not computed from `COMPANIES`. `TREND` — 24 monthly points, 3 more
independent `sr()` series (`avgDep`, `avgImpact`, `tnfdAdoption`), unconnected to `COMPANIES`.

### 7.3 Calculation walkthrough

1. **Dashboard** — KPIs (`avgDep`, `avgImpact`, `avgTnfd`, `committed` count, `avgMsa`) are
   arithmetic means/counts over all 50 companies (legitimate aggregation over synthetic inputs);
   `sectorChart` groups mean `natureDep`/`natureImpact` by the 8 hard-mapped sectors;
   `radarData` averages 6 fields (`natureDep`, `natureImpact`, `tnfdReadiness`, `leapScore`,
   `waterDep`, `supplyChainNature`) into a single portfolio radar shape.
2. **Company Screening** — filter/sort/paginate table with colour-coded `badge()` thresholds
   (`[25,50,70]` low/mid/high bands) applied directly to raw PRNG scores.
3. **TNFD LEAP** — top-15/-20 companies ranked by `leapScore` (itself a bare PRNG draw, not an
   assessed LEAP maturity level) charted against `tnfdReadiness`.
4. **Biodiversity Footprint** — top-20 by `biodivFootprint`, paired with `msa`, `speciesRisk`,
   `landUse`, `deforestLink` — again five independent random numbers displayed together as if one
   metric explained another.

### 7.4 Worked example

Company `i=0` ("Nestle SA", sector `Consumer`): `natureDep = 10+sr(7)×85`. `sr(7)`: `sin(8)=0.9894`,
×10000=9893.6, `frac=0.5822` (`floor(9893.6)=9893`, `9893.6-9893=0.5822`→ but using `x-Math.floor(x)`
on the *unscaled* value: `x=sin(8)*10000=9893.58...`; `Math.floor(x)=9893`; `x-9893=0.58...`).
`natureDep = 10+0.58×85 ≈ 59`. `natureImpact = 5+sr(11)×90`: `sin(12)=-0.5366`, ×10000=-5366.3,
`floor(-5366.3)=-5367`, `frac=0.70` → `natureImpact ≈ 5+0.70×90=68`. These two headline "nature
risk" numbers for Nestlé (dependency 59, impact 68) are independent PRNG draws with no shared
seed relationship and no tie to Nestlé's real palm-oil/cocoa/dairy supply-chain footprint.

### 7.5 Data provenance & limitations

- 100% synthetic — no ENCORE dependency matrix, no IPBES degradation index, no WRI Aqueduct
  overlay, and critically **no revenue field at all**, despite the guide's headline "Revenue at
  Risk (%)" data point.
- Sector assignment is a fixed lookup array parallel to the name list — a real classification
  error for any company would require editing both arrays in lockstep, and there is no validation
  that they stay aligned.
- `BIO_DRIVERS` percentages are plausible-looking (broadly consistent with IPBES's 2019 Global
  Assessment driver ranking: land/sea use change, direct exploitation, climate change, pollution,
  invasive species — in that relative order) but are hard-coded, not computed from any of the 50
  companies' data.

**Framework alignment:** TNFD LEAP — tab and field names only, no Locate/Evaluate/Assess/Prepare
workflow logic · CSRD ESRS E4 — named in the guide, not implemented · IPBES driver ranking — the
qualitative *ordering* of `BIO_DRIVERS` matches IPBES 2019's global attribution, but the percentages
are not sourced to that report.

## 8 · Model Specification — Nature Loss Financial Risk Score (NLFRS)

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Translate ecosystem-service dependency into a **revenue-at-risk** figure
per company, for engagement prioritisation and CSRD ESRS E4 / TNFD Risk & Impact disclosure.

**8.2 Conceptual approach.** Weight each ecosystem service a company depends on by (a) how
degraded that service already is globally/regionally and (b) how much revenue flows through
operations exposed to it — the same dependency × degradation × exposure architecture MSCI and
Moody's ESG Solutions use for "nature value-at-risk" style overlays, and consistent with the
**ENCORE** (ecosystem service dependency) + **IPBES** (degradation trend) data pairing the guide
already names.

**8.3 Mathematical specification.**
```
Dependencyᵢⱼ         = ENCORE sector-dependency rating for service j (0=none,1=low,2=medium,3=high)
ServiceDegradationⱼ,g = IPBES/regional degradation index for service j in geography g (0-1, rising = worse)
RevenueExposureᵢⱼ,g   = revenueᵢ,g,segment / total_revenueᵢ   (segment revenue sourced from geography g, dependent on service j)
NLFRSᵢ               = 100 × Σⱼ,g Dependencyᵢⱼ × ServiceDegradationⱼ,g × RevenueExposureᵢⱼ,g / Σⱼ Dependencyᵢⱼ_max
RevenueAtRisk%ᵢ      = Σⱼ,g RevenueExposureᵢⱼ,g  for services with Dependencyᵢⱼ ≥ 2 (High)
```
| Parameter | Calibration source |
|---|---|
| `Dependencyᵢⱼ` | ENCORE sector × ecosystem-service dependency matrix (UNEP-WCMC, public) |
| `ServiceDegradationⱼ,g` | IPBES Global/Regional Assessment degradation trend by service and region |
| `RevenueExposureᵢⱼ,g` | Company segment/geographic revenue disclosure (10-K, annual report) mapped to ENCORE service categories |
| Freshwater-specific overlay | WRI Aqueduct basin-level water-stress score in place of the generic degradation index for water-dependent services |

**8.4 Data requirements.** ENCORE sector-dependency download (free, UNEP-WCMC); IPBES assessment
degradation tables (free, PDF extraction needed); company segment revenue by geography (10-K
Item 1/segment notes — labour-intensive to structure); WRI Aqueduct basin shapefiles for site-level
water-stress joins where facility geocoordinates exist.

**8.5 Validation & benchmarking plan.** Cross-check sector rankings against MSCI/Moody's published
nature-risk heat maps (directional agreement expected: mining, agriculture, food & beverage should
rank highest); sensitivity-test degradation-index vintage (IPBES updates infrequently, so use the
most recent regional assessment and flag staleness).

**8.6 Limitations & model risk.** Segment revenue rarely maps cleanly to ENCORE service categories
(disclosure grain is coarser than the dependency matrix), forcing analyst judgment calls that should
be documented per company; degradation indices are regional averages, not site-specific; treat
`NLFRS` as a screening triage score, not a precise financial loss estimate — pair with the
platform's existing `physical-risk-portfolio` / `water-risk-analytics` modules for site-level detail.

## 9 · Future Evolution

### 9.1 Evolution A — Compute NLFRS as an actual dependency × degradation × exposure product (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide defines `NLFRSᵢ = Σⱼ (Dependencyᵢⱼ × ServiceDegradationⱼ × RevenueExposureᵢⱼ)` over an ENCORE dependency matrix, IPBES degradation index, and WRI Aqueduct freshwater overlay — but the page has no revenue field, no degradation index, no Aqueduct data, and no cross-field arithmetic; all 16 fields per 50 companies are independent `sr()` draws. Evolution A builds the real score, which is genuinely tractable because the three inputs all have public sources.

**How.** (1) `POST /api/v1/nature-loss-risk/nlfrs` implementing the documented sum: per-company ecosystem-service dependency levels from ENCORE (High=3/Med=2/Low=1 as §5 specifies), service degradation trajectories from IPBES/WWF Living Planet indices, and revenue-exposure fractions from company segment data. (2) Add the WRI Aqueduct freshwater-stress overlay the guide promises — Aqueduct is a free public dataset keyed on lat/long, joinable to the platform's existing geographic layer, replacing the fabricated `waterDep` field with a sourced stress score. (3) Surface the per-service driver ranking (which ecosystem service drives each company's risk) that §1 describes as a workflow step but the code never produces.

**Prerequisites.** Company revenue-segment data (the missing input — sourceable from disclosures or a licensed feed; honest-null where absent); ENCORE attribution; Aqueduct ingestion as a new reference source. The `sr()` fabrication must be fully removed per platform rule. **Acceptance:** NLFRS decomposes into named service-level terms; two companies with identical dependency but different geographic water stress score differently; ESRS E4 export reflects computed, not random, values.

### 9.2 Evolution B — ESRS E4 disclosure-drafting analyst (LLM tier 2)

**What.** A tool-calling analyst supporting the CSRD ESRS E4 workflow §1 describes: "assess this portfolio's nature-loss exposure and draft the E4 impacts/dependencies/risks section" → calls the NLFRS endpoint per holding, identifies the highest-risk companies and their driving ecosystem services, and drafts E4 disclosure paragraphs where every dependency rating and risk figure is a tool output.

**How.** Tool schema over the Evolution-A `/nlfrs` endpoint plus the ENCORE reference; system prompt from this Atlas page and the ESRS E4 / TNFD / IPBES references named in §5. Drafted disclosures map each ESRS E4 datapoint (material impacts, dependencies, transition/physical risks) to a specific computed result, with the no-fabrication validator matching quoted scores to tool responses. The analyst flags companies where revenue-segment data was unavailable (honest-null propagation) rather than inventing exposure fractions.

**Prerequisites (hard).** Evolution A — today's page is pure PRNG, and an ESRS disclosure built on random numbers would be a regulatory liability, not a feature. **Acceptance:** every E4 datapoint in a draft traces to an NLFRS tool call; the analyst refuses to fill exposure fields for companies with missing revenue data, disclosing the gap instead.