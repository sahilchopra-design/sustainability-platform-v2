# Direct Air Capture Credits
**Module ID:** `cc-dac` · **Route:** `/cc-dac` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Techno-economic and MRV engine for Direct Air Capture (DAC) carbon removal projects. Models solid sorbent and liquid solvent pathways, energy source carbon intensity, net removal efficiency, and cost trajectory to 2050 under IRA tax credit and EU Innovation Fund scenarios.

> **Business value:** Net DAC credits = captured CO₂ minus energy-related emissions. At US average grid CI (386 gCO₂/kWh), solid sorbent DAC achieves ~75% net efficiency on renewable energy.

**How an analyst works this module:**
- Select DAC technology: solid sorbent or liquid solvent
- Energy Source tab sets grid CI and renewable fraction
- Net Removal calculator shows gross vs net credit yield
- Cost Trajectory tab models LCOR to 2050 with learning curve
- Policy tab applies IRA §45Q and EU Innovation Fund credit

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `ENERGY_SOURCES`, `Kpi`, `PERM_TIERS`, `Section`, `TECH_TYPES`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERM_TIERS` | 3 | `name`, `desc`, `adj`, `color` |

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
| `techComparison` | `useMemo(()=>[ {metric:'Energy (kWh/tCO2)',solid:1800,liquid:2200}, {metric:'Water (m3/tCO2)',solid:0.8,liquid:5.0}, {metric:'Sorbent Life (cycles)',solid:5000,liquid:800}, {metric:'LCOD 2026 ($/tCO2)',solid:450,liquid:380}, {metric:'Scalability (1-10)',solid:7,liquid:8}, {metric:'TRL',solid:7,liquid:6}, {metric:'Land Use (m2/tCO2)',solid:` |
| `energySensitivity` | `useMemo(()=>{ return[1200,1400,1600,1800,2000,2200,2500].map(kwh=>{ const sources=ENERGY_SOURCES.map(src=>{ const ef={Renewable:0.02,'Grid Mix':0.45,'Natural Gas':0.20}[src];` |
| `net` | `grossCapture-em-grossCapture*(sorbentPct+constructionPct+transportPct)/100;` |
| `facilityDesign` | `useMemo(()=>{ const safeModules=Math.max(designModules,1); // guard: user can type 0 in number field bypassing slider min=2, which would produce Infinity const capPerModule=designCapacity/safeModules;` |
| `energyReq` | `designCapacity*energyIntensity;` |
| `waterReq` | `designCapacity*1.5;` |
| `annualCost` | `designCapacity*lcod;` |
| `landPerModule` | `designLand/safeModules;` |
| `lcaWaterfall` | `useMemo(()=>[ {stage:'Gross Capture',value:grossCapture,fill:T.sage}, {stage:'Energy',value:-netCalc.energyEmissions,fill:T.red}, {stage:'Sorbent',value:-netCalc.sorbentEmissions,fill:T.amber}, {stage:'Construction',value:-netCalc.constructionEmissions,fill:T.gold}, {stage:'Transport',value:-netCalc.transportEmissions,fill:T.navyL}, {stag` |
| `kpis` | `useMemo(()=>[ {label:'Net Removal',value:`${netCalc.netRemoval.toLocaleString()} t`,icon:'DAC'}, {label:'Capture Efficiency',value:`${netCalc.captureEfficiency}%`}, {label:'Cost / Net tCO2',value:`$${netCalc.costPerNetTonne}`}, {label:'Lifecycle Emissions',value:`${netCalc.totalLifecycle.toLocaleString()} t`}, {label:'Permanence Tier',val` |
| `stored` | `facilities.filter(f=>f.permanence===t.name).reduce((a,f)=>a+f.co2_stored,0);` |
| `adjStored` | `stored*(1-t.adj);` |

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

Solid sorbent DAC: thermal energy 5–6 GJ/tCO₂, electric 1.5–2 GJ/tCO₂. Liquid solvent: thermal 6–8 GJ/tCO₂, electric 0.5 GJ/tCO₂. Net removal requires low-carbon energy source; grid CI must be below breakeven threshold. Learning rate 15–20% per doubling of cumulative installed capacity. IRA §45Q provides $180/tCO₂ for geologically stored DAC.

**Standards:** ['DOE DAC Shot', 'IEA CCUS 2024', 'IPCC AR6 Ch.12', 'ISO 14064-2']
**Reference documents:** DOE Carbon Negative Shot DAC; IEA CCUS in Clean Energy Transitions 2024; IPCC AR6 Chapter 12 CDR; IRA Section 45Q Tax Credit Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Guide and code align: a Direct Air Capture net-removal calculator with an energy-source carbon
intensity switch, lifecycle-component deductions, permanence adjustment, and a cost/learning-curve
model. The `netCalc` engine is real; the learning curve and facility roster are synthetic projections.

### 7.1 What the module computes

`netCalc` (lines 70–84):

```js
energyEF          = {Renewable:0.02, 'Grid Mix':0.45, 'Natural Gas':0.20}[source]   // tCO2/MWh
energyEmissions   = grossCapture × (energyIntensity/1000) × energyEF                 // kWh/t → MWh/t
sorbentEmissions       = grossCapture × sorbentPct/100
constructionEmissions  = grossCapture × constructionPct/100
transportEmissions     = grossCapture × transportPct/100
totalLifecycle    = Σ(the four above)
grossNet          = grossCapture − totalLifecycle
netRemoval        = grossNet × (1 − permAdj)
captureEfficiency = netRemoval / grossCapture × 100
costPerNetTonne   = (grossCapture × lcod) / netRemoval
```

Key design point (matching the guide): net removal is dominated by the **energy channel** — a
high-carbon grid can wipe out net removal. `costPerNetTonne` rises above the raw LCOD because the
denominator is *net*, not gross, tonnes.

### 7.2 Parameterisation

| Parameter | Default | Provenance |
|---|---|---|
| Energy EF (Renewable / Grid Mix / Natural Gas) | 0.02 / 0.45 / 0.20 tCO₂/MWh | Grid-CI proxies (renewable ~20 gCO₂/kWh, grid mix 450, gas 200) |
| `energyIntensity` | 1,800 kWh/tCO₂ (solid sorbent) | IEA/DOE DAC electric energy demand |
| Sorbent / construction / transport | 6% / 3% / 4% of gross | Lifecycle component assumptions |
| `permAdj` | tier-dependent | `PERM_TIERS` durability discount ladder |
| `lcod` | $400/tCO₂ | Current commercial DAC LCOR midpoint (IEA CCUS 2024 $400–1,000) |
| Learning curve | solid `max(80, 600×0.92^i)`, liquid `max(90, 500×0.93^i)` | ~8% cost decline/yr to a $80–90 floor (DOE DAC Shot target $100) |
| Capacity growth | `1000 × 1.35^min(i,20)` | 35%/yr deployment, capped at year 20 |

### 7.3 Calculation walkthrough

1. Energy emissions from capture-scaled energy demand × grid EF; three flat percentage lifecycle
   terms added.
2. Gross net = capture − lifecycle; permanence discount applied → net removal.
3. Capture efficiency and cost-per-net-tonne derived; results pushed to `CarbonCreditContext` as
   `Iso-DAC`, family `cdr`.
4. **Energy sensitivity** sweeps energy intensity 1,200–2,500 kWh/t across all three sources.
5. **Facility design** partitions a target capacity into modules (guarded `max(modules,1)`), sizing
   energy/water/land and generating synthetic module telemetry.
6. **LCA waterfall** and **learning curve** (2024–2050) visualise the deductions and cost trajectory.

### 7.4 Worked example — Net Removal Calculator

Defaults: grossCapture 10,000 t, source Renewable (EF 0.02), energyIntensity 1,800, sorbent 6%,
construction 3%, transport 4%, permTier 0 (adj 0), lcod $400:

| Step | Computation | Result |
|---|---|---|
| Energy emissions | 10,000 × (1,800/1,000) × 0.02 | 360 t |
| Sorbent | 10,000 × 0.06 | 600 t |
| Construction | 10,000 × 0.03 | 300 t |
| Transport | 10,000 × 0.04 | 400 t |
| Total lifecycle | 360+600+300+400 | 1,660 t |
| Gross net | 10,000 − 1,660 | 8,340 t |
| Net removal (permAdj 0) | 8,340 × 1 | **8,340 t** |
| Capture efficiency | 8,340 / 10,000 | **83.4%** |
| Cost / net tonne | (10,000 × 400) / 8,340 | **$480/t** |

On a Grid-Mix source (EF 0.45), energy emissions become 10,000 × 1.8 × 0.45 = 8,100 t — net removal
collapses to ~240 t and cost per net tonne explodes, exactly the grid-CI-breakeven message.

### 7.5 Data provenance & limitations

- **Calculator is real; learning curve, facilities, and module telemetry are synthetic** (PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`).
- Lifecycle components (sorbent/construction/transport) are flat percentages of gross capture, not
  process-model outputs; construction/embodied carbon should amortise over facility lifetime, not
  scale linearly with annual capture.
- Only three discrete energy sources; no continuous grid-CI input despite the guide's "breakeven grid
  CI ~100 gCO₂/kWh" framing (the model would cross zero net around EF ≈ capture/energy ≈ 0.56 tCO₂/MWh
  at 1,800 kWh/t + 13% other lifecycle).
- Permanence adjustment is a single discount, not a monitored geological-storage reversal term.

**Framework alignment:** **DOE Carbon Negative Shot** ($100/t target — the learning-curve floor) ·
**IEA CCUS 2024** (LCOR $400–1,000, energy intensities) · **IPCC AR6 Ch.12 CDR** (DAC net-removal
must net energy emissions) · **ISO 14064-2** project accounting · **IRA §45Q** ($180/t geologic DAC)
referenced in the guide's policy tab. The core "net = captured − energy×gridCI − lifecycle" identity
is the standard DAC LCA accounting used across MSCI/CDR-registry methodologies.

## 9 · Future Evolution

### 9.1 Evolution A — Live grid-CI coupling and benchmarked learning curve (analytics ladder: rung 1 → 3)

**What.** §7 confirms `netCalc` is a real DAC net-removal engine (energy, sorbent,
construction, transport deductions; permanence adjustment) but its energy channel uses
three hard-coded emission factors (`Renewable 0.02 / Grid Mix 0.45 / Natural Gas 0.20`
tCO₂/MWh) and the cost trajectory is a synthetic `600×0.92^i + sr()` series. Evolution A
wires the grid-CI input to the platform's already-integrated EIA and ENTSO-E feeds so a
DAC facility's net removal reflects its actual balancing-area carbon intensity, and
replaces the seeded learning curve with one anchored to published deployment data (DOE
DAC Shot baselines, IEA CCUS 2024 capacity — both already in the module's reference
list).

**How.** (1) Grid-CI resolver: location → balancing area → trailing-12-month average
and marginal CI, with the honest-fallback pattern (`resolution_tier` reported when only
country averages exist). (2) Learning-curve fit re-estimated from cumulative-capacity
observations rather than `Math.pow(0.92,i)`; parameters and fit error published per §8
model-card convention. (3) Scenario grid over energy source × §45Q/EU Innovation Fund
policy cases the Policy tab already enumerates.

**Prerequisites.** Kill the `sr()` seeded-random jitter in the cost series (platform
random-as-data guardrail applies); EIA/ENTSO-E ingester coverage for the target
regions. **Acceptance:** the same facility on ERCOT vs a renewable PPA shows different
`netRemoval` and `costPerNetTonne` with the CI source cited; learning-rate parameter
carries a fit-error stat, not an assumption.

### 9.2 Evolution B — DAC feasibility copilot (LLM tier 1)

**What.** A copilot answering the questions this module's economics actually turn on:
"why is my cost per net tonne 40% above LCOD?" (because the denominator is net of
lifecycle deductions — §7 documents this exact mechanic), "at what grid CI does net
removal go negative?", "how does §45Q change breakeven?". Grounded in the atlas §5
formulas and the live `netCalc` output on screen; refuses market questions (credit
prices, offtake demand) the engine does not compute.

**How.** Tier-1 pattern: atlas record chunks in `llm_corpus_chunks`, page state
(technology, energy source, deduction percentages, results) injected as structured
context; Haiku-tier serving with prompt caching since the module corpus is stable. The
breakeven-CI question is answerable by the LLM restating the closed-form threshold from
§5, not by computing new numbers.

**Prerequisites.** None beyond the tier-1 copilot router — this module's calculator
is real and its guide matches its code, so the corpus is trustworthy today.
**Acceptance:** copilot correctly attributes the gross-vs-net cost wedge to lifecycle
deductions with a §7 citation; adversarial probe on 2050 credit prices produces a
refusal.