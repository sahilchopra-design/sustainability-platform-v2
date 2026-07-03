# Ocean Carbon Credit Market Analytics
**Module ID:** `ocean-carbon-credit-market` · **Route:** `/ocean-carbon-credit-market` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ1 · **Sprint:** DZ

## 1 · Overview
Ocean-based carbon credit market analytics covering kelp/macroalgae, ocean alkalinity enhancement, seagrass, and shellfish aquaculture credits. Compares MRV methodologies, permanence challenges, and emerging price benchmarks.

> **Business value:** Provides market intelligence on the nascent ocean CDR credit market, integrating MRV maturity scoring, permanence risk assessment, and price benchmarking to guide procurement decisions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CREDIT_TYPES`, `FORWARD_CURVE`, `Kpi`, `PRICE_HISTORY`, `QUALITY_METRICS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgPrice` | `CREDIT_TYPES.length > 0 ? CREDIT_TYPES.reduce((s, c) => s + c.price2025, 0) / CREDIT_TYPES.length : 0;` |
| `totalBuyerBudget` | `BUYERS.reduce((s, b) => s + b.annualBudgetM, 0);` |
| `portfolioTotal` | `portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.credits, 0) : 0;` |
| `portfolioAvgPrice` | `portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.price * p.credits, 0) / portfolioTotal : 0;` |
| `affordableCredits` | `Math.floor(budget * 1e6 / 6 / c.price2025);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BUYERS`, `CREDIT_TYPES`, `FORWARD_CURVE`, `PRICE_HISTORY`, `QUALITY_METRICS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ocean CDR Price Range | `Market price range across ocean CDR methods by permanence and MRV maturity` | CDR.fyi and Frontier ocean procurement data | OAE/geological storage at high end ($100-180); macroalgae at low end ($20-50) due to permanence uncertainty |
| MRV Maturity Score | `Average MRV maturity across ocean CDR pathways (methodology approval, monitoring, verification)` | Verra/ISO methodology pipeline | Most ocean CDR pathways at pilot stage; geological marine CCS highest maturity; macroalgae/OAE pre-commercial |
| Ocean CDR Market Volume | `Total forward commitments and spot purchases of ocean-based CDR credits (2023)` | CDR.fyi ocean segment data | Nascent but rapidly growing; Stripe/Shopify advance purchases driving methodology development |
- **CDR.fyi ocean segment transaction database** → Forward commitment prices, volumes, MRV approach → market price benchmarking → **Ocean CDR price discovery**
- **Verra/Gold Standard methodology pipeline** → Methodology development status for ocean pathways → MRV maturity scoring → **Methodology risk assessment**
- **NOAA ocean monitoring data** → pCO2, alkalinity, dissolved inorganic carbon → physical baseline for MRV → **Ocean carbon flux quantification**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean CDR Credit Pricing & MRV Maturity
**Headline formula:** `Ocean CDR Price = f(Permanence Tier, MRV Maturity, Co-benefit Score); Permanence-Adjusted Value = Spot Price × Permanence Factor × (1 - Reversal Risk)`
**Standards:** ['High Level Panel for a Sustainable Ocean Economy — Ocean Carbon Guide', 'NOAA Ocean Carbon Research Programme', 'Verra VCS emerging ocean methodology pipeline']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).