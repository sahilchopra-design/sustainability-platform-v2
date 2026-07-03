# GRI Alignment Checker
**Module ID:** `gri-alignment` · **Route:** `/gri-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Automates GRI Standards disclosure compliance checking across GRI 1 (Foundation), GRI 2 (General Disclosures), GRI 3 (Material Topics), and topic-specific standards (GRI 300/400 series). Identifies disclosure gaps, checks required content elements, and maps GRI disclosures to equivalent ISSB, ESRS, and TCFD requirements for dual-reporting efficiency.

> **Business value:** Reduces GRI compliance effort by automating disclosure completeness checking, guides reporters from 'with reference' to 'in accordance' status, and maximises dual-reporting efficiency by identifying GRI disclosures that simultaneously satisfy ISSB, ESRS, and TCFD requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_TOPIC_STDS`, `Badge`, `Btn`, `CATEGORIES`, `CAT_COLORS`, `FRAMEWORKS`, `GRI_BRSR_MAP`, `GRI_CSRD_MAP`, `GRI_ISSB_MAP`, `GRI_STANDARDS`, `GriAlignmentPage`, `INTEROP_DATA`, `KpiCard`, `LS_PORT`, `SECTORS`, `Section`, `TOTAL_DISCLOSURES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `TOTAL_DISCLOSURES` | `ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);` |
| `FRAMEWORKS` | `['GRI', 'ISSB/SASB', 'CSRD/ESRS', 'TCFD', 'SFDR'];` |
| `INTEROP_DATA` | `ALL_TOPIC_STDS.map(std => {` |
| `enriched` | `useMemo(() => holdings.map(h => {` |
| `applicableStds` | `ALL_TOPIC_STDS.filter((_, i) => sr(s, i + 10) > 0.25);` |
| `totalDisc` | `applicableStds.reduce((sum, std) => sum + std.disclosures, 0);` |
| `availDisc` | `applicableStds.reduce((sum, std) => sum + Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75)), 0);` |
| `coverage` | `totalDisc > 0 ? +((availDisc / totalDisc) * 100).toFixed(1) : 0;` |
| `stdBreakdown` | `applicableStds.map(std => {` |
| `avail` | `Math.round(std.disclosures * (0.2 + sr(s, hashStr(std.id)) * 0.75));` |
| `topGaps` | `stdBreakdown.filter(st => st.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).map(st => st.name);` |
| `avgStds` | `enriched.length ? (enriched.reduce((s, h) => s + h.applicableStds, 0) / enriched.length).toFixed(1) : 0;` |
| `totalReqDisc` | `ALL_TOPIC_STDS.reduce((s, t) => s + t.disclosures, 0) + GRI_STANDARDS.universal.reduce((s, u) => s + u.disclosures, 0);` |
| `avgDataAvail` | `enriched.length ? (enriched.reduce((s, h) => s + h.coverage, 0) / enriched.length).toFixed(1) : 0;` |
| `fullAlign` | `enriched.length ? (enriched.filter(h => h.fullAlignment).length / enriched.length * 100).toFixed(1) : 0;` |
| `envAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.envStds, 0) / enriched.length).toFixed(1) : 0;` |
| `socAvg` | `enriched.length ? (enriched.reduce((s, h) => s + h.socStds, 0) / enriched.length).toFixed(1) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `FRAMEWORKS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GRI In-Accordance Compliance (%) | — | GRI content index review | Share of material topic GRI disclosures meeting all required content elements for 'in accordance' status; typi |
| Materiality Coverage (%) | — | GRI 3 material topics | Proportion of material topics identified through the double materiality assessment that are addressed by a GRI |
| GRI-ISSB Mapped Disclosures | — | ISSB-GRI collaboration mapping | Share of GRI 2 and topic-specific disclosures that also satisfy an ISSB S1/S2 or ESRS requirement, enabling du |
| Quantitative Metric Coverage (%) | — | GRI disclosure checklist | Percentage of GRI disclosures with quantitative metrics (vs qualitative-only); higher quantitative coverage su |
- **Sustainability report disclosure inventory** → Map each disclosure to GRI Standard and disclosure number, check content elements → **GRI completeness scorecard**
- **Double materiality assessment results** → Cross-reference material topics against available GRI topic standards → **Materiality coverage gap analysis**
- **ISSB/ESRS/TCFD requirement databases** → Map GRI disclosures to equivalent cross-framework requirements → **Dual-use disclosure efficiency report**

## 5 · Intermediate Transformation Logic
**Methodology:** GRI Disclosure Completeness Score
**Headline formula:** `DCS = Σ_k (Complete_k × w_k) / Σ_k w_k × 100`
**Standards:** ['GRI Universal Standards 2021 (GRI 1/2/3)', 'GRI 300 Environmental Standards', 'GRI 400 Social Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).