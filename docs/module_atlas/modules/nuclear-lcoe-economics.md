# Nuclear LCOE Economics
**Module ID:** `nuclear-lcoe-economics` · **Route:** `/nuclear-lcoe-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-DU1 · **Sprint:** DU

## 1 · Overview
Levelised cost analysis for large nuclear and SMR technologies covering overnight cost trends, historical overruns, capacity factors, decommissioning provisions and fuel cost components.

> **Business value:** Nuclear LCOE ranges from $90–$160/MWh for large LWRs; SMRs target $60–$100/MWh at NOAK scale driven by 10–15% factory-learning rates and 90–95% capacity factors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPARABLES`, `KpiCard`, `REACTOR_TYPES`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capexAnn` | `capexPerKw * w / (1 - Math.pow(1 + w, -lifetime));` |
| `idcFactor` | `Math.pow(1 + w, constructYr / 2);` |
| `capexAdj` | `capexAnn * idcFactor;` |
| `decomm` | `capexPerKw * decommPct / 100 * w / (1 - Math.pow(1 + w, -lifetime));` |
| `annualMwh` | `cf / 100 * 8760;` |
| `allReactorLcoe` | `useMemo(() => REACTOR_TYPES.map(r => ({` |
| `idcFactor` | `Math.pow(1 + w, r.constructYr / 2);` |
| `capexAnn` | `r.capex_kw * w / (1 - Math.pow(1 + w, -r.lifetime)) * idcFactor;` |
| `opexTotal` | `r.opexFixed + r.opexVar;` |
| `decommAnn` | `r.capex_kw * r.decommPct / 100 * w / (1 - Math.pow(1 + w, -r.lifetime));` |
| `annMwh` | `r.cf / 100 * 8760;` |
| `baseLcoe` | `lcoe * 1000;` |
| `capexTotal` | `capex * 1000000;` |
| `annRev` | `cf / 100 * 8760 * (lcoe * 1000 * 1.15) * 1000;` |
| `annOpex` | `(opexF + opexV + fuel) * cf / 100 * 8760 * 1000;` |
| `net` | `annRev - annOpex;` |
| `annRev` | `cf / 100 * 8760 * price * 1000;` |
| `annOp` | `(opexF + opexV + fuel) * cf / 100 * 8760 * 1000;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPARABLES`, `REACTOR_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Large Nuclear LCOE | `(Capital + O&M + Fuel + Decom) / Annual Generation` | IEA 2020 | Benchmark range for new-build large light-water reactors in OECD markets. |
| SMR Projected LCOE | `NOAK factory cost × learning rate / (CF × capacity)` | NEA SMR Report 2021 | Projected NOAK range assuming 10–15% learning rate on factory-fabricated units. |
| Capacity Factor | `Actual Generation / (Installed Capacity × 8760)` | IAEA PRIS 2023 | Nuclear fleet average CF; highest of any generating technology. |
- **Vogtle/Hinkley cost-overrun data** → Overnight cost → FCR → annualised capital → **LCOE $/MWh by technology**

## 5 · Intermediate Transformation Logic
**Methodology:** LCOE Methodology
**Headline formula:** `LCOE = (Overnight Cost × FCR + O&M + Fuel + Decom) / (CF × 8760 × Capacity)`
**Standards:** ['IEA Projected Costs of Generating Electricity 2020', 'WNA Economics of Nuclear Power']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).