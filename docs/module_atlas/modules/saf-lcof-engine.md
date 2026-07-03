# SAF Levelised Cost of Fuel Engine
**Module ID:** `saf-lcof-engine` · **Route:** `/saf-lcof-engine` · **Tier:** B (frontend-computed) · **EP code:** EP-EF1 · **Sprint:** EF

## 1 · Overview
Comprehensive LCOF analysis for all six ASTM D7566 sustainable aviation fuel pathways. Models HEFA-UCO, HEFA-Tallow, AtJ-Cellulosic, FT-MSW, FT-Agricultural, and PtL-DAC including feedstock cost, CAPEX learning curves (Wright's Law), IRA §40B tax credit ($1.25–$1.75/gal), and 24 seeded project benchmarks.

> **Business value:** Used by SAF project developers, airlines procuring sustainable fuel, investors evaluating SAF projects, and policy analysts assessing IRA §40B credit impacts on pathway economics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `KpiCard`, `PATHWAYS`, `PROJECTS`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capMt` | `parseFloat((0.05 + sr(i * 11 + 2) * 0.95).toFixed(2));` |
| `lcof` | `parseFloat((pw.lcof * (0.88 + sr(i * 13 + 3) * 0.28)).toFixed(2));` |
| `country` | `['USA', 'EU', 'UK', 'Japan', 'Australia', 'Singapore', 'UAE', 'Brazil'][Math.floor(sr(i * 17 + 4) * 8)];` |
| `status` | `['Operating', 'Construction', 'FID', 'Engineering', 'Development'][Math.floor(sr(i * 19 + 5) * 5)];` |
| `irr` | `parseFloat((7 + sr(i * 23 + 6) * 14).toFixed(1));` |
| `corsia` | `sr(i * 29 + 7) > 0.5;` |
| `map` | `{ Operating: T.green, Construction: T.blue, FID: T.indigo, Engineering: T.amber, Development: T.sub, Commercial: T.green, 'Early Comm.': T.blue, 'Demo` |
| `countries` | `useMemo(() => ['ALL', ...new Set(PROJECTS.map(p => p.country))], []);` |
| `avgLcof` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.lcof, 0) / filtered.length).toFixed(2) : '—', [filtered]);` |
| `avgIrr` | `useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `corsiaShare` | `useMemo(() => filtered.length ? Math.round(filtered.filter(p => p.corsia).length / filtered.length * 100) : 0, [filtered]);` |
| `pathwayChart` | `PATHWAYS.map(pw => ({ name: pw.id.split('-')[0], lcof: pw.lcof, capex: pw.capex / 100, ci: Math.abs(pw.ci) }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `PATHWAYS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| HEFA LCOF ($/gal) | `CAPEX_CRF + Feedstock_UCO + Opex − §40B` | NREL SAF Pathways 2023 | UCO feedstock $0.60–1.20/gal; CAPEX $2–3/gal amortised; IRA §40B reduces by $1.25–1.75/gal. |
| PtL LCOF ($/gal) | `Electricity_cost × 1.8 kWh/gal_H2 + CO2_capture + synthesis` | IEA Net Zero by 2050 | Electricity 60–70% of cost; requires <$20/MWh green power for competitiveness by 2035. |
| IRA §40B Credit ($/gal) | `Base $1.25 × SAF_multiplier (1.0–1.4 for CI < 50)` | IRS Notice 2023-06 | Minimum 50% CI reduction vs petroleum jet; expires end 2027; replaced by §45Z. |
- **NREL LCOF benchmarks + ICAO CI values + IRA §40B statute** → Six-pathway LCOF model + learning curves + §40B calculator + sensitivity waterfall → **SAF developers, airlines, investors, and policy teams benchmarking pathway economics**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF LCOF Calculation ($/gal)
**Headline formula:** `LCOF = (CAPEX×CRF + OPEX) / Annual_Production + Feedstock_Cost − IRA_§40B_Credit`
**Standards:** ['ICAO CORSIA Default Life Cycle Values', 'NREL SAF Pathways Cost Analysis 2023', 'IEA Sustainable Aviation Fuel Report 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).