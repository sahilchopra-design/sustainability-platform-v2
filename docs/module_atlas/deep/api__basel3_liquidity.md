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
