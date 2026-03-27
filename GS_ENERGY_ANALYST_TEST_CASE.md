# Goldman Sachs — Energy Analyst End-to-End Test Case
## Sustainability Platform: RWE Group 2024 Annual Report Assessment

**Analyst Role:** GS Equity Research / Natural Resources & Energy
**Use Case:** Pre-investment ESG due diligence on RWE AG (RWE.DE) — European utility sector
**Assessment Date:** 2026-03-01
**Frameworks Applied:** CSRD/ESRS · ISSB S1/S2 · EU Taxonomy · TCFD · SFDR PAI
**Data Source:** RWE Sustainability Report 2024 (uploaded via CSRD pipeline, entity ID: `02df2645`)

---

## 1. Workflow Overview

```
PDF Upload → ESRS Extraction → Gap Analysis → Scoring → Portfolio Risk → SFDR PAI → Investment Memo
     ↓              ↓                ↓             ↓             ↓            ↓
 csrd_report   csrd_kpi_values   csrd_gap     readiness    fi_entities   PAI disclosure
  _uploads      (82 rows)        _tracker    _assessments  (fi tables)   (regulatory_
                                 (120 rows)                               entities)
```

---

## 2. Step 1 — Upload & Extraction (API)

### 2.1 Upload Endpoint
```
POST /api/csrd/reports/upload
Content-Type: multipart/form-data

Fields:
  file              : RWE.pdf
  primary_sector    : energy_developer
  country_iso       : DEU
  entity_name_override : RWE Group
  reporting_year_override : 2024
```

### 2.2 Extraction Result (from `csrd_report_uploads`)
```
status          : completed
kpis_extracted  : 15
kpis_updated    : 0
gaps_found      : 13
lineage_entries : 15
```

### 2.3 Entity Registry Record
```
entity_id       : 02df2645-...
legal_name      : RWE Group
primary_sector  : energy_developer
country_iso     : DEU
is_in_scope_csrd: true
```

---

## 3. Step 2 — Extracted ESRS KPIs (Confirmed by Pipeline)

| Indicator Code | ESRS Standard | Description | Extracted Value | Unit | DQ Score |
|---|---|---|---|---|---|
| `E1-4.SBTiTarget` | ESRS E1 | SBTi Target Status | approved | boolean | 3 |
| `E1-5.EnergyConsumptionTotal` | ESRS E1 | Total Energy Consumption | 108,800 | GWh | 2 |
| `E1-5.EnergyConsumptionRenewable` | ESRS E1 | Renewable Energy | 62,300 | GWh | 2 |
| `E1-5.RenewableEnergyPct` | ESRS E1 | Renewable Share | 57.3 | % | 2 |
| `E1-6.GHGIntensityRevenue` | ESRS E1 | GHG Intensity | 126 | tCO2e/MEUR | 2 |
| `ESRS2.BalanceSheetMEUR` | ESRS 2 | Balance Sheet Total | 98,440 | MEUR | 2 |
| `ESRS2.EmployeeCountFTE` | ESRS 2 | Employees | 22,098 | headcount | 2 |
| `ESRS2.TotalRevenueMEUR` | ESRS 2 | Total Revenue | 28,616 | MEUR | 2 |
| `EUTaxonomy.AlignedRevenuePct` | EU Taxonomy | Taxonomy-Aligned Revenue | 21 | % | 2 |
| `EUTaxonomy.AlignedCapexPct` | EU Taxonomy | Taxonomy-Aligned Capex | 94 | % | 2 |
| `EUTaxonomy.AlignedOpexPct` | EU Taxonomy | Taxonomy-Aligned Opex | 28 | % | 2 |
| `E5-5.WasteRecycledPct` | ESRS E5 | Waste Recycled | 90 | % | 2 |
| `S1-7.TotalEmployeesHeadcount` | ESRS S1 | Total Workforce | 22,098 | headcount | 2 |
| `S1-11.Fatalities` | ESRS S1 | Work-Related Fatalities | 0 | count | 2 |
| `S1-11.LTIR` | ESRS S1 | Lost-Time Injury Rate | 0.31 | per 200k hrs | 3 |

> **DQ Score key (PCAF-aligned):** 1=Verified data, 2=Reported unverified, 3=Estimated, 4=Proxy, 5=Default

---

## 4. Step 3 — ESRS Mandatory Gap Analysis

### 4.1 Gap Summary
```
Total mandatory indicators checked  : 28
Indicators extracted                : 15
Mandatory gaps (HIGH priority)      : 13
CSRD readiness score                : 53.6%
```

### 4.2 Gap Detail

| Indicator | Standard | Gap Type | Investment Implication |
|---|---|---|---|
| `E1-6.Scope1GHG` | E1 | Missing | Cannot compute WACI / financed emissions |
| `E1-6.Scope2GHGMarketBased` | E1 | Missing | Cannot net-zero align per SBTI |
| `E1-6.Scope3GHGTotal` | E1 | Missing | Full value-chain emissions unknown |
| `E1-6.TotalGHGEmissions` | E1 | Missing | SFDR PAI #1 blocked |
| `E3-4.WaterWithdrawal` | E3 | Missing | Physical water risk unquantified |
| `E3-4.WaterConsumption` | E3 | Missing | Nature risk incomplete |
| `E5-5.WasteGeneratedTotal` | E5 | Missing | Circular economy score blocked |
| `G1-4.CorruptionIncidents` | G1 | Missing | SFDR PAI #14 (Anti-corruption) blocked |
| `G1-4.AntiCorruptionTrainingPct` | G1 | Missing | Governance risk premium unquantifiable |
| `S1-7.FemaleEmployeesPct` | S1 | Missing | SFDR PAI #12 (Gender diversity) |
| `S1-7.FemaleManagementPct` | S1 | Missing | D&I board reporting gap |
| `S1-16.GenderPayGapPct` | S1 | Missing | SFDR PAI #13 mandatory |
| `S1-11.TRIR` | S1 | Missing | Safety culture scoring incomplete |

### 4.3 Regulatory Risk Assessment
```
CSRD mandatory gaps with regulatory fines exposure:
  - Missing Scope 1 GHG (Art. 29a CSRD): potential enforcement action Y2026
  - Missing SFDR PAI #1 data: PAI statement cannot be filed for article 8/9 funds holding RWE
  - EU Taxonomy alignment: revenue 21% vs capex 94% — tracking error risk for taxonomy KPIs
```

---

## 5. Step 4 — ISSB S2 Climate Risk Analysis

### 5.1 Scenario Analysis Parameters
```
Endpoint: GET /api/csrd/entities/{entity_id}/dashboard
Entity: RWE Group (02df2645)
```

| Scenario | Temp Target | Time Horizon | Transition Risk | Physical Risk |
|---|---|---|---|---|
| NGFS Net Zero 2050 | 1.5°C | 2030 / 2050 | HIGH — stranded coal/gas assets | LOW |
| NGFS Below 2°C | < 2°C | 2030 / 2050 | MEDIUM | LOW-MEDIUM |
| NGFS NDC Commitments | ~2.8°C | 2030 / 2050 | LOW | HIGH — heat stress, drought |
| NGFS Hot House World | > 4°C | 2050 | NEGLIGIBLE | VERY HIGH |

### 5.2 Transition Risk: Stranded Asset Calculation Engine
```
RWE Asset Exposure (Estimated from Annual Report 2024):
  Lignite Capacity (Germany)   : 3,400 MW  → Phaseout 2030 (German Coal Act)
  Hard Coal (Remaining)        : 1,500 MW  → Phaseout 2030
  Gas CCGT                     : 4,400 MW  → Partial risk under NZ2050
  Total at-risk capacity       : ~5,000 MW lignite + coal

  Stranded Asset Value (NZ2050):
    Assuming €600/kW residual book value
    5,000 MW × €600/kW = €3.0B at-risk book value
    NPV haircut (15% discount, 8yr avg remaining life): €1.2B expected loss
    As % of balance sheet (€98.4B):                   1.2%
```

### 5.3 Physical Risk: NGFS Hot House World
```
Relevant Physical Hazards for RWE (DEU, GBR, NLD, PL, USA):
  - Chronic: Increased droughts → river cooling water scarcity (Rhine, Meuse)
  - Chronic: Higher temperatures → thermal derating of thermal plants
  - Acute:   Flooding → onshore wind/solar site damage (North Sea coast)

  Water Stress Score (World Resources Institute Aqueduct):
    Germany Rhine catchment: Medium-High (3.4/5)
    Potential revenue impact (cooling water constraints): 2-4% of thermal output by 2035
```

---

## 6. Step 5 — EU Taxonomy Assessment

### 6.1 Eligibility and Alignment
```
Taxonomy KPIs from RWE 2024 Annual Report:
  Aligned Revenue    : 21%   (electricity from renewable sources — CE1)
  Aligned Capex      : 94%   (offshore/onshore wind, solar, batteries, pumped hydro)
  Aligned Opex       : 28%

Analyst Note: Revenue alignment 21% vs Capex 94% gap is expected — RWE is in transition.
  Fleet mix: ~57 GW total, ~41 GW renewable (72% capacity but lower load factors than thermal)
  Gas CCGT (transition fuel): Taxonomy-eligible but not aligned until 2025 DA thresholds confirmed
```

### 6.2 Do No Significant Harm (DNSH) Check
```
E1 — Climate Change Mitigation  : PASS (renewables portfolio)
E2 — Climate Change Adaptation  : PARTIAL (river cooling at risk — water scarcity)
E3 — Water                      : INSUFFICIENT DATA (WaterWithdrawal not reported — gap)
E4 — Biodiversity               : PARTIAL (offshore wind EIA required — Natura 2000 proximity)
E5 — Circular Economy           : PASS (90% waste recycled)
G1 — Minimum Social Safeguards  : CONDITIONAL (gender pay gap not disclosed — gap)
```

---

## 7. Step 6 — SFDR PAI Statement (Article 8 Fund Exposure)

### 7.1 Mandatory PAI Indicators — RWE Contribution

| PAI # | Indicator | Data Available | Value | Source |
|---|---|---|---|---|
| 1 | GHG Emissions Intensity | PARTIAL | 126 tCO2e/MEUR revenue | ESRS E1 extracted |
| 2 | Carbon Footprint | BLOCKED | Scope 1+2 missing | Gap tracker |
| 3 | GHG Intensity of Investee | BLOCKED | Total GHG missing | Gap tracker |
| 4 | Fossil Fuel Exposure | YES | 5,900 MW gas/coal remaining | Annual report |
| 5 | Non-renewable Energy Consumption | PARTIAL | 43% non-renewable | Computed: 100%-57% |
| 10 | Biodiversity-Sensitive Areas | PARTIAL | 3 offshore sites near Natura 2000 | Disclosure |
| 12 | Unadjusted Gender Pay Gap | BLOCKED | Not disclosed | Gap tracker |
| 13 | Board Gender Diversity | BLOCKED | Not disclosed | Gap tracker |
| 14 | Anti-corruption | BLOCKED | Not disclosed | Gap tracker |

**PAI Completeness Score: 4/9 mandatory = 44%**
**Assessment: Article 8 fund classification requires PAI data. Portfolio manager should engage RWE IR on gaps 2, 3, 12, 13, 14 before Y2026 SFDR PAI filing.**

---

## 8. Step 7 — ECL / Credit Risk Overlay (for GS Credit Division)

### 8.1 Climate-Adjusted PD Calculation
```
Endpoint: POST /api/ecl/calculate

Input:
  entity_id            : RWE Group (energy utility, investment grade)
  base_pd              : 0.32%   (from Moody's/S&P implied: Baa1/BBB+ equivalent)
  lgd                  : 40%     (senior unsecured, EUR-denominated bonds)
  ead                  : €2.5B   (GS credit exposure to RWE bonds + revolving credit)
  reporting_year       : 2024
  climate_scenario     : NGFS NZ2050
  time_horizon         : 5yr

Climate-adjusted PD (NGFS NZ2050, 5yr):
  Base PD              : 0.32%
  Transition overlay   : +0.08%  (coal phase-out acceleration, carbon price €130/tCO2e by 2030)
  Physical overlay     : +0.02%  (water stress — low near-term)
  Climate-adjusted PD  : 0.42%

ECL Calculation:
  Stage 1 ECL (12M) = EAD × PD(1yr) × LGD
                    = €2,500M × 0.0042 × 0.40
                    = €4.2M

  Stage 2 ECL (Lifetime, significant increase in credit risk threshold crossed):
  Lifetime PD (5yr)   : 2.1%
  Stage 2 ECL         = €2,500M × 0.021 × 0.40 = €21M

  IFRS 9 stage assessment: Stage 1 (no SICR trigger in base case)
  Capital charge (BIS III SA): €2,500M × 100% (RW for BBB) × 8% = €200M RWA
```

### 8.2 PCAF Financed Emissions (GS Equity Holding)
```
Endpoint: POST /api/pcaf/financed-emissions

Input:
  holding_value        : €450M   (GS equity position in RWE)
  enterprise_value     : €34.5B  (RWE EV as of Q4 2024)
  attribution_factor   : €450M / €34.5B = 1.30%
  ghg_intensity_metric : 126 tCO2e/MEUR revenue
  revenue              : €28,616M

Calculation:
  Total GHG (estimated via intensity): 126 × 28,616 / 1,000 = 3,606 ktCO2e (Scope 1+2 proxy)
  PCAF financed emissions             = 1.30% × 3,606,000 tCO2e = 46,878 tCO2e
  Per MEUR invested (WACI)            = 46,878 / 450 = 104.2 tCO2e/MEUR invested
  PCAF DQ Score                       : 3 (intensity-based, GHG not directly reported)

Note: PCAF score would improve to 2 if Scope 1 data is obtained from IR engagement.
```

---

## 9. Step 8 — Gap Remediation Roadmap (for Stewardship / Engagement)

### 9.1 Engagement Priorities (by Regulatory Deadline)

| Priority | KPI Gap | Regulatory Deadline | Engagement Action |
|---|---|---|---|
| P1 | Scope 1+2+3 GHG (E1-6) | 2025 CSRD Year 1 filing | Request from IR by Q1 2025 |
| P1 | Gender Pay Gap (S1-16) | SFDR PAI Y2025 statement | Written engagement letter |
| P1 | Board Gender Diversity (S1-7) | SFDR PAI Y2025 | Proxy voting threat |
| P2 | Water Withdrawal (E3-4) | CSRD Year 1 | Include in annual IR meeting |
| P2 | Corruption Incidents (G1-4) | SFDR PAI Y2025 | Governance assessment |
| P3 | Waste Generated Total (E5-5) | CSRD Year 2 | ESG questionnaire |

### 9.2 Expected Remediation Timeline
```
Q1 2025: Scope 1+2 GHG (likely published in RWE Factbook — not in main PDF)
Q2 2025: Gender pay gap (statutory obligation under German Equal Pay Act)
Q3 2025: Board diversity reporting (BaFin/DCGK disclosure)
Q4 2025: Water stress / nature (CSRD first mandatory year)
```

---

## 10. Investment Summary Card

```
RWE GROUP (RWE.DE) — ESG ASSESSMENT CARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSRD Readiness       : 53.6% (15/28 mandatory indicators disclosed)
EU Taxonomy Capex    : 94% aligned (transformational — best-in-class European utility)
EU Taxonomy Revenue  : 21% (transition underway; expect 35-40% by 2028)
SBTi Target          : Approved (1.5°C pathway validated)
SFDR PAI Completeness: 44% (engagement required on 5 indicators)
Stranded Asset Risk  : €1.2B NPV loss (NZ2050 scenario; 1.2% of balance sheet)
Climate-Adjusted PD  : 0.42% (base 0.32%; +10bps climate overlay)
PCAF WACI            : 104.2 tCO2e/MEUR (estimated; DQ score 3)
Investment Grade     : YES (Moody's Baa1 / S&P BBB+)
ESG Controversies    : LOW (0 fatalities; no major controversies Y2024)
Analyst Recommendation: BUY — leading transition; EU Taxonomy capex profile strongest
                        in European utilities. Engagement required on PAI gaps.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 11. API Test Script (Automated QA)

```python
"""
End-to-end API test for GS Energy Analyst workflow.
Run: pytest test_gs_energy_analyst.py -v
"""
import requests

BASE = "http://localhost:8000"
ENTITY_ID = "02df2645-..."  # RWE Group entity_id

def test_csrd_entity_dashboard():
    r = requests.get(f"{BASE}/api/csrd/entities/{ENTITY_ID}/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert data["entity"]["legal_name"] == "RWE Group"
    assert data["kpi_count"] == 15
    assert data["gap_count"] == 13
    assert data["readiness_pct"] == pytest.approx(53.6, abs=2.0)

def test_csrd_kpis():
    r = requests.get(f"{BASE}/api/csrd/entities/{ENTITY_ID}/kpis")
    assert r.status_code == 200
    kpis = r.json()
    codes = {k["indicator_code"] for k in kpis}
    assert "E1-5.RenewableEnergyPct" in codes
    assert "EUTaxonomy.AlignedCapexPct" in codes
    rwe = next(k for k in kpis if k["indicator_code"] == "EUTaxonomy.AlignedCapexPct")
    assert rwe["numeric_value"] == 94.0

def test_csrd_gaps():
    r = requests.get(f"{BASE}/api/csrd/entities/{ENTITY_ID}/gaps")
    assert r.status_code == 200
    gaps = r.json()
    gap_codes = {g["indicator_code"] for g in gaps}
    assert "E1-6.Scope1GHG" in gap_codes
    assert "S1-16.GenderPayGapPct" in gap_codes
    assert all(g["priority"] == "high" for g in gaps)

def test_ecl_calculation():
    r = requests.post(f"{BASE}/api/ecl/calculate", json={
        "entity_id": ENTITY_ID,
        "exposure_ead": 2500.0,
        "lgd": 0.40,
        "base_pd": 0.0032,
        "climate_scenario": "ngfs_nz2050",
        "time_horizon_years": 5
    })
    assert r.status_code == 200
    data = r.json()
    assert 0.003 < data["climate_adjusted_pd"] < 0.01  # 0.3% to 1%
    assert data["stage_1_ecl_meur"] < 10.0  # < €10M for investment-grade

def test_pcaf_financed_emissions():
    r = requests.post(f"{BASE}/api/pcaf/financed-emissions", json={
        "entity_id": ENTITY_ID,
        "holding_value_meur": 450.0,
        "enterprise_value_meur": 34500.0
    })
    assert r.status_code == 200
    data = r.json()
    assert "waci" in data
    assert "pcaf_dq_score" in data
    assert data["pcaf_dq_score"] in [1, 2, 3, 4, 5]
```

---

## 12. Validation Summary

### 12.1 Calculation Input Parameters
```
Data Sources Used:
  - RWE Annual Report 2024 (PDF, extracted via pdfplumber + ESRS regex engine)
  - RWE Investor Factbook 2024 (supplementary; not yet uploaded)
  - NGFS Phase 4 scenarios (loaded via /api/ngfs/scenarios)
  - PCAF Standard v1.1 (attribution methodology)
  - IFRS 9 ECL three-stage model
  - EU Taxonomy Delegated Act 2021/2139 + 2023/2486

Limitations:
  - Scope 1/2/3 GHG not found in main PDF; estimated via GHG intensity × revenue
  - Employee FTE count extracted from table but cross-reference check recommended
  - Water withdrawal data missing; water stress assessment used proxy from WRI Aqueduct
  - LTIR value flagged DQ=3 (number pattern ambiguous in PDF layout)
```

### 12.2 Output Parameters
```
Outputs Produced:
  - ESRS KPI dataset (15 indicators, stored in csrd_kpi_values)
  - CSRD Gap Tracker (13 mandatory gaps, stored in csrd_gap_tracker)
  - Data Lineage (15 entries, stored in csrd_data_lineage)
  - Investment Card (narrative summary with quantified risk metrics)
  - ECL estimate (IFRS 9, climate-adjusted, Stage 1 and Stage 2)
  - PCAF financed emissions (estimated, DQ Score 3)
  - SFDR PAI completeness score (44%)
  - EU Taxonomy alignment verification
  - Engagement roadmap (6 items, prioritised by regulatory deadline)
```

---

*Document generated: 2026-03-01 | Platform: Risk Analytics Sustainability Platform v1.0 | Reviewer: GS Equity Research - Natural Resources*
