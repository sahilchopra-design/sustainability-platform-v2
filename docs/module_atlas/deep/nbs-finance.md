## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** This tier-A route has a **real backend engine**
> (`nbs_finance_engine.py`) implementing IUCN NbS Global Standard v2.0 (8 weighted criteria), the VCMI
> Core Carbon Claims framework, and GBF Target 2 — reached via `POST /api/v1/nbs-finance/assess` and
> `/blended-finance`. But the **visible frontend page generates its IUCN, carbon, biodiversity/water and
> economics numbers from the `seed()` PRNG**, not from the engine's methodology. So the guide's "NbS
> Return on Conservation" and empirical sequestration story is real in the backend but *synthetic in the
> rendered UI*. Below documents both layers and flags the divergence.

### 7.1 What the module computes

**Frontend (rendered)** — biome × project index drives seeded scores:

```js
bi = BIOME_OPTIONS.index+1;  pi = PROJECT_OPTIONS.index+1
IUCN criterion score = round(seed(bi·k1 + pi·k2)·range + floor)     // 8 criteria, ~45–85
composite = mean(criteria);  tier = ≥80 Transformative / ≥65 Effective / ≥50 Adequate / else Basic
seqRate   = round(seed(bi·37+pi·3)·8 + 2)          // 2–10 tCO₂/ha/yr
seqTotal  = seqRate·areaHa/1000
priceUsd  = round(seed(bi·47+pi·11)·30 + 8)        // $8–38/tCO₂
vcmiTier  = priceUsd≥30 Gold / ≥18 Silver / else Bronze
```

**Backend (`nbs_finance_engine.py`)** — real IUCN GS v2.0: 8 weighted criteria (criterion_1 weight 0.14,
criterion_3 "Biodiversity Net Gain" 0.15 …) scored against key questions, plus a VCMI claim tier
(no_claim/bronze/silver/gold/platinum) and GBF 30×30 alignment.

### 7.2 Parameterisation / scoring rubric

| Layer | Construct | Provenance |
|---|---|---|
| Frontend | All 8 IUCN criterion scores, seqRate, area, price | **Synthetic** (`seed(s)=frac(sin(s+1)·10⁴)`) |
| Frontend | Tier thresholds 80/65/50 | Author (note: 4-tier, differs from IUCN 3-tier Gold/Silver/Bronze) |
| Frontend | VCMI tier by price (≥30 Gold, ≥18 Silver) | Author heuristic — VCMI is **not** price-based (see limitations) |
| Backend | IUCN criterion weights (0.12–0.15, sum 1.0) | IUCN Global Standard v2.0 |
| Backend | VCMI claim tiers | VCMI Core Carbon Claims Framework v1.0 |
| Backend | GBF Target 2 (30×30) | Kunming-Montreal GBF 2022 |

### 7.3 Calculation walkthrough

Frontend: user picks biome + project type → `getIucnData` / `getCarbonData` / `getBioWaterData` seed
scores from the two indices → composite, tier, sequestration, credits eligible, VCM price, VCMI tier →
radar, bars, pie. The economics tab computes NPV/IRR/payback from seeded investment/revenue
(`npv = (carbonRev + ecoSvcRev)·12 − totalInv`; `payback = totalInv/(carbonRev+ecoSvcRev)`). Blended-
finance tab splits a seeded total into public/philanthropic/private tranches. The backend engine (real
IUCN/VCMI math) is invoked via `/assess` but the fallback rendering path is seeded.

### 7.4 Worked example (Mangrove + Blue Carbon, frontend)

`biome=mangrove (bi=3)`, `project=blue_carbon (pi=3)`. Carbon: `seqRate = round(seed(3·37+3·3)·8+2) =
round(seed(120)·8+2)`. If `seed(120)≈0.5` → `seqRate = 6 tCO₂/ha/yr`. `areaHa = round(seed(3·41+3·7)·40000
+5000)`; if ≈20,000 → `seqTotal = 6·20000/1000 = 120 ktCO₂/yr`. `priceUsd = round(seed(3·47+3·11)·30+8)`;
if ≈$25 → **VCMI Silver** (price 18–30). Note the VCMI tier here is decided purely by price, which is not
how VCMI actually works.

### 7.5 Data provenance & limitations

- **The rendered page is PRNG-driven** (`seed()`), so the on-screen IUCN scores, sequestration rates,
  prices and finance metrics are synthetic and re-seed deterministically per biome/project pair.
- **VCMI mis-modelled in the UI:** the frontend maps VCMI tier to *carbon price*, but VCMI's Bronze/Silver/
  Gold/Platinum tiers reflect the *share of a company's residual emissions matched by high-quality credits
  plus a validated science-based target*, not the credit price. The backend engine treats VCMI correctly.
- **Frontend tier ladder (4-tier) diverges** from the IUCN GS 3-tier (Gold/Silver/Bronze) that the backend
  and the standard use.
- The real, sourced methodology lives in the backend; the value gap is wiring the UI to `/assess` rather
  than to the seeded fallback.

**Framework alignment:**
- **IUCN Global Standard for NbS v2.0** — backend: 8 weighted criteria (societal challenge, design scale,
  biodiversity net gain, economic viability, inclusive governance, …) → composite → tier; frontend: same
  criterion labels but seeded scores and a non-standard 4-tier scale.
- **VCMI Core Carbon Claims** — backend implements the claim tiers correctly (target + credit-matching);
  frontend approximates by price (incorrect).
- **GBF Kunming-Montreal Target 2 (30×30)** — restoration/protection area alignment, backend.
- **Verra VCS v4 / Gold Standard / Plan Vivo / Art 6 ITMOs** — referenced as the crediting rails.

## 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI.** The backend engine is real, but the
page shows seeded IUCN/VCMI/sequestration values. The spec below is the production NbS-finance scoring the
UI should surface (largely already present server-side).

### 8.1 Purpose & scope
Assess an NbS project's IUCN GS conformance, expected verified sequestration and credit revenue, VCMI claim
eligibility, and blended-finance bankability, for conservation-fund and DFI investment decisions.

### 8.2 Conceptual approach
Weighted-criteria conformance (IUCN GS v2.0) + a biome-specific empirical sequestration model + VCMI claim
logic. Benchmarks: **IUCN Self-Assessment Tool**, **VCMI Claims Code of Practice**, and rating-agency NbS
credit quality (Sylvera/BeZero). Sequestration uses empirical per-biome ranges (IPCC Tier 2/3, VM0007/33).

### 8.3 Mathematical specification
IUCN composite `S = Σ_{c=1}^{8} w_c·s_c`, `w_c` per standard (Σw=1), `s_c ∈ [0,100]` evidenced; tier
Gold/Silver/Bronze by thresholds; standard-met `S ≥ 70` with safeguards floor. Net credits
`N = seq_rate·area·(1−leakage)·(1−buffer)`, `seq_rate` from biome empirical distribution. Revenue
`R = N·price·(1+cobenefit_premium)`. VCMI tier from `matched = credits_retired / residual_emissions` given a
validated SBT: Platinum ≥100 %, Gold ≥60 %, Silver ≥20 %, Bronze >0 %. NbS-ROC `= (carbon + biodiversity +
ecosystem-service revenue) / conservation cost`.

| Parameter | Source |
|---|---|
| IUCN weights w_c | IUCN GS v2.0 |
| seq_rate by biome | IPCC Tier 2/3, VM0007/VM0033 |
| leakage/buffer | VCS AFOLU Non-Permanence Risk Tool |
| VCMI thresholds | VCMI Claims Code of Practice v1 |
| co-benefit premium | Ecosystem Marketplace CCB premium |

### 8.4 Data requirements
Project documents (baseline, monitoring, SPO), biome, area, SBT status, financing structure. The backend
engine already ingests most; the gap is UI wiring away from the seeded fallback.

### 8.5 Validation & benchmarking plan
Reconcile IUCN composite against IUCN self-assessment outcomes; VCMI tier against VCMI-validated claims;
sequestration against registry-issued credits per hectare for the biome.

### 8.6 Limitations & model risk
Criterion scoring is analyst-subjective; empirical sequestration ranges are wide; VCMI tiering depends on
target validity. Conservative fallback: withhold tier when criteria are incomplete (as the sibling
`nature-based-solutions-finance` engine already does), and use lower-bound sequestration ranges.
