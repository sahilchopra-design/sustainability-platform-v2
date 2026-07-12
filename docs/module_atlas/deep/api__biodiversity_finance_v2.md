## 7 · Methodology Deep Dive

Grounded in `backend/services/biodiversity_finance_v2_engine.py` (E44; routes:
`api/v1/routes/biodiversity_finance_v2.py`). A materially deeper biodiversity engine than v1:
TNFD full 14-step LEAP, PBAF portfolio attribution, ENCORE 23-service scoring, MSA footprint,
GBF/COP15 30×30 alignment across all 23 targets, BNG Metric 4.0, and a BFFI portfolio intensity.

### 7.1 What the engine computes

| Sub-model | Core formula |
|---|---|
| TNFD LEAP | Locate = mean(sector impact scores) × hazard mult; Evaluate = mean ENCORE dependency; Assess = 0.4·L + 0.4·E + 0.2·connectivity (or 0.5/0.5); Prepare = disclosure readiness; composite = mean of available |
| PBAF attribution | outstanding: `attr = exposure/EV`; equity: `attr = ownership%`; total_assets: `attr = exposure/assets`; `attributed_footprint = attr × company_footprint` |
| ENCORE scoring | per service: `Σ dep_level(lvl) × revenue_weight`, capped at 10; materiality flag if dep ≥ 6 or impact ≥ 6 |
| MSA footprint | `msa_preserved = Σ area × msa_fraction`; `footprint = total_area − preserved`; `loss_fraction = footprint/total` |
| GBF 30×30 | T01 score = `min(100, protected% × 100/30)`; T02 restored/30; T07 pollution×2.5; T15 = 80/20 by disclosure flag |
| BNG Metric 4.0 | `units = area × condition_mult × distinctiveness_score × strategic_mult`; `net_gain% = (post−base)/base × 100`; 10% mandatory threshold |
| BFFI | `score = total_footprint / (exposure/€1M)` pdf.m²·yr per M USD |

### 7.2 Parameterisation

**MSA land-use retention fractions** (v2 lookup, distinct from v1): primary_veg 0.90,
secondary_veg 0.50, extensive_ag 0.30, plantation 0.15, degraded 0.10, mining 0.08, intensive_ag
0.05, urban 0.02, aquaculture 0.35, wetland_managed 0.45. Unmapped → 0.10. Hotspot flag when
`msa_fraction < 0.15 and area > 1 km²`.

**BNG Metric 4.0** (Natural England, cited): condition multipliers outstanding 6 / good 4 /
moderate 2 / poor 1 / very_poor 0.5; distinctiveness scores very_high 8 / high 6 / medium 4 /
low 2; strategic-significance multipliers high 1.15 / location 1.10 / low 1.00. Mandatory 10% net
gain (Environment Act 2021); deficit uses the 10% headroom: `deficit = max(0, base×1.10 − post)`.

**ENCORE default service weights** ES01–ES23 (regulating/provisioning/cultural), summing ≈ 1.0
(climate regulation 0.09 highest, noise/recreation 0.02 lowest). **Sector→ENCORE dependency &
impact** tables for 12 NACE codes with 5-level qualitative ratings mapped to numeric scores
`{very_high:9, high:7, medium:5, low:3, very_low:1}` (dependencies) and `{very_high:90 … very_low:15}`
(Locate impact). **GBF**: all 23 Kunming-Montreal targets named. **PBAF methods**: three
attribution formulas per PCAF-style asset-class mapping.

**BFFI model constants** (explicitly labelled "MODEL calibration constants, not entity-reported"):
magnitude intensity `{very_high:1.5, high:1.0, medium:0.6, low:0.3, very_low:0.1}` × scale 10.0
pdf.m²·yr per USD; rating bands >5000 high / >1000 medium / else low impact.

### 7.3 Calculation walkthrough

Like v1, v2 is built on strict **honest-null discipline** — data-completeness flags document
every absent input, and no metric is fabricated. Key flows:

- **TNFD LEAP:** sector impact magnitudes drive Locate; ENCORE dependency levels drive Evaluate;
  Assess blends them (re-weighting to 0.5/0.5 when connectivity is absent, flagging it); Prepare
  is a pure caller-reported disclosure-readiness figure or null. Composite = mean of *available*
  pillars → materiality high ≥65 / medium ≥40 / low. Sub-step scores are never invented; each
  phase reports its headline score plus `steps_pending_detailed_assessment`.
- **PBAF:** each holding needs the method's denominator (EV / ownership / total assets) *and* a
  reported `biodiversity_footprint_pdf_m2yr`; missing either → `data_status: insufficient_data`
  with `missing_inputs`. Portfolio intensity only spans holdings with real data.
- **BFFI:** uses reported footprint where available, else the deterministic sector-magnitude
  model — every holding tallies into `holdings_reported_footprint` vs `holdings_modelled_footprint`.
- **Full assessment composite:** weighted blend `0.35·LEAP + 0.20·(100−MSA loss%) + 0.25·GBF +
  0.20·(100 − min(BFFI/100, 100))`, but **only over non-null components, re-normalised by their
  weight sum** — so a portfolio with only LEAP and GBF gets `(0.35·L + 0.25·G)/0.60`.

### 7.4 Worked example (BNG Metric 4.0)

Grassland site: pre = 10 ha, post = 12 ha; condition_before = moderate (×2), condition_after =
good (×4); distinctiveness both = medium (score 4); strategic_significance = low (×1.0):

| Step | Computation | Result |
|---|---|---|
| Baseline units | 10 × 2 × 4 × 1.0 | 80.0 |
| Post units | 12 × 4 × 4 × 1.0 | 192.0 |
| Net-gain % (condition proxy) | ((12×4) − (10×2))/(10×2) × 100 = (48−20)/20 | **+140%** |
| Threshold met (≥10%) | yes | credit not required |
| Deficit units | max(0, 80×1.10 − 192) = max(0, 88 − 192) | 0.0 |

The large gain reflects both area increase and condition uplift (moderate→good doubles the
condition multiplier). Note net-gain% uses the *condition-only proxy* so it is defined even when
distinctiveness bands are absent (a constant band cancels in the ratio).

For MSA: 100 ha intensive_ag (0.05) + 50 ha primary_veg (0.90) → preserved = 100×0.05 + 50×0.90 =
5 + 45 = 50; total = 150; footprint = 100; loss_fraction = 100/150 = 0.667 (66.7%). Intensive_ag
is a hotspot (0.05 < 0.15, area > 1).

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data in current code.** Inline comments record that TNFD scores, PBAF
  attribution, ENCORE impact jitter, GBF gating and BFFI intensity were all previously random and
  are now deterministic reference-table lookups, caller inputs, or honest nulls with flags.
- The BFFI "model" footprint is a crude linear `exposure × magnitude × 10` proxy — not a real
  LC-impact (pdf.m²·yr) computation; it is a placeholder for entities without reported footprints
  and is transparently counted separately.
- ENCORE dependency/impact ratings are qualitative sector averages (12 NACE codes only) — no
  sub-sector or geography resolution; unmapped sectors default to medium.
- GBF alignment only scores four targets (T01/T02/T07/T15) even when data exists; the remaining
  19 are always `insufficient_data`.
- MSA is land-use-only (no pressure-specific MSA); the two MSA lookups (v1 vs v2) use different
  factor values and hotspot rules — cross-module MSA numbers are not comparable.
- BNG post-development distinctiveness defaults to the baseline band when unspecified, which can
  understate distinctiveness trading-down penalties that Metric 4.0 enforces.

### 7.6 Framework alignment

- **TNFD v1.0 LEAP** — the real TNFD process has four phases (Locate, Evaluate, Assess, Prepare),
  each with four sub-steps (16 total; the engine lists them and scores at phase level). The
  engine drives Locate/Evaluate from ENCORE data and leaves per-step assessment pending.
- **PBAF Standard v2 (2023)** — attribution of financed biodiversity impact via the same
  outstanding-amount / EVIC / equity-ownership logic PCAF uses for financed emissions; footprint
  in PDF·m²·yr (Potentially Disappeared Fraction of species).
- **ENCORE** — dependency & impact-driver taxonomy across 23 ecosystem services; materiality
  thresholding mirrors ENCORE's materiality screening.
- **Kunming-Montreal GBF (COP15)** — all 23 targets named; T01 (30×30 protection), T02 (restore
  30%), T07 (pollution), T15 (business assess/disclose/reduce) are scored against their headline
  numeric goals.
- **GLOBIO/IUCN MSA** — land-use MSA footprint (km²·MSA) as a biodiversity-intactness measure.
- **Natural England BNG Metric 4.0** — habitat units = area × distinctiveness × condition ×
  strategic significance, with the statutory 10% net-gain test (Environment Act 2021) — faithfully
  implemented.
- **BFFI** — the Biodiversity Footprint for Financial Institutions concept (portfolio PDF per
  unit invested); here approximated with a sector-intensity model.
- **Cross-framework** — ESRS E4, GRI 304, EU Taxonomy DNSH biodiversity, SBTN steps 1–5 carried
  as linkage metadata.
