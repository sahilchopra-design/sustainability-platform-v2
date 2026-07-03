# DME Entity View
**Module ID:** `dme-entity` · **Route:** `/dme-entity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Entity-level materiality deep-dive providing topic scores, evidence trails, stakeholder signal breakdowns, and trend histories for a single company or asset. Supports ESRS IRO-1 documentation by linking materiality conclusions to underlying data. Comparison against sector peers is available in the same view.

> **Business value:** Equips sustainability managers with the topic-level materiality evidence needed to complete ESRS IRO-1 assessments and satisfy external assurance requirements. The entity view bridges the gap between abstract materiality scoring and auditable, source-linked conclusions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COMPANY_NAMES`, `DEF_COEFF`, `DISCLOSURES`, `ENTITIES`, `ESG_BANDS`, `NGFS_SCENARIOS`, `REGIMES`, `REGIME_COLORS`, `REGIONS`, `SECTORS_LIST`, `SECTOR_COEFF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `adj` | `assetValue * (1 - strandedHaircut);` |
| `shock` | `-3 + sr(entitySeed + k * 7) * 6;` |
| `simPD` | `pdBase * Math.exp(alphaT * velT + betaP * velP + 0.05 * shock);` |
| `wacc` | `wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);` |
| `baseline` | `wE * cE + wD * cD * (1 - taxRate);` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];` |
| `DISCLOSURES` | `['Annual Report 2024', 'Sustainability Report 2024', 'TCFD Disclosure Q4-2024', 'CSRD Pilot Filing 2024'];` |
| `pdBase` | `0.01 + s(3) * 0.12;` |
| `velocityT` | `-0.3 + s(7) * 0.6;` |
| `velP` | `-0.2 + s(9) * 0.4;` |
| `assetV` | `500 + s(11) * 4500;` |
| `debt` | `assetV * (0.2 + s(13) * 0.6);` |
| `vol` | `coeff.baseVol + s(17) * 0.1;` |
| `esgBand` | `ESG_BANDS[Math.floor(s(19) * 4)];` |
| `pdConsensus` | `clamp(pdExp * 0.30 + pdMerton * 0.30 + pdTab * 0.20 + pdMC * 0.20, 0.001, 0.90);` |
| `zScore` | `s(23) * 4.2;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCH_DIMS`, `COLORS`, `COMPANY_NAMES`, `DISCLOSURES`, `ESG_BANDS`, `NGFS_SCENARIOS`, `REGIMES`, `REGIONS`, `SECTORS_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Highest-Scored Topic | — | DME entity engine | Topic with the highest double materiality score for the selected entity |
| Financial Material Topics | — | DME financial materiality module | Count of topics meeting the financial materiality threshold for the selected entity |
| Impact Material Topics | — | DME impact materiality module | Count of topics meeting the impact materiality threshold for the selected entity |
| Evidence Items Linked | — | Evidence repository | Total evidence citations (regulatory filings, news, analyst reports) supporting materiality conclusions |
- **DME topic scoring engine (financial + impact scores per entity)** → Double materiality composite calculation with equal or user-configured weighting → **Entity topic matrix with EMS, financial, and impact sub-scores**
- **Evidence repository (news, NGO reports, regulatory filings, stakeholder inputs)** → NLP topic tagging and relevance scoring per evidence item → **Evidence pack linked to each scored topic for IRO-1 documentation**
- **Peer benchmarking database** → Sector cohort score distribution for reference → **Entity score positioned within peer distribution on each topic**

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Materiality Score
**Headline formula:** `EMSᵢ = 0.5 × FinancialMaterialityᵢ + 0.5 × ImpactMaterialityᵢ`
**Standards:** ['ESRS 1 Double Materiality', 'EFRAG Entity-Level Materiality Guidance', 'GRI 3 Material Topics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).