# Underwriting ESG
**Module ID:** `underwriting-esg` · **Route:** `/underwriting-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG integration platform for insurance underwriting; scores policy risks against environmental, social and governance criteria to support risk selection, pricing and exclusion policy implementation.

> **Business value:** Insurers globally have withdrawn £1.3 trillion in coal underwriting capacity since 2017; ESG underwriting integration is accelerating as physical climate losses threaten insurability of high-risk sectors.

**How an analyst works this module:**
- Collect ESG data at point of underwriting submission
- Score policy against ESG underwriting criteria and exclusion list
- Apply premium loading or trigger exclusion review for flagged risks
- Aggregate portfolio ESG metrics for management reporting
- Report against ClimateWise Principles and UNEP PSI commitments

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENGAGEMENT_ACTIONS`, `ESG_CRITERIA`, `EXCLUSION_LISTS`, `PIE_COLORS`, `POLICIES`, `POLICY_TYPES`, `REGULATIONS`, `RISK_RATINGS`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EXCLUSION_LISTS` | 9 | `category`, `description`, `threshold`, `affected`, `status` |
| `REGULATIONS` | 9 | `reg`, `jurisdiction`, `status`, `deadline`, `compliance`, `requirements`, `gap` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `policyType` | `POLICY_TYPES[Math.floor(s2*POLICY_TYPES.length)];` |
| `premium` | `Math.round(50+s3*950);` |
| `limit` | `Math.round(premium*2+s4*premium*8);` |
| `eScores` | `ESG_CRITERIA.map((_c,ci)=>Math.round(20+sr(i*13+ci*7)*80));` |
| `esgScore` | `Math.round(eScores.reduce((a,b)=>a+b,0)/eScores.length);` |
| `envScore` | `Math.round((eScores[0]+eScores[1]+eScores[2]+eScores[3])/4);` |
| `socScore` | `Math.round((eScores[4]+eScores[5]+eScores[6]+eScores[10])/4);` |
| `govScore` | `Math.round((eScores[7]+eScores[8]+eScores[9]+eScores[11])/4);` |
| `fossilFuelExposure` | `sector==='Oil & Gas'\|\|sector==='Coal Mining'?+(60+s5*35).toFixed(1):sector==='Power Generation'?+(20+s5*40).toFixed(1):+(s5*15).toFixed(1);` |
| `transitionRisk` | `+(1+s6*9).toFixed(1);` |
| `physicalRisk` | `+(1+s7*9).toFixed(1);` |
| `litigationRisk` | `+(1+s8*9).toFixed(1);` |
| `lossRatio` | `+(0.2+s1*0.6).toFixed(2);` |
| `client` | ``Client-${String(i+1).padStart(3,'0')}`;` |
| `country` | `['US','UK','DE','JP','AU','CA','FR','BR','IN','SG'][Math.floor(s2*10)];` |
| `portfolioStats` | `useMemo(()=>{ const avgESG=POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.esgScore,0)/POLICIES.length):0;` |
| `avgEnv` | `POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.envScore,0)/POLICIES.length):0;` |
| `avgSoc` | `POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.socScore,0)/POLICIES.length):0;` |
| `avgGov` | `POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.govScore,0)/POLICIES.length):0;` |
| `totalPremium` | `POLICIES.reduce((a,b)=>a+b.premium,0);` |
| `totalLimit` | `POLICIES.reduce((a,b)=>a+b.limit,0);` |
| `avgFossil` | `+(POLICIES.length?POLICIES.reduce((a,b)=>a+b.fossilFuelExposure,0)/POLICIES.length:0).toFixed(1);` |
| `sectorESG` | `useMemo(()=>{ return SECTORS.map(s=>{ const policies=POLICIES.filter(p=>p.sector===s);` |
| `recDistribution` | `useMemo(()=>{ const recs=['Accept','Accept w/ Conditions','Refer','Decline'];` |
| `radarData` | `useMemo(()=>{ return ESG_CRITERIA.map((c,i)=>({criteria:c.length>12?c.substring(0,12)+'..':c,portfolio:POLICIES.length?Math.round(POLICIES.reduce((a,b)=>a+b.eScores[i],0)/POLICIES.length):0,benchmark:50+Math.round(sr(i*31)*30)}));` |
| `policyPages` | `Math.ceil(filteredPolicies.length/PAGE_SIZE);` |
| `pagedPolicies` | `filteredPolicies.slice(policyPage*PAGE_SIZE,(policyPage+1)*PAGE_SIZE);` |
| `recColor` | `(r)=>r==='Accept'?T.green:r==='Accept w/ Conditions'?T.sage:r==='Refer'?T.amber:T.red;` |
| `action` | `ENGAGEMENT_ACTIONS[Math.floor(sr(p.id*71)*ENGAGEMENT_ACTIONS.length)];` |
| `count` | `Math.round(3+sr(si*59)*12);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENGAGEMENT_ACTIONS`, `ESG_CRITERIA`, `EXCLUSION_LISTS`, `PIE_COLORS`, `POLICY_TYPES`, `REGULATIONS`, `RISK_RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Policies with ESG Flag | — | Underwriting System | Proportion of policies flagged for ESG review during underwriting; most common flags: coal, deforestation, governance. |
| Coal Exclusion Compliance | — | Exclusion Engine | Proportion of new policies compliant with coal underwriting exclusion threshold (>30% revenue from thermal coal). |
| ESG Premium Loading (Avg) | — | Pricing Engine | Average premium loading applied to policies with ESG risk factors that do not trigger outright exclusion. |
- **Policy Submission Data, ESG Databases, Exclusion Lists, Premium Data** → ESG scoring engine + exclusion checker + loading calculator → **Underwriting ESG reports, exclusion compliance tracker, PSI disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Underwriting Score
**Headline formula:** `EUS = Eₘₐ⸡ × 0.4 + Sₘₐ⸡ × 0.35 + Gₘₐ⸡ × 0.25`

Weighted ESG score applied at policy level during underwriting; below-threshold policies trigger review, exclusion or loading.

**Standards:** ['UNEP PSI ESG in Underwriting 2020', 'ClimateWise Principles']
**Reference documents:** UNEP Principles for Sustainable Insurance (PSI) 2020; ClimateWise Principles on Climate Action in Insurance; Lloyd’s of London ESG Underwriting Requirements 2022; ABI UK Net Zero Underwriting Commitment

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Weighted pillar scoring with enforced exclusion logic (analytics ladder: rung 1 → 2)

**What.** Fix the two documented gaps in the scoring chain, then make the reference
tables operative. §7's mismatch flag shows the code averages all 12 criteria (an
effective 33/33/33 pillar weighting) while the guide states `EUS = E×0.4 + S×0.35 +
G×0.25`; and §7.7 notes the 9-row `EXCLUSION_LISTS` (including the >30%-thermal-coal
threshold) is never algorithmically enforced against the 200-policy portfolio, despite
each policy carrying a genuine sector-conditional `fossilFuelExposure` field. Evolution
A implements the 40/35/25 pillar weighting on the already-computed E/S/G scores,
enforces exclusions as hard gates (a Coal Mining policy with fossilFuelExposure >30%
becomes "Decline — Exclusion" regardless of ESG score), and adds a premium-loading
calculator so the lineage table's advertised "ESG Premium Loading (Avg)" metric is
actually computed rather than implied.

**How.** (1) Move scoring into a small backend `underwriting_esg_engine` (module is
Tier B today, no endpoints) with `POST /score` and `GET /exclusions`. (2) Keep the
sector-aware fossil-exposure logic — §7.6 identifies it as the page's one genuinely
calibrated field — as the exclusion input. (3) Update the guide or code so formula and
implementation agree, retiring the §7 mismatch flag.

**Prerequisites.** Decide the canonical weighting (guide's 40/35/25 vs current equal
weight) with a documented rationale. **Acceptance:** the §7.4 worked example (Env 90 /
Soc 30 / Gov 30) scores 57 not 50; every excluded-sector policy above threshold is
declined irrespective of composite score.

### 9.2 Evolution B — Submission-triage copilot for underwriters (LLM tier 2)

**What.** An underwriting assistant that takes a raw submission (insured name, sector,
policy type, limit, narrative description) and triages it: calls Evolution A's
`POST /score` and `GET /exclusions` as tools, then returns the recommendation tier
(Accept / Accept w/ Conditions / Refer / Decline) with the criterion-level drivers,
which of the 9 exclusion categories were checked, and the applicable regime from the
9-row `REGULATIONS` table (UNEP PSI, ClimateWise, Lloyd's ESG requirements). The
LLM's job is extraction and narration — mapping messy submission text to the 12
`ESG_CRITERIA` inputs — never generating scores itself.

**How.** Tier-2 pattern: tool schemas from the new engine's OpenAPI operations;
system prompt grounded in this Atlas page including §7.2's criteria taxonomy (with the
"Climate Strategy classified under Governance" nuance stated explicitly so the copilot
explains it consistently). Extracted criterion inputs are surfaced for underwriter
confirmation before scoring — human-in-the-loop, since a misread submission would
silently skew the score.

**Prerequisites (hard).** Evolution A's backend endpoints (none exist today); the
mismatch between guide weights and code must be resolved first so the copilot narrates
one consistent formula. **Acceptance:** every score in an answer traces to a
`POST /score` response; a coal-sector submission triggers a cited exclusion check;
asked for a real client's actual ESG data, the copilot discloses the portfolio is
synthetic.