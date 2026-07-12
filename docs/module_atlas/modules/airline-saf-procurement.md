# Airline SAF Procurement Intelligence
**Module ID:** `airline-saf-procurement` · **Route:** `/airline-saf-procurement` · **Tier:** B (frontend-computed) · **EP code:** EP-EF5 · **Sprint:** EF

## 1 · Overview
SAF procurement analytics for 8 major airlines: Lufthansa, British Airways, Delta, United, Air France-KLM, Singapore Airlines, JAL, and Qantas. Covers 16 seeded deals, book-and-claim frameworks, PPA pricing engine with indexation types, credit risk scatter, and SAF market size forecast.

> **Business value:** Used by airline sustainability teams, SAF producers structuring offtake deals, and investors analysing SAF demand security and airline credit quality in procurement agreements.

**How an analyst works this module:**
- Review airline overview for 8 carriers SAF commitments and procurement profiles
- Examine deal flow for 16 SAF procurement deals with pricing and volume
- Use PPA pricing engine for indexation type and premium sensitivity
- Analyse credit risk scatter for airline rating vs SAF volume commitment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AIRLINES`, `DEALS`, `KpiCard`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `AIRLINES` | 9 | `region`, `fuel_mt`, `saf_pct`, `saf_mt`, `target2030`, `pathway`, `ltc`, `creditRating`, `compliance` |

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
| `ltcCount` | `useMemo(() => filtered.filter(a => a.ltc).length, [filtered]);  const ppaScenarios = useMemo(() => [2025, 2027, 2030, 2033, 2035].map(yr => { const multiplier = indexType === 'CPI' ? Math.pow(1.03, yr - 2024) : indexType === 'Jet-A linked' ? 1 + (yr - 2024) * 0.015 : 1;` |
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
| Book-and-claim efficiency | `Certificates traceable from producer to airline via registry` | IATA + RSB Book-and-Claim Whitepaper | Critical for airlines unable to fuel at SAF-producing airports; certificate = environmental attribute transfer. |
- **8-airline procurement profiles + 16 deals + PPA pricing model + credit risk scatter** → Airline SAF intelligence + PPA engine + market forecast + book-and-claim framework → **Airlines, SAF producers, and investors structuring long-term SAF offtake agreements**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF PPA Pricing Model
**Headline formula:** `SAF_price = Jet_fuel_spot + SAF_premium; Premium = LCOF − Jet_fuel_price + Carbon_credit_value`

SAF premium over conventional jet: $1.5–8/gal depending on pathway; large airlines targeting 10% by 2030 pay ~$200–600M/yr premium.

**Standards:** ['IATA SAF PPA Framework 2023', 'ReFuelEU Book-and-Claim Guidance', 'BNEF SAF Market Outlook 2024']
**Reference documents:** IATA (2023) – SAF PPA Framework and Book-and-Claim Guidance; BNEF (2024) – SAF Market Outlook; ReFuelEU (2023) – Book-and-Claim Technical Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry accurately describes the
> page's *content* (8 airlines, 16 deals, PPA pricing engine, book-and-claim, credit-risk scatter,
> market forecast) but its stated pricing methodology —
> `Premium = LCOF − Jet_fuel_price + Carbon_credit_value` — is **not implemented**. There is no
> levelised-cost-of-fuel model and no carbon-credit value anywhere in the code. The actual pricing
> engine is a simple indexation projection: `premium = basePrice × index_multiplier − JetA_forecast`.
> The sections below document the code as shipped.

### 7.1 What the module computes

Three datasets drive six tabs:

- **`AIRLINES` (8 rows, hand-curated)** — Lufthansa, BA, Delta, United, Air France-KLM, Singapore
  Airlines, JAL, Qantas, each with annual fuel burn (`fuel_mt`, 4.1–13.5 Mt), current SAF blend
  (`saf_pct`, 0.2–2.8 %), 2030 target (5–50 %; United's 50 % is the outlier), production pathway
  (HEFA / AtJ / FT / PtL combinations), LTC flag, credit rating (A → BB) and compliance regime
  (ReFuelEU / UK SAF / CORSIA / Japan GIF / Voluntary). These are plausible but demo-curated —
  not sourced from filings.
- **`DEALS` (16 rows, PRNG-generated)** — each deal draws an airline plus
  `volume = 0.05 + sr(i·11+2)·0.45` Mt/yr, `tenor = 5 + floor(sr(i·13+3)·15)` yrs (5–19),
  `price = 1.80 + sr(i·17+4)·3.20` $/L (1.80–5.00), indexation ∈ {CPI, Jet-A linked, Fixed,
  Hybrid}, status ∈ {Signed, Negotiating, LoI, Expired}, structure ∈ {LTC-Direct, Book-and-Claim,
  SAF Certificate, PPA Blended}, using `sr(s) = frac(sin(s+1)×10⁴)`.
- **PPA scenario engine** — the only interactive calculation (see §7.3).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| CPI indexation | `1.03^(yr − 2024)` | 3 %/yr inflation assumption, hardcoded |
| Jet-A-linked indexation | `1 + (yr − 2024)·0.015` | 1.5 %/yr linear escalation, hardcoded |
| Fixed / Hybrid indexation | multiplier = 1 | Code quirk: "Hybrid" falls through to the same flat multiplier as "Fixed" |
| Jet-A price forecast | `0.82 + (yr − 2024)·0.018` $/L | Synthetic baseline (~$0.82/L ≈ $3.10/gal 2024) escalating 1.8 ¢/L/yr |
| PPA base price slider | $1.50–6.00/L, default 2.50 | UI control; range brackets the guide's $1.5–8/gal HEFA→PtL premium spectrum (units differ: code is $/L) |
| Rating ordinal map | A = 1, BBB = 2, BBB- = 3, BB+ = 4, BB = 5, default 4 | For the scatter y-axis; IG/HY reference line at 3.5 (correctly between BBB- and BB+) |
| Book-and-claim market ramp | certificates `0.1 + (yr−2024)·0.8` Mt; direct `0.05 + (yr−2024)·0.4` Mt | Hardcoded linear ramps (certificates grow 2× faster than direct offtake) |
| Global market curves | supply `0.6 + (yr−2023)·3.5` Mt; demand `0.5 + (yr−2023)·6.2` Mt | Hardcoded linear; demand outgrows supply → widening deficit by design |
| Market intelligence facts | e.g. "Global SAF production 2024 ~0.6 Mt (IEA)", "EU 2030 demand ~4.8 Mt (ReFuelEU)", "CORSIA Phase II from 2027" | Static text rows citing real sources; not computed |

### 7.3 Calculation walkthrough

1. **Headline KPIs (react to region filter):**
   `totalSafDemand = Σ fuel_mt × target2030/100` (2030 SAF volume implied by targets);
   `avgPct = Σ saf_pct / n`; `ltcCount`; deal count; average deal price `Σ price / n`.
2. **PPA Pricing Engine (Tab 3)** — for years {2025, 2027, 2030, 2033, 2035}:
   ```js
   multiplier = CPI ? 1.03^(yr−2024) : JetA-linked ? 1 + (yr−2024)·0.015 : 1
   price   = basePrice × multiplier
   jetA    = 0.82 + (yr−2024)·0.018
   premium = price − jetA
   ```
   The chart plots SAF PPA, Jet-A and the premium wedge; the premium is colour-flagged red
   above $2/L.
3. **Offtake Structures (Tab 2)** — groups the 16 deals by structure, counting deals and summing
   volume per type.
4. **Credit Risk (Tab 5)** — scatters deal volume vs the rating ordinal with the 3.5 IG/HY
   boundary line; the panel lists each airline's rating with LTC status.
5. **Book-and-Claim (Tab 4)** — a 6-step descriptive chain-of-custody workflow (producer →
   certification (RSB/ISCC+/REDcert²) → book → claim → registry retirement → CORSIA/ReFuelEU
   reporting) plus the hardcoded certificate-vs-direct volume ramp.

### 7.4 Worked example (PPA engine: base $2.50/L, CPI index, year 2030)

| Step | Computation | Result |
|---|---|---|
| Multiplier | `1.03^(2030−2024)` = 1.03⁶ | 1.19405 |
| SAF PPA price | 2.50 × 1.19405 | **$2.99/L** |
| Jet-A forecast | 0.82 + 6 × 0.018 | **$0.93/L** |
| SAF premium | 2.98513 − 0.928 | **$2.06/L** (flagged red, > $2) |

Portfolio KPI check (all regions): `totalSafDemand = 9.2·0.10 + 5.8·0.10 + 13.5·0.10 + 12.1·0.50 +
8.9·0.10 + 7.5·0.05 + 6.2·0.10 + 4.1·0.10 = 11.2 Mt/yr` — dominated by United's 50 % target
(6.05 Mt of the total).

### 7.5 Data provenance & limitations

- Airline fuel burns, blend rates and ratings are **hand-seeded demo values**; the 16 deals are
  **PRNG-generated** (`sr()` pattern) — deal-airline pairing, volumes, tenors and prices are random,
  so a "Signed" 19-year deal can sit against an airline whose portfolio row says `ltc: false`.
- The pricing engine has no LCOF build-up, no pathway differentiation (HEFA vs PtL premia), no
  carbon-credit stacking (IRA §45Z / BTC, UK RTFC, EU ETS), and no volume-weighted portfolio cost.
- Jet-A is a fixed linear forecast, not spot-linked; "Hybrid" indexation is unimplemented.
- Book-and-claim volumes and the global supply/demand curves are straight lines, not scenario
  outputs; the market-intelligence facts are static citations.
- No backend or persistence; all state is client-side.

### 7.6 Framework alignment

- **ReFuelEU Aviation** — the real regulation mandates SAF blending at EU airports (2 % 2025 →
  6 % 2030 → 70 % 2050, with PtL sub-mandates); the module reflects it via airline `compliance`
  tags and the EU-demand fact row, not via mandate math.
- **CORSIA (ICAO)** — airlines offset growth above the 2019/2020 baseline; CORSIA-eligible fuels
  reduce offsetting obligations. Referenced in the book-and-claim workflow and compliance tags.
- **IATA SAF PPA framework / RSB & ISCC+ book-and-claim** — the 6-step chain-of-custody panel is
  a faithful prose rendering of the certificate model (environmental attribute separated from
  physical fuel, registry retirement prevents double counting).
- **Credit-rating conventions (S&P scale)** — the IG/HY boundary between BBB- and BB+ is correctly
  encoded at 3.5 on the ordinal axis.

## 9 · Future Evolution

### 9.1 Evolution A — Real LCOF-based SAF premium engine with credit stacking (analytics ladder: rung 1 → 3)

**What.** Per the §7 partial-mismatch flag (EP-EF5), the guide's pricing methodology
`Premium = LCOF − Jet_fuel_price + Carbon_credit_value` is **not implemented**: the actual engine is
a simple indexation projection (`premium = basePrice × index_multiplier − JetA_forecast`) with no
levelised-cost-of-fuel build-up, no pathway differentiation (HEFA vs FT vs PtL premia), and no
carbon-credit stacking; the 16 deals are PRNG-generated so a "Signed" deal can sit against an airline
whose row says `ltc: false` (§7.5). Evolution A builds a real premium engine: pathway-specific LCOF
(feedstock, capex, opex by HEFA/AtJ/FT/PtL), spot-linked Jet-A, and credit stacking (IRA §45Z / BTC,
UK RTFC, EU ETS avoided cost) — the $1.5–8/gal spectrum the guide references, computed rather than
sliders.

**How.** A `saf_pricing_engine` with `POST /api/v1/saf/premium` (pathway, feedstock, volume, credits
→ LCOF, premium, portfolio cost) and `GET /ref/pathways` (LCOF build-ups with citations); the PPA
scenario projection keeps its indexation types but escalates a real spot-linked Jet-A. Rung 3:
calibrate LCOF against BNEF SAF Market Outlook and ICAO CORSIA fuel figures the page already cites.

**Prerequisites (hard).** Purge the `sr()` deal generator (or clearly label the 16 deals as demo
fixtures) per the no-fabricated-random guardrail; fix the documented "Hybrid" indexation falling
through to flat (§7.2); resolve deal-airline consistency (LTC deals against non-LTC airlines).
**Acceptance:** the §7.4 PPA case still yields ~$2.06/L premium at legacy assumptions, but a PtL
pathway now shows a higher premium than HEFA; adding a §45Z credit lowers the net premium; portfolio
cost is volume-weighted across real deals.

### 9.2 Evolution B — SAF offtake structuring copilot (LLM tier 1 → 2)

**What.** A copilot for airline sustainability teams and SAF producers answering "what premium
should I expect for a 10-year FT offtake at this volume?", "how does book-and-claim change the
economics for an airline that can't fuel at a SAF airport?", and "what's my ReFuelEU 2030 SAF
demand?" — grounded in the airline profiles, the PPA engine and the book-and-claim chain-of-custody
workflow (a faithful RSB/ISCC+ rendering, §7.6). Since deals are synthetic today, the tier-1 copilot
must disclose that the 16 deals are demo fixtures and the pricing lacks LCOF build-up.

**How.** Tier-1 roadmap pattern: §7.2 parameter table (indexation formulas, Jet-A forecast, rating
ordinals) and §7.6 framework alignment (ReFuelEU, CORSIA, IATA SAF PPA) embedded as the module
corpus; page state (selected airline, PPA slider settings) as context; served via `POST /api/v1/
copilot/airline-saf-procurement/ask` with the standard refusal path. After Evolution A, graduates to
tier 2 by tool-calling `POST /saf/premium` so "price a Lufthansa PtL PPA with EU ETS credit stacking"
runs the real engine, with the no-fabrication validator checking every $/L and Mt figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** the §7.4 worked PPA reproduces from page state; a request for an LCOF-based,
pathway-differentiated premium before Evolution A returns a refusal naming the absent cost build-up;
`totalSafDemand = Σ fuel_mt × target2030/100` is reproduced correctly (11.2 Mt all-regions).