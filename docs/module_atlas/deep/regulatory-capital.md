## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — backend is real, frontend display is decorative.**
> `backend/services/regulatory_capital_optimizer_engine.py` (1,329 lines) is a genuinely rigorous
> Basel IV / CRR3 capital engine: real SA-CR risk-weight tables (Art. 114/117/122/123/124/126/133
> CRR3), FRTB SA/IMA, SA-CCR, CVA, SA-OPR, leverage ratio, NSFR/LCR, and a real
> `apply_climate_p2r_addon()` implementing the ECB's 0–50bps Pillar 2R climate overlay, all exposed
> via working REST endpoints (`/calculate-ratios`, `/calculate-frtb`, `/calculate-sa-ccr`,
> `/climate-p2r`, `/calculate-cva`, `/optimize`, plus 6 `/ref/*` parameter endpoints).
> **The frontend calls the real `/calculate-ratios` endpoint, stores the response in a `result`
> state variable — and never renders it anywhere in the component.** Every KPI card and pass/fail
> row visible to the user (`cet1`, `t1`, `tc`, `lev`, NSFR, LCR) is instead computed from a
> **module-scope seeded PRNG** (`rng(i, seed=108) = frac(sin(i+seed+1)×10⁴)`) that runs
> independently of the button click or its response. The "Climate P2R Overlay" tab shows the same
> pattern: a real `/climate-p2r` endpoint exists and correctly implements the guide's climate
> capital add-on methodology, but the tab's displayed bps add-on and Climate VaR figures are
> `rng()`-seeded, not fetched from that endpoint. The sections below cover both the real backend
> (which the UI should be, but currently is not, surfacing) and the seeded frontend display.

### 7.1 What the backend engine computes (real, working, not rendered)

```python
composite = 0.40 × physical_risk_score + 0.60 × transition_risk_score        # both in [0,1]
addon_bps = tier_lookup(composite): <0.20→0bps, <0.40→10, <0.60→20, <0.80→35, else 50
addon_capital_required = (addon_bps/10000) × total_rwa
climate_adjusted_cet1  = (cet1_capital − addon_capital_required) / total_rwa
```

This is a faithful, close match to the guide's own formula `ΔCET1 = RWA_climate ×
(CCyB_climate+Pillar2_rate)` — the engine's `addon_bps/10000 × RWA` term *is* the Pillar2_rate
component (no separate CCyB term, but the mechanism is the same: a bps-denominated capital
add-on applied to RWA and netted from CET1 capital).

### 7.2 Parameterisation — backend Climate P2R engine

| Parameter | Value | Provenance |
|---|---|---|
| `physical_risk_weight` | 0.40 | ECB guidance-consistent weighting (transition risk weighted higher, matching ECB's 2022 climate stress test finding that transition risk dominates near-term bank exposures) |
| `transition_risk_weight` | 0.60 | as above |
| Tier thresholds → bps | composite <0.20→0bps, <0.40→10bps, <0.60→20bps, <0.80→35bps, ≥0.80→50bps | Synthetic tiering, capped at the ECB's own stated **maximum 50bps** Pillar 2R climate overlay ceiling — the cap itself is real (ECB SREP guidance), the specific tier breakpoints are a reasonable interpolation not published verbatim by the ECB |
| `max_addon_bps` | 50 | ECB Supervisory Review and Evaluation Process (SREP) climate overlay ceiling |

SA-CR risk weights (spot-checked against CRR3): sovereign 0/20/50/100/100/150/100 by rating
bucket (Art 114 ✓), retail flat 75% (Art 123 ✓), residential RE LTV-banded 20/25/30/40/50/70 (Art
124 ✓), commercial RE LTV-banded 60/80/100/110 (Art 126 ✓) — these match the real CRR3 tables.

### 7.3 What the frontend actually displays

```js
seed = 108
rng  = (i, s=seed) => frac(sin(i+s+1)×10⁴)
cet1 = 12.4 + rng(1)×4        // 12.4–16.4%
t1   = cet1 + 1.2 + rng(2)×0.8
tc   = t1 + 1.2 + rng(3)×1.2
lev  = 4.2 + rng(4)×2
climate_P2R_addon = round(25 + rng(50)×50)     // bps, "Climate P2R Add-On" KPI card
climate_VaR       = round(800 + rng(53)×1200)  // €M, "Climate VaR" KPI card
```

`run()` (the "Calculate Capital Ratios" button handler) does `POST /calculate-ratios`, sets
`result = r.data` on success — **`result` is never referenced again in the file**, so the fetched
real backend response has no visible effect on the page.

### 7.4 Worked example — the disconnect, quantified

For a request with `institution_type='G-SII'`, `total_assets_eur_bn=500`, `approach='SA'`:

| Path | What happens |
|---|---|
| User clicks "Calculate Capital Ratios" | `axios.post(.../calculate-ratios, {...})` fires |
| Backend | Runs real SA-CR/FRTB/leverage calculations against CRR3 tables, returns a JSON `result` |
| Frontend state | `setResult(r.data)` — stored in React state |
| **What the user sees** | Still `cet1 = 12.4+rng(1)×4 = 12.4+frac(sin(2)×10⁴)×4`; `rng(1)=frac(sin(2)×10⁴)≈0.9200` → **cet1=16.08%**, unrelated to the actual 500-EUR-Bn G-SII SA calculation just returned by the server |

The pass/fail badges (`cet1>=7.0 ? 'PASS':'FAIL'`) are therefore evaluated against the **seeded**
value, not the institution the user actually configured — every institution/approach combination
shows the same seeded pass/fail outcome.

### 7.5 Climate risk-tier rubric (backend, correctly implemented, not surfaced)

| Composite score | Tier | Add-on |
|---|---|---|
| < 0.20 | low | 0 bps |
| 0.20–0.40 | moderate | 10 bps |
| 0.40–0.60 | elevated | 20 bps |
| 0.60–0.80 | high | 35 bps |
| ≥ 0.80 | very_high | 50 bps |

### 7.6 Companion analytics

Capital Ratios (gauge + pass/fail table — seeded), RWA Breakdown (Credit/Market/Op/CVA split —
seeded), FRTB SA/IMA (desk-level VaR/SVaR by trading desk — seeded), Climate P2R Overlay (bps
add-on + Climate VaR + CET1 trajectory chart 2024–2030 — seeded), Optimization Actions (SRT
securitisation, CDS hedging, portfolio tilt, netting expansion — descriptive, references the real
`OPTIMIZATION_TECHNIQUES` catalogue's regulatory citations but displayed RWA-reduction figures
appear seeded per institution rather than computed from the actual portfolio).

### 7.7 Data provenance & limitations

- **The backend is production-grade**: real CRR3/Basel IV risk-weight tables, a correctly-capped
  ECB Pillar 2R climate methodology, and 8 working POST/GET endpoints. This is one of the
  strongest backend implementations reviewed in this batch.
- **None of that backend reaches the user.** Every number on the page is `rng(seed=108)`-seeded
  and static across every institution/approach/scenario selection — the interactive controls
  (institution type, total assets, approach) are collected and posted to a real endpoint whose
  response is then discarded from the UI's perspective.
- Fixing this requires only wiring the existing `result` state into the KPI cards/table (replacing
  `cet1`/`t1`/`tc`/`lev` with `result.cet1_ratio_pct` etc., matching whatever field names
  `calculate_capital_ratios()` actually returns) and adding a second `axios.post('/climate-p2r', {
  physical_risk_score, transition_risk_score, total_rwa, cet1_capital })` call for the Climate P2R
  tab — no new backend work is needed.
- Until fixed, no number currently visible on this page should be cited as a real capital-adequacy
  calculation for any institution.

**Framework alignment:** CRR3/Basel IV (SA-CR, FRTB BCBS 457, SA-CCR BCBS 279, CVA BCBS 325,
SA-OPR, NSFR/LCR Basel III) — genuinely implemented in the backend engine with article-level
citations · ECB Pillar 2R climate overlay (ECB guide on climate-related and environmental risks,
2020 + 2022 stress test) — genuinely implemented as a 0–50bps composite-score-tiered add-on ·
BCBS d532 Climate Principles / BoE Climate BES 2021 — cited by the guide as context, not
separately modelled beyond the ECB P2R mechanism already covered.
