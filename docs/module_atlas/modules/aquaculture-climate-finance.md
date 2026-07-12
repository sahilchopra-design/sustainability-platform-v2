# Aquaculture Climate Finance Analytics
**Module ID:** `aquaculture-climate-finance` · **Route:** `/aquaculture-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ3 · **Sprint:** DZ

## 1 · Overview
Aquaculture climate finance analytics covering sustainable aquaculture investment, ASC/BAP certification premiums, climate risk to production from sea temperature and ocean acidification, blue bond eligible capex, and insurance products.

> **Business value:** Provides integrated aquaculture climate finance analytics combining physical risk-adjusted returns, certification premium modelling, and blue bond eligibility assessment to support investment decisions.

**How an analyst works this module:**
- Map aquaculture production sites against climate risk variables: SST projections, ocean acidification pH change, extreme storm frequency
- Calculate production risk discount by species and site using climate-impact dose-response functions
- Assess ASC/BAP certification status and premium uplift on revenue projections
- Classify capex as blue bond eligible and model financing structure combining blue bonds, insurance, and concessional finance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACID_SCENARIOS`, `CERTIFICATION_PREMIUM`, `FINANCE_INSTRUMENTS`, `Kpi`, `SECTORS`, `TABS`, `TEMP_STRESS_CURVE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 7 | `name`, `country`, `productionMt`, `climRiskScore`, `acidRisk`, `tempRisk`, `stormRisk`, `feedCost`, `certPremium`, `ascCert`, `mscCert`, `co2KgPerKg`, `financingGbn` |
| `ACID_SCENARIOS` | 8 | `ph`, `aragoniteSat`, `shellformationImpact` |
| `FINANCE_INSTRUMENTS` | 7 | `rate`, `trigger`, `size`, `tenor` |
| `CERTIFICATION_PREMIUM` | 7 | `premiumPct`, `marketAccess`, `yearsToAchieve`, `costKUsd` |
| `TEMP_STRESS_CURVE` | 9 | `salmonGrowthIdx`, `shrimpGrowthIdx`, `mortRisk` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annSaving` | `loanSize * (certPremium / 10000);` |
| `totalProduction` | `SECTORS.reduce((s, x) => s + x.productionMt, 0);` |
| `avgClimRisk` | `SECTORS.length > 0 ? SECTORS.reduce((s, x) => s + x.climRiskScore, 0) / SECTORS.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACID_SCENARIOS`, `CERTIFICATION_PREMIUM`, `FINANCE_INSTRUMENTS`, `SECTORS`, `TABS`, `TEMP_STRESS_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ASC Certification Premium | `Price premium for ASC-certified product vs standard at point of sale` | ASC market price survey 2023 | Premium varies by species and market; salmon 10-18%; shrimp 8-15%; critical for accessing EU and US premium retail |
| Sea Surface Temperature Risk | `Production volume reduction under RCP 4.5 SST projections for salmon farming sites` | IPCC SROCC regional projections | Norwegian salmon sites face reduced optimal temperature window; tropical shrimp farms face increased disease pressure |
| Blue Bond Eligible CapEx Share | `Capex on sustainable feed systems, recirculating aquaculture, habitat restoration / total capex` | Blue bond framework eligibility criteria | RAS (recirculating aquaculture systems) and offshore cage technology qualify; feed mill upgrade eligible if using non-FMFO feeds |
- **CMIP6 sea surface temperature projections (IPCC AR6)** → SST anomalies by site and RCP scenario → production risk model inputs → **Climate-adjusted production volume projections**
- **FAO and national aquaculture production statistics** → Historical production volumes by species, method, and country → baseline growth model → **Investment sizing and revenue projections**
- **ASC market data and price surveys** → Certification premium and market access data by species → revenue uplift from certification → **Climate-adjusted IRR calculation**

## 5 · Intermediate Transformation Logic
**Methodology:** Aquaculture Climate Risk-Adjusted Return
**Headline formula:** `Climate-Adjusted IRR = Base IRR - Physical Risk Discount + Certification Premium; Production Risk = f(SST Anomaly, pH Change, Extreme Event Frequency)`

IRR model adjusting for climate physical risks to aquaculture production combined with certification premium uplift and insurance product availability

**Standards:** ['Aquaculture Stewardship Council (ASC) Standard v3.0', 'FAO State of World Aquaculture 2022', 'Swiss Re Climate Risk in Aquaculture 2023']
**Reference documents:** ASC (2023) Aquaculture Stewardship Council Standard v3.0; FAO (2022) The State of World Fisheries and Aquaculture; IPCC SROCC (2019) Special Report on Ocean and Cryosphere — Chapter 5 Changing Ocean; Swiss Re (2023) Aquaculture Climate Risk Insurance Solutions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`frontend/src/features/aquaculture-climate-finance/pages/AquacultureClimateFinancePage.jsx` (EP-DZ4, Sprint DZ) is a 10-tab dashboard over **6 hard-coded aquaculture sectors** (Atlantic salmon, tropical shrimp, Pacific oyster, tilapia, seaweed, blue mussels). Only three quantities are actually *computed*; everything else is display of the seed tables.

```
totalProduction = Σ SECTORS.productionMt                              // 51.9 Mt
avgClimRisk     = Σ climRiskScore / SECTORS.length                    // guarded, len>0
carbonCost($M)  = productionT × 1000 × co2KgPerKg × carbonPrice / 1e6 // calcCarbonCost
annSaving       = loanSize × (certPremium / 10000)                   // calcAscLoanSaving (defined, unused in render)
riskColor(s)    = s≥75 red | s≥60 amber | else green
```

Note the guide claims a headline formula `Climate-Adjusted IRR = Base IRR − Physical Risk Discount + Certification Premium` and `Production Risk = f(SST anomaly, pH, extreme-event freq)`. **Neither is implemented** — there is no IRR calculation and no dose-response production function; the sectors carry static composite risk scores, and the only live calculator is the carbon-cost slider. The mismatch is minor (the guide over-claims analytical depth) so it is flagged here rather than in a blockquote.

### 7.2 Parameterisation — seed tables

**`SECTORS` (6 rows)** — each with productionMt, climRiskScore, acidRisk/tempRisk/stormRisk (all 0–100), feedCost (% OPEX), certPremium (%), ascCert/mscCert (%), co2KgPerKg, financingGbn:

| Sector | Prod (Mt) | Climate risk | Acid | Temp | Storm | CO₂/kg |
|---|---|---|---|---|---|---|
| Atlantic salmon | 2.8 | 72 | 68 | 74 | 55 | 3.2 |
| Tropical shrimp | 5.4 | 81 | 44 | 88 | 76 | 5.1 |
| Pacific oyster | 0.65 | 88 | 95 | 72 | 58 | 0.6 |
| Tilapia | 7.2 | 61 | 12 | 68 | 42 | 1.8 |
| Seaweed | 35.0 | 44 | 38 | 48 | 32 | **−1.2** |
| Blue mussels | 0.82 | 66 | 72 | 54 | 62 | 0.3 |

**`ACID_SCENARIOS`** — pH / aragonite saturation / shell-formation impact % from 2025 (pH 8.05, −5%) to 2100 (pH 7.65, −90%), labelled SSP5-8.5; a 7.8 "critical pH" reference line. **`TEMP_STRESS_CURVE`** — salmon vs shrimp growth index and mortality risk across 14–28 °C (salmon peaks 112 at 16 °C, collapses to 2 at 28 °C; mortality 2% → 72%). **`CERTIFICATION_PREMIUM`** — 6 schemes with price premium %, market access, years-to-achieve, cost $K (Organic EU highest at +32%, ASC +18%). **`FINANCE_INSTRUMENTS`** — 6 blue-finance products with rate/trigger/size/tenor. All are **synthetic demo values** consistent with the order of magnitude of published aquaculture research but without per-cell citations.

### 7.3 Calculation walkthrough

The carbon-cost calculator (tab 6) is the only interactive engine: three sliders (production tonnes 100–100,000; carbon price $20–300/tCO₂) plus a sector selector drive `carbonCost`. Total CO₂ displayed = `productionT × co2KgPerKg / 1000` tCO₂; carbon cost = that × price, expressed in $M. For carbon-negative seaweed (co2KgPerKg = −1.2) the sign flips to a green "+$" credit. The Deal Screener (tab 9) applies the eligibility rubric per sector: `climRisk < 65 ELIGIBLE | < 78 CONDITIONAL | else WATCH`, and colours ASC% green if > 30.

### 7.4 Worked example — carbon cost, shrimp

Production 5,000 t, shrimp (co2KgPerKg = 5.1), carbon price $100/tCO₂:

| Step | Computation | Result |
|---|---|---|
| Total CO₂ | 5,000 × 5.1 / 1000 | 25.5 tCO₂ (display) |
| Carbon cost | 5,000 × 1000 × 5.1 × 100 / 1e6 | **$2.55M** |

For seaweed at the same settings: 5,000 × 1000 × (−1.2) × 100 / 1e6 = −$0.60M, shown as **+$0.60M** credit. Deal-screener status for shrimp (climRisk 81 ≥ 78) → **WATCH**; salmon (72) → CONDITIONAL; tilapia (61 < 65) → ELIGIBLE.

(Note: the "Total CO₂" tile divides by 1000 to display "tCO₂" while the cost formula multiplies by 1000 for kg→per-tonne — internally consistent for the dollar figure; the small tile label understates absolute tonnage by treating tonnes-of-product × kg/kg as already in tonnes.)

### 7.5 Companion analytics

Climate-risk bar by sector, acidification pH + shell-impact dual-axis line, temperature stress curves, certification-premium bar + cards, finance-instrument cards, CO₂ intensity bar with a protein benchmark panel (beef 27.0 → seaweed −1.2 kgCO₂/kg), feed/input qualitative risk cards, a 4-row climate stress-scenario matrix (Orderly 1.5°C → Catastrophic 4°C+ with per-species and revenue impacts), and the deal screener.

### 7.6 Data provenance & limitations

- **No PRNG used in the live render.** The file defines `sr(seed) = frac(sin(seed+1)×10⁴)` at line 5 but it is **never called** — all data is hard-coded static tables, so figures are stable but synthetic. This is cleaner than the platform's random-seeded modules but the numbers are still illustrative, not sourced.
- All risk scores, premiums, pH/temperature curves, and the stress-scenario matrix are demo values; the guide attributes them to ASC v3.0, FAO SOFIA 2022, IPCC SROCC and Swiss Re, but the code carries no inline provenance linking specific cells to those sources.
- No live production-risk model: climate risk is a static composite, not derived from the SST/pH/storm sub-scores that sit beside it; the guide's dose-response function does not exist.
- Bug note: tabs 0 and 2 render `<ReferenceLine>` (and tab 6) but the import list at the top omits `ReferenceLine` from Recharts — this would throw at runtime unless provided elsewhere. Flagging as a code correctness concern.

### 7.7 Framework alignment

- **ASC (Aquaculture Stewardship Council) Standard / MSC / BAP / GlobalG.A.P.** — the certification-premium table encodes these real schemes; ASC/BAP are the certifications that gate EU/US premium retail access, and the module's premium %s (ASC +18%, BAP +10%) approximate published market surveys. ASC certification is assessed against farm-level environmental and social criteria (feed, effluent, disease, labour) by accredited third parties — the module treats it as a binary status with an associated price premium and financing trigger.
- **IPCC SROCC / SSP5-8.5** — the acidification pathway (pH 8.05→7.65 by 2100) and temperature stress framing follow IPCC high-emissions ocean projections; aragonite saturation < 1 is the biological threshold below which shell formation fails, reflected in the −90% shell-impact endpoint.
- **Blue bond / IFC-ADB blue finance principles** — the finance-instrument table maps to real blue-economy debt structures (ASC/MSC-linked green loans, catastrophe bonds with parametric storm/temperature triggers, concessional FAO/SIDS facilities), approximating the ICMA-aligned blue bond eligibility concept the guide references.
- **EUDR** — cited qualitatively in the feed/input risk panel (soy meal deforestation-nexus compliance), not computed.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the claimed climate-adjusted IRR with dose-response production risk (analytics ladder: rung 1 → 2)

**What.** The page is tier-B frontend-only: 6 hard-coded sectors, and the only live computations are `totalProduction`, `avgClimRisk`, and the carbon-cost slider. The guide's headline formula — `Climate-Adjusted IRR = Base IRR − Physical Risk Discount + Certification Premium` with `Production Risk = f(SST, pH, storms)` — is documented in §7.1 as **not implemented**. Evolution A builds it honestly, as this module's first backend engine, deriving production risk from the data the page already carries: `TEMP_STRESS_CURVE` (species growth/mortality vs temperature), `ACID_SCENARIOS` (pH → shell-formation impact), and the per-sector acid/temp/storm sub-scores.

**How.** (1) New route `api/v1/routes/aquaculture_finance.py` with `POST /production-risk` (site + species + scenario → volume discount via interpolation on the stress curve and pH pathway) and `POST /climate-irr` (cash-flow model applying the discount and the `CERTIFICATION_PREMIUM` uplift). (2) Replace static SST assumptions with per-site lookups from the platform's NASA-POWER/Open-Meteo integrations for observed baselines, with SSP deltas from the seeded scenario tables. (3) Scenario grid (rung 2): the 4-row stress matrix (Orderly 1.5°C → Catastrophic 4°C+) becomes computed output, not a static table.

**Prerequisites.** Fix the documented `ReferenceLine` missing-import bug before adding tabs; source citations per seed cell (the guide attributes values to ASC/FAO/SROCC/Swiss Re but no cell-level provenance exists). **Acceptance:** salmon IRR at a 16 °C-optimal site exceeds the same site shifted +6 °C on the stress curve; oyster risk responds to pH pathway choice; a species/temperature pair outside the curve returns an honest null, not an extrapolation.

### 9.2 Evolution B — Blue-finance deal-screening copilot (LLM tier 1)

**What.** A copilot on the page answering "why is tropical shrimp WATCH-listed?" (climRisk 81 ≥ 78 per the deal-screener rubric), "what does the carbon credit for seaweed mean?" (negative co2KgPerKg of −1.2 flips the cost sign), and "which certification maximises premium per year-to-achieve?" — strictly from this Atlas record and the page's seed tables, with the mandatory disclosure that all figures are synthetic demo values without cell-level citations.

**How.** Standard Tier-1 pattern: pgvector-embedded corpus from this module's Atlas sections (§7.2 seed tables, §7.3 rubric thresholds, §7.4 worked examples are the grounding); Haiku-tier serving with prompt-cached module context. The refusal path matters unusually much here: until Evolution A ships, the copilot must refuse IRR questions ("this module does not compute IRR — the guide's formula is not implemented") rather than parroting the over-claiming guide text; the system prompt therefore embeds §7.1's mismatch note verbatim. After Evolution A, the copilot upgrades to tier 2 by tool-calling `POST /climate-irr` for what-ifs.

**Prerequisites.** None beyond the platform copilot router (`module_copilot.py`) — the grounding corpus already exists in this Atlas record. **Acceptance:** asked for a climate-adjusted IRR pre-Evolution-A, the copilot refuses and cites the mismatch; every threshold it quotes (65/78 eligibility cut-offs, +18% ASC premium) matches the seed tables exactly.