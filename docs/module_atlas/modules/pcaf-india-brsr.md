# PCAF India BRSR
**Module ID:** `pcaf-india-brsr` · **Route:** `/pcaf-india-brsr` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies PCAF GHG accounting methodology to India Business Responsibility and Sustainability Reporting requirements, enabling Indian financial institutions to compute and disclose financed emissions in BRSR format.

> **Business value:** Enables Indian banks, asset managers, and insurance companies to compute and report financed emissions in full compliance with SEBI BRSR Core requirements using PCAF-aligned GHG accounting methodology.

**How an analyst works this module:**
- Map portfolio holdings to BRSR-covered Indian companies using ISIN/CIN identifiers
- Retrieve Scope 1/2 GHG emissions from BRSR filings or estimate using PCAF Tier 4/5 proxies
- Compute EVIC and attribution factor per PCAF v2 guidance adapted for Indian capital market structures
- Aggregate financed emissions and format output per SEBI BRSR Core disclosure template

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `Card`, `CompanyAutocomplete`, `DEAL_CATEGORIES`, `DEAL_TEMPLATE`, `DEAL_TYPE_FIELDS`, `DEFAULT_FACILITATED_DEALS`, `DEFAULT_HOLDINGS`, `DEFAULT_INSURANCE_POLICIES`, `DQS_COLORS`, `DQS_LABELS`, `DqsBadge`, `INSTRUMENT_FIELDS`, `INSTRUMENT_OPTIONS`, `Inp`, `KpiCard`, `LOB_CATEGORIES`, `LOB_FIELDS`, `POLICY_TEMPLATE`, `SECTOR_OPTIONS`, `Sel`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_HOLDINGS` | 9 | `cin`, `company_name`, `sector_gics`, `revenue_inr_cr`, `evic_inr_cr`, `exposure_inr_cr`, `scope1_co2e`, `scope2_co2e`, `scope3_co2e`, `dqs_override`, `instrument_type` |
| `DEFAULT_INSURANCE_POLICIES` | 9 | `id`, `policy_id`, `policyholder_name`, `line_of_business`, `gross_written_premium_inr_cr`, `vehicle_count`, `fuel_type`, `annual_km_per_vehicle`, `avg_engine_cc` |
| `DEFAULT_FACILITATED_DEALS` | 6 | `id`, `deal_id`, `issuer_name`, `deal_type`, `issuer_sector_gics`, `underwritten_amount_inr_cr`, `total_deal_size_inr_cr`, `issuer_revenue_inr_cr`, `bond_type`, `coupon_rate_pct`, `maturity_years`, `credit_rating` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `DQS_LABELS` | `{ 1:'Verified GHG data', 2:'Audited data', 3:'Reported data', 4:'Sector-level proxy', 5:'Least granular' };` |
| `skipSyncRef` | `useRef(false); // prevents useEffect overwriting after selection` |
| `resultHoldings` | `holdings.map(h => {` |
| `financed` | `af * (s1 + s2);` |
| `dqs` | `h.dqs_override ? parseInt(h.dqs_override) : (s1 + s2 > 0 ? 3 : 4);` |
| `waci` | `rev > 0 ? (financed / rev) : 0;` |
| `totalFinanced` | `resultHoldings.reduce((s, h) => s + h.financed_co2e_tonne, 0);` |
| `totalExp` | `resultHoldings.reduce((s, h) => s + h.exposure_inr_cr, 0);` |
| `totalRev` | `holdings.reduce((s, h) => s + (parseFloat(h.revenue_inr_cr) \|\| 0), 0);` |
| `waciPortfolio` | `totalRev > 0 ? totalFinanced / totalRev : 0;` |
| `demoResults` | `insurancePolicies.map(p => {` |
| `toMusd` | `v => v ? parseFloat(v) * 0.12 : undefined;` |
| `demoDeals` | `facilitatedDeals.map(d => {` |
| `match` | `COMPANY_SUGGESTIONS.find(c => c.cin === cin \|\| cin.includes(c.cin.slice(-6)));` |
| `perAssetChart` | `portfolioResult?.holdings?.map(h => ({` |
| `scopeBreakdownChart` | `portfolioResult?.holdings?.map(h => ({` |
| `insuranceChart` | `insuranceResult?.results?.map(r => ({` |
| `facilitatedChart` | `facilitatedResult?.results?.map(r => ({` |
| `total` | `instrumentChart.reduce((s,r)=>s+r.value,0);` |
| `header` | `'Company,Sector,Instrument,Attribution Factor (%),Exposure INR Cr,Financed tCO2e,WACI tCO2e/INRCr,DQS,Uncertainty %';` |
| `blob` | `new Blob([[header, ...lines].join('\n')], { type:'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `DEFAULT_FACILITATED_DEALS`, `DEFAULT_HOLDINGS`, `DEFAULT_INSURANCE_POLICIES`, `INSTRUMENT_OPTIONS`, `SECTOR_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BRSR Core KPIs | — | SEBI BRSR Core 2023 | SEBI mandated nine ESG attributes in BRSR Core including greenhouse gas intensity, water intensity, and supply chain responsible sourcing. |
| BRSR Mandatory Scope | — | SEBI Circular 2021 | Indian companies required to submit BRSR under SEBI mandate covering BSE/NSE top 1,000 by market capitalisation. |
- **SEBI BRSR filings, NSE/BSE company master data, PCAF emissions proxies, MCA financial data** → Entity matching, EVIC computation, financed emissions aggregation, BRSR format mapping → **BRSR Core disclosure tables, financed emissions by sector, PCAF data quality scores**

## 5 · Intermediate Transformation Logic
**Methodology:** BRSR Financed Emissions
**Headline formula:** `FEᵢ = AFᵢ × CompanyEmissionsᵢ`

PCAF attribution factor multiplied by portfolio company Scope 1+2 emissions; aggregated across all holdings to produce BRSR-compliant financed emissions disclosure.

**Standards:** ['PCAF Standard v2 2022', 'SEBI BRSR Core Framework 2023']
**Reference documents:** PCAF Global GHG Accounting and Reporting Standard v2 2022; SEBI BRSR Core Framework Circular 2023; MoEFCC India GHG Programme Reporting Guidelines; GHG Protocol Corporate Standard

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Applies the same core PCAF attribution formula as the platform's flagship PCAF module, adapted to
Indian rupee-denominated instruments and SEBI BRSR Core disclosure format, plus two extension books
(motor insurance, facilitated bond issuance):

```
FE_i    = AF_i × (Scope1_i + Scope2_i)                       // financed emissions, tCO2e
AF      = Exposure_INR_Cr / EVIC_INR_Cr  (with 1.0 cap)
DQS     = override if supplied, else 3 (has reported Scope1+2) or 4 (proxy)
WACI    = FE / Revenue_INR_Cr
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `DEFAULT_HOLDINGS` (9 rows) | CIN, sector (GICS), revenue, EVIC, exposure, Scope 1/2/3 — all in INR Cr | Seeded demo portfolio styled on real Indian company structure (CIN identifiers, GICS sectors) but not pulled from actual BRSR filings |
| `DQS_LABELS` | 1=Verified GHG data … 5=Least granular | Matches PCAF's 5-tier DQ scale, correctly labelled |
| Motor insurance policies (9 rows) | vehicle count, fuel type, annual km, engine cc | Real physical-activity-data fields per PCAF's insurance-associated-emissions methodology (Part C, motor line) |
| Facilitated deals (6 rows) | underwritten amount, total deal size, bond type, coupon, credit rating | Real bond-deal structure fields for PCAF Part C facilitated-emissions attribution |

### 7.3 Calculation walkthrough

1. **Portfolio financed emissions**: `af = min(1, exposure_inr_cr/evic_inr_cr)`,
   `financed = af × (s1+s2)`; `dqs = override ?? (s1+s2>0 ? 3 : 4)` — a simple but PCAF-consistent
   data-quality inference: having *any* reported Scope 1/2 earns DQ3 (reported data, unverified);
   otherwise the position falls back to DQ4 (sector-level proxy).
2. **Portfolio WACI**: `waciPortfolio = totalFinanced / totalRev` (aggregate), and per-holding
   `waci = financed/revenue` — correctly PCAF-consistent (intensity per unit revenue, not per unit
   exposure).
3. **Insurance book** (`demoResults`): converts INR premium to USD-equivalent (`toMusd = v ×
   0.12`, an approximate INR/USD conversion) and computes underwriting-associated emissions per
   policy from vehicle count/fuel type/engine size — a genuine physical-activity-based PCAF motor
   insurance calculation (rather than a premium-based proxy).
4. **Facilitated deals** (`demoDeals`): attribution presumably follows the same
   `underwrittenM/dealSize` pattern used in the flagship PCAF module (not fully visible in the
   extracted snippet, but the seed fields — `attrFormula`, `citation` — mirror that module's
   structure).
5. **CIN/company matching**: `COMPANY_SUGGESTIONS.find(c => c.cin===cin || cin.includes(c.cin.slice(-6)))`
   does a fuzzy CIN-suffix match for autocomplete — a defensive matching pattern given CIN format
   inconsistencies in real filings.

### 7.4 Worked example

A holding with `exposure_inr_cr=850`, `evic_inr_cr=6,200`, `scope1_co2e=42,000t`,
`scope2_co2e=18,000t`, `revenue_inr_cr=3,100`:

| Step | Computation | Result |
|---|---|---|
| Attribution factor | min(1, 850/6,200) | **13.71%** |
| Financed emissions | 0.1371 × 60,000 | **8,226 tCO₂e** |
| DQS | s1+s2>0 → | **3** |
| WACI | 8,226 / 3,100 | **2.65 tCO₂e/INR Cr revenue** |

### 7.5 Data provenance & limitations

- **All 9 default holdings, 9 insurance policies, and 6 facilitated deals are synthetic demo
  data** with plausible Indian corporate structure (CIN format, GICS sectors) but not pulled from
  MCA/SEBI/BRSR filings.
- INR/USD conversion (`0.12`) is a static approximation, not a live FX rate.
- No PPP-GDP or country-specific attribution nuance beyond the standard EVIC-ratio formula — sector
  median EVIC fallback (used in the flagship PCAF module) does not appear in this module's extracted
  formulas, so a null-EVIC holding here may divide by a missing denominator without the same
  DQ-penalty safeguard the flagship module applies.

**Framework alignment:** PCAF Global GHG Accounting Standard v2/v3 attribution formula — correctly
applied to INR-denominated exposures; SEBI BRSR Core Framework (2023) — the output CSV structure
(Company, Sector, Instrument, Attribution Factor %, Exposure, Financed tCO2e, WACI, DQS,
Uncertainty %) maps directly onto BRSR Core's mandated GHG-intensity disclosure fields.

## 9 · Future Evolution

### 9.1 Evolution A — Real BRSR filings behind the India-adapted PCAF engine (analytics ladder: rung 2 → 3)

**What.** §7 shows a correct engine: the same PCAF attribution formula as the platform flagship (`FE = AF × (Scope1+Scope2)`, `AF = Exposure_INR_Cr/EVIC_INR_Cr` capped at 1.0), adapted to INR-denominated instruments and SEBI BRSR Core format, with a sensible DQ inference (any reported Scope 1/2 → DQ3, else DQ4 proxy) and two extension books (motor insurance with real physical-activity fields, facilitated bond deals). The gap: `DEFAULT_HOLDINGS` (9 rows) are a demo portfolio styled on real Indian company structure (CIN, GICS) but not pulled from actual BRSR filings. Evolution A grounds it in the real SEBI BRSR data pipeline.

**How.** (1) Ingest actual BRSR Core filings — SEBI mandates BRSR for the top-1000 listed Indian companies and filings are public on stock-exchange portals; parse Scope 1/2 emissions, revenue, and identifiers (CIN/ISIN) into a `brsr_filings` table, so holdings resolve to real reported emissions rather than seeded values. (2) EVIC from real Indian market data (NSE/BSE market cap + debt); PCAF Tier 4/5 proxies (§1) fill gaps for unlisted holdings with an honest DQ downgrade. (3) The motor-insurance and facilitated-emissions books use real PCAF Part C activity-data fields already — wire them to actual policy/deal inputs.

**Prerequisites.** BRSR filing ingestion (public but semi-structured — parsing effort); Indian market data for EVIC; the attribution engine already matches the flagship, so reuse its pinned tests adapted to INR. **Acceptance:** financed emissions compute over real BRSR-sourced holdings; AF/WACI reproduce the flagship engine's logic in INR; DQ scores reflect reported-vs-proxy reality.

### 9.2 Evolution B — SEBI BRSR disclosure copilot (LLM tier 2)

**What.** A copilot for the Indian FI users §1 targets: "compute financed emissions for my portfolio in BRSR Core format", "which holdings lack BRSR-reported emissions?", "what's my portfolio WACI and DQ distribution?", "draft the BRSR Core financed-emissions disclosure section" — executed against the India-adapted PCAF engine, decomposing per-holding attribution in INR Cr.

**How.** Tool calls to endpoints wrapping the AF/FE/WACI/DQ functions; system prompt from this Atlas page's §5/§7.1 and the PCAF v2 / SEBI BRSR Core references named in §5 so the India-specific disclosure format is templated correctly. The disclosure draft maps to SEBI BRSR Core datapoints with every figure a tool output; the fabrication validator matches all tCO2e/AF/WACI to responses, and the copilot surfaces DQ scores (a BRSR/PCAF requirement) and flags holdings on Tier 4/5 proxies. Because it shares the flagship PCAF methodology, cross-desk consistency with the global module is a feature — the copilot can note where India results align with global PCAF treatment.

**Prerequisites.** Compute endpoints; Evolution A for real BRSR-sourced holdings (the engine works on demo data today). **Acceptance:** every financed-emissions/WACI figure traces to a tool call; the BRSR draft reports DQ scores; holdings without reported emissions are flagged as proxy-based, not imputed silently.