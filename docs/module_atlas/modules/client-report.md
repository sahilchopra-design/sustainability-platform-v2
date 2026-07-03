# Client Sustainability Report Generator
**Module ID:** `client-report` · **Route:** `/client-report` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automated sustainability report generation engine producing TCFD-aligned, SFDR-compliant, and CSRD-ready client reports. Combines portfolio analytics, narrative generation, chart exports, and regulatory appendices into formatted PDF-ready output packages.

> **Business value:** Report completeness threshold: 80% data coverage triggers auto-generate. SFDR PAI table auto-populates 18 mandatory indicators from portfolio data. CSRD ESRS coverage tracks E1 through G1 disclosure requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALIGN_SCORE`, `ALL_SECTIONS`, `BADGE`, `COMPLIANCE`, `EXEC_SUMMARY`, `FRAMEWORKS`, `HOLDINGS`, `PIE_COLORS`, `PORTFOLIOS`, `SECTOR_PIE`, `TRISK_BAR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_SECTIONS`, `COMPLIANCE`, `FRAMEWORKS`, `HOLDINGS`, `PIE_COLORS`, `PORTFOLIOS`, `SECTOR_PIE`, `TRISK_BAR`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Report Completeness Score | `Filled sections / total sections` | Platform | Percentage of report sections with sufficient data for auto-population |
| SFDR PAI Coverage | `Populated PAI indicators / 18 mandatory` | SFDR Annex I | Fraction of mandatory SFDR PAI indicators with data for auto-fill |
| CSRD ESRS Coverage | `Disclosed DRs / required DRs` | CSRD ESRS | Fraction of required ESRS disclosure requirements addressed in report |
| Report Generation Time | `Template render + data bind` | System metric | End-to-end time to generate complete report package |
- **Portfolio analytics engine** → Live data → data binding layer → report sections → **Auto-populated report content**
- **Regulatory template library** → SFDR/CSRD/TCFD templates → formatted output → **Compliance-ready report package**

## 5 · Intermediate Transformation Logic
**Methodology:** Templated report assembly with data binding
**Headline formula:** `Report = Template(Section_i → DataBinding_i) ∀ i; Completeness = Σ(FilledSections) / TotalSections`
**Standards:** ['TCFD Recommendations 2017', 'SFDR Level 2 RTS Annex I', 'CSRD ESRS E1/S1/G1', 'GRI Universal Standards 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).