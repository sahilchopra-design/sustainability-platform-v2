## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/entity-data` is the **CSRD Entity Data Bridge**
(`backend/services/csrd_entity_service.py` + `routes/entity_data.py`): a translation layer that
exposes the platform's **8 seeded CSRD reporting entities** — 4 financial institutions (ABN AMRO,
BNP Paribas, ING Group, Rabobank) and 4 energy companies (EDP, ENGIE, Ørsted, RWE Group) — in
"module-ready" input formats. Its purpose, per the route docstring, is that "Carbon, ECL, Nature
Risk, Stranded Asset, Sector Assessment, and Portfolio modules can pre-fill their inputs from real
database values instead of requiring manual entry." It performs **no modelling**: every endpoint
is a set of SQL SELECTs over the seeded ESRS/FI/energy tables plus field renaming and unit
conversion. The only arithmetic in the service:

```
total_ead_eur     = total_ead_meur × 1,000,000                      (mEUR → EUR for ECL)
real_estate_ead   = commercial_ead + residential_ead                (mEUR)
stage defaults    = Stage 1/2/3 = 70/20/10 % when the FI ratios are absent
```

### 7.2 Data schema / source tables

The bridge reads reporting-year-2024 rows keyed by `entity_registry_id` from a full ESRS table
family plus two sector verticals:

| Table | Content surfaced |
|---|---|
| `csrd_entity_registry` | Legal name, sector/subtype, country, turnover €M, balance sheet €M, employees, in-scope flags (CSRD, SFDR + article, EU Taxonomy, TCFD, ISSB), FK to FI/energy vertical |
| `esrs_e1_ghg_emissions` | Scope 1 gross + 4 sub-sources + biogenic; Scope 2 location/market; Scope 3 total + per-category (cat 1, 2, 3, 6, 7, 15…); location/market GHG intensity per €M |
| `esrs_e1_energy` | Total/fossil/nuclear/renewable MWh, renewable % |
| `esrs_e3_water` | Consumption, at-water-risk consumption, recycled, withdrawals (incl. groundwater/municipal/high-stress m³ and %) |
| `esrs_e4_biodiversity` | Sites in/near protected/KBA (count, ha), land use, sealed area, 4 TNFD LEAP phase-completion booleans, biodiversity financial risk €, ecosystem-services value at risk € |
| `esrs_e2_pollution` | NOx/SOx/PM2.5/VOC to air; N/P to water (tonnes) |
| `esrs_e5_circular` | Materials consumed, secondary-material tonnes/%, waste totals, hazardous waste |
| `esrs_s1_workforce` | Headcount and gender split, permanent/temporary, CBA coverage %, gender pay gap %, fatalities, days lost, remuneration ratio |
| `esrs_g1_conduct` | Code-of-conduct/anti-corruption/whistleblowing flags, training coverage %, convictions/incidents, payment terms |
| financial-effects table | Scenario set used, assets at material physical/transition risk (€, %), stranded-asset estimate €, monetised GHG € |
| `fi_financials` / `fi_loan_books` / `fi_csrd_e1_climate` | Bank balance sheet (assets, gross/net loans, NPL, CET1/T1/total capital, RWA, LCR, NSFR, cost of risk, Stage 1/2/3 %), sector EADs (oil & gas, renewables, industrials, transport, CRE, RRE, retail mortgage, fossil-fuel extraction), financed emissions cat 15, WACI per €M EVIC, portfolio temperature alignment °C |
| `energy_generation_mix` / `energy_stranded_assets_register` | Installed GW by technology (coal, lignite, CCGT, OCGT, oil, nuclear, hydro, wind on/offshore, solar), renewables share %, average gCO₂/kWh, EU ETS cost and average price, and a plant-level stranded register (fuel, MW, commissioning/retirement year, status, book value €M) |

### 7.3 Calculation walkthrough / API surface

| Endpoint | Behaviour |
|---|---|
| `GET /entities` | 8-row summary joining registry + GHG + energy + generation mix + workforce (top-level KPIs per entity). |
| `GET /{entity_id}` | Full profile: entity metadata + ghg/energy/water/biodiversity/pollution/circular/workforce/governance/financial_effects blocks; adds `fi` or `energy_ops` block when the vertical FK exists. 404 if unknown. |
| `GET /{id}/carbon` | Carbon Calculator pre-fill: scopes 1/2/3 with sub-sources and categories, intensities, energy MWh, revenue context. |
| `GET /{id}/ecl` | ECL pre-fill (FI entities only; 404 otherwise): balance sheet, IFRS 9 stage mix (70/20/10 defaults), sector EAD map, financed emissions, WACI, temperature alignment. |
| `GET /{id}/nature` | TNFD LEAP pre-fill: E4 biodiversity + E3 water + biogenic CO₂. |
| `GET /{id}/stranded` | Stranded Asset Calculator pre-fill (energy entities only): generation mix GW, carbon intensity, ETS costs, plant-level stranded register. |
| `GET /{id}/sector` | Sector Assessment pre-fill from energy/FI operational data. |
| `GET /{id}/portfolio-asset` | An `assets_pg`-compatible record spec so the entity can be seeded as a portfolio holding. |

### 7.4 Worked example (ECL pre-fill unit flow)

For an FI entity whose `fi_loan_books.total_ead = 285,000` (mEUR) and reported stage mix
92.1/6.4/1.5:

| Field | Computation | Result |
|---|---|---|
| `total_ead_meur` | pass-through | 285,000 |
| `total_ead_eur` | 285,000 × 10⁶ | 2.85 × 10¹¹ EUR |
| `stage1/2/3_pct` | reported values present → no 70/20/10 fallback | 92.1 / 6.4 / 1.5 |
| `real_estate_ead_meur` | CRE + RRE EADs summed | Σ of the two columns |

The consuming ECL module then applies its own PD/LGD assumptions — this bridge deliberately
stops at input assembly.

### 7.5 Data provenance & limitations

- **Seeded demo data, not live filings**: the 8 entities are real companies, but their table rows
  are platform seed data modelled on the shape (and plausible magnitudes) of their CSRD/Pillar 3
  disclosures. There is **no PRNG in this service** — values are fixed seeds read from Postgres —
  but they should not be quoted as the companies' actual reported figures.
- Reporting year is **hardcoded to 2024** in every query; multi-year history is not surfaced.
- Silent fallbacks: IFRS 9 stage mix defaults to 70/20/10 when absent (a stylised bank book);
  `real_estate_ead` is `None` (not partial) when the commercial column is missing even if
  residential exists — small asymmetries consumers should know.
- 404 semantics conflate "entity missing" and "wrong sector" (e.g. `/ecl` on an energy entity).
- No aggregation/validation is applied — inconsistencies between seeded blocks (e.g. E1 scope 3
  cat 15 vs FI financed emissions) would pass through unflagged.

### 7.6 Framework alignment

- **CSRD / ESRS Set 1 (EFRAG 2023):** the table family mirrors the ESRS topical standards —
  E1 (GHG per §44 breakdowns incl. location vs market Scope 2 and per-category Scope 3),
  E2 pollution, E3 water, E4 biodiversity (incl. sites near protected areas/KBAs), E5 circular
  economy, S1 own workforce, G1 business conduct — plus the E1-9 style anticipated-financial-
  effects block (assets at physical/transition risk, stranded assets, monetised GHG).
- **GHG Protocol:** scope structure and the 15-category Scope 3 taxonomy (cat 15 = investments,
  the FI financed-emissions category).
- **TNFD LEAP:** the four phase-completion flags (Locate → Evaluate → Assess → Prepare) track an
  entity's progress through the TNFD's recommended assessment workflow.
- **PCAF / Basel Pillar 3:** FI blocks carry financed emissions, WACI per EVIC and portfolio
  temperature alignment alongside CET1/RWA/LCR/NSFR — the joined disclosure set banks publish
  across PCAF reports and EBA Pillar 3 ESG templates.
- **EU ETS & stranded-asset practice:** energy blocks expose ETS cost/price and a retirement
  register, the inputs a CRREM/NGFS-style stranding analysis needs.
