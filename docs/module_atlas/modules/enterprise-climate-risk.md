# Enterprise Climate Risk
**Module ID:** `enterprise-climate-risk` · **Route:** `/enterprise-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Delivers a board-level enterprise climate risk dashboard integrating physical and transition risk exposures across all business divisions, assets, and supply chains. Aggregates risk scores into a CEO/CFO-ready climate risk register aligned with TCFD recommendations and emerging ISSB IFRS S2 mandatory disclosure requirements. Provides scenario-based financial impact quantification for strategic planning and regulatory submission.

> **Business value:** Equips CFOs, Chief Risk Officers, and sustainability teams with a single authoritative climate risk view that satisfies TCFD, IFRS S2, and emerging mandatory disclosure regimes while providing the financial quantification needed for strategic capital allocation and board-level decision-making.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `BUSINESS_LINES`, `CET1_PATH`, `CONCENTRATION_LIMITS`, `CURRENCIES`, `EXPOSURES`, `GEOGRAPHIES`, `HEDGE_POSITIONS`, `HEDGE_TIMELINE`, `KpiCard`, `LEGAL_ENTITIES`, `MATERIALITY_ITEMS`, `NGFS3`, `NGFS3_COLORS`, `NGFS3_MULTS`, `PEER_RADAR`, `RAGBadge`, `RAROC_TABLE`, `SCENARIO_PNL`, `SECTORS`, `SectionHead`, `Sel`, `SliderRow`, `TABS`, `TCFD_ITEMS_EXTENDED`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `entityName` | `LEGAL_ENTITIES[Math.floor(sr(i * 7)   * LEGAL_ENTITIES.length)];` |
| `assetClass` | `ASSET_CLASSES[Math.floor(sr(i * 11)   * ASSET_CLASSES.length)];` |
| `businessLine` | `BUSINESS_LINES[Math.floor(sr(i * 13)  * BUSINESS_LINES.length)];` |
| `geography` | `GEOGRAPHIES[Math.floor(sr(i * 17)     * GEOGRAPHIES.length)];` |
| `sector` | `SECTORS[Math.floor(sr(i * 19)         * SECTORS.length)];` |
| `currency` | `CURRENCIES[Math.floor(sr(i * 43)      * CURRENCIES.length)];` |
| `vintage` | `2015 + Math.floor(sr(i * 47) * 9);` |
| `exposureMN` | `50 + sr(i * 23) * 2950;` |
| `physRisk` | `10 + sr(i * 29) * 80;` |
| `transRisk` | `10 + sr(i * 31) * 80;` |
| `climateVaR95` | `exposureMN * (0.02 + sr(i * 37) * 0.18);` |
| `hedgeRatio` | `sr(i * 59);` |
| `hedgeCostBps` | `hedgeRatio > 0.1 ? 5 + sr(i * 61) * 95 : 0;` |
| `raroc` | `0.04 + sr(i * 71) * 0.16;` |
| `capitalCharge` | `exposureMN * (0.08 + sr(i * 73) * 0.07);` |
| `pdClimate` | `0.001 + sr(i * 79) * 0.079;` |
| `lgdClimate` | `0.2   + sr(i * 83) * 0.6;` |
| `rwaClimate` | `exposureMN * (0.3 + sr(i * 89) * 0.9);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `BUSINESS_LINES`, `CURRENCIES`, `GEOGRAPHIES`, `LEGAL_ENTITIES`, `MATERIALITY_ITEMS`, `NGFS3`, `NGFS3_COLORS`, `NGFS3_MULTS`, `PEER_RADAR`, `SECTORS`, `TABS`, `TCFD_ITEMS_EXTENDED`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Enterprise Climate VaR (%) | — | TCFD/IPCC AR6 | Estimated EBITDA-at-risk from climate factors under tail scenario; above 10% triggers board-level escalation. |
| Physical Risk Hotspot Count | — | JBA / Four Twenty Seven | Number of owned or leased assets above critical hazard threshold in current and 2050 climate. |
| Transition Risk Exposure ($M) | — | IEA/Carbon Tracker | Estimated NPV impact of carbon pricing, stranded assets, and revenue shift under 1.5°C scenario. |
| TCFD Disclosure Readiness Score (%) | — | TCFD Status Report 2023 | Percentage of TCFD recommended disclosures populated with quantified data vs. qualitative-only or absent. |
- **Asset registry (GIS coordinates, book value, sector)** → Overlay with physical hazard maps (flood, heat, drought, sea-level rise) → **Asset-level physical risk score and financial exposure**
- **Revenue and cost data by division** → Apply scenario-specific carbon price, policy cost, and demand shift factors → **Division-level transition risk impact ($M)**
- **TCFD disclosure inventory** → Gap-assess against 11 recommended disclosures; score quantification maturity → **TCFD readiness score with disclosure gap register**

## 5 · Intermediate Transformation Logic
**Methodology:** Enterprise Climate Risk Score
**Headline formula:** `ECRS = Σ(w_d × (PhysRisk_d + TransRisk_d)) / Σw_d`
**Standards:** ['TCFD 2017/2021', 'IFRS S2 2023', 'TNFD v1.0']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).