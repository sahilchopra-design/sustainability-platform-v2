# PPA & Revenue Analytics Engine
**Module ID:** `ppa-revenue-analytics` · **Route:** `/ppa-revenue-analytics` · **Tier:** B (frontend-computed) · **EP code:** RE-PPA1 · **Sprint:** RE

## 1 · Overview
Comprehensive power purchase agreement analytics and merchant revenue risk engine for renewable energy projects. Covers PPA pricing (fixed/indexed/proxy revenue swap), merchant price exposure, VPPA/CfD structuring, curtailment risk, counterparty ECL under IFRS 9, and revenue at risk (RaR) Monte Carlo across 18 analytical tabs.

> **Business value:** Designed for project finance bankers, independent power producers, and corporate renewable energy buyers structuring PPA and VPPA transactions. Covers the full revenue risk spectrum from fully-contracted PPA to fully-merchant exposure, with IFRS 9 ECL provisioning, VPPA mark-to-market, and curtailment analytics that replicate the commercial structuring analysis for 100–500 MW solar and wind deals.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `CORPORATE_BUYERS`, `CREDIT_RATINGS`, `KpiCard`, `MARKETS`, `MARKET_META`, `MONTHLY_CF`, `PD_BY_RATING`, `PPA_CONTRACTS`, `PPA_PRICE_HISTORY`, `STATE_RPS`, `SelectInput`, `Sidebar`, `SliderInput`, `TABS`, `Tab1`, `Tab10`, `Tab11`, `Tab12`, `Tab13`, `Tab14`, `Tab15`, `Tab16`, `Tab17`, `Tab18`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `v => `$${(v / 1).toFixed(1)}M`;` |
| `fmtPct` | `v => `${(v * 100).toFixed(1)}%`;` |
| `MARKETS` | `['ERCOT','CAISO','PJM','MISO','SPP','NYISO','ISO-NE','UK','Germany','Australia'];` |
| `CREDIT_RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'];` |
| `PD_BY_RATING` | `{ AAA:0.0001,['AA+']:0.0002,AA:0.0003,['AA-']:0.0004,['A+']:0.0005,A:0.0006,['A-']:0.0008,['BBB+']:0.0015,BBB:0.0022,['BBB-']:0.0040,['BB+']:0.0070,BB` |
| `autoGWh` | `Math.round(cfg.capacityMW * (cfg.capacityCF / 100) * 8760 / 1000);` |
| `p90` | `Math.round(cfg.p50GWh * 0.90);` |
| `contractedGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);` |
| `merchantGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (merchantPct / 100);` |
| `ppaRev` | `contractedGWh * cfg.strikeMWh / 1000;` |
| `merchantRev` | `merchantGWh * cfg.merchantLMP * (1 - Math.abs(cfg.basisPct) / 100) / 1000;` |
| `recRev` | `cfg.p50GWh * cfg.recPrice / 1000;` |
| `totalRev` | `ppaRev + merchantRev + recRev;` |
| `discountRate` | `cfg.discountRate / 100;` |
| `escalatedPrice` | `cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);` |
| `varMerchant` | `merchantRev * (cfg.merchantSigmaPct / 100) * 1.645;` |
| `wale` | `cfg.ppaTermYr * (cfg.contractedPct / 100);` |
| `contractedGWh` | `cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `CORPORATE_BUYERS`, `CREDIT_RATINGS`, `MARKETS`, `PPA_PRICE_HISTORY`, `STATE_RPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PPA Price (fixed) | `Negotiated; benchmarked vs LCOE + developer margin` | LevelTen Energy PPA Index | Contracted energy price for PPA tenor (10–20yr); must exceed LCOE for positive equity return; $45–55/MWh typic |
| Merchant Revenue Share | `Uncontracted generation × spot price` | Day-ahead market data | Residual revenue after PPA obligation; 100% merchant projects use Price Cap Contract (CfD) as downside protect |
| VPPA Settlement | `(Strike − Spot) × MWh generated` | EFET VPPA terms | Virtual/financial PPA — no physical delivery; corporate buyer receives/pays settlement when spot diverges from |
| Curtailment Rate | `Curtailed MWh / Available MWh` | ISO/RTO dispatch data | Grid-instructed curtailment for congestion management; increases with RE penetration; basis risk if curtailmen |
| Counterparty ECL | `PD × LGD × EAD (IFRS 9)` | S&P transition matrix | Expected credit loss on PPA receivables; investment-grade offtaker (BBB+): ~0.2% ECL; sub-IG: 1.5–4% ECL; coll |
| Revenue at Risk (95%) | `σ_combined × 1.645 × annual revenue` | Monte Carlo model | Maximum annual revenue shortfall at 95% confidence; sum in quadrature of volume, price, and curtailment varian |
- **PPA contract terms (price, tenor, volume, indexation, floor/cap)** → Revenue model: contracted + merchant + REC + ancillary → **Annual revenue breakdown, DSCR under PPA + merchant scenarios**
- **Monte Carlo: generation σ, merchant price GBM, curtailment γ distribution** → Combined revenue variance model (sum in quadrature) → **P10/P50/P90 annual revenue, Revenue at Risk at 95% confidence**
- **Counterparty credit rating + collateral structure (LC, escrow, parent guarantee)** → IFRS 9 ECL: S&P transition PD × LGD × EAD → **Expected credit loss provision on PPA receivables, DSCR adjusted for ECL**

## 5 · Intermediate Transformation Logic
**Methodology:** PPA Pricing + Merchant VaR + VPPA Mark-to-Market
**Headline formula:** `RaR₉₅ = σ_rev × 1.645 × E_gen; VPPA_MTM = (VPPA_strike − P_spot) × E_gen; ECL = PD × LGD × EAD`
**Standards:** ['IFRS 9 ECL', 'EFET PPA Master Agreement', 'FERC PURPA', 'RE100 VPPA Standards']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).