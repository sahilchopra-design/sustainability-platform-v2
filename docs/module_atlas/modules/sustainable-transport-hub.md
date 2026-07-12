# Sustainable Transport Hub
**Module ID:** `sustainable-transport-hub` · **Route:** `/sustainable-transport-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated transport sector decarbonisation analytics covering EV adoption, maritime IMO targets, aviation SAF and CORSIA, rail electrification, and multi-modal carbon intensity comparison.

> **Business value:** Transport is responsible for 25% of global CO2 emissions and is undergoing fundamental technology disruption. This hub provides the analytical tools needed for transport companies, fleet operators, and investors to navigate decarbonisation across all transport modes and regulatory frameworks.

**How an analyst works this module:**
- Modal Comparison shows CI per mode (air/sea/road/rail)
- Aviation Analytics covers CORSIA offset requirements
- Maritime Dashboard shows IMO compliance trajectory
- EV Transition models fleet electrification economics
- Rail Network covers electrification and green rail certification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIENCES`, `CHART_COLORS`, `KPI_DEFS`, `MODES`, `OPPORTUNITIES`, `PERIODS`, `REGIONS`, `REPORT_SECTIONS`, `RISKS`, `RISK_TIERS`, `STAGES`, `STAGE_COLORS`, `SUBSECTORS`, `SUB_MODULES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `KPI_DEFS` | 13 | `key`, `label`, `unit`, `base`, `delta` |
| `SUB_MODULES` | 6 | `key`, `label`, `icon`, `color`, `stats` |
| `RISKS` | 6 | `title`, `mode`, `impact` |
| `OPPORTUNITIES` | 6 | `title`, `mode`, `impact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MODES` | `['Maritime','Aviation','Road/EV','Rail','Logistics'];` |
| `REGIONS` | `['Europe','Asia-Pacific','North America','Middle East','Africa','Latin America'];` |
| `SUBSECTORS` | `{Maritime:['Container','Tanker','Bulk Carrier','LNG Carrier','Cruise','Ro-Ro'],Aviation:['Long-Haul','Short-Haul','Cargo','Regional','Business Jet','Helicopter'],'Road/EV':['Heavy Truck','Light Commercial','Bus Fleet','L` |
| `REPORT_SECTIONS` | `['Exec Summary','Maritime Compliance','Aviation Decarbonisation','EV Transition','SAF Markets','Cross-Modal Analysis','Investment Portfolio','Recommendations'];` |
| `modeIdx` | `Math.floor(s*5);const mode=MODES[modeIdx];` |
| `tabs` | `['Executive Dashboard','Cross-Modal Portfolio','Engagement Pipeline','Board Report'];` |
| `val` | `k.key==='batteryCost'?k.base+k.delta*(m-1):k.base+(k.delta*(m-1));` |
| `delta` | `k.delta*(m>1?m*0.3:1);` |
| `stageCounts` | `useMemo(()=>STAGES.map(st=>({stage:st,count:filteredEngagements.filter(e=>e.stage===st).length})),[filteredEngagements]);` |
| `target` | `m==='Maritime'?50:m==='Aviation'?45:m==='Road/EV'?40:m==='Rail'?35:30;` |
| `reportContent` | `useMemo(()=>({ 'Exec Summary':{ text:`Transport portfolio of $${(50.2).toFixed(1)}bn across ${assets.length} entities. Overall decarbonisation rate of 3.2%/yr. ${alerts.filter(a=>a.severity==='Critical').length} critical alerts requiring immediate attention.`, deltaQ:'+2.1% portfolio allocation QoQ', }, 'Maritime Compliance':{ text:`Fleet` |
| `sectionChartData` | `useMemo(()=>({ 'Maritime Compliance':assets.filter(a=>a.mode==='Maritime').reduce((acc,a)=>{ const r=a.ciiRating\|\|'C';acc[r]=(acc[r]\|\|0)+1;return acc;` |
| `rows` | `REPORT_SECTIONS.filter(s=>activeSections[s]).map(s=>[s,reportContent[s]?.text\|\|'',reportContent[s]?.deltaQ\|\|'']);` |
| `csv` | `[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `investBreakdown` | `useMemo(()=>{ if(investBreakdownMode==='mode'){ return MODES.map((m,i)=>({ name:m, value:+assets.filter(a=>a.mode===m).reduce((s,a)=>s+a.investmentExp,0).toFixed(1), color:CHART_COLORS[i], }));` |
| `filteredAlerts` | `useMemo(()=>{ let a=alerts.map(al=>({...al,acknowledged:al.acknowledged\|\|alertAck.has(al.id)}));` |
| `qtrMetrics` | `useMemo(()=>[ {label:'Portfolio Return',q1:'+2.1%',q2:'+1.8%',q3:'+3.2%',q4:'+2.7%',trend:'up'}, {label:'Emissions Reduction',q1:'-1.2%',q2:'-1.8%',q3:'-2.1%',q4:'-2.5%',trend:'up'}, {label:'Engagement Success',q1:'68%',q2:'71%',q3:'74%',q4:'78%',trend:'up'}, {label:'Compliance Rate',q1:'76%',q2:'79%',q3:'81%',q4:'84%',trend:'up'}, {label` |
| `modePerformance` | `useMemo(()=>MODES.map((m,i)=>{` |
| `avgDecarb` | `modeAssets.length?+(modeAssets.reduce((s,a)=>s+a.decarbScore,0)/modeAssets.length).toFixed(0):0;` |
| `totalEmissions` | `+modeAssets.reduce((s,a)=>s+a.emissions,0).toFixed(1);` |
| `totalInvest` | `+modeAssets.reduce((s,a)=>s+a.investmentExp,0).toFixed(1);` |
| `avg` | `inStage.length?+(inStage.reduce((s,e)=>s+e.daysInStage,0)/inStage.length).toFixed(0):0;` |
| `pct` | `total?Math.round((count/total)*100):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIENCES`, `CHART_COLORS`, `KPI_DEFS`, `MODES`, `OPPORTUNITIES`, `PERIODS`, `REGIONS`, `REPORT_SECTIONS`, `RISKS`, `RISK_TIERS`, `STAGES`, `STAGE_COLORS`, `SUB_MODULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Aviation CI | — | ICAO | Passenger kilometre carbon intensity |
| Maritime Decarbonisation Target | — | IMO 2023 | IMO revised GHG strategy |
| EV Cost Parity | — | BNEF | Total cost of ownership vs ICE vehicles |
- **Fleet consumption data** → WTW calculation → **Modal carbon intensity**
- **ICAO/IMO reporting** → Regulatory compliance → **CORSIA offset requirement**
- **EV adoption data** → TCO modelling → **Electrification investment case**

## 5 · Intermediate Transformation Logic
**Methodology:** Transport modal carbon intensity
**Headline formula:** `Modal_CI = Lifecycle_GHG / passenger_km (or tonne_km)`

WTW (well-to-wheel) lifecycle carbon intensity per mode. Aviation: CORSIA offset requirement for international flights. Maritime: IMO 2050 target (net-zero by 2050). Road: fleet average CO2 g/km regulation (EU: 0g/km for new cars by 2035).

**Standards:** ['ITF/OECD', 'ICAO CORSIA', 'IMO GHG Strategy', 'EU FuelEU Maritime']
**Reference documents:** ICAO CORSIA Carbon Offsetting Scheme; IMO 2023 GHG Strategy; EU FuelEU Maritime Regulation; EU 2035 ICE Ban Regulation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is `Modal_CI = Lifecycle_GHG /
> passenger_km` (or tonne_km) — a well-to-wheel carbon-intensity calculation per ITF/OECD
> methodology. **No such calculation exists.** Each of the 200 synthetic transport assets carries an
> `intensity` field that is an **independently `sr()`-seeded random number (10–190)**, unconnected to
> any `emissions`/`passenger_km` or `emissions/tonne_km` division. Sections below document the
> module's actual pattern — a portfolio-monitoring dashboard (KPIs, engagement pipeline, alerts,
> board report) layered on synthetic multi-modal asset data, structurally identical to several other
> platform "hub" modules in this batch.

### 7.1 What the module computes

200 synthetic transport-sector assets (`genAssets`) spanning 5 modes (Maritime, Aviation, Road/EV,
Rail, Logistics) assigned to real-world-styled company names (Maersk, CMA CGM, Emirates, Delta,
Tesla Fleet Ops, DB Cargo, DHL, etc.), each with independently `sr()`-seeded `emissions` (0.1–5.0
MtCO₂e), `intensity` (10–190, unitless — no gCO₂/pkm or gCO₂/tkm label is attached in the data
model), `decarbScore` (20–95), `investmentExp` ($0.05–2.5bn), `riskTier`, and mode-specific fields
(maritime CII rating A–E, aviation CORSIA-compliance flag + SAF usage %, road EV-penetration %). 40
synthetic engagement records and 25 synthetic alerts round out an Executive Dashboard / Cross-Modal
Portfolio / Engagement Pipeline / Board Report 4-tab structure.

### 7.2 Genuine aggregation formulas

```js
modePerformance[mode] = {
  avgDecarb:     modeAssets.length ? mean(decarbScore) : 0,
  totalEmissions: Σ emissions,
  totalInvest:    Σ investmentExp,
}
target[mode] = { Maritime:50, Aviation:45, 'Road/EV':40, Rail:35, Logistics:30 }[mode]   // static gap benchmark
stageCounts[stage] = count(engagements where stage matches)                              // engagement funnel
pct(count,total) = total ? round(count/total×100) : 0                                    // guarded %
```

All aggregation is unweighted mean/sum over the (optionally filtered) asset array, with correct
zero-length guards throughout (`modeAssets.length ? … : 0`, `total ? … : 0`). The per-mode `target`
values (50/45/40/35/30) are static decarbonisation-score benchmarks used to compute a gap
(`avgDecarb − target`) in the Cross-Modal Portfolio tab — plausible relative ordering (maritime
highest target reflecting IMO's tightening CII bands, logistics lowest) but not derived from a named
external benchmark.

### 7.3 KPI definitions and calibration

13 platform-wide KPIs (`KPI_DEFS`) each have a `base` value and a `delta` (period-over-period change)
applied via:

```js
val(period_m) = key==='batteryCost' ? base + delta×(m−1) : base + delta×(m−1)     // identical branches
delta_effective = delta × (m>1 ? m×0.3 : 1)                                        // separate dampened-delta path used elsewhere
```

Note the `val` function's two branches are **identical** (`k.key==='batteryCost' ? … : …` evaluates
the same expression either way) — a vestigial conditional with no behavioural difference, i.e. dead
branching left in the code.

### 7.4 Worked example

Asset `i=10` ('Emirates Airlines' by position): `modeIdx = floor(sr(10*7+3)×5) = floor(sr(73)×5)`.
`sr(73) = frac(sin(74)×10⁴)`; illustratively this lands in the Aviation band (`modeIdx=1`), consistent
with the row's actual list position. `emissions = 0.1+sr(73)×4.9`; `decarbScore = floor(20+sr(83)×75)`
(using `s3=sr(i*13+2)=sr(132)`). Suppose `decarbScore=58` for this asset and the mode's `avgDecarb`
across all Aviation assets computes to 51 vs `target=45`: the Cross-Modal Portfolio tab would show
Aviation **ahead of** its target gap (51 > 45), i.e. "on track" — but because `decarbScore` is
independently random per asset with no link to `intensity`, `emissions`, `corsiaCompliant`, or
`safUsage`, an asset's CORSIA-compliance flag and its decarbonisation score can disagree (e.g. a
CORSIA-non-compliant asset can still draw a high `decarbScore`), which would not happen in a genuine
model where compliance status is a direct input to the score.

### 7.5 Companion analytics

- **Alerts** (25 templates across all 5 modes, e.g. "IMO CII threshold breach," "CORSIA offset
  shortfall detected," "SAF production target missed by 15%") — realistic regulatory-event titles,
  statically authored with fixed severity, not generated from the asset dataset's actual CII ratings
  or SAF-usage figures.
- **Engagement pipeline** — 40 companies × 6 stages (Identified→Resolved), `daysInStage` and
  `priority` independently seeded; `stageCounts`/`avg` days-in-stage are correct aggregate
  calculations over this synthetic funnel.
- **Board Report** — `reportContent`'s Exec Summary text hard-codes `$50.2bn` portfolio value as a
  literal inside a template string (`$${(50.2).toFixed(1)}bn`) rather than computing it from
  `Σ investmentExp` over the 200 assets — a static figure dressed as a live calculation.
- **CSV export** — standard client-side Blob/anchor download of the active report section.

### 7.6 Data provenance & limitations

- **100% synthetic asset, engagement, and alert data**, `sr()`-seeded; company names are real
  transport-sector participants (Maersk, DHL, Union Pacific, Tesla Fleet Ops, etc.) but the attached
  emissions/intensity/investment figures are not their actual disclosed data.
- No modal carbon-intensity (`Lifecycle_GHG/passenger_km`) calculation exists — `intensity` is
  disconnected random noise; see §8 for the production model this should be replaced with.
- Board Report's headline portfolio value ($50.2bn) is hard-coded rather than computed from live
  asset data — will silently drift out of sync if the underlying `investmentExp` figures change.
- The `val()` KPI-projection function's dual branches are functionally identical — indicates
  incomplete implementation of an intended `batteryCost`-specific projection path.

**Framework alignment:** IMO's 2023 revised GHG Strategy (net-zero "by or around" 2050) and the CII
(Carbon Intensity Indicator) A–E rating bands are correctly named and the CII rating field structure
matches IMO's actual scheme, but no CII value is calculated from fuel-consumption/distance data — it
is directly `sr()`-assigned. ICAO CORSIA and EU FuelEU Maritime are represented as compliance flags,
not as offset-requirement or fuel-intensity-target calculations. The EU's 2035 zero-emission new-car
mandate is referenced in the guide but has no corresponding EV-transition trajectory calculation in
code — `evPenetration` is a static random per-asset field.

## 9 · Future Evolution

### 9.1 Evolution A — Real modal carbon-intensity engine under the hub dashboard (analytics ladder: rung 1 → 2)

**What.** The §7 flag is unambiguous: the guide's `Modal_CI = Lifecycle_GHG / passenger_km` is never computed — each of the 200 synthetic assets carries an `sr()`-seeded, unitless `intensity` (10–190), and `decarbScore` is independent noise that can contradict the same asset's CORSIA flag or CII rating (§7.4). Evolution A gives this tier-B, frontend-only hub its first real calculation layer: published modal CI factors, a computed CII, and internally consistent scoring.

**How.** (1) Seed ITF/OECD and UK DEFRA/BEIS well-to-wheel modal emission factors (gCO₂e/pkm and gCO₂e/tkm, free reference data) as a refdata table; `intensity` becomes a labelled lookup by mode × subsector instead of noise. (2) Compute maritime CII from the IMO formula (annual CO₂ / (capacity × distance)) with the real A–E boundary tables, so an asset's CII rating derives from its emissions and activity fields rather than being directly `sr()`-assigned. (3) Make `decarbScore` a documented function of CII/CORSIA/SAF-usage/EV-penetration inputs, eliminating the contradiction class. (4) Fix the two documented code defects: the hard-coded `$50.2bn` Board Report figure (compute from `Σ investmentExp`) and the dead identical branches in `val()`.

**Prerequisites.** Asset activity data (distance, tonnage) must be added to the synthetic generator or replaced with a seeded demo fleet — CI needs a denominator. **Acceptance:** a CORSIA-non-compliant asset can no longer outscore a compliant peer on `decarbScore` all else equal; Board Report portfolio value tracks the live asset sum; each `intensity` cell carries a unit and factor citation.

### 9.2 Evolution B — Cross-modal fleet-strategy copilot (LLM tier 1)

**What.** A copilot on the Executive Dashboard answering questions the four tabs already visualize — "which mode is furthest behind its decarbonisation target and why?", "summarise the critical alerts for the board pack" — grounded in the page's computed aggregates (`modePerformance`, `stageCounts`, the mode targets 50/45/40/35/30) and the regulatory context in this Atlas page (IMO 2023 strategy, CORSIA, FuelEU Maritime, EU 2035 ICE ban).

**How.** Tier 1 per the roadmap pattern: corpus = this Atlas record plus the live page state (the module has no backend endpoints to tool-call — its EP code is None, so tier 2 has nothing to bind to until Evolution A ships a route). The copilot narrates gaps (`avgDecarb − target` per mode), drafts the Board Report section text from computed values instead of the current static template strings, and answers framework questions ("what does a CII rating of D trigger?") from the standards corpus with citations. It must disclose the synthetic provenance of asset figures when asked about named companies (Maersk, DHL et al. carry fabricated values per §7.6).

**Prerequisites.** Alert generation should first be wired to actual asset fields (today the 25 alerts are statically authored, disconnected from the data they describe) — otherwise the copilot would summarise alerts that contradict the dashboard. **Acceptance:** board-summary drafts contain only numbers reproducible from the page's aggregate calculations; questions about real company disclosures get a synthetic-data disclaimer, not a fabricated answer.