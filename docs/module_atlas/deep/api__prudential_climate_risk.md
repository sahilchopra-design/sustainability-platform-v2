## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/prudential_climate_risk_engine.py` (engine E45, `PrudentialClimateRiskEngine`)
implements six chained supervisory-climate assessments, orchestrated by
`POST /full-assessment` and individually exposed via `api/v1/routes/prudential_climate_risk.py`:

1. **BOE BES** (`assess_boe_bes`) — sector PD-uplift stress under the Bank of England Biennial
   Exploratory Scenario (2021 or 2025 round), Late/No-Action (LLT) vs Early-Action (ELT) legs.
2. **ECB climate stress test** (`assess_ecb_dfast`) — transition vs physical expected loss per
   CST 2022/2024 scenario, with ECB-published sample CET1 impacts.
3. **NGFS v4 trajectories** (`assess_ngfs_v4`) — 2025–2050 CET1 drag paths for 6 scenarios.
4. **ICAAP overlay** (`calculate_icaap_overlay`) — Pillar 2a add-on + Pillar 2b buffer + SREP score.
5. **Basel SRP 43.1** (`assess_sarp431`) — materiality categorisation from climate RWA impact.
6. **Capital overlays** (`generate_capital_overlays`) — segment brown-share, stranded-asset and
   RWA-uplift table.

Core formulas quoted from code:

```
stressed_PD = min(1, base_PD + (tr_uplift_bps + ph_uplift_bps)/10,000)
EL_stressed = exposure × stressed_PD × LGD
CET1 depletion (pp) = EL_stressed / RWA × 100,  RWA = Σ exposure × rwa_density_pct/100
CET1 drag(yr) = (tr_mult × 0.05 + ph_mult × 0.035) × (yr − 2025)/25     # NGFS, pp cumulative
P2a = clamp(0.30 × worst CET1 depletion, 0.25%, 2.0%)
P2b = clamp(0.50 × worst CET1 depletion − P2a, 0%, 3.0%)
rwa_uplift_pct = (tr_bps_disorderly × tr_mult + ph_bps_chronic × ph_mult)/10,000 × 100
capital_add_on = exposure × rwa_uplift × 8%
```

### 7.2 Parameterisation

**NGFS v4 scenario table** (`NGFS_V4_SCENARIOS`, docstring cites "NGFS Phase IV — June 2023
vintage"; multipliers are the engine's own calibration):

| Scenario | Category | 2050 °C | CP 2030 $/t | tr_mult | ph_mult |
|---|---|---|---|---|---|
| net_zero_2050 | orderly | 1.4 | 290 | 1.8 | 0.7 |
| below_2c | orderly | 1.8 | 150 | 1.4 | 0.9 |
| divergent_net_zero | disorderly | 1.5 | 350 | 2.2 | 0.75 |
| delayed_transition | disorderly | 1.8 | 80 | 2.5 | 1.1 |
| current_policies | hot_house | 3.0 | 25 | 0.8 | 2.2 |
| fragmented_world | hot_house | 2.5 | 40 | 1.0 | 1.8 |

**Sector PD-uplift tables** — 15 sectors each in `SECTOR_TRANSITION_RISK` (orderly/disorderly
bps: fossil_fuels 85/210 … healthcare 5/15) and `SECTOR_PHYSICAL_RISK` (acute/chronic bps:
agriculture 130/160 highest, shipping 100/110, healthcare 8/15 lowest). These are synthetic
expert-judgement calibrations (no external citation in code); unknown sectors default to
50/25 bps transition and 30/40 bps physical.

**Other rubrics:** `ICAAP_GUIDANCE` (SS3/19 materiality: >5% CET1 or >10% RWA = material;
P2a range 0.25–2.0%, P2b 0–3.0%); `BASEL_SRP431` (RWA impact ≥5% material, ≥1% potentially
material, implementation 2026-01-01); `EBA_SREP_SCORING` (scores 1–4 with add-on guidance
0% / 0.25–0.5% / 0.5–1.5% / 1.5–3.0%); NGFS drag coefficients 0.05 (transition) and 0.035
(physical) pp CET1 per unit multiplier, commented as "midpoint calibration"; stranded-asset
fractions of brown exposure by rating {high 25%, medium 8%, low 2%, very_high 30%}; brown
share by transition rating {high 80%, medium 40%, low 10%} — all synthetic demo values.
`BOE_BES_ROUNDS` / `ECB_CST_ROUNDS` embed published-round metadata (e.g. BES 2025 LLT =
delayed_transition, typical CET1 depletion 4.2 pp; CST 2024 sample impacts 2.2/4.1/6.8 pp).

### 7.3 Calculation walkthrough

BOE BES stresses every loan-book segment twice: LLT uses the disorderly transition + chronic
physical bps, ELT the orderly + acute bps. RWA comes only from caller-supplied
`rwa_density_pct`; if absent, CET1 depletion is an **honest null** (`cet1_data_status:
"insufficient_data"`) — the engine deliberately never fabricates capital ratios (comments:
"No fabrication", "No random draw"). ECB DFAST computes transition and physical EL per
scenario (disorderly bps used for delayed_transition/disorderly keys) but takes CET1 depletion
from the ECB's published sample impacts, not from the EL. NGFS produces 5-yearly CET1
trajectories floored at 5.0%. `full-assessment` chains everything: capital overlays →
`climate_rwa = total_capital_add_on / 0.08` → `rwa_impact_pct` → ICAAP SREP score
(≥5%→4, ≥3%→3, ≥1%→2, else 1) and SRP 43.1 categorisation; BES LLT CET1 depletion feeds the
P2a/P2b sizing. Default demo loan book (when caller sends none): real_estate $500M
(PD 1.5%, LGD 35%, density 60%), utilities $300M (2.5%, 45%, 85%), fossil_fuels $200M
(4%, 50%, 100%).

### 7.4 Worked example (BES 2025 LLT, fossil-fuels segment + ICAAP)

Segment: exposure $200M, base PD 4%, LGD 50%, rwa_density 100%. Uplift = (210 + 80)/10,000
= 290 bps.

| Step | Computation | Result |
|---|---|---|
| Stressed PD | 0.04 + 0.029 | 6.9% |
| EL stressed | 200M × 0.069 × 0.50 | **$6.90M** |
| Portfolio RWA (demo book) | 500×0.60 + 300×0.85 + 200×1.00 | $755M |
| Other segments' EL (LLT) | RE: 500×(0.015+0.0185)×0.35 = 5.8625; Util: 300×(0.025+0.027)×0.45 = 7.02 | $12.88M |
| Total LLT EL | 6.90 + 12.88 | $19.78M |
| CET1 depletion | 19.78 / 755 × 100 | **2.62 pp** |
| P2a add-on | clamp(0.30 × 2.62, 0.25, 2.0) | **0.79%** |
| P2b buffer | clamp(0.50 × 2.62 − 0.79, 0, 3.0) | **0.52%** |
| Total overlay | 0.79 + 0.52 | **1.31%** |

With a caller-supplied starting CET1 of 14%, post-stress CET1 = 14 − 2.62 = 11.38%.

### 7.5 Interconnections

`full-assessment` is the aggregation point: BES → ICAAP (worst CET1 depletion), capital
overlays → SRP 43.1 + SREP (RWA impact), NGFS → worst-scenario headline. The route file
additionally serves the four reference registries (`/ref/ngfs-scenarios`, `/ref/boe-bes`,
`/ref/sector-risk`, `/ref/icaap-thresholds`) consumed by the frontend prudential pages.

### 7.6 Data provenance & limitations

- **No seeded PRNG** — this engine was explicitly remediated to remove random draws; missing
  CET1/RWA inputs return nulls with `cet1_data_status: "insufficient_data"`.
- Sector bps uplifts, NGFS drag coefficients, brown shares and stranded fractions are
  **synthetic calibrations**; BES/CST "typical/sample CET1 depletion" figures are stylised
  round-level summaries, not bank-specific results.
- PD uplifts are additive and time-invariant (no 30-year pathway despite the rounds' 30-year
  horizons); ECB CET1 impact is a lookup, decoupled from the computed EL; SRP 43.1 review dates
  are hard-coded (2026/2027); the 8% capital ratio in overlays is the Basel Pillar 1 minimum,
  ignoring buffers.

### 7.7 Framework alignment

- **BOE BES / PRA SS3/19 & SS19/23** — LLT vs ELT scenario legs and materiality thresholds
  mirror the BES design papers; real BES asked firms for full balance-sheet projections rather
  than sector bps add-ons.
- **ECB CST 2022/2024** — scenario names and sample CET1 depletion magnitudes match the ECB
  exercise structure (the 2022 exercise reported ~€70bn combined losses; the engine uses
  round-level percentage anchors).
- **NGFS Phase IV (June 2023)** — the 6-scenario taxonomy (orderly / disorderly / hot-house)
  and carbon-price ordering are NGFS-faithful; drag coefficients are the module's own reduction.
- **BCBS SRP 43.1 / 2022 Climate Principles** — materiality categorisation with Pillar 2
  consequences; the code's 5%/1% RWA thresholds implement the guide's tiering.
- **EBA/GL/2020/06 SREP** — 4-point scoring with capital add-on ranges follows the EBA SREP
  score convention (1 = low risk … 4 = high risk).
