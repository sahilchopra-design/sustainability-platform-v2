# Direct Air Capture Credits
**Module ID:** `cc-dac` · **Route:** `/cc-dac` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Techno-economic and MRV engine for Direct Air Capture (DAC) carbon removal projects. Models solid sorbent and liquid solvent pathways, energy source carbon intensity, net removal efficiency, and cost trajectory to 2050 under IRA tax credit and EU Innovation Fund scenarios.

> **Business value:** Net DAC credits = captured CO₂ minus energy-related emissions. At US average grid CI (386 gCO₂/kWh), solid sorbent DAC achieves ~75% net efficiency on renewable energy.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `ENERGY_SOURCES`, `Kpi`, `PERM_TIERS`, `Section`, `TECH_TYPES`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `solidCost` | `Math.max(80,600*Math.pow(0.92,i)+sr(i*61)*30);` |
| `liquidCost` | `Math.max(90,500*Math.pow(0.93,i)+sr(i*67)*25);` |
| `capacity` | `1000*Math.pow(1.35,Math.min(i,20))+sr(i*71)*500;` |
| `energyEmissions` | `grossCapture*(energyIntensity/1000)*energyEF;` |
| `sorbentEmissions` | `grossCapture*(sorbentPct/100);` |
| `constructionEmissions` | `grossCapture*(constructionPct/100);` |
| `transportEmissions` | `grossCapture*(transportPct/100);` |
| `totalLifecycle` | `energyEmissions+sorbentEmissions+constructionEmissions+transportEmissions;` |
| `grossNet` | `grossCapture-totalLifecycle;` |
| `netRemoval` | `grossNet*(1-permAdj);` |
| `captureEfficiency` | `grossCapture>0?(netRemoval/grossCapture*100):0;` |
| `totalCost` | `grossCapture*lcod;` |
| `costPerNetTonne` | `netRemoval>0?(totalCost/netRemoval):0;` |
| `sources` | `ENERGY_SOURCES.map(src=>{` |
| `net` | `grossCapture-em-grossCapture*(sorbentPct+constructionPct+transportPct)/100;` |
| `safeModules` | `Math.max(designModules,1); // guard: user can type 0 in number field bypassing slider min=2, which would produce Infinity` |
| `capPerModule` | `designCapacity/safeModules;` |
| `energyReq` | `designCapacity*energyIntensity;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ENERGY_SOURCES`, `PERM_TIERS`, `TECH_TYPES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LCOR 2024 | `Techno-economic model` | IEA CCUS 2024 | Current levelised cost of removal for commercial DAC plants |
| LCOR 2050 (DOE target) | `Learning curve projection` | DOE DAC Shot | Cost target for DAC at scale under aggressive deployment scenario |
| Net Removal Efficiency | `NetDAC / Captured` | Model output | Fraction of captured CO₂ that is net of energy-related emissions |
| Breakeven Grid CI | `Energy emissions = captured CO₂` | Model threshold | Grid carbon intensity above which DAC becomes a net emitter |
- **Plant monitoring** → Capture mass flow → gross tonnes → **Gross DAC tCO₂**
- **Energy metering** → kWh × grid CI → energy emissions → **Net removal tonnes**

## 5 · Intermediate Transformation Logic
**Methodology:** DAC net removal = gross capture – energy emissions
**Headline formula:** `NetDAC = Captured – (EnergyUse × GridCI); LCOR(t) = LCOR₀ × (1–LearningRate)^log₂(CumCapacity(t)/CumCapacity₀)`
**Standards:** ['DOE DAC Shot', 'IEA CCUS 2024', 'IPCC AR6 Ch.12', 'ISO 14064-2']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).