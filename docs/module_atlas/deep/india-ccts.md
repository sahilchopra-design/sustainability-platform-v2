## 7 · Methodology Deep Dive

This is one of the platform's most **substantially-grounded** modules: a 14-tab India Carbon Credit
Trading Scheme (CCTS) workbench that imports a real methodology engine (`cctsEngine`) implementing the
9 BEE-approved offset methodologies and 18 tools, plus real reference data (CEA grid factors, PAT
benchmarks, NIFTY-50, India REC/PAC prices). The emission-reduction and financial-impact formulas are
genuine BEE-methodology arithmetic; only the offset-project pipeline sizing uses seeded PRNG. Code and
guide (EP-IN2) agree closely — no mismatch flag.

### 7.1 What the module computes

**Emission reduction / CCC issuance** (guide + engine):

```
ER_y  = Baseline_y − Project_y − Leakage_y        (per BEE methodology)
CCC   = floor(ER_y)                                (1 CCC = 1 tCO₂e, rounded down)
Value = CCC × Price_INR
```

**Sector surplus revenue** and **compliance cost** (on-page financial model):

```js
revInr             = surplus_mt · 1e6 · cccPrice
complianceCostInr  = totalEmissions · cccPrice
marginImpact       = pct(complianceCostInr/1e7, revCr)     // % of revenue (₹ crore)
```

**Technology-investment abatement + NPV** (Financial Impact Simulator):

```js
techReductionPct = min(0.4, techInvestment · 0.0004)       // capped 40% abatement
reducedEmissions = round(totalEmissions · (1 − techReductionPct))
surplusCCC       = max(0, round(totalEmissions·0.85 − reducedEmissions))
penaltyCost      = totalEmissions · cccPrice · 2            // 2× non-compliance penalty
npvSavings       = surplusRevenue · (1 − 1.1^−projectionYears)/0.1   // 10% discount annuity
```

**CBAM linkage** — domestic CCC payment offsets EU CBAM liability:

```js
cbamLiability   = emissions_tco2 · euCbamPrice
domesticPayment = emissions_tco2 · indiaCccPriceCbam
netCbamCost     = max(0, cbamLiability − domesticPayment)
savings         = cbamLiability − netCbamCost
```

### 7.2 Parameterisation (real reference data)

| Table / constant | Value | Provenance |
|---|---|---|
| `SECTORS` (20 rows) | entity counts, baseline/avoided emissions | BEE/MoP Gazette — 740 designated entities, 9 sectors |
| CEA grid EF | national grid emission factor | `CEA_NATIONAL_GRID_EF` (CEA CO₂ Baseline DB v19) |
| PAT benchmarks | sector emission-intensity targets | `PAT_SECTOR_BENCHMARKS` |
| REC / PAC prices | latest clearing prices | `INDIA_REC_PRICES`, `INDIA_PAC_CYCLE_RESULTS` (real seed; PAC fallback ₹710) |
| CCC price | ₹500–5 000 slider (₹600–1 200 base ≈ $7–15/tCO₂e) | S&P Global / industry |
| Non-compliance penalty | 2× CCC price | CCTS Rules 2023 |
| Tech abatement | `min(0.4, invest·0.0004)` | Synthetic scaling (₹ crore → % abatement) |
| Methodology engine | 9 methodologies × 18 tools | `cctsEngine` (BEE Offset Procedure 2025, ISO 14064/14065) |
| `FX` | ₹83.5/USD | Fixed |

Offset-project *pipeline* sizing uses PRNG (`sr(seed)`): forestry capacity `500 + sr·4500`, non-forestry
`5 000 + sr·50 000`, with annual-credit multipliers — the only synthetic quantities.

### 7.3 Calculation walkthrough

`TOTAL_ENTITIES`, `TOTAL_BASELINE_MT`, `TOTAL_AVOIDED_MT` sum the real `SECTORS` table. The Calculate &
Validate tab runs the imported engine: `validateInputs` → `METHODOLOGY_ENGINES[m]` computes
baseline/project/leakage → CCC issuance → `generateAssuranceReport` produces an ISO 14064/14065 audit
trail. `sectorRevenue` monetises each sector's avoided emissions at the CCC price slider. The Financial
Impact Simulator selects a NIFTY-50 company, computes compliance cost, margin impact, surplus-CCC
revenue from a tech investment, penalty cost and a 10%-discounted NPV of savings. CBAM tab runs the
dual-price offset.

### 7.4 Worked example (Financial Impact Simulator)

Company: `scope1+scope2 = 5 000 000 tCO₂e`, `revenue = ₹50 000 crore`, CCC price ₹900, tech investment
₹500 crore, 10-yr projection:

| Step | Computation | Result |
|---|---|---|
| complianceCost | 5e6 × 900 | ₹450 crore |
| marginImpact | pct(450e7/1e7, 50000) | (450/50 000)·100 = **0.9%** of revenue |
| techReductionPct | min(0.4, 500·0.0004) | 0.20 (20%) |
| reducedEmissions | 5e6·0.80 | 4 000 000 t |
| surplusCCC | max(0, 5e6·0.85 − 4e6) | max(0, 250 000) = **250 000 CCC** |
| surplusRevenue | 250 000 × 900 | ₹22.5 crore/yr |
| npvSavings | 22.5·(1−1.1⁻¹⁰)/0.1 | 22.5·6.145 = **₹138 crore** |
| penaltyCost (avoided) | 5e6·900·2 | ₹900 crore |

The tech investment (₹500 cr) yields ₹138 cr NPV of surplus-CCC revenue and, crucially, avoids the 2×
penalty exposure — the module's core abatement-vs-penalty decision.

### 7.5 Companion analytics & interconnections

- **11 approved methodologies / 18 tools** tabs with dependency matrix (real BM codes).
- **PAT-to-CCTS transition** (7 completed PAT cycles; 9 of 13 sectors transition).
- **International linkage** — India-Japan JCM (Article 6.2, signed 29 Aug 2025).
- `CONNECTED_MODULES` (11) route CCTS exposure to PCAF, Capital Adequacy, Transition Risk, RBI Climate.

### 7.6 Data provenance & limitations

- **Largely real**: reference data (CEA grid EF, PAT benchmarks, REC/PAC prices, NIFTY-50, CBAM
  exposure) and the methodology engine are imported modules, not fabricated. Regulatory citations
  (EC Amendment Act 2022, CCTS Rules 2023 S.O. 2825(E), BEE Procedure 2025) are accurate.
- **Synthetic elements**: the offset-project pipeline sizing (`sr()`) and the tech-abatement scaling
  (`invest·0.0004`, capped 40%) are heuristic, not engineering-costed abatement curves.
- Sector baseline/BAU/target figures are BEE estimates; forward CCC price is a user slider, not a
  market model.

**Framework alignment:** Energy Conservation (Amendment) Act 2022 · CCTS Rules 2023 · BEE Offset
Mechanism Procedure 2025 · ISO 14064-2 / 14065 (MRV, verification) · CEA CO₂ Baseline DB v19 · IPCC
2006 Guidelines (Tier-2 FOD for landfill). The engine implements the ER = Baseline − Project − Leakage
identity per methodology; CBAM linkage follows the EU CBAM Regulation's domestic-carbon-price credit.
The abatement-cost curve (tech investment → % reduction) is the one quantity that would benefit from a
real marginal-abatement-cost model rather than the linear scaling used.
