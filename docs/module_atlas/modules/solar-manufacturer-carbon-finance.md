# Solar Manufacturer Carbon Finance
**Module ID:** `solar-manufacturer-carbon-finance` · **Route:** `/solar-manufacturer-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA3 · **Sprint:** EA

## 1 · Overview
Carbon finance analytics for solar module manufacturers covering product lifecycle LCA carbon footprint (20-50 gCO2e/kWh lifetime), EPD certification, CBAM export risk assessment, scope 3 upstream emissions (polysilicon, wafer, glass), and carbon credit eligibility for manufacturing decarbonisation projects.

> **Business value:** Used by solar manufacturers, ESG procurement teams, green bond structurers, and EU customs/trade compliance officers to manage carbon regulatory risk and demonstrate product sustainability credentials.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_INTENSITY_BENCHMARK`, `CBAM_TIMELINE`, `CCTS_SECTORS`, `EPD_STANDARDS`, `EXPORT_MARKETS`, `GRID_EF_ROADMAP`, `Kpi`, `MANUFACTURERS`, `PLI_TRANCHES`, `SCOPE_BREAKDOWN`, `SectionTitle`, `Tab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tco2PerMw` | `carbonIntensityKgW * 1000 / 1000;` |
| `gross` | `tco2PerMw * euEtsPrice * mwExport * (cbamPct/100);` |
| `incentiveCr` | `capGwAnnual * 1e6 * incentiveRsW / 1e7;` |
| `total` | `incentiveCr * tenure;` |
| `systemTco2Embed` | `systemKwp * moduleCI / 1e6;` |
| `annDisplacedTco2` | `annGenMwh * gridEf;` |
| `cbamCalc` | `useMemo(() => calcCbamCost({ carbonIntensityKgW: mfr.scope1KgW + mfr.scope2KgW, euEtsPrice, mwExport: exportMw, cbamPct: cbamRow.cbamPct }), [mfr, euE` |
| `payback` | `calcCarbonPayback({ systemKwp: 1, gridEf: gridEfNow, annGenMwh: 1.6, moduleCI: (mfr.scope1KgW + mfr.scope2KgW + mfr.scope3KgW) });` |
| `tabs` | `['Overview','Manufacturer Dashboard','CBAM Exposure','PLI Carbon Nexus','Carbon Intensity','Scope 1-2-3 Breakdown','EPD & Standards','CCTS Compliance'` |
| `exp` | `m.cbamExposureEurMw * 500 / 1e6;` |
| `tco2` | `(v.intensity / 1000) * v.mw * 1e6;` |
| `tco2` | `((mfr.scope1KgW + mfr.scope2KgW) / 1000) * exportMw * 1e6;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_INTENSITY_BENCHMARK`, `CBAM_TIMELINE`, `CCTS_SECTORS`, `EPD_STANDARDS`, `EXPORT_MARKETS`, `GRID_EF_ROADMAP`, `MANUFACTURERS`, `PLI_TRANCHES`, `SCOPE_BREAKDOWN`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Carbon Footprint (gCO2e/kWh) | `(mfg_GHG + transport_GHG) / (AEP × 30yr)` | IEA-PVPS LCA database + EPD data | Best-in-class monocrystalline modules ~20-25 gCO2e/kWh; Chinese grid-powered production ~35-50 gCO2e/kWh. |
| CBAM Exposure (€/MW exported) | `embedded_tCO2e/MW × EU ETS carbon price` | EU ETS price + production emission intensity | Estimated annual CBAM cost for a 1GW manufacturer exporting to EU at €65/tCO2 and 35 tCO2e/MW module productio |
| Scope 3 Upstream Intensity (kgCO2e/module) | `Σ(material_mass_i × emission_factor_i)` | Exiobase EEIO + supplier EPDs | Polysilicon and glass dominate upstream scope 3; value chain decarbonisation requires supplier energy transiti |
- **IEA-PVPS LCA database + Exiobase EEIO + EU ETS price + supplier EPDs** → Module LCA calculation → CBAM exposure model → scope 3 hotspot analysis → **Carbon footprint analytics for solar manufacturing decarbonisation and trade compliance**

## 5 · Intermediate Transformation Logic
**Methodology:** Solar Module LCA Carbon Footprint Analysis
**Headline formula:** `lifetime_CF = (mfg_emissions + BOS_emissions) / (AEP × system_lifetime_years)`
**Standards:** ['IEA-PVPS Task 12 LCA Guidelines', 'ISO 14044 Life Cycle Assessment', 'EU CBAM Regulation 2023/956']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`