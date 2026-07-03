# GFANZ Sector Pathways
**Module ID:** `gfanz-sector-pathways` · **Route:** `/gfanz-sector-pathways` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides analytics for assessing portfolio and counterparty alignment with Glasgow Financial Alliance for Net Zero sector decarbonisation pathways, covering power, steel, cement, aviation, shipping, agriculture, and real estate. Enables financial institutions to measure and report on portfolio alignment to sector-specific net-zero pathways as required under GFANZ membership commitments.

> **Business value:** Enables financial institutions to fulfil GFANZ membership reporting obligations, demonstrate portfolio alignment with IEA NZE sector pathways, and identify priority engagement targets in high-emitting sectors including power, steel, cement, aviation, and shipping.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `CO_NAMES`, `CompanyAlignmentTab`, `CustomTooltip`, `KPI`, `MILESTONES_DATA`, `MilestoneMonitorTab`, `MiniBar`, `Pill`, `PortfolioPathwayTab`, `SECTORS`, `SECTOR_2020`, `SECTOR_2050_15`, `SECTOR_2050_2C`, `SECTOR_2050_NDC`, `SECTOR_COLORS_MAP`, `SECTOR_DESC`, `SECTOR_TECHS`, `SECTOR_UNITS`, `SectorPathwaysTab`, `TABS`, `TierBadge`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTOR_UNITS` | `{Power:'gCO2/kWh',Steel:'tCO2/t steel',Cement:'kgCO2/t cement','O&G':'kgCO2e/boe',Aviation:'gCO2/RPK',Shipping:'gCO2/t-nm',Auto:'gCO2/km',Buildings:'k` |
| `seed` | `si*100+ci;` |
| `progress` | `sr(seed)*0.6+0.2;` |
| `current` | `base2020-(base2020-tgt2050)*progress;` |
| `targetNow` | `base2020-(base2020-tgt2050)*((2026-2020)/(2050-2020));` |
| `gap` | `((current-targetNow)/targetNow*100);` |
| `alignment` | `Math.max(0,Math.min(100,100-gap*1.5+sr(seed+50)*20-10));` |
| `capexAlign` | `sr(seed+99)*60+20;` |
| `milestonesAchieved` | `Math.floor(sr(seed+77)*4);` |
| `scope1` | `+(sr(seed+111)*base2020*0.4).toFixed(1);` |
| `scope2` | `+(sr(seed+222)*base2020*0.15).toFixed(1);` |
| `scope3` | `+(current-scope1-scope2).toFixed(1);` |
| `region` | `['Europe','North America','Asia Pacific','Latin America','Middle East'][Math.floor(sr(seed+333)*5)];` |
| `sbtiStatus` | `['Committed','Targets Set','SBTi Validated','Not Committed'][Math.floor(sr(seed+444)*4)];` |
| `transitionPlanPublished` | `sr(seed+555)>0.4;` |
| `val` | `base-(base-tgt)*Math.min(1,curve);` |
| `sBadge` | `(color)=>({display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:color+'18',color,fontFamily:T.font});` |
| `offTrack` | `sectorCos.length-onTrack;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MILESTONES_DATA`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Power Sector Alignment Score | — | IEA NZE Pathway | Scores above 0.70 indicate the financed power generation mix is consistent with net-zero by 2050; coal-heavy p |
| Steel Sector Carbon Intensity (tCO2/t steel) | — | IEA / worldsteel | Global average is 1.85 tCO2/t; NZE pathway target is 0.4 tCO2/t by 2050, requiring ~80% intensity reduction. |
| Aviation Sector SAF Blend (%) | — | IATA / ICAO CORSIA | Sustainable aviation fuel blend rate; GFANZ pathway requires 65% SAF by 2050; current industry average is unde |
| Shipping Alignment (CII Rating) | — | IMO CII / Poseidon Principles | Carbon Intensity Indicator rating; Poseidon Principles alignment target requires fleet average CII rating of A |
- **Issuer production and emissions data (CDP / company reports)** → Normalise intensity by sector-specific production metric, compare to pathway → **Sector alignment scores by issuer**
- **IEA NZE / NGFS scenario trajectories by sector** → Interpolate pathway intensity at current and target years → **Pathway benchmark intensities**
- **Portfolio holdings with sector classification** → Weight issuer alignment scores by portfolio exposure → **Portfolio-level GFANZ sector alignment report**

## 5 · Intermediate Transformation Logic
**Methodology:** Sector Alignment Score
**Headline formula:** `Alignment_s = 1 - (Intensity_portfolio_s - Intensity_pathway_s(t)) / (Intensity_baseline_s - Intensity_pathway_s(t))`
**Standards:** ['GFANZ Guidance on Use of Sectoral Pathways (2022)', 'IEA Net Zero by 2050 (2021)', 'NGFS Climate Scenarios Phase 4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).