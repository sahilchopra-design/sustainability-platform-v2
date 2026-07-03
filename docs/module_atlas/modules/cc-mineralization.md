# Enhanced Weathering & Mineralization Credits
**Module ID:** `cc-mineralization` · **Route:** `/cc-mineralization` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon dioxide removal quantification for enhanced rock weathering (ERW) and ocean alkalinity enhancement (OAE) projects. Models dissolution kinetics, alkalinity flux measurement, and MRV uncertainty under Lithos Carbon, Cascading Climate, and emerging ISO standards.

> **Business value:** Net ERW CDR = alkalinity flux × stoichiometry × area – lifecycle emissions. Typical net efficiency: 0.1–0.3 tCO₂ per tonne basalt applied at field scale.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `DualInput`, `Kpi`, `REGIONS`, `ROCK_TYPES`, `SOIL_TYPES`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Pacific Northwest','Midwest USA','Central Europe','Southeast Asia','Sub-Saharan Africa','South America','India','Australia'];` |
| `tabs` | `['Methodology Overview','Ca-Rich Carbonation Calculator','ERW Cumulative Model','Rock Characterization','Field Application Design','Measurement & Veri` |
| `caCO2` | `rockQty*(caoPct/100)*(44/56);` |
| `mgCO2` | `rockQty*(mgoPct/100)*(44/40);` |
| `practicalCapture` | `totalTheoretical*sizeFactor*(weatherRate/100);` |
| `energyEmissions` | `rockQty*energyGrind*0.0004;` |
| `netRemoval` | `practicalCapture-energyEmissions;` |
| `yrs` | `[];let cumulative=0;let cumulativeEnergy=0; // track running energy separately so net = cumulative_removal - cumulative_energy (not annualEnergy×y whi` |
| `annualDissolution` | `rockQty*(weatherRate/100)*Math.pow(0.97,y-1);` |
| `caRem` | `annualDissolution*(caoPct/100)*(44/56);` |
| `mgRem` | `annualDissolution*(mgoPct/100)*(44/40);` |
| `annualEnergy` | `annualDissolution*energyGrind*0.0004;` |
| `rockDB` | `useMemo(()=>ROCK_TYPES.map((r,i)=>({` |
| `rate` | `appRate*(1+sr(m*17+idx*3)*0.3);` |
| `phShift` | `rate*0.015*(1-m*0.02);` |
| `transportCost` | `5+sr(size)*3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `REGIONS`, `ROCK_TYPES`, `SOIL_TYPES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Alkalinity Flux | `Paired watershed monitoring` | Stream chemistry sensors | Increase in dissolved inorganic carbon alkalinity relative to control watershed |
| Rock Application Rate | `Field application records` | Project operations | Tonnes of crushed silicate rock applied per hectare |
| Lifecycle Emission Intensity | `Mining + grinding + transport LCA` | LCA database | Carbon cost of producing and applying one tonne of rock amendment |
| Net CDR Efficiency | `Net of LCI` | Model output | Net CO₂ drawdown per tonne of rock applied at field scale |
- **Stream chemistry sensors** → Alkalinity Δ → DIC flux → **Gross CDR estimate**
- **LCA database** → Rock supply chain → LCI → **Net CDR after lifecycle deduction**

## 5 · Intermediate Transformation Logic
**Methodology:** ERW carbon removal via alkalinity increase
**Headline formula:** `CDR = ΔAlkalinity × (MW_CO2 / MW_HCO3) × Volume × (1–LCI)`
**Standards:** ['Lithos ERW Protocol v2', 'Cascade Climate OAE Protocol', 'ISO/DIS 14064-ERW', 'GESAMP OAE Assessment']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).