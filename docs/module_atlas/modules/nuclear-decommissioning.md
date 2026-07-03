# Nuclear Decommissioning Finance
**Module ID:** `nuclear-decommissioning` · **Route:** `/nuclear-decommissioning` · **Tier:** B (frontend-computed) · **EP code:** EP-DU4 · **Sprint:** DU

## 1 · Overview
Financial analytics for nuclear decommissioning covering unit cost ranges, segregated fund adequacy, cost escalation drivers, SAFDM vs DECON strategy comparison and NDF/NDA fund performance.

> **Business value:** Nuclear decommissioning costs range $500M–$8B per unit; fund adequacy ratios below 100% signal material balance sheet risk, with cost escalation driven by labour and low-level waste disposal at 2–4% real annually.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COST_DRIVERS`, `DD_STRATEGIES`, `GLOBAL_PLANTS`, `KpiCard`, `NDA_SITES`, `Slider`, `TABS`, `US_DOE_SITES`, `WASTE_STREAMS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `baseCost` | `reactorType === "LWR" ? reactorMw * 600 :` |
| `deferredPV` | `baseCost * stratMult / Math.pow(1 + wacc / 100, yearsDeferred);` |
| `nominalCost` | `baseCost * stratMult;` |
| `pvDecom` | `estimatedDecom / Math.pow(1 + w, yearsToDecom);` |
| `fundResult` | `useMemo(() => calcFundAdequacy({ plantMw: reactorMw, cf: 90, annualFund: annualFund * 1e6, wacc, yearsToDecom, estimatedDecom: decommResult.nominalCos` |
| `costDriverPie` | `COST_DRIVERS.map((d, i) => ({ ...d, fill: COLORS[i] }));` |
| `globalFundData` | `GLOBAL_PLANTS.map(p => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `COST_DRIVERS`, `DD_STRATEGIES`, `GLOBAL_PLANTS`, `NDA_SITES`, `TABS`, `US_DOE_SITES`, `WASTE_STREAMS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Unit Decommissioning Cost | `DCost = Labour + Waste Disposal + Engineering + Contingency` | NDA UK / NRC US Cost Studies | Wide range reflects reactor type, site complexity, waste classification and national labour costs. |
| Fund Adequacy Ratio | `FAR = PV(Assets) / PV(Liability)` | NRC 10 CFR 50.75 | Regulatory benchmark; sub-100% funds require remediation plans. |
| Cost Escalation Factor | `Escalation = Labour CPI × 0.6 + Waste Disposal Inflation × 0.4` | IAEA TRS-429 | Labour and low-level waste disposal dominate escalation above general inflation. |
- **NDA/NRC cost benchmarks + fund NAV data** → Liability PV model → fund adequacy gap analysis → **Decommissioning financial assurance dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund Adequacy Ratio
**Headline formula:** `FAR = PV(Fund Assets) / PV(Estimated Decommissioning Cost)`
**Standards:** ['IAEA Financing of Decommissioning (2007)', 'NRC Financial Assurance Regulations 10 CFR 50.75']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).