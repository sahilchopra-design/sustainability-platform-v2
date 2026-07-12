## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes NLP-based TCFD 11-recommendation scoring, an
> EFRAG ESRS datapoint-checklist CSRD completeness gap, and GRI Standards coverage counting. **None
> of these three scoring engines exist in the code.** There is no TCFD recommendation mapper, no
> CSRD datapoint checklist, no GRI standard counter, and no NLP/text-extraction logic anywhere in
> the file. What the code actually implements is: (1) a genuine 55-item **manual QA checklist**
> across 6 categories that a user ticks by hand, (2) a **greenwashing "risk score" derived from the
> character length of pasted text** (not semantic/NLP detection despite the guide's "LCA scope
> analysis" / "terminology audit" detection-method labels), (3) a hard-coded **enforcement-case
> database** (16 real regulatory actions), and (4) a hard-coded **ISAE 3000 assurance-readiness
> checklist**. This is a real-but-different tool: manual audit-readiness tracking, not automated
> report quality scoring.

### 7.1 What the module computes

```
TOTAL_QA_ITEMS = Σ QA_CATEGORIES[c].items.length              // 55 items, 6 categories
qaPercent = TOTAL_QA_ITEMS > 0 ? round(totalChecked / TOTAL_QA_ITEMS × 100) : 0
greenwashScore_g = round(5 + sr(text.length×7 + g.id.length×13) × 30)   // per greenwash type g
overall = round(Σ greenwashScore_g / GREENWASH_TYPES.length)
```
`totalChecked` is the count of checkboxes the user has manually ticked across the 6 QA categories
(Basic Data Quality, iXBRL Compliance, Narrative Quality, Greenwashing Prevention, Internal Audit
Readiness, Third-Party Assurance) — a genuine, if manual, completeness ratio.

### 7.2 Parameterisation

| Component | Content | Provenance |
|---|---|---|
| `QA_CATEGORIES` | 6 categories, 55 checklist items total (9 Basic Data Quality, 10 iXBRL, 8 Narrative, 7 Greenwashing, 10 Internal Audit, 10 Assurance) | Hand-authored, references real standards (Flesch-Kincaid readability, EFRAG 2024 taxonomy, ISAE 3000) — a genuine audit checklist, not calculated |
| `GREENWASH_TYPES` | 7 types (Hidden Trade-offs, Lack of Proof, Vague Language, False Imagery, No Progress, Lesser of Two Evils, Fake Certifications) | Standard "Seven Sins of Greenwashing" taxonomy (TerraChoice/UL 2010), a recognised industry framework |
| `greenwashScore_g` formula | `5 + sr(text.length×7 + g.id.length×13) × 30` → 5–35 | **Not** semantic detection — the score is a deterministic function of the pasted text's character count and the greenwash-type id's string length, so two different texts of the same length against the same type produce the same score regardless of content |
| `ENFORCEMENT_CASES` | 16 real-world greenwashing enforcement actions (Shell, HSBC, Ryanair, DWS, Volkswagen Dieselgate, etc.) | Real, publicly documented cases — accurately summarised, genuinely useful reference data |
| `ASSURANCE_LEVELS` | None (0%) / Limited (40%) / Reasonable (75%) / High (95%) confidence | ISAE 3000 assurance-tier convention; confidence % values are illustrative, not derived from a formula |
| `ISAE_REQS` | 10-item ISAE 3000 engagement checklist (Ethical Requirements → Reporting), each with a hard-coded `met`/`partial`/`not-started` status | Static demo state, not computed from any live engagement data |
| `ixbrlItems` (20 rows) | ESRS iXBRL tag list (e.g. `ESRS E1-6 GHG Total`, `ESRS E1-4 Targets`) with `sr(seed)`-derived pass/fail | Tag names are standards-accurate ESRS datapoint references; pass/fail state is synthetic, not a real validator run |

### 7.3 Calculation walkthrough

1. **QA checklist**: user toggles `checkedItems[`${catIndex}-${itemIndex}`]`; `catChecked` per
   category = `cat.items.filter((_, ii) => checkedItems[key]).length`; `qaPercent` aggregates all 6
   categories against `TOTAL_QA_ITEMS = 55`. This is the module's one genuinely computed ratio.
2. **Greenwashing scanner**: user pastes report text into a textarea; for each of the 7
   `GREENWASH_TYPES`, `score = round(5 + sr(text.length×7 + g.id.length×13) × 30)`; `overall` is the
   simple mean across the 7 type scores. Because the seed depends only on `text.length` (not word
   content), pasting "aaaa...a" (100 chars) produces an identical score to any other 100-character
   string against the same greenwash type.
3. **Enforcement case browser**: static filter/sort over the 16-row `ENFORCEMENT_CASES` table,
   cross-referenced to `gwType` so a user researching e.g. "Vague Language" sees the Danone/Santos/
   TotalEnergies cases.
4. **iXBRL tab**: 20 synthetic tag-validation rows (`sr(seed)`-derived pass/fail per ESRS datapoint
   tag) presented as a filing-readiness table.

### 7.4 Worked example

QA checklist: a user ticks 38 of the 55 items (all of Basic Data Quality [9], all of Narrative
Quality [8], 6/7 Greenwashing Prevention, 9/10 Internal Audit, 6/10 Assurance, 0/10 iXBRL).
`totalChecked = 9+8+6+9+6+0 = 38`; `qaPercent = round(38/55×100) = 69%`.

Greenwashing scan on a 340-character passage against "Vague Language" (`g.id = "vague-language"`,
length 15): `seed = 340×7 + 15×13 = 2,380 + 195 = 2,575`; `sr(2575) = frac(sin(2576)×10⁴)`.
`sin(2576 rad)` (reduced mod 2π) ≈ 0.4817 → `x = 4,817.xx` → `frac ≈ 0.xx` — illustratively
`sr(2575) ≈ 0.63` → `score = round(5 + 0.63×30) = round(23.9) = 24/35`, i.e. "Medium" greenwash
risk purely from the passage's length, independent of whether it actually contains vague terms
like "eco-friendly" or "natural".

### 7.5 Data provenance & limitations

- The QA checklist (§7.1–7.2) is the only part of the module that computes a real ratio from user
  input; everything else is either static reference data (enforcement cases, ISAE requirements) or
  a PRNG proxy dressed as a detection score.
- The greenwashing scanner does **no NLP, keyword matching, or semantic analysis** despite its UI
  framing — a bank or regulator using this to triage disclosures would get a text-length artifact,
  not a genuine greenwashing signal. A production version would need actual NLP (keyword/phrase
  detection for vague terms, claim-evidence proximity scoring, certification-registry lookups).
- `ISAE_REQS` statuses and `ixbrlItems` pass/fail are fixed/synthetic, not wired to any real
  document upload or validator despite the guide's "Upload sustainability report (PDF or
  structured XML/XBRL)" user-interaction claim — there is no file upload or parsing in the code.
- `ENFORCEMENT_CASES` is accurate, real-world reference data and is the module's strongest asset.

**Framework alignment:** ISAE 3000/3410 (assurance-tier checklist, general structure correct) ·
EFRAG ESRS/iXBRL tagging (tag names accurate, validation synthetic) · TerraChoice "Seven Sins of
Greenwashing" taxonomy (correctly reproduced) · Flesch-Kincaid readability and ISO 14021
environmental-claim vocabulary referenced in the QA checklist items but not computed by any
readability algorithm in code.
