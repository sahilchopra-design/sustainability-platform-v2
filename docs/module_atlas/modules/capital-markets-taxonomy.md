# Capital Markets EU Taxonomy Analytics
**Module ID:** `capital-markets-taxonomy` · **Route:** `/capital-markets-taxonomy` · **Tier:** B (frontend-computed) · **EP code:** EP-DI3 · **Sprint:** DI

## 1 · Overview
EU Taxonomy alignment analytics for capital markets products including equity funds, bond indices, and ETFs. Calculates taxonomy-aligned revenue, capex, and opex by portfolio holding, computes GAR and BTAR metrics, and assesses Article 8/9 SFDR eligibility.

> **Business value:** Delivers end-to-end EU Taxonomy alignment analytics for capital markets products, enabling accurate GAR/BTAR computation and SFDR Article 8/9 classification with full holding-level transparency.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `BOND_TYPES`, `CTB_PAB_RULES`, `CURRENCIES`, `CapitalMarketsTaxonomyPage`, `EQUITIES`, `EQUITY_TICKERS`, `FACTORS`, `GAR_COMPONENTS`, `GICS_CODES`, `GREENIUM_HISTORY`, `GSS_FRAMEWORKS`, `GssPill`, `ICMA_FRAMEWORKS`, `ISSUER_NAMES`, `Kpi`, `NACE_CODES`, `NGFS_SHOCKS`, `RATINGS`, `REG_DATAPOINTS`, `SECTORS`, `SLB_PIPELINE`, `SLB_TRACKING`, `SPO_PROVIDERS`, `TREASURY_CURVE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RATINGS` | `['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB'];` |
| `BOND_TYPES` | `['Green', 'Social', 'Sustainability', 'Sustainability-Linked', 'Conventional'];` |
| `ICMA_FRAMEWORKS` | `['GBP 2021', 'SBP 2023', 'SBG 2021', 'SLB 2024', 'N/A'];` |
| `coupon` | `+(0.5 + r(i * 11) * 6).toFixed(3);` |
| `maturityYears` | `Math.floor(3 + r(i * 17) * 27);` |
| `ytm` | `+(coupon + (r(i * 23) - 0.5) * 1.5).toFixed(3);` |
| `spread` | `Math.floor(30 + r(i * 29) * 250);` |
| `gSpread` | `spread + Math.floor((r(i * 31) - 0.5) * 40);` |
| `amount` | `Math.floor(100 + r(i * 37) * 2400);` |
| `isin` | ``${currency === 'EUR' ? 'XS' : currency === 'USD' ? 'US' : currency === 'GBP' ? 'GB' : 'JP'}${String(hashStr(issuer + i)).padStart(10, '0').slice(0, 1` |
| `uop` | `type === 'Conventional' ? 'N/A' : UOP_CATEGORIES[Math.floor(r(i * 41) * UOP_CATEGORIES.length)];` |
| `framework` | `type === 'Green' ? 'GBP 2021' : type === 'Social' ? 'SBP 2023' : type === 'Sustainability' ? 'SBG 2021' : type === 'Sustainability-Linked' ? 'SLB 2024` |
| `spo` | `type === 'Conventional' ? '—' : SPO_PROVIDERS[Math.floor(r(i * 43) * SPO_PROVIDERS.length)];` |
| `cicRating` | `type === 'Conventional' ? '—' : ['Dark Green', 'Medium Green', 'Light Green', 'Dark Green', 'Medium Green'][Math.floor(r(i * 47) * 5)];` |
| `alignment` | `type === 'Conventional' ? 0 : Math.floor(40 + r(i * 53) * 58);` |
| `rating` | `RATINGS[Math.floor(r(i * 59) * RATINGS.length)];` |
| `EQUITIES` | `EQUITY_TICKERS.map((ticker, i) => {` |
| `revenue` | `Math.floor(500 + r(i * 7) * 49500);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `CTB_PAB_RULES`, `CURRENCIES`, `EQUITY_TICKERS`, `FACTORS`, `GAR_COMPONENTS`, `GICS_CODES`, `GSS_FRAMEWORKS`, `ICMA_FRAMEWORKS`, `ISSUER_NAMES`, `NACE_CODES`, `NGFS_SHOCKS`, `RATINGS`, `REG_DATAPOINTS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fund Taxonomy Alignment (Revenue) | `Σ(weight_i × turnover_alignment_i)` | EU Taxonomy company disclosures / Clarity AI | SFDR Art 9 funds target >80%; Art 8 funds typically 15-40%; regulatory minimum in PAIS template |
| Green Asset Ratio | `Taxonomy-aligned exposures / total covered assets × 100` | EBA GAR disclosure template | Banks must disclose GAR; target trajectory to 2030 set in transition plans; sector leaders >20% |
| DNSH Pass Rate | `Holdings passing all DNSH criteria / holdings screened` | MSCI ESG / Sustainalytics DNSH screening | Measures portfolio quality beyond headline alignment; low rate signals hidden ESG risks |
- **EU Taxonomy company disclosures (CSRD/NFRD)** → Revenue/capex/opex alignment % by activity → holding-level taxonomy data → **Fund-level weighted alignment metrics**
- **MSCI / Sustainalytics / Clarity AI taxonomy data** → Estimated alignment for non-disclosing companies → gap filling for portfolio coverage → **PAIS template and GAR inputs**
- **SFDR RTS templates** → Principal adverse impact indicators → Article 8/9 eligibility assessment → **Regulatory disclosure outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** EU Taxonomy Alignment Aggregation
**Headline formula:** `Fund Taxonomy Alignment = Σ(Holding Weight × Holding Taxonomy %) ; GAR = Taxonomy-Aligned Exposures / Total Covered Assets`
**Standards:** ['EU Taxonomy Regulation (EU) 2020/852', 'SFDR Regulation (EU) 2019/2088 + RTS (EU) 2022/1288', 'EBA Green Asset Ratio Delegated Act 2022']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).