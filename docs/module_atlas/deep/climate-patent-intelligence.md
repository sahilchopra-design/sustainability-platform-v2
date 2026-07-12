## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-DF6) states the innovation
> index is `Σ[Citations_i × TRL_weight_i × MarketSize_i]` and a tech-diffusion metric
> `ΔPatentGrantRate / ΔCO2AbatementDeployment`. **The code implements neither.** The actual
> `innovScore` is a fixed weighted blend of citation index, forward citations, R&D-intensity and
> collaboration (no TRL weight, no market size); there is no diffusion-vs-abatement metric. All 60
> entities, their patent counts, citations and R&D are `sr()`-seeded synthetic data — the WIPO/EPO
> databases named in the guide are not connected (`engines: []`, `route_files: []`). The domain
> growth-rate table is realistic and drives the one genuinely-structured output (the time series).

### 7.1 What the module computes

60 synthetic entities are generated once. Per entity `i`:

```js
totalPatents  = round(50 + sr(i*17)*2950);              // 50–3000
grantsPerYr   = round(totalPatents * (0.08 + sr(i*19)*0.15));
citationIdx   = round(50 + sr(i*23)*200);               // vs sector avg 100
familySize    = round(2 + sr(i*29)*18);                 // countries/family
fwdCitations  = round(10 + sr(i*31)*290);
rdSpendPct    = round(3 + sr(i*37)*25);                 // % revenue
rdSpendAbsMn  = round(10 + sr(i*41)*990);               // $M
collabIdx     = round(20 + sr(i*43)*75);                // 0–100
commercialTrl = round(4 + sr(i*47)*5);                  // TRL 4–9

patentCliff = grantsPerYr < totalPatents*0.06 && totalPatents > 500;
innovScore  = round( (citationIdx/2 + fwdCitations/3 + rdSpendPct*2 + collabIdx*0.3) / 4 );
```

Geographic filing shares (`geoUs…geoWo`) are seeded and forced to sum to 100 via
`woShare = max(0, 100 − us − cn − ep − jp)`.

### 7.2 Parameterisation & provenance

| Constant | Value | Provenance |
|---|---|---|
| `DOMAIN_GROWTH` CAGR | RE 8, BESS 28, CC 35, EV 42, SG 18, H2 55, AI 38, CE 12 (%) | Authored, but directionally faithful to observed cleantech patent CAGRs (H2/EV highest) |
| innovScore weights | citation `÷2`, fwd `÷3`, R&D% `×2`, collab `×0.3`, all `÷4` | Hard-coded heuristic — no source, no normalisation to 0–100 |
| investment signal | `cagr×0.5 + avgCitation×0.2 + (avgRd/50)×0.3` | Hard-coded heuristic |
| patent-cliff rule | grants `< 6%` of stock **and** stock `> 500` | Authored proxy for an ageing, slow-refresh portfolio |
| TIME_SERIES base | `1000 + floor(sr(idx·100)·5000)` | Seeded per-domain start level |
| radar matrix | fixed 6×5 integer grid | Hard-coded illustrative values (RE/BESS/CC/EV/H2 only) |

PRNG: `sr(s) = frac(sin(s+1) × 10⁴)`.

### 7.3 Calculation walkthrough

1. Filters (`domain`, `type`, `geo`) subset the 60 entities → `filtered`.
2. **Totals** sum `totalPatents`, `grantsPerYr`, `rdSpendAbsMn` and average `citationIdx`,
   `innovScore`, `familySize`; `patentCliffRisk` counts flagged entities.
3. **Domain rows** aggregate per technology domain and attach the domain CAGR.
4. **Patent trend** builds a 2019→2024 grants series per domain as
   `grants(year i) = base × (1 + cagr)^i` — the one compounding, non-flat output.
5. **Investment signals** collapse each domain to a single score (growth-weighted, §7.4).

### 7.4 Worked example — innovation score & investment signal

**Entity innovScore.** Take `citationIdx = 150`, `fwdCitations = 180`, `rdSpendPct = 15`,
`collabIdx = 60`:

```
innovScore = round( (150/2 + 180/3 + 15·2 + 60·0.3) / 4 )
           = round( (75 + 60 + 30 + 18) / 4 )
           = round( 183 / 4 ) = round(45.75) = 46
```

**Domain trend.** Renewable Energy start level `base = 1000 + floor(sr(0)·5000)`. With
`sr(0)=frac(sin(1)·10⁴)=frac(8414.7)=0.4675` → `base = 1000 + floor(2337.5) = 3337`.
2024 grants `= 3337 × 1.08⁵ = 3337 × 1.4693 = 4,903`.

**Investment signal (H2).** With domain `cagr = 55`, `avgCitation ≈ 140`, `avgRd ≈ 500`:

```
signal = round( 55·0.5 + 140·0.2 + (500/50)·0.3 )
       = round( 27.5 + 28 + 3 ) = round(58.5) = 59
```

Because `cagr×0.5` dominates, the signal ranking essentially reproduces the hard-coded
`DOMAIN_GROWTH` order (H2 > EV > AI > CC …) — the citation and R&D terms only perturb it slightly.

### 7.5 Data provenance & limitations

- **All entity-level patent, citation, R&D and geography data are synthetic**, from
  `sr(s)=frac(sin(s+1)×10⁴)`. Entities are anonymised placeholders (`RE-Entity-001`), not real
  assignees — so the "competitive intelligence" and "top 20" tables rank noise.
- **`innovScore` is unbounded and unnormalised** despite the "Composite 0–100" KPI label: with
  max inputs it can exceed 100 (`250/2 + 300/3 + 28·2 + 95·0.3 ≈ 79`, but the guide's 0–100 claim
  is not enforced).
- **The only structurally-real signal is the CAGR-driven time series** — its *shape* (H2/EV/CC
  growing fastest) matches public patent-trend literature, though the absolute counts are seeded.
- No IPC/CPC codes, no citation network, no TRL-weighted or market-size-weighted index as the
  guide's formula requires.

**Framework alignment:** *WIPO Green / IPC-Y02* — the guide anchors climate patents to WIPO's
Y02 classification (climate-change-mitigation technologies), assessed by IPC/CPC code; the code
uses free-text domain labels instead. *EPO Y02/Y04S* — cited for CCMT patent counts; not queried.
*IEA Energy Technology Patents* — source of the "8–15 year patent-to-deployment lag" narrative,
which motivates using grant-rate as a leading indicator (the compounding time series is the
module's nod to this). *IPCC AR6 WGIII Ch.16* — innovation/technology-transfer framing only.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module presents an innovation
index, patent-cliff risk flags, and per-domain investment signals that inform cleantech
due-diligence and thematic allocation — all currently `sr()`-seeded heuristics. A production build
needs a real bibliometric engine over patent data.

**8.1 Purpose & scope.** Rank assignees and technology domains on IP strength and momentum, flag
portfolios facing patent expiry cliffs, and generate forward-looking technology-deployment
signals for cleantech equity/venture screening and national-competitiveness monitoring.

**8.2 Conceptual approach.** Bibliometric patent-value modelling benchmarked to industry
practice: (i) **citation-and-family-weighted patent value** in the lineage of the
**OECD Patent Quality indicators** (forward citations, family size, generality/originality) and
**PatentSight/LexisNexis "Patent Asset Index"**; (ii) **technology-diffusion nowcasting** linking
grant momentum to deployment, mirroring **IEA/EPO joint CCMT patent studies**. Domain scoring uses
a normalised principal-metric composite rather than an ad-hoc sum.

**8.3 Mathematical specification.**
```
Patent value:     V_p = fwd_cit_p · f_age(t) · g_family(size_p) · h_generality(p)
Assignee index:   PAI_a = Σ_{p∈a} V_p                                   (Patent Asset Index style)
Quality (0–100):  Q_a = 100 · Φ( z(citation) ·w1 + z(family)·w2 + z(generality)·w3 )
Diffusion signal: D_d = Δln(grants_d)/Δt   ·   corr(grants_d,  deployment_d, lag)
Cliff risk:       CR_a = Σ_p 1{expiry_p ∈ [t, t+3y]} · revenue_share_p
Invest signal:    IS_d = β1·CAGR_d + β2·Q̄_d + β3·D_d                    (β from validation)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Forward-citation age curve | `f_age` | OECD citation-lag distributions |
| Family-size weight | `g_family` | OECD Patent Quality (INPADOC family) |
| Generality/originality | `h_generality` | Hall-Jaffe-Trajtenberg (NBER) |
| Standardisation weights | `w1..w3` | PCA on OECD quality panel |
| Deployment series | `deployment_d` | IEA WEO/ETP capacity by technology |
| Expiry dates | `expiry_p` | 20-yr statutory term from filing (EPO/USPTO register) |

**8.4 Data requirements.** Patent-level: assignee (harmonised), IPC/CPC (Y02 subclasses),
filing/grant/expiry dates, forward/backward citations, INPADOC family. Sources: **PATSTAT** (EPO,
licensed), **Google Patents Public Data / BigQuery** (free), **WIPO Green** (free). Deployment:
IEA capacity data. Assignee↔ticker map to link to `GLOBAL_COMPANY_MASTER`. None of this is
currently ingested.

**8.5 Validation & benchmarking.** Reconcile assignee `PAI` against LexisNexis Patent Asset Index
rankings for a sample of listed cleantech firms (rank correlation target ρ > 0.7). Back-test the
diffusion signal: does grant-rate momentum lead deployment by the IEA-observed 8–15 yr lag?
Validate cliff flags against known expiry events and observed revenue erosion. Sensitivity on
citation-window truncation.

**8.6 Limitations & model risk.** Citation counts are truncated for recent patents (right-censoring);
assignee harmonisation is error-prone (subsidiaries, M&A); patent count ≠ patent value; the
patent-to-deployment lag varies widely by technology, so diffusion signals carry long horizons and
wide error. Conservative fallback: report quality *deciles* and flag data-incomplete assignees
rather than emitting a single unbounded score.
