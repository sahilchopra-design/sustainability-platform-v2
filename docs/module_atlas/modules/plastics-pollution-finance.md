# Plastics Pollution Finance Analytics
**Module ID:** `plastics-pollution-finance` · **Route:** `/plastics-pollution-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL3 · **Sprint:** DL

## 1 · Overview
Analyses the financial risks and opportunities from the global transition away from single-use plastics. Models regulatory exposure from UN Plastics Treaty, petrochemical feedstock demand destruction, recycling infrastructure investment economics, and plastic credit market development.

> **Business value:** Essential for plastics-exposed consumer goods investors, petrochemical equity analysts, and waste management infrastructure funds. Provides UN Plastics Treaty regulatory scenario analysis and plastic credit economics for corporate waste reduction programmes aligned with Verra PWRP.

**How an analyst works this module:**
- Assess company plastics exposure by product/sector
- Model UN Plastics Treaty regulatory scenarios
- Calculate plastic credit revenue from waste collection programmes
- Analyse petrochemical demand destruction timeline
- Generate WWF/OECD-aligned plastics risk disclosure

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `REG_RISK_TIERS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `regulatoryRisk` | `Math.round(1 + sr(i * 5) * 9);` |
| `transitionScore` | `Math.round(20 + sr(i * 13) * 75);` |
| `TABS` | `['Company Overview','Production Profile','Recycled Content','Single-Use Risk','EPR Compliance','Ocean Plastic Exposure','Regulatory Risk','Transition Scoring'];` |
| `totalProduction` | `filtered.reduce((s, c) => s + c.plasticProduction, 0);` |
| `avgRecycled` | `(filtered.reduce((s, c) => s + c.recycledContent, 0) / n).toFixed(1);` |
| `avgRegRisk` | `(filtered.reduce((s, c) => s + c.regulatoryRisk, 0) / n).toFixed(1);` |
| `avgTransition` | `(filtered.reduce((s, c) => s + c.transitionScore, 0) / n).toFixed(1);` |
| `taxExposure` | `((filtered.reduce((s, c) => s + c.plasticTax * c.plasticProduction, 0)) / 1e6).toFixed(0);` |
| `typeBarData` | `TYPES.map(t => {` |
| `countryRiskData` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.recycledContent, y: c.transitionScore, name: c.name }));` |
| `typeEPRData` | `TYPES.map(t => {` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REG_RISK_TIERS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Plastic Production | — | OECD Global Plastics Outlook 2022 | Global plastic production 400 Mt/yr — projected to triple by 2060 without policy intervention |
| Plastic Waste Mismanaged | — | OECD 2022 | 37% of plastic waste is mismanaged (littered or inadequately disposed) — primary source of ocean plastic pollution |
| UN Plastics Treaty 2025 | — | UNEP INC Plastics Treaty Process 2024 | 175 countries negotiating binding global plastics treaty by 2025 — potential to ban or cap plastic production |
- **Company plastic use and packaging data** → Regulatory exposure modelling → **Revenue at risk from plastic bans and EPR fees**
- **Plastic credit market prices (Verra PWRP)** → Credit revenue modelling → **Revenue from plastic waste collection programmes**
- **Petrochemical demand scenarios (IEA/OECD)** → Demand destruction analysis → **Petrochemical feedstock demand under plastics treaty scenarios**

## 5 · Intermediate Transformation Logic
**Methodology:** Plastics Transition Financial Risk
**Headline formula:** `PlasticRisk = RegRisk + DemandDestructionRisk + LitigationRisk + ReputationRisk; RecyclingNPV = Σ [(RecyclateRevenue + PlasticCredit - CollectionCost - ProcessingCost) / (1+r)^t]`

Regulatory risk from country-specific single-use plastic bans; demand destruction from petrochemical feedstock; recycling NPV from growing plastic credit markets including Verra PWRP

**Standards:** ['UN Intergovernmental Negotiating Committee (INC) Plastics Treaty 2025', 'OECD Global Plastics Outlook 2022', 'Verra Plastic Waste Reduction Program (PWRP)', 'WWF Plastic Pollution Business Impact Assessment']
**Reference documents:** OECD Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options (2022); UNEP Intergovernmental Negotiating Committee on Plastic Pollution (INC process 2022–2025); Verra Plastic Waste Reduction Program (PWRP) Methodology; WWF Plastic Pollution Impacts on Business and Finance (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a *Plastics Transition Financial
> Risk* model — `PlasticRisk = RegRisk + DemandDestructionRisk + LitigationRisk + ReputationRisk`
> and a discounted `RecyclingNPV` with Verra PWRP plastic-credit revenue. **None of that composite
> risk score or NPV engine exists in the code.** The page generates 80 synthetic companies with
> independent seeded attributes and displays simple filtered averages/sums. There is no litigation
> term, no reputation term, no demand-destruction curve, and no cash-flow discounting. Sections below
> document the code as written; §8 specifies the model the guide describes.

### 7.1 What the module computes

For 80 synthetic plastics-value-chain companies (`Producer / Converter / Recycler / Brand / Retailer`),
each carries independently seeded attributes. The dashboard then computes filtered descriptive
aggregates only:

```js
totalProduction = Σ c.plasticProduction                       // kt/yr
avgRecycled     = Σ c.recycledContent / n                     // %
avgRegRisk      = Σ c.regulatoryRisk / n                      // 1–10
avgTransition   = Σ c.transitionScore / n                     // 0–100
taxExposure     = Σ (c.plasticTax × c.plasticProduction) / 1e6 // $M  (tax $/t × kt)
gapToTarget     = count(c.recycledContent < recycledTarget)
```

`taxExposure` is the only expression that multiplies two attributes; everything else is a mean or a
count. `regTier` buckets `regulatoryRisk` into Low (≤3) / Medium (≤6) / High.

### 7.2 Parameterisation / seed rubric

| Attribute | Formula | Range | Provenance |
|---|---|---|---|
| `regulatoryRisk` | `round(1 + sr(i·5)·9)` | 1–10 | synthetic demo value |
| `transitionScore` | `round(20 + sr(i·13)·75)` | 20–95 | synthetic demo value |
| `plasticProduction` | `round(10 + sr(i·3)·990)` | 10–1000 kt/yr | synthetic demo value |
| `recycledContent` | `round(5 + sr(i·19)·60)` | 5–65 % | synthetic; cf. EU PPWR 30% PCR by 2030 |
| `singleUsePlastic` | `round(10 + sr(i·23)·70)` | 10–80 % | synthetic demo value |
| `plasticTax` | `sr(i·29)>0.3 ? 100+sr(i·31)·400 : 0` | 0 or 100–500 $/t | synthetic demo value |
| `oceanPlasticExposure` | `1 + sr(i·41)·9` | 1–10 | synthetic demo value |
| `plasticCredits` | `sr(i·53)>0.4 ? 1+sr(i·59)·49 : 0` | 0–50 | synthetic; nominally Verra PWRP units |

All attributes are drawn from independent `sr()` streams, so there is **no correlation** between,
say, `recycledContent` and `transitionScore` — a recycler can score low on transition and vice
versa. The scatter plot (`recycledContent` vs `transitionScore`) therefore shows noise, not signal.

### 7.3 Calculation walkthrough

1. `COMPANIES` array is built once at module load from the seeded PRNG.
2. `filtered` applies the Type / Country / Reg-Risk-tier dropdown filters.
3. `n = max(1, filtered.length)` guards division.
4. KPI cards read the five aggregates in §7.1.
5. Chart series (`typeBarData`, `countryRiskData`, `typeEPRData`) group `filtered` by type/country
   and take sums or means; `.filter(d => d.value>0)` drops empty groups.
6. The `plasticTax` and `recycledTarget` sliders re-scope the `taxExposure` display and
   `gapToTarget` count but do **not** feed any risk score.

### 7.4 Worked example

Two companies pass the filter: A (`plasticTax=300`, `production=400`), B (`plasticTax=0`,
`production=200`), with `recycledContent` 25 % and 55 %, `regulatoryRisk` 8 and 4.

| Output | Computation | Result |
|---|---|---|
| totalProduction | 400 + 200 | 600 kt/yr |
| avgRecycled | (25 + 55)/2 | 40.0 % |
| avgRegRisk | (8 + 4)/2 | 6.0 /10 |
| taxExposure | (300·400 + 0·200)/1e6 | $0.12 M |
| gapToTarget (target 30%) | A 25<30 → 1; B 55≥30 | 1 company |

Note the tax-exposure unit: 300 $/t × 400 kt = 120 000 $·kt, divided by 1e6 → 0.12 (labelled "$M").
The kt→t implied scaling is absorbed silently into the ÷1e6, so the headline is dimensionally loose.

### 7.5 Data provenance & limitations

- **All 80 companies are synthetic**, generated by the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`
  — deterministic across renders but not real issuers. Company names are template concatenations.
- No time dimension: no demand-destruction pathway, no treaty-scenario toggle, no NPV discounting.
  The UN Plastics Treaty, OECD 400 Mt figure, and Verra PWRP appear only as guide prose, not in code.
- Regulatory risk is a scalar 1–10 draw, not derived from any jurisdiction ban database.

**Framework alignment:** OECD *Global Plastics Outlook* (2022) — referenced for the 400 Mt/37 %
mismanaged figures, not computed here · UNEP INC Plastics Treaty (2022–2025) — named as the
regulatory driver but not modelled as a scenario · Verra *Plastic Waste Reduction Program* (PWRP) —
the `plasticCredits` field nominally counts PWRP-verified plastic-collection credits (Verra issues
1 credit per tonne of plastic collected/recycled against an approved baseline), but no credit price
or revenue is computed · EU SUP Directive / PPWR — the 30 % PCR-by-2030 mandate is the implicit
benchmark behind `recycledContent`, not enforced in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Quantify, per plastics-exposed issuer, (a) a forward transition-risk score and (b) the NPV of a
plastic-credit / recycling programme, so consumer-goods and petrochemical equity analysts and
waste-infrastructure funds can price UN-Plastics-Treaty exposure. Coverage: listed producers,
converters, brands, recyclers with plastic tonnage and packaging data.

### 8.2 Conceptual approach
A **regulatory-cost pass-through** model (mirroring Trucost/S&P natural-capital cost-internalisation
and the carbon-price-shock structure of MSCI Climate VaR) combined with a **discounted-cashflow
credit-revenue** module (mirroring Verra PWRP project economics and the platform's own carbon-credit
NPV engines). Risk is the present value of policy-driven cost internalisation; opportunity is the
PV of avoided tax plus credit revenue from recycled feedstock.

### 8.3 Mathematical specification
Transition risk (0–100), scenario `s` ∈ {Treaty-Ambitious, Treaty-Moderate, Fragmented}:
```
RegCost_t   = SUP_share × Production_t × BanCoverage_s,t × TaxRate_s,t
DemandDest_t= FeedstockVol_t × (1 − ElasticitySubst_s,t)      # petrochemical demand loss
Litigation  = OceanExposure × LitigationFreq_s × AvgSettlement
PlasticRisk = w_R·norm(ΣRegCost) + w_D·norm(ΣDemandDest)
              + w_L·norm(Litigation) + w_Rep·ReputationIdx
RecyclingNPV= Σ_t [(RecyclateRev_t + CreditPrice_t·Credits_t
              − CollectionCost_t − ProcessingCost_t)/(1+r)^t]  − Capex_0
```
with `norm(·)` a 0–1 min-max over the universe and Σw = 1.

| Parameter | Value / source |
|---|---|
| `BanCoverage_s,t` | share of SUP categories banned by year; UNEP INC treaty text / EU SUP Directive Annex |
| `TaxRate_s,t` | EPR fee + plastic tax; EU Plastic Own-Resource €800/t, UK Plastic Packaging Tax £217/t |
| `ElasticitySubst` | petrochemical demand elasticity; IEA *The Future of Petrochemicals* |
| `AvgSettlement` | plastics-litigation settlement distribution; proxy from environmental-tort case data |
| `CreditPrice_t` | Verra PWRP secondary price; Ecosystem Marketplace plastic-credit tracker |
| `r` | issuer WACC; reference_data or CAPM build-up |
| `w_R,w_D,w_L,w_Rep` | 0.35/0.30/0.20/0.15 default; expert-calibrated, sensitivity-tested |

### 8.4 Data requirements
Fields: `plastic_tonnage`, `sup_share`, `pcr_content`, `feedstock_volume`, `packaging_mix`,
`jurisdiction`, `ocean_exposure_index`, `recycling_capacity`, `wacc`. Sources: company packaging
disclosures + CDP; OECD plastics database; Verra registry (credit prices); EU/UK tax schedules.
Platform assets already carry sector, region and WACC proxies in `reference_data`.

### 8.5 Validation & benchmarking plan
Backtest `taxExposure` against issuers already paying UK Plastic Packaging Tax (disclosed in
annual reports). Sensitivity-test `PlasticRisk` weights (±0.1) and treaty-scenario coverage curves.
Reconcile `RecyclingNPV` against published PWRP project pro-formas and against the platform's
carbon-credit NPV engine on shared discounting logic.

### 8.6 Limitations & model risk
Treaty text is unratified — `BanCoverage` is scenario-conditional and highly uncertain; litigation
frequency is thin-tailed and hard to calibrate; plastic-credit markets are nascent and illiquid, so
`CreditPrice` carries wide confidence bands. Conservative fallback: report RegCost and RecyclingNPV
as ranges across the three scenarios rather than a single point estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Build the composite risk score and recycling NPV (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises `PlasticRisk = RegRisk + DemandDestructionRisk + LitigationRisk + ReputationRisk` and a discounted `RecyclingNPV` with Verra PWRP credit revenue, but neither exists — 80 synthetic companies carry independent seeded attributes, and the dashboard shows only filtered means/counts. The one real expression is `taxExposure = Σ(plasticTax × plasticProduction)`. There is no litigation term, no demand-destruction curve, no discounting. Evolution A builds the two documented models.

**How.** (1) Implement the composite `PlasticRisk` as the sum of four real sub-scores: regulatory risk from country-specific single-use-plastic bans (the `COUNTRIES` table + UN Plastics Treaty INC scenarios named in §5), demand-destruction from petrochemical-feedstock exposure by product type, litigation risk from a controversy/legal-exposure indicator, and reputation risk — each grounded, not seeded. (2) Implement `RecyclingNPV` as a real discounted cash flow: `Σ (RecyclateRevenue + PlasticCredit − CollectionCost − ProcessingCost)/(1+r)^t` with Verra PWRP credit revenue (the sibling `plastic-credits-epr-finance` module has the credit-price data — share it). (3) Company plastics exposure by product/sector (§1) from real disclosure or sector-average data.

**Prerequisites.** Company plastics-exposure data (sourced or analyst-entered); UN Plastics Treaty scenario definitions; shared plastic-credit pricing with the EPR-finance module. Remove `sr()` from the risk attributes. **Acceptance:** `PlasticRisk` decomposes into four named sub-scores; `RecyclingNPV` discounts real cash flows; a company's risk responds to its actual product mix and jurisdiction.

### 9.2 Evolution B — Plastics-transition-risk copilot (LLM tier 1 → 2, scoped honestly)

**What.** Near-term, a guidance copilot grounded in the OECD Global Plastics Outlook, UN Plastics Treaty INC process, and WWF references named in §5: "how will the UN Plastics Treaty affect single-use producers?", "what's the demand-destruction outlook for virgin petrochemicals?", "how does recycling NPV work with plastic credits?" It must not quantify a company's plastic risk until Evolution A exists, since the current 80-company table is seeded.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot explains treaty scenarios, demand-destruction dynamics, and recycling economics with citations. System prompt encodes the honest current state so it refuses "score this company's plastic transition risk" with a pointer to the (post-Evolution-A) risk engine. Tier 2 with Evolution A: tool calls to the `PlasticRisk` composite and `RecyclingNPV` engines, with the fabrication validator matching every score/NPV to outputs and the four risk sub-scores surfaced for auditability. The WWF/OECD-aligned disclosure (§1) drafts from the computed risk decomposition.

**Prerequisites.** Standards ingestion; explicit current-state statement. Company scoring gated on Evolution A. **Acceptance:** framework answers cite named references; risk scores/NPVs (post-Evolution-A) trace to tool calls with the four-term decomposition; the copilot refuses to score companies from the current seeded data.