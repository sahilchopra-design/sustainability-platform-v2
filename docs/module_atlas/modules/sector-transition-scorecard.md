# Sector Transition Scorecard
**Module ID:** `sector-transition-scorecard` · **Route:** `/sector-transition-scorecard` · **Tier:** B (frontend-computed) · **EP code:** EP-CB1 · **Sprint:** CB

## 1 · Overview
PACE 4-pillar sector transition framework (Physical risk, Abatement cost, Carbon cost, Energy price) for 6 GICS sectors. Includes SBTi pathway comparison, marginal abatement cost curves, and emissions trajectories.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `RATING_COLOR`, `RISK_COLOR`, `SECTORS`, `TABS`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PACE Composite | `Average of 4 pillars` | Model output | Higher = better transition position; Energy sector typically 35-45, Tech sector 70-78 |
| Abatement Cost Curve | `Marginal cost ranking` | McKinsey MAC | Cost of emission reduction technologies ranked from cheapest to most expensive |
| SBTi Pathway Gap | `Actual vs SBTi target` | SBTi SDA | Deviation of sector emissions from science-based pathway |

## 5 · Intermediate Transformation Logic
**Methodology:** PACE composite scoring
**Headline formula:** `paceComposite(s) = avg(Physical, Abatement, Carbon, Energy)`
**Standards:** ['IEA', 'IPCC AR6 WGIII', 'SBTi SDA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).