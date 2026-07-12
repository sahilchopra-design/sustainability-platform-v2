# PC Climate Pricing
**Module ID:** `pc-climate-pricing` · **Route:** `/pc-climate-pricing` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses preferred creditor climate financing terms across multilateral development banks and development finance institutions, benchmarking concessional spreads, tenor extensions, and climate co-benefits.

> **Business value:** Enables development finance practitioners and climate investors to compare preferred creditor climate financing terms, optimise blended finance structures, and maximise concessionality for climate projects.

**How an analyst works this module:**
- Map MDB and DFI loan terms: tenor, grace period, spread, co-financing requirements
- Compute NPV of project cash flows under preferred creditor terms vs market benchmark rate
- Calculate CI and grant equivalent for each financing instrument
- Benchmark across IBRD, IDA, ADB, AfDB, IADB, and bilateral DFIs by sector and country income group

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `KpiCard`, `PERILS`, `PERIL_COLORS`, `PERIL_DATA`, `REGIONS`, `REINSURANCE_AVAIL`, `SCENARIOS`, `SCEN_MULTS`, `Sparkline`, `TabBtn`, `ZONES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PERILS` | `['Hurricane/Typhoon','Flood','Wildfire','Earthquake','Hail','Drought','Extreme Heat','Freeze/Ice Storm','Subsidence','Tsunami Risk'];` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East','Africa','Oceania'];` |
| `PERIL_DATA` | `PERILS.map((p, pi) => ({` |
| `perilidx` | `Math.floor(sr(i * 13 + 1) * 10);` |
| `regionIdx` | `Math.floor(sr(i * 13 + 2) * 7);` |
| `premiumRate` | `+(sr(i * 13 + 3) * 0.06 + 0.008).toFixed(4);` |
| `expenseRatio` | `+(sr(i * 13 + 4) * 0.15 + 0.20).toFixed(3);` |
| `lossRatio` | `+(sr(i * 13 + 5) * 35 + 40).toFixed(1);` |
| `catLoading` | `+(sr(i * 13 + 6) * 0.08 + 0.02).toFixed(3);` |
| `combinedRatio` | `+(+lossRatio + expenseRatio * 100).toFixed(1);` |
| `expLoss` | `+(sr(i * 13 + 7) * 0.035 + 0.005).toFixed(4);` |
| `techRate` | `+(expLoss + catLoading + expenseRatio * 0.5 + 0.02).toFixed(4);` |
| `min` | `Math.min(...data), max = Math.max(...data), range = max - min \|\| 1;` |
| `pts` | `data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');` |
| `avgAdequacy` | `filtered.reduce((s, z) => s + z.adequacyRatio, 0) / Math.max(1, filtered.length);` |
| `avgCombined` | `filtered.reduce((s, z) => s + z.combinedRatio, 0) / Math.max(1, filtered.length);` |
| `avgROE` | `filtered.reduce((s, z) => s + z.returnOnEquity, 0) / Math.max(1, filtered.length);` |
| `totalExposure` | `filtered.reduce((s, z) => s + z.exposureUSD, 0);` |
| `avgLoss` | `filtered.reduce((s, z) => s + z.lossRatio, 0) / Math.max(1, filtered.length);` |
| `perilRateData` | `useMemo(() => PERIL_DATA.map((p, pi) => ({` |
| `correlationMatrix` | `useMemo(() => PERIL_DATA.map(p => p.correlation), []);` |
| `combinedTrend` | `useMemo(() => ZONES.slice(0, 20).map(z => ({` |
| `catLoad` | `p.climateLoading * SCEN_MULTS[scenIdx] * inputExposure * 1000;` |
| `techPremium` | `(expLoss + catLoad) / (1 - expRatio - profitLoad);` |
| `rolCalc` | `techPremium > 0 ? +(techPremium / (expLoss + catLoad)).toFixed(3) : 0;` |
| `minAdqRate` | `(expLoss + catLoad) > 0 ? +((expLoss + catLoad) / (inputExposure * 1000 * (1 - expRatio - profitLoad))).toFixed(4) : 0;` |
| `catLoadingData` | `useMemo(() => PERIL_DATA.map((p, pi) => ({` |
| `scenCompareData` | `useMemo(() => PERIL_DATA.map((p, pi) => ({` |
| `roeData` | `useMemo(() => [...filtered].sort((a,b) => b.returnOnEquity - a.returnOnEquity).slice(0,20).map(z => ({` |
| `avgPremium` | `filtered.reduce((s,z) => s + z.premiumRate, 0) / Math.max(1, filtered.length);` |
| `avgExpense` | `filtered.reduce((s,z) => s + z.expenseRatio * z.premiumRate, 0) / Math.max(1, filtered.length);` |
| `avgCat` | `filtered.reduce((s,z) => s + z.catLoadingPct * z.premiumRate, 0) / Math.max(1, filtered.length);` |
| `profit` | `avgPremium - avgLoss - avgExpense - avgCat;` |
| `load` | `+(p.climateLoading * SCEN_MULTS[scenIdx]).toFixed(4);` |
| `total` | `+(p.baseRate + load).toFixed(4);` |
| `rol` | `p.lossRatio > 0 ? +(total / (p.lossRatio / 100)).toFixed(3) : 0;` |
| `intensity` | `Math.round(v * 200);` |
| `avgAdq` | `+(pZones.reduce((s, z) => s + z.adequacyRatio, 0) / Math.max(1, pZones.length)).toFixed(1);` |
| `avgLR` | `+(pZones.reduce((s, z) => s + z.lossRatio, 0) / Math.max(1, pZones.length)).toFixed(1);` |
| `avgCR` | `+(pZones.reduce((s, z) => s + z.combinedRatio, 0) / Math.max(1, pZones.length)).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PERILS`, `PERIL_COLORS`, `REGIONS`, `REINSURANCE_AVAIL`, `SCENARIOS`, `SCEN_MULTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MDB Climate Finance (2022) | — | Joint MDB Climate Finance Report 2022 | Total climate finance mobilised by multilateral development banks globally in 2022 across mitigation and adaptation. |
| Typical PC Spread vs Market | — | OECD DAC 2023 | Typical spread benefit (concessionality) for preferred creditor climate loans relative to market-rate sovereign financing. |
- **MDB annual reports, loan term sheets, OECD DAC aid statistics, Bloomberg fixed income data** → Term mapping, NPV calculation, CI computation, cross-institution benchmarking → **Concessionality dashboards, MDB term benchmarks, blended finance structure analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Concessionality Index
**Headline formula:** `CI = 1 – (NPV(ProjectTerms) / NPV(MarketTerms))`

Measures the discount provided relative to market terms; higher CI indicates greater concessionality and effective subsidy for climate projects.

**Standards:** ['OECD DAC Concessionality Measurement', 'World Bank MDB Climate Finance Tracking 2023']
**Reference documents:** Joint MDB Climate Finance Tracking Report 2022; OECD DAC Concessionality Measurement Guidance 2018; GCF Accreditation and Financing Policy; World Bank Blended Finance Guidance Note 2019

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Resolve the identity crisis, then ground the P&C pricing engine (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is a wholesale mislabel: the guide describes a preferred-creditor concessional development-finance tool (Concessionality Index `CI = 1 − NPV(ProjectTerms)/NPV(MarketTerms)`, MDB/DFI benchmarking), but the code is a P&C climate-peril *insurance pricing* engine — loss ratios, expense ratios, cat loading, technical rate, rate-on-line, combined ratio across 10 perils × 7 regions, with the actuarial decomposition correctly built. The seed datasets (`PERILS`, `REINSURANCE_AVAIL`) confirm it's an insurance tool. Evolution A picks the module's true identity and grounds the actuarial engine.

**How.** (1) Decide the module's real identity — the code is a P&C climate-pricing engine; either rename it to match (and let a genuine concessionality tool live elsewhere) or, if the concessionality tool is the intent, §8 specifies it and this becomes a fresh build. Assuming the P&C engine stays: (2) ground the seeded actuarial inputs (`premiumRate` 0.8–6.8%, `lossRatio` 40–75%, `catLoading` 2–10%) in real peril-region loss data — the platform's NatCat/digital-twin hazard grids give cat-loading a real basis, and reinsurance availability can key to real market conditions. (3) The technical-rate decomposition (`expLoss + catLoading + expenseRatio×0.5`) is correct; feed it sourced expected-loss estimates so ROL and combined ratio are defensible.

**Prerequisites.** An identity/naming decision (the atlas mislabel misleads users and any copilot); real peril-region loss data for the cat-loading; documenting the pricing model per Atlas §8. Remove `sr()` from rate inputs. **Acceptance:** the module name matches its actual function; technical rate and combined ratio derive from sourced loss data; cat loading ties to real hazard exposure.

### 9.2 Evolution B — Climate-peril underwriting copilot (LLM tier 2)

**What.** Assuming the P&C identity: a copilot for insurance underwriters answering "what's the technical rate for wind cover in this region?", "how does the combined ratio change if I raise the cat load?", "what's the rate-on-line and is it profitable?" — executed against the actuarial engine, decomposing the technical rate into expected-loss, cat-loading, and expense components.

**How.** Tool calls to endpoints wrapping the rate decomposition (`technicalRate`, `ROL`, `combinedRatio`, `profit`); system prompt from this Atlas page's §5/§7.1 actuarial formulas and the (corrected) insurance references — critically, the system prompt must reflect the module's *actual* P&C function, not the guide's development-finance description, or the copilot will misrepresent it entirely. Sensitivity questions (cat load, expense ratio) are recomputations; fabrication validator matches every ratio and rate to a tool response. The copilot must convey these are technical/pure-premium rates, not bound quotes.

**Prerequisites (hard).** Evolution A's identity resolution — a copilot built on the current guide description would tell users this is a concessionality calculator when it prices insurance, the most damaging possible misrepresentation. **Acceptance:** the copilot's self-description matches the P&C engine; every rate/ratio traces to a tool call; sensitivity behaves monotonically; no development-finance framing leaks in.