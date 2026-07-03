# Transition Risk Taxonomy Browser
**Module ID:** `transition-risk-taxonomy-browser` · **Route:** `/transition-risk-taxonomy-browser` · **Tier:** B (frontend-computed) · **EP code:** EP-CS1 · **Sprint:** CS

## 1 · Overview
Interactive 4-level hierarchical taxonomy with 472 nodes covering 9 transition risk topics, 316 leaf-level assessment points, and 24 reference data sources.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DQ_COLORS`, `TABS`, `TabBar`, `TreeNode`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `levelData` | `useMemo(() => Object.entries(levelCounts).map(([lvl, count]) => ({ level: `L${lvl}`, count })), [levelCounts]);` |
| `sectorOverlay` | `useMemo(() => HIGH_IMPACT_SECTORS.map((sec, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Level 1 Nodes | — | taxonomyTree.js | Carbon, Energy, Policy, Technology, Physical, Nature, Social, Governance, Geopolitical |
| Level 4 Leaves | — | taxonomyTree.js | Deepest assessment points |
| Data Sources | — | REFERENCE_DATA_SOURCES | CDP, SBTi, PCAF, NGFS, IEA, WRI GPPD, etc. |
| Sectors | — | HIGH_IMPACT_SECTORS | 12 NACE high-impact + 5 extended |
| Countries | — | GEOGRAPHIC_REGIONS | Across 12 regions with NDC targets |

## 5 · Intermediate Transformation Logic
**Methodology:** Bottom-up weighted aggregation
**Headline formula:** `ParentScore = Σ(child.score × child.weight) / Σ(child.weight)`
**Standards:** ['PCAF DQ 1-5', 'NGFS Phase 5', 'IPCC AR6', 'EU CSRD ESRS']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).