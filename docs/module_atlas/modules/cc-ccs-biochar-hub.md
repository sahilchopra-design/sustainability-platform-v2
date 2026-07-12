# CCS & Biochar Carbon Removal Hub
**Module ID:** `cc-ccs-biochar-hub` · **Route:** `/cc-ccs-biochar-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Techno-economic and MRV engine for carbon capture & storage (CCS) and biochar carbon removal (BCR) projects. Models capture efficiency, storage permanence, co-firing scenarios, and BCR stability classes under EBC and IBI standards.

> **Business value:** Net CCS credits = captured tonnes × (1–fugitive rate). Net BCR credits = biochar carbon × permanence fraction (88–97% by stability class).

**How an analyst works this module:**
- Select technology: Point-source CCS, DAC, or BCR
- Techno-Economics tab shows LCOR and cost per net tonne
- Permanence tab models storage risk and leakage discount
- MRV Protocol shows monitoring requirements and verification frequency
- Portfolio Integration exports credits to CarbonCreditContext

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOCHAR_PROJECTS`, `Badge`, `CCS_PROJECTS`, `Card`, `DualInput`, `Kpi`, `Section`, `TIP`, `TabBar`, `UTILIZATION_PATHWAYS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UTILIZATION_PATHWAYS` | 7 | `id`, `name`, `permanence`, `co2_util_pct`, `risk`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `types` | `['Saline Aquifer','Depleted Gas','Saline Aquifer','Saline Aquifer','Pre-salt','Saline Aquifer','Saline Aquifer','Depleted Gas'];` |
| `transport_ef` | `transport_mode === 'Pipeline' ? 0.006 : 0.012; // kgCO2/(t-km) → divide by 1000 for tCO2` |
| `transport_emissions` | `co2_captured_tpa * distance_km * transport_ef / 1000; // tCO2/yr` |
| `compression_emissions` | `co2_captured_tpa * compression_energy_kwh * grid_ef_tco2_per_kwh;` |
| `process_emissions` | `transport_emissions + compression_emissions;` |
| `net_stored` | `co2_captured_tpa - process_emissions;` |
| `years_to_fill` | `storage_capacity_mt * 1e6 / co2_captured_tpa;` |
| `utilization_rate` | `injection_rate_tpd * 365 / co2_captured_tpa * 100;` |
| `carbon_in` | `biomass_input_t * carbon_content_pct / 100; // t Carbon in feedstock` |
| `biochar_mass_yield` | `Math.max(0.12, 0.68 * Math.exp(-0.0026 * pyrolysis_temp_c));` |
| `biochar_carbon_pct` | `Math.min(0.90, 0.40 + 0.0006 * pyrolysis_temp_c);` |
| `biochar_carbon` | `biomass_input_t * biochar_mass_yield * biochar_carbon_pct;` |
| `durable_carbon` | `biochar_carbon * stability;` |
| `pyrolysis_energy` | `carbon_in * 0.10 * (44 / 12); // tCO2` |
| `co2_equiv` | `Math.max(0, durable_carbon * (44 / 12) + counterfactual_avoided - pyrolysis_energy); // clamp: very low temp pyrolysis with high energy can produce negative net removal` |
| `biochar_yield` | `biochar_mass_yield; // expose for display` |
| `total` | `(ccsResult?.net_stored \|\| 0) + (bcResult?.co2_equiv \|\| 0);` |
| `totalCCSStored` | `useMemo(() => CCS_PROJECTS.reduce((s,p)=>s+p.net_stored_tco2e,0), []);` |
| `totalBiochar` | `useMemo(() => BIOCHAR_PROJECTS.reduce((s,p)=>s+p.net_credits_tco2e,0), []);` |
| `yield_pct` | `Math.round((0.55 - (temp-350)/1000*0.8)*100);` |
| `hc_approx` | `Math.round((0.65 - (temp-350)/1000*0.7)*100)/100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`, `UTILIZATION_PATHWAYS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CCS Capture Efficiency | `CO₂ captured / total emissions` | IEA CCS | Fraction of process emissions captured before atmosphere release |
| Fugitive Leakage Rate | `Monitoring survey data` | Storage operator reports | Annual CO₂ seepage from geological storage |
| BCR H:C​org Ratio | `Elemental analysis` | EBC lab protocol | Proxy for biochar recalcitrance; lower = more stable |
| BCR Net Permanence | `Stability class oxidation table` | EBC Carbon Standard | Fraction of biochar carbon credited as permanent over 100-year horizon |
- **Plant monitoring data** → Capture efficiency + fugitive rates → net CCS → **tCO₂ net stored**
- **EBC lab reports** → H:C ratio + oxidation table → permanence fraction → **BCR net credits**

## 5 · Intermediate Transformation Logic
**Methodology:** CCS net removal + BCR stability-weighted permanence
**Headline formula:** `NetCCS = Captured × (1 – FugitiveRate); NetBCR = Biochar_C × (1 – OxidationFraction)`

CCS net removal accounts for fugitive leakage at compression and injection. Monitoring via seismic and pressure surveys. BCR stability based on H:C​org ratio (EBC stability class): H:C < 0.4 = highly stable (OxidationFraction ≈ 0.03); H:C 0.4–0.6 = moderate (OxidationFraction ≈ 0.12). Permanence horizon: CCS = 1,000 yr; BCR = 100 yr default.

**Standards:** ['IEA CCS Tracking', 'EBC Carbon Standard', 'IBI Biochar Standard', 'ISO 14064-2']
**Reference documents:** IEA CCS Tracking Report 2024; European Biochar Certificate Standard v10; IBI Biochar Standards v2.1; ISO 14064-2 GHG Project Verification

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Persist the well-referenced CCS/BCR engine and ground the registry (analytics ladder: rung 2 → 3)

**What.** §7 confirms this is a genuinely well-built, well-referenced module: a real CCS net-storage engine (`net_stored = captured − transport − compression emissions`, with IEA transport factors 0.006/0.012 kgCO₂/t-km and grid-EF-based compression) plus a biochar stability-weighted permanence model (`biochar_mass_yield = 0.68·e^(−0.0026·T)` and `carbon_pct = 0.40 + 0.0006·T` from the Qian et al. 2015 pyrolysis meta-analysis, EBC H:C stability classes, a clamp for negative net removal at low-temp high-energy pyrolysis). The math is sound and cited; the only synthetic layer is the `CCS_PROJECTS`/`BIOCHAR_PROJECTS` registry. It writes to the shared `CarbonCreditContext` bus. Evolution A hardens this into a platform engine.

**How.** (1) Extract the CCS and BCR calculators to backend routes (`POST /api/v1/ccs-bcr/net-removal`) — the pyrolysis and net-storage math is exactly the kind of well-referenced deterministic engine that belongs server-side, testable and shared via the bus. (2) Real project registry (seeded today) from CCS project databases (Global CCS Institute) and biochar registries (Puro.earth/EBC-certified projects). (3) The storage-permanence and fugitive-rate inputs wired to the sibling `carbon-storage-geology` reservoir engine (shared CCS domain — one storage-integrity source of truth). (4) Grid EF for compression from the platform's real grid-carbon data. (5) Rung 3: calibrate the pyrolysis yield/carbon curves against additional biochar lab data and pin both the CCS net-storage and BCR permanence chains in bench_quant — the Qian-based curves deserve a golden case. Coordinate with the sibling `cc-` and biochar modules on shared conventions.

**Prerequisites.** CCS/biochar project registry data; the `carbon-storage-geology` engine for storage permanence; grid-carbon data for compression EF; backend extraction. **Acceptance:** the CCS and BCR calculators run server-side with a bench pin; the project registry is real; storage permanence uses the shared reservoir engine; compression EF uses real grid data.

### 9.2 Evolution B — CCS/biochar MRV and economics copilot (LLM tier 2)

**What.** CCS/biochar developers and CDR buyers ask "what's the net CCS storage after transport and compression losses for this pipeline route?", "what BCR permanence fraction does this pyrolysis temperature give?", "what's the LCOR per net tonne?", "how does H:C ratio affect credited carbon?" — the copilot runs the Evolution-A CCS/BCR engines, reporting net removal, permanence, and cost, every figure tool-traced to the referenced model.

**How.** Tool schemas over the Evolution-A net-removal routes; grounding corpus is this Atlas record — the module's exceptional referencing (IEA transport factors, Qian pyrolysis curves, EBC stability classes) is the copilot's explanation source, so "why does higher pyrolysis temperature lower mass yield but raise carbon percentage?" is answered from the actual Qian-based curves. The honesty duty: net removal is what's creditable (after transport, compression, fugitive, and lifecycle emissions — the module correctly clamps negative net removal), so the copilot always reports *net* CDR and states the permanence horizon (CCS 1000 yr vs BCR 100 yr) and stability class. MRV-protocol answers cite the ISO 14064-2 / EBC requirements. Composes into the report layer.

**Prerequisites.** Evolution A's backend extraction — the client-side calculators aren't tool-callable. **Acceptance:** every net-removal, permanence, and LCOR figure traces to a tool response; net (not gross) CDR is always reported; permanence horizon and stability class are stated; the pyrolysis-curve reasoning cites the Qian-based model.