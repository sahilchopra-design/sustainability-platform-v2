# Critical Mineral Geo Risk
**Module ID:** `critical-mineral-geo-risk` · **Route:** `/critical-mineral-geo-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CV3 · **Sprint:** CV

## 1 · Overview
8 minerals with processing concentration, friendshoring index, and export control scenarios.

**How an analyst works this module:**
- Supply Chain Map shows mining and processing concentration
- Export Control Scenarios model China REE restrictions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRIENDSHORING`, `MINERALS`, `PORTFOLIO_IMPACT`, `PRICE_TREND`, `PROCESSING_CONC`, `SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERALS` | 9 | `mining_top`, `processing_china`, `oecd_share`, `price_vol`, `ev_critical` |
| `SCENARIOS` | 6 | `probability`, `impact`, `affected`, `ev_delay`, `price_spike` |
| `PRICE_TREND` | 7 | `lithium`, `cobalt`, `nickel`, `copper`, `ree` |
| `PORTFOLIO_IMPACT` | 9 | `exposure`, `minerals`, `mitigation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PROCESSING_CONC` | `MINERALS.map(m => ({ mineral: m.name, china: m.processing_china, other: 100 - m.processing_china }));` |
| `FRIENDSHORING` | `MINERALS.map(m => ({ mineral: m.name, oecd: m.oecd_share, nonOecd: 100 - m.oecd_share }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS`, `PORTFOLIO_IMPACT`, `PRICE_TREND`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Minerals | — | USGS | Li, Co, Ni, Cu, REE, graphite, Mn, PGMs |

## 5 · Intermediate Transformation Logic
**Methodology:** Mineral supply chain geopolitical risk
**Headline formula:** `GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`

China controls 60-90% of processing for most critical minerals. Friendshoring index: OECD vs non-OECD supply share.

**Standards:** ['USGS', 'IEA']
**Reference documents:** USGS Mineral Commodity Summaries; IEA Critical Minerals

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (formula not implemented).** The guide (EP-CV3) states the engine computes
> `GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`. **No such composite
> is calculated in the code.** The page *displays* curated per-mineral mining shares, China processing
> percentages, OECD friendshoring shares, and price volatility — all as stored constants — and renders
> curated export-control scenarios, but it never multiplies concentration × processing × instability into a
> `GeoRisk` score. So the underlying data is real and well-chosen, but the headline formula is aspirational.
> The sibling module `critical-mineral-geopolitics` *does* compute the concentration half (HHI) — see §7.5.
> §8 specifies the composite geo-risk score this module's guide promises.

### 7.1 What the module computes

Almost nothing is derived — the module is a curated-data display with a few pass-through transforms:

```js
PROCESSING_CONC = MINERALS.map(m ⇒ ({ china: m.processing_china, other: 100 − m.processing_china }))
FRIENDSHORING   = MINERALS.map(m ⇒ ({ oecd: m.oecd_share, nonOecd: 100 − m.oecd_share }))
sel = MINERALS.find(m ⇒ m.name == selectedMineral)     // selected mineral's stored fields
```

There is no HHI, no instability weighting, and no `GeoRisk` product. Every displayed number is a stored
constant; only the `100 − x` complements are computed.

### 7.2 Parameterisation / scoring rubric

**Curated mineral geo-data (not seeded):**

| Mineral | Top miners | China processing | OECD share | Price vol |
|---|---|---|---|---|
| Lithium | Australia 47%, Chile 30% | 62% | 52% | 38% |
| Cobalt | DRC 73%, Indonesia 5% | 74% | 12% | 42% |
| Rare Earths | China 60%, Myanmar 12% | 90% | 14% | 55% |
| Graphite | China 65%, Mozambique 12% | 93% | 8% | 28% |
| PGMs | South Africa 72%, Russia 12% | 18% | 15% | 32% |

`PRICE_TREND` is a curated 2020–2025 index (lithium spike to 520 in 2022, back to 160 in 2025 — real).
`SCENARIOS` (5) are curated export-control events with probability bands and price-spike ranges (e.g.
"China REE export ban → 200–400% spike"). `PORTFOLIO_IMPACT` maps 8 real companies (Tesla, Glencore,
Umicore…) to exposure levels and mitigation strategies — all editorial.

### 7.3 Calculation walkthrough

1. `MINERALS`, `SCENARIOS`, `PRICE_TREND`, `PORTFOLIO_IMPACT` are module-level curated constants.
2. `PROCESSING_CONC` and `FRIENDSHORING` derive the "other/non-OECD" complements for stacked bars.
3. Six tabs render: supply-chain map (mining shares), processing concentration, friendshoring index,
   export-control scenarios, price volatility (the trend), portfolio impact. The mineral selector and
   scenario index only choose which stored record to display.

### 7.4 Worked example

Rare Earths: `processing_china = 90` → `PROCESSING_CONC = {china: 90, other: 10}`; `oecd_share = 14` →
`FRIENDSHORING = {oecd: 14, nonOecd: 86}`. These are the *displayed* values. A genuine `GeoRisk` per the
guide would combine them: mining HHI (China 60² + Myanmar 12² + … ≈ 3,900+), processing concentration
(90%), and a governance/instability weight for the dominant supplier — but the code produces no such
number. The "China REE export ban" scenario (medium probability, 200–400% spike, 12–18mo EV delay) is a
curated card, not a modelled shock.

### 7.5 Companion analytics on the page

Supply-chain map, processing-concentration bars, friendshoring (OECD vs non-OECD) stacks, export-control
scenario cards, price-volatility trend, and portfolio-impact table. No backend engine or route. The
concentration mathematics the guide implies (HHI) is implemented in the sibling `critical-mineral-
geopolitics` module (`HHI = Σ share²` over mining/processing shares), which this module could reuse.

### 7.6 Data provenance & limitations

- **Curated real data, not seeded** — mining shares, processing dominance, OECD shares, and the price
  trend track IEA/USGS figures. `sr()` is not used.
- **The guide's `GeoRisk` composite is not computed** — the page shows the *inputs* to such a score
  (concentration, processing, price volatility) but never multiplies them into a risk index, and there is
  no governance/instability weight in code.
- Scenarios and portfolio impacts are static editorial cards, not probabilistic model outputs.

**Framework alignment:** *IEA Critical Minerals* — the mining/processing concentration and friendshoring
framing follow IEA's supply-security analysis. *USGS* underpins the country shares. The friendshoring index
(OECD vs non-OECD supply) reflects the *de-risking* policy lens (US IRA, EU CRMA). The concentration and
governance-weighted composite the guide describes is specified below.

---

## 8 · Model Specification — Composite Mineral Geopolitical Risk Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute a per-mineral (and portfolio-weighted) geopolitical supply-risk score combining production/
processing concentration with supplier governance and trade dependence, to rank chokepoints and stress
portfolio exposure. Coverage: the 8 minerals here (extendable to the 15 in the sibling module).

### 8.2 Conceptual approach
Implement the guide's product form using a **Herfindahl-Hirschman Index** for concentration and **World
Bank WGI** for governance risk — the same construction the sibling `critical-mineral-geopolitics` module
uses for HHI, plus the governance and trade legs. This mirrors the **EU Critical Raw Materials Act** supply-
risk methodology and the **IEA supply-risk** scoring.

### 8.3 Mathematical specification
```
HHI_mining_m     = Σ_c share_mining(c)²                  (0–10,000)
HHI_processing_m = Σ_c share_processing(c)²
Governance_m     = Σ_c share(c) · (1 − WGI_norm(c))      (share-weighted supplier governance risk)
TradeConc_m      = max_c share_processing(c) / 100        (single-processor reliance)
GeoRisk_m = w1·HHI_processing_m/10000 + w2·HHI_mining_m/10000 + w3·Governance_m + w4·TradeConc_m
Bands: HHI > 2500 concentrated · > 4000 critical chokepoint
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Country shares | `share_mining/processing` | USGS / IEA (already curated here) |
| Governance | `WGI_norm(c)` | World Bank WGI (rule of law, political stability) |
| Trade concentration | `TradeConc_m` | Processing single-country share |
| Weights | `w1..w4` | Calibrate to historical disruption impact |

### 8.4 Data requirements
Per-mineral country shares for mining and processing (present as `mining_top`/`processing_china`; would
need full country vectors as in the sibling module), and WGI scores per supplier country (free, World
Bank). Portfolio exposure by mineral (present in `PORTFOLIO_IMPACT`).

### 8.5 Validation & benchmarking plan
Reconcile HHI/GeoRisk rankings against EU CRMA supply-risk lists and IEA supply-security assessments;
backtest whether high GeoRisk minerals experienced the largest 2020–2024 price spikes (the `PRICE_TREND`
data). Sensitivity on weights and WGI normalisation.

### 8.6 Limitations & model risk
HHI ignores stockpiles, recyclability, and substitution (add as mitigants); governance weights are slow-
moving and can miss sudden export controls (overlay the scenario cards). Trade concentration double-counts
with HHI — orthogonalise. Conservative fallback: report HHI and China-processing share directly (as now)
alongside the composite so the drivers are transparent.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the GeoRisk composite by borrowing the sibling's HHI (analytics ladder: rung 1 → 2)

**What.** EP-CV3's data is real and well-chosen — curated mining shares, China
processing percentages, OECD friendshoring shares, and a price trend that tracks the
actual 2022 lithium spike — but §7's flag holds: the promised
`GeoRisk = SupplyConcentration × ProcessingConcentration × GeopoliticalInstability`
is never formed; the only computed values are `100 − x` complements. §7.5 points at
the fix: the sibling `critical-mineral-geopolitics` module already computes real
mining/processing HHI over the same kind of share data. Evolution A assembles the
composite from parts that mostly exist.

**How.** (1) Extract the HHI computation into a shared frontend engine (or a small
backend service both modules call) rather than duplicating — the platform's
shared-engine convention, applied deliberately this time. (2) Instability term: real
World Bank WGI political-stability percentiles per producing country (public,
curated refdata table), production-share-weighted per mineral — replacing the
missing third factor with a cited source rather than a seed. (3) Compose GeoRisk as
the documented product, normalized 0–100, with the three factors inspectable in a
drill-down; classify against stated thresholds. (4) Scenario cards stay editorial
but gain a computed hook: an export-control scenario recomputes the processing-
concentration factor with the restricted share removed, showing the GeoRisk delta.

**Prerequisites.** Coordination with `critical-mineral-geopolitics` (shared engine,
shared curated shares — one source of truth); WGI table curation. **Acceptance:**
rare earths (China 90% processing, low-WGI adjacency) scores above PGMs (18% China,
diversified) via the computed product; the drill-down shows all three factors and
their sources; a scenario toggle changes GeoRisk through the concentration factor
arithmetic.

### 9.2 Evolution B — Export-control scenario narrator (LLM tier 1)

**What.** The module's five curated export-control scenarios (probability bands,
price-spike ranges) are its most decision-relevant content but sit as static cards.
Evolution B turns a selected scenario into an impact narrative for the user's
context: which minerals' (post-Evolution A) GeoRisk moves and why, which
`PORTFOLIO_IMPACT` companies carry the exposure with their stored mitigation
strategies, what the friendshoring math says about substitution headroom
(`reshoreGapPct`, cost premium) — all quoted from the curated and computed fields,
with the scenario's probability band presented as the editorial estimate it is.

**How.** Tier-1 RAG over this Atlas record and the curated datasets; selected
scenario and mineral state pass as context. Honesty rules from §7.6: scenarios are
"static editorial cards, not probabilistic model outputs" — the copilot must
attribute probability bands to editorial judgment and never sharpen them into model
outputs; portfolio impact rows are editorial assessments of real companies and get
the same labelling. Tier 2 waits for a backend (the module has no endpoints).

**Prerequisites.** Evolution A (narrating a composite that doesn't exist yet is the
current trap); corpus embedding (D3). **Acceptance:** narratives cite scenario
cards, curated shares, and computed GeoRisk deltas distinctly; asked "what's the
probability really?", the copilot states the band's editorial provenance; companies
outside `PORTFOLIO_IMPACT` get no invented exposure assessment.