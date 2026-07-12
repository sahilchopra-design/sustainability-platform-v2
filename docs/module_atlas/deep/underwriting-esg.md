## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the ESG Underwriting Score formula as
> `EUS = E×0.4 + S×0.35 + G×0.25` (environmental weighted highest). **The code does not apply these
> weights.** Because each pillar (E/S/G) is built from exactly 4 of the 12 underlying criteria, the
> overall `esgScore` — computed as the unweighted mean of all 12 individual criteria scores — is
> mathematically equivalent to `(Env + Soc + Gov) / 3`, i.e. an **equal 33.3% weight per pillar**,
> not 40/35/25. The sections below document the code as it actually behaves.

### 7.1 What the module computes

200 synthetic insurance policies, each scored on 12 ESG criteria (4 environmental, 4 social — note
one social criterion, "Community Impact," is criteria index 10, out of numerical order — and 4
governance), generating a policy-level recommendation:

```
eScores[k] = round(20 + sr(i×13+k×7)×80)                      // 12 criteria, 20–100 each
esgScore    = round(Σ eScores / 12)                            // = (envScore+socScore+govScore)/3 in effect
envScore    = round((eScores[0..3]) / 4)
socScore    = round((eScores[4,5,6,10]) / 4)
govScore    = round((eScores[7,8,9,11]) / 4)
recommendation = esgScore<30 'Decline' | <45 'Refer' | <60 'Accept w/ Conditions' | else 'Accept'
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `ESG_CRITERIA` (12) | Carbon Intensity, Biodiversity Impact, Water Stress, Waste Management (→ Env); Employee Safety, Labour Rights, Supply Chain Ethics, Community Impact (→ Soc); Board Governance, Anti-Corruption, Climate Strategy, Data Privacy (→ Gov) | Real, standard ESG underwriting criteria consistent with UNEP PSI guidance; "Climate Strategy" is classified as Governance (criterion index 9) rather than Environmental, a defensible but non-obvious taxonomic choice |
| `SECTORS` (12) | Oil & Gas, Coal Mining, Power Generation, Chemicals, Manufacturing, Transportation, Real Estate, Agriculture, Financial Services, Technology, Healthcare, Retail | Real GICS-adjacent sector list |
| `POLICY_TYPES` (12) | Property, Casualty, Marine, Energy, Aviation, D&O, E&O, Cyber, Environmental Liability, Product Liability, Workers Comp, General Liability | Real standard commercial-insurance line-of-business taxonomy |
| `fossilFuelExposure` | Sector-conditional: Oil&Gas/Coal `60+s5×35%`, Power Generation `20+s5×40%`, else `s5×15%` | **Genuine sector-aware calibration**, not a flat random draw — correctly encodes that only carbon-intensive sectors carry material fossil-fuel revenue exposure |
| Recommendation thresholds | Decline <30, Refer <45, Accept w/ Conditions <60, Accept ≥60 | Platform-defined 4-tier underwriting decision scale |

### 7.3 Calculation walkthrough

1. **12-criteria scoring**: each policy draws 12 independent 20–100 scores, one per ESG criterion.
2. **Pillar aggregation**: E/S/G pillar scores are simple 4-item means of their respective criteria
   subsets — genuinely computed, correctly implemented arithmetic.
3. **Overall ESG score — the mismatch**: `esgScore` averages all 12 raw criteria directly rather
   than combining the 3 already-computed pillar scores with the guide's stated 40/35/25 weights.
   Because each pillar happens to comprise exactly 4 of the 12 criteria, this is mathematically
   identical to an *equal* 1/3-1/3-1/3 weighting of E/S/G — the divergence from the guide's
   E-weighted formula is small when pillar scores are similar but can be material when they diverge
   (see §7.4).
4. **Underwriting recommendation**: a 4-tier threshold ladder directly on `esgScore`.
5. **Portfolio aggregation**: `portfolioStats` computes average ESG/Env/Soc/Gov, total premium,
   decline count, average fossil exposure across all 200 policies; `sectorESG` breaks these down by
   sector; `recDistribution` counts policies per recommendation tier.

### 7.4 Worked example (Policy #1, `i=0`)

| Step | Computation | Result |
|---|---|---|
| Sector | `⌊sr(1)×12⌋=11` | **Retail** |
| 12 criteria scores | `round(20+sr(13+k×7)×80)` | 77, 67, 90, 59, 73, 37, 40, 40, 72, 41, 64, 83 |
| Env score | `(77+67+90+59)/4` | **73** |
| Soc score | `(73+37+40+64)/4` | **54** |
| Gov score | `(40+72+41+83)/4` | **59** |
| ESG score (code, equal-weight) | `(73+54+59)/3` | **62** |
| ESG score (guide's stated formula, E×0.4+S×0.35+G×0.25) | `73×0.4+54×0.35+59×0.25` | **62.85** — coincidentally close in this example, but would diverge more for policies with a wider pillar spread |
| Recommendation | `62 ≥ 60` | **Accept** |

A policy with a strong Environmental score but weak Social/Governance scores would receive a
**more lenient** recommendation under the code's equal-weight formula than the guide's E-heavy
40/35/25 formula would imply — e.g. Env=90, Soc=30, Gov=30 gives equal-weight `(90+30+30)/3=50`
("Refer") vs. weighted `90×0.4+30×0.35+30×0.25=57` (still "Refer" in this case, but closer to the
"Accept w/ Conditions" boundary at 60) — the direction of the discrepancy depends on which pillar is
strongest.

### 7.5 Companion analytics

- **Radar chart** — portfolio mean per criterion vs. a synthetic sector benchmark
  (`50+sr(seed)×30`), useful for relative positioning though the benchmark itself is illustrative.
- **Sector ESG breakdown** — mean ESG score per sector across the 200-policy portfolio.
- **Exclusion Lists / Regulations tabs** — static reference tables (9 exclusion categories, 9
  regulatory regimes) providing real-world context (coal exclusion thresholds, UNEP PSI, ClimateWise)
  without being wired into the scoring logic.

### 7.6 Data provenance & limitations

- **All 200 policies are synthetic**, generated by `sr()` — no real underwriting submission data.
- **The headline ESG score formula does not match the guide's stated weighting** — see the mismatch
  flag; a production implementation should either apply genuine 40/35/25 weights to the 3 pillar
  scores directly, or update the guide to describe the equal-weight approach actually implemented.
- Fossil-fuel exposure is the one field with genuine sector-conditional logic (three different
  formulas by sector group), a notable positive relative to most fields on this page, which are flat
  random draws.
- No confidence interval or evidence-quality flag accompanies any of the 12 underlying criteria
  scores.

### 7.7 Framework alignment

- **UNEP Principles for Sustainable Insurance (PSI)**: the 12-criteria ESG underwriting structure
  (carbon intensity, biodiversity, water stress, waste, labour, supply chain, governance,
  anti-corruption) reflects PSI's real integration guidance for underwriting decisions.
- **ClimateWise Principles**: cited as the industry framework for climate-related underwriting
  action; correctly referenced but not independently modelled as a separate scoring dimension.
- **Coal underwriting exclusion policy** (>30% revenue from thermal coal, per many real insurers'
  actual public commitments): the `EXCLUSION_LISTS` reference table's threshold framing is
  consistent with genuine industry exclusion-policy design, though not algorithmically enforced
  against the 200-policy portfolio's sector/fossil-exposure fields.
