# India Carbon Credit Trading Scheme (CCTS)
**Module ID:** `india-ccts` · **Route:** `/india-ccts` · **Tier:** B (frontend-computed) · **EP code:** EP-IN2 · **Sprint:** IN

## 1 · Overview
Ultra-detailed India CCTS compliance, trading, and financial impact module covering all 9 BEE-approved offset methodologies (BM-EN01 through BM-FR05), 18 approved calculation tools (BM-T-001 through BM-T-AR-0006), 740 designated entities across 9 sectors, carbon pricing scenarios, CBAM linkage analysis, PAT scheme transition, and full calculation engine with assurance-ready audit trails per ISO 14064/14065.

> **Business value:** This module is the definitive tool for navigating India's Carbon Credit Trading Scheme — from compliance obligation assessment through methodology selection, emission reduction calculation, CCC issuance, and market trading strategy. Critical for: (1) Obligated entities in 9 CCTS sectors needing to calculate compliance costs and identify abatement opportunities; (2) Financial institutions assessing credit risk exposure to CCTS-obligated borrowers; (3) Carbon market participants evaluating trading strategies across IEX/PXIL/HPOWERT; (4) Exporters needing to offset CBAM liability with domestic CCC purchases; (5) Offset project developers registering under BEE's 9 approved methodologies.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_SECTORS`, `COMPLIANCE`, `COMPLIANCE_STEPS`, `COVERAGE_PCT`, `INDUSTRIAL_COMPANIES`, `INSTITUTIONS`, `INTL_CARBON_PRICES`, `JCM_AGREEMENTS`, `METHODOLOGIES`, `NATIONAL_EMISSIONS_MT`, `PAT_HISTORY`, `PRICING`, `REAL_NON_SOLAR_REC_INR`, `REAL_PAC_PRICE_INR`, `REAL_SOLAR_REC_INR`, `SECTORS`, `TABS`, `TOOLS`, `TOOL_METH_MAP`, `TOTAL_AVOIDED_MT`, `TOTAL_BASELINE_MT`, `TOTAL_ENTITIES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_SEED_LATEST_REC` | `INDIA_REC_PRICES.length ? INDIA_REC_PRICES[INDIA_REC_PRICES.length - 1] : null;` |
| `_SEED_LATEST_PAC` | `INDIA_PAC_CYCLE_RESULTS.length ? INDIA_PAC_CYCLE_RESULTS[INDIA_PAC_CYCLE_RESULTS.length - 1] : null;` |
| `guard` | `(n, d, fb = 0) => d > 0 ? n / d : fb;` |
| `pct` | `(n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;` |
| `fmtN` | `v => typeof v === 'number' ? (Math.abs(v) >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.abs(v) >= 1e3 ?` |
| `badgeS` | `(bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });` |
| `cycleNum` | `parseInt(row.cycle.replace(/[^0-9]/g, ''), 10);` |
| `TOTAL_ENTITIES` | `SECTORS.reduce((s, sec) => s + sec.entities, 0);` |
| `TOTAL_BASELINE_MT` | `SECTORS.reduce((s, sec) => s + sec.baselineEmissions_mt, 0);` |
| `TOTAL_AVOIDED_MT` | `SECTORS.reduce((s, sec) => s + sec.avoidedEmissions_mt, 0);` |
| `csv` | `[h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `growth` | `1 + 0.15 * t + 0.02 * t * t;` |
| `low` | `Math.round(base * growth * 0.7);` |
| `mid` | `Math.round(base * growth);` |
| `high` | `Math.round(base * growth * 1.4);` |
| `revInr` | `surplus_mt * 1e6 * cccPrice;` |
| `totalEmissions` | `scope1 + scope2;` |
| `complianceCostInr` | `totalEmissions * cccPrice;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_STEPS`, `CONNECTED_MODULES`, `INSTITUTIONS`, `INTL_CARBON_PRICES`, `JCM_AGREEMENTS`, `METHODOLOGIES`, `PAT_HISTORY`, `SECTORS`, `TABS`, `TOOLS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Designated Entities | — | BEE/MoP Gazette | 9 sectors: Iron & Steel (253), Textiles (90), Cement (50+), Petrochemicals (39), Pulp & Paper (30+), Chlor-Alk |
| Covered Emissions | — | BEE | ~16% of India national emissions; Iron & Steel + Cement = 76% of CCTS-covered emissions |
| Approved Methodologies | — | BEE CCTS | BM-EN01.001/002 (Energy), BM-IN02.001/002 (Industry), BM-WA03.001/002 (Waste), BM-AG04.001 (Agriculture), BM-F |
| Approved Tools | — | BEE CCTS | 13 general (BM-T-001 to BM-T-015) + 5 forestry (BM-T-AR-0002 to BM-T-AR-0006) |
| CCC Price Estimate | — | S&P Global/Industry | ~USD 7-15/tCO2e at initial trading; 2x penalty for non-compliance |
| Market Size 2030 | — | Industry estimates | India total carbon market including compliance + voluntary |
| CBAM Overlap | — | EU CBAM Regulation | Steel, Aluminium, Cement, Fertiliser, Hydrogen — domestic CCC payment offsets CBAM liability |
| Compliance Cycle | — | CCTS Rules 2023 | Baseline FY 2023-24, first compliance FY 2025-26, CCC trading expected Oct-Nov 2026 |
| Exchanges | — | CERC | IEX, PXIL, HPOWERT — regulated by CERC under March 2026 regulations |
| MRV Standard | — | BEE | Mandatory third-party verification by BEE-accredited ACVAs |
| PAT Legacy | — | BEE PAT | 9 of 13 PAT sectors transition to CCTS; 4 remain PAT-only (thermal power, railways, DISCOMs, ports) |
| Article 6.2 Bilateral | — | PIB Aug 2025 | Signed 29 Aug 2025; Singapore/Sweden/Korea in negotiation |
- **Project activity data (generation MWh, fuel consumption, production tonnes)** → Methodology engine (BM-EN/IN/WA/AG/FR) → **Baseline, project, and leakage emissions quantified per BEE methodology**
- **CEA grid emission factor + IPCC Tier 2 factors** → Tool calculations (BM-T-001 through BM-T-015) → **Emission factors applied to baseline and project scenarios**
- **Verified emission reduction (tCO2e)** → CCC issuance calculation → **Carbon Credit Certificates issued (1 CCC = 1 tCO2e, rounded down)**
- **CCC issuance + market price** → Financial impact model → **Compliance cost, surplus revenue, CBAM offset value, NPV of investment**
- **Assurance checklist + MRV compliance flags** → Audit trail generator → **ISO 14064/14065 compliant assurance report with step-by-step calculation chain**
- **CCTS sector targets + CBAM commodity data** → Cross-module linkage → **Financial exposure flowing to PCAF, Capital Adequacy, Transition Risk, RBI Climate modules**

## 5 · Intermediate Transformation Logic
**Methodology:** BEE CCTS Methodology Engine (9 methodologies × 18 tools)
**Headline formula:** `ER_y = Baseline_y - Project_y - Leakage_y; CCC = floor(ER_y); Value = CCC × Price_INR`
**Standards:** ['Energy Conservation (Amendment) Act 2022', 'CCTS Rules 2023 (S.O. 2825(E))', 'BEE Offset Mechanism Procedure 2025', 'ISO 14064-2:2019', 'ISO 14065:2020', 'CEA CO2 Baseline Database v19', 'IPCC Guidelines 2006']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).