# Geopolitical ESG Hub
**Module ID:** `geopolitical-esg-hub` · **Route:** `/geopolitical-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the intersection of geopolitical risk events and ESG factor dynamics, quantifying how political instability, sanctions, trade conflicts, and resource nationalism affect portfolio ESG scores and carbon transition risk. Provides scenario-based stress testing of ESG metrics under geopolitical shock scenarios.

> **Business value:** Enables portfolio managers and risk officers to quantify the ESG impact of geopolitical shocks, stress-test governance scores under sanctions or conflict scenarios, and satisfy TCFD risk management disclosure requirements for geopolitical transition risks.

**How an analyst works this module:**
- Select the geopolitical scenario (sanctions escalation, trade war, resource nationalisation) and calibrate the GPR shock magnitude.
- Review the portfolio heatmap showing ESG sensitivity by issuer country and sector under the selected scenario.
- Analyse the governance factor breakdown to identify which ESG pillars are most exposed to geopolitical deterioration.
- Export the scenario stress test results for integration into TCFD risk management disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AI_DIMENSIONS`, `AI_REGS`, `Badge`, `Btn`, `COLORS`, `COUNTRY_LABELS`, `GEO_RISK`, `KpiCard`, `SCENARIOS`, `Section`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `AI_DIMENSIONS` | 11 | `name`, `benchmark` |
| `AI_REGS` | 9 | `name`, `status`, `effective`, `penalty` |
| `SCENARIOS` | 4 | `name`, `description`, `affected_countries`, `base_impact_pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `companies` | `useMemo(() => (GLOBAL_COMPANY_MASTER \|\| []).slice(0, 80), []);  /* ── Portfolio (wrapped format) ── */ const portfolio = useMemo(() => { try { const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') \|\| '{}');` |
| `holdingsWithGeo` | `useMemo(() => { const holdings = portfolio.holdings.length > 0 ? portfolio.holdings : companies.slice(0, 25).map((c, i) => ({ ticker: c.ticker, name: c.name, weight: (4 + sRand(i) * 4).toFixed(2), country: c.country \|\| 'IN', sector: c.sector \|\| 'Financials', }));` |
| `aiScores` | `AI_DIMENSIONS.map((d, j) => ({` |
| `aiGovAvg` | `Math.round(aiScores.reduce((s, d) => s + d.score, 0) / aiScores.length);` |
| `cyberScore` | `clamp(Math.round(50 + sRand(seed(h.ticker \|\| '') * 3) * 45), 20, 95);` |
| `dataBreaches` | `Math.floor(sRand(seed(h.ticker \|\| '') * 5) * 3);` |
| `techExposure` | `sRand(seed(h.ticker \|\| '') * 7) > 0.5 ? 'High' : sRand(seed(h.ticker \|\| '') * 7) > 0.25 ? 'Medium' : 'Low';` |
| `kpis` | `useMemo(() => { const totalWeight = holdingsWithGeo.reduce((s, h) => s + (parseFloat(h.weight) \|\| 0), 0) \|\| 1;` |
| `weightedGPR` | `holdingsWithGeo.reduce((s, h) => s + (h.gpr * (parseFloat(h.weight) \|\| 0)), 0) / totalWeight;` |
| `sanctionedWeight` | `holdingsWithGeo.filter(h => h.sanctions === 'High (target)' \|\| h.sanctions === 'Medium').reduce((s, h) => s + (parseFloat(h.weight) \|\| 0), 0);` |
| `sanctionsPct` | `(sanctionedWeight / totalWeight * 100);` |
| `avgAiGov` | `Math.round(holdingsWithGeo.reduce((s, h) => s + h.aiGovAvg, 0) / (holdingsWithGeo.length \|\| 1));` |
| `gdprPct` | `(gdprCompliant / (holdingsWithGeo.length \|\| 1) * 100);` |
| `cyberAvg` | `Math.round(holdingsWithGeo.reduce((s, h) => s + h.cyberScore, 0) / (holdingsWithGeo.length \|\| 1));` |
| `totalBreaches` | `holdingsWithGeo.reduce((s, h) => s + h.dataBreaches, 0);` |
| `digitalRightsAvg` | `Math.round(holdingsWithGeo.reduce((s, h) => s + ((h.aiScores.find(d => d.id === 'AT07') \|\| {}).score \|\| 50), 0) / (holdingsWithGeo.length \|\| 1));` |
| `portTechGov` | `Math.round((avgAiGov * 0.4 + cyberAvg * 0.3 + gdprPct * 0.3));` |
| `gprBarData` | `useMemo(() => countryData.map(c => ({ name: c.label, GPR: c.gpr })), [countryData]);` |
| `aiHeatmapRows` | `useMemo(() => holdingsWithGeo.slice(0, 20), [holdingsWithGeo]);  /* ── Portfolio AI/Tech Exposure PieChart ── */ const techExposurePie = useMemo(() => { const map = { High: 0, Medium: 0, Low: 0 };` |
| `cyberBarData` | `useMemo(() => holdingsWithGeo.slice(0, 15).map(h => ({ name: (h.name \|\| h.ticker \|\| '').slice(0, 12), score: h.cyberScore })), [holdingsWithGeo]);` |
| `scenarioResults` | `useMemo(() => SCENARIOS.map(sc => {` |
| `intensity` | `scenarioSliders[sc.id] / 50; // 0-2x multiplier` |
| `impact` | `sc.base_impact_pct * intensity;` |
| `affectedWeight` | `affectedHoldings.reduce((s, h) => s + (parseFloat(h.weight) \|\| 0), 0);` |
| `cmp` | `typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));` |
| `supplyChainData` | `useMemo(() => { const deps = [ { component: 'Semiconductors', primarySource: 'CN/KR', risk: 'Very High', affected: holdingsWithGeo.filter(h => ['CN','KR','US','JP'].includes(h.country)).length }, { component: 'Rare Earth Minerals', primarySource: 'CN', risk: 'High', affected: holdingsWithGeo.filter(h => h.country === 'CN').length }, { com` |
| `blob` | `new Blob([rows.join('\n')], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AI_DIMENSIONS`, `AI_REGS`, `COLORS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geopolitical Risk Beta (β_geo) | — | Caldara-Iacoviello GPR Index | Negative beta indicates ESG scores decline with rising geopolitical risk; values below -0.15 signal high exposure to governance and social factor deterioration. |
| Sanctions-Exposed AUM (%) | — | OFAC / EU sanctions lists | Portfolio weight in securities from issuers with direct or indirect sanctions exposure; above 5% requires enhanced due diligence. |
| Resource Nationalism Risk Score | — | Political risk insurance models | Composite score reflecting probability of government expropriation, contract renegotiation, or export restrictions in operating geographies. |
| ESG Score Drawdown under GPR Shock | — | Scenario analysis | Estimated ESG score decline under a 200-point GPR index shock, calibrated to 2022 Russia-Ukraine geopolitical shock. |
- **Caldara-Iacoviello GPR index (monthly)** → Regress against ESG score panel data by issuer → **Geopolitical ESG sensitivity betas**
- **OFAC/EU sanctions lists** → Cross-reference portfolio ISINs against sanctions databases → **Sanctions exposure flags by holding**
- **Portfolio ESG scores (MSCI/Sustainalytics)** → Apply geopolitical shock β coefficients to compute stressed ESG scores → **Stressed portfolio ESG distribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Geopolitical ESG Sensitivity
**Headline formula:** `ΔESG_i = α + β_geo × GPR_index + β_sanction × Sanction_dummy + ε`

Estimates portfolio ESG score sensitivity to the Caldara-Iacoviello Geopolitical Risk Index using panel regression across holdings, with sanctions exposure as a binary covariate. The geopolitical beta quantifies ESG score erosion per 100-point GPR index increase, enabling scenario-based ESG impact assessment.

**Standards:** ['Caldara-Iacoviello GPR Index', 'UNPRI Stewardship Code', 'MSCI ESG Ratings Methodology']
**Reference documents:** Caldara & Iacoviello (2022) â€” Measuring Geopolitical Risk; UNPRI â€” ESG Factors in Sovereign Debt Investing (2020); MSCI â€” Geopolitical Risk and ESG Scores (2023); World Bank Political Risk Insurance Group â€” Resource Nationalism Monitor

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (double).** Two problems. (1) The MODULE_GUIDES entry describes a
> **geopolitical-ESG sensitivity regression** — a panel model `ΔESG_i = α + β_geo·GPR + β_sanction·
> Sanction + ε` estimating an ESG-score beta to the Caldara-Iacoviello GPR index, plus resource-
> nationalism scoring and GPR-shock ESG drawdown. **The code implements none of this** — no
> regression, no β_geo, no ESG-drawdown calculation. (2) This page's code body is **byte-identical to
> `geopolitical-ai-gov`**: same 14-country `GEO_RISK` table, same 10 `AI_DIMENSIONS`, same seeded
> AI/cyber/breach scoring, same `portTechGov` composite. So the page actually renders an *AI/tech-
> governance portfolio scorecard*, not an ESG-geopolitical sensitivity engine. Sections below
> document the code as it runs; see `geopolitical-ai-gov.md` for the full formula trace.

### 7.1 What the module computes

Identical to `geopolitical-ai-gov`. For up to 25 holdings, each gets a `GEO_RISK[country]` lookup
and PRNG-seeded governance scores:

```js
aiScores  = AI_DIMENSIONS.map((d,j)=>({...d, score: clamp(round(40 + sRand(seed(ticker)+j*17)*50),10,95)}));
aiGovAvg  = mean(aiScores.score);
cyberScore= clamp(round(50 + sRand(seed(ticker)*3)*45),20,95);
weightedGPR = Σ(gpr_h·weight_h)/Σweight_h;
portTechGov = round(avgAiGov·0.4 + cyberAvg·0.3 + gdprPct·0.3);
```

The **only** geopolitical-ESG linkage present is `weightedGPR` (an exposure-weighted average of the
static country `gpr` values) and `sanctionsPct` (weight in sanctioned-country holdings). There is no
ESG score, no ESG beta, no shock scenario producing an ESG drawdown.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `GEO_RISK` | 14 countries, `gpr` 70–160, `stability` 52–92 | Static demo (guide frames as Caldara-Iacoviello GPR) |
| `AI_DIMENSIONS` | 10 (AT01–AT10) | AI-governance dimension labels |
| `SCENARIOS` | 3 (Taiwan −8.5%, Sanctions −5.2%, AI-Reg −3.1%) | Synthetic base-impact %s |
| AI / cyber score bands | 40+50·rand / 50+45·rand | **synthetic seeded** |
| `portTechGov` weights | 0.40 / 0.30 / 0.30 | Hard-coded |

None of the guide's parameters — `β_geo` (−0.08 to −0.22), resource-nationalism score, ESG-drawdown
(−4 to −12 pts under 200-pt GPR shock) — appear anywhere in the code.

### 7.3 Calculation walkthrough

See `geopolitical-ai-gov.md §7.3` — the flow is identical: resolve holdings → seed AI/cyber/breach
scores → aggregate to portfolio KPIs → scale scenario base-impacts by slider intensity and sum
affected-country weight.

### 7.4 Worked example (weighted GPR)

Book: 40% China (gpr 160), 30% USA (145), 30% India (125), weights normalised.

```
weightedGPR = (0.40·160 + 0.30·145 + 0.30·125) / 1.0
            = 64 + 43.5 + 37.5 = 145
```

Portfolio weighted GPR = **145** — elevated, driven by the China concentration. Under the guide's
*intended* regression this GPR level would map to an ESG drawdown via β_geo (e.g. β_geo = −0.15 ⇒
ΔESG ≈ −0.15 × (145−100)/100 × 100 ≈ −6.75 pts) — but that step is **not in the code**; the module
stops at the GPR average.

### 7.5 Data provenance & limitations

- **AI-governance / cyber / breach scores are synthetic** (`sRand(seed(ticker))`); the only
  aggregation with real structure is the exposure-weighted GPR over the static 14-country table.
- **The guide's entire ESG-sensitivity methodology is absent** — no panel regression, no β_geo, no
  sanctions dummy coefficient, no resource-nationalism score, no ESG-shock drawdown.
- Because the code is a duplicate of `geopolitical-ai-gov`, the two routes present the same numbers
  under different titles.

**Framework alignment:** *Caldara-Iacoviello GPR (2022)* — the `gpr` field mimics the index scale
(newspaper-based geopolitical-risk index, ~100 = historical average) but is static, not the live
monthly series, and no ESG regression is run against it. *MSCI ESG Ratings* / *UNPRI* — cited in the
guide as the ESG-score source for the (unimplemented) regression. *OFAC/EU sanctions* — the
`sanctionsPct` KPI proxies sanctions exposure by holding weight.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's ESG-geopolitical sensitivity
model has no implementation; below is the production spec.

**8.1 Purpose & scope.** Quantify how portfolio ESG scores erode under geopolitical shocks
(sanctions, conflict, resource nationalism) to support TCFD/ISSB risk-management disclosure and
stewardship prioritisation across all equity/credit holdings.

**8.2 Conceptual approach.** Panel fixed-effects regression of issuer ESG-score changes on the
Caldara-Iacoviello GPR index and a sanctions indicator, benchmarked against **MSCI's geopolitical-
risk-and-ESG** analysis and **Verisk Maplecroft** political-risk-adjusted ESG. Shock propagation
mirrors a **stress-VaR** overlay calibrated to the 2022 Russia-Ukraine episode.

**8.3 Mathematical specification.**

```
ΔESG_{i,t} = α_i + β_geo·GPR_t + β_san·Sanction_{i,t} + β_conf·Conflict_{c(i),t} + ε_{i,t}
ESG_stressed_i = ESG_i + β_geo·(GPR_shock − GPR_baseline)/100·100 + β_san·1[newly sanctioned]
RN_i = w1·Expropriation + w2·ContractRenegotiation + w3·ExportRestriction   (resource-nationalism)
PortDrawdown = Σ_i weight_i·(ESG_i − ESG_stressed_i)
```

| Parameter | Calibration source |
|---|---|
| β_geo | fixed-effects panel on MSCI/Sustainalytics ESG vs GPR, 2015–2024 (target −0.08 to −0.22) |
| β_san | event-study around OFAC/EU designations |
| GPR_t | Caldara-Iacoviello GPR index (free, monthly) |
| GPR_shock | 200-pt shock ≈ 2022 Russia-Ukraine peak |
| RN weights | World Bank MIGA / political-risk-insurance loss frequencies |

**8.4 Data requirements.** Issuer ESG-score panel (MSCI/Sustainalytics, vendor); GPR index (free);
OFAC/EU sanctions lists mapped to ISINs (free); ACLED conflict by operating geography (free).
Platform already exposes the 14-country GEO table and portfolio context; ESG scores must be sourced.

**8.5 Validation & benchmarking.** In-sample fit and out-of-sample stability of β_geo; reconcile
stressed-ESG drawdown against the realised 2022 ESG-rating actions on Russia-exposed issuers;
compare RN scores to MIGA claims data.

**8.6 Limitations & model risk.** ESG-rating revisions lag geopolitical events by quarters, biasing
β_geo toward zero; sanctions events are rare (thin identification); GPR is a global scalar and does
not localise to issuer geography without the conflict term.

## 9 · Future Evolution

### 9.1 Evolution A — Estimate the GPR-to-ESG sensitivity regression and de-duplicate the code (analytics ladder: rung 1 → 2)

**What.** §7 flags a double defect. (1) The guide describes a geopolitical-ESG sensitivity regression — `ΔESG_i = α + β_geo·GPR + β_sanction·Sanction + ε` estimating an ESG-score beta to the Caldara-Iacoviello GPR index, plus resource-nationalism scoring and GPR-shock ESG drawdown — but none is implemented. (2) The page's code body is byte-identical to `geopolitical-ai-gov`: same 14-country `GEO_RISK` table, same seeded AI/cyber/breach scoring, same `portTechGov` composite, so the route renders an AI/tech-governance scorecard under an ESG-sensitivity title. Evolution A splits the modules and builds this one's real method: a panel regression of holding ESG scores on the GPR index with a sanctions dummy, producing a β_geo that quantifies ESG erosion per 100-point GPR increase, driving a scenario-based ESG-impact estimate.

**How.** (1) Fork the shared code so `geopolitical-esg-hub` becomes its own vertical. (2) A backend route estimating `ΔESG = α + β_geo·GPR + β_sanction·Sanction` (statsmodels) over holdings' ESG scores against the GPR series and sanctions flags, reporting β with standard errors. (3) A GPR-shock scenario applying the fitted β to project ESG drawdown; a resource-nationalism score from sovereign resource-dependence data.

**Prerequisites.** Real holding ESG scores (MSCI-style, via the company master) and the live Caldara-Iacoviello GPR series rather than the static `gpr` field; the code de-duplicated from `geopolitical-ai-gov`. **Acceptance:** β_geo is estimated with reported significance; a GPR shock produces an ESG drawdown reproducing the fitted model; the two geopolitical routes no longer present identical numbers.

### 9.2 Evolution B — Geopolitical-ESG scenario copilot (LLM tier 2)

**What.** A copilot for ESG-integration desks: "if the GPR index spikes 150 points on a Taiwan-Strait scenario, how much does our portfolio ESG score erode, and which sanctioned holdings drive it?" tool-calls the Evolution A regression and scenario endpoints, narrating the β_geo-driven drawdown and sanctions-weighted exposure.

**How.** Tier-2 tool-calling over the sensitivity/scenario endpoints; the grounding corpus is §5/§7 (Caldara-Iacoviello GPR, MSCI ESG, UNPRI sovereign-ESG, resource-nationalism framing are cited). The copilot's guardrail, pre-Evolution-A: because §7 shows no regression exists and the page duplicates another module, it must refuse ESG-sensitivity questions and disclose the duplication. Post-Evolution-A, every β, drawdown, and exposure figure is validated against tool output.

**Prerequisites.** Evolution A (no regression today); corpus embedding; per-module tool allowlist. **Acceptance:** post-Evolution-A, every ESG-erosion figure traces to a tool call citing the fitted β; pre-Evolution-A the copilot declines the sensitivity computation and flags that the route currently mirrors `geopolitical-ai-gov`.