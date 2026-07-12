# Wellbeing-Adjusted Returns Analytics
**Module ID:** `wellbeing-adjusted-returns` · **Route:** `/wellbeing-adjusted-returns` · **Tier:** B (frontend-computed) · **EP code:** EP-DP6 · **Sprint:** DP

## 1 · Overview
Integrates wellbeing economics into investment return analysis — adjusting portfolio returns for health, social, and environmental externalities. Models total societal return, SROI (Social Return on Investment), and wellbeing-adjusted financial performance for impact investors.

> **Business value:** Directly applicable to impact investors reporting SROI, sovereign wealth funds integrating wellbeing into investment mandates, and development banks measuring societal returns. Provides HM Treasury Green Book-aligned wellbeing valuation and GIIN IRIS+ compatible impact measurement for stakeholder reporting.

**How an analyst works this module:**
- Input investment portfolio with sector and geography
- Add health, social, and environmental outcomes
- Apply HM Treasury/NICE wellbeing shadow prices
- Calculate SROI and wellbeing-adjusted return
- Generate GIIN IRIS+-aligned total impact report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSET_CLASSES`, `Bar`, `INVESTMENTS`, `KpiCard`, `TABS`, `WELLBY_CATEGORIES`, `WELLBY_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ASSET_CLASSES` | `['Green Infrastructure', 'Health Systems', 'Clean Energy', 'Nature-Based Solutions', 'Social Housing'];` |
| `acIdx` | `Math.floor(sr(i * 5) * ASSET_CLASSES.length);` |
| `grossReturn` | `4 + sr(i * 7) * 8;` |
| `wellbyScore` | `20 + sr(i * 11) * 75;` |
| `socialRoi` | `1.5 + sr(i * 13) * 8.5;` |
| `healthCobenefits` | `0.5 + sr(i * 17) * 9.5;` |
| `wellbyCostPerUnit` | `1000 + sr(i * 19) * 49000;` |
| `finalReturn` | `grossReturn * (1 + wellbyScore / 200);` |
| `sdgAlignment` | `Math.round(1 + sr(i * 23) * 5);` |
| `impactMultiplier` | `1 + sr(i * 29) * 4;` |
| `aum` | `10 + sr(i * 31) * 490;` |
| `WELLBY_DATA` | `WELLBY_CATEGORIES.map((cat, i) => ({` |
| `TABS` | `['Overview', 'WELLBY Scores', 'Social ROI', 'Health Co-Benefits', 'Asset Class Analysis', 'WELLBY Framework', 'Impact Multiplier', 'Portfolio Construction'];` |
| `avgWellby` | `filtered.length ? (filtered.reduce((a, i) => a + i.wellbyScore, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgSocialRoi` | `filtered.length ? (filtered.reduce((a, i) => a + i.socialRoi, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalAum` | `filtered.reduce((a, i) => a + i.aum, 0).toFixed(0);` |
| `avgFinalReturn` | `filtered.length ? (filtered.reduce((a, i) => a + i.finalReturn, 0) / filtered.length).toFixed(2) : '0.00';` |
| `avgHealthCob` | `filtered.length ? (filtered.reduce((a, i) => a + i.healthCobenefits, 0) / filtered.length).toFixed(2) : '0.00';` |
| `avgW` | `acInvs.length ? (acInvs.reduce((a, inv) => a + inv.wellbyScore, 0) / acInvs.length).toFixed(1) : '0.0';` |
| `avgR` | `acInvs.length ? (acInvs.reduce((a, inv) => a + inv.finalReturn, 0) / acInvs.length).toFixed(2) : '0.00';` |
| `totalA` | `acInvs.reduce((a, inv) => a + inv.aum, 0).toFixed(0);` |
| `avgSroi` | `acInvs.length ? (acInvs.reduce((a, inv) => a + inv.socialRoi, 0) / acInvs.length).toFixed(2) : '0.00';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `TABS`, `WELLBY_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Health QALY Value | — | NICE Technology Appraisal Threshold 2024 | UK NICE threshold for cost-effective health interventions — primary shadow price for health outcomes |
| Social Bond Wellbeing Premium | — | GIIN SROI Research 2023 | Investments with verified SROI >3× command 2–4% return premium in impact bond market |
| Wellbeing Economics GDP Alternative | — | OECD Better Life Index 2024 | 35 countries now report National Wellbeing (NWB) indicators alongside GDP — growing impact on policy |
- **Portfolio company/project outcome data by IRIS+ category** → Impact quantification → **Outcomes by domain with financial proxy values**
- **NICE/HM Treasury wellbeing shadow prices** → Monetary valuation → **Total wellbeing-adjusted value of investment outcomes**
- **Peer impact data + SROI benchmarks** → Performance comparison → **SROI ratio vs sector peers and wellbeing-adjusted return premium**

## 5 · Intermediate Transformation Logic
**Methodology:** Wellbeing-Adjusted Return
**Headline formula:** `WAR = FinancialReturn + (HealthCoBenefit + SocialCoBenefit - EnvironmentalHarm) × MonetisationRate; SROI = TotalValue / TotalInvestment where TotalValue = Σ [Outcome_i × FinancialProxy_i]`

Wellbeing adjustments use shadow prices from government policy evaluations (NICE, HM Treasury, US EPA); SROI aggregates across 6 outcome domains using financial proxies calibrated to government wellbeing thresholds

**Standards:** ['OECD Wellbeing Framework 2020', 'Social Value International — SROI Methodology', 'HM Treasury Green Book 2022 — Wellbeing Valuation', 'GIIN IRIS+ Social and Environmental Impact Metrics']
**Reference documents:** OECD How's Life? 2020 — Measuring Wellbeing; HM Treasury Green Book 2022 — Supplementary Wellbeing Guidance; Social Value International — A Guide to Social Return on Investment 2012; GIIN IRIS+ System for Impact Investors

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formulas are
> `WAR = FinancialReturn + (HealthCoBenefit+SocialCoBenefit−EnvironmentalHarm) × MonetisationRate`
> and `SROI = TotalValue/TotalInvestment` (summed over 6 outcome domains with financial proxies).
> **Neither formula is implemented.** The code's `finalReturn` uses a different, multiplicative
> formula with no monetisation-rate or outcome-domain structure, and `socialRoi` is an independent
> random field, not a computed ratio. Every quantity — WELLBY score, social ROI, health co-benefits —
> is drawn from the seeded PRNG per synthetic investment.

### 7.1 What the module computes

100 synthetic investments (implied by index generation) across 5 asset classes (Green Infrastructure,
Health Systems, Clean Energy, Nature-Based Solutions, Social Housing):

```js
grossReturn        = 4 + sr(i·7)×8                    // % financial return, 4–12%
wellbyScore         = 20 + sr(i·11)×75                 // 0–100-ish WELLBY-equivalent score
finalReturn         = grossReturn × (1 + wellbyScore/200)   // multiplicative uplift, NOT the guide's additive WAR
socialRoi           = 1.5 + sr(i·13)×8.5               // £/£ ratio, 1.5–10.0 — independent random field
healthCobenefits    = 0.5 + sr(i·17)×9.5
wellbyCostPerUnit    = 1000 + sr(i·19)×49000           // implied £/WELLBY monetisation, but not applied anywhere
sdgAlignment         = round(1 + sr(i·23)×5)            // 1–6, not mapped to actual SDG numbers 1–17
impactMultiplier     = 1 + sr(i·29)×4
aum                  = 10 + sr(i·31)×490                // $M
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `grossReturn` | 4–12% | Synthetic uniform |
| `wellbyScore` | 20–95 | Synthetic uniform; "WELLBY" (WELLbeing-adjusted LIfe Year) is a real HM Treasury Green Book concept, but the score here has no unit correspondence to actual WELLBYs |
| `finalReturn` uplift factor | `1 + wellbyScore/200` → max 1.475× at `wellbyScore=95` | Author-chosen multiplier, not derived from any named monetisation rate |
| `socialRoi` | 1.5×–10.0× | Synthetic uniform, independent of `wellbyScore`/`healthCobenefits` despite conceptually overlapping |
| `wellbyCostPerUnit` | £1,000–£50,000 | Plausible range (UK NICE-style QALY thresholds run ~£20,000–£30,000/QALY, £70,000 cited in guide) but never multiplied against any outcome quantity to produce a monetised value |

### 7.3 Calculation walkthrough

1. Portfolio KPIs (`avgWellby`, `avgSocialRoi`, `totalAum`, `avgFinalReturn`, `avgHealthCob`) are
   simple unweighted means/sums over `filtered` investments.
2. Asset-class breakdown (`avgW`, `avgR`, `totalA`, `avgSroi`) repeats the same unweighted-mean
   pattern, grouped by `ASSET_CLASSES`.
3. **`finalReturn`'s multiplicative uplift never uses `wellbyCostPerUnit`, `healthCobenefits`, or
   `socialRoi`** — three of the module's own headline fields play no role in the one formula that
   does exist, despite the guide's WAR formula requiring exactly these terms as additive components.
4. No tab computes total societal value (`Σ Outcome_i × FinancialProxy_i`, the guide's SROI numerator)
   from `healthCobenefits`/`socialRoi`/`aum` — `socialRoi` is displayed as-is, not derived.

### 7.4 Worked example

Investment `i`, `grossReturn = 8.0%`, `wellbyScore = 70`:

```
finalReturn = 8.0 × (1 + 70/200) = 8.0 × 1.35 = 10.8%
```

Under the guide's actual WAR formula, with (illustrative) `HealthCoBenefit=£2M`,
`SocialCoBenefit=£1.5M`, `EnvironmentalHarm=£0.2M`, `MonetisationRate` normalising to % of AUM, and
`FinancialReturn=8.0%`: `WAR = 8.0% + (2.0+1.5−0.2)/AUM × 100 × MonetisationRate` — a fundamentally
different construction (additive, driven by monetised £ co-benefits relative to investment size)
than the code's return-multiplier approach (multiplicative, driven only by an unmonetised 0–100
score). The two methodologies would rank investments differently: a small, high-wellbeing-score
investment scores well under the code's formula but might show a small absolute WAR uplift under the
guide's £-based formula if its co-benefits are small in absolute terms relative to a larger AUM peer.

### 7.5 Data provenance & limitations

- **All investment data is synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`.
- **No monetisation/shadow-pricing step exists** despite `wellbyCostPerUnit` suggesting one is
  intended — the field is generated and displayed but never used as a multiplier.
- **`socialRoi` is not an SROI** in the technical sense (Social Value International's methodology,
  named in the guide) — it is an unstructured random ratio with no underlying "value created / capital
  invested" computation.
- `sdgAlignment` (1–6) doesn't map to the UN's actual 17 SDGs, so any "SDG-aligned" claim on this page
  cannot currently be traced to a specific goal.

**Framework alignment:** OECD Wellbeing Framework 2020, HM Treasury Green Book 2022 (wellbeing
valuation), Social Value International SROI methodology, and GIIN IRIS+ (all named in the guide) are
**not implemented** — the module has no shadow-price table, no outcome-domain taxonomy, and no SROI
ratio construction. The sibling `vc-impact` module's §8 model specification (Impact Multiple of
Money with sector shadow-pricing) documents a directly reusable production design for this module's
`socialRoi`/`healthCobenefits` fields.

## 9 · Future Evolution

### 9.1 Evolution A — Shadow-price table and a real WAR/SROI construction (analytics ladder: rung 1 → 2)

**What.** Implement the module's advertised methodology, none of which exists: §7's
flag documents that `finalReturn` is a multiplicative uplift
(`grossReturn × (1 + wellbyScore/200)`) rather than the guide's additive
`WAR = Return + (Health + Social − Harm) × MonetisationRate`; `socialRoi` is an
independent random field, not a value/investment ratio; and — §7.3's sharpest finding
— `wellbyCostPerUnit` is generated and displayed but never multiplied against any
outcome, so the module's own monetisation field is decorative. Evolution A builds the
missing spine: a cited shadow-price table (NICE QALY threshold ~£20–30k, HM Treasury
Green Book WELLBY values, EPA social cost of carbon), an outcome-domain schema per
investment (health/social/environmental quantities), then
`TotalValue = Σ Outcome_i × ShadowPrice_i`, `SROI = TotalValue / Investment`, and the
additive WAR — retiring the multiplicative uplift. Fix `sdgAlignment` to map to the
actual 17 SDGs instead of 1–6. §7.5 notes the sibling `vc-impact` §8 spec is directly
reusable; the two modules should share one shadow-price reference table.

**How.** Backend route `POST /api/v1/wellbeing-returns/score` (module is Tier B,
EP-DP6) plus a `shadow_prices` refdata table shared with `vc_impact_engine`; the
worked §7.4 comparison (multiplicative 10.8% vs additive WAR) becomes the bench pin
demonstrating the methodology change.

**Prerequisites.** Outcome quantities must be inputtable (the current schema has
scores, not quantities); shadow prices cited to named publications with vintages.
**Acceptance:** SROI is reproducible as TotalValue/Investment from visible components;
a small high-score investment and a large low-score one rank differently under WAR
than under the old multiplier, matching the §7.4 analysis; every shadow price displays
its source.

### 9.2 Evolution B — SROI report drafter with assumption transparency (LLM tier 2)

**What.** SROI reporting (Social Value International methodology) is fundamentally a
narrative-plus-assumptions exercise: every monetised outcome needs a stated proxy,
deadweight, and attribution judgement. Evolution B is a tool-calling drafter for
impact investors and development banks: "produce the SROI statement for our Social
Housing sleeve" calls Evolution A's `POST /score` per investment, assembles the
value map (outcome → quantity → shadow price → total), and drafts the Green
Book-aligned report section — with an assumptions annex the LLM generates from the
tool payload's shadow-price citations, and sensitivity ranges computed by re-calling
the tool at ±30% on the top proxies (mirroring the vc-impact §8.5 test) rather than
asserted.

**How.** Tier-2 stack: read-only tool schemas from the new endpoint; grounding corpus
is this Atlas page plus the shadow-price table's source documents embedded in
`llm_corpus_chunks`. The validator enforces that every £ value and ratio appears in a
tool response; deadweight/attribution judgements are flagged as analyst inputs, not
model outputs.

**Prerequisites (hard).** Evolution A end-to-end — drafting SROI statements from the
current random `socialRoi` field would put fabricated impact claims into stakeholder
reports; RBAC on portfolio data. **Acceptance:** each monetised line in a drafted
report traces to a tool call and cites a named shadow-price source; the sensitivity
annex derives from actual re-runs; asked for an SROI the engine hasn't computed, the
drafter refuses and lists required outcome inputs.