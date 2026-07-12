# Solar Developer Carbon Finance
**Module ID:** `solar-developer-carbon-finance` · **Route:** `/solar-developer-carbon-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA2 · **Sprint:** EA

## 1 · Overview
Carbon finance analytics for solar energy developers, covering CDM/VCS ACM0002 methodology application, avoided emission calculations (tCO2/MWh × grid emission factor), carbon revenue stacking on top of PPA income, India REC and carbon credit bundling, and CCTS (Carbon Credit Trading Scheme) eligibility assessment.

> **Business value:** Used by solar developers, project finance advisors, and carbon credit brokers to quantify and monetise carbon value in Indian solar projects and structure blended carbon + REC revenue streams.

**How an analyst works this module:**
- Input project specifications (capacity, location, grid zone)
- Calculate avoided emissions using CEA grid emission factor
- Model carbon revenue at current and projected VCM/CCTS prices
- Assess REC + carbon bundling options and CCTS registration pathway

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_METHODOLOGIES`, `GRID_EF_HISTORY`, `IPPS`, `Kpi`, `PROJECT_FINANCE_WATERFALL`, `REC_DATA`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `IPPS` | 7 | `name`, `parentCo`, `installedGw`, `targetGw2030`, `pipelineGw`, `statesFocus`, `plf`, `gridEf`, `cctsCreditsYr`, `recYr`, `jcmEligible`, `greenBondIssuedGbn`, `debtEquity`, `dscrAvg`, `irrEquity`, `ppa` |
| `GRID_EF_HISTORY` | 12 | `ef` |
| `CREDIT_METHODOLOGIES` | 6 | `registry`, `approach`, `baselineEf`, `discountPct`, `vintage`, `price`, `jcmCompat` |
| `REC_DATA` | 7 | `solar`, `nonsolar`, `price` |
| `PROJECT_FINANCE_WATERFALL` | 6 | `share`, `rate`, `tenor`, `security` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annGenMwh` | `gwInstalled * 1000 * plf * 8760;` |
| `grossCredits` | `annGenMwh * gridEf / 1000;` |
| `netCredits` | `grossCredits * (1 - discountPct / 100);` |
| `revenue` | `netCredits * creditPrice;` |
| `calc` | `calcCarbonCredits({ gwInstalled: gwInput, plf: plfInput / 100, gridEf: gridEfInput / 100, discountPct: discountInput, creditPrice: creditPriceInput });` |
| `totalInstalledGw` | `IPPS.reduce((s, i) => s + i.installedGw, 0);` |
| `totalPipelineGw` | `IPPS.reduce((s, i) => s + i.pipelineGw, 0);` |
| `totalGreenBonds` | `IPPS.reduce((s, i) => s + i.greenBondIssuedGbn, 0);` |
| `annCreditsKt` | `(i.installedGw * 1000 * i.plf * 8760 * 0.82 * 0.97 / 1e6).toFixed(0);` |
| `jcmRevenue` | `(Number(annCreditsKt) * 0.7 * 18).toFixed(1);` |
| `annRev` | `gwInput * 1000 * plfInput / 100 * 8760 * gridEfInput / 100 / 1000 * 0.97 * cp;` |
| `irrUplift` | `(annRev / 1e6 * 0.8).toFixed(1);` |
| `mwh` | `gwInput * 1000 * v.plf * 8760;` |
| `tco2` | `mwh * v.gridEf * (1 - v.discount);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_METHODOLOGIES`, `GRID_EF_HISTORY`, `IPPS`, `PROJECT_FINANCE_WATERFALL`, `REC_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avoided Emissions (tCO2e/yr) | `AEP_MWh × EF_grid_tCO2/MWh` | CEA Grid Emission Factors + project AEP | A 100MW solar plant at 25% CF and 0.82 tCO2/MWh avoids ~180,000 tCO2/yr; basis for CDM/VCS credit issuance. |
| Carbon Revenue Uplift (INR/unit) | `credit_price_INR / credits_per_MWh` | VCM price + REC market price | At $5/tCO2 VCM price and 0.82 credits/MWh, carbon revenue adds ~INR 0.35/kWh; material for merchant and lower-tariff projects. |
| CCTS Eligibility Score | `methodology_compliance × registry_recognition × vintage_eligibility` | MoEF CCTS Framework 2023 | Scores >70 indicate strong CCTS eligibility; India's CCTS may mandate grid-connected RE projects use domestic registry from 2025+. |
- **CEA grid emission factors + project AEP forecast + VCM/REC prices** → ACM0002 avoided emission formula → credit volume → revenue model → **Carbon finance revenue stack model for solar project IRR enhancement**

## 5 · Intermediate Transformation Logic
**Methodology:** ACM0002 Avoided Emission Calculation
**Headline formula:** `avoided_tCO2 = AEP × (EF_grid − EF_project) × capacity_factor × hours`

Annual Energy Production (AEP) is estimated from P50 generation forecast. Grid emission factor (EF_grid) uses the combined margin factor (50% operating margin + 50% build margin) per CDM methodology. For India solar, CEA publishes state-wise grid emission factors annually (avg ~0.82 tCO2/MWh in 2022). Carbon revenue is layered on top of PPA income, improving project IRR by typically 1-3 percentage points depending on carbon price assumptions.

**Standards:** ['CDM ACM0002 v19.0', 'Verra VCS VM0038 Methodology', 'BEE/CEA India Grid Emission Factor']
**Reference documents:** CDM ACM0002 Grid-Connected Renewable Electricity Generation v19.0; BEE/CEA CO2 Baseline Database for Indian Power Sector 2022; MoEF Carbon Credit Trading Scheme (CCTS) Framework 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This module has **no `sr()` PRNG usage** — `IPPS` (6 real, named Indian solar IPPs: NTPC Renewable Energy,
Adani Green Energy, ReNew Power, Greenko Energy, Azure Power, Torrent Power Solar) carries hand-curated,
plausible real-world-consistent figures (installed/pipeline GW, PLF, DSCR, equity IRR, green bond issuance,
debt/equity split, JCM eligibility). The core calculation is a genuine implementation of the **CDM/VCS
ACM0002 avoided-emissions methodology**:

```js
calcCarbonCredits({ gwInstalled, plf, gridEf, discountPct, creditPrice }) {
  annGenMwh   = gwInstalled × 1000 × plf × 8760
  grossCredits = annGenMwh × gridEf / 1000                    // gridEf in tCO2/MWh → credits in ktCO2
  netCredits   = grossCredits × (1 − discountPct/100)         // methodology-specific conservativeness discount
  revenue      = netCredits × creditPrice
}
calcDscr({ annRevenue, annOpex, annDebtService }) =
  annDebtService > 0 ? (annRevenue − annOpex) / annDebtService : 0
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| India grid emission factor (`gridEf`) | 0.82 tCO₂/MWh (2024), trajectory 0.94→0.62 tCO₂/MWh (2018→2030) | CEA (Central Electricity Authority) combined-margin grid EF — a real, cited Indian regulatory figure |
| ACM0002 discount | 3% | matches `CREDIT_METHODOLOGIES[0].discountPct` (CDM/VCS ACM0002 conservativeness factor) |
| Credit price | $15/tCO₂ default (user-adjustable) | plausible VCM price band, consistent with the guide's cited $5–20 range for India-linked credits |
| `CREDIT_METHODOLOGIES` (5 rows) | ACM0002, AMS-I.D., India CCTS Offset, VCS VM0048, JCM Solar Methodology, each with registry/baseline EF/discount/price/JCM-compatibility | plausible, methodology-name-accurate reference table |
| `PROJECT_FINANCE_WATERFALL` | Senior debt 55% (9.5–10.5%), green bond 15% (8.5–9.5%), sub debt 5%, mezzanine 5%, equity 20% (14–18% target) | typical Indian project-finance capital stack ordering, illustrative rates |

### 7.3 Calculation walkthrough

- **Carbon Credit Calculator tab** (interactive): user sets `gwInput`, `plfInput`, `gridEfInput`,
  `creditPriceInput`, `discountInput`; `calc = calcCarbonCredits(...)` runs the ACM0002 formula live.
- **IPP Dashboard**: for each named IPP, computes annual credits inline (**note: this uses a hardcoded
  `gridEf=0.82` and `discount=3%` regardless of the user's calculator inputs** — the dashboard and calculator
  tabs are not parametrically linked): `annCreditsKt = installedGw×1000×plf×8760×0.82/1000×0.97/1000`.
- **JCM Eligibility tab**: `jcmRevenue = annCreditsKt × 0.7 × 18` — assumes 70% of a JCM-eligible IPP's
  credits are monetisable via the Japan-India bilateral mechanism at a flat $18/credit; the 0.7 factor is not
  cited to a specific JCM allocation rule.
- **IRR Sensitivity tab**: `annRev = gwInput×1000×plfInput/100×8760×gridEfInput/100/1000×0.97×creditPrice`;
  `irrUplift = annRev/1e6×0.8` — an 80% pass-through assumption from carbon revenue to IRR uplift, a
  simplification (does not model tax, debt service coverage, or reinvestment).
- **DSCR**: `(revenue − opex)/debtService`, correctly guarded against division by zero.

### 7.4 Worked example (Adani Green Energy, default calculator inputs)

`gwInstalled=1.0`, `plf=22%`, `gridEf=0.82`, `discountPct=3%`, `creditPrice=$15`:

| Step | Computation | Result |
|---|---|---|
| Annual generation | 1.0×1000×0.22×8760 | 1,927,200 MWh |
| Gross credits | 1,927,200×0.82/1000 | 1,580.3 kt CO₂ |
| Net credits (after 3% discount) | 1,580.3×0.97 | 1,532.9 kt CO₂ |
| Revenue | 1,532.9×15 | **$22.99M** |

For the dashboard's Adani Green figure (`installedGw=10.9`, same 0.82/0.97 constants):
`10.9×1000×0.24×8760×0.82/1000×0.97/1000 ≈ 18.2 kt CO₂`/GW-normalised... — the displayed dashboard KPI uses
Adani's actual `plf=0.24`, giving annual credits ≈ **18,200 kt CO₂×10.9GW-equivalent** scaled per the
formula (displayed in the UI as a per-IPP Kt figure).

### 7.5 Data provenance & limitations

- **IPP figures are hand-curated, single-point-in-time estimates** reflecting real, named companies'
  approximate public disclosures (installed capacity, PLF, DSCR, IRR) — not live-sourced from company filings
  or a data vendor, and will drift from actual reported figures over time.
- The **ACM0002 avoided-emissions formula is genuinely and correctly implemented** for the single combined-
  margin grid EF case; the real CDM/VCS methodology technically requires a **weighted average of operating
  margin (dispatched generation mix) and build margin (marginal new capacity mix)**, recalculated periodically
  — the module uses a single published CEA combined-margin figure as a reasonable proxy, which is standard
  practice for Indian grid-connected RE but is a simplification worth flagging.
- **Dashboard/calculator inconsistency**: the IPP Dashboard tab hardcodes `gridEf=0.82`/`discount=3%`
  inline rather than reusing the interactive calculator's user-adjustable inputs — a user who changes the
  calculator's grid EF assumption will not see the dashboard figures update.
- The JCM 70%-pass-through and IRR 80%-pass-through assumptions are simplifications without a cited source.

### 7.6 Framework alignment

- **CDM ACM0002 v19.0 / Verra VM0038** — the `annGenMwh × gridEf` avoided-emissions core formula is the
  textbook-correct application of these methodologies' grid-connected renewable electricity approach.
- **BEE/CEA India Grid Emission Factor** — `gridEf=0.82` and the `GRID_EF_HISTORY` trajectory (0.94→0.62
  tCO₂/MWh, 2018→2030) are consistent with CEA's published annual combined-margin baseline database.
- **MoEF Carbon Credit Trading Scheme (CCTS) Framework 2023** — represented in `CREDIT_METHODOLOGIES` as a
  distinct registry pathway (BEE/MoEFCC, ₹200–600 price band, non-JCM-compatible) — a reasonable positioning
  of India's domestic scheme alongside international CDM/VCS/JCM options.

## 9 · Future Evolution

### 9.1 Evolution A — Carbon-stacked IRR with live CEA grid factors and scenario prices (analytics ladder: rung 1 → 2)

**What.** This module is genuinely sound: no `sr()` usage, 6 real named Indian solar IPPs with hand-curated figures, and a textbook-correct ACM0002 avoided-emissions implementation (`annGenMwh × gridEf`, methodology conservativeness discount, guarded DSCR). Its grid EF (0.82 tCO₂/MWh, 0.94→0.62 trajectory) and `CREDIT_METHODOLOGIES` are cited to CEA and the CCTS framework. What it lacks is the promised integration: the overview says carbon revenue "improves project IRR by 1–3 percentage points," but the module computes carbon revenue and DSCR separately without a unified project-finance model layering carbon on PPA income across the `PROJECT_FINANCE_WATERFALL`. Evolution A builds that stacked model and makes the grid factors live.

**How.** (1) A backend endpoint computing project IRR with and without carbon revenue over the full capital stack (senior debt/green bond/mezzanine/equity the page already tabulates), quantifying the carbon uplift the overview claims. (2) Scenario dimension over credit price (the $5–20 VCM band the guide cites) and CCTS vs VCS vs JCM pathway — each has a different price and discount in `CREDIT_METHODOLOGIES`. (3) A CEA grid-EF refresh: CEA publishes state-wise combined-margin factors annually — a small ingester keeps `GRID_EF_HISTORY` current with cited vintages rather than a static series. (4) REC + carbon bundling economics as a joint revenue optimisation rather than parallel displays.

**Prerequisites.** CEA data cadence (annual); the stacked model needs a debt-schedule assumption per tranche. **Acceptance:** the model reports carbon's IRR contribution in pp, matching the overview's claimed range for realistic inputs; switching methodology changes price/discount and revenue; grid EF carries its CEA vintage.

### 9.2 Evolution B — India solar carbon-structuring copilot (LLM tier 1)

**What.** A copilot for the developer/advisor/broker users: "how much carbon revenue can this 200MW Rajasthan project earn?", "CCTS or VCS for a project targeting EU buyers?", "what's the IRR uplift at $15/tCO₂?" — answered from the ACM0002 calculator and the cited methodology/grid-factor tables, never inventing avoided-emissions figures.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-developer-carbon-finance/ask`, corpus = this Atlas record (§7.1 ACM0002 formula, the CEA grid EF, `CREDIT_METHODOLOGIES`) plus live calculator state. What-if requests re-run `calcCarbonCredits`/`calcDscr` with the user's capacity/PLF/grid-EF/price and narrate the result; pathway-selection guidance cites the specific registry, price band, and JCM-compatibility from the methodology table. Refusal for non-India grids where the CEA factor doesn't apply.

**Prerequisites.** None hard — the calculator is already correct; Evolution A's stacked model lets the copilot answer IRR-uplift questions with computed pp rather than the overview's generic 1–3pp. **Acceptance:** every avoided-emissions and revenue figure traces to a calculator run; methodology recommendations cite the `CREDIT_METHODOLOGIES` row; a non-Indian project prompts a grid-factor caveat.