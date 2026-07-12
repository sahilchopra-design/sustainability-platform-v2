# ESG Value Chain
**Module ID:** `esg-value-chain` · **Route:** `/esg-value-chain` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Maps and analyses ESG performance across the full corporate value chain including upstream suppliers, direct operations, and downstream customers and end-of-life. Integrates supply chain mapping, Scope 3 emissions by category, supplier ESG assessments, and customer product impact data. Supports GHG Protocol Scope 3 Category 1 and 11 reporting, CSDDD due diligence obligations, and extended producer responsibility analytics.

> **Business value:** Provides corporate sustainability teams and procurement functions with a systematic framework for mapping, measuring, and improving ESG performance across the entire value chain, enabling credible Scope 3 reporting, CSDDD compliance, and supplier engagement programmes.

**How an analyst works this module:**
- Import supply chain map with Tier 1 and key Tier 2 suppliers and annual spend data by category.
- Run Scope 3 Category 1 calculation using supplier primary data or spend-based proxies; review coverage gaps.
- Distribute supplier ESG assessment questionnaire and track completion rate; escalate non-respondents.
- Generate CSDDD adverse impact report, Scope 3 inventory, and value chain ESG scorecard for annual sustainability report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DATA`, `Btn`, `CERTIFICATION_DB`, `CERT_CODES`, `COMMODITIES`, `COUNTRY_GOV_DB`, `HUMAN_RIGHTS_RISKS`, `HeatCell`, `ILO_DECENT_WORK`, `KPI`, `REGIONAL_RISK_PROFILES`, `SUPPLY_CHAIN_TIERS`, `Sec`, `VALUE_CHAIN_LEVELS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `VALUE_CHAIN_LEVELS` | 5 | `name`, `icon`, `description`, `metrics`, `weight` |
| `CERTIFICATION_DB` | 16 | `name`, `scope`, `criteria`, `coverage_pct`, `credibility`, `year`, `auditor`, `commodities` |
| `COUNTRY_GOV_DB` | 41 | `name`, `cpi`, `wgi_gov`, `wgi_rule`, `wgi_reg`, `wgi_voice`, `hdi`, `gini`, `labor_rights`, `press_freedom`, `ilo_conventions`, `decent_work`, `region` |
| `REGIONAL_RISK_PROFILES` | 21 | `name`, `type`, `country`, `commodities`, `waterStress`, `bioIntactness`, `conflictRisk`, `indigenousRisk`, `deforestation`, `aqi`, `enforcement`, `desc` |
| `HUMAN_RIGHTS_RISKS` | 15 | `country`, `risk`, `severity`, `ilo_conventions`, `remediation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `CERT_CODES` | `CERTIFICATION_DB.map(c => c.code);` |
| `base` | `ci * 17 + 3;` |
| `countryESG` | `Math.round(seed(base) * 40 + 35);` |
| `regionESG` | `Math.round(seed(base + 1) * 45 + 25);` |
| `companyESG` | `Math.round(seed(base + 2) * 35 + 45);` |
| `sourceESG` | `Math.round(seed(base + 3) * 50 + 20);` |
| `childLaborRisk` | `Math.round(seed(base + 4) * 60 + 5);` |
| `livingWage` | `Math.round(seed(base + 5) * 50 + 30);` |
| `certCoverage` | `Math.round(seed(base + 6) * 55 + 15);` |
| `traceability` | `Math.round(seed(base + 7) * 60 + 20);` |
| `certs` | `CERT_CODES.filter((_, j) => seed(base + 10 + j) > 0.55);` |
| `ALL_DATA` | `COMMODITIES.map((name, i) => ({ name, ...genCommodityData(i) }));` |
| `ILO_DECENT_WORK` | `COUNTRY_GOV_DB.slice(0, 20).map((c, i) => ({` |
| `SUPPLY_CHAIN_TIERS` | `COMMODITIES.slice(0, 15).map((name, i) => ({` |
| `threshold` | `(idx) => 30 + seed(treeSeed * 7 + idx) * 40;` |
| `trees` | `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => decisionTree(features, t));` |
| `holdings` | `p.holdings.map(h => {` |
| `ratio` | `value / max;` |
| `mlPrediction` | `useMemo(() => predictValueChainRisk({ cpi: mlCpi, waterStress: mlWater, companyESG: mlCompESG, certCov: mlCert, laborRights: mlLabor, hdi: mlHdi }), [mlCpi, mlWater, mlCompESG, mlCert, mlLabor, mlHdi]);  const levelData = VALUE_CHAIN_LEVELS.map(lv => ({ name: lv.name, score: lv.level === 1 ? cd.countryESG : lv.level === 2 ? cd.regionESG :` |
| `avgESG` | `Math.round(ALL_DATA.reduce((s, d) => s + d.weighted, 0) / ALL_DATA.length);` |
| `highestRisk` | `ALL_DATA.reduce((m, d) => d.weighted > m.weighted ? d : m, ALL_DATA[0]);` |
| `avgChildLabor` | `Math.round(ALL_DATA.reduce((s, d) => s + d.childLaborRisk, 0) / ALL_DATA.length);` |
| `avgLivingWage` | `Math.round(ALL_DATA.reduce((s, d) => s + d.livingWage, 0) / ALL_DATA.length);` |
| `avgCert` | `Math.round(ALL_DATA.reduce((s, d) => s + d.certCoverage, 0) / ALL_DATA.length);` |
| `portfolioExposure` | `useMemo(() => { return portfolio.slice(0, 15).map(h => { const sector = h.company?.gics_sector \|\| 'Materials';` |
| `avgRisk` | `linkedCommodities.reduce((s, c) => {` |
| `improvements` | `COMMODITIES.slice(0, 15).map((name, i) => {` |
| `TABS` | `['overview', 'deep-dive', 'countries', 'certifications', 'portfolio', 'ml'];` |
| `controversies` | `Math.round(seed(bs + 1) * 8);` |
| `auditScore` | `Math.round(seed(bs + 2) * 40 + 50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTIFICATION_DB`, `COMMODITIES`, `COUNTRY_GOV_DB`, `HUMAN_RIGHTS_RISKS`, `REGIONAL_RISK_PROFILES`, `TABS`, `VALUE_CHAIN_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 3 Cat.1 Coverage (%) | — | GHG Protocol | Proportion of purchased goods and services spend with primary supplier emission data; below 40% requires sector average proxies. |
| Supplier ESG Assessment Rate (%) | — | CSDDD / CDP Supply Chain | Proportion of Tier 1 suppliers with completed ESG assessment; CSDDD mandates risk-based due diligence across supply chain. |
| Value Chain Scope 3 (tCO2e) | — | GHG Protocol Scope 3 Standard | Total Scope 3 emissions across all 15 categories; typically 70â€“90% of total corporate GHG footprint in consumer sectors. |
| Supplier ESG Score (0â€“100) | — | Supplier Assessment Tool | Aggregated ESG score of rated Tier 1 suppliers weighted by procurement spend; tracks supply chain ESG improvement over time. |
- **Supply chain database (ERP / procurement system)** → Extract Tier 1 and Tier 2 supplier spend by UNSPSC category and country of origin → **Supplier spend map with category and geography for Scope 3 Cat.1 input**
- **Supplier ESG assessment responses** → Score against framework (EcoVadis/Sedex/custom); weight by procurement spend → **Spend-weighted supplier ESG score and assessment coverage rate**
- **Product use and end-of-life data (engineering models)** → Apply GHG Protocol Cat.11/12 methodology; use product energy ratings and lifetime assumptions → **Use-phase and end-of-life Scope 3 emissions by product line (tCO2e)**

## 5 · Intermediate Transformation Logic
**Methodology:** Value Chain ESG Score
**Headline formula:** `VCE = w_up × Upstream_ESG + w_ops × Operations_ESG + w_dn × Downstream_ESG`

Weighted aggregation of ESG performance scores across three value chain stages. Upstream score covers Tier 1 and Tier 2 supplier ESG assessments weighted by spend share. Operations score uses direct company KPIs. Downstream score aggregates use-phase emissions (Cat.11), end-of-life treatment (Cat.12), and downstream franchisee/investment impacts. Weights reflect relative emission and risk materiality by sector.

**Standards:** ['GHG Protocol Scope 3 Standard 2011', 'EU CSDDD 2024', 'GRI 308/414 2016']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard 2011; EU Corporate Sustainability Due Diligence Directive (CSDDD) 2024; GRI 308 â€” Supplier Environmental Assessment 2016; GRI 414 â€” Supplier Social Assessment 2016; CDP Supply Chain Programme Technical Note 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real supplier and commodity flows under the genuine reference layer (analytics ladder: rung 1 → 2)

**What.** The module has an unusually good curated reference layer — a 41-country governance database (real CPI/WGI/HDI/Gini/labor-rights values), a 16-scheme certification database with credibility ratings, 21 regional risk profiles, and ILO human-rights risk entries — but the analytical layer on top is seeded: per-commodity ESG scores (`countryESG = seed(base)·40+35`), child-labor risks, traceability, cert assignments (`seed > 0.55`), audit scores, and a toy "ML" decision-tree ensemble with seeded thresholds. The Scope 3 and CSDDD workflows in the overview have no data path. Evolution A connects real flows to the real references.

**How.** (1) Supplier/commodity data from what the platform already has: Sprint-DN supply-chain tables for tiered supplier maps, UN Comtrade (integrated in data-sources wave-1) for commodity origin flows — so a commodity's country-mix drives its governance-risk profile via the *real* `COUNTRY_GOV_DB` instead of a seed. (2) Scope 3 Cat.1: spend-based calculation with EEIO factors (public EXIOBASE/EPA factors) as the proxy tier, supplier primary data where collected — coverage honestly reported per the §4 "below 40% requires proxies" rule. (3) Certifications become supplier-attested records with scheme metadata from the certification DB, not random assignments. (4) The seeded decision-tree "ML" is retired or relabeled an illustrative scorecard; the VCE composite computes from measured upstream/ops/downstream components. (5) Rung 2: sourcing what-ifs — shifting a commodity's origin mix recomputes the risk profile through the governance DB.

**Prerequisites.** Supply-chain table coverage audit; EEIO factor licensing check; procurement-spend ingestion (shared with `energy-supplier-network`). **Acceptance:** a commodity's risk profile reproduces from its Comtrade origin mix × country-DB values; Scope 3 Cat.1 totals reconcile to spend × factors with coverage disclosed; zero `seed()` in scores.

### 9.2 Evolution B — CSDDD adverse-impact due-diligence assistant (LLM tier 2)

**What.** CSDDD's risk-based due diligence is a prioritization-and-documentation workflow made for tool-calling: "identify our salient adverse-impact risks across the value chain and draft the CSDDD risk analysis." The assistant queries Evolution A's supplier map and commodity risk profiles, cross-references the human-rights risk entries and ILO convention gaps from the curated DBs, ranks by severity × likelihood × leverage (the CSDDD triad), and drafts the adverse-impact report with each identified risk citing its data basis (country governance scores, commodity profile, supplier assessment status).

**How.** Tools: `get_supplier_map(org)`, `get_commodity_risk(commodity)`, `get_country_profile(country)`, `get_hr_risks(country, commodity)`, `get_assessment_status(supplier)`. Grounding corpus = this Atlas record's reference-table documentation plus CSDDD/ILO texts. Prioritization is transparent rule application over computed inputs; the report distinguishes identified risks (data-backed) from assessment gaps (suppliers without questionnaire responses — themselves a CSDDD finding). Engagement escalations route to the supplier-network module's workflow.

**Prerequisites (hard).** Evolution A — a CSDDD report built on seeded child-labor risk scores would make legally-consequential human-rights claims from a PRNG, this slice's most serious fabrication hazard. **Acceptance:** every identified risk in a golden report cites real reference-DB values and flow data; unassessed suppliers appear as gaps; severity rankings reproduce from the documented rule.