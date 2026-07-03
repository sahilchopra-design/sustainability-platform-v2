# Taxonomy ML Classifier
**Module ID:** `taxonomy-ml-classifier` · **Route:** `/taxonomy-ml-classifier` · **Tier:** B (frontend-computed) · **EP code:** EP-DI4 · **Sprint:** DI

## 1 · Overview
ML-powered EU Taxonomy NACE activity classifier that maps NACE codes to eligible Taxonomy activities, automates DNSH screening criteria checking, and scores substantial contribution threshold compliance. Trained on the EU Taxonomy Compass dataset covering 67 climate mitigation activities across 6 environmental objectives.

> **Business value:** Used by portfolio managers, sustainability controllers, and SFDR/Taxonomy report authors to automate the complex NACE-to-activity mapping process and generate audit-ready Taxonomy alignment KPIs.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AB_MODELS`, `AB_TRAFFIC`, `AUDIT_LOG`, `AbTestingTab`, `AutoTagTab`, `BatchTab`, `CALIBRATION_BINS`, `CalibrationTab`, `Card`, `ConceptDriftTab`, `ConfusionMatrixTab`, `DNSH_CRITERIA`, `DRIFT_METRICS`, `DRIFT_WINDOWS`, `DnshTab`, `DriftTab`, `EnsembleTab`, `FEATURES`, `FEATURE_CATEGORIES`, `FRAMEWORKS`, `FeatImpTab`, `FeatureEngTab`, `GovernanceTab`, `ISSUERS`, `KpiCard`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `FEATURE_CATEGORIES` | `['Financial', 'Emissions', 'Governance', 'Text/NLP', 'Sector/NACE', 'Geographic'];` |
| `regions` | `['EU-DE', 'EU-FR', 'EU-NL', 'EU-IT', 'EU-ES', 'EU-SE', 'EU-FI', 'EU-DK', 'EU-PL', 'EU-IE'];` |
| `rev` | `500 + sr(i + 1) * 45000;` |
| `emis` | `sector === 'Utilities' ? 180 + sr(i + 2) * 400 : sector === 'Industrials' ? 80 + sr(i + 3) * 220 : 15 + sr(i + 4) * 90;` |
| `align` | `sr(i + 5) * 0.85 + (sector === 'Utilities' ? 0.1 : 0);` |
| `conf` | `0.55 + sr(i + 6) * 0.4;` |
| `_TAX_ACT_MAP` | `Object.fromEntries(EU_TAXONOMY_ACTIVITIES.map(a => [a.activity_name, a]));` |
| `TSC_THRESHOLDS` | `NACE_ACTIVITIES.slice(0, 12).map((a, i) => ({` |
| `missingData` | `useMemo(() => [...FEATURES].sort((a, b) => b.missing - a.missing).slice(0, 12), []);` |
| `sectors` | `useMemo(() => ['ALL', ...Array.from(new Set(ISSUERS.map(i => i.sector)))], []);` |
| `threshold` | `confThreshold / 100;` |
| `revSum` | `filteredIssuers.reduce((a, b) => a + b.revenue, 0);` |
| `alignedRev` | `aligned.reduce((a, b) => a + b.revenue * b.aligned, 0);` |
| `total` | `Object.values(ensembleWeights).reduce((a, b) => a + b, 0);` |
| `lgb` | `clamp(iss.aligned + (sr(hashStr(iss.id) + 1) - 0.5) * 0.08, 0, 1);` |
| `blended` | `(xgb * ensembleWeights.xgb + lgb * ensembleWeights.lgb + rf * ensembleWeights.rf + nn * ensembleWeights.nn) / w;` |
| `predLo` | `i / bins, predHi = (i + 1) / bins;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AB_MODELS`, `AB_TRAFFIC`, `DNSH_CRITERIA`, `DRIFT_WINDOWS`, `FEATURES`, `FEATURE_CATEGORIES`, `FRAMEWORKS`, `METRIC_THRESHOLDS`, `MODELS`, `NACE_ACTIVITIES`, `NLP_DOCUMENTS`, `TAB_LABELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Taxonomy Eligibility Rate | `eligible_revenue / total_revenue × 100` | EU Taxonomy Compass + company NACE codes | Proportion of revenues from NACE activities that are listed in the Taxonomy; does not imply alignment. |
| Taxonomy Alignment Rate | `aligned_revenue / total_revenue × 100` | DNSH screening + SC threshold assessment | Subset of eligible revenue that also meets SC thresholds and passes all DNSH checks; the key reported KPI unde |
| DNSH Pass Rate | `activities_DNSH_pass / activities_eligible × 100` | Technical Screening Criteria per activity | Proportion of eligible activities passing all 6 DNSH criteria; low rates indicate environmental risk exposure  |
- **Company NACE codes → EU Taxonomy Compass activity list** → ML classifier → SC threshold scoring → DNSH criteria check → **Taxonomy KPIs: eligibility %, alignment %, CapEx/OpEx breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** NACE-to-Taxonomy Activity Classification
**Headline formula:** `eligibility_score = P(eligible | NACE_code) × SC_threshold_score × DNSH_pass_rate`
**Standards:** ['EU Taxonomy Regulation 2020/852', 'Climate Delegated Act 2021/2139', 'EU Taxonomy Compass Dataset']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).