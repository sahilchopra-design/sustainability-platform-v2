## 7 · Methodology Deep Dive

The guide describes a *CSDDD Adverse Impact Prioritisation* model — `Priority = Severity × Likelihood
× Breadth / RemediationCapacity`. The code **does not implement that formula**; instead it is a
**compliance-checklist tracker**: a real 20-requirement CSDDD register (mapped to Directive (EU)
2024/1760 Articles 6–15) whose statuses the user sets, a real phasing-threshold classifier, and a
penalty-exposure estimate. Companion peer/supply-chain/company metrics are seeded. This is a genuine
regulatory-tracking tool, not a UNGP severity model — flag as partial mismatch.

### 7.1 What the module computes

The core is user-driven compliance scoring over the 20-requirement register `CSDDD_REQUIREMENTS`:

```js
applicable    = total − na
compliancePct = applicable>0 ? round(compliant/applicable · 100) : 0
partialPct    = applicable>0 ? round(partial/applicable · 100) : 0
// category radar score credits partials at half weight
score = round((comp + part·0.5) / reqs.length · 100)
```

Penalty exposure (CSDDD Art 27 caps fines at ≥5% of net worldwide turnover):
```js
gapFraction      = applicable>0 ? gaps/applicable : 0
maxPenalty       = totalRevenue · 0.05
estimatedPenalty = maxPenalty · gapFraction
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Requirements register | 20 items, Art 6/7/8/9/10/11/15, P1/P2 criticality | **real** — CSDDD 2024/1760 mapping |
| Statuses | Compliant / Partial / Gap / N/A | user-set |
| Partial credit | 0.5 weight in category/peer scores | modelling choice |
| Max penalty | `revenue × 5%` | **real** — CSDDD Art 27 fine cap |
| Phasing thresholds | P1 2027 (>5000 emp & >€1.5bn); P2 2028 (>3000 & >€900m); P3 2029 (>1000 & >€450m) | **real** — CSDDD Art 2 phasing |
| Company employees/turnover (proxy) | `seed(charCode)·15000+500` / `·3000+100` | synthetic seeded (when absent) |
| SBTi / net-zero flags | `seed(...) > 0.55 / 0.45` | synthetic seeded |
| Transition score | `round(seed(...)·40+30)` → 30–70 | synthetic seeded |
| Peer average | `round(seed(cat)·40+35)` → 35–75 | synthetic seeded |
| Supply-chain tier coverage | `seed(i+100)·60 + tier bonus` | synthetic seeded |

### 7.3 Calculation walkthrough

`complianceState` (user status per requirement) → count compliant/partial/gap/na → `compliancePct`,
`partialPct`, category radar, peer radar (vs seeded sector average). `phasedCompanies` classifies each
portfolio company into Phase 1/2/3 by employees+turnover (real fields where present, else seeded
proxy). `penaltyExposure` scales the 5% fine cap by the portfolio's gap fraction. CSV export dumps
the register with statuses.

### 7.4 Worked example (penalty exposure)

Portfolio revenue `€2,000M`; 20 requirements, of which N/A=2 → applicable=18; user marks 6 as Gap:
```
gapFraction      = 6 / 18 = 0.333
maxPenalty       = 2000 · 0.05 = €100M
estimatedPenalty = 100 · 0.333 = €33.3M
compliancePct    = (say 9 compliant) → round(9/18·100) = 50%
```
The penalty scales linearly with unresolved gaps — a defensible first-order reading of Art 27's
turnover-linked cap, though real enforcement discretion is not modelled.

### 7.5 Data provenance & limitations

- **Requirements register and phasing thresholds are real** and correctly article-mapped; **statuses
  are user input**.
- Company employees/turnover default to `seed(charCode)` proxies when the portfolio lacks the fields;
  SBTi/net-zero/transition/peer/supply-chain metrics are all `seed()`-generated.
- The guide's Severity×Likelihood×Breadth prioritisation matrix is **not implemented** — no UNGP
  severity scoring, no country-risk (ITUC/WBI) weighting.

**Framework alignment:** CSDDD Directive (EU) 2024/1760 (Art 6 identification, Art 7/8 prevention/
remediation, Art 9 grievance, Art 10 monitoring, Art 11 communication, Art 15 Paris-aligned transition
plan, Art 27 5% turnover fine cap, Art 2 phasing) — all correctly referenced. UNGP / OECD DDG named in
guide but their prioritisation maths is absent.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The adverse-impact prioritisation model named
in the guide, and the company scope proxies, need real implementations.

**8.1 Purpose & scope.** Rank identified adverse human-rights/environmental impacts across supply-chain
tiers so remediation resources target the most severe first, per CSDDD Art 8, and estimate defensible
penalty exposure.

**8.2 Conceptual approach.** The **UNGP severity model** (gravity × scope × remediability) combined
with **country/sector risk-weighted likelihood** — the method underlying leading tools (e.g. RepRisk,
Sedex Radar, EcoVadis IQ). Likelihood draws on ITUC Global Rights Index and World Bank governance;
sector impact-probability follows OECD sector due-diligence guidance.

**8.3 Mathematical specification.**
```
Severity_j   = (Gravity_j + Scope_j + Remediability_j) / 3           # UNGP, each 1–5
Likelihood_j = w_country·CountryRisk_c + w_sector·SectorProb_s        # 0–1
Priority_j   = Severity_j · Likelihood_j · Breadth_j                  # rank descending
Coverage_tier = assessed_suppliers_tier / total_suppliers_tier
Penalty_exp  = min(5%·Turnover, DiscretionFactor·Σ_j unresolved Priority_j)
```

| Parameter | Source |
|---|---|
| Country risk `CountryRisk_c` | ITUC Global Rights Index, WBI governance |
| Sector probability `SectorProb_s` | OECD sector DDG, MSCI/RepRisk sector base rates |
| Gravity/scope/remediability | analyst assessment per UNGP |
| Turnover | company financials |

**8.4 Data requirements.** Supplier registry with tier + country + sector; identified impacts with
UNGP severity dimensions; ITUC/WBI indices; turnover. Vendors: RepRisk, Sedex, EcoVadis; free: ITUC,
World Bank WGI. The 20-requirement register and phasing already exist in the module.

**8.5 Validation & benchmarking.** Reconcile prioritisation ordering against expert re-ranking on a
sample; verify phasing classification against the Directive's thresholds; benchmark penalty estimates
against published enforcement precedents once available.

**8.6 Limitations & model risk.** Severity scoring is judgement-heavy; country indices lag acute
events; the 5% cap is a ceiling, not an expected fine. Fallback: present priority *tiers* (high/med/
low) rather than false-precision scores, and label penalty as a maximum-exposure indicator.
