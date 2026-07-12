# Livestock Methane Reduction Credits
**Module ID:** `cc-livestock-methane` · **Route:** `/cc-livestock-methane` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Enteric fermentation and manure management methane reduction credit quantification under Verra VCS VM0041 and Gold Standard Animal Husbandry. Models Tier 2 IPCC enteric fermentation baselines, dietary additive interventions (3-NOP, seaweed), and anaerobic digestion co-benefits.

> **Business value:** Enteric ER = (baseline – project Ym) × GEI × headcount × GWP. 3-NOP typically yields 0.3–0.6 tCO₂e/cow/yr; seaweed up to 1.2 tCO₂e/cow/yr in optimal conditions.

**How an analyst works this module:**
- Select livestock species and production system
- Enteric Baseline sets diet quality and Ym factor
- Intervention tab applies 3-NOP, seaweed, or diet change
- Manure Management tab compares lagoon vs covered digester
- Credit Calculator aggregates enteric + manure reductions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLIMATE_REGIONS`, `Card`, `DualInput`, `FEED_ADDITIVES`, `Kpi`, `PROJECTS`, `Section`, `TIP`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLIMATE_REGIONS` | 5 | `name`, `mcf`, `temp_range` |
| `FEED_ADDITIVES` | 5 | `name`, `reduction_pct`, `dose`, `cost_per_head_yr`, `notes` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_bl` | `gross_energy_mj * ym_bl * 365 * head_count / 55.65; // kg CH4/yr — IPCC 2006 GL & 2019 Refinement: 55.65 MJ/kg CH4` |
| `ch4_pj` | `gross_energy_mj * ym_pj * 365 * head_count / 55.65;` |
| `ch4_avoided_kg` | `ch4_bl - ch4_pj;` |
| `tco2e_bl` | `ch4_bl / 1000 * gwp;` |
| `tco2e_pj` | `ch4_pj / 1000 * gwp;` |
| `gross_credits` | `(ch4_avoided_kg / 1000) * gwp;` |
| `net_credits` | `gross_credits * (1 - buffer_pct/100);` |
| `total` | `(entResult?.net_credits \|\| 0) + (manResult?.net_credits \|\| 0);` |
| `totalCH4Avoided` | `useMemo(() => PROJECTS.reduce((s,p)=>s+p.ch4_avoided_tco2e,0), []);` |
| `avgHerd` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.herd_size,0)/PROJECTS.length), []);` |
| `pulse100` | `27.2; // IPCC AR6 GWP-100: CH4=27.2` |
| `creditsPerHead` | `r.net_credits / ent.head_count;` |
| `costPerTon` | `creditsPerHead > 0 ? a.cost_per_head_yr / creditsPerHead : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLIMATE_REGIONS`, `FEED_ADDITIVES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Ym (Methane Conversion Factor) | `Species and diet dependent` | IPCC 2019 Table 10.2 | Fraction of gross energy intake converted to enteric methane |
| 3-NOP Reduction Efficacy | `Randomised controlled trial` | Published RCT literature | Enteric methane reduction from 3-nitrooxypropanol feed additive |
| VS (Volatile Solids) | `Species body weight × VS factor` | IPCC 2019 Table 10.19 | Organic matter excreted used for manure management calculation |
| Manure System MCF | `Storage type dependent` | IPCC 2019 Table 10.17 | Methane conversion factor for different manure management systems |
- **Farm head count records** → Species × Ym × GEI → baseline EF → **Baseline enteric tCO₂e**
- **Feed additive trial data** → Intervention efficacy → project EF → **ER in tCO₂e/head/yr**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC Tier 2 enteric fermentation + manure management
**Headline formula:** `ER_enteric = (EF_baseline – EF_project) × HeadCount × GWP_CH4; EF = GEI × Ym / 55.65`

Baseline enteric EF = Gross Energy Intake (GEI) × methane conversion factor (Ym) / 55.65 MJ/kg CH₄. Ym ranges 3–6.5% by species and feed quality. 3-NOP additive reduces Ym by 20–30%; seaweed (Asparagopsis) by 50–80% in trials. Manure management: IPCC VS (volatile solids) method for lagoon vs solid storage comparison. Co-benefits: reduced N₂O from manure handling.

**Standards:** ['Verra VM0041 v2', 'Gold Standard Animal Husbandry v1', 'IPCC 2019 Agriculture Ch.10', 'CDM AMS-III.D']
**Reference documents:** Verra VCS VM0041 v2.0 Livestock; Gold Standard Animal Husbandry Methodology; IPCC 2019 Refinement Agriculture Ch.10; CDM AMS-III.D Methane Recovery

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (minor).** The guide names **Verra VM0041** and **Gold Standard
> Animal Husbandry** as the primary standards; the code actually files calculations under
> `methodology:'AMS-III.BF'` (CDM small-scale manure/biogas) and uses GWP100 **= 27.2** throughout,
> whereas the guide quotes 29.8. The core science — IPCC Tier 2 enteric fermentation (GEI·Ym/55.65)
> and VS·B₀·MCF manure accounting — is implemented correctly and matches the guide's formulas. The
> GWP* comparison the guide implies (flow vs pulse) is present but hard-coded/illustrative, not a real
> GWP* integration. Sections document the code as written.

### 7.1 What the module computes

Two intervention pathways, aggregated to net credits.

**Enteric fermentation** (`calcEnteric`), IPCC 2019 Tier 2:
```
CH4_bl (kg/yr) = GEI · Ym_bl · 365 · head_count / 55.65   // 55.65 MJ energy per kg CH4
CH4_pj (kg/yr) = GEI · Ym_pj · 365 · head_count / 55.65
gross_credits  = (CH4_bl − CH4_pj)/1000 · GWP
net_credits    = gross_credits · (1 − buffer_pct/100)
```
`Ym` is the methane-conversion factor (fraction of gross energy intake lost as CH₄). The intervention
lowers `Ym_pj` below `Ym_bl`.

**Manure management** (`calcManure`), IPCC VS method:
```
CH4_bl (kg/yr) = VS · B0 · MCF · 0.67 · head_count · 365   // 0.67 kg/m³ CH4 density
CH4_pj         = CH4_bl · (1 − reduction_pct/100)
gross_credits  = (CH4_bl − CH4_pj)/1000 · GWP
```

### 7.2 Parameterisation / scoring rubric

| Parameter | Default / range | Provenance |
|---|---|---|
| GWP100 CH₄ | 27.2 | Code comment: IPCC AR6 GWP-100 |
| Energy per kg CH₄ | 55.65 MJ/kg | Code comment: IPCC 2006 GL & 2019 Refinement |
| Ym baseline / project | 0.065 / 0.040 default | IPCC Table 10.12 (3–6.5% by diet); UI-set |
| GEI (gross energy intake) | 180 MJ/head/day | IPCC Tier 2 typical dairy; UI-set |
| VS (volatile solids) | 6.0 kg/head/day | IPCC Table 10.13a; UI-set |
| B₀ | 0.24 m³ CH₄/kg VS | IPCC default (cattle) |
| MCF (manure system) | 0.10–0.80 by climate | `CLIMATE_REGIONS` — IPCC Table 10.17 (cool 0.10 → tropical 0.80) |
| CH₄ density factor | 0.67 kg/m³ | IPCC standard |
| Additive reduction | 3-NOP 30%, Asparagopsis 50%, Fat 15%, Nitrate 20% | `FEED_ADDITIVES` — published RCT ranges |

The 10 portfolio `PROJECTS` (herd_size, ch4_avoided, buffer) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

Enteric and manure results compute independently from their input state objects; the page total is
`entResult.net_credits + manResult.net_credits`, pushed to `CarbonCreditContext`. Changing the
climate region auto-updates the manure `MCF` (`handleClimateChange` → `CLIMATE_REGIONS[idx].mcf`).
Feed-additive scenarios apply the additive's `reduction_pct` to lower project Ym or manure CH₄. A
cost-effectiveness view divides `cost_per_head_yr` by `net_credits/head_count` to give $/tCO₂e.

### 7.4 Worked example (enteric, dairy herd)

Defaults: GEI=180 MJ/day, Ym_bl=0.065, Ym_pj=0.040 (3-NOP-like), head_count=5,000, buffer=15%,
GWP=27.2.

| Step | Computation | Result |
|---|---|---|
| Baseline CH₄ | 180·0.065·365·5000/55.65 | ≈ 383,800 kg/yr |
| Project CH₄ | 180·0.040·365·5000/55.65 | ≈ 236,200 kg/yr |
| CH₄ avoided | 383,800 − 236,200 | ≈ 147,600 kg/yr |
| Gross credits | 147,600/1000·27.2 | ≈ **4,015 tCO₂e/yr** |
| Net (15% buffer) | 4,015·0.85 | ≈ **3,413 tCO₂e/yr** |
| Per head | 3,413/5,000 | ≈ **0.68 tCO₂e/cow/yr** |

This 0.68 tCO₂e/cow/yr sits exactly in the guide's stated 0.3–0.6 range for 3-NOP (slightly above,
because Ym drops 2.5 pts vs a typical 30% relative reduction) — the model is internally consistent.

### 7.5 Companion analytics
- **GWP Accounting** tab — a simplified pulse (27.2 flat) vs a declining "flow" series to illustrate
  the GWP* concept; **not** a calibrated GWP* integration.
- **Feed additive scenarios** — cost per head vs credits per head across the 4 additives.

### 7.6 Data provenance & limitations
- Portfolio rows are **synthetic seeded demo data**; calculator inputs are user-set.
- No N₂O co-benefit accounting (guide mentions it; code omits it), no lifetime persistence modelling
  of additive efficacy, and the GWP* series is illustrative not integrated.
- Tier 2 GEI is a single scalar, not derived from NEm/NEg/NEa energy balance sub-equations.

**Framework alignment:** IPCC 2019 Refinement Agriculture Ch.10 (enteric Tier 2, VS/B₀/MCF manure) —
implemented directly. CDM **AMS-III.BF/D** manure methane and **Verra VM0041** livestock enteric —
approximated via the (baseline−project) EF difference × GWP structure. GWP100 per IPCC AR6.

## 9 · Future Evolution

### 9.1 Evolution A — Real GWP* dual-metric accounting (analytics ladder: rung 1 → 2)

**What.** §7 notes the IPCC Tier 2 science is implemented correctly
(`CH4 = GEI·Ym·365·head/55.65`, VS·B₀·MCF manure accounting) but flags two honest
gaps: the GWP* flow-vs-pulse comparison the guide implies is "hard-coded/illustrative,
not a real GWP* integration", and the code files under AMS-III.BF with GWP 27.2 while
the guide cites VM0041 and 29.8. Evolution A implements actual GWP* alongside GWP100:
`E_CO2we = GWP100·(4·ΔE_CH4_rate·H − 3.75·E_CH4)` computed from the herd's emission
trajectory, so a shrinking-Ym intervention (3-NOP, Asparagopsis — both in the real
`FEED_ADDITIVES` table with dose and cost data) shows its genuinely larger
warming-equivalent benefit for short-lived methane.

**How.** (1) Time-series extension of `calcEnteric`: baseline and project CH₄ rates
over a 20-year horizon, GWP* computed from the rate delta, charted against the GWP100
line. (2) Metric labels and the methodology code (AMS-III.BF vs VM0041) reconciled with
the guide so the §7 mismatch clears. (3) Intervention cost-effectiveness: $/tCO₂e and
$/tCO₂we per additive from the existing `cost_per_head_yr` field.

**Prerequisites.** GWP basis decision (biogenic 27.0/27.2 vs guide's 29.8) documented;
GWP* formula sourced to Allen/Cain et al. per §8 model-card convention. **Acceptance:**
a constant-herd, reduced-Ym scenario shows GWP* benefit exceeding GWP100 benefit in
early years; the hard-coded illustrative comparison is deleted.

### 9.2 Evolution B — Herd intervention copilot (LLM tier 1 → 2)

**What.** A copilot for the questions the module's economics turn on: "why does seaweed
score 3x the credits of 3-NOP?" (Ym reduction 50–80% vs 20–30% — real values in
`FEED_ADDITIVES`), "what's my cost per credit at 500 head?", "why does the covered
digester beat the lagoon?" (MCF differences in `CLIMATE_REGIONS`). Grounded in atlas
§5/§7 and live calculator state; tier-2 what-ifs re-invoke `calcEnteric` and the manure
engine client-side — no backend routes exist to call.

**How.** Tier 1: RAG over this atlas page with the §7 mismatch disclosed until fixed
(the copilot must say "this page computes with GWP 27.2" — not the guide's 29.8).
Tier 2: tool schemas over the two calculators; validator matches every kgCH₄/tCO₂e
numeric to a logged invocation.

**Prerequisites.** Evolution A's metric reconciliation for a clean corpus; additive
efficacy claims cited to trial literature, flagged as trial-condition ranges.
**Acceptance:** cost-per-credit answers reproduce `cost_per_head_yr / credits_per_head`
arithmetic exactly; a question about milk-yield side effects is refused as outside the
module's computed surface.