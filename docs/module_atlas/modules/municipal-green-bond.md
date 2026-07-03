# Municipal Green Bond Analytics
**Module ID:** `municipal-green-bond` · **Route:** `/municipal-green-bond` · **Tier:** B (frontend-computed) · **EP code:** EP-DM1 · **Sprint:** DM

## 1 · Overview
Analyses municipal and sub-sovereign green bond issuance, framework quality, use-of-proceeds tracking, and impact reporting. Evaluates greenium, second-party opinion quality, and ICMA Green Bond Principles alignment for city and local government issuers.

> **Business value:** Essential for municipal bond fund managers, responsible investment officers at local governments, and city sustainability teams preparing green bond frameworks. Provides systematic ICMA GBP quality assessment and greenium analysis for pricing and relative value.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BONDS`, `CERT_BODIES`, `CITY_NAMES`, `KpiCard`, `RATINGS`, `REGIONS`, `TABS`, `USE_OF_PROCEEDS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `RATINGS` | `['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'];` |
| `cert` | `CERT_BODIES[Math.floor(sr(i * 7) * CERT_BODIES.length)];` |
| `rating` | `RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];` |
| `year` | `2018 + Math.floor(sr(i * 13) * 7);` |
| `size` | `Math.round(50 + sr(i * 3) * 1950);` |
| `tenor` | `Math.round(5 + sr(i * 17) * 25);` |
| `greenium` | `+(sr(i * 19) * 12).toFixed(1);` |
| `osub` | `+(1.5 + sr(i * 23) * 8.5).toFixed(1);` |
| `projects` | `Math.round(3 + sr(i * 29) * 47);` |
| `co2` | `Math.round(10 + sr(i * 31) * 990);` |
| `jobs` | `+(0.5 + sr(i * 37) * 19.5).toFixed(1);` |
| `pop` | `+(0.1 + sr(i * 41) * 4.9).toFixed(2);` |
| `totalVolume` | `filtered.reduce((s, b) => s + b.issuanceSize, 0);` |
| `avgGreenium` | `filtered.length ? (filtered.reduce((s, b) => s + b.greenium, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalCO2` | `filtered.reduce((s, b) => s + b.estimatedCO2Saving, 0);` |
| `totalJobs` | `filtered.reduce((s, b) => s + b.jobsCreated, 0).toFixed(1);` |
| `useData` | `USE_OF_PROCEEDS.map(u => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_BODIES`, `CITY_NAMES`, `RATINGS`, `REGIONS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| US Municipal Green Bond Market | — | BloombergNEF 2024 | US muni green bonds reached $80Bn outstanding in 2024 — transport and water largest use-of-proceeds categories |
| Typical Municipal Greenium | — | Barclays Green Bond Research 2023 | Municipal green bond yields 2–6 bps lower than conventional peer — reflects strong institutional demand |
| CBI Certification Share | — | Climate Bonds Initiative 2024 | Only 28% of municipal green bonds carry external CBI certification — quality varies in uncertified segment |
- **Municipal bond issuance data (Bloomberg, EMMA)** → Market analysis → **Green bond volume, use-of-proceeds, and greenium by sector**
- **Municipal green bond frameworks + SPO reports** → Framework quality scoring → **ICMA GBP alignment score by pillar**
- **City climate action plans + SDG commitments** → Impact alignment → **Green bond use-of-proceeds vs city climate target gap**

## 5 · Intermediate Transformation Logic
**Methodology:** Municipal Greenium Model
**Headline formula:** `MuniGreenium = YieldConventional_muni - YieldGreen_muni (same issuer, same maturity); FrameworkScore = Σ [UoPQuality + ImpactReporting + VerificationRigor + GovernanceAlignment] / 4`
**Standards:** ['ICMA Green Bond Principles 2021', 'Climate Bonds Initiative Municipal Green Bond Framework', 'OECD Sustainable Infrastructure Finance for Cities 2022', 'BloombergNEF Municipal GSS Bond Tracker']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).