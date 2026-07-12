# Natural Capital Accounting
**Module ID:** `nature-capital-accounting` · **Route:** `/nature-capital-accounting` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
TEEB-aligned ecosystem service valuation for portfolio companies. Covers provisioning, regulating, cultural, and supporting services with monetary impact pathway analysis.

> **Business value:** Companies currently externalise natural capital costs — forests degraded, water consumed, species lost. Mandatory TNFD disclosures and CSRD biodiversity requirements will force internalisation. Natural capital accounting provides the methodology to quantify and disclose these previously hidden impacts.

**How an analyst works this module:**
- Impact Pathway Analysis maps activities to ecosystem service impacts
- Ecosystem Service Valuation shows $/ha/yr by service type
- Portfolio P&L with Nature shows natural capital adjusted earnings
- Sector Comparison benchmarks natural capital dependency
- SEEA Alignment maps to System of Environmental-Economic Accounting

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `ECOSYSTEMS`, `ECO_SERVICES`, `LEAP_STEPS`, `Stat`, `TABS`, `TNFD_PILLARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `accounts` | `Array.from({length:40},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);` |
| `eco` | `ECOSYSTEMS[Math.floor(s*ECOSYSTEMS.length)];` |
| `_BIO_MAP_NCA` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `portfolioCompanies` | `Array.from({length:30},(_,i)=>{const s=sr(i*53);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=='object');const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv]` |
| `filtered` | `useMemo(()=>{let d=[...accounts];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())\|\|r.country.toLowerCase().includes(search.toLowerCase()));if(filterEco!=='All')d=d.filter(r=>r.ecosystem===filterEco);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,filter` |
| `filteredComps` | `useMemo(()=>{let d=[...portfolioCompanies];if(compSearch)d=d.filter(r=>r.company.toLowerCase().includes(compSearch.toLowerCase()));d.sort((a,b)=>compSortDir==='asc'?(a[compSort]>b[compSort]?1:-1):(a[compSort]<b[compSort]?1:-1));return d;},[compSearch,compSort,compSortDir]);  const totalArea=accounts.reduce((s,a)=>s+a.areaHa,0);` |
| `totalAssets` | `accounts.reduce((s,a)=>s+a.totalAssetValueMn,0);` |
| `avgCondition` | `Math.round(accounts.reduce((s,a)=>s+a.conditionIndex,0)/40);` |
| `totalCarbon` | `accounts.reduce((s,a)=>s+a.carbonStockTc,0);` |
| `ecoAgg` | `useMemo(()=>ECOSYSTEMS.map(e=>{const as=accounts.filter(a=>a.ecosystem===e);return {ecosystem:e,count:as.length,area:as.reduce((s,a)=>s+a.areaHa,0),value:as.reduce((s,a)=>s+a.totalAssetValueMn,0)};}).filter(e=>e.count>0)` |
| `serviceAgg` | `useMemo(()=>ECO_SERVICES.map(svc=>{let total=0;accounts.forEach(a=>{const sv=a.serviceValues.find(s=>s.service===svc);if(sv)total+=sv.annualMn;});return {service:svc,totalMn:+total.toFixed(1)};}),[]);` |
| `tnfdScores` | `useMemo(()=>TNFD_PILLARS.map((p,i)=>({pillar:p,avgScore:Math.round(accounts.reduce((s,a)=>s+(40+sr(a.id*97+i)*50),0)/40),readyPct:Math.round(accounts.filter(a=>a.tnfdReady==='High').length/40*100)})),[]);` |
| `trendData` | `useMemo(()=>Array.from({length:8},(_,i)=>({year:2018+i,totalValue:Math.round(totalAssets*(0.7+i*0.043)),carbonStock:Math.round(totalCarbon*(0.85+i*0.02)),condition:Math.round(avgCondition*(0.82+i*0.025))})),[totalAssets,` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-capital-accounting/seea-accounts` | `seea_accounts` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/ncp-assess` | `ncp_assess` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/tev` | `tev` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/tnfd-leap` | `tnfd_leap` | api/v1/routes/nature_capital_accounting.py |
| POST | `/api/v1/nature-capital-accounting/sbtn-readiness` | `sbtn_readiness` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/seea-ecosystem-types` | `ref_seea_ecosystem_types` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/encore-dependencies` | `ref_encore_dependencies` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/valuation-benchmarks` | `ref_valuation_benchmarks` | api/v1/routes/nature_capital_accounting.py |
| GET | `/api/v1/nature-capital-accounting/ref/tnfd-leap-framework` | `ref_tnfd_leap_framework` | api/v1/routes/nature_capital_accounting.py |

### 2.3 Engine `nature_capital_accounting_engine` (services/nature_capital_accounting_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureCapitalAccountingEngine.conduct_seea_accounting` | entity_data, land_area_ha, ecosystem_types, condition_observations | Produce SEEA Ecosystem Accounts for an entity. ecosystem_types: {eco_type: fraction_of_total_area} — must sum to ~1.0 condition_observations (optional): {eco_type: {indicator_code: score 0-1}} Caller-supplied measured/monitored SEEA condition indicator scores. When provided, the condition index is computed deterministically from these real observations. When absent, the ecosystem-type baseline con |
| `NatureCapitalAccountingEngine.apply_natural_capital_protocol` | entity_data, scope, assessment_type, impact_score, dependency_trend, business_case_score, social_value_usd_per_ha | NCP 2016 — 4-step assessment. Returns business value (revenue at risk / dependency), social value, material issues. Optional caller-supplied inputs (default None → honest null when unknown): impact_score: measured/assessed impact intensity on nature (0-1). dependency_trend: observed state trend, e.g. 'declining' / 'stable' / 'improving'. business_case_score: NCP business-case maturity score (0-100 |
| `NatureCapitalAccountingEngine.calculate_tev` | ecosystem_type, land_area_ha, country_iso, option_rate, existence_rate, bequest_rate | TEV decomposition: direct use + indirect use + option + existence + bequest. Returns value breakdown, method mix, uncertainty range. option_rate / existence_rate / bequest_rate (optional): caller-supplied non-use-value ratios (fraction of use value). When omitted, documented TEV MODEL calibration midpoints of the published TEEB ranges are applied (option 27.5% of 20-35%, existence 17.5% of 10-25%, |
| `NatureCapitalAccountingEngine.score_tnfd_leap` | locate_data, evaluate_data, assess_data, prepare_data | TNFD LEAP scoring: 4 steps × 25 points each = 0-100 total. Inputs are dictionaries with boolean/numeric flags for each criterion. |
| `NatureCapitalAccountingEngine.assess_sbtn_readiness` | entity_data, target_types | SBTN 5-step readiness assessment. entity_data should contain per-step flags: step_1_complete, step_2_complete, etc. target_types: list of ["freshwater", "land", "ocean"] |
| `NatureCapitalAccountingEngine.ref_seea_ecosystem_types` |  |  |
| `NatureCapitalAccountingEngine.ref_encore_dependencies` |  |  |
| `NatureCapitalAccountingEngine.ref_valuation_benchmarks` |  |  |
| `NatureCapitalAccountingEngine.ref_tnfd_leap_framework` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `direct`, `fastapi` *(shared)*, `peer` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `ECOSYSTEMS`, `ECO_SERVICES`, `LEAP_STEPS`, `TABS`, `TNFD_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ecosystem Services | — | TEEB/CICES | Provisioning, regulating, cultural, supporting |
| Typical Shadow Price | — | TEEB | Wide range by ecosystem type and service |
| Impact Pathways | — | Natural Capital Protocol | GHG, air, water use, waste, land use, water pollution |
- **Operational activities** → Ecosystem service dependency mapping → **Impact pathway identification**
- **TEEB shadow prices** → Ecosystem service monetisation → **Natural capital cost/benefit**
- **Natural capital P&L** → Enterprise value adjustment → **True cost accounting**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-capital-accounting/ref/encore-dependencies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/seea-ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/tnfd-leap-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**GET /api/v1/nature-capital-accounting/ref/valuation-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'reference'], 'n_keys': 2}`

**POST /api/v1/nature-capital-accounting/ncp-assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'ncp_assessment'], 'n_keys': 2}`

**POST /api/v1/nature-capital-accounting/sbtn-readiness** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-capital-accounting/seea-accounts** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-capital-accounting/tev** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** TEEB ecosystem service monetisation
**Headline formula:** `NaturalCapitalValue = Σ(service_area × value_per_ha); Impact = Dependency × ChangeInService`

Six impact pathways: GHG emissions, air pollutants, water use, waste, land use, water pollutants. Each mapped to ecosystem service degradation and monetised using TEEB shadow prices ($/ha/yr by service and biome).

**Standards:** ['TEEB', 'SEEA', 'TNFD', 'Natural Capital Coalition']
**Reference documents:** TEEB for Business (2012); Natural Capital Protocol; SEEA Ecosystem Accounts; TNFD V1.0; Trucost Natural Capital Methodology

**Engine `nature_capital_accounting_engine` — extracted transformation lines:**
```python
normalised = {k: v / total_frac for k, v in ecosystem_types.items()}
area = round(land_area_ha * frac, 2)
area = land_area_ha * frac
physical_flow = round(area * ci, 1)
monetary_flow = round(area * mid_rate * ci, 0)
annuity_factor = (1 - (1 + discount_rate) ** -time_horizon_yr) / discount_rate
total_asset_value_usd = round(total_monetary_value_usd * annuity_factor, 0)
weighted_dep = sum(dependency_scores.values()) / max(len(dependency_scores), 1)
revenue_at_risk_pct = weighted_dep * 0.25
revenue_at_risk_usd = round(revenue_usd * revenue_at_risk_pct, 0)
dependency_value_usd = round(revenue_usd * weighted_dep * 0.15, 0)
val = land_area_ha * mid * country_mult
val = land_area_ha * mid * country_mult
option_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * option_rate_used
existence_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * existence_rate_used
bequest_value_usd_yr = (direct_use_usd_yr + indirect_use_usd_yr) * bequest_rate_used
annuity_factor = (1 - 1.04 ** -30) / 0.04
tev_capitalised = total_usd_yr * annuity_factor
uncertainty_low = total_usd_yr * 0.60
uncertainty_high = total_usd_yr * 1.80
pts = min(crit_max, int(completed * crit_max))
total_pct = round(grand_total / 100 * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `company-profiles` | table:peer |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **TEEB ecosystem-service
> monetisation** formula (`NaturalCapitalValue = Σ(service_area × value_per_ha)`, six impact
> pathways mapped to shadow prices) and cites a backend engine
> (`backend/services/nature_capital_accounting_engine.py`) and API routes (`/api/v1/nature-capital-accounting/*`
> — SEEA accounts, TEV, TNFD-LEAP, SBTN readiness). **The page never calls that API** — no
> `fetch`/`axios` reference exists in `NatureCapitalAccountingPage.jsx`. What renders is a
> **40-account synthetic natural-capital balance sheet and a 30-company nature-dependency
> screen**, both generated by the platform's seeded PRNG, with country-level fields overwritten by
> one genuinely real dataset (`BIODIVERSITY_COUNTRY_DATA`). The sections below document the code
> as it actually runs.

### 7.1 What the module computes

Two independently generated entity universes drive the four tabs (Natural Capital Balance Sheet,
Ecosystem Service Valuation, TNFD Alignment, Portfolio Nature Dependency):

- **`accounts`** — 40 named natural-capital sites (Amazon Basin Plot, Borneo Peatland, Great
  Barrier Reef, …), one per array index, seeded via `sr(i×7)`, `sr(i×13)`, `sr(i×19)` etc. Each
  carries `areaHa`, `conditionIndex`, `carbonStockTc`, `totalAssetValueMn`,
  `totalLiabilityMn`, `annualDepreciationPct`, `restorationCostMn`, and a 10-entry
  `serviceValues[]` array (one $M/yr figure per `ECO_SERVICES` category, `sr(i×47+j)`).
- **`portfolioCompanies`** — 30 named real-world companies (Nestlé, Unilever, BASF, JBS, Rio
  Tinto, …) with `natureDependency`, `natureImpact`, `waterDep`, `pollinationDep`, `soilDep`
  (all `sr()`-seeded 0–100 scores) and categorical `biodiversityRisk` / `tnfdDisclosure` /
  `sbtnCommitted` flags.

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| `areaHa` | `500 + s×9500` | Synthetic PRNG, no source |
| `conditionIndex`, `biodiversityIntactness`, `soilHealth`, `habitatIntegrity` | `sr()`-seeded 0–100 **then overwritten for any matched country** | See below |
| `totalAssetValueMn` | `10 + s×490` | Synthetic |
| `annualDepreciationPct` | `0.5 + s3×4` | Synthetic |
| `serviceValues[service]` | `0.5 + sr(i×47+j)×15` $M/yr | Synthetic |
| `tnfdReady` | `sr(i×31)<0.3→High, <0.65→Medium, else Low` | Synthetic |

**One real data anchor:** `BIODIVERSITY_COUNTRY_DATA`
(`frontend/src/data/biodiversityData.js`) is a genuine country-level dataset sourced from IUCN Red
List 2023, WDPA Protected Planet 2023, the Biodiversity Intactness Index (Natural History Museum
London / PREDICTS) and Mean Species Abundance (PBL Netherlands), each row citing its data year.
After the 40 synthetic accounts are generated, a post-processing loop overwrites
`biodiversityIntactness ← BII×100`, `soilHealth ← MSA×100`, `conditionIndex ← BII×100`, and
`habitatIntegrity ← KBA-coverage%` for any account whose `country` field matches a row in that
table — i.e. **roughly a third of the fields are real, but only for accounts sited in a country the
dataset covers; area, asset value, liabilities, carbon stock, and all service values remain fully
synthetic regardless.**

### 7.3 Calculation walkthrough

1. **Balance-sheet tab** — `filtered` applies search/ecosystem filters and a client-side sort over
   `accounts`; `totalArea`, `totalAssets = Σ totalAssetValueMn`, `avgCondition = Σ conditionIndex/40`,
   `totalCarbon = Σ carbonStockTc` are simple portfolio sums/means (all synthetic inputs).
   `ecoAgg` groups accounts by `ecosystem` for the bar chart; `trendData` **fabricates an 8-year
   history** by multiplying the *current* aggregate by hand-picked growth factors
   (`totalValue = totalAssets×(0.7+i×0.043)`, `carbonStock×(0.85+i×0.02)`,
   `condition×(0.82+i×0.025)`) — this is not a real historical series, just a monotonic ramp
   anchored to today's synthetic total.
2. **Ecosystem Service Valuation tab** — `serviceAgg` sums each of the 10 `ECO_SERVICES` categories
   across all 40 accounts; a pie/bar toggle shows the distribution. Selecting a single account
   swaps to its own 10-service breakdown.
3. **TNFD Alignment tab** — `tnfdScores` computes, for each of the 4 TNFD pillars (Governance,
   Strategy, Risk & Impact Mgmt, Metrics & Targets), `avgScore = Σ(40 + sr(id×97+pillar_i)×50)/40`
   — i.e. a **fresh independent PRNG draw per pillar per account**, not derived from any actual
   governance/strategy/risk data on the account. `readyPct` is the share of accounts flagged
   `tnfdReady==='High'` (itself a separate PRNG draw, uncorrelated with the pillar scores).
4. **Portfolio Nature Dependency tab** — same pattern over `portfolioCompanies`: sector, region and
   dependency scores are independently seeded per company; sorting/filtering only.

### 7.4 Worked example

Account `i=0` ("Amazon Basin Plot", `s=sr(0×7)=sr(0)=sr(1)` → `sin(1)×10000 mod 1`):
`sin(1) ≈ 0.84147`, ×10000 = 8414.7, frac = **0.7096**. So `s≈0.710`.

| Field | Formula | Result |
|---|---|---|
| `areaHa` | 500 + 0.710×9500 | **7,240 ha** |
| `ecosystem` index | `floor(0.710×10)` = 7 → `ECOSYSTEMS[7]` | **"Freshwater"** |
| `totalAssetValueMn` | 10 + 0.710×490 | **$358M** |
| Country (index 0) | hard-coded array | **Brazil** |
| `biodiversityIntactness` (pre-override) | `25 + s3×65` | synthetic value |
| `biodiversityIntactness` (post-override, Brazil matched) | `BII_Brazil × 100 = 0.72×100` | **72%** (real BII) |
| `conditionIndex` (post-override) | same BII | **72** |

This shows concretely how the real/synthetic blend works: the *ecosystem label* ("Freshwater") is
a random draw yet the *country* is a fixed lookup array, so a "Freshwater" account is tagged
"Brazil" and inherits Brazil's real BII score for its condition/biodiversity fields while its area,
asset value, and all 10 service values remain synthetic.

### 7.5 Companion analytics & data provenance

- **Portfolio Nature Dependency** scores (30 real company names) are 100% synthetic — no ENCORE
  sector-dependency matrix, no CDP or TNFD disclosure data is actually loaded despite the
  `tnfdDisclosure`/`sbtnCommitted` flags implying real status.
- **SEEA compliance flag** (`seeaCompliant = sr(i*37)>0.4`) is a coin-flip, not a real SEEA
  Ecosystem Accounts conformance check.
- Every dollar figure (asset value, liability, restoration cost, service value) uses the platform's
  `sr(seed) = frac(sin(seed+1)×10⁴)` PRNG — stable across renders but has no connection to any
  named ecosystem's actual valuation.
- The real backend engine (`nature_capital_accounting_engine.py`, not reachable from this page)
  reportedly implements SEEA ecosystem-extent/condition/monetary accounts, TEV (Total Economic
  Value), and SBTN Step-1/3 readiness scoring per the guide — none of that logic executes here.

**Framework alignment:** SEEA Ecosystem Accounting (UN) — table structure (asset/liability,
condition index, ecosystem-service flows) mirrors SEEA EA's physical/monetary account layout, but
values are not derived from a real extent-and-condition survey · TNFD LEAP — the 4-pillar
dashboard (Governance/Strategy/Risk & Impact Mgmt/Metrics & Targets) names TNFD's disclosure
pillars but scores them by independent random draw, not by an actual LEAP assessment · BII/MSA
(real, for matched countries only) — Natural History Museum PREDICTS project and PBL Netherlands
GLOBIO model, the standard academic biodiversity-intactness metrics this platform correctly cites.

## 8 · Model Specification — SEEA-Aligned Natural Capital Monetary Account

**Status: specification — not yet implemented in code.** The page displays a $358M-style
"Asset Value" per account and a portfolio "Total Assets" KPI purely from PRNG draws; a bank/asset-
manager-grade natural-capital account needs a defensible monetary valuation chain.

**8.1 Purpose & scope.** Produce a SEEA EA-consistent monetary ecosystem account per site
(asset value, liability/degradation provision, annual service-flow value) usable for balance-sheet
disclosure (CSRD ESRS E4, TNFD Metrics & Targets) and portfolio nature-risk aggregation. Scope:
terrestrial and coastal ecosystem assets held or financed by the reporting entity.

**8.2 Conceptual approach.** Use the UN **SEEA Ecosystem Accounting** exchange-value method:
monetary asset value = NPV of the site's projected ecosystem-service flows, each service valued at
a resource-rent or replacement-cost shadow price (TEEB / Natural Capital Protocol) rather than an
arbitrary $/ha draw. This mirrors two industry benchmarks: (1) **Trucost/S&P Natural Capital
Valuation**, which monetises environmental externalities via country- and sector-specific shadow
prices; and (2) the **World Bank/UNEP-WCMC "Changing Wealth of Nations"** methodology, which
values renewable natural capital as the discounted rent stream of the resource.

**8.3 Mathematical specification.**
```
ServiceFlow_i,s(t) = Area_i × Intensity_s(ecosystem_i, condition_i(t)) × ShadowPrice_s(country_i, t)
AssetValue_i        = Σ_{t=1..T} [Σ_s ServiceFlow_i,s(t)] / (1+r)^t         (T = 100yr SEEA horizon)
Condition_i(t)       = Condition_i(0) × (1 − DegradationRate_i)^t            (or restoration path if funded)
Liability_i          = RestorationCost_i × ProbabilityOfRequiredRestoration_i
DepreciationExpense_i(t) = AssetValue_i(t−1) − AssetValue_i(t)
```
| Parameter | Calibration source |
|---|---|
| `Intensity_s` (service yield per ha by ecosystem/condition) | InVEST biophysical models (Natural Capital Project) or IPBES service-flow coefficients |
| `ShadowPrice_s` | TEEB valuation database; country-specific from national SEEA accounts where published |
| `DegradationRate_i` | IPBES Global Assessment regional degradation trajectories, or observed BII trend |
| `r` (discount rate) | Real social discount rate, e.g. UK Green Book 3.5% declining, or entity WACC for corporate use |
| `RestorationCost_i` | Site-specific restoration engineering estimate or regional $/ha benchmark (e.g. SER restoration cost database) |

**8.4 Data requirements.** Site polygon + ecosystem classification (already present as
`ecosystem`/`areaHa`); condition time series (remote-sensing NDVI/BII trend — Natural History
Museum PREDICTS, Global Forest Watch); country-level shadow prices (TEEB, World Bank WAVES);
restoration cost benchmarks (SER, IUCN). The platform already has `BIODIVERSITY_COUNTRY_DATA`
(BII/MSA/KBA) as a real condition input and the `reference_data` tables as a plausible home for
TEEB shadow prices once ingested.

**8.5 Validation & benchmarking plan.** Backtest asset values against published SEEA pilot
accounts (Australia, UK ONS, Netherlands CBS have production SEEA EA statistics) for comparable
ecosystem types; sensitivity-test to discount rate and degradation-rate assumptions (±50% swings
should not flip investment-grade restoration ROI conclusions); reconcile aggregate portfolio value
against Trucost/S&P or MSCI Nature-related sample outputs where accessible.

**8.6 Limitations & model risk.** Service-flow intensity coefficients are themselves uncertain
(InVEST models are calibrated, not measured, at most sites); shadow prices vary 10–100× across
studies for the same service — sensitivity bands must be disclosed, not point estimates; condition
degradation is assumed monotonic absent restoration funding, which understates volatility from
acute events (fire, drought); conservative fallback is to report a value **range** (low/base/high
shadow-price scenarios) rather than a single asset-value figure.

## 9 · Future Evolution

### 9.1 Evolution A — Replace the PRNG balance sheet with engine-computed SEEA accounts (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the page never calls its own API — the 40-site "natural capital balance sheet" and the 30-company nature-dependency screen are `sr()`-seeded synthetics (with one real overlay, `BIODIVERSITY_COUNTRY_DATA`), while a real backend exists at `/api/v1/nature-capital-accounting/*` computing SEEA accounts (`monetary_flow = area × mid_rate × condition_index` per §5's extracted lines), TEV, NCP assessment, TNFD-LEAP, and SBTN readiness, with reference GETs for SEEA ecosystem types, ENCORE dependencies, valuation benchmarks, and the LEAP framework (all `passed`). Evolution A wires the UI to the engine and grounds the company screen in ENCORE.

**How.** (1) Balance-sheet tab posts site definitions (area, ecosystem-type fractions, condition) to `POST /seea-accounts`, rendering the engine's physical and monetary flows; the 40 seeded sites become an optional demo set computed through the same endpoint, eliminating the PRNG path entirely (platform rule: random-as-data is purged). (2) Portfolio tab derives `natureDependency`/`waterDep`/`pollinationDep` from `GET /ref/encore-dependencies` sector mappings applied to each company's GICS sector — replacing seeded 0–100 scores with the materiality ratings ENCORE actually publishes. (3) TNFD tab drives `POST /tnfd-leap` so LEAP phase outputs are engine-assessed, not decorative.

**Prerequisites.** POST endpoints blocked by REQUIRE_AUTH need verification; the ENCORE mapping needs a sector-resolution step for the 30 named companies (GLEIF/OpenFIGI layer). **Acceptance:** no `sr()` call remains in any rendered metric; a site's monetary flow reproduces `area × mid_rate × condition` from the valuation-benchmark reference table.

### 9.2 Evolution B — TNFD-LEAP walkthrough analyst (LLM tier 2)

**What.** A tool-calling analyst that takes a company through the TNFD LEAP process conversationally: "run LEAP for a Brazilian beef processor with 200k ha of pasture" → Locate (ecosystem types via `/ref/seea-ecosystem-types`), Evaluate (dependencies via `/ref/encore-dependencies`), Assess (`POST /tnfd-leap`, `POST /ncp-assess`, TEV via `/tev`), Prepare (drafted disclosure language citing each computed result) — producing the quantitative skeleton of a TNFD report where every figure is an endpoint output.

**How.** Tool schemas from the module's 9 OpenAPI operations; system prompt from this Atlas page plus the TNFD v1.0 and SEEA framework references named in §5 so framework terminology is quoted, not paraphrased. Disclosure drafting is templated to TNFD's four pillars with per-sentence provenance (which tool call grounded it); the `POST /sbtn-readiness` endpoint adds a "what would SBTN targets require next" closing section. Fabrication validator matches all valuation figures to tool outputs; hedged language required where the engine returned `insufficient_data`.

**Prerequisites (hard).** Evolution A first — the copilot must never narrate the current seeded balance sheet; the mismatch between guide-described capability and rendered synthetic data is precisely what an LLM layer would otherwise amplify. **Acceptance:** a drafted LEAP output cites a tool call for every number; asking for a valuation of an ecosystem type absent from the reference tables yields a refusal naming the coverage gap.