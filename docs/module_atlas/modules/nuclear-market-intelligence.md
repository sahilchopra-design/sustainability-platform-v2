# Nuclear Market Intelligence
**Module ID:** `nuclear-market-intelligence` · **Route:** `/nuclear-market-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DU3 · **Sprint:** DU

## 1 · Overview
Global nuclear market intelligence covering 440 operating reactors, 60+ units under construction, lifetime-extension economics, SMR order pipeline, uranium spot markets and national policy comparison.

> **Business value:** The 440-reactor global fleet (390 GW) is growing via 60+ units under construction; uranium spot prices at $80–$100/lb reflect post-Fukushima supply restarts and policy-driven demand from SMR programmes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COP28_COMMITMENTS`, `EXPORT_MARKETS`, `FINANCING`, `GLOBAL_FLEET`, `KpiCard`, `NEW_BUILD`, `Slider`, `TABS`, `VENDORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `vendorPie` | `VENDORS.filter(v => v.share > 0).map(v => ({ name: v.vendor.split(" ")[0], value: v.share, fill: v.color }));` |
| `exportPipelineData` | `EXPORT_MARKETS.map(m => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COP28_COMMITMENTS`, `EXPORT_MARKETS`, `FINANCING`, `GLOBAL_FLEET`, `NEW_BUILD`, `TABS`, `VENDORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Operating Reactor Fleet | `Fleet GW = Σ(Unit Capacity × Availability)` | IAEA PRIS 2024 | Global installed nuclear capacity tracking unit-by-unit status. |
| Units Under Construction | `Pipeline GW = Σ(Under-construction Unit Capacity)` | IAEA PRIS 2024 | Active construction projects including Chinese and Eastern European programmes. |
| Uranium Spot Price | `Spot = Exchange-cleared short-term transactions` | UxC / TradeTech 2024 | Benchmark spot price for natural uranium concentrate. |
- **IAEA PRIS + UxC price feeds** → Fleet status → uranium demand projection → **Market intelligence dashboard by region and technology**

## 5 · Intermediate Transformation Logic
**Methodology:** Uranium Spot Price Model
**Headline formula:** `U₃O₈ Spot = Supply–Demand Balance + Speculative Premium + Policy Shift Indicator`
**Standards:** ['UxC Uranium Market Outlook', 'World Nuclear Association Fuel Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).