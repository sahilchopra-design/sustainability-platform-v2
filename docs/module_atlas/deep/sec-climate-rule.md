## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag — stale regulatory status, not caught up with sibling module.** The SEC's
> climate disclosure rule (Release 33-11275) was **rescinded by SEC vote on 27 March 2025**
> (`backend/services/sec_climate_engine.py::SEC_RULE_STATUS`, `current_status: "RESCINDED"`,
> `legal_force: False`). The sibling frontend module `sec-climate-disclosure` (same backend engine, same
> route files) carries an explicit rescission banner and file-header warning. **This module
> (`SecClimateRulePage.jsx`) does not** — its `COMPLIANCE_PHASES` table still marks Phase 1/2/3 as
> `'Active'`/`'Upcoming'`, its Cost Calculator computes "compliance cost" against a rule with no legal force,
> and its `dataLineage`/guide text ("Readiness Score 72%," "Critical Gaps: 8") presents the rule as a live
> obligation. Every "compliance," "cost," and "gap" figure on this page should be read as an assessment
> against the *rescinded rule text*, useful only as a voluntary-disclosure/TCFD-readiness proxy — not as
> current SEC law. This page should be updated to carry the same rescission caveat as its sibling.

### 7.1 What the module computes

80 real-named large-cap companies (Apple, Microsoft, ExxonMobil, JPMorgan, etc. — `COMPANY_NAMES`) are
assigned synthetic compliance attributes via `sr(s)=frac(sin(s+1)×10⁴)`: filer type (random pick of 4
tiers, not actual public float), Scope 1/2 emissions, a `complianceScore` (38–95), and independent booleans
for GHG/risk/financial-impact disclosure, transition plan, scenario analysis, and internal carbon price.

```js
complianceScore = round(38 + sr()×57)                        // 38–95, independent draw
disclosureGaps  = (!ghgDisclosed) + (!riskDisclosed) + (!financialImpact)   // 0–3 count
status = complianceScore>=75 ? 'Compliant' : complianceScore>=50 ? 'Partial' : 'Non-Compliant'
```

### 7.2 Parameterisation — Cost Calculator

```js
base        = filerType==='LAF' ? 4.2 : filerType==='AF' ? 1.8 : 0.6        // $M base compliance cost
scope3Add   = includeScope3 ? base × 0.6 : 0
revenueScale = log10(max(1,revenue)) / log10(100)                            // sub-linear scaling
total       = base × revenueScale + scope3Add
annualMaint = total × 0.35
external    = total × 0.45
```

The three base costs ($4.2M LAF / $1.8M AF / $0.6M NAF) and the 0.6× Scope 3 uplift, 0.35× maintenance, and
0.45× external-advisor multipliers are **hand-set illustrative constants with no cited cost-survey
source** — treat as directional only (larger filers cost more, Scope 3 adds materially, ongoing maintenance
is a meaningful fraction of first-year cost), not a calibrated compliance-cost model.

| Filer tier (as originally adopted, now moot) | GHG start | Assurance |
|---|---|---|
| Large Accelerated Filer | FY2025 | Limited FY2026 → planned Reasonable FY2033 |
| Accelerated Filer | FY2026 | Limited (phased) |
| Non-Accelerated Filer | FY2027 | None required |
| Scope 3 (all tiers) | Stayed March 2024, never reinstated | N/A |

`DISCLOSURE_REQUIREMENTS` (15 rows) and `INTL_COMPARISON` (6 frameworks: SEC, CSRD/ESRS, ISSB IFRS S1+S2,
TCFD, UK TCFD, Hong Kong ESG) are accurate, real regulatory content as of the rule's original 2024 adoption
text — genuinely useful as a comparative reference table independent of the US rule's current status.

### 7.3 Calculation walkthrough

1. `filtered` narrows `COMPANIES` (80) by sector/filer-type/status/name-search.
2. `kpis` computes guarded (`n = Math.max(1, filtered.length)`) counts and means: compliant/partial/
   non-compliant counts, `avgScore`, GHG-disclosed count, transition-plan count, ICP-adopter count,
   scenario-analysis count, SBTi-approved count.
3. **Gap Assessment tab**: flags each company's `disclosureGaps` (0–3) against the three core disclosure
   dimensions (GHG, risk, financial impact) — a simple missing-item counter, not a materiality-weighted gap
   score.
4. **Sector Analysis** (`SECTOR_BENCHMARKS`, 9 sectors): independent `sr()`-seeded averages
   (`avgCompliance`, `ghgDiscPct`, `transitionPlanPct`, `scenarioPct`, `avgScope1`, `icpAdopters`,
   `sbtiApproved`) — not aggregated from the 80-company `COMPANIES` array; it is a second, parallel
   synthetic dataset.
5. **Cost Calculator** — the only genuinely interactive tool on the page (§7.2), letting a user vary
   `calcRevenue`/`calcFilerType`/`calcScope3` and see a live cost estimate recompute.

### 7.4 Worked example

Cost Calculator, `filerType = 'Large Accelerated Filer'`, `revenue = $5,000M`, `includeScope3 = true`:

| Step | Computation | Result |
|---|---|---|
| Base | 4.2 | $4.2M |
| Revenue scale | `log10(5000)/log10(100) = 3.699/2` | 1.85 |
| Scaled base | `4.2 × 1.85` | $7.77M |
| Scope 3 add-on | `4.2 × 0.6` | $2.52M |
| **Total** | `7.77 + 2.52` | **$10.29M** |
| Annual maintenance | `10.29 × 0.35` | $3.60M |
| External advisors | `10.29 × 0.45` | $4.63M |

A company's compliance-score example: `complianceScore = round(38+sr(17×17)×57)`, illustrative draw → e.g.
72 → `status = 'Partial'` (< 75 threshold), `disclosureGaps` computed from its 3 booleans.

### 7.5 Companion analytics on the page

- **Phase Timeline / COMPLIANCE_PHASES** — a 4-phase table (LAF/AF/NAF/Scope-3-stayed) that still marks
  Phase 1 `'Active'` — this is the clearest on-page symptom of the stale rescission status (§ mismatch flag
  above).
- **Enforcement tab** (`ENFORCEMENT`, 6 real 2023–2024 SEC actions: greenwashing sweep $35M, BNY Mellon
  $1.5M, Goldman Sachs AM $4M) is genuine historical enforcement content, unaffected by the climate-rule
  rescission since these actions were brought under existing securities-fraud/ESG-fund-labelling authority,
  not the rescinded climate disclosure rule.
- **Assurance Framework tab** — real named standards (PCAOB AS 2101, IAASB ISAE 3410, ISAE 3000 Revised,
  AA1000AS v3) mapped to applicability and phase; still valid as general ESG-assurance reference material.

### 7.6 Data provenance & limitations

- **All 80 companies' compliance attributes are synthetic** (`sr()`-seeded); company *names* are real
  large-caps but every score, gap, and disclosure flag is fabricated per-session.
- **Sector Analysis is a second, independent synthetic dataset** not aggregated from the same 80 companies
  shown elsewhere on the page — sector-level and company-level views can disagree.
- **Cost Calculator constants are unsourced illustrative multipliers**, not derived from a compliance-cost
  survey (e.g. Deloitte/PwC SEC climate-rule cost estimates, EY Climate disclosure surveys) that a
  production tool should cite.
- **Most materially: the page presents a rescinded rule as active/upcoming law**, unlike its sibling module
  and the shared backend engine, which correctly caveat this. This is the primary finding to action for this
  module.

**Framework alignment:** SEC Release 33-11275 (Reg S-K Items 1500–1505, Reg S-X §14) — content is accurate
to the rule *as originally adopted*, but the rule was rescinded 27 March 2025 and has no legal force ·
PCAOB AS 2101 / IAASB ISAE 3410 / ISAE 3000 for the assurance framework (genuinely still-relevant standards)
· CSRD/ESRS, ISSB IFRS S1+S2, TCFD, UK TCFD, HKEx ESG for the international comparison table (accurate,
still current for their respective jurisdictions).
