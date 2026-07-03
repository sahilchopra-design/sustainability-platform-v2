# LLM ESG Extractor
**Module ID:** `llm-esg-extractor` · **Route:** `/llm-esg-extractor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Large language model-powered extraction engine that identifies, classifies, and normalises ESG data points from unstructured sources including sustainability reports, proxy statements, press releases, contracts, and regulatory filings. Maps extracted entities to ESRS, SASB, GRI, and SFDR data point taxonomies with confidence scoring and evidence citation. Enables systematic ESG data collection at scale without manual analyst input.

> **Business value:** Scales ESG data collection by orders of magnitude, enabling investment teams and sustainability officers to extract structured, taxonomy-aligned ESG data from thousands of documents in hours rather than weeks of manual analyst effort.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `Card`, `FRAMEWORKS`, `LLM_MODELS`, `LOW_CONF_REASONS`, `SectionTitle`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Extraction Studio', 'Framework Coverage', 'Confidence Intelligence', 'KPI Extraction', 'Multi-Doc Comparison'];` |
| `EXTRACTION_STEPS` | `['Parsing', 'Chunking', 'Extracting', 'Validating', 'Cross-mapping'];` |
| `seed` | `selectedCompany.id * 31;` |
| `allFields` | `selectedFrameworks.flatMap(fw => (FRAMEWORKS[fw] \|\| []).map(f => ({ ...f, framework: fw })));` |
| `conf` | `0.45 + sr(seed + i * 7) * 0.53;` |
| `pageRef` | `extracted ? Math.floor(sr(seed + i) * 280) + 20 : null;` |
| `kpiVal` | `extracted ? (sr(seed + i * 3) * 900000 + 1000).toFixed(0) : null;` |
| `avgConf` | `extracted.length ? extracted.reduce((a, b) => a + b.confidence, 0) / extracted.length : 0;` |
| `tokens` | `Math.floor(sr(selectedCompany.id * 13) * 40000 + 60000);` |
| `seed` | `selectedCompany.id * 17 + fws.indexOf(fw) * 5;` |
| `covered` | `fields.filter((_, i) => sr(seed + i * 9) > 0.38).length;` |
| `radarData` | `useMemo(() => frameworkCoverage.map(f => ({ subject: f.framework, A: f.coverage })), [frameworkCoverage]);` |
| `seed` | `selectedCompany.id * 23;` |
| `extracted` | `parseFloat((k.sectorAvg * (0.5 + sr(seed + i * 11) * 0.9)).toFixed(1));` |
| `delta` | `extracted - k.sectorAvg;` |
| `seed` | `selectedCompany.id * 19;` |
| `seed` | `c.id * 41;` |
| `completeness` | `Math.round(50 + sr(seed) * 45);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `EXTRACTION_STEPS`, `LLM_MODELS`, `LOW_CONF_REASONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Extraction Recall (%) | — | Internal labelled ESG corpus | Proportion of ground-truth ESG data points successfully extracted from documents |
| Extraction Precision (%) | — | Internal labelled ESG corpus | Proportion of extracted data points that are correct, avoiding false positives |
| ESRS Taxonomy Coverage (%) | — | CSRD ESRS data point list 2023 | Proportion of mandatory ESRS data points for which at least one extraction is available |
| Average ECS | — | Model calibration output | Mean extraction confidence score across all extracted data points in a batch run |
- **Uploaded PDF / DOCX sustainability reports** → OCR if required; section parser; table and text segmentation → **Structured document corpus with page, section, and paragraph metadata**
- **Fine-tuned LLM extraction pipeline** → Apply NER + span extraction; map to taxonomy identifiers; score confidence → **Extracted data point table with value, unit, evidence snippet, ECS, and taxonomy mapping**
- **Human review annotation layer** → Accept / correct / reject per extraction; retrain model on corrections → **Validated ESG data set with provenance chain and model improvement feedback**

## 5 · Intermediate Transformation Logic
**Methodology:** Extraction Confidence Score
**Headline formula:** `ECS = P(correct entity) × P(correct value) × P(correct unit)`
**Standards:** ['GRI Universal Standards 2021', 'CSRD ESRS Data Point Taxonomy 2023', 'SASB Standards Taxonomy', 'NLP Confidence Calibration â€” Platt Scaling']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).