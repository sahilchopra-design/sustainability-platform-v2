# DME Entity View
**Module ID:** `dme-entity` · **Route:** `/dme-entity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Entity-level materiality deep-dive providing topic scores, evidence trails, stakeholder signal breakdowns, and trend histories for a single company or asset. Supports ESRS IRO-1 documentation by linking materiality conclusions to underlying data. Comparison against sector peers is available in the same view.

> **Business value:** Equips sustainability managers with the topic-level materiality evidence needed to complete ESRS IRO-1 assessments and satisfy external assurance requirements. The entity view bridges the gap between abstract materiality scoring and auditable, source-linked conclusions.

**How an analyst works this module:**
- Select an entity from the universe picker to load its full materiality profile
- Review the double materiality matrix plotting financial vs. impact scores for all topics
- Click a topic to explore the evidence trail, signal sources, and historical score trend
- Export the IRO-1 documentation pack with scored topics, evidence citations, and assessment rationale

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `COMPANY_NAMES`, `DEF_COEFF`, `DISCLOSURES`, `ENTITIES`, `ESG_BANDS`, `NGFS_SCENARIOS`, `REGIMES`, `REGIME_COLORS`, `REGIONS`, `SECTORS_LIST`, `SECTOR_COEFF`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BENCH_DIMS` | 9 | `label`, `scale` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtM` | `(n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `adj` | `assetValue * (1 - strandedHaircut);` |
| `shock` | `-3 + sr(entitySeed + k * 7) * 6;` |
| `simPD` | `pdBase * Math.exp(alphaT * velT + betaP * velP + 0.05 * shock);` |
| `wacc` | `wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);` |
| `baseline` | `wE * cE + wD * cD * (1 - taxRate);` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'LATAM', 'Middle East', 'Africa'];` |
| `DISCLOSURES` | `['Annual Report 2024', 'Sustainability Report 2024', 'TCFD Disclosure Q4-2024', 'CSRD Pilot Filing 2024'];` |
| `pdBase` | `0.01 + s(3) * 0.12;` |
| `velocityT` | `-0.3 + s(7) * 0.6;` |
| `velP` | `-0.2 + s(9) * 0.4;` |
| `assetV` | `500 + s(11) * 4500;` |
| `debt` | `assetV * (0.2 + s(13) * 0.6);` |
| `vol` | `coeff.baseVol + s(17) * 0.1;` |
| `esgBand` | `ESG_BANDS[Math.floor(s(19) * 4)];` |
| `pdConsensus` | `clamp(pdExp * 0.30 + pdMerton * 0.30 + pdTab * 0.20 + pdMC * 0.20, 0.001, 0.90);` |
| `zScore` | `s(23) * 4.2;` |
| `esgScore` | `20 + s(29) * 70;` |
| `envScore` | `20 + s(31) * 70;` |
| `socScore` | `20 + s(37) * 70;` |
| `govScore` | `20 + s(41) * 70;` |
| `finScore` | `20 + s(43) * 70;` |
| `velScore` | `30 + s(45) * 60;` |
| `ead` | `assetV * (0.3 + s(47) * 0.5);` |
| `climateFactor` | `1 + coeff.alphaT * (velocityT > 0 ? velocityT : 0);` |
| `var95` | `assetV * (0.03 + s(49) * 0.12);` |
| `var99` | `var95 * (1.15 + s(53) * 0.25);` |
| `cvar` | `var99 * (1.10 + s(57) * 0.20);` |
| `esgEqPrem` | `coeff.alphaT * (1 + s(65) * 0.5) * 0.01;` |
| `esgDebtSpread` | `coeff.betaP * (1 + s(67) * 0.5) * 0.01;` |
| `climateBeta` | `0.5 + s(69) * 1.5;` |
| `strandedHaircut` | `coeff.haircut * (1 + s(71) * 0.5);` |
| `alertCount` | `Math.floor(s(73) * 18);` |
| `nlpSentiment` | `-1 + s(75) * 2;` |
| `mlScore` | `20 + s(79) * 75;` |
| `anomalyScore` | `s(81) * 0.95;` |
| `contagionCentrality` | `s(83) * 0.85;` |
| `coveragePct` | `60 + s(85) * 39;` |
| `dmiHistory` | `Array.from({ length: 12 }, (_, m) => ({ month: m + 1, dmi: clamp(dmi + (-15 + sr(i * 37 + m * 7) * 30), 10, 95) }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BENCH_DIMS`, `COLORS`, `COMPANY_NAMES`, `DISCLOSURES`, `ESG_BANDS`, `NGFS_SCENARIOS`, `REGIMES`, `REGIONS`, `SECTORS_LIST`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Highest-Scored Topic | — | DME entity engine | Topic with the highest double materiality score for the selected entity |
| Financial Material Topics | — | DME financial materiality module | Count of topics meeting the financial materiality threshold for the selected entity |
| Impact Material Topics | — | DME impact materiality module | Count of topics meeting the impact materiality threshold for the selected entity |
| Evidence Items Linked | — | Evidence repository | Total evidence citations (regulatory filings, news, analyst reports) supporting materiality conclusions |
- **DME topic scoring engine (financial + impact scores per entity)** → Double materiality composite calculation with equal or user-configured weighting → **Entity topic matrix with EMS, financial, and impact sub-scores**
- **Evidence repository (news, NGO reports, regulatory filings, stakeholder inputs)** → NLP topic tagging and relevance scoring per evidence item → **Evidence pack linked to each scored topic for IRO-1 documentation**
- **Peer benchmarking database** → Sector cohort score distribution for reference → **Entity score positioned within peer distribution on each topic**

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Materiality Score
**Headline formula:** `EMSᵢ = 0.5 × FinancialMaterialityᵢ + 0.5 × ImpactMaterialityᵢ`

Financial materiality is scored from risk exposure and financial magnitude signals; impact materiality is scored from severity, breadth, and irremediability of impacts on people and environment. Equal weighting follows ESRS 1 double materiality symmetry; weights are configurable per entity type.

**Standards:** ['ESRS 1 Double Materiality', 'EFRAG Entity-Level Materiality Guidance', 'GRI 3 Material Topics']
**Reference documents:** ESRS 1 (2023) § 3.2 Identification of IROs and Material Sustainability Matters; EFRAG (2022) Entity-Level Materiality Assessment Guidance; GRI 3 (2021) Determining Material Topics; SASB (2023) Entity-Specific Materiality Application Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **Entity Materiality Score**
> `EMSᵢ = 0.5·FinancialMateriality + 0.5·ImpactMateriality` with a double-materiality matrix, evidence
> trails, and IRO-1 documentation (ESRS 1). **None of that exists in code.** The page implements a
> **four-branch climate-adjusted credit-risk profiler** for a single synthetic entity: PD consensus
> (Exponential + Merton + Tabular + Monte-Carlo), ESG-adjusted WACC, ECL (12-month & lifetime), VaR/CVaR
> and a "DMI" composite. Below documents the code.

### 7.1 What the module computes

`buildEntity(name,i)` derives a per-entity seed `s(k)=sr(hashStr(name) mod 9973 + i·37 + k)` and runs
**four independent PD models**, combined into a consensus:

```js
// A — Exponential real-time (climate velocity)
pdExp    = clamp(pdBase · exp(αT · velocityT), 0.001, 0.85)
// B — Merton distance-to-default (stranded-asset haircut on assets)
adj = assetV·(1 − haircut)
d1  = [ln(adj/debt) + (r + 0.5σ²)·T] / (σ√T) ;  d2 = d1 − σ√T
pdMerton = clamp(Φ(−d2), 0.001, 0.95)
// C — Tabular ESG band multiplier
pdTab = pdBase · {low 1.05, medium 1.30, high 2.00, severe 3.25}[band]
// D — Monte-Carlo (500 deterministic sr()-driven trials)
for k in 0..499:  shock = −3 + sr(seed + 7k)·6
                  simPD = pdBase · exp(αT·velT + βP·velP + 0.05·shock)
                  hits += (simPD > 0.05)
pdMC = hits/500
// Consensus
pdConsensus = clamp(pdExp·0.30 + pdMerton·0.30 + pdTab·0.20 + pdMC·0.20, 0.001, 0.90)
```

Then:
```
WACC_adj = wE·(cE + esgEqPrem) + wD·(cD + esgDebtSpread)·(1 − tax)   ; bpsChange vs baseline
ECL_12m  = PD·LGD·EAD·1.0     ; ECL_life = PD·LGD·EAD·3.2
DMI      = finScore·0.40 + esgScore·0.40 + velScore·0.20            (clamped 10–95)
var95/99/cvar, climateFactor = 1 + αT·max(velocityT,0)
```

### 7.2 Parameterisation / scoring rubric

**Sector coefficients** (adds `betaP` physical elasticity vs the dashboard):

| Sector | αT | βP | baseVol | haircut | LGD |
|---|---|---|---|---|---|
| Energy | 0.18 | 0.14 | 0.35 | 0.25 | 0.55 |
| Materials | 0.14 | 0.11 | 0.28 | 0.18 | 0.48 |
| Financials | 0.09 | 0.12 | 0.24 | 0.10 | 0.50 |
| Technology | 0.07 | 0.06 | 0.32 | 0.05 | 0.35 |
| default | 0.08 | 0.07 | 0.25 | 0.10 | 0.42 |

| Constant | Value | Provenance |
|---|---|---|
| ESG-band PD multipliers | low 1.05 / med 1.30 / high 2.00 / severe 3.25 | `pdTabular` — heuristic |
| Lifetime ECL factor | ×3.2 | `calculateECL` — fixed proxy for lifetime/12m ratio |
| MC trials / threshold | 500 / simPD>0.05 | `pdMonteCarlo` (deterministic via `sr`) |
| Risk-free r | 0.04 | Merton input |
| Consensus weights | 0.30/0.30/0.20/0.20 | hand-set |

Seeded ranges: `pdBase 1–13%`, `velocityT −0.3…+0.3`, `velP −0.2…+0.2`, `assetV $500–5000M`,
`debt 20–80% assets`, scores 20–90, `ead 30–80% assets`.

### 7.3 Calculation walkthrough

Entity picked → `buildEntity` produces the profile above → tiles show pdConsensus, DMI, ECL, WACC,
regime (from z-score bands), IFRS-9 stage. A 12-month `dmiHistory` is `sr()`-seeded around the DMI.
A 9-dimension benchmark radar (`BENCH_DIMS`) and 4 disclosure references round out the view.

### 7.4 Worked example (four-branch consensus)

Energy entity: `pdBase = 0.06`, `αT=0.18`, `velocityT=0.2`, `βP=0.14`, `velP=0.1`, band = high,
`assetV=3000`, `debt=1500`, `haircut=0.25`, `vol=0.35`.

| Branch | Computation | PD |
|---|---|---|
| A Exponential | 0.06·exp(0.18·0.2)=0.06·1.0366 | 0.0622 |
| B Merton | adj=2250, ln(2250/1500)=0.405, d1=(0.405+0.101)/0.35=1.446, d2=1.096, Φ(−1.096) | 0.1365 |
| C Tabular | 0.06·2.00 | 0.1200 |
| D Monte-Carlo | fraction of 500 trials with 0.06·exp(0.036+0.014+0.05·shock)>0.05 ≈ | 0.55 |
| **Consensus** | 0.0622·0.30 + 0.1365·0.30 + 0.12·0.20 + 0.55·0.20 | **0.1696** |

ECL_12m with LGD 0.55, EAD = 3000·0.5 = 1500: `0.1696·0.55·1500 = $139.9M`; lifetime ×3.2 = **$447.7M**.

### 7.5 Data provenance & limitations

- **Single-entity data is synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The **Monte-Carlo branch is not stochastic** — 500 `sr()` draws are deterministic, so `pdMC` is
  reproducible but not a true sampled distribution; it can dominate the consensus (0.55 in the example),
  pulling PD far above the other three branches.
- Merton and the exponential overlay are correctly coded but on random inputs.
- No double-materiality, no evidence trail, no IRO-1 pack — the guide's EMS is unimplemented.

**Framework alignment:** **Merton (1974)/KMV** structural PD; **IFRS 9** ECL (`PD·LGD·EAD`) and 12-month
vs lifetime distinction (§5.5.5); **NGFS/EBA** climate PD-uplift via `exp(αT·velocityT)`; **PCAF**-style
LGD priors. The tabular ESG-band multiplier mimics rating-agency ESG-notching but with invented factors.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Deliver an auditable entity-level climate-adjusted credit profile (PD/LGD/ECL, WACC uplift, VaR) for a
single named obligor, from real financials and NGFS pathways — supporting credit decisions and TCFD/
ISSB financial-effect disclosure.

### 8.2 Conceptual approach
Ensemble PD: **Merton structural** (Moody's KMV/EDF) as the anchor, a **NGFS-calibrated reduced-form
overlay**, and a **rating-migration/ESG-notch** adjustment, combined by inverse-variance weighting rather
than fixed weights. Benchmarks: Moody's climate-adjusted EDF, S&P ESG credit-indicator notching,
Aladdin Climate, EBA 2022 stress-test PD multipliers.

### 8.3 Mathematical specification
```
De-lever equity vol → σ_A (Merton iteration on E = A·Φ(d1) − D·e^{−rT}·Φ(d2))
d2 = [ln(A(1−haircut)/D) + (r − climateDrift − 0.5σ_A²)T]/(σ_A√T)
PD_struct = Φ(−d2)
PD_rf     = PD_base · exp(NGFS_multiplier_s − 1)
PD_ens    = Σ_m (1/σ_m²)·PD_m / Σ_m (1/σ_m²)     (inverse-variance blend)
WACC_adj  = wE·(cE + λ_E·climatePremium) + wD·(cD + λ_D·spread)(1−tax)
ECL_life  = Σ_t PD_t·LGD·EAD_t·DF_t              (term-structure, discounted)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Asset drift/haircut | climateDrift, haircut | NGFS Phase IV transition paths, CRREM stranding |
| NGFS PD multiplier | — | EBA/ECB 2022 climate stress test |
| σ_A | — | de-levered equity vol (market data) |
| LGD | — | PCAF DQ / internal recoveries |
| ESG notch | — | S&P/Moody's ESG credit indicators |

### 8.4 Data requirements
Obligor financials (assets, debt, EAD), equity vol, sector, disclosure texts (for real ESG band vs the
random one), NGFS scenario variables. Platform holds `SECTOR_COEFF`, NGFS labels, `climate_scenarios`
tables, and the disclosure list — real filings would replace synthetic bands.

### 8.5 Validation & benchmarking plan
Reconcile PD_ens vs Moody's EDF and agency PDs on overlap; calibration/backtest against realised
defaults; replace deterministic MC with a real antithetic-variate simulation and check its variance
converges; WACC uplift sanity-checked against green-vs-brown spread evidence.

### 8.6 Limitations & model risk
Merton is weak for financials and thin capital structures; single-name PD is noisy. Fixed consensus
weights over-weight the MC branch. Conservative fallback: if σ_A cannot be inferred, drop the Merton
branch and widen the confidence band rather than emitting a spuriously precise PD.

## 9 · Future Evolution

### 9.1 Evolution A — Build the double-materiality engine the guide describes (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide promises `EMS = 0.5·Financial + 0.5·Impact` with a double-materiality matrix, evidence trails, and IRO-1 documentation — "none of that exists in code." What runs instead is a four-branch climate-adjusted credit profiler (Exponential/Merton/Tabular/Monte-Carlo PD consensus, ESG-WACC, ECL, VaR/CVaR) over per-entity hash-seeded inputs (`pdBase = 0.01 + s(3)·0.12`, seeded 12-month "dmiHistory"). Evolution A builds the actual entity materiality vertical and relocates the credit machinery to where it belongs.

**How.** (1) New backend `api/v1/routes/dme_entity.py` + tables `dme_topic_scores` (entity × topic × financial/impact score × date) and `dme_evidence_items` (source, URL, topic tag, relevance) — the persistence layer the whole DME family's §9 entries depend on. (2) Financial-materiality scoring seeded from real signals the platform already has: `esg-controversy` events, `dme-nlp-engine` sentiment, sector baselines from the SASB Materiality Map; impact scoring from severity/breadth/irremediability inputs entered per ESRS 1 §3.2 with the configurable 0.5/0.5 weighting. (3) The PD-consensus code moves server-side into `dme-pd-engine`'s vertical (its natural owner) rather than being deleted — the math is competent; only its synthetic inputs and its location are wrong. (4) Trend charts read persisted score history, not `sr()` drift.

**Prerequisites.** Topic taxonomy fixed (ESRS AR16 topic list is in the refdata layer); agreement across DME siblings on the `dme_topic_scores` schema, since dashboard/competitive/alerts all consume it. **Acceptance:** the double-materiality matrix renders from DB rows; each plotted topic exposes ≥1 linked evidence item; zero `s(k)` draws in the rendered path.

### 9.2 Evolution B — IRO-1 documentation-pack drafter with evidence citation (LLM tier 2)

**What.** The overview's export step — "IRO-1 documentation pack with scored topics, evidence citations, and assessment rationale" — is the platform's clearest tier-2 use case: an assurance-facing document where every claim must be source-linked. The analyst drafts the ESRS 1 §3.2 assessment rationale per topic, pulling scores from `dme_topic_scores`, quoting evidence from `dme_evidence_items`, and flagging topics whose evidence base is too thin to defend under limited assurance.

**How.** Tool surface = Evolution A's read endpoints (entity profile, topic scores, evidence query); drafting grounded in the ESRS 1 reference corpus already cited in §5. Every materiality conclusion in the draft carries the topic's computed score and its evidence-item IDs; the no-fabrication validator additionally checks that quoted evidence text matches the stored item verbatim (mis-quoted evidence in an assurance pack is worse than a wrong number). Output renders through report-studio; thin-evidence topics get an explicit "insufficient evidence — assessment provisional" block, mirroring honest-nulls.

**Prerequisites (hard).** Evolution A end-to-end — today the page has no topic scores and no evidence repository, so there is literally nothing to cite; drafting IRO-1 from the current seeded credit profile would fabricate an assurance document. **Acceptance:** a golden entity's pack contains zero uncited materiality conclusions, and an auditor can resolve every citation to a stored evidence row.