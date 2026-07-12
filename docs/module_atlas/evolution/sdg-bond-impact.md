## 9 · Future Evolution

### 9.1 Evolution A — Sourced impact coefficients with internally consistent metrics (analytics ladder: rung 1 → 3)

**What.** The module is tier-B frontend-only: 20 hand-curated bonds scaled linearly against a `BOND_IMPACT_METRICS` table whose per-$Mn benchmarks (e.g. Renewable Energy 2,800 tCO₂e/$Mn) are, per §7.2, "illustrative, not audit-ready" — no citation ties any coefficient to a named MDB or ICMA report, and §7.6 notes the metrics for a single bond are not mutually consistent (GHG avoided, GWh, and households powered are independent multiplications, not derived from one capacity figure). Evolution A builds the first backend vertical with cited, internally consistent coefficients.

**How.** (1) A `ref_bond_impact_benchmarks` table seeded from the ICMA Harmonised Framework for Impact Reporting and published MDB green-bond impact reports (World Bank/IFC/ADB), each row carrying source, vintage, and geography. (2) Derive dependent metrics from a single physical anchor per category — capacity (MW) → generation (GWh via sourced capacity factors) → tCO₂e (grid EF) → households (per-household consumption) — so the numbers reconcile. (3) `POST /api/v1/sdg-bonds/impact` computing per-bond and portfolio impact with a benchmark-range (P25/P50/P75) instead of a point coefficient. (4) Make `verified`/`additionality`/`icma_compliant` rule-derived, fixing the §7.6 finding that these independent seeds produce impossible combinations.

**Prerequisites.** Coefficient sourcing effort (one-time literature pass); grid-EF reference data (already in `referenceData.js` lineage). **Acceptance:** every coefficient row cites a named report+year; for any Renewable Energy bond, GWh × grid-EF reproduces the stated tCO₂e within rounding.

### 9.2 Evolution B — Allocation-report reader copilot (LLM tier 2)

**What.** Issuer use-of-proceeds allocation reports are PDFs with heterogeneous tables — exactly the extraction task LLMs handle well and the current module skips entirely (bonds are hardcoded). Evolution B lets an analyst drop an issuer's allocation/impact report into the module; the copilot extracts project-level allocations, maps categories to the SDG taxonomy the page already carries, runs the impact calculation via the Evolution-A endpoint as a tool call, and flags divergence between issuer-reported impact and benchmark-implied impact.

**How.** Tool-calling pattern per the Tier-2 architecture: extraction returns a structured allocation table the user confirms before any calculation; the copilot then calls `POST /api/v1/sdg-bonds/impact` and narrates only the returned figures. The comparison verdict ("issuer reports 3,900 tCO₂e/$Mn vs. benchmark P75 of 3,200") cites both sources explicitly. Refusal path for bonds without an allocation report — no impact estimate from the bond name alone.

**Prerequisites (hard).** Evolution A must land first: benchmark-vs-issuer comparison is meaningless while coefficients are unsourced constants. **Acceptance:** on a real published World Bank green bond impact report, extracted allocations sum to the reported total, and every numeric in the copilot's answer traces to either the document or the tool response.
