## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** A **rigorous backend engine exists** —
> `eu_taxonomy_engine.py` implements the real Article 3 three-step test (Substantial Contribution vs
> quantitative/qualitative TSC thresholds → DNSH on the other 5 objectives → Minimum Safeguards),
> across 80+ NACE activities in all four Delegated Acts, with genuine GAR/BTAR/SFDR portfolio roll-up.
> **But the `EuTaxonomyPage.jsx` frontend does not call it for scoring.** It fetches only *reference*
> tables (`/ref/objectives`, `/ref/dnsh-matrix`, `/ref/nace-activities`…) and computes alignment
> **locally with a seeded PRNG** (`genActivityResult` → `seededRandom(hashStr(name+nace)+n)`). So the
> evidence the user enters (GHG reduction, EPC class, etc.) is *ignored* — alignment is deterministic
> pseudo-random. The financial KPI aggregation (turnover/capex/opex, GAR) is, however, real arithmetic.
> §7 documents the frontend as coded and §8 the backend it should call.

### 7.1 What the frontend computes

Per activity, `genActivityResult(name, nace, sector, rev, capex, opex, seed0)`:

```js
r(n) = seededRandom(seed0 + n)                          // seed0 = hashStr(name+nace)
objScores[i]      = round(r(i+1)·40 + 40)               // 40–80 per objective
targetIdx         = floor(r(7)·6)                        // "primary" objective
objScores[target] += 25 (capped 100)                    // boost
substantialContrib = objScores[target].score
dnshPass          = every non-target objective has r(10+i) > 0.25
safeguards        = {oecd:r(30)>0.2, ungp:r(31)>0.25, ilo:r(32)>0.2, csddd:r(33)>0.3}
eligible          = substantialContrib ≥ 40
aligned           = eligible AND dnshPass AND safeguardsPass
```

The **structure is faithful to Article 3** (SC ∩ DNSH ∩ MSS), but each gate is a seeded coin-flip, not
an evaluation of the entered evidence.

The **financial KPIs are real** (`genEntityData`):

```
turnoverAligned = Σ(aligned activities' revenue) / Σ(all revenue) × 100
capexAligned    = Σ(aligned capex)  / Σ(total capex)  × 100      (same for opex)
GAR (portfolio) = Σ (weight · alignedPct/100) / Σ weight
BTAR            = Σ (weight · 0.6 · eligible?) / Σ weight         (flat 0.6 proxy)
```

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| 6 objectives (`OBJ_KEYS`) | CCM/CCA/WTR/CE/POL/BIO | **Real** — Taxonomy Regulation Art. 9–15 |
| SC eligibility floor | ≥ 40 | Frontend heuristic (not a regulatory number) |
| DNSH pass prob | `r > 0.25` | **Synthetic** coin-flip per objective |
| Safeguard thresholds | `r > 0.2–0.3` | Synthetic; real safeguards are OECD MNE / UNGP / ILO core / CSDDD |
| BTAR factor | 0.6 (flat) | Placeholder proxy, not a computed banking-book ratio |
| `DEFAULT_PORTFOLIO` | 5 Indian issuers (Tata Power, L&T, HDFC, JSW, Adani Green) with NACE codes | Illustrative demo entities |
| Reference tables | fetched from API `/ref/*` | **Real** backend reference data (objectives, DNSH matrix, safeguards, NACE) |

### 7.3 Calculation walkthrough (frontend)

1. User fills activity evidence (GHG reduction, EPC, water, safeguards) — **captured but unused for
   scoring**.
2. `assess()` calls `genActivityResult` with `seed0 = hashStr(name+nace)` → deterministic objective
   scores, DNSH/safeguard flags, eligibility, alignment.
3. `genEntityData` aggregates aligned/eligible revenue, capex, opex into the three Article-8 KPIs.
4. Portfolio tab: each holding is assessed, then `gar = Σ(weight·alignedPct)/Σweight`,
   `btar = Σ(weight·0.6·eligible)/Σweight`.

### 7.4 Worked example

Activity "Solar PV Installation", NACE D35.11 → `seed0 = hashStr("Solar PV InstallationD35.11")`.
Suppose `r(7)·6` → targetIdx = 0 (CCM), and `r(1)·40+40 = 68`, boosted +25 → capped 100:

| Step | Value |
|---|---|
| substantialContrib (CCM) | 100 (68 + 25 → cap) → but boost applied to base 68 → 93 |
| DNSH (5 non-target, each r>0.25) | say all pass → dnshPass = true |
| Safeguards (oecd/ungp/ilo pass, csddd r>0.3) | if all true → safeguardsPass = true |
| eligible (93 ≥ 40) | true |
| **aligned** = eligible∧dnsh∧ms | **true** |

Entity KPI: if this activity has revenue 150 and is the only aligned one of totalRev 380 →
`turnoverAligned = 150/380 = 39.5%`. This turnover math is correct; the *alignment flag* driving it is
seeded, so re-labelling the activity changes the hash and flips alignment unpredictably.

### 7.5 Data provenance & limitations

- **Alignment is synthetic** (`seededRandom`), keyed on the activity name+NACE hash. User-entered
  evidence (emission intensity, EPC class, water efficiency) does **not** affect the result — the
  rigorous TSC comparison lives only in the unused backend.
- **Financial KPI arithmetic is genuine** (turnover/capex/opex alignment; GAR).
- **BTAR uses a flat 0.6 proxy** — not the real banking-book taxonomy-aligned ratio.
- Safeguard/DNSH thresholds are coin-flips, not OECD/UNGP/ILO/CSDDD assessments.

**Framework alignment:** Structurally faithful to **EU Taxonomy Regulation (EU) 2020/852 Article 3**
(the SC ∩ DNSH ∩ MSS test) and Article 8 turnover/capex/opex KPIs; the GAR is the **credit-institution
Green Asset Ratio** (aligned assets / covered assets) mandated from 2024. SFDR Article 6/8/9 tie-in
mirrors the backend's GAR→classification mapping. The **actual** technical-screening logic — quantitative
thresholds (e.g. 0 gCO₂/km for cars, EPC-A buildings) and qualitative evidence scoring — is implemented
in `eu_taxonomy_engine.py` but not wired to this page.

## 8 · Model Specification

**Status: specification — not yet implemented in the frontend flow (backend engine exists).** The
production model is to route the user's entered evidence through `eu_taxonomy_engine.assess_activity /
assess_entity / assess_portfolio` instead of the seeded `genActivityResult`.

**8.1 Purpose & scope.** Determine Taxonomy eligibility and alignment per economic activity and roll up
to entity Article-8 KPIs and portfolio GAR/BTAR + SFDR classification, from real reported evidence.

**8.2 Conceptual approach.** The Article 3 three-step test exactly as codified in the Delegated Acts —
the same design used by ISS ESG, MSCI, and Clarity AI taxonomy tools. Quantitative TSC compare a metric
to a regulatory threshold; qualitative TSC score documentary evidence; DNSH is evaluated on the other
five objectives; Minimum Safeguards check OECD MNE / UNGP / ILO / CSDDD compliance.

**8.3 Mathematical specification (from the backend engine).**

```
Per activity a, objective o with TSC threshold τ, unit u:
  quantitative:  met = (value ≤ τ) for emissions-type u, or (value ≥ τ) for reduction/recycled u
                 score = clip((1 − value/τ)·100, 0, 100)   (or value/τ·100 for "higher-better")
  qualitative:   score = min(100, 25·|evidence docs provided|),  met = score ≥ 50
  DNSH_o' met = evidence satisfies DNSH criteria for all o' ≠ o
  MSS met     = OECD ∧ UNGP ∧ ILO ∧ CSDDD
  aligned = SC_met ∧ (∀ DNSH met) ∧ MSS_met
Entity: turnover_aligned% = Σ(aligned activity turnover)/Σ turnover  (capex, opex analogous)
Portfolio: GAR = Σ(exposure·turnover_aligned%/100)/Σ exposure
           SFDR: GAR ≥ 70 → Art 9; ≥ 20 → Art 8; else Art 6
```

| Parameter | Source |
|---|---|
| TSC thresholds (0 gCO₂/km, EPC-A, % reductions) | Climate DA 2021/2139, Complementary DA 2022/1214, Environmental DA 2023/2486 |
| DNSH criteria matrix | Delegated Act Annexes |
| Minimum Safeguards | OECD MNE Guidelines, UNGPs, ILO core conventions, CSDDD |
| Article 8 KPI definitions | Disclosures DA 2021/2178 |

**8.4 Data requirements.** Per-activity: NACE code, target objective, evidence dict (emission
intensity, EPC class, recycled %, water efficiency, safeguard attestations), and financials (turnover,
capex, opex). Portfolio: exposure per investee. All consumed by the existing engine; the frontend need
only POST `/assess` instead of computing locally.

**8.5 Validation & benchmarking plan.** Reconcile activity alignment against published corporate
Taxonomy disclosures for the demo issuers; unit-test each TSC threshold against the DA text; benchmark
GAR against EBA Pillar-3 ESG disclosure templates.

**8.6 Limitations & model risk.** Qualitative TSC scoring by document-count (25 pts each) is a coarse
proxy — real assessment needs expert review; flag qualitative-scored activities for manual sign-off.
BTAR is simplified to equal GAR in the engine; a production BTAR must scope the banking book separately.
Conservative fallback: missing evidence → not aligned (never default to aligned).
