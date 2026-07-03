# Impact Investing Hub
**Module ID:** `impact-hub` · **Route:** `/impact-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an integrated impact measurement framework covering theory of change documentation, impact KPI tracking, additionality assessment, and IMP five dimensions of impact analysis. Supports impact-first and blended finance investors in managing, measuring, and reporting impact across diverse asset classes and SDG themes.

> **Business value:** Provides impact investors and fund managers with a rigorous framework for measuring, managing, and reporting impact across diverse asset classes, enabling credible impact claims, SDG alignment reporting, and blended finance structuring decisions grounded in evidence of additionality.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `KPI`, `LS_BOND`, `LS_FI`, `LS_IRIS`, `LS_IWA`, `LS_PORT`, `LS_VERI`, `MODULES`, `ModuleCard`, `PIE_COLORS`, `REGS`, `SDGS_17`, `Section`, `ThCell`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SDGS_17` | `Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordabl` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `fmtMn` | `(n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;` |
| `iwaEnvMn` | `Math.round(seed(s * 11) * 40 - 8);` |
| `iwaEmplMn` | `Math.round(seed(s * 13) * 25 - 5);` |
| `iwaProdMn` | `Math.round(seed(s * 17) * 30 + 2);` |
| `iwaTotalMn` | `iwaEnvMn + iwaEmplMn + iwaProdMn;` |
| `irisMetrics` | `Math.ceil(seed(s * 19) * 12 + 3);` |
| `bondImpactMn` | `Math.round(seed(s * 23) * 50 + 5);` |
| `ghgAvoided` | `Math.round(seed(s * 29) * 15000 + 500);` |
| `beneficiaries` | `Math.round(seed(s * 31) * 50000 + 2000);` |
| `evidenceTier` | `Math.min(5, Math.max(1, Math.ceil(seed(s * 37) * 5)));` |
| `impWashFlags` | `Math.floor(seed(s * 41) * 4);` |
| `blendedMn` | `Math.round(seed(s * 43) * 30);` |
| `leverageRatio` | `Math.round((1 + seed(s * 47) * 4) * 10) / 10;` |
| `additionalityScore` | `Math.round(40 + seed(s * 53) * 55);` |
| `impactROI` | `Math.round(-10 + seed(s * 59) * 35);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MODULES`, `PIE_COLORS`, `REGS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Impact Multiple of Money (IMM) | — | IMP / BlueMark impact analysis | Ratio of total social/environmental value created per €1 invested; private equity impact funds target IMM of 3 |
| SDG Alignment Score | — | IRIS+ / GIIN | Average number of SDGs materially addressed per portfolio company; concentrated impact strategies average 2â€“ |
| Additionality Rating | — | IMP additionality framework | Composite rating assessing enterprise additionality (whether the investee would have achieved impact without i |
| Impact Integrity Score | — | BlueMark / GIIN IRIS+ | Assessment of impact management system quality covering strategy, execution, learning, and accountability dime |
- **Investment portfolio data with SDG classification** → Map to IRIS+ metrics, define theory of change per investment → **Impact framework database**
- **Impact KPI data from investees (annual)** → Validate against third-party sources, apply monetisation coefficients → **Monetised impact value by investment**
- **Counterfactual baseline data** → Assess additionality using IMP enterprise and investor contribution framework → **Additionality scores by investment**

## 5 · Intermediate Transformation Logic
**Methodology:** Impact Weighted Return
**Headline formula:** `IWR = Financial_return + Σ_k (ImpactKPI_k × Monetisation_k × Attribution_k)`
**Standards:** ['IMP Five Dimensions Framework', 'Harvard Impact Weighted Accounts', 'GIIN IRIS+ Metrics Catalogue']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).