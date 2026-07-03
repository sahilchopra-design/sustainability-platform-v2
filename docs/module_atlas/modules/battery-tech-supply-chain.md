# Battery Supply Chain Risk Analytics
**Module ID:** `battery-tech-supply-chain` · **Route:** `/battery-tech-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-DT4 · **Sprint:** DT

## 1 · Overview
Critical mineral supply chain risk analytics for battery technologies covering lithium, cobalt, nickel, manganese and graphite, country concentration risk, price volatility and NMC vs LFP vs solid-state chemistry comparison.

> **Business value:** Battery supply chain risk is dominated by cobalt (DRC 70%) and natural graphite (China 65%) concentration; LFP chemistry eliminates cobalt risk and is now preferred for stationary storage at <$80/kWh cell cost, while solid-state batteries represent a 2027-2030 transformative shift per IEA CRM analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CELLS`, `GIGA_FACTORIES`, `KpiCard`, `MINERALS`, `RECYCLING`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `cellCost` | `[cell.cost2025, cell.cost2027, cell.cost2030, cell.cost2035, Math.round(cell.cost2035 * 0.75)][i];` |
| `modulePack` | `cellCost * 0.28;` |
| `bms` | `cellCost * 0.08;` |
| `thermal` | `cellCost * 0.06;` |
| `integration` | `cellCost * 0.04;` |
| `recoveredValue` | `(r.li_rec / 100) * 0.012 * 14500 * priceMult` |
| `netMargin` | `recoveredValue - r.cost_usd_kg * 1000;` |
| `costPerGwh` | `70; // $M/GWh` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CELLS`, `GIGA_FACTORIES`, `MINERALS`, `RECYCLING`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cobalt Country Concentration | `HHI = Σ(market_share_i²) × 10000` | USGS Mineral Commodity Summaries 2023 | HHI of ~5,000 indicates extreme concentration; DRC political risk rated B- by S&P; ESG concerns in artisanal m |
| Lithium Price Volatility | `CoV = StdDev(price)/Mean(price)` | BNEF Metal Price Index | LCO/LFP divergence: LFP eliminates cobalt; NMC reduces cobalt 50-80% vs NMC-111; solid-state eliminates liquid |
| Battery Chemistry Comparison | `Energy density (Wh/kg): LFP 120-180, NMC 200-300, SSB 400+` | BNEF 2023 | LFP dominates stationary storage (<$80/kWh cell); NMC dominates EV long-range; solid-state batteries TRL 5-7,  |
- **USGS mineral production data** → → HHI model → **Mine output by country and mineral**
- **Battery cell price history** → → chemistry comparison → **$/kWh by chemistry and year**

## 5 · Intermediate Transformation Logic
**Methodology:** Supply Chain Risk Index
**Headline formula:** `SCRI = Σ(CRM_weight × HHI_country × price_vol × substitutability_score)`
**Standards:** ['IEA Critical Minerals Report 2023', 'BNEF Electric Vehicle Outlook 2023', 'European Commission CRM Act']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`