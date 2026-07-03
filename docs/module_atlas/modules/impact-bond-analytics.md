# Impact Bond Analytics
**Module ID:** `impact-bond-analytics` · **Route:** `/impact-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ6 · **Sprint:** CQ

## 1 · Overview
15 impact bonds (SIBs, DIBs, sustainability bonds) with SROI calculation, outcome measurement, and additionality assessment.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `SROI_DIMS`, `TABS`, `TYPE_COLORS`, `TYPE_DIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `types` | `[...new Set(BONDS.map(b => b.type))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `SROI_DIMS`, `TABS`, `TYPE_COLORS`, `TYPE_DIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Impact Bonds | — | Market | SIBs, DIBs, and sustainability bonds |
| Avg SROI | — | Impact reports | $1 invested generates $3.2 of social value |

## 5 · Intermediate Transformation Logic
**Methodology:** Social Return on Investment
**Headline formula:** `SROI = SocialValue_created / Investment_amount`
**Standards:** ['IMP', 'GIIN']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).