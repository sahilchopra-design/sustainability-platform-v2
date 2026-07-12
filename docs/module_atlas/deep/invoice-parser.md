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
