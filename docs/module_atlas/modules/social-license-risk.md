# Social License Risk Engine
**Module ID:** `social-license-risk` · **Route:** `/social-license-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CO2 · **Sprint:** CO

## 1 · Overview
15 projects with community benefit agreement tracking, FPIC compliance, and protest/litigation risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FPIC_COLORS`, `FPIC_STATUS`, `PROJECTS`, `STAKEHOLDERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectors` | `[...new Set(PROJECTS.map(p => p.sector))];` |
| `avgSL` | `filtered.length ? Math.round(filtered.reduce((s, p) => s + p.slScore, 0) / filtered.length) : 0;` |
| `totalProtests` | `filtered.reduce((s, p) => s + p.protests, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPIC_COLORS`, `FPIC_STATUS`, `PROJECTS`, `STAKEHOLDERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Projects | — | Portfolio | With community impact assessments |
| Avg Timeline Delay | — | Historical | Delay from social opposition |

## 5 · Intermediate Transformation Logic
**Methodology:** Social license risk scoring
**Headline formula:** `SocialRisk = 0.30×FPIC + 0.25×CommunityGap + 0.25×ProtestRisk + 0.20×LitigationRisk`
**Standards:** ['IFC PS', 'UNDRIP']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).