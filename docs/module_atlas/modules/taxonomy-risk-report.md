# Taxonomy Risk Report
**Module ID:** `taxonomy-risk-report` · **Route:** `/taxonomy-risk-report` · **Tier:** B (frontend-computed) · **EP code:** EP-CS5 · **Sprint:** CS

## 1 · Overview
Report generator with executive summary, entity-level reports, comparative analysis, regulatory mapping, and multi-format export.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `ENTITIES`, `RATING_COLORS`, `RatingBadge`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ENTITIES` | `['Shell plc', 'BP plc', 'TotalEnergies', 'Enel SpA', 'NextEra Energy', 'Rio Tinto', 'ArcelorMittal', 'HeidelbergCement', 'Maersk', 'Deutsche Bank'].ma` |
| `overall` | `Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, TAXONOMY_TREE.length));` |
| `portfolioAvg` | `useMemo(() => Math.round(ENTITIES.reduce((s, e) => s + e.overall, 0) / Math.max(1, ENTITIES.length)), []);` |
| `l1PortfolioScores` | `useMemo(() => TAXONOMY_TREE.map(t => ({` |
| `radarData` | `useMemo(() => TAXONOMY_TREE.map(t => {` |
| `regData` | `useMemo(() => Object.entries(REGULATORY_REQUIREMENTS).map(([geo, req]) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Export Formats | — | Engine | PDF, Excel, JSON, XBRL |

## 5 · Intermediate Transformation Logic
**Methodology:** Report template engine
**Headline formula:** `Auto-populates from assessment data with regulatory framework mapping`
**Standards:** ['TCFD', 'ISSB S2', 'CSRD']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).