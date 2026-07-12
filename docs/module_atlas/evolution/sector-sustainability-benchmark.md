## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised IQR benchmarking and join the two disconnected datasets (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag is unambiguous: the guide promises `benchmark_score = (company_kpi − peer_p25)/(peer_p75 − peer_p25) × 100` with SASB-weighted composites, but no IQR normalisation, percentile computation, or weighted score exists in the file. Worse, the page carries two data sources that are never joined — hand-authored descriptive benchmark strings (`ghgIntensity: '0.45 tCO2e/t product'`) and a separate `sr()`-synthetic numeric company array — so its two views of sector performance can visually contradict each other. Evolution A converts the benchmark strings into a parseable numeric reference table and implements the guide's formula for real.

**How.** (1) Restructure `SECTORS[].benchmarks` into `{metric, value, unit, source, percentile}` rows (a `ref_sector_esg_benchmarks` seed, citing S&P CSA / CDP technical notes per metric). (2) Implement `iqrScore(company_kpi, p25, p75)` with clamping and an explicit n-per-peer-group display. (3) Weight composites by the SASB materiality map — the guide already names it; encode it as a sector × KPI weight matrix. (4) Delete or repair the §7.6-documented dead code `sectorRadarData` (parameter shadows the `useMemo` import) before extending — any future caller receives a function, not an array.

**Prerequisites.** Sourcing pass to attach citations to each benchmark value; the synthetic `COMPANIES` generator must be replaced or clearly quarantined as demo data. **Acceptance:** for a company with kpi = p25 the score renders 0 and at p75 renders 100; benchmark table and company view use the same numeric source.

### 9.2 Evolution B — Evidence-guided maturity assessor (LLM tier 1)

**What.** The Maturity Assessment tab is currently a pure self-report slider with no validation. Evolution B turns it into an evidence-guided interview: the copilot walks the user through each `MATURITY_DIMS` dimension, asks for concrete evidence ("describe your Scope 3 data collection process"), and proposes a CMMI-style level with a rationale tied to the `MATURITY_LEVELS` rubric the page already encodes — the user confirms or overrides, and the divergence between self-score and evidence-implied score is displayed.

**How.** Tier-1 pattern with structured elicitation: `POST /api/v1/copilot/sector-sustainability-benchmark/ask`, grounding corpus = this Atlas record plus the maturity rubric and the real leadership case studies the page carries (Microsoft, Novo Nordisk, Unilever et al., which §7.6 notes accurately reflect public disclosures). The copilot cites the specific rubric sentence that justifies each proposed level; it never asserts a level without user-provided evidence text.

**Prerequisites.** None hard — the rubric and case studies are already sound; a session-persistence table for assessment drafts is desirable. **Acceptance:** every proposed level quotes a rubric criterion; empty evidence input yields "insufficient evidence," never a default score.
