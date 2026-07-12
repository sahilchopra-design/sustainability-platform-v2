# Api::Basel3_Liquidity
**Module ID:** `api::basel3_liquidity` · **Route:** `/api/v1/basel3-liquidity` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/basel3-liquidity/lcr` | `assess_lcr` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/nsfr` | `assess_nsfr` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/alm-gap` | `assess_alm_gap` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/liquidity-stress` | `run_liquidity_stress` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/full-assessment` | `full_assessment` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/hqla-factors` | `ref_hqla_factors` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/hqla-haircuts` | `ref_hqla_haircuts` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/runoff-rates` | `ref_runoff_rates` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/outflow-rates` | `ref_outflow_rates` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/monitoring-tools` | `ref_monitoring_tools` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/rate-shocks` | `ref_rate_shocks` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/lcr-assessment` | `lcr_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/nsfr-assessment` | `nsfr_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/irrbb-assessment` | `irrbb_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/stress-test` | `stress_test` | api/v1/routes/basel3_liquidity.py |

### 2.3 Engine `basel3_liquidity_engine` (services/basel3_liquidity_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Basel3LiquidityEngine.assess_lcr` | entity_id, hqla_l1, hqla_l2a, hqla_l2b, gross_outflow, gross_inflow, climate_scenario | Compute Liquidity Coverage Ratio with optional climate haircut overlay. |
| `Basel3LiquidityEngine.assess_nsfr` | entity_id, asf_breakdown, rsf_breakdown | Compute Net Stable Funding Ratio from ASF/RSF component breakdown. |
| `Basel3LiquidityEngine.assess_alm_gap` | entity_id, time_buckets | ALM maturity gap analysis and IRRBB (EVE + NII) sensitivity. time_buckets: list of dicts with keys: bucket (str), assets_mn (float), liabilities_mn (float) |
| `Basel3LiquidityEngine.run_liquidity_stress` | entity_id, base_lcr, base_nsfr, scenario_id, deposit_base_mn, wholesale_base_mn | Idiosyncratic + market-wide liquidity stress scenario. |
| `Basel3LiquidityEngine.full_assessment` | entity_id, entity_name, reporting_date, scenario_id, hqla_l1, hqla_l2a, hqla_l2b, gross_outflow | Full Basel III liquidity risk assessment combining LCR, NSFR, ALM, and stress. |
| `Basel3LiquidityEngine.get_hqla_factors` |  |  |
| `Basel3LiquidityEngine.get_runoff_rates` |  |  |
| `Basel3LiquidityEngine.get_asf_rsf_factors` |  |  |
| `Basel3LiquidityEngine.get_eba_shocks` |  |  |
| `Basel3LiquidityEngine.get_monitoring_tools` |  |  |

**Engine `basel3_liquidity_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `LCR_MINIMUM_PCT` | `100.0` |
| `NSFR_MINIMUM_PCT` | `100.0` |
| `L2_CAP_PCT` | `40.0` |
| `L2B_CAP_PCT` | `15.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Available`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/basel3-liquidity/ref/hqla-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hqla_haircuts'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/hqla-haircuts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hqla_haircuts'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/monitoring-tools** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['bcbs238_monitoring_tools'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/outflow-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['outflow_rates'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/rate-shocks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rate_shocks_bps'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/runoff-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['runoff_rates'], 'n_keys': 1}`

**POST /api/v1/basel3-liquidity/alm-gap** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/basel3-liquidity/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `basel3_liquidity_engine` — extracted transformation lines:**
```python
l1_adj = hqla_l1 * (1.0 - 0.00)
l2a_adj = hqla_l2a * (1.0 - 0.15)
l2b_adj = hqla_l2b * (1.0 - 0.50)
total_stock_uncapped = l1_adj + l2a_adj + l2b_adj
l2_total = l2a_adj + l2b_adj
l2_pct = l2_total / total_stock_uncapped * 100
l2b_pct = l2b_adj / total_stock_uncapped * 100
max_l2 = l1_adj * (L2_CAP_PCT / (100.0 - L2_CAP_PCT))
max_l2b = total_stock_uncapped * L2B_CAP_PCT / 100.0
l2_total = l2a_adj + l2b_adj
hqla_stock = l1_adj + l2_total
capped_inflow = min(gross_inflow, gross_outflow * 0.75)
net_outflow = max(0.0, gross_outflow - capped_inflow)
lcr_pct = (hqla_stock / net_outflow * 100.0) if net_outflow > 0 else 999.0
climate_haircut_bps = round((l2a_extra_bps + l2b_extra_bps) / 2.0, 1)
l2a_climate = hqla_l2a * (1.0 - 0.15 - l2a_extra_bps / 10000.0)
l2b_climate = hqla_l2b * (1.0 - 0.50 - l2b_extra_bps / 10000.0)
hqla_climate = l1_adj + l2a_climate + l2b_climate
climate_adj_lcr = (hqla_climate / net_outflow * 100.0) if net_outflow > 0 else 999.0
weighted = amount * factor
weighted = amount * factor
nsfr_pct = (asf_total / rsf_total * 100.0) if rsf_total > 0 else 999.0
shortfall = rsf_total - asf_total
gap = assets - liabs
pv01_a = assets * dur / 10000.0
pv01_l = liabs * dur / 10000.0
asset_dur = total_asset_duration / total_assets if total_assets > 0 else 0.0
liab_dur = total_liability_duration / total_liabilities if total_liabilities > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/basel3_liquidity_engine.py` (routes:
`api/v1/routes/basel3_liquidity.py`). Four calculators — LCR (with climate haircut overlay),
NSFR, ALM gap / IRRBB, and a liquidity stress test — plus a `full-assessment` orchestrator and
six static reference endpoints exposing the factor tables verbatim.

### 7.1 What the domain computes

```
LCR  = HQLA_stock / net_30d_outflow × 100          (min 100%)
       HQLA_stock = L1 + min-capped(0.85·L2A + 0.50·L2B)
       net_outflow = max(0, gross_outflow − min(gross_inflow, 0.75·gross_outflow))

NSFR = Σ(ASF_i × asf_factor_i) / Σ(RSF_j × rsf_factor_j) × 100   (min 100%)

IRRBB: PV01_bucket = amount × duration_mid / 10,000
       ΔEVE(parallel ±200bp) = −net_PV01 × shock_bps
       NII_12m = cumulative_gap × 200bp / 2

Stress: LCR_stressed = LCR / hqla_mult × 1/(1 + 0.2·(dep_mult−1) + 0.1·(whl_mult−1))
        NSFR_stressed = NSFR × (0.95 − 0.05·(whl_mult−1))
```

### 7.2 Parameterisation (provenance: CRR2 / LCR Delegated Regulation (EU) 2015/61, BCBS 295/368, cited in code)

**HQLA haircuts:** Level 1 → 0% (unlimited); Level 2A → 15% (cap 40% of stock); Level 2B →
25% (RMBS AA+) / 50% (BB+ corporates, listed equities), cap 15% of stock. `assess_lcr` applies a
single 50% haircut to all L2B (the conservative end of the 25–50% band).

**LCR run-off rates** (`RUNOFF_RATES`): retail stable 3% · retail less-stable 10% · SME 5/10% ·
wholesale operational 25% · wholesale non-op financial 40% · non-op non-financial 20% · secured
by L1/2A/2B 0/15/25% · retail credit lines 5% · corporate lines 10% · liquidity facilities 30%.
These match the Basel LCR standard schedule.

**NSFR factors:** ASF — equity/T2 and >1y liabilities 100%, stable retail 95%, less-stable
retail 90%, <1y wholesale operational 50%, <1y non-operational 0%. RSF — L1 HQLA 5%, L2A 15%,
L2B 50%, resi loans ≤35% RW 65%, other resi 85%, corporate <1y 50%, >1y 85%, derivatives/other
100%, committed facilities 5%. Unmapped ASF components get **0%** and unmapped RSF **100%**
(inline comment: "conservative supervisory treatment … not a random factor") with a note.

**EBA/BCBS 368 rate shocks (bps):** parallel ±200, steepener +150, flattener −150, short ±250.

**Climate LCR overlay:** for disorderly scenarios (`delayed_transition`, `current_policies`,
`nationally_determined`, `hot_house_world`) fixed add-on haircuts of **+10 bps on L2A, +18 bps
on L2B** ("midpoints of the supervisory stress range" — a deterministic replacement for a former
random draw, per inline comment).

**Stress scenario multipliers** (`scenario_shocks`): e.g. combined = deposit 1.8× / wholesale
2.5× / HQLA haircut 1.3×; net_zero_2050 = 1.05/1.1/1.05; all seven triplets are synthetic
scenario assumptions (no external citation).

### 7.3 Calculation walkthrough

1. **LCR:** haircut each level; if L2 > 40% of stock, L2 is recapped at `L1 × 40/60`; if L2B >
   15%, L2B is recapped at 15% of the uncapped stock. Inflows are capped at 75% of outflows
   (Basel inflow cap). Breaches and cap events are recorded in `notes`.
2. **NSFR:** pure factor-weighted sums with per-component audit breakdown; a breach note
   quantifies the stable-funding shortfall `RSF − ASF`.
3. **ALM/IRRBB:** each maturity bucket maps to a duration midpoint (overnight 0.003y … >20y 25y);
   PV01 = amount × duration / 10⁴. ΔEVE for the six EBA shocks uses net PV01 with ad-hoc scalars
   (steepener ×0.6, flattener ×0.4, short shocks ×0.5 on one-sided PV01). Materiality flag:
   `|ΔEVE_parallel_up| > 20% of assets` (note: the Basel outlier test is 15% of Tier 1 capital —
   the code uses total assets, a different, looser base).
4. **Stress:** stressed LCR/NSFR derive analytically from base ratios and scenario multipliers.
   Stress outflows need real funding bases: `dep_base × (mult−1) × 10%` + `whl_base × (mult−1) ×
   40%`; if bases are absent the engine returns nulls + `insufficient_data` note (honest null).
   Liquidity-at-Risk = outflow × `clamp(0.3 + 0.2·(whl_mult−1), 0.3, 0.7)`. Survival horizon is a
   step function of stressed LCR: ≥120 → 365d adequate · ≥100 → 210d borderline · ≥75 → 120d
   vulnerable · else 30d critical.
5. **Full assessment:** omitted breakdowns are replaced by fixed illustrative defaults, each
   flagged in `data_assumptions`; stress funding bases are drawn from the ASF breakdown. Overall
   rating: no breach & LCR ≥ 130 & NSFR ≥ 115 → strong; no breach → adequate; 1 breach →
   vulnerable; 2 → critical. Breach register cites CRR2 Art 412 / Art 428b.

### 7.4 Worked example (full-assessment defaults, no climate scenario)

Inputs: L1 = 1,000, L2A = 300, L2B = 100, gross outflow 1,200, gross inflow 500 (€mn).

| Step | Computation | Result |
|---|---|---|
| Haircut stock | 1,000 + 0.85×300 + 0.50×100 = 1,000 + 255 + 50 | 1,305 uncapped |
| Cap checks | L2 = 305/1,305 = 23.4% < 40%; L2B = 50/1,305 = 3.8% < 15% | no cap bites |
| Net outflow | inflow cap 0.75×1,200 = 900 > 500 → 1,200 − 500 | 700 |
| **LCR** | 1,305/700 | **186.4%** — no breach |
| NSFR ASF | 0.95×1,400 + 0.90×400 + 1.0×650 + 1.0×600 | 2,940 |
| NSFR RSF | 0.05×1,000 + 0.15×300 + 0.65×1,000 + 0.85×600 | 1,255 |
| **NSFR** | 2,940/1,255 | **234.3%** — no breach |
| ALM (8 flat buckets 450/450) | every gap 0 → net PV01 0 | ΔEVE = 0, NII = 0 |
| Stress (mild_idiosyncratic) | 186.4/1.0 × 1/(1+0.2×0.2+0.1×0.3) | stressed LCR ≈ **174.3%** → 365d, adequate |
| Rating | 0 breaches, LCR ≥ 130, NSFR ≥ 115 | **strong** |

### 7.5 Data provenance & limitations

- **No PRNG data.** Inline comments document that earlier random draws (climate haircuts, stress
  outflow bases, monitoring statuses) were deliberately replaced with deterministic constants or
  honest nulls; monitoring-tool status is always `not_assessed` ("reporting status is not a
  random variable").
- Full-assessment defaults (ASF/RSF stacks, flat 450/450 ALM buckets) are **illustrative demo
  balance sheets**, explicitly flagged in `data_assumptions`.
- LCR takes pre-bucketed L1/L2A/L2B totals — instrument-level classification is the caller's job.
- IRRBB uses linear PV01 (no convexity), heuristic non-parallel-shock scalars, and a
  20%-of-assets materiality test instead of the regulatory 15%-of-Tier-1 outlier test; NII uses
  the *total* cumulative gap, not the <1y repricing gap the comment describes.
- Stressed-ratio formulas are reduced-form scalings, not cash-flow-level re-computation; the
  seven scenario multiplier sets are unsourced assumptions.
- Climate haircut add-ons (10/18 bps) are platform assumptions — no supervisory standard yet
  prescribes climate HQLA haircuts.

### 7.6 Framework alignment

- **Basel III LCR (BCBS 238 rules text; EU: CRR2 Art 411-428 + Delegated Reg (EU) 2015/61)** —
  haircuts, 40%/15% composition caps, 75% inflow cap and the 100% minimum are all implemented
  as specified.
- **Basel III NSFR (BCBS 295; CRR2 Art 428b)** — ASF/RSF factor set matches the standard's
  main categories; 100% minimum enforced.
- **BCBS 368 / EBA GL/2018/02 (IRRBB)** — the six supervisory shock shapes are present; ΔEVE via
  PV01 is a first-order approximation of the standard's full-revaluation approach.
- **BCBS 248/238 monitoring tools** — the five tools (maturity mismatch, funding concentration,
  unencumbered assets, LCR by currency, market-related indicators) are catalogued with their
  paragraph references and surfaced as a reporting checklist, not computed.
- **EBA GL/2019/02 stress testing & ILAAP (CRD V Art 74, SREP GL/2014/13, BRRD)** — the stress
  module and `cross_framework` block map results to these supervisory processes descriptively.

## 9 · Future Evolution

### 9.1 Evolution A — Cash-flow-level stress and correct IRRBB outlier test (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain: four calculators (LCR with climate haircut overlay, NSFR, ALM
gap/IRRBB, liquidity stress) plus a full-assessment orchestrator and six reference endpoints, with
Basel/CRR2 factor tables faithfully encoded and a notably honest post-remediation posture — inline
comments document that earlier random draws (climate haircuts, stress bases, monitoring status) were
deliberately replaced with deterministic constants or honest nulls. §7.5 names the remaining
simplifications: IRRBB uses linear PV01 (no convexity) with heuristic non-parallel-shock scalars and
a **20%-of-assets materiality test instead of the regulatory 15%-of-Tier-1 outlier test**; NII uses
the total cumulative gap rather than the <1y repricing gap; and stressed ratios are reduced-form
scalings, not cash-flow-level recomputation, with seven unsourced scenario multiplier sets.
Evolution A implements full-revaluation IRRBB with the correct Tier-1-based outlier test and a
cash-flow-level stress engine.

**How.** `assess_alm_gap` adds convexity and the ±200bp full-revaluation ΔEVE the BCBS 368 standard
prescribes, with the materiality flag re-based to 15% of Tier 1; `run_liquidity_stress` recomputes
outflows at the cash-flow level from the funding stack rather than scaling base ratios. Rung 3:
calibrate the seven stress scenario multiplier sets against EBA stress-test parameters and validate
climate HQLA haircuts once a supervisory standard emerges (the 10/18bps add-ons are honestly flagged
as platform assumptions — no standard prescribes them yet).

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /alm-gap` and
`/full-assessment` **failed**; the full-assessment demo defaults (flat 450/450 ALM buckets) are
illustrative and must stay flagged in `data_assumptions`. **Acceptance:** the §7.4 worked example
(LCR 186.4%, NSFR 234.3%, strong) reproduces; the IRRBB materiality test uses 15% of Tier 1;
stressed LCR is recomputed from cash flows, not a reduced-form scaling; the failing POST endpoints
pass the harness.

### 9.2 Evolution B — Liquidity-risk analyst with tool-called Basel ratios (LLM tier 2)

**What.** A tool-calling analyst for treasury/ALM teams: "what's our LCR under a disorderly climate
scenario?" (calls `/lcr` with the climate overlay), "compute NSFR from this funding stack"
(`/nsfr`), "run the ALM gap and IRRBB EVE sensitivity" (`/alm-gap`), "stress us under a combined
run" (`/liquidity-stress`), and "give me the full liquidity assessment" (`/full-assessment`) —
narrating the engine's exact Basel outputs including cap events, breach registers (citing CRR2 Art
412/428b) and survival-horizon bands.

**How.** Tool schemas from the domain's endpoints; the six reference endpoints (HQLA factors/
haircuts, run-off/outflow rates, monitoring tools, rate shocks) are ideal RAG grounding for "what's
the Level 2B haircut and cap?" questions. The no-fabrication validator checks every ratio, PV01 and
horizon figure against tool output; the engine's honest-null design (stress needs real funding bases
or returns `insufficient_data`) means the copilot must request missing bases rather than assume them.
Composable into a Financial-desk orchestrator alongside `banking_risk`.

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure in an answer traces to an engine
tool call; the LCR cited matches `/lcr` including any cap events; a stress query without funding
bases returns the engine's honest-null with the copilot requesting them, not inventing a stressed
ratio.