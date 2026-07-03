# Green Building Certification
**Module ID:** `green-building-cert` · **Route:** `/green-building-cert` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks BREEAM, LEED, and ENERGY STAR certification status across real estate portfolio assets, computing certification-driven premium analytics and identifying gap-to-certification for uncertified assets. Supports EU Taxonomy real estate technical screening criteria alignment and SFDR PAI 18 (energy inefficient real estate) monitoring.

> **Business value:** Enables real estate portfolio managers to track green certification coverage, quantify certification-driven value premiums, and demonstrate EU Taxonomy alignment for real estate holdings. Supports SFDR PAI 18 reporting on energy-inefficient real estate and GRESB Building Certification indicator disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_SCHEME_NAMES`, `CERT_COST_BENEFIT`, `CERT_SCHEMES`, `LS_KEY`, `PIE_COLORS`, `PIPELINE_KEY`, `PIPELINE_STATUSES`, `REGIONAL_REQUIREMENTS`, `SCHEME_EVAL`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `score` | `(200 - ei) * 0.3 + (100 - ci) * 0.2 + (100 - wi * 20) * 0.1 + wd * 0.2 + rn * 0.2;` |
| `idx` | `Math.min(levels.length - 1, Math.max(0, Math.floor(score / (100 / levels.length))));` |
| `estCost` | `costBase * (prop.gfa_m2 \|\| 10000) / 1e6;` |
| `roi` | `((premium / 100) * (prop.noi_usd_mn \|\| 10)) / estCost;` |
| `payback` | `estCost / ((premium / 100) * (prop.noi_usd_mn \|\| 10)) \|\| 0;` |
| `fmt` | `(n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});` |
| `fmtPct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `fmtMn` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;` |
| `badgeS` | `(bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });` |
| `entry` | `{ ...pipeForm, id: 'PL' + Date.now().toString(36) };` |
| `now` | `new Date('2026-03-25');` |
| `exp` | `new Date(c.expiry + '-12-31');` |
| `diff` | `(exp - now) / (1000 * 60 * 60 * 24 * 365);` |
| `certGFA` | `certifiedProps.reduce((s,p) => s+p.gfa_m2, 0);` |
| `totalGFA` | `props.reduce((s,p) => s+p.gfa_m2, 0);` |
| `certGAV` | `certifiedProps.reduce((s,p) => s+p.gav_usd_mn, 0);` |
| `totalGAV` | `props.reduce((s,p) => s+p.gav_usd_mn, 0);` |
| `avgScore` | `allCerts.length > 0 ? allCerts.reduce((s,c) => s+c.score, 0) / allCerts.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERT_COST_BENEFIT`, `PIE_COLORS`, `PIPELINE_STATUSES`, `REGIONAL_REQUIREMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BREEAM Certified (%) | — | BRE Global certification registry | Share of portfolio floor area with valid BREEAM certification; BREEAM Excellent or Outstanding required for EU |
| Energy Use Intensity (kWh/m²/yr) | — | REEB / Energy performance certificates | Annual energy consumption normalised by gross internal area; EU Taxonomy office threshold is 70 kWh/m²/yr prim |
| Certification Premium (%) | — | JLL / CBRE Green Premium Research | Rental or capital value premium of certified vs uncertified comparable assets; BREEAM Excellent assets command |
| ENERGY STAR Score | — | US EPA ENERGY STAR | Percentile score vs comparable US building stock; score ≥75 qualifies for ENERGY STAR certification. |
- **Energy performance certificates and meter data** → Normalise consumption by floor area, compare to BREEAM/LEED benchmarks → **EPG scores by asset**
- **BRE/USGBC certification registries** → Match portfolio assets to certification records, flag expired certificates → **Certification status by asset**
- **Comparable transaction data (JLL/CBRE)** → Regress certified vs uncertified rents controlling for location and grade → **Certification premium estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Performance Gap Score
**Headline formula:** `EPG = (EUI_actual - EUI_benchmark) / EUI_benchmark × 100`
**Standards:** ['BREEAM Technical Standards 2018', 'LEED v4.1 Building Operations', 'EU Taxonomy Real Estate TSC (Delegated Act)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).