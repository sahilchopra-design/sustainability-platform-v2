# CBAM Compliance
**Module ID:** `cbam-compliance` · **Route:** `/cbam-compliance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU Carbon Border Adjustment Mechanism compliance analytics covering embedded carbon calculation for 6 regulated sectors (steel, cement, aluminium, fertilizers, hydrogen, electricity), CBAM certificate procurement strategy, and declarant liability modelling. Tracks third-country carbon prices paid for corresponding CBAM deduction and supports transition period (2023–2025) and full CBAM (2026+) reporting.

> **Business value:** CBAM is the first major border carbon adjustment to enter legal force, creating direct financial liability for EU importers of steel, cement, aluminium, fertilizers, hydrogen, and electricity. By 2030, as EU ETS prices are projected to reach €120–180/tCO₂, CBAM liability for high-volume industrial importers could reach nine-figure annual costs, making proactive compliance analytics essential for procurement and treasury functions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMMODITIES`, `SUB_INDICES`, `SUB_LABELS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v => typeof v === 'number' ? (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : ` |
| `fmtPct` | `v => typeof v === 'number' ? (v * 100).toFixed(1) + '%' : v;` |
| `fmtUsd` | `v => typeof v === 'number' ? '$' + fmt(v * 1000) : v; // kusd to usd display` |
| `productGroups` | `[...new Set(defaultValues.map(d => d.productGroup))];` |
| `badgeS` | `(bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });` |
| `csv` | `[h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `dvPaged` | `filteredDV.slice(dvPage * DV_PAGE, (dvPage + 1) * DV_PAGE);` |
| `dvTotalPages` | `Math.max(1, Math.ceil(filteredDV.length / DV_PAGE));` |
| `totalEmissions` | `tradeFlows.reduce((s, f) => s + (f.totalEmissions_tco2 \|\| 0), 0);` |
| `radarData` | `SUB_INDICES.map(k => ({` |
| `compBars` | `SUB_INDICES.map(k => ({` |
| `sorted` | `[...countries].sort((a, b) => (b[si] \|\| 0) - (a[si] \|\| 0));` |
| `avg` | `countries.length > 0 ? countries.reduce((s, c) => s + (c[si] \|\| 0), 0) / countries.length : 0;` |
| `min` | `sorted[sorted.length - 1]?.[si] \|\| 0;` |
| `median` | `sorted[Math.floor(sorted.length / 2)]?.[si] \|\| 0;` |
| `step` | `max > 0 ? max / 5 : 0.2;` |
| `scatterData` | `countries.map(c => ({` |
| `costByCommodity` | `COMMODITIES.map(comm => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SUB_INDICES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CBAM Annual Liability | `Σ(Import_t × Embedded_C × (ETS_price – Origin_price))` | CBAM Declarant | Annual CBAM certificate cost for EU-importing portfolio companies in 6 regulated sectors |
| Embedded Carbon (steel) | — | EU CBAM Delegated Act defaults | Default embedded carbon per tonne of steel imports; actual values from verified operator declaration |
| CBAM Certificate Price | `Weekly EU ETS average` | CBAM Authority | Certificate price set by weekly average EU ETS auction price; matches ETS exposure |
- **EU customs import data (CN codes, volumes, country of origin)** → Map to CBAM sectors; compute embedded carbon using verified or default factors; apply ETS-origin price gap → **Per-importer CBAM liability schedule with sector breakdown and certificate requirement**
- **EU ETS weekly auction price data** → Compute CBAM certificate price; model liability under price scenarios → **CBAM certificate procurement cost and price scenario sensitivity analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** CBAM embedded carbon liability model
**Headline formula:** `CBAM_liability = Σ_i(ImportTonnes_i × EmbeddedCarbon_i × max(0, EU_ETS_price – Origin_price_i)); EmbeddedCarbon = Direct_emissions + Indirect_emissions_per_tonne`
**Standards:** ['EU CBAM Regulation 2023/956', 'EU ETS Directive Phase IV', 'CBAM Delegated Acts (2024)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).