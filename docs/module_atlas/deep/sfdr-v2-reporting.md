## 7 · Methodology Deep Dive

> **Note on prior audit findings — still open.** MEMORY.md's REM-38 backlog flagged two issues for this
> module: (1) a US-dollar `$` prefix on AUM figures in an EU SFDR context, and (2) only 14 PAI indicators
> tracked (PAI-15 through PAI-18 absent). **Both remain only partially/un-fixed**: the headline dashboard
> KPI (`stats.totalAUM`) correctly uses `'€'+...`, and the Fund Screening table (line 87) also uses `€`, but
> the **main fund table on the Dashboard tab** (`<td>${r.aumBn}B</td>`) and the **fund detail side panel**
> (`AUM: ${item.aumBn}B`) still render a `$` prefix — an inconsistent currency symbol within the same page.
> The **PAI_INDICATORS array still lists only 14 names**, confirmed absent of the sovereign (PAI-15/16) and
> real-estate (PAI-17/18) indicators that the sibling `sfdr-pai-dashboard` module correctly implements.

### 7.1 What the module computes

60 real-named funds (`FUNDS` — Amundi ESG Leaders, BlackRock Sustainable, Vanguard ESG, PIMCO Climate Bond,
etc.) each carry a hand-assigned SFDR classification (`cls` array, a fixed sequence of Article 6/8/8+/9
labels, not `sr()`-random) plus `sr()`-seeded quantitative fields:

```js
aumBn      = sr()×50 + 0.5                                    // €0.5–50.5bn
paiScore   = round(sr()×40 + 50)                               // 50–90/100
taxAligned = round(sr()×60 + 10)                               // 10–70%
sustInvest = round(sr()×50 + 10)                                // 10–60%
dnsh       = round(sr()×30 + 60)                                // 60–90/100
paiValues  = 14 indicators × { value: sr()×100, coverage: sr()×40+50 }   // only 14, not 18
```

Also integrates live-computed data from the platform's Carbon Credit context (`useCarbonCredit()` →
`adaptForRegulatory()`), surfacing `ccReg.pai_1_ghg_offset` and `ccReg.taxonomy_aligned_pct` as two
additional dashboard KPIs — a genuine cross-module data feed, not synthetic.

### 7.2 Parameterisation — 14 tracked indicators (of 18)

`PAI_INDICATORS = ['GHG Emissions','Carbon Footprint','GHG Intensity','Fossil Fuel Exposure',
'Non-Renewable Energy','Energy Intensity','Biodiversity Impact','Water Emissions','Hazardous Waste',
'UNGC/OECD Violations','Gender Pay Gap','Board Gender Diversity','Controversial Weapons',
'Social Violations']` — this list covers PAI-1 through PAI-14 (the 14 mandatory Table 1 indicators for
company/investee assets) but **omits the 4 asset-class-specific indicators**: PAI-15 (Sovereign GHG
Intensity), PAI-16 (Fossil Fuel Sovereigns), PAI-17 (Fossil Fuel Real Estate), PAI-18 (Real Estate Energy
Efficiency). "Social Violations" (index 13) is a residual/renamed 14th entry that does not map cleanly to
a standard Table 1 label — closest real correspondence is likely a combination/relabelling, worth an SME
check.

| Classification distribution (60 funds, hand-assigned) | Count |
|---|---|
| Article 8 | ~29 (majority) |
| Article 9 | ~10 |
| Article 8+ | ~10 |
| Article 6 | ~7 |

(counts approximate from the fixed `cls` array pattern; the array is deterministic, not `sr()`-derived, so
these are exact counts reproducible from the source).

### 7.3 Calculation walkthrough

1. `filtered` applies search/classification filters over the 60 funds; `stats` computes guarded portfolio
   aggregates (`|| 0` fallback for empty-filter divide-by-zero on `avgPAI`/`avgTaxonomy`/`avgData`).
2. **Dashboard tab**: 9 KPI cards including two live cross-module figures from `ccReg` (Carbon Credit
   context) — `pai_1_ghg_offset` and `taxonomy_aligned_pct` — demonstrating genuine inter-module data
   exchange on the platform (Carbon Credit → SFDR reporting).
3. **Fund Screening tab**: taxonomy/sustainable-investment averages grouped by classification (`CLASSF`),
   plus a PAI-score-vs-carbon-footprint scatter across all filtered funds.
4. **Pre-contractual tab**: top-15 funds ranked by `sustainableInvest`% and bottom-15 by `dnshCompliance`,
   horizontal bar charts.
5. **Periodic Reports tab**: report-status inventory (`Published`/`Draft`/`Pending`, `sr()`-assigned) with a
   completion-rate KPI (`pStats.pub/FUNDS.length×100`) and a data-completeness histogram across 5 bands.

### 7.4 Worked example

`stats.totalAUM` for all 60 funds: `Σ aumBn` — with `aumBn = sr()×50+0.5` averaging ≈25.5bn per fund over
60 funds, an illustrative total ≈ €1,530bn (order-of-magnitude only, since exact figure depends on the
`sr()` sequence). The currency-symbol inconsistency (§ header note) means the *same* aggregate figure would
display as "€1,530B" in the KPI card but an individual fund row for, say, Amundi ESG Leaders with
`aumBn=42.3` would show "$42.3B" in the table — a visible, user-facing inconsistency within one page.

### 7.5 Companion analytics on the page

- **Carbon Credit cross-module integration** (`useCarbonCredit().adaptForRegulatory()`) is the one place
  this module goes beyond `sr()`-synthetic display — it pulls live computed state from the platform's
  shared Carbon Credit context bus, a genuine architectural integration point.
- **Report Status Inventory** — per-fund submission-date generation (`sr(f.id×53)` → month) only for
  `Published` funds, `null` otherwise — a reasonable conditional-field pattern.

### 7.6 Data provenance & limitations

- **60 fund names are real asset managers/product families; classification and quantitative metrics are
  synthetic** (`sr()`-seeded) except classification, which is a fixed hand-authored array (not random, so
  reproducible run-to-run).
- **Currency symbol inconsistency is unresolved**: dashboard KPI and Fund Screening table use `€`; the main
  Dashboard fund table and the fund detail side panel use `$` — both should read `€` for EU SFDR-context AUM
  figures.
- **PAI coverage gap is unresolved**: only 14 of 18 mandatory/asset-class-specific indicators are tracked;
  PAI-15 through PAI-18 (sovereign and real-estate specific) are absent, unlike the sibling
  `sfdr-pai-dashboard` module which correctly implements the full 18.
- "Social Violations" as PAI-14 does not map cleanly onto the real Table 1 indicator list once PAI-15/16/17/
  18 are properly accounted for — worth an SME relabel pass alongside adding the missing 4 indicators.

**Framework alignment:** SFDR RTS Annex I — 14 of 18 indicators correctly named and structured; the
remaining 4 asset-class-specific indicators should be added, referencing the sibling `sfdr-pai-dashboard`
module's already-correct implementation as the template · SFDR Article 6/8/8+/9 classification — correctly
represented across the 60-fund universe · the Carbon Credit context integration reflects the platform's
genuine PCAF/EU-Taxonomy data-sharing architecture between the carbon markets and regulatory reporting
domains.
