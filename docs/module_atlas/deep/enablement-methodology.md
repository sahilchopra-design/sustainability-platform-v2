## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises the PCAF facilitated/financed-emissions
> attribution engine — `EE = (Financing / EVIC) × Investee_GHG`, with PCAF data-quality scoring 1–5.
> **The code computes none of this.** No EVIC, no attribution-from-EVIC, no PCAF DQ score, no
> Scope 1+2+3 inventory is present. Instead each of 100 products carries a **pre-drawn random**
> `financedEmissions`, `enabledReduction` and `attributionFactor`, and the only headline computation
> is the ratio `enabledReduction / financedEmissions`. The regulatory-alignment table (PCAF Part C,
> GFANZ, ISSB S2…) is a static hand-authored list, not a live assessment. Documented below as written;
> §8 specifies the PCAF facilitated-emissions model the guide describes.

### 7.1 What the module computes

**Products (100)** — every economic quantity is an independent PRNG draw
(`sr(s)=frac(sin(s+1)×10⁴)`):

```js
volume            = 50   + s5×950        // $M issuance
enabledReduction  = 1000 + s6×49000      // tCO₂e avoided/enabled
financedEmissions = 500  + s7×25000      // tCO₂e financed
ratio             = enabledReduction / max(financedEmissions, 1)   // headline "enablement ratio"
additionality     = 20   + s8×80         // 0–100
attributionFactor = 0.3  + sr(i·47)×0.6  // 0.3–0.9  (drawn, NOT Financing/EVIC)
baselineEmissions = financedEmissions×1.4 + sr(i·43)×5000
```

**Projects (60)** — the additionality assessment is the one genuine composite:
```js
totalAdditionality = round( (financialAdditionality
                           + regulatoryAdditionality
                           + technologyAdditionality
                           + marketTransformation) / 4 )
```
Each sub-score is itself a random draw (15–100, 10–100, 5–100, 10–100). `withFI` vs `withoutFI`
(scenario emissions with/without the financing) drive the additionality "wedge" chart.

**Portfolio trend** — 12 static quarters with a rising `enabledAvoided`, falling `financedEmissions`
and an improving `ratio` (`0.35 + i·0.04 + noise`), i.e. a scripted improving trajectory.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `TYPES` (8) | Green Bond, SLL, Climate Fund, Project Finance, Green/Transition/Social/Blue | Instrument taxonomy |
| `CATEGORIES` (8) | Renewables, Efficiency, Clean Transport, Agri, Waste, Water, Circular, NbS | ICMA/CBI use-of-proceeds categories |
| `enabledReduction` 1k–50k tCO₂e | synthetic | random draw |
| `financedEmissions` 0.5k–25k tCO₂e | synthetic | random draw |
| `attributionFactor` 0.3–0.9 | synthetic | should be Financing/EVIC per PCAF — here random |
| `baselineEmissions` = FE×1.4 + noise | heuristic | fixed 1.4× multiplier |
| Additionality sub-weights | equal (¼ each) | design choice, not a published rubric |
| `REGULATIONS` (8 rows) | PCAF Part C, GFANZ, SEC S7-10-22, ESMA SFDR RTS, FCA SDR, ISSB S2, TCFD, EU Taxonomy | real standards, **static status labels** |

### 7.3 Calculation walkthrough

Product input → the "enablement ratio" `ratio = enabledReduction/financedEmissions` is the sort key
and the KPI headline. Portfolio net impact = `enabledAvoided − financedEmissions` at the latest
quarter. Additionality: four sub-scores averaged to `totalAdditionality`, rendered on a radar; a
project is flagged (`riskFlags`) when `sr()>0.7` ("Low additionality evidence") or `>0.5`
("Regulatory baseline unclear"). PCAF-category rollups sum `enabledReduction` and `financedEmissions`
per use-of-proceeds category.

### 7.4 Worked example

Product **i = 5**. Seeds: `s6=sr(95)`, `s7=sr(115)`. Evaluate `sr(95)=frac(sin(96)×10⁴)`: sin(96 rad)
≈ 0.9835, ×10⁴ = 9834.7, frac ≈ 0.47 → `enabledReduction = 1000 + 0.47×49000 ≈ 24,030 tCO₂e`.
`sr(115)=frac(sin(116)×10⁴)`: sin(116) ≈ 0.9494 → 0.94 → `financedEmissions = 500 + 0.94×25000 ≈
24,000 tCO₂e`. Then:
```
ratio = 24030 / 24000 ≈ 1.00
```
A ratio ≈ 1 means the product's enabled/avoided emissions roughly offset its financed emissions —
but because the two figures are independent random draws, this "net-neutral" reading is coincidental,
not a modelled relationship. (Exact digits depend on JS float; the mechanism is the point.)

### 7.5 Companion analytics

- **Portfolio Enablement:** top-8 enablers vs top-8 emitters, per-category PCAF rollup, sector stack
  over 12 quarters.
- **Additionality Assessment:** 4-axis radar + with-FI/without-FI wedge; risk-flag list.
- **Reporting & Disclosure:** static regulatory-alignment table and a 10-section report scaffold
  (Exec Summary … Appendices) — a document template, not generated content.

### 7.6 Data provenance & limitations

- **All product and project data is synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- `attributionFactor` is a random draw, **not** the PCAF `Financing/EVIC` ratio it is labelled as;
  `financedEmissions` is not computed from any attribution × inventory product.
- The regulatory-alignment "Aligned/Partial/Monitoring" statuses are hard-coded editorial labels, not
  a live compliance check.
- No double-counting logic actually runs despite a "Double-Counting Prevention" report section.

**Framework alignment:** **PCAF Standard (2022), Part A (financed) & Part C (facilitated) emissions**
— PCAF attributes an investee's GHG inventory to the financier by `attribution = Outstanding /
EVIC` (Part A) or a facilitation share for capital-markets deals (Part C), then multiplies by the
investee's Scope 1+2(+3) emissions and assigns a **data-quality score 1–5** (1 = audited actuals, 5 =
sector-average proxy). **GHG Protocol Scope 3 Cat.15** — investments category, the accounting home of
financed emissions. **GFANZ Portfolio Alignment** and **IFRS S2** — named for disclosure context. The
module references these but implements only the enabled/financed ratio arithmetic.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute PCAF-compliant financed and facilitated emissions for a portfolio of debt and capital-markets
instruments, with attribution factors, avoided/enabled emissions, and a data-quality distribution
suitable for CSRD/TCFD/CDP disclosure. Coverage: listed equity, corporate bonds, business loans,
project finance, and underwriting/facilitation deals.

### 8.2 Conceptual approach
Standardised bottom-up attribution per the **PCAF Global GHG Accounting Standard (2022)**, the market
reference for financed-emissions accounting, cross-checked against **CDP/Trucost** inventory data and
**SBTi FI** target-setting conventions. Facilitated emissions follow **PCAF Part C** (a
weighting-factor approach for the capital-markets role vs on-balance-sheet lending).

### 8.3 Mathematical specification
Financed emissions per position i:
```
AF_i (attribution) =  Outstanding_i / EVIC_i           (listed equity / bonds, Part A)
                   =  Outstanding_i / (Debt_i+Equity_i) (business loans / unlisted)
FE_i  = AF_i × (Scope1_i + Scope2_i + Scope3_i·χ)       χ = Scope-3 inclusion flag
Facilitated_j = w × (DealShare_j / EVIC_j) × GHG_j       w = 0.33 (PCAF Part C weight)
AvoidedEmissions_k = (BaselineEF_k − ProjectEF_k) × Activity_k     (Part B, reported separately)
DQ_i ∈ {1..5};  DQ_portfolio = Σ (FE_i·DQ_i) / Σ FE_i
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Enterprise value incl. cash | `EVIC` | Bloomberg/Refinitiv fundamentals |
| Investee GHG inventory | `Scope1,2,3` | CDP, Trucost, company reports |
| Sector proxy EF (DQ 4–5) | — | PCAF emission-factor database, EXIOBASE |
| Facilitation weight | `w=0.33` | PCAF Part C (2023) |
| Grid displacement EF (avoided) | `BaselineEF` | IEA/IFI grid factors, CDM AMS methodologies |
| DQ score | `DQ 1–5` | PCAF data-quality table |

### 8.4 Data requirements
Per position: outstanding balance, EVIC or (debt+equity), investee Scope 1/2/3 (t CO₂e), sector code
for proxy fallback, and for projects: baseline vs project emission factor and activity level. Vendor:
Bloomberg/Refinitiv (EVIC), CDP/Trucost (inventories). Free: EXIOBASE sector intensities, IEA grid
factors, company sustainability reports. Platform already holds financed-emissions logic in
`pcaf-financed-emissions` and reference emission factors (`referenceData.EMISSION_FACTORS`).

### 8.5 Validation & benchmarking plan
Reconcile portfolio FE against an independent PCAF calculation (e.g. the platform's
`pcaf-financed-emissions` engine) for the same holdings; check the DQ-weighted average against PCAF's
recommended ≤3.0 disclosure quality target. Sensitivity: swap actual inventories for sector proxies
and confirm FE shifts monotonically with DQ. Avoided-emissions additionality tested against CDM/GCC
baseline rules.

### 8.6 Limitations & model risk
EVIC volatility (denominator) causes attribution instability quarter-to-quarter — PCAF recommends
period-end EVIC with disclosure of the effect. Avoided emissions must NOT net against financed
emissions in headline reporting (double-counting risk). Conservative fallback: missing inventories
default to the sector-average proxy at DQ 5 (never zero), so coverage gaps inflate rather than hide
the footprint.
