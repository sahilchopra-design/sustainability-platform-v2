# ESG Value Chain
**Module ID:** `esg-value-chain` · **Route:** `/esg-value-chain` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Maps and analyses ESG performance across the full corporate value chain including upstream suppliers, direct operations, and downstream customers and end-of-life. Integrates supply chain mapping, Scope 3 emissions by category, supplier ESG assessments, and customer product impact data. Supports GHG Protocol Scope 3 Category 1 and 11 reporting, CSDDD due diligence obligations, and extended producer responsibility analytics.

> **Business value:** Provides corporate sustainability teams and procurement functions with a systematic framework for mapping, measuring, and improving ESG performance across the entire value chain, enabling credible Scope 3 reporting, CSDDD compliance, and supplier engagement programmes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DATA`, `Btn`, `CERTIFICATION_DB`, `CERT_CODES`, `COMMODITIES`, `COUNTRY_GOV_DB`, `HUMAN_RIGHTS_RISKS`, `HeatCell`, `ILO_DECENT_WORK`, `KPI`, `REGIONAL_RISK_PROFILES`, `SUPPLY_CHAIN_TIERS`, `Sec`, `VALUE_CHAIN_LEVELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `CERT_CODES` | `CERTIFICATION_DB.map(c => c.code);` |
| `base` | `ci * 17 + 3;` |
| `countryESG` | `Math.round(seed(base) * 40 + 35);` |
| `regionESG` | `Math.round(seed(base + 1) * 45 + 25);` |
| `companyESG` | `Math.round(seed(base + 2) * 35 + 45);` |
| `sourceESG` | `Math.round(seed(base + 3) * 50 + 20);` |
| `childLaborRisk` | `Math.round(seed(base + 4) * 60 + 5);` |
| `livingWage` | `Math.round(seed(base + 5) * 50 + 30);` |
| `certCoverage` | `Math.round(seed(base + 6) * 55 + 15);` |
| `traceability` | `Math.round(seed(base + 7) * 60 + 20);` |
| `certs` | `CERT_CODES.filter((_, j) => seed(base + 10 + j) > 0.55);` |
| `ALL_DATA` | `COMMODITIES.map((name, i) => ({ name, ...genCommodityData(i) }));` |
| `ILO_DECENT_WORK` | `COUNTRY_GOV_DB.slice(0, 20).map((c, i) => ({` |
| `SUPPLY_CHAIN_TIERS` | `COMMODITIES.slice(0, 15).map((name, i) => ({` |
| `threshold` | `(idx) => 30 + seed(treeSeed * 7 + idx) * 40;` |
| `trees` | `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => decisionTree(features, t));` |
| `holdings` | `p.holdings.map(h => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATION_DB`, `COMMODITIES`, `COUNTRY_GOV_DB`, `HUMAN_RIGHTS_RISKS`, `REGIONAL_RISK_PROFILES`, `TABS`, `VALUE_CHAIN_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 3 Cat.1 Coverage (%) | — | GHG Protocol | Proportion of purchased goods and services spend with primary supplier emission data; below 40% requires secto |
| Supplier ESG Assessment Rate (%) | — | CSDDD / CDP Supply Chain | Proportion of Tier 1 suppliers with completed ESG assessment; CSDDD mandates risk-based due diligence across s |
| Value Chain Scope 3 (tCO2e) | — | GHG Protocol Scope 3 Standard | Total Scope 3 emissions across all 15 categories; typically 70â€“90% of total corporate GHG footprint in consu |
| Supplier ESG Score (0â€“100) | — | Supplier Assessment Tool | Aggregated ESG score of rated Tier 1 suppliers weighted by procurement spend; tracks supply chain ESG improvem |
- **Supply chain database (ERP / procurement system)** → Extract Tier 1 and Tier 2 supplier spend by UNSPSC category and country of origin → **Supplier spend map with category and geography for Scope 3 Cat.1 input**
- **Supplier ESG assessment responses** → Score against framework (EcoVadis/Sedex/custom); weight by procurement spend → **Spend-weighted supplier ESG score and assessment coverage rate**
- **Product use and end-of-life data (engineering models)** → Apply GHG Protocol Cat.11/12 methodology; use product energy ratings and lifetime assumptions → **Use-phase and end-of-life Scope 3 emissions by product line (tCO2e)**

## 5 · Intermediate Transformation Logic
**Methodology:** Value Chain ESG Score
**Headline formula:** `VCE = w_up × Upstream_ESG + w_ops × Operations_ESG + w_dn × Downstream_ESG`
**Standards:** ['GHG Protocol Scope 3 Standard 2011', 'EU CSDDD 2024', 'GRI 308/414 2016']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).