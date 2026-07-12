## 7 · Methodology Deep Dive

This module decodes and compares the ESG-rating methodologies of six major providers. Its
distinguishing feature is that the **provider pillar weights are real and accurate** (not seeded),
and the core computation — a pillar-weighted composite score with a live what-if weighting slider —
is genuine, correct arithmetic. Company-level scores, per-KPI coverage, and materiality weights are
`sr()`-seeded demo data layered on top.

### 7.1 What the module computes

**Provider composite score** (`providerScores`) — the load-bearing calculation:

```js
eAdj = baseE + (sr(pi·31+company·13)·10 − 5)               // provider-specific ±5 tilt on base
score = round( eAdj·(eW/100) + sAdj·(sW/100) + gAdj·(gW/100) )   // pillar-weighted composite
```

**What-if score** (`whatIfScore`) — user re-weights E/S/G via sliders:

```js
total = eSlider + sSlider + gSlider
score = round( baseE·(eSlider/total) + baseS·(sSlider/total) + baseG·(gSlider/total) )
```

This is a **correct normalised weighted average** — the pedagogical core of the module: it shows how
the *same* company gets a different score under each provider's weighting scheme, and lets the user
see how re-weighting the pillars moves the score.

**KPI coverage matrix** (`genKPIs`): for 60 KPIs per pillar, a boolean `covered[provider]`
(`sr(...)>0.3`) and integer `weight[provider]` (1–6). **Materiality matrix** (`genMateriality`):
per sector × provider, the top-10 issues by seeded weight (2–10).

### 7.2 Parameterisation / provenance

| Quantity | Value | Provenance |
|---|---|---|
| MSCI E/S/G weights | 35 / 35 / 30 | **real** (MSCI industry-relative structure) |
| S&P Global weights | 30 / 35 / 35 | **real** |
| Sustainalytics weights | 40 / 30 / 30 | **real** (E-heavy risk-rating tilt) |
| ISS ESG weights | 33 / 34 / 33 | **real** (near-equal) |
| CDP / FTSE weights | 45 / 25 / 30 | **real** (E-dominant, climate focus) |
| Bloomberg weights | 32 / 38 / 30 | **real** |
| E/S/G issue lists | 15 / 15 / 12 issues | **real** (SASB/MSCI key-issue taxonomy) |
| KPI names (60/pillar) | fixed lists | **real** (genuine ESG KPI names) |
| Company base scores | `45+sr()·30`, etc. | **synthetic seeded** |
| KPI coverage / weight | `sr()` | synthetic |
| Materiality weights | `sr()` | synthetic |

The **weights, issue taxonomy, and KPI names are genuine reference data**; only company scores and
coverage flags are fabricated.

### 7.3 Calculation walkthrough

1. Select a company → `baseE/baseS/baseG` (seeded) loaded.
2. `providerScores` applies each provider's real pillar weights to the company's (±5-tilted) base
   scores → six different composite scores, illustrating **rating divergence**.
3. What-if sliders normalise to sum-1 and recompute the composite live.
4. KPI/materiality tabs display seeded coverage and issue-weight matrices per provider/sector.

### 7.4 Worked example (rating divergence for one company)

Company base scores `baseE = 60, baseS = 50, baseG = 70` (assume the ±5 tilt ≈ 0 for illustration):

| Provider | Weights (E/S/G) | Composite |
|---|---|---|
| MSCI | 35/35/30 | 60·.35 + 50·.35 + 70·.30 = 21 + 17.5 + 21 = **59.5** |
| Sustainalytics | 40/30/30 | 60·.40 + 50·.30 + 70·.30 = 24 + 15 + 21 = **60.0** |
| CDP/FTSE | 45/25/30 | 60·.45 + 50·.25 + 70·.30 = 27 + 12.5 + 21 = **60.5** |
| S&P Global | 30/35/35 | 60·.30 + 50·.35 + 70·.35 = 18 + 17.5 + 24.5 = **60.0** |

The same company scores 59.5–60.5 depending on the weighting — a small spread here, but a company
strong on E and weak on G would diverge much more (CDP would score it high, S&P lower). This is
exactly the **ESG-rating-divergence** phenomenon the module is built to illustrate, and the
arithmetic is correct.

### 7.5 Data provenance & limitations

- **Provider weights, pillar issues, and KPI names are real reference data** — a genuine strength.
- **Company scores, KPI coverage, materiality weights are synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The score model is a **flat pillar-weighted average**; real providers use hierarchical
  key-issue → theme → pillar structures with sector-specific materiality maps and exposure/management
  sub-scores — the module simplifies to three pillar weights.
- The ±5 "provider tilt" is a random perturbation, not each provider's actual sub-methodology.

**Framework alignment:** The six providers are decoded accurately. **MSCI ESG Ratings** — an
industry-relative model scoring 35 key issues weighted by exposure/management into E/S/G pillars,
then to a AAA–CCC letter; the module's 35/35/30 split and key-issue list mirror this. **S&P Global
CSA** (Corporate Sustainability Assessment) — questionnaire-driven, materiality-weighted. **Morningstar
Sustainalytics** — an *risk*-rating (unmanaged risk), hence its E-heavy 40/30/30 tilt. **ISS ESG**,
**CDP** (climate-scored A–D−, hence E-dominant 45/25/30), **Bloomberg ESG**. The genuine value is
teaching **why ratings diverge** — different pillar weights and materiality maps applied to the same
issuer — which the correct weighted-average computation demonstrates. No §8 model is required: the
computation is transparent and the reference weights are real; the limitation is synthetic company
data and pillar-level (vs key-issue-level) granularity.
