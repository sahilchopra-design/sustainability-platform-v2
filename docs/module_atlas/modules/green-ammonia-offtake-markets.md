# Green Ammonia Offtake Markets
**Module ID:** `green-ammonia-offtake-markets` · **Route:** `/green-ammonia-offtake-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EE3 · **Sprint:** EE

## 1 · Overview
Green ammonia end-market and offtake intelligence. Covers global NH3 demand by sector (fertilizer 70%, chemicals 15-20%, maritime fuel <1% but growing), willingness-to-pay analysis, Japan and Korea co-firing programs, and long-term offtake contract structures.

> **Business value:** Used by green ammonia developers, commodity traders, DFIs, shipping companies, and power utilities to understand demand signals and offtake contract structures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `END_USE_COLORS`, `KpiCard`, `MARKETS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `countries` | `useMemo(() => ['All', ...Array.from(new Set(MARKETS.map(m => m.country)))], []);` |
| `totalVolume` | `useMemo(() => filtered.reduce((a, b) => a + b.volumeMt_2030_potential, 0), [filtered]);` |
| `avgWTP` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.willingness_to_pay_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `avgReadiness` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.marketReadiness, 0) / filtered.length : 0, [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global NH3 Demand (Mt/yr) | `Fertilizer + chemicals + energy` | IFA 2024 | New energy demand (power/maritime/steel DRI) could add 30-80 Mt/yr by 2035. |
| Fertilizer WTP ($/tonne) | `Grey NH3 equivalent + green premium` | CRU / Argus Media | European buyers: $30-80/t premium under CBAM pressure; Asia-Pacific $15-30/t; US minimal 2024. |
| Japan NH3 Co-firing 2030 Target (Mt/yr) | `METI Green Innovation Fund` | METI Japan 2023 | JERA 20% co-firing at Hekinan (1 GW test 2023); Australia preferred supplier via MOUs. |
- **IFA demand statistics + METI procurement plans + WTP surveys + shipping MOUs** → Demand segmentation + WTP analysis + contract structure templates → **Offtake market intelligence for green ammonia pricing long-term supply contracts**

## 5 · Intermediate Transformation Logic
**Methodology:** Demand Segmentation & Willingness-to-Pay
**Headline formula:** `WTP_premium = avoided_grey_NH3_cost + carbon_price × emission_factor + strategic_value`
**Standards:** ['IEA Ammonia Technology Roadmap 2021', 'JERA/KEPCO NH3 Co-firing Procurement', 'IFA Global Fertilizer Market Outlook 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).