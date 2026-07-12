# Green Ammonia Policy & Carbon Credits
**Module ID:** `green-ammonia-policy-credits` · **Route:** `/green-ammonia-policy-credits` · **Tier:** B (frontend-computed) · **EP code:** EP-EE5 · **Sprint:** EE

## 1 · Overview
Green ammonia policy instruments, subsidy programs, and carbon credit stacking. Covers IRA §45V H2 tax credit tiers, EU H2Global differential-cost contracts, EU CBAM fertilizer impact, Japan Green Innovation Fund, and carbon credit monetization strategies.

> **Business value:** Used by green ammonia developers, policy advisors, DFIs, and investors to evaluate and stack IRA, H2Global, CBAM, and national subsidy programs for optimal project economics.

**How an analyst works this module:**
- Use IRA §45V calculator for credit value by production pathway
- Examine H2Global tab for DCC mechanism and auction results
- Analyse CBAM impact for competitive advantage of green vs grey NH3
- Review carbon credit stacking: §45V + voluntary credits + CBAM avoidance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `POLICIES`, `TABS`, `TYPE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `POLICIES` | 16 | `region`, `type`, `valueUsdPerT`, `eligibilityCriteria`, `durationYrs`, `maxVolumeGt`, `stackableWithOthers`, `note` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `filtered` | `useMemo(() => typeFilter === 'All' ? POLICIES : POLICIES.filter(p => p.type === typeFilter), [typeFilter]);  const maxValue = useMemo(() => filtered.length ? Math.max(...filtered.map(p => p.valueUsdPerT)) : 0, [filtered]);` |
| `avgValue` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.valueUsdPerT, 0) / filtered.length : 0, [filtered]);` |
| `cbamData` | `useMemo(() => [30, 40, 50, 60, 70, 80, 90, 100, 120].map((ets, i) => ({ ets, cbamFertiliser: Math.round(ets * 1.8 * 0.82), // ~1.8 tCO2/t grey NH3 cbamUrea: Math.round(ets * 2.1 * 0.82), advantage: Math.round(ets * 1.8 * 0.82 * 0.9), })), []);` |
| `carbonRevenueData` | `useMemo(() => [200, 300, 400, 500, 600, 700, 800, 1000].map((lcoa, i) => ({ lcoa, creditRevenue45V: Math.round(iraH2Tier === 4 ? 545 : iraH2Tier === 3 ? 182 : iraH2Tier === 2 ? 136 : 109), netCost: Math.max(0, lcoa - (iraH2Tier === 4 ? 545 : iraH2Tier === 3 ? 182 : 136)), greyNH3: 275, })), [iraH2Tier]);` |
| `cbamVal` | `Math.round(etsPriceEur * 1.8 * 0.82);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `POLICIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRA §45V Tier 1 Credit ($/kg H2) | `Lifecycle GHG <0.45 kgCO2e/kgH2` | IRS Notice 2023-29 | 3-pillar additionality for grid electrolysers: new renewables, hourly matching, deliverability; direct pay 5 years. |
| H2Global Strike Price (€/t H2 equiv) | `DCC auction clearing price` | H2Global GmbH Auction Results 2023-24 | €900M Phase 1; Australia, Chile, Namibia, UAE awarded; 10-year contracts. |
| EU CBAM Fertilizer Impact (€/t NH3) | `Grey NH3 carbon × ETS price` | EU CBAM Regulation (EU) 2023/956 | Grey NH3 ~2.1 tCO2/t; at EU ETS €60/t → CBAM €126/t; green NH3 CBAM = 0; from 2026. |
- **IRS §45V guidance + H2Global auction data + EU CBAM ETS prices + METI GIF data** → IRA credit tier calculator + H2Global DCC model + CBAM impact calculator → **Policy optimization: jurisdiction selection, subsidy stacking, carbon credit monetization**

## 5 · Intermediate Transformation Logic
**Methodology:** IRA §45V Tier Model & H2Global Contract
**Headline formula:** `§45V_credit = f(lifecycle_GHG_tier) in $/kg H2; H2Global_DCC = (LCOA_green - market_price) × volume`

IRA §45V: Tier 1 $3.00/kg H2 (<0.45 kgCO2e/kgH2 = ~$18/t NH3); Tier 2 $1.00; Tier 3 $0.75; Tier 4 $0.60. H2Global: government pays (LCOA_green - market) per tonne 10-year contracts. CBAM fertilizer 2026: grey NH3 ~€50-126/t carbon cost.

**Standards:** ['IRS §45V Guidance (2023)', 'EU H2Global Fund Mechanism', 'EU CBAM Regulation (2023)']
**Reference documents:** IRS §45V Clean Hydrogen Production Tax Credit Proposed Rule (2023); H2Global GmbH Auction Mechanism Documentation; EU CBAM Regulation (EU) 2023/956

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

16 real-named policy instruments (IRA §45V, EU H2Global, EU CBAM, UK CfD, Japan GIF, Korea CCF,
Australia Headstart, India NGHM, etc.) are catalogued with a per-tonne-NH₃ value
(`valueUsdPerT`), stackability flag, and duration. Three interactive calculators layer on top: an
IRA §45V tier calculator, a CBAM-impact-vs-ETS-price curve, and a policy-stack optimiser.

### 7.2 IRA §45V tier→credit conversion — the module's one real unit-conversion formula

```js
creditPerTNH3 = round(credit_usd_per_kgH2 × 1000 / 5.5)
```

| Tier | Lifecycle threshold | Credit ($/kg H2) | → $/t NH₃ |
|---|---|---|---|
| 1 | <4 kgCO2e/kg H2 | $0.60 | $109 |
| 2 | <2.5 kgCO2e/kg H2 | $0.75 | $136 |
| 3 | <1.5 kgCO2e/kg H2 | $1.00 | $182 |
| 4 | <0.45 kgCO2e/kg H2 (full green) | $3.00 | **$545** |

The divisor **5.5** is not documented in-code but is dimensionally sound: ammonia is ~17.6% hydrogen
by mass (NH₃ = 17 g/mol from N₂+3H₂→2NH₃, giving 3g H₂ per 17g NH₃ ≈ 17.65%), so 1 kg of H₂ yields
≈1/0.1765 ≈ **5.67 kg of NH₃** — the code's 5.5 is a slightly rounded version of this stoichiometric
ratio. `creditPerTNH3 = $/kgH2 × 1000(kg/t) / (kgNH3 per kgH2)` is therefore a correct unit
conversion from a per-kg-H₂ subsidy to a per-tonne-NH₃ subsidy, just with an unlabelled constant.

### 7.3 Calculation walkthrough

1. **`iraTiers`** (static array, 4 rows): `creditPerTNH3` computed inline per the formula above at
   render time — always recomputed identically, effectively a constant lookup.
2. **`cbamData`** (CBAM impact vs EU ETS price, 9 points from €30–120):
   ```js
   cbamFertiliser = round(ets × 1.8 × 0.82)     // 1.8 tCO2/t grey NH3 embedded emissions
   cbamUrea       = round(ets × 2.1 × 0.82)     // 2.1 tCO2/t grey urea (higher due to extra CO2 step)
   advantage      = round(ets × 1.8 × 0.82 × 0.9)
   ```
   The `×0.82` factor is undocumented but consistent with CBAM's phased free-allocation
   withdrawal — by the mid-2020s roughly 82% of the full embedded-carbon cost applies as EU ETS free
   allowances phase out 2026–2034 (guide: "phased 2026–2034"). `advantage` (green NH₃'s CBAM-free
   competitive edge) applies a further ×0.9 haircut, presumably for verification/administrative
   friction — not derived from any cited source.
3. **`carbonRevenueData`** (credit revenue vs LCOA, 8 points): re-derives the same tier constants
   (545/182/136/109) as a **hard-coded ternary** rather than referencing `iraTiers[iraH2Tier-1]
   .creditPerTNH3` — duplicated logic that happens to stay numerically consistent with §7.2's
   formula but is not DRY; `netCost = max(0, lcoa − credit)`, correctly floored at zero.
4. **`stackData`** (Policy Stack Optimizer): sums independently-selected policy values
   (`IRA §45V + EU H2Global + CBAM premium + Australia Headstart + Japan GIF`) — this is an
   additive stack that **ignores the `stackableWithOthers` flag** on each policy in the underlying
   `POLICIES` table (e.g. `EU H2Global` is flagged `stackable: false` in the data but is summed
   into the stack alongside IRA §45V regardless).

### 7.4 Worked example

Policy Stack at `iraH2Tier=4`, `etsPriceEur=65`:

| Scheme | Value | Computation |
|---|---|---|
| IRA §45V | $545/t | Tier-4 constant |
| EU H2Global | $220/t | Static field (flagged non-stackable in `POLICIES`, but summed anyway) |
| CBAM premium | `round(65×1.8×0.82)` = **$96/t** | |
| Australia Headstart | $95/t | Static field |
| Japan GIF | $130/t | Static field |
| **Naive stack total** | **$1,086/t** | Sum of all five — exceeds even the highest observed LCOA ($1,200/t Denmark/Japan projects in the companion Production Economics module), which is economically implausible since IRA §45V and EU H2Global would never co-apply to the same US-domestic-vs-EU-import project |

This worked example demonstrates the flagged limitation directly: the displayed "$1,086/t" stack
total mixes a US domestic production credit with an EU import-support mechanism that targets a
different physical cargo, an internal consistency error a model-risk reviewer would reject.

### 7.5 Companion analytics

- **Policy Landscape tab** — sorts/filters the 16-row static table by instrument type
  (PTC/H2Global/CBAM/CfD/subsidy/ETS), computing `maxValue`/`avgValue` over the filtered set.

### 7.6 Data provenance & limitations

- The 16-policy table is static and named to real programmes with plausible 2024-vintage values
  (IRS Notice 2023-29 for §45V, EU Reg. 2023/956 for CBAM), but individual `valueUsdPerT` figures
  are not footnoted to specific document sections.
- **Stack Optimizer does not enforce mutual exclusivity** — the single clearest bug: it sums
  policies flagged `stackableWithOthers: false` in the same data model, producing an internally
  contradictory headline number.
- CBAM's `×0.82` phase-in factor and `×0.9` "advantage" haircut are undocumented constants with no
  cited derivation.

**Framework alignment:** IRS §45V Clean Hydrogen PTC guidance (tier thresholds correctly
transcribed) · EU CBAM Regulation (EU) 2023/956 (phase-in framing directionally correct, exact
multiplier unsourced) · H2Global GmbH differential-cost-contract mechanism (named, value used as a
static input, DCC auction mechanics not modelled). See §8 for a corrected stacking model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Correct the Policy Stack Optimizer so it produces a legally consistent, jurisdiction-aware subsidy
stack for a specific project (single country of production, single export corridor) rather than
summing mutually exclusive global policies — supporting project-finance teams sizing all-in
government support for a green ammonia FID decision.

### 8.2 Conceptual approach
A **constraint-based stacking engine**: policies are tagged by (a) applicable jurisdiction of
production, (b) applicable jurisdiction of consumption/import, and (c) a mutual-exclusivity group
(e.g. "US federal production credits" vs "EU import support mechanisms" are different groups; two
policies in the same group cannot stack). This mirrors how project-finance teams actually build
incentive stacks for cross-border H2Global-style auctions — first apply hard eligibility filters,
then sum only the surviving compatible set. Benchmarked against how H2Global's own auction
documentation and IRA guidance define non-stacking provisions.

### 8.3 Mathematical specification

```
Eligible(p, project) = 1  if  project.productionCountry ∈ p.applicableProducerCountries
                         AND project.consumptionCountry ∈ p.applicableConsumerCountries
                         AND project.certification meets p.eligibilityCriteria
                     = 0  otherwise

StackGroup(p) ∈ {producer_credit, importer_support, carbon_price_offset, ...}

MaxStackValue(project) = Σ_g  max_{p ∈ g, Eligible(p,project)=1}  Value(p, project)
   [within each mutual-exclusivity group g, take the single best-value eligible policy;
    sum across groups since different groups ARE stackable by construction]

Value(IRA§45V, project)   = tierCredit($/kgH2) × 1000/5.67          if project.productionCountry = 'USA'
Value(CBAM, project)      = etsPriceEur × EF_grey(product) × phaseInFactor(year)   if project.consumptionCountry ∈ EU
Value(H2Global, project)  = auctionClearingPrice − marketReferencePrice            if project won an H2Global auction
```

| Parameter | Calibration source |
|---|---|
| Mutual-exclusivity groups | Legal review of each programme's own stacking rules (IRS §45V regs explicitly bar double federal credits; CBAM explicitly nets out any carbon price already paid at origin) |
| `EF_grey(product)` | Grey ammonia/urea emission factors — IPCC AR6 default EFs, refined by IFA/fertiliser-industry LCA studies |
| `phaseInFactor(year)` | CBAM Regulation (EU) 2023/956 Annex — published free-allocation phase-out schedule 2026–2034, replacing the undocumented ×0.82 constant |

### 8.4 Data requirements
- **Per-policy eligibility rules** (producer/consumer country, certification standard) — must be
  hand-coded per programme from the primary legal text; no vendor dataset covers this
  comprehensively.
- **CBAM phase-in schedule** — public, in the CBAM regulation Annex (free).
- **Existing platform assets**: the `carbon-credit-quality` and `credit-integrity-dd` engines
  already implement additionality/eligibility screening logic that could be adapted for the
  eligibility-filter layer.

### 8.5 Validation & benchmarking plan
- **Backtest** against publicly disclosed project financing structures (e.g. NEOM, EverWind Nova
  Scotia) where subsidy stacks have been disclosed in financial close announcements; the model's
  `MaxStackValue` should reconcile within a reasonable tolerance.
- **Constraint audit**: unit-test that no two policies in the same `StackGroup` are ever summed —
  this is a correctness gate, not just a numerical accuracy check.

### 8.6 Limitations & model risk
- Legal eligibility rules change frequently (IRA guidance has been amended multiple times since
  2022); the eligibility rule table needs an explicit last-reviewed date and should fail closed
  (exclude, not include) when a rule is stale.
- H2Global auction clearing prices are only known ex-post for cleared auctions; for a prospective
  project the model should treat `Value(H2Global, project)` as a probability-weighted expectation
  based on historical clearing prices, not a point estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Compute credit-stacking economics per project (analytics ladder: rung 1 → 2)

**What.** §7 confirms this catalogues 16 real-named policy instruments (IRA §45V, EU H2Global, EU CBAM, UK CfD, Japan GIF, Korea CCF, Australia Headstart, India NGHM) with per-tonne-NH₃ values attributed to real programme rules (IRS Notice 2023-29 for §45V, EU Reg 2023/956 for CBAM), though individual `valueUsdPerT` figures are 2024-vintage estimates. The headline `§45V_credit = f(lifecycle_GHG_tier)` and `H2Global_DCC = (LCOA_green − market_price) × volume` are real formulas. Evolution A makes them project-executable: compute a project's actual §45V tier from its lifecycle carbon intensity (the four-tier ladder: <0.45 kgCO₂e/kgH₂ → $3.00/kg down to $0.60), the H2Global differential-cost from the project's own LCOA (from the production-economics sibling), and the stacked credit value net of eligibility conflicts — so a developer sees their real subsidy stack, not a generic table.

**How.** (1) A backend route taking a project's lifecycle GHG intensity and LCOA, returning the §45V tier credit, H2Global DCC, and CBAM-avoided-cost, with stacking rules (which credits combine). (2) Wire LCOA from `green-ammonia-production-economics` so the DCC uses a real cost. (3) Keep the 16-policy table as reference, versioned as programme rules amend.

**Prerequisites.** Lifecycle-GHG and LCOA inputs (from the production-economics module); the policy table under version control for rule changes. **Acceptance:** a project's §45V tier and credit recompute from its carbon intensity reproducing the tier ladder; the H2Global DCC uses the project's real LCOA; stacking conflicts are flagged.

### 9.2 Evolution B — Subsidy-optimisation copilot (LLM tier 2)

**What.** A copilot for developers and policy analysts: "for a NEOM-scale project at 0.4 kgCO₂e/kgH₂, what §45V tier applies, and does H2Global or CBAM add more value for an EU offtake?" tool-calls the Evolution A credit-stacking endpoint and narrates the optimal subsidy strategy across jurisdictions.

**How.** Tier-2 tool-calling over the credit endpoints; the grounding corpus is §5/§7, which accurately encode §45V tiers, H2Global DCC mechanics, and CBAM fertiliser rules with real statutory references. The copilot's value is credit-stacking optimisation — which combination of instruments maximises net support for a given project/offtake geography, respecting eligibility conflicts. Every credit figure validated against tool output.

**Prerequisites.** Evolution A (the current table is static per-tonne values, not project-computed); corpus embedding; the policy table kept current. **Acceptance:** every credit and DCC figure in a copilot answer traces to a tool call citing the programme rule; the copilot flags when two credits cannot be stacked, rather than summing them naively.