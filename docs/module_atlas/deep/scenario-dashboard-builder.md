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
