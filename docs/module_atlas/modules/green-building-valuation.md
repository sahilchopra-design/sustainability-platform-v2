# Green Building Valuation
**Module ID:** `green-building-valuation` · **Route:** `/green-building-valuation` · **Tier:** B (frontend-computed) · **EP code:** EP-DE1 · **Sprint:** DE

## 1 · Overview
Quantifies the green premium and climate-adjusted value of certified buildings using GRESB, LEED, BREEAM, and NABERS benchmarks. Models energy performance certificates, carbon intensity pathways, and stranded asset risk under net-zero transition scenarios.

> **Business value:** Critical for real estate investors, REITs, and mortgage lenders assessing transition risk. Quantifies green premium to justify sustainability capex, identifies stranding year to sequence divestment, and aligns with EU Taxonomy Art.10 for sustainable finance labelling.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CERTS`, `CITIES`, `CRREM_BUDGET`, `Card`, `EPC`, `KpiCard`, `PROPERTIES`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Industrial','Residential','Hotel','Mixed-Use'];` |
| `CRREM_BUDGET` | `{ Office: 35, Retail: 40, Industrial: 60, Residential: 25, Hotel: 45, 'Mixed-Use': 38 };` |
| `type` | `TYPES[Math.floor(sr(i * 7)  * TYPES.length)];` |
| `city` | `CITIES[Math.floor(sr(i * 11) * CITIES.length)];` |
| `epc` | `EPC[Math.floor(sr(i * 13)   * EPC.length)];` |
| `cert` | `CERTS[Math.floor(sr(i * 17) * CERTS.length)];` |
| `epcIdx` | `EPC.indexOf(epc); // 0=A (best), 6=G (worst)` |
| `greenPremium` | `parseFloat(((certBonus + (6 - epcIdx) * 0.012 + sr(i * 23) * 0.03 - 0.01) * 100).toFixed(1));` |
| `size` | `Math.round(500  + sr(i * 3)  * 14500);` |
| `energy` | `Math.round(50   + epcIdx * 58 + sr(i * 5) * 75);` |
| `carbon` | `Math.round(15   + epcIdx * 23 + sr(i * 9) * 38);` |
| `vpsm` | `Math.round(2500 + sr(i * 19) * 12500);` |
| `value` | `parseFloat((vpsm * size / 1e6).toFixed(2));` |
| `noi` | `parseFloat((value * (0.04 + sr(i * 41) * 0.025)).toFixed(3));` |
| `overshoot` | `Math.max(0, carbon - budget);` |
| `strandYr` | `overshoot === 0 ? 2060 : Math.min(2055, Math.round(2025 + (budget / (overshoot + 1)) * 7 + sr(i * 37) * 4));` |
| `retCapex` | `parseFloat((size * (0.03 + epcIdx * 0.018 + sr(i * 31) * 0.12) / 1e6).toFixed(2));` |
| `avgPrem` | `n ? (filtered.reduce((s,p) => s + p.greenPremium, 0) / n).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTS`, `CITIES`, `EPC`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Premium | — | JLL/CBRE Transaction Data 2023 | Certified buildings command 7–12% rental premium and 10–18% capital value uplift over uncertified peers |
| CRREM Stranding Year | — | CRREM v2.0 1.5°C Pathway | Year at which building carbon intensity exceeds decarbonisation pathway — triggers stranded asset risk |
| EUI Benchmark | — | EU EPC Directive 2023 | Energy Use Intensity for commercial offices; NZEB target <50 kWh/m²/yr |
- **GRESB asset-level submissions** → ESG scoring + peer benchmarking → **Portfolio GRESB score, green star rating, sector percentile**
- **CRREM pathway data by property type/country** → Stranding year calculation → **Year of pathway breach + cumulative capex to comply**
- **EPC registry + utility bills** → EUI normalisation → **Climate-adjusted EUI removing weather variation**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Premium / Climate-Adjusted Valuation
**Headline formula:** `GreenPremium = (RentGreen - RentBrown) / RentBrown × 100; StrandedRisk = max(0, CarbonIntensity - SectorDecarbPath)`
**Standards:** ['GRESB Real Estate Assessment', 'LEED v4.1', 'BREEAM 2018', 'EU Taxonomy Art.10 DNSH', 'CRREM 1.5°C Pathways']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`