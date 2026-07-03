# Multi-Dim Transition Scorer
**Module ID:** `multi-dim-transition-scorer` · **Route:** `/multi-dim-transition-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CD1 · **Sprint:** CD

## 1 · Overview
6-pillar multi-dimensional transition risk scorer with public and proprietary data tiers. Scores 6 companies (Shell, Vestas, BASF, RWE, Lufthansa, BlackRock) with A-E rating, news signal feed, and universe ranking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `PILLARS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `weighted` | `PILLARS.reduce((sum, p) => sum + (data[p.id] ?? 0) * p.weight / 100, 0);` |
| `TABS` | `['Company Scorer', 'Pillar Deep-Dive', 'Public vs. Proprietary Delta', 'Signal Feed', 'Universe Ranking'];` |
| `radarData` | `PILLARS.map(p => ({` |
| `delta` | `company.proprietary_data[p.id] - company.public_data[p.id];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `PILLARS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Exposure | `CDP score + EVIC attribution` | CDP/PCAF | Direct and indirect carbon exposure including Scope 3 |
| Technology Readiness | `Green CapEx % + R&D ratio` | Company filings | Investment in clean technology and innovation pipeline |
| Policy Risk | `ETS exposure + regulatory compliance` | InfluenceMap | Exposure to carbon pricing and climate regulation |
| Public vs Proprietary Delta | `Prop_score - Public_score` | Internal | Difference between public data tier and enhanced proprietary scoring |

## 5 · Intermediate Transformation Logic
**Methodology:** 6-pillar weighted composite scoring
**Headline formula:** `Score = 0.22×Carbon + 0.18×Technology + 0.20×Policy + 0.18×Market + 0.12×Capital + 0.10×Social`
**Standards:** ['CDP', 'SBTi', 'InfluenceMap', 'Bloomberg']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).