## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes a **preferred-creditor concessional
> development-finance** tool — a Concessionality Index `CI = 1 − NPV(ProjectTerms)/NPV(MarketTerms)`
> benchmarking MDB/DFI loan terms (IBRD, ADB, AfDB, GCF) per OECD DAC guidance. **None of that logic
> exists in the code.** The page actually implements a **P&C (property & casualty) climate-peril
> insurance pricing engine** — loss ratios, expense ratios, catastrophe loading, technical rate,
> rate-on-line (ROL), and combined ratio across 10 perils × 7 regions. This is an insurance
> underwriting/actuarial-pricing tool, not a development-finance concessionality calculator. The
> sections below document the code as it actually behaves; §8 specifies the concessionality model
> the guide describes.

### 7.1 What the module computes

For each of 70 (peril × region) zones, the module builds a standard actuarial rate decomposition:

```
combinedRatio  = lossRatio + expenseRatio×100
technicalRate  = expLoss + catLoading + expenseRatio×0.5 + 0.02        // pure premium + loadings
ROL            = technicalRate / (lossRatio/100)                       // rate on line
profit         = avgPremium − avgLoss − avgExpense − avgCat            // underwriting margin
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `premiumRate` | 0.8%–6.8% | Synthetic demo value |
| `expenseRatio` | 20%–35% | Synthetic demo value; plausible P&C expense-ratio range |
| `lossRatio` | 40%–75% | Synthetic demo value; plausible P&C loss-ratio range |
| `catLoading` | 2%–10% | Synthetic demo value — the catastrophe risk load on technical premium |
| `expLoss` | 0.5%–4.0% | Synthetic demo value — expected loss component of technical rate |
| Scenario multipliers (`SCEN_MULTS`) | applied to `climateLoading` per climate scenario | Referenced in `catLoad`/`load` formulas; scenario-conditions the cat loading, a genuine climate-stress mechanic (structurally the same pattern used correctly elsewhere on the platform) |
| Perils (10) / Regions (7) | named (Hurricane/Typhoon, Flood, Wildfire, Earthquake, Hail, Drought, Extreme Heat, Freeze/Ice Storm, Subsidence, Tsunami) | Real peril taxonomy, standard for climate P&C pricing |

### 7.3 Calculation walkthrough

1. **Zone generation**: each peril-region pair draws premium rate, expense ratio, loss ratio, and
   cat loading independently via `sr(i*13+k)`, then derives `combinedRatio = lossRatio +
   expenseRatio×100` — the standard actuarial identity (a combined ratio >100% signals underwriting
   loss before investment income).
2. **Technical rate**: `expLoss + catLoading + expenseRatio×0.5 + 0.02` — pure loss cost, plus a
   catastrophe load, plus half the expense ratio (a simplified expense-loading convention) plus a
   flat 2% profit/risk margin — this is a coherent, if simplified, actuarial technical-pricing
   formula (loss cost + cat load + expenses + margin = technical premium).
3. **Rate on line**: `technicalRate / (lossRatio/100)` — ROL is conventionally `premium/limit` in
   reinsurance; here it's computed as technical rate over loss ratio, a demo-specific proxy rather
   than the standard reinsurance-market ROL definition.
4. **Scenario stress**: `catLoad = p.climateLoading × SCEN_MULTS[scenIdx] × inputExposure × 1000`
   scales catastrophe loading by the selected climate scenario multiplier — this is the module's
   genuine climate-risk mechanic, letting a user see technical rate and minimum-adequate-rate shift
   under different warming scenarios.
5. **Portfolio aggregation**: `avgAdequacy`, `avgCombined`, `avgROE`, `totalExposure` are computed
   over the filtered zone set with `Math.max(1, filtered.length)` divide-by-zero guards throughout.

### 7.4 Worked example

Flood peril, North America, `premiumRate=3.2%`, `expenseRatio=27%`, `lossRatio=58%`,
`catLoading=5.5%`, `expLoss=2.1%`, under a "+2°C" scenario with `SCEN_MULT=1.4`:

| Step | Computation | Result |
|---|---|---|
| Combined ratio | 58 + 27 | **85%** (profitable before investment income) |
| Stressed cat loading | 5.5% × 1.4 | 7.7% |
| Technical rate | 2.1% + 7.7% + 27%×0.5 + 2% | **25.3%** |
| Rate on line | 25.3% / 58% | **0.436** |

### 7.5 Data provenance & limitations

- **All zone pricing data is synthetic demo data**; no real reinsurance-market rate cards, no
  catastrophe-model output (RMS/AIR/Verisk), no historical loss-ratio triangle.
- **This module does not implement anything from its own guide** — no MDB/DFI loan terms, no NPV
  comparison against market benchmark rates, no grant-equivalent calculation, no concessionality
  index. A user following the guide's `userInteraction` steps ("map MDB and DFI loan terms…") would
  find no matching UI in this page.
- The ROL formula (`technicalRate/lossRatio`) is a demo convention, not the market-standard
  reinsurance ROL (`premium/limit`).

**Framework alignment:** the actuarial technical-rate structure (loss cost + cat load + expense +
margin) is a legitimate simplified P&C pricing model, unrelated to the guide's cited OECD DAC
Concessionality Measurement / Joint MDB Climate Finance framework, which this module does not
implement at all.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify the concessionality (subsidy element) of MDB/DFI climate-project financing relative to
market terms, supporting blended-finance structuring and reporting decisions (the decision the
guide's `userInteraction` list actually describes) across sovereign and sub-sovereign climate loans.

### 8.2 Conceptual approach
Standard **grant-element / concessionality-index** methodology per **OECD DAC Concessionality
Measurement Guidance (2018)** and the **Joint MDB Climate Finance Tracking Report** convention:
discount both the actual project cash flows and a hypothetical market-rate equivalent at a common
discount rate, and express the concessionality as the proportional NPV gap. This mirrors how the
**IMF/World Bank Debt Sustainability Framework** computes grant elements for concessional loans.

### 8.3 Mathematical specification

```
NPV(terms) = Σ_t CF_t(terms) / (1+d)^t                         // d = DAC discount rate (10% flat, or CIRR-based)
CI         = 1 − NPV(ProjectTerms) / NPV(MarketTerms)
GrantEquiv = FaceValue × CI                                     // $ subsidy value
```

| Parameter | Calibration source |
|---|---|
| DAC discount rate | OECD DAC flat 10% (grant-element convention) or differentiated CIRR by currency |
| Market benchmark rate | Sovereign USD bond yield + country risk premium (Bloomberg/JPM EMBI spread) |
| Tenor / grace period | MDB/DFI loan term sheet (IBRD, ADB, AfDB, IDB published terms) |
| Country income group adjustment | World Bank income classification, used to bound plausible market benchmark |

### 8.4 Data requirements
Per instrument: principal, tenor, grace period, coupon/spread, currency, borrower country. Public
sources: World Bank IBRD/IDA lending rates (published quarterly), OECD CRS aid-activity database,
JPM EMBI+ spread series (or World Bank's own market-reference proxy for non-rated sovereigns). None
of this is currently in the platform's reference-data layer for this module.

### 8.5 Validation & benchmarking plan
Reconcile computed CI against OECD DAC's own published grant-element figures for known IBRD/IDA
instruments; sensitivity-test the discount-rate choice (flat 10% vs CIRR) since CI is highly
sensitive to it at longer tenors.

### 8.6 Limitations & model risk
Market-rate benchmark selection is the dominant source of estimation uncertainty for
non-investment-grade borrowers with thin market comparables; DAC's flat 10% convention understates
concessionality for currencies with structurally low market rates (a country-specific CIRR is more
defensible for these).
