# TNFD Biodiversity Baseline Assessment
**Module ID:** `tnfd-biodiversity-baseline` · **Route:** `/tnfd-biodiversity-baseline` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
TNFD LEAP (Locate, Evaluate, Assess, Prepare) process implementation for biodiversity baseline assessment. Overlays business locations with biodiversity hotspot and KBA databases, evaluates ecosystem service dependencies, assesses impact drivers (land use, pollution, climate, invasive species, overexploitation), and computes TNFD CORE disclosure metrics.

> **Business value:** Used by corporates, financial institutions, and asset managers to implement TNFD recommendations, comply with CSRD ESRS E4, and contribute to Kunming-Montreal Global Biodiversity Framework Target 15.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMES`, `DEFAULTS`, `ES_CATS`, `ES_CAT_LABEL`, `GBF_KEY`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BIOMES` | `['Arid / Desert', 'Semi-arid grassland', 'Tropical forest', 'Coastal / Mangrove', 'Temperate forest', 'Wetlands', 'Agricultural mosaic', 'Marine'];` |
| `rows` | `useMemo(() => s.assets.map(a => ({ ...a, priority: priorityOf(a) })), [s.assets]);` |
| `totalArea` | `s.assets.reduce((x, a) => x + a.areaHa, 0);` |
| `leapAvg` | `(s.leap.locate + s.leap.evaluate + s.leap.assess + s.leap.prepare) / 4;` |
| `pillarAvg` | `(s.pillars.governance + s.pillars.strategy + s.pillars.riskMgmt + s.pillars.metrics) / 4;` |
| `msaRows` | `s.assets.map(a => {` |
| `totalMsaHa` | `msaRows.reduce((x, r) => x + r.msaHa, 0);` |
| `waterRows` | `s.assets.map(a => {` |
| `totalBlue` | `waterRows.reduce((x, r) => x + r.blue, 0);` |
| `totalGreen` | `waterRows.reduce((x, r) => x + r.green, 0);` |
| `totalGrey` | `waterRows.reduce((x, r) => x + r.grey, 0);` |
| `mitTotalPct` | `s.mitigation.avoidPct + s.mitigation.minimisePct + s.mitigation.restorePct + s.mitigation.offsetPct;` |
| `mitRows` | `MITIGATION_HIERARCHY.map((m, i) => {` |
| `haAlloc` | `totalMsaHa * (pct / 100);` |
| `cost` | `haAlloc * m.costPerMsaHa;` |
| `totalMitCost` | `mitRows.reduce((x, r) => x + r.cost, 0);` |
| `credibility` | `mitRows.reduce((x, r) => x + (r.credibility * r.pct / 100), 0);` |
| `refinedServices` | `s.services.map(x => ({ ...x, refined: x.revAtRisk * (esMult[x.cat] ?? 1) }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMES`, `ES_CATS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KBA Proximity Score | `assets_in_or_adjacent_to_KBA / total_assets × 100` | KBA Partnership database + IUCN WDPA | Higher scores indicate greater biodiversity exposure risk; triggers enhanced disclosure obligations under TNFD |
| Ecosystem Service Dependency Score | `weighted avg(ENCORE dependency rating across services)` | ENCORE tool (NCFA/UNEP-WCMC) | Sectors with high dependency (agriculture, food, construction) face material revenue-at-risk if ecosystem serv |
| Biodiversity Impact Driver Count | `COUNT(high-intensity impact drivers per site)` | IPBES driver assessment + site data | Sites with 3+ high-intensity drivers require dedicated biodiversity management plans and TNFD CORE metric disc |
- **Operational site data + KBA/WDPA/IBAT spatial databases + ENCORE sector maps** → LEAP spatial overlay → dependency scoring → impact driver assessment → CORE metrics → **TNFD-compliant biodiversity baseline assessment with CORE disclosure metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP Biodiversity Assessment
**Headline formula:** `nature_risk_score = exposure × dependency × impact_driver_intensity`
**Standards:** ['TNFD Final Recommendations v1.0 (2023)', 'KBA Partnership – Key Biodiversity Areas Criteria', 'IPBES Global Biodiversity Framework – Kunming-Montreal Targets']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`