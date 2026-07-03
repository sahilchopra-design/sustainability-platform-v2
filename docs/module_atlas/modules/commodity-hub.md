# Commodity Intelligence Hub
**Module ID:** `commodity-hub` · **Route:** `/commodity-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates price analytics, supply chain climate exposure, and TCFD commodity risk signals across energy, metals, and agricultural raw materials. Integrates forward curve data with physical supply disruption probabilities and carbon intensity benchmarks for portfolio-level commodity risk management.

> **Business value:** Enables commodity risk officers and portfolio managers to identify which raw material exposures carry the highest climate-adjusted risk, prioritise supply chain diversification, and populate TCFD commodity risk sections of annual reports.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `Badge`, `CARBON_MKTS`, `CRITICAL_MINERALS`, `Card`, `HEATMAP_COMMODITIES`, `HeatCell`, `KPICard`, `LS_PORT`, `MODULES`, `PIE_COLORS`, `REGS`, `RiskBadge`, `SCENARIO_PRESETS`, `SectionTitle`, `SortableTable`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(n) => n == null ? '\u2014' : `${Math.round(n)}%`;` |
| `fmtMn` | `(n) => n >= 1000 ? `$${(n/1000).toFixed(1)}Bn` : `$${Math.round(n)}Mn`;` |
| `fmtK` | `(n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${Math.round(n)}`;` |
| `commodityExposurePct` | `Math.round(5 + seed(s * 11) * 35);` |
| `topCommodity` | `['Oil & Gas','Metals','Agriculture','Chemicals','Mining','Energy','Materials','Tech Metals'][Math.floor(seed(s * 13) * 8)];` |
| `supplyChainsMapped` | `Math.ceil(seed(s * 17) * 12 + 2);` |
| `lcaProducts` | `Math.ceil(seed(s * 19) * 8 + 1);` |
| `financialFlowMn` | `Math.round(seed(s * 23) * 500 + 50);` |
| `externalityCostMn` | `Math.round(seed(s * 29) * 80 + 5);` |
| `esgVCScore` | `Math.round(25 + seed(s * 31) * 65);` |
| `lifecycleGHG` | `Math.round(seed(s * 37) * 200000 + 5000);` |
| `waterFootprint` | `Math.round(seed(s * 41) * 5000 + 200);` |
| `biodiversityImpact` | `Math.round(seed(s * 43) * 50 + 2);` |
| `circularScore` | `Math.round(15 + seed(s * 47) * 70);` |
| `eudrCompliance` | `Math.round(40 + seed(s * 53) * 55);` |
| `childLaborRisk` | `seed(s * 59) > 0.7 ? 'High' : seed(s * 61) > 0.4 ? 'Medium' : 'Low';` |
| `carbonExposure` | `Math.round(seed(s * 67) * 45 + 5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERT_TYPES`, `CARBON_MKTS`, `CRITICAL_MINERALS`, `HEATMAP_COMMODITIES`, `MODULES`, `PIE_COLORS`, `REGS`, `SCENARIO_PRESETS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Price Volatility (90d) | — | Bloomberg Commodity Index | Annualised 90-day realised volatility; energy commodities typically 30-55%, base metals 18-30% |
| Supply Disruption Probability | — | IEA / Oxford Economics | Probability of >10% supply shock within 24 months based on geopolitical and climate hazard models |
| Carbon Intensity | — | IPCC/IEA LCA Databases | Lifecycle GHG intensity per tonne of commodity produced and shipped to port |
| Commodity Climate VaR | — | NGFS/ECB | Value-at-risk attributable to climate physical and transition drivers at 95th percentile |
| Forward Curve Contango | — | CME/LME | Spot-to-12m futures spread indicating market expectation of supply/demand trajectory |
- **Bloomberg/CME price feeds** → Normalise to USD/tonne, compute 30/60/90d volatility → **PriceVol score per commodity**
- **IEA production region data** → Overlay IPCC hazard maps, compute disruption probability → **SupplyDisruption score**
- **GHG Protocol Scope 3 LCA databases** → Aggregate upstream extraction and transport emissions → **CarbonIntensity tCO₂e/t**

## 5 · Intermediate Transformation Logic
**Methodology:** TCFD Commodity Risk Composite
**Headline formula:** `CommodityRisk = w₁×PriceVol + w₂×SupplyDisruption + w₃×CarbonIntensity`
**Standards:** ['TCFD 2021', 'IPCC AR6 WGII', 'IEA Commodity Markets']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).