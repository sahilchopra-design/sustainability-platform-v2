# SAF Carbon Credits & CORSIA Intelligence
**Module ID:** `saf-carbon-credits` · **Route:** `/saf-carbon-credits` · **Tier:** B (frontend-computed) · **EP code:** EP-EH6 · **Sprint:** EF

## 1 · Overview
SAF carbon credit intelligence covering CORSIA CEF, ISCC+, RSB, Verra VCU, Gold Standard, and EU ETS integration. LCA waterfall by pathway, revenue stacking model ($SAF + IRA §40B + ISCC+ + CORSIA + EU ETS), registry landscape, and credit market volume forecast.

> **Business value:** Used by SAF producers stacking revenue across credit markets, airlines verifying SAF sustainability claims, and carbon market participants valuing SAF-related credit instruments.

**How an analyst works this module:**
- Review credit overview for 6 SAF credit type landscape
- Examine LCA waterfall for CI reduction by pathway driving credit quantity
- Use revenue stacking model for total monetisation across all credit types
- Analyse registry intelligence for CORSIA, ISCC+, RSB, and voluntary market acceptance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CREDIT_TYPES`, `KpiCard`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CREDIT_TYPES` | 7 | `name`, `standard`, `price`, `vol_mt`, `vintage`, `permanence`, `additionality`, `registry` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Credit Markets', 'CORSIA Credits', 'Book-and-Claim Certs', 'Lifecycle Analysis', 'Revenue Stacking', 'Registry Intelligence'];` |
| `volume` | `parseFloat((1000 + sr(i * 11 + 2) * 99000).toFixed(0));` |
| `price` | `parseFloat((ct.price * (0.85 + sr(i * 13 + 3) * 0.35)).toFixed(1));` |
| `country` | `['USA', 'EU', 'UK', 'Australia', 'Norway', 'Japan', 'UAE'][Math.floor(sr(i * 19 + 5) * 7)];` |
| `pathway` | `['HEFA', 'AtJ', 'FT-MSW', 'PtL'][Math.floor(sr(i * 23 + 6) * 4)];` |
| `vintage` | ``202${3 + Math.floor(sr(i * 29 + 7) * 2)}`;` |
| `filtered` | `useMemo(() => PROJECTS.filter(p => selType === 'ALL' \|\| p.creditType === selType), [selType]); const avgPrice = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.price, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalVol` | `useMemo(() => filtered.reduce((s, p) => s + p.volume, 0), [filtered]);` |
| `ciByPathway` | `{ HEFA: 28, AtJ: 12, 'FT-MSW': 5, PtL: -70 };` |
| `ciReduction` | `baselineCI - (ciByPathway[pathway] \|\| 28);` |
| `totalGallons` | `annualProd * 1e6 * gallonsPerMt;` |
| `corsiaCredit` | `totalGallons * (ciReduction / baselineCI) * 0.0025;` |
| `isccRevenue` | `annualProd * 1e6 * 45 / 1e6;` |
| `revenueStack` | `useMemo(() => [ { name: 'SAF Sale', value: parseFloat((annualProd * 1e6 * 2.80 * gallonsPerMt / 1e6).toFixed(1)) }, { name: 'IRA §40B', value: parseFloat((annualProd * 1e6 * gallonsPerMt * 1.50 / 1e6).toFixed(1)) }, { name: 'ISCC+ Cert', value: parseFloat(isccRevenue.toFixed(1)) }, { name: 'CORSIA CEF', value: parseFloat((corsiaCredit / 1` |
| `lcaData` | `['HEFA-UCO', 'HEFA-Tallow', 'AtJ-Cellulosic', 'FT-MSW', 'PtL-Wind'].map(pw => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CORSIA CEF credit value ($/gal SAF) | `CO2_offset_per_gal × CORSIA_credit_price` | ICAO + Carbon pricing benchmarks | CI reduction × CORSIA credit price (Est. $5–25/tCO2 in Phase II); LCA from ICAO default values. |
| ISCC+ premium ($/gal) | `Certification_cost_amortised + market_premium` | EU RED market premiums observed | EU airlines pay slight premium for ISCC+ certified SAF; required for EU biofuel mandate compliance. |
| EU ETS offset value (per ton CO2) | `EU ETS spot price × CO2 displaced per gal` | EU ETS Bloomberg/ICE data | SAF displacing conventional jet in EU ETS scope reduces allowance surrender; valued at EU ETS spot. |
- **CORSIA CEF + ISCC+ + RSB + EU ETS + Verra VM0047 + revenue stacking** → LCA waterfall + 6 credit type intelligence + revenue stacker + market forecast → **SAF producers maximising revenue, airlines managing compliance, carbon traders valuing SAF credits**

## 5 · Intermediate Transformation Logic
**Methodology:** SAF Revenue Stacking Model
**Headline formula:** `Total_Revenue = SAF_price + IRA_§40B + CORSIA_CEF + ISCC+_premium + EU_ETS_offset`

Revenue stacking materially improves SAF economics: HEFA base $2.8/gal + §40B $1.25/gal + CORSIA CEF $0.20/gal + ISCC+ $0.10/gal = $4.35/gal total.

**Standards:** ['ICAO CORSIA Eligible Fuels List', 'EU ETS Aviation Directive 2003/87/EC', 'Verra VCS Methodology VM0047']
**Reference documents:** ICAO (2024) – CORSIA Eligible Fuels Life Cycle Assessment Framework; EU (2023) – ETS Aviation Directive updates and SAF applicability; Verra (2023) – VM0047 SAF Methodology for Voluntary Carbon Market

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is one of the better-grounded modules in this batch: its LCA and revenue-stacking
formulas use real ICAO/IRA reference constants, though the 20-project credit-market universe layers
synthetic price/volume variation on top of realistic base prices.

### 7.1 What the module computes

```
baselineCI    = 89 gCO2eq/MJ                    // ICAO CORSIA default fossil Jet-A baseline
ciByPathway   = { HEFA: 28, AtJ: 12, 'FT-MSW': 5, PtL: -70 }   // gCO2eq/MJ, PtL negative via DAC credit
ciReduction   = baselineCI - ciByPathway[pathway]
totalGallons  = annualProd(Mt) x 1e6 x 264 gal/t                // 264 gal/tonne SAF density conversion
corsiaCredit  = totalGallons x (ciReduction / baselineCI) x 0.0025    // tCO2-equivalent credits
isccRevenue   = annualProd x 1e6 x $45/t / 1e6                  // $M/yr ISCC+ certificate premium
revenueStack  = SAF sale + IRA S40B + ISCC+ + CORSIA CEF + EU ETS   // $M/yr, 5 components
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `baselineCI` | 89 gCO2eq/MJ | Real ICAO CORSIA default fossil-jet baseline (matches published ICAO Annex 16 Vol IV life-cycle default value) |
| `ciByPathway` | HEFA 28, AtJ 12, FT-MSW 5, PtL -70 gCO2eq/MJ | Plausible relative ordering (HEFA highest CI of the SAF pathways, PtL most negative via DAC carbon credit) — directionally consistent with ICAO CORSIA default LCA value tables, though exact figures are illustrative, not pulled from the official ICAO table row-by-row |
| `gallonsPerMt` | 264 gal/tonne | Reasonable SAF density conversion (jet fuel ≈ 3.3-3.4 kg/gal, so 1,000kg / 3.4kg/gal ≈ 294; 264 is in the right order of magnitude but not an exact ASTM D7566 density figure) |
| CORSIA credit scaling `x0.0025` | — | **Unexplained proportionality constant** — converts gallons x CI-reduction-fraction into a credit tonnage; no docstring or comment derives it from a gal-to-kg-to-MJ-to-tCO2 chain, so it should be treated as an illustrative scaling factor rather than an audited conversion |
| `CREDIT_TYPES` base prices | CORSIA CEF $18/t, ISCC+ $45/t, RSB $38/t, Verra VCU $22/t, Gold Standard $30/t, EU ETS $62/t | Plausible approximate 2024 market price levels per instrument type, consistent with the guide's cited $5-25/t CORSIA Phase II range (base $18 sits inside it) |
| IRA §40B credit | $1.50/gal (used in `revenueStack`) | Sits inside the guide's cited $1.25-1.75/gal range, but the code hard-codes the single $1.50 figure rather than applying the CI-reduction-scaled formula (`min(1.75, 1.25 + max(0, ciReduction-50)x0.01)`) that the **companion** `saf-policy-mandate` module implements |
| SAF sale price | $2.80/gal | Synthetic demo, within the guide's cited $2.5-4.0/gal HEFA LCOF range |
| EU ETS carve-out | 5.5% of gallons x $65/tCO2 | Ad hoc proportion, not derived from an EU ETS aviation allowance-surrender calculation |

### 7.3 Calculation walkthrough

1. User sets `annualProd` (Mt SAF/yr) and `pathway` (HEFA/AtJ/FT-MSW/PtL) sliders.
2. `ciReduction` = baseline minus the selected pathway's life-cycle carbon intensity (higher
   reduction for lower-CI pathways; PtL's negative CI value produces the largest reduction).
3. `totalGallons` converts production to gallons via the fixed 264 gal/t factor.
4. `corsiaCredit` scales gallons by the **fractional** CI reduction (`ciReduction/baselineCI`,
   dimensionless, 0-1.79 range since PtL can exceed 100% reduction) times the unexplained `0.0025`
   constant — the larger the fractional CI cut, the more CORSIA-eligible credit tonnage generated.
5. `revenueStack` sums 5 independently-formulated $/gal or $/t revenue streams into a single
   $M/yr chart, illustrating that CORSIA/ISCC+/IRA revenue stacking materially improves SAF
   project economics versus fuel sale alone — directionally matches the guide's cited "$2.8 base +
   $1.25 40B + $0.20 CORSIA + $0.10 ISCC+ = $4.35/gal" example.
6. Separately, `PROJECTS` (20 rows, credit-market universe) layers `sr()`-seeded volume (1,000-
   100,000t) and price (base price x 0.85-1.20 spread) onto the 6 `CREDIT_TYPES` — a synthetic
   market view distinct from the deterministic revenue-stack calculator.

### 7.4 Worked example

At `annualProd = 0.3 Mt/yr`, `pathway = HEFA` (CI=28):
```
ciReduction  = 89 - 28 = 61 gCO2eq/MJ           (69% reduction vs baseline)
totalGallons = 0.3 x 1e6 x 264 = 79,200,000 gal
corsiaCredit = 79,200,000 x (61/89) x 0.0025 = 79,200,000 x 0.6854 x 0.0025 = 135,700 tCO2-equiv
isccRevenue  = 0.3 x 1e6 x 45 / 1e6 = $13.5M/yr
SAF sale     = 0.3 x 1e6 x 2.80 x 264 / 1e6 = $221.8M/yr
IRA S40B     = 0.3 x 1e6 x 264 x 1.50 / 1e6 = $118.8M/yr
CORSIA CEF   = 135,700 / 1e6 x $M-scale... = corsiaCredit/1e6 = $0.14M/yr (in the chart's units)
EU ETS       = 0.3 x 1e6 x 0.055 x 65 / 1e6 = $1.07M/yr
Total stack  ~= 221.8 + 118.8 + 13.5 + 0.14 + 1.07 ~= $355.3M/yr
```
Note CORSIA CEF contributes a small fraction of the stack at this scale — SAF sale and the IRA
credit dominate, consistent with the guide's framing of §40B as a major economics lever.

### 7.5 Data provenance & limitations

- `baselineCI=89` is a defensible real ICAO reference value; `ciByPathway` values and the
  `0.0025` CORSIA-credit scaling constant are unexplained/uncited and should be treated as
  illustrative rather than audited conversion factors.
- The 20-project credit-market universe (`PROJECTS`) is synthetic (`sr()`-seeded price/volume) laid
  over realistic base prices — useful for UI variety, not real market quotes.
- The IRA §40B credit is hard-coded at a flat $1.50/gal here, inconsistent with the CI-reduction-
  scaled formula the platform's own `saf-policy-mandate` module implements for the same credit —
  a cross-module consistency gap worth flagging for remediation.

**Framework alignment:** ICAO CORSIA Eligible Fuels default life-cycle values (baseline anchored
correctly, pathway-specific values illustrative) · IRA §40B SAF Production Tax Credit (flat-rate
approximation of the real CI-scaled credit) · Verra VM0047 / ISCC+ / RSB / Gold Standard (named
correctly as registries with plausible market prices, not modelled methodologically) · EU ETS
Aviation Directive 2003/87/EC (allowance cost applied as a flat % proxy, not a true surrender
calculation).

## 9 · Future Evolution

### 9.1 Evolution A — Cited conversion factors and cross-module credit consistency (analytics ladder: rung 2 → 3)

**What.** The revenue-stacking chain is genuinely grounded — `baselineCI = 89 gCO₂eq/MJ` is the real ICAO CORSIA fossil baseline, and the stack ($SAF + IRA §40B + ISCC+ + CORSIA + EU ETS) computes from stated constants — but §7.5 flags three issues: the `ciByPathway` values and the `0.0025` CORSIA-credit scaling constant are uncited (illustrative, not audited conversion factors), the 20-project market universe is seeded price/volume over realistic bases, and the IRA §40B credit is hard-coded flat at $1.50/gal — inconsistent with the CI-scaled formula the platform's own `saf-policy-mandate` module implements for the same credit, an explicitly flagged cross-module gap. Evolution A sources the constants and unifies the credit logic.

**How.** (1) Adopt one shared §40B implementation: the CI-reduction-scaled statutory formula as a shared service both SAF modules call — the atlas interconnection principle applied to a documented divergence. (2) Cite or derive the CORSIA factors: `ciByPathway` mapped to ICAO CORSIA default life-cycle values per approved pathway (published tables), and the 0.0025 scaling replaced by the explicit unit chain (gallons → MJ → tCO₂e) so the credit quantity is auditable arithmetic. (3) Credit-market prices become dated reference rows (registry/market publications) instead of seeded variation. (4) `POST /api/v1/saf-credits/stack` serves the full stack per project with per-leg citations.

**Prerequisites.** ICAO default-CI table transcription; coordination with `saf-policy-mandate` on the shared credit service. **Acceptance:** both SAF modules return identical §40B values for identical inputs; the CORSIA credit reproduces from the explicit unit chain; every stack leg carries a source.

### 9.2 Evolution B — Revenue-stack advisor for producers (LLM tier 2)

**What.** SAF producers face a genuinely confusing multi-registry landscape (CORSIA CEF vs ISCC+ vs Verra vs EU ETS interaction, double-counting restrictions). The copilot advises: "we produce 40kt HEFA-UCO in Rotterdam — which credits stack legally, what's the combined $/gal, and where does EU RED double-counting bite?", running the stack endpoint and grounding eligibility answers in registry-rule reference content.

**How.** Tier-2 tool calls to `POST /stack` for the numbers; eligibility/mutual-exclusivity reasoning grounded in chunked registry rules (CORSIA eligibility criteria, ISCC+ system documents — public) with clause citations, because stacking legality is exactly where hallucinated confidence causes damage. The copilot separates computed economics from regulatory interpretation, tagging the latter with a verify-with-counsel note. Scenario sweeps (credit prices, CI improvements) are parameterised tool calls.

**Prerequisites (hard).** Evolution A's cited factors and unified credit logic — advising on a stack whose legs disagree across platform modules would be incoherent; registry texts chunked. **Acceptance:** stack figures match endpoint output with citations per leg; eligibility claims quote registry clauses; double-counting warnings appear whenever mutually exclusive legs are combined.