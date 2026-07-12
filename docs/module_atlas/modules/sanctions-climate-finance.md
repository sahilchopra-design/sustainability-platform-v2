# Sanctions & Climate Finance
**Module ID:** `sanctions-climate-finance` · **Route:** `/sanctions-climate-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analytics for climate finance flows involving sanctioned entities, jurisdictions or counterparties, supporting compliance and integrity in green finance.

> **Business value:** Screens climate finance activity against global sanctions lists to protect green instrument integrity.

**How an analyst works this module:**
- Screen all climate finance counterparties against OFAC, UN and EU consolidated sanctions lists.
- Map transaction flow networks to detect indirect sanctioned entity exposure.
- Calculate tainted flow ratios by instrument type and geography.
- Generate compliance alerts and escalation logs for flagged transactions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIMATE_PROJECTS`, `COMPANIES_100`, `COMP_NAMES`, `COUNTRIES_60`, `DUAL_USE_TECH`, `REGIMES`, `REGIME_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLIMATE_PROJECTS` | 16 | `id`, `name`, `country`, `type`, `valueMn`, `status`, `regime`, `redirected`, `emissions` |
| `DUAL_USE_TECH` | 16 | `tech`, `category`, `controlRegime`, `chinaRestricted`, `russiaRestricted`, `greenApp`, `entityListCo`, `priceImpact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tabs` | `['Sanctions Landscape','Climate Finance Impact','Dual-Use Technology','Portfolio Compliance'];` |
| `countryData` | `useMemo(()=>{ return COUNTRIES_60.map((c,i)=>{ const s=sr(i*17+11);const s2=sr(i*23+7);const s3=sr(i*31+3);const s4=sr(i*37+13);` |
| `radarData` | `useMemo(()=>{ return REGIMES.map((r,i)=>{ const cnt=r==='OFAC SDN'?COMPANIES_100.filter(c=>c.sdnMatch).length: r==='EU Restrictive'?COMPANIES_100.filter(c=>c.euSanctioned).length: r==='UK Sanctions'?COMPANIES_100.filter(c=>c.ukSanctioned).length: COMPANIES_100.filter(c=>c.unSanctioned).length;` |
| `sectors` | `[...new Set(COMPANIES_100.map(c=>c.sector))];` |
| `rows` | `filteredCompanies.map(c=>[c.name,c.country,c.sector,c.sdnMatch?'YES':'NO',c.euSanctioned?'YES':'NO',c.ukSanctioned?'YES':'NO',c.unSanctioned?'YES':'NO',c.exposureScore,c.revenue/1e6,c.complianceStatus,c.secondaryRisk,c.e` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `pagedCompanies` | `filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);` |
| `totalPages` | `Math.ceil(filteredCompanies.length/PAGE_SIZE);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sanctions/status` | `status` | api/v1/routes/sanctions_screening.py |
| POST | `/api/v1/sanctions/screen` | `screen` | api/v1/routes/sanctions_screening.py |
| GET | `/api/v1/sanctions/uflpa-list` | `uflpa_list` | api/v1/routes/sanctions_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `XUAR` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `dhs` *(shared)*, `fastapi` *(shared)*, `pathlib` *(shared)*, `persons` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLIMATE_PROJECTS`, `COLORS`, `COMPANIES_100`, `COMP_NAMES`, `DUAL_USE_TECH`, `REGIMES`, `REGIME_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Flagged Transactions | — | Sanctions engine | Number of climate finance transactions flagged for sanctioned counterparty involvement. |
| Jurisdictional Overlap | — | OFAC/UN lists | Number of recipient countries appearing on active sanctions lists within reporting period. |
| Tainted Flow Ratio | — | Calculated | Share of total climate finance volume routed through sanctioned or restricted channels. |
- **Climate finance transaction register, sanctions list feeds** → Entity matching, network graph traversal, tainted flow calculation → **Compliance flags, escalation reports, audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Tainted Flow Ratio
**Headline formula:** `Σ Climate Finance to Sanctioned Entities ÷ Total Climate Finance × 100`

Proportion of climate finance disbursements with direct or indirect exposure to sanctioned parties.

**Standards:** ['OFAC SDN List', 'UN Sanctions', 'FATF Guidance']
**Reference documents:** OFAC Sanctions List SDN/Consolidated; UN Security Council Consolidated Sanctions List; FATF Guidance on Green Finance and AML 2023; EU Sanctions Map

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).

| Connected module | Shared via |
|---|---|
| `platform-analytics` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-trade-monitor` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-screening-desk` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-watchlist` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `energy-transition-credit-portal` | table:pathlib |
| `module-navigator` | table:pathlib |
| `infra-debt-portfolio-manager` | table:pathlib |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Tainted Flow Ratio = Σ
> Climate Finance to Sanctioned Entities / Total Climate Finance x 100`. **This ratio is not
> computed anywhere in the code.** There is no aggregation of "total climate finance" against
> which a tainted-flow percentage could be expressed. What the code actually computes is (1) a
> per-company `exposureScore` (0-100, seeded PRNG) used for compliance triage, and (2) a real sum
> of blocked-project **redirected finance flows** by destination country. Both are useful compliance
> analytics, but neither is the ratio the guide describes.

### 7.1 What the module computes

```
exposureScore  = floor(sr(seed) x 100)                       // per company, 0-100
redirectedFlows[country] = Sum(valueMn) over CLIMATE_PROJECTS
                            where redirected includes country  // real aggregation
sectorExposure[sector].totalExposure = Sum(exposureScore) over companies in sector
```
16 named blocked/restricted climate-finance projects (`CLIMATE_PROJECTS`, e.g. "Russia Gas
Transition Program" $4.5Bn blocked under OFAC SDN, redirected to Turkey/India) and 100 synthetic
companies (`COMPANIES_100`) with sanctions-list match flags (`sdnMatch`, `euSanctioned`,
`ukSanctioned`, `unSanctioned`) and a seeded `exposureScore`/`revenue`.

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `CLIMATE_PROJECTS` (16 rows) | Named blocked/restricted renewable & adaptation projects with `valueMn`, `regime`, `redirected` destination, `emissions` avoided-lost estimate | Illustrative composite scenarios (plausible categories — gas-to-renewable, solar mega-parks, hydropower, grid modernisation — under real sanction regimes OFAC/EU/UN/UK) rather than actual named, verifiable deals |
| `COMPANIES_100` fields | `exposureScore = floor(sr(seed)x100)`, `revenue = floor(sr(seed2)x500+10)x100` | Synthetic demo |
| `DUAL_USE_TECH` (16 rows) | tech, category, control regime, China/Russia restriction flags, green application flag, price impact | Static reference table, plausible categorisation of dual-use export-control-listed clean technologies (e.g. advanced batteries, certain semiconductors) |
| Sanctions-list match flags | `sdnMatch`, `euSanctioned`, `ukSanctioned`, `unSanctioned` | Boolean flags per company — seeded, not screened against a live sanctions-list feed |

### 7.3 Calculation walkthrough

1. `redirectedFlows` is the module's one genuine aggregation: for every blocked/restricted project
   with a non-"None"/"N/A" `redirected` field, it splits the destination string on `/` (handling
   multi-destination redirects like "Turkey/India") and sums `valueMn` per destination country —
   correctly showing which jurisdictions absorb capital diverted from sanctioned climate projects.
2. `sectorExposure` groups `COMPANIES_100` by sector, summing `exposureScore` and counting
   companies per sanctions regime match — a real aggregation, but over synthetic underlying scores.
3. `radarData` counts, per sanctions regime (OFAC SDN/EU Restrictive/UK/UN), how many of the 100
   companies match that regime's flag — a genuine count over the boolean fields.
4. CSV export and the paginated company table are direct pass-throughs of `COMPANIES_100`, no
   further transformation.

### 7.4 Worked example

`redirectedFlows` for "Turkey": sourced from Russia Gas Transition Program ($4,500M, redirected to
"Turkey/India" — splits evenly attributed in code to both, i.e. Turkey gets credited the full
$4,500M not a 50/50 split since the code sums the **full** `valueMn` per listed destination) plus
Libya Grid Stabilization ($1,100M, redirected to Turkey) = `4,500 + 1,100 = $5,600M` total flow
redirected to Turkey across the 16-project universe — illustrating that sanctions on original
project geographies do not eliminate the underlying capital, they reroute it.

### 7.5 Data provenance & limitations

- `CLIMATE_PROJECTS` are illustrative composite scenarios under real sanction-regime names; a user
  should not treat the 16 rows as verified individual deals.
- `exposureScore`/`revenue` for the 100-company screening universe are synthetic PRNG output, not
  screened against a live OFAC/EU/UN/UK consolidated list — a production version would need a real
  sanctions-list API/feed and fuzzy entity-matching (as the guide's own user-interaction text
  describes: "map transaction flow networks... generate compliance alerts").
- The headline "Tainted Flow Ratio" metric the guide describes does not exist; there is no
  aggregate "total climate finance" denominator computed anywhere on the page.
- `redirectedFlows` double-attributes full project value to every listed redirect destination
  rather than splitting it proportionally, so summing the chart series across countries would
  overstate total redirected capital relative to the sum of blocked project values.

**Framework alignment:** OFAC SDN List, UN Security Council Consolidated Sanctions List, EU
Financial Sanctions Files (named correctly as the boolean match flags' source regimes, not wired
to a live feed) · FATF Guidance on Green Finance and AML 2023 (context only, no AML transaction-
network graph algorithm implemented despite the guide's description) · export-control dual-use
technology lists (Wassenaar Arrangement-style categorisation, reproduced qualitatively in
`DUAL_USE_TECH`).

## 9 · Future Evolution

### 9.1 Evolution A — Compute the tainted-flow ratio over screened flows (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's headline metric — `Tainted Flow Ratio = climate finance to sanctioned entities / total climate finance` — is uncomputable as coded: no total-climate-finance denominator exists, the 100-company screening universe's `exposureScore` is seeded PRNG rather than a screen against any list, and the 16 `CLIMATE_PROJECTS` are illustrative composites under real sanction-regime names. The one real computation (redirected-finance sums by destination) is a useful fragment. Critically, the platform already has genuine screening infrastructure: `sanctions-screening-desk` runs live CSL (25,830-row daily download) plus UFLPA matching. Evolution A composes it rather than rebuilding.

**How.** (1) Climate-finance flow register: user-entered or imported deals (counterparty, amount, instrument, jurisdiction) as the denominator base. (2) Each counterparty screened through the screening desk's existing endpoint (confidence-scored CSL/UFLPA matches), replacing the seeded `exposureScore` with real match results; jurisdiction-level exposure from the regime metadata. (3) The tainted-flow ratio finally computes: flagged-flow value / total register value, with the numerator decomposed by match confidence band — a ratio built on fuzzy matches must carry its confidence structure, not present a false binary. (4) The redirected-flows analytic stays, now sourced from register rows with dates.

**Prerequisites.** Screening-desk endpoint stability; flow-register schema; the illustrative projects demoted to labelled fixtures. **Acceptance:** the ratio reproduces from register rows and screening responses; a counterparty added to the CSL (test fixture) moves the ratio on next screen; every flagged flow links to its match record with confidence score.

### 9.2 Evolution B — Green-integrity compliance copilot (LLM tier 2)

**What.** The module's users sit at the awkward intersection of sanctions compliance and green-finance integrity. The copilot works that seam: "our Central Asia solar fund has two medium-confidence CSL matches — summarize the match evidence and the escalation options", "draft the integrity annex for this green bond: screening coverage, tainted-flow ratio, unresolved matches" — composition over screening results and register aggregates.

**How.** Tier-2 tool calls to the flow register, screening endpoints, and ratio computation; match-evidence summaries quote the actual matched list entries (CSL source list, program, match score) — the screening desk's own disclaimer ("screening aid, not a compliance determination") propagates verbatim into every copilot answer as a structural guardrail. Escalation options are constrained to a documented playbook vocabulary; the copilot never clears or blocks a counterparty — it organizes evidence for the compliance officer's decision. Annex drafts render via report studio with the confidence-band decomposition included.

**Prerequisites (hard).** Evolution A's real screening integration — narrating seeded exposure scores as sanctions risk would be a legal hazard, not just an accuracy bug; playbook vocabulary agreed with compliance. **Acceptance:** every match claim traces to a screening response; the disclaimer appears in all outputs; no answer renders a clear/block determination.