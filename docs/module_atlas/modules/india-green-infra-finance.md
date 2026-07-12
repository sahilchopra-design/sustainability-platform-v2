# India Green Infrastructure Finance
**Module ID:** `india-green-infra-finance` · **Route:** `/india-green-infra-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EA5 · **Sprint:** EA

## 1 · Overview
Analytics for India's green infrastructure finance landscape covering the National Infrastructure Pipeline (NIP) green component, HAM/BOT project finance structures, IIFCL green bonds, India RE100 PPAs, SEBI Green Bond Framework 2023, SECI/NTPC tender pipeline, and VGF (viability gap funding) mechanisms.

> **Business value:** Used by infrastructure PE funds, DFIs (DEG, IFC, ADB), sovereign wealth funds, and India-focused green bond issuers to underwrite, structure, and monitor green infrastructure investments in India.

**How an analyst works this module:**
- Select infrastructure sector (solar, wind, EV, water, rail)
- Input project parameters (EPC cost, PPA tariff, capacity factor)
- Review IRR with and without VGF and carbon revenue stacking
- Analyse SECI tender pipeline and green bond issuance capacity

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BLENDED_FINANCE`, `BRSR_METRICS`, `CBAM_EXPOSURE_MAP`, `INFRA_TYPES`, `INVIT_DEALS`, `Kpi`, `NABFID_OVERVIEW`, `REAL_GIF_NON_SOLAR_REC_INR`, `REAL_GIF_PAC_PRICE_INR`, `REAL_GIF_SOLAR_REC_INR`, `SectionTitle`, `Tab`, `YIELD_CURVE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INFRA_TYPES` | 9 | `icon`, `sector`, `nabfidLimitBnInr`, `cctsCreditElig`, `gcfElig`, `yieldTenYrPct`, `dscrMin`, `irrEquity`, `carbonCreditMech`, `greenBondSize`, `capexBnInr` |
| `INVIT_DEALS` | 7 | `sector`, `aum`, `yieldPct`, `navPremiumPct`, `distribFreq`, `greenCertified`, `carbonOffset`, `isinListed` |
| `BLENDED_FINANCE` | 7 | `provider`, `rateOrSize`, `structure`, `rrCond`, `suitability` |
| `YIELD_CURVE` | 8 | `greenInfra`, `gsec`, `spread` |
| `BRSR_METRICS` | 7 | `unit`, `benchmark`, `threshold`, `sebiMandatory` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_LATEST_GIF_REC` | `INDIA_REC_PRICES.length ? INDIA_REC_PRICES[INDIA_REC_PRICES.length - 1] : null;` |
| `_LATEST_GIF_PAC` | `INDIA_PAC_CYCLE_RESULTS.length ? INDIA_PAC_CYCLE_RESULTS[INDIA_PAC_CYCLE_RESULTS.length - 1] : null;` |
| `CBAM_EXPOSURE_MAP` | `Object.fromEntries((_CCTS_CBAM_EXPOSURE \|\| []).map(c => [c.product, c]));` |
| `calcDscr` | `({ annRevenue, annOpex, annDebtService }) => annDebtService > 0 ? ((annRevenue - annOpex) / annDebtService).toFixed(2) : 'N/A';` |
| `annDebtService` | `(capexBnInr * debtPct/100 * 0.085);` |
| `annCashflow` | `annRevenueBnInr - annOpexBnInr;` |
| `tariffUplift` | `1 + (priceUSDt / 500);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BLENDED_FINANCE`, `BRSR_METRICS`, `INFRA_TYPES`, `INVIT_DEALS`, `YIELD_CURVE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Project IRR (post-VGF) | `(PPA_revenue + VGF_grant + carbon_revenue - OPEX - DEBT_service) / equity_invested` | Project cash flow model | IRRs >12% are required for private equity participation; VGF is sized to bridge the gap to this threshold. |
| SECI Tender Pipeline (GW) | `Announced + under-construction + commissioned capacity by technology` | SECI tender announcements + MNRE data | Pipeline of 30–50GW annually; important for modelling sovereign green bond issuance size and RE sector credit risk. |
| Green Bond Yield Spread (bps) | `green_bond_yield − comparable_vanilla_bond_yield` | Bloomberg India bond data | India green bonds typically trade at 10-30bps greenium in international markets; SEBI framework aims to deepen domestic market. |
- **SECI/NTPC tender data + SEBI green bond registry + MNRE statistics** → Project finance modelling → VGF sizing → IRR calculation → bond structuring → **India green infrastructure investment analytics for DFIs, PE funds, and green bond issuers**

## 5 · Intermediate Transformation Logic
**Methodology:** India Green Infrastructure Project Finance Modelling
**Headline formula:** `project_IRR = (PPA_revenue + VGF_grant + carbon_revenue - OPEX) / EPC_cost`

HAM (Hybrid Annuity Model) structures split capital cost between government (40% annuity) and private developer (60% equity + debt); this reduces demand risk vs pure BOT toll models for greenfield infrastructure. RE100 corporate PPA prices are modelled using SECI discovered rates plus wheeling/banking charges. VGF quantum is estimated using the standard MEA formula: VGF = max viable project cost - bankable project cost at 12% project IRR threshold.

**Standards:** ['SEBI Green Bond Framework 2023', 'Ministry of Finance VGF Scheme Guidelines', 'IIFCL Green Bond Framework 2022']
**Reference documents:** SEBI Green Bond Framework 2023; Ministry of Finance VGF Scheme Guidelines 2022; IIFCL Green Bond Framework 2022; MNRE National Solar Mission Phase III Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `Apr2026CarbonAnalytics`, `IndiaAdvancedAnalytics`, `IndiaGreenHybridFinance`

## 7 · Methodology Deep Dive

An **India green-infrastructure project-finance** workbench: it profiles 8 infra types (RE
transmission, green roads, ports, metro, data centres, water…) with NaBFID limits, CCTS/GCF
eligibility and carbon-credit mechanisms, and runs a real DSCR + NPV calculator per project. Data
tables are hand-authored from Indian sources with live REC/PAC/CBAM price injection; the finance maths
is genuine. Code and guide (EP-EA5) agree — no mismatch flag.

### 7.1 What the module computes

**DSCR** and **NPV** — real closed-form project-finance:

```js
annDebtService = capexBnInr · debtPct/100 · 0.085              // 8.5% debt rate assumption
DSCR           = annDebtService>0 ? (annRevenue − annOpex)/annDebtService : 'N/A'
annCashflow    = annRevenue − annOpex
NPV            = Σ_{i=1..lifeYrs}  annCashflow/(1 + discRate/100)^i  − capex
```

**Carbon-adjusted tariff uplift** (CBAM linkage):

```js
tariffUplift = 1 + (priceUSDt / 500)                           // export tariff premium from CBAM/carbon price
```

### 7.2 Parameterisation (real India data)

| Table | Rows | Key fields | Provenance |
|---|---|---|---|
| `INFRA_TYPES` | 8 | NaBFID limit, CCTS/GCF eligibility, 10-yr yield, min DSCR, equity IRR, capex | Indian infra-finance data; carbon-credit mechanisms per VCS/CCTS |
| `NABFID_OVERVIEW` | 1 | est. 2021, ₹2 000 Bn mandate, AAA rating | NaBFID public data |
| `INVIT_DEALS` | 7 | AUM, yield, NAV premium, green-certified | Real InvITs (IndiGrid, IRB, Powergrid, Cube Highways…) |
| `BLENDED_FINANCE` | 7 | GCF, ADB TA, IFC anchor, AIIB, JICA, NaBFID | Real DFI instruments/terms |
| `YIELD_CURVE` | 8 | green-infra vs G-sec yield, spread | India bond-market data (greenium 20–50 bps) |
| `BRSR_METrics` | 7 | energy/water/GHG intensity, SEBI-mandatory flag | SEBI BRSR Core |
| REC/PAC prices | — | solar REC, non-solar REC, PAC clearing | `INDIA_REC_PRICES`/`INDIA_PAC_CYCLE_RESULTS` (IEX/BEE/GTRI, live; fallback ₹2500/₹2030/₹710) |
| Debt rate | 8.5% | — | Fixed assumption in `annDebtService` |

Live REC/PAC prices are injected into the RE-transmission row's carbon-credit fields; CBAM exposure is
keyed by product from `INDIA_CBAM_EXPOSURE`.

### 7.3 Calculation walkthrough

User selects an infra type and adjusts capex, revenue, opex, debt %, discount rate and asset life via
sliders. `annDebtService` = capex × gearing × 8.5%. `calcDscr` = (revenue − opex)/debt service.
`calcNpv` discounts the level annual cashflow (revenue − opex) over `lifeYrs` at `discRate` and nets
capex. Each infra type also carries a published min-DSCR covenant (1.20–1.40×) and equity IRR
(11.5–15%) for benchmarking against the computed DSCR.

### 7.4 Worked example (RE Transmission, default sliders)

Capex ₹1 000 Bn, revenue ₹120 Bn/yr, opex ₹40 Bn/yr, debt 70%, discount 9%, life 25 yr:

| Step | Computation | Result |
|---|---|---|
| annDebtService | 1 000 × 0.70 × 0.085 | **₹59.5 Bn/yr** |
| annCashflow | 120 − 40 | ₹80 Bn/yr |
| DSCR | 80 / 59.5 | **1.34×** (≥ 1.35 min — marginal) |
| NPV | 80·Σ(1.09⁻ⁱ, i=1..25) − 1 000 = 80·9.823 − 1000 | 785.8 − 1000 = **−₹214 Bn** |

The default inputs give a bankable DSCR (~1.34×) but a *negative* NPV at 9% — illustrating why VGF /
blended finance (GCF first-loss, JICA 0.1–0.5% ODA) is needed to lift project economics, exactly the
guide's thesis.

### 7.5 Data provenance & limitations

- **Data tables are real** (NaBFID, InvITs, DFI instruments, SEBI BRSR, IEX/BEE REC/PAC prices) with
  live price injection — a genuinely-grounded India module, **no PRNG in the finance path**.
- The **DSCR/NPV maths is correct**; the 8.5% debt rate is a fixed assumption, not a rate curve, and
  debt service is interest-only style (capex × gearing × rate), not an amortising annuity — so DSCR is
  slightly optimistic vs a fully-amortising loan.
- Cashflow is a flat level (revenue − opex) with no ramp, degradation or tariff escalation; VGF is
  discussed but not sized by the guide's `max viable − bankable at 12% IRR` formula in code.

**Framework alignment:** **SEBI Green Bond Framework 2023** and **BRSR Core** (disclosure metrics) ·
**NaBFID** infrastructure-lending mandate · **HAM/BOT** PPP structures (40% annuity / 60% private) ·
**VGF Scheme** (viability-gap grant) · **GCF/ADB/IFC/AIIB/JICA** blended finance. DSCR ≥1.25× is the
standard project-finance covenant. The module implements the DSCR/NPV core faithfully; VGF sizing and
an amortising debt schedule are the two extensions a production version would add.

## 9 · Future Evolution

### 9.1 Evolution A — Amortising debt, VGF sizing and cashflow realism (analytics ladder: rung 2 → 3)

**What.** A genuinely-grounded India module — real NaBFID/InvIT/DFI/BRSR tables, live REC/PAC price injection, no PRNG in the finance path — whose §7.5 limitations are precise: debt service is interest-only (`capex × gearing × 8.5%`), making DSCR optimistic versus an amortising loan; cashflow is flat (no ramp, degradation or tariff escalation); the guide's VGF formula (`VGF = max viable cost − bankable cost at 12% IRR`) is discussed but never computed; and 8.5% is a fixed rate, not a curve. Evolution A closes all four: level-annuity amortisation (`capex·gearing·i/(1−(1+i)^−tenor)`), a year-by-year cashflow with S-curve ramp and sector-specific escalation, VGF solved by bisection on the 12% equity-IRR threshold, and the debt rate read from the module's own `YIELD_CURVE` table (green-infra yield + tenor) instead of a constant.

**How.** (1) A small backend route `POST /india-infra/project-model` (this is currently frontend-only math) returning the DSCR profile, NPV, equity IRR, and computed VGF quantum with the binding constraint named. (2) The worked example's teaching point — DSCR 1.34× but NPV −₹214 Bn — becomes a bench_quant pin, and the VGF solver must reproduce "the grant that lifts this project to 12% IRR". (3) Each `INFRA_TYPES` row's published min-DSCR (1.20–1.40×) and equity-IRR benchmarks become pass/fail covenant checks in the response. (4) Carbon-revenue stacking uses the live REC/PAC/CCC prices already injected rather than a static uplift.

**Prerequisites.** None blocking — data and formulas are specified in this page's §5/§7.5; the work is implementation. **Acceptance:** interest-only vs amortising DSCR difference is visible and documented; the VGF output equals the bisection solution within tolerance; NPV with escalation ≠ flat-cashflow NPV for a stated reason.

### 9.2 Evolution B — DFI underwriting copilot for India green infra (LLM tier 2)

**What.** The module's buyers (DFIs, infra PE, green bond issuers) ask structuring questions this page's data can answer: "which blended-finance provider fits a water project needing first-loss cover?" (the 7-row `BLENDED_FINANCE` table maps provider → structure → suitability), "is a 1.28× DSCR bankable for green roads?" (covenant row per infra type), "what greenium does the India curve show at 10 years?" (`YIELD_CURVE`), "size the VGF for this metro project." Tier 2 executes the model what-ifs; the curated tables ground the qualitative matching.

**How.** Tool schema over the Evolution A `/project-model` route; VGF and breakeven questions run as solver tool calls with the iteration trail logged. The system prompt embeds the `INFRA_TYPES`, `BLENDED_FINANCE` and `NABFID_OVERVIEW` tables plus §7.4's worked example as calibration for tone — the copilot should surface the DSCR-positive/NPV-negative tension, since that gap is the module's core thesis about why blended finance exists. BRSR answers cite the SEBI-mandatory flags from `BRSR_METRICS`; CBAM tariff-uplift answers use the live `CBAM_EXPOSURE_MAP` entries.

**Prerequisites.** Evolution A's backend route; Phase 2 infrastructure. **Acceptance:** every ₹/％/× figure traces to a tool call or a named table row; provider recommendations quote the `rrCond`/`suitability` fields rather than inventing DFI terms.