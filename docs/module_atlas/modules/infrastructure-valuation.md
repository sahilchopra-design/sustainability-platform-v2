# Infrastructure Valuation
**Module ID:** `infrastructure-valuation` · **Route:** `/infrastructure-valuation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides climate-risk adjusted infrastructure asset valuation integrating physical and transition risk factors into discounted cash flow (DCF) models, net asset value (NAV) computation, and internal rate of return (IRR) stress testing. Covers stranded asset probability weighting and insurance cost escalation under climate scenarios.

> **Business value:** Enables infrastructure investors and lenders to quantify climate risk in asset valuations, compare climate-adjusted IRRs across asset classes, assess stranded asset probability under 1.5°C scenarios, and disclose climate VaR in accordance with TCFD recommendations for asset owners.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CP_SCENARIOS`, `ENERGY_ASSETS`, `GREENIUM_DATA`, `INFRA_PROJECTS`, `REG_PERIODS`, `UK_UTILITIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `carbonCostRatio` | `(carbonIntensity * carbonPrice2030) / 1000;` |
| `timeDiscountFactor` | `Math.max(0, 1 - (remainingLife / 30));` |
| `demandSubstitution` | `Math.min(0.12, carbonIntensity * 0.08);` |
| `base` | `carbonCostRatio * 0.8 + timeDiscountFactor * 0.15 + demandSubstitution;` |
| `REG_PERIODS` | `['Ofgem RIIO-ED2 (2023-2028)', 'Ofwat PR24 (2025-2030)', 'CAA Q6 (2022-2027)'];` |
| `names` | `['Drax Coal Units 1-3', 'Fiddlers Ferry Gas CCGT', 'West Burton A Coal', 'Saltend Chemicals Gas', 'Kilroot Coal Plant', 'Ferrybridge D Gas', 'Cottam G` |
| `allowedRev` | `editRab * (selectedUtility.allowedReturn / 100);` |
| `regGap` | `(selectedUtility.actualROCE / 100 - selectedUtility.allowedReturn / 100) * editRab;` |
| `debt` | `gfCapex * (1 - gfEquity / 100);` |
| `equity` | `gfCapex * (gfEquity / 100);` |
| `annualRev` | `gfCapex * (0.18 + sr(selectedProject * 3 + 1) * 0.12);` |
| `annualOpex` | `annualRev * 0.35;` |
| `annualDsvc` | `debt * 0.07;` |
| `fcf` | `annualRev - annualOpex - annualDsvc;` |
| `irr` | `gfTargetIRR / 100 * (1 - gfConstRisk * 0.008);` |
| `equityIRR` | `irr + 0.025 + (1 - gfEquity / 100) * 0.015;` |
| `dscr` | `(annualRev - annualOpex) / Math.max(annualDsvc, 0.001); // guard: equity=100% → debt=0 → annualDsvc=0` |
| `dscrMin` | `dscr * (0.85 + sr(selectedProject * 5 + 2) * 0.1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GREENIUM_DATA`, `INFRA_PROJECTS`, `REG_PERIODS`, `UK_UTILITIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate VaR (% NAV) | — | NGFS / EDHECinfra | Maximum NAV loss at 95% confidence under the NGFS Disorderly transition scenario; coastal and fossil fuel infr |
| Stranded Asset Probability (%) | — | IEA NZE stranded asset analysis | Probability that the asset becomes economically unviable before end of technical life under a 1.5°C scenario;  |
| Insurance Cost Escalation (% pa) | — | Swiss Re sigma / Lloyd's market data | Annual rate of physical risk insurance premium escalation for high-risk infrastructure assets; compound effect |
| IRR Sensitivity to Carbon Price (ΔIRR/€10 tCO2) | — | Scenario stress test | IRR reduction per €10/tCO2 carbon price increase; gas power plants typically show -0.8 to -1.2% IRR sensitivit |
- **Infrastructure asset cash flow model** → Apply stranded asset probability and climate cost overlays → **Climate-adjusted cash flows by year and scenario**
- **NGFS economic impact data by scenario** → Map GDP and sector impact to infrastructure revenue assumptions → **Revenue stress factors by scenario**
- **Insurance market data (Swiss Re sigma)** → Model insurance premium escalation curves for asset type and geography → **Climate insurance cost escalation by asset**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted NAV
**Headline formula:** `NAV_climate = Σ_t (CF_t × (1 - Stranded_prob_t) - ClimateCost_t) / (1 + r_t)^t`
**Standards:** ['EDHECinfra Infrastructure Valuation', 'IPCC AR6 Physical Risk Cost Estimates', 'NGFS Climate Scenario Economic Impacts']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).