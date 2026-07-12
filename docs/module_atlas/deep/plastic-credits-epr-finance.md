## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives a computed formula for EPR liability
> (`EPR_Fee = PlasticTonnage × EPR_Rate × JurisdictionCount`, `CreditNeed = max(0, RCTarget −
> AchievedRC) × Volume`, `ComplianceScore = min(100, ...)`). **None of these formulas are evaluated
> in code.** `PRODUCERS[i].eprFee`, `.complianceScore`, `.creditsPurchased`, `.recycledContent` are
> all independent `sr()`-seeded constants, not derived from tonnage, targets, or achieved recycled
> content. The only genuinely computed quantity on the page is the credit-purchase calculator.

### 7.1 What the module computes

Two real (if simple) computations exist:

```js
creditCost = creditQty × selectedRegistry.price          // $/t × tonnes
co2eq = creditQty × 0.0028                                 // tCO2e equivalence factor
```
Everything else — 8 registries, 8 EPR schemes, 24 producer compliance rows, 36-month price
history, a 7-year market forecast, a 7-metric compliance radar — is **static, hand-authored
reference data**, not formula output. Producer-level fields (`plasticTonnage`, `eprFee`,
`recycledContent`, `creditsPurchased`, `complianceScore`) are independently `sr(seed)`-generated
per producer, uncorrelated with each other (e.g. a producer's `complianceScore` does not respond to
its own `recycledContent` or `eprFee`).

### 7.2 Parameterisation

| Table | Rows | Fields | Provenance |
|---|---|---|---|
| `REGISTRIES` | 8 | price, volume2024, methodology, grade | Named real registries (Verra PWRS, Plastic Bank, rePurpose, ClimateTrade, CleanHub, POP, ZPO, PCX) with plausible 2024 price/volume figures — hand-curated illustrative reference data, not a live feed |
| `EPR_SCHEMES` | 8 | plasticTax, targetRecovery, compliance, fee, penalty | Real jurisdiction names and scheme names (Germany VerpackG, UK EPR 2025, CA SB 54 etc.) with illustrative compliance/fee figures |
| `PRODUCERS` | 24 | plasticTonnage, eprFee, recycledContent, creditsPurchased, complianceScore | Real company names, `sr()`-seeded metrics with no formula linkage between fields |
| CO₂e factor | 0.0028 tCO₂e/tonne credit | Illustrative constant; not cited to a named LCA methodology |

### 7.3 Calculation walkthrough

1. **Tab 0 (Market Overview)**: `totalVolume = Σregistry.volume2024`; `avgPrice = Σprice/n`;
   `oceanBoundShare = Σ(volume where methodology includes 'ocean') / totalVolume × 100` — real
   aggregations over the static registry table.
2. **Tab 1 (Registry Comparison)**: credit-purchase calculator (§7.1) is the module's only
   interactive what-if tool.
3. **Tab 2 (EPR Schemes)**: `avgCompliance`/`avgFee` are simple means of the filtered
   `EPR_SCHEMES` rows by region — real aggregation, static inputs.
4. **Tab 3 (Producer Compliance)**: client-side sort by any of 5 fields; no derived scoring.

### 7.4 Worked example

`registry = 'Verra Plastic Waste Reduction'` ($42/t), `creditQty = 500`:
`creditCost = 500 × 42 = $21,000` → displayed as "$21K". `co2eq = 500 × 0.0028 = 1.4t` CO₂e
equivalence.

### 7.5 Data provenance & limitations

- **All 24 producer rows and all registry/scheme figures are illustrative demo data** — real
  company names (Nestlé, Unilever, P&G, Coca-Cola etc.) are attached to synthetic `sr()`-seeded
  metrics; the numbers should not be read as actual disclosed EPR fee or compliance data for these
  companies.
- The guide's EPR liability formula, if implemented, would need real per-jurisdiction rate tables
  and a producer's actual recycled-content trajectory — neither exists in the current data model.
- CO₂e-per-tonne-credit conversion factor (0.0028) lacks a cited LCA source.

## Framework alignment

**EU PPWR 2024** — the 30% recycled-content-by-2030 target is cited correctly and matches published
EU policy; not tied to any producer's actual trajectory in the compliance table. **UK Plastic
Packaging Tax** — the £223/t rate for <30% recycled content is the genuine 2024 UK rate. **Verra
PWRS / BBIA POP** — named correctly as real registry standards; the platform's registry price/volume
figures are illustrative approximations of, not pulled from, these registries' live data.
