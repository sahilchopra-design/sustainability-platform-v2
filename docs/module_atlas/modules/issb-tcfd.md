# ISSB S2 / TCFD Disclosure
**Module ID:** `issb-tcfd` · **Route:** `/issb-tcfd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB IFRS S2 Climate-related Disclosures and TCFD Recommendations compliance tracker. Maps 11 TCFD requirements and 30+ ISSB S2 paragraphs with auto-populated disclosure drafts.

> **Business value:** ISSB S2 is mandatory for IFRS-reporting companies across 20+ jurisdictions from 2024. TCFD compliance is required by UK, EU, Singapore, HK, Australia, and others. This module eliminates duplication and ensures coherent cross-framework disclosure with full audit trail.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `Card`, `CompanyAutocomplete`, `Grid`, `HORIZONS`, `Inp`, `KpiCard`, `MultiCheck`, `PHYSICAL_ACUTE`, `PHYSICAL_CHRONIC`, `PILLAR_META`, `PillarCard`, `RiskRow`, `SCENARIOS`, `SECTOR_OPTIONS`, `ScoreBadge`, `SectionHeading`, `Sel`, `Spinner`, `TABS`, `TRANSITION_MARKET`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `initRisks` | `(list) => list.reduce((a,r) => ({...a, [r]:{ likelihood:'3', impact:'3', horizon:'Medium', exposure:'' }}), {});` |
| `total` | `s1+s2+s3; if (!total) return;` |
| `span` | `tgtYear - baseYear \|\| 1;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `HORIZONS`, `PHYSICAL_ACUTE`, `PHYSICAL_CHRONIC`, `PILLAR_META`, `SCENARIOS`, `SECTOR_OPTIONS`, `TABS`, `TRANSITION_MARKET`, `TRANSITION_POLICY`, `TRANSITION_REPUTE`, `TRANSITION_TECH`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Pillars | — | TCFD | Governance, Strategy, Risk Management, Metrics & Targets |
| TCFD Requirements | — | TCFD | Specific recommended disclosures across 4 pillars |
| ISSB S2 Paragraphs | — | ISSB | Para 5-41 covering all climate disclosure requirements |
| Cross-walk Coverage | — | Analysis | ISSB S2 covers 85% of TCFD requirements with enhanced requirements |
- **Governance meeting minutes** → G1/G2 disclosure → **TCFD/ISSB Governance pillar**
- **Climate scenario analysis** → Strategy resilience disclosure → **S3 / Para 14-15**
- **GHG inventory data** → Metrics disclosure → **M1-M3 / Para 29-31**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework disclosure mapping
**Headline formula:** `Completeness = Disclosed_requirements / Total_required_per_framework`
**Standards:** ['ISSB IFRS S2 (2023)', 'TCFD Final Report (2017)', 'TCFD Status Report (2021)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).