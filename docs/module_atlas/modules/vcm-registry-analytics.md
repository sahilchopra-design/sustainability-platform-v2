# VCM Registry Analytics
**Module ID:** `vcm-registry-analytics` · **Route:** `/vcm-registry-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Voluntary carbon market registry analytics platform aggregating issuance, retirement and pricing data across Verra VCS, Gold Standard, ACR and CAR registries with integrity scoring.

> **Business value:** The VCM grew to 200 MtCO2e retired in 2023; integrity concerns following investigative journalism (Guardian 2023) have driven ICVCM CCP adoption; only CCP-approved credits should support corporate claims.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ISSUANCE_TREND`, `Kpi`, `PROJECTS`, `PROJECT_TYPES`, `PT_COLORS`, `PT_DATA`, `REGIONS`, `REGISTRIES`, `REGISTRY_DATA`, `REG_COLORS`, `RETIREMENT_BY_TYPE`, `Section`, `StatusBadge`, `TabBar`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e9 ? `${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(d)}K` : `${n.toFixed(d)}` |
| `PROJECT_TYPES` | `['REDD+', 'Improved Forest Management', 'Renewable Energy', 'Cookstoves', 'Methane Capture', 'Blue Carbon', 'Soil Carbon', 'Industrial Gas', 'Energy E` |
| `REGIONS` | `['Latin America', 'Sub-Saharan Africa', 'Asia-Pacific', 'North America', 'Europe & CA'];` |
| `REGISTRY_DATA` | `REGISTRIES.map((r, i) => ({` |
| `ISSUANCE_TREND` | `VINTAGES.map((yr, i) => ({` |
| `PT_DATA` | `PROJECT_TYPES.map((p, i) => ({` |
| `RETIREMENT_BY_TYPE` | `PROJECT_TYPES.slice(0, 5).map((p, i) => ({` |
| `totalIssued` | `REGISTRY_DATA.reduce((a, r) => a + r.issued, 0);` |
| `totalRetired` | `REGISTRY_DATA.reduce((a, r) => a + r.retired, 0);` |
| `totalProjects` | `REGISTRY_DATA.reduce((a, r) => a + r.projects, 0);` |
| `retirePct` | `totalIssued ? (totalRetired / totalIssued * 100).toFixed(0) : '0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PROJECT_TYPES`, `PT_COLORS`, `REGIONS`, `REGISTRIES`, `REG_COLORS`, `TABS`, `VINTAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credits Tracked (MtCO2) | — | Registry Feeds | Total carbon credits tracked across all major voluntary registries including issuance and retirements. |
| Avg Credit Price | — | Market Data | Volume-weighted average voluntary carbon credit price across all project types and vintages. |
| Low-Integrity Flags | — | RIS Engine | Proportion of queried credits flagged as low-integrity based on ICVCM CCP assessment. |
- **Registry APIs (Verra/GS/ACR/CAR), Market Price Feeds** → Integrity scoring + registry aggregation + price analytics → **Credit integrity dashboard, registry analytics, procurement recommendations**

## 5 · Intermediate Transformation Logic
**Methodology:** Registry Integrity Score
**Headline formula:** `RIS = Additionality Score × Permanence Score × Verification Score`
**Standards:** ['VCMI Claims Code of Practice 2023', 'ICVCM Core Carbon Principles 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).