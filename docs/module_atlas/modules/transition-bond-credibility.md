# Transition Bond Credibility
**Module ID:** `transition-bond-credibility` · **Route:** `/transition-bond-credibility` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ2 · **Sprint:** CQ

## 1 · Overview
20 SLB/transition bonds with KPI strength scoring, step-up probability, and use-of-proceeds verification.

**How an analyst works this module:**
- Bond Universe shows 20 instruments with KPI details
- KPI Strength Scoring rates ambition level
- Issuer Cross-Check verifies transition plan from EP-AL5

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BONDS`, `KPI_DIMS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BONDS` | 13 | `type`, `kpiScore`, `stepUpBps`, `pMiss`, `expectedCost`, `uopDeployed`, `planScore`, `amount`, `coupon` |
| `KPI_DIMS` | 7 | `avg` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Bond Universe','KPI Strength Scoring','Coupon Step-Up Probability','Use of Proceeds Verification','Issuer Transition Plan Cross-Check','Peer Comparison'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BONDS`, `KPI_DIMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bonds | — | Market | SLB and transition bonds |
| Avg Step-Up | — | Prospectus data | Average coupon step-up if KPI missed |

## 5 · Intermediate Transformation Logic
**Methodology:** KPI credibility assessment
**Headline formula:** `P(miss) = P(KPI < target); ExpectedCost = P(miss) × StepUpBps`

Weak KPIs: already achieved, not ambitious. Strong KPIs: stretch target requiring real operational change. Step-up probability estimates likelihood of coupon increase.

**Standards:** ['ICMA SLB Principles']
**Reference documents:** ICMA SLB Principles; ICMA Transition Finance Handbook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most platform pages, this module's dataset is **not PRNG-generated** — it is 12 hand-curated,
named real-world sustainability-linked bonds (SLBs) and transition bonds (Enel, Holcim, Chanel,
Tesco, Suzano, Etihad, JBS, Repsol, ANA Holdings, CaixaBank, Novartis, Pemex), each carrying 7
manually-assigned attributes (`kpiScore`, `stepUpBps`, `pMiss`, `expectedCost`, `uopDeployed`,
`planScore`, `amount`, `coupon`). One formula is genuinely computed and internally consistent
across all 12 rows:

```
Expected Cost (bps) = P(KPI miss) × Coupon Step-Up (bps)
```

### 7.2 Parameterisation

| Field | Meaning | Provenance |
|---|---|---|
| `kpiScore` (0–100) | Overall KPI credibility/ambition score | Manually assigned per issuer; not derived from a sub-score formula in code |
| `stepUpBps` | Coupon penalty if KPI target missed | Manually assigned (0 for the 4 "Transition" bonds, which have no step-up mechanism by structure) |
| `pMiss` (0–1) | Probability the KPI target is missed | Manually assigned, inversely correlated with `kpiScore` (Novartis kpiScore=88→pMiss=0.18; Pemex kpiScore=32→pMiss=0.82) but not algebraically derived from it |
| `expectedCost` | `pMiss × stepUpBps` | **Computed and verified consistent across all 12 rows** — see §7.4 |
| `uopDeployed` | % of use-of-proceeds deployed | Manually assigned |
| `planScore` | Issuer transition-plan credibility score (cross-referenced to EP-AL5 per the guide) | Manually assigned |
| `KPI_DIMS` | 6 KPI-quality dimensions (Ambition, Materiality, Measurability, Externally Verified, Science-Based, Baseline Transparency) with portfolio-average scores | Hand-set averages, not computed from the 12 individual bonds' sub-scores (no per-bond breakdown exists in the data) |

### 7.3 Calculation walkthrough

1. **Type filter** splits the universe into SLB (8 bonds, real step-up coupon mechanics) vs
   Transition (4 bonds, `stepUpBps=0` — proceeds-based instruments with no penalty coupon).
2. **KPI Strength Scoring tab**: bar-ranks issuers by `kpiScore`; radar chart shows the 6
   `KPI_DIMS` portfolio averages (Externally Verified 58, Science-Based 52 are the weakest
   dimensions — consistent with real-world SLB market criticism that many KPIs lack third-party
   verification or SBTi alignment).
3. **Coupon Step-Up Probability tab**: dual-axis bar chart plotting `stepUpBps` against the derived
   `expectedCost`, filtered to `stepUpBps > 0` (excludes the 4 Transition bonds, which structurally
   cannot show this metric).
4. **Use of Proceeds tab**: ranks issuers by `uopDeployed` %.
5. **Transition Plan Cross-Check tab**: side-by-side bar comparison of `kpiScore` vs `planScore` —
   the two scores are close for high performers (Novartis 88/82, Holcim 85/80) and diverge sharply
   for weak performers (Pemex 32/25, JBS 42/32), consistent with the intuition that weak-KPI issuers
   also tend to have weak overall transition plans, though no algebraic link enforces this.
6. **Peer Comparison tab**: pie chart bucketing all 12 bonds into High (≥75) / Medium (50–74) /
   Low (<50) `kpiScore` tiers.

### 7.4 Worked example (verifying the Expected Cost formula)

| Issuer | KPI Score | Step-Up (bps) | P(Miss) | Step-Up × P(Miss) | `expectedCost` in data | Match? |
|---|---|---|---|---|---|---|
| Enel | 78 | 25 | 0.35 | 8.75 | 8.75 | ✓ |
| Holcim | 85 | 50 | 0.22 | 11.00 | 11.0 | ✓ |
| Chanel | 55 | 12.5 | 0.58 | 7.25 | 7.25 | ✓ |
| Suzano | 82 | 37.5 | 0.25 | 9.375 | 9.38 | ✓ (rounded) |
| JBS | 42 | 25 | 0.72 | 18.00 | 18.0 | ✓ |
| Novartis | 88 | 50 | 0.18 | 9.00 | 9.0 | ✓ |

All 8 SLBs with a non-zero step-up satisfy `expectedCost = pMiss × stepUpBps` exactly, confirming
this is a genuinely computed (or at minimum internally-consistency-checked) relationship, not
independently drawn numbers as in many other platform modules.

### 7.5 Companion analytics

- **Reference data footer** cites ICMA SLB Principles, Climate Bonds Initiative Transition Criteria,
  OECD Transition Finance Guidance, and the EU Green Bond Standard Regulation as the governing
  frameworks (descriptive citation, not wired into any calculation).

### 7.6 Data provenance & limitations

- The 12 bonds are **hand-curated illustrative examples using real issuer names**, not live market
  data pulled from a bond database (Bloomberg, Refinitiv) or issuer prospectuses — coupon,
  step-up, and KPI-score values should be read as representative, not as current market terms for
  the named issuers.
- `pMiss` (probability of KPI miss) is the module's most consequential unmodelled input: the guide
  frames it as `P(KPI < target)`, which in production would require a time-series or Monte Carlo
  model of the underlying KPI (e.g. emissions intensity) against its trajectory to the target date.
  Here it is a single manually-set number per bond with no visible derivation.
- `planScore` claims a cross-reference to "EP-AL5" (the platform's separate transition-plan module)
  per the guide's `userInteraction` list, but this file contains no live data link — the number is
  hardcoded alongside the rest of the row.
- Only 12 bonds — too small a sample for the "KPI Quality Dimensions" radar averages to be
  statistically meaningful, though the averages are themselves separately hardcoded, not computed
  from the 12-bond sample.

### 7.7 Framework alignment

- **ICMA Sustainability-Linked Bond Principles**: the KPI-selection quality dimensions (Ambition,
  Materiality, external verification) mirror ICMA's five core components (KPI selection, SPT
  calibration, bond characteristics, reporting, verification); the module implements a scoring
  rubric consistent with this structure without citing which SLBP component each dimension maps to.
- **Climate Bonds Initiative Transition Criteria**: relevant to the 4 "Transition"-type bonds
  (Etihad, Repsol, ANA Holdings, Pemex), which by design carry no step-up mechanism — correctly
  reflected by `stepUpBps=0` for all four.
- **Expected cost of non-compliance** (`P(miss) × step-up`) is a standard actuarial/expected-value
  framing correctly applied here, analogous to how rating agencies and investors price step-up risk
  into SLB yield premia.

## 9 · Future Evolution

### 9.1 Evolution A — Model P(miss) from KPI trajectories instead of hand-setting it (analytics ladder: rung 1 → 3)

**What.** This module is unusually honest for its tier: 12 hand-curated real SLBs/transition bonds (Enel, Holcim, Pemex...) with the `expectedCost = pMiss × stepUpBps` identity verified consistent across all 8 step-up bonds (§7.4) — not PRNG noise. The rung-limiting gap per §7.6 is that `pMiss`, "the module's most consequential unmodelled input," is a single manually-set number per bond with no derivation; the guide frames it as `P(KPI < target)`, which needs a KPI trajectory model. And `planScore` claims a cross-reference to the EP-AL5 transition-plan module but is hardcoded (§7.6).

**How.** (1) Derive `pMiss` from a KPI-trajectory model: for each bond's emissions-intensity (or other) KPI, project the issuer's historical run-rate to the SPT target date and compute miss probability via Monte Carlo around the trajectory — the sibling `sustainability-linked-instruments` module's pricing engine consumes exactly this input, so the two connect. (2) Replace the 12 hand-curated bonds with a real feed: SLB terms are disclosed in prospectuses; the Climate Bonds Initiative maintains a labelled-bond database. (3) Make the EP-AL5 cross-reference live: pull `planScore` from the actual transition-plan module rather than duplicating a literal. (4) Compute the 6 `KPI_DIMS` radar averages from per-bond sub-scores instead of separate hardcoded portfolio averages (§7.2).

**Prerequisites.** Issuer KPI history (emissions series) for the trajectory model; a cross-module data contract with EP-AL5. **Acceptance:** `pMiss` moves when an issuer's emissions trajectory changes; `expectedCost` identity still holds; `planScore` matches the EP-AL5 module's live output for the same issuer.

### 9.2 Evolution B — SLB credibility copilot for fixed-income analysts (LLM tier 1)

**What.** A copilot answering "is this SLB's KPI genuinely ambitious or already-achieved greenwashing?" — grounded in the module's KPI-quality dimensions (Ambition, Materiality, External Verification, Science-Based...) and the verified expected-cost economics, explaining why the market prices weak-KPI issuers (Pemex 32 kpiScore) at high miss probability.

**How.** Tier 1 on the module's genuinely-real curated data plus this Atlas record: the `expectedCost = pMiss × stepUpBps` relationship is verifiable arithmetic the copilot can reproduce and explain, and the KPI_DIMS map onto ICMA SLBP's five components (§7.7). The copilot distinguishes SLBs (real step-up mechanics, 8 bonds) from transition bonds (proceeds-based, `stepUpBps=0`, 4 bonds) — a genuine structural distinction it must respect rather than blur. It discloses per §7.6 that bond terms are illustrative representative values, not current market quotes for the named issuers, and that `pMiss` is currently a hand-set estimate (pre-Evolution-A) not a modelled probability. Post-Evolution-A, the copilot cites modelled miss probabilities with their trajectory basis.

**Prerequisites.** None for tier 1; the module has no backend (tier B), so tool-calling awaits Evolution A's endpoints. **Acceptance:** every expected-cost figure reproduces from `pMiss × stepUpBps`; the SLB/transition-bond distinction is never conflated; `pMiss` is labelled hand-set until Evolution A, and the issuer-terms disclaimer appears whenever specific figures are quoted.