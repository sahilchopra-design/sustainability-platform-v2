# CDR Credit Markets & Permanence Platform
**Module ID:** `cdr-credit-markets` · **Route:** `/cdr-credit-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EH5 · **Sprint:** EH

## 1 · Overview
High-durability carbon removal credit market intelligence: 7 credit types (DAC-Geological, BECCS, Biochar, EW-Basalt, OAE, Kelp), permanence tier framework (Tier 1–4), 20-buyer intelligence profiles, OTC price history 2024, and registry landscape (Puro.earth, VERRA, Gold Standard, EBC, UNDO, Eion).

> **Business value:** Used by corporate sustainability teams building CDR portfolios, carbon market traders pricing permanence risk, CDR developers selecting registries, and investors evaluating credit quality and price trajectory.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CREDIT_TYPES`, `KpiCard`, `PERMANENCE_SPECTRUM`, `PRICE_HISTORY`, `Pill`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCommitment` | `useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.commitment2030, 0) / 1000), []);` |
| `avgMaxPrice` | `useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.maxPrice, 0) / BUYERS.length), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_TYPES`, `PERMANENCE_SPECTRUM`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDR market CAGR 2024–2030 (%) | `From ~$1B to ~$50–100B market` | BNEF CDR Market Outlook 2024 | Driven by SBTi NET-Zero Standard requiring permanent CDR for residual emissions; corporate net-zero commitment |
| Puro.earth registry fee (%) | `Revenue share from credit issuance` | Puro.earth commercial terms | Highest fee CDR registry; vertical integration with MRV service; premium brand justifies fee vs VERRA 2–5%. |
| Stripe Frontier avg purchase price ($/tCO₂) | `Blended across portfolio 2024` | Stripe Frontier public reporting | Highest price buyer in market; pre-commercial focus; paying premium to fund scale-up and MRV development. |
- **ICVCM CCPs + Oxford Principles + Puro/VERRA/EBC registry data + Stripe Frontier disclosures** → 7 credit type intelligence + permanence tiers + 20 buyer profiles + OTC price history + registry landscape → **Carbon buyers structuring CDR portfolios, registries developing methodologies, and investors in CDR project developers**

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Credit Permanence-Adjusted Pricing
**Headline formula:** `Permanence_adjusted_price = Nominal_price × permanence_discount_factor; discount = 1 − (leakage_rate × years_discounted)`
**Standards:** ['ICVCM Core Carbon Principles', 'Oxford Principles for Net-Zero Aligned Carbon Offsetting', 'Puro.earth Permanence Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).