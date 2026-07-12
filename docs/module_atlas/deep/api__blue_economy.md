## 7 · Methodology Deep Dive

Grounded in `backend/services/blue_economy_engine.py` (E68; routes:
`api/v1/routes/blue_economy.py`). Five ocean-finance calculators: ICMA Blue Bond screening, blue
carbon project economics, BBNJ (High Seas Treaty) compliance, ocean-acidification VaR, and a
portfolio SOF (Sustainable Ocean Finance) aggregator, plus a standalone SOF alignment assessment.

### 7.1 What the domain computes

| Function | Core formula |
|---|---|
| `screen_blue_bond` | `icma_alignment = Σ (category_score / n)` over declared eligible categories; verdict fully ≥0.85 / partial ≥0.65 / not aligned |
| `assess_blue_carbon` | `annual_seq = area × seq_rate`; `net_seq = annual × (1 − risk_buffer%)`; `credit_value = net_seq × price`; additionality = `0.4·threat + 0.3·tenure + 0.3·baseline` |
| `assess_bbnj_compliance` | weight-renormalised `Σ score_k·w_k / Σ w_k` over disclosed articles |
| `assess_ocean_acidification_risk` | `VaR = fisheries·|impact%| + coral·mortality + aqua·mortality`; `adaptation = VaR × 0.25` |
| `aggregate_ocean_portfolio` | `sof_score = Σ pillar·w / Σ w`; `ocean_risk = 1 − 0.7·sof`; `sdg14 = 0.85·sof` |

### 7.2 Parameterisation (all reference constants cited to standards in code)

**Blue carbon ecosystems** (IPCC / Blue Carbon Initiative sequestration rates):

| Ecosystem | Mean seq (tCO₂/ha/yr) | Soil C stock (tCO₂/ha) | Permanence risk | Verra method |
|---|---|---|---|---|
| Mangrove | 7.0 | 860 | medium | VM0007 / VM0033 |
| Saltmarsh | 3.0 | 430 | medium-low | VM0033 |
| Seagrass | 0.6 | 140 | high | VM0033 |
| Kelp | 0.3 | 0 (exported) | high | Under development |

Permanence: `eco_stability = 1 − (0.30 high / 0.15 medium / 0.05 low)`; risk buffer =
`clamp((1 − permanence)·60, 10, 30)%` (Verra-style buffer pool). Monitoring cost $35–120/ha/yr.

**Blue bond use-of-proceeds** — 8 categories with ICMA alignment scores 0.75–0.95 (marine
conservation highest 0.95, OA mitigation lowest 0.75), each mapped to a SOF pillar and SDG14
targets, with typical allocation %.

**BBNJ articles** (High Seas Treaty 2023) — 5 areas with weights summing to 1.0: Art. 9 MGR
(0.25), Art. 17 EIA (0.25), Art. 22 ABMT/MPA (0.20), Art. 43 capacity building (0.15), Art. 52
financial mechanism (0.15). Compliant ≥0.75 / partial ≥0.50 / non-compliant below.

**Ocean acidification RCP table** (IPCC AR6 Ch.3): pH change by 2100 −0.06 (RCP2.6) to −0.33
(RCP8.5); aragonite saturation Ω 2.8 → 1.2; fisheries revenue impact −2.5% → −18.5%. Coral
mortality factor = `max(0, (2.5 − Ω)/2.5) × 0.8`; aquaculture = `max(0, (2.5 − Ω)/2.0) × 0.5`.

**SOF pillars** (UNEP-FI) — 6 pillars weighted 0.22/0.20/0.20/0.18/0.12/0.08 (ocean health →
blue energy). `DEFAULT_ADAPTATION_COST_RATIO = 0.25` (OECD Ocean Finance Framework 2022 central
estimate). SDG14 financing gap $175bn/yr (OECD reference).

### 7.3 Calculation walkthrough

The whole module follows the platform's **honest-null discipline** — every entity-specific input
(area, allocation, article scores, exposure, pillar scores, greenium) is caller-supplied or
returned as `None` with a `data_flags` entry; only IPCC/ICMA/Verra reference constants are
embedded. Notable flows:

- **Blue bond:** alignment is the mean reference ICMA score of declared eligible categories;
  use-of-proceeds breakdown uses issuer-declared splits when supplied, else ICMA "typical"
  allocations (flagged). External review triggered when bond ≥ $100M or alignment < 0.75.
  `greenium_bps` is only market-observed input — never derived from alignment.
- **Blue carbon:** sequestration volume, additionality, permanence, buffer, credit value and
  eligibility each require their specific inputs; missing any yields honest nulls. Verra-eligible
  requires additionality ≥ 0.6, permanence ≥ 0.5 and an available methodology; Gold Standard
  additionally needs additionality ≥ 0.70 and eco_stability ≥ 0.75.
- **OA risk:** physical factors always reported; monetary VaR only when
  `ocean_economy_exposure_usd` is supplied; sector shares absent → treated as 0 exposure (flagged,
  not fabricated).
- **Portfolio SOF:** the OA sub-call reuses total blue assets as the ocean-economy exposure;
  ocean_risk_score = `1 − 0.7·sof`, SDG14 = `0.85·sof`; Poseidon Principles aligned if sof ≥ 0.65.

### 7.4 Worked example (blue carbon, 1,000 ha mangrove)

Inputs: mangrove (seq_rate 7.0, lifetime 30y, monitoring $45/ha/yr, medium permanence →
eco_stability 0.85); area 1,000 ha; threat 0.8, tenure 0.7, baseline 0.6; governance 0.7;
carbon price $15/tCO₂:

| Step | Computation | Result |
|---|---|---|
| Annual sequestration | 1,000 × 7.0 | 7,000 tCO₂/yr |
| Lifetime | 7,000 × 30 | 210,000 tCO₂ |
| Additionality | 0.4×0.8 + 0.3×0.7 + 0.3×0.6 | 0.71 |
| Permanence | 0.85×0.5 + 0.7×0.5 | 0.775 |
| Risk buffer | clamp((1 − 0.775)×60, 10, 30) | 13.5% |
| Net sequestration | 7,000 × (1 − 0.135) | 6,055 tCO₂/yr |
| Credit value | 6,055 × $15 | **$90,825/yr** |
| Monitoring cost | 1,000 × $45 | $45,000/yr |
| **Net revenue** | 90,825 − 45,000 | **$45,825/yr** |
| Verra eligible | additionality 0.71 ≥ 0.6, permanence 0.775 ≥ 0.5, VM0007 available | **Yes** |
| Gold Standard | additionality 0.71 ≥ 0.70, eco_stability 0.85 ≥ 0.75 | **Yes** |

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** Module-level comment declares all embedded numbers "deterministic
  model parameters — NOT entity-reported figures"; the only non-standard `hash()` use is a stable
  synthetic bond label when no `bond_id` is given (not a numeric input).
- Sequestration uses the ecosystem *mean* rate only — no site-specific measurement, soil-core
  data, or age-dependent accumulation curves; kelp/seagrass permanence is scientifically
  contested and flagged "Under development" for methodology.
- OA VaR uses linear damage factors keyed only to aragonite saturation and a single fisheries
  impact %; no depth/latitude resolution, species mix, or temporal path.
- ICMA alignment is a simple category-average — it does not test actual project-level use of
  proceeds, management, or reporting quality (the ICMA Principles' four components).
- BBNJ scores are entity-self-disclosed 0–1 values, not independently assessed; the treaty is not
  yet in force (entry-into-force targets 2025–2026 in the reference data).
- Adaptation cost is a flat 25% of VaR; SDG14 gap and greenium recommendations are heuristics.

### 7.6 Framework alignment

- **ICMA Blue Bond Principles (2023)** — use-of-proceeds category eligibility, external-review
  trigger and reporting-frequency ladder mirror the four Green/Blue Bond Principle components;
  the engine scores category alignment, not full process conformance.
- **UNEP-FI Sustainable Ocean Finance (2021)** — 6 SOF pillars with weighted aggregation; tiers
  leader/progressing/emerging; Poseidon Principles and Sustainable Blue Economy (SEA) pledge
  eligibility flags.
- **Blue Carbon Initiative / IPCC AR6 & SROCC** — ecosystem sequestration rates and carbon
  stocks are the published mangrove/seagrass/saltmarsh figures; Verra VM0007/VM0033 methodology
  references; buffer-pool risk deduction as Verra requires.
- **BBNJ / High Seas Treaty (2023)** — the five substantive article areas (MGR & benefit-sharing,
  EIA, ABMT/MPA, capacity building, financial mechanism) scored against self-reported indicators.
- **IPCC AR6 Chapter 3 (Ocean)** — RCP pH-change and aragonite-saturation trajectories drive the
  physical impact factors behind the OA VaR.
- **OECD Ocean Finance Framework (2022)** — adaptation-cost ratio (25% of loss) and the $175bn
  SDG14 financing gap.
- **Kunming-Montreal GBF Target 3 (30×30)** — referenced in the MPA use-of-proceeds category.
