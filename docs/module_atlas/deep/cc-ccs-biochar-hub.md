## 7 · Methodology Deep Dive

Guide and code align well. Both describe a CCS net-storage engine plus a biochar stability-weighted
permanence model. The code is notably well-referenced (IEA CCS transport factors, Qian et al. 2015
pyrolysis meta-analysis, EBC H:C stability classes). No mismatch flag needed; the only synthetic
element is the project registry.

### 7.1 What the module computes

**CCS net storage** (`calcCCS`, lines 64–86):

```js
transport_ef        = (mode==='Pipeline') ? 0.006 : 0.012   // kgCO2/(t·km), IEA CCS 2020
transport_emissions = captured_tpa × distance_km × transport_ef / 1000
compression_emissions = captured_tpa × compression_kwh × 0.00055   // grid EF tCO2/kWh, IEA 2023
net_stored          = captured_tpa − transport_emissions − compression_emissions
years_to_fill       = storage_capacity_mt × 1e6 / captured_tpa
utilization_rate    = min(100, injection_tpd × 365 / captured_tpa × 100)
```

**Biochar carbon removal** (`calcBiochar`, lines 94–126):

```js
carbon_in          = biomass_t × carbon_content_pct/100
biochar_mass_yield = max(0.12, 0.68 × exp(−0.0026 × pyrolysis_temp_c))     // Qian 2015
biochar_carbon_pct = min(0.90, 0.40 + 0.0006 × pyrolysis_temp_c)
biochar_carbon     = biomass_t × mass_yield × carbon_pct
stability          = H:C<0.4 → 1.0 ; <0.7 → 0.8 ; else 0.5                 // EBC classes
durable_carbon     = biochar_carbon × stability
pyrolysis_energy   = carbon_in × 0.10 × (44/12)                            // syngas process CO2
co2_equiv          = max(0, durable_carbon×(44/12) + counterfactual_avoided − pyrolysis_energy)
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Pipeline transport EF | 0.006 kgCO₂/(t·km) | IEA CCS 2020 (inline comment) |
| Ship transport EF | 0.012 kgCO₂/(t·km) | IEA CCS 2020 |
| Grid EF (compression) | 0.00055 tCO₂/kWh (= 550 gCO₂/kWh) | IEA 2023 global average; comment notes prior 0.0004 was EU-only, corrected |
| Mass-yield curve | `0.68·e^(−0.0026·T)`, floor 0.12 | Qian et al. 2015 meta-analysis (n≈300): 300°C≈45%, 500°C≈28%, 700°C≈17% |
| Carbon-content curve | `0.40 + 0.0006·T`, cap 0.90 | Higher T concentrates C: 300°C→55%, 700°C→80% |
| H:C stability factors | 1.0 / 0.8 / 0.5 | EBC stability classes by H:Cₒᵣg ratio (<0.4 highly stable) |
| Pyrolysis process loss | 10% of feedstock C as CO₂ | Syngas-combustion assumption |
| Utilization pathways | EOR 60% · Mineral 95% · Concrete 85% · e-fuels 30% · Chemicals 50% · Greenhouse 0% CO₂ utilised | `UTILIZATION_PATHWAYS` table, permanence-ranked |

### 7.3 Calculation walkthrough

1. **CCS** — captured tonnes minus transport (distance × mode EF) and compression (energy × grid EF)
   emissions gives net stored; storage-site metrics (`years_to_fill`, `utilization_rate`) are
   capacity ratios.
2. **CCUS pathways** — descriptive permanence vs CO₂-utilisation table (no net-credit computation;
   flags re-emission risk for low-permanence uses like e-fuels/greenhouse).
3. **Biochar** — feedstock C → temperature-driven mass yield and carbon concentration → durable
   carbon after H:C stability discount → CO₂e net of pyrolysis process emissions, plus counterfactual
   avoided (e.g. avoided open-burning).
4. Combined net (`net_stored + co2_equiv`) is pushed to `CarbonCreditContext` as methodology
   `VM0040`, family `industrial`.

### 7.4 Worked example — Biochar Calculator

Defaults: biomass 10,000 t, carbon 48%, pyrolysis 550°C, H:C 0.30, counterfactual 500 tCO₂e:

| Step | Computation | Result |
|---|---|---|
| Carbon in | 10,000 × 0.48 | 4,800 t C |
| Mass yield | 0.68 × e^(−0.0026·550) = 0.68 × e^(−1.43) | 0.163 |
| Biochar carbon % | 0.40 + 0.0006·550 | 0.73 |
| Biochar carbon | 10,000 × 0.163 × 0.73 | 1,190 t C |
| Stability (H:C 0.30 < 0.4) | factor | 1.0 |
| Durable carbon | 1,190 × 1.0 | 1,190 t C |
| Durable CO₂e | 1,190 × 3.667 | 4,364 |
| Pyrolysis energy | 4,800 × 0.10 × 3.667 | 1,760 |
| Net CO₂e | max(0, 4,364 + 500 − 1,760) | **≈3,104 tCO₂e** |

### 7.5 Data provenance & limitations

- **Both calculators are real, cited models.** The six `BIOCHAR_PROJECTS` and `CCS_PROJECTS` used in
  the dashboard/scatter are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- CCS compression uses a single global grid EF — a real project on renewable power would net far
  lower; the model does not let the user switch energy source (unlike cc-dac).
- Biochar permanence is a 3-step H:C discount, not a continuous 100-yr decay curve; the EBC/Puro.earth
  production standard applies durability factors and time-horizon integrals.
- No geological-storage reversal/leakage-over-time term for CCS (only annual process emissions).

**Framework alignment:** **IEA CCS Tracking** (transport EFs, capture accounting) · **European
Biochar Certificate (EBC)** — H:Cₒᵣg stability classes drive the durable-carbon discount, exactly the
EBC recalcitrance proxy · **Puro.earth Biochar Methodology** (net = durable C − process emissions,
counterfactual credit) · **ISO 14064-2** project-level GHG accounting. The H:C stability tiers mirror
EBC/IBI: H:C<0.4 → highly stable (≈0.03 oxidation), 0.4–0.7 → moderate — represented here as 1.0/0.8/0.5
credited fractions.
