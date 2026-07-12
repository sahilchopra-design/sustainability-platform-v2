## 7 · Methodology Deep Dive

### 7.1 What the module computes

The screener (EP-CN4, Sprint CN) generates exactly **100 synthetic carbon credits** — 25 named
projects (Amazon REDD+ Acre, Climeworks DAC, UK Peatland…) plus 75 generic `Credit-N` rows cycling
6 methodologies × 6 regions — and scores each on 5 ICVCM-style Core Carbon Principles:

```js
CCP_PRINCIPLES = ['Additionality','Permanence','Robust Quantification',
                  'No Double Counting','Sustainable Development']   // each scored 2–10
ccpTotal = add + perm + quant + ndc + sd                            // out of 50
quality  = round((add + perm + quant + ndc + sd) × 2)               // out of 100
flags: add<5 → 'Low additionality' · perm<4 → 'Permanence concern'
       leakage>30 → 'High leakage risk' · vintage<2020 → 'Aged vintage'
```

The guide's formula (`QualityScore = avg(...)` on a 1–5 scale) is a loose paraphrase — the code
actually **sums** five sub-scores (varying integer ranges, see §7.2) and doubles the total; there
is no per-criterion 1–5 rubric. Guide and code agree on intent (ICVCM 5-criteria screening + red
flags), so no mismatch blockquote is raised, but the numeric rubric in the guide does not match.

### 7.2 Parameterisation — the deterministic modular generator

Unlike most modules (which use the `sr()` sine PRNG), this page uses **modular arithmetic** on
`s = (id×7 + 13) mod 100`:

| Field | Formula | Range | Note |
|---|---|---|---|
| Additionality `add` | `3 + (s mod 8)` | 3–10 | |
| Permanence `perm` | `2 + ((s×3) mod 9)` | 2–10 | |
| Quantification `quant` | `3 + ((s×5) mod 8)` | 3–10 | |
| No double counting `ndc` | `4 + ((s×2) mod 7)` | 4–10 | narrowest range |
| Sustainable dev `sd` | `2 + ((s×4) mod 9)` | 2–10 | |
| Leakage % | `((s×6) mod 40) + 5` | 5–44% | |
| SDG count | `1 + (s mod 6)` | 1–6 | |

All values are synthetic demo data; no constant carries a cited source. Because `s` is periodic in
`id` with period 100, the 100 credits exhaust all residues — every `s ∈ {0…99}` appears exactly
once, giving a uniform quality distribution by construction.

Red-flag thresholds (add<5, perm<4, leakage>30%, vintage<2020) are stated in the in-page
"Red Flag Methodology" note, which attributes them to the "ICVCM Core Carbon Principles assessment
framework" — the *categories* are ICVCM-aligned but these numeric cut-offs are the module's own.

### 7.3 Calculation walkthrough

1. **Quality Screener tab** — filters `quality ≥ minQuality` slider (default 50) and methodology,
   sorts (quality desc / leakage asc / name), truncates to top 30. Header KPIs: total credits (100),
   flagged count, `avgQuality = round(Σ quality / 100)`. `methodDist` computes count and mean
   quality per methodology for the bar chart.
   *Note:* the sort at line 64 mutates the filtered copy (safe — `d` is a fresh array), but the
   tab-2/3/4 charts call `.sort()` directly on `CREDITS.slice(0,25)` — also safe since `slice`
   copies.
2. **ICVCM CCP Alignment tab** — radar of the selected credit's 5 sub-scores against max 10;
   traffic-light on `ccpTotal`: ≥35 green, ≥25 amber, else red; histogram buckets ccpTotal into
   0–15 / 15–25 / 25–35 / 35–50.
3. **Additionality / Leakage / Co-Benefit tabs** — single-dimension bars over the first 25 credits
   with colour thresholds (additionality ≥7 green, ≥4 amber; leakage >25% red, >15% amber) and a
   quality-vs-SDG scatter over the first 50.
4. **Red Flag Detector tab** — lists up to 20 flagged credits with pill badges per flag.

### 7.4 Worked example — credit #1, "Amazon REDD+ Acre" (id=1, vintage 2023)

`s = (1×7 + 13) mod 100 = 20`:

| Step | Computation | Result |
|---|---|---|
| add | 3 + (20 mod 8) = 3 + 4 | **7** |
| perm | 2 + (60 mod 9) = 2 + 6 | **8** |
| quant | 3 + (100 mod 8) = 3 + 4 | **7** |
| ndc | 4 + (40 mod 7) = 4 + 5 | **9** |
| sd | 2 + (80 mod 9) = 2 + 8 | **10** |
| ccpTotal | 7+8+7+9+10 | **41 / 50** (green, ≥35) |
| quality | 41 × 2 | **82 / 100** (green, ≥70) |
| leakage | (120 mod 40) + 5 = 0 + 5 | **5%** (green) |
| sdgCount | 1 + (20 mod 6) | **3** |
| flags | none triggered (7≥5, 8≥4, 5≤30, 2023≥2020) | **Clear** |

### 7.5 Data provenance & limitations

- **All 100 credits are synthetic.** No registry lookup (Verra/Gold Standard/ACR/CAR despite the
  guide's "Registry data" claim), no real project attributes; the 25 named projects borrow
  real-world names (Climeworks, Carbon Engineering, Project Vesta) but their scores are generated.
- The generator is modular-arithmetic, not the platform-standard `sr()` PRNG — scores correlate
  deterministically across dimensions (all derive from one residue `s`), so sub-scores are not
  independent draws.
- Export CSV/PDF buttons are `alert()` stubs; the watchlist state is declared but unused.
- Leakage is generated independently of methodology — real leakage risk is methodology-specific
  (REDD+ market/activity-shifting leakage vs near-zero for DAC), which this data does not reflect.
- The ICVCM lens is simplified to 5 principles of the 10 CCPs; program-level principles
  (governance, registry tracking, transparency, safeguards) are omitted.

**Framework alignment:**
- **ICVCM Core Carbon Principles** — the real ICVCM framework contains 10 CCPs assessed as a
  *binary label*: the Integrity Council approves carbon-crediting *programs* (governance, tracking,
  transparency, safeguards principles) and *methodology categories* (additionality, permanence,
  robust quantification, no double counting via program rules). There is no official 0–50 or 0–100
  score; the module's summed rubric is an internal screening convenience layered on ICVCM
  vocabulary.
- **Verra VCS / Gold Standard** — referenced by the guide as sources; both operate buffer pools
  and methodology-specific leakage deductions that a production screener would read from registry
  records rather than generate.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Procurement-grade screening of candidate carbon credits: rank a long-list (100s–1000s of projects
across Verra, Gold Standard, ACR, CAR, Puro) into buy / enhanced-DD / avoid tiers, with per-project
over-crediting risk and red flags evidenced from registry documents. Decision supported: inclusion
in a corporate offset portfolio or trading book.

### 8.2 Conceptual approach

Criteria-based expected-value screening mirroring **BeZero Carbon Ratings** (probability-weighted
over-crediting risk factors aggregated to a 7-notch letter rating) and **Sylvera** (methodology-
category-specific scoring frameworks with carbon-accounting deep dives), gated by the **ICVCM CCP
label** (program + methodology-category approval lists) as a hard eligibility filter — the gate
structure ICVCM itself uses. Screening (this module) deliberately stops short of full rating:
it triages using registry-observable evidence only, so it can run automatically over the universe.

### 8.3 Mathematical specification

**Gate 0 — eligibility:** exclude if program ∉ ICVCM-approved list, or methodology version
deprecated by registry, or vintage age > V_max (default 5 yr for nature-based, 8 yr engineered —
market-liquidity convention from Ecosystem Marketplace transaction stratification).

**Screening score.** For project p, sub-scores `x_k ∈ [0,1]`:

```
x_add   = 1 − P(non-additional)         (logit model, features below)
x_perm  = (1−λ_r)^{20} + min(B_p, 0.25) (20-yr reversal survival + buffer credit, capped)
x_leak  = 1 − L_p                        (L_p = methodology-prescribed leakage deduction rate)
x_mrv   = audit recency & verifier accreditation index (0/0.5/1 rubric)
x_dc    = 1 if serialised + no corresponding-adjustment conflict, else 0.5
S_p     = 100 × Π_k x_k^{w_k},  w = (0.35, 0.25, 0.15, 0.15, 0.10)
```

Weights follow the empirical importance ordering in published carbon-ratings distributions
(additionality and permanence dominate downgrades at BeZero/Sylvera); multiplicative form ensures
a fatal flaw caps the score.

**Additionality logit features:** methodology category (REDD+ AUD baseline vintage, renewables in
grid-parity countries → high risk per CDM/Verra literature), project IRR proxy, policy-surplus
test flag, baseline revision history.

| Parameter | Value / source |
|---|---|
| λ_r reversal hazard | 0.2–0.6%/yr by biome; Verra AFOLU non-permanence risk tool ratings; EM-DAT wildfire records |
| B_p buffer ratio | project buffer contribution ÷ issuance, Verra registry (already ingested in platform `reference_data`) |
| L_p leakage rates | methodology documents (e.g. VM0007/VM0048 REDD+ leakage modules; GS cookstove fNRB defaults) |
| Renewables grid-parity list | IEA WEO country LCOE vs wholesale price |
| Tier cut-offs | S ≥ 70 buy-eligible; 45–70 enhanced DD; < 45 avoid (calibrated to match vendor investable-grade share ≈ top ⅓) |

### 8.4 Data requirements

- Registry exports: project metadata, methodology ID/version, issuance, buffer, verification
  reports (Verra & Gold Standard public APIs — Verra already in platform reference layer).
- ICVCM approved program/category lists; CORSIA eligibility (ICAO) — free.
- Methodology leakage/default parameters — registry methodology PDFs (one-time curation).
- Optional vendor: BeZero/Sylvera/Calyx ratings for benchmarking; CBL price data for tier pricing.

### 8.5 Validation & benchmarking plan

- Rank-correlation vs vendor ratings on overlap set (target Spearman ρ ≥ 0.65 for a
  registry-data-only screener); misclassification analysis at the buy/avoid boundary.
- Retrospective red-team: the screener must flag documented over-crediting cases (published REDD+
  baseline studies; CDM renewables additionality critiques) — hit-rate report.
- Stability: month-over-month tier migration < 10% absent new registry events.
- Sensitivity: ±0.1 on each w_k; document tier-boundary flips.

### 8.6 Limitations & model risk

- Registry-observable evidence cannot detect baseline gaming that requires satellite/counterfactual
  analysis — screener output is a triage, not a rating; enhanced-DD tier must route to human or
  vendor review.
- Leakage defaults understate cross-border market leakage for large REDD+ programs.
- Logit additionality model trained on historical downgrades inherits vendor labelling bias;
  refresh annually and hold out newest methodology versions.
- Conservative fallback: unmapped methodology → automatic enhanced-DD tier.
