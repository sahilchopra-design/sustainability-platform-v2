# Plastic Credits & EPR Finance
**Module ID:** `plastic-credits-epr-finance` · **Route:** `/plastic-credits-epr-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ2 · **Sprint:** EJ

## 1 · Overview
Global plastic credit registry comparison (Verra PWRS/Plastic Bank/rePurpose/CleanHub/POP), 8 EPR schemes (EU PPWR/UK/France/Germany/USA/Canada/Japan/Korea), 24 producer compliance analytics, price history, market forecast, and investment intelligence.

> **Business value:** Used by brand owner compliance teams managing EPR obligations, plastic credit procurement officers, ESG analysts assessing plastic footprint, and regulatory affairs teams tracking global EPR developments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPLIANCE_RADAR`, `EPR_SCHEMES`, `KpiCard`, `MARKET_FORECAST`, `PRICE_HISTORY`, `PRODUCERS`, `Pill`, `REGISTRIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `creditCost` | `creditQty * selectedReg.price;` |
| `co2eq` | `(creditQty * 0.0028).toFixed(1);` |
| `avgCompliance` | `filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.compliance, 0) / filteredEPR.length : 0;` |
| `avgFee` | `filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.fee, 0) / filteredEPR.length : 0;` |
| `sortedProducers` | `useMemo(() => [...PRODUCERS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `sortedRegistries` | `useMemo(() => [...REGISTRIES].sort((a, b) => b.price - a.price), []);` |
| `totalVolume` | `REGISTRIES.reduce((a, b) => a + b.volume2024, 0);` |
| `avgPrice` | `REGISTRIES.reduce((a, b) => a + b.price, 0) / REGISTRIES.length;` |
| `oceanBoundShare` | `((REGISTRIES.filter(r => r.methodology.toLowerCase().includes('ocean')).reduce((a, b) => a + b.volume2024, 0)) / totalVolume * 100).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_RADAR`, `EPR_SCHEMES`, `MARKET_FORECAST`, `REGISTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Verra PWRS credit price | `Plastic waste collected and verified` | Verra Plastic Waste Reduction Standard 2024 | Food-grade rPET verification commands premium; ocean-bound methodology requires independent chain-of-custody a |
| UK Plastic Packaging Tax rate | `On packaging with less than 30% recycled content (2024)` | UK Government PPT Guidance 2024 | PPT rate increases annually with RPI; creates strong incentive to exceed 30% RC threshold; food contact exempt |
| EU PPWR recycled content target | `For plastic packaging by 2030` | EU PPWR Regulation 2024 | Mandatory minimum 30% recycled content for all plastic packaging by 2030; 50% for contact-sensitive packaging  |
- **Verra PWRS + Plastic Bank + POP + CleanHub + EU PPWR + UK EPR + CA SB 54 + UNEA Resolution 5/14** → Registry comparison + credit calculator + EPR scheme table + producer compliance + price history → **Brand compliance teams, plastic credit procurement officers, ESG analysts, and regulatory affairs teams**

## 5 · Intermediate Transformation Logic
**Methodology:** EPR Producer Fee Liability
**Headline formula:** `EPR_Fee = PlasticTonnage × EPR_Rate × JurisdictionCount; CreditNeed = max(0, RCTarget − AchievedRC) × Volume; TotalCost = EPR_Fee + CreditPurchaseCost; ComplianceScore = min(100, (RC_pct / RC_target × 50 + CollectionRate / Collection_target × 50))`
**Standards:** ['EU PPWR 2024', 'UK EPR Regulations 2023', 'Verra Plastic Waste Reduction Standard v1.0']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).