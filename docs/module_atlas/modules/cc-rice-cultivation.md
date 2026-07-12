# Rice Cultivation Methane Credits
**Module ID:** `cc-rice-cultivation` · **Route:** `/cc-rice-cultivation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Methane emission reduction quantification for sustainable rice intensification (SRI) and alternate wetting and drying (AWD) projects under CDM AMS-III.AU and Verra VCS VM0042. Models IPCC Tier 2 paddy methane baselines and water management intervention effects.

> **Business value:** AWD reduces paddy methane EF by ~48% (SF_w = 0.52). Annual ER = season length × (EF_base – EF_AWD) × area × GWP100. Typical yield: 0.8–1.8 tCO₂e/ha/yr.

**How an analyst works this module:**
- Select water management practice: AWD, SRI, or Aerobic Rice
- Baseline tab sets water regime and organic amendment inputs
- IPCC Scaling Factors tab adjusts EF for local conditions
- Project Monitoring tab records pore-water tube readings
- Credit Calculator aggregates across seasons and area

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DualInput`, `Kpi`, `PROJECTS`, `REGIONAL_EF`, `Section`, `TIP`, `TabBar`, `WATER_REGIMES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `WATER_REGIMES` | 4 | `name`, `desc`, `scaling`, `yield_impact`, `color` |
| `REGIONAL_EF` | 7 | `ef_low`, `ef_high`, `ef_mid`, `soil_correction`, `variety_factor` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtK` | `n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':fmt(n);` |
| `ch4_bl` | `ef_baseline * area_ha * seasons * 1e-6 * gwp_ch4; // tCO2e` |
| `ch4_pj` | `ch4_bl * awd_scaling;` |
| `gross` | `ch4_bl - ch4_pj;` |
| `net` | `gross * (1 - buffer_pct/100);` |
| `TABS` | `['Methodology Overview','Rice CH4 Calculator','AWD Practice Model','Multi-Season Analysis','Regional Benchmarks'];` |
| `riceResult` | `useMemo(() => calcRiceCH4(rp), [rp]);  useEffect(() => { if (riceResult && riceResult.net > 0) { addCalculation({ projectId: 'CC-LIVE', methodology: 'AMS-III.AU', family: 'agriculture',` |
| `awdComparison` | `useMemo(() => WATER_REGIMES.map(w => {` |
| `total` | `seasons.reduce((s,x)=>s+x.net,0);` |
| `avgEF` | `useMemo(() => Math.round(PROJECTS.reduce((s,p)=>s+p.ef_baseline,0)/PROJECTS.length), []);` |
| `awdReduction` | `useMemo(() => `${Math.round((1-rp.awd_scaling)*100)}%`, [rp.awd_scaling]);` |
| `adjusted` | `Math.round(r.ef_mid * r.soil_correction * r.variety_factor);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONAL_EF`, `TABS`, `WATER_REGIMES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EF₀ (Base Emission Factor) | `IPCC 2019 Table 5.11` | IPCC 2019 Agriculture | Reference methane EF for continuously flooded paddy with no organic amendments |
| SF_w (Water Regime Factor) | `IPCC 2019 Table 5.12` | IPCC 2019 | Scaling factor for alternate wetting and drying vs continuous flooding |
| AWD Threshold | `Pore-water tube reading` | IRRI protocol | Soil water level at which re-flooding is triggered in AWD protocol |
| Annual ER | `(EF_base – EF_proj) × Area × GWP` | Model output | Emission reductions per hectare per growing season |
- **IPCC Tier 2 tables** → EF₀ × scaling factors → paddy EF → **Baseline and project EF**
- **Pore-water tube monitoring** → Soil water level readings → AWD compliance → **Project emission factor**

## 5 · Intermediate Transformation Logic
**Methodology:** IPCC Tier 2 rice paddy CH₄ with water regime scaling factors
**Headline formula:** `ER = (EF_baseline – EF_project) × Area × GWP_CH4; EF = EF₀ × SF_w × SF_s × SF_o × t_season`

Reference emission factor EF₀ = 1.30 kg CH₄/ha/day (IPCC default for continuously flooded, no organic amendment). Scaling factors: SF_w for water regime (AWD reduces to 0.52 of continuous flooding), SF_s for soil type, SF_o for organic amendments. Season length t_season = days of flooding. Project EF reflects AWD protocol measured via pore-water tube readings. GWP100 CH₄ = 29.8 (IPCC AR6).

**Standards:** ['CDM AMS-III.AU v4', 'Verra VM0042 v1', 'IPCC 2019 Agriculture Ch.5', 'IRRI AWD Guidelines']
**Reference documents:** CDM AMS-III.AU v4 Rice Cultivation; Verra VM0042 v1.0 Rice Paddy Methane; IPCC 2019 Refinement Agriculture Ch.5; IRRI Alternate Wetting and Drying Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (units/parameterisation).** The guide states a **daily** base
> emission factor `EF₀ = 1.30 kg CH₄/ha/day` with a multiplicative IPCC scaling chain
> `EF = EF₀·SF_w·SF_s·SF_o·t_season` and GWP100 = 29.8. The code instead uses **seasonal** emission
> factors (`ef_baseline` in kg CH₄/ha/season, 200–500) applied per-season, a **single** water-regime
> scaling factor (`awd_scaling`), and GWP100 = **27.2**. The SF_s/SF_o soil/organic-amendment factors
> from the guide are folded into per-region `soil_correction`/`variety_factor` multipliers rather than
> applied explicitly at the daily level. The science is directionally correct (AWD roughly halves
> paddy CH₄); the parameterisation differs from the guide's daily-EF formulation. Code documented below.

### 7.1 What the module computes

**Rice CH₄** (`calcRiceCH4`):
```
ch4_bl (tCO2e) = ef_baseline · area_ha · seasons · 1e-6 · GWP_CH4   // kg→t via 1e-6
ch4_pj         = ch4_bl · awd_scaling                                // project water regime
gross          = ch4_bl − ch4_pj = ch4_bl·(1 − awd_scaling)
net            = gross · (1 − buffer_pct/100)
```
`awd_scaling` is the ratio of project to baseline emissions — 1.0 for continuous flooding, 0.5 for
AWD, 0.35 for dry seeding. Reduction fraction = `1 − awd_scaling`.

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| GWP100 CH₄ | 27.2 | Code comment: IPCC AR6 GWP-100 |
| Water-regime scaling | CF 1.0, AWD 0.5, Dry-Seeding 0.35 | `WATER_REGIMES` — IPCC SF_w-consistent (AWD ~0.5) |
| Yield impact | CF 0, AWD −3%, DS −8% | `WATER_REGIMES` — agronomic literature |
| Regional EF_mid | SE Asia 375, S Asia 325, E Asia 290, SSA 250, LatAm 270, Med 210 kg CH₄/ha/season | `REGIONAL_EF` — IPCC-range midpoints |
| soil_correction / variety_factor | 0.80–1.0 / 0.90–1.10 by region | `REGIONAL_EF` — proxies for IPCC SF_s/cultivar effect |
| Buffer | 12% default | UI-set |

The 8 portfolio `PROJECTS` (area, ef_baseline, credits) are **synthetic** (`sr()` PRNG).

### 7.3 Calculation walkthrough

The user sets a baseline seasonal EF, area, number of seasons/yr, project water-regime scaling, and
buffer. `calcRiceCH4` converts baseline kg CH₄ → tCO₂e (×1e-6 ×GWP), applies the project scaling to
get project emissions, differences them for gross reductions, and haircuts by the buffer. A waterfall
array visualises baseline → project → gross → buffer → net. Result pushes to `CarbonCreditContext` as
`methodology:'AMS-III.AU'`. The regional-benchmark tab computes an adjusted EF per region as
`ef_mid · soil_correction · variety_factor`.

### 7.4 Worked example (AWD, two seasons)

Defaults: `ef_baseline=350` kg CH₄/ha/season, `area=15,000 ha`, `seasons=2`, `awd_scaling=0.5`,
GWP=27.2, buffer=12%.

| Step | Computation | Result |
|---|---|---|
| Baseline CH₄ | 350·15,000·2·1e-6·27.2 | **285.6 ktCO₂e** |
| Project CH₄ | 285,600·0.5 | 142,800 tCO₂e |
| Gross reduction | 285,600 − 142,800 | 142,800 tCO₂e |
| Net (12% buffer) | 142,800·0.88 | **≈ 125,664 tCO₂e** |
| Per ha (2 seasons) | 125,664/15,000 | **≈ 8.4 tCO₂e/ha/yr** |

The AWD reduction is exactly 50% of baseline (`1−0.5`) before buffer, matching the guide's "AWD
reduces paddy methane by ~48–50%." The per-hectare yield (8.4 tCO₂e/ha/yr across 2 seasons) is high
relative to the guide's 0.8–1.8 range because the example uses a large seasonal EF (350) and 2
seasons; at a single season and lower EF the per-ha figure falls into the guide's band.

### 7.5 Data provenance & limitations
- Portfolio rows are **synthetic seeded demo data** (`sr()`); calculator inputs are user-set.
- Single lumped `awd_scaling`, not the explicit IPCC SF_w × SF_s × SF_o × pre-season chain; no
  organic-amendment (SF_o) input, no pore-water-tube compliance verification of AWD.
- Seasonal (not daily) EF means season-length is fixed in the EF, losing the guide's t_season lever.
- No N₂O trade-off accounting (AWD can raise N₂O), which real VM0042 monitoring captures.

**Framework alignment:** **CDM AMS-III.AU** (rice cultivation methane, filed as the methodology) and
**Verra VM0042** — both quantify ER = (baseline − project EF)·area·GWP, the code's exact structure.
**IPCC 2019 Refinement Agriculture Ch.5** supplies the EF ranges and the SF_w water-regime scaling
that `awd_scaling` embodies. **IRRI AWD guidelines** define the 15-cm pore-water re-flood trigger the
project regime represents.

## 9 · Future Evolution

### 9.1 Evolution A — Explicit IPCC daily-EF scaling chain (analytics ladder: rung 1 → 2)

**What.** §7 flags a units/parameterisation mismatch: the guide specifies the IPCC
daily formulation `EF = EF₀(1.30 kg/ha/day)·SF_w·SF_s·SF_o·t_season` with GWP 29.8,
while `calcRiceCH4` uses seasonal EFs (200–500 kg/ha/season), a single `awd_scaling`
factor, GWP 27.2, and folds soil/organic factors into opaque per-region multipliers.
The science is directionally right (AWD ≈ halves CH₄), but the module cannot currently
answer "what does adding straw amendment do?" because SF_o is not an explicit input.
Evolution A refactors to the documented IPCC 2019 Ch.5 chain: EF₀ × SF_w × SF_s ×
SF_o × season-days, with each scaling factor a first-class, cited parameter.

**How.** (1) Parameter tables from IPCC 2019 Refinement Tables 5.11–5.14 (SF_w for
single/multiple drainage and AWD; SF_o per amendment type and timing) replacing the
folded `soil_correction`/`variety_factor` numbers in `REGIONAL_EF`. (2) A regression
pin proving the refactored formula reproduces current outputs for the default AWD case
within 2% (the seasonal EFs implicitly contain the same factors). (3) GWP basis made
explicit and reconciled with the guide (27.0/27.2 biogenic vs 29.8), clearing the
mismatch flag.

**Prerequisites.** IPCC table values transcribed with uncertainty ranges, not point
guesses; guide updated in the same change. **Acceptance:** toggling straw amendment
(SF_o 1.0 → ~1.9 fresh-straw case) moves baseline CH₄ by the IPCC-published factor;
default-case regression pin passes.

### 9.2 Evolution B — AWD field-practice copilot (LLM tier 1 → 2)

**What.** A copilot for the practice-design questions in this module's workflow: "why
does AWD cut credits when my season shortens?", "what do pore-water tube readings
verify?" (the monitoring protocol §1 describes), "compare AWD vs aerobic rice on both
credits and the `yield_impact` field" — grounded in atlas §5/§7 and the live
calculator. Tier-2 what-ifs re-invoke `calcRiceCH4` client-side with LLM-proposed
scaling factors; there are no backend routes.

**How.** Tier 1: atlas record as corpus with the current parameterisation honestly
described (seasonal EFs, single scaling factor — until Evolution A, the copilot must
not imply SF_s/SF_o are adjustable). Tier 2: tool schema over the calculator; validator
ties every tCO₂e to a logged invocation. Yield-impact answers cite the `WATER_REGIMES`
seed values as indicative, not measured.

**Prerequisites.** Evolution A makes amendment/soil questions answerable; without it
the copilot's honest reply is "not an input in this module". **Acceptance:** an
amendment what-if is either executed via the explicit SF_o (post-A) or correctly
refused (pre-A); no numeric appears without a tool-call source.