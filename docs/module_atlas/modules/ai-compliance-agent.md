# AI Compliance Agent
**Module ID:** `ai-compliance-agent` · **Route:** `/ai-compliance-agent` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
AI-powered regulatory compliance monitoring agent. Continuously scans regulatory updates, maps them to platform modules, assesses disclosure gaps, and generates remediation recommendations.

> **Business value:** Regulatory ESG requirements are changing rapidly across 20+ jurisdictions. Manual tracking is error-prone and resource-intensive. The AI Compliance Agent provides always-on regulatory intelligence, ensuring no material requirement is missed and enabling proactive rather than reactive compliance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGENT_LOG`, `Badge`, `COMPANIES`, `EFFORT_DAYS`, `EffortBadge`, `FINE_MULTIPLIERS`, `FRAMEWORKS`, `GAP_TEMPLATES`, `Pill`, `StatCard`, `TabAgentConsole`, `TabDeadlineRisk`, `TabEvidenceMapper`, `TabGapAnalysis`, `TabRemediationRoadmap`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `companyIdx * 100;` |
| `seed` | `base + fi * 7;` |
| `compPct` | `Math.round(35 + sr(seed) * 60);` |
| `totalGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.total \|\| 0), 0);` |
| `criticalGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.critical \|\| 0), 0);` |
| `mediumGaps` | `FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.medium \|\| 0), 0);` |
| `compositeScore` | `Math.round(FRAMEWORKS.reduce((a, fw) => a + (companyData[fw.id]?.compliancePct \|\| 0), 0) / FRAMEWORKS.length);` |
| `totalDays` | `fwData.gaps.reduce((a, g) => a + EFFORT_DAYS[g.effort], 0);` |
| `TODAY_YR` | `2026 + 3 / 12; // April 2026` |
| `fwRisk` | `FRAMEWORKS.map((fw, i) => {` |
| `daysLeft` | `fw.deadline === 'Voluntary' ? 999 : Math.round((fw.deadlineTs - TODAY_YR) * 365);` |
| `exposure` | `Math.round(fine * (1 - pct / 100));` |
| `totalDays` | `(companyData[fw.id]?.gaps \|\| []).reduce((a, g) => a + EFFORT_DAYS[g.effort], 0) \|\| 1;` |
| `priority` | `(exposure * urgencyW) / totalDays;` |
| `timelineData` | `FRAMEWORKS.map(fw => ({` |
| `matrixData` | `fwRisk.map(fw => ({` |
| `exposureData` | `fwRisk.map(fw => ({ name: fw.name, exposure: Math.round(fw.exposure / 1e6 * 10) / 10 }));` |
| `leftPct` | `((fw.deadlineTs - 2023) / (2027 - 2023)) * 100;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AGENT_LOG`, `COMPANIES`, `FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Monitored | — | Platform | All major global ESG disclosure frameworks |
| Update Frequency | — | Automation | Automated regulatory horizon scanning |
| Gap Resolution Rate | — | Platform target | Percentage of identified gaps resolved before deadline |
- **Regulatory feeds** → NLP change detection → **Regulatory update log**
- **Update classification** → Impact assessment → **Affected modules and gaps**
- **Gap analysis** → Remediation recommendations → **Action plan with priorities**

## 5 · Intermediate Transformation Logic
**Methodology:** NLP regulatory change detection
**Headline formula:** `ComplianceGap = Required_disclosures - Completed_disclosures per framework`
**Standards:** ['TCFD', 'ISSB S2', 'CSRD', 'SFDR', 'EU Taxonomy']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).