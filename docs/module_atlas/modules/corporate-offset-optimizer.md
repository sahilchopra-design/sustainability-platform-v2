# Corporate Offset Optimizer
**Module ID:** `corporate-offset-optimizer` · **Route:** `/corporate-offset-optimizer` · **Tier:** B (frontend-computed) · **EP code:** EP-CN3 · **Sprint:** CN

## 1 · Overview
Quality-cost frontier optimization for corporate offset procurement. Blend optimizer with regulatory acceptance matrix.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLEND_SCENARIOS`, `CORPORATE_TARGETS`, `CREDIT_TYPES`, `CorporateOffsetOptimizerPage`, `FONT`, `JURISDICTIONS`, `MONO`, `MULTI_YEAR_PLAN`, `PAL`, `PROCUREMENT_HISTORY`, `SDG_LABELS`, `TABS`, `VENDOR_QUOTES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `FONT` | `"'DM Sans','SF Pro Display',system-ui,sans-serif";` |
| `base` | `3000 + m * 150;` |
| `pill` | `(ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: ok ? T.green + '18' : T.red + '18` |
| `allMethods` | `useMemo(() => ['All', ...[...new Set(CREDIT_TYPES.map(c => c.method))].sort()], []);` |
| `sorted` | `[...eligible].sort((a, b) => (b.qualityScore / Math.max(0.01, b.costPerTonne)) - (a.qualityScore / Math.max(0.01, a.costPerTonne)));` |
| `budgetM` | `budget * 1e6;` |
| `maxT` | `Math.min(remaining / Math.max(0.01, c.costPerTonne), c.maxAvailable);` |
| `totalTonnes` | `useMemo(() => autoBlend.reduce((a, b) => a + b.tonnes, 0), [autoBlend]);` |
| `totalSpend` | `useMemo(() => autoBlend.reduce((a, b) => a + b.spend, 0), [autoBlend]);` |
| `avgQuality` | `useMemo(() => totalTonnes > 0 ? Math.round(autoBlend.reduce((a, b) => a + b.qualityScore * b.tonnes, 0) / totalTonnes) : 0, [autoBlend, totalTonnes]);` |
| `ytd` | `PROCUREMENT_HISTORY.slice(-6).reduce((a, b) => a + b.tonnesBought, 0);` |
| `annual` | `CORPORATE_TARGETS.totalEmissions * CORPORATE_TARGETS.interimTarget2030;` |
| `totalW` | `Object.values(customBlend).reduce((a, b) => a + b, 0);` |
| `budgetM` | `budget * 1e6;` |
| `alloc` | `(w / Math.max(1, totalW)) * budgetM;` |
| `budgetM` | `budget * 1e6;` |
| `totalW` | `Object.values(sc.weights).reduce((a, b) => a + b, 0);` |
| `alloc` | `(w / Math.max(0.01, totalW)) * budgetM;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLEND_SCENARIOS`, `CREDIT_TYPES`, `JURISDICTIONS`, `MULTI_YEAR_PLAN`, `PAL`, `SDG_LABELS`, `TABS`, `VENDOR_QUOTES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frontier Points | — | Optimization | Pareto-optimal blend combinations |

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio optimization on quality-cost frontier
**Headline formula:** `Minimize: Σ(cost_i × qty_i) subject to: quality_score ≥ target, Σ(qty_i) ≥ offset_need`
**Standards:** ['ICVCM', 'CORSIA', 'TSVCM']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).