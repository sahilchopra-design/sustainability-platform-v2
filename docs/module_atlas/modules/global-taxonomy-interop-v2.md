# Global Taxonomy Interoperability v2
**Module ID:** `global-taxonomy-interop-v2` · **Route:** `/global-taxonomy-interop-v2` · **Tier:** B (frontend-computed) · **EP code:** EP-MISC · **Sprint:** Platform

## 1 · Overview
Advanced cross-taxonomy interoperability analytics comparing EU Taxonomy, ICMA Green Bond Principles, ASEAN Taxonomy, UK GTF, Singapore-Asia Taxonomy, and China Green Bond Standard across activity definitions, DNSH principles, and transition activity treatment. Quantifies cross-taxonomy alignment scores and identifies mutual recognition pathways.

> **Business value:** Used by green bond structurers, multi-jurisdictional issuers, and sustainable finance regulators to navigate taxonomy fragmentation and structure dual-label green instruments for global distribution.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASEANTab`, `ASEAN_TIERS`, `ArbitrageLabTab`, `CANADA_TRANSITION`, `CHINA_CATALOGUE`, `CONFLICTS`, `CROSSWALK_ACTIVITIES`, `CROSSWALK_MATRIX`, `CanadaTab`, `ChinaTab`, `ConflictResolverTab`, `CosineSimilarityTab`, `CrosswalkMatrixTab`, `EUBaselineTab`, `HarmonizationGapTab`, `JAPAN_ROADMAP`, `JURISDICTION_WEIGHTS`, `JapanTab`, `KpiCard`, `LATAMTab`, `LATAM_CLUSTER`, `MLEngineTab`, `ML_MODELS`, `MultiJurStressTab`, `OverviewTab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `(v, d=1) => (Number.isFinite(v) ? v.toFixed(d) + '%' : '—');` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalConf` | `CROSSWALK_MATRIX.reduce((s, c) => s + c.confidence, 0);` |
| `avgConf` | `totalCells > 0 ? totalConf / totalCells : 0;` |
| `multiLabelPct` | `PORTFOLIO_ISSUERS.length > 0 ? (PORTFOLIO_ISSUERS.filter(p => p.multiLabel).length / PORTFOLIO_ISSUERS.length) * 100 : 0;` |
| `totalActivities` | `TAXONOMIES.reduce((s, t) => s + t.activities, 0);` |
| `gapScore` | `totalCells > 0 ? ((notCov + partial * 0.5) / totalCells) * 100 : 0;` |
| `rows` | `CROSSWALK_ACTIVITIES.map(act => {` |
| `taxByActivities` | `useMemo(() => TAXONOMIES.map(t => ({ name:t.id, activities:t.activities, color:t.color })), []);` |
| `confBySource` | `useMemo(() => TAXONOMIES.map(t => {` |
| `rows` | `CROSSWALK_MATRIX.filter(c => c.taxonomy === t.id && c.status !== 'N/A');` |
| `avg` | `rows.length > 0 ? rows.reduce((s, c) => s + c.confidence, 0) / rows.length : 0;` |
| `adoption` | `AMS.map((c, i) => ({ country:c, foundation: sr(i*11) > 0.3 ? 1 : 0, plus: sr(i*11+1) > 0.6 ? 1 : 0 }));` |
| `catData` | `CHINA_CATALOGUE.map(c => ({ name: c.cat.split(' ')[0], activities: c.activities }));` |
| `capexTotal` | `JAPAN_ROADMAP.reduce((s, r) => s + r.capexJPY, 0);` |
| `totalActivities` | `LATAM_CLUSTER.reduce((s, c) => s + c.activities, 0);` |
| `conflictActs` | `CONFLICTS.map(c => c.activity);` |
| `passConf` | `cell.confidence >= confidenceFloor \|\| cell.status === 'Not Covered' \|\| cell.status === 'N/A';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMS`, `ASEAN_TIERS`, `CANADA_TRANSITION`, `CHINA_CATALOGUE`, `CONFLICTS`, `CROSSWALK_ACTIVITIES`, `EU_OBJECTIVES`, `EU_STEPS`, `JAPAN_ROADMAP`, `LATAM_CLUSTER`, `ML_MODELS`, `QUANTIFIED_CONFLICTS`, `REG_TOKENS`, `SA_IFSCA`, `SEC_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cross-Taxonomy Alignment Score | `Σ(matched_activities) / total_activities × criteria_similarity` | Taxonomy TSC comparison matrix | EU-ASEAN alignment ~55%; EU-UK ~85%; low scores indicate significant investor confusion risk in cross-border g |
| Transition Activity Divergence Index | `1 − Jaccard_similarity(transition_activities_A, transition_activities_B)` | Taxonomy transition activity lists | High divergence (>0.6) means transition activities acceptable in one taxonomy are ineligible in another; criti |
| DNSH Mutual Recognition Rate | `DNSH_conditions_equivalent / DNSH_conditions_total × 100` | Legal/regulatory analysis | Proportion of DNSH conditions in taxonomy B that achieve equivalent environmental protection to EU DNSH; used  |
- **EU/ASEAN/UK/MAS/China taxonomy documentation → activity/TSC matrices** → Activity matching algorithm → criteria similarity scoring → DNSH equivalence analysis → **Cross-taxonomy alignment report for green bond structuring and investor disclosure**

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-Taxonomy Alignment Scoring
**Headline formula:** `alignment_score = Σ(activity_match_i × criteria_similarity_i × DNSH_equivalence_i) / n_activities`
**Standards:** ['EU Taxonomy Regulation 2020/852', 'ASEAN Taxonomy for Sustainable Finance v2 (2023)', 'MAS Singapore-Asia Taxonomy 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).