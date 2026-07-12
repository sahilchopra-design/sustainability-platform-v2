# Enterprise Climate Risk
**Module ID:** `enterprise-climate-risk` · **Route:** `/enterprise-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Delivers a board-level enterprise climate risk dashboard integrating physical and transition risk exposures across all business divisions, assets, and supply chains. Aggregates risk scores into a CEO/CFO-ready climate risk register aligned with TCFD recommendations and emerging ISSB IFRS S2 mandatory disclosure requirements. Provides scenario-based financial impact quantification for strategic planning and regulatory submission.

> **Business value:** Equips CFOs, Chief Risk Officers, and sustainability teams with a single authoritative climate risk view that satisfies TCFD, IFRS S2, and emerging mandatory disclosure regimes while providing the financial quantification needed for strategic capital allocation and board-level decision-making.

**How an analyst works this module:**
- Map all business divisions, major assets, and key supply chain nodes to geographic coordinates and sector classification.
- Assign NGFS or custom scenario set and time horizons for short (2025), medium (2030), and long-term (2050) assessments.
- Review enterprise risk register with financial impact ranges and confidence bands for each risk category.
- Generate TCFD/IFRS S2 aligned board report with governance, strategy, risk management, and metrics & targets sections.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `BUSINESS_LINES`, `CET1_PATH`, `CONCENTRATION_LIMITS`, `CURRENCIES`, `EXPOSURES`, `GEOGRAPHIES`, `HEDGE_POSITIONS`, `HEDGE_TIMELINE`, `KpiCard`, `LEGAL_ENTITIES`, `MATERIALITY_ITEMS`, `NGFS3`, `NGFS3_COLORS`, `NGFS3_MULTS`, `PEER_RADAR`, `RAGBadge`, `RAROC_TABLE`, `SCENARIO_PNL`, `SECTORS`, `SectionHead`, `Sel`, `SliderRow`, `TABS`, `TCFD_ITEMS_EXTENDED`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TCFD_ITEMS_EXTENDED` | 26 | `domain`, `item`, `owner`, `dueDate` |
| `PEER_RADAR` | 6 | `self`, `peer` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `entityName` | `LEGAL_ENTITIES[Math.floor(sr(i * 7)   * LEGAL_ENTITIES.length)];` |
| `assetClass` | `ASSET_CLASSES[Math.floor(sr(i * 11)   * ASSET_CLASSES.length)];` |
| `businessLine` | `BUSINESS_LINES[Math.floor(sr(i * 13)  * BUSINESS_LINES.length)];` |
| `geography` | `GEOGRAPHIES[Math.floor(sr(i * 17)     * GEOGRAPHIES.length)];` |
| `sector` | `SECTORS[Math.floor(sr(i * 19)         * SECTORS.length)];` |
| `currency` | `CURRENCIES[Math.floor(sr(i * 43)      * CURRENCIES.length)];` |
| `vintage` | `2015 + Math.floor(sr(i * 47) * 9);` |
| `exposureMN` | `50 + sr(i * 23) * 2950;` |
| `physRisk` | `10 + sr(i * 29) * 80;` |
| `transRisk` | `10 + sr(i * 31) * 80;` |
| `climateVaR95` | `exposureMN * (0.02 + sr(i * 37) * 0.18);` |
| `hedgeRatio` | `sr(i * 59);` |
| `hedgeCostBps` | `hedgeRatio > 0.1 ? 5 + sr(i * 61) * 95 : 0;` |
| `raroc` | `0.04 + sr(i * 71) * 0.16;` |
| `capitalCharge` | `exposureMN * (0.08 + sr(i * 73) * 0.07);` |
| `pdClimate` | `0.001 + sr(i * 79) * 0.079;` |
| `lgdClimate` | `0.2   + sr(i * 83) * 0.6;` |
| `rwaClimate` | `exposureMN * (0.3 + sr(i * 89) * 0.9);` |
| `nplRatio` | `sr(i * 97) * 0.15;` |
| `greenTagged` | `sr(i * 101) > 0.65;` |
| `carbonFP` | `sr(i * 103) * 1000;` |
| `EXPOSURES` | `isIndiaMode() ? adaptForPCAF().map((c, i) => ({` |
| `RAROC_TABLE` | `LEGAL_ENTITIES.map((e, i) => ({` |
| `HEDGE_POSITIONS` | `LEGAL_ENTITIES.map((e, i) => ({` |
| `SCENARIO_PNL` | `NGFS3.map((sc, si) => ({` |
| `CET1_PATH` | `NGFS3.map((sc, si) => ({` |
| `score` | `Math.floor(sr(i * 17 + 3) * 4);  // 0–3` |
| `CONCENTRATION_LIMITS` | `LEGAL_ENTITIES.map((e, i) => {` |
| `limitBN` | `+(5 + sr(i * 500) * 25).toFixed(1);` |
| `currentBN` | `+(limitBN * (0.4 + sr(i * 501) * 0.75)).toFixed(1);` |
| `util` | `+((currentBN / limitBN) * 100).toFixed(1);` |
| `totalExposureBN` | `useMemo(() => filtered.reduce((s, x) => s + x.exposureMN, 0) / 1000, [filtered]);` |
| `sumSq` | `filtered.reduce((s, x) => s + (x.climateVaR95 * scenMult) ** 2, 0);` |
| `standaloneSum` | `useMemo(() => filtered.reduce((s, x) => s + x.climateVaR95 * scenMult, 0), [filtered, scenMult]);` |
| `wtd` | `filtered.reduce((s, x) => s + x.hedgeRatio * x.exposureMN, 0);` |
| `tot` | `filtered.reduce((s, x) => s + x.exposureMN, 0);` |
| `tcfdScore` | `useMemo(() => { const total = TCFD_ITEMS_EXTENDED.reduce((s, x) => s + x.score, 0);` |
| `entityBarData` | `useMemo(() => LEGAL_ENTITIES.map(e => {` |
| `totExp` | `sub.reduce((s, x) => s + x.exposureMN, 0);` |
| `physVaR` | `sub.reduce((s, x) => s + x.climateVaR95 * (x.physRisk / 100) * scenMult, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `BUSINESS_LINES`, `CURRENCIES`, `GEOGRAPHIES`, `LEGAL_ENTITIES`, `MATERIALITY_ITEMS`, `NGFS3`, `NGFS3_COLORS`, `NGFS3_MULTS`, `PEER_RADAR`, `SECTORS`, `TABS`, `TCFD_ITEMS_EXTENDED`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Enterprise Climate VaR (%) | — | TCFD/IPCC AR6 | Estimated EBITDA-at-risk from climate factors under tail scenario; above 10% triggers board-level escalation. |
| Physical Risk Hotspot Count | — | JBA / Four Twenty Seven | Number of owned or leased assets above critical hazard threshold in current and 2050 climate. |
| Transition Risk Exposure ($M) | — | IEA/Carbon Tracker | Estimated NPV impact of carbon pricing, stranded assets, and revenue shift under 1.5°C scenario. |
| TCFD Disclosure Readiness Score (%) | — | TCFD Status Report 2023 | Percentage of TCFD recommended disclosures populated with quantified data vs. qualitative-only or absent. |
- **Asset registry (GIS coordinates, book value, sector)** → Overlay with physical hazard maps (flood, heat, drought, sea-level rise) → **Asset-level physical risk score and financial exposure**
- **Revenue and cost data by division** → Apply scenario-specific carbon price, policy cost, and demand shift factors → **Division-level transition risk impact ($M)**
- **TCFD disclosure inventory** → Gap-assess against 11 recommended disclosures; score quantification maturity → **TCFD readiness score with disclosure gap register**

## 5 · Intermediate Transformation Logic
**Methodology:** Enterprise Climate Risk Score
**Headline formula:** `ECRS = Σ(w_d × (PhysRisk_d + TransRisk_d)) / Σw_d`

Division-weighted average of standardised physical and transition risk sub-scores (each 0â€“100). Physical risk sub-score aggregates acute and chronic hazard exposures across asset footprint. Transition risk sub-score covers regulatory, technology, market, and reputational dimensions. Enterprise score is value-at-risk calibrated under 1.5°C, 2°C, and 3°C scenarios.

**Standards:** ['TCFD 2017/2021', 'IFRS S2 2023', 'TNFD v1.0']
**Reference documents:** TCFD Final Recommendations 2017 and 2021 Guidance; IFRS S2 Climate-related Disclosures Standard 2023; IPCC AR6 WGII Chapter 16 â€” Key Risks; NGFS Phase IV Scenario Database 2023; TNFD v1.0 Framework 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's headline is the **Enterprise Climate Risk Score**
> `ECRS = Σ(w_d × (PhysRisk_d + TransRisk_d)) / Σw_d` — a division-weighted composite of standardised
> physical and transition sub-scores. **The ECRS is never computed.** `physRisk` and `transRisk` exist
> as per-exposure random draws (10–90) but are not aggregated into a division-weighted enterprise
> score. What the module *does* compute is a **portfolio climate-VaR aggregation with a diversification
> proxy**, NGFS scenario multipliers, hedge coverage, and a real TCFD-completeness score. Critically,
> the per-exposure `climateVaR95` is itself a **random draw** (`exposure × (0.02 + sr·0.18)`), not a
> modelled loss percentile. §8 specifies both the ECRS and the climate-VaR model.

### 7.1 What the module computes

**300 synthetic exposures** — every risk attribute is an independent `sr()` draw:
```js
exposureMN   = 50 + sr(i·23)·2950         physRisk  = 10 + sr(i·29)·80
transRisk    = 10 + sr(i·31)·80           climateVaR95 = exposureMN × (0.02 + sr(i·37)·0.18)
pdClimate    = 0.001 + sr(i·79)·0.079     lgdClimate   = 0.2 + sr(i·83)·0.6
rwaClimate   = exposureMN × (0.3 + sr(i·89)·0.9)   capitalCharge = exposureMN × (0.08 + sr·0.07)
```
(An India-mode branch swaps in real market-cap-scaled exposures from `adaptForPCAF()`, but risk scores
remain `sr()`-random.)

**Portfolio aggregations** (the genuine computations):
```js
standaloneSum   = Σ climateVaR95 × scenMult                    // undiversified
portfolioCVaR   = sqrt( Σ (climateVaR95 × scenMult)² ) × 0.75  // diversified proxy
diversBenefit   = standaloneSum − portfolioCVaR
pctHedged       = Σ hedgeRatio × exposure / Σ exposure × 100   // exposure-weighted
tcfdScore       = Σ TCFD_item.score / (n_items × 3) × 100      // completeness %
entity physVaR  = Σ climateVaR95 × (physRisk/100) × scenMult   // per legal entity
```

### 7.2 Parameterisation / scoring rubric

| Object | Value | Provenance |
|---|---|---|
| `LEGAL_ENTITIES` | 12 (HoldCo, BankCo UK/EU/…, Asset Mgmt, Insurance…) | Group structure |
| `NGFS3` / `NGFS3_MULTS` | Orderly 1.0, Disorderly 1.4, Hot House 2.1 | Scenario loss multipliers |
| `climateVaR95` | exposure × (2–20%) | **synthetic — not a percentile** |
| Diversification factor | ×0.75 on √(ΣVaR²) | ad-hoc correlation proxy |
| `pdClimate` / `lgdClimate` | 0.1–8% / 20–80% | synthetic credit primitives |
| RAROC hurdle | 8% | `passes = raroc ≥ 0.08` |
| TCFD scoring | item score / 3 | 0–3 maturity per TCFD item |

The NGFS 3-scenario multipliers (Orderly<Disorderly<Hot House) follow the correct risk ordering; the
0.75 diversification factor is a fixed heuristic, not a computed portfolio correlation.

### 7.3 Calculation walkthrough

Generate 300 exposures → filter by entity/asset-class/geography/sector → the KPIs compute total
exposure, portfolio climate-VaR (with diversification benefit), % hedged, and TCFD score → the
scenario toggle applies `scenMult` (1.0/1.4/2.1) to all VaR figures → per-entity bars split VaR into
physical vs transition components (weighting each exposure's VaR by its physRisk/transRisk share) → a
RAG (red/amber/green) status per legal entity → RAROC and hedge tables.

### 7.4 Worked example

Suppose the filtered set sums to `standaloneSum = $8,400M` of climate-VaR (Orderly, scenMult = 1) and
`Σ VaR² = 5.6×10⁷`:
```
portfolioCVaR = √(5.6×10⁷) × 0.75 = 7,483 × 0.75 = $5,612M
diversBenefit = 8,400 − 5,612 = $2,788M
```
So the module claims a $2.79B diversification benefit — but this arises purely from the
`√(ΣVaR²)·0.75` construction, which assumes a fixed sub-additivity factor regardless of actual
exposure correlation. Under **Hot House** (scenMult = 2.1), every VaR scales ×2.1, so `standaloneSum =
$17,640M` and `portfolioCVaR = $11,785M` — the scenario multiplier is the only real driver of the
stress. The per-exposure VaR feeding this (e.g. a $1,000M exposure → `1000×(0.02+sr·0.18)` ≈ $110M) is
a random 2–20% haircut, not a computed 95th-percentile loss.

### 7.5 Companion analytics

- **Entity VaR decomposition:** physical vs transition VaR per legal entity (weighting VaR by the
  exposure's phys/trans score share) — the closest the module gets to the guide's phys+trans split.
- **RAG dashboard:** per-entity climate-VaR-to-exposure ratio bucketed red/amber/green.
- **TCFD completeness:** `TCFD_ITEMS_EXTENDED` scored 0–3 per item, normalised to a 0–100% disclosure
  maturity — a genuine (if self-assessed) completeness metric.
- **RAROC / hedge tables:** per-entity risk-adjusted return vs 8% hurdle; hedge coverage and cost.

### 7.6 Data provenance & limitations

- **All 300 exposures are synthetic** (`sr()` draws); the India branch scales exposure by real market
  cap but keeps risk scores random.
- **`climateVaR95` is a random haircut, not a modelled percentile**; PD/LGD/RWA are likewise drawn,
  not derived. The diversification benefit is a fixed-factor artefact.
- **The ECRS composite the guide headlines is not implemented** — physRisk/transRisk are never
  division-weighted into an enterprise score.
- The TCFD score is genuine but based on self-assessed 0–3 item maturities.

**Framework alignment:** **TCFD (2017/2021)** — the physical/transition risk taxonomy and the
disclosure-item completeness score; **IFRS S2 (2023)** — the enterprise-wide climate-risk register and
cross-division aggregation the guide targets; **TNFD v1.0** — named for nature-risk extension; **NGFS**
— the Orderly/Disorderly/Hot-House scenario multipliers. The module presents the TCFD/ISSB *structure*
but computes VaR from random inputs rather than a risk model.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce (a) a division-weighted Enterprise Climate Risk Score and (b) a genuine portfolio climate-VaR
with a real diversification structure, for a board-level TCFD/IFRS S2 climate-risk register across all
legal entities, asset classes, and geographies.

### 8.2 Conceptual approach
Two linked models: an **ECRS composite** (standardised phys+trans sub-scores aggregated by division
exposure weight, per **TCFD/IFRS S2** register practice) and a **climate-VaR** built from
scenario-conditioned loss distributions with a correlation-based portfolio aggregation. Benchmarks:
**MSCI Climate VaR**, **BlackRock Aladdin Climate**, **NGFS scenario stress**, **UNEP-FI TCFD banking
pilot**.

### 8.3 Mathematical specification
```
Standardise:  P_d, T_d ∈ [0,100]  (min-max across divisions)
ECRS = Σ_d w_d·(P_d + T_d) / Σ_d w_d,   w_d = Exposure_d / Σ Exposure

Climate-VaR (per exposure i, scenario s):
  Loss_i(s) = EAD_i · [ PD_climate_i(s)·LGD_climate_i  (credit)  ⊕  MtM_shock_i(s) (market) ]
  VaR_95(s) = Quantile_{0.95}( Σ_i Loss_i(s) )        // via MC or analytic
Portfolio aggregation (real diversification):
  VaR_portfolio = √( vᵀ Σ_corr v ),  v = vector of standalone VaRs, Σ_corr = correlation matrix
  DiversBenefit = Σ v_i − VaR_portfolio
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Division exposure weights | `w_d` | internal exposure data |
| Physical/transition sub-scores | `P_d,T_d` | hazard models (WRI/ND-GAIN) + NGFS transition |
| Climate PD/LGD | `PD_climate,LGD` | Merton/IFRS9 climate-conditioned (see climate-credit-integration) |
| Scenario multipliers | `s` | NGFS Phase IV GDP/carbon-price paths |
| Correlation matrix | `Σ_corr` | historical asset-class/sector correlations |

### 8.4 Data requirements
Per exposure: EAD, sector, geography, asset class, PD/LGD, physical-hazard exposure, transition-risk
drivers, and an asset-class/sector correlation matrix. Sources: internal exposure tape, NGFS scenarios,
WRI Aqueduct/ND-GAIN (platform reference data), historical correlations. Reuse the platform's
`climate-credit-integration` PD/LGD conditioning and hazard matrices.

### 8.5 Validation & benchmarking plan
Reconcile portfolio VaR against MSCI Climate VaR / Aladdin for a pilot book; validate the correlation
aggregation reduces to Σv only at ρ=1 and to √Σv² at ρ=0. Backtest scenario losses against NGFS
reference outputs. Sensitivity: correlation ±0.2 (replaces the fixed 0.75 factor), scenario multiplier.

### 8.6 Limitations & model risk
Climate-VaR tail estimation is data-sparse; correlation matrices are unstable under stress (correlations
→1 in crises, eroding diversification). The fixed 0.75 factor in the current code understates tail
co-movement. Conservative fallback: floor the aggregation correlation upward under Hot-House (stress
correlations toward 1), so diversification benefit shrinks — never assume independence in the tail.

## 9 · Future Evolution

### 9.1 Evolution A — Assemble the enterprise view from the platform's real risk engines (analytics ladder: rung 1 → 2)

**What.** Everything quantitative on this board-level page is seeded: exposures (`50 + sr·2950` $M), physical/transition risk scores, climate VaR (`exposure × (0.02 + sr·0.18)`), RAROC, PD/LGD/RWA, CET1 paths, hedge positions, concentration limits, even the TCFD readiness item scores (`floor(sr·4)`). The aggregation logic on top (diversified vs standalone VaR via sum-of-squares, weighted hedge ratios, TCFD scoring) is fine — the inputs are fabricated. The platform, meanwhile, owns real components for nearly every tile: hazard grids, a Basel capital engine, taxonomy screening, NGFS repricing. Evolution A makes this module what its name claims: an *aggregator* of the enterprise's real risk verticals.

**How.** (1) Physical risk per asset from the digital twin's composite hazard scoring at real coordinates (the §4 lineage sketch — "overlay with physical hazard maps" — is literally built already in `global_physical_risk_engine`). (2) Transition/credit tiles from the `energy-transition-credit-portal` stack: real IRB RWA, capital requirements, and climate-stressed PDs from `basel_capital_engine`, scenario P&L from the NGFS repricing engines — replacing seeded RAROC_TABLE/CET1_PATH. (3) Exposure rows from `portfolios_pg` and the asset registry rather than `LEGAL_ENTITIES × sr()`. (4) TCFD readiness becomes a maintained checklist (owner, due date, evidence link) — the 26-item structure is good; the seeded scores are not. (5) Rung 2: the existing scenario selector drives real engine re-computation instead of `NGFS3_MULTS` multipliers.

**Prerequisites.** The upstream verticals' §9 Evolutions A (this is the most downstream module in the slice — sequence it last); asset geocoding. **Acceptance:** every KPI tile traces to a named engine endpoint; the diversified-VaR aggregation reproduces from real per-exposure inputs; zero `sr()` outside chart cosmetics.

### 9.2 Evolution B — CRO desk orchestrator producing the board pack (LLM tier 3)

**What.** This module is the natural seat for a tier-3 climate-CRO orchestrator: "prepare the quarterly board climate-risk pack" should route across the platform — hazard hotspots from the digital twin, capital impacts from the Basel engine, scenario P&L from NGFS repricing, disclosure status from the TCFD register — and compose the four-pillar TCFD/IFRS S2 board report (governance, strategy, risk management, metrics & targets) through the report-studio render layer, with a "show work" appendix listing every engine call.

**How.** Routing via `module_tags.json` risk-family tags and the Atlas interconnection graph; tool surface = the read-only endpoints of the constituent verticals as their Evolutions A land. The orchestrator's added value is *reconciliation*: where two engines disagree (portfolio VaR from dme-financial-risk vs the enterprise aggregation), the pack discloses both with methodology notes rather than silently choosing. Board-pack numerics are validator-checked against tool outputs; qualitative strategy text is clearly attributed as drafting, not computation.

**Prerequisites (hard).** Evolution A's real tile wiring plus at least the digital twin and Basel engine tool surfaces — orchestrating today's seeded page would automate a fabricated board report, the highest-blast-radius failure in this entire module family. **Acceptance:** a golden board pack's every figure traces to an engine response in the show-work appendix; inter-engine discrepancies are disclosed, not averaged away; IFRS S2 items without data render as gaps with owners, mirroring the register.