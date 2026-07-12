# UK SDR
**Module ID:** `uk-sdr` · **Route:** `/uk-sdr` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
UK Sustainability Disclosure Requirements compliance analytics platform covering investment product labelling, naming and marketing rules under FCA SDR PS23/16, with anti-greenwashing integration.

> **Business value:** UK SDR labels are operational from July 2024; the anti-greenwashing rule applies to all FCA-authorised firms; non-compliance risks FCA enforcement action and reputational damage in a scrutinised market.

**How an analyst works this module:**
- Assess product eligibility for SDR label category
- Verify sustainability focus proportion meets 70%+ threshold
- Review fund naming and marketing materials against anti-greenwashing rule
- Prepare sustainability product disclosure document (PDD)
- Submit to FCA register and conduct ongoing label maintenance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GREENWASH_FLAGS`, `KpiCard`, `PRODUCTS`, `PROVIDERS`, `SDR_LABELS`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SDR_LABELS` | 5 | `name`, `description`, `products`, `aum`, `consumers`, `disclosure` |
| `GREENWASH_FLAGS` | 7 | `count`, `severity`, `examples` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `adoptionTrend` | `YEARS.map((yr, i) => ({` |
| `TABS` | `['Overview', 'Labels', 'Anti-Greenwashing', 'Product Portfolio', 'Disclosure Tracker', 'Comparatives', 'Compliance'];` |
| `labelBarData` | `useMemo(() => SDR_LABELS.map(l => ({` |
| `gwData` | `useMemo(() => GREENWASH_FLAGS.map(f => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/uk-sdr/assess/batch` | `assess_batch` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/labels` | `ref_labels` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/naming-rules` | `ref_naming_rules` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/uk_sdr.py |
| GET | `/api/v1/uk-sdr/ref/timeline` | `ref_timeline` | api/v1/routes/uk_sdr.py |

### 2.3 Engine `uk_sdr_engine` (services/uk_sdr_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `UKSDREngine.assess` | product, assessment_date |  |
| `UKSDREngine._assess_labels` | product |  |
| `UKSDREngine._recommend_label` | label_results | Return the most appropriate eligible label (Impact > Focus > Improvers > Mixed). |
| `UKSDREngine._assess_agr` | product |  |
| `UKSDREngine._assess_naming` | product, recommended_label |  |
| `UKSDREngine._calculate_icis` | product, recommended_label | Proxy for the Independent Claims Integrity Score (ICIS). Not an FCA-defined metric — internal scoring proxy based on: - Evidence quality (30 pts) - Data coverage (25 pts) - Third-party verification (20 pts) - Methodology publication (15 pts) - Claims review / update process (10 pts) |
| `UKSDREngine._disclosure_obligations` | product, label |  |
| `UKSDREngine._priority_actions` | product, label_results, agr_results, naming, label |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `SDR`, `__future__` *(shared)*, `fastapi` *(shared)*, `force`, `launch`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `GREENWASH_FLAGS`, `PROVIDERS`, `SDR_LABELS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Products with SDR Label | — | FCA Register | Number of investment products awarded UK SDR sustainability labels (Focus, Improvers, Impact, Mixed Goals). |
| Sustainability Focus % | — | Portfolio Analytics | Proportion of AUM in assets meeting the sustainability focus test across SDR-labelled products. |
| Anti-Greenwashing Alerts | — | Compliance Monitor | Marketing materials flagged for potential breach of FCA anti-greenwashing rule requiring substantiated claims. |
- **Portfolio Holdings, ESG Scores, Marketing Materials, FCA Register** → Label eligibility engine + anti-greenwashing scanner + PDD generator → **Label eligibility reports, PDDs, anti-greenwashing compliance alerts, FCA submission packages**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/uk-sdr/ref/agr-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total', 'blocking', 'effective_date', 'requirements', 'reference'], 'n_keys': 5}`

**GET /api/v1/uk-sdr/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['note', 'mappings', 'uk_taxonomy_status', 'issb_srs_status'], 'n_keys': 4}`

**GET /api/v1/uk-sdr/ref/labels** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'labels', 'regime', 'effective_date'], 'n_keys': 4}`

**GET /api/v1/uk-sdr/ref/naming-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['effective_date', 'reference', 'prohibited_without_label', 'key_rules', 'example_compliant', 'example_non_compliant'], 'n_keys': 6}`

**GET /api/v1/uk-sdr/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['regime', 'milestones', 'scope', 'reference'], 'n_keys': 4}`

**POST /api/v1/uk-sdr/agr-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/uk-sdr/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/uk-sdr/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SDR Label Eligibility Score
**Headline formula:** `LES = Min(Sustainability Focus, Paris Alignment, Robustness) ≥ 70`

Composite eligibility check across sustainability focus proportion, climate alignment and governance robustness; all three dimensions must exceed threshold for label award.

**Standards:** ['FCA PS23/16 SDR 2023', 'FCA Anti-Greenwashing Rule 2024']
**Reference documents:** FCA PS23/16 Sustainability Disclosure Requirements 2023; FCA Anti-Greenwashing Rule GC22/1 2024; FCA SDR Consumer-Facing Disclosures; UK Green Taxonomy (pending)

**Engine `uk_sdr_engine` — extracted transformation lines:**
```python
score = min(score * multiplier, 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a Label Eligibility Score formula
> `LES = min(Sustainability Focus, Paris Alignment, Robustness) ≥ 70`. **No such score, minimum
> function, or threshold check exists anywhere in the code.** Each product's `label` is a
> pre-assigned field (round-robin cycling through the 4 SDR categories), not the output of an
> eligibility test. The sections below document what the code actually computes.

### 7.1 What the module computes

4 hand-set UK SDR label categories (Sustainability Focus, Improvers, Impact, and non-labelled "Mixed
Goals") with real, plausible aggregate figures (products count, AUM), plus a synthetic 30-product
portfolio and 6 hand-curated anti-greenwashing flag categories. No PRNG-independent field is
combined into a composite score anywhere in the file — every displayed metric is either a static
constant or a simple filter/sum over the 30-product array.

```
Labelled Products = Σ SDR_LABELS[not 'mixed'].products     // static sum, not computed per-product
Labelled AUM       = Σ SDR_LABELS[not 'mixed'].aum          // static sum
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `SDR_LABELS` (4) | Sustainability Focus (142 products, £38.2Bn AUM, Full disclosure), Improvers (87, £22.8Bn, Full), Impact (54, £15.6Bn, consumer-facing, Enhanced disclosure), Mixed Goals (312, £84.5Bn, Basic, no label required) | Hand-set aggregate figures, directionally consistent with the real UK SDR regime's expectation that "Mixed Goals" (no label) vastly outnumbers actual labelled products in the early adoption period |
| `PRODUCTS` (30) | Provider (12 real UK/global asset managers), label (round-robin), `aum` 200–4200 (£M), `greenwashRisk` 15–55, `complianceScore` 60–90 | `sr()`-seeded; provider names are real (BlackRock, Schroders, LGIM, Aviva, abrdn, M&G, Fidelity, Jupiter, HSBC AM, Invesco, Vanguard, Baillie Gifford) but product-level figures are illustrative |
| `GREENWASH_FLAGS` (6) | Vague Sustainability Claims (48, High), Misleading Product Names (31, High), Inconsistent Disclosure (62, Medium), Missing KPI Targets (89, Medium), Outdated Benchmarks (27, Low), Scope 3 Omissions (54, High) | Hand-curated categories reflecting real, commonly-cited greenwashing patterns identified by the FCA and ESMA in fund marketing reviews |
| `adoptionTrend` (2021–2025) | Focus 80→~152, Improvers 45→~101, Impact 28→~68 (base + linear growth + noise) | Synthetic but directionally consistent with the real UK SDR rollout timeline (labels only became available from July 2024, so pre-2024 "adoption" figures represent precursor voluntary sustainability-fund AUM growth, not actual SDR labels) |

### 7.3 Calculation walkthrough

1. **Overview KPIs**: `Labelled Products`/`Labelled AUM` are direct sums over the 3 non-"mixed"
   `SDR_LABELS` entries — genuinely computed, but from hand-set constants, not from the 30-product
   synthetic portfolio (which has its own independent, unreconciled `label` assignments).
2. **Product filtering**: `filteredProducts` applies provider/label filters over the 30-product
   array — a simple, correctly implemented filter.
3. **Label adoption chart**: bar chart of `labelBarData` (products, AUM/£Bn) per `SDR_LABELS`
   category — direct pass-through of the static constants.
4. **Anti-greenwashing chart**: bar chart of `GREENWASH_FLAGS` counts by category — static
   pass-through.
5. **What's missing**: no eligibility scoring, no per-product label-qualification check against a
   sustainability-focus/Paris-alignment/robustness threshold — the 30-product `label` field is
   simply assigned by round-robin index (`i%4`) at generation time, not earned through any test.

### 7.4 Worked example (Product #1, "BlackRock Global Equity Fund", `i=0`)

| Field | Computation | Result |
|---|---|---|
| Label | `SDR_LABELS[0%4].id` | **focus** (Sustainability Focus) |
| AUM | `sr(0)×4000+200` | **£3,039M** |
| Greenwash risk | `sr(11)×40+15` | **43.4** |
| Compliance score | `sr(23)×30+60` | **81.3** |

This product is labelled "Sustainability Focus" purely because it is the 1st product generated
(`i=0`, `0%4=0`) — the same label would apply to products #5, #9, #13... regardless of their
`greenwashRisk` (43.4, moderate-high) or `complianceScore` (81.3, good) values, since no rule
connects the label assignment to either metric.

### 7.5 Companion analytics

- **Anti-Greenwashing tab** — renders the 6-category flag table with count/severity/examples,
  contextualising the July 2024 FCA anti-greenwashing rule.
- **Disclosure Tracker tab** — presumably tracks per-label disclosure completeness (Full/Enhanced/
  Basic per `SDR_LABELS`), a static field.
- **Comparatives tab** — cross-provider/cross-label comparison over the 30-product filtered set.

### 7.6 Data provenance & limitations

- **No label-eligibility scoring logic exists**, despite this being the guide's headline
  methodology — a product's SDR label in this module cannot be traced to any sustainability-focus,
  Paris-alignment, or governance-robustness assessment.
- **The 4-category aggregate figures (`SDR_LABELS`) and the 30-product synthetic portfolio
  (`PRODUCTS`) are unreconciled** — summing `PRODUCTS.aum` by label would not reproduce the
  `SDR_LABELS.aum` figures, since the two datasets are independently authored.
- Provider names are real UK/global asset managers, but per-product AUM, greenwash risk, and
  compliance scores are synthetic and should not be read as actual fund characteristics.
- Pre-2024 "adoption trend" figures necessarily represent proxy/precursor data since UK SDR labels
  only became legally available from July 2024 — the chart does not caveat this distinction.

### 7.7 Framework alignment

- **FCA PS23/16 (UK Sustainability Disclosure Requirements)**: the 4-label taxonomy (Sustainability
  Focus, Improvers, Impact, plus unlabelled Mixed Goals) is accurate to the real regime's structure,
  including the correct detail that "Impact" is the only label requiring consumer-facing enhanced
  disclosure among the three formally labelled categories.
- **FCA Anti-Greenwashing Rule (in force July 2024)**: correctly dated and the 6 flag categories
  (vague claims, misleading names, inconsistent disclosure, missing KPIs, outdated benchmarks, Scope
  3 omissions) reflect genuine areas of FCA/ESMA supervisory scrutiny in fund marketing reviews.
- **Sustainability Product Disclosure Document (PDD)** and **UK Green Taxonomy** (pending): both
  correctly referenced as related/forthcoming regulatory instruments in the guide, though neither is
  implemented as a calculation in this module.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the real eligibility engine to the page and repair /assess (analytics ladder: rung 1 → 2)

**What.** This module has an unusual inversion: a genuine backend engine exists
(`UKSDREngine.assess` with `_assess_labels`, `_recommend_label`, `_assess_agr`,
`_assess_naming`, `_calculate_icis`) but the frontend never uses it — §7 flags that
the page's 30 products get labels by round-robin `i%4`, no eligibility test runs, and
the `SDR_LABELS` aggregates and `PRODUCTS` portfolio are unreconciled. Worse, the
lineage harness shows `POST /assess` and `POST /assess/batch` currently **failed**
while the five `GET /ref/*` routes pass. Evolution A repairs the two failing POST
routes, then rebuilds the Product Portfolio tab to call `POST /assess/batch` so every
displayed label is the engine's `_recommend_label` output (Impact > Focus > Improvers
> Mixed precedence) and greenwash risk comes from `_assess_agr`, deleting the
round-robin assignment and the §7 mismatch flag.

**How.** (1) Diagnose the POST failures (likely request-schema mismatch — the GET refs
pass, so the router loads). (2) Persist assessments to a new `uk_sdr_assessments`
table so the Disclosure Tracker reflects real assessment history. (3) Derive the
Overview KPIs from assessed products instead of the hand-set `SDR_LABELS` constants.

**Prerequisites.** Acknowledge the documented frontend/backend disconnect and the two
failing endpoints; a fixture product payload for regression. **Acceptance:** lineage
harness shows `/assess` and `/assess/batch` passing; a product failing the 70%
sustainability-focus test renders as unlabelled regardless of its position in the list.

### 9.2 Evolution B — Anti-greenwashing marketing-copy reviewer (LLM tier 2)

**What.** The FCA anti-greenwashing rule is about language — substantiating claims in
fund names and marketing materials — which makes this the platform's most natural LLM
fit. Evolution B adds a reviewer that takes pasted fund marketing copy or a fund name,
calls `GET /ref/naming-rules` (which already returns `prohibited_without_label`,
`key_rules`, `example_compliant`, `example_non_compliant`) and `POST /assess` as
tools, and returns rule-by-rule findings mapped to the module's 6 real greenwash flag
categories (vague claims, misleading names, inconsistent disclosure, missing KPIs,
outdated benchmarks, Scope 3 omissions), each citing the specific PS23/16 naming rule
breached and the engine's ICIS sub-score it affects.

**How.** Tier-2 tool-calling over the existing uk_sdr routes; the grounding corpus is
this Atlas page plus the ref endpoints' own payloads (they carry `reference` fields to
FCA documents). Findings are advisory drafts, never auto-filed: output feeds a human
compliance queue. Log `(copy, findings, reviewer accept/reject)` into `llm_traces` as
tier-4 training data.

**Prerequisites (hard).** Evolution A's `/assess` repair — a reviewer citing a broken
assessment endpoint would be untrustworthy; RBAC-gated since marketing copy is
client-confidential. **Acceptance:** for the ref endpoint's own `example_non_compliant`
fund name, the reviewer flags the correct rule; for `example_compliant`, it raises no
finding; every cited rule string matches the `/ref/naming-rules` payload verbatim.