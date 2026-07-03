# ESRS Datapoint Navigator
**Module ID:** `esrs-datapoint-navigator` · **Route:** `/esrs-datapoint-navigator` · **Tier:** B (frontend-computed) · **EP code:** EP-DH1 · **Sprint:** DH

## 1 · Overview
Comprehensive navigator for all 1,144 ESRS mandatory and voluntary datapoints across E1-E5, S1-S4, and G1 topic standards, mapped to materiality assessment outcomes, data collection complexity ratings, and phased reporting requirements. Supports first-year CSRD reporters in scoping their disclosure obligations under EU Delegated Regulation 2023/2772.

> **Business value:** Used by CSRD reporting managers and external auditors to scope disclosure obligations, plan data collection programmes, and track ESRS compliance readiness.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_PHASES`, `CROSSWALK_MAP`, `E1_DATAPOINTS`, `E2_DATAPOINTS`, `E3_DATAPOINTS`, `E4_DATAPOINTS`, `E5_DATAPOINTS`, `ESRS2_DATAPOINTS`, `ESRS_STANDARDS`, `G1_DATAPOINTS`, `OMNIBUS_CHANGES`, `S1_DATAPOINTS`, `STATUS_COLORS`, `STATUS_OPTIONS`, `STATUS_TEXT`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDatapoints` | `useMemo(() => ESRS_STANDARDS.reduce((s,e)=>s+e.datapoints,0), []);` |
| `materialDatapoints` | `useMemo(() => ESRS_STANDARDS.filter((_,i)=>materialTopics[i]).reduce((s,e)=>s+e.datapoints,0), [materialTopics]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_PHASES`, `COLORS`, `CROSSWALK_MAP`, `E1_DATAPOINTS`, `E2_DATAPOINTS`, `E3_DATAPOINTS`, `E4_DATAPOINTS`, `E5_DATAPOINTS`, `ESRS2_DATAPOINTS`, `ESRS_STANDARDS`, `G1_DATAPOINTS`, `OMNIBUS_CHANGES`, `S1_DATAPOINTS`, `STATUS_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mandatory Datapoints in Scope | `COUNT(datapoints | materiality_flag = TRUE OR always_mandatory = TRUE)` | EFRAG ESRS Set 1 Annex | Defines minimum reporting scope; typical large-cap scope is 300–600 mandatory datapoints in year one. |
| Data Collection Complexity Score | `weighted average of collection_effort across in-scope datapoints` | Internal assessment framework | Score >3.5 indicates significant new data infrastructure investment required; used to prioritise gap remediati |
| Phase-In Coverage Rate | `phasedin_datapoints_available / phasedin_datapoints_total × 100` | ESRS 1 Annex C phase-in schedule | Tracks progress against the 3-year phase-in plan; <50% in year 2 signals collection risk. |
- **EFRAG ESRS Set 1 Annex → datapoint list** → DMA outcome → obligation filter → phase-in schedule mapping → **Scoped disclosure obligation register with collection complexity ratings**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS Datapoint Obligation Mapping
**Headline formula:** `obligation_weight = mandatory_flag × materiality_relevance × phase-in_discount`
**Standards:** ['EU Delegated Regulation 2023/2772', 'ESRS 1 – General Requirements', 'ESRS 2 – General Disclosures']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).