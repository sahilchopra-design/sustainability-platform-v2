## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula
> `ECS = P(correct entity) × P(correct value) × P(correct unit)`, calibrated via "Platt scaling on a
> held-out labelled corpus," implies a genuine joint-probability confidence model. **The code computes
> no such product.** Every extraction's confidence is a **single seeded-random draw** in `[0.45,
> 0.98]`, thresholded at 0.55 (extracted vs "NOT FOUND") and 0.65 (high vs low confidence flag) — there
> is no entity/value/unit decomposition, no Platt scaling, and **no actual document parsing or LLM
> call anywhere in the code** (the "uploaded files" list is a hard-coded array of 3 filenames; no
> file is ever read). Sections below document the code as it actually behaves.

### 7.1 What the module computes

A simulated ESG-data-extraction console over 12 real, correctly-identified European/global companies
(Shell, HSBC, Siemens, SAP, Nestlé, TotalEnergies, BNP Paribas, ArcelorMittal, ASML, Unilever,
Equinor, Deutsche Bank — with plausible real LEI code formats) and 5 real disclosure frameworks
(ESRS, ISSB, TCFD, GRI, SASB), each populated with a genuine, correctly-cited data-point taxonomy
(e.g. ESRS `E1-6` GHG Scope 1, `S1-16` Gender Pay Gap; SASB `FN-CB-410a` Financed Emissions). For a
selected company, the "extraction" is fabricated per field:

```js
conf      = 0.45 + sr(seed + i*7) * 0.53          // 0.45-0.98
extracted = conf > 0.55
pageRef   = extracted ? floor(sr(seed+i)*280)+20 : null      // fake PDF page number, 20-300
kpiVal    = extracted ? sr(seed+i*3)*900000+1000 : null      // fake numeric value
lowConf   = conf < 0.65
reason    = lowConf ? LOW_CONF_REASONS[floor(sr(seed+i*5) × 6)] : null
```
where `seed = selectedCompany.id × 31`.

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `FRAMEWORKS.ESRS` (40 items) | Real ESRS data-point codes (E1-6, E1-7, E1-8, S1-16, G1-1, etc.), pillar, required flag, unit | **Real**, correctly structured ESRS taxonomy subset |
| `FRAMEWORKS.ISSB` (27), `.TCFD` (11), `.GRI` (15), `.SASB` (12) | Real framework-specific codes/labels (GRI 305-1/305-2/305-3, TCFD G-1/G-2/ST-1..3, SASB sector-specific codes like `FN-CB-410a`) | **Real** disclosure taxonomies |
| `COMPANIES` (12) | Real company names, sectors, tickers, plausible LEI-format codes, report year 2024 | Real entity identities; LEI codes follow correct 20-character ISO 17442 format but are not verified against GLEIF |
| `LLM_MODELS` (4) | Claude Opus 4 ($0.015/1k, 94% accuracy), GPT-4o ($0.010/1k, 91%), Gemini 1.5 Pro ($0.007/1k, 88%), Mistral Large ($0.004/1k, 83%) | Plausible relative cost/accuracy ordering (higher cost → higher stated accuracy) but the specific accuracy percentages are illustrative, not benchmarked |
| `LOW_CONF_REASONS` (6) | "Ambiguous language," "No quantitative data found," "Outdated reference," "Scope boundary not defined," "Partial disclosure," "Contradictory values" | Plausible, realistic NLP-extraction failure modes, randomly assigned rather than diagnosed |
| Confidence formula constants (`0.45`, `0.53`, thresholds `0.55`/`0.65`) | Author-chosen, not calibrated to any labelled corpus |
| `uploadedFiles` (3 hard-coded rows) | `Shell_Annual_Report_2024.pdf` (312pp), `Shell_TCFD_Report_2024.pdf` (68pp), `Shell_ESG_Data_2024.xbrl` | Static UI decoration — no file upload or parsing logic reads these |

### 7.3 Calculation walkthrough

- **Extraction Studio tab**: user selects a company, an LLM model, and a subset of frameworks;
  `extractionResults` regenerates the full per-field fabricated table (confidence, extracted
  value, page reference, low-confidence reason) keyed only on `selectedCompany.id` and field index —
  the selected LLM model has **no effect on the extraction outcome** (its `avg_accuracy`/`cost_per_1k`
  fields are displayed but never fed into the `conf` formula).
- **Value formatting**: flag fields render "Yes"/"NOT FOUND"; `%` fields render
  `sr(seed+i*2)×80+10` formatted to 1dp; all other units render a fabricated `kpiVal` formatted with
  thousands separators — producing numbers that look precisely sourced (e.g. "487,213 tCO2e") but are
  pure noise.
- **Summary stats**: `avgConf = mean(confidence of extracted fields)`, `tokens =
  floor(sr(company.id×13)×40000+60000)` — a fabricated token-count figure for the (non-existent) LLM
  call.
- **Framework Coverage tab**: `covered = count(sr(seed+i*9) > 0.38)` per framework — a **second,
  independent** seeded coverage calculation (not reusing `extractionResults.extracted`), so the
  "coverage %" shown on this tab will generally **disagree** with the extraction-count implied by the
  Extraction Studio tab for the same company/framework combination.
- **Confidence Intelligence tab** (scatter): plots `x = sr(r.id or i*3)×10` against `y = confidence` —
  the x-axis is itself another independent random draw, not a meaningful second dimension (e.g. not
  document position or field complexity), so the scatter has no real bivariate structure.
- **KPI Extraction tab**: `extracted_value = sectorAvg × (0.5 + sr(seed+i*11)×0.9)`, `delta =
  extracted − sectorAvg` — compares a fabricated "extracted" figure against a `sectorAvg` reference
  (not shown in the excerpt but presumably also static), producing a fabricated "vs sector" delta.
- **Multi-Doc Comparison tab**: `companyScores` computes a composite `score = round(completeness×0.35
  + confidence×100×0.30 + quantRate×0.25 + assured×0.10)` per comparison company, where
  `completeness`, `confidence`, `quantRate`, and `assured` are each independently
  `sr()`-seeded — a real-looking weighted composite built entirely from unrelated random draws.

### 7.4 Worked example

Shell plc (`id=1`): `seed = 1×31 = 31`. For ESRS field index `i=0` (`E1-6` GHG Scope 1):
`conf = 0.45 + sr(31+0)×0.53 = 0.45 + sr(31)×0.53`. `sr(31) = frac(sin(32)×10000)`;
`sin(32 rad) ≈ 0.5514` → `frac(5514.4) = 0.4426` → `conf ≈ 0.45+0.4426×0.53 = 0.685`. Since
`0.685 > 0.55`, the field is marked **extracted**; since `0.685 ≥ 0.65`, it is **not** flagged
low-confidence. `pageRef = floor(sr(31+0)×280)+20 = floor(0.4426×280)+20 = floor(123.9)+20 = 143`.
`kpiVal = sr(31+0×3)×900000+1000 = sr(31)×900000+1000 ≈ 399,340` → displayed as "Shell's GHG Scope 1
= 399,340 tCO2e, page 143" — entirely fabricated but formatted indistinguishably from a genuine
extraction.

### 7.5 Data provenance & limitations

- **No document is ever parsed and no LLM API is ever called.** Every "extracted" value, confidence
  score, page reference, and low-confidence reason across all 5 tabs is generated by the platform's
  seeded PRNG. A user could easily mistake this for a real extraction result given the realistic
  formatting (page numbers, thousands separators, plausible reason strings).
- The 4-model LLM comparison (Claude Opus 4 / GPT-4o / Gemini 1.5 Pro / Mistral Large) has cost and
  accuracy figures that are illustrative approximations of real-world relative model positioning, not
  benchmarked against this platform's actual usage.
- Framework Coverage and Extraction Studio tabs use **independently seeded** coverage calculations
  for the same company/framework — an internal-consistency gap a careful user could notice by
  cross-referencing tabs.
- The Multi-Doc Comparison composite score's 35/30/25/10 weighting is author-chosen with no external
  calibration and is applied to entirely fabricated sub-metrics.

**Framework alignment:** ESRS, ISSB, TCFD, GRI, and SASB data-point taxonomies are genuinely accurate
subsets of the real standards — this module's most defensible contribution is as a **reference
catalogue** of cross-framework disclosure codes. The guide's stated NLP methodology (NER + span
extraction + Platt-scaled confidence) describes real, established ESG-extraction techniques used by
production systems, but none of it is implemented here.
