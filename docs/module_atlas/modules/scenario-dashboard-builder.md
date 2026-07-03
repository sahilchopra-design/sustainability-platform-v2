# Scenario Dashboard Builder
**Module ID:** `scenario-dashboard-builder` · **Route:** `/scenario-dashboard-builder` · **Tier:** B (frontend-computed) · **EP code:** EP-CH5 · **Sprint:** CH

## 1 · Overview
Customizable dashboard with 20 configurable widgets, 8 pre-built templates, save/load/share, and scheduled refresh.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `MiniWidget`, `Pill`, `Ref`, `TABS`, `TEMPLATES`, `WIDGET_CATALOG`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `chartData` | `Array.from({ length: 12 }, (_, i) => ({ m: i + 1, v: 40 + sr(i * 15 + (WIDGET_CATALOG.findIndex(wc=>wc.id===widget)\|\|0) * 10) * 30 }));` |
| `categories` | `['All', ...new Set(WIDGET_CATALOG.map(w => w.category))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `TEMPLATES`, `WIDGET_CATALOG`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Widgets | — | Module catalog | Configurable dashboard components |
| Templates | — | Pre-built | CIO Brief, Risk Committee, Board Report, etc. |

## 5 · Intermediate Transformation Logic
**Methodology:** Widget-based dashboard composition
**Headline formula:** `No calculation — aggregation of other module outputs`
**Standards:** ['All Sprint CA-CX modules']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).