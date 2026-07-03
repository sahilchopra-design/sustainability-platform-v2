# XBRL Climate Taxonomy Mapper
**Module ID:** `xbrl-climate-taxonomy` · **Route:** `/xbrl-climate-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-CR4 · **Sprint:** CR

## 1 · Overview
ISSB S2 XBRL taxonomy (200+ tags) and ESRS E1 ESEF tags. Tag mapping tool and filing preview.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `E1_CATEGORIES`, `MAPPED_STATUS`, `MAP_COLORS`, `S2_CATEGORIES`, `TABS`, `TAG_SAMPLES`, `VALIDATION_RESULTS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalS2` | `S2_CATEGORIES.reduce((s,c)=>s+c.tags,0);` |
| `totalE1` | `E1_CATEGORIES.reduce((s,c)=>s+c.tags,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `E1_CATEGORIES`, `MAPPED_STATUS`, `MAP_COLORS`, `S2_CATEGORIES`, `TABS`, `TAG_SAMPLES`, `VALIDATION_RESULTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ISSB S2 Tags | — | IFRS Foundation | Machine-readable climate disclosure tags |
| ESRS E1 Tags | — | EFRAG | European electronic format tags |

## 5 · Intermediate Transformation Logic
**Methodology:** Taxonomy tag mapping
**Headline formula:** `Match = PlatformMetric → XBRL_Tag using semantic matching`
**Standards:** ['ISSB XBRL Taxonomy', 'ESRS ESEF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).