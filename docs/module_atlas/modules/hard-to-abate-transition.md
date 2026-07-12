# Hard-to-Abate Sector Transition Finance
**Module ID:** `hard-to-abate-transition` · **Route:** `/hard-to-abate-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-EG6 · **Sprint:** EG

## 1 · Overview
Transition finance intelligence for 6 hard-to-abate sectors: Steel, Cement, Chemicals, Aviation, Shipping, and Aluminium. Maps transition finance instruments (Green Bond, SLL, Transition Bond, Blended Finance, KPI-linked), 16 seeded deals, readiness-abatement radar, and global programmes (EU Innovation Fund, DOE, GFANZ).

> **Business value:** Used by banks structuring transition finance instruments, hard-to-abate companies raising green or sustainability-linked capital, and investors deploying capital into sector decarbonisation with credible transition plans.

**How an analyst works this module:**
- Review sector overview for 6 hard-to-abate sectors readiness scores
- Examine transition finance instruments for Green Bond/SLL/Transition Bond deal flow
- Use readiness-abatement radar for strategic positioning by sector
- Analyse blended capital stack and global programme funding sources

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEALS`, `KpiCard`, `Pill`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 7 | `name`, `emissions`, `abatement2030`, `abatement2050`, `financeNeed`, `routes`, `readiness` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];` |
| `capex` | `Math.round(100 + sr(i * 11 + 2) * 900);` |
| `country` | `['Germany', 'USA', 'Japan', 'Sweden', 'UK', 'Netherlands', 'Australia', 'India'][Math.floor(sr(i * 13 + 3) * 8)];` |
| `structure` | `['Green Bond', 'SLL', 'Transition Bond', 'Blended Finance', 'KPI-linked'][Math.floor(sr(i * 17 + 4) * 5)];` |
| `irr` | `parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));` |
| `dscr` | `parseFloat((1.15 + sr(i * 23 + 6) * 0.70).toFixed(2));` |
| `status` | `['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 29 + 7) * 4)];` |
| `ci_before` | `parseFloat((0.8 + sr(i * 31 + 8) * 1.2).toFixed(2));` |
| `ci_after` | `parseFloat((ci_before * (0.05 + sr(i * 37 + 9) * 0.25)).toFixed(2));` |
| `filtered` | `useMemo(() => DEALS.filter(d => selSector === 'ALL' \|\| d.sector === selSector), [selSector]); const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);` |
| `totalCapex` | `useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);` |
| `totalEmissions` | `useMemo(() => SECTORS.reduce((s, sec) => s + sec.emissions, 0), []);` |
| `radarData` | `SECTORS.map(s => ({ subject: s.id, readiness: s.readiness, abatement2030: s.abatement2030 * 4, finance: Math.min(100, s.financeNeed / 12) }));` |
| `timelineAbatement` | `[2025, 2028, 2030, 2035, 2040, 2050].map(yr => {` |
| `annualReduction` | `s.emissions * s.abatement2030 / 100;` |
| `carbonValue` | `Math.round(annualReduction * carbonPrice / 1e3);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Hard-to-abate share of industrial CO₂ (%) | `Share of industrial emissions from 6 sectors` | IEA Industrial Decarbonisation Roadmap | These 6 sectors account for ~8 GtCO2/yr; no commercially viable zero-carbon process for all at scale in 2024. |
| Green Bond premium for HtA (bps) | `Greenium vs conventional bond for verified transition plans` | Climate Bonds Initiative + BloombergNEF | Larger greenium where third-party transition plan verification + SBTi alignment; Tata Steel: 8 bps greenium observed. |
| Sustainability-Linked Loan margin ratchet (bps) | `Margin step-down if KPI achieved; step-up if missed` | LMA/APLMA SLL Principles 2023 | Common KPIs: tCO2/t production intensity reduction; scope 1+2 absolute target; % renewable energy. |
- **GFANZ framework + IEA industrial data + CBI transition finance criteria** → Sector readiness radar + 16 deals + capital stack + programme intelligence → **Banks structuring transition bonds, industrial companies raising green finance, and investors in hard-to-abate sectors**

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Finance Sizing
**Headline formula:** `Transition_investment = CAPEX_premium_per_sector × Sector_capacity × Phase-in_timeline`

Hard-to-abate sectors require $2.4–3.5 trillion cumulative investment 2024–2050. Steel: $800B; Cement: $400B; Chemicals: $600B; Aviation: $700B; Shipping: $300B.

**Standards:** ['GFANZ Transition Finance Framework 2023', 'IEA Clean Energy Investment Tracker', 'Climate Bonds Initiative Transition Finance Criteria']
**Reference documents:** GFANZ (2023) – Transition Finance Strategies and their Decarbonisation Outcomes; Climate Bonds Initiative (2023) – Transition Finance Criteria; IEA (2023) – Industrial Decarbonisation Roadmap

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-EG6) gives `Transition_investment = CAPEX_premium × capacity ×
> phase-in`. The page does not compute that; instead each of 6 sectors carries hard-coded emissions,
> 2030/2050 abatement %, finance need and readiness, and a 16-deal pipeline is `sr()`-seeded. The live
> quantitative pieces are (a) a linear abatement-timeline interpolator and (b) a carbon-value overlay
> `emissions × abatement × carbonPrice`. Deal economics (IRR, DSCR, CI before/after) are seeded, not
> modelled from cash flows.

### 7.1 What the module computes

**Abatement timeline** (`timelineAbatement`) — piecewise-linear interpolation of each sector's decarb
trajectory:

```js
// pre-2030: ramp from 0 to abatement2030 over 2024→2030
t = abatement2030 × (yr − 2024) / 6
// post-2030: ramp from abatement2030 to abatement2050 over 2030→2050
t = abatement2030 + (abatement2050 − abatement2030) × (yr − 2030) / 20
```

**Carbon value overlay** (Abatement Levers tab):
```js
annualReduction = emissions × abatement2030 / 100        // MtCO₂/yr abated
carbonValue     = round( annualReduction × carbonPrice / 1e3 )   // $bn at slider price
```

**Radar** normalises three axes: `readiness` (0–100), `abatement2030×4`, `finance = min(100, financeNeed/12)`.

### 7.2 Parameterisation — sectors (`SECTORS`, 6 rows)

Provenance: IEA Industrial Decarbonisation Roadmap (per guide); values are illustrative sector economics.

| Sector | Emissions MtCO₂ | Abate 2030 % | Abate 2050 % | Finance need $bn | Readiness |
|---|---|---|---|---|---|
| Steel | 2,800 | 22 | 93 | 1,200 | 68 |
| Cement | 4,200 | 15 | 90 | 800 | 52 |
| Chemicals | 1,800 | 18 | 85 | 950 | 61 |
| Aviation | 1,000 | 8 | 70 | 600 | 45 |
| Shipping | 900 | 12 | 80 | 500 | 42 |
| Aluminium | 1,100 | 25 | 88 | 420 | 72 |

Cement's 4.2 GtCO₂ and lowest 2030 abatement (15%) capture its process-emissions difficulty; aviation/
shipping have the lowest readiness (45/42). Carbon-price slider default $80/t.

### 7.3 Calculation walkthrough

The 16 seeded `DEALS` (`sr()` PRNG) carry sector, country, structure (Green Bond / SLL / Transition Bond
/ Blended / KPI-linked), CAPEX ($100–1,000M), IRR (5–15%), DSCR (1.15–1.85), and CI before/after
(after = before × 0.05–0.30, i.e. 70–95% intensity cut). Filter-by-sector KPIs (`avgIrr`, `totalCapex`)
aggregate the pipeline. The abatement timeline and carbon-value overlay use the deterministic sector
constants.

### 7.4 Worked example (Steel abatement + carbon value at $80/t)

| Step | Computation | Result |
|---|---|---|
| 2028 abatement | 22 × (2028−2024)/6 | 14.7% |
| 2030 abatement | 22 × 6/6 | 22% |
| 2040 abatement | 22 + (93−22)×(2040−2030)/20 | 22 + 35.5 = 57.5% |
| annualReduction | 2,800 × 22/100 | 616 MtCO₂/yr |
| carbonValue | 616 × 80 / 1,000 | **$49.3bn** |

At $80/t carbon, steel's 2030 abatement (616 Mt) is worth ~$49bn/yr in avoided carbon cost — the
economic pull for the ~$1.2tn finance need. Aluminium reaches 25% by 2030 (fastest), aviation only 8%.

### 7.5 Data provenance & limitations

- **Deal pipeline is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`): IRR, DSCR, CAPEX, CI reductions and
  status are seeded, not from real transaction cash flows.
- Sector emissions/abatement/readiness are hard-coded illustrative values aligned to IEA/GFANZ ranges,
  not live.
- The abatement timeline is a **simple linear interpolation** between three anchor points (2024=0,
  2030, 2050) — no technology-diffusion S-curve, no cost-of-abatement ordering (MACC).
- Carbon value = flat `emissions × abatement × price` — no free-allocation, CBAM phase-in, or price path.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (deal economics are seeded; the page has no
cash-flow or MACC-based transition-investment model).

**8.1 Purpose & scope.** Size transition finance need and screen deal economics for 6 hard-to-abate
sectors, ranking abatement levers by cost and mapping the capital stack, for banks structuring
transition instruments.

**8.2 Conceptual approach.** A marginal-abatement-cost-curve (MACC) per sector combined with a
project-finance cash-flow model, mirroring IEA ETP technology cost curves and GFANZ transition-finance
framework; carbon value from a scenario carbon-price path net of free allocation/CBAM.

**8.3 Mathematical specification.**
```
Per lever k: MAC_k = (CAPEX_k·CRF + ΔOPEX_k − carbon_saving_k) / abatement_k   ($/tCO₂)
Deploy levers in ascending MAC until sector abatement target met
Transition_investment = Σ_k CAPEX_k · capacity_deployed_k
Deal: DSCR_t = CFADS_t / DebtService_t ;  IRR from equity cash flows
Carbon value = abatement · (ETS_price_path − free_alloc − CBAM_offset)
Green premium / SLL ratchet applied to debt margin per KPI achievement
```

| Parameter | Source |
|---|---|
| Lever CAPEX/OPEX/abatement | IEA ETP / sector roadmaps |
| Carbon price path | EU ETS forwards + NGFS scenarios |
| CRF (WACC, life) | 7–9%, 20–25 yr |
| SLL ratchet | LMA/APLMA SLL Principles (3–10 bps) |
| Greenium | CBI/BNEF (5–25 bps for verified HtA plans) |

**8.4 Data requirements.** Sector abatement-lever library (cost, potential), project cash-flow inputs,
carbon-price path, deal structure terms. The page holds sector abatement targets and finance need.

**8.5 Validation.** Reconcile transition-investment totals against IEA's $2.4–3.5tn cumulative estimate;
back-test deal IRR/DSCR against real transition deals; check MACC ordering against published sector MACCs.

**8.6 Limitations & model risk.** MACC is static and sector-average; technology cost trajectories are
uncertain; carbon-price and CBAM policy risk dominates. Conservative fallback: report abatement
potential and finance-need ranges rather than point transition-investment figures.

**Framework alignment:** GFANZ Transition Finance Framework — instrument taxonomy (Green/Transition/SLL/
Blended); IEA Industrial Decarbonisation Roadmap — sector abatement pathways; Climate Bonds Initiative
Transition Finance Criteria — credibility screen; LMA/APLMA SLL Principles — margin ratchet; EU
Innovation Fund — the public co-finance layer in the blended stack.

## 9 · Future Evolution

### 9.1 Evolution A — MACC-ordered transition-investment engine with real deal cash flows (analytics ladder: rung 2 → 3)

**What.** The live math today is thin but real: a piecewise-linear abatement interpolator over the 6 hard-coded `SECTORS` and a flat `emissions × abatement × carbonPrice` overlay (rung 2, via the carbon-price slider). The 16-deal pipeline is `sr()`-seeded — IRR, DSCR, CAPEX and CI reductions are fabricated, not modelled. Evolution A implements the §8 spec as a backend vertical: a per-sector marginal-abatement-cost curve (`MAC_k = (CAPEX_k·CRF + ΔOPEX_k − carbon_saving)/abatement_k`), levers deployed in ascending MAC to hit each sector's 2030/2050 targets, and deal DSCR/IRR computed from actual CFADS schedules.

**How.** (1) Seed an abatement-lever reference table (steel H2-DRI, cement CCS/clinker substitution, SAF, ammonia shipping…) with CAPEX/OPEX/abatement from IEA ETP sector roadmaps. (2) New engine route returns the MACC, transition-investment total (`Σ CAPEX_k·capacity_k`), and lever sequencing per sector; reconcile the total against IEA's $2.4–3.5tn cumulative estimate as the calibration check. (3) Replace the seeded `DEALS` with a small deterministic deal library whose IRR/DSCR come from the cash-flow model, with SLL ratchet (3–10 bps) and greenium (5–25 bps) applied to debt margin. (4) Carbon value gains a CBAM/free-allocation phase-in instead of the flat product.

**Prerequisites.** The `sr()` deal fabrication removed (guardrail `check_no_fabricated_random.py` should then pass this page); lever library sourced and documented per §8.4. **Acceptance:** sector transition-investment totals land within the IEA range; a worked steel deal's DSCR is reproducible from its CFADS schedule, not a PRNG draw.

### 9.2 Evolution B — Transition-structuring analyst over the MACC engine (LLM tier 2)

**What.** A tool-calling analyst for banks structuring hard-to-abate instruments: "what's the cheapest path to steel's 22% 2030 target?", "at $120/t carbon, which cement levers turn NPV-positive?", "structure an SLL for an aluminium smelter with a 25% intensity KPI — what ratchet is market?" Each answer executes the Evolution A endpoints (MACC, deal cash-flow, carbon-value) and narrates real engine output with the GFANZ/CBI instrument taxonomy from this page's §5 corpus.

**How.** Tool schemas auto-generated from the new module routes via the Atlas endpoint map; per-module system prompt assembled from this page (§7.2 sector table and §8 formulas are the grounding). The no-fabrication validator checks every IRR/DSCR/MAC figure in the answer against tool outputs in the same conversation. First shippable slice is tier 1: explanation of the abatement timeline and radar from existing page state, requiring no backend.

**Prerequisites (hard).** Evolution A must ship first — today the module has no backend endpoints to call, and letting an LLM narrate the seeded deal pipeline would launder fabricated economics. **Acceptance:** every numeric traceable to a tool call; asked for a deal not in the library or a sector beyond the 6 covered, the analyst refuses rather than extrapolates.