## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/ecl-gar-pillar3` wraps the **ECL → GAR → Pillar 3 Orchestrator** ("E1",
`backend/services/ecl_gar_pillar3_orchestrator.py`), a three-stage compliance chain for banks:
(1) climate-conditioned IFRS 9 ECL, (2) EU Taxonomy Green Asset Ratio classification, (3) an
auto-populated CRR Art. 449a / EBA ITS 2022/01 Pillar 3 ESG disclosure pack. Stage-1 formulas,
quoted from the class docstring and `_compute_exposure`:

```
PD_climate  = min(PD_base × PD_mult(transition_level, scenario), 0.9999)
LGD_climate = min(LGD_base + IPCC_flood_component, 0.90)
EAD_climate = EAD + CCF_uplift(level, scenario) × undrawn_commitment
ECL_climate = PD_climate × LGD_climate × EAD_climate
Base ECL    = PD_base × LGD_base × EAD
```

Stage 2: `taxonomy_aligned = eligible AND aligned_pct ≥ 80% AND DNSH AND min_social_safeguards`;
`GAR = Σ aligned non-sovereign EAD / Σ non-sovereign EAD × 100`; BTAR uses total EAD (incl.
sovereigns) as denominator. Stage 3 fills 11 KPI rows and 4 narrative sections plus an
assurance-readiness score (100 minus deductions).

### 7.2 Parameterisation

**PD multipliers** (`_PD_TRANSITION_MULTIPLIERS`, transition level × scenario — synthetic
calibration):

| Level | OPTIMISTIC | BASE | ADVERSE | SEVERE |
|---|---|---|---|---|
| low | 1.02 | 1.05 | 1.12 | 1.20 |
| medium | 1.05 | 1.15 | 1.35 | 1.55 |
| high | 1.10 | 1.30 | 1.65 | 2.10 |

**IPCC AR6 flood frequency amplifiers** (`_IPCC_FLOOD_AMPLIFIERS`; comment cites "WG2 SPM B1.2"):
OPTIMISTIC 1.70 (+1.5 °C), BASE 2.80 (+2 °C), ADVERSE 4.10 (+3 °C), SEVERE 5.60 (+4 °C) — the
factor by which flood frequency increases, shortening the effective return period.

**EAD CCF uplift fractions** (`_EAD_CCF_UPLIFT`, applied to undrawn commitments): low 0–8%,
medium 2–20%, high 4–35% across scenarios. **Base flood LGD haircuts** (`_BASE_FLOOD_HAIRCUT`):
low 3%, medium 7%, high 14%; the LGD flood component is capped at 30 points and total LGD at 90%.

**Taxonomy reference**: 15 NACE codes in `GAR_ELIGIBLE_NACE` flagged for Climate Change Mitigation
(CCM) and/or Adaptation (CCA) objectives (e.g. D35 electricity CCM+CCA, E36 water CCA-only);
alignment threshold 80% of activity meeting Technical Screening Criteria.

**Assurance deductions** (`_assess_readiness`): −15 if < 50% of exposures taxonomy-assessed,
−20 if GAR = 0, −10 if eligible exposures lack DNSH, −15 if all ECL uplifts are zero, −10 if > 80%
of exposures use the default 100-yr flood return period; floor 0.

### 7.3 Calculation walkthrough

`POST /orchestrate` (also `/ecl-only`, `/gar-only` subsets) takes entity name, a portfolio of
`ExposureInput` records and a scenario (BASE default, invalid → BASE):

1. **LGD flood component** — the code shortens the return period by the AR6 amplifier and scales
   damage logarithmically: `rp_eff = max(rp/amp, 5)`;
   `scale = ln(max(rp,5)) / ln(rp_eff)`; `component = min(base_haircut × scale, 0.30)`.
2. **Per-exposure ECL** — base vs climate ECL and uplift %; EAD uplift only touches undrawn
   commitments (drawdown acceleration).
3. **Portfolio aggregates** — Σ ECLs, EAD-weighted average EAD-uplift and LGD-flood component;
   transition concentration = high-level EAD share; physical concentration = share of EAD with
   flood return period ≤ 100 yr.
4. **GAR/BTAR** — numerator counts full EAD of aligned exposures (no partial pro-rating by
   aligned %); CCM/CCA splits require alignment plus the objective flag (input or NACE map).
5. **Pillar 3 pack** — Section P3-A (Taxonomy & GAR, Template 1), P3-B (risk concentration,
   Templates 5–7, with gap warnings at > 30% transition / > 20% physical concentration), P3-C
   (ECL overlay, GL/2022/16 §4.2.3/4.2.4), P3-D (governance/TCFD cross-reference, fixed
   narrative). KPI GAR-3 carries the benchmark note "EBA average ~6% (2022)".
   `GET /ref/kpis` and `GET /ref/nace-eligible` expose the reference tables.

### 7.4 Worked example (SEVERE scenario, one exposure)

Inputs: EAD €100M, undrawn €20M, PD 2%, LGD 40%, transition level *high*, flood RP 50 yr,
eligible, aligned 85%, DNSH ✓, MSS ✓, NACE D35.

| Step | Computation | Result |
|---|---|---|
| PD_climate | 0.02 × 2.10 | 4.20% |
| Flood RP effective | max(50/5.6, 5) | 8.93 yr |
| Damage scale | ln 50 / ln 8.93 = 3.912/2.189 | 1.787 |
| LGD flood component | min(0.14 × 1.787, 0.30) | 0.2502 |
| LGD_climate | min(0.40 + 0.2502, 0.90) | 65.02% |
| EAD_climate | 100M + 20M × 0.35 | €107M |
| Base ECL | 0.02 × 0.40 × 100M | €0.80M |
| Climate ECL | 0.042 × 0.6502 × 107M | **€2.922M** |
| ECL uplift | (2.922 − 0.80)/0.80 | **+265%** |
| GAR | aligned (85% ≥ 80, DNSH, MSS) → 100/100 | **100%** (single-exposure book) |
| CCM/CCA | D35 map: ccm ✓, cca ✓ | both €100M |

### 7.5 Data provenance & limitations

- **Pure calculator, no PRNG/seed data**: all exposures are caller-supplied. The AR6 flood
  amplifiers are the only physically sourced constants (attributed in-code to IPCC AR6 WG2 SPM
  B1.2); PD multipliers, CCF uplifts and flood haircuts are **synthetic demo calibrations**
  (the P3-C narrative's mention of "JRC depth-damage curves" describes intent, not implemented
  curves).
- GAR uses whole-EAD attribution for aligned exposures rather than pro-rating by
  `taxonomy_aligned_pct` — real Art. 8 reporting apportions by the counterparty's turnover/CapEx
  KPI. BTAR here = aligned assets ÷ total assets incl. sovereigns, a simplification of the ITS
  BTAR (which extends the *numerator* to non-NFRD counterparties).
- Single-period ECL, no discounting, no staging/SICR (that lives in the sibling `/api/v1/ecl`
  domain); one scenario per run rather than probability-weighting.
- Governance section P3-D is fixed boilerplate with a hardcoded gap line.

### 7.6 Framework alignment

- **CRR Art. 449a + EBA ITS 2022/01 (Pillar 3 ESG):** the disclosure pack mirrors the ITS
  structure — Template 1 (taxonomy/GAR), Templates 5–7 (transition and physical risk banking
  book); real templates require NACE-sector × maturity-band breakdowns not modelled here.
- **EU Taxonomy Reg. 2020/852 + DAs 2021/2139, 2022/1214, 2023/2485:** alignment = substantial
  contribution (proxied by the ≥ 80% TSC threshold) + DNSH + minimum safeguards (Art. 18, ILO
  core conventions) — the module implements this as three boolean gates.
- **GAR (Disclosures DA under Art. 8):** aligned covered assets ÷ covered assets excluding
  sovereign/central-bank exposures — the sovereign exclusion is implemented; the "~6% EBA
  average" benchmark echoes the EBA's 2022 pilot findings.
- **EBA GL/2022/16 & BCBS Principles 14–18:** climate-in-credit-risk overlay (PD/LGD/EAD
  channels); BCBS Principle 16 is cited for the CCF drawdown effect.
- **IPCC AR6 WG2:** flood-frequency amplification with warming as the physical-risk driver;
  implemented as return-period shortening feeding a log damage scale.
- **IFRS 9:** ECL = PD×LGD×EAD kernel; ESRS E1 cross-referencing appears in the recommendations
  (single-source CSRD reporting).
