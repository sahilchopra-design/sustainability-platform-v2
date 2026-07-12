## 7 · Methodology Deep Dive

The guide describes an *Automated Supplier Risk Triage* — `SupplierRisk = f(Country × Sector × Spend ×
Audit)` weighting ITUC/WBI/INFORM indices. **The React page does not implement that.**
`CsdddEnginePage.jsx` generates 60 synthetic companies via `sr(s)=frac(sin(s+1)×10⁴)` and presents four
tabs. The one genuinely correct piece is the **Scope & Timeline classifier** (real CSDDD Art 2
thresholds and application dates); adverse-impact, value-chain and transition-plan metrics are seeded.
A backend `csddd_engine.py` exists but the page does not call it for its default view. Flag mismatch.

### 7.1 What the module computes

`genCompanies(60)` builds each company `i` from three seed draws:
```js
sector   = SECTORS[floor(sr(i·7+3)·10)]
employees= floor(sr(i·13+7)·45000 + 1000)          // 1,000–46,000
turnover = (sr(i·19+11)·14 + 0.5)                   // €0.5–14.5 bn
grp      = emp≥5000 & to≥1.5 ? 0 : emp≥3000 & to≥0.9 ? 1 : 2   // real CSDDD groups
ddScore  = floor(sr(i·31+7)·60 + 35)                // 35–95 due-diligence score
```
The **Scope & Timeline** tab is a real, non-seeded classifier keyed on user-entered employees/EU
revenue:
```js
EU:     emp≥5000 & rev≥1.5 → Group 1, 26 Jul 2027, Art 2(1)(a)
        emp≥3000 & rev≥0.9 → Group 2, 26 Jul 2028, Art 2(1)(b)
        emp≥1000 & rev≥0.45→ Group 3, 26 Jul 2029, Art 2(1)(c)
Non-EU: euRev≥1.5/0.9/0.45 → Non-EU Group 1/2/3 (Art 2(2))
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Scope groups & dates | Art 2(1)(a-c) / 2(2)(a-c); 2027/2028/2029; transposition 26 Jul 2026 | **real** — CSDDD 2024/1760 |
| 15 impact categories | HR-01…07, ENV-01…06, GOV-01…02 | curated (CSDDD Annex-aligned) |
| 4 value-chain tiers | Tier 1/2/3+/Own Operations | curated |
| Company employees/turnover | `sr()·range` | synthetic seeded |
| Due-diligence score | `sr(i·31+7)·60+35` | synthetic seeded |
| Impacts identified/remediated | `sr()·12+1` / `sr()·8` | synthetic seeded |
| Grievances | `sr()·20` | synthetic seeded |
| SBTi status | `['Committed','Target Set','No Commitment'][floor(sr·3)]` | synthetic seeded |
| Transition pathway | `100·(1 − ((yr−2024)/26)^0.7)` baseline vs seeded company curve | curve shape modelling choice |
| Sector risk / impact density | `sr()·70+20` / `sr()·3+0.5` | synthetic seeded |

### 7.3 Calculation walkthrough

60 companies generated once. **Scope & Timeline** classifies a live user-entered company (real logic).
**Adverse Impact** aggregates seeded per-category identified/remediated counts → `remRate =
round(remediated/identified·100)` and a chain-tier breakdown (`sr()` actual vs potential impacts).
**Value Chain Mapping** shows seeded relationship counts and sector-risk scores. **Climate Transition
Plan** plots a decarbonisation baseline (`(yr−2024)/26` power curve) vs a seeded company path.

### 7.4 Worked example (Scope classifier, real logic)

User enters `emp = 6,000`, `rev = €2.0bn`, EU:
```
emp≥5000 (6000✓) & rev≥1.5 (2.0✓) → Group 1, applies 26 Jul 2027, Art 2(1)(a)
```
Change to `emp = 3,500`, `rev = €1.0bn`: fails Group 1 (emp<5000 or rev<1.5), passes
`emp≥3000 & rev≥0.9` → Group 2, 26 Jul 2028. The thresholds and dates exactly match the Directive.
For a seeded company, e.g. `remRate`: identified=`floor(sr(i·43+3)·12+1)`, remediated=`floor(sr(i·47+7)·8)`
→ `round(remediated/identified·100)`.

### 7.5 Data provenance & limitations

- **Scope & Timeline is real and correct** (Art 2 thresholds, application dates, article citations).
- **All 60 companies and their impact/grievance/SBTi/transition metrics are seeded** via `sr()`.
- The guide's supplier-risk-triage formula (ITUC/WBI/INFORM × spend × audit) and the backend
  `csddd_engine.py` are **not wired** into the default page.

**Framework alignment:** CSDDD Directive (EU) 2024/1760 — Art 2 scope/phasing (implemented), Art 6–11
due-diligence cycle, Art 15 Paris transition plan (illustrated). OECD sector DDG, Sedex SMETA, SA8000,
INFORM referenced in guide but not computed on the page.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Supplier-risk triage and the impact metrics
are seeded; only the scope classifier is production-ready.

**8.1 Purpose & scope.** Automate supplier risk triage across Tier 1–3 so due-diligence effort
concentrates on high-risk relationships, and track the CSDDD due-diligence cycle to auditable evidence.

**8.2 Conceptual approach.** A **multiplicative country×sector×spend×audit risk score**, the design
used by Sedex Radar, EcoVadis IQ and RepRisk supplier screening; country risk blends ITUC labour-rights,
WBI governance and INFORM crisis exposure; sector maps to OECD sector-specific DDG base rates.

**8.3 Mathematical specification.**
```
CountryRisk_c = 0.4·(1−WBI_c) + 0.4·ITUC_c + 0.2·INFORM_c            # 0–1
SectorRisk_s  = OECD sector base rate (minerals, garments, agri, …)  # 0–1
SpendWeight_i = Spend_i / Σ Spend                                    # materiality
AuditAdj_i    = SMETA/SA8000 verified ? 0.7 : 1.0                    # de-risking
SupplierRisk_i= CountryRisk_c · SectorRisk_s · (0.5+0.5·SpendWeight_i) · AuditAdj_i
Flag_i        = SupplierRisk_i > θ_high  → enhanced due diligence
```

| Parameter | Source |
|---|---|
| `WBI_c` | World Bank Worldwide Governance Indicators |
| `ITUC_c` | ITUC Global Rights Index (1–5+) |
| `INFORM_c` | EC INFORM Risk Index |
| `SectorRisk_s` | OECD sector DDG |
| Audit status | Sedex SMETA / SA8000 certificates |

**8.4 Data requirements.** Supplier registry (tier, country, sector, spend), audit certificates,
ITUC/WBI/INFORM indices. Vendors: Sedex, EcoVadis, RepRisk; free: World Bank, ITUC, EC INFORM. Scope
classifier and impact taxonomy already exist.

**8.5 Validation & benchmarking.** Reconcile flagged-supplier rate to the guide's 5–25% expectation;
verify audit adjustment lowers scores correctly; benchmark ordering against EcoVadis/Sedex ratings on
overlapping suppliers.

**8.6 Limitations & model risk.** Spend materiality can under-weight small but high-risk raw-material
origins; country indices are slow-moving; audit certificates vary in rigour. Fallback: risk *bands*
plus mandatory enhanced review for any Tier-3 conflict-mineral origin regardless of score.
