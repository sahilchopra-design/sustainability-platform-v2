# Invoice Parser
**Module ID:** `invoice-parser` · **Route:** `/invoice-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered extraction engine that parses utility bills, fuel invoices, and refrigerant purchase records to derive Scope 1 and Scope 2 emission activity data. Applies NLP and document structure recognition to extract quantity, unit, fuel type, and billing period with confidence scoring. Eliminates manual data entry and reduces metering gaps in GHG inventory compilation.

> **Business value:** Reduces invoice-to-inventory processing time from days to minutes for corporate sustainability teams, improving data completeness and audit traceability for GHG Protocol-aligned Scope 1 and 2 disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CURRENCY_SYMBOLS`, `KEYWORD_LIST`, `MERCHANT_CATEGORIES`, `PIE_COLORS`, `RECEIPT_KEYWORDS`, `SAMPLE_RECEIPTS`, `SWAP_MAP`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `priceMatch` | `line.match(/[$\u20AC\u00A3\u20B9\u00A5]?\s*(\d+[.,]\d{2})/);` |
| `qtyMatch` | `line.match(/(\d+(?:\.\d+)?)\s*(x\|\u00D7\|pcs?\|kg\|g\|lb\|l\|ml\|doz\|gal)/i);` |
| `entry` | `{ id: Date.now(), date: new Date().toISOString().slice(0, 10), itemCount: items.length, totalCarbon: items.reduce((s, i) => s + i.carbon_kg, 0), snipp` |
| `newTxns` | `parsedItems.map(it => ({` |
| `totalCarbon` | `useMemo(() => parsedItems.reduce((s, i) => s + i.carbon_kg, 0), [parsedItems]);` |
| `rows` | `parsedItems.map(i => `"${i.line}","${i.matched_keyword}",${i.quantity},${i.amount ?? ''},${i.carbon_kg},${i.category},${i.confidence}`).join('\n');` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `savedKg` | `s.carbon_kg - (s.swap.alt_carbon * s.quantity);` |
| `catEl` | `document.getElementById(`cat-${um.id}`);` |
| `drivingKm` | `(it.carbon_kg / 0.21).toFixed(1);` |
| `phoneDays` | `(it.carbon_kg / 0.008 / 365).toFixed(2);` |
| `showerMins` | `(it.carbon_kg / 0.037).toFixed(0);` |
| `avgCarbon` | `catItems.length > 0 ? (cat.value / catItems.length).toFixed(2) : 0;` |
| `maxItem` | `catItems.reduce((m, c) => c.carbon_kg > (m?.carbon_kg \|\| 0) ? c : m, null);` |
| `pct` | `totalCarbon > 0 ? ((cat.value / totalCarbon) * 100).toFixed(1) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SAMPLE_RECEIPTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Extraction Accuracy (%) | — | Internal benchmark dataset | F1 score on quantity and unit field extraction across invoice types |
| Emission Factor Match Rate (%) | — | DEFRA / eGRID lookup tables | Proportion of line items successfully matched to a published emission factor |
| Confidence Score | — | NLP model output | Per-field extraction confidence; items below 0.7 flagged for manual review |
| Scope Attribution | — | GHG Protocol category mapping | Automatic scope and category assignment based on fuel/utility type |
- **Uploaded PDF / image invoices** → OCR text extraction; layout analysis; field segmentation → **Structured table of quantity, unit, fuel type, and billing period per line item**
- **DEFRA / eGRID / IPCC factor databases** → Match fuel/utility type and jurisdiction to factor table; apply year-specific values → **Emission factor per extracted line item with source citation**
- **Validated extraction output** → Aggregate by source, scope, and period; apply confidence threshold filter → **Scope 1 and Scope 2 activity data file ready for GHG inventory ingestion**

## 5 · Intermediate Transformation Logic
**Methodology:** Emission Factor Mapping
**Headline formula:** `Eᵢ = Qᵢ × EFᵢ × CVᵢ`
**Standards:** ['GHG Protocol Corporate Standard', 'IPCC AR6 Emission Factors', 'DEFRA Conversion Factors 2023', 'US EPA eGRID 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).