## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry publishes a scoring formula —
> `Circular_Score = RC_pct/50×30 + TakeBack_pct/60×25 + CE_Revenue_pct/40×25 +
> SupplierVisibility×20` — and a pricing formula `cSCF_Rate = SOFR + BaseSpread −
> min(CircularBonus, 40bps)×I(KPI_met)`. **Neither is implemented.** In
> `CircularSupplyChainFinancePage.jsx` the circular score is a direct PRNG draw
> (`Math.round(sr(i·9)·40 + 45)`), unrelated to the company's recycled-content/take-back
> fields, and no rate arithmetic exists anywhere — instrument pricing is display text
> ("SOFR + 40–80bps"). `Value_Leakage = Σ(StageRevenue × LeakagePct)` is likewise absent; the
> leakage table is static. Sections below document the code as-is.

### 7.1 What the module computes

Six tabs (Overview · Circular Levers · Company Scorecard · Finance Instruments · Value Leakage ·
Market Maturity) over five data blocks:

1. **`CIRCULAR_LEVERS`** (6 curated rows — the record's "7 rows" counts a header artefact):
   impact/cost/scalability scored 0–100 by hand, with real exemplars:

| Lever | Impact | Cost | Scalability | Example |
|---|---|---|---|---|
| Reverse Logistics Networks | 88 | 62 | 72 | Caterpillar REMAN, Michelin retreads |
| Product-as-a-Service | 82 | 58 | 80 | Rolls-Royce Power-by-Hour |
| Industrial Symbiosis | 76 | 45 | 68 | Kalundborg |
| Remanufacturing & Refurb | 71 | 52 | 65 | Apple Refurbished |
| Circular Procurement | 68 | 35 | 78 | EU Green Deal GPP |
| Material Passports | 65 | 70 | 85 | Madaster, EU DPP |

   `CE_RADAR_DATA` reshapes these into the radar (first word of each lever as axis label).

2. **`SUPPLY_CHAINS`** — 22 real corporate names (IKEA, Caterpillar, Michelin, Interface…)
   with **synthetic** metrics: `circularRevenuePct = round(sr(i·11)·40 + 5)` (5–45%),
   `takeBactPct` [sic] `= round(sr(i·7)·60 + 10)` (10–70%), `recycledInputPct =
   round(sr(i·13)·55 + 8)` (8–63%), `circularScore = round(sr(i·9)·40 + 45)` (45–85),
   `scfUtilisation = round(sr(i·5)·50 + 30)` (30–80%), `supplier3Tier` picked from
   Yes/No/Partial.
3. **`FINANCE_INSTRUMENTS`** — 6 curated cSCF products with provider, mechanism, maturity
   stage, min ticket and indicative pricing strings (e.g. cSCF "SOFR + 40–80bps"; CE Bond
   "Green premium −5–15bps"; impact-linked loan "SOFR + 60bps ± 20bps KPI"; reman warehouse
   finance "ABL + 150–250bps"). Pricing is descriptive text, never parsed or computed.
4. **`VALUE_LEAKAGE`** — static stage table: Design 8% / Procurement 18% / Manufacturing 22% /
   Distribution 14% / Use Phase 31% / End of Life 42% leakage, with opportunity dollar strings
   ($12–95Bn). The guide's "42% end-of-life leakage (McKinsey 2023)" appears here as a constant.
5. **`MATURITY_DATA`** — programme counts 2020–2026E (pilot 12→85, scaling 5→62, mainstream
   2→48), hand-drawn growth curves.

### 7.2 Derived quantities (complete list)

```js
avgCircularScore = Σ circularScore / 22          // headline KPI, unguarded but length fixed
avgRecycledInput = Σ recycledInputPct / 22
sortedChains     = [...filteredChains].sort((a,b) => b[sortField] - a[sortField])
```

That is the entire computational surface: two universe means (computed over the *unfiltered*
universe, so KPIs don't respond to the sector filter) and a copied-array sort by the selected
column. The $4.5Tn and $180Bn KPI cards are hard-coded strings.

### 7.3 Calculation walkthrough

Sector filter → `filteredChains` → sort by `sortField` (default `circularScore`) → scorecard
table. Levers, instruments, leakage and maturity tabs render their static blocks unmodified.
No cross-tab data flow, no API calls, no state beyond `tab`, `sortField`, `sectorFilter`.

### 7.4 Worked example — company i = 1 (H&M)

`sr(s) = frac(sin(s+1)·10⁴)`: `sr(9) = frac(sin(10)·10⁴) = frac(−5440.21…) ≈ 0.7885` →
`circularScore = round(0.7885·40 + 45)` = **77**. `sr(7) = frac(sin(8)·10⁴) ≈ frac(9893.58) ≈
0.582` → `takeBactPct = round(0.582·60 + 10)` = **45%**. Note the score (77) is independent of
take-back (45%) and recycled input — under the guide's stated formula these would be inputs;
in code they are separate random draws. H&M's row sorts 77 into the scorecard and contributes
77/22 to `avgCircularScore`.

### 7.5 Data provenance & limitations

- **Company scorecard is synthetic** (platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`) attached
  to real company names — fabricated KPIs could be mistaken for actual GRS/ISCC+ audit data.
- Lever scores, leakage percentages, maturity counts and instrument pricing are uncited
  hand-curated constants (guide attributes leakage to "McKinsey CE Value Model 2023" and
  pricing to "ING CE Finance Framework 2023", but no code-level citation exists).
- KPI means ignore the active sector filter (universe-level only).
- Field name typo `takeBactPct` persists throughout.

### 7.6 Framework alignment

- **ING Circular Economy Finance framework / SLL market practice** — the impact-linked loan row
  mirrors sustainability-linked loan mechanics (LMA SLL Principles: KPI-conditional margin
  ratchets of ±10–40bps); the code shows the concept as text only.
- **ISO 59000 family (59004/59010/59020, 2024)** — named in guide; ISO 59020 defines circularity
  measurement principles that a real Circular_Score would follow; absent in code.
- **EU Digital Product Passport (ESPR 2024/1781)** — correctly cited as the enabler for material
  passports lever; descriptive only.
- **ESRS E5 / GRI 306** — the disclosure hooks for the scorecard metrics; not computed here.

## 8 · Model Specification — cSCF Pricing & Supplier Circularity Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Two production components: (i) a supplier **Circular Score** computed from measured KPIs (not a
random draw), and (ii) a **cSCF rate engine** that converts the score into a financing-cost
benefit, for treasury teams structuring circular supply-chain-finance programmes over the
22-company universe and their supplier bases.

### 8.2 Conceptual approach

Score design follows **ISO 59020:2024** circularity-measurement structure and **WBCSD CTI
v4.0** weighting practice; the rate engine mirrors **LMA/LSTA Sustainability-Linked Loan
Principles** margin-ratchet mechanics and ING's published circular-finance eligibility
framework, in which verified KPI attainment moves the drawn margin by a bounded step — the same
mechanism the guide describes but the code omits.

### 8.3 Mathematical specification

```
Score_i = 30·min(1, RC_i/RC*) + 25·min(1, TB_i/TB*) + 25·min(1, CER_i/CER*) + 20·V_i
          // RC = recycled content %, TB = take-back rate %, CER = CE revenue %,
          // V ∈ {0, 0.5, 1} for supplier visibility {No, Partial, ≥3-tier Yes}
Rate_i(t) = SOFR(t) + S_base(rating_i, tenor) − min(B_max, b·Score_i/100)·I(KPI_verified)
EarlyPay discount_i = d_base − δ·I(Score_i ≥ Score_min)         // reverse-factoring leg
Value_Leakage_stage = Revenue_stage × leak_stage                 // guide formula, made live
```

| Parameter | Value | Calibration source |
|---|---|---|
| Normalisers RC*, TB*, CER* | 50%, 60%, 40% | Guide's own denominators; sector-calibrated from ESRS E5 disclosures once available |
| `B_max` max margin benefit | 40 bps | Observed SLL ratchet range (Sustainable Fitch / LMA SLL market studies: 2.5–10bps typical per KPI, up to 25–50bps total) |
| `b` slope | 0.4 bps per score point | Chosen so Score 100 ⇒ B_max; linearity per SLL market convention |
| `S_base` | Supplier credit spread grid | ICE BofA IG/HY OAS by rating (public), or bank internal grid |
| `d_base`, `δ` | 10 bps circular discount | Taulia/C2FO published dynamic-discounting ranges |
| Verification | Annual, independent | GRS/ISCC+ certification or limited assurance per ISAE 3000 |

### 8.4 Data requirements

Supplier KPIs (recycled content, take-back, CE revenue) from ESRS E5 filings, GRS/ISCC+
certificates, or buyer audit data; SOFR curve (NY Fed, free); credit spreads (FRED ICE BofA
series, free). Platform reuse: backend `circular_economy_engine` for MCI/EPR inputs;
`reference_data` layer for rate curves; the existing scorecard table becomes the score output
surface.

### 8.5 Validation & benchmarking plan

Benchmark computed margins against disclosed SLL/cSCF deals (ING, Rabobank press releases give
KPI + pricing ranges); test score discrimination: certified circular suppliers should score
≥ uncertified peers (Mann-Whitney p<0.05 on a labelled sample); rate-engine unit tests at
boundary scores (0, Score_min, 100); annual recalibration of B_max against realised SLL ratchet
distributions.

### 8.6 Limitations & model risk

KPI self-reporting risk (greenwash) — mitigate with verification gating `I(KPI_verified)`;
linear score→bps mapping is a convention, not an estimated risk relationship (circularity is
not yet proven to predict supplier default); SOFR-spread grid ignores supplier-specific
funding costs. Conservative fallback: zero benefit when verification lapses, cap cumulative
benefit at B_max, and disclose that the margin adjustment is incentive pricing, not
risk-based pricing.
