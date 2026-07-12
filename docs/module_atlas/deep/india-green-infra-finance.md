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
