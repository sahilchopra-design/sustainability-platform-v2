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
