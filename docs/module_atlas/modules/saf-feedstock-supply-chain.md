# SAF Feedstock Supply Chain Intelligence
**Module ID:** `saf-feedstock-supply-chain` · **Route:** `/saf-feedstock-supply-chain` · **Tier:** B (frontend-computed) · **EP code:** EP-EF3 · **Sprint:** EF

## 1 · Overview
Comprehensive feedstock supply intelligence for all six SAF pathways: UCO, tallow, cellulosic residues, MSW, agricultural residues, and algae. Maps 18 seeded suppliers by certification (ISCC+, RSB), price forecast scenarios, and supply chain risk radar.

> **Business value:** Used by SAF producers managing feedstock procurement, airlines verifying sustainability credentials, and investors assessing feedstock supply risk in SAF project due diligence.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCKS`, `KpiCard`, `SUPPLIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `country` | `['USA', 'EU', 'Brazil', 'Australia', 'Malaysia', 'China', 'UK', 'Indonesia'][Math.floor(sr(i * 11 + 2) * 8)];` |
| `vol_t` | `Math.round((10000 + sr(i * 13 + 3) * 290000));` |
| `price` | `Math.round(fs.price2024 * (0.85 + sr(i * 17 + 4) * 0.35));` |
| `quality` | `parseFloat((60 + sr(i * 19 + 5) * 38).toFixed(1));` |
| `cert` | `['ISCC+', 'RSB', 'ISCC', 'REDcert²', 'None'][Math.floor(sr(i * 23 + 6) * 5)];` |
| `hhi` | `parseFloat((sr(i * 29 + 7) * 0.8).toFixed(2));` |
| `avgPrice` | `useMemo(() => filtered.length ? Math.round(filtered.reduce((s, f) => s + f.price, 0) / filtered.length) : 0, [filtered]);` |
| `avgQuality` | `useMemo(() => filtered.length ? (filtered.reduce((s, f) => s + f.quality, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalVol` | `useMemo(() => filtered.reduce((s, f) => s + f.vol_t, 0), [filtered]);` |
| `priceForecast` | `FEEDSTOCKS.map(f => {` |
| `forecast` | `Math.round(f.price2024 + (f.price2030 - f.price2024) * t);` |
| `riskRadar` | `FEEDSTOCKS.map(f => ({ subject: f.id, risk: f.risk, supply: Math.min(100, Math.round(f.supply_mt / 8)), growth: Math.min(100, Math.round(f.growth * 5)` |
| `sustainChart` | `FEEDSTOCKS.map(f => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UCO Price ($/t) | `Spot UCO market (RHS Bloomberg)` | USDA/EU UCO trade data | Highly volatile; affected by food demand competition and EU mandate on UCO in road transport. |
| ISCC+ Certification Cost ($/t) | `Audit + administration + annual renewal` | ISCC GmbH fee schedule | Required for EU RED compliance; covers chain of custody from feedstock origin to SAF producer. |
| Feedstock Gap by 2030 (Mt) | `IEA scenario: required − available` | IEA Renewables 2023 + Task 39 | Principal bottleneck for SAF scale-up; drives premiums and PtL investment as alternative. |
- **ISCC+/RSB certification data + feedstock price market + supply gap analysis** → 18-supplier intelligence + price forecast slider + supply chain risk radar → **SAF producers securing feedstock, airlines verifying sustainability, investors assessing supply risk**

## 5 · Intermediate Transformation Logic
**Methodology:** Feedstock Availability & Cost
**Headline formula:** `Feedstock_cost = Collection + Processing + Transport; CI_reduction = (Petroleum_CI − SAF_CI) / Petroleum_CI`
**Standards:** ['ISCC+ Certification Framework', 'RSB Global Standard', 'IEA Bioenergy Task 39 Feedstock Availability']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).