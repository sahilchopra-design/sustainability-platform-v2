# Commodity Deforestation Risk
**Module ID:** `commodity-deforestation` · **Route:** `/commodity-deforestation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses supply chain deforestation risk embedded in commodity exposure across soy, palm oil, beef, timber, cocoa, and coffee using satellite-verified land-use change data and EUDR compliance frameworks.

> **Business value:** Helps financial institutions, corporates, and supply chain managers identify, quantify, and mitigate deforestation risk in commodity supply chains while preparing for EUDR and TNFD disclosure requirements.

**How an analyst works this module:**
- Map commodity purchasing to origin geographies using supply chain disclosure and Trase trade flow data
- Overlay Global Forest Watch deforestation alerts and Hansen annual tree cover loss data
- Score each supply chain segment on deforestation risk: country risk × opacity × volume weight
- Assess EUDR compliance readiness: geolocation traceability, due diligence statements, risk classification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CERT_DATA`, `CERT_SCHEMES`, `CERT_TYPES`, `COMMODITIES`, `COMMODITY_RADAR`, `COMM_COLORS`, `COMPANIES`, `COMPANY_NAMES`, `COUNTRIES`, `COUNTRY_DATA`, `Card`, `CertTraceability`, `CommodityRisk`, `CustomTooltip`, `EudrDashboard`, `FinancialImpact`, `KPI`, `RADAR_DIMS`, `REGIONS`, `STATUSES`, `STATUS_CLR`, `SUPPLY_PATHS`, `Tabs`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>Math.floor(sr(s)*(max-min+1))+min;` |
| `pct` | `(s)=>Math.round(sr(s)*100);` |
| `fmt` | `n=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toString();` |
| `STATUSES` | `['Compliant','Partial','Non-Compliant','Not Assessed'];` |
| `STATUS_CLR` | `{Compliant:T.green,Partial:T.amber,'Non-Compliant':T.red,'Not Assessed':T.textMut};` |
| `CERT_TYPES` | `{RSPO:'Palm Oil',RTRS:'Soy','Rainforest Alliance':'Multi',FSC:'Wood',UTZ:'Multi',ProTerra:'Soy',ISCC:'Multi',RSB:'Multi',Bonsucro:'Sugar/Ethanol',ASI:'Aluminium/Multi',PEFC:'Wood',SAN:'Multi',Fairtrade:'Multi',CmiA:'Cott` |
| `COMPANY_NAMES` | `['Cargill','Wilmar International','Bunge','ADM','Louis Dreyfus','Olam','Barry Callebaut','Sime Darby','Golden Agri-Resources','Musim Mas','IOI Group','Astra Agro','JBS','Marfrig','Minerva Foods','BRF','Nestl\u00e9','Unil` |
| `genCountryRisk` | `()=>COUNTRIES.map((c,i)=>({name:c,region:REGIONS[c],deforestRate:+(sr(i*31)*4.5+0.2).toFixed(2),forestCover:rng(15,85,i*17),riskScore:rng(20,98,i*23),eudrPriority:rng(20,98,i*23)>70?'High':rng(20,98,i*23)>40?'Medium':'Lo` |
| `_FAO_MAP_CD` | `Object.fromEntries(FAO_FOREST_AREA_2020.map(d => [d.country, d]));` |
| `_COMM_MAP_CD` | `Object.fromEntries(COMMODITY_DEFORESTATION_RISK.map(d => [`${d.commodity}::${d.country}`, d]));` |
| `genCertData` | `()=>CERT_SCHEMES.map((s,i)=>({name:s,commodity:CERT_TYPES[s],coverage:rng(5,85,i*31),credibility:rng(40,98,i*37),cost:rng(2,25,i*41),deforestFree:rng(30,99,i*43),auditFreq:pick(['Annual','Biennial','Continuous','Triennia` |
| `genYearlyDeforest` | `comm=>{const base=rng(100,500,COMMODITIES.indexOf(comm)*31);return Array.from({length:8},(_,i)=>({year:2018+i,area:Math.max(20,base+rng(-80,80,comm.length*i*13)),alerts:rng(50,500,comm.length*i*17)}));};` |
| `genCommodityRadar` | `()=>COMMODITIES.map((c,i)=>{const obj={commodity:c};RADAR_DIMS.forEach((d,di)=>{obj[d]=rng(15,95,i*31+di*13);});obj.color=COMM_COLORS[i];return obj;});` |
| `commDonut` | `useMemo(()=>COMMODITIES.map((c,i)=>({name:c,value:COMPANIES.filter(co=>co.commodities.includes(c)).length,color:COMM_COLORS[i]})),[]);` |
| `countryRiskTop` | `useMemo(()=>[...COUNTRY_DATA].sort((a,b)=>b.riskScore-a.riskScore).slice(0,15),[]);` |
| `toggleSort` | `col=>{if(sortCol===col)setSortDir(-sortDir);else{setSortCol(col);setSortDir(1);}};` |
| `lgDeadline` | `new Date('2025-12-30');` |
| `smeDeadline` | `new Date('2026-06-30');` |
| `daysToLg` | `Math.max(0,Math.ceil((lgDeadline-now)/(1000*60*60*24)));` |
| `daysToSme` | `Math.max(0,Math.ceil((smeDeadline-now)/(1000*60*60*24)));` |
| `yearData` | `useMemo(()=>genYearlyDeforest(selComm),[selComm]); const countryBreak=useMemo(()=>{ const relevant=COUNTRY_DATA.filter((_,i)=>pick(COMMODITIES,i*7)===selComm\|\|sr(i*31+commIdx*7)>0.6).slice(0,10);` |
| `paths` | `useMemo(()=>SUPPLY_PATHS.filter(p=>p.commodity===selComm),[selComm]); const priceData=useMemo(()=>Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,price:rng(200,1200,commIdx*100+i*17)+sr(commIdx*i*31)*100})),[commIdx]);` |
| `radarBars` | `RADAR_DIMS.map((d,i)=>({dim:d,value:radar[d],fill:radar[d]>70?T.red:radar[d]>40?T.amber:T.green}));` |
| `alertData` | `useMemo(()=>Array.from({length:12},(_,i)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],alerts:rng(20,300,commIdx*31+i*13),area:rng(100,5000,commIdx*37+i*17)})),[commIdx]); ` |
| `coverageData` | `useMemo(()=>CERT_DATA.map(c=>({name:c.name,coverage:c.coverage,credibility:c.credibility})),[]);` |
| `traceGaps` | `useMemo(()=>{ const buckets=[{label:'0-25%',min:0,max:25},{label:'26-50%',min:26,max:50},{label:'51-75%',min:51,max:75},{label:'76-100%',min:76,max:100}];` |
| `creditRisk` | `useMemo(()=>COMPANIES.slice(0,30).map((c,i)=>({name:c.name.length>18?c.name.slice(0,18)+'..':c.name,baseRisk:rng(5,40,i*31),deforestAdj:rng(2,25,i*37),total:rng(5,40,i*31)+rng(2,25,i*37)})).sort((a,b)=>b.total-a.total).s` |
| `revenueAtRisk` | `useMemo(()=>COMMODITIES.map((c,i)=>({commodity:c,revenue:rng(50,800,i*31)*1e6,atRisk:rng(5,35,i*37),exposure:rng(10,60,i*41)})),[]);` |
| `engagementMatrix` | `useMemo(()=>COMPANIES.slice(0,40).map((c,i)=>({name:c.name,exposure:rng(10,95,i*31),risk:c.riskScore,readiness:rng(10,90,i*43),priority:0})).map(c=>{c.priority=Math.round((c.exposure*0.4+c.risk*0.35+(100-c.readiness)*0.2` |
| `greenPremium` | `useMemo(()=>COMMODITIES.map((c,i)=>({commodity:c,standard:rng(200,900,i*31),certified:rng(220,1050,i*37),premium:rng(3,22,i*41)})),[]);` |
| `totalRemCost` | `remediationCost.reduce((s,r)=>s+r.adjusted,0);` |
| `rows` | `COMPANIES.map(c=>[c.name,c.country,c.overallStatus,c.commodities.join(';'),c.traceability,c.riskScore,c.geoDataPct,c.dueDiligenceScore,c.size,c.certifications.join(';')]);` |
| `csv` | `[headers.join(','),...rows.map(r=>r.join(','))].join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_SCHEMES`, `COMMODITIES`, `COMM_COLORS`, `COMPANY_NAMES`, `COUNTRIES`, `RADAR_DIMS`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Loss Attributable to Commodity Production (2023) | — | Global Forest Watch 2024 | Annual tropical forest loss directly linked to commercial commodity agriculture and logging globally. |
| EUDR Affected Trade Value | — | European Commission Impact Assessment 2021 | Estimated value of EU commodity imports subject to EU Deforestation Regulation due diligence requirements. |
- **Trase trade flows, GFW deforestation alerts, CDP forest questionnaire, supplier disclosures** → Origin mapping, hazard overlay, DRS computation, EUDR readiness scoring → **Commodity risk heat maps, supplier-level flags, EUDR compliance dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Deforestation Risk Score
**Headline formula:** `DRS = Σ (Commodityᵢ × SourceCountryRiskᵢ × SupplyChainOpacityᵢ)`

Weighted product of commodity volume, source country deforestation intensity, and supply chain transparency deficit.

**Standards:** ['Trase Supply Chains 2024', 'Global Forest Watch']
**Reference documents:** Global Forest Watch Hansen Tree Cover Loss 2023; Trase Supply Chain Intelligence Platform 2024; EU Deforestation Regulation (EU) 2023/1115; TNFD LEAP Nature Risk Assessment Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes a **Deforestation Risk Score** `DRS = Σ(Commodity × SourceCountryRisk × SupplyChainOpacity)`
and EUDR-readiness scoring. The code builds an extensive EUDR/supply-chain dashboard, but almost every metric
(country risk, certification credibility, yearly deforestation, credit-risk uplift) is generated by the
platform PRNG via `rng()`/`pct()`/`sr()`. Real reference data (FAO forest area, commodity-deforestation risk)
is imported for a few lookups but the risk scores themselves are seeded.

### 7.1 What the module computes

Helper PRNG wrappers drive most values:
```js
pick(arr,s) = arr[floor(sr(s)·arr.length)]
rng(min,max,s) = floor(sr(s)·(max−min+1)) + min
pct(s) = round(sr(s)·100)
```
Country and certification risk:
```js
countryRisk: { deforestRate: sr(i·31)·4.5+0.2, forestCover: rng(15,85,i·17),
               riskScore: rng(20,98,i·23), eudrPriority: >70 High / >40 Med / Low }
certData:    { coverage: rng(5,85,i·31), credibility: rng(40,98,i·37), deforestFree: rng(30,99,i·43) }
```
EUDR compliance countdown (real dates):
```js
daysToLg  = max(0, ceil((2025-12-30 − now)/day))     // large-operator deadline
daysToSme = max(0, ceil((2026-06-30 − now)/day))     // SME deadline
```
Credit-risk overlay: `creditRisk[i].total = rng(5,40,i·31) + rng(2,25,i·37)` (base + deforestation adj).

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| `riskScore`, `eudrPriority` | `rng(20,98)`, threshold 70/40 | synthetic demo value |
| `deforestRate` | `sr(i·31)·4.5+0.2` %/yr | synthetic demo value |
| Certification credibility/coverage | `rng()` | synthetic demo value |
| `FAO_FOREST_AREA_2020`, `COMMODITY_DEFORESTATION_RISK` | imported maps | real reference data (FAO / lookup) |
| `COMPANY_NAMES` | real trader list (Cargill, Wilmar…) | curated real names, synthetic metrics |
| EUDR deadlines | 2025-12-30 / 2026-06-30 | real regulatory dates |
| `engagementMatrix` priority | `exposure·0.4 + risk·0.35 + (100−readiness)·0.2` | heuristic weighting |

### 7.3 Calculation walkthrough

Country/commodity/certification datasets generated via `rng()` → `commDonut` counts companies per commodity →
`countryRiskTop` sorts by risk → `yearData`/`alertData` build synthetic deforestation time series →
`traceGaps` buckets traceability → `creditRisk` adds a deforestation credit-spread uplift → `engagementMatrix`
prioritises suppliers by a weighted composite → `remediationCost` sums adjusted costs → CSV export. FAO forest
area and a commodity-deforestation-risk lookup are joined for a few real anchors.

### 7.4 Worked example

Supplier engagement priority for a company with `exposure = 80`, `riskScore = 70`, `readiness = 40`:
```
priority = round(80·0.4 + 70·0.35 + (100−40)·0.2)
         = round(32 + 24.5 + 12) = round(68.5) = 69
```
High exposure and risk with low readiness put this supplier near the top of the engagement queue. A country
with `rng(20,98,i·23) = 82 (>70)` is flagged `eudrPriority = 'High'`. Its credit-risk row might read
`rng(5,40)=25` base + `rng(2,25)=15` deforestation adj = **40** total spread proxy.

### 7.5 Data provenance & limitations

- Risk scores, deforestation rates, certification credibility and credit uplifts are **synthetic** (`rng()`/
  `sr()` PRNG). Only company names, EUDR deadlines, and the FAO forest-area / commodity-risk lookup joins are
  real.
- The guide's `DRS = Commodity × CountryRisk × Opacity` product is not the on-page formula — country risk is a
  random draw, not built from volume × Trase-origin × transparency deficit.
- Deforestation time series and satellite "alerts" are `rng()`-generated, not Global Forest Watch/Hansen data.

**Framework alignment:** EU Deforestation Regulation (EU) 2023/1115 (geolocation traceability, due-diligence,
Dec-2025/Jun-2026 deadlines — the real dates are used) · Global Forest Watch / Hansen tree-cover-loss (the
intended alert source) · Trase supply-chain trade flows · TNFD LEAP nature-risk assessment. FAO forest-area
data provides the one genuine forest-cover anchor.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute a defensible supply-chain deforestation risk score and EUDR-readiness rating
per commodity–origin–supplier, for FI screening, corporate due diligence and EUDR compliance.

**8.2 Conceptual approach.** The guide's DRS operationalised with **Trase-linked origin risk × satellite-
verified deforestation × traceability deficit**, benchmarked against Global Forest Watch/Hansen loss and CDP
Forests scoring — the standard commodity-deforestation due-diligence stack.

**8.3 Mathematical specification.**
```
DRS_supplier = Σ_c volume_c · OriginRisk_c · Opacity_c
   OriginRisk_c = w1·DeforestRate_origin(Hansen) + w2·PADeficit + w3·GovernanceRisk
   Opacity_c    = 1 − TraceabilityShare_c   (0 = fully traceable to plot)
EUDR_readiness = w_geo·GeolocationCoverage + w_dd·DDStatementCompleteness + w_class·RiskClassAccuracy
CreditAdj = base_spread · (1 + κ·DRS_norm)     (deforestation credit overlay)
```

| Parameter | Source |
|---|---|
| DeforestRate_origin | Global Forest Watch / Hansen tree-cover-loss |
| Trade flows / origin | Trase supply-chain platform |
| Traceability share | supplier disclosure / CDP Forests |
| Governance risk | WGI / EUDR country-benchmark classification |

**8.4 Data requirements.** Supplier volumes by commodity+origin; plot-level geolocation; Hansen loss;
governance index. Free: GFW/Hansen, FAO (platform has FAO forest area); vendor: Trase, CDP Forests.

**8.5 Validation & benchmarking.** Reconcile origin risk vs GFW hotspots; backtest DRS against realised
deforestation-linked supply events; EUDR-readiness audit against regulation Annex.

**8.6 Limitations & model risk.** Traceability data sparse upstream; attribution of loss to commodity vs
other drivers; governance proxies coarse. Fallback: country-commodity average risk with high-opacity penalty
when plot-level data is missing.

## 9 · Future Evolution

### 9.1 Evolution A — DRS from real forest-loss and trade-flow data (analytics ladder: rung 1 → 2)

**What.** §7.5 is unambiguous: country risk scores, deforestation rates, certification
credibility, and the credit uplift are all `rng()`/`sr()`-generated — only the FAO
forest-area lookup, the trader names, and the EUDR deadlines (2025-12-30 / 2026-06-30)
are real. The guide's `DRS = Σ(Commodity × SourceCountryRisk × Opacity)` is never
built as a product; country risk is a random draw. Evolution A constructs the score
from real inputs: Hansen/GFW tree-cover loss for country deforestation intensity,
Trase-style commodity-origin volumes, and a documented opacity rubric.

**How.** (1) Ingest Global Forest Watch country/commodity tree-cover-loss statistics
(free API tier) into a `forest_loss_annual` table via the platform's ingestion
framework — this replaces the synthetic `deforestRate` and the fabricated "alert" time
series. (2) Commodity-origin volumes from UN Comtrade (already integrated, wave 1) as
the volume weight; opacity scored from traceability disclosures with a published 3-level
rubric rather than `rng(20,98)`. (3) DRS becomes the actual triple product per
supply-chain segment, aggregated per company; the existing `engagementMatrix` weighting
(0.4/0.35/0.2) can stay but now consumes computed inputs. (4) EUDR-priority
classification derives from the computed DRS against documented thresholds.

**Prerequisites (hard).** Purge the `rng()`/`pct()` generators from every scored path
(guardrail conventions apply); keep real trader names only if their metrics stop being
synthetic — §7.5's real-names-fake-numbers combination is a presentation risk.
**Acceptance:** Brazil-soy and Malaysia-palm DRS values trace to specific GFW loss
figures and Comtrade volumes; the DRS product formula reproduces by hand for one
segment; zero PRNG calls feed displayed risk metrics.

### 9.2 Evolution B — EUDR due-diligence-statement assistant (LLM tier 1 → 2)

**What.** The module already tracks the real EUDR deadlines and traceability gaps;
what operators need next is the due-diligence statement itself. Evolution B drafts the
EUDR Article 9-style risk assessment for a selected commodity/origin pairing:
commodity scope confirmation, country risk classification with evidence, traceability
gaps from the `traceGaps` buckets, and mitigation steps — grounded in Regulation (EU)
2023/1115 text and (after Evolution A) computed DRS inputs, with each risk claim
citing its data source.

**How.** Tier 1: RAG over this Atlas record plus the EUDR regulation text (add to the
refdata regulatory catalogs); page state supplies the selected supply-chain segment.
The prompt encodes the current honesty constraint — until Evolution A lands, the
copilot must label risk scores as illustrative and refuse to embed them in a
compliance document. Tier 2 (post-Evolution A): tool calls to the DRS computation
endpoint so "reassess this segment with 2024 loss data" re-runs the product and
updates the draft.

**Prerequisites (hard).** Evolution A before any generated statement carries numbers —
a compliance artifact built on `rng()` scores is worse than none; regulation text
ingestion. **Acceptance:** a draft statement for one commodity/origin cites GFW and
Comtrade values present in tool output or the DB; segments without traceability data
yield "insufficient geolocation evidence" rather than a synthesized risk rating.