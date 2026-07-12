## 9 · Future Evolution

### 9.1 Evolution A — Content-level template scoring, real PCAF attribution, and full hazard taxonomy (analytics ladder: rung 1 → 3)

**What.** The EBA Pillar 3 ESG Disclosures Engine (E20) — a completeness/assessment engine for the
EBA's 10-template framework (CRR Art. 449a), a model of the honest-null discipline (its own comment:
"every figure must come from real portfolio data, never a random draw… we emit an honest null +
`insufficient_data` rather than fabricating"). §7.5 names the deepening targets: template scoring is
**presence-based** (a submitted template scores 100 regardless of cell-level quality unless the caller
supplies `template_scores`) whereas real EBA supervision reviews cell-level completeness against the
ITS annexes; the T7 financed-emissions derivation is a **single-factor PCAF proxy** (exposure × sector
EF, no attribution factor); the standalone heatmap endpoint **cannot receive hazard scores** (a route
omission — T1 is always empty via that path); and the NACE/hazard lists are abridged (15 sectors, 8
hazards vs the EU Taxonomy's 28 hazards in 4 families). Evolution A adds content-level template scoring,
real PCAF attribution for T7, and the full hazard taxonomy.

**How.** `score_template_completeness` scores against the ITS annex cell structure (not just
presence); T7 uses the platform's real PCAF engine (`dme_dmi`/`facilitated_emissions`) with
outstanding/EVIC attribution instead of exposure × EF; the standalone `physical_risk_heatmap` route is
fixed to forward `hazard_scores`; the hazard axis expands to the full EU Taxonomy 28-hazard taxonomy.
Rung 3: the >2,000 tCO₂e/€M "peer median" trigger (an unsourced heuristic) is replaced with real peer
benchmarks.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /physical-risk-heatmap` and
`/template-completeness` **skipped**, and the route omission means the heatmap endpoint can't receive
hazard scores; fix that. Preserve the honest-null discipline. **Acceptance:** the §7.4 worked example
(O-SII 75.0 compliance, 36.0 tCO₂e/€M intensity, 5.63 heatmap score) reproduces; the standalone
heatmap endpoint accepts and uses hazard scores; T7 uses attribution-factor PCAF; the endpoints pass
the harness.

### 9.2 Evolution B — Pillar 3 ESG disclosure copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for bank disclosure teams: "assess our EBA Pillar 3 ESG compliance" (`/assess` →
compliance score, financed emissions, GAR, physical-risk heatmap), "which mandatory templates are we
missing?" (`/template-completeness` for our institution type), and "build the T1 physical-risk heatmap"
(`/physical-risk-heatmap`) — narrating the engine's real outputs and honest nulls (an absent input
returns `insufficient_data`, never a fabricated figure, per the engine's binding-disclosure design).

**How.** Tool schemas over the 3 POST + 5 GET operations; the reference endpoints (templates,
institution types, NACE sectors, climate hazards, regulatory timeline) are ideal RAG grounding for
"which templates must a G-SII file and when?" questions. The no-fabrication validator checks every
compliance score, tCO₂e and GAR against tool output; because these are binding regulatory disclosures,
the copilot must never fill an honest-null with an estimate — it requests the missing input.
Composable with `csrd_reports` and `eu_taxonomy_gar` in a regulatory-disclosure workflow.

**Prerequisites.** Evolution A's harness fixes and route repair; Atlas + reference corpus embedded
(roadmap D3). **Acceptance:** every figure cited traces to an engine tool call; a missing input yields
the engine's `insufficient_data`, which the copilot surfaces as a data gap (not an estimate); the
mandatory-template list a copilot names matches the institution type's obligation.
