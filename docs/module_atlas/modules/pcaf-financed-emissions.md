# PCAF Financed Emissions
**Module ID:** `pcaf-financed-emissions` · **Route:** `/pcaf-financed-emissions` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Full PCAF Standard implementation for 5 asset classes: listed equity, corporate bonds, project finance, commercial real estate, mortgages. Computes financed emissions with PCAF data quality score 1-5.

> **Business value:** The PCAF Standard is the mandatory framework for financial institutions disclosing Scope 3 Category 15 financed emissions. Required for TCFD, ISSB S2, CSRD, and net-zero alliance reporting. Enables target-setting for portfolio decarbonisation.

**How an analyst works this module:**
- Dashboard shows total financed emissions by asset class
- Attribution Factors explains methodology per asset class
- WACI Benchmark compares to SBTi sector targets
- DQ Heatmap shows data quality across portfolio
- Company Drill-Down shows per-holding attribution

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AC_COLORS`, `ALL_ASSET_CLASSES`, `ASSET_CLASS_DEFS`, `AddPositionModal`, `AuditTrailTab`, `BASE_POSITIONS`, `Badge`, `COUNTRY_EMISSIONS`, `COUNTRY_PPP_GDP`, `Card`, `DOWNSTREAM_MODULES`, `DQS_COLOR`, `DQS_DEFINITIONS`, `DQS_IMPROVEMENT_STEPS`, `DataQualityTab`, `DownstreamTab`, `FACILITATED_DEALS`, `FormulaEngineTab`, `INITIAL_POSITIONS`, `INSURANCE_LOB`, `InfoBox`, `KPICard`, `PCAF_FORMULAS`, `PIE_COLORS`, `PartATab`, `PartBTab`, `PartCTab`, `QUARTERLY_DQS`, `ReferenceDataTab`, `SECTOR_MEDIAN_EVIC`, `SectionHeader`, `TABS`, `TabBar`, `YOY_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_CLASS_DEFS` | 13 | `ch`, `formula`, `denom`, `note`, `dqsRange`, `scopeGuidance`, `dataHierarchy` |
| `INSURANCE_LOB` | 9 | `id`, `lob`, `subLob`, `premiumM`, `claimsM`, `exposureM`, `efPerPremium`, `efSource`, `dqs`, `notes`, `methodology`, `riskFactors` |
| `FACILITATED_DEALS` | 8 | `id`, `type`, `client`, `sector`, `dealSizeM`, `underwrittenM`, `clientScope1`, `clientScope2`, `clientScope3`, `attrFormula`, `citation`, `dqs`, `year`, `bookRunner`, `peerGroup` |
| `YOY_DATA` | 7 | `year`, `fe`, `waci`, `dqs`, `coverage`, `scope1Pct`, `scope2Pct`, `scope3Pct`, `positions` |
| `PCAF_FORMULAS` | 11 | `id`, `name`, `section`, `formula`, `latex` |
| `DOWNSTREAM_MODULES` | 9 | `module`, `field`, `description`, `format`, `regulation`, `inputFields`, `frequency` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_CDP_PCAF` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.name?.toLowerCase(),c]));` |
| `_CDP_TICKER_PCAF` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[c.ticker?.toLowerCase(),c]));` |
| `_INDIA_PCAF` | `isIndiaMode() ? adaptForPCAF().slice(0, 30).map((c, i) => ({` |
| `tpc` | `p.projectCost\|\|p.outstanding*2.5;` |
| `tbs` | `p.totalBondSize\|\|p.outstanding*10;` |
| `totalEmissions` | `(p.scope1\|\|0)+(p.scope2\|\|0);` |
| `totalWithScope3` | `totalEmissions+(p.scope3\|\|0);` |
| `financedEmissions` | `+(attrFactor*totalEmissions).toFixed(0);` |
| `financedScope3` | `+(attrFactor*(p.scope3\|\|0)).toFixed(0);` |
| `adjustedDqs` | `evicWarning?Math.max(p.dqs,4):p.dqs;` |
| `revenueM` | `p.evic ? p.evic * revMultiple : (SECTOR_MEDIAN_EVIC[p.sector] \|\| 50) * revMultiple;` |
| `waci` | `revenueM>0?(totalEmissions/revenueM):0;` |
| `carbonIntensity` | `p.outstanding>0?financedEmissions/p.outstanding:0;` |
| `scope1Pct` | `totalEmissions>0?(p.scope1\|\|0)/totalEmissions:0;` |
| `scope2Pct` | `totalEmissions>0?(p.scope2\|\|0)/totalEmissions:0;` |
| `INITIAL_POSITIONS` | `BASE_POSITIONS.map(computeRow);` |
| `showProjectCost` | `['Project Finance','Use-of-Proceeds'].includes(form.assetClass);` |
| `totalFE` | `useMemo(()=>positions.reduce((s,p)=>s+p.financedEmissions,0),[positions]);` |
| `totalFEScope3` | `useMemo(()=>positions.reduce((s,p)=>s+p.financedScope3,0),[positions]);` |
| `totalOut` | `useMemo(()=>positions.reduce((s,p)=>s+p.outstanding,0),[positions]);` |
| `avgDqs` | `useMemo(()=>positions.length?(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2):'—',[positions]);` |
| `carbonFootprint` | `useMemo(()=>totalOut>0?totalFE/(totalOut/1000):0,[totalFE,totalOut]);` |
| `carbonCostM` | `useMemo(()=>(totalFE*carbonPrice/1e6).toFixed(1),[totalFE,carbonPrice]);` |
| `byAC` | `useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,count:0,fe:0,out:0,avgDqs:0,totalDqs:0};const e=m[p.assetClass];e.count++;e.fe+=p.financedEmissions;e.out+=p.outstanding;e.totalDqs+=p.dqs;});Object.values(m).forEach(v=>v.avgDqs=+(v.totalDqs/v.count).toFixed(1));return Object.values(m).sort` |
| `bySector` | `useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.sector])m[p.sector]={sector:p.sector,fe:0,count:0};m[p.sector].fe+=p.financedEmissions;m[p.sector].count++;});return Object.values(m).sort((a,b)=>b.fe-a.fe).slice(0,1` |
| `top10` | `useMemo(()=>[...positions].sort((a,b)=>b.financedEmissions-a.financedEmissions).slice(0,10),[positions]);` |
| `updated` | `{...p,outstanding:+editDraft.outstanding,evic:editDraft.evicOverride?+editDraft.evicOverride:null,scope1:+editDraft.scope1,scope2:+(editDraft.scope2\|\|0),scope3:+(editDraft.scope3\|\|0),dqs:+editDraft.dqs};` |
| `csv` | `[keys.join(','),...positions.map(r=>keys.map(k=>{let v=r[k];if(typeof v==='number')return v;return`"${String(v\|\|'').replace(/"/g,'""')}"`;}).join(','))].join('\n');` |
| `totalPremium` | `useMemo(()=>lobData.reduce((s,l)=>s+l.premiumM,0),[lobData]);` |
| `totalClaims` | `useMemo(()=>lobData.reduce((s,l)=>s+l.claimsM,0),[lobData]);` |
| `totalExposure` | `useMemo(()=>lobData.reduce((s,l)=>s+l.exposureM,0),[lobData]);` |
| `lobFE` | `useMemo(()=>lobData.map(l=>({lob:l.lob,fe:Math.round(l.premiumM*l.efPerPremium),premium:l.premiumM,intensity:(l.efPerPremium).toFixed(2)})),[lobData]);` |
| `lossRatio` | `useMemo(()=>(totalPremium ? totalClaims/totalPremium*100 : 0).toFixed(1),[totalClaims,totalPremium]);` |
| `dealData` | `useMemo(()=>deals.map(d=>{const attr=d.underwrittenM>0?d.underwrittenM/d.dealSizeM:(d.type==='Advisory M&A'?0.10:0);const clientEM=(d.clientScope1\|\|0)+(d.clientScope2\|\|0);return{...d,attrFactor:attr,clientEM,facilitatedE` |
| `totalFac` | `useMemo(()=>dealData.reduce((s,d)=>s+d.facilitatedEm,0),[dealData]);` |
| `totalDeals` | `useMemo(()=>deals.reduce((s,d)=>s+d.dealSizeM,0),[deals]);` |
| `totalUW` | `useMemo(()=>deals.reduce((s,d)=>s+d.underwrittenM,0),[deals]);` |
| `byDqs` | `useMemo(()=>{const g={1:[],2:[],3:[],4:[],5:[]};positions.forEach(p=>g[p.dqs].push(p));return g;},[positions]); const currentAvg=(positions.length ? positions.reduce((s,p)=>s+p.dqs,0)/positions.length : 0).toFixed(2);` |
| `simulatedAvg` | `useMemo(()=>{let t=0;positions.forEach(p=>{t+=Math.min(p.dqs,targetDqs[p.assetClass]\|\|p.dqs);});return(positions.length ? t/positions.length : 0).toFixed(2);},[positions,targetDqs]);` |
| `dqsByAC` | `useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,avg:0,n:0,t:0};m[p.assetClass].t+=p.dqs;m[p.assetClass].n++;});Object.values(m).forEach(v=>v.avg=+(v.t/v.n).toFixed(1));r` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_ASSET_CLASSES`, `ASSET_CLASS_DEFS`, `BASE_POSITIONS`, `DOWNSTREAM_MODULES`, `FACILITATED_DEALS`, `INSURANCE_LOB`, `PCAF_FORMULAS`, `PIE_COLORS`, `TABS`, `YOY_DATA`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Financed Emissions | `Σ(AF_i × Emissions_i)` | PCAF Standard | Total attributed GHG across all asset classes |
| WACI | `Σ(w_i × Emissions_i/Revenue_i)` | PCAF | Weighted average carbon intensity benchmark |
| Data Quality | `Weighted average DQ score` | PCAF DQ scale | 1=best quality audited data, 5=sector proxy |
- **Portfolio holdings data** → EVIC/loan value calculation → **Attribution factors**
- **Company emissions (CDP/reports)** → DQ scoring → **Financed emissions per asset**
- **Aggregated financed emissions** → WACI calculation → **Portfolio carbon footprint**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF attribution methodology
**Headline formula:** `FE = Σ(AF_i × Emissions_i); AF_equity = Investment / EVIC`

Attribution factor (AF) by asset class: listed equity/bonds = Investment/EVIC, project finance = 100%, CRE/mortgages = loan value/property value. WACI = Σ(w_i × Emissions_i/Revenue_i). DQ 1=audited, 5=proxy.

**Standards:** ['PCAF Global GHG Standard v3 (2022)', 'GHG Protocol Scope 3 Cat 15']
**Reference documents:** PCAF Global GHG Accounting Standard v3; GHG Protocol Scope 3 Category 15; SBTi Financial Sector Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> **Note on guide accuracy.** MODULE_GUIDES describes PCAF coverage for "5 asset classes: listed
> equity, corporate bonds, project finance, commercial real estate, mortgages." The code actually
> implements **attribution-factor formulas for 13 distinct instrument types** (`ASSET_CLASS_DEFS`),
> including Motor Vehicle Loans, Sovereign Debt, Use-of-Proceeds bonds, Sub-Sovereign, Undrawn
> Commitments, and Securitisations — the guide **understates** what the code does. This is a
> positive discrepancy (no ⚠️ warranted), but worth flagging so the guide can be updated.

### 7.1 What the module computes

A full PCAF Global GHG Standard attribution engine, with a distinct attribution-factor (AF) formula
per asset class, applied to real named-company positions with real reported emissions:

```
FE_i         = AF_i × (Scope1_i + Scope2_i)
AF (equity/bonds/loans)   = Outstanding / EVIC                    (Ch.4.2–4.4; sector-median EVIC proxy if EVIC null)
AF (project finance)      = Outstanding / TotalProjectCost         (Ch.4.5)
AF (commercial RE)        = Outstanding / PropertyValue             (Ch.4.6)
AF (mortgages/vehicle/securitisations) = 1.0                        (full attribution)
AF (sovereign debt)       = Outstanding / (CountryPPPGDP × 1000)    (Ch.4.9)
AF (use-of-proceeds)      = Outstanding / TotalBondSize              (Ch.4.10)
AF (sub-sovereign)        = 0.10 (fixed)
AF (undrawn commitments)  = CCF × min(1, Outstanding/EVIC)           (Ch.4.13)
```

Every AF formula caps at `min(1.0, ·)`, correctly preventing attribution >100% ownership.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| 40 named companies/positions | Apple, Shell, TotalEnergies, BHP, ExxonMobil, Toyota, BP, Equinor, etc. | **Real company names with real-scale EVIC, outstanding exposure, and Scope 1/2/3 figures**, sourced per-row from cited CDP/annual-report/sustainability-report references (e.g. "CDP A-List 2023", "Shell Annual Report 2023") |
| `dqs` (PCAF Data Quality Score) | 1–5 per position, with per-row source citation | Matches PCAF's 1 (audited)–5 (proxy) scale; e.g. Shell/TotalEnergies/BHP/Rio Tinto = DQS 1 ("Climate Report"), retail bonds using revenue proxy = DQS 4 |
| `evicWarning` | `NULL_EVIC — sector proxy used` when EVIC missing for equity/bond/loan positions | Forces `adjustedDqs = max(dqs, 4)` — a correct PCAF-consistent penalty: proxy-derived attribution can never claim better than DQ4 |
| `SECTOR_REV_EVIC` | Technology 8×, Software 10×, Energy 0.8×, Mining 1.2×, Financials 3×, etc. | Sector-specific Revenue/EVIC multiples used only as a WACI-denominator proxy when EVIC is present but revenue isn't separately reported — economically sensible ordering (capital-light Tech trades at high revenue multiples; capital-intensive Energy/Mining trade at low multiples) though the specific multiples are calibration assumptions, not cited to a named index |
| `SECTOR_MEDIAN_EVIC` | per-sector fallback EVIC ($B) | Used when a position has no EVIC at all (private/bond-only issuers) |
| Country PPP GDP table (`COUNTRY_PPP_GDP`) | per-country GDP for sovereign AF denominator | Real-scale country GDP figures used as PCAF Ch.4.9 prescribes |

### 7.3 Calculation walkthrough (`computeRow`)

1. `totalEmissions = scope1+scope2`; `totalWithScope3` adds Scope 3 for context/CSRD E1 needs.
2. `attrFactor = computeAttrFactor(p)` dispatches to the asset-class-specific formula above.
3. `financedEmissions = round(attrFactor × totalEmissions)`; `financedScope3` applies the same AF to
   Scope 3 — correct, since PCAF attribution applies uniformly across scopes for a given instrument.
4. `evicWarning`/`adjustedDqs`: when EVIC is null for an asset class that requires it, DQS is
   forced to at least 4, correctly documenting the data-quality penalty of the proxy substitution.
5. `revenueM = evic × sectorRevMultiple` (or sector-median-EVIC × multiple when EVIC absent);
   `waci = totalEmissions/revenueM` — the standard PCAF/TCFD WACI denominator (revenue), estimated
   via EVIC when revenue isn't directly available (a documented, if imperfect, proxy chain).
6. `carbonIntensity = financedEmissions / outstanding` — $-normalised intensity for portfolio
   screening.
7. **Portfolio rollups**: `byAC` (by asset class), `bySector` (top emitters), `top10`, `avgDqs`
   (exposure-agnostic simple mean), `carbonFootprint = totalFE/(totalOut/1000)` (SFDR PAI #2 style
   metric, tCO₂e per $M invested).
8. **Companion books**: `INSURANCE_LOB` (9 rows) computes underwriting financed emissions
   (`premiumM × efPerPremium`) — PCAF's insurance-associated-emissions extension; `FACILITATED_DEALS`
   (8 rows) computes capital-markets facilitated emissions with a deal-type-specific attribution
   (`underwrittenM/dealSizeM`, or a flat 10% for Advisory M&A) per the PCAF facilitated-emissions
   standard (Part C).

### 7.4 Worked example

**Shell plc**: `evic=£245B`, `outstanding=£31.2B`, `scope1=48.2Mt`, `scope2=20.2Mt`, `dqs=1`:

| Step | Computation | Result |
|---|---|---|
| Attribution factor | min(1, 31.2/245) | **12.73%** |
| Total emissions | 48,200,000 + 20,200,000 | 68,400,000 tCO₂e |
| Financed emissions | 0.1273 × 68,400,000 | **8,708,000 tCO₂e** |
| Revenue proxy | 245 × SECTOR_REV_EVIC['Oil & Gas'≈0.8] | £196B |
| WACI | 68,400,000 / 196,000 | **349 tCO₂e/$M revenue** |
| Carbon intensity | 8,708,000 / 31,200 | **279 tCO₂e/$M outstanding** |

### 7.5 Data provenance & limitations

- **This is one of the few modules in the batch using real, individually-cited company financials
  and emissions** rather than pure PRNG-generated data — a materially higher evidentiary bar than
  peer modules.
- Sector Revenue/EVIC multiples and country PPP GDP tables are still **calibration assumptions**,
  not live-pulled from a market-data vendor.
- `YOY_DATA` (7 years) is a static seed trend, not derived from re-running `computeRow` against
  historical positions — the year-over-year chart is illustrative, not backtested against the same
  attribution engine.
- Insurance and facilitated-emissions books use seed `efPerPremium`/`attrFormula` constants rather
  than PCAF's published emission-factor tables per line of business.

**Framework alignment:** PCAF Global GHG Accounting Standard v3 (2022) — implemented with unusual
fidelity across 13 asset classes including the less-common Sovereign Debt (Ch.4.9), Use-of-Proceeds
(Ch.4.10), and Undrawn Commitments (Ch.4.13) chapters; GHG Protocol Scope 3 Category 15 — the
financed-emissions concept is correctly the sum of AF×emissions across the book; SFDR PAI #2/#3 and
CSRD ESRS E1 — the `DOWNSTREAM_MODULES` table documents exactly which PCAF outputs feed which
downstream disclosure module, a genuinely useful lineage map (`carbonFootprint`→SFDR PAI#2,
`waciIntensity`→SFDR PAI#3, `esrsE1Emissions`→CSRD E1-6).

## 9 · Future Evolution

### 9.1 Evolution A — Real positions and emissions behind the 13-instrument engine (analytics ladder: rung 2 → 3)

**What.** §7 flags a *positive* discrepancy: the guide claims 5 asset classes, but the code implements correct PCAF attribution-factor formulas for 13 instrument types (`ASSET_CLASS_DEFS`) — listed equity/bonds (Outstanding/EVIC), project finance (Outstanding/TotalProjectCost), CRE (Outstanding/PropertyValue), sovereign (Outstanding/PPP-GDP), use-of-proceeds, sub-sovereign, undrawn commitments (CCF×min(1,Out/EVIC)), securitisations — every AF correctly capped at min(1.0, ·). This is one of the platform's most methodologically complete engines. The gap: `BASE_POSITIONS` and reported emissions are seed data. Evolution A grounds them and pins the calibration.

**How.** (1) Wire positions to `portfolios_pg` and resolve holdings via GLEIF/OpenFIGI; pull EVIC from real market data (shared with `owid-evic-analytics`) and reported Scope 1/2 from CDP/disclosures, applying PCAF's sector-median EVIC proxy and DQ score (1=audited…5=proxy) where data is missing — honest-null propagation. (2) Sovereign attribution needs real PPP-GDP (World Bank data, joinable); use-of-proceeds needs real bond sizes. (3) Pin the 13 AF formulas in `bench_quant` with hand-computed reference cases per instrument type — this flagship engine is exactly what the roadmap's "every tier-A flagship pinned" target means. This is rung-3 calibration; the engine (rung-1/2) is already excellent.

**Prerequisites.** Market-data + emissions resolution (reuse existing ingesters); World Bank PPP-GDP for sovereign; `CarbonCreditContext` bus already wired for downstream propagation. **Acceptance:** financed emissions compute over real `portfolios_pg` holdings with real EVIC/emissions; each instrument type's AF reproduces a pinned reference; DQ scores reflect real data availability.

### 9.2 Evolution B — Financed-emissions reporting analyst (LLM tier 2)

**What.** A copilot for the TCFD/ISSB/CSRD reporting workflows §1 targets: "what are my total financed emissions by asset class?", "why is the sovereign-debt AF so small?", "which holdings drive my WACI above the SBTi sector target?", "draft the PCAF disclosure with data-quality scores" — executed against the 13-instrument engine, decomposing financed emissions per asset class and holding.

**How.** Tool calls to endpoints wrapping the AF/FE/WACI functions; system prompt from this Atlas page's §5/§7.1 formulas and the PCAF v3 / GHG Protocol Scope 3 Cat 15 references named in §5 so the (nuanced, per-instrument) attribution methodology is explained correctly. The disclosure draft templates the PCAF-required fields — financed emissions, WACI, DQ score distribution, coverage — with every figure a tool output; the fabrication validator matches all tCO2e/AF/WACI to responses. Because financed emissions feed downstream modules via `CarbonCreditContext`, this analyst is a natural tier-3 hub. RBAC-gate any write to the shared context.

**Prerequisites.** Compute endpoints; Evolution A for real positions (the AF math is already correct on demo data). **Acceptance:** every financed-emissions/WACI figure traces to a tool call; the disclosure draft reports DQ scores per PCAF requirement; per-instrument AF explanations cite the correct PCAF chapter.