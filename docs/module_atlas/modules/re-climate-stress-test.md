# RE Climate Stress Test
**Module ID:** `re-climate-stress-test` · **Route:** `/re-climate-stress-test` · **Tier:** B (frontend-computed) · **EP code:** EP-EI4 · **Sprint:** EI

## 1 · Overview
NGFS-aligned climate stress testing for real estate portfolios: 4 scenario stress parameters (LTV/NOI/cap rate/vacancy), 6 sector risk profiles, 20-asset portfolio stress table, Radar chart for physical vs transition risk, and stressed NAV vs base NAV calculation.

> **Business value:** Used by real estate lenders running NGFS stress tests on mortgage books, REIT CFOs preparing TCFD scenario disclosures, and supervisory teams assessing physical and transition risk exposure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PORTFOLIO`, `Pill`, `SCENARIOS`, `SECTOR_RISK`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `portfolioValue` | `useMemo(() => PORTFOLIO.reduce((a, p) => a + p.value, 0), []);` |
| `stressedValue` | `useMemo(() => (portfolioValue * (1 + sel.ltv_impact / 100)).toFixed(0), [portfolioValue, sel]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SCENARIOS`, `SECTOR_RISK`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Net Zero 2050 LTV impact | `Transition risk managed; physical risk limited` | NGFS Scenarios v4.0 2023 | Orderly transition: early action limits physical damage; managed transition costs are priced in gradually. |
| NGFS Hot House LTV impact | `Under 4°C unmitigated warming by 2100` | NGFS Physical Risk Scenarios 2023 | Severe physical damage (flooding, heat stress) undermines asset values; transition costs also higher due to la |
| EBA Pillar 2 climate add-on | `Additional capital for physical risk exposed RE` | EBA Climate Risk Management Guidelines 2023 | Supervisors increasingly applying P2 add-ons for banks with high concentration in physically exposed RE collat |
- **NGFS v4.0 + TCFD + ECB Climate Stress Test + EBA Climate Risk Guidelines** → Scenario selector + sector stress profiles + asset stress table + radar analysis + stressed NAV calc → **Real estate lenders, REIT CFOs, climate risk teams, and bank supervisory analysts**

## 5 · Intermediate Transformation Logic
**Methodology:** Stressed NAV
**Headline formula:** `StressedNAV = BaseNAV × (1 + ΔLTV_impact) × (1 + ΔNOI_impact / CapRate); Stressed_CapRate = BaseCapRate + Δcap_rate; Stressed_NOI = BaseNOI × (1 + ΔNOI_pct); StressedValue = StressedNOI / Stressed_CapRate`
**Standards:** ['NGFS Climate Scenarios 2023', 'TCFD Scenario Analysis Guidance 2021', 'ECB Climate Risk Stress Test 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).