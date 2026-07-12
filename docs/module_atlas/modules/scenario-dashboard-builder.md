# Scenario Dashboard Builder
**Module ID:** `scenario-dashboard-builder` · **Route:** `/scenario-dashboard-builder` · **Tier:** B (frontend-computed) · **EP code:** EP-CH5 · **Sprint:** CH

## 1 · Overview
Customizable dashboard with 20 configurable widgets, 8 pre-built templates, save/load/share, and scheduled refresh.

**How an analyst works this module:**
- Dashboard Builder tab lets you toggle widgets on/off
- Template Library provides 8 pre-configured layouts
- Save dashboard configuration for reuse
- Schedule automated refresh (daily/weekly/monthly)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `MiniWidget`, `Pill`, `Ref`, `TABS`, `TEMPLATES`, `WIDGET_CATALOG`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WIDGET_CATALOG` | 21 | `name`, `category`, `icon`, `color` |
| `TEMPLATES` | 9 | `name`, `widgets`, `desc`, `color` |

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

Pulls data from all climate risk modules via module output bus. 20 available widgets: carbon price chart, sector heatmap, VaR gauge, ITR dial, emissions trajectory, policy tracker, etc. 8 templates: CIO Brief, Risk Committee, Board Report, Regulatory Filing, Client Presentation, Research Note, Audit Pack, Peer Comparison.

**Standards:** ['All Sprint CA-CX modules']
**Reference documents:** All Sprint CA-CX Module Outputs

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module has no scoring methodology of its own by design — the guide correctly states
"No calculation — aggregation of other module outputs" — and the code matches that description:
it is a **widget-composition UI**, not an analytics engine.

### 7.1 What the module computes

```
chartData(widget) = Array(12 months).map(m => ({
  m: m+1,
  v: 40 + sr(m x 15 + widgetIndex x 10) x 30      // 40-70 range, per-widget-seeded demo series
}))
```
This is the module's **only** numeric computation: a placeholder 12-point monthly demo series
generated per widget, purely for previewing what a widget "would look like" on the dashboard
canvas before real module data is wired in.

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `WIDGET_CATALOG` (21 rows) | name, category, icon, colour per widget (e.g. carbon price chart, sector heatmap, VaR gauge, ITR dial, emissions trajectory, policy tracker) | Static catalog of platform-analytics-style widget types, hand-authored |
| `TEMPLATES` (9 rows) | name, widget list, description, colour | Static pre-built layouts (guide cites CIO Brief, Risk Committee, Board Report, Regulatory Filing, Client Presentation, Research Note, Audit Pack, Peer Comparison) |
| `chartData` seed formula | `40 + sr(m×15 + widgetIndex×10)×30` | Synthetic placeholder demo values, not connected to any real module's live output |

### 7.3 Calculation walkthrough

1. User toggles widgets from the 21-item `WIDGET_CATALOG` on/off, or loads one of the 9
   `TEMPLATES` (each pre-selecting a widget subset).
2. Each active widget renders `chartData(widget)` — a demo sparkline/chart preview using the
   placeholder seeded series above — **not** the real live output of the module the widget
   nominally represents (e.g. selecting "VaR Gauge" does not pull an actual portfolio VaR from the
   platform's stress-test engine; it renders a generic 40-70 demo series).
3. Save/load persists the selected widget configuration (implementation detail not fully traced,
   but described in the guide as save/load/share); no server-side aggregation of real module
   outputs occurs based on the code inspected.

### 7.4 Data provenance & limitations

- This module is a **layout/configuration tool**, not a data-aggregation engine — the guide's
  description that it "pulls data from all climate risk modules via module output bus" is **not
  implemented**; every widget shows the same generic placeholder demo series regardless of which
  real analytics module it represents.
- A production version would need an actual module-output bus / shared state layer (e.g. React
  Context, a backend aggregation endpoint, or a pub/sub event system) to let a "Board Report"
  template genuinely surface live VaR, ITR, and emissions-trajectory figures computed elsewhere on
  the platform.
- The 21-widget catalog and 8-9 template names are a reasonable, well-thought-out information
  architecture for an executive reporting dashboard, even though the underlying wiring does not
  yet exist.

**Framework alignment:** none directly computed — this module is a UI composition layer over other
modules' (not-yet-connected) outputs; its value is organisational (which widgets/templates make
sense for CIO/Risk Committee/Board/Regulatory/Client audiences), not calculational.

## 9 · Future Evolution

### 9.1 Evolution A — A real module-output bus behind the widgets (analytics ladder: pre-rung-1 layout tool → 2)

**What.** §7 is clear-eyed: this is a widget-composition UI by design ("no calculation" is the guide's own claim), but the guide's other claim — that widgets "pull data from all climate risk modules via module output bus" — is unimplemented: every widget renders the same seeded placeholder series (`40 + sr(...)×30`) regardless of which analytics module it nominally represents, so a "Board Report" template shows decorative lines labelled VaR or ITR. Evolution A builds the output bus §7.4 prescribes, making this the platform's composition layer over real computed artifacts.

**How.** (1) A widget-data contract: each widget type declares its source module, endpoint, and series shape; a backend aggregation endpoint (`POST /api/v1/dashboards/resolve`) fans out to the source modules' existing APIs (scenario-stress-test VaR, quant-dashboard ITR, emissions trajectories) and returns typed series with per-widget provenance (module, endpoint, computed-at). The Atlas endpoint map is the registry for what each widget may bind to. (2) Widgets with unavailable sources render an explicit "source not connected" state — honest nulls, never the placeholder series. (3) Saved dashboards persist widget bindings org-scoped (share/schedule already exist as UI concepts; scheduling now re-resolves real data). (4) The placeholder generator is deleted.

**Prerequisites.** Source modules exposing stable response shapes (this evolution consumes the sibling evolutions' backends — sequence accordingly); dashboard persistence tables. **Acceptance:** a VaR widget's series matches the stress-test module's endpoint for the same portfolio; disconnecting a source flips the widget to its unavailable state; no widget renders the placeholder formula.

### 9.2 Evolution B — Dashboard-composition assistant (LLM tier 2 → 3)

**What.** With a real bus, dashboard assembly becomes a natural-language task: "build me a quarterly board view — portfolio climate VaR under two NGFS scenarios, financed-emissions trend, top regulatory deadlines, and the CRREM alignment chart" — the copilot maps each request clause to a widget type and binding from the registry, assembles the layout, and explains what each widget will show and where its data comes from.

**How.** The widget registry (source module → endpoint → series shape) is the tool surface: composition requests resolve via registry search (the `module_tags.json` taxonomy and Atlas interconnection graph route ambiguous asks — "emissions trend" → scope3-engine vs real-time monitor, the copilot asks or picks by portfolio context). This is a small desk-orchestration precursor: the copilot touches many modules' outputs but only through the declared bus, inheriting each source's provenance. Guardrails: it composes and binds, never fabricates a series; requested widgets with no computable source are declined with the reason ("no scenario run exists for this portfolio — run scenario-stress-test first"), turning gaps into actionable next steps.

**Prerequisites.** Evolution A's bus and registry; binding-permission checks (RBAC per source module inherited). **Acceptance:** every widget in a generated dashboard has a valid registry binding; unavailable requests produce the actionable refusal; the assembled board view renders only live data.