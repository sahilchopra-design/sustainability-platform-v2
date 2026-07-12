## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/esrs-e2-e5` wraps the **CSRD ESRS E2–E5 Environment Topics Engine**
(`backend/services/esrs_e2_e5_engine.py`), covering the four non-climate environmental standards:
E2 Pollution, E3 Water & Marine, E4 Biodiversity & Ecosystems, E5 Circular Economy. It is a
**disclosure-completeness and derived-metric engine** in the platform's post-remediation
"honest null" style — repeated in-code comments state that quantities are "reported figures —
never fabricated" and absent inputs are "surfaced as honest nulls". The only calculations are
genuine mass-balances and one composite, quoted from code:

```
E3:  consumption_ML          = withdrawal_total − discharge_total       (only if both reported)
E5:  directed_to_disposal_t  = waste_generated − diverted
     diversion_rate_pct      = diverted / waste_generated × 100
     circularity_score       = min(100, recycled_content×0.4 + diversion_rate×0.4
                                    + (20 if circular_design_policy else 0)×0.2)
All: completeness_pct        = provided_flags / total_flags × 100  (4–5 flags per topic)
     overall_completeness    = mean of the four topic completeness scores
```

### 7.2 Parameterisation

**Disclosure registers** (`GET /ref/e2-disclosures` … `/ref/e5-disclosures`): each topic carries
its full DR ladder (policies → actions → targets → metrics → anticipated financial effects), with
metric schemas: E2-4 pollutants by medium (air: NOx/SOx/PM2.5/NMVOC/NH₃/HAPs in t/yr; water:
priority substances/nitrates/phosphorus in kg/yr; soil: POPs and Pb/Cd/Hg heavy metals); E3-4
water volumes in megalitres plus WRI Aqueduct stress tiers (< 10% low … > 80% extremely high
withdrawal/availability); E4-5 land-use change ha, Natura 2000 proximity %, IUCN Red List species
counts, ENCORE ecosystem-service dependencies; E5-4/5 material inflows, recycled/renewable
content %, EU critical raw materials, waste disposition splits (landfill / incineration without
recovery / other, hazardous, radioactive).

**Sector materiality triggers** (`MATERIALITY_TRIGGERS`, `GET /ref/materiality-triggers`): a
20-row NACE-division default matrix, e.g. B06 oil & gas → all four material; D35 electricity →
E2 only; K64 financial services → none; L68 real estate → E4 only; unknown NACE → all false. The
returned basis string is explicit: "sector defaults per EFRAG sectoral guidance… Final materiality
determination requires entity-specific double materiality assessment" — the matrix itself is a
**platform-authored default**, not a published EFRAG table.

**Thresholded risk flags (E4, None-guarded)**: sensitive-areas > 20% → MEDIUM-HIGH; IUCN species
> 5 → HIGH; land-use change > 100 ha → MEDIUM; missing No-Net-Loss commitment → GAP.
**E3 stress tiering from `ops_in_stressed_area_pct`**: > 40 high, > 20 medium_high, else
low_medium (null if unreported). Circularity weights 40/40/20 are a platform composite.

### 7.3 Calculation walkthrough

`POST /assess` runs the full chain: NACE-based materiality → per-topic assessment **only for
material topics** (non-material topics return "Not material" with 100% completeness — they cannot
drag the average) → overall completeness (mean of four) → concatenated gap list. `POST /assess-e2`
and `POST /assess-e3` expose single-topic assessments. Each topic assessor:

1. Copies reported values (or `None`) into the standard metric schema.
2. Computes derived metrics only when all constituents are present.
3. Emits `data_status` ∈ {reported, insufficient_data} based on whether any core quantitative
   input exists.
4. Scores completeness as the fraction of provided input groups (E2: air/water/soil/SVHC/
   financial; E3: withdrawal/stressed/recycled/financial; E4: land use/sensitive areas/species/
   ecosystem services/financial; E5: inflows/recycled/waste/diverted/financial).
5. Appends DR-cited gaps (e.g. "E2-5: SVHC list not disclosed", "E4-6: Financial effects from
   biodiversity not quantified").

E4 additionally reports `kunming_montreal_alignment` = "Partial" if a No-Net-Loss commitment
exists, else "Not declared".

### 7.4 Worked example (E5, chemicals company C20)

Inputs: inflows 120,000 t, recycled content 22%, waste 8,000 t, diverted 5,600 t,
`circular_design_policy: true`, no financial effect quantified.

| Step | Computation | Result |
|---|---|---|
| Materiality (C20) | E2 ✓, E3 ✓, E4 ✗, E5 ✓ | E5 assessed |
| Directed to disposal | 8,000 − 5,600 | 2,400 t |
| Diversion rate | 5,600/8,000 × 100 | 70.0% |
| Circularity score | 22×0.4 + 70×0.4 + 20×0.2 | 8.8 + 28 + 4 = **40.8** |
| Completeness | 4 of 5 groups provided (financial missing) | 80.0% |
| Gaps | "E5-6: Financial effects… not quantified" | 1 gap |

Note the policy term contributes at most 4 points (20 × 0.2) — the composite is dominated by the
two quantitative drivers.

### 7.5 Data provenance & limitations

- **No PRNG or seeded data**: all quantities are caller-reported; the engine never imputes. This
  is documented in-code as a deliberate remediation of the platform's random-as-data findings.
- The NACE materiality matrix is a coarse 20-division default; ESRS 1 requires an entity-specific
  double-materiality process (impact + financial), which the engine explicitly defers to via its
  disclaimer note. Non-material topics scoring 100% completeness inflates
  `overall_completeness_pct` for narrow-footprint sectors (a K64 bank scores 100% with zero data).
- Completeness is presence-based (input group provided or not) — no unit validation, no
  plausibility checks, no assurance-readiness weighting.
- The E3 consumption mass balance (withdrawal − discharge) matches the ESRS E3 definition but can
  go negative if discharge exceeds withdrawal (e.g. harvested rainwater) — not guarded.
- The circularity score is a platform composite, not an ESRS metric (ESRS E5 prescribes the
  individual inflow/outflow metrics, not a blended score); similarly the E4 risk-flag thresholds
  (20% / 5 species / 100 ha) are unsourced heuristics.

### 7.6 Framework alignment

- **CSRD (Directive 2022/2464) + Commission Delegated Regulation (EU) 2023/2772:** the DR
  structures implemented (E2-1…E2-6, E3-1…E3-5, E4-1…E4-6, E5-1…E5-6) match the adopted ESRS Set 1
  disclosure requirements, including the policies/actions/targets/metrics/financial-effects
  pattern common to all topical standards.
- **ESRS 1 double materiality (§§17–44 cited in code):** materiality gates which topics must be
  assessed — implemented as sector defaults with an explicit entity-assessment caveat.
- **WRI Aqueduct:** baseline water-stress tiers (withdrawal/availability ratio bands 10/20/40/80%)
  are Aqueduct's published categorisation, used for the E3 stress tier.
- **Kunming-Montreal Global Biodiversity Framework (Target 15):** referenced for E4 corporate
  assessment/disclosure alignment; the engine proxies alignment via the No-Net-Loss commitment
  flag.
- **ENCORE (UNEP-WCMC/Natural Capital Finance Alliance):** the ecosystem-services dependency
  categories (provisioning/regulating/cultural) follow ENCORE's dependency-mapping taxonomy;
  ENCORE derives dependency materiality ratings per production process, which the entity is
  expected to supply.
- **EU Waste Framework Directive 2008/98/EC:** the waste-hierarchy disposition splits
  (diverted vs directed to disposal, landfill/incineration) mirror WFD reporting categories.
- **EU Taxonomy DNSH (Reg. 2020/852):** listed in regulatory refs as the cross-check for the same
  four environmental objectives.
