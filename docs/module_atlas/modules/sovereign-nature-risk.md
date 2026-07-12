# Sovereign Nature Risk
**Module ID:** `sovereign-nature-risk` · **Route:** `/sovereign-nature-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sovereign exposure to nature loss and biodiversity risk assessing country dependence on ecosystem services, deforestation trajectories, and TNFD/IPBES-aligned biodiversity indicators.

> **Business value:** Assesses country-level nature and biodiversity risk for sovereign bond portfolios aligned with TNFD and Kunming-Montreal GBF.

**How an analyst works this module:**
- Score biodiversity loss rate from Living Planet Index and forest cover change data.
- Assess ecosystem service dependence: agriculture, fisheries, forestry as GDP share.
- Measure protected area coverage versus Kunming-Montreal 30×30 GBF Target 3 commitment.
- Compute composite nature risk score and overlay on sovereign bond portfolio.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRIES_RAW`, `CustomTooltip`, `ECOSYSTEMS`, `ECOSYSTEM_SERVICES`, `ECO_COLORS`, `ECO_LABELS`, `GBF_TARGETS`, `GbfPolicyTab`, `KPI`, `NATURE_SECTORS`, `NatureDependencyTab`, `NatureRiskTab`, `PIE_COLORS`, `PortfolioNatureTab`, `ProgressBar`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GBF_TARGETS` | 23 | `id`, `name`, `short` |
| `TABS` | 4 | `key`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `genCountries` | `()=>COUNTRIES_RAW.map((name,i)=>{` |
| `bii` | `45+sr(s)*50;` |
| `natGdp` | `3+sr(s+1)*52;` |
| `protArea` | `5+sr(s+2)*35;` |
| `speciesRich` | `800+sr(s+3)*14000;` |
| `deforest` | `sr(s+4)*4.5;` |
| `waterStress` | `10+sr(s+5)*80;` |
| `soilDeg` | `5+sr(s+6)*60;` |
| `marineHealth` | `30+sr(s+7)*65;` |
| `pollution` | `10+sr(s+8)*75;` |
| `natRisk` | `Math.round(15+sr(s+9)*70);` |
| `physRisk` | `Math.round(10+sr(s+10)*80);` |
| `transRisk` | `Math.round(10+sr(s+11)*70);` |
| `nbsapStatus` | `['Submitted','In Progress','Draft','Not Started'][Math.floor(sr(s+90)*4)];` |
| `policyStringency` | `Math.round(10+sr(s+91)*85);` |
| `natureInvest` | `+(0.1+sr(s+92)*5).toFixed(2);` |
| `annualBii` | `[2018,2019,2020,2021,2022,2023,2024,2025].map((yr,k)=>({` |
| `ecoServiceTotal` | `ECOSYSTEM_SERVICES.reduce((acc,svc)=>acc+svcValuation[svc],0);` |
| `carbonSink` | `+(5+sr(s+120)*40).toFixed(1);` |
| `freshwaterDep` | `+(10+sr(s+121)*60).toFixed(1);` |
| `subsidyHarmful` | `+(0.5+sr(s+122)*12).toFixed(1);` |
| `incomeClass` | `['Low','Lower-Middle','Upper-Middle','High'][Math.floor(sr(s+123)*4)];` |
| `creditRating` | `['AAA','AA','A','BBB','BB','B','CCC'][Math.floor(sr(s+124)*7)];` |
| `natureLossGdpImpact` | `+(0.5+sr(s+125)*8).toFixed(1);` |
| `regions` | `['All','Latin America','Asia-Pacific','Europe','Africa','Middle East','North America'];` |
| `avgBII` | `(COUNTRIES.length?COUNTRIES.reduce((s,c)=>s+c.bii,0)/COUNTRIES.length:0).toFixed(1);` |
| `avgNatGdp` | `(COUNTRIES.length?COUNTRIES.reduce((s,c)=>s+c.natGdp,0)/COUNTRIES.length:0).toFixed(1);` |
| `totalSpecies` | `COUNTRIES.reduce((s,c)=>s+c.speciesRich,0);` |
| `totalThreatened` | `COUNTRIES.reduce((s,c)=>s+c.threatSpecies.cr+c.threatSpecies.en+c.threatSpecies.vu,0);` |
| `radarData` | `detail?ECOSYSTEMS.map(e=>({eco:ECO_LABELS[e],score:detail.ecoBreak[e]})):[];` |
| `sectorData` | `detail?NATURE_SECTORS.map(s=>({sector:s,pct:detail.sectorBreak[s]})):[];` |
| `svcData` | `detail?ECOSYSTEM_SERVICES.map(s=>({service:s,value:detail.svcValuation[s]})):[];` |
| `avg` | `+(COUNTRIES.reduce((s,c)=>s+c.ecoBreak[e],0)/60).toFixed(1);` |
| `topRisk` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>b.natRisk-a.natRisk).slice(0,20),[]);` |
| `heatmapCountries` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>b.natRisk-a.natRisk).slice(0,25),[]);` |
| `avgNatRisk` | `(COUNTRIES.reduce((s,c)=>s+c.natRisk,0)/60).toFixed(1);` |
| `avgWater` | `(COUNTRIES.reduce((s,c)=>s+c.waterStress,0)/60).toFixed(1);` |
| `avgPolicy` | `(COUNTRIES.length?COUNTRIES.reduce((s,c)=>s+c.policyStringency,0)/ Math.max(1, COUNTRIES.length):0).toFixed(1);` |
| `totalInvest` | `COUNTRIES.reduce((s,c)=>s+c.natureInvest,0).toFixed(1);` |
| `submittedPct` | `(COUNTRIES.length?(COUNTRIES.filter(c=>c.nbsapStatus==='Submitted').length/ Math.max(1, COUNTRIES.length))*100:0).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_RAW`, `ECOSYSTEMS`, `ECOSYSTEM_SERVICES`, `GBF_TARGETS`, `NATURE_SECTORS`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Assessed | — | IPBES/WWF | Countries with active sovereign nature risk assessment. |
| High Dependence Share | — | IPBES | Share of portfolio sovereign issuers with high GDP dependence on ecosystem services. |
| Avg Protected Area Gap | — | GBF Target 3 | Mean gap between current protected area coverage and Kunming-Montreal 30×30 target. |
- **IPBES, WWF LPI, IUCN Red List, GBF monitoring data** → Biodiversity loss scoring, dependence mapping, protection gap calculation → **Sovereign nature risk scores, portfolio biodiversity exposure, GBF target dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Nature Risk Score
**Headline formula:** `(Biodiversity Loss Rate × 0.35) + (Ecosystem Dependence × 0.35) + (Protection Gap × 0.30)`

Composite nature risk score weighting biodiversity loss trajectory, economic ecosystem service dependence and protected area coverage gap.

**Standards:** ['IPBES', 'TNFD', 'WWF Living Planet', 'GBF Target 3']
**Reference documents:** IPBES Global Assessment Report on Biodiversity 2019; TNFD Nature-related Risk Framework v1.0; WWF Living Planet Report 2024; Kunming-Montreal Global Biodiversity Framework 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states `Nature Risk Score = (Biodiversity Loss Rate ×
> 0.35) + (Ecosystem Dependence × 0.35) + (Protection Gap × 0.30)`. **The code does not compute
> `natRisk` from `bii`, `natGdp`, or `protArea` at all** — `natRisk`, `physRisk`, and `transRisk` are
> each an *independent* `sr()` draw with no arithmetic relationship to the biodiversity-intactness,
> GDP-dependence, or protected-area fields displayed elsewhere on the same page. A country can (and,
> per the worked example below, does) show near-maximum biodiversity intactness alongside a
> mid-to-high composite nature-risk score, which the stated formula would make structurally
> impossible. Everything below documents the code as it actually behaves.

### 7.1 What the module computes

For 60 countries (`COUNTRIES_RAW`), seed `s = i×7 + 3`, the generator produces ~25 independently
seeded fields per country, split into four unconnected groups:

```
Ecosystem condition:  bii = 45+sr(s)×50            (Biodiversity Intactness Index, 45–95)
                       natGdp = 3+sr(s+1)×52        (% GDP dependent on nature, 3–55%)
                       protArea = 5+sr(s+2)×35      (% land/sea protected, 5–40%)
                       speciesRich = 800+sr(s+3)×14000
                       deforest = sr(s+4)×4.5        (annual deforestation %)
                       waterStress, soilDeg, marineHealth, pollution — similarly independent draws

Risk scores (INDEPENDENT of the above):
                       natRisk   = round(15+sr(s+9)×70)
                       physRisk  = round(10+sr(s+10)×80)
                       transRisk = round(10+sr(s+11)×70)

Breakdowns: ecoBreak (6 ecosystems), sectorBreak (5 sectors), svcValuation (10 ecosystem
services, $Bn each), gbfProgress (23 GBF targets, % complete each) — all independent sr() draws.
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `bii` (Biodiversity Intactness Index) | 45–95 | Synthetic; real BII methodology (Natural History Museum/PREDICTS) is a modelled ratio of remaining vs. original species abundance, 0–100% |
| `natRisk`/`physRisk`/`transRisk` | 15–85 / 10–90 / 10–80 | Synthetic, independent of `bii`/`natGdp`/`protArea` despite the guide's stated formula |
| `protArea` | 5–40% | Synthetic; compared against the real Kunming-Montreal GBF **Target 3 ("30×30")** threshold in the `thirtyByThirty` field (`protArea≥30 ⇒ 'On Track'`) — this one downstream comparison is genuinely formulaic |
| `gbfProgress` per target | 0–100% × 23 targets | Synthetic; the 23 target *names* are the real Kunming-Montreal GBF targets (Dec 2022) |
| `natureLossGdpImpact` | 0.5–8.5% | Synthetic; loosely evokes the real 2021 Swiss Re Institute estimate that ~$44tn (>50% of global GDP) is moderately/highly nature-dependent, but not calibrated to it |

### 7.3 Calculation walkthrough

1. **Per-country generation** — all fields are produced once in `genCountries()` at module load
   using disjoint seed offsets (`s+0` through `s+125`), so no field is derived from another except
   `thirtyByThirty` (`protArea≥30`) and the annual BII time series (`annualBii`, a small deterministic
   decay off the base `bii` value: `bii − k×0.4 + noise`, `k`=years since 2018).
2. **Aggregation across the 60-country table** — page-level KPIs (`avgBII`, `avgNatGdp`,
   `totalSpecies`, `totalThreatened`, `avgNatRisk`, `avgWater`, `avgPolicy`, `totalInvest`,
   `submittedPct`) are simple means/sums over `COUNTRIES`, most guarded with
   `COUNTRIES.length ? … : 0` or `Math.max(1, COUNTRIES.length)`.
3. **Sector/ecosystem breakdown views** — `radarData` and `sectorData`/`svcData` slice a selected
   country's `ecoBreak`/`sectorBreak`/`svcValuation` objects for radar and bar charts.
4. **Top-risk / heatmap rankings** — `topRisk` and `heatmapCountries` sort by `natRisk` descending
   (top 20/25), independent of every other displayed field per the mismatch above.
5. **GBF dashboard** — `submittedPct` counts countries with `nbsapStatus==='Submitted'` (National
   Biodiversity Strategy and Action Plan status, one of 4 categorical states assigned by `sr()`).

### 7.4 Worked example — Brazil (index 0)

`s = 0×7+3 = 3`.

| Field | Formula | `sr()` value | Result |
|---|---|---|---|
| `bii` | `45+sr(3)×50` | 0.9752 | **93.8** (near-maximum intactness) |
| `natGdp` | `3+sr(4)×52` | 0.7573 | **42.4%** |
| `protArea` | `5+sr(5)×35` | 0.8452 | **34.6%** → `thirtyByThirty = 'On Track'` |
| `natRisk` | `15+sr(12)×70` | 0.6706 | **62** (moderate-high) |
| `physRisk` | `15+sr(13)×80`→`10+sr(13)×80` | 0.0728 | **16** (low) |
| `transRisk` | `10+sr(14)×70` | 0.8654 | **71** (high) |

Brazil scores 93.8/100 on intactness and is already past the 30×30 protection threshold, yet its
composite `natRisk` (62) is materially higher than its `physRisk` (16) — the two are unrelated
draws, so the composite cannot be read as an aggregation of the displayed ecosystem-condition
fields the way the guide's formula implies.

### 7.5 Companion analytics

- **GBF Target tracker** — 23 real Kunming-Montreal targets with a per-country % complete; useful as
  a checklist UI even though the completion percentages are synthetic.
- **TNFD LEAP status** — each country tagged with one of the four real TNFD LEAP phases (Locate,
  Evaluate, Assess, Prepare) — categorical, randomly assigned, descriptive only.
- **Ecosystem service valuation** — 10 real service categories (carbon sequestration, water
  purification, pollination, etc.) each given a synthetic $Bn value; summed to `ecoServiceTotal`,
  loosely evoking (without replicating) TEEB/Costanza-style ecosystem-service valuation studies.
- **Sovereign bond linkage** — `sovSpread` and `bondHolding` attach a synthetic sovereign credit
  spread and portfolio bond exposure per country, letting the page pretend to link nature risk to
  bond pricing, though no actual spread-decomposition model connects the two.

### 7.6 Data provenance & limitations

- **100% synthetic dataset** generated by `sr(seed)=frac(sin(seed+1)×10⁴)`; no IPBES, WWF Living
  Planet, IUCN Red List, or GBF monitoring data is ingested despite being named in the guide.
- The composite risk scores (`natRisk`/`physRisk`/`transRisk`) are decorrelated from the
  ecosystem-condition fields shown alongside them — a reader could reasonably (and incorrectly)
  assume causality between e.g. deforestation rate and nature risk score; none exists in code.
- `creditRating` and `incomeClass` per country are independently randomly assigned and are not
  joined to any real sovereign rating — do not use for cross-referencing against the platform's
  other sovereign modules' rating fields (which use a different, hand-curated `RATING_BASE`).
- Threatened-species counts (`threatSpecies.cr/en/vu/nt`) are independent random draws, not sourced
  from the IUCN Red List despite the guide citing it.

**Framework alignment:** Kunming-Montreal Global Biodiversity Framework (real 23-target list
reproduced verbatim; completion % synthetic) · TNFD LEAP approach (real 4-phase taxonomy, randomly
assigned) · IPBES/WWF Living Planet Index (named in guide as data source, not implemented) — see §8
for the model specification a production nature-risk score would need.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Produce a defensible sovereign nature-risk score usable for sovereign bond ESG integration and
TNFD-aligned country screening, replacing the current decorrelated random `natRisk` field with a
score genuinely built from the ecosystem-condition fields already on the page.

### 8.2 Conceptual approach

Adopt a **dependency-weighted exposure model**, mirroring (1) the **Swiss Re Institute Biodiversity
and Ecosystems Services Index (BES Index)**, which combines land-use intactness with sector
economic dependence to flag "fragile" economies, and (2) **WWF/Global Canopy ENCORE**, which maps
sector-level economic activity to ecosystem-service dependence and rates exposure High/Medium/Low
per dependency. Both are the standard nature-risk-screening approaches used by asset managers today
and require no proprietary calibration — only a documented dependency-weight matrix.

### 8.3 Mathematical specification

```
Biodiversity loss component:
  LossScore_c = 100 − BII_c                                     // higher BII → lower loss score

Ecosystem dependence component:
  DependScore_c = Σ_sector (GDP_share_sector,c × ENCORE_dependence_sector)   // 0–100, sector-weighted

Protection gap component:
  GapScore_c = max(0, 30 − ProtectedArea_c) / 30 × 100           // 0 at 30%+ coverage (GBF Target 3)

Composite:
  NatureRisk_c = 0.35×LossScore_c + 0.35×DependScore_c + 0.30×GapScore_c     // per guide's own weights
```

| Parameter | Calibration source |
|---|---|
| Pillar weights (0.35/0.35/0.30) | As stated in this module's own MODULE_GUIDES entry — currently unimplemented, adopt as-is |
| `ENCORE_dependence_sector` | WWF/Global Canopy ENCORE tool — publishes materiality ratings (Very High…Very Low, mappable to 0–100) per sector × ecosystem service |
| 30% protection threshold | Kunming-Montreal GBF Target 3 ("30×30"), Dec 2022 |
| BII baseline | Natural History Museum / PREDICTS project global BII layers (0–100%, country-aggregated) |

### 8.4 Data requirements

| Field | Source (free/vendor) | Already in platform? |
|---|---|---|
| Country BII | NHM PREDICTS (free, gridded — needs country aggregation) | No |
| Sector GDP dependence | World Bank WDI sector value-added + ENCORE dependency ratings (free) | Partial — sector GDP shares generally available; ENCORE mapping not ingested |
| Protected area % | UNEP-WCMC Protected Planet (free) | No — `protArea` currently synthetic |
| GBF NBSAP submission status | CBD Secretariat NBSAP tracker (free) | No |

### 8.5 Validation & benchmarking plan

- Reconcile country BII against NHM's published national aggregates for the top 20 countries by
  bond issuance; target correlation ≥0.7 given known aggregation-method differences.
- Cross-check `DependScore` ranking against Swiss Re's BES Index country tier list (published for
  ~130 countries) — expect broad agreement on which economies are "fragile."
- Sensitivity test: swap ENCORE materiality mapping granularity (sector-level vs. sub-sector) and
  confirm composite score moves <5 points for diversified economies.

### 8.6 Limitations & model risk

- BII and protected-area data update infrequently (annual at best); the composite should carry a
  data-vintage tag, not be presented as real-time.
- ENCORE dependence ratings are qualitative (Very High…Very Low) — converting to a 0–100 scale
  requires a documented, disclosed mapping to avoid false precision.
- Nature risk is spatially heterogeneous within a country (a single national score masks regional
  hotspots); this specification is necessarily a coarse sovereign-level proxy, appropriate for
  portfolio screening but not asset-level underwriting.

## 9 · Future Evolution

### 9.1 Evolution A — Compute nature risk from its own biodiversity inputs with real IPBES/WWF data (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a decorrelation defect that makes the module structurally self-contradictory: the guide's `Nature Risk = (Biodiversity Loss × 0.35) + (Ecosystem Dependence × 0.35) + (Protection Gap × 0.30)` is **not computed** — `natRisk`, `physRisk`, and `transRisk` are each independent `sr()` draws with no arithmetic tie to the `bii`, `natGdp`, or `protArea` fields shown on the same page, so a country can display near-maximum biodiversity intactness alongside high nature risk, which the stated formula makes impossible. The dataset is 100% synthetic; the Kunming-Montreal 23-target list is reproduced verbatim but completion % is fabricated; IUCN threatened-species counts are random draws despite the guide citing the Red List. Evolution A builds the real score.

**How.** (1) Implement the composite formula for real: `natRisk` computed from biodiversity loss (Living Planet Index / BII trend), ecosystem-service GDP dependence (`natGdp`), and the protected-area gap versus the GBF 30×30 Target 3 — so the score responds to its own inputs. (2) Ingest real data the guide names: WWF Living Planet Index, IPBES indicators, IUCN Red List threatened-species counts, and protected-area coverage (WDPA/Protected Planet, free). (3) Ground the GBF target completion % in the actual Kunming-Montreal monitoring framework rather than random draws. (4) Remove the independently-randomised `creditRating`/`incomeClass` that the deep-dive warns must not be cross-referenced.

**Prerequisites.** Living Planet / IUCN / WDPA ingestion; a defensible normalisation for the three composite components. This is a substantial build — the score is currently entirely disconnected from its inputs. **Acceptance:** a country with high biodiversity intactness and low ecosystem dependence scores low nature risk (the current impossibility); threatened-species counts trace to the IUCN Red List; GBF progress reflects real monitoring.

### 9.2 Evolution B — TNFD-aligned sovereign nature-screening copilot (LLM tier 1)

**What.** A copilot for the sovereign-bond ESG / TNFD-screening user: "why is this country's nature risk high?", "how does it track against GBF 30×30?", "which ecosystem services is its economy most dependent on?" — answered from the computed composite and its real biodiversity/ecosystem/protection inputs, structured around the TNFD LEAP taxonomy the module already carries.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-nature-risk/ask`, corpus = this Atlas record (the composite formula, GBF targets, TNFD LEAP structure, IPBES/WWF framework notes) plus live page state. Risk explanations decompose the score into biodiversity-loss, dependence, and protection-gap contributions; GBF-progress answers cite the real target completion; ecosystem-dependence answers read the sector breakdown. Refusal for countries outside coverage.

**Prerequisites (hard).** Evolution A — with `natRisk` decorrelated from every biodiversity field, the copilot's "why is nature risk high?" would have no honest answer; it could only cite a random draw. **Acceptance:** every score decomposition ties to the biodiversity/dependence/protection inputs and sums to the composite; GBF and species claims trace to real data; a country outside coverage returns a refusal.