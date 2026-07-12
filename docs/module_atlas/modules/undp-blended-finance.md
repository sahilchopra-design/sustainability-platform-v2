# UNDP Blended Finance Framework
**Module ID:** `undp-blended-finance` · **Route:** `/undp-blended-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-X4B · **Sprint:** X

## 1 · Overview
Comprehensive UNDP Blended Finance Framework implementation covering all 6 strategic pillars for mobilizing private capital toward SDGs and climate goals in developing countries. Includes leverage calculators, instrument design tools, market intelligence across 8 regions, vehicle structuring (SPV/fund/facility), IRIS+ impact measurement, deal pipeline management, risk matrices, and DFI benchmark analytics. Covers the full blended finance lifecycle from national strategy alignment through deal structuring to impact reporting.

> **Business value:** This module is the definitive tool for structuring, analyzing, and monitoring blended finance transactions aligned with UNDP's framework for mobilizing private capital toward SDGs. It enables practitioners to (1) assess national readiness across 6 strategic pillars, (2) design deal structures with appropriate concessionality and leverage, (3) benchmark against DFI performance, (4) measure impact using IRIS+ standards, and (5) manage deal pipeline from origination to exit. Critical for development finance professionals, DFI investment officers, impact investors, and government officials designing blended finance strategies to close the $4.2T annual SDG financing gap.

**How an analyst works this module:**
- Start at the 6-Pillar Framework tab to understand the UNDP strategic structure — click each pillar card to expand subsections, indicators, and maturity levels
- Use the Calculators tab to model leverage ratios and IRR: adjust concessional %, first-loss size, and instrument type to see how blended structures affect returns
- Explore Market Intelligence to compare blended finance activity across 8 developing regions — filter by sector, instrument type, and deal size
- In the Instruments tab, review the 6 core blended finance instrument types with their risk-sharing mechanisms and typical investor profiles
- Use Vehicle Structuring to compare SPV, pooled fund, DFI facility, and syndication architectures with their governance and waterfall structures
- The Impact (IMM) tab provides IRIS+ aligned metrics — connect deal pipeline outcomes to SDG indicators and track lives improved, tCO2e avoided
- Pipeline tab shows active deal flow from origination through exit — use stage filters to identify bottlenecks and conversion rates
- Risk Matrix provides a comprehensive L/M/H risk assessment framework covering market, credit, political, currency, and climate risks with mitigation instruments per category
- DFI Benchmarks compares performance across 10+ development finance institutions including leverage ratios, climate allocation, and blended finance portfolio share

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AdditionalityScorer`, `CapitalStackOptimizer`, `Card`, `DEAL_SCORING_CRITERIA`, `DFIBenchmark`, `DFI_BENCHMARKS`, `DealBuilder`, `ExtendedIrisCatalog`, `GrantElementCalc`, `INSTRUMENTS`, `ImpactMeasurement`, `InstrumentsLibrary`, `KPI`, `LeverageCalculator`, `MARKETS`, `MarketIntelligence`, `PILLARS`, `PROVIDERS`, `Pill`, `PillarAssessment`, `PortfolioImpactAggregator`, `RISK_FACTORS_DEFAULT`, `RiskMatrix`, `SDG_COLORS_MAP`, `SECTOR_DEAL_DATA`, `ScenarioAnalysis`, `SectionHeader`, `TABS`, `Tab`, `VEHICLES`, `VehicleStructures`, `YEAR_DEAL_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PILLARS` | 24 | `icon`, `color`, `lightColor`, `title`, `subtitle`, `subsections`, `id`, `description` |
| `INSTRUMENTS` | 11 | `name`, `category`, `pillar`, `risk`, `cost`, `provider`, `description`, `leverage`, `concessionality`, `useCase` |
| `MARKETS` | 13 | `region`, `transactions`, `financing`, `topSector`, `mainDFI`, `avgLeverage` |
| `VEHICLES` | 9 | `name`, `type`, `country`, `size`, `implementing`, `ministry`, `focus`, `instruments`, `leverage`, `quadrant` |
| `PROVIDERS` | 11 | `type`, `commitments`, `volume`, `regions` |
| `YEAR_DEAL_DATA` | 10 | `deals`, `volume`, `avgLeverage` |
| `SECTOR_DEAL_DATA` | 9 | `deals`, `volume`, `avgLev`, `avgConc` |
| `RISK_FACTORS_DEFAULT` | 10 | `category`, `name`, `probability`, `impact`, `mitigation`, `mitigated` |
| `DEAL_SCORING_CRITERIA` | 9 | `category`, `label`, `weight` |
| `DFI_BENCHMARKS` | 7 | `region`, `avgLeverage`, `avgConcPct`, `climate`, `minProjectSize`, `sectors` |
| `FACTORS` | 10 | `label`, `weight`, `desc` |
| `CALC_TABS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `repYears` | `maturity - grace;` |
| `principalThisYear` | `t > grace && repYears > 0 ? loanAmt / repYears : 0;` |
| `outstanding` | `t > grace && repYears > 0 ? loanAmt - (loanAmt / repYears) * (t - grace - 1) : loanAmt;` |
| `interest` | `outstanding * rate / 100;` |
| `payment` | `principalThisYear + interest;` |
| `totalPV` | `schedule.reduce((s, r) => s + r.pv, 0);` |
| `geClass` | `ge >= 50 ? { label: 'Highly Concessional', color: T.green } : ge >= 25 ? { label: 'Concessional', color: T.amber } : { label: 'Non-Concessional', color: T.red };` |
| `composite` | `FACTORS.reduce((s, f) => s + (scores[f.key] / 10) * f.weight, 0);` |
| `radarData` | `FACTORS.map(f => ({ factor: f.label.split(' ').slice(0,2).join(' '), score: scores[f.key], fullMark: 10 }));` |
| `conc` | `Math.min(80, baseConcPct * concMult);` |
| `comm` | `Math.max(0, 100 - conc - grant + commDelta);` |
| `pub` | `(conc + grant) / 100 * totalSize;` |
| `leverage` | `pub > 0 ? (comm / 100 * totalSize) / pub : 0;` |
| `mobilization` | `pub > 0 ? totalSize / pub : 0;` |
| `confidence` | `mktConfidence / 100;` |
| `optWeight` | `Math.min(confidence * 2, 1);` |
| `stressWeight` | `Math.min((1 - confidence) * 2, 1);` |
| `stressed` | `buildScenario(1.3, -15, 'Stressed',   T.amber);` |
| `blendedLev` | `optimistic.leverage * optWeight * 0.33 + base.leverage * 0.34 + stressed.leverage * stressWeight * 0.33;` |
| `SECTOR_OPTS` | `['Renewable Energy','Infrastructure','MSME Finance','Agriculture','Climate Adaptation','Healthcare','NBS/Forestry'];` |
| `mid` | `(lo + hi) / 2;` |
| `lev` | `pub > 0 ? comm / pub : 0;` |
| `publicInput` | `(concPct + grantPct) / 100 * totalSize;` |
| `guaranteeExposure` | `guaranteePct / 100 * totalSize;` |
| `commercialCapital` | `totalSize - publicInput;` |
| `leverageRatio` | `publicInput > 0 ? (commercialCapital / publicInput) : 0;` |
| `blendingRatio` | `publicInput / totalSize;` |
| `mobilizationRatio` | `totalSize / Math.max(publicInput, 1);` |
| `minConcessionality` | `Math.max(0, publicInput - (totalSize * 0.05));` |
| `totalScore` | `Object.values(scores).reduce((s, v) => s + v, 0);` |
| `maxScore` | `PILLARS.length * 4;` |
| `maturityPct` | `(totalScore / maxScore) * 100;` |
| `categories` | `['All', ...new Set(INSTRUMENTS.map(i => i.category))];` |
| `leverageData` | `INSTRUMENTS.map(i => ({ name: i.name.split(' ').slice(0, 2).join(' '), leverage: i.leverage, category: i.category }));` |
| `totalTx` | `MARKETS.reduce((s, m) => s + m.transactions, 0);` |
| `totalVol` | `MARKETS.reduce((s, m) => s + m.financing, 0);` |
| `avgLev` | `MARKETS.reduce((s, m) => s + m.avgLeverage, 0) / MARKETS.length;` |
| `barData` | `[...MARKETS].sort((a, b) => b.financing - a.financing).slice(0, 10).map(m => ({` |
| `providerData` | `PROVIDERS.map(p => ({ name: p.name, commitments: p.commitments, volume: p.volume, type: p.type }));` |
| `defaultDeal` | `{ name: '', country: '', sector: 'Renewable Energy', totalSize: 50, concPct: 25, grantPct: 8, guaranteePct: 10, vehicle: 'Local DFI-Led', sdgs: [7, 13], status: 'Structuring', notes: '' };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_IRIS`, `CALC_TABS`, `CATEGORIES`, `COLORS`, `DEAL_SCORING_CRITERIA`, `DEAL_SECTORS`, `DFI_BENCHMARKS`, `FACTORS`, `INSTRUMENTS`, `MARKETS`, `PILLARS`, `PROVIDERS`, `RISK_FACTORS_DEFAULT`, `SECTOR_DEAL_DATA`, `SECTOR_OPTS`, `STATUSES`, `TABS`, `VEHICLES`, `YEAR_DEAL_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 6 Strategic Pillars | — | UNDP Blended Finance Framework | Public coordination, policy/regulatory, concessional supply, market development, innovation instruments, knowledge & capacity — each with subsections, indicators, and maturity levels |
| Maturity Assessment | — | UNDP Framework | Each pillar scored from No Strategy/Ad Hoc → Awareness → Planning → Implementation → Scaling/Market-Standard |
| Leverage Ratio | `TotalMobilized / ConcessionalDeployed` | Convergence Database | Climate infrastructure averages 5-8x; adaptation 1-3x; social sectors 2-4x. Higher ratios indicate more efficient use of scarce concessional resources |
| Catalytic Ratio | `PrivateCapital / PublicCapital` | OECD-DAC | Measures how much private capital each dollar of public/concessional capital mobilizes. DFI target: minimum $3 private per $1 concessional |
| Market Intelligence | — | Convergence/OECD | Sub-Saharan Africa, South Asia, East Asia & Pacific, Latin America & Caribbean, MENA, Eastern Europe & Central Asia, Pacific SIDS, Global — each with transaction count, financing volume, top sectors, avg deal size |
| Blended Instruments | — | Convergence Taxonomy | First-Loss Guarantee, Subordinated Debt/Equity, Technical Assistance, Results-Based Finance, Concessional Loans, Design-Stage Grants — each with risk-sharing mechanism and investor profile |
| Vehicle Types | — | UNDP/IFC | SPV (Special Purpose Vehicle), Pooled Fund, DFI Facility, Syndication Platform — each with governance structure, investor waterfall, fee model |
| IRIS+ Impact Metrics | — | GIIN IRIS+ | Lives improved, tCO2e avoided, MW installed, hectares protected, jobs created, SMEs financed — aligned with SDG indicator framework |
| Deal Pipeline | — | Internal tracking | Origination → Screening → Due Diligence → Structuring → IC Approval → Closing → Disbursement → Monitoring → Exit — with conversion rates and avg timeline |
| Risk Matrix | — | UNDP Risk Framework | Market Risk, Credit/Counterparty Risk, Political/Regulatory Risk, Currency/FX Risk, Climate/Environmental Risk — each scored L/M/H with mitigation instruments |
| DFI Benchmarks | — | DFI annual reports | IFC, AfDB, ADB, EBRD, EIB, KfW, FMO, CDC, Proparco, JICA — leverage ratios, portfolio size, climate allocation %, blended finance share |
| Concessionality Calculator | `GrantElement = (FaceValue - PV_Repayments) / FaceValue` | OECD-DAC | Calculates the grant element (concessionality level) of a loan facility based on interest rate, grace period, maturity, and discount rate — ensuring minimum concessionality compliance |
- **NDC/SDG financing gap assessment** → UNDP 6-Pillar strategic alignment → **Priority sectors and intervention points for blended finance**
- **DFI capital commitments & ODA flows** → Minimum concessionality analysis → **Optimal concessional allocation per deal tranche**
- **Convergence deal database & OECD-DAC** → Market intelligence aggregation → **Regional blended finance landscape with transaction benchmarks**
- **Instrument design parameters (FLG %, tenor, rate)** → Leverage ratio calculator → **Modeled private capital mobilization and blended IRR**
- **Vehicle structure templates (SPV/Fund/Facility)** → Waterfall cash flow modeling → **Investor-class returns and first-loss absorption capacity**
- **IRIS+ metric selection & deal outcomes** → Impact attribution methodology → **SDG-aligned impact reporting: lives, tCO2e, MW, ha, jobs**
- **Pipeline deal flow (origination → exit)** → Stage-gate conversion analysis → **Bottleneck identification and portfolio-level KPIs**
- **Risk assessment (market/credit/political/FX/climate)** → Mitigation instrument mapping → **Residual risk profile and instrument recommendation per deal**

## 5 · Intermediate Transformation Logic
**Methodology:** UNDP 6-Pillar Blended Finance + OECD-DAC Leverage Ratio
**Headline formula:** `LeverageRatio = TotalMobilized / ConcessionalDeployed; CatalyticRatio = PrivateCapital / PublicCapital; IRR_Blended = Σ(CFt / (1+r)^t) where CFt includes concessional terms`

The module implements UNDP's 6-pillar approach: (1) Public Sector Coordination — maps NDC/SDG financing gaps and inter-agency roles; (2) Policy & Regulatory Environment — legal frameworks for PPPs, SPVs, green taxonomy, carbon pricing; (3) Supply & Deployment of Concessional Capital — DFI commitments, minimum concessionality principle, transparent pipeline mapping; (4) Market Development — domestic institutional capital mobilization, blended finance ecosystem building; (5) Innovation & Impact Instruments — guarantees, first-loss tranches, results-based finance, outcome bonds; (6) Knowledge & Capacity Building — south-south learning, practitioner training, evidence base. The calculator engine computes leverage ratios (typically 3-8x for climate, 1-3x for adaptation), blended IRR under different tranche structures, first-loss absorption capacity, and IRIS+ impact metrics (lives improved, tCO2e avoided, MW installed).

**Standards:** ['UNDP Blended Finance Framework', 'OECD-DAC Total Official Support', 'Convergence Database', 'GCF Investment Framework', 'IRIS+ by GIIN', 'IFC Operating Principles for Impact Management']
**Reference documents:** UNDP (2018) "A Framework to Unleash the Power of Blended Financing for the SDGs"; UNDP (2022) "Blended Finance in the Least Developed Countries"; Convergence (2023) "State of Blended Finance Report"; OECD-DAC (2024) "Blended Finance Principles for Unlocking Commercial Finance for SDGs"; IFC (2020) "Operating Principles for Impact Management"; GCF (2023) "Investment Framework: Private Sector Facility"; GIIN (2024) "IRIS+ System: Metrics for Impact Investors"; Climate Policy Initiative (2023) "Global Landscape of Climate Finance"; Brookings (2022) "Billions to Trillions: Transforming Development Finance"; UNCTAD (2023) "World Investment Report: SDG Investment Trends"

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is a large (2,160-line), multi-tool module implementing the UNDP's real 6-pillar blended
finance framework alongside several **genuinely correct financial calculators** — a notable
departure from the mostly-decorative PRNG dashboards seen elsewhere in this batch. Three formulas
stand out as faithful implementations of real development-finance methodology:

```
Grant Element (OECD-DAC) = (1 − PV(repayment schedule) / FaceValue) × 100     // discounted at 10% (OECD-DAC standard)
Leverage Ratio            = CommercialCapital / PublicInput
Mobilization Ratio         = TotalDealSize / PublicInput
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| Grant Element discount rate | **10% fixed** | Matches the **actual official OECD-DAC discount rate** used to compute grant element for ODA-eligible loans — a precise, correct real-world calibration |
| GE classification bands | Highly Concessional ≥50%, Concessional ≥25% (ODA threshold), Non-Concessional <25% | The 25% threshold is the **real OECD-DAC minimum grant-element requirement** for a loan to count as Official Development Assistance |
| `PILLARS` (24 rows across 6 UNDP pillars) | Public Sector Coordination, Policy & Regulatory Environment, Concessional Capital Supply, Market Development, Innovation & Impact Instruments, Knowledge & Capacity | Faithful to UNDP's real published 6-pillar Blended Finance Framework structure |
| `INSTRUMENTS` (11) | First-Loss Guarantee, Subordinated Debt/Equity, Technical Assistance, Results-Based Finance, Concessional Loans, Design-Stage Grants, etc., each with `leverage` and `concessionality` | Real Convergence-style blended-finance instrument taxonomy |
| `MARKETS` (13 regions) | Transaction count, financing volume, top sector, main DFI, average leverage | Illustrative regional benchmarks; DFI names (IFC, AfDB, ADB, EBRD, EIB, KfW, FMO, CDC, Proparco, JICA per the guide) are real institutions |
| `DFI_BENCHMARKS` (7) | Region, avg leverage, avg concessionality %, climate focus, min project size | Illustrative, directionally plausible per-region DFI performance figures |
| `FACTORS` (10, deal-scoring) | Weighted criteria for the composite deal-quality score | Platform-defined weighting scheme |

### 7.3 Calculation walkthrough

1. **Grant Element Calculator**: builds a full amortisation schedule (grace period + equal
   principal repayment thereafter), computes interest on the declining outstanding balance, and
   discounts every cash flow at the fixed 10% OECD-DAC rate — a textbook-correct implementation of
   the real DAC grant-element methodology, not a shortcut approximation.
2. **Leverage/Mobilization calculators** (2 separate implementations appear in the file — one in a
   scenario-blending tool, one in a benchmark-comparison tool): both correctly divide commercial
   capital mobilised by the public/concessional capital deployed, consistent with the real
   OECD-DAC/Convergence definitions of leverage and mobilization ratios.
3. **Scenario blending** (`blendedLev`): combines optimistic/base/stressed leverage estimates using
   confidence-weighted averaging (`optWeight=min(2×confidence,1)`, `stressWeight=min(2×(1−confidence),1)`,
   each scenario contributing ~1/3 base weight) — a reasonable heuristic for scenario blending, though
   the specific weighting scheme is a platform design choice rather than a named statistical method.
4. **Deal scoring composite**: `Σ (score_i/10) × weight_i` across the `FACTORS` criteria — a standard
   weighted-average scoring rubric.
5. **DFI benchmark comparison**: flags whether a proposed deal's leverage ratio meets or exceeds the
   selected region's DFI benchmark (`leverageOk = leverageRatio >= bench.leverage`).

### 7.4 Worked example (Grant Element Calculator, defaults: $100M loan, 3% rate, 3yr grace, 15yr maturity)

| Year(s) | Payment structure | 
|---|---|
| 1–3 (grace) | Interest-only: `100 × 3% = $3.0M/yr` |
| 4–15 (12yr amortisation) | Principal `$100M/12 = $8.33M/yr` + declining-balance interest |

```
Total PV of all 15 payments (discounted at 10%) = $59.86M
Grant Element = (1 − 59.86/100) × 100 = 40.1%
Classification: 40.1% ≥ 25% → "Concessional" (but below the 50% "Highly Concessional" threshold)
```

This is a genuinely correct application of the OECD-DAC methodology: a below-market 3% loan with a
grace period, discounted at the DAC's 10% reference rate, correctly registers as moderately
concessional (comfortably above the 25% ODA-eligibility floor).

### 7.5 Companion analytics

- **Vehicle Structuring tab** — 4 vehicle types (SPV, Pooled Fund, DFI Facility, Syndication
  Platform) with governance/fee-model comparison, consistent with real blended-finance vehicle
  design practice.
- **IRIS+ Impact Measurement tab** — 19 real IRIS+ metric definitions (GIIN taxonomy) with unit and
  methodology per metric.
- **Deal Pipeline tab** — origination-to-exit stage tracking with conversion-rate analysis.
- **Risk Matrix tab** — 5-category (Market/Credit/Political/Currency/Climate) L/M/H risk framework
  with mitigation-instrument mapping.

### 7.6 Data provenance & limitations

- **The Grant Element and Leverage/Mobilization calculators are the module's strongest assets** —
  correctly implemented, named-standard financial methodology (OECD-DAC grant element at the
  official 10% discount rate; Convergence-consistent leverage/mobilization definitions).
- **Regional market intelligence, DFI benchmarks, and instrument-level figures are illustrative**,
  not live-sourced from the Convergence database or DFI annual reports despite being presented
  alongside genuinely correct calculators — a user should not treat the 13-region `MARKETS` table
  or `DFI_BENCHMARKS` as current market data.
- Scenario-blending confidence weights (`optWeight`/`stressWeight`) are a platform heuristic, not a
  named probabilistic scenario-weighting methodology (e.g. not a formal Bayesian blend).
- Deal-scoring composite weights are platform-defined and not benchmarked against any external
  DFI investment-committee scoring rubric.

### 7.7 Framework alignment

- **OECD-DAC Grant Element methodology**: correctly implemented at the real 10% discount rate with
  the real 25%/50% concessionality thresholds — this module can be trusted as a genuine grant-element
  calculator, unlike many other "concessionality" claims across the platform that are decorative.
- **UNDP Blended Finance Framework (2018/2022)**: the 6-pillar structure and maturity-level scoring
  (No Strategy→Awareness→Planning→Implementation→Scaling) are faithful to UNDP's actual published
  framework.
- **Convergence blended-finance taxonomy**: instrument types, leverage/mobilization ratio
  definitions, and regional benchmarking structure are consistent with Convergence's real State of
  Blended Finance reporting conventions.
- **GIIN IRIS+**: the 19-metric impact taxonomy (lives improved, tCO2e avoided, MW installed,
  hectares protected, jobs created, SMEs financed) matches real IRIS+ metric categories.
- **GCF Investment Framework**: referenced for private-sector-facility concessionality guidance;
  not independently modelled as a distinct calculation.

## 9 · Future Evolution

### 9.1 Evolution A — Persisted deal engine with live Convergence-class benchmarks (analytics ladder: rung 2 → 3)

**What.** This module already computes real methodology — §7.6 singles out the
OECD-DAC grant-element calculator (correct 10% discount rate, real 25%/50% thresholds)
and the leverage/mobilization ratios as its strongest assets, and the scenario blender
gives genuine what-if capability. What's missing is calibration and persistence: the
13-region `MARKETS` table and 7-row `DFI_BENCHMARKS` are illustrative constants, the
DealBuilder's pipeline lives only in component state, and all 2,160 lines are frontend
(Tier B, EP-X4B). Evolution A builds the backend vertical: `blended_finance_engine`
exposing `POST /grant-element`, `POST /capital-stack`, and CRUD on a new
`bf_deals` table so pipelines survive reload, plus a benchmarks refresh path that
replaces the hand-set regional figures with sourced vintages (Convergence State of
Blended Finance annual data, DFI annual-report leverage disclosures) carrying
`as_of` provenance fields.

**How.** Port the amortisation-schedule grant-element math server-side verbatim and
pin the §7.4 worked example ($100M/3%/3yr grace/15yr → GE 40.1%) in `bench_quant`;
Alembic migration for `bf_deals` and `bf_benchmarks`; frontend calculators call the
engine and fall back to local math offline.

**Prerequisites.** Benchmark sourcing is manual-curation-first (Convergence has no
free API); provenance labels required so illustrative rows can't masquerade as
sourced ones. **Acceptance:** bench pin reproduces GE 40.1% exactly; a saved deal
survives reload; every benchmark row displays source + vintage.

### 9.2 Evolution B — Deal-structuring copilot across the six calculators (LLM tier 2)

**What.** The module is really six tools (grant element, leverage, capital-stack
optimizer, additionality scorer, scenario blender, deal scorer) that practitioners use
in sequence — an ideal tool-calling target. The copilot handles requests like
"structure a $75M Kenya solar deal that stays ODA-eligible with minimum
concessionality and beats the Sub-Saharan DFI leverage benchmark": it iterates
`POST /grant-element` and `POST /capital-stack` calls, checks the result against
`DFI_BENCHMARKS` via the engine's comparison route, and returns the tranche structure
with each figure sourced from a tool call — including flagging when a requested
structure falls below the 25% grant-element ODA floor.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; system
prompt grounded in this Atlas page, §7.2's provenance table included so the copilot
distinguishes the correctly-implemented DAC math from the illustrative market tables
and says so when asked about regional data currency. The 10-factor additionality
rubric is narrated, with the caveat (per §7.6) that its weights are platform-defined,
not an external IC standard.

**Prerequisites (hard).** Evolution A endpoints — there is no backend today; the
no-fabrication validator wired in before launch. **Acceptance:** for the structuring
request above, every tranche percentage and GE figure traces to a tool call; a
structure with GE 24% is flagged as non-ODA-eligible, matching the engine's own
classification bands.