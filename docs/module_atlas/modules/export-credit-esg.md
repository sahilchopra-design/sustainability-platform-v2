# Export Credit ESG
**Module ID:** `export-credit-esg` · **Route:** `/export-credit-esg` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages environmental and social compliance for export credit agency transactions under the OECD Common Approaches on Officially Supported Export Credits and Equator Principles requirements. Covers Category A/B/C project classification, ESIA benchmarking against applicable host country and IFC standards, and public disclosure obligations. Supports ECA lenders, exporters, and project developers navigating Arrangement compliance.

> **Business value:** Enables export credit agencies, banks, and exporters to navigate the complex OECD Common Approaches framework efficiently, ensure IFC PS benchmarking rigour for Category A transactions, and satisfy public information requirements that protect ECA reputational and legal standing.

**How an analyst works this module:**
- Create ECA transaction record and input project details, host country, sector, and estimated ECA-supported value.
- Complete OECD Common Approaches categorisation questionnaire; generate category determination with supporting evidence.
- Upload ESIA and complete IFC PS compliance matrix; identify host country gaps requiring enhanced mitigation measures.
- Generate OECD CA public information package and submit to ECA for endorsement decision; track monitoring cycle.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `ECA_NAMES`, `EP_CATS`, `ESG_CATS`, `IFC_PS`, `PROJ_NAMES`, `SECTORS`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ECA_NAMES` | `['Euler Hermes (DE)','Bpifrance (FR)','US EXIM (US)','UKEF (GB)','NEXI (JP)','K-EXIM (KR)','SACE (IT)','CESCE (ES)','Atradius (NL)','EDC (CA)','Sinosure (CN)','EKN (SE)','SERV (CH)','OeKB (AT)','EKF (DK)'];` |
| `PROJ_NAMES` | `['Mekong Solar Farm','Trans-Saharan Pipeline','Baltic Wind Park','Andean Copper Mine','Jakarta Mass Transit','Lagos Port Expansion','Patagonia Wind Complex','Nile Irrigation System','Caspian Gas Platform','Borneo Palm Re` |
| `transactions` | `Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);` |
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];const eca=ECA_NAMES[Math.floor(s2*ECA_NAMES.length)];` |
| `esgCat` | `ESG_CATS[Math.floor(s3*3)];const epCat=EP_CATS[Math.floor(s4*3)];` |
| `countries` | `Array.from({length:40},(_,i)=>{const s=sr(i*11);const s2=sr(i*17);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv]` |
| `filtered` | `useMemo(()=>{let d=[...transactions];if(search)d=d.filter(r=>r.project.toLowerCase().includes(search.toLowerCase())\|\|r.eca.toLowerCase().includes(search.toLowerCase()));if(filterSector!=='All')d=d.filter(r=>r.sector===filterSector);if(filterCat!=='All')d=d.filter(r=>r.esgCat===filterCat);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol` |
| `filteredCountries` | `useMemo(()=>{let d=[...countries];if(countrySearch)d=d.filter(r=>r.country.toLowerCase().includes(countrySearch.toLowerCase()));if(regionFilter!=='All')d=d.filter(r=>r.region===regionFilter);d.sort((a,b)=>countrySortDir==='asc'?(a[countrySortCol]>b[countrySortCol]?1:-1):(a[countrySortCol]<b[countrySortCol]?1:-1));return d;},[countrySearch` |
| `totalValue` | `transactions.reduce((s,t)=>s+t.valueMn,0);` |
| `avgOecd` | `Math.round(transactions.reduce((s,t)=>s+t.oecdScore,0)/50);` |
| `sectorAgg` | `useMemo(()=>SECTORS.map(s=>{const ts=transactions.filter(t=>t.sector===s);return {sector:s,count:ts.length,value:ts.reduce((a,t)=>a+t.valueMn,0)};}).filter(s=>s.count>0),[]);` |
| `geoAgg` | `useMemo(()=>{const m={};transactions.forEach(t=>{if(!m[t.hostCountry])m[t.hostCountry]={country:t.hostCountry,count:0,value:0};m[t.hostCountry].count++;m[t.hostCountry].value+=t.valueMn;});return Object.values(m).sort((a` |
| `riskDist` | `useMemo(()=>[{cat:'Category A',count:catACnt},{cat:'Category B',count:transactions.filter(t=>t.esgCat==='B').length},{cat:'Category C',count:transactions.filter(t=>t.esgCat==='C').length}],[]); const regions=[...new Set(countries.map(c=>c.region))].sort();` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/export-credit-esg/assess` | `assess_export_credit` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/fossil-fuel-screen` | `fossil_fuel_screen` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/equator-principles` | `equator_principles` | api/v1/routes/export_credit_esg.py |
| POST | `/api/v1/export-credit-esg/green-classification` | `green_classification` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/eca-profiles` | `ref_eca_profiles` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/oecd-arrangement` | `ref_oecd_arrangement` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/ifc-performance-standards` | `ref_ifc_performance_standards` | api/v1/routes/export_credit_esg.py |
| GET | `/api/v1/export-credit-esg/ref/fossil-fuel-exclusions` | `ref_fossil_fuel_exclusions` | api/v1/routes/export_credit_esg.py |

### 2.3 Engine `export_credit_esg_engine` (services/export_credit_esg_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_is_designated_country` | country_iso2 |  |
| `_resolve_oecd_category` | sector, project_value_usd, country_iso2 | Heuristic OECD Common Approaches category based on sector and project size. |
| `_check_ifc_ps_compliance` | sector, ps_checked | Check IFC PS compliance given sector and which standards were reviewed. |
| `_classify_fossil_fuel` | sector, subsector | Map sector/subsector to fossil fuel exclusion matrix key. |
| `_derive_esg_risk_tier` | oecd_category, fossil_fuel_classified, ifc_compliant, country_iso2 |  |
| `assess_export_credit_esg` | transaction | Full ESG assessment for an export credit / trade finance transaction. Returns: ECA eligibility, OECD Common Approaches category, IFC PS compliance, fossil fuel classification, green classification, ESG risk tier, action items. |
| `screen_fossil_fuel_exposure` | sector, subsector, eca_name | Screen a transaction for fossil fuel exposure and ECA exclusion status. Returns: Exclusion status by ECA, fossil fuel classification, green taxonomy eligibility. |
| `apply_equator_principles` | project_value_usd, country_iso2, sector, has_existing_esia, community_affected, indigenous_peoples_affected, cultural_heritage_affected | Determine Equator Principles IV applicability and requirements. Returns: EP applicability flag, category (A/B/C), required principles, ESIA scope, signatory EPFIs, required standards. |
| `classify_green_trade_instrument` | instrument_type, use_of_proceeds, sector, project_value_usd, eca_name | Classify a trade finance instrument for green eligibility. Returns: Green eligibility, ITFC standard compliance, eligible green categories, CCSU eligibility, EU taxonomy alignment, ICMA principles alignment. |
| `get_eca_sustainability_profile` | eca_name | Retrieve full ECA sustainability profile. Returns: Paris alignment, fossil fuel exclusions, green products, Berne Union membership, Equator Principles alignment, IFC PS requirements. |
| `ExportCreditESGEngine.assess` | data |  |
| `ExportCreditESGEngine.fossil_fuel_screen` | sector, subsector, eca_name |  |
| `ExportCreditESGEngine.equator_principles` | project_value_usd, country_iso2, sector, has_existing_esia, community_affected, indigenous_peoples_affected, cultural_heritage_affected |  |
| `ExportCreditESGEngine.green_classification` | instrument_type, use_of_proceeds, sector, project_value_usd, eca_name |  |
| `ExportCreditESGEngine.eca_profile` | eca_name |  |

**Engine `export_credit_esg_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EP_SIGNATORY_BANKS` | `[{'name': 'HSBC', 'country': 'GB', 'signatory_year': 2003}, {'name': 'Citigroup', 'country': 'US', 'signatory_year': 2003}, {'name': 'BNP Paribas', 'country': 'FR', 'signatory_year': 2003}, {'name': 'Société Générale', 'country': 'FR', 'signatory_year': 2003}, {'name': 'Barclays', 'country': 'GB', '` |
| `EP_APPLICABILITY_THRESHOLD_USD` | `10000000` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `year` *(shared)*
**Frontend seed datasets:** `COLORS`, `ECA_NAMES`, `EP_CATS`, `ESG_CATS`, `IFC_PS`, `PROJ_NAMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OECD CA Category (A/B/C) | — | OECD Common Approaches Â§4 | Project impact category determining depth of E&S review required; Category A requires full ESIA; >$10M threshold applies. |
| IFC PS Compliance Score (%) | — | ESIA Audit | Weighted IFC PS compliance across applicable standards; minimum 85% required for ECA cover endorsement. |
| Public Information Availability Score | — | OECD CA Â§24 | Scoring of public disclosure completeness: ESIA summary, monitoring reports, and corrective action disclosure. |
| Host Country Gap Assessment Count | — | OECD CA Â§6 | Number of IFC PS requirements exceeding host country regulatory standard; gaps drive enhanced ESAP obligations. |
- **Project information memorandum and ESIA documents** → Apply OECD CA categorisation criteria; map ESIA findings to IFC PS sub-requirements → **OECD CA category determination and IFC PS compliance gap matrix**
- **Host country E&S regulations database** → Compare project mitigation requirements against applicable national law; identify E&S gaps requiring enhanced measures → **Host country gap count by PS and corresponding ESAP obligations**
- **OECD CA monitoring reports and corrective actions** → Ingest annual monitoring updates; update compliance scores and public disclosure inventory → **Updated ECA ESG compliance score and public information availability rating**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/export-credit-esg/ref/eca-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'eca_profiles', 'berne_union_framework', 'miga_overview'], 'n_keys': 4}`

**GET /api/v1/export-credit-esg/ref/fossil-fuel-exclusions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fossil_fuel_types', 'exclusion_matrix', 'notes'], 'n_keys': 3}`

**GET /api/v1/export-credit-esg/ref/ifc-performance-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'standards', 'equator_principles', 'designated_country_note', 'ep_applicability_threshold_usd'], 'n_keys': 5}`

**GET /api/v1/export-credit-esg/ref/oecd-arrangement** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_understandings', 'common_approaches', 'ep_signatory_banks', 'ep_threshold_usd', 'green_trade_instruments', 'sector_risk_matrix'], 'n_keys': 6}`

**POST /api/v1/export-credit-esg/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/export-credit-esg/equator-principles** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/export-credit-esg/fossil-fuel-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/export-credit-esg/green-classification** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ECA ESG Compliance Score
**Headline formula:** `ECA_ESG = (IFC_PS_Score × w_ps + OECD_CA_Score × w_ca) / (w_ps + w_ca)`

Weighted composite of IFC PS compliance score (PS1â€“PS8, weighted 0.6) and OECD Common Approaches procedural compliance score (weighted 0.4). OECD CA score assesses project categorisation, ESIA benchmarking, monitoring plan, and public information availability requirements. Projects in sensitive sectors (Category A) require stricter benchmarking and independent review before ECA cover is granted.

**Standards:** ['OECD Common Approaches 2016 (TAD/ECG(2003)2)', 'IFC Performance Standards 2012', 'Equator Principles IV 2020']
**Reference documents:** OECD Common Approaches on Officially Supported Export Credits 2016; IFC Performance Standards 2012; Equator Principles IV 2020; OECD Recommendation of the Council on Common Approaches 2012; UK UKEF Environmental and Social Statement Policy

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).

| Connected module | Shared via |
|---|---|
| `financial-modeling-studio` | table:year |
| `project-finance-debt-sizer` | table:year |
| `tax-equity-transferability` | table:year |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** A backend engine exists
> (`export_credit_esg_engine.py`, with real `/assess`, `/equator-principles`, `/fossil-fuel-screen`,
> `/green-classification` endpoints) that could compute the guide's composite
> `ECA_ESG = (0.6·IFC_PS + 0.4·OECD_CA)`. **The `ExportCreditESGPage.jsx` frontend does not call it for
> scoring** — it renders 50 seeded transactions and 40 seeded countries, and the weighted composite is
> **never computed on-page**. The IFC PS statuses, OECD/E/S/G scores, EP categories are all `sr()`
> synthetic. The framework labels (ECAs, IFC PS1–PS8, OECD Common Approaches, Equator Principles
> categories) are real. Documented below.

### 7.1 What the frontend computes

`transactions` (50) and `countries` (40) are seeded; the only aggregation is portfolio roll-ups:

```js
oecdScore = round(50 + s3·45)               // 50–95, synthetic
eScore/sScore/gScore = round(40..50 + sr()·50..55)   // synthetic E/S/G pillar scores
ifcScreening = IFC_PS.map(ps => ({
  status: sr()>0.3 ? 'Compliant' : sr()>0.15 ? 'Partial' : 'Gap',
  score:  round(40 + sr()·55)
}))
// portfolio:
totalValue = Σ valueMn ;  avgOecd = round(Σ oecdScore / 50)
sectorAgg / geoAgg / riskDist  = counts and value sums by sector / host country / ESG category
```

The **weighted ECA_ESG composite (0.6·IFC + 0.4·OECD) is not computed** — the page shows the pillar
scores separately but never blends them per the guide's formula.

### 7.2 Parameterisation & provenance

| Element | Rows | Provenance |
|---|---|---|
| `ECA_NAMES` | 15 | **Real ECAs**: Euler Hermes (DE), Bpifrance, US EXIM, UKEF, NEXI, K-EXIM, SACE, CESCE, Atradius, EDC, Sinosure, EKN, SERV, OeKB, EKF |
| `IFC_PS` | 8 | **Real** IFC Performance Standards PS1–PS8 (Assessment, Labour, Pollution, Community, Land Resettlement, Biodiversity, Indigenous, Cultural Heritage) |
| `EP_CATS` / `ESG_CATS` | 3 / 3 | **Real** Equator Principles / OECD Common Approaches Category A/B/C |
| `SECTORS` | 12 | Real project-finance sectors |
| `PROJ_NAMES` | 50 | Illustrative project names |
| Transaction/country scores | seeded | **Synthetic** `sr()` |
| Country `region`, names | 40 | Real host-country names + regions (metadata) |

### 7.3 Calculation walkthrough (frontend)

1. `transactions` generates 50 deals with seeded ECA, sector, ESG category (A/B/C), EP category, value,
   tenor, per-PS IFC status, OECD/E/S/G scores, hazard risks, covenants.
2. Filter/sort by sector, category, search; expand row for the IFC PS radar.
3. `countries` provides 40 host-country risk profiles (OECD risk 1–7, E/S/G, climate vulnerability,
   corruption index) — all seeded.
4. Portfolio tab: `totalValue`, `avgOecd`, `sectorAgg`, `geoAgg`, and a Category A/B/C distribution.

### 7.4 Worked example (transaction i = 3 → "Andean Copper Mine")

| Step | Computation | Result |
|---|---|---|
| s3 = sr(57) | frac(sin(58)·10⁴) | ≈ 0.30 |
| esgCat | ESG_CATS[floor(0.30·3)] | index 0 → "A" |
| oecdScore | round(50 + 0.30·45) | 64 |
| A guide composite (not coded) | 0.6·IFC_avg + 0.4·64 | — not computed |

A copper mine correctly lands in Category A (highest-impact, full ESIA) — but that is by seeded chance,
not by an impact-screening rule. The OECD score 64 and the per-PS statuses are random, and the guide's
composite that would combine them is absent.

### 7.5 Data provenance & limitations

- **All transaction/country scores are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`). ECA names, IFC PS, EP
  categories, and host countries are real labels on random data.
- **No ECA_ESG composite computed** despite the guide — IFC and OECD pillar scores are shown separately,
  never weighted 0.6/0.4.
- **No host-country gap assessment** (guide KPI) is computed; it is a display field.
- The rigorous backend (`/assess`, `/equator-principles`, `/fossil-fuel-screen`) is not invoked.

**Framework alignment:** Content references the real regime accurately — the **OECD Common Approaches on
Officially Supported Export Credits** (Category A/B/C, >$10M ESIA threshold), the **IFC Performance
Standards 2012** (PS1–PS8), and **Equator Principles IV**. Category A = full ESIA + independent review;
the IFC PS structure is the E&S benchmark against which host-country gaps are measured. The intended-but-
absent artefact is the guide's weighted ECA_ESG compliance score.

## 8 · Model Specification

**Status: specification — not yet wired into the frontend (backend engine exists).** Route transactions
through `export_credit_esg_engine.assess` and compute the weighted composite.

**8.1 Purpose & scope.** Produce a per-transaction ECA ESG compliance score gating cover endorsement,
combining IFC PS compliance with OECD Common Approaches procedural compliance, with host-country gap
assessment and fossil-fuel screening.

**8.2 Conceptual approach.** The weighted composite the guide defines, benchmarked to real ECA E&S review
practice (UKEF, EDC, US EXIM) and the OECD Common Approaches procedure — IFC PS compliance (materiality-
weighted, Compliant/Minor/Major grades) blended with OECD procedural compliance (categorisation, ESIA
benchmarking, monitoring, public disclosure).

**8.3 Mathematical specification.**

```
IFC_PS_score = Σ_p w_p · grade_p / Σ_p w_p × 100   grade ∈ {Compliant 1, Minor 0.5, Major 0}
OECD_CA_score = mean(categorisation, ESIA-benchmarking, monitoring-plan, public-info) × 100
ECA_ESG = (0.6·IFC_PS_score + 0.4·OECD_CA_score)
Host-country gaps = count(PS requirement stricter than national law)
Fossil-fuel screen: exclude ⇔ activity ∈ excluded-fossil list AND not aligned exception
Endorse ⇔ (ECA_ESG ≥ 85) AND (open Major NC = 0) AND fossil-screen pass
```

| Parameter | Source |
|---|---|
| IFC/OECD weights (0.6/0.4) | Guide; ECA practice |
| PS sub-requirement weights | IFC PS Guidance Notes |
| OECD CA procedural criteria | OECD Common Approaches 2016 §4/§6/§24 |
| Endorsement threshold 85% | Guide / ECA covenant |
| Fossil exclusion list | OECD sector understanding + ECA fossil-fuel policies |

**8.4 Data requirements.** Project ESIA (parsed to PS grades), OECD categorisation questionnaire, host-
country E&S law database, sector/fuel classification. Platform has the backend engine and reference
endpoints; frontend needs to POST transaction evidence rather than seed.

**8.5 Validation & benchmarking plan.** Reconcile category determinations against OECD CA §4 criteria;
test that any Major NC blocks endorsement; benchmark against published ECA E&S review conclusions.

**8.6 Limitations & model risk.** PS grading is judgemental — dual sign-off. Category mis-screening
propagates; validate against sector/impact criteria. Conservative fallback: unassessed applicable PS →
treated as Major-NC-equivalent (0) until evidenced.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine and compute the promised ECA_ESG composite (analytics ladder: rung 1 → 2)

**What.** The module already has a rigorous backend (`export_credit_esg_engine.py` with `/assess`, `/equator-principles`, `/fossil-fuel-screen`, `/green-classification`, `/eca-profile`), but the §7 flag documents that `ExportCreditESGPage.jsx` never calls it — it renders 50 `sr()`-seeded transactions and 40 seeded countries, and the guide's headline composite `ECA_ESG = 0.6·IFC_PS + 0.4·OECD_CA` is never computed anywhere. Evolution A closes that wiring gap and adds a scenario layer: assess a real transaction payload through `assess_export_credit_esg()`, compute the weighted composite server-side, and sweep it across OECD category (A/B/C), host-country designation, and IFC PS coverage to show which lever moves eligibility.

**How.** (1) Add the composite to the engine's `assess` response (IFC PS score from `_check_ifc_ps_compliance`, OECD CA procedural score from `_resolve_oecd_category` inputs, weights 0.6/0.4 per §5). (2) Replace the seeded transaction tab with a form-driven assessment calling `POST /assess`, keeping the seeded book only as a clearly badged demo portfolio. (3) Add a what-if grid endpoint that re-runs the assessment over the 3×2×2 category/fossil/ESIA matrix.

**Prerequisites.** None structural — the engine exists; this is frontend wiring plus one engine field. The §7 host-country-gap KPI needs a real host-country standards table (currently display-only). **Acceptance:** the page shows an ECA_ESG value that reproduces the §5 formula from engine-returned pillar scores, and changing `country_iso2` or `sector` in the form changes the composite; no `sr()` value feeds any headline KPI.

### 9.2 Evolution B — Common Approaches compliance copilot (LLM tier 2)

**What.** An ECA-desk copilot that answers "is this transaction Category A, and what does that obligate us to?" by tool-calling the module's five endpoints and narrating real engine output: the OECD category with its `_resolve_oecd_category` evidence, the EP IV applicability from `apply_equator_principles` (>$10M threshold, designated-country logic), fossil-fuel exclusion status per ECA from `screen_fossil_fuel_exposure`, and the action-item list the engine already returns.

**How.** Tool schemas generated from the module's OpenAPI operations (all read-only, Pydantic-typed); the system prompt is grounded in this atlas page's §5/§7 (OECD Common Approaches 2016, IFC PS 2012, EP IV citations are already in the reference list). The copilot's distinctive value is regime navigation: it maps engine flags to the specific OECD CA obligations (ESIA benchmarking, public-information package, independent review for Category A) and drafts the disclosure checklist — text generation grounded in structured engine output, never invented scores. Numbers pass the fabrication validator against tool responses.

**Prerequisites.** Evolution A's wiring (the copilot must narrate engine assessments, not the seeded page state); pgvector corpus per roadmap Tier 1. **Acceptance:** for a test transaction, every category, threshold, and exclusion the copilot cites appears verbatim in a logged tool response; asked for a host-country gap score the engine doesn't compute, it refuses.