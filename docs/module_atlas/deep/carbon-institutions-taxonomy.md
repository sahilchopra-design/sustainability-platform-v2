## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *registry/methodology
> taxonomy* with a multiplicative `quality_score = registry_rigour_weight × methodology_permanence
> × additionality_score` and BeZero/Sylvera/Calyx tier standardisation. **That formula and the
> multi-rater standardisation do not exist in code.** What the page actually implements is a
> 20-tab **carbon-institutions intelligence hub**: 30 real-name issuers scored on CDP grade, SBTi
> tier, VCMI tier, Article 6 participation and an `icvcm` field; a 25-project VCM book with a
> five-factor *additive* quality score whose sub-scores are `sr()`-seeded; ICVCM CCP compliance
> radar; VCMI claims volumes; Article 6.2 pilot ITMO flows; ICROA-endorsed standards; a MACC
> table; offtake terms; and a composite issuer-credibility score. Sections below document the
> code as written.

### 7.1 What the module computes

**(a) VCM project quality score** (per project, 0–100), five sub-scores each drawn from seeded
ranges conditioned on real categorical attributes, then combined additively:

```
h         = hashStr(project.id)                    // djb2-XOR hash → PRNG seed
addScore  = ccpLabel ? 70 + sr(h)·25   : 30 + sr(h)·35
permScore = {DAC,CCS,Biochar,EW} ? 90 + sr(h+1)·8
            : {REDD+,IFM,ARR}    ? 50 + sr(h+1)·20
            : otherwise            70 + sr(h+1)·15
mrv       = icroa ? 75 + sr(h+2)·20 : 40 + sr(h+2)·25
cob       = ccpLabel ? 72 + sr(h+3)·22 : 45 + sr(h+3)·25          // co-benefits
sdg       = {CCB,GS,Plan Vivo} ? 80 + sr(h+4)·15 : 50 + sr(h+4)·25
overall   = 0.25·addScore + 0.20·permScore + 0.20·mrv + 0.20·cob + 0.15·sdg
```

**(b) Issuer composite credibility** (per issuer, 0–100), deterministic mapping of categorical
labels to weights, then a weighted sum:

```
cdpW  = A:95 A-:85 B:72 B-:62 C:50 C-:40 D:28 else:10
sbtiW = 1.5C-Val:95  WB2C-Val:78  Committed:55  None:15
vcmiW = Platinum:95  Gold:85  Silver:70  Bronze:50  None:20
art6W = art6 ? 80 : 40
composite = 0.25·cdpW + 0.30·sbtiW + 0.15·vcmiW + 0.10·art6W + 0.20·icvcm
```

**(c) Derived aggregates:** CDP grade distribution; Scope-3 disclosure and reasonable-assurance
percentages (`avgDisc`, `avgVerif` — share of issuers with flags set); SBTi target seeds
(`baseY = 2018 + ⌊sr(i)·3⌋`, `tgtY = 2030 + ⌊sr(i+5)·10⌋`, reduction 46–56% for 1.5C-validated,
30–38% WB2C, 25–33% Committed — the 46% floor mirrors SBTi's 1.5 °C 2030 ambition); CDP score
trajectories (`trend = 0.45 + 0.45·icvcm/100 + 0.03·j·base + sr(hash+j)·0.08 − 0.04`); portfolio
exposure `exposureDollars = holdings × mcap/1000 × 0.05`.

### 7.2 Parameterisation & provenance

| Element | Values | Provenance |
|---|---|---|
| Quality weights 0.25/0.20/0.20/0.20/0.15 | additionality/permanence/MRV/co-benefits/SDG | Synthetic demo weights (no rating agency publishes these) |
| Permanence tiering by type | Engineered 90–98 > mixed 70–85 > NbS 50–70 | Directionally per ICVCM/Oxford Principles durability hierarchy; ranges synthetic |
| Composite weights 0.25/0.30/0.15/0.10/0.20 | CDP/SBTi/VCMI/Art6/ICVCM | Synthetic demo weights |
| `ISSUERS` 30 rows | MSFT CDP A · 1.5C-Val · VCMI Gold · icvcm 95, etc. | Real company names; grades plausible vs public CDP/SBTi lists but hand-entered; `icvcm` per-issuer score is a fiction (ICVCM labels credits/methodologies, not issuers) |
| `ICVCM_CCPS` 10 rows with `compliance` | 10 Core Carbon Principles | Real CCP names; compliance %s synthetic |
| `VCM_PROJECTS` 25 rows | standard, vintage, volume, price, ccp/corsia/icroa flags | Synthetic book with realistic attributes |
| `ARTICLE6_PILOTS` 12 rows | host, buyer, ITMOs, corresponding adjustment flag | Modeled on real 6.2 deals (e.g. Switzerland–Ghana style); values illustrative |

### 7.3 Calculation walkthrough

Filters (type/region/standard) subset `VCM_PROJECTS` → `filteredQuality` recomputes the mean
`overall` and a rating histogram (`AAA…C` from the seeded `rating` field, not from `overall` —
the two are independent, a notable internal inconsistency). The bridge tab sums compliance vs
voluntary flow volumes; the ICVCM tab renders the CCP radar from static `compliance` values; the
credibility tab ranks issuers by `composite` and decomposes the five weighted pillars per issuer.

### 7.4 Worked example (issuer composite — Microsoft seed row)

`cdp:'A', sbti:'1.5C-Val', vcmi:'Gold', art6:true, icvcm:95`:

| Pillar | Mapped score | Weight | Contribution |
|---|---|---|---|
| CDP | 95 | 0.25 | 23.75 |
| SBTi | 95 | 0.30 | 28.50 |
| VCMI | 85 | 0.15 | 12.75 |
| Article 6 | 80 | 0.10 | 8.00 |
| ICVCM | 95 | 0.20 | 19.00 |
| **Composite** | | | **92.0 / 100** |

### 7.5 Data provenance & limitations

- Every continuous sub-score uses the platform PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` seeded by
  `hashStr` of real tickers/IDs — stable across renders, **not real assessments**. Categorical
  anchors (CDP grades, SBTi tiers) are hand-entered but resemble public registries.
- The quality `overall` and the displayed letter `rating` are decoupled; price/volume scatter
  bubbles size on the letter rating.
- Per-issuer "ICVCM score" misapplies the framework (ICVCM assesses *programs* and *methodology
  categories* for the CCP label; it does not score corporates).
- No backend calls; the mapped `/api/v1/carbon/*` routes are unused.

**Framework alignment:** ICVCM Core Carbon Principles — 10 principles in three pillars
(Governance / Emission Impact / Sustainable Development); in reality a program gets CCP-Eligible
status and methodology categories get CCP-Approved via multi-stakeholder assessment — the module
renders the 10 names with synthetic compliance % · VCMI Claims Code of Practice — Silver/Gold/
Platinum claims tied to % of remaining emissions covered by CCP-labelled credits after meeting
foundational criteria; code maps tiers to fixed 20–95 weights · CDP A–D− grading (real scheme;
mapping to 10–95 is the module's own) · SBTi validation tiers (real; 46% floor ≈ SBTi 1.5 °C
2030 pathway) · Paris Agreement Art. 6.2 ITMOs & corresponding adjustments (pilot table) ·
ICROA Code of Best Practice (endorsement flags).

## 8 · Model Specification — VCM Credit Quality Rating Engine

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Replace `sr()`-seeded sub-scores with an evidence-based project quality
rating usable for procurement screening and portfolio integrity KPIs, covering avoidance and
removal credits across major registries.

**8.2 Conceptual approach.** Reduced-form replication of commercial VCM rating methodologies:
BeZero Carbon Rating (likelihood a credit = 1 tCO₂e) and Sylvera's factor framework (carbon
accounting / additionality / permanence / co-benefits), calibrated on public registry data —
the same evidence base Calyx Global uses. Structured as a weighted factor model with explicit,
documented sub-indicators instead of random draws.

**8.3 Mathematical specification.**

```
Additionality A = 100·w_f·1{IRR_no-credit < hurdle} + 100·w_r·1{beyond regulation} + 100·w_c·(1 − penetration_sector)
                  (w_f,w_r,w_c = 0.5,0.3,0.2)
Permanence P    = 100 · exp(−λ_type · 100yr / D_type) · (1 + buffer%/b*)⁻¹ adj.
                  D_type: geological 10,000y, biochar 500y, ARR 100y, soil 50y (IPCC AR6 WG3 Ch.12)
Over-crediting O= 100 · min(1, baseline_conservativeness × (1 − leakage_rate))
MRV M           = rubric(monitoring frequency, direct measurement share, VVB accreditation)
Quality Q       = 0.30·A + 0.25·P + 0.25·O + 0.20·M ;  map Q→{AAA≥85, AA≥75, A≥65, BBB≥55, BB≥45, B≥35, C<35}
Price link      : expected premium = β·(Q − Q̄), β estimated from CCP-labelled vs unlabelled spreads
```

| Parameter | Calibration source |
|---|---|
| Buffer defaults b* by type | Verra VCS AFOLU non-permanence risk tool (10–40%, public) |
| Durability D_type, reversal λ | IPCC AR6 WG3 Ch.12; Verra/Puro registry documentation |
| Leakage & baseline priors | Published meta-analyses (e.g. West et al. 2023 REDD+ over-crediting; Guizar-Coutiño 2022) |
| Sector penetration (common practice) | CDM methodological tool 24 thresholds |
| Registry project data | Verra registry export (already ingested — Verra table in platform `reference_data`), Gold Standard registry CSV |

**8.4 Data requirements.** Project PDD attributes (methodology, vintage, buffer %, VVB),
issuance/retirement history, credit prices (Ecosystem Marketplace seed data already in the
platform's 37 seed files). Existing engine `carbon_credit_quality_engine.py` is the natural
backend home.

**8.5 Validation & benchmarking.** Rank-correlate Q against published BeZero/Sylvera grades for
overlapping projects (target Spearman ρ ≥ 0.6); confusion matrix vs CCP-label decisions;
sensitivity: ±20% on leakage priors must not shift >1 rating notch for >10% of book.

**8.6 Limitations & model risk.** Public registry data lack the site-level evidence raters use —
scores are coarser; additionality is fundamentally counterfactual (irreducible uncertainty —
publish confidence tiers); price-premium β is regime-dependent post-2023 integrity repricing.
Fallback: floor unrated/insufficient-evidence projects at "B" and exclude from high-integrity
portfolio KPIs.
