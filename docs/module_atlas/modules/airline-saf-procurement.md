# Airline SAF Procurement Intelligence
**Module ID:** `airline-saf-procurement` · **Route:** `/airline-saf-procurement` · **Tier:** B (frontend-computed) · **EP code:** EP-EF5 · **Sprint:** EF

## 1 · Overview
SAF procurement analytics for 8 major airlines: Lufthansa, British Airways, Delta, United, Air France-KLM, Singapore Airlines, JAL, and Qantas. Covers 16 seeded deals, book-and-claim frameworks, PPA pricing engine with indexation types, credit risk scatter, and SAF market size forecast.

> **Business value:** Used by airline sustainability teams, SAF producers structuring offtake deals, and investors analysing SAF demand security and airline credit quality in procurement agreements.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AIRLINES`, `DEALS`, `KpiCard`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Airline Portfolio', 'Offtake Structures', 'PPA Pricing Engine', 'Book-and-Claim', 'Credit Risk', 'Market Intelligence'];` |
| `volume` | `parseFloat((0.05 + sr(i * 11 + 2) * 0.45).toFixed(2));` |
| `tenor` | `5 + Math.floor(sr(i * 13 + 3) * 15);` |
| `price` | `parseFloat((1.80 + sr(i * 17 + 4) * 3.20).toFixed(2));` |
| `indexation` | `['CPI', 'Jet-A linked', 'Fixed', 'Hybrid'][Math.floor(sr(i * 19 + 5) * 4)];` |
| `status` | `['Signed', 'Negotiating', 'Loi', 'Expired'][Math.floor(sr(i * 23 + 6) * 4)];` |
| `structure` | `['LTC-Direct', 'Book-and-Claim', 'SAF Certificate', 'PPA Blended'][Math.floor(sr(i * 29 + 7) * 4)];` |
| `totalSafDemand` | `useMemo(() => filtered.reduce((s, a) => s + a.fuel_mt * a.target2030 / 100, 0).toFixed(1), [filtered]);` |
| `avgPct` | `useMemo(() => filtered.length ? (filtered.reduce((s, a) => s + a.saf_pct, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `ppaScenarios` | `useMemo(() => [2025, 2027, 2030, 2033, 2035].map(yr => {` |
| `multiplier` | `indexType === 'CPI' ? Math.pow(1.03, yr - 2024) : indexType === 'Jet-A linked' ? 1 + (yr - 2024) * 0.015 : 1;` |
| `creditRiskMap` | `DEALS.map(d => {` |
| `rating` | `{ 'A': 1, 'BBB': 2, 'BBB-': 3, 'BB+': 4, 'BB': 5 }[d.creditRating] \|\| 4;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AIRLINES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SAF market size 2030 (Bn gal) | `ICAO/IEA scenarios` | IEA Net Zero 2050 + ICAO CORSIA projections | 2024 production ~0.3 Bn gal; 10× scale-up required for 2030 mandate compliance across EU+UK. |
| SAF premium over jet fuel ($/gal) | `LCOF − JetA spot + SAF_credit_value` | BNEF SAF Market Outlook 2024 | HEFA premium: $1.5–2.5/gal; FT: $3–6/gal; PtL: $6–12/gal without subsidy. |
| Book-and-claim efficiency | `Certificates traceable from producer to airline via registry` | IATA + RSB Book-and-Claim Whitepaper | Critical for airlines unable to fuel at SAF-producing airports; certificate = environmental attribute transfer |
- **8-airline procurement profiles + 16 deals + PPA pricing model + credit risk scatter** → Airline SAF intelligence + PPA engine + market forecast + book-and-claim framework → **Airlines, SAF producers, and investors structuring long-term SAF offtake agreements**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF PPA Pricing Model
**Headline formula:** `SAF_price = Jet_fuel_spot + SAF_premium; Premium = LCOF − Jet_fuel_price + Carbon_credit_value`
**Standards:** ['IATA SAF PPA Framework 2023', 'ReFuelEU Book-and-Claim Guidance', 'BNEF SAF Market Outlook 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).