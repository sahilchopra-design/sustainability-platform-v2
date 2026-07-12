# Value Chain Dashboard
**Module ID:** `value-chain-dashboard` · **Route:** `/value-chain-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Upstream and downstream ESG performance mapping dashboard providing a unified view of value chain sustainability KPIs from raw material extraction through end-of-life product management.

> **Business value:** Scope 3 emissions average 11.4× Scope 1+2 for S&P 500 companies (CDP 2023); value chain ESG management is the largest lever for corporate climate impact and supply chain due diligence compliance.

**How an analyst works this module:**
- Map value chain tiers and identify material Scope 3 categories
- Collect primary and secondary ESG data across upstream suppliers and downstream customers
- Score each value chain node on E, S and G dimensions
- Weight scores by emissions magnitude to compute VCEI
- Report value chain performance in CSRD ESRS E1 and S1–S4 disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COLORS`, `DATA`, `INDUSTRIES`, `PAGE_SIZE`, `REGIONS`, `RISK_LEVELS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Raw Materials','Components','Manufacturing','Logistics','Distribution','End-of-Life'];` |
| `tier` | `TIERS[Math.floor(s(17)*TIERS.length)];` |
| `category` | `CATEGORIES[Math.floor(s(23)*CATEGORIES.length)];` |
| `region` | `REGIONS[Math.floor(s(29)*REGIONS.length)];` |
| `risk` | `RISK_LEVELS[Math.floor(s(31)*RISK_LEVELS.length)];` |
| `industry` | `INDUSTRIES[Math.floor(s(37)*INDUSTRIES.length)];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgEsg:0,avgCarbon:0,avgCompliance:0,highRisk:0,avgReliability:0}; return{count:d.length,avgEsg:d.reduce((a,r)=>a+r.esgScore,0)/d.length,avgCarbon:d.reduce((a,r)=>a+r.carbonEmissions,0)/d.length,avgCompliance:d.reduce((a,r)=>a+r.complianceRate,0)/d.length,highRisk:d.filter(r=>r.ris` |
| `tierDist` | `useMemo(()=>TIERS.map(t=>({name:t,value:filtered.filter(r=>r.tier===t).length})),[filtered]);` |
| `catDist` | `useMemo(()=>CATEGORIES.map(c=>({name:c.length>12?c.slice(0,12)+'..':c,value:filtered.filter(r=>r.category===c).length})),[filtered]);` |
| `regionDist` | `useMemo(()=>REGIONS.map(r=>({name:r.length>12?r.slice(0,12)+'..':r,value:filtered.filter(d=>d.region===r).length})),[filtered]);` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/filtered.length;` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,esg:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COLORS`, `INDUSTRIES`, `REGIONS`, `RISK_LEVELS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Value Chain ESG Index | — | VCEI Engine | Composite ESG score across all 15 Scope 3 categories weighted by emissions magnitude. |
| Scope 3 Coverage | — | Emissions Inventory | Proportion of estimated Scope 3 emissions with primary or secondary data; CSRD requires primary for material categories. |
| Highest-Impact Category | — | S3 Inventory | Scope 3 category with largest absolute emissions; primary focus for downstream product design interventions. |
- **Supplier ESG Data, Customer Product Data, Scope 3 Inventory, Tier Mapping** → VCEI engine + Scope 3 category weighting + ESG aggregation → **Value chain dashboard, CSRD ESRS E1/S2 disclosures, Scope 3 hotspot map**

## 5 · Intermediate Transformation Logic
**Methodology:** Value Chain ESG Index
**Headline formula:** `VCEI = Σ (Tier ESG Score × Emissions Weightᴵᵉʳ) / Σ Weight`

Scope 3 emissions-weighted aggregation of ESG scores across all upstream and downstream value chain tiers; aligns with ESRS E1-6 Scope 3 categories.

**Standards:** ['GHG Protocol Value Chain Standard', 'ESRS E1-6 Scope 3']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Standard; ESRS E1-6 Scope 3 GHG Emissions; ESRS S2 Workers in the Value Chain; ISO 14064-1 GHG Inventories

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry names a "Value Chain ESG Index" formula
> (`VCEI = Σ(Tier ESG Score × Emissions Weight) / Σ Weight`) with a headline value of 58/100 and cites
> "15 Scope 3 categories." **None of this is computed in code.** There is no `VCEI` variable, no
> emissions-weighted aggregation, and no Scope 3 category breakdown anywhere in the component. The
> code implements a generic 50-supplier ESG/risk directory with tier/category/region filters and
> descriptive charts — the sections below document that as-built behaviour.

### 7.1 What the module computes

`genSuppliers(50)` builds 50 synthetic suppliers, each independently seeded (`s(idx)=sr(i·idx+idx)`)
across `tier` (4), `category` (6: Raw Materials → End-of-Life), `region` (6), `risk` (4-level), and
`industry` (8). Per supplier: `esgScore`, `envScore`, `socScore`, `govScore` (all 0–100 ranges),
`carbonEmissions` (100–5,000 tCO2e), `waterUsage`, `wasteGen`, `laborScore`, `safetyScore`,
`humanRightsRisk`, `complianceRate`, `auditScore`, `certifications` (0–7 count), `leadTime` (days),
`reliability` (%), `costIndex`, `disruptions` (count), `alternativeSuppliers`, quarterly ESG trend
(`q1`–`q4`), `scope3Contrib` (0–15%), `deforestationRisk`.

Aggregate KPIs over the filtered set: `avgEsg`, `avgCarbon`, `avgCompliance`, `highRisk` (count of
High/Critical risk), `avgReliability` — all simple arithmetic means/counts, no weighting.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `esgScore` | 20–95 | `20 + s(41)·75`, synthetic uniform |
| `envScore`/`socScore` | 15–95 | `15 + s(43,47)·80` |
| `govScore` | 20–95 | `20 + s(53)·75` |
| `carbonEmissions` | 100–5,000 tCO2e | `100 + s(59)·4900` |
| `complianceRate` | 50–98% | `50 + s(83)·48` |
| `scope3Contrib` | 0–15% | `s(149)·15`, one decimal |
| `deforestationRisk` | 0–85% | `s(151)·85` |

Every field is an independent uniform draw seeded by supplier index `i` and a distinct multiplier —
there is no correlation structure (e.g. a "High" risk supplier is not systematically lower-ESG).

### 7.3 Calculation walkthrough

1. Filters (search text, `tier`, `category`, `risk`) reduce `DATA` (50 rows) to `filtered`, sorted by
   `sortCol`/`sortDir` and paginated at 12/page.
2. `kpis` reduces `filtered` to unweighted means/counts (Supplier ESG Dashboard tab).
3. `tierDist`/`catDist`/`regionDist`/`riskDist` each count `filtered` rows into their category buckets
   for pie/bar charts.
4. `radarData` averages 6 score fields (`envScore`, `socScore`, `govScore`, `laborScore`,
   `safetyScore`, `complianceRate`) across `filtered` for the ESG radar.
5. `trendData` averages `q1`–`q4` across `filtered` per quarter for the ESG trend line — this is the
   closest the module comes to a time series, and it is still a flat quarterly mean, not weighted by
   emissions or spend as the guide's VCEI formula would require.

### 7.4 Worked example

If `filtered` contains 3 suppliers with `esgScore = [40, 60, 80]` and `carbonEmissions =
[500, 3000, 4800]`, the displayed "Avg ESG" KPI is the **unweighted** mean: `(40+60+80)/3 = 60.0`.
Under the guide's VCEI formula (emissions-weighted), the same three suppliers would give
`(40·500 + 60·3000 + 80·4800) / (500+3000+4800) = (20,000+180,000+384,000)/8,300 ≈ 71.9` — a
materially different (12-point higher) result, because the code's simple average under-weights the
high-emissions, high-ESG supplier that the VCEI formula would emphasise.

### 7.5 Data provenance & limitations

- **All 50 suppliers are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`; no real supplier
  master data, spend data, or Scope 3 inventory underlies any row.
- **No Scope 3 category structure** (the guide claims 15 categories with a named "highest-impact"
  category, Cat 11 Use of Sold Products) — `scope3Contrib` is a flat 0–15% random field per supplier
  with no category attribution at all.
- **No emissions-weighted index** — every portfolio statistic is an unweighted arithmetic mean, so a
  single high-carbon, low-ESG outlier supplier is diluted equally with a low-carbon, high-ESG one,
  regardless of how much emissions or spend it represents.
- `certifications` and `alternativeSuppliers` are decorative counts not tied to any named certification
  scheme (e.g. no SBTi/EcoVadis/ISO 14001 labelling).

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard and ESRS E1-6 (both
named in the guide) are **not implemented** — the module has no Scope 3 category taxonomy at all,
so it cannot currently produce an ESRS E1-6-aligned disclosure. See §8 for the production design.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production Value Chain ESG Index gives sustainability/procurement teams an emissions-weighted,
audit-defensible composite score across upstream/downstream value-chain tiers, suitable for CSRD
ESRS E1-6 Scope 3 disclosure and supplier engagement prioritisation. Scope: all Tier 1–4 suppliers
and downstream product-use categories mapped to the 15 GHG Protocol Scope 3 categories.

### 8.2 Conceptual approach
Mirror the **GHG Protocol Scope 3 category-weighted aggregation** used by CDP Supply Chain and S&P
Global Trucost's supply-chain emissions modules: compute each Scope 3 category's absolute emissions
(via spend-based or activity-based method per category), then weight each supplier/tier's ESG score
by its share of total value-chain emissions — analogous to how MSCI's Weighted Average Carbon
Intensity weights portfolio holdings by emissions rather than headcount.

### 8.3 Mathematical specification

```
E_supplier,cat = ActivityData_supplier,cat × EmissionFactor_cat            // per Scope 3 category (1-15)
E_total        = Σ_supplier Σ_cat E_supplier,cat
w_supplier      = Σ_cat E_supplier,cat / E_total
VCEI            = Σ_supplier (ESGScore_supplier × w_supplier)
CategoryHotspot = argmax_cat( Σ_supplier E_supplier,cat )
DataQualityScore = Σ_supplier w_supplier × DQ_tier(supplier)                // PCAF-style 1(best)-5(worst) scale
```

| Parameter | Calibration source |
|---|---|
| `EmissionFactor_cat` | EPA/DEFRA spend-based emission factors by category and industry; supplier-specific EFs where available (primary data) |
| `DQ_tier` scale | PCAF Global GHG Accounting Standard data-quality hierarchy (1=verified primary, 5=spend-based proxy) |
| ESRS E1-6 category mapping | EFRAG ESRS E1 Application Requirements (15 Scope 3 categories) |

### 8.4 Data requirements
Supplier-level spend or activity data (tonnage, kWh, $ spend by category), category-level emission
factors (EPA/DEFRA public tables, or supplier primary data where disclosed), and a supplier-to-Scope-3-
category crosswalk. The platform's existing `reference_data` layer (already ingesting DEFRA/EPA-style
factors for other modules) is the natural home for `EmissionFactor_cat`; the `DATA` supplier array
would need a real spend/activity field added per category.

### 8.5 Validation & benchmarking plan
Reconcile total `E_total` against the company's CDP Climate Change Scope 3 disclosure for the same
reporting year; cross-check category hotspot ranking against CDP Supply Chain benchmark data (Cat 1
Purchased Goods & Services and Cat 11 Use of Sold Products are typically largest for most sectors);
sensitivity-test VCEI stability when swapping spend-based for activity-based EFs on the top-5
emitting suppliers (data-quality upgrade should not swing VCEI by more than a few points if scores
are well-distributed).

### 8.6 Limitations & model risk
Spend-based emission factors carry high uncertainty (±50-100%) and can misrank suppliers purely on
price rather than actual carbon efficiency — flag any supplier whose ranking is driven by DQ tier
4-5 data and prioritise primary-data collection there first. Weighting by emissions can also
de-prioritise governance/social risks that don't correlate with carbon (e.g. forced labour risk in a
low-emissions but high-risk textile supplier) — VCEI should be reported alongside, not instead of,
unweighted risk-tier counts.

## 9 · Future Evolution

### 9.1 Evolution A — Emissions-weighted VCEI with a real Scope 3 category taxonomy (analytics ladder: rung 1 → 2)

**What.** Implement the module's own advertised methodology. §7's mismatch flag shows
there is no `VCEI` in code — every portfolio statistic is an unweighted mean over 50
synthetic suppliers, and §7.4's worked example quantifies the consequence (unweighted
60.0 vs emissions-weighted 71.9 on the same three suppliers). There is also no Scope 3
category structure: `scope3Contrib` is a flat 0–15% random field with no attribution
to the 15 GHG Protocol categories the guide claims. Evolution A builds the §8 spec's
first slice: a supplier-to-category crosswalk, per-category emissions via spend-based
factors from the platform's refdata emission-factor layer (§8.4 notes DEFRA/EPA-style
factors are already ingested for other modules), then
`VCEI = Σ(ESGScore × w_supplier)` with `w` = emissions share, plus the
`CategoryHotspot` and PCAF-style `DataQualityScore` outputs.

**How.** Backend route `POST /api/v1/value-chain/vcei` (module is Tier B, no backend
today) taking a supplier list with spend/activity fields; frontend gains a category
column and a hotspot bar; the KPI row shows VCEI beside — not instead of — unweighted
risk-tier counts, per §8.6's caution that emissions weighting can bury social risks.

**Prerequisites.** Supplier records need a spend or activity field (doesn't exist in
the current seed schema); the §7 mismatch flag retires only when the page renders
engine output. **Acceptance:** the §7.4 three-supplier example reproduces 71.9 through
the endpoint; a Cat-11-heavy portfolio reports Cat 11 as hotspot; DQ score worsens
when primary-data suppliers are swapped for spend-based proxies.

### 9.2 Evolution B — Supplier-engagement prioritiser and ESRS E1-6 drafter (LLM tier 2)

**What.** The dashboard's purpose is deciding which suppliers to engage and disclosing
value-chain performance under CSRD. Evolution B adds a tool-calling assistant:
"which ten suppliers should we prioritise for primary-data collection this quarter?"
is answered by calling `POST /vcei`, ranking suppliers by `w_supplier × DQ_tier`
(biggest emissions share on the worst data), and "draft our ESRS E1-6 Scope 3
narrative" produces disclosure text where every tonnage, coverage %, and hotspot
category is interpolated from tool output — including the honest data-quality
statement ESRS requires (share of primary vs estimated data), which the DQ score makes
computable.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; grounding
corpus is this Atlas page plus §8's methodology (the crosswalk and PCAF DQ hierarchy
give the copilot correct vocabulary). The no-fabrication validator checks every
numeric against tool outputs; the "show work" expander lists which emission factors
and DQ tiers drove the ranking.

**Prerequisites (hard).** Evolution A — today there are no endpoints and no category
data to narrate; until real supplier data replaces the 50 synthetic rows, all outputs
carry a demo-data banner the copilot must echo. **Acceptance:** the engagement
shortlist matches an independent sort of the engine payload; drafted E1-6 text
contains no category or tonnage absent from tool output; asked for a supplier's
verified emissions, the copilot reports the DQ tier rather than asserting precision.