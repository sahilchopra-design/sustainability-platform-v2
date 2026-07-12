## 9 · Future Evolution

### 9.1 Evolution A — Live refresh telemetry and a computed average DQ (analytics ladder: rung 1 → 2)

**What.** EP-CS3 is a modest governance dashboard the guide describes fairly — but
§7 notes three softness points: the headline "Avg DQ Score 2.4" is a literal string,
not derived from the `dqDistribution` the page itself computes; `refreshData`
frequencies and the entire 20-event `INTEGRATION_LOG` are `sr()`-seeded decoration;
and the leaf `.quality` scores are analyst-assigned tags in the taxonomy tree. The
coverage-gap logic (leaves with no source or DQ ≥ 4) is genuinely useful. Evolution
A replaces decoration with measurement.

**How.** (1) One-line honesty fix first: compute the average DQ from
`dqDistribution` instead of the hard-coded 2.4. (2) Refresh telemetry: the platform
now runs a real Tier-1 reference-data layer (~221k rows behind `/api/v1/refdata`)
and 19 ingesters — read actual last-refresh timestamps and row counts per source
from the ingestion logs and the lineage service's
`GET /lineage/reference-data-inventory`, replacing the seeded log; the overdue rule
(Daily>2d, Weekly>10d, Monthly>35d) already works, it just needs real dates.
(3) Quality-tag review workflow: leaf DQ scores stay analyst-assigned (that is the
PCAF method) but gain provenance — assessor, date, rationale — so the distribution
is auditable. (4) The `RECOMMENDED_SOURCES` table cross-references the platform's
actual integration status (several recommendations, e.g. NGFS and World Bank, are
already integrated — the registry should know).

**Prerequisites.** Ingestion-log access; coordination with `data-source-manager`
(that module owns provider operations; this one owns taxonomy coverage — keep the
split explicit). **Acceptance:** the avg-DQ KPI equals the distribution's
computed mean; an ingester run updates its source's last-refresh within a cycle;
each leaf quality tag shows its assessor and date.

### 9.2 Evolution B — Gap-to-source recommendation copilot (LLM tier 1)

**What.** The module's most decision-shaped output — "these taxonomy nodes lack a
primary source; here are candidate public datasets" — currently pairs a computed
gap list with a static recommendation table. Evolution B makes the pairing
reasoned: for a selected coverage gap, the copilot proposes candidate sources with
grounded rationale (what the dataset covers, its access model, its PCAF tier
potential, integration effort given the platform's ingester patterns), drawing on
the curated catalogue plus the platform's documented data-sources research (the
PHYSICAL_CLIMATE_RISK_SOURCES doc and wave-1 integration learnings, which corrected
several public-source assumptions).

**How.** Tier-1 RAG: the recommendation catalogue, this Atlas record, and the
platform's data-sources research docs as corpus; the selected gap's taxonomy
context passes as prompt state. Recommendations carry an honesty discipline the
wave-1 project learned empirically: access models change (UK EPC auth, UCDP
self-service), so every recommendation states its verification date and flags
unverified access assumptions.

**Prerequisites.** Corpus embedding of the research docs (D3); Evolution A's
integration-status cross-reference. **Acceptance:** recommendations for a test gap
cite catalogue entries or research-doc findings; already-integrated sources are
identified as such; access-model claims carry verification dates.
