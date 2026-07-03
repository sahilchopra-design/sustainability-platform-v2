# ISSB Materiality Assessment
**Module ID:** `issb-materiality` · **Route:** `/issb-materiality` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB S1 materiality assessment applying enterprise value materiality test. Covers the materiality determination process, investor-focused assessment, connectivity between financial and sustainability information.

> **Business value:** Materiality determination is the gating step for all ISSB disclosures. A robust, documented process reduces legal risk and focuses reporting effort on what matters to investors. This module enables systematic, auditable materiality assessments aligned with ISSB S1.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CAT_COLORS`, `ISSB_S2_REQUIREMENTS`, `ISSB_TCFD_MAP`, `IssbMaterialityPage`, `KpiCard`, `LS_OVERRIDES`, `LS_PORT`, `SASB_MATERIALITY`, `SECTORS`, `Section`, `TCFD_RECS`, `TOPICS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `pct` | `v => `${(v * 100).toFixed(1)}%`;` |
| `enriched` | `useMemo(() => holdings.map(h => {` |
| `s2Status` | `ISSB_S2_REQUIREMENTS.map(req => {` |
| `discScore` | `+((met * 100 + partial * 50) / s2Status.length).toFixed(1);` |
| `totalW` | `enriched.reduce((s, h) => s + h.weight, 0) \|\| 1;` |
| `weightedTopics` | `enriched.reduce((s, h) => s + h.materialTopics * (h.weight / totalW), 0);` |
| `avgTopics` | `enriched.length ? enriched.reduce((s, h) => s + h.materialTopics, 0) / enriched.length : 0;` |
| `avgCompliance` | `enriched.length ? enriched.reduce((s, h) => s + h.disclosureScore, 0) / enriched.length : 0;` |
| `sectorsCovered` | `[...new Set(enriched.map(h => h.mappedSector))].length;` |
| `envT` | `enriched.reduce((s, h) => s + h.envTopics, 0) / (enriched.length \|\| 1);` |
| `socT` | `enriched.reduce((s, h) => s + h.socTopics, 0) / (enriched.length \|\| 1);` |
| `govT` | `enriched.reduce((s, h) => s + h.govTopics, 0) / (enriched.length \|\| 1);` |
| `avgCov` | `enriched.reduce((s, h) => s + h.dataCoverage, 0) / (enriched.length \|\| 1);` |
| `highSector` | `Object.entries(SASB_MATERIALITY.matrix).sort((a, b) => b[1].length - a[1].length)[0];` |
| `avgDisc` | `enriched.reduce((s, h) => s + h.disclosureScore, 0) / (enriched.length \|\| 1);` |
| `totalW` | `enriched.reduce((s, h) => s + h.weight, 0) \|\| 1;` |
| `s2Agg` | `useMemo(() => ISSB_S2_REQUIREMENTS.map(req => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ISSB_S2_REQUIREMENTS`, `TCFD_RECS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Material Topics | — | Assessment | Varies by sector and business model |
| Test Standard | — | ISSB S1 | Single materiality, investor perspective only |
| Connectivity | — | ISSB S1 Para 19 | Required linkage to financial statements |
- **Business model analysis** → Sustainability risk identification → **Material topic longlist**
- **Investor consultation** → Significance assessment → **Material topic shortlist**
- **Material topics** → Financial impact linkage → **Connectivity to financial statements**

## 5 · Intermediate Transformation Logic
**Methodology:** Enterprise value materiality test
**Headline formula:** `Material = significant_impact_on_enterprise_value (actual or reasonably expected)`
**Standards:** ['ISSB IFRS S1 (2023)', 'IASB Materiality Practice Statement']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).