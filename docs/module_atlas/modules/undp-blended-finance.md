# UNDP Blended Finance Framework
**Module ID:** `undp-blended-finance` · **Route:** `/undp-blended-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-X4B · **Sprint:** X

## 1 · Overview
Comprehensive UNDP Blended Finance Framework implementation covering all 6 strategic pillars for mobilizing private capital toward SDGs and climate goals in developing countries. Includes leverage calculators, instrument design tools, market intelligence across 8 regions, vehicle structuring (SPV/fund/facility), IRIS+ impact measurement, deal pipeline management, risk matrices, and DFI benchmark analytics. Covers the full blended finance lifecycle from national strategy alignment through deal structuring to impact reporting.

> **Business value:** This module is the definitive tool for structuring, analyzing, and monitoring blended finance transactions aligned with UNDP's framework for mobilizing private capital toward SDGs. It enables practitioners to (1) assess national readiness across 6 strategic pillars, (2) design deal structures with appropriate concessionality and leverage, (3) benchmark against DFI performance, (4) measure impact using IRIS+ standards, and (5) manage deal pipeline from origination to exit. Critical for development finance professionals, DFI investment officers, impact investors, and government officials designing blended finance strategies to close the $4.2T annual SDG financing gap.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AdditionalityScorer`, `CapitalStackOptimizer`, `Card`, `DEAL_SCORING_CRITERIA`, `DFIBenchmark`, `DFI_BENCHMARKS`, `DealBuilder`, `ExtendedIrisCatalog`, `GrantElementCalc`, `INSTRUMENTS`, `ImpactMeasurement`, `InstrumentsLibrary`, `KPI`, `LeverageCalculator`, `MARKETS`, `MarketIntelligence`, `PILLARS`, `PROVIDERS`, `Pill`, `PillarAssessment`, `PortfolioImpactAggregator`, `RISK_FACTORS_DEFAULT`, `RiskMatrix`, `SDG_COLORS_MAP`, `SECTOR_DEAL_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `repYears` | `maturity - grace;` |
| `principalThisYear` | `t > grace && repYears > 0 ? loanAmt / repYears : 0;` |
| `outstanding` | `t > grace && repYears > 0 ? loanAmt - (loanAmt / repYears) * (t - grace - 1) : loanAmt;` |
| `interest` | `outstanding * rate / 100;` |
| `payment` | `principalThisYear + interest;` |
| `totalPV` | `schedule.reduce((s, r) => s + r.pv, 0);` |
| `geClass` | `ge >= 50 ? { label: 'Highly Concessional', color: T.green } : ge >= 25 ? { label: 'Concessional', color: T.amber } : { label: 'Non-Concessional', colo` |
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

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_IRIS`, `CALC_TABS`, `CATEGORIES`, `COLORS`, `DEAL_SCORING_CRITERIA`, `DEAL_SECTORS`, `DFI_BENCHMARKS`, `FACTORS`, `INSTRUMENTS`, `MARKETS`, `PILLARS`, `PROVIDERS`, `RISK_FACTORS_DEFAULT`, `SECTOR_DEAL_DATA`, `SECTOR_OPTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| 6 Strategic Pillars | — | UNDP Blended Finance Framework | Public coordination, policy/regulatory, concessional supply, market development, innovation instruments, knowl |
| Maturity Assessment | — | UNDP Framework | Each pillar scored from No Strategy/Ad Hoc → Awareness → Planning → Implementation → Scaling/Market-Standard |
| Leverage Ratio | `TotalMobilized / ConcessionalDeployed` | Convergence Database | Climate infrastructure averages 5-8x; adaptation 1-3x; social sectors 2-4x. Higher ratios indicate more effici |
| Catalytic Ratio | `PrivateCapital / PublicCapital` | OECD-DAC | Measures how much private capital each dollar of public/concessional capital mobilizes. DFI target: minimum $3 |
| Market Intelligence | — | Convergence/OECD | Sub-Saharan Africa, South Asia, East Asia & Pacific, Latin America & Caribbean, MENA, Eastern Europe & Central |
| Blended Instruments | — | Convergence Taxonomy | First-Loss Guarantee, Subordinated Debt/Equity, Technical Assistance, Results-Based Finance, Concessional Loan |
| Vehicle Types | — | UNDP/IFC | SPV (Special Purpose Vehicle), Pooled Fund, DFI Facility, Syndication Platform — each with governance structur |
| IRIS+ Impact Metrics | — | GIIN IRIS+ | Lives improved, tCO2e avoided, MW installed, hectares protected, jobs created, SMEs financed — aligned with SD |
| Deal Pipeline | — | Internal tracking | Origination → Screening → Due Diligence → Structuring → IC Approval → Closing → Disbursement → Monitoring → Ex |
| Risk Matrix | — | UNDP Risk Framework | Market Risk, Credit/Counterparty Risk, Political/Regulatory Risk, Currency/FX Risk, Climate/Environmental Risk |
| DFI Benchmarks | — | DFI annual reports | IFC, AfDB, ADB, EBRD, EIB, KfW, FMO, CDC, Proparco, JICA — leverage ratios, portfolio size, climate allocation |
| Concessionality Calculator | `GrantElement = (FaceValue - PV_Repayments) / FaceValue` | OECD-DAC | Calculates the grant element (concessionality level) of a loan facility based on interest rate, grace period,  |
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
**Standards:** ['UNDP Blended Finance Framework', 'OECD-DAC Total Official Support', 'Convergence Database', 'GCF Investment Framework', 'IRIS+ by GIIN', 'IFC Operating Principles for Impact Management']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).