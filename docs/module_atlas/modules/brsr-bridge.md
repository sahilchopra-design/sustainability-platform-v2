# BRSR Bridge
**Module ID:** `brsr-bridge` · **Route:** `/brsr-bridge` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
India SEBI Business Responsibility and Sustainability Reporting compliance mapping tool covering all 9 BRSR principles, 98 core and leadership indicators, and BRSR Core assurance requirements. Maps BRSR disclosures to GRI, TCFD, and UN SDGs for integrated framework alignment. Tracks year-over-year disclosure progress and BRSR Core KPI trajectories.

> **Business value:** BRSR is India's first mandatory, structured ESG reporting framework and positions Indian companies within the global sustainability disclosure ecosystem. The BRSR Core with limited assurance requirements from FY2024 elevates reporting quality materially; the platform bridge to GRI and TCFD enables Indian issuers to satisfy domestic SEBI requirements while simultaneously meeting international investor expectations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRSR_FIELD_MAP`, `BRSR_SCHEMA`, `Badge`, `BrsrBridgePage`, `Btn`, `CROSSWALK`, `INR_CR_TO_USD_MN`, `KpiCard`, `LS_KEY`, `PIE_COLORS`, `SECTORS`, `Section`, `Slider`, `SortHeader`, `VALIDATION_RULES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seeded` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmt` | `(n) => n == null ? '--' : typeof n === 'number' ? (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString())` |
| `pct` | `(n) => n == null ? '--' : n.toFixed(1) + '%';` |
| `names` | `indiaCompanies.length > 0 ? indiaCompanies.slice(0, 80).map(c => c.company_name \|\| c.name) : [` |
| `sec` | `SECTORS[Math.floor(seeded(i * 13 + 7) * SECTORS.length)];` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `totalRows` | `BRSR_SCHEMA.reduce((s, t) => s + t.rows, 0);` |
| `avgCompleteness` | `BRSR_SCHEMA.reduce((s, t) => s + (t.rows / 1323) * 100, 0) / BRSR_SCHEMA.length;` |
| `crosswalkCoverage` | `(180 / (BRSR_FIELD_MAP.length * 20) * 100);` |
| `cmp` | `typeof v1 === 'number' ? v1 - v2 : String(v1 \|\| '').localeCompare(String(v2 \|\| ''));` |
| `completenessData` | `BRSR_SCHEMA.map(t => ({ name: t.name.replace('brsr_', '').replace('principle', 'P'), companies: t.rows, gap: 1323 - t.rows }));` |
| `unmappedCount` | `BRSR_SCHEMA.reduce((s, t) => s + t.fields.length, 0) - BRSR_FIELD_MAP.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BRSR_FIELD_MAP`, `BRSR_SCHEMA`, `CROSSWALK`, `PIE_COLORS`, `SECTORS`, `TABS`, `VALIDATION_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BRSR Core Completeness | `Core_KPIs_disclosed / 9 × 100` | SEBI BRSR Core | Percentage of 9 BRSR Core KPIs fully disclosed with required assurance |
| Principle Coverage | — | SEBI BRSR framework | Number of 9 BRSR principles with at least one indicator disclosed |
| GRI Cross-reference Count | — | Platform mapping | Number of BRSR indicators with GRI, TCFD, or SDG alignment tags applied |
- **Company ESG data from platform modules** → Map fields to BRSR indicator requirements; score completeness per principle → **BRSR disclosure tables with completeness scores and gap analysis**
- **GRI/TCFD/SDG mapping database** → Cross-reference each BRSR indicator to framework equivalent → **Multi-framework alignment tags enabling single-entry disclosure across BRSR, GRI, and TCFD**

## 5 · Intermediate Transformation Logic
**Methodology:** BRSR compliance completeness scoring
**Headline formula:** `BRSR_score = (Core_disclosed + Leadership_disclosed) / (Core_total + Leadership_total) × 100; Core_completeness = Core_disclosed / 48 × 100`
**Standards:** ['SEBI BRSR Circular (May 2021)', 'SEBI BRSR Core Circular (July 2023)', 'GRI Universal Standards 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).