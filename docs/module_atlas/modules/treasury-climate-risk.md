# Corporate Treasury Climate Risk Analytics
**Module ID:** `treasury-climate-risk` · **Route:** `/treasury-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DD5 · **Sprint:** DD

## 1 · Overview
Corporate treasury climate risk analytics covering FX exposure to climate-stressed economies, commodity price climate sensitivity, liquidity risk from physical events, climate VaR for treasury portfolio, and TCFD treasury disclosures.

> **Business value:** Provides integrated corporate treasury climate risk analytics augmenting conventional VaR with physical and transition risk multipliers, enabling TCFD-compliant climate treasury risk disclosure.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMMODITIES`, `COUNTERPARTIES`, `CURRENCIES`, `NGFS_SCENARIOS`, `SUPPLY_CHAIN_NODES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tier` | `Math.floor(i / 7.5) + 1;` |
| `climateRisk` | `20 + sr(i * 7) * 70;` |
| `climateRating` | `['AAA', 'AA', 'A', 'BBB', 'BB'][Math.floor(sr(i * 7) * 5)];` |
| `pd1y` | `climateRating === 'AAA' ? 0.001 + sr(i * 11) * 0.002 : climateRating === 'AA' ? 0.002 + sr(i * 11) * 0.005 : climateRating === 'A' ? 0.005 + sr(i * 11` |
| `ead` | `1 + sr(i * 13) * 49;` |
| `totalEad` | `COUNTERPARTIES.reduce((s, c) => s + c.ead, 0);` |
| `totalClimateVaR` | `COUNTERPARTIES.reduce((s, c) => s + c.climateVaR, 0);` |
| `fxHedgingCost` | `+(selectedCurrency.hedgingCost * exposureAmount * scenarioMultiplier).toFixed(2);` |
| `avgPd` | `COUNTERPARTIES.length ? COUNTERPARTIES.reduce((s, c) => s + c.pd1y, 0) / COUNTERPARTIES.length : 0;` |
| `commodityPriceData` | `useMemo(() => COMMODITIES.map(c => {` |
| `pct` | `ngfsScenario === 'Net Zero 2050' ? c.ngfs_nz : ngfsScenario === 'Current Policies' ? c.ngfs_cp : (c.ngfs_nz + c.ngfs_cp) / 2;` |
| `qtr` | `(q % 4) + 1;` |
| `baseFlow` | `80 + sr(q * 7) * 40;` |
| `climateStress` | `baseFlow * (0.05 + sr(q * 11) * 0.15) * scenarioMultiplier;` |
| `hedgingData` | `useMemo(() => CURRENCIES.map(c => {` |
| `unhedgedVaR` | `c.climateVulnScore * exposureAmount * 0.002 * scenarioMultiplier;` |
| `hedgedVaR` | `unhedgedVaR * (0.1 + c.hedgingCost * 0.5);` |
| `hedgingCost` | `c.hedgingCost * exposureAmount * scenarioMultiplier;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `CURRENCIES`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate-Adjusted Treasury VaR (95%) | `Conventional VaR × (1 + physical risk multiplier + transition risk multiplier)` | Internal treasury risk model + NGFS calibration | Climate multiplier adds 15-40% to conventional VaR for high-exposure corporate treasuries; discloses per TCFD  |
| Commodity Climate Sensitivity | `Increase in commodity price volatility under RCP 4.5 physical risk scenario` | NGFS physical risk × commodity supply model | Agricultural and energy commodities most sensitive; metals relatively stable; hedging cost increases proportio |
| Physical Event Liquidity Risk | `Estimated working capital disruption from 1-in-50yr physical climate event affecting key facilities` | RMS supply chain disruption model | Drives contingency liquidity requirement; increasingly relevant for climate-exposed supply chains and coastal  |
- **Bloomberg FX and commodity data** → Historical and forward price data → conventional VaR baseline → **Standard treasury VaR**
- **NGFS climate scenarios and physical risk data** → Climate multipliers by exposure type and scenario → climate VaR adjustment → **Climate-adjusted VaR**
- **RMS supply chain disruption model** → Physical event probability × business interruption loss → liquidity gap analysis → **Contingency liquidity requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** Treasury Climate VaR & Liquidity Risk
**Headline formula:** `Climate VaR = VaR_conventional × (1 + Climate Multiplier); Climate Multiplier = f(Physical Risk Score, Transition Risk Score, Concentration); Liquidity Risk = P(Physical Event) × Working Capital Disruption`
**Standards:** ['TCFD Recommendations — Treasury Risk Management', 'IFRS S2 Climate-related Disclosures 2023', 'BIS Working Paper 627 (2017) — FX and Climate Risk']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).