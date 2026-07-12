## 7 · Methodology Deep Dive

The guide's Disclosure Completeness Index (`DCI = Completed / Total Applicable × 100`) is genuinely
implemented, and the underlying content — IFRS S1/S2 paragraph references, TCFD cross-mapping, SASB
sector metrics — is accurate, detailed, static reference data for **one illustrative reporting
entity**, not a live disclosure-authoring engine wired to a real company's data.

### 7.1 What the module computes

`S1_PILLARS` (4 pillars: Governance/Strategy/Risk Management/Metrics & Targets, 36 total
requirements) and `S2_REQUIREMENTS` (13 climate-specific requirements) each carry a hard-coded
`status` (`Complete`/`In Progress`/`Not Started`) and a 0–100 `quality`/`score` for a single
fictional demonstration company. The completeness index:

```js
totalReqs = Σ_pillar S1_PILLARS[pillar].reqs.length              // = 36
complete  = Σ_pillar count(reqs.status === 'Complete')
DCI_S1    = complete / totalReqs × 100
avgScore  (S2) = round( Σ S2_REQUIREMENTS.score / count )        // simple mean of 13 scores
avgQuality (gap analysis) = round( Σ GAP_ITEMS.quality / count )
```

`radarData` plots each S1 pillar's own hand-set `score` (not derived from its requirement-level
statuses — e.g. Governance pillar carries `score:78` as a standalone field, independent of the
arithmetic mean of its 7 requirement `quality` values).

### 7.2 Parameterisation — pillar/requirement scoring (static demo values)

| Pillar | Para ref | Score | # Requirements | Provenance |
|---|---|---|---|---|
| Governance | IFRS S1 §26–27 | 78 | 7 | Hand-set per requirement, correctly paragraph-cited |
| Strategy | IFRS S1 §28–35 | 62 | 8 | Includes S1-STR-e (scenario analysis, §35) marked "Not Started" |
| Risk Management | IFRS S1 §36–42 | 71 | 6 | — |
| Metrics & Targets | IFRS S1 §43–53 | 54 | 10 | Weakest pillar — 5 of 10 items "Not Started" |
| S2 avg (12 items) | IFRS S2 §5–37 | ~52 (computed) | 12 | Each item cites its real IFRS S2 paragraph and TCFD sub-recommendation |

Every `code`/`para`/`tcfd` field (e.g. `S2-3 / IFRS S2 §14 / TCFD Strategy(b)`) is checked against the
real ISSB standard structure and is accurate — this is a correctly-researched compliance checklist,
not fabricated citation.

### 7.3 Calculation walkthrough

1. `allReqs` flattens S1 pillar requirements + S2 requirements (prefixed `S2-{id}`) into one list
   for the gap-analysis tab.
2. `SCENARIO_SET` (21 rows: NGFS-named scenarios × sector impact deltas) drives the Scenario Analysis
   tab; `cpData` extracts `carbonPrice2030`/`carbonPrice2050` per scenario for the chart.
3. `ADOPTION` (16 jurisdictions) and `CONNECTIVITY` (13 rows mapping ISSB↔CSRD↔SFDR↔TCFD↔CDP
   alignment) are static reference tables, not computed.
4. `sasbSectors` derives a dropdown from `SASB_INDUSTRIES` (real SASB sector taxonomy) for the
   Industry Metrics tab.
5. CSV export (`csvExport`) serialises any of the above tables to file — no server round-trip; this
   module has no backend engine (`engines: []`, `route_files: []` in the atlas record).

### 7.4 Worked example

Metrics & Targets pillar: 10 requirements, of which `S1-MT-a/b/g/j` are "In Progress" and the other 6
are "Not Started" (0 "Complete"):

```
complete_MT = 0 / 10 → 0% pillar completeness by strict Complete-only count
```

Yet the pillar's displayed headline `score: 54` is a separately hand-set value (not `0`), because the
radar/KPI score field is independent of the strict completeness count — a reader comparing the
"Metrics & Targets: 54/100" KPI against "0 of 10 Complete" in the requirement table would see an
apparent inconsistency; the 54 reflects partial-credit quality scoring (`quality` values on
in-progress items average well above zero) rather than the binary completeness metric the guide's
DCI formula implies.

### 7.5 Data provenance & limitations

- **Single fictional entity.** All statuses/scores represent one demonstration company's disclosure
  maturity; there is no per-user entity profile, no persistence of a real company's actual disclosure
  progress, and no XBRL tagging/validator (despite the guide's claim of "automated XBRL tag
  validator" and "cross-reference conflict" detection — neither exists in code).
- Pillar-level `score` and requirement-level `quality`/`status` are two independent hand-set data
  points, not algebraically linked — see §7.4.
- No backend engine or database persistence — this is a purely static, illustrative reference/gap-
  analysis tool, not a stateful disclosure-drafting workflow.

**Framework alignment:** IFRS S1 (General Requirements, correctly paragraph-cited governance/strategy/
risk-management/metrics structure) · IFRS S2 (climate disclosure, correctly cross-mapped to TCFD's
four pillars) · TCFD Recommendations (2017) · SASB industry-specific metrics (sector taxonomy
referenced) · NGFS scenario naming conventions used for the scenario-analysis tab's illustrative
carbon-price and GDP-impact figures.
