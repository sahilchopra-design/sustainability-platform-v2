# Climate Blended Finance Analytics
**Module ID:** `climate-blended-finance` · **Route:** `/climate-blended-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DH4 · **Sprint:** DH

## 1 · Overview
Designs and evaluates blended finance structures that combine concessional public capital with private investment to unlock climate finance in emerging markets. Models first-loss tranche sizing, guarantee mechanisms, return enhancement structures, and catalytic capital economics.

> **Business value:** Essential for DFI investment teams structuring climate finance deals, impact investment fund managers designing blended vehicles, and UNFCCC negotiators tracking private climate finance mobilisation. Convergence-aligned analytics enable peer benchmarking of leverage ratios and structure effectiveness.

**How an analyst works this module:**
- Model blended finance structure (first-loss, guarantee, grant)
- Calculate optimal tranche sizing for target leverage ratio
- Assess private investor return enhancement
- Evaluate DFI and MDB concessional input requirements
- Generate Convergence-compatible deal structuring report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `REGIONS`, `SECTORS`, `TABS`, `TRANSACTIONS`, `TYPES`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Guarantee', 'Concessional Loan', 'First-Loss', 'Grant', 'Risk Insurance'];` |
| `REGIONS` | `['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA', 'Eastern Europe'];` |
| `totalSize` | `+(10 + sr(i * 7) * 490).toFixed(1);` |
| `publicShare` | `+(0.2 + sr(i * 11) * 0.6).toFixed(2);` |
| `publicFinance` | `+(totalSize * publicShare).toFixed(1);` |
| `privateFinance` | `+(totalSize * (1 - publicShare)).toFixed(1);` |
| `totalVolume` | `filtered.reduce((a, t) => a + t.totalSize, 0);` |
| `avgLeverage` | `filtered.length ? filtered.reduce((a, t) => a + t.leverageRatio, 0) / filtered.length : 0;` |
| `totalClimateImpact` | `filtered.reduce((a, t) => a + t.climateImpact, 0);` |
| `avgSdg` | `filtered.length ? filtered.reduce((a, t) => a + t.sdgImpact, 0) / filtered.length : 0;` |
| `volumeByType` | `TYPES.map(tp => ({` |
| `scatterLeverage` | `filtered.map(t => ({ x: t.leverageRatio, y: t.climateImpact, name: t.name, type: t.type }));` |
| `volumeBySector` | `SECTORS.map(s => ({` |
| `leverageByRegion` | `REGIONS.map(r => ({` |
| `grantEligible` | `filtered.filter(t => t.publicFinance / Math.max(0.1, t.totalSize) * 100 >= grantElement);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REGIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Blended Finance 2023 | — | Convergence State of Blended Finance 2023 | Annual blended climate finance flows — 75% to energy transition, 25% to adaptation/land use |
| Average Leverage Ratio | — | OECD Blended Finance 2023 | Average private capital mobilised per $1 of public/concessional anchor investment in climate blended finance |
| Climate Finance Gap | — | IPCC AR6 WGIII Chapter 15 | Annual climate investment gap in developing countries — blended finance is primary mechanism to close |
- **Convergence deal database by structure type and sector** → Benchmark leverage analysis → **Average leverage ratios by structure type and geography**
- **DFI concessional capital availability and terms** → Structure optimisation → **Optimal blend ratio for target private IRR and public impact**
- **Climate project financial models by sector** → Blended IRR calculation → **Senior tranche IRR after first-loss protection**

## 5 · Intermediate Transformation Logic
**Methodology:** Blended Finance Leverage Model
**Headline formula:** `CatalyticCapital = TotalDeal - PrivateCapital; LeverageRatio = PrivateCapital / CatalyticCapital; BlendedIRR = Σ [CashFlow_t × PrivateShare / (1+r)^t]`

First-loss tranche absorbs initial losses making senior tranche risk/return acceptable to commercial investors; leverage ratio measures efficiency of concessional capital in mobilising private finance

**Standards:** ['OECD Blended Finance Principles 2019', 'Convergence Blended Finance Database', 'GIIN Blended Finance Principles', 'IFC Blended Finance Framework']
**Reference documents:** OECD DAC Blended Finance Principles 2019; Convergence State of Blended Finance 2023; IFC Blended Finance — A Stepping Stone to Creating Markets (2020); IPCC AR6 WGIII Chapter 15 — Investment and Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-DH4) describes a *blended finance
> structuring engine*: first-loss tranche sizing, guarantee mechanics, return-enhancement
> structures, and a discounted `BlendedIRR = Σ CashFlow_t × PrivateShare / (1+r)^t`. **None of that
> exists in the code.** The page is a *portfolio browser over 50 synthetic blended-finance
> transactions* with filter-reactive aggregations. Critically, the displayed `leverageRatio` is an
> **independent random draw** (`1 + sr(i×13) × 9`), *not* the guide's
> `PrivateCapital / CatalyticCapital` — so the leverage KPI is numerically inconsistent with the
> public/private split shown in the same table row. No tranche waterfall, IRR discounting, or
> Convergence benchmarking is computed. Sections below document the code as it behaves; §8
> specifies the structuring model the guide promises.

### 7.1 What the module computes

50 synthetic transactions are generated at module load (`TRANSACTIONS = Array.from({length: 50}, …)`),
cycling deterministically through 5 structure types, 6 regions, 6 sectors and a fixed 50-country list:

```js
totalSize      = +(10 + sr(i*7)  * 490).toFixed(1)        // $10–500M
publicShare    = +(0.2 + sr(i*11) * 0.6).toFixed(2)       // 20–80%
publicFinance  = totalSize × publicShare
privateFinance = totalSize × (1 − publicShare)            // identity: public + private = total
leverageRatio  = +(1 + sr(i*13) * 9).toFixed(2)           // 1–10×, INDEPENDENT of the split
irr            = 3 + sr(i*17) * 17                        // 3–20%
sdgImpact      = 3 + sr(i*19) * 7                         // 3–10 (0–10 scale)
climateImpact  = 0.05 + sr(i*23) * 4.95                   // 0.05–5 MtCO₂ abated
genderLens     = sr(i*29) > 0.55                          // ~45% of deals flagged
```

Headline KPIs over the filtered set (type × region × sector filters, all guarded for empty arrays):
`totalVolume = Σ totalSize`, `avgLeverage = mean(leverageRatio)`,
`totalClimateImpact = Σ climateImpact`, `avgSdg = mean(sdgImpact)`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Structure types | Guarantee, Concessional Loan, First-Loss, Grant, Risk Insurance | Convergence archetype taxonomy (labels only; no structure-specific maths) |
| Deal size range | $10–500M | synthetic demo value |
| Public share range | 20–80% | synthetic demo value |
| Leverage range | 1–10× | synthetic demo value (spans OECD-reported climate blended average ≈ 4.3×) |
| Leverage target slider | default 3×, range 1–10 | user input; colours KPI green/amber only |
| Grant-element slider | default 20%, range 0–80% | user input; drives eligibility filter (§7.5) |
| Gender-lens threshold | `sr > 0.55` | synthetic demo value |

### 7.3 Calculation walkthrough

1. **Filters** (`typeFilter`, `regionFilter`, `sectorFilter`) subset `TRANSACTIONS` in a `useMemo`.
2. **KPI strip** recomputes the four aggregates in §7.1 on `filtered`.
3. **Chart series**: `volumeByType` and `volumeBySector` group-sum `totalSize`; `leverageByRegion`
   averages `leverageRatio` with a `Math.max(1, count)` divisor guard; `scatterLeverage` plots
   leverage (x) vs climate impact (y) per deal — both axes independent random draws, so the scatter
   has no designed correlation.
4. **Grant eligibility** (tab 8): `publicFinance / max(0.1, totalSize) × 100 ≥ grantElement` —
   i.e. the public share % is used *as a proxy* for the OECD DAC grant element (see limitations).
5. The **leverage target slider** never enters any formula — it only recolours the KPI and table rows.

### 7.4 Worked example (transaction i = 1, "Agriculture-SOU-02")

Type = Concessional Loan, region = South Asia, sector = Agriculture, country = Kenya.

| Step | Computation | Result |
|---|---|---|
| totalSize | 10 + sr(7)·490 = 10 + 0.5825×490 | **$295.4M** |
| publicShare | 0.2 + sr(11)·0.6 = 0.2 + 0.2708×0.6 → 0.36 | **36%** |
| publicFinance | 295.4 × 0.36 | **$106.3M** |
| privateFinance | 295.4 × 0.64 | **$189.1M** |
| leverageRatio (displayed) | 1 + sr(13)·9 = 1 + 0.0736×9 | **1.66×** |
| leverage implied by split | 189.1 / 106.3 | **1.78×** ← inconsistency |
| irr | 3 + sr(17)·17 = 3 + 0.1275×17 | **5.2%** |
| climateImpact | 0.05 + sr(23)·4.95 = 0.05 + 0.2164×4.95 | **1.12 MtCO₂** |
| grant-eligible @ 20%? | 106.3/295.4 × 100 = 36.0% ≥ 20% | **yes** |

The 1.66× vs 1.78× gap illustrates the §7 flag: displayed leverage and the financing split are
drawn from different seeds and never reconciled.

### 7.5 Companion analytics on the page

- **Gender Lens Finance** (tab 8, left panel): count and Σ totalSize of `genderLens` deals, top 8 listed.
- **Grant Element panel** (tab 8, right): eligible count, Σ volume, and per-deal public-share %.
- **SDG / Climate Impact tabs**: top-20 by `sdgImpact` (dual-axis bar) and top-15 by `climateImpact`.

### 7.6 Data provenance & limitations

- **All 50 transactions are synthetic**, generated by the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)` — deterministic across renders, not real Convergence deals.
- Displayed leverage is decoupled from the public/private split (no
  `private / catalytic` computation anywhere in the file).
- "Grant element" is proxied by public-finance share; the OECD DAC grant element is actually an
  NPV concessionality measure (face value minus discounted repayments, at a 10% discount rate for
  ODA loans) — a different quantity.
- No first-loss waterfall, no tranche returns, no cash-flow model, no benchmark data
  (Convergence/OECD figures cited in the guide never appear in code).

**Framework alignment:** *OECD DAC Blended Finance Principles (2019)* — taxonomy of concessional
instruments mirrored by the 5 structure types; the OECD leverage metric (private finance mobilised
per unit of concessional capital) is the intent of the leverage KPI, though not its actual formula
here. *Convergence State of Blended Finance* — the deal-browser framing (size, region, sector,
leverage) follows Convergence's database schema; no Convergence data is ingested. *2X Challenge /
GIIN gender-lens criteria* — the boolean `genderLens` flag approximates 2X eligibility without
implementing its ownership/leadership/employment tests.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support DFI/impact-fund structuring decisions: size the concessional (first-loss/guarantee)
tranche of a climate deal so senior private investors clear their return hurdle, and report a
*true* leverage ratio and OECD grant element per deal. Coverage: project-finance-style climate
transactions in EMDEs, $10–500M, structures = first-loss equity, partial guarantee, concessional
senior debt, grant.

### 8.2 Conceptual approach

Two-layer capital-structure model: (i) an expected-loss tranching engine in the spirit of
structured-credit attachment/detachment maths (as used in IFC's blended concessional finance
window pricing and MDB guarantee pricing practice), and (ii) an OECD-DAC-conform concessionality
calculator. Benchmarks: **IFC Blended Concessional Finance** (DFI Working Group principles —
minimum concessionality, crowding-in), **Convergence** leverage benchmarking (structure-type
median leverage), and **GEMs** (Global Emerging Markets Risk Database) default/recovery statistics
for EMDE project finance as the loss-distribution calibration source.

### 8.3 Mathematical specification

Let deal size `V`, junior (concessional) tranche `J = αV`, senior tranche `S = (1−α)V`.
Project loss rate `L ~ Beta(a, b)` calibrated so `E[L] = PD × LGD` and `Var[L]` matches GEMs
sector dispersion.

```
Senior loss     : L_S(α) = max(0, L − α) / (1 − α)
Senior EL       : EL_S(α) = E[L_S(α)]              (closed-form via incomplete Beta)
Senior IRR      : IRR_S(α) = y_base − EL_S(α)      (promised yield less expected loss)
Sizing rule     : α* = min { α : IRR_S(α) ≥ h }    (h = private hurdle rate)
Leverage        : λ = S / J = (1 − α*) / α*
Grant element   : GE = [F − Σ_t R_t /(1+d)^t] / F,  d = 10% (OECD DAC ODA convention)
Mobilisation    : per OECD attribution rules — guarantees 100% to guarantor, syndicated
                  loans pro-rata to arranger (OECD 2023 amounts-mobilised methodology)
```

| Parameter | Calibration source |
|---|---|
| PD, LGD by sector/region | GEMs Consortium default & recovery statistics (published aggregates); Moody's Analytics project-finance default study as cross-check |
| Beta dispersion `(a,b)` | fit to GEMs loss-rate percentiles by region |
| Hurdle `h` | EMBI+ spread + 200–400bp illiquidity premium (JPMorgan EMBI, IMF WEO risk-free) |
| Discount `d` for GE | 10% fixed — OECD DAC grant-element convention |
| Benchmark leverage | Convergence *State of Blended Finance* medians by structure type (climate ≈ 4.3× per OECD 2023) |

### 8.4 Data requirements

Deal cash-flow schedule (t, R_t), tranche notionals, guarantee coverage %, sector/region PD-LGD
priors (vendor: GEMs, Moody's; free: World Bank/IFC published GEMs aggregates), EMBI spreads.
Platform already holds: sector/region taxonomies, `reference_data` World Bank series, and the
UNDP blended-finance page's structure taxonomy — the transaction schema here (totalSize,
publicFinance, privateFinance) maps directly onto `V`, `J`, `S`.

### 8.5 Validation & benchmarking plan

- Reconcile α*-implied leverage against Convergence structure-type medians (tolerance ±30%).
- Backtest EL_S against GEMs realised senior-loss rates by vintage.
- Sensitivity: ∂α*/∂PD, ∂α*/∂h grids; stability under Beta→lognormal loss-distribution swap.
- Grant-element outputs cross-checked against the OECD DAC grant-element calculator.

### 8.6 Limitations & model risk

Single-factor loss distribution ignores correlation across deals in a portfolio guarantee;
GEMs aggregates are coarse (region × sector); hurdle-rate estimation dominates α* uncertainty —
publish α* ranges, not point values. Conservative fallback: floor `EL_S` at 50% of unattached EL
when data quality score for the deal's country is worse than PCAF DQ-3-equivalent.

## 9 · Future Evolution

### 9.1 Evolution A — Build the structuring engine; fix the inconsistent leverage KPI (analytics ladder: rung 1 → 2)

**What.** §7 documents both a missing engine and an internal inconsistency: the guide
promises first-loss tranche sizing, guarantee mechanics, and a discounted
`BlendedIRR`, but the page is a browser over 50 synthetic transactions — and the
displayed `leverageRatio` is an independent random draw (`1 + sr(i·13)·9`) that
contradicts the public/private split shown in the same row. Evolution A ships the
structuring engine the guide describes: a tranche waterfall (first-loss → mezzanine →
senior) where loss scenarios propagate bottom-up, target-leverage tranche sizing
solved from a private investor's required risk/return, guarantee pricing as expected-
loss coverage, and `BlendedIRR` computed from discounted private cash flows.

**How.** (1) `sizeFirstLoss(dealSize, lossDist, seniorTargetRating)` and a waterfall
evaluator as pure functions; leverage derived as `private/catalytic` — the guide's own
formula — everywhere it appears, eliminating the inconsistent draw. (2) Transaction
browser re-based: either Convergence's published deal database (licensing permitting)
or internally consistent fixtures where leverage is computed from the splits.
(3) Scenario grid (rung 2): leverage achieved vs first-loss percentage × sector risk,
the chart DFI structuring teams actually need.

**Prerequisites (hard).** The self-contradicting leverage field is a defect to fix
regardless of the rest; loss-distribution assumptions per sector documented per §8
model-card convention. **Acceptance:** every displayed leverage equals
private/catalytic for that row; a fixture deal with a known loss distribution
reproduces a hand-computed first-loss size; the mismatch flag clears.

### 9.2 Evolution B — Deal-structuring copilot (LLM tier 2)

**What.** An assistant for DFI teams: "structure a $100M adaptation deal in
Sub-Saharan Africa to hit 4x leverage — what first-loss do I need?", "why does a
guarantee beat a concessional loan here?", "benchmark this leverage against comparable
transactions" — the sizing questions as tool calls into the Evolution A engine, the
benchmarking as filtered aggregations over the (fixed) transaction table, the
instrument-choice reasoning grounded in the OECD/IFC principles corpus §5 cites.

**How.** Client-side tool schemas over the waterfall/sizing functions (no backend
routes exist); the no-fabrication validator ties every ratio and IRR to invocations;
Convergence-style benchmark claims cite the transaction table's provenance status
explicitly (fixture vs sourced).

**Prerequisites (hard).** Evolution A first — today the only leverage numbers
available are the random draws §7 flagged, and structuring advice on top of them
would be malpractice-shaped. **Acceptance:** a recommended structure is reproducible
by re-running the sizing function with the stated parameters; the copilot refuses
country-risk pricing questions the engine doesn't model.