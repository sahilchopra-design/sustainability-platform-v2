# Physical-Transition Nexus
**Module ID:** `physical-transition-nexus` · **Route:** `/physical-transition-nexus` · **Tier:** B (frontend-computed) · **EP code:** EP-CG1 · **Sprint:** CG

## 1 · Overview
Combined physical+transition CVaR with dynamic sector-specific correlation and 20 NGFS×SSP scenario combinations.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `NGFS`, `SECTORS`, `SSP`, `TABS`, `WATCHLIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Integrated Risk Dashboard','Physical-Transition Correlation','Compound Scenario Builder','Double-Hit Stress Test','Sector Interaction Matrix','Portf` |
| `SSP` | `['SSP1-2.6','SSP2-4.5','SSP3-7.0','SSP5-8.5'];` |
| `sectorData` | `useMemo(() => SECTORS.map(sec => {` |
| `rho` | `sec.rho * rhoAdj;` |
| `intCvar` | `sec.cvarTrans + sec.cvarPhys + rho * Math.sqrt(sec.cvarTrans * sec.cvarPhys);` |
| `lossM` | `intCvar / 100 * aum * 1000 * sec.weight / 100;` |
| `radarData` | `sectorData.map(d => ({ sector: d.name, physical: d.physScore, transition: d.transScore, integrated: Math.min(100, d.intCvar * 6) }));` |
| `decompData` | `sectorData.map(d => ({ name: d.name, physical: d.cvarPhys * d.weight / 100, transition: d.cvarTrans * d.weight / 100, interaction: (d.intCvar - d.cvar` |
| `sum` | `d.physLoss + d.transLoss;` |
| `amp` | `sum > 0 ? (d.intLoss / sum).toFixed(2) : '-';` |
| `tot` | `d.physical + d.transition + d.interaction;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `NGFS`, `SECTORS`, `SSP`, `TABS`, `WATCHLIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Integrated CVaR | `Trans+Phys+ρ·Inter` | Model | Combined risk higher than sum of parts due to interaction |
| ρ Energy Sector | `Sector-specific` | ECB CST | Highest interaction between transition and physical risk |
| Scenario Combinations | `5 NGFS × 4 SSP` | Framework | Full matrix of transition × physical scenarios |

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated CVaR with dynamic correlation
**Headline formula:** `IntCVaR = CVaR_trans + CVaR_phys + ρ_dynamic × √(CVaR_trans × CVaR_phys)`
**Standards:** ['NGFS', 'IPCC AR6', 'ECB CST']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).