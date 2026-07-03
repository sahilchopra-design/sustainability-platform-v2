# Sovereign Green Bond Analytics
**Module ID:** `sovereign-green-bond-analytics` · **Route:** `/sovereign-green-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DH6 · **Sprint:** DH

## 1 · Overview
Analyses sovereign green, social, sustainability, and sustainability-linked bond (GSSSB) markets. Evaluates green bond framework quality, use-of-proceeds alignment, greenium quantification, and sovereign issuer climate credibility scoring using second-party opinion methodologies.

> **Business value:** Essential for sovereign debt fund managers, fixed income ESG analysts, and central bank reserve managers. Provides systematic framework quality assessment (ICMA GBP), greenium calculation for relative value trading, and sovereign climate credibility scoring to support engagement with government debt management offices.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BONDS`, `CURRENCIES`, `ISSUERS`, `PROCEEDS`, `REGIONS`, `TABS`, `VERIFIERS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalVolume` | `filtered.reduce((a, b) => a + b.size, 0);` |
| `avgGreenium` | `filtered.length ? filtered.reduce((a, b) => a + b.greenium, 0) / filtered.length : 0;` |
| `avgOversubscription` | `filtered.length ? filtered.reduce((a, b) => a + b.oversubscription, 0) / filtered.length : 0;` |
| `parisAlignedPct` | `filtered.length ? (filtered.filter(b => b.parisAligned).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `cumIssuanceData` | `YEARS.map(yr => {` |
| `greeniumByProceeds` | `PROCEEDS.map(p => ({` |
| `issuanceByRegion` | `REGIONS.map(r => ({` |
| `sizeVsOversubScatter` | `filtered.map(b => ({ x: b.size, y: b.oversubscription, name: b.name }));` |
| `tenorData` | `[5, 10, 15, 20, 30].map(t => ({` |
| `verifierData` | `VERIFIERS.map(v => ({` |
| `vol` | `filtered.filter(b => b.useOfProceeds === p).reduce((a, b) => a + b.size, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CURRENCIES`, `ISSUERS`, `PROCEEDS`, `REGIONS`, `TABS`, `VERIFIERS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sovereign GSS Bond Market | — | Climate Bonds Initiative 2024 | Total sovereign GSS bonds outstanding globally — 60+ sovereign issuers including Germany, France, UK, Chile |
| Average Greenium | — | Deutsche Bank Green Bond Research 2023 | Average yield discount for sovereign green bonds vs conventional — compressed from -5 to -12 bps in 2021 |
| GSSSB Share of Sovereign Issuance | — | OECD Sovereign GSS Bond Report 2023 | GSS bonds now 8% of all sovereign bond issuance — doubling from 4% in 2020 |
- **Bloomberg GSSSB issuance database** → Market size and trend analysis → **Sovereign GSS bond volumes by country, currency, tenor**
- **Sovereign green bond frameworks + SPO reports** → Framework quality scoring → **ICMA GBP alignment score by category**
- **Conventional sovereign yield curve data** → Greenium calculation → **Green premium (bps) by issuer and maturity**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Greenium Model
**Headline formula:** `Greenium = YieldConventional - YieldGreen (same issuer, similar maturity); FrameworkScore = Σ [w_i × CategoryScore_i] where categories: UoP quality, reporting, impact, governance`
**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Standard v3.0', 'OECD Sovereign Green Bond Market Framework 2023', 'BloombergNEF GSSSB Market Tracker']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).