## 7 · Methodology Deep Dive

> ⚠️ **No implementation found.** This route (`/carbon-storage-geology`, "Carbon Storage Geology") has
> **no source files, no page component, no computed values, no seed data, and no MODULE_GUIDES entry** in
> the assignment record (`source_files: []`, `computed: []`, `seed_schemas: []`, `guide: null`). The only
> attached artefacts are the generic shared carbon backend engines (`carbon_calculator.py`,
> `methodology_engine.py`) and the shared `/api/v1/carbon/*` routes, which are the platform-wide carbon
> methodology endpoints — not a geological-storage implementation. There is therefore no module-specific
> methodology to document. The sections below record what *would* be expected and specify the model the
> route should host.

### 7.1 What the module computes

Nothing at present. The route resolves to no page-level computation. Any geological-CO₂-storage analytics
(reservoir capacity, injectivity, containment/permanence, monitoring) are **not implemented**.

### 7.2 Parameterisation / provenance

None in code. Expected geological-storage parameters (porosity, permeability, storage efficiency, seal
integrity, injection rate) are absent.

### 7.3–7.4 Calculation walkthrough & worked example

Not applicable — there is no code path to trace and no numeric example to compute faithfully. Any figure
presented under this route today would not originate from a module-specific model.

### 7.5 Data provenance & limitations

- **The module is a route stub only.** No synthetic (`sr()`) data, no real data, no calculation.
- The shared `/api/v1/carbon/*` endpoints it nominally links to serve emission-factor and methodology
  reference data, which is unrelated to geological storage capacity or containment risk.

**Framework alignment:** None implemented. The relevant standards for a geological-storage module — IPCC
Special Report on CCS, US EPA Class VI well requirements, EU CCS Directive 2009/31/EC, ISO 27914 (geological
storage), and DOE/USGS storage-capacity methodologies — are not referenced in any shipped code for this
route.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The route has no implementation; this specifies the
geological-CO₂-storage model it should host.

### 8.1 Purpose & scope
Assess geological CO₂ storage sites for capacity, injectivity, and containment/permanence risk across saline
aquifers, depleted oil/gas fields, and basalt formations — supporting CCS/BECCS/DAC storage siting and
permanence assurance for CDR credit quality.

### 8.2 Conceptual approach
Volumetric storage-capacity estimation plus a containment-risk score, benchmarked against the US DOE/NETL
CO₂ storage resource methodology, USGS assessment methodology, and IEAGHG containment-risk frameworks.
Capacity uses the standard efficiency-factor volumetric equation; containment combines seal integrity,
fault/well leakage, and induced-seismicity risk.

### 8.3 Mathematical specification

```
StorageCapacity = A · h · φ · ρ_CO2 · E                       DOE volumetric method
   A = area, h = net thickness, φ = porosity,
   ρ_CO2 = CO2 density at reservoir P,T, E = storage efficiency factor
InjectionRate   = (2π k h ΔP) / (μ ln(r_e/r_w))               Darcy radial flow
ContainmentRisk = w1·SealScore + w2·FaultLeak + w3·WellLeak + w4·SeismicRisk
PermanenceFactor= 1 − P(leakage over 1,000yr)                  from containment model
CreditedVolume  = StorageCapacity × PermanenceFactor
```

| Parameter | Symbol | Source |
|---|---|---|
| Storage efficiency | E | DOE/NETL (saline 0.5–5%, depleted field higher) |
| Porosity/permeability | φ, k | site core/log data |
| CO₂ density | ρ_CO2 | reservoir P–T equation of state |
| Seal/fault/well/seismic | — | site characterisation, EPA Class VI |

### 8.4 Data requirements
Reservoir geometry (area, thickness), petrophysics (porosity, permeability), reservoir P–T, seal and fault
mapping, legacy-well inventory, seismic-hazard data. None currently in the platform for this route; the
generic carbon endpoints do not provide geological data.

### 8.5 Validation & benchmarking plan
Reconcile capacity estimates against DOE Carbon Storage Atlas figures for analogue formations. Validate
injectivity against site pilot-injection data. Benchmark containment-risk scoring against IEAGHG/EPA Class VI
permitting outcomes. Sensitivity of credited volume to the efficiency factor and permanence assumption.

### 8.6 Limitations & model risk
Storage-efficiency factor spans an order of magnitude (0.5–5% for saline aquifers) — the dominant capacity
uncertainty; present ranges. Containment risk is site-specific and data-hungry; a conservative fallback caps
permanence and flags sites lacking seal characterisation. Induced seismicity from injection is a material
operational and reputational risk that must gate creditable volume.
