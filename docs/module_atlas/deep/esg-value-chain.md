## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *GHG Protocol Scope 3
> value-chain accounting* engine (`VCE = w_up·Upstream + w_ops·Operations + w_dn·Downstream`, Cat.1
> spend-weighted supplier emissions, Cat.11 use-phase, CSDDD due diligence). **The code implements
> something different**: a **4-level provenance ESG-risk cascade** (Country → Region → Company →
> Source) for 25 physical commodities, a hand-coded 10-tree "random forest" risk predictor, and
> supply-chain-tier tables. There are no Scope 3 emission categories, no spend-weighting, no tCO₂e.
> Country governance data is real; commodity/level scores are synthetic. Documented below as coded.

### 7.1 What the module computes

The core object is the **weighted value-chain ESG risk score** per commodity:

```
weighted = round(0.20·countryESG + 0.15·regionESG + 0.35·companyESG + 0.30·sourceESG)
```

matching `VALUE_CHAIN_LEVELS[].weight` (Country 0.20, Region 0.15, Company 0.35, Source 0.30). Each of
the four level scores is drawn from the seeded PRNG in `genCommodityData(i)`:

```js
base       = ci·17 + 3
countryESG = round(seed(base)   ·40 + 35)     // 35–75
regionESG  = round(seed(base+1) ·45 + 25)     // 25–70
companyESG = round(seed(base+2) ·35 + 45)     // 45–80
sourceESG  = round(seed(base+3) ·50 + 20)     // 20–70
```

Higher = higher *risk* (heatmap thresholds: >70 red, 45–70 amber, else green). Sub-indicators
(`childLaborRisk`, `livingWage`, `certCoverage`, `traceability`, `communityImpact`, `fpicCompliance`,
`grievanceMechanism`) are likewise seeded off `base + k`.

### 7.2 Parameterisation & data provenance

| Table | Rows | Provenance |
|---|---|---|
| `VALUE_CHAIN_LEVELS` weights | 4 | Hard-coded (0.20/0.15/0.35/0.30) — company-heavy, editorial judgement, **no cited source** |
| `COUNTRY_GOV_DB` | 41 | **Real public data**: Transparency International CPI, World Bank WGI (governance/rule-of-law/regulatory/voice), UNDP HDI, World Bank Gini, ITUC labour-rights (1–5+), RSF press-freedom, ILO conventions ratified |
| `REGIONAL_RISK_PROFILES` | 21 | Named real mining/agri regions (Pilbara, Atacama, Katanga, Cerrado, Borneo, W.Africa cocoa…); scalar risk fields (waterStress, deforestation, conflictRisk 0–100) are editorial/synthetic estimates |
| `CERTIFICATION_DB` | 16 | Real schemes (FSC, MSC, RSPO, FairTrade, BCI, ASI, SA8000…) with real founding years/auditors; `coverage_pct` is illustrative |
| `HUMAN_RIGHTS_RISKS` | 14 | Real risk narratives + real ILO convention codes (C138/C182 child labour, C029/C105 forced labour, C169 indigenous) |
| Commodity level scores | 25×4 | **Synthetic** `seed()` PRNG |
| `ILO_DECENT_WORK`, `SUPPLY_CHAIN_TIERS` | 20 / 15 | **Synthetic** `seed()` PRNG (employment, informality, tier counts, audit rates) |

### 7.3 The "Random Forest" risk predictor

`predictValueChainRisk` averages 10 `decisionTree` calls. Each tree is a **fixed 6-rule additive
stump**, not a trained tree — the "learning" is faked by seeding split thresholds:

```js
threshold(idx) = 30 + seed(treeSeed·7 + idx)·40      // 30–70
score starts at 50, then:
 cpi < thr(0)        ? +12 : −8      // low corruption-perception → higher risk
 waterStress > thr(1)? +10 : −5
 companyESG > thr(2) ? −15 : +10
 certCov > thr(3)    ? −12 : +8
 laborRights > 3     ? +8  : −4      // ITUC 4–5 = systematic violations
 hdi < 0.6           ? +6  : −3
 + (seed(treeSeed·3+99) − 0.5)·10    // jitter
clamp 0–100
```

The 10 trees differ only by `treeSeed`, which reshuffles thresholds and jitter — so the ensemble is a
smoothed version of one rule-set, not a variance-reducing bagged forest. Direction of every rule is
plausible (worse governance/water/labour → higher risk) but weights are unjustified constants.

### 7.4 Worked example (commodity index ci = 1 → "Cobalt")

| Step | Computation | Result |
|---|---|---|
| base | 1·17 + 3 | 20 |
| seed(20) | frac(sin(21)·10⁴) | ≈ 0.6435 |
| countryESG | round(0.6435·40 + 35) | 61 |
| seed(21) → regionESG | round(seed(21)·45+25) | ≈ 27 |
| seed(22) → companyESG | round(seed(22)·35+45) | ≈ 63 |
| seed(23) → sourceESG | round(seed(23)·50+20) | ≈ 55 |
| weighted | 0.20·61 + 0.15·27 + 0.35·63 + 0.30·55 | **round(54.8) = 55** |

A commodity weighted score of 55 lands in the amber band. (Values approximate — exact seeds depend on
`sin` precision; the point is the deterministic pipeline.)

ML-tab example, sliders `cpi=45, waterStress=55, companyESG=60, certCov=40, laborRights=3, hdi=0.65`:
each tree starts 50; with `cpi 45 < thr(0)~50 → +12`, `companyESG 60 > thr(2) → −15`, etc., averaging
~10 trees yields a portfolio risk in the mid-40s to 50s depending on threshold seeds.

### 7.5 Portfolio integration

`readPortfolio()` reads `ra_portfolio_v1` from localStorage and joins holdings to
`GLOBAL_COMPANY_MASTER` by ISIN (falling back to `demoHoldings()` — 20 companies with `scope1_mt > 0`).
`portfolioExposure` maps each holding's GICS sector to linked commodities and averages their `weighted`
risk — the one place real portfolio data touches the module. It carries exposure only; no emissions.

### 7.6 Data provenance & limitations

- **Commodity, region-scalar, ILO-decent-work, and supply-tier scores are synthetic**
  (`seed(s)=frac(sin(s+1)·10⁴)`). Only the country governance table, certification metadata, and
  human-rights narratives are grounded in real public sources.
- **The "random forest" is not trained**; it is a seeded rule ensemble — no model file, no fit, no
  feature importances. Presenting it as ML overstates rigour.
- **No Scope 3 accounting** despite the guide: no tCO₂e, no spend-weighting, no Cat.1/11/12 — the
  module is a *social/governance provenance-risk* tool, not a GHG value-chain calculator.
- Level weights (esp. Company 0.35) are unsourced editorial choices.

**Framework alignment:** Country layer operationalises **World Bank WGI** + **Transparency
International CPI** + **UNDP HDI** as a sovereign-risk proxy (WGI aggregates hundreds of underlying
governance indicators into a −2.5…+2.5 z-score per dimension; CPI 0–100 aggregates 13 expert/business
corruption surveys). Human-rights layer maps to specific **ILO conventions** (C138/C182 child labour,
C029/C105 forced labour, C169 indigenous peoples). Certification layer references real **FSC/MSC/RSPO/
FairTrade/SA8000** schemes. The intended-but-absent frameworks are **GHG Protocol Scope 3** and **EU
CSDDD** value-chain due diligence.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The weighted risk score and the "random
forest" both rest on `seed()` synthetic inputs; a production value-chain ESG-risk model would ingest
real supplier/geolocation data.

**8.1 Purpose & scope.** Produce a defensible commodity- and supplier-level ESG/human-rights risk
score across the provenance chain (sovereign → sub-national → company → source site) to prioritise
CSDDD/UNGP due diligence and supplier engagement.

**8.2 Conceptual approach.** A hierarchical risk-aggregation model in the tradition of **EcoVadis IQ**
(spend × country × sector risk mapping), **Sourcemap/Trase** (commodity flow tracing), and the **UN
Guiding Principles / OECD Due Diligence Guidance** severity×likelihood framing. Country and region
layers use published composite indices; company and source layers use assessed evidence, not PRNG.

**8.3 Mathematical specification.**

```
Risk_commodity = Σ_L w_L · RiskLevel_L,   L ∈ {country, region, company, source}
RiskLevel_country = f(CPI, WGI_composite, HDI, ITUC_labour, ILO_ratifications)  (published)
RiskLevel_region  = g(WRI Aqueduct water stress, GFW deforestation, ACLED conflict, indigenous overlap)
RiskLevel_company = h(assessed ESG score, controversies, cert coverage, audit results)
RiskLevel_source  = k(audited labour findings, living-wage gap, traceability %, FPIC status)
Priority = Severity × Likelihood × Leverage⁻¹   (UNGP salience)
```

| Parameter | Source |
|---|---|
| CPI, WGI, HDI, ITUC | Transparency Intl / World Bank / UNDP / ITUC (already in `COUNTRY_GOV_DB`) |
| Water stress | WRI Aqueduct 4.0 |
| Deforestation | Global Forest Watch / Hansen |
| Conflict | ACLED / Uppsala UCDP |
| Level weights w_L | Calibrated to observed incident frequency, not fixed 0.35 editorial |

**8.4 Data requirements.** Supplier master with country/region/site geocodes; procurement spend by
supplier (for spend-weighting, absent today); certification registry pulls (FSC/RSPO/FairTrade APIs);
audit findings (Sedex/EcoVadis). Platform already holds `GLOBAL_COMPANY_MASTER`, the country DB, and
localStorage portfolio.

**8.5 Validation & benchmarking plan.** Backtest country/region layer against realised human-rights
incidents (Business & Human Rights Resource Centre database); reconcile company scores against
EcoVadis/Sustainalytics where issuers overlap; sensitivity of `weighted` to layer weights.

**8.6 Limitations & model risk.** Sparse source-site data forces proxying from region layer —
document proxy share explicitly (analogous to PCAF data-quality scoring). Composite indices lag
real-time events by 1–2 years; supplement with ACLED/GFW near-real-time feeds. Conservative fallback:
default an unassessed source site to its region's risk plus a proxy penalty.
