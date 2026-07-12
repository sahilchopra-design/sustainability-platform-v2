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
