# NLP Disclosure Parser
**Module ID:** `nlp-disclosure-parser` · **Route:** `/nlp-disclosure-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Uses natural language processing to extract structured ESG KPIs, metrics, and qualitative disclosures from regulatory filings (CSRD, TCFD, CDP, SFDR), reducing manual data collection burden.

> **Business value:** Automates the labour-intensive extraction of ESG KPIs from regulatory filings, enabling faster, more consistent data collection for ESG scoring, portfolio monitoring, and regulatory reporting workflows.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLAIMS`, `CLAIM_TEXTS`, `CLAIM_TYPES`, `COMMITMENTS`, `COMMITMENT_TEXTS`, `COMMITMENT_TYPES`, `COMPANIES`, `COMPLIANCE_MATRIX`, `COVERAGE_TYPES`, `DATA_SOURCES`, `DOCUMENTS`, `DOC_TYPES`, `ESRS_STANDARDS`, `EXCERPT_TEXTS`, `EXTRACTIONS`, `FRAMEWORKS`, `GAPS`, `GREENWASH_FLAGS`, `GW_CATEGORIES`, `GW_COLOR`, `GW_PHRASES`, `GW_RISKS`, `GW_SEVERITIES`, `KpiCard`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DOC_TYPES` | `['Annual Report','Sustainability Report','CDP Response','TCFD Report','SFDR PAI','Proxy Statement','10-K','ESG Supplement'];` |
| `sector` | `SECTORS[Math.floor(sr(i * 3) * 10)];` |
| `year` | `2022 + Math.floor(sr(i * 7) * 5);` |
| `type` | `DOC_TYPES[Math.floor(sr(i * 11) * 8)];` |
| `pages` | `Math.floor(sr(i * 13) * 350) + 50;` |
| `wordCount` | `Math.floor(sr(i * 17) * 105000) + 15000;` |
| `language` | `LANGUAGES[Math.floor(sr(i * 19) * 6)];` |
| `extracted` | `sr(i * 23) > 0.25;` |
| `greenwashScore` | `Math.floor(sr(i * 29) * 100);` |
| `compliancePct` | `Math.floor(sr(i * 31) * 70) + 30;` |
| `STANDARD_MAPPED` | `['ESRS E1-4','ESRS E1-1','ESRS E1-5','ESRS E4-2','ESRS E3-1','ESRS S2-3','ESRS S1-16','ESRS G1-2','IFRS S2-6','IFRS S2-14','ESRS E1-8','ESRS E1-3'];` |
| `EXTRACTIONS` | `EXCERPT_TEXTS.map((excerpt, i) => ({` |
| `GW_CATEGORIES` | `['Vague Claims','Unsubstantiated Targets','Missing Baselines','Cherry-picking Data','Misleading Scope','False Labeling','Offsetting Abuse','Regulatory` |
| `GREENWASH_FLAGS` | `DOCUMENTS.map((doc, i) => ({` |
| `COVERAGE_TYPES` | `['Company','Group','Scope 1-3'];` |
| `VERIFICATION_SOURCES` | `['Third-party audit','CDP','SBTi','UNFCCC','Unverified'];` |
| `RISK_TYPES` | `['Greenwashing','Non-compliance','Completeness Gap','Ambiguity'];` |
| `COMPLIANCE_MATRIX` | `DOCUMENTS.slice(0, 40).map((doc, i) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLAIM_TEXTS`, `CLAIM_TYPES`, `COMMITMENT_TEXTS`, `COMMITMENT_TYPES`, `COMPANIES`, `COVERAGE_TYPES`, `DATA_SOURCES`, `DOC_TYPES`, `ESRS_STANDARDS`, `EXCERPT_TEXTS`, `FRAMEWORKS`, `GAPS`, `GW_CATEGORIES`, `GW_PHRASES`, `GW_RISKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| KPI Categories Extracted | — | Internal NLP Framework | Number of distinct ESG and climate KPI categories the parser can extract across GHG, water, social, governance |
| Extraction F1 Score (Scope 1/2 GHG) | — | Internal Validation 2024 | Measured F1 accuracy for Scope 1 and 2 GHG extraction from CSRD and TCFD-aligned reports in validation corpus. |
- **Regulatory filing PDFs, XBRL iXBRL documents, CDP questionnaire responses, TCFD reports** → NLP pipeline: tokenisation, NER, relation extraction, unit normalisation → **Structured ESG KPI datasets, extraction confidence scores, audit trails**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Accuracy
**Headline formula:** `F1 = 2 × (Precision × Recall) / (Precision + Recall)`
**Standards:** ['Devlin et al. BERT 2018', 'FinBERT NLP 2020']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).