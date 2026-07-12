# Ocean CDR Finance Platform
**Module ID:** `ocean-cdr-finance` · **Route:** `/ocean-cdr-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EH4 · **Sprint:** EH

## 1 · Overview
Ocean carbon dioxide removal finance: OAE, kelp/macroalgae, electrochemical CDR, artificial upwelling, and ocean iron fertilisation. 18 seeded projects with operator profiles (Running Tide, Ebb Carbon, Planetary, Equatic), MRV challenge radar, permanence landscape, and frontier investor/buyer intelligence.

> **Business value:** Used by ocean CDR developers securing advance purchase contracts, frontier carbon buyers (Stripe Frontier) evaluating ocean removal quality, marine scientists designing MRV protocols, and investors in pre-commercial CDR.

**How an analyst works this module:**
- Review CDR approach cards for 6 ocean removal pathways
- Examine technology analysis for LCOC, CDR potential, and permanence comparison
- Use project pipeline for 18 operator profiles and funding stages
- Analyse MRV challenge radar and permanence tier landscape

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_APPROACHES`, `KpiCard`, `MARKET_SIZING`, `MRV_CHALLENGES`, `PROJECTS`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDR_APPROACHES` | 7 | `name`, `lcoc`, `potential`, `permanence`, `maturity`, `risk`, `co2Mechanism` |
| `MRV_CHALLENGES` | 7 | `score`, `description` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CDR_APPROACHES`, `MRV_CHALLENGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| OAE theoretical LCOC ($/tCO₂) | `Mineral cost + shipping + application − co-benefits` | Ebb Carbon + Planetary field data | Principal uncertainty: measurement of actual alkalinity uptake in open ocean; field trials ongoing 2024–2025. |
| Kelp CDR permanence (yr) | `Depends on sinking depth and ocean current` | Running Tide + Woods Hole Oceanographic | Kelp burial at >200m: decades to centuries; at >2km: centuries to millennia; highly location-dependent. |
| Ocean CDR market maturity | `No major registry methodology approved as of 2024` | ICVCM + Verra + Gold Standard | No ocean CDR credits in voluntary market at scale; Stripe Frontier advance purchases fund R&D; expected first registry approval 2026–2028. |
- **Nature OAE framework + Running Tide/Ebb Carbon/Planetary field data + Stripe Frontier terms** → MRV challenge radar + 18 operator profiles + permanence analysis + investor intelligence → **Ocean CDR developers, frontier carbon buyers, ocean scientists, and climate investors evaluating pre-commercial CDR**

## 5 · Intermediate Transformation Logic
**Methodology:** Ocean Alkalinity Enhancement CDR
**Headline formula:** `ΔDIC = (TA_added × Revelle_factor) / seawater_volume; net_CDR = ΔDIC × verification_factor`

OAE: $50–150/tCO2 theoretical; $150–400/tCO2 with current MRV costs; 10,000+ yr permanence; largest ocean CDR potential at Gt scale.

**Standards:** ['Nature (2024) – OAE Verification Framework', 'Ebb Carbon Field Trial Data', 'NOAA Ocean Acidification MRV Guidelines']
**Reference documents:** Nature (2024) – Ocean Alkalinity Enhancement Verification Framework; Running Tide (2024) – Annual CDR Report; Ebb Carbon (2024) – OAE Field Trial Results from Pacific Coast

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states an OAE mass-balance formula
> (`ΔDIC = (TA_added × Revelle_factor) / seawater_volume; net_CDR = ΔDIC × verification_factor`).
> **This formula is not implemented anywhere in the file.** No project computes ΔDIC, no Revelle
> factor is used, and no seawater-volume input exists. What the module actually does is present six
> real ocean-CDR *approaches* with hand-set reference `lcoc`/`potential`/`permanence` figures, then
> generate 18 synthetic *projects* (real operator names, `sr()`-jittered numbers) layered on top.

### 7.1 What the module computes

- **`CDR_APPROACHES`** (6 pathways) — Ocean Alkalinity Enhancement ($50/t LCOC, 1,000 MtCO₂/yr
  potential, 10,000yr permanence, R&D/Pilot maturity), Kelp Farming ($200/t, 500 Mt, 100yr, Pilot),
  Seaweed Burial ($150/t, 300 Mt, 1,000yr, R&D), Artificial Upwelling ($300/t, 200 Mt, 500yr, Early
  R&D), Electrochemical CDR ($400/t, 100 Mt, 10,000yr, Lab Scale), Ocean Iron Fertilisation ($25/t,
  3,000 Mt, 100yr, Experimental — correctly flagged "Very High" risk given its real, well-documented
  history of failed/controversial field trials). These base figures are hand-set reference values,
  broadly consistent with the real published cost/permanence ranges cited in ocean-CDR literature.
- **`PROJECTS`** (18 rows, cycling through 10 real operator names — Running Tide, Ebb Carbon,
  Planetary, Seafields, Calcarea, Equatic, Captura, Carbyne, Brilliant Planet, Ocean Visions — all
  genuine ocean-CDR startups) — each project's `lcoc` and `annualCDR` are `sr()`-jittered around its
  assigned approach's base LCOC (`baseLcoc × (0.8 + sr(i×17)×0.4)`, i.e. ±20% band), while
  `creditPrice`, `buyer` (6 real names: Stripe Frontier, Microsoft, Shopify, Google, Meta,
  Breakthrough Energy), `fundingStage`, and `mrvApproach` are independently drawn/cycled.
- **`MARKET_SIZING`** (2024–2033) — three technology-specific exponential-growth series
  (`oae: 0.1×2.5^i`, `kelp: 0.05×2.2^i`, `electrochem: 0.02×2.0^i`) — a deterministic compound-growth
  projection, not fit to any historical data (2024 is the first modelled year, so there's no
  historical anchor to calibrate against).
- **`MRV_CHALLENGES`** (6 dimensions, 30–60 "difficulty score") — Baseline Quantification,
  Additionality Proof, Permanence Uncertainty, Ecosystem Risk, Measurement Scalability, Registry
  Acceptance — qualitative, hand-set difficulty ratings.

### 7.2 Parameterisation

```js
project.lcoc      = round(approach.lcoc × (0.8 + sr(i×17)×0.4))      // ±20% jitter around approach base
project.annualCDR = round(500 + sr(i×23)×49500)                       // 500-50,000 tCO2/yr, independent of approach.potential
project.creditPrice = round(40 + sr(i×31)×160)                        // $40-200/t, independent of lcoc
kpis.avgLcoc       = mean(filtered.lcoc)
kpis.totalCDR      = Σ filtered.annualCDR / 1000                       // displayed in kt
kpis.avgPrice      = mean(filtered.creditPrice)
```

Note `annualCDR` is drawn from a flat 500–50,000 t/yr range for *every* approach regardless of the
approach's own `potential` field (Gt-scale for OAE vs. much smaller for electrochemical CDR in
`CDR_APPROACHES`) — individual project scale is decoupled from the technology's real relative
potential.

### 7.3 Calculation walkthrough

1. Filter `PROJECTS` by `approach` (6 options + "All").
2. `kpis` aggregates mean LCOC, total pipeline CDR (kt), mean credit price, and a Series A/B
   venture-stage count — straightforward aggregation over the synthetic per-project fields.
3. **Technology Analysis tab** compares the 6 static `CDR_APPROACHES` on LCOC/potential/permanence
   — this table does not change with the project filter (it's the reference layer, not derived from
   `PROJECTS`).
4. **Project Pipeline tab** lists all 18 (or filtered) projects with their jittered LCOC, credit
   price, funding stage, and buyer.
5. **MRV & Permanence tab** renders the static 6-dimension challenge radar/bars.
6. **Market Sizing tab** plots the three compound-growth series to 2033 — a scenario illustration,
   not a fitted market forecast.

### 7.4 Worked example

Project `i=0`: `approach = CDR_APPROACHES[0].id = 'OAE'` (base `lcoc=50`), `operator='Running
Tide'`, `location='North Atlantic'`. `lcoc = round(50 × (0.8+sr(0)×0.4))`. `sr(0)`: `sin(1)=0.8415`,
×10000=8414.7, `frac=0.7096`. `lcoc = round(50×(0.8+0.7096×0.4)) = round(50×1.0838) = round(54.19) =
54`. `annualCDR = round(500+sr(23)×49500)`. `sr(23)`: `sin(24)=−0.9056`, ×10000=−9056.0,
`floor(−9056.0)=−9057`, `frac=0.9968` → `annualCDR = round(500+0.9968×49500) = round(500+49,338) =
49,838 tCO₂/yr`. `creditPrice = round(40+sr(31)×160)`: independent draw, $40–200 range. This single
"Running Tide OAE North Atlantic" project entry combines a real operator name with entirely
synthetic scale and pricing — Running Tide's actual disclosed pilot volumes (its real 2023–2024
public reporting cites much smaller demonstrated tonnages) are not what drives this number.

### 7.5 Data provenance & limitations

- The 6-approach reference table (LCOC, potential, permanence, maturity, risk) is the module's most
  defensible content — plausible and directionally consistent with the real ocean-CDR cost/maturity
  literature (OAE's low theoretical LCOC but early maturity; Ocean Iron Fertilisation's low LCOC but
  "Very High" risk correctly reflecting its controversial field-trial history).
- All 18 named-operator projects have synthetic scale/price/funding data — the operator names are
  real, but the specific numbers attached to each are not sourced to any of these companies'
  disclosures.
- `MARKET_SIZING`'s exponential curves have no historical calibration point (2024 is the series
  start), so the projected 2033 endpoint is a pure extrapolation of the assumed growth rate, not a
  market-research forecast.
- No live CDR.fyi, Frontier, or registry data feed exists despite the guide referencing them as
  sources.

**Framework alignment:** Nature (2024) OAE Verification Framework / ICVCM / Verra / Gold Standard
methodology pipeline — named as context for the real, still-unresolved ocean-CDR methodology-
approval gap (correctly reflected in `MRV_CHALLENGES`'s "Registry Acceptance" scoring 60/100
difficulty, the highest of the six) · Stripe Frontier advance market commitment — accurately
represented as the dominant real-world funding mechanism for pre-commercial ocean CDR.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the OAE mass-balance model and de-synthesize projects (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide states an OAE mass-balance (`ΔDIC = (TA_added × Revelle_factor) / seawater_volume; net_CDR = ΔDIC × verification_factor`) that is not implemented — no project computes ΔDIC, no Revelle factor, no seawater volume. The module presents six real ocean-CDR approaches with hand-set reference figures (broadly consistent with literature) plus 18 synthetic projects (real operator names — Running Tide, Ebb Carbon, Planetary, Equatic — but `sr()`-jittered numbers, `lcoc = baseLcoc × (0.8 + sr()×0.4)`). Evolution A builds the OAE removal model and replaces jittered project economics with real disclosed data.

**How.** (1) Implement the OAE net-CDR calculation the guide specifies as `POST /api/v1/ocean-cdr/oae` — ΔDIC from alkalinity addition and the Revelle buffer factor, net CDR after a verification/efficiency discount, grounded in the Nature 2024 OAE verification framework and Ebb Carbon field-trial data named in §5. (2) Replace the 18 `sr()`-jittered projects with a curated real-project table sourced from operator annual reports and CDR.fyi (Running Tide and Ebb Carbon publish CDR figures — named in §5), each with real funding stage and buyer; keep it honest-null where a startup discloses nothing. (3) Anchor `MARKET_SIZING` (currently pure exponential `0.1×2.5^i` with no historical anchor) to actual delivered-tonnes data as it accumulates.

**Prerequisites.** Ocean chemistry parameters (Revelle factor varies by region/temperature — needs a documented source per Atlas §8); operator-disclosure availability is thin for pre-commercial CDR (accept sparse coverage). **Acceptance:** the OAE endpoint computes net CDR from alkalinity and seawater inputs; project economics reflect disclosed figures, not ±20% jitter; no `sr()` in project numbers.

### 9.2 Evolution B — Frontier-CDR diligence copilot (LLM tier 1 → 2)

**What.** A copilot for the developers/buyers/scientists §1 targets: "compare OAE and kelp farming on cost, potential, and permanence", "what MRV challenges does ocean iron fertilisation face?", "estimate net CDR for a 10,000t alkalinity addition" — grounded in the six real approach cards, the MRV-challenge dimensions, and the OAE/NOAA references named in §5.

**How.** Tier 1 answers approach-comparison and MRV questions from the curated `CDR_APPROACHES` and `MRV_CHALLENGES` data (§7.1), correctly conveying that iron fertilisation is "Very High" risk given its real controversial trial history. Tier 2, post-Evolution-A: the net-CDR estimate becomes a tool call to the OAE model, with the fabrication validator matching quoted tonnes/costs to outputs. The copilot must not present the synthetic project pipeline as real deal data until Evolution A, and must convey the deep uncertainty of pre-commercial ocean CDR (permanence claims of 10,000yr are theoretical, MRV is unproven) rather than false precision.

**Prerequisites.** Tier 1 on curated approach data; net-CDR estimation needs Evolution A's OAE model. **Acceptance:** approach comparisons cite real `CDR_APPROACHES` figures; net-CDR estimates trace to the OAE tool; the copilot flags MRV/permanence uncertainty and refuses to treat synthetic projects as real.