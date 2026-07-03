# Green Bond Portfolio Analytics
**Module ID:** `green-bond-portfolio-analytics` · **Route:** `/green-bond-portfolio-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive analytics for green, social, sustainability, and sustainability-linked bond (GSS+) portfolios including use-of-proceeds tracking, impact reporting, greenium quantification, and ICMA Principles alignment. Enables portfolio managers to monitor labelled bond allocation, verify impact claims, and produce investor impact reports.

> **Business value:** Enables fixed income portfolio managers to demonstrate use-of-proceeds integrity, quantify the greenium cost of green bond allocation, and produce ICMA-aligned impact reports satisfying SFDR sustainable investment disclosures and EU Green Bond Standard requirements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `BONDS_N`, `BOND_TYPES`, `COUNTRIES_GB`, `GB_COUNTRY_ISSUANCE`, `GB_COUNTRY_MAP`, `GB_MARKET`, `GB_SECTORS`, `GB_TOTAL_2023`, `ICMA_CATEGORIES`, `KpiCard`, `REPORTING_STATUSES`, `TABS`, `VERIFIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `BOND_TYPES[Math.floor(sr(i * 7 + 1) * BOND_TYPES.length)];` |
| `nominal` | `sr(i * 11 + 2) * 500 + 50;` |
| `coupon` | `sr(i * 13 + 3) * 0.06 + 0.005;` |
| `ytm` | `coupon + (sr(i * 17 + 4) * 0.01 - 0.005);` |
| `greenium` | `sr(i * 19 + 5) * 0.0025 - 0.005;` |
| `dur` | `sr(i * 23 + 6) * 12 + 1;` |
| `impactPerM` | `type === 'Green' ? sr(i * 29 + 7) * 8 + 0.5 : type === 'Social' ? sr(i * 31 + 8) * 2000 + 100 : sr(i * 37 + 9) * 5 + 0.2;` |
| `sec` | `GB_SECTORS[Math.floor(sr(i * 41 + 10) * GB_SECTORS.length)];` |
| `verifier` | `VERIFIERS[Math.floor(sr(i * 43 + 11) * VERIFIERS.length)];` |
| `reporting` | `REPORTING_STATUSES[Math.floor(sr(i * 47 + 12) * 3)];` |
| `GB_COUNTRY_MAP` | `Object.fromEntries(GB_MARKET.map(c=>[c.iso3, c]));` |
| `GB_TOTAL_2023` | `GB_MARKET.reduce((s,c)=>s+c.issuance_usd_bn,0).toFixed(0);` |
| `GB_COUNTRY_ISSUANCE` | `GB_MARKET.slice(0,12).map(c=>({name:c.country, iso:c.iso3, value:c.issuance_usd_bn, yoy:c.yoy_change_pct, sovereign:c.sovereign_green_bond}));` |
| `totalNominal` | `BONDS.reduce((s, b) => s + b.nominal, 0);` |
| `BONDS_N` | `BONDS.map(b => ({ ...b, aumWeight: b.nominal / totalNominal }));` |
| `filteredNominal` | `useMemo(() => filtered.reduce((s, b) => s + b.nominal, 0), [filtered]);` |
| `totN` | `filtered.reduce((s, b) => s + b.nominal, 0);` |
| `avgImpact` | `useMemo(() => filtered.length ? filtered.reduce((s, b) => s + b.aumWeight * b.blendedImpact, 0) / (filtered.reduce((s, b) => s + b.aumWeight, 0) \|\| 1)` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_TYPES`, `COUNTRIES_GB`, `GB_SECTORS`, `ICMA_CATEGORIES`, `REPORTING_STATUSES`, `TABS`, `VERIFIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Greenium (bps) | — | Bloomberg / ICMA | Weighted average greenium across GSS+ holdings; negative values indicate green bonds trade richer, reducing yi |
| Use-of-Proceeds Allocation (%) | — | Issuer allocation reports | Percentage of green bond proceeds allocated to eligible green projects per issuer reports; unallocated proceed |
| Impact: Renewable Energy Capacity (MW) | — | Issuer impact reports | Aggregate renewable energy capacity financed across portfolio's green bond holdings, reported per €1M invested |
| CBI Certification Rate (%) | — | Climate Bonds Initiative | Share of GSS+ portfolio holdings carrying third-party CBI certification; higher rates indicate stronger use-of |
- **GSS+ bond universe (Bloomberg / ICE)** → Classify by ICMA type, extract use-of-proceeds categories → **Labelled bond classification database**
- **Issuer green bond allocation and impact reports** → Aggregate impact metrics by project category, normalise per €1M → **Portfolio impact report**
- **Conventional bond curves by issuer** → Fit spline, compute Z-spread differential → **Greenium by holding in basis points**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium Quantification (Z-spread)
**Headline formula:** `Greenium_i = ZSpread_conventional_matched - ZSpread_green_i`
**Standards:** ['ICMA Green Bond Principles 2021', 'EU Green Bond Standard (EuGBS)', 'Climate Bonds Initiative Taxonomy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).