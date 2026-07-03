# Power Purchase Agreement Analytics
**Module ID:** `ppa-analytics` · **Route:** `/ppa-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DO5 · **Sprint:** DO

## 1 · Overview
Analyses corporate and utility Power Purchase Agreements (PPAs) — price risk, volume risk, basis risk, and contract structure optimisation. Models PPA vs merchant price comparison, renewable energy certificate (REC) value, and additionality for corporate net zero claims.

> **Business value:** Essential for corporate energy procurement teams, RE100 members, and treasury departments managing electricity price risk. Provides rigorous PPA value analysis and GHG Protocol Scope 2 market-based emission reduction verification for net zero claims.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CONTRACTS`, `CREDIT_RATINGS`, `GEOGRAPHIES`, `KpiCard`, `MiniBar`, `OFFTAKER_SECTORS`, `PPA_STRUCTURES`, `TABS`, `TECH_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PPA_STRUCTURES` | `['Physical PPA','Virtual/Financial PPA','Sleeved PPA','Proxy Revenue Swap','Green Tariff','Corporate CfD'];` |
| `CREDIT_RATINGS` | `['AAA','AA','A','BBB+','BBB','BBB-'];` |
| `TECH_TYPES` | `['Solar PV','Wind Onshore','Wind Offshore','Hybrid Solar+Storage'];` |
| `structure` | `PPA_STRUCTURES[Math.floor(sr(i*7+1)*PPA_STRUCTURES.length)];` |
| `sector` | `OFFTAKER_SECTORS[Math.floor(sr(i*11+2)*OFFTAKER_SECTORS.length)];` |
| `rating` | `CREDIT_RATINGS[Math.floor(sr(i*13+3)*CREDIT_RATINGS.length)];` |
| `tech` | `TECH_TYPES[Math.floor(sr(i*17+4)*TECH_TYPES.length)];` |
| `geo` | `GEOGRAPHIES[Math.floor(sr(i*19+5)*GEOGRAPHIES.length)];` |
| `volumeMwh` | `Math.round(10000 + sr(i*23+6)*490000);` |
| `priceFloor` | `parseFloat((25 + sr(i*29+7)*55).toFixed(1));` |
| `contractPrice` | `parseFloat((priceFloor + 5 + sr(i*31+8)*45).toFixed(1));` |
| `termYears` | `Math.round(5 + sr(i*37+9)*20);` |
| `startYear` | `2022 + Math.floor(sr(i*41+1)*5);` |
| `offtakerRisk` | `parseFloat((10 + sr(i*43+2)*75).toFixed(0));` |
| `volumeRisk` | `parseFloat((5 + sr(i*47+3)*50).toFixed(0));` |
| `priceRisk` | `parseFloat((10 + sr(i*53+4)*60).toFixed(0));` |
| `pvRatio` | `parseFloat((0.8 + sr(i*59+5)*0.6).toFixed(2));` |
| `markToMarket` | `parseFloat(((sr(i*61+6)-0.5)*20).toFixed(1));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_RATINGS`, `GEOGRAPHIES`, `OFFTAKER_SECTORS`, `PPA_STRUCTURES`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Corporate PPA Market | — | BloombergNEF Corporate PPA 2024 | Corporate offtakers contracted 35 GW of renewable PPAs in 2023 — US 55%, Europe 30%, APAC 15% |
| Average PPA Tenor | — | RE100 PPA Data 2023 | Typical corporate PPA contract length — sufficient for project finance debt tenor (10–14 years) |
| PPA Discount to Merchant | — | BloombergNEF PPA Pricing 2024 | Corporate PPAs typically priced 5–15% below expected merchant spot — market volatility premium for certainty |
- **Power market price forward curves by region** → PPA value calculation → **PPA NPV and VaR under various price scenarios**
- **Wind/solar generation profiles vs hub prices** → Basis risk analysis → **Capture price vs hub price differential for virtual PPAs**
- **GHG Protocol Scope 2 quality criteria** → Additionality assessment → **Renewable energy claim quality for net zero reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** PPA Value-at-Risk
**Headline formula:** `PPANetValue = Σ [(PPAprice - MerchantPrice_t) × Volume_t / (1+r)^t]; VaR_PPA = PPANetValue - PPANetValue(P05); BasisRisk = CapturePrice - HubPrice`
**Standards:** ['IRENA Corporate PPA Guide 2023', 'RE-Source Platform — Understanding PPAs 2023', 'GHG Protocol Scope 2 Guidance — Market-Based Method', 'EAC Council — Renewable Energy Certificates']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).