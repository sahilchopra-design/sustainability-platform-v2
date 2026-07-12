# Social Bond Analytics
**Module ID:** `social-bond` · **Route:** `/social-bond` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Social bond impact reporting aligned to ICMA Social Bond Principles, tracking use-of-proceeds to eligible social project categories and quantifying beneficiary impact metrics.

> **Business value:** Tracks social bond use-of-proceeds and quantifies social outcome impacts in alignment with ICMA Social Bond Principles.

**How an analyst works this module:**
- Verify bond eligibility under ICMA Social Bond Principles project category list.
- Collect issuer use-of-proceeds allocation reports by eligible category.
- Quantify social outcome metrics: affordable housing units, healthcare access, education enrolment.
- Compute impact scores and generate IIB-aligned impact reports for investors.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ANNUAL`, `BONDS`, `CATEGORIES`, `IMPACT_CATS`, `ISSUERS`, `PAGE`, `REGIONS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `REGIONS` | `['Europe','North America','Asia-Pacific','Latin America','Africa','Middle East','Global'];` |
| `cat` | `CATEGORIES[Math.floor(sr(i*3)*CATEGORIES.length)];` |
| `issuer` | `ISSUERS[Math.floor(sr(i*7)*ISSUERS.length)];` |
| `reg` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `IMPACT_CATS` | `CATEGORIES.map((c,i)=>({` |
| `paged` | `filtered.slice(page*PAGE,page*PAGE+PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `kpis` | `useMemo(()=>{ const total=filtered.reduce((s,b)=>s+b.amount,0);` |
| `avgCoup` | `filtered.length?filtered.reduce((s,b)=>s+parseFloat(b.coupon),0)/filtered.length:0;` |
| `avgTenor` | `filtered.length?filtered.reduce((s,b)=>s+b.tenor,0)/filtered.length:0;` |
| `catDist` | `useMemo(()=>{const m={};CATEGORIES.forEach(c=>m[c]=0);filtered.forEach(b=>m[b.category]++);return Object.entries(m).map(([name,value])=>({name:name.length>16?name.slice(0,16)+'..':name,value,full:name}));},[filtered]);` |
| `regDist` | `useMemo(()=>{const m={};REGIONS.forEach(r=>m[r]=0);filtered.forEach(b=>m[b.region]++);return Object.entries(m).map(([name,value])=>({name,value}));},[filtered]);` |
| `ratingDist` | `useMemo(()=>{const m={};filtered.forEach(b=>{m[b.rating]=(m[b.rating]\|\|0)+1;});return Object.entries(m).sort().map(([name,value])=>({name,value}));},[filtered]);` |
| `frameDist` | `[];const fMap={};filtered.forEach(b=>{fMap[b.framework]=(fMap[b.framework]\|\|0)+1;});Object.entries(fMap).forEach(([name,value])=>frameDist.push({name,value}));` |
| `verDist` | `[];const vMap={};filtered.forEach(b=>{vMap[b.verifier]=(vMap[b.verifier]\|\|0)+1;});Object.entries(vMap).forEach(([name,value])=>verDist.push({name,value}));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/social-bond/icma-sbp-compliance` | `icma_sbp_compliance` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/use-of-proceeds` | `use_of_proceeds` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/target-population` | `target_population` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/social-kpis` | `social_kpis` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/sdg-alignment` | `sdg_alignment` | api/v1/routes/social_bond.py |
| POST | `/api/v1/social-bond/full-assessment` | `full_assessment` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/project-categories` | `ref_project_categories` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/target-populations` | `ref_target_populations` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/kpi-library` | `ref_kpi_library` | api/v1/routes/social_bond.py |
| GET | `/api/v1/social-bond/ref/sdg-mapping` | `ref_sdg_mapping` | api/v1/routes/social_bond.py |

### 2.3 Engine `social_bond_engine` (services/social_bond_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SocialBondEngine.assess_icma_sbp_compliance` | bond_data | Score the four ICMA Social Bond Principles components. Component weights: Use of Proceeds 30% / Project Evaluation 25% / Management 25% / Reporting 20% Source: ICMA Social Bond Principles June 2023. |
| `SocialBondEngine.assess_use_of_proceeds` | entity_id, bond_name, categories, total_issuance_m | Assess category eligibility, allocation, and excluded activities screen. Source: ICMA SBP 2023 Appendix 1 — eligible project categories. |
| `SocialBondEngine.assess_target_population` | entity_id, bond_name, populations_data, additionality_evidence | Validate target population groups, beneficiary count methodology, additionality, and geographic coverage. Source: ICMA SBP 2023 §2 — Project Evaluation; UN SDG definitions. |
| `SocialBondEngine.score_social_kpis` | entity_id, bond_name, project_category, kpis_list | Score KPI quality: quantified vs qualitative ratio, ICMA alignment, and suggest additional KPIs from the library. Source: ICMA Impact Reporting Handbook 2023; IRIS+ v5.3. |
| `SocialBondEngine.map_sdg_alignment` | entity_id, bond_name, project_categories, kpis | Map project categories and KPIs to SDG goals and targets. Returns SDG matrix, primary/secondary SDG, and contribution score. Source: UN SDG Agenda 2030; ICMA SDG Mapping to SBP 2023. |
| `SocialBondEngine.calculate_impact_score` | bond_data | Composite impact score: ICMA SBP compliance 40% + SDG alignment 25% + KPI quality 25% + additionality 10% |
| `SocialBondEngine.run_full_assessment` | entity_id, bond_data | Orchestrate all social bond sub-assessments. Returns full_result with bond_tier (Gold/Silver/Bronze/Standard). |
| `assess_icma_sbp_compliance` | bond_data | Score all 4 SBP components, compute composite, identify gaps, assign SBP tier (premium/standard/partial/non-compliant). |
| `map_use_of_proceeds` | bond_data | Categorise project activities to ICMA categories, compute eligible %, primary category, check excluded activities. |
| `assess_target_population` | bond_data | Validate target population definition, estimate beneficiary reach, compute geographic coverage score. |
| `score_social_kpis` | bond_data | Check KPI completeness vs library (mandatory categories), quantification rate, SDG alignment, impact measurement method. |
| `compute_sdg_alignment` | bond_data | Map all project activities to SDGs, identify primary SDG, secondary SDGs, compute composite SDG alignment score. |
| `run_full_assessment` | bond_data | Orchestrate all E85 sub-methods and produce consolidated assessment. Produces: sbp_composite_score, sbp_aligned, impact_score, bond_tier, kpis_defined, kpis_quantified, sdg_alignment, primary_sdg, beneficiaries_count. |

**Engine `social_bond_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `ICMA_SBP_COMPONENT_WEIGHTS` | `{'use_of_proceeds': 0.3, 'process_for_project_evaluation': 0.25, 'management_of_proceeds': 0.25, 'reporting': 0.2}` |
| `ICMA_SBP_EXCLUDED_ACTIVITIES` | `['Gambling and gaming facilities', 'Tobacco production and distribution', 'Alcohol production (above threshold)', 'Weapons and defence manufacturing', 'Fossil fuel extraction', 'Forced or child labour supply chains', 'Deforestation or habitat destruction', 'Projects with unmitigated adverse social i` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `recognised`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CATEGORIES`, `ISSUERS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Social Bonds Tracked | — | Bond register | Total social bonds under active impact monitoring. |
| Proceeds Allocated | — | Issuer reports | Cumulative use-of-proceeds allocated to eligible social project categories. |
| Beneficiaries Reached | — | Impact reports | Total individuals benefiting from social bond-financed projects in reporting period. |
- **Issuer allocation reports, ICMA category taxonomy, impact metric data** → Proceeds mapping, impact metric aggregation, outcome scoring → **Social impact reports, beneficiary dashboards, ICMA compliance certificates**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/social-bond/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'total_kpis', 'categories_covered', 'kpis_by_category', 'all_kpis', 'ref'], 'n_keys': 6}`

**GET /api/v1/social-bond/ref/project-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**GET /api/v1/social-bond/ref/sdg-mapping** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/social-bond/ref/target-populations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'data', 'ref'], 'n_keys': 4}`

**POST /api/v1/social-bond/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/social-bond/icma-sbp-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/social-bond/sdg-alignment** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/social-bond/social-kpis** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Impact Score
**Headline formula:** `Σ (Project Allocation × Beneficiary Reach × Outcome Weight) ÷ Total Proceeds`

Weighted composite of project allocations scaled by beneficiary reach and outcome significance, normalised to total proceeds.

**Standards:** ['ICMA SBP', 'IFC Social Bond Guidance']
**Reference documents:** ICMA Social Bond Principles 2023; International Finance Facility for Immunisation (IFFIm) Reporting Standards; IFC Social Bond Guidance 2021; UNPRI Social Outcome Taxonomy

**Engine `social_bond_engine` — extracted transformation lines:**
```python
allocation_gap_m = total_issuance_m - allocated_m
allocation_pct = (allocated_m / total_issuance_m * 100) if total_issuance_m > 0 else 0
eligibility_pct = (eligible_count / max(1, len(categories))) * 100
quantification_rate = (quantified_count / max(1, len(validated_populations))) * 100
overall_kpi_quality = total_score / n
quantification_ratio = (quantified_count / n) * 100
alignment_ratio = (aligned_count / n) * 100
sdg_score = min(100, (sum(sdg_hits.values()) / max(1, len(project_categories) * 5)) * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry states the calculation engine is
> `Social Impact Score = Σ (Project Allocation × Beneficiary Reach × Outcome Weight) ÷ Total Proceeds`.
> **This formula is not implemented anywhere in the code.** Every "impact" figure on the page — beneficiary
> counts, jobs created, housing units, `avgImpact` per category — is an independently-seeded random number
> (`sr(seed)`), not a weighted aggregation of allocation × reach × outcome. What the module actually does is
> **descriptive portfolio analytics** on a synthetic 60-bond universe: issuance/outstanding trends, category
> and region distribution, rating distribution, and a `greenium`/`demandRatio` pricing view. The sections
> below document the code as it behaves.

### 7.1 What the module computes

`BONDS` is an array of 60 synthetic social bonds (`sr(i*3)`…`sr(i*103)` seeded draws) spanning 8 ICMA Social
Bond Principle project categories (affordable housing, healthcare, education, employment, food security,
socioeconomic advancement, financial inclusion, water & sanitation), 39 real-world issuer names (World Bank,
IFC, AfDB, major banks and sovereigns) used purely as a label pool, and 7 regions. Each bond carries amount,
coupon, tenor, spread, rating, beneficiary/jobs/housing/healthcare counts, three boolean framework flags
(`icmaAligned`, `externalReview`, `impactReport`), an SDG tag list, `greenium` (bp), `demandRatio`, and
`useOfProceeds` (% deployed). A parallel `IMPACT_CATS` array independently reseeds funding, project count,
beneficiaries, and an `avgImpact` (0–100) score per category — **not derived from the `BONDS` array**, so the
two tabs (Bond Screener vs Impact Analytics) show internally inconsistent numbers for the same categories.

### 7.2 Parameterisation

| Field | Range / rule | Provenance |
|---|---|---|
| `amount` | $100–3,100M | synthetic |
| `coupon` | 0.5–4.5% | synthetic |
| `rating` | AAA…BBB (8-tier) | synthetic, uniform draw — no correlation to issuer type (sovereign vs corporate) |
| `icmaAligned` | `sr(i*61) > 0.15` → ~85% True | synthetic — encodes an assumed high ICMA-alignment base rate for issuers who choose to badge a bond "social" |
| `greenium` | −2 to +8 bp | synthetic; sign convention: negative = bond priced tighter (more expensive) than a conventional equivalent |
| `avgImpact` (IMPACT_CATS) | 50–90 | synthetic, **unconnected to any beneficiary/funding calculation** |
| `dataQuality` | High/Medium/Low, uniform draw | synthetic label |

### 7.3 Calculation walkthrough

- **KPI strip** (Market Overview tab): `total = Σ amount`, `avgCoup`/`avgTenor` = simple means over the
  filtered bond set, `icma` = count where `icmaAligned` true.
- **Distribution charts**: `catDist`/`regDist`/`ratingDist` are plain `groupBy → count` aggregations over the
  filtered/search-matched bond list — no weighting by amount.
- **Framework tab**: counts of ICMA-aligned, externally reviewed, and impact-reported bonds, plus a mean
  `demandRatio` (oversubscription multiple) — purely descriptive, no scoring formula.
- **Impact Analytics tab**: table and charts of `IMPACT_CATS`, which is a *second, independent* synthetic
  dataset keyed by the same 8 category names but not summed from `BONDS`.

### 7.4 Worked example

For the filtered bond set (all 60, no filters), given seeded values consistent with the code's ranges:

| Step | Computation | Illustrative result |
|---|---|---|
| Total volume | Σ `amount` across 60 bonds, uniform ~$100–3,100M | ≈ **$93,000M** (avg ~$1,550M × 60) |
| Avg coupon | Σ coupon / 60, uniform 0.5–4.5% | ≈ **2.5%** |
| ICMA-aligned count | 60 × P(`sr > 0.15`) ≈ 60 × 0.85 | ≈ **51 bonds** |
| Category distribution | 60 bonds spread ~uniformly over 8 categories | ≈ **7–8 bonds/category** |

These are illustrative expectations of the random-number generator, not values traceable to any specific
bond or real transaction.

### 7.5 Framework compliance fields (as displayed)

| Flag | Rule | Meaning in ICMA SBP terms |
|---|---|---|
| `icmaAligned` | `sr(i*61) > 0.15` | Bond claims ICMA Social Bond Principles alignment |
| `externalReview` | `sr(i*67) > 0.2` | Second-party opinion / external review obtained |
| `impactReport` | `sr(i*71) > 0.25` | Post-issuance impact report published |
| `framework` | one of `ICMA SBP` / `Own Framework` / `National Framework` | which use-of-proceeds framework governs the bond |

None of these flags feed into a computed "compliance score" — the Framework tab only counts and charts them.

### 7.6 Data provenance & limitations

- **The entire 60-bond universe and the 8-category impact table are synthetic**, generated by the platform's
  `sr(seed) = frac(sin(seed+1)×10⁴)` PRNG. Issuer names are real (World Bank, IFC, EIB, major sovereigns and
  banks active in the social bond market) but attached to randomly generated deal terms.
- The guide's headline Social Impact Score formula (allocation × reach × outcome weight ÷ proceeds) has
  **no implementation** — see the mismatch flag above. A user reading the guide would expect a computed
  per-bond or portfolio impact score; none exists.
- `BONDS` and `IMPACT_CATS` are independently seeded, so beneficiary/funding totals shown in the Impact
  Analytics tab cannot be reconciled against the bond-level detail in the Screener tab.
- No SDG-outcome quantification methodology (e.g. IRIS+ metric mapping) is applied to the `sdgs` tag array
  beyond membership.

### 7.7 Framework alignment

- **ICMA Social Bond Principles (2023)** — the 8 project categories and the `framework`/`icmaAligned`/
  `externalReview`/`impactReport` fields track the SBP's four core components (use of proceeds, process for
  project evaluation, management of proceeds, reporting) at a label level; no per-component scoring exists.
- **IFC Social Bond Guidance / UNPRI Social Outcome Taxonomy** — named in the guide as references; not
  operationalised into any metric in the code (categories are ICMA's, not a distinct IFC/UNPRI taxonomy).
- A production build should replace the disconnected `IMPACT_CATS` seed with a genuine aggregation from
  `BONDS` (Σ beneficiaries by category, Σ amount by category) so the two tabs are internally consistent —
  independent of adding a true impact-scoring model (see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support two decisions for fixed-income social-bond investors: (1) **impact-adjusted relative value** — does
a bond's social outcome intensity justify its `greenium` versus a conventional comparable, and (2)
**portfolio impact reporting** — a defensible, auditable aggregate beneficiary/outcome figure for investor
disclosure (SFDR Art.9, UK SDR "Sustainability Impact" label), replacing the currently disconnected
`IMPACT_CATS` seed.

### 8.2 Conceptual approach

Mirror **GIIN IRIS+ metric mapping** (standardised per-category outcome metrics, e.g. "PI4060: Individuals
gaining access to affordable housing") combined with a **counterfactual-adjusted attribution** approach as
used in Impact Management Project (IMP)'s "Contribution" dimension and Harvard Business School's
Impact-Weighted Accounts (monetising social outcomes via shadow prices). This is structurally the same
allocation-weighted approach the guide's formula gestures at, but implemented against real IRIS+ metric
definitions rather than a flat "Outcome Weight" scalar.

### 8.3 Mathematical specification

**Per-bond impact intensity** (beneficiaries per $M deployed, category-normalised):
```
Intensity_bond = (Beneficiaries × UseOfProceeds%) / (Amount × DeployedFraction)
```
**Portfolio impact aggregation** (replacing `IMPACT_CATS`):
```
CategoryBeneficiaries = Σ_{bonds in category} Beneficiaries_i × Weight_i
Weight_i = HoldingAmount_i / Σ HoldingAmount_j     (portfolio-weighted, for investor use)
PortfolioImpactScore = Σ_c ShadowPrice_c × CategoryBeneficiaries_c / Σ HoldingAmount
```
**Impact-adjusted greenium fair value**:
```
FairGreenium = β × Intensity_bond + γ × ExternalReviewFlag + δ × log(IssuerCreditQuality)
```
fitted via cross-sectional OLS on realised primary-market pricing (β, γ, δ estimated from historical deals,
not assumed).

| Parameter | Calibration source |
|---|---|
| IRIS+ metric definitions | GIIN IRIS+ catalogue (public) |
| Shadow prices (`ShadowPrice_c`) | Harvard IWA project public shadow-price tables, or SROI Network ratios |
| β/γ/δ regression coefficients | Fit to historical primary-market social/green bond pricing (Refinitiv/Bloomberg deal data) |

### 8.4 Data requirements

Per-bond use-of-proceeds allocation table (category, $ amount, deployment %), beneficiary counts from
issuer impact reports (already partially seeded as `BONDS` fields — would need real issuer disclosures),
portfolio holdings/weights from the platform's portfolio context, IRIS+ metric crosswalk (new reference
table), shadow-price table (new reference table, sourceable from HBS IWA public data).

### 8.5 Validation & benchmarking plan

Reconcile `PortfolioImpactScore` against issuer-published impact reports for held bonds (spot-check ≥20
issuers/year). Backtest `FairGreenium` regression out-of-sample against realised new-issue concessions.
Compare aggregate beneficiary counts against World Bank/IFC's own published portfolio impact statistics for
sanity-check at the asset-class level.

### 8.6 Limitations & model risk

Beneficiary double-counting across overlapping bonds financing the same underlying project is a known
industry-wide measurement problem (ICMA flags this in SBP guidance); the model should cap category totals
using issuer-level deduplication where multiple bonds share a use-of-proceeds pool. Shadow prices are
inherently contestable — always disclose the price table alongside any monetised figure, and prefer
non-monetised beneficiary counts as the primary investor-facing metric.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the Social Impact Score and reconcile the two tabs on real allocations (analytics ladder: rung 1 → 2)

**What.** The module has a real backend (`social_bond_engine`, 10 routes, with genuine allocation/eligibility/KPI-quality math), but §7 flags that the guide's headline `Social Impact Score = Σ(Allocation × Beneficiary Reach × Outcome Weight) ÷ Total Proceeds` is **not implemented** — every frontend impact figure is an `sr()` draw. Worse, `BONDS` (60 synthetic bonds) and `IMPACT_CATS` (the 8-category impact table) are independently seeded, so the Bond Screener and Impact Analytics tabs show irreconcilable numbers for the same categories, and the lineage sweep records `GET /ref/sdg-mapping` as failed. Evolution A implements the impact formula and single-sources the two tabs.

**How.** (1) Fix the failing `/ref/sdg-mapping` route (triage per the deployment-prep sweep). (2) Implement the Social Impact Score in `social_bond_engine` and expose it via `POST /full-assessment` — allocation × beneficiary reach × outcome weight, normalised to proceeds, with an outcome-weight table sourced from UNPRI/IFC social-outcome taxonomies. (3) Derive `IMPACT_CATS` by aggregating `BONDS` (Σ beneficiaries and Σ amount per category) so the Impact Analytics tab is a `reduce` over the Screener data, not a parallel draw — eliminating the documented inconsistency. (4) Add allocation-report ingestion so use-of-proceeds deployment (`useOfProceeds` %) reflects issuer reports rather than a draw.

**Prerequisites.** Outcome-weight sourcing; the sdg-mapping fix is the gate. **Acceptance:** the two tabs report identical category totals because one derives from the other; the Social Impact Score is computed and reproducible from allocation × reach × weight.

### 9.2 Evolution B — SBP-compliance and impact-report analyst (LLM tier 2)

**What.** A tool-calling analyst over the module's real endpoints: "is this bond ICMA SBP compliant?", "quantify the target-population reach", "draft the investor impact report". It calls `POST /icma-sbp-compliance`, `/target-population`, `/social-kpis`, and `/full-assessment`, narrating the engine's four-core-component assessment (use of proceeds, project evaluation, management of proceeds, reporting) and drafting the IIB/ICMA-aligned impact report from computed figures — never inventing beneficiary counts.

**How.** Tool schemas from the module's OpenAPI operations (6 POST compute + 4 GET ref); grounding corpus = this Atlas record plus the `GET /ref/project-categories`, `/ref/kpi-library`, and `/ref/sdg-mapping` payloads. The impact-report draft routes to the report-studio layer; the no-fabrication validator checks every beneficiary/housing/jobs figure against tool outputs. SBP-compliance verdicts cite the specific core component per finding.

**Prerequisites (hard).** Evolution A — until the impact score exists and the tabs reconcile, an analyst would narrate two contradictory sets of impact numbers, and `/ref/sdg-mapping` fails. **Acceptance:** every quantitative claim in a drafted impact report traces to a tool response; asking for a Social Impact Score before Evolution A returns "not computed," not a number.