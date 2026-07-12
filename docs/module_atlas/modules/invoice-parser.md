# Invoice Parser
**Module ID:** `invoice-parser` · **Route:** `/invoice-parser` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered extraction engine that parses utility bills, fuel invoices, and refrigerant purchase records to derive Scope 1 and Scope 2 emission activity data. Applies NLP and document structure recognition to extract quantity, unit, fuel type, and billing period with confidence scoring. Eliminates manual data entry and reduces metering gaps in GHG inventory compilation.

> **Business value:** Reduces invoice-to-inventory processing time from days to minutes for corporate sustainability teams, improving data completeness and audit traceability for GHG Protocol-aligned Scope 1 and 2 disclosures.

**How an analyst works this module:**
- Upload batch of utility bills, fuel receipts, or refrigerant service records in PDF or image format
- Review extraction results table with highlighted fields and confidence scores per document
- Correct low-confidence extractions using the inline editor before accepting into the inventory
- Confirm emission factor assignments and override jurisdiction grid intensity where metered renewable data applies
- Export validated activity data to GHG inventory or direct Scope 1/2 reporting engine integration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CURRENCY_SYMBOLS`, `KEYWORD_LIST`, `MERCHANT_CATEGORIES`, `PIE_COLORS`, `RECEIPT_KEYWORDS`, `SAMPLE_RECEIPTS`, `SWAP_MAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SAMPLE_RECEIPTS` | 6 | `icon`, `text` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `priceMatch` | `line.match(/[$\u20AC\u00A3\u20B9\u00A5]?\s*(\d+[.,]\d{2})/);` |
| `qtyMatch` | `line.match(/(\d+(?:\.\d+)?)\s*(x\|\u00D7\|pcs?\|kg\|g\|lb\|l\|ml\|doz\|gal)/i);` |
| `entry` | `{ id: Date.now(), date: new Date().toISOString().slice(0, 10), itemCount: items.length, totalCarbon: items.reduce((s, i) => s + i.carbon_kg, 0), snippet: receiptText.slice(0, 80) };` |
| `newTxns` | `parsedItems.map(it => ({` |
| `totalCarbon` | `useMemo(() => parsedItems.reduce((s, i) => s + i.carbon_kg, 0), [parsedItems]);` |
| `barData` | `useMemo(() => [...parsedItems].sort((a, b) => b.carbon_kg - a.carbon_kg).slice(0, 15).map(i => ({ name: i.matched_keyword.length > 12 ? i.matched_keyword.slice(0, 12) + '...' : i.matched_keyword, carbon: +i.carbon_kg.toFixed(2), })), [parsedItems]);` |
| `swapSuggestions` | `useMemo(() => parsedItems.filter(i => SWAP_MAP[i.matched_keyword]).map(i => ({ ...i, swap: SWAP_MAP[i.matched_keyword] })), [parsedItems]);` |
| `equivs` | `useMemo(() => carbonEquivalences(totalCarbon), [totalCarbon]);  /* ── Exports ── */ const exportCSV = useCallback(() => { const header = 'Line,Keyword,Qty,Amount,Carbon_kg,Category,Confidence\n';` |
| `rows` | `parsedItems.map(i => `"${i.line}","${i.matched_keyword}",${i.quantity},${i.amount ?? ''},${i.carbon_kg},${i.category},${i.confidence}`).join('\n');` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
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

Extracted quantity (Q) in native units is converted using calorific value (CV) where required and multiplied by the applicable IPCC or DEFRA emission factor. Grid electricity factors use location-based eGRID/IEA grid intensity by jurisdiction and year. Confidence scores reflect OCR quality, unit disambiguation accuracy, and emission factor coverage.

**Standards:** ['GHG Protocol Corporate Standard', 'IPCC AR6 Emission Factors', 'DEFRA Conversion Factors 2023', 'US EPA eGRID 2023']
**Reference documents:** GHG Protocol Corporate Accounting and Reporting Standard 2015; DEFRA UK Government GHG Conversion Factors 2023; US EPA eGRID 2023 Subregion Emission Factors; IPCC AR6 WG3 Annex II â€” Emission Factor Tables 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **AI/NLP/OCR extraction
> engine** — "document structure recognition", ">94% F1", "confidence scores reflect OCR quality",
> emission factors from DEFRA/eGRID/IPCC with calorific-value conversion `E = Q × EF × CV`. **The code
> does none of that.** It is a **deterministic keyword-matching parser**: it splits pasted text into
> lines, regex-matches quantities and prices, and looks each keyword up in a hard-coded 60-entry
> factor table. There is no OCR, no ML model, no CV conversion — "confidence" is a static per-keyword
> constant, not a model output. What *is* genuine is the core carbon arithmetic `carbon = qty × factor`
> over real per-item factors. Sections below document the code.

### 7.1 What the module computes

For each receipt line the parser finds a keyword, extracts quantity/price by regex, and multiplies:

```js
priceMatch = line.match(/[$€£₹¥]?\s*(\d+[.,]\d{2})/)
qtyMatch   = line.match(/(\d+(?:\.\d+)?)\s*(x|×|pcs?|kg|g|lb|l|ml|doz|gal)/i)
carbon_kg  = quantity × RECEIPT_KEYWORDS[keyword].carbon_per_unit
totalCarbon= Σ parsedItems.carbon_kg
```

Confidence is the static table value; scope/category come from the keyword's `category` field
(Food / Transport / Home). Swap suggestions and equivalences are derived downstream:

```js
savedKg = item.carbon_kg − (swap.alt_carbon × quantity)        // lower-carbon substitute
drivingKm = carbon_kg / 0.21   phoneDays = carbon_kg/0.008/365   showerMins = carbon_kg/0.037
```

### 7.2 Parameterisation / provenance

| Element | Examples | Provenance |
|---|---|---|
| `RECEIPT_KEYWORDS` (60+ items) | beef 27.0, lamb 24.0, cheese 13.5, chicken 6.9, milk 3.15, apple 0.4 kgCO₂e/unit | Real lifecycle factors (Poore & Nemecek 2018-consistent food footprints) |
| Fuel factors | petrol 2.31, diesel 2.68 kgCO₂e/litre | DEFRA-consistent combustion factors |
| Electricity | 0.42 kgCO₂e/kWh | Grid intensity (DEFRA/eGRID-range) |
| `match_confidence` | 0.5–0.95 per keyword | **Static constant**, not a model score |
| `MERCHANT_CATEGORIES` | walmart→Grocery, shell→Fuel Station | Hard-coded merchant map |
| `CURRENCY_SYMBOLS` | USD 1.0, EUR 1.08, GBP 1.27, INR 0.012, JPY 0.0067 | FX rates (static) |
| Equivalence factors | 0.21 kg/km, 0.008 kg/phone-day, 0.037 kg/shower-min | Hard-coded consumer equivalences |

No `sr()` PRNG is present — outputs are deterministic given the input text.

### 7.3 Calculation walkthrough

1. `parseReceipt(text)` splits into non-empty lines; per line, scans `KEYWORD_LIST` for a substring
   match and extracts quantity (regex) and price (regex).
2. Matched line → `carbon_kg = quantity × carbon_per_unit`, tagged with category and confidence.
3. Unmatched lines are collected for manual categorisation.
4. `totalCarbon` sums all items; `barData` shows the top-15 emitters; `swapSuggestions` maps items
   with a `SWAP_MAP` entry to a lower-carbon alternative and computes `savedKg`.
5. `equivs` converts total carbon into relatable equivalences; category breakdown computes each
   category's share `pct = cat.value/totalCarbon×100`.

### 7.4 Worked example

Receipt lines: `"2 kg beef  $18.00"`, `"1.5 kg chicken  $9.00"`, `"40 litre petrol  $60.00"`:

| Line | keyword | qty | factor | carbon_kg |
|---|---|---|---|---|
| beef | beef | 2 kg | 27.0 | 2 × 27.0 = **54.0** |
| chicken | chicken | 1.5 kg | 6.9 | 1.5 × 6.9 = **10.35** |
| petrol | petrol | 40 litre | 2.31 | 40 × 2.31 = **92.4** |
| **Total** | | | | **156.75 kgCO₂e** |

Equivalence: `drivingKm = 156.75 / 0.21 ≈ 746 km`. Swap: replacing beef (54.0) with an
`alt_carbon = 6.9` chicken over 2 units → `savedKg = 54.0 − (6.9×2) = 40.2 kg` avoided.

### 7.5 Companion analytics on the page

- **Top-15 emitter bar** and **category pie** (Food/Transport/Home share).
- **Swap suggestions** with per-item avoided-carbon.
- **Equivalences** (driving km, phone-charge days, shower minutes).
- **CSV export** of all parsed line items with keyword, qty, amount, carbon, category, confidence.
- **Sample receipts** for quick demo.

### 7.6 Data provenance & limitations

- Emission factors are **real, hard-coded per-item lifecycle values** (deterministic; no PRNG).
- The "AI/NLP/OCR" framing is inaccurate — this is regex + substring keyword matching. Confidence is
  a fixed table value, so items below 0.7 are flagged by construction, not by a model.
- No calorific-value conversion (`CV`) despite the guide's `E = Q×EF×CV`; factors are already
  per-native-unit.
- Coverage is limited to the 60-item keyword table; anything outside it is "unmatched".
- Grid electricity factor is a single global constant, not jurisdiction/year-specific eGRID/IEA.

**Framework alignment:** *GHG Protocol* — items are tagged to Scope 1 (fuel), Scope 2 (electricity),
or Scope 3 (goods), matching the Protocol's category logic at a consumer level. *DEFRA / IPCC / eGRID*
— fuel and electricity factors are consistent with published conversion factors, though hard-coded
rather than looked up live. Because the core `carbon = qty × factor` computation is genuine and the
factors are real published values, no production model specification is required; the honest
production upgrade is OCR + a live factor-lookup service and a real ML confidence model, which the
guide already (prematurely) describes.

## 9 · Future Evolution

### 9.1 Evolution A — Jurisdiction-aware factor service behind the deterministic parser (analytics ladder: rung 1 → 2)

**What.** The honest state per §7: a deterministic regex-and-keyword parser whose core arithmetic (`carbon = qty × factor`) is genuine, with real Poore & Nemecek-consistent food factors and DEFRA-consistent fuel factors — but a 60-item keyword ceiling, a single global electricity factor (0.42 kgCO₂e/kWh) instead of jurisdiction/year eGRID/IEA intensities, no calorific-value conversion despite the guide's `E = Q × EF × CV`, static FX rates, and "confidence" as a fixed per-keyword constant. The guide's AI/OCR framing is aspirational. Evolution A keeps the deterministic parser (it is fast, testable and honest) and upgrades its data layer: a backend factor-lookup service resolving (item/fuel, jurisdiction, year) against the platform's refdata emission-factor and grid-intensity tables, CV conversion for energy-unit invoices (therms, MMBtu, GJ), and factor-source citations per line item.

**How.** (1) `GET /emission-factors/resolve?item=&jurisdiction=&year=` over the existing reference-data layer (the platform already ships `EMISSION_FACTORS`/`GRID_INTENSITY` tables consumed by integrated-carbon-emissions). (2) The parser calls it per matched line, falling back to the local table with a labeled `factor_source: 'static-fallback'`. (3) Keyword coverage instrumented: unmatched-line rate tracked per session so table growth is data-driven. (4) The §7.4 worked example (156.75 kgCO₂e total) pins as a parser regression test.

**Prerequisites.** Jurisdiction input in the UI (currently absent); DEFRA/eGRID year-versioned factors in refdata. **Acceptance:** the same kWh line produces different carbon in UK vs US-Texas jurisdictions with the factor source cited; energy-unit invoices convert via documented CVs; unmatched-rate metric visible.

### 9.2 Evolution B — LLM extraction replacing regex, with the deterministic path as validator (LLM tier 2)

**What.** This module is the platform's most natural LLM-native evolution: the §5 promise — parse PDF utility bills, fuel invoices and refrigerant records into quantity/unit/fuel-type/billing-period with genuine confidence — is precisely a document-extraction task for a vision-capable model. Evolution B builds it as the guide (prematurely) described: upload → LLM extraction into the structured schema → factor resolution via Evolution A's service → inline review of low-confidence fields → validated activity data exported to the Scope 1/2 inventory.

**How.** A `POST /invoice-parser/extract` route calling the model with the document and a strict output schema (line item, quantity, unit, fuel/utility type, period, meter number); confidence becomes real — model-reported per-field, calibrated against a labeled invoice set so the 0.7 review threshold means something. The existing regex parser survives as the cross-check: where both paths extract a quantity, disagreement flags the line for review (deterministic validator over LLM output, the platform's no-fabrication pattern applied to extraction). Human confirmation is mandatory before inventory ingestion — extraction errors compound into GHG disclosures. Refrigerant records (high-GWP, small quantities) get a dedicated prompt template since they are the highest-stakes/lowest-volume class.

**Prerequisites.** Document upload/storage pipeline; a labeled evaluation set (~100 invoices across types) to measure the F1 the guide currently asserts without evidence; Evolution A's factor service. **Acceptance:** measured field-level F1 published on the eval set; every accepted line item carries extraction confidence, factor source and reviewer identity; regex/LLM disagreements always surface for review.