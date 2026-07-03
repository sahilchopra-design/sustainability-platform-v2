# Disclosure Adequacy Analyzer
**Module ID:** `disclosure-adequacy-analyzer` · **Route:** `/disclosure-adequacy-analyzer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated gap analysis of sustainability disclosures against framework requirements including CSRD/ESRS, GRI, TCFD, SFDR, and ISSB/IFRS S1-S2. Each disclosure element is scored against required, recommended, and voluntary criteria. Gap reports prioritise missing disclosures by regulatory materiality and deadline.

> **Business value:** Prevents regulatory filing gaps by systematically identifying undisclosed mandatory elements before submission deadlines. Prioritised gap reports help disclosure teams allocate limited time and resources to the highest-risk missing items first.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_LEVELS`, `ENTITIES`, `ENTITY_NAMES`, `FRAMEWORKS`, `FRAMEWORK_LABELS`, `IMPROVEMENT_TIPS`, `JURISDICTIONS`, `JUR_MANDATORY`, `KpiCard`, `MiniBar`, `REPORT_TYPES`, `SECTORS`, `ScoreBadge`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorIdx` | `Math.floor(sr(i * 7) * 12);` |
| `jurIdx` | `Math.floor(sr(i * 11) * 12);` |
| `reportTypeIdx` | `Math.floor(sr(i * 13) * 4);` |
| `assuranceIdx` | `Math.floor(sr(i * 17) * 3);` |
| `overallScore` | `Math.round(FRAMEWORKS.reduce((s, f) => s + frameworkScores[f], 0) / FRAMEWORKS.length);` |
| `marketCapB` | `+(sr(i * 23) * 200 + 0.5).toFixed(1);` |
| `dataQualityScore` | `Math.round(sr(i * 29) * 70 + 25);` |
| `disclosureYear` | `2021 + Math.floor(sr(i * 31) * 3);` |
| `trajectory3yr` | `+(sr(i * 37) * 20 - 5).toFixed(1);` |
| `avgScore` | `filtered.length ? (filtered.reduce((s, e) => s + e.overallScore, 0) / filtered.length).toFixed(1) : '0';` |
| `frameworkCoverage` | `useMemo(() => FRAMEWORKS.map(f => ({` |
| `sectorLeaders` | `useMemo(() => SECTORS.map(s => {` |
| `sorted` | `[...ents].sort((a, b) => b.overallScore - a.overallScore);` |
| `jurMandatoryMatrix` | `useMemo(() => JURISDICTIONS.map(jur => {` |
| `complianceScores` | `mandatoryFwks.map(f => {` |
| `avg` | `ents.length ? ents.reduce((s, e) => s + e.frameworkScores[f], 0) / ents.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_LEVELS`, `FRAMEWORKS`, `JURISDICTIONS`, `REPORT_TYPES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESRS Mandatory Coverage | — | ESRS requirement database vs. disclosure text | Share of ESRS-mandatory disclosure requirements addressed in the current sustainability statement |
| TCFD Coverage | — | TCFD recommendation checklist | Share of 11 TCFD recommended disclosures with substantive content |
| GRI Topic Coverage | — | GRI Standards index | Count of applicable GRI topic standards with at least partial disclosure |
| Open Mandatory Gaps | — | Gap engine | Count of mandatory disclosure requirements with no matching content identified |
- **Framework requirement databases (ESRS, GRI, TCFD, IFRS S1/S2)** → Requirement extraction and classification by mandatory / recommended / voluntary → **Requirement inventory with deadline and regulatory penalty metadata**
- **Sustainability report text (PDF, XBRL, or structured input)** → NLP classification to match disclosure text against requirement items → **Coverage matrix with confidence scores per requirement**
- **Gap register** → Priority ranking by regulatory mandatory status and filing deadline → **Remediation task list with owner assignment and due date**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Score
**Headline formula:** `DCS = Disclosed Mandatory Items / Total Mandatory Items × 100`
**Standards:** ['ESRS 2 Omnibus', 'GRI Universal Standards 2021', 'IFRS S1/S2 (2023)', 'TCFD 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).