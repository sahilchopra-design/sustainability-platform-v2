## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide advertises an `ILO 5-pillar weighted score =
> 0.25·SocialDialogue + 0.20·Rights + 0.30·Employment + 0.15·SocialProtection + 0.10·Development`.
> The page **defines those five pillars and weights** (`ILO_PILLARS`) and displays them, but the
> per-region pillar scores it renders are **not computed from any regional data** — they are seeded
> PRNG draws (`sr()`), and the "overall" is their unweighted mean (not the guide's weighted formula).
> The page itself labels this panel *"Illustrative / Demo scores — not authoritative ILO assessment
> data"*. The regional jobs/wage/financing-gap figures are a hard-coded `REGIONS` table with **real
> ILO labour indicators stamped on** from `data/laborIndicators`. Sections below document what runs.

### 7.1 What the module computes

Three genuinely code-derived quantities per selected region, plus PRNG pillar scores.

**Real arithmetic over the `REGIONS` table (10 rows, hard-coded):**
```js
netJobs   = green_jobs − fossil_jobs        // e.g. Appalachia: 18000 − 42000 = −24000
wageGap   = wage_green − wage_fossil         // Appalachia: 58000 − 72000 = −14000
jtfGap    = jtf_need − jtf_avail             // Appalachia: 4200 − 1800 = 2400 ($M)
totalFossil = Σ fossil_jobs                  // header KPI "Fossil Jobs at Risk"
totalGreen  = Σ green_jobs
totalJtfGap = Σ (jtf_need − jtf_avail)       // header "JTF Financing Gap" ($B)
gapPct(reg) = reg.jtf_need>0 ? (need−avail)/need·100 : 0
```

**ILO labour overlay** — each region is matched by ISO2→country name to `ILO_LABOR_INDICATORS`
(ILOSTAT 2022) and stamped with `informalPct`, `youthUnemploymentPct`, `unionDensity`,
`womenInMgmtPct`, `minWage` (nullish-coalesced so real data wins).

**Pillar scores (demo)** — for the first 5 regions:
```js
score = round(40 + sr(i·15 + pillarIdx)·30 + sr(i·37 + pillarIdx·21)·15)   // 40–85 band
overall = round(Σ score / 5)                                                // UNWEIGHTED mean
```
Note the divergence from the guide: `overall` is a plain mean of 5 pillar scores, ignoring the
0.25/0.20/0.30/0.15/0.10 weights that `ILO_PILLARS` actually carries.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `REGIONS` (10) | Appalachia, Ruhr, Silesia, Mpumalanga, Alberta, Sabine Pass, Kemerovo, Rheinland, Jharkhand, La Guajira | Real regions; jobs/wage/reskill/vuln/jtf figures **hard-coded demo** (plausible magnitudes) |
| ILO pillar weights | 25 / 20 / 30 / 15 / 10 | ILO *Guidelines for a Just Transition* (2015) — 5 policy areas |
| `vuln` (region) | 45–98 | Hard-coded vulnerability index; drives red/amber/green |
| `GREEN_SECTORS` (8) | Solar PV 1.8k→4.2k jobs, Green H₂ 0.38k→1.6k, wage premium −12%…+18% | Hard-coded 2030/2040 pipeline; IRENA/ILO magnitudes |
| ILO labour overlay | informal %, youth unemployment %, union density, women-in-mgmt %, min wage | **Real** — ILOSTAT 2022 via `data/laborIndicators` |
| Pillar scores | `sr()`-seeded 40–85 | **Synthetic**, explicitly labelled demo in the UI |

### 7.3 Calculation walkthrough

1. `REGIONS` array literal loaded; `forEach` stamps ILO labour data onto each row.
2. User selects a region → `netJobs`, `wageGap`, `jtfGap` computed for it.
3. Header KPIs sum across all 10 regions (`totalFossil`, `totalGreen`, `totalJtfGap`).
4. Vulnerability Matrix ranks by `vuln`; Financing Gap tab charts `jtf_need` vs `jtf_avail` and
   `gapPct`; ILO JTF Alignment tab renders the 5 PRNG pillar bars + unweighted `overall`.
5. Green Job Sectors tab renders the fixed 8-sector 2030/2040 bar + cards.

### 7.4 Worked example (Silesia, Poland)

From the table: `fossil_jobs=85000, green_jobs=12000, wage_fossil=38000, wage_green=32000,
jtf_need=8500, jtf_avail=1200, vuln=91`.

| Metric | Formula | Value |
|---|---|---|
| Net jobs | 12000 − 85000 | **−73,000** (severe net loss) |
| Wage gap | 32000 − 38000 | **−$6,000** (green pays 16% less) |
| JTF gap | 8500 − 1200 | **$7,300M** |
| gapPct | (8500−1200)/8500·100 | **85.9%** unfunded |

Silesia's 85.9% financing gap and `vuln=91` place it in the red tier — consistent with its real-world
status as Europe's most exposed coal-mining region.

### 7.5 Companion analytics

- **Vulnerability Matrix** — regions ranked by `vuln`, cross-tabbed with fossil-job dependency.
- **Financing Gap** — `jtf_need`/`jtf_avail`/`gapPct` bar per region; header `totalJtfGap` (≈$77B
  across the 10 rows) echoes the guide's "$124B/yr global gap" (a different, larger UNEP figure).
- **Green Job Sectors** — 2030 vs 2040 pipeline with wage premium and reskilling months.

### 7.6 Data provenance & limitations

- **`REGIONS` jobs/wage/JTF figures are synthetic demo data** (hard-coded, not PRNG but unsourced);
  the **ILO labour overlay is real** (ILOSTAT 2022).
- **Pillar alignment scores are `sr()`-seeded and self-labelled non-authoritative.** They do not use
  the guide's weighted formula (they use an unweighted mean), nor do they read any regional input.
- The backend `JustTransitionEngine.assess_ilo_principles` *does* implement the true weighted ILO
  composite (0.25/0.25/0.20/0.15/0.15 across its five principles — note the engine's split differs
  from the page's 25/20/30/15/10), but the page never calls it.

**Framework alignment:** ILO *Guidelines for a Just Transition towards environmentally sustainable
economies* (2015) — the five pillars/weights shown mirror the ILO's five policy areas; the ILO
derives no single numeric "score" itself, so any composite here is an analyst construct. Paris
Agreement Art. 4 (just transition of the workforce) — motivates the framing. IRENA *Renewable Energy
and Jobs* — magnitudes behind `GREEN_SECTORS`.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The page renders `sr()`-seeded pillar
scores and hard-coded regional figures; the guide's weighted ILO score is not computed from data.)

### 8.1 Purpose & scope
Produce an auditable, data-driven **ILO Just-Transition alignment score** and **regional financing-gap
estimate** per coal/fossil region, for allocators sizing JTF/JETP support and for sovereign-credit
overlays. Coverage: transition-exposed NUTS2 / sub-national regions.

### 8.2 Conceptual approach
1. **Weighted ILO composite** — replace random pillar scores with rubric-scored indicators, using
   the guide's 0.25/0.20/0.30/0.15/0.10 weights (or the engine's principle split). Benchmarks: ILO
   2015 Guidelines operationalised as CBI Just Transition Criteria (2023) checklists; World Bank JT
   Framework (2022) diagnostic.
2. **Financing-gap model** — bottom-up transition need vs available JTF, per region. Benchmarks:
   UNEP Adaptation Gap need-vs-flow method; CPI Global Landscape of Climate Finance.

### 8.3 Mathematical specification

```
pillar_score_p = 100 · (Σ_j indicator_pj · maturity_pj) / Σ_j maturity_pj      indicator ∈ {0,0.5,1}
ILO_score      = Σ_p w_p · pillar_score_p        w = [0.25,0.20,0.30,0.15,0.10]

Vulnerability  = 0.4·fossil_job_dependency + 0.3·(1−alt_sector_score)
                 + 0.2·wage_cliff + 0.1·informal_employment_share      (0–100, higher=worse)

JTF_need   = reskill_cost·workers + income_support + community_diversification
JTF_gap    = max(0, JTF_need − JTF_available)
gapPct     = JTF_gap / JTF_need
```

| Parameter | Calibration source |
|---|---|
| Pillar weights `w_p` | ILO 2015 Guidelines / guide |
| Indicator maturity scoring | CBI Just Transition Criteria 2023 checklist |
| `fossil_job_dependency`, `alt_sector_score` | Engine `COAL_COMMUNITY_PROFILES` |
| `informal_employment_share`, `union_density` | ILOSTAT 2022 (already in `data/laborIndicators`) |
| `reskill_cost`, `income_support` | Engine `model_workforce_transition`; ILO |

### 8.4 Data requirements
- Region → indicator responses per ILO pillar (tripartite dialogue evidence, reskilling programmes,
  social-protection coverage) — survey / policy tracker.
- Fossil vs green jobs, wages, reskill cost — engine profiles + ILO labour data (present).
- JTF committed/available per region — EU JTF allocations, JETP tranches.

### 8.5 Validation & benchmarking plan
- Reconcile `ILO_score` against CBI Just Transition certification / World Bank JT diagnostics.
- Backtest `gapPct` vs realised EU JTF disbursement shortfalls (public monitoring).
- Sensitivity on pillar weights (equal vs guide vs engine split) to show ranking stability.

### 8.6 Limitations & model risk
- Pillar indicators are largely qualitative and self-reported — greatest model risk is optimistic
  self-assessment; require third-party attestation and cap un-attested pillars at 50.
- Regional financing need is sensitive to displaced-worker counts and reskilling unit costs.
- The composite is a policy-alignment score, not a probability — must not be read as a risk PD.
