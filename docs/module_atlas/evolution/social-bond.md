## 9 · Future Evolution

### 9.1 Evolution A — Implement the Social Impact Score and reconcile the two tabs on real allocations (analytics ladder: rung 1 → 2)

**What.** The module has a real backend (`social_bond_engine`, 10 routes, with genuine allocation/eligibility/KPI-quality math), but §7 flags that the guide's headline `Social Impact Score = Σ(Allocation × Beneficiary Reach × Outcome Weight) ÷ Total Proceeds` is **not implemented** — every frontend impact figure is an `sr()` draw. Worse, `BONDS` (60 synthetic bonds) and `IMPACT_CATS` (the 8-category impact table) are independently seeded, so the Bond Screener and Impact Analytics tabs show irreconcilable numbers for the same categories, and the lineage sweep records `GET /ref/sdg-mapping` as failed. Evolution A implements the impact formula and single-sources the two tabs.

**How.** (1) Fix the failing `/ref/sdg-mapping` route (triage per the deployment-prep sweep). (2) Implement the Social Impact Score in `social_bond_engine` and expose it via `POST /full-assessment` — allocation × beneficiary reach × outcome weight, normalised to proceeds, with an outcome-weight table sourced from UNPRI/IFC social-outcome taxonomies. (3) Derive `IMPACT_CATS` by aggregating `BONDS` (Σ beneficiaries and Σ amount per category) so the Impact Analytics tab is a `reduce` over the Screener data, not a parallel draw — eliminating the documented inconsistency. (4) Add allocation-report ingestion so use-of-proceeds deployment (`useOfProceeds` %) reflects issuer reports rather than a draw.

**Prerequisites.** Outcome-weight sourcing; the sdg-mapping fix is the gate. **Acceptance:** the two tabs report identical category totals because one derives from the other; the Social Impact Score is computed and reproducible from allocation × reach × weight.

### 9.2 Evolution B — SBP-compliance and impact-report analyst (LLM tier 2)

**What.** A tool-calling analyst over the module's real endpoints: "is this bond ICMA SBP compliant?", "quantify the target-population reach", "draft the investor impact report". It calls `POST /icma-sbp-compliance`, `/target-population`, `/social-kpis`, and `/full-assessment`, narrating the engine's four-core-component assessment (use of proceeds, project evaluation, management of proceeds, reporting) and drafting the IIB/ICMA-aligned impact report from computed figures — never inventing beneficiary counts.

**How.** Tool schemas from the module's OpenAPI operations (6 POST compute + 4 GET ref); grounding corpus = this Atlas record plus the `GET /ref/project-categories`, `/ref/kpi-library`, and `/ref/sdg-mapping` payloads. The impact-report draft routes to the report-studio layer; the no-fabrication validator checks every beneficiary/housing/jobs figure against tool outputs. SBP-compliance verdicts cite the specific core component per finding.

**Prerequisites (hard).** Evolution A — until the impact score exists and the tabs reconcile, an analyst would narrate two contradictory sets of impact numbers, and `/ref/sdg-mapping` fails. **Acceptance:** every quantitative claim in a drafted impact report traces to a tool response; asking for a Social Impact Score before Evolution A returns "not computed," not a number.
