# Framework Interoperability
**Module ID:** `framework-interop` · **Route:** `/framework-interop` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Maps disclosure requirements across TCFD, ISSB IFRS S1/S2, ESRS (CSRD), GRI Standards, and CDP frameworks to identify overlaps, gaps, and sequencing opportunities. Enables organisations to build a single disclosure architecture that satisfies multiple frameworks simultaneously, reducing duplication and compliance cost.

> **Business value:** Reduces disclosure duplication by identifying a minimum set of datapoints that simultaneously satisfies TCFD, ISSB, ESRS, GRI, and CDP. Enables sustainability teams to build a single data architecture serving all frameworks and provides a compliance roadmap aligned to regulatory deadlines across jurisdictions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRSR_PRINCIPLES`, `Badge`, `Btn`, `Card`, `FRAMEWORKS`, `FW_IDS`, `INTEROP_MATRIX`, `KPI`, `LS_KEY`, `LS_PORTFOLIO`, `OVERLAP_PAIRS`, `SectionTitle`, `TIMELINE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `FW_IDS` | `FRAMEWORKS.map(f => f.id);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`.replace(/"/g, '""')).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `totalDisclosures` | `FRAMEWORKS.reduce((s, f) => s + f.disclosures, 0);` |
| `mostConnected` | `[...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => b[f]).length - FW_IDS.filter(f => a[f]).length)[0];` |
| `leastCovered` | `[...INTEROP_MATRIX].sort((a, b) => FW_IDS.filter(f => a[f]).length - FW_IDS.filter(f => b[f]).length)[0];` |
| `fwCoverage` | `useMemo(() => Math.round(68 + sRand(seed('fwCov')) * 22), []);` |
| `avg` | `Math.round(dims.reduce((s, v) => s + v, 0) / dims.length);` |
| `topOverlaps` | `OVERLAP_PAIRS.filter(p => p.a === fw.id \|\| p.b === fw.id).sort((a, b) => b.shared - a.shared).slice(0, 5);` |
| `hours` | `Math.round(fw.disclosures * (2.5 + sRand(seed(fw.id + 'effort')) * 4));` |
| `weeks` | `(hours / 40).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BRSR_PRINCIPLES`, `FRAMEWORKS`, `INTEROP_MATRIX`, `TIMELINE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD-to-ISSB Alignment (%) | — | IFRS Foundation mapping table | ISSB IFRS S2 incorporates substantially all TCFD recommendations; residual 13% relates to industry-specific me |
| ESRS-to-ISSB Overlap (%) | — | EFRAG-ISSB interoperability analysis 2023 | Two-thirds of ISSB S2 datapoints are satisfied by ESRS E1 compliance; the gap relates to transition plan granu |
| Unique GRI Requirements | — | GRI Standards 2021 | GRI covers social and economic topics not addressed by TCFD/ISSB/ESRS, including tax, anti-corruption, and sup |
| CDP-to-TCFD Alignment (%) | — | CDP Technical Note 2023 | CDP questionnaire questions map almost entirely to TCFD pillars; residual items relate to water and forests mo |
- **Framework requirement databases (ISSB/ESRS/GRI/CDP)** → Tag requirements by topic and disclosure type, compute Jaccard matrix → **Interoperability coverage heatmap**
- **Organisation disclosure inventory** → Map existing disclosures to framework requirements → **Gap analysis by framework**
- **Regulatory deadline calendar** → Sequence requirements by jurisdiction and mandatory vs voluntary status → **Prioritised disclosure roadmap**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Coverage Matrix
**Headline formula:** `Coverage_ij = |Requirements_i ∩ Requirements_j| / |Requirements_i ∪ Requirements_j|`
**Standards:** ['IFRS S1/S2 (ISSB 2023)', 'ESRS 1/2 + E1-S4-G1 (EFRAG 2023)', 'TCFD Final Recommendations (2017)', 'GRI Universal Standards 2021']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).