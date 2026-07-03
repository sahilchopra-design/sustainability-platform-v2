# DME ML Materiality
**Module ID:** `dme-ml-materiality` · **Route:** `/dme-ml-materiality` · **Tier:** B (frontend-computed) · **EP code:** EP-U9 · **Sprint:** U-extended

## 1 · Overview
NLP-driven double materiality assessment using regulatory filings, news feeds, and stakeholder data to identify financially material and impact-material ESG topics. Applies TF-IDF and BERT sentence embeddings for topic clustering, then maps clusters to ESRS/ISSB topic taxonomy. Outputs a ranked materiality heatmap and audit-ready evidence log.

> **Business value:** Used by sustainability managers and CSRD reporting officers to systematically identify and evidence material topics, replacing manual stakeholder workshop processes with auditable ML-assisted outputs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLUSTERS`, `DRIFT_LOG`, `ENTITIES`, `FEATURES`, `KpiCard`, `LDA_TOPICS`, `MODELS`, `REGIONS`, `RETRAINING_LOG`, `SECTORS`, `Section`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Overview','LDA Topics','K-Means Clusters','Classification','Anomaly Detection','Feature Importance','Threshold Opt.','Double Materiality','Ensemble ` |
| `seeds` | `[hashStr(entity.id+'cluster'), hashStr(entity.sector+'k'+k)];` |
| `entityAssignments` | `useMemo(()=>ENTITIES.map(e=>({...e,cluster:clusterAssign(e,clusterK)})),[clusterK]);` |
| `avgMat` | `members.reduce((s,e)=>s+e.ml_materiality,0)/n;` |
| `avgEsg` | `members.reduce((s,e)=>s+e.esg_score,0)/n;` |
| `sse` | `members.reduce((s,e)=>s+(e.ml_materiality-avgMat)**2,0);` |
| `ldaDocTopics` | `useMemo(()=>ENTITIES.map(e=>{` |
| `raw` | `LDA_TOPICS.map((_,ti)=>sr(h*7+ti*13));` |
| `sum` | `raw.reduce((a,b)=>a+b,0)\|\|1;` |
| `anomalyFlagged` | `useMemo(()=>ENTITIES.filter(e=>Math.abs(e.anomaly_score)>anomalyThreshold),[anomalyThreshold]);` |
| `predClass` | `noise>0.85?(trueClass+1)%3:trueClass;` |
| `precision` | `positives>0?tp/positives:1;` |
| `recall` | `(tp+fn)>0?tp/(tp+fn):0;` |
| `trend` | `sr(h*7+q)*20-10;` |
| `score` | `Math.max(0,Math.min(100,base+trend));` |
| `sectorBenchmarks` | `useMemo(()=>SECTORS.map(sec=>{` |
| `scores` | `[...members.map(e=>e.ml_materiality)].sort((a,b)=>a-b);` |
| `avg` | `scores.reduce((s,v)=>s+v,0)/n;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTERS`, `FEATURES`, `LDA_TOPICS`, `MODELS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Materiality Score | `α·fin_materiality + (1-α)·impact_materiality` | TF-IDF corpus + stakeholder survey | Topics scoring >60 are considered material for ESRS/ISSB disclosure; topics >80 warrant standalone section tre |
| Topic Coverage Rate | `ESRS_topics_identified / ESRS_topics_total × 100` | ESRS 1 Appendix A topic list | Measures completeness of the materiality scan against all 84 ESRS sub-topics; <70% signals gaps in data inputs |
| Evidence Confidence | `n_sources_corroborating / n_sources_total` | Document corpus metadata | Low confidence (<0.4) topics should be reviewed manually before filing; high confidence (>0.8) can be disclose |
- **Regulatory filings (10-K, annual report PDFs) → text corpus** → TF-IDF vectorisation → BERT clustering → ESRS topic mapping → **Materiality score per ESRS sub-topic**

## 5 · Intermediate Transformation Logic
**Methodology:** TF-IDF + BERT Double Materiality
**Headline formula:** `score = α·financial_materiality + (1-α)·impact_materiality`
**Standards:** ['CSRD Article 29a', 'ESRS 1 IRO Assessment', 'ISSB S1 Materiality']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).