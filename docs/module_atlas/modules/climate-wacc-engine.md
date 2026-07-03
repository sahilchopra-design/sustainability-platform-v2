# Climate-Adjusted WACC Engine
**Module ID:** `climate-wacc-engine` · **Route:** `/climate-wacc-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-DD1 · **Sprint:** DD

## 1 · Overview
Climate-adjusted WACC engine for corporate valuation. Estimates carbon beta, decomposes climate risk premium into physical and transition components, applies sector-specific WACC uplift, and enables IFRS S2 cost of capital disclosure.

> **Business value:** Provides sector-specific climate-adjusted WACC calculation decomposing carbon beta, physical risk, and transition risk premiums, enabling IFRS S2-compliant cost of capital disclosures.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `OUTLOOKS`, `RATINGS`, `SECTORS`, `SECTOR_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseWacc` | `0.06 + sr(i * 7) * 0.06;` |
| `climateRiskPremium` | `(sec === 'Energy' \|\| sec === 'Utilities' \|\| sec === 'Materials') ? sr(i * 11) * 0.025 + 0.01 : sr(i * 11) * 0.012;` |
| `greenDiscount` | `sr(i * 13) * 0.015;` |
| `esgScore` | `30 + sr(i * 17) * 60;` |
| `beta` | `0.7 + sr(i * 19) * 1.3;` |
| `marketCap` | `2 + sr(i * 23) * 198;` |
| `taxRate` | `0.18 + sr(i * 29) * 0.12;` |
| `debtWeight` | `0.2 + sr(i * 31) * 0.4;` |
| `equityCost` | `baseWacc * 1.3 + climateRiskPremium;` |
| `debtCost` | `baseWacc * 0.6 + sr(i * 37) * 0.02;` |
| `carbonIntensity` | `sec === 'Energy' ? 200 + sr(i * 41) * 800 : sec === 'Materials' ? 100 + sr(i * 41) * 400 : 10 + sr(i * 41) * 190;` |
| `TABS` | `['WACC Dashboard', 'Equity Cost Model', 'Debt Cost Model', 'Sector Analysis', 'Scenario Comparison', 'Peer Benchmarking', 'Capital Optimizer', 'ESG-CA` |
| `avgAdjWacc` | `filtered.length ? (filtered.reduce((s, c) => s + c.adjustedWacc, 0) / filtered.length * 100) : 0;` |
| `avgBaseWacc` | `filtered.length ? (filtered.reduce((s, c) => s + c.baseWacc, 0) / filtered.length * 100) : 0;` |
| `avgEsg` | `filtered.length ? (filtered.reduce((s, c) => s + c.esgScore, 0) / filtered.length) : 0;` |
| `avgCarbonIntensity` | `filtered.length ? (filtered.reduce((s, c) => s + c.carbonIntensity, 0) / filtered.length) : 0;` |
| `sectorSummary` | `useMemo(() => SECTORS.map(sec => {` |
| `carbonAdjustedWacc` | `useMemo(() => filtered.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `OUTLOOKS`, `RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Beta | `Regression of stock return vs EUA carbon price return over 3yr rolling window` | Bloomberg EUA price data + company equity returns | Beta>0.5 indicates high carbon price sensitivity (utilities, cement); <0.2 low sensitivity (tech, healthcare); |
| Climate WACC Uplift | `Total climate risk premium added to conventional WACC` | ECB climate stress test framework | Uplift ranges 30-200 bps by sector; oil & gas 120-180 bps; utilities 60-90 bps; real estate coastal 80-150 bps |
| Transition Risk Premium | `Additional cost of capital from stranded asset risk and regulatory transition costs` | NGFS transition scenario implied equity risk premia | Dominant component for high-emitters; decomposed from scenario analysis of stranded asset NPV impact on enterp |
- **Bloomberg equity returns and EUA price time series** → Daily returns for carbon beta regression → systematic climate risk component → **Carbon beta by company**
- **NGFS climate scenarios (orderly, disorderly, hot house)** → GDP impact, carbon price, stranded asset trajectories → transition risk premium calibration → **Climate WACC uplift by scenario**
- **IPCC physical risk data and asset exposure** → Physical hazard by location and RCP scenario → physical risk premium by asset geography → **Total climate WACC decomposition**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Risk Premium Decomposition
**Headline formula:** `Climate WACC = WACC_base + Carbon Beta × (Rm - Rf) + Physical Risk Premium + Transition Risk Premium; Carbon Beta = Cov(Return, Carbon Price) / Var(Return)`
**Standards:** ['IFRS S2 Climate-related Disclosures 2023', 'ECB Guide on Climate and Environmental Risks 2020', 'Carney (2015) Breaking the Tragedy of the Horizon — Carbon Beta Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).