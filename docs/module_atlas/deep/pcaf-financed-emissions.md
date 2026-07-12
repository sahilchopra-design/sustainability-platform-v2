## 7 · Methodology Deep Dive

> **Note on guide accuracy.** MODULE_GUIDES describes PCAF coverage for "5 asset classes: listed
> equity, corporate bonds, project finance, commercial real estate, mortgages." The code actually
> implements **attribution-factor formulas for 13 distinct instrument types** (`ASSET_CLASS_DEFS`),
> including Motor Vehicle Loans, Sovereign Debt, Use-of-Proceeds bonds, Sub-Sovereign, Undrawn
> Commitments, and Securitisations — the guide **understates** what the code does. This is a
> positive discrepancy (no ⚠️ warranted), but worth flagging so the guide can be updated.

### 7.1 What the module computes

A full PCAF Global GHG Standard attribution engine, with a distinct attribution-factor (AF) formula
per asset class, applied to real named-company positions with real reported emissions:

```
FE_i         = AF_i × (Scope1_i + Scope2_i)
AF (equity/bonds/loans)   = Outstanding / EVIC                    (Ch.4.2–4.4; sector-median EVIC proxy if EVIC null)
AF (project finance)      = Outstanding / TotalProjectCost         (Ch.4.5)
AF (commercial RE)        = Outstanding / PropertyValue             (Ch.4.6)
AF (mortgages/vehicle/securitisations) = 1.0                        (full attribution)
AF (sovereign debt)       = Outstanding / (CountryPPPGDP × 1000)    (Ch.4.9)
AF (use-of-proceeds)      = Outstanding / TotalBondSize              (Ch.4.10)
AF (sub-sovereign)        = 0.10 (fixed)
AF (undrawn commitments)  = CCF × min(1, Outstanding/EVIC)           (Ch.4.13)
```

Every AF formula caps at `min(1.0, ·)`, correctly preventing attribution >100% ownership.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| 40 named companies/positions | Apple, Shell, TotalEnergies, BHP, ExxonMobil, Toyota, BP, Equinor, etc. | **Real company names with real-scale EVIC, outstanding exposure, and Scope 1/2/3 figures**, sourced per-row from cited CDP/annual-report/sustainability-report references (e.g. "CDP A-List 2023", "Shell Annual Report 2023") |
| `dqs` (PCAF Data Quality Score) | 1–5 per position, with per-row source citation | Matches PCAF's 1 (audited)–5 (proxy) scale; e.g. Shell/TotalEnergies/BHP/Rio Tinto = DQS 1 ("Climate Report"), retail bonds using revenue proxy = DQS 4 |
| `evicWarning` | `NULL_EVIC — sector proxy used` when EVIC missing for equity/bond/loan positions | Forces `adjustedDqs = max(dqs, 4)` — a correct PCAF-consistent penalty: proxy-derived attribution can never claim better than DQ4 |
| `SECTOR_REV_EVIC` | Technology 8×, Software 10×, Energy 0.8×, Mining 1.2×, Financials 3×, etc. | Sector-specific Revenue/EVIC multiples used only as a WACI-denominator proxy when EVIC is present but revenue isn't separately reported — economically sensible ordering (capital-light Tech trades at high revenue multiples; capital-intensive Energy/Mining trade at low multiples) though the specific multiples are calibration assumptions, not cited to a named index |
| `SECTOR_MEDIAN_EVIC` | per-sector fallback EVIC ($B) | Used when a position has no EVIC at all (private/bond-only issuers) |
| Country PPP GDP table (`COUNTRY_PPP_GDP`) | per-country GDP for sovereign AF denominator | Real-scale country GDP figures used as PCAF Ch.4.9 prescribes |

### 7.3 Calculation walkthrough (`computeRow`)

1. `totalEmissions = scope1+scope2`; `totalWithScope3` adds Scope 3 for context/CSRD E1 needs.
2. `attrFactor = computeAttrFactor(p)` dispatches to the asset-class-specific formula above.
3. `financedEmissions = round(attrFactor × totalEmissions)`; `financedScope3` applies the same AF to
   Scope 3 — correct, since PCAF attribution applies uniformly across scopes for a given instrument.
4. `evicWarning`/`adjustedDqs`: when EVIC is null for an asset class that requires it, DQS is
   forced to at least 4, correctly documenting the data-quality penalty of the proxy substitution.
5. `revenueM = evic × sectorRevMultiple` (or sector-median-EVIC × multiple when EVIC absent);
   `waci = totalEmissions/revenueM` — the standard PCAF/TCFD WACI denominator (revenue), estimated
   via EVIC when revenue isn't directly available (a documented, if imperfect, proxy chain).
6. `carbonIntensity = financedEmissions / outstanding` — $-normalised intensity for portfolio
   screening.
7. **Portfolio rollups**: `byAC` (by asset class), `bySector` (top emitters), `top10`, `avgDqs`
   (exposure-agnostic simple mean), `carbonFootprint = totalFE/(totalOut/1000)` (SFDR PAI #2 style
   metric, tCO₂e per $M invested).
8. **Companion books**: `INSURANCE_LOB` (9 rows) computes underwriting financed emissions
   (`premiumM × efPerPremium`) — PCAF's insurance-associated-emissions extension; `FACILITATED_DEALS`
   (8 rows) computes capital-markets facilitated emissions with a deal-type-specific attribution
   (`underwrittenM/dealSizeM`, or a flat 10% for Advisory M&A) per the PCAF facilitated-emissions
   standard (Part C).

### 7.4 Worked example

**Shell plc**: `evic=£245B`, `outstanding=£31.2B`, `scope1=48.2Mt`, `scope2=20.2Mt`, `dqs=1`:

| Step | Computation | Result |
|---|---|---|
| Attribution factor | min(1, 31.2/245) | **12.73%** |
| Total emissions | 48,200,000 + 20,200,000 | 68,400,000 tCO₂e |
| Financed emissions | 0.1273 × 68,400,000 | **8,708,000 tCO₂e** |
| Revenue proxy | 245 × SECTOR_REV_EVIC['Oil & Gas'≈0.8] | £196B |
| WACI | 68,400,000 / 196,000 | **349 tCO₂e/$M revenue** |
| Carbon intensity | 8,708,000 / 31,200 | **279 tCO₂e/$M outstanding** |

### 7.5 Data provenance & limitations

- **This is one of the few modules in the batch using real, individually-cited company financials
  and emissions** rather than pure PRNG-generated data — a materially higher evidentiary bar than
  peer modules.
- Sector Revenue/EVIC multiples and country PPP GDP tables are still **calibration assumptions**,
  not live-pulled from a market-data vendor.
- `YOY_DATA` (7 years) is a static seed trend, not derived from re-running `computeRow` against
  historical positions — the year-over-year chart is illustrative, not backtested against the same
  attribution engine.
- Insurance and facilitated-emissions books use seed `efPerPremium`/`attrFormula` constants rather
  than PCAF's published emission-factor tables per line of business.

**Framework alignment:** PCAF Global GHG Accounting Standard v3 (2022) — implemented with unusual
fidelity across 13 asset classes including the less-common Sovereign Debt (Ch.4.9), Use-of-Proceeds
(Ch.4.10), and Undrawn Commitments (Ch.4.13) chapters; GHG Protocol Scope 3 Category 15 — the
financed-emissions concept is correctly the sum of AF×emissions across the book; SFDR PAI #2/#3 and
CSRD ESRS E1 — the `DOWNSTREAM_MODULES` table documents exactly which PCAF outputs feed which
downstream disclosure module, a genuinely useful lineage map (`carbonFootprint`→SFDR PAI#2,
`waciIntensity`→SFDR PAI#3, `esrsE1Emissions`→CSRD E1-6).
