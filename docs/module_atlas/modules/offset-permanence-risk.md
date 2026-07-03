# Offset Permanence Risk Modeler
**Module ID:** `offset-permanence-risk` · **Route:** `/offset-permanence-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CN2 · **Sprint:** CN

## 1 · Overview
12 offset types with reversal probability modelling, buffer pool stress test, and climate-driven reversal risk.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUFFER_POOL_DATA`, `CATEGORIES`, `CAT_COLORS`, `CAUSES`, `CLIMATE_SCENARIOS`, `COST_PER_TONNE`, `INSURANCE_PRODUCTS`, `MONITORING_COSTS`, `OFFSET_TYPES`, `OffsetPermanenceRiskPage`, `PERMANENCE_DECAY_CURVES`, `PORTFOLIO_POSITIONS`, `RCP_LIST`, `RCP_MULT`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `REVERSAL_EVENTS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COST_PER_TONNE` | `OFFSET_TYPES.map((o,i) => ({` |
| `PORTFOLIO_POSITIONS` | `OFFSET_TYPES.map((o,i) => ({` |
| `BUFFER_POOL_DATA` | `OFFSET_TYPES.map((o,i) => ({` |
| `PERMANENCE_DECAY_CURVES` | `OFFSET_TYPES.map((o,idx) => ({` |
| `halfLife` | `o.permanenceYrs * 0.7;` |
| `remaining` | `halfLife > 0 ? Math.exp(-0.693*yr/halfLife)*100 : 100;` |
| `MONITORING_COSTS` | `OFFSET_TYPES.map((o,i) => ({` |
| `TABS` | `['Permanence Dashboard','Reversal Probability Engine','Buffer Pool Stress Test','Climate-Driven Reversal',` |
| `wtdPerm` | `n > 0 ? filtered.reduce((a,o) => a + o.permanenceYrs, 0) / n : 0;` |
| `avgRev` | `n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade, 0) / n : 0;` |
| `bufAdq` | `BUFFER_POOL_DATA.length > 0 ? BUFFER_POOL_DATA.reduce((a,b) => a + b.adequacyScore, 0) / BUFFER_POOL_DATA.length : 0;` |
| `insured` | `n > 0 ? (filtered.filter(o => o.insurable).length / n * 100) : 0;` |
| `monComp` | `MONITORING_COSTS.length > 0 ? MONITORING_COSTS.reduce((a,m) => a + m.complianceScore, 0) / MONITORING_COSTS.length : 0;` |
| `expLoss95` | `n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade * 1.65 * 100, 0) / n : 0;` |
| `reversalByBand` | `useMemo(() => filtered.map(o => {` |
| `avg` | `filtered.length > 0 ? filtered.reduce((a,o) => a + (1 - Math.pow(1-o.reversalDecade, yr/10))*100, 0) / filtered.length : 0;` |
| `bufferStress` | `useMemo(() => BUFFER_POOL_DATA.map(b => {` |
| `released` | `b.actualPct * (bufferRelease / 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `CAUSES`, `INSURANCE_PRODUCTS`, `OFFSET_TYPES`, `RCP_LIST`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Reversal | — | Historical | Wildfire-driven reversal risk |
| DAC Permanence | — | Geological | Lowest reversal risk of any offset type |

## 5 · Intermediate Transformation Logic
**Methodology:** Reversal probability model
**Headline formula:** `P(reversal, decade) = BaseRate × (1 + ClimateAmplifier(SSP))`
**Standards:** ['ICVCM', 'Buffer pool analysis']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).