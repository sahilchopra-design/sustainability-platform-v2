# Loss & Damage Finance Analytics
**Module ID:** `loss-and-damage-finance` · **Route:** `/loss-and-damage-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DH5 · **Sprint:** DH

## 1 · Overview
Quantifies climate loss and damage (L&D) — economic costs from climate change that cannot be adapted to — across developing countries. Analyses the Santiago Network, UNFCCC L&D Fund modalities, parametric insurance solutions, and national L&D financing strategies.

> **Business value:** Critical for climate-vulnerable developing country finance ministries, humanitarian finance organisations, and impact investors in climate resilience. Provides quantitative foundation for UNFCCC L&D Fund applications and parametric insurance product design aligned with ARC/CCRIF frameworks.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `REGIONS`, `TABS`, `V20_NAMES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Small Island States', 'Latin America', 'MENA'];` |
| `hdi` | `+(0.3 + sr(i * 7) * 0.5).toFixed(3);` |
| `totalEconomicLoss` | `filtered.reduce((a, c) => a + c.lossesEconomic, 0);` |
| `avgGdpLoss` | `filtered.length ? filtered.reduce((a, c) => a + c.gdpLossClimate, 0) / filtered.length : 0;` |
| `ldEligiblePct` | `filtered.length ? (filtered.filter(c => c.ldFundEligible).length / filtered.length * 100).toFixed(1) : '0.0';` |
| `totalDisplaced` | `filtered.reduce((a, c) => a + c.displacedPersons, 0);` |
| `top15Losses` | `[...filtered].sort((a, b) => b.lossesEconomic - a.lossesEconomic).slice(0, 15).map(c => ({` |
| `hdiScatter` | `filtered.map(c => ({ x: c.humanDevelopmentIndex, y: c.lossesEconomic * tempMultiplier, name: c.name }));` |
| `adaptGapByRegion` | `REGIONS.map(r => ({` |
| `insuranceGap` | `[...filtered].sort((a, b) => a.insuranceCoverage - b.insuranceCoverage).slice(0, 15).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `TABS`, `V20_NAMES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual L&D Costs 2020s | — | V20 Economy Loss Monitor 2023 | Annual climate loss and damage in V20 vulnerable countries — 5× higher than in 2000 |
| L&D Fund Pledge | — | UNFCCC COP28 L&D Fund 2023 | Initial pledges to UNFCCC L&D Fund at COP28 Dubai — far below estimated needs |
| Parametric Insurance Coverage | — | ARC/CCRIF/Pacific Cat Fund 2023 | Total parametric climate risk insurance in developing countries — covering 30+ countries |
- **EM-DAT disaster loss database + GDP data** → L&D economic estimation → **Attributed climate L&D by country, hazard, and year**
- **Climate index data (rainfall, wind speed, temperature)** → Parametric trigger calibration → **Trigger-payout relationship for parametric insurance product design**
- **UNFCCC L&D Fund modalities documents** → Eligibility and access mapping → **Country-level access pathway to L&D Fund resources**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Loss & Damage Estimation
**Headline formula:** `L&D_Economic = DirectLoss + IndirectLoss + NonEconomicLoss; DirectLoss = AssetDamage + BusinessInterruption; ParametricPayout = max(0, (TriggerIndex - Threshold) × PayoutRate × SumInsured)`
**Standards:** ['IPCC AR6 WGII Chapter 16 — Key Risks Across Sectors', 'UNFCCC Santiago Network (2019)', 'COP27 Sharm el-Sheikh L&D Fund (2022)', 'ARC African Risk Capacity Parametric Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).