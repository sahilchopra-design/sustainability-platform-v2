# EU CBAM Analytics & Compliance
**Module ID:** `cbam-analytics-compliance` · **Route:** `/cbam-analytics-compliance` · **Tier:** B (frontend-computed) · **EP code:** EP-EG3 · **Sprint:** EG

## 1 · Overview
EU Carbon Border Adjustment Mechanism analytics covering 7 sectors (Steel, Cement, Aluminium, Fertilisers, Electricity, Hydrogen, Chemicals), 20 seeded countries with CBAM exposure, phase-in timeline 2024–2034, certificate price scenarios, and strategic response options.

> **Business value:** Used by importers assessing CBAM compliance costs, EU manufacturers competing with imports, investors analysing trade flow impacts, and governments designing decarbonisation strategy in CBAM-exposed sectors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_SECTORS`, `COUNTRIES`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `steelExport` | `parseFloat((sr(i * 7 + 1) * 8).toFixed(1));` |
| `annualCbam` | `parseFloat((steelExport * ci * 62 * 1e6 / 1e9).toFixed(2));` |
| `totalCbamRevenue` | `useMemo(() => COUNTRIES.reduce((s, c) => s + c.annualCbam, 0).toFixed(1), []);` |
| `sectorExposure` | `CBAM_SECTORS.map(s => ({` |
| `timelineChart` | `[2024, 2025, 2026, 2027, 2028, 2030, 2032, 2034].map(yr => ({` |
| `pct` | `(yr - 2026) / (2034 - 2026);` |
| `cbam` | `Math.round(1.85 * euEts * pct);` |
| `saved` | `Math.round(1.85 * euEts * (1 - pct));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CBAM_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM transition period | `Reporting only; no financial obligation` | EU Regulation 2023/956 | CBAM reporting started Oct 2023; financial adjustment starts 2026; full implementation 2034 when free allocati |
| Steel embedded CO₂ (tCO₂/t) | `BF-BOF world average` | worldsteel 2023 | China BF-BOF average: 2.0–2.2 tCO2/t; EU BF-BOF: 1.6–1.8 tCO2/t; gap drives CBAM exposure. |
| Cement embedded CO₂ (tCO₂/t) | `Calcination + thermal combustion` | IEA Cement Roadmap 2023 | Clinker at 0.55 tCO2/t from calcination alone; can only be reduced via CCS or alternative binders. |
- **EU Regulation 2023/956 + EU ETS price data + worldsteel/IFA/IAI embedded carbon benchmarks** → 7-sector CBAM model + 20-country exposure + certificate price scenarios + strategic response → **Importers assessing CBAM cost, EU producers competing with imports, and investors analysing CBAM impact on trade flows**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM Certificate Exposure (€/yr)
**Headline formula:** `CBAM_cost = Imported_quantity × Embedded_CO2 × (EU_ETS_price − Country_carbon_price)`
**Standards:** ['EU Regulation 2023/956 (CBAM)', 'EU ETS Directive 2003/87/EC', 'worldsteel + IFA + IAI embedded carbon data']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).