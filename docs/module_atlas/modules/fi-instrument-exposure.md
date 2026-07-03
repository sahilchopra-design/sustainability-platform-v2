# FI Instrument Exposure
**Module ID:** `fi-instrument-exposure` · **Route:** `/fi-instrument-exposure` · **Tier:** B (frontend-computed) · **EP code:** EP-CT2 · **Sprint:** CT

## 1 · Overview
200 instruments across 8 types including capital markets products. Climate VaR by instrument, green vs brown classification.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `INSTRUMENTS`, `INSTRUMENT_TYPES`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `maturity` | `2025 + Math.floor(sr(i * 7) * 11);` |
| `notional` | `Math.round(5 + sr(i * 11) * 195);` |
| `isGreen` | `sr(i * 13) > 0.55;` |
| `totalNotional` | `useMemo(() => INSTRUMENTS.reduce((s, i) => s + i.notional, 0), []);` |
| `totalVaR` | `useMemo(() => INSTRUMENTS.reduce((s, i) => s + i.climateVaR, 0), []);` |
| `varByType` | `useMemo(() => assetClassMix.map(a => ({` |
| `hedgingData` | `useMemo(() => INSTRUMENT_TYPES.map((it, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `INSTRUMENT_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Instruments | — | Portfolio | Across 8 types |
| Green Classified | — | EU Taxonomy | Instruments meeting green criteria |
| Avg Climate VaR | — | Model | Instrument-level climate risk |

## 5 · Intermediate Transformation Logic
**Methodology:** Instrument-level climate risk
**Headline formula:** `ClimateVaR_instrument = Notional × SectorRisk × Maturity_factor`
**Standards:** ['Basel IV', 'EU Taxonomy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).