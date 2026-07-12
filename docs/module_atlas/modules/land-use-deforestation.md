# Land Use & Deforestation
**Module ID:** `land-use-deforestation` · **Route:** `/land-use-deforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Satellite-based deforestation monitoring and commodity-linked deforestation risk analysis, supporting compliance with the EU Deforestation Regulation (EUDR) and financial sector due diligence under TNFD and financial institution frameworks. Tracks forest cover loss by commodity supply chain, country, and operator using Global Forest Watch and Copernicus data. Assesses portfolio exposure to deforestation-linked commodities at counterparty level.

> **Business value:** Enables financial institutions and commodity traders to fulfil EUDR due diligence obligations and TNFD nature disclosure requirements by providing satellite-backed, counterparty-level deforestation risk assessment with audit trail.

**How an analyst works this module:**
- Upload operator or counterparty list with commodity type, sourcing country, and coordinates of production facilities
- Review satellite deforestation alerts overlaid on supply-shed polygons for the past 12 months
- Assess EUDR compliance status per operator: high-risk, standard, or low-risk country classification
- Score counterparties on the Deforestation Risk Score and prioritise for enhanced due diligence
- Generate EUDR due diligence statement data package and export for operator registry submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COMMODITIES`, `COUNTRIES`, `KPI`, `PAGE_SIZE`, `REGIONS`, `RISK`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMMODITIES` | 10 | `name`, `deforest`, `volume`, `traceability`, `eudrScope` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#15803d';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `_FAO_MAP_LUD` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,alerts:Math.round(5000+sr(i*7)*15000),deforest:Math.round(100+sr(i*11)*400),fires:Math.round(2000+sr(i*13)*8000)}));` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.country.toLowerCase().includes(search.toLowerCase()));if(regF!=='All')d=d.filter(r=>r.region===regF);if(riskF!=='All')d=d.filter(r=>r.riskRating===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regF,riskF,sortCol` |
| `kpis` | `useMemo(()=>{const totalDeforest=COUNTRIES.reduce((s,c)=>s+c.deforestationKha,0);const totalAlerts=COUNTRIES.reduce((s,c)=>s+c.alertsMonth,0);const avgTrace=Math.round(COUNTRIES.reduce((s,c)=>s+c.traceability,0)/COUNTRIE` |
| `regionChart` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,deforest:0,n:0};m[c.region].deforest+=c.deforestationKha;m[c.region].n++;});return Object.values(m).sort((a,b)=>b.deforest-a.defo` |
| `riskDist` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.riskRating]=(m[c.riskRating]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));},[]);` |
| `radarData` | `useMemo(()=>{const dims=['eudrRisk','traceability','governance','enforcement','protectedArea','commodityExposure'];const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);return dims.map(d=>({dim:d.` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `REGIONS`, `RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Cover Loss (ha/yr) | — | Hansen/GFW annual tree cover loss alerts | Annual deforested area within commodity supply-shed of the assessed operator |
| Commodity Deforestation Linkage (%) | — | Trase / Global Forest Watch Pro | Share of forest loss attributable to the specific commodity in the supply-shed |
| EUDR High-Risk Flag | — | EU EUDR country benchmarking | Country classification under EUDR Article 29 benchmarking system |
| Zero-Deforestation Commitment Coverage (%) | — | Supply Change / Forest 500 | Proportion of traded volume covered by credible zero-deforestation commitments |
- **Hansen / GFW tree cover loss rasters (annual)** → Clip to commodity supply-shed polygons; compute ha lost per operator per year → **Annual deforestation alert area by operator and commodity**
- **EUDR country benchmarking list** → Match sourcing countries to high/standard/low classification; flag high-risk operators → **EUDR compliance status and enhanced due diligence trigger list**
- **Trase commodity flow data** → Link operator production volumes to forest loss area via supply-shed attribution → **Commodity-level deforestation linkage proportion per operator**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRSᵢ = ForestLossᵢ × CommodityLinkᵢ × JurisdictionRiskᵢ`

Forest loss area (ha/yr) from Hansen/GFW analysis is linked to commodity production areas via supply-shed mapping. Jurisdiction risk reflects FAO Forest Area percentage, governance index, and zero-deforestation commitment status. The composite DRS enables counterparty ranking and EUDR high-risk country flagging.

**Standards:** ['EU Deforestation Regulation (EUDR) 2023/1115', 'GFW Pro Deforestation Risk Methodology', 'TNFD LEAP Approach 2023', 'Trase Supply Chain Transparency Platform']
**Reference documents:** EU Deforestation Regulation No. 2023/1115 â€” Official Journal; Hansen et al. High-Resolution Global Maps of 21st-Century Forest Cover Change â€” Science 2013; GFW Pro Deforestation Risk Monitoring Methodology; TNFD LEAP Approach v1.1 2023; Trase Supply Chain Transparency Platform Documentation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula `DRSᵢ = ForestLossᵢ × CommodityLinkᵢ ×
> JurisdictionRiskᵢ` — a multiplicative Deforestation Risk Score — **is never computed in code**.
> There is no `DRS` field or calculation anywhere in the page; `eudrRisk` is an independent seeded
> value, not a product of forest-loss, commodity-link, and jurisdiction-risk terms. The guide also
> describes satellite Hansen/GFW alert ingestion and Trase supply-shed attribution — the page has no
> such data pipeline; alerts are synthetic. Sections below document the code as it actually behaves.

### 7.1 What the module computes

30 countries across 8 regions each carry 19 synthetic attributes generated once via `sr(i×k) =
frac(sin(i×k+1)×10⁴)`, keyed to array index `i`. **Four of those 19 fields are then overwritten with
real FAO Forest Resources Assessment (FRA) 2020 data** where a country match exists in
`FAO_FOREST_AREA_2020`:

```js
r.forestCover        = f.forest_cover_pct ?? r.forestCover
r.deforestationKha    = |f.annual_change_rate_pct| × f.forest_area_mha × 10000   // when both present
r.primaryForestLoss    = f.primary_forest_mha / f.forest_area_mha × 100          // when forest_area_mha>0
r.protectedArea        = f.forest_certification_pct ?? r.protectedArea
```

The remaining 15 fields (alerts/month, tree gain, fire alerts, EUDR risk, commodity exposure,
traceability, governance, enforcement, indigenous land, carbon stock, 4 commodity exposure %s, and
`riskRating`) stay purely synthetic.

### 7.2 Parameterisation

| Field | Formula | Provenance |
|---|---|---|
| `deforestationKha` (pre-FAO) | `10 + sr(i×7)×990` | Synthetic; **overwritten by FAO** for matched countries |
| `alertsMonth` | `50 + sr(i×11)×4950` | Synthetic demo value |
| `forestCover` | `20 + sr(i×13)×70` | Synthetic; **overwritten by FAO** `forest_cover_pct` |
| `eudrRisk`, `commodityExposure`, `traceability`, `governance`, `enforcement` | `sr(i×{29,31,37,41,43})` scaled to various 5–90 ranges | Synthetic demo values, no FAO or EU benchmarking-list anchor |
| `riskRating` | tri/penta-band split of **`sr(i×7)`** — the *same seed* used for the raw `deforestationKha` draw | Synthetic; see §7.6 for the resulting logic defect |
| FAO anchor fields | `forest_cover_pct`, `forest_area_mha`, `annual_change_rate_pct`, `primary_forest_mha`, `forest_certification_pct` | **Real** — FAO Global Forest Resources Assessment 2020, via `frontend/src/data/forestData.js` |
| `COMMODITIES` (10 rows) | Static hand-entered % deforestation contribution, volume (Mt), traceability %, EUDR scope flag | Plausible orders-of-magnitude (Palm Oil 28%, Soy 22%, Cattle/Beef 35% deforestation contribution) but not cited to Trase/GFW in code |

### 7.3 Calculation walkthrough

- **Dashboard tab**: KPIs are straight sums/means over the 30-country array
  (`totalDeforest=Σ deforestationKha`, `totalAlerts=Σ alertsMonth`, `avgTrace=mean(traceability)`,
  `critical=count(riskRating∈{Critical,High})`). The Governance Radar averages 6 fields
  (`eudrRisk, traceability, governance, enforcement, protectedArea, commodityExposure`) across all 30
  countries — a portfolio-wide mean, not a per-country weighted score.
- **Country Screening tab**: client-side search/filter/sort/paginate (15 rows/page) over the 30-row
  table; expanding a row shows an 11-field detail panel plus two mini-charts (a 6-axis radar
  re-normalising `protectedArea×2.5` and `carbonStock/2.5` to fit a 0–100 scale, and a 4-commodity
  exposure bar).
- **EUDR Tracker tab**: ranks the top-15 countries by `eudrRisk` descending; renders a badge using
  `badge(100 − eudrRisk, [25,55,75])` — i.e. the badge colour is computed on the **complement** of
  the risk score (100−risk), so a badge threshold table calibrated for a "goodness" metric is reused
  to colour a "riskiness" metric, inverted at the call site to compensate.
- **Commodity Traceability tab**: renders the static `COMMODITIES` table as paired bar (deforestation
  contribution % vs traceability %) and line (volume Mt) charts — no computed ranking or score, pure
  visualisation of hand-entered figures.

### 7.4 Worked example

Brazil (`i=0`): FAO override applies (Brazil is in `FAO_FOREST_AREA_2020`), so `forestCover`,
`deforestationKha`, `primaryForestLoss`, and `protectedArea` all come from real FRA 2020 figures
rather than the synthetic draw. But `riskRating` is **not** FAO-anchored — it still derives from
`sr(0×7) = sr(0) = frac(sin(1)×10000) = frac(8414.7) = 0.7095`. Since `0.7095` falls in the
`sr(i×7) < 0.85` band, Brazil is assigned **`riskRating = 'Moderate'`** — a rating computed from a
throwaway random seed, completely decoupled from Brazil's real (FAO-sourced) deforestation rate
displayed two columns to the left in the same table row.

### 7.5 Companion analytics

- **Alert Trend area chart** — 24 months (2023–2024) of synthetic monthly alerts/deforestation/fire
  counts, `Math.round(5000+sr(i*7)*15000)` etc. — a smooth-looking trend with no actual GFW/Hansen
  ingestion.
- **Risk Distribution pie** — counts of the 5 `riskRating` buckets across all 30 countries; inherits
  the seed-collision issue from §7.6.

### 7.6 Data provenance & limitations

- **Field-naming defects in the FAO overlay** are worth flagging precisely:
  - `primaryForestLoss` is computed as `primary_forest_mha / forest_area_mha × 100` — this is the
    **share of remaining forest that is primary forest**, not a loss rate. A country with a high,
    well-preserved primary-forest share would show a *high* "primaryForestLoss" value under this
    code, which is the opposite of the field's name.
  - `protectedArea` is set from `forest_certification_pct` — FSC/PEFC **certification** coverage is a
    market-based sustainable-sourcing signal, not a **legally protected area** designation; the two
    concepts are conflated.
- **`riskRating` seed collision**: `riskRating` and the pre-override `deforestationKha` both derive
  from `sr(i×7)` with no decorrelation. For any country without a FAO match (14 of the 30 — Bolivia,
  Peru, Malaysia, Myanmar, Cambodia, Laos, Honduras, Nicaragua, Ghana, Liberia, Sierra Leone,
  Mozambique, Papua New Guinea, Paraguay, Guyana per the static list, exact FAO coverage unverified),
  a **higher** synthetic deforestation figure produces a **lower**-severity risk rating (Low/Moderate)
  because the threshold direction is inverted relative to the underlying draw — the opposite of the
  intended risk semantics.
- All alert/fire/traceability/governance/EUDR-risk figures are synthetic; no live Global Forest Watch
  alert feed, Copernicus imagery, or Trase supply-shed attribution is ingested despite being named in
  the guide.
- `COMMODITIES` figures are static and undated — deforestation-attribution percentages for
  palm/soy/cattle should be periodically refreshed against Trase or FAOSTAT.

**Framework alignment:** EU Deforestation Regulation (EUDR 2023/1115) is referenced by the "EUDR
Risk"/"EUDR Scope" fields and tab naming but no actual EU country-benchmarking list (Article 29
high/standard/low classification) is implemented — risk is a synthetic scalar, not a regulatory
classification lookup. FAO FRA 2020 is genuinely and correctly used for 4 of 19 country fields (a
real public-data anchor, consistent with the platform's broader reference-data layer). TNFD LEAP and
Trase are named in the guide but not operationalised.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the DRS product and extend the FAO-anchored core (analytics ladder: rung 1 → 2)

**What.** This module already has a hybrid character worth building on: four of nineteen country fields are **overwritten with real FAO FRA 2020 data** (`deforestationKha` derived from actual change rates × forest area), while the other fifteen — alerts, EUDR risk, traceability, governance, enforcement — stay synthetic, and §7.2 documents a logic defect: `riskRating` bands the *same seed* used for the raw pre-FAO deforestation draw, so the displayed rating can contradict the FAO-corrected deforestation figure sitting next to it. The guide's `DRS = ForestLoss × CommodityLink × JurisdictionRisk` is never computed. Evolution A: implement the DRS as an actual product over sourced terms — FAO/GFW forest loss, commodity-linkage shares from Trase's published country×commodity data, jurisdiction risk from governance indices (WGI) plus the EUDR benchmarking classification — and fix the riskRating so it derives from the DRS, not a stale seed.

**How.** (1) Extend the `forestData.js` ingestion pattern that already works: add GFW annual tree-cover-loss country aggregates (public API, keyless tier) and Trase country-commodity linkage tables to refdata. (2) `DRS_i` computed per country×commodity with the three factors displayed; the governance radar re-based on sourced indices. (3) The seeded `TREND` (alerts/fires) replaced by GFW's actual alert time series where available, honest-empty otherwise. (4) The riskRating-seed defect logged in the calc-bug backlog and closed by derivation.

**Prerequisites.** GFW/Trase data collection (both public); the remaining `sr()` fields deleted or labeled pending sourcing. **Acceptance:** riskRating is a deterministic function of the displayed DRS; FAO-anchored and synthetic fields are visually distinguished until all are sourced; the DRS decomposes into its three cited factors.

### 9.2 Evolution B — Counterparty due-diligence copilot for EUDR workflows (LLM tier 2)

**What.** The stated workflow — upload counterparties, review alerts, classify EUDR status, prioritise enhanced due diligence, generate the due-diligence statement package — is a triage-and-documentation loop suited to tier 2: "which uploaded counterparties source from high-risk classifications and what's their DRS?", "explain why Brazil-soy scores above Ghana-cocoa", "assemble the EUDR due-diligence statement data for operator X with the evidence we hold and the gaps we don't."

**How.** Tool schemas over the Evolution A DRS/counterparty routes; statement generation maps computed fields to the EUDR operator-registry data requirements with missing evidence (e.g. no plot coordinates) enumerated rather than papered over — Article 9 geolocation requirements are exactly where incomplete data must surface, not hide. Prioritisation answers show the DRS factor arithmetic; country-classification claims cite the benchmarking source and date (the Commission's list is pending/evolving — vintage is load-bearing); commodity-linkage percentages quote Trase rows. Alert-driven questions ("did deforestation spike in this supply shed?") are answerable only at country grain until polygon-level monitoring exists — the copilot states that resolution limit explicitly, mirroring the `resolution_tier` convention.

**Prerequisites (hard).** Evolution A (due-diligence statements over synthetic alerts would be fabricated regulatory evidence); counterparty upload flow; Phase 2 tooling. **Acceptance:** statements enumerate held vs missing evidence per EUDR requirement; every risk figure traces to a tool call; resolution limits stated when alert questions exceed country grain.