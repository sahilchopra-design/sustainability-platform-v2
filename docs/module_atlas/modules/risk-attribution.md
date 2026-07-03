# Risk Attribution
**Module ID:** `risk-attribution` · **Route:** `/risk-attribution` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio ESG and climate risk decomposition decomposing total risk into factor, sector, geography and issuer contributions using multi-factor attribution models.

> **Business value:** Decomposes portfolio risk into ESG and climate factor sources enabling targeted de-risking and factor tilts.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARKS`, `FACTOR_DEFS`, `RiskAttributionPage`, `TIME_PERIODS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ghgIntensity` | `(scope1 + scope2) / revenue;` |
| `esgExposure` | `(esgScore - 50) / 50;` |
| `momentumExposure` | `esgScore > 65 ? 0.2 : esgScore > 50 ? 0 : -0.2;` |
| `logCap` | `Math.log10(Math.max(marketCap, 1));` |
| `sizeExposure` | `Math.max(-1, Math.min(1, -(logCap - 4) / 2)); // 10k=negative to 100B=very negative; small = positive` |
| `revenueYield` | `revenue / marketCap;` |
| `valueExposure` | `Math.max(-1, Math.min(1, (revenueYield - 0.3) / 0.5));` |
| `qualityExposure` | `Math.max(-1, Math.min(1, (esgScore / 100) * 0.5 + (1 - transitionRisk / 100) * 0.5 - 0.5));` |
| `csv` | `[headers.join(','), ...rows.map(r => headers.map(h => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `enrichedRaw` | `useMemo(() => holdings.map(h => enrichFromMaster(h)), [holdings]);` |
| `intensities` | `enrichedRaw.map(h => {` |
| `mid` | `Math.floor(intensities.length / 2);` |
| `sum` | `Object.values(raw).reduce((s, v) => s + v, 0) \|\| 1;` |
| `totalWeight` | `enrichedHoldings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 1;` |
| `contrib` | `avgExposures[fk] * premium * effectiveWeights[fk] * periodMult;` |
| `residual` | `parseFloat((0.3 * periodMult).toFixed(4));` |
| `totalReturn` | `parseFloat((totalFactorReturn + residual + benchmark.totalReturn * periodMult).toFixed(3));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor β | — | Factor model | Portfolio sensitivity to aggregated ESG factor returns. |
| Climate Risk Share | — | Attribution engine | Proportion of total active risk attributable to climate transition and physical risk factors. |
| Sector Concentration | — | Portfolio analytics | Share of total risk explained by top-3 sector tilts versus benchmark. |
- **Portfolio holdings, factor exposures, covariance matrix** → Multi-factor regression, variance decomposition, attribution aggregation → **Factor risk reports, issuer drill-downs, benchmark comparison**

## 5 · Intermediate Transformation Logic
**Methodology:** Factor Risk Contribution
**Headline formula:** `w_i × β_i × σ_factor`
**Standards:** ['MSCI Factor Model', 'Barra USE4']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).