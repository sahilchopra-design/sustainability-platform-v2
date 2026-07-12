## 7 · Methodology Deep Dive

Grounded in `backend/services/banking_risk_engine.py` (routes: `api/v1/routes/banking_risk.py`).
One engine, six Basel-pillar sub-models: IFRS 9 credit risk with climate overlay, LCR/NSFR
liquidity, parametric VaR market risk, BIA/TSA operational risk, FATF AML screening, and
Pillar-1 capital adequacy — plus a `comprehensive` orchestrator that chains them.

### 7.1 What the domain computes

| Sub-model | Headline formula (quoted from code) |
|---|---|
| Credit / ECL | `ECL_s1 = EAD_s1 × PD_1y × LGD`; `ECL_s2 = EAD_s2 × PD_lifetime × LGD`; `ECL_s3 = EAD_s3 × 1.0 × LGD`; climate overlay `= total_ECL × (mult − 1)` |
| Liquidity | `LCR = HQLA_after_haircuts_and_caps / net_30d_outflows`; `NSFR = Σ(ASF_i × factor_i) / Σ(RSF_j × factor_j)` |
| Market | `VaR_1d = book × (σ_ann/√252) × 2.326`; `VaR_10d = VaR_1d × √10`; `ES_97.5 ≈ VaR_10d × 1.4`; `mRWA = (VaR + sVaR) × 3.0 × 12.5` |
| Operational | `BIA = 15% × avg(positive GI, 3y)`; `TSA = Σ β_i × GI_i`; final charge `= max(BIA, TSA)` |
| AML | `score = min(100, Σ(tier_c × exposure_c/€1bn) / (4 × n_countries) × 100)` |
| Capital | CET1/T1/Total ratios vs 4.5/6/8% minima + combined buffer; `surplus_to_MDA = (CET1% − (4.5 + buffers)) × RWA` |

### 7.2 Parameterisation

**PD term structures** (cumulative-style annual PD %, years 1–5, per rating): AAA 0.01→0.15 ·
AA 0.02→0.28 · A 0.05→0.50 · BBB 0.15→1.55 · BB 0.60→5.40 · B 2.00→15.50 · CCC 8.00→32.00.
Broadly rating-agency-default-study shaped; no citation in code (treat as stylised).

**LGD by collateral** (%): sovereign guarantee 5 · cash 10 · resi mortgage 20 · CRE mortgage 30 ·
receivables 35 · other physical 40 · unsecured senior 45 · unsecured sub 75. The 45% senior
unsecured value matches the Basel foundation-IRB convention.

**Risk weights** (Basel III/IV standardised): sovereign 0/20 · bank 20/50 · corporate IG 65
(a Basel-IV investment-grade weight) · corporate standard 100 · high-risk 150 · retail 75 ·
resi mortgage 35 · CRE 100 · equity 250 · defaulted 150. `assess_credit_risk` applies the
**corporate_standard 100%** weight to the whole book regardless of `avg_rating`.

**Climate PD multipliers** by warming: 1.5 °C → 1.05, 2.0 → 1.12, 2.5 → 1.22, 3.0 → 1.35,
4.0 → 1.55; off-grid fallback `1 + (ΔT − 1) × 0.10`. Applied to total ECL, not to PD per stage.

**Liquidity factors** are imported from `services/reference_data_tables.py`
(`BASEL3_HQLA_CLASSIFICATION`, `BASEL3_LCR_OUTFLOW_RATES`, `BASEL3_NSFR_ASF/RSF_FACTORS`) — the
Basel LCR (BIS d295) haircut/outflow schedule and NSFR (d396) ASF/RSF factors. Level 2A capped
at 40% and 2B at 15% of total HQLA, per the Basel composition caps.

**Operational risk:** BIA α = 15%; TSA β by business line = 18% (corporate finance, trading,
payment & settlement), 15% (commercial banking, agency), 12% (retail banking, asset management,
retail brokerage) — the exact Basel II Standardised Approach betas.

**Capital minima/buffers:** CET1 4.5%, T1 6%, Total 8%, leverage 3%, CCB 2.5%, default G-SIB
surcharge 1.0%, CCyB caller-supplied (default 0.5%).

### 7.3 Calculation walkthrough

1. **Credit:** the book is split Stage 1/2/3 by caller percentages (defaults 90/8/2). Stage 1 uses
   the 1-year PD; Stage 2 the maturity-matched curve point (`pd_curve[min(maturity−1, 4)]`) — a
   point-PD proxy for lifetime ECL, not a discounted marginal-PD sum; Stage 3 sets PD = 100%.
   RWA = exposure × 100%; capital = 8% of RWA.
2. **Liquidity:** each HQLA holding is haircut per Basel classification, bucketed L1/2A/2B, caps
   applied, then divided by Σ(funding × outflow rate). `buffer_days = HQLA / (outflows/30)` —
   note outflows are already the 30-day stressed figure, so this metric assumes a uniform daily
   run-off. Concentration = largest funding source / total funding.
3. **Market:** parametric normal VaR with z(99%) = 2.326, √252 de-annualisation, √10 scaling;
   stressed VaR re-runs at the stressed vol (default 25% vs 12%). IRRBB: `EVE = DV01 × shock_bps`
   (default 200bp, the Basel IRRBB standard shock); `NII = 0.3 × EVE` ("~30% flows through P&L in
   year 1"). FX charge = 8% of net open position (the Basel standardised FX shorthand).
4. **AML:** each country's FATF `risk_tier` (1–4) is exposure-weighted (per €1bn) and normalised
   by the max possible 4 × n. Grey/black-list membership drives escalating recommended actions.
5. **Capital / comprehensive:** operational RWA is derived as `op_capital × 12.5` (inverse of the
   8% rule); overall rating bands on CET1 ratio: ≥14 low · ≥11 moderate · ≥8.5 elevated ·
   ≥4.5 high · else critical.

### 7.4 Worked example (default credit call: €10bn BBB book, 3y, unsecured senior, 1.5 °C)

| Step | Computation | Result |
|---|---|---|
| PDs | BBB curve → 1y 0.15%, 3y 0.72% | — |
| LGD | unsecured_senior | 45% |
| Stage split (90/8/2) | 9.0 / 0.8 / 0.2 €bn | — |
| ECL Stage 1 | 9.0bn × 0.0015 × 0.45 | **€6.075M** |
| ECL Stage 2 | 0.8bn × 0.0072 × 0.45 | **€2.592M** |
| ECL Stage 3 | 0.2bn × 1.00 × 0.45 | **€90.0M** |
| Total ECL | 6.075 + 2.592 + 90.0 | **€98.667M** |
| Climate overlay (1.5 °C, ×1.05) | 98.667 × 0.05 | **€4.933M** |
| Coverage ratio | (98.667 + 4.933)/10,000 | **1.036%** |
| RWA / capital | 10bn × 100% → × 8% | €10bn / **€800M** |

Stage 3 dominates: 2% of the book at PD 100% contributes 91% of ECL — the expected shape.

### 7.5 Data provenance & limitations

- **No PRNG-seeded data.** Every default argument (€10bn book, €50bn central-bank reserves,
  default funding stack, 12-country AML list…) is a **fixed synthetic demo balance sheet** used
  when the caller omits inputs; regulatory factors are genuine Basel/FATF constants from the
  shared reference-data layer.
- Stage 2 "lifetime" ECL is a single maturity-point PD, undiscounted — production IFRS 9 sums
  discounted marginal PD × LGD × EAD per period under multiple macro scenarios.
- One rating/LGD/RW for the whole portfolio (no obligor-level granularity); RWA ignores the
  rating input entirely (always 100%).
- NSFR RSF asset composition is hard-coded (the `asset_book` input feeds ASF, not RSF).
- Market risk is Basel 2.5 (VaR + sVaR × 3 multiplier), not FRTB ES-based despite d457 being
  cited; the ES figure is a ×1.4 normal-distribution approximation.
- BIA/TSA are the *legacy* Basel II approaches — Basel III finalisation replaced them with the
  Standardised Measurement Approach (SMA) from 2023; the code notes the higher-of choice, which
  is itself a house rule (regulation prescribes one approved approach).

### 7.6 Framework alignment

- **IFRS 9 §5.5** — 3-stage ECL with 12-month (Stage 1) vs lifetime (Stage 2/3) horizons;
  implemented with point-PD simplification.
- **Basel III LCR (BIS d295)** — HQLA levels 1/2A/2B, haircuts, 40%/15% caps, 30-day stressed
  net outflows, ≥100% requirement: faithfully implemented via reference tables.
- **Basel III NSFR (BIS d396)** — ASF/RSF factor methodology, ≥100%: implemented.
- **Basel II/III operational risk (Art. 316 betas)** — BIA α=15% and TSA betas exact;
  superseded in current law by SMA.
- **Basel 2.5 / FRTB (d457)** — VaR(99%, 10d) + stressed VaR with ×3 supervisory multiplier and
  12.5 RWA conversion; FRTB's 97.5% ES by liquidity horizon is only approximated.
- **BCBS IRRBB (d368)** — ±200bp standard shock on DV01 for ΔEVE.
- **FATF 40 Recommendations** — country-risk tiers and grey/black ("increased monitoring" /
  "call for action") lists drive EDD escalation, mirroring FATF's listing mechanics.
- **CRD V combined buffer / MDA** — CCB + CCyB + G-SIB surcharge stacked on CET1 4.5% defines
  the MDA trigger point, exactly as computed in `surplus_to_mda`.
