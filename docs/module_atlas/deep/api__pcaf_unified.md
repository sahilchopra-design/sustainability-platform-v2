## 7 · Methodology Deep Dive

The `pcaf_unified` domain (`/api/v1/pcaf-module`) is the **master PCAF orchestrator**
(`pcaf_unified_engine.py`) covering PCAF v2.0 Parts A, B and C in one engine, plus the
insurance/facilitated logic in `facilitated_emissions_engine.py`. It delegates to the WACI,
quality and facilitated engines and adds unified portfolio calculation, seven-framework
disclosure, and ECL/scenario bridges.

### 7.1 What the module computes

Per asset class it computes attribution × emissions with class-specific formulas; per portfolio
it rolls up financed + facilitated + insurance-associated emissions, DQS, WACI and regulatory
disclosures. The generic identity is `financed = attribution_factor × entity_emissions`, with
attribution keyed on EVIC, balance sheet, property/vehicle value, or project cost by class.

### 7.2 Parameterisation / scoring rubric

**Mortgage EPC factors** (`MORTGAGE_EPC_FACTORS`, kgCO₂/m²/yr): A+ 5 → G 160. **Vehicle
factors** (`VEHICLE_EMISSION_FACTORS`, gCO₂/km): petrol 170, diesel 155, hybrid 105, PHEV 60,
BEV 0. **Building factors** (`BUILDING_EMISSION_FACTORS`, EPC A+ 8 → G 180 kgCO₂/m²).
**Insurance LoB factors** (`INSURANCE_LOB_FACTORS`, tCO₂e/€M premium): commercial energy 450,
marine 120, motor commercial 85, life/health 5 (disclosure-only). **Sector intensities**
(`SECTOR_EMISSION_INTENSITIES`): Utilities 950, Energy 820, Financials 12.

**Facilitated attribution** (`facilitated_emissions_engine`, PCAF Part C): debt underwriting
`AF = underwritten/(total_issuance × 3)`; equity `shares/(market_cap × 3)`; the **÷3 time-in-
year factor** (`_PCAF_TIME_FACTOR ≈ 0.333`) is PCAF's capital-markets weighting; M&A advisory
`AF = 0` (disclosure-only).

**Green-bond use-of-proceeds** (`GREEN_BOND_UOP_FACTORS`, tCO₂e avoided/€M): renewables 320,
energy efficiency 180, clean transport 140. **Infrastructure EF** (`INFRASTRUCTURE_EF`):
coal 950, gas CCGT 380, solar 25, wind 12, nuclear 8.

**Provenance:** PCAF v2.0 tables, EU EPBD/CRREM (EPC), EU 2019/631/ICCT (vehicles), IEA/EDGAR
(sovereign) — public constants.

### 7.3 Calculation walkthrough

`calculate_mortgages`: `af = min(outstanding/property_value, 1.0)`; annual building emissions
`= floor_area × kgCO₂/m² / 1000`, split **40% Scope 1 (gas) / 60% Scope 2 (electricity)`;
financed = af × split; DQS auto-derived from EPC/floor-area availability. `calculate_vehicle_
loans`: `af = min(outstanding/vehicle_value, 1.0)`; `annual = km × gCO₂/km / 1e6`; BEV/FCEV
put emissions in Scope 2 (grid), PHEV splits 50/50. `calculate_portfolio` aggregates every
class + insurance + facilitated into portfolio totals, WACI, DQS distribution and disclosures.

### 7.4 Worked example

Residential mortgage: `outstanding = €200,000`, `property_value = €300,000`, EPC C
(42 kgCO₂/m²), floor area 100 m².

- **Attribution:** `af = min(200,000/300,000, 1.0) = 0.667`.
- **Annual building emissions:** `100 × 42 / 1000 = 4.2 tCO₂e`.
- **Split:** Scope 1 `4.2·0.4 = 1.68`; Scope 2 `4.2·0.6 = 2.52`.
- **Financed:** Scope 1 `0.667·1.68 = 1.12`; Scope 2 `1.68`; **total ≈ 2.80 tCO₂e**.

A €10M debt underwriting of a €200M issuance with issuer emissions 500,000 tCO₂e:
`AF = 10/(200×3) = 0.0167`; facilitated `= 0.0167 × 500,000 = 8,333 tCO₂e`.

### 7.5 Bridges & disclosures

`generate_regulatory_disclosures` emits seven-framework outputs (SFDR PAI, CSRD ESRS E1, IFRS
S2, GRI 305, EU Taxonomy, TCFD, NZBA). `bridge_to_ecl` and `bridge_to_scenario_analysis` hand
PCAF outputs to the ECL climate overlay and scenario engine (see `pcaf_ecl_bridge`).
`generate_improvement_roadmap` sequences DQS 5→1 transitions.

### 7.6 Data provenance & limitations

- All emission factors are **cited public reference tables** as constants; no `sr()` PRNG.
- Missing data is handled by class-specific defaults (e.g. 80 m² floor area, petrol EF) and
  DQS auto-derivation, not random fabrication — but defaults can bias small samples.
- The 40/60 mortgage Scope split and the Part C ÷3 factor are PCAF-consistent simplifications
  of full building energy modelling / time-weighted attribution.

**Framework alignment:** **PCAF v2.0 Part A** (7+3 asset-class attribution, Tables 5.1-5.6),
**Part B** (insurance-associated emissions by line of business), **Part C** (capital-markets
facilitated emissions with the ÷3 factor and advisory-disclosure-only rule). Portfolio
disclosures map to **SFDR PAI**, **CSRD ESRS E1-6**, **IFRS S2**, **GRI 305-3**, **EU Taxonomy
GAR**, **TCFD** and **NZBA** exactly as documented in the cross-framework map.
