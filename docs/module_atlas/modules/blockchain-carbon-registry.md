# Blockchain Carbon Registry
**Module ID:** `blockchain-carbon-registry` · **Route:** `/blockchain-carbon-registry` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tokenised carbon credit issuance, transfer, and retirement platform using smart contract verification for provenance and chain-of-custody. Supports ERC-1155 and Toucan/Base Carbon Tonne standards. Enables real-time registry balances, on-chain retirement certificates, and double-spend prevention across Verra, Gold Standard, and proprietary offsets.

> **Business value:** Blockchain tokenisation addresses the longstanding carbon market problem of double-counting by making credit ownership and retirement provably unique and publicly verifiable. On-chain retirement certificates reduce audit costs for corporate net-zero claims and provide the immutable chain-of-custody documentation required by emerging voluntary carbon market integrity standards.

**How an analyst works this module:**
- Credit Issuance tab mints tokens from Verra/GS serial number batches
- Portfolio Wallet shows live credit balance by project type and vintage
- Transfer Registry tracks all on-chain credit transfers with counterparty
- Retirement tab initiates on-chain burn with beneficiary details and certificate generation
- Provenance Verification checks on-chain metadata against Verra/GS registry APIs
- Double-Spend Audit confirms no credit appears in two portfolios simultaneously

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
| `costBasis` | `parseFloat((sr(i * 17 + 600) * 15 + 3).toFixed(2));` |
| `currentPrice` | `parseFloat((costBasis * (1 + sr(i * 19 + 600) * 0.6 - 0.2)).toFixed(2));` |
| `addScore` | `Math.round(sr(i * 23 + 600) * 35 + 65);` |
| `permScore` | `Math.round(sr(i * 29 + 600) * 30 + 70);` |
| `cobenScore` | `Math.round(sr(i * 31 + 600) * 25 + 75);` |
| `qualScore` | `Math.round((addScore * 0.4 + permScore * 0.35 + cobenScore * 0.25));` |
| `REGISTRY_STATS` | `REGISTRIES.map((r, i) => ({` |
| `paged` | `filtered.slice(page * pageSize, (page + 1) * pageSize);` |
| `totalPages` | `Math.ceil(filtered.length / pageSize);` |
| `fmtN` | `(n) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);` |
| `csv` | `[headers.join(','), ...data.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `totalVolume` | `portfolio.reduce((a, h) => a + h.volume, 0);` |
| `totalValue` | `portfolio.reduce((a, h) => a + h.volume * h.currentPrice, 0);` |
| `totalCost` | `portfolio.reduce((a, h) => a + h.volume * h.costBasis, 0);` |
| `totalPL` | `totalValue - totalCost;` |
| `avgQuality` | `Math.round(portfolio.reduce((a, h) => a + h.quality, 0) / (portfolio.length \|\| 1));` |
| `exposure` | `typeHoldings.reduce((a, h) => a + h.volume * h.currentPrice, 0);` |

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

Each carbon credit is tokenised as an NFT/semi-fungible token with on-chain metadata linking to underlying Verra/GS serial numbers. Smart contract enforces retirement finality: retired tokens are burned and a cryptographic retirement certificate is emitted. Double-spend prevention is guaranteed by token uniqueness on-chain.

**Standards:** ['Verra Registry Rules', 'Gold Standard Registry', 'Toucan Protocol BCT Standard']
**Reference documents:** Verra Registry Rules and Program Guide; Gold Standard Registry Procedures; Toucan Protocol Base Carbon Tonne (BCT) Standard; ERC-1155 Multi-Token Standard (EIP-1155)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an on-chain ERC-1155
> tokenisation platform with SHA-256 retirement certificates, smart-contract burn
> finality and Verra/GS API provenance verification. **None of that exists in code** —
> there is no blockchain, no contract, no hashing, no external API. The page is a
> synthetic registry explorer: tokens, prices, quality scores and holdings are all
> generated by the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`. §7 documents the
> synthetic model; §8 specifies the integrity model the guide implies.

### 7.1 What the module computes

Four tabs (Registry Explorer, Tokenization Analytics, Integrity & Double-Counting,
Portfolio Manager) over a seeded credit universe. Each token:

```js
reg      = REGISTRIES[floor(sr(i×3)×4)]              // Verra/GS/ACR/CAR
typ      = PROJECT_TYPES[floor(sr(i×5)×8)]           // REDD+, cookstove, blue carbon…
vintage  = 2018 + floor(sr(i×13)×7)
volume   = round(sr(i×17)×95000 + 5000)              // tCO₂e
price    = sr(i×19)×25 + 2                            // $2–27
```

Quality is a weighted blend of three seeded sub-scores:

```js
addScore   = round(sr(i×23+600)×35 + 65)             // additionality 65–100
permScore  = round(sr(i×29+600)×30 + 70)             // permanence 70–100
cobenScore = round(sr(i×31+600)×25 + 75)             // co-benefit 75–100
qualScore  = round(addScore×0.40 + permScore×0.35 + cobenScore×0.25)
```

Portfolio P&L: `costBasis = sr()×15+3`, `currentPrice = costBasis×(1 + sr()×0.6 − 0.2)`,
`totalPL = Σ volume×currentPrice − Σ volume×costBasis`.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Quality weights | additionality 0.40, permanence 0.35, co-benefit 0.25 | Hard-coded (plausible VCM integrity weighting) |
| Additionality range | 65–100 | Synthetic `sr()` |
| Permanence range | 70–100 | Synthetic `sr()` |
| Co-benefit range | 75–100 | Synthetic `sr()` |
| Price range | $2–27/tCO₂e | Synthetic (broadly VCM nature-based band) |
| Volume | 5,000–100,000 tCO₂e | Synthetic |
| Registries | Verra, Gold Standard, ACR, CAR | Real registry names |
| Project types | REDD+, RE, cookstove, afforestation, methane, blue carbon, soil, industrial gas | Real VCM categories |

### 7.3 Calculation walkthrough

1. Generate N tokens with seeded registry/type/vintage/volume/price/scores.
2. `qualityDist` averages quality by project type; `priceSpread` maps price by token.
3. Portfolio tab: cost basis vs current price → unrealised P&L, average quality,
   exposure by type (`Σ volume×currentPrice`).
4. Integrity tab is presentational — the "double-counting" check displays flags but
   no cross-registry ledger reconciliation is computed.

### 7.4 Worked example

A token with `addScore=80`, `permScore=85`, `cobenScore=90`:

| Step | Computation | Result |
|---|---|---|
| Additionality contribution | 80 × 0.40 | 32.0 |
| Permanence contribution | 85 × 0.35 | 29.75 |
| Co-benefit contribution | 90 × 0.25 | 22.5 |
| Quality score | round(32.0+29.75+22.5) | **84** |

Portfolio holding: `volume = 50,000`, `costBasis = $10`, `currentPrice = $12`:
unrealised P&L `50,000×(12−10) = $100,000`.

### 7.5 Data provenance & limitations

- **Everything shown is synthetic** (`sr()` PRNG) — tokens, prices, scores and P&L.
  Only registry and project-type *names* are real.
- No blockchain, no cryptographic retirement, no double-spend prevention, no external
  registry verification — the "on-chain" framing is aspirational.
- Quality scores are drawn from favourable ranges (all ≥65), so the portfolio always
  looks high-integrity regardless of underlying reality.

**Framework alignment:** Verra VCS / Gold Standard registry rules (credit lifecycle:
minted − retired − transferred) · Toucan BCT / ERC-1155 (the tokenisation model the
guide references) · ICVCM Core Carbon Principles (additionality, permanence,
co-benefits map to CCPs — here as seeded sub-scores, not assessed). ICVCM actually
assesses CCPs at the *programme* and *methodology-category* level against 10
principles before a "CCP-Approved" label is granted; this page assigns numbers rather
than performing that assessment.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Maintain a verifiable carbon-credit registry with
provenance, double-counting prevention and an integrity-weighted quality score, and
value a retirement-aware portfolio — for corporate net-zero buyers and auditors.

**8.2 Conceptual approach.** Combine a **serial-number ledger reconciliation**
(against Verra/Gold Standard registry APIs) for double-counting control with an
**ICVCM-aligned quality model** and **BeZero/Sylvera-style ratings** for integrity,
plus optional on-chain tokenisation (ERC-1155) for immutable retirement records.

**8.3 Mathematical specification.**
```
Live_balance(serial) = minted − retired − transferred_out     (ledger identity)
DoubleCount_flag = 1 if serial appears in >1 owner ledger OR retired>issued
Quality = Σ_c w_c · CCP_c                                       (CCP sub-scores 0–100)
  CCP components: additionality, baseline conservativeness, permanence/durability,
  robust quantification, no double counting, co-benefits/SDG, governance
Risk_adjusted_tonnes = issued · (1 − buffer) · durability_discount
Portfolio_value = Σ_h volume_h · price_h · Quality_h/100        (quality-haircut)
Retirement_cert = H(serial ‖ beneficiary ‖ date ‖ amount)      (SHA-256)
```

| Parameter | Source |
|---|---|
| CCP weights | ICVCM CCP assessment framework |
| Ratings | BeZero / Sylvera / Calyx per project |
| Buffer / durability | Registry buffer pool + IPCC permanence |
| Registry serials | Verra/GS/ACR/CAR public APIs |

**8.4 Data requirements.** Registry serial numbers, issuance/retirement events,
project methodology & ratings, buffer contributions, beneficiary records. All are
external (registry APIs + rating vendors); none currently ingested.

**8.5 Validation & benchmarking.** Reconcile live balances against registry
public reports (zero tolerance); test double-count detection on known reissued
serials; benchmark quality scores against BeZero/Sylvera letter grades; verify
retirement-hash immutability.

**8.6 Limitations & model risk.** Registry APIs lag and differ in schema; ratings
disagree materially across vendors; durability of nature-based credits is scientifically
contested. Conservative fallback: apply the lowest available rating, the registry
buffer, and treat any un-reconciled serial as double-counted until proven otherwise.

## 9 · Future Evolution

### 9.1 Evolution A — A real credit ledger with verifiable retirement, backed by registry APIs (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is total: the guide promises on-chain ERC-1155 tokenisation, SHA-256 retirement certificates, smart-contract burn finality, and Verra/GS API provenance verification — **none exists**. The page is a synthetic registry explorer where tokens, prices, quality scores (weighted blend of seeded additionality/permanence/co-benefit sub-scores), and portfolio P&L are all `sr(seed)` draws. Evolution A builds the credit accounting and double-spend prevention the module claims, without requiring an actual blockchain — the ledger discipline, not the chain, is what delivers the value.

**How.** (1) A server-side `carbon_credit_ledger` table with append-only mint/transfer/retire events keyed by real registry serial numbers; `balance = minted − retired − transferred` becomes a real query, and double-spend prevention is a uniqueness constraint on serial+vintage — the guide's core promise delivered by a database, not a contract. (2) Retirement certificates: SHA-256 over `(credit_id, beneficiary, date, amount)` persisted and re-verifiable (the guide's exact formula, currently absent). (3) Provenance verification against the Verra/Gold Standard registry APIs (both publish credit-lookup endpoints) — replacing the seeded quality scores with actual registry metadata (project type, methodology, status). (4) Quality scoring, if retained, sourced from ICVCM CCP assessments or clearly labelled proprietary, not a seeded blend. Rung 2: retirement-scenario planning against a real holdings book.

**Prerequisites.** Verra/GS API access and rate-limit handling; a decision on whether "blockchain" branding survives (a permissioned ledger delivers the anti-double-count guarantee without a chain — the honest framing). **Acceptance:** the same serial number cannot be retired twice (constraint-enforced); a retirement certificate re-hashes to its stored value; provenance verification returns real registry status, not a seeded score.

### 9.2 Evolution B — Carbon-credit registry copilot (LLM tier 2)

**What.** With a real ledger, the copilot answers custody and integrity questions: "verify the provenance of these 10 credits against Verra", "how many live (unretired) credits do we hold by vintage?", "generate retirement certificates for 5,000 tCO₂e beneficiary X" — each a tool call against the Evolution-A ledger and registry-verification endpoints, with retirement certificates carrying their real SHA-256 hash.

**How.** Tool schemas over the ledger API (read: balances, transfers, provenance-check; write: retirement, gated behind explicit user confirmation + RBAC since burning credits is consequential and irreversible). Grounding corpus: this Atlas record plus the Verra/GS/Toucan standards notes in §7.6. The double-spend audit becomes a copilot-surfaced integrity check citing the uniqueness constraint's results. The refusal path is strict: the copilot reports registry status as the API returned it and never asserts a credit is "verified" without a successful provenance-check tool result — the entire module exists to prevent unverifiable claims.

**Prerequisites (hard).** Evolution A — a copilot narrating the current seeded token universe would fabricate custody records for credits that don't exist, and "verified provenance" claims with no verification would be the exact greenwashing the module is meant to stop. **Acceptance:** every balance and provenance verdict traces to a ledger/registry response; retirement is impossible without confirmed user action; certificates re-verify; unverifiable credits are reported as such, never asserted clean.