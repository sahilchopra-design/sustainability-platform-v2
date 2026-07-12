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
