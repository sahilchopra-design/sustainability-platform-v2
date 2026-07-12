# AA Impact ESG Analytics Platform — End-to-End UAT Testing Prompt & Script

> **Testing Scope:** Source Data Ingestion → Processing & Transformation → Output Generation → End-User Usage Validation
> **Personas Covered:** ESG Analytics Lead | Regulatory Compliance Validator | Portfolio Manager | Platform Admin
> **UAT Type:** Functional, Data Integrity, Role-Based Access, Output Accuracy, Compliance Traceability

***

## MASTER UAT PROMPT

Use the following prompt verbatim when instructing an AI agent, QA tester, or human UAT participant to execute testing:

***

```
You are conducting a full end-to-end User Acceptance Test (UAT) of the AA Impact ESG Analytics 
Platform — an AI-powered sustainability analytics and materiality assessment SaaS application. 

Your mandate is to test the complete journey from SOURCE DATA INGESTION through DATA PROCESSING 
and TRANSFORMATION to OUTPUT GENERATION and finally END-USER USAGE, across four defined user 
personas. For every test case, you must:

1. Execute the step exactly as described
2. Record the ACTUAL RESULT observed
3. Compare against the EXPECTED RESULT
4. Mark as PASS / FAIL / PARTIAL / BLOCKED
5. Log any defects with: Severity (P1-Critical / P2-High / P3-Medium / P4-Low), 
   reproduction steps, and screenshot reference
6. Note any enhancement opportunities separately

Begin with the Pre-UAT Environment Checklist, then execute each test module in sequence.
Do not skip modules. Flag dependencies before moving to the next module.
```

***

## PRE-UAT ENVIRONMENT CHECKLIST

Before executing any test case, validate all of the following. A single P1 item failure = BLOCK testing.

| # | Checklist Item | Status | Owner |
|---|----------------|--------|-------|
| E-01 | UAT environment is isolated from production | ☐ Pass / ☐ Fail | Admin |
| E-02 | Test data set (synthetic company profiles) is loaded | ☐ Pass / ☐ Fail | Admin |
| E-03 | All four persona user accounts are created with correct roles | ☐ Pass / ☐ Fail | Admin |
| E-04 | Sample sustainability reports (PDF/CSV) are available for upload | ☐ Pass / ☐ Fail | QA Lead |
| E-05 | Framework mappings (GRI, CSRD, ISSB, TCFD, BRSR) are configured | ☐ Pass / ☐ Fail | QA Lead |
| E-06 | API connections (if live data feeds) are verified | ☐ Pass / ☐ Fail | Dev |
| E-07 | Browser/device compatibility confirmed (Chrome, Firefox, Safari) | ☐ Pass / ☐ Fail | QA Lead |
| E-08 | All 100+ modules are deployed and accessible in UAT environment | ☐ Pass / ☐ Fail | Dev |
| E-09 | Defect logging tool (Jira / Notion / spreadsheet) is ready | ☐ Pass / ☐ Fail | QA Lead |
| E-10 | UAT sign-off template is prepared | ☐ Pass / ☐ Fail | Admin |

***

## USER PERSONAS

### Persona 1 — Priya Mehta | ESG Analytics Lead
- **Role:** Senior sustainability analyst at a mid-cap financial institution
- **Goal:** Extract ESG risk scores, run materiality assessments, generate client-ready reports
- **Tech Comfort:** High — expects data accuracy, chart interactivity, and export options
- **Key Concern:** Are ESG scores calculated correctly? Are materiality outputs defensible?

### Persona 2 — James Harrington | Regulatory Compliance Validator
- **Role:** ESG compliance officer at a bank subject to CSRD + ISSB
- **Goal:** Validate that disclosures map correctly to regulatory frameworks, audit trail is intact
- **Tech Comfort:** Medium — needs clear navigation, traceable data lineage
- **Key Concern:** Is every data point traceable to a source? Are framework mappings accurate?

### Persona 3 — Ananya Singh | Portfolio Manager
- **Role:** Sustainable finance portfolio manager
- **Goal:** Assess ESG risk exposure across a portfolio, identify red flags, act on contagion signals
- **Tech Comfort:** Medium-High — focused on dashboards and alerts, not raw data
- **Key Concern:** Are alerts timely? Do portfolio-level views aggregate correctly?

### Persona 4 — Kavya Reddy | Renewable Energy Developer — Sustainability Team Lead
- **Role:** Sustainability & ESG Reporting Lead at a mid-size solar + wind energy developer operating across India and Southeast Asia
- **Goal:** Report lifecycle emissions (Scope 1/2/3 including construction and decommissioning), GRI/SASB energy-sector metrics, land-use and biodiversity impacts, energy generation KPIs, and community engagement disclosures; generate investor-grade sustainability reports; demonstrate compliance with local regulatory mandates (BRSR in India, SFDR exposure via European investors)
- **Tech Comfort:** Medium — comfortable with dashboards and guided workflows; relies on clear data entry forms and automated framework mapping
- **Key Concern:** Are energy generation metrics (MWh generated, capacity factor, avoided emissions) correctly calculated? Are lifecycle emissions (construction + operations + decommissioning) captured separately? Do BRSR and GRI outputs reflect renewable-sector-specific disclosures?
- **Unique Data Inputs:** Project-level generation data (MWh/year per facility), land use (hectares), biodiversity assessments, community employment records, avoided emissions calculations (vs. grid baseline), PPA (Power Purchase Agreement) details, renewable energy certificate (REC) counts

### Persona 5 — Platform Admin
- **Role:** Internal AA Impact operator / client onboarding admin
- **Goal:** Onboard entities, configure modules, manage users, monitor system health
- **Tech Comfort:** High — tests access control, data flows, configurations
- **Key Concern:** Are role permissions enforced? Do module connections work end-to-end?

> **Note:** All prior test cases referencing "Platform Admin" apply to Persona 5.

***

## MODULE 1: SOURCE DATA INGESTION

> **Objective:** Validate that all supported data input types are correctly ingested, parsed, and stored without loss, duplication, or corruption.

### TC-SRC-001 | PDF Sustainability Report Upload
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta (ESG Analytics Lead) |
| **Test Data** | Sample CSRD-aligned sustainability report PDF (20-50 pages) |
| **Precondition** | User logged in, entity profile created |
| **Steps** | 1. Navigate to Data Ingestion → Upload Report. 2. Select PDF file. 3. Assign to company entity. 4. Select framework: CSRD. 5. Click "Process Report". |
| **Expected Result** | File uploads successfully. Processing status shows "Parsing…" then "Complete". Extracted datapoints appear in the entity's data panel within 60 seconds. No data truncation. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-SRC-002 | CSV/Excel Bulk Data Upload
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Test Data** | CSV file with 500 rows of ESG metrics across 10 companies |
| **Precondition** | Template format matches platform schema |
| **Steps** | 1. Navigate to Bulk Upload. 2. Upload CSV. 3. Map columns to ESG taxonomy fields. 4. Validate mapping. 5. Confirm import. |
| **Expected Result** | All 500 rows imported. Column mapping is retained. Validation flags any malformed rows without rejecting entire file. Row count confirmed in summary. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-SRC-003 | API Data Feed Connection
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Test Data** | Live or mock API endpoint with company ESG data |
| **Precondition** | API credentials configured in settings |
| **Steps** | 1. Navigate to Integrations → API Sources. 2. Trigger manual sync. 3. Monitor pull status. 4. Verify data appears in entity records. |
| **Expected Result** | API call returns HTTP 200. Data fields populate correctly. Timestamp of last sync updates. Errors (if any) are clearly shown with error codes. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-SRC-004 | Manual Data Entry
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta (ESG Analytics Lead) |
| **Test Data** | Scope 1, 2, 3 emissions figures for a company |
| **Precondition** | Entity exists in platform |
| **Steps** | 1. Open entity. 2. Navigate to Environmental → Emissions. 3. Enter Scope 1: 12,500 tCO2e, Scope 2: 8,200 tCO2e, Scope 3: 45,000 tCO2e. 4. Add data year: 2024. 5. Save. |
| **Expected Result** | All values saved correctly. Data year attributed. Values appear in entity dashboard. Audit log records the entry with timestamp and user. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-SRC-005 | Negative Test — Invalid File Format
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Test Data** | .exe or .zip file |
| **Steps** | Attempt to upload unsupported file format. |
| **Expected Result** | System rejects file with clear error: "Unsupported file type. Please upload PDF, CSV, or Excel." No partial ingestion occurs. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-SRC-006 | Duplicate Data Detection
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Test Data** | Same PDF uploaded twice for same entity and year |
| **Steps** | Upload identical report twice. |
| **Expected Result** | System detects duplicate on second upload. Prompts: "Duplicate detected — overwrite, merge, or cancel?" No silent duplicate ingestion. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

***

## MODULE 2: DATA PROCESSING & TRANSFORMATION

> **Objective:** Validate that ingested raw data is accurately parsed, normalized, mapped to ESG frameworks, and transformed into analytics-ready datasets without error or bias.

### TC-PRO-001 | LLM-Based Data Extraction from PDF
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Test Data** | TCFD-aligned annual report PDF |
| **Steps** | 1. Upload report. 2. View extracted data in entity panel. 3. Cross-check 10 key extracted values (e.g., emissions, water usage, governance disclosures) against source PDF. |
| **Expected Result** | Extracted values match source within ±2% for quantitative fields. Qualitative fields (governance narrative) are correctly attributed to the right disclosure topic. Confidence scores (if shown) are displayed. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Defects** | |

### TC-PRO-002 | Framework Taxonomy Mapping (CSRD → ESRS)
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington (Regulatory Compliance Validator) |
| **Steps** | 1. Select an entity with CSRD data. 2. Navigate to Framework Mapping. 3. View ESRS datapoint mappings. 4. Verify 5 specific ESRS datapoints (e.g., E1-6 GHG Emissions, S1-1 Human Rights Policy) map to correct source data. |
| **Expected Result** | Each ESRS datapoint shows: source field, extracted value, disclosure requirement status (Met / Partial / Missing). No cross-contamination between E, S, and G pillars. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-PRO-003 | Multi-Framework Parallel Mapping
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Select entity. 2. Enable frameworks: GRI + ISSB + TCFD simultaneously. 3. Check that the same source datapoint (e.g., Scope 1 emissions) maps correctly across all three frameworks without duplication or misattribution. |
| **Expected Result** | Scope 1 emissions correctly maps to GRI 305-1, ISSB S2-related metric, and TCFD Physical Risk disclosure. No data is double-counted. Framework coverage % updates correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-PRO-004 | ESG Score Calculation Engine
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Ensure entity has complete E, S, G data inputs. 2. Trigger score recalculation. 3. Review individual pillar scores (E, S, G) and composite score. 4. Manually verify the calculation using documented methodology weights. |
| **Expected Result** | Score output matches manual calculation within ±0.5 points. Pillar sub-scores are traceable to underlying metrics. Score change history is logged if recalculation differs from prior run. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-PRO-005 | Dynamic Materiality Assessment Engine (DME) — Trigger
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Open entity. 2. Navigate to Materiality Assessment. 3. Select industry: Financial Services. 4. Run double materiality assessment. 5. Review IRO (Impact, Risk, Opportunity) matrix outputs. |
| **Expected Result** | DME returns material topics ranked by significance. Financial materiality and impact materiality scores are calculated separately. Results align with ESRS / ISSB double materiality methodology. At least 5 material topics identified for a financial services entity. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-PRO-006 | Data Normalization — Unit Conversion
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Steps** | Input emissions data in MWh. Verify platform converts to tCO2e using correct emission factor. Check emission factor source/year applied. |
| **Expected Result** | Conversion is accurate. Emission factor source is cited (e.g., IEA 2024 grid factor). Converted value displayed alongside original. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-PRO-007 | Contagion Risk / Hawkes Process Module
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh (Portfolio Manager) |
| **Steps** | 1. Navigate to Contagion Risk. 2. Select a portfolio. 3. Introduce a simulated ESG event (e.g., governance scandal at a portfolio company). 4. Observe propagation signals across connected entities. |
| **Expected Result** | Contagion signal propagates to at least 1st and 2nd degree connected entities. Hawkes process decay curve is visible. Risk scores update within the module. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

***

## MODULE 3: OUTPUT GENERATION

> **Objective:** Validate that all platform outputs — dashboards, reports, alerts, and exports — accurately reflect processed data, are formatted correctly, and meet regulatory disclosure standards.

### TC-OUT-001 | ESG Score Dashboard Display
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Open entity dashboard. 2. Verify E, S, G pillar scores and composite score display correctly. 3. Check trend chart (YoY). 4. Verify peer benchmark comparison loads. |
| **Expected Result** | All scores display without null/NaN errors. Trend chart shows minimum 2 years of history if data exists. Peer benchmark shows at least 3 comparable companies. Scores update dynamically when underlying data changes. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-002 | CSRD / ESRS Disclosure Report Generation
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Navigate to Report Builder. 2. Select entity. 3. Choose template: CSRD ESRS. 4. Select reporting year: 2024. 5. Generate report. 6. Download PDF. 7. Validate 5 ESRS datapoints in the PDF against platform source data. |
| **Expected Result** | PDF generated within 30 seconds. All mandatory ESRS disclosure fields populated. Figures in PDF exactly match figures in entity data panel. Source citations included. Missing disclosures flagged as "Data Gap". |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-003 | TCFD Report Output
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | Generate TCFD report. Verify all four pillars (Governance, Strategy, Risk Management, Metrics & Targets) are covered. Check physical and transition risk sections. |
| **Expected Result** | All four TCFD pillars present. Risk sections populated from scenario analysis module. Quantitative figures (VaR, transition cost estimates) sourced from platform calculations. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-004 | Alert Generation — ESG Velocity Signal
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh |
| **Steps** | 1. Simulate an ESG score drop of >10 points for a portfolio entity. 2. Check alert panel. 3. Verify alert email/notification is triggered. 4. Click alert to navigate to entity detail. |
| **Expected Result** | Alert appears within the platform within 2 minutes of trigger. Alert correctly identifies entity, score change, and affected pillar. Navigation link in alert routes to correct entity page. Email notification (if configured) received within 5 minutes. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-005 | Portfolio-Level Aggregation Output
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh |
| **Steps** | 1. Navigate to Portfolio View. 2. Select a portfolio of 10 entities. 3. View aggregated ESG scores, carbon exposure, and flag count. 4. Filter by sector and verify aggregation updates. |
| **Expected Result** | Portfolio ESG score is correctly weighted by entity exposure. Carbon exposure is sum of all entity Scope 1+2 emissions. Sector filter dynamically adjusts all aggregations. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-006 | NGFS Climate Scenario Analysis Output
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Open Scenario Analysis module. 2. Select entity. 3. Run scenarios: Net Zero 2050, Delayed Transition, Current Policies. 4. View financial impact projections (PD, LGD, VaR, WACC adjustments). 5. Export results. |
| **Expected Result** | Three scenario outputs generated with distinct projections. Financial risk metrics (PD/LGD/VaR) differ meaningfully across scenarios. Export file (Excel/PDF) matches on-screen values exactly. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-007 | Data Export — CSV / Excel
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | Export entity ESG dataset to CSV. Open file. Verify all columns present, no data truncation, correct decimal formatting, and UTF-8 encoding. |
| **Expected Result** | CSV file contains all visible platform fields. No blank rows between data. Numeric fields retain correct precision. Special characters (if any) render correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-OUT-008 | Audit Trail & Data Lineage Output
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Navigate to Audit Trail for a specific entity. 2. Verify that every data entry, modification, and report generation is logged. 3. Check: timestamp, user, action type, before/after values. |
| **Expected Result** | Every action logged with full metadata. Lineage traces each output value back to source document/entry. Audit log is read-only and cannot be modified by any persona. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

***

## MODULE 4: END-USER USAGE VALIDATION

> **Objective:** Validate the end-to-end user experience — navigation, role-based access, workflow intuitiveness, performance, and error handling — from each persona's perspective.

### TC-USE-001 | User Login & Role-Based Access Control
| Field | Detail |
|-------|--------|
| **Personas** | All four personas |
| **Steps** | 1. Each persona logs in with their credentials. 2. Verify dashboard and navigation menus reflect role-appropriate modules only. 3. Attempt to access a restricted module (e.g., Admin accessing only their scope). |
| **Expected Result** | Priya sees analytics modules. James sees compliance/audit modules. Ananya sees portfolio modules. Admin sees all. No persona can access modules outside their permission set. Unauthorized access attempt returns "Access Denied" — not a blank page or error 500. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-002 | Entity Onboarding Workflow (End-to-End)
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Steps** | 1. Create new entity (company). 2. Enter: name, sector, country, regulatory frameworks applicable. 3. Assign to portfolio. 4. Upload baseline report. 5. Confirm entity appears in Priya's and Ananya's dashboards. |
| **Expected Result** | Entity created in <30 seconds. Appears in assigned portfolio. Analytics Lead and Portfolio Manager can immediately view entity. Default ESG score shows "Pending" until data processed. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-003 | Materiality Assessment — Full User Journey (Priya)
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Select entity. 2. Navigate to Materiality → New Assessment. 3. Select double materiality methodology. 4. Input stakeholder weightings. 5. Run assessment. 6. Review IRO matrix. 7. Approve and lock assessment. 8. Generate materiality report. |
| **Expected Result** | Each step advances without error. Stakeholder weights influence output (verifiable by changing one weight and re-running). Locked assessments cannot be edited without admin override. Report correctly reflects locked assessment values. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-004 | Regulatory Compliance Review — Full User Journey (James)
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Navigate to Compliance Dashboard. 2. Select entity. 3. Review CSRD readiness score. 4. Drill into a "Missing" ESRS datapoint. 5. View source trace for an existing datapoint. 6. Export compliance gap report. 7. Add a compliance note. |
| **Expected Result** | Readiness score is explainable (drill-down works). Missing datapoints are clearly differentiated from "Not Applicable" ones. Source trace shows: document → extracted field → framework mapping. Export contains all gaps. Notes are saved and visible. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-005 | Portfolio Risk Monitoring — Full User Journey (Ananya)
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh |
| **Steps** | 1. Open Portfolio Dashboard. 2. View ESG heatmap across 10 entities. 3. Click on a red-flagged entity. 4. Review contagion risk connections. 5. Set a custom alert threshold. 6. Simulate threshold breach and confirm alert triggers. |
| **Expected Result** | Heatmap renders all 10 entities correctly colour-coded. Clicking entity navigates without page reload delay >3 seconds. Contagion connections display at minimum 2 degrees. Custom alert saves and triggers on breach. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-006 | Performance Test — Large Dataset Load
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Steps** | Load portfolio view with 100 entities. Measure dashboard load time. Trigger ESG score recalculation for all 100. Measure processing time. |
| **Expected Result** | Dashboard loads within 5 seconds. Bulk recalculation completes within 2 minutes. No timeout errors. UI remains responsive during background processing. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-007 | Error Handling — Missing Required Data
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | Attempt to generate a CSRD report for an entity with only 40% of required ESRS datapoints populated. |
| **Expected Result** | System does not crash. Warning presented: "Report incomplete — X mandatory fields missing. Proceed with gaps highlighted?" User can choose to proceed or cancel. Generated report clearly flags missing sections. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-USE-008 | Session Management & Security
| Field | Detail |
|-------|--------|
| **Persona** | All |
| **Steps** | 1. Leave session idle for 20 minutes. 2. Attempt to interact with platform. 3. Verify re-authentication prompt. 4. Confirm no unsaved data was committed silently. |
| **Expected Result** | Session times out after configured period. Re-login required. Unsaved form data is not lost (either auto-saved as draft or warning shown). |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

***

## MODULE 5A: DATA LINEAGE & TRANSFORMATION VERIFICATION

> **Objective:** Validate that every data point in the platform is fully traceable from its raw source through every transformation layer to its final output — with no silent mutations, rounding errors, or broken lineage chains. This module must be executed in parallel with Modules 2 and 3.

### Data Lineage Architecture Under Test

The AA Impact platform processes data through the following layers. All test cases in this module validate the integrity of each transition:

```
[SOURCE] → [INGESTION LAYER] → [PARSING / EXTRACTION] → [NORMALIZATION] 
    → [TAXONOMY MAPPING] → [CALCULATION ENGINE] → [ANALYTICS OUTPUT] → [REPORT / EXPORT]
```

### TC-LIN-001 | Field-Level Source Traceability
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington (Regulatory Compliance Validator) |
| **Test Data** | Entity with PDF report uploaded (TC-SRC-001 prerequisite) |
| **Steps** | 1. Navigate to any ESG metric on the entity dashboard (e.g., Scope 1 emissions: 12,500 tCO2e). 2. Click the lineage/trace icon next to the value. 3. Review the lineage panel that opens. 4. Verify the chain: Report PDF → Page number → Extracted text → Parsed value → Stored field → Display value. |
| **Expected Result** | Full lineage chain displayed with: source document name, page/section reference, raw extracted text, transformation rule applied (if any), final stored value, and display value. Every step is timestamped. No gaps in the chain. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-LIN-002 | Row-Count Reconciliation Across Layers
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Test Data** | CSV bulk upload of 500 rows (TC-SRC-002 prerequisite) |
| **Steps** | 1. After bulk upload, navigate to Data Pipeline Monitor. 2. Check row counts at each layer: Source (500) → Ingestion → Parsed → Normalized → Stored. 3. Verify counts at each stage. 4. Identify and explain any delta (e.g., 12 rows rejected due to validation). |
| **Expected Result** | Row count at each layer is documented. Any reduction in row count is accompanied by an explicit rejection log with reason per row. No silent data loss. Accepted rows in stored layer = Source rows minus documented rejections. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-LIN-003 | Transformation Rule Validation — Unit Conversion
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Test Data** | Scope 2 electricity consumption: 10,000 MWh (manually entered) |
| **Steps** | 1. Enter 10,000 MWh as electricity consumption for entity. 2. Platform converts to tCO2e using emission factor. 3. Navigate to Lineage → Transformation Log for this field. 4. Verify: input value, emission factor used (source + year), conversion formula, output value. 5. Cross-check output manually: 10,000 MWh × [IEA grid factor tCO2e/MWh] = expected tCO2e. |
| **Expected Result** | Transformation log shows: Input = 10,000 MWh, Emission Factor = [X tCO2e/MWh, IEA 2024, country-specific], Formula = Input × Factor, Output = [calculated value]. Manual cross-check matches platform output within ±0.1%. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-004 | Sentinel Record End-to-End Trace
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Test Data** | A single uniquely identifiable data record (e.g., Company ID: TEST-SENTINEL-001, Scope 3 Category 1 emissions: 99,999 tCO2e) |
| **Steps** | 1. Inject sentinel record via manual entry. 2. Trace record through: Manual Entry → Storage → ESG Score Calculation → Framework Mapping (GRI 305-3) → Report Builder → Exported PDF. 3. At each stage, confirm the value 99,999 tCO2e is intact and attributed to the correct entity and category. |
| **Expected Result** | Sentinel value 99,999 tCO2e appears unchanged at every layer with no rounding, truncation, or misattribution. Final PDF export shows exact value. Lineage log shows complete path across all 6 stages. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-005 | Aggregation Accuracy — Control Totals
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh (Portfolio Manager) |
| **Steps** | 1. Note individual Scope 1 emissions for 5 entities in a portfolio: [E1, E2, E3, E4, E5]. 2. Manually sum the values. 3. Navigate to Portfolio Dashboard → Total Scope 1 Emissions. 4. Compare platform aggregate vs manual sum. |
| **Expected Result** | Platform aggregate = manual sum ±0. No rounding differences. If weighted aggregation is applied, the weighting formula is documented and verifiable. Disaggregation back to entity-level is supported. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-006 | Incremental Data Load — No Duplication
| Field | Detail |
|-------|--------|
| **Persona** | Platform Admin |
| **Steps** | 1. Upload a report for Entity A for FY2023. 2. Upload an updated version of the same report for FY2023 (with one corrected value). 3. Check: (a) old record is versioned/archived, not deleted; (b) new record is active; (c) platform displays the updated value; (d) both versions visible in audit trail. |
| **Expected Result** | Version history preserved. Active value = updated value. No duplication of records in aggregate calculations. Audit log shows: original entry, update event, user, timestamp, before/after values. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-007 | LLM Extraction Confidence & Error Flagging
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | 1. Upload a sustainability report with ambiguous or poorly formatted emissions data (e.g., a table split across pages). 2. Review LLM extraction output. 3. Check confidence scores on extracted values. 4. Verify that low-confidence extractions are flagged for human review. |
| **Expected Result** | Confidence score displayed per extracted field. Values below threshold (e.g., <80% confidence) are marked "Needs Review" and highlighted in the data panel. High-confidence extractions are auto-accepted. No low-confidence value is silently committed to the analytics engine without user review. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-008 | Calculation Engine — ESG Score Decomposition
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta + James Harrington |
| **Steps** | 1. Open an entity with a composite ESG score (e.g., 62.4). 2. Click "Decompose Score". 3. Verify: E pillar sub-score, S pillar sub-score, G pillar sub-score, and their weights sum to composite. 4. Click into E sub-score → verify which metrics contributed and their individual weights. 5. Trace one contributing metric back to its source document. |
| **Expected Result** | Composite score = weighted sum of E+S+G sub-scores (verifiable formula shown). Sub-score drill-down available to metric level. Each metric traceable to source document/entry. Methodology documentation accessible inline. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-009 | Cross-Framework Mapping Consistency
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Select one source data field (e.g., Total Water Withdrawal). 2. Navigate to Framework Mapping panel. 3. Verify the same source value maps correctly to: GRI 303-3, SASB IF-EU-140a.1, and TCFD (physical risk metric). 4. Confirm no value divergence across frameworks (same source → same number in all three mappings). |
| **Expected Result** | Source value appears identically across all three framework mappings. No rounding inconsistency. Framework-specific units/labels applied correctly (e.g., megalitres for GRI, acre-feet for SASB US). Mapping logic documented. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-LIN-010 | Report Output vs Platform Data — Exact Match Audit
| Field | Detail |
|-------|--------|
| **Persona** | James Harrington |
| **Steps** | 1. Export CSRD report to PDF. 2. Select 10 specific quantitative values from the PDF. 3. Navigate back to the entity data panel in the platform. 4. Compare each PDF value against the platform stored value. 5. Record any discrepancy. |
| **Expected Result** | All 10 values in PDF exactly match platform stored values. No rounding introduced during PDF generation. Units consistent between platform and PDF. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### Data Lineage Test Summary Table

| Test Case | Lineage Layer Tested | Critical? |
|-----------|---------------------|-----------|
| TC-LIN-001 | Source → Display (field-level) | ✅ Yes |
| TC-LIN-002 | Source → Storage (row count) | ✅ Yes |
| TC-LIN-003 | Transformation rule (unit conversion) | ✅ Yes |
| TC-LIN-004 | Full end-to-end sentinel trace | ✅ Yes |
| TC-LIN-005 | Aggregation control totals | ✅ Yes |
| TC-LIN-006 | Incremental load / versioning | ✅ Yes |
| TC-LIN-007 | LLM confidence + flagging | ⚠️ High |
| TC-LIN-008 | Score decomposition | ✅ Yes |
| TC-LIN-009 | Cross-framework mapping consistency | ✅ Yes |
| TC-LIN-010 | Report PDF vs platform exact match | ✅ Yes |

***

## MODULE 5: CROSS-MODULE CONNECTIVITY & DATA FLOW

> **Objective:** Validate that data flows correctly across modules — a change in source data propagates correctly through to all dependent outputs.

### TC-CON-001 | End-to-End Data Propagation
| Field | Detail |
|-------|--------|
| **Personas** | Priya + James + Ananya |
| **Steps** | 1. Update Scope 1 emissions for an entity (change from 12,500 to 15,000 tCO2e). 2. Verify update propagates to: ESG Score, Framework Mappings, Scenario Analysis, Portfolio Dashboard, Audit Trail — within 5 minutes. |
| **Expected Result** | All downstream modules reflect the updated value. ESG score recalculates. Compliance readiness score updates if threshold crossed. Portfolio aggregate carbon exposure updates. Audit trail logs the change. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-CON-002 | Materiality → Report Builder Integration
| Field | Detail |
|-------|--------|
| **Persona** | Priya Mehta |
| **Steps** | Complete a materiality assessment. Navigate to Report Builder. Generate CSRD report. Verify material topics identified in DME appear as prioritised disclosures in the report. |
| **Expected Result** | Top 5 material topics from DME appear as highlighted disclosure areas in the CSRD report. Topics ranked below materiality threshold are deprioritised or excluded. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-CON-003 | Scenario Analysis → Financial Risk → Portfolio View
| Field | Detail |
|-------|--------|
| **Persona** | Ananya Singh |
| **Steps** | Run NGFS scenario for an entity. Navigate to Portfolio View. Confirm scenario-adjusted financial risk metrics (PD/LGD) are reflected in portfolio exposure calculations. |
| **Expected Result** | Portfolio exposure metrics toggle between "current" and "scenario-adjusted" views. Scenario used is labelled. Values differ from baseline in a directionally correct manner. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

***

## MODULE 6: PERSONA — RENEWABLE ENERGY DEVELOPER (Kavya Reddy)

> **Objective:** Validate all platform functions from the perspective of a renewable energy developer sustainability team — covering energy-sector-specific data ingestion, lifecycle emissions, avoided emissions calculations, BRSR/GRI-E sector mappings, community disclosures, and investor-grade report generation.

### TC-REN-001 | Project-Level Energy Generation Data Entry
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy (Renewable Energy Developer) |
| **Test Data** | Solar facility: 250 MW installed capacity, 450,000 MWh generated in FY2024, capacity factor: 20.5% |
| **Steps** | 1. Create a new entity: "Sunrise Solar Park — Rajasthan". 2. Navigate to Environmental → Energy Generation. 3. Enter: installed capacity (250 MW), annual generation (450,000 MWh), energy type (solar PV), reporting year (FY2024). 4. Save. 5. Verify capacity factor auto-calculates (450,000 MWh / [8,760 hrs × 250 MW] = 20.5%). |
| **Expected Result** | All fields save correctly. Capacity factor auto-calculated and matches expected 20.5% ±0.1%. Generation data attributed to correct facility and year. Values appear in environmental metrics panel and GRI Energy section. |
| **Actual Result** | _[To be completed]_ |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |
| **Notes** | |

### TC-REN-002 | Avoided Emissions Calculation
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Test Data** | 450,000 MWh generated; Indian grid emission factor: 0.716 tCO2e/MWh (CEA 2023) |
| **Steps** | 1. Navigate to Environmental → Avoided Emissions. 2. Link solar facility generation (450,000 MWh). 3. Select grid emission factor: India — CEA 2023. 4. Trigger calculation. 5. Verify: Avoided Emissions = 450,000 × 0.716 = 322,200 tCO2e. 6. View lineage to confirm factor source. |
| **Expected Result** | Platform calculates 322,200 tCO2e avoided emissions. Grid emission factor source (CEA 2023) cited in lineage. Avoided emissions displayed separately from Scope 1/2 gross emissions. Not double-counted in carbon footprint. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-003 | Lifecycle Emissions — Construction + Operations + Decommissioning
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Steps** | 1. Navigate to Environmental → Lifecycle Emissions. 2. Enter Phase 1 — Construction: 18,500 tCO2e (steel, concrete, transport). 3. Enter Phase 2 — Operations FY2024: 320 tCO2e (maintenance, inverters). 4. Enter Phase 3 — Decommissioning estimate: 2,200 tCO2e. 5. View lifecycle summary. 6. Verify total lifecycle emissions displayed and phased correctly. |
| **Expected Result** | Three lifecycle phases stored independently. Total lifecycle = 20,020 tCO2e (sum of all three). Platform does not aggregate lifecycle emissions into annual operational Scope 1 without user instruction. Phase labels clear. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-004 | Land Use & Biodiversity Disclosure
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Steps** | 1. Navigate to Environmental → Land Use & Biodiversity. 2. Enter: total land area (1,200 hectares), land type (agricultural conversion), biodiversity assessment conducted (Yes), proximity to protected area (No), mitigation measures (pollinator corridors, native plantings). 3. Save and view GRI 304 mapping. |
| **Expected Result** | Fields save correctly. Biodiversity assessment status visible. GRI 304-1 and 304-2 disclosure fields auto-populate from entries. Proximity to protected area field affects risk flag (if Yes → flag raised). |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-005 | BRSR Framework Mapping — Renewable Energy Sector
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy + James Harrington |
| **Steps** | 1. Enable BRSR framework for the entity. 2. Navigate to Framework Mapping → BRSR. 3. Verify the following BRSR Principle disclosures map correctly from entered data: (a) Principle 6 — Environment: energy generation, emissions, land use; (b) Principle 2 — Sustainable Products: renewable energy output metrics; (c) Essential + Leadership indicators for energy sector. |
| **Expected Result** | BRSR Principle 6 essential indicators populated from Environmental module data. Leadership indicators marked as complete or flagged as pending. Energy sector-specific BRSR datapoints (if configured) mapped correctly. No GRI/CSRD framework data bleeds into BRSR output. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-006 | Renewable Energy Certificates (RECs) Tracking
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Steps** | 1. Navigate to Environmental → RECs / I-RECs. 2. Enter: RECs issued = 450,000 (1 REC = 1 MWh), RECs retired = 320,000, RECs unsold = 130,000. 3. View REC dashboard. 4. Verify that retired RECs are correctly attributed to buyer entities if applicable. |
| **Expected Result** | REC inventory correctly shows issued/retired/unsold breakdown. Retired RECs linked to buyer entities (if configured). No REC count exceeds generation volume. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-007 | Community & Social Impact Disclosures
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Steps** | 1. Navigate to Social → Community Engagement. 2. Enter: local employment created (850 construction jobs, 42 permanent operations jobs), community programs (2 solar literacy initiatives), land acquisition disputes (0), community grievance mechanism (Yes — active). 3. Save and view GRI 413 mapping. |
| **Expected Result** | All fields save correctly. GRI 413-1 (local community engagement) auto-mapped. Employment figures appear in GRI 401 (Employment) disclosure. Grievance mechanism status affects social risk score. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-008 | Investor-Grade Sustainability Report Generation
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Steps** | 1. Navigate to Report Builder. 2. Select entity: Sunrise Solar Park. 3. Choose template: GRI Standards (Energy Sector) + BRSR. 4. Select reporting year: FY2024. 5. Generate report. 6. Verify the following sections exist and are populated: Energy Generation, GHG Emissions, Avoided Emissions, Lifecycle Emissions, Land Use, Community Impact, REC Summary. |
| **Expected Result** | Report generated within 45 seconds. All 7 sections populated. Avoided emissions presented as a separate addendum (not within Scope 1/2 totals). Lifecycle emissions phased by construction/operations/decommissioning. Report is structured per GRI Universal Standards + GRI 302 (Energy) + GRI 305 (Emissions) + GRI 304 (Biodiversity) + GRI 413 (Local Communities). |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-009 | Multi-Facility Portfolio Rollup (Renewable Developer)
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy |
| **Test Data** | 3 facilities: Rajasthan Solar (250 MW), Tamil Nadu Wind (180 MW), Gujarat Hybrid (120 MW) |
| **Steps** | 1. Create all three facility entities. 2. Group them under one developer portfolio. 3. Navigate to Portfolio → Energy Developer View. 4. Verify aggregated: total installed capacity (550 MW), total generation (MWh), total avoided emissions, combined land footprint. |
| **Expected Result** | All aggregations correct. Capacity = 550 MW. Generation = sum of three facilities. Avoided emissions = sum (each using facility-specific grid factors). Land footprint = sum. No double-counting. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### TC-REN-010 | SFDR PAI Indicator Mapping (Investor Exposure)
| Field | Detail |
|-------|--------|
| **Persona** | Kavya Reddy + James Harrington |
| **Steps** | 1. Enable SFDR PAI indicators for the entity (relevant for European investor disclosures). 2. Verify the following PAIs auto-populate from existing data: PAI 1 (GHG Emissions), PAI 4 (Biodiversity-sensitive areas), PAI 7 (Non-renewable energy consumption ratio). 3. Check that renewable energy generation data correctly reduces PAI 7 non-renewable ratio. |
| **Expected Result** | PAI indicators populated from existing Environmental data without re-entry. PAI 7 ratio = non-renewable energy / total energy (should be 0% for a pure renewable developer). Biodiversity PAI 4 reflects land-use entries. |
| **Status** | ☐ Pass ☐ Fail ☐ Partial ☐ Blocked |

### Renewable Energy Persona — Key Validation Checks

| Validation Area | What to Check | Pass Criterion |
|-----------------|---------------|----------------|
| Avoided emissions | Calculated separately from gross emissions | Not included in Scope 1/2 totals |
| Lifecycle phases | Construction / Operations / Decommission stored independently | No phase aggregation into annual Scope 1 |
| Grid emission factor | Source + year cited in lineage | CEA/IEA factor traceable per facility |
| REC tracking | Issued ≥ Retired; no over-retirement | Inventory balance = 0 or positive |
| BRSR vs GRI | No data cross-contamination between frameworks | Separate output sections confirmed |
| PAI indicators | Auto-populated, no manual re-entry needed | ≥3 PAIs correctly mapped |
| Multi-facility rollup | Aggregates correct, no double-counting | Manual sum matches platform aggregate |

***

## DEFECT LOG TEMPLATE

Use the following structure for every defect found during UAT:

```
DEFECT ID:        DEF-[Module]-[###]  (e.g., DEF-SRC-001)
Test Case ID:     TC-[Module]-[###]
Severity:         P1-Critical / P2-High / P3-Medium / P4-Low
Title:            [Short description of defect]
Persona Affected: [Which persona encountered this]
Steps to Reproduce:
  1.
  2.
  3.
Expected Result:  [What should have happened]
Actual Result:    [What actually happened]
Screenshot/Log:   [Reference]
Environment:      [Browser, OS, User Role]
Date Found:       [DD-MM-YYYY]
Assigned To:      [Developer]
Status:           Open / In Progress / Resolved / Retested / Closed
```

### Severity Definitions

| Level | Label | Definition | Target Fix Time |
|-------|-------|------------|-----------------|
| P1 | Critical | Application crash, data loss, security breach, complete feature failure | Immediate — blocks UAT |
| P2 | High | Major feature broken, incorrect data output, framework mismap | 24–48 hours |
| P3 | Medium | Minor functional issue, UI inconsistency, non-critical calculation discrepancy | 3–5 days |
| P4 | Low | Cosmetic issue, minor UX improvement, tooltip errors | Next sprint |

***

## ENHANCEMENT LOG TEMPLATE

Track improvement opportunities separately from defects:

```
ENHANCEMENT ID:   ENH-[###]
Module:           [Module name]
Discovered By:    [Persona / Tester]
Description:      [What enhancement would improve the experience]
Business Value:   [Why this matters for the user or compliance]
Priority:         High / Medium / Low
Status:           Logged / Under Review / Accepted / Deferred
```

***

## UAT EXIT CRITERIA

UAT is considered **complete and sign-off eligible** when ALL of the following are met:

| Criterion | Required Threshold | Status |
|-----------|--------------------|--------|
| Critical (P1) defects | 0 open | ☐ |
| High (P2) defects | 0 open (or formally accepted with mitigation) | ☐ |
| Test case execution rate | ≥ 95% of all test cases executed | ☐ |
| Pass rate | ≥ 90% of executed test cases pass | ☐ |
| End-to-end data propagation | 100% — TC-CON-001 must PASS | ☐ |
| All five persona journeys | All five full user journeys completed | ☐ |
| Data lineage validation | All TC-LIN tests pass (especially TC-LIN-001, TC-LIN-004, TC-LIN-010) | ☐ |
| Renewable energy data accuracy | TC-REN-002 (avoided emissions) and TC-REN-003 (lifecycle) must PASS | ☐ |
| Audit trail validation | TC-OUT-008 must PASS | ☐ |
| Framework mapping accuracy | ESRS/TCFD/GRI mappings ≥ 95% accuracy | ☐ |
| Performance benchmarks | All performance tests within defined thresholds | ☐ |

***

## UAT SIGN-OFF

| Role | Name | Signature | Date | Decision |
|------|------|-----------|------|----------|
| ESG Analytics Lead (Priya) | | | | ☐ Approve ☐ Reject |
| Compliance Validator (James) | | | | ☐ Approve ☐ Reject |
| Portfolio Manager (Ananya) | | | | ☐ Approve ☐ Reject |
| Renewable Energy Developer (Kavya) | | | | ☐ Approve ☐ Reject |
| Platform Admin | | | | ☐ Approve ☐ Reject |
| Product Owner (AA Impact) | | | | ☐ Approve ☐ Reject |

> **Sign-off Decision:** ☐ Approved for Production Release &nbsp;&nbsp; ☐ Conditional Approval (minor defects accepted) &nbsp;&nbsp; ☐ Rejected — Re-test Required

***

*Document Version: 1.0 | Prepared for AA Impact Inc. | April 2026*