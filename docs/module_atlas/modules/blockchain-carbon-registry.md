# Blockchain Carbon Registry
**Module ID:** `blockchain-carbon-registry` · **Route:** `/blockchain-carbon-registry` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tokenised carbon credit issuance, transfer, and retirement platform using smart contract verification for provenance and chain-of-custody. Supports ERC-1155 and Toucan/Base Carbon Tonne standards. Enables real-time registry balances, on-chain retirement certificates, and double-spend prevention across Verra, Gold Standard, and proprietary offsets.

> **Business value:** Blockchain tokenisation addresses the longstanding carbon market problem of double-counting by making credit ownership and retirement provably unique and publicly verifiable. On-chain retirement certificates reduce audit costs for corporate net-zero claims and provide the immutable chain-of-custody documentation required by emerging voluntary carbon market integrity standards.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRIES`, `Hash`, `Kpi`, `PIE_COLORS`, `PROJECT_NAMES_PREFIX`, `PROJECT_NAMES_SUFFIX`, `PROJECT_TYPES`, `ProgressBar`, `REGISTRIES`, `REGISTRY_STATS`, `Row`, `STATUSES`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Registry Explorer', 'Tokenization Analytics', 'Integrity & Double-Counting', 'Portfolio Carbon Credit Manager'];` |
| `PROJECT_TYPES` | `['REDD+', 'Renewable Energy', 'Cookstove', 'Afforestation', 'Methane Capture', 'Blue Carbon', 'Soil Carbon', 'Industrial Gas'];` |
| `reg` | `REGISTRIES[Math.floor(sr(i * 3) * 4)];` |
| `typ` | `PROJECT_TYPES[Math.floor(sr(i * 5) * 8)];` |
| `pfx` | `PROJECT_NAMES_PREFIX[Math.floor(sr(i * 7) * PROJECT_NAMES_PREFIX.length)];` |
| `sfx` | `PROJECT_NAMES_SUFFIX[Math.floor(sr(i * 11) * PROJECT_NAMES_SUFFIX.length)];` |
| `vintage` | `2018 + Math.floor(sr(i * 13) * 7);` |
| `volume` | `Math.round(sr(i * 17) * 95000 + 5000);` |
| `price` | `parseFloat((sr(i * 19) * 25 + 2).toFixed(2));` |
| `sIdx` | `sr(i * 23);` |
| `country` | `COUNTRIES[Math.floor(sr(i * 29) * COUNTRIES.length)];` |
| `qualityDist` | `PROJECT_TYPES.map((t, i) => ({` |
| `priceSpread` | `tokens.map(tk => ({` |
| `reg` | `REGISTRIES[Math.floor(sr(i * 3 + 600) * 4)];` |
| `typ` | `PROJECT_TYPES[Math.floor(sr(i * 5 + 600) * 8)];` |
| `pfx` | `PROJECT_NAMES_PREFIX[Math.floor(sr(i * 7 + 600) * PROJECT_NAMES_PREFIX.length)];` |
| `vintage` | `2019 + Math.floor(sr(i * 11 + 600) * 6);` |
| `volume` | `Math.round(sr(i * 13 + 600) * 18000 + 2000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `PIE_COLORS`, `PROJECT_NAMES_PREFIX`, `PROJECT_NAMES_SUFFIX`, `PROJECT_TYPES`, `REGISTRIES`, `STATUSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Credits On-Chain | `Minted – Retired – Transferred` | Blockchain ledger | Total live (unretired) carbon credits held in on-chain registry |
| Retirement Certificates | — | Smart contract events | Immutable on-chain retirement events with beneficiary, date, and credit metadata |
| Provenance Verification | — | On-chain metadata + Verra/GS API | Verification that token metadata matches underlying registry serial number and project data |
- **Verra/Gold Standard registry serial number feeds** → Mint ERC-1155 tokens with on-chain metadata linking to registry records → **Tokenised carbon credit portfolio with provenance-verified metadata**
- **Smart contract retirement events** → Capture burn transactions; generate SHA-256 retirement certificate hash → **Immutable retirement certificate with on-chain timestamp and beneficiary record**

## 5 · Intermediate Transformation Logic
**Methodology:** ERC-1155 tokenised credit accounting
**Headline formula:** `Credit_balance = Minted – Retired – Transferred; Retirement_hash = SHA256(credit_id || beneficiary || date || amount)`
**Standards:** ['Verra Registry Rules', 'Gold Standard Registry', 'Toucan Protocol BCT Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).