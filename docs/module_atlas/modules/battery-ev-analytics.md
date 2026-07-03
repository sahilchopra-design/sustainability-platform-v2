# Battery & EV Analytics
**Module ID:** `battery-ev-analytics` · **Route:** `/battery-ev-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Lifecycle emissions, critical mineral supply risk, and battery GHG intensity analytics for EV and energy storage investments. Covers LCA from raw material extraction through end-of-life recycling, cobalt/lithium supply chain resilience scoring, and charging infrastructure carbon intensity. Supports EU Battery Regulation carbon footprint declaration requirements.

> **Business value:** Battery LCA and critical mineral risk are central to institutional due diligence on EV and energy storage investments. The EU Battery Regulation mandates carbon footprint declarations for batteries above 2kWh by 2025, making accurate LCA methodology a compliance necessity rather than optional disclosure for manufacturers and investors alike.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHEMISTRIES`, `CHEM_MIX`, `COST_CURVE`, `EV_PENETRATION`, `EV_SALES`, `GIGAFACTORIES`, `Kpi`, `STATUS_C`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `usd` | `(n, d = 0) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: d })}`;` |
| `COST_CURVE` | `[2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({` |
| `EV_SALES` | `[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030].map((yr, i) => ({` |
| `CHEM_MIX` | `[2020, 2022, 2024, 2026, 2028, 2030].map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHEMISTRIES`, `CHEM_MIX`, `COST_CURVE`, `EV_PENETRATION`, `EV_SALES`, `GIGAFACTORIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Battery Carbon Intensity | `LCA production + use + EOL / km` | ISO 14044 LCA | Lifecycle GHG intensity per km driven; target <50gCO₂e/km for low-carbon EV |
| Cobalt Supply Risk Score | `HHI × ESG_country_risk` | OECD mineral risk | Supply concentration and geopolitical risk for cobalt sourcing from DRC |
| Charging Carbon Intensity | — | IEA/eGRID by region | Grid emission factor at dominant charging location; determines use-phase emissions |
- **Battery chemistry and material intensity data** → Apply emission factors per kg of material; sum production phase LCA → **Battery production carbon intensity by chemistry type (NMC, LFP, NCA)**
- **IEA/eGRID regional grid emission factors** → Map charging location to grid factor; compute use-phase emissions over lifetime km → **Full lifecycle GHG profile and EU Battery Regulation carbon footprint declaration**

## 5 · Intermediate Transformation Logic
**Methodology:** ISO 14040/44 LCA battery carbon intensity
**Headline formula:** `Battery_LCA_gCO2e_per_km = (Production_emissions + Use_phase_emissions + EOL_emissions) / Lifetime_km; Production_emissions = Material_kg × EF_material`
**Standards:** ['ISO 14040/14044 LCA', 'EU Battery Regulation 2023/1542', 'IEA EV Outlook']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).