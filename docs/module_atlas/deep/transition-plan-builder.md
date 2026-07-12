## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two distinct calculation modes coexist in this module: (1) a **genuinely computed** Transition Plan
Completeness Index for the interactive "Plan Builder Wizard," and (2) a **synthetic demo portfolio**
of 150 companies with independently-seeded readiness/element/quarterly scores used for gap analysis
and benchmarking. Both match the guide's stated `TPCI = Populated Sections / Required Sections × 100`
formula in spirit, but only the wizard actually computes it live from user input.

```js
// Wizard (live, user-driven):
readinessScore = min(100, round(filledFields / totalRequiredFields × 100))

// Demo portfolio (synthetic, sr()-seeded):
company.readiness = floor(sr(i×23+17) × 100)          // independent of company.elements
company.elements[k] = sr(i×31+k×7) > 0.3 ? floor(v×100) : 0   // per-TPT-element score, 30% chance of 0
```

### 7.2 Parameterisation

| Element | Structure | Provenance |
|---|---|---|
| `TPT_STEPS` | Ambition, Action, Accountability, Governance, Basis (5 steps, 4 fields each = 20 required fields) | Matches the UK Transition Plan Taskforce's real 5-pillar Disclosure Framework structure |
| `TPT_ELEMENTS` | 12 elements (Net Zero Target, Interim Milestones, Scope 1/2/3 Plans, CapEx/Revenue Alignment, Just Transition, Board Oversight, Risk Management, Metrics & KPIs, Verification) | Platform-curated checklist consistent with IFRS S2/TCFD transition-plan disclosure expectations |
| `SECTOR_TEMPLATES` | 10 sectors × {milestones, phase-out date, decarbonisation levers, capex estimate, baseline intensity} | Hand-authored, directionally realistic sector figures (e.g. Steel DRI-EAF pilot 2027, capex $3.8Bn/12yr, baseline intensity 1.85 tCO2/t-steel — broadly consistent with real steel-sector transition cost literature) |
| `STEP_FIELDS` | 4 input fields per TPT step (20 total), each `select`/`number`/`text` | Platform-designed wizard schema |
| 150 synthetic companies | sector, name, readiness (0–100), 12-element scores, 12-quarter tracking series, SBTi status, Scope 1/2 emissions | All `sr()`-seeded, generated once at module load |
| 30 `PRE_PLANS` | status (Draft/Submitted/Approved/Under Review), readiness (40–100), completed-steps count | Synthetic pipeline-tracking demo records |

### 7.3 Calculation walkthrough

1. **Wizard readiness score** (the only live-computed metric on the page): counts non-empty form
   fields across all 5 steps and 20 total required fields, expressed as a percentage — this is a
   genuine, correctly implemented completeness metric.
2. **Step validation**: `validateStep()` blocks navigation to the next step if any of that step's
   required fields are empty — enforces sequential completion.
3. **Sector template auto-fill**: selecting a sector in the wizard surfaces that sector's
   `SECTOR_TEMPLATES` milestones/levers/capex/intensity as reference context (not auto-populated
   into the form fields).
4. **150-company demo portfolio**: each company's top-level `readiness` (0–100) and its 12
   `elements` scores are drawn from **separate, unrelated PRNG seeds** — a company can show high
   overall readiness (e.g. 90) while having several individual TPT elements at 0 (30% chance each),
   because the two are not arithmetically linked (unlike the wizard, where readiness is *literally*
   the completion fraction).
5. **Gap Analysis tab**: for the demo portfolio, computes `top10`/`bottom10` companies by readiness,
   sector-level average readiness, and a 12-quarter portfolio-wide trend line (`quarterlyTrend`,
   averaging each company's `qData` per quarter).
6. **Portfolio Readiness tab**: sector heatmap of average readiness plus a capex-vs-readiness
   scatter, all over the synthetic 150-company set.

### 7.4 Worked example

**Wizard**: a user who has filled 14 of the 20 required fields across all 5 steps sees
`readinessScore = round(14/20 × 100) = 70%`.

**Demo portfolio, Company #1 (`i=0`)**:

| Step | Computation | Result |
|---|---|---|
| Sector | `⌊sr(3)×10⌋` | (per formula; sector name depends on exact `sr(3)` draw) |
| Top-level readiness | `⌊sr(23+17)×100⌋ = ⌊sr(40)×100⌋` | independent random 0–100 value |
| Element scores (12) | `sr(31+k×7) > 0.3 ? ⌊v×100⌋ : 0` for k=0..11 | ~70% of elements populated with a 0–100 score, ~30% forced to 0 |

Because the top-level `readiness` field and the 12 `elements` scores are drawn from unrelated seeds,
a company's headline readiness number in the Gap Analysis / Portfolio Readiness tabs should not be
read as a rollup of its element-level detail — they are two independent synthetic signals about the
same fictional company.

### 7.5 Companion analytics

- **Sector Templates tab** — displays the 10 hand-authored sector transition templates (milestones,
  phase-out timeline, capex, baseline intensity) as static reference content.
- **Plan pipeline** (`PRE_PLANS`) — 30 synthetic plan records with status/readiness/completed-steps,
  used to populate a "recent plans" list in the wizard.

### 7.6 Data provenance & limitations

- The **wizard's readiness score is the one genuinely useful, correctly-implemented calculation** in
  the module — it directly reflects user data-entry completeness, which is a legitimate (if basic)
  proxy for disclosure readiness.
- The **150-company demo portfolio is entirely synthetic** (`sr()`-seeded) and its two readiness
  signals (top-level score vs. per-element detail) are statistically independent of each other,
  which would be misleading if presented as real benchmarking data — the Gap Analysis and Portfolio
  Readiness tabs should be read as illustrative UI demonstrations, not real transition-readiness
  intelligence.
- Sector template figures (capex, baseline intensity, milestone years) are hand-authored
  approximations without per-figure source citations, though they are broadly consistent with
  publicly known industry decarbonisation cost estimates for each sector.

### 7.7 Framework alignment

- **UK Transition Plan Taskforce (TPT) Disclosure Framework**: the 5-step wizard structure
  (Ambition, Action, Accountability, Governance, Basis of preparation) is a faithful implementation
  of the TPT's actual 5-element framework structure, and the reporting-framework field options
  (TPT, TCFD, ISSB, CDP, GRI) correctly enumerate the real overlapping disclosure regimes a
  transition plan might be filed under.
- **IFRS S2 (ISSB) transition-plan disclosure requirements** and **TCFD Guidance on Transition
  Plans (2021)**: cited as governing standards; the wizard's field set (net-zero target year,
  scope coverage, interim targets, verification approach) covers the substance of what both
  standards require issuers to disclose.
- **NGFS/IEA scenario references** (in the "Basis" step's `scenario` field: IEA NZE 2050, NGFS
  Orderly/Disorderly): correct real scenario names used as selectable options, though no scenario
  modelling is actually performed on the selection.
