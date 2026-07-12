# Plastic Credits & EPR Finance
**Module ID:** `plastic-credits-epr-finance` · **Route:** `/plastic-credits-epr-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EJ2 · **Sprint:** EJ

## 1 · Overview
Global plastic credit registry comparison (Verra PWRS/Plastic Bank/rePurpose/CleanHub/POP), 8 EPR schemes (EU PPWR/UK/France/Germany/USA/Canada/Japan/Korea), 24 producer compliance analytics, price history, market forecast, and investment intelligence.

> **Business value:** Used by brand owner compliance teams managing EPR obligations, plastic credit procurement officers, ESG analysts assessing plastic footprint, and regulatory affairs teams tracking global EPR developments.

**How an analyst works this module:**
- Compare 8 plastic credit registries by price, volume, methodology, and grade
- Use credit purchase calculator to model procurement cost for different registries and volumes
- Review EPR scheme details for 8 jurisdictions with compliance, fee, and penalty data
- Analyse producer compliance scores for 24 companies with EPR fee and recycled content metrics

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPLIANCE_RADAR`, `EPR_SCHEMES`, `KpiCard`, `MARKET_FORECAST`, `PRICE_HISTORY`, `PRODUCERS`, `Pill`, `REGISTRIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGISTRIES` | 9 | `code`, `price`, `volume2024`, `certified`, `stdBody`, `grade`, `methodology`, `growth` |
| `EPR_SCHEMES` | 9 | `region`, `scheme`, `plasticTax`, `targetRecovery`, `compliance`, `fee`, `penalty`, `mandatory` |
| `MARKET_FORECAST` | 8 | `market`, `credits`, `epr` |
| `COMPLIANCE_RADAR` | 7 | `EU`, `UK`, `US`, `APAC` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `creditCost` | `creditQty * selectedReg.price;` |
| `co2eq` | `(creditQty * 0.0028).toFixed(1);` |
| `avgCompliance` | `filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.compliance, 0) / filteredEPR.length : 0;` |
| `avgFee` | `filteredEPR.length ? filteredEPR.reduce((a, b) => a + b.fee, 0) / filteredEPR.length : 0;` |
| `sortedProducers` | `useMemo(() => [...PRODUCERS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);` |
| `sortedRegistries` | `useMemo(() => [...REGISTRIES].sort((a, b) => b.price - a.price), []);` |
| `totalVolume` | `REGISTRIES.reduce((a, b) => a + b.volume2024, 0);` |
| `avgPrice` | `REGISTRIES.reduce((a, b) => a + b.price, 0) / REGISTRIES.length;` |
| `oceanBoundShare` | `((REGISTRIES.filter(r => r.methodology.toLowerCase().includes('ocean')).reduce((a, b) => a + b.volume2024, 0)) / totalVolume * 100).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_RADAR`, `EPR_SCHEMES`, `MARKET_FORECAST`, `REGISTRIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Verra PWRS credit price | `Plastic waste collected and verified` | Verra Plastic Waste Reduction Standard 2024 | Food-grade rPET verification commands premium; ocean-bound methodology requires independent chain-of-custody audit every 12 months. |
| UK Plastic Packaging Tax rate | `On packaging with less than 30% recycled content (2024)` | UK Government PPT Guidance 2024 | PPT rate increases annually with RPI; creates strong incentive to exceed 30% RC threshold; food contact exemptions apply. |
| EU PPWR recycled content target | `For plastic packaging by 2030` | EU PPWR Regulation 2024 | Mandatory minimum 30% recycled content for all plastic packaging by 2030; 50% for contact-sensitive packaging by 2030. |
- **Verra PWRS + Plastic Bank + POP + CleanHub + EU PPWR + UK EPR + CA SB 54 + UNEA Resolution 5/14** → Registry comparison + credit calculator + EPR scheme table + producer compliance + price history → **Brand compliance teams, plastic credit procurement officers, ESG analysts, and regulatory affairs teams**

## 5 · Intermediate Transformation Logic
**Methodology:** EPR Producer Fee Liability
**Headline formula:** `EPR_Fee = PlasticTonnage × EPR_Rate × JurisdictionCount; CreditNeed = max(0, RCTarget − AchievedRC) × Volume; TotalCost = EPR_Fee + CreditPurchaseCost; ComplianceScore = min(100, (RC_pct / RC_target × 50 + CollectionRate / Collection_target × 50))`

Global EPR fee revenue projected to reach $18Bn by 2025; ocean-bound credit prices (CleanHub) grew 67% YoY 2024 as demand for premium methodology outstrips supply.

**Standards:** ['EU PPWR 2024', 'UK EPR Regulations 2023', 'Verra Plastic Waste Reduction Standard v1.0']
**Reference documents:** Verra (2024) – Plastic Waste Reduction Standard v1.0; EU Commission (2024) – Packaging and Packaging Waste Regulation; UK Government (2024) – Plastic Packaging Tax Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute EPR liability and compliance scores from real inputs (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide gives computed formulas (`EPR_Fee = PlasticTonnage × EPR_Rate × JurisdictionCount`, `CreditNeed = max(0, RCTarget − AchievedRC) × Volume`, `ComplianceScore = min(100, RC/RC_target×50 + Collection/Collection_target×50)`), but none are evaluated — the 24 producers' `eprFee`/`complianceScore`/`recycledContent`/`creditsPurchased` are independent `sr()` constants uncorrelated with each other. Only the credit-purchase calculator (`creditCost = qty × price`, `co2eq = qty × 0.0028`) is real. The registry and EPR-scheme reference tables are well-curated real data. Evolution A wires the documented formulas.

**How.** (1) Implement the EPR-fee formula from a producer's real plastic tonnage × the jurisdiction-specific rate (the `EPR_SCHEMES` table already has real fee rates for 8 jurisdictions — Germany VerpackG, UK EPR, CA SB 54) × jurisdiction count, so fees respond to tonnage. (2) Compute `ComplianceScore` as the documented function of achieved recycled content vs target and collection rate vs target — making a producer's score respond to its own `recycledContent` rather than being an independent draw. (3) `CreditNeed` from the recycled-content gap × volume. (4) Cite the 0.0028 tCO₂e/t credit factor to a named LCA methodology. Producer tonnage/recycled-content become analyst-entered or sourced inputs, not seeds.

**Prerequisites.** Producer-level tonnage and recycled-content data (analyst-entered or sourced); the EPR rate table is already real — connect it. Remove uncorrelated `sr()` producer fields. **Acceptance:** EPR fee reproduces from tonnage × rate × jurisdictions; compliance score responds to a producer's own recycled content; credit need derives from the RC gap.

### 9.2 Evolution B — EPR-compliance copilot for brand owners (LLM tier 1 → 2)

**What.** A copilot for the brand-owner/procurement users §1 targets: "what's my EPR liability across the EU, UK, and Germany at 50kt packaging?", "how many plastic credits do I need to hit a 30% recycled-content target?", "compare Verra PWRS and CleanHub credit prices", "which jurisdiction's penalties are highest?" — grounded in the real registry/EPR-scheme tables and the EU PPWR / UK EPR / Verra PWRS references named in §5.

**How.** Tier 1 works on the curated reference data immediately: system prompt from this Atlas page's registry and EPR-scheme tables (§7.2); the copilot compares registries and explains jurisdiction schemes with citations. Tier 2, post-Evolution-A: the liability and credit-need calculations become tool calls to the EPR-fee and compliance-score functions, with the fabrication validator matching every fee/credit figure to outputs. The copilot must flag that registry prices are curated illustrative figures, not live quotes, and that producer compliance scores (post-Evolution-A) reflect entered data.

**Prerequisites.** Tier 1 on curated data with as-of disclosure; liability computation needs Evolution A's real formulas. **Acceptance:** registry comparisons cite the reference table; EPR-fee/credit-need figures (post-Evolution-A) trace to tool calls; the copilot discloses that prices are illustrative.