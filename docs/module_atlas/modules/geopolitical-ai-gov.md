# Geopolitical AI Governance
**Module ID:** `geopolitical-ai-gov` · **Route:** `/geopolitical-ai-gov` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides governance controls and bias-detection analytics for AI models used in geopolitical risk assessment, ensuring model outputs are explainable, auditable, and free from geographic or political bias. Covers model card documentation, fairness metrics, adversarial robustness testing, and regulatory alignment with the EU AI Act and OECD AI Principles.

> **Business value:** Ensures geopolitical AI models meet EU AI Act high-risk system requirements, OECD AI Principles, and internal model risk management standards. Reduces regulatory and reputational risk from biased or opaque AI-assisted geopolitical risk scores informing investment decisions.

**How an analyst works this module:**
- Review model card for each active geopolitical AI model, checking training data provenance and known limitations.
- Run the disparate impact analysis across geographic regions and political regime groupings to detect systematic bias.
- Execute adversarial robustness tests using structured geopolitical scenario perturbations.
- Generate the EU AI Act conformity assessment report with SHAP-based feature attribution for high-impact predictions.

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
| Disparate Impact Ratio | — | EU AI Act / OECD | Values outside 0.80â€“1.25 range indicate potential geographic bias requiring model audit; values near 1.0 indicate equal treatment across groups. |
| Model Explainability Score | — | SHAP / LIME framework | Composite score reflecting proportion of model predictions explainable by identified features; below 0.65 fails EU AI Act transparency requirements. |
| Adversarial Robustness (%) | — | NIST AI RMF | Percentage of predictions unchanged under structured adversarial perturbation; below 80% indicates fragile geopolitical risk signals. |
| Audit Trail Completeness (%) | — | Internal governance | Percentage of AI-assisted decisions with full input, output, and model version logged; mandatory for regulatory audit. |
- **AI model prediction logs** → Group by geographic/political dimensions, compute DIR → **Bias detection report by model and region**
- **Training dataset metadata** → Audit data provenance, label balance, and temporal coverage → **Data governance scorecard**
- **SHAP feature importance outputs** → Rank features by mean absolute SHAP value, flag opaque models → **Explainability assessment report**

## 5 · Intermediate Transformation Logic
**Methodology:** Disparate Impact Ratio
**Headline formula:** `DIR = P(ŷ=1 | group=A) / P(ŷ=1 | group=B)`

Computes the ratio of positive prediction rates across geographic and political groupings to detect systematic model bias. A DIR below 0.80 (four-fifths rule) triggers mandatory bias investigation and retraining under EU AI Act Article 10 data governance requirements for high-risk systems.

**Standards:** ['EU AI Act (High-Risk AI Systems)', 'OECD AI Principles 2019', 'NIST AI RMF 1.0 (2023)']
**Reference documents:** EU AI Act (2024) â€” High-Risk AI System Requirements; OECD AI Principles (2019, updated 2023); NIST AI Risk Management Framework 1.0 (2023); Mehrabi et al. (2021) â€” A Survey on Bias and Fairness in Machine Learning

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a rigorous **AI model-governance
> fairness engine** — Disparate Impact Ratio (`DIR = P(ŷ=1|A)/P(ŷ=1|B)`), the four-fifths rule, SHAP/
> LIME explainability scores, adversarial-robustness testing and EU AI Act conformity assessment.
> **None of that exists in the code.** What this page actually renders is a **portfolio geopolitical +
> AI/tech-governance scorecard**: it looks up a 14-country geopolitical-risk table, then generates
> each holding's AI-governance, cyber, and data-breach scores from a seeded PRNG. There is no DIR,
> no SHAP, no fairness metric, no adversarial test. The sections below document the code as it runs.
> (This module shares its entire code body with `geopolitical-esg-hub`.)

### 7.1 What the module computes

For up to 25 holdings (from the live portfolio, else the top 25 of `GLOBAL_COMPANY_MASTER`), each
holding gets a country-level geopolitical profile and a synthetic AI-governance profile:

```js
geo      = GEO_RISK[country] || GEO_RISK.IN;                          // 14-country lookup
aiScores = AI_DIMENSIONS.map((d,j) => ({...d,
             score: clamp(round(40 + sRand(seed(ticker)+j*17)*50), 10, 95) }));  // 10 dims, seeded
aiGovAvg = mean(aiScores.score);
cyberScore   = clamp(round(50 + sRand(seed(ticker)*3)*45), 20, 95);
dataBreaches = floor(sRand(seed(ticker)*5)*3);                        // 0–2
techExposure = sRand(seed(ticker)*7) > 0.5 ? 'High' : >0.25 ? 'Medium' : 'Low';
```

Portfolio KPIs (line 172+):

```js
weightedGPR = Σ(gpr_h · weight_h) / Σ weight_h;                       // exposure-weighted GPR
sanctionsPct = Σ weight[sanctions∈{High(target),Medium}] / Σ weight × 100;
gdprPct     = count(AT04 score ≥ 60) / N × 100;
portTechGov = round(avgAiGov·0.4 + cyberAvg·0.3 + gdprPct·0.3);       // composite tech-gov score
```

`seed(s)` is a djb2-style string hash; `sRand(n)=frac(sin(n+1)×10⁴)` is the platform PRNG. So every
AI/cyber/breach number is a deterministic function of the ticker string — **stable, but fabricated**.

### 7.2 Parameterisation

| Constant | Value | Meaning / provenance |
|---|---|---|
| `GEO_RISK` | 14 countries | `gpr` 70–160, `stability` 52–92, sanctions/trade/conflict categoricals — static demo values (guide cites Caldara-Iacoviello GPR levels ~70–160) |
| `AI_DIMENSIONS` | 10 (AT01–AT10) | AI Ethics, Bias, Transparency, GDPR/CCPA, Cyber, Supply-chain, Digital Rights, Autonomous, Climate-of-tech, Responsible Innovation |
| `AI_REGS` | 8 jurisdictions | EU AI Act (€35M/7% turnover), US EO, China GenAI, UK, India DIA, Singapore, Japan, Canada AIDA — real regulatory facts |
| `SCENARIOS` | 3 | Taiwan Strait (−8.5%), Sanctions Expansion (−5.2%), AI Reg Fragmentation (−3.1%) base impact |
| AI score band | 40 + 50·rand, clamp [10,95] | **synthetic seeded** |
| cyber band | 50 + 45·rand, clamp [20,95] | **synthetic seeded** |
| portTechGov weights | 0.40 / 0.30 / 0.30 | AI-gov / cyber / GDPR — hard-coded editorial weights |

### 7.3 Calculation walkthrough

1. Resolve holdings; map each to `GEO_RISK[country]` (fallback India).
2. Generate 10 AI-dimension scores per holding from `seed(ticker)`; average → `aiGovAvg`.
3. Generate cyber, breaches, tech-exposure from the same seed with different multipliers.
4. Aggregate to portfolio KPIs (weighted GPR, sanctions %, GDPR %, cyber avg, composite tech-gov).
5. Scenario tab scales each scenario's `base_impact_pct` by slider intensity (0–2×) and sums the
   weight of affected-country holdings.

### 7.4 Worked example (a holding with ticker "TCS", country IN)

Suppose `seed("TCS") = H`. AT04 (GDPR) score = `clamp(round(40 + frac(sin(H+3·17+1)·10⁴)·50),10,95)`.
Say the fraction resolves to 0.62 → 40 + 31 = **71** (≥60 ⇒ GDPR-compliant). India GPR = 125,
stability 65, sanctions "Low". If cyberAvg = 68 and gdprPct = 72 across the book and avgAiGov = 66:

```
portTechGov = round(66·0.4 + 68·0.3 + 72·0.3) = round(26.4 + 20.4 + 21.6) = round(68.4) = 68
```

Under the **Taiwan Strait** scenario at slider 75 (intensity 1.5): impact = −8.5 × 1.5 = **−12.75%**,
applied to the weight of holdings in {CN,US,JP,KR,HK,SG}. For an India-heavy book the affected weight
is small, so headline portfolio impact is muted — a genuine (if crude) exposure mechanic.

### 7.5 Data provenance & limitations

- **All AI-governance, cyber, and data-breach numbers are synthetic**, generated by
  `sRand(seed(ticker))` — deterministic per ticker but not measured. No real model-card, fairness,
  or robustness data enters the module.
- `GEO_RISK` is a 14-country static table; the guide's Caldara-Iacoviello GPR framing is aspirational.
- `AI_REGS` (regulatory facts) is the only genuinely-sourced dataset.
- The guide's DIR / four-fifths rule / SHAP explainability / adversarial robustness are **entirely
  absent** — a reader must not assume any fairness or explainability computation occurs.

**Framework alignment:** *EU AI Act (2024)* — `AI_REGS` correctly encodes the €35M / 7%-turnover
penalty tier for prohibited-practice breaches and the high-risk-system regime, but the module does
**not** run the Article-10 data-governance or conformity checks the guide claims. *OECD AI Principles*
/ *NIST AI RMF 1.0* — named as dimension benchmarks only. *Caldara-Iacoviello GPR* — the `gpr` field
mimics the index's scale (≈100 baseline) but is static. *Four-fifths rule / Disparate Impact Ratio* —
described in the guide as `DIR = P(ŷ=1|A)/P(ŷ=1|B)` with a 0.80 threshold; **not implemented**.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide advertises a fairness/
explainability engine; below is the production model it should run. (AI/cyber scores currently `sr()`
seeded → spec triggered.)

**8.1 Purpose & scope.** Two distinct decisions: (a) *govern the platform's own geopolitical-AI
models* for EU AI Act high-risk compliance; (b) *score portfolio holdings* on AI/tech-governance
quality. This spec addresses (a) — the fairness engine the guide names.

**8.2 Conceptual approach.** Group-fairness testing plus post-hoc explainability, benchmarked
against **NIST AI RMF 1.0** measurement functions and the **EU AI Act** Annex-III high-risk regime,
with fairness math from **IBM AIF360** / **Fairlearn** and attribution from **SHAP** (Lundberg-Lee
Shapley values).

**8.3 Mathematical specification.**

```
DIR      = P(ŷ=1 | group=A) / P(ŷ=1 | group=B)              (A = unprivileged)  → flag if <0.80
SPD      = P(ŷ=1|A) − P(ŷ=1|B)                              (statistical parity diff)
EqOpp    = TPR_A − TPR_B                                    (equal-opportunity diff)
φ_i      = Σ_{S⊆F\{i}} |S|!(|F|−|S|−1)!/|F|! · [f(S∪{i}) − f(S)]   (SHAP value, feature i)
ExplScore = Σ_i |φ_i| over top-k / Σ_i |φ_i| over all
Robustness = 1 − (Δpredictions under ε-perturbation / N)
```

| Parameter | Calibration source |
|---|---|
| DIR threshold 0.80 | EEOC four-fifths rule (US) / EU AI Act Art.10 |
| ε perturbation set | NIST AI RMF adversarial-scenario library |
| groups A/B | geographic / political-regime partitions |
| k (top features) | explainability floor 0.65 (guide) |

**8.4 Data requirements.** Model prediction logs with group labels (internal); training-set
metadata (provenance, label balance); feature matrix for SHAP; adversarial perturbation harness.
None currently exist in the platform — this is greenfield.

**8.5 Validation & benchmarking.** Reconcile DIR/SPD/EqOpp against AIF360 reference implementations;
verify SHAP additivity (`Σφ_i = f(x) − E[f]`); backtest robustness on held-out perturbed inputs;
document in an EU AI Act conformity dossier.

**8.6 Limitations & model risk.** Fairness metrics can conflict (parity vs equal-opportunity are not
jointly satisfiable); SHAP is expensive for large feature sets (use TreeSHAP); group definitions are
themselves value-laden and must be governance-approved.

## 9 · Future Evolution

### 9.1 Evolution A — Build the actual fairness engine the guide claims (analytics ladder: rung 1 → 2)

**What.** §7 flags a total guide↔code gap: the guide promises an AI model-governance fairness engine — Disparate Impact Ratio (`DIR = P(ŷ=1|A)/P(ŷ=1|B)`), the four-fifths rule, SHAP/LIME explainability, adversarial-robustness testing, EU AI Act Article-10 conformity — but the code renders a portfolio geopolitical + AI/tech-governance scorecard where each holding's AI-governance/cyber/data-breach scores are `sRand(seed(ticker))`-generated. No DIR, no SHAP, no fairness metric exists, and the page's body is byte-identical to `geopolitical-esg-hub`. Only `AI_REGS` (the EU AI Act penalty tiers) is genuinely sourced. Evolution A builds the module's first real vertical: a fairness engine that computes DIR over a model's actual predictions grouped by region/regime, applies the four-fifths rule, and generates SHAP feature attributions — operating on a real geopolitical model's outputs (e.g. the CV1 index) rather than seeded scores.

**How.** (1) A backend route taking a model's predictions and protected-group labels, returning DIR per group pair and a four-fifths pass/fail. (2) SHAP attributions via the `shap`/`sklearn` tooling the roadmap notes is in the environment, on a concrete geopolitical scoring model. (3) Adversarial robustness as structured scenario perturbations measuring score stability.

**Prerequisites.** A real model to govern (the platform's own geopolitical scorers are candidates); the seeded scorecard removed — it is a §7-flagged fabrication and must not masquerade as fairness data. The duplicate-code issue with `geopolitical-esg-hub` should be resolved so the two modules diverge. **Acceptance:** DIR is computed from real prediction rates and flags <0.80; SHAP attributions render for a named model; no `sRand()` governance score remains.

### 9.2 Evolution B — AI-governance conformity copilot (LLM tier 2)

**What.** A copilot for model-risk and compliance teams: "does our geopolitical scoring model pass the four-fifths rule across regions, and what EU AI Act obligations apply?" tool-calls the Evolution A DIR/SHAP endpoints and narrates the result against the genuinely-sourced `AI_REGS` regulatory facts (the €35M/7%-turnover tier, high-risk-system regime).

**How.** Tier-2 tool-calling over the fairness endpoints; the grounding corpus is §5/§7 plus the real `AI_REGS` dataset — the copilot's regulatory answers are credible because that table is sourced, while its fairness numbers come only from tool calls. Its critical guardrail, pre-Evolution-A: it must refuse to report any DIR/fairness figure because §7 shows none is computed, answering only the sourced regulatory questions. Post-Evolution-A, every DIR and attribution is validated against tool output.

**Prerequisites.** Evolution A (there is no fairness computation today); corpus embedding. **Acceptance:** regulatory answers cite the specific `AI_REGS` row; a DIR question pre-Evolution-A returns a documented refusal; post-Evolution-A every fairness figure traces to a tool call.