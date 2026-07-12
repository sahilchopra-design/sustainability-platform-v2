## 9 · Future Evolution

### 9.1 Evolution A — Auto-populate disclosures from platform engines (analytics ladder: rung 1 → 2)

**What.** `RegulatoryReportCompiler` is a disclosure-completeness engine holding machine-readable
skeletons of ten frameworks (TCFD, SFDR periodic, GRI 305, SEC Reg S-K 1500, ISSB S1/S2, UK TCFD,
APRA CPG 229, SEBI BRSR, BRSR Core, CSRD/ESRS) and scoring caller-supplied data against each
framework's required fields: `section completeness = disclosed/required × 100`, rolled to an
overall status, rendered to submission-ready HTML/PDF (WeasyPrint). It's honest and deterministic
but entirely passive — it scores what the caller pastes in; it doesn't fetch the numbers the
platform already computes. Evolution A wires it to the engines.

**How.** (1) Auto-populate framework fields from the platform's own outputs: GRI 305 and SEC
climate emissions from the PCAF/GHG engines, ISSB S2 from the `issb_s2` module, SFDR PAI from
`pcaf_regulatory`, Taxonomy from `gar`/`pcaf_regulatory` — so a compile is pre-filled with
computed, sourced data and the completeness score reflects real coverage, not manual entry. (2)
Report a per-field provenance (engine-sourced vs caller-supplied vs missing) in the compiled
report. (3) Add cross-framework de-duplication so a metric disclosed once (e.g. Scope 1) satisfies
every framework that requires it. (4) Bench-pin the completeness aggregation per framework.

**Prerequisites.** Integration points to the emissions/PCAF/ISSB/SFDR engines; a canonical
per-entity disclosure store to pull from. **Acceptance:** a compile pre-fills fields from platform
engines with per-field provenance; completeness reflects auto-sourced data; a shared metric
satisfies all requiring frameworks; per-framework aggregation bench-pinned.

### 9.2 Evolution B — Multi-framework report-drafting copilot (LLM tier 2)

**What.** A copilot that compiles and explains a regulatory report — "your TCFD disclosure is 78%
complete; the Strategy pillar is the gap (scenario analysis and resilience undisclosed); here's the
draft and the specific missing fields" — calling the per-framework compile endpoints and narrating
the section gaps, then rendering the submission-ready document.

**How.** Seven+ `POST /compile/{framework}` endpoints plus template reference GETs that fully
describe each framework's required fields — a complete, self-contained grounding corpus. The
per-section completeness and gap strings drive a precise remediation narrative; the engine's
`render_html`/`render_pdf_bytes` become the copilot's output layer, composing into the report-studio
artifacts the roadmap describes for tier-3. Central node for a disclosure/reporting desk,
orchestrating the framework-specific copilots (ISSB, GRI, SFDR).

**Prerequisites.** None hard — engine is honest and template-complete; far more useful once
Evolution A auto-populates from platform data (otherwise the copilot narrates completeness of
manually-pasted input). **Acceptance:** every completeness %, section status, and named gap traces
to a compile response; the copilot distinguishes engine-sourced from caller-supplied fields; it
frames output as disclosure-completeness (not assurance or filing sign-off) and refuses to claim
regulatory acceptance.
