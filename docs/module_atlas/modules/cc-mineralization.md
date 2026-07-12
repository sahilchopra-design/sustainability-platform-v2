# Enhanced Weathering & Mineralization Credits
**Module ID:** `cc-mineralization` · **Route:** `/cc-mineralization` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Carbon dioxide removal quantification for enhanced rock weathering (ERW) and ocean alkalinity enhancement (OAE) projects. Models dissolution kinetics, alkalinity flux measurement, and MRV uncertainty under Lithos Carbon, Cascading Climate, and emerging ISO standards.

> **Business value:** Net ERW CDR = alkalinity flux × stoichiometry × area – lifecycle emissions. Typical net efficiency: 0.1–0.3 tCO₂ per tonne basalt applied at field scale.

**How an analyst works this module:**
- Select pathway: ERW (agricultural) or OAE (marine)
- Rock Properties tab sets mineralogy and dissolution rate
- Field Monitoring tab inputs watershed alkalinity measurements
- LCI Calculator deducts mining, grinding, transport emissions
- Net CDR output with uncertainty range for credit issuance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `DualInput`, `Kpi`, `REGIONS`, `ROCK_TYPES`, `SOIL_TYPES`, `Section`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Pacific Northwest','Midwest USA','Central Europe','Southeast Asia','Sub-Saharan Africa','South America','India','Australia'];` |
| `tabs` | `['Methodology Overview','Ca-Rich Carbonation Calculator','ERW Cumulative Model','Rock Characterization','Field Application Design','Measurement & Verification'];` |
| `projects` | `useMemo(()=>genProjects(),[]);  /* Ca / Mg carbonation calc */ const carbonation=useMemo(()=>{ const caCO2=rockQty*(caoPct/100)*(44/56);` |
| `mgCO2` | `rockQty*(mgoPct/100)*(44/40);` |
| `practicalCapture` | `totalTheoretical*sizeFactor*(weatherRate/100);` |
| `energyEmissions` | `rockQty*energyGrind*0.0004;` |
| `netRemoval` | `practicalCapture-energyEmissions;` |
| `erwCumulative` | `useMemo(()=>{ const yrs=[];let cumulative=0;let cumulativeEnergy=0; // track running energy separately so net = cumulative_removal - cumulative_energy (not annualEnergy×y which misaccumulates under decay)` |
| `annualDissolution` | `rockQty*(weatherRate/100)*Math.pow(0.97,y-1);` |
| `caRem` | `annualDissolution*(caoPct/100)*(44/56);` |
| `mgRem` | `annualDissolution*(mgoPct/100)*(44/40);` |
| `annualEnergy` | `annualDissolution*energyGrind*0.0004;` |
| `xrfRadar` | `useMemo(()=>[ {oxide:'CaO',value:caoPct,max:55},{oxide:'MgO',value:mgoPct,max:50},{oxide:'SiO2',value:sio2Pct,max:70},{oxide:'Fe2O3',value:+(sr(42)*15+2).toFixed(1),max:20},{oxide:'Al2O3',value:+(sr(43)*12+1).toFixed(1),max:18},{oxide:'Na2O',value:+(sr(44)*5+0.5).toFixed(1),max:8},{oxide:'K2O',value:+(sr(45)*4+0.3).toFixed(1),max:6} ],[ca` |
| `rockDB` | `useMemo(()=>ROCK_TYPES.map((r,i)=>({` |
| `rate` | `appRate*(1+sr(m*17+idx*3)*0.3);` |
| `phShift` | `rate*0.015*(1-m*0.02);` |
| `costTradeoff` | `useMemo(()=>{ return[10,50,100,200,500,1000,1500,2000].map(size=>{` |
| `transportCost` | `5+sr(size)*3;` |
| `mvData` | `useMemo(()=>Array.from({length:24},(_,m)=>({ month:`M${m+1}`,predicted:+(sr(m*31)*20+10).toFixed(1),observed:+(sr(m*37)*22+8).toFixed(1),uncertainty:+(sr(m*41)*5+2).toFixed(1),soilCO2:+(sr(m*43)*8+3).toFixed(1) })),[]);` |

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

ERW spreading of crushed silicate rock (basalt, dunite) on agricultural soils. Dissolution releases alkalinity (Ca²⁺ + Mg²⁺ + OH⁻) which absorbs CO₂ from air via bicarbonate formation. Net CDR = alkalinity increase × CO₂:HCO₃ stoichiometry × watershed area, minus lifecycle emissions of mining, grinding, and transport (LCI). Ocean alkalinity enhancement: similar principle via direct seawater alkalinization.

**Standards:** ['Lithos ERW Protocol v2', 'Cascade Climate OAE Protocol', 'ISO/DIS 14064-ERW', 'GESAMP OAE Assessment']
**Reference documents:** Lithos ERW Protocol v2.0; Cascade Climate OAE Accounting Protocol; GESAMP OAE Environmental Assessment Framework; IPCC AR6 Ch.12 CDR Enhanced Weathering

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide frames CDR as **alkalinity-flux measurement** —
> `CDR = ΔAlkalinity × (MW_CO2/MW_HCO3) × Volume × (1−LCI)` from paired-watershed stream chemistry.
> **The code does not measure alkalinity at all.** It instead computes a **stoichiometric
> cation-carbonation potential** from rock oxide content (CaO→CaCO₃, MgO→MgCO₃), scaled by an
> empirical particle-size factor and a weathering-rate fraction, then nets out grinding-energy
> emissions. The "Measurement & Verification" tab is entirely `sr()`-seeded synthetic time-series, not
> real DIC/alkalinity data. The stoichiometry is genuine chemistry; the flux-based MRV the guide
> describes is a §8 candidate. Sections below document the code.

### 7.1 What the module computes

**Ca/Mg carbonation potential** (`carbonation`):
```
caCO2 = rockQty · (CaO%/100) · (44/56)     // 44 g CO2 per 56 g CaO
mgCO2 = rockQty · (MgO%/100) · (44/40)     // 44 g CO2 per 40 g MgO
totalTheoretical = caCO2 + mgCO2
sizeFactor = f(particle_µm)                // step function, finer = higher
practicalCapture = totalTheoretical · sizeFactor · (weatherRate/100)
energyEmissions  = rockQty · energyGrind · 0.0004     // tCO2 from grinding kWh
netRemoval = practicalCapture − energyEmissions
efficiency = practicalCapture / totalTheoretical · 100
```

**ERW cumulative dissolution** (`erwCumulative`) — annual dissolution decays at 3%/yr:
```
annualDissolution(y) = rockQty · (weatherRate/100) · 0.97^(y−1)
caRem = annualDissolution · (CaO%/100) · (44/56);  mgRem analog with 44/40
cumulative += (caRem + mgRem)
net(y) = cumulative − cumulativeEnergy        // running energy tracked separately
```
An inline comment notes the net is computed against *running* cumulative energy, deliberately
avoiding a `annualEnergy×y` mis-accumulation under decay — a correct, thoughtful fix.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| CO₂:CaO ratio | 44/56 | Molar masses CO₂=44, CaO=56 — exact chemistry |
| CO₂:MgO ratio | 44/40 | CO₂=44, MgO=40 — exact chemistry |
| sizeFactor | 1.0 (≤50µm) → 0.15 (>1000µm) | Empirical step; finer rock weathers faster (surface-area law) — no source cited |
| weatherRate | 4%/yr default | UI-set; realistic ERW field dissolution fraction |
| Grinding EF | 0.0004 tCO₂/kWh | ≈0.4 kgCO₂/kWh grid factor — plausible, uncited |
| Annual decay | 0.97^(y−1) | 3%/yr dissolution decline — heuristic, uncited |
| Rock oxide DB, XRF radar, M&V series | `sr()`-seeded | **Synthetic** PRNG demo data |

`caoPct=25`, `mgoPct=15` defaults ≈ basalt. The 8 portfolio projects and all rock-DB/XRF/M&V values
are synthetic (`sr()`).

### 7.3 Calculation walkthrough

User sets rock quantity, CaO/MgO/SiO₂ %, particle size, weathering rate, grinding energy. The
single-year `carbonation` gives theoretical vs practical capture and a net after grinding emissions;
it pushes to `CarbonCreditContext` as `methodology:'Puro-ERW', family:'cdr'`. The multi-year
`erwCumulative` compounds dissolution under 3%/yr decay to a horizon (default 30 yr), reporting
cumulative gross and net. Field-application design derives a soil-pH trajectory and the M&V tab shows
predicted-vs-observed removal (both `sr()`-generated).

### 7.4 Worked example (single-year carbonation, basalt)

`rockQty=1,000 t`, CaO=25%, MgO=15%, particle=200µm, weatherRate=4%, energyGrind=35 kWh/t.

| Step | Computation | Result |
|---|---|---|
| Ca-derived CO₂ | 1000·0.25·(44/56) | 196.4 t |
| Mg-derived CO₂ | 1000·0.15·(44/40) | 165.0 t |
| Theoretical total | 196.4 + 165.0 | 361.4 t |
| sizeFactor (200µm) | ≤200 → 0.85 | 0.85 |
| Practical capture | 361.4·0.85·0.04 | **12.29 t** |
| Grinding emissions | 1000·35·0.0004 | 14.0 t |
| Net removal | 12.29 − 14.0 | **−1.71 t** |

At a 4% single-year weathering fraction, grinding emissions *exceed* first-year capture — the model
correctly shows ERW pays back only over multiple years (the cumulative model reaches net-positive as
dissolution compounds while grinding is a one-off). Net efficiency at field scale (per guide) is
0.1–0.3 tCO₂/t rock realised over the full weathering horizon, not year one.

### 7.5 Data provenance & limitations
- Rock-DB, XRF radar, soil-pH, cost-tradeoff and M&V series are **synthetic `sr()`-seeded** demo data.
- Capture uses a coarse `sizeFactor` step function, not a kinetic dissolution-rate law
  (shrinking-core / BET surface area). No temperature, moisture, or soil-pH dependence on weathering.
- No downstream carbon-loss accounting (secondary carbonate precipitation, riverine/ocean re-emission,
  strong-acid weathering that emits rather than sequesters) — real ERW MRV caps net CDR for these.

**Framework alignment:** **Puro.earth ERW methodology** (filed as `Puro-ERW`) — Puro credits net CDR
after lifecycle emissions, matching the code's `practicalCapture − grindingEmissions` structure.
**Cascade Climate / Lithos** protocols and **IPCC AR6 Ch.12** treat ERW as alkalinity-based CDR; the
guide's ΔAlkalinity·stoichiometry form is the field-MRV standard the code approximates with a
stoichiometric-potential proxy.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays "net CDR" from a
stoichiometric proxy and `sr()`-seeded M&V; production ERW crediting requires a measured-alkalinity /
mass-balance model.

**8.1 Purpose & scope.** Quantify net, permanent, MRV-defensible CO₂ removal from a spread of crushed
silicate rock on agricultural land, for credit issuance under Puro/Isometric-grade rules. Coverage:
field-scale ERW deployments.

**8.2 Conceptual approach.** Dual-track: (a) a **cation mass-balance / total-alkalinity (TA)** track,
the emerging standard (Isometric, Cascade Climate) — CDR is proportional to charge-equivalent base
cations released and confirmed to reach the ocean bicarbonate reservoir; (b) a **shrinking-core
dissolution kinetics** forward model calibrated to soil-column data, benchmarked against published
enhanced-weathering field trials (Beerling et al.) and the CarbFix mineralisation mass-balance.

**8.3 Mathematical specification.**
```
Gross removal (mass balance, per parcel over Δt):
  CDR_gross = Σ_cations (Δn_cation · z_cation) · η_transport · (44/1)   [g CO2]
    where Δn_cation = moles Ca²⁺,Mg²⁺,Na⁺,K⁺ released (soil-exchange + leachate flux),
          z = charge, η_transport = fraction reaching ocean before re-degassing (0–1)
Kinetic dissolution rate (per mineral m):
  R_m = A_m · k_m(T) · (1 − Ω)^n · a_H+^p      [mol/m²/s]
    k_m(T) = k0 · exp(−Ea/R · (1/T − 1/298))
Net CDR = CDR_gross − LCI(mining+grinding+spreading+transport)
```
| Parameter | Value | Calibration source |
|---|---|---|
| k0, Ea (mineral kinetics) | per-mineral | Palandri & Kharaka (2004) USGS rate compilation |
| η_transport | 0.7–0.9 | Riverine alkalinity-retention studies |
| Grinding EF | grid-specific | IEA electricity EF; platform CEDA/grid tables |
| Spreading/transport EF | ecoinvent LCA | ecoinvent v3.9 diesel/haulage |
| Ω, a_H+ | measured | Soil pore-water chemistry sensors |

**8.4 Data requirements.** Rock XRF oxide assay + BET surface area, application rate, soil type/pH,
pore-water cation & alkalinity time series, catchment discharge, grinding kWh & grid EF, haul
distances. Platform holds grid EFs (CEDA/grid tables); alkalinity sensor data is new.

**8.5 Validation & benchmarking plan.** Reconcile the kinetic forward model against measured leachate
alkalinity (paired treated/control plots); target mass-balance closure within ±25%. Cross-check net
CDR against Isometric/Puro issued volumes for comparable projects. Sensitivity on η_transport and
grinding EF (the two largest net-CDR drivers).

**8.6 Limitations & model risk.** Field ERW faces large MRV uncertainty (cation retention on
exchange sites, secondary mineral formation, strong-acid weathering reversing sign). Conservative
fallback: credit only *confirmed* alkalinity export with a durability discount; withhold a buffer for
transport re-degassing risk; never credit theoretical stoichiometric potential (the current proxy).

## 9 · Future Evolution

### 9.1 Evolution A — Alkalinity-flux MRV to match the guide's accounting basis (analytics ladder: rung 1 → 3)

**What.** §7 flags the core mismatch: the guide describes flux-based MRV
(`CDR = ΔAlkalinity × MW_CO2/MW_HCO3 × Volume × (1−LCI)` from paired-watershed stream
chemistry) but the code computes a stoichiometric cation-carbonation potential
(CaO→CaCO₃, MgO→MgCO₃ with a particle-size step function), and the entire "Measurement
& Verification" tab is `sr()`-seeded synthetic time series. Evolution A builds the
documented flux model: a measurement-ingestion path for discharge and alkalinity/DIC
observations, control-vs-treatment watershed differencing, and the bicarbonate
stoichiometry conversion — with the existing carbonation-potential engine retained as
the ex-ante ceiling estimate it genuinely is.

**How.** (1) `erw_monitoring_observations(site, date, discharge, alkalinity, dic,
watershed_type)` table + upload endpoint (module's first backend surface).
(2) Flux computation per the Lithos/Cascade protocols already in §5's reference list;
net CDR reported as measured-flux minus the grinding/transport LCI the code already
deducts. (3) Delete the seeded-random M&V series — the platform's random-as-data
guardrail (`check_no_fabricated_random.py`) should catch this page once the tab renders
real or honestly-empty data.

**Prerequisites (hard).** The `sr()`-seeded monitoring series is a documented defect
and must be removed, not painted over; demo observations seeded as clearly-labelled
fixtures. **Acceptance:** M&V tab renders uploaded observations or an honest empty
state; a fixture watershed pair with known ΔAlkalinity reproduces hand-computed CDR to
4 significant figures.

### 9.2 Evolution B — ERW project-design copilot (LLM tier 1)

**What.** A copilot for the design questions the real engine answers: "why does finer
grinding raise capture but also raise the energy deduction?", "what fraction of
theoretical CaCO₃ potential is practically achievable at 100µm?", "how do basalt and
dunite differ?" (the `ROCK_TYPES` oxide-content data is genuine chemistry). Grounded in
atlas §5/§7; explanation-only, because the M&V tab's numbers are currently synthetic
and must not be narrated as measurements.

**How.** Tier-1 pattern: atlas record in `llm_corpus_chunks`, calculator inputs/results
injected; stoichiometry questions answered from the §7 mass-ratio formulas (44/56 for
CaO, 44/40 for MgO). The system prompt must state that field-monitoring figures are
illustrative until Evolution A lands — this is the honest-nulls convention applied to
LLM narration.

**Prerequisites.** None for the calculator-explaining slice; Evolution A before any
monitoring-data questions get real answers. **Acceptance:** the grinding trade-off
answer cites both the size-factor step function and the energy-emissions term; a
question about "current measured alkalinity flux" is refused or explicitly labelled
demo pending Evolution A.