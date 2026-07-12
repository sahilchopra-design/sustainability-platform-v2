## 7 · Methodology Deep Dive

Grounded in `backend/services/basel_capital_engine.py` (1,737 lines; routes:
`api/v1/routes/basel_capital.py`). Note the **exposed API surface is reference-data only** — the
eight `GET /ref/*` endpoints serve the engine's regulatory constant tables (exposure classes,
SA weights, IRB parameters, capital requirements/buffers, LCR/NSFR parameters, climate
adjustments, operational risk). The full calculators (`calculate_capital_requirement`,
`calculate_liquidity`, `run_capital_adequacy`) live in the engine and are consumed internally;
they are documented here because they define what the reference data means.

### 7.1 What the engine computes

1. **SA credit risk weights** per CRR Art. 114–134: 13 exposure classes × CQS 0–6 lookup
   (e.g. corporates CQS1 20% … CQS5-6 150%, unrated 100%; covered bonds 10–100%; retail flat 75%;
   residential property 35%, commercial 50%).
2. **IRB risk weight** — the full CRR Art. 153 corporate formula, implemented exactly:

```
R = 0.12·f(PD) + 0.24·(1 − f(PD)),  f(PD) = (1 − e^(−50·PD)) / (1 − e^(−50))
b = (0.11852 − 0.05478·ln PD)²
K = [LGD·N(√(1/(1−R))·G(PD) + √(R/(1−R))·G(0.999)) − PD·LGD] · (1 + (M − 2.5)·b) / (1 − 1.5·b)
RW = K × 12.5      (RWA = RW × EAD)
```

   Retail is routed per CRR Art. 154 sub-class: residential mortgage R = 0.15 fixed, QRRE
   R = 0.04 fixed, other-retail R = 0.03·f₃₅(PD) + 0.16·(1 − f₃₅(PD)) using the −35 exponent —
   no maturity adjustment. Normal CDF via `math.erf`; inverse CDF via the Acklam rational
   approximation (accuracy ≈ 1.15e−9, cited in code).
3. **Operational risk SMA** (BCBS d563): marginal BIC buckets 12% (< €1bn) / 15% (€1–30bn) /
   18% (> €30bn); `LC = 15 × avg annual losses`; `ILM = ln(e − 1 + (LC/BIC)^0.8)` floored at 1;
   `opRWA = BIC·ILM × 12.5`.
4. **Capital adequacy** (CRR Art. 92): CET1/T1/Total ratios, leverage = T1/exposure measure,
   combined buffer = CCB 2.5% + CCyB + SRB + max(G-SIB bucket 1–5 → 1.0–3.5%, D-SIB), MDA breach
   detection, surplus/deficit in EUR.
5. **Basel III.1 output floor**: under IRB, credit RWA is floored at **72.5% of the SA-computed
   RWA** (both computed per exposure); the uplift is reported when binding.
6. **Climate overlay (EBA GL/2022/02)** — *quarantined Pillar-2*: NACE-sector transition
   multipliers (mining/energy 1.25, manufacturing 1.15, transport 1.18, ICT 0.98 …) × physical-zone
   multipliers (high 1.20 / medium 1.10 / low 1.00) × green supporting factor 0.7619 (CRR Art.
   501a) for taxonomy-qualifying assets. The inline comment is explicit: climate is **not** baked
   into Pillar-1 RWA or the solvency ratios ("applying either to the regulatory RWA fabricates
   the solvency ratios"); it is reported as `climate_rwa_addon` / `climate_adjusted_rwa` memo items.
7. **LCR/NSFR** (BCBS d295/d396) and a **dashboard orchestrator** with climate stress, BCBS 239
   data-quality scoring, Pillar-2 recommendations and RAG status.

### 7.2 Parameterisation highlights

| Table | Key values | Provenance |
|---|---|---|
| Capital minima | CET1 4.5 · T1 6 · Total 8 · leverage 3 · CCB 2.5 (%) | CRR Art. 92 / CRD V |
| Output floor | 72.5% final (2028), 50% transitional 2025 | BCBS d424 / CRR III |
| IRB floors | PD 5bp; LGD 25% unsecured / 10% resi / 15% CRE | Basel III.1 / CRR3 Art 160(1) |
| G-SIB buckets | 1→1.0%, 2→1.5%, 3→2.0%, 4→2.5%, 5→3.5% | FSB/BCBS G-SIB framework |
| LCR outflows | retail stable 5%, less-stable 10%, wholesale op 25%, non-op 40%, financial 100%, derivatives 100% | BCBS d295 |
| NSFR | ASF: capital 100%, stable retail 95% … RSF: L1 5%, mortgages 65%, corporate >1y 85%, NPL 100% | BCBS d396 |
| Climate multipliers | NACE A–U 0.98–1.25; physical 1.0–1.2; GSF 0.7619; brown factor 1.25 | EBA GL/2022/02 concept; multiplier values are platform estimates (brown factor labelled "proposed, EBA 2023") |

### 7.3 Calculation walkthrough (capital requirement)

Per exposure: SA RW is always computed (floor basis); IRB RW replaces it when `approach="irb"`.
`rwa_reg = EAD × RW` accumulates Pillar-1 credit RWA; the climate multiplier produces only
`climate_addon = rwa_reg × (mult − 1)`. After the loop the output floor may uplift credit RWA;
total RWA adds caller-supplied market and operational RWA. Ratios, buffers, breach list
(including the MDA test `CET1 < 4.5% + CBR`) and EUR-denominated surpluses follow. The dashboard
then adds: LCR (with inflows approximated as 5% monthly turn-over of loan books × 50% inflow
rate, floor `net ≥ 25% of outflows`), NSFR, climate stress (default adverse: CET1 −15%/RWA +10%;
severe: −25%/+20%), BCBS 239 score (7 weighted data-completeness principles, max 100), and RAG:
RED if any minimum or LCR/NSFR breach; AMBER if inside the buffer; else GREEN.

### 7.4 Worked example (IRB corporate risk weight)

PD = 1%, LGD = 45%, M = 2.5y:

| Step | Computation | Result |
|---|---|---|
| f(PD) | (1 − e^(−0.5))/(1 − e^(−50)) | 0.39347 |
| R | 0.12×0.39347 + 0.24×0.60653 | 0.19278 |
| b | (0.11852 − 0.05478·ln 0.01)² | 0.13950 (memo: cancels at M = 2.5) |
| G(PD), G(0.999) | Φ⁻¹(0.01), Φ⁻¹(0.999) | −2.32635, 3.09023 |
| Conditional PD | N(√(1/0.80722)·(−2.32635) + √(0.19278/0.80722)·3.09023) = N(−1.07924) | 0.14024 |
| K | 0.45×(0.14024 − 0.01) × 1/(1 − 1.5×0.1395) ≈ 0.05861 × 1.26466 | 0.07412 |
| **RW** | 0.07412 × 12.5 | **≈ 92.6%** |

A €100M EAD exposure therefore carries ≈ €92.6M RWA — close to the well-known ~92%
benchmark for a 1%/45%/2.5y corporate under Basel IRB, confirming the implementation.
Under SA the same unrated corporate would be 100% → floor basis 72.5% × 100 = €72.5M (floor
not binding here).

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data anywhere** — the engine is fully deterministic in caller inputs;
  everything embedded is regulatory reference data with article-level citations in code.
- Sovereign/bank IRB exposures reuse the corporate correlation formula (CRR treats them
  similarly, but SME firm-size correlation adjustment is documented in the ref table yet not
  applied in `calculate_irb_risk_weight`); LGD input floors are listed but not enforced in the
  RW function (only the 5bp PD floor is).
- LCR inflows use a crude `loans × 5% × 50%` monthly-maturity proxy; secured-funding outflow
  categories in the parameters table are richer than the calculator wiring.
- Climate stress defaults (−15%/+10%, −25%/+20%) are illustrative scenario magnitudes, not
  from a named supervisory exercise; the NACE/physical multipliers are expert judgement placed
  under an EBA GL/2022/02 banner (the guideline mandates ESG risk *integration*, not multipliers).
- BCBS 239 scoring measures input completeness only — a proxy for the standard's 14 principles
  (timeliness is hard-coded at 8/10).

### 7.6 Framework alignment

- **CRR (EU 575/2013) Art. 92/112–134/153/154** — minima, exposure classes, SA weights and the
  IRB formulas are implemented essentially verbatim.
- **Basel III Final (BCBS d424) / CRR III (EU 2024/1623)** — 72.5% output floor, PD input floor,
  Basel-IV SA granularity; transitional 50% (2025) is in reference data.
- **CRD IV/V** — combined buffer stack (CCB, CCyB, SRB, higher-of G-SIB/D-SIB) and the MDA
  trigger mechanics.
- **BCBS d295/d396 (LCR/NSFR)** — haircuts, 40/15% caps, 75% inflow cap, ASF/RSF factors; the
  25%-of-outflows net floor mirrors the LCR rules text.
- **BCBS d563 (SMA)** — how the real SMA works: the Business Indicator (ILDC + SC + FC) enters
  marginal buckets (12/15/18%) to give BIC; the Internal Loss Multiplier scales it by 10-year
  loss history via `ln(e − 1 + (15·losses/BIC)^0.8)`; the engine reproduces this exactly.
- **EBA GL/2022/02 & CRR Art. 501a** — climate as Pillar-2 overlay plus the green supporting
  factor (0.7619 = 1/1.3125, the infrastructure factor), with the correct posture that Pillar 1
  contains no climate multiplier.
- **BCBS 239** — data-aggregation principles approximated as a completeness score.
