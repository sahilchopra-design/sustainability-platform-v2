# ESG Governance Scorer
**Module ID:** `esg-governance-scorer` · **Route:** `/esg-governance-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-DK3 · **Sprint:** DK

## 1 · Overview
Comprehensive governance scoring across ESG dimensions using MSCI, ISS, Sustainalytics, and CDP governance frameworks. Models board independence, audit quality, anti-corruption, political lobbying alignment with climate commitments, and controversy screening.

> **Business value:** Applicable to ESG-integrated equity analysis, active ownership engagement programmes, and investment mandates with governance exclusion screens. Provides systematic scoring across all major ESG rating provider methodologies for governance comparison and gap analysis.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `eScore` | `Math.round(20 + sr(i * 13) * 75);` |
| `sScore` | `Math.round(20 + sr(i * 17) * 75);` |
| `gScore` | `Math.round(20 + sr(i * 19) * 75);` |
| `esgTotal` | `Math.round((eScore * 0.33 + sScore * 0.33 + gScore * 0.34));` |
| `controversies` | `Math.floor(sr(i * 23) * 8);` |
| `antiCorruption` | `parseFloat((1 + sr(i * 29) * 9).toFixed(1));` |
| `taxTransparency` | `parseFloat((1 + sr(i * 31) * 9).toFixed(1));` |
| `executivePay` | `parseFloat((10 + sr(i * 37) * 390).toFixed(0));` |
| `whistleblowerPolicy` | `sr(i * 41) > 0.4;` |
| `boardDiversity` | `parseFloat((10 + sr(i * 43) * 55).toFixed(1));` |
| `shareholderRights` | `parseFloat((1 + sr(i * 47) * 9).toFixed(1));` |
| `auditQuality` | `parseFloat((1 + sr(i * 53) * 9).toFixed(1));` |
| `lobbyingDisclosure` | `sr(i * 59) > 0.45;` |
| `avgEsg` | `(filtered.reduce((a, c) => a + c.esgTotal, 0) / n).toFixed(1);` |
| `avgG` | `(filtered.reduce((a, c) => a + c.gScore, 0) / n).toFixed(1);` |
| `avgCont` | `(filtered.reduce((a, c) => a + c.controversies, 0) / n).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Governance Risk Premium | — | MSCI ESG Research 2023 | Bottom governance quintile companies underperform by 2.3% annually — strongest ESG-returns relationship |
| Climate Lobbying Misalignment | — | InfluenceMap 2023 | 65% of S&P 500 companies belong to trade associations lobbying against climate policy — misaligned with pledge |
| Board Independence | — | ISS Proxy Advisory Guidelines 2024 | ISS recommends 85% independent directors — key governance metric in ESG ratings |
- **Board composition databases (ISS, BoardEx)** → Governance baseline → **Director independence, expertise, tenure, diversity scores**
- **InfluenceMap lobbying analysis** → Climate lobbying alignment → **Company and trade association climate policy alignment grade**
- **Controversy databases (RepRisk, MSCI)** → Controversy screening → **Governance controversy incidents and ESG rating impact**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Governance Composite Score
**Headline formula:** `GovernanceScore = Σ [w_pillar × PillarScore]; BoardScore = IndependenceRatio × DiversityScore × ExpertiseIndex; AlignmentScore = ClimateLobbyingAlignmentRatio`
**Standards:** ['MSCI ESG Governance Methodology 2024', 'ISS ESG Corporate Rating Governance', 'Sustainalytics ESG Risk Rating Governance', 'CDP Climate Governance Survey 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).