# Recycled Content Markets
**Module ID:** `recycled-content-markets` · **Route:** `/recycled-content-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ4 · **Sprint:** EJ

## 1 · Overview
10 secondary material markets (rPET/rHDPE/rAl/rSteel/rPP/rGlass/rFibre/rPVC/rCu/PLA) with virgin-recycled price gap, 36-month price history, 20 brand buyer demand analytics, 6 certification standards (GRS/ISCC+/RecyClass/APR/SCS/C2C), and demand forecast to 2030.

> **Business value:** Used by brand procurement teams sourcing certified recycled content, recycling infrastructure investors sizing market opportunity, and sustainability analysts benchmarking recycled content performance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CERTIFICATIONS`, `DEMAND_FORECAST`, `KpiCard`, `MATERIALS`, `PRICE_SERIES`, `Pill`, `RADAR_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DEMAND_FORECAST` | `MATERIALS.slice(0, 6).map(m => ({ material: m.code, demand2024: m.demand2024, demand2027: +(m.demand2024 * 1.4).toFixed(1), demand2030: m.demand2030 }` |
| `sortedMaterials` | `useMemo(() => [...MATERIALS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `sortedBuyers` | `useMemo(() => [...BUYERS].sort((a, b) => b[buyerSort] - a[buyerSort]), [buyerSort]);` |
| `avgRecycleRate` | `MATERIALS.reduce((a, b) => a + b.recycleRate, 0) / MATERIALS.length;` |
| `totalDemand2024` | `MATERIALS.reduce((a, b) => a + b.demand2024, 0);` |
| `gap` | `b.rcTarget2025 - b.rcAchieved2024;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATIONS`, `MATERIALS`, `RADAR_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| rPET price discount to virgin (2024) | `Food-grade rPET vs virgin PET` | ICIS Recycled Plastics Price Report 2024 | rPET has narrowest discount due to brand demand for food-grade RC; virgin PET price collapse (oil) could tempo |
| Recycled aluminium CO₂ saving | `vs primary aluminium production` | International Aluminium Institute 2023 | Aluminium recycling saves 95% of energy vs primary smelting; EV demand driving rAl sheet premium for body pane |
| GRS certified supply chains | `As of 2024 globally` | Textile Exchange GRS Tracker 2024 | GRS now covers all material types; ISCC+ mass balance preferred for chemical recycling streams; dual certifica |
- **EU PPWR + UK PPT + GRS v4.0 + ISCC+ + RecyClass + APR Design Guide + C2C Institute** → Material market comparison + price history + brand buyer analytics + certification guide + demand forecast → **Brand procurement teams, recycling infrastructure investors, sustainability analysts, and green bond issuers**

## 5 · Intermediate Transformation Logic
**Methodology:** Recycled Content Premium Cost
**Headline formula:** `RC_Premium_Cost = (RecycledPrice − VirginPrice) × RCVolume; Demand_Gap = RC_Target_Pct × TotalVolume − RC_Achieved_Pct × TotalVolume; GHG_Saving = RCVolume × CO2_Saving_per_tonne`
**Standards:** ['EU PPWR 2024', 'UK Plastic Packaging Tax 2022', 'GRS Global Recycled Standard v4.0']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).