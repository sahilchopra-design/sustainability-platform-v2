# Data Schema & Analytics Review — A2 Intelligence
## Date: 2026-03-16

---

## Current Data Model Summary

### Scale
- **54 Alembic migrations** (001-054)
- **200+ database tables** across PostgreSQL (Supabase-hosted)
- **Key entity tables**: company_profiles, csrd_entity_registry, portfolios_pg, valuation_assets
- **Cross-module linkage**: cross_module_entity_linkage table (migration 042) with LEI uniqueness

### Schema Strengths
1. **Regulatory coverage depth**: 330 ESRS IG3 quantitative data points across 14 tables (migration 014)
2. **PCAF quality tracking**: Data Quality Scores (DQS 1-5) propagated through factor overlay and DMI engines
3. **Audit trail**: append-only audit_log table with checksum integrity (migration 026)
4. **Cross-module entity linkage**: LEI-based entity resolution connecting 5+ entity tables (migration 042)
5. **Temporal data**: dme_velocity_timeseries for time-series tracking (migration 053)
6. **Sentiment pipeline**: 5 tables for signal→score→trend→feed lifecycle (migration 054)
7. **Factor taxonomy**: 627+31 unified factor definitions with regulatory cross-refs (migration 054)

### Schema Limitations
1. **No PostGIS**: Nature risk calculations use lat/lng floats — no spatial queries, no geofencing, no polygon intersections
2. **No TimescaleDB**: dme_velocity_timeseries designed for hypertable but running on standard PostgreSQL — no automatic chunk management, no time-based compression
3. **No partitioning**: Large tables (audit_log, sentiment_signals) will grow unbounded without partition strategy
4. **JSONB overuse**: Many tables use JSONB columns for metadata/config — flexible but unindexed and unvalidated at DB level
5. **No soft-delete pattern**: Most tables have no is_deleted/deleted_at column — hard deletes lose audit history
6. **No versioning**: No row-level version tracking for regulatory data (except audit_log captures writes)
7. **No multi-tenancy**: No org_id/tenant_id on most tables — single-tenant only

### Top 10 Schema Gaps

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | No multi-tenancy (org_id) on entity/portfolio tables | Blocks SaaS deployment | Complex |
| 2 | No PostGIS extension for spatial queries | Nature risk, EUDR traceability limited | Medium |
| 3 | No table partitioning for high-volume tables | Performance degradation at scale | Medium |
| 4 | No workflow state tables (draft/review/approved/submitted) | Blocks compliance workflows | Medium |
| 5 | No data import/staging tables | Users can't upload portfolios | Quick win |
| 6 | No report template/generation tables | Blocks regulatory report output | Medium |
| 7 | No user preferences/settings table | No personalization | Quick win |
| 8 | No notification/alert delivery table | Alerts generated but not delivered | Quick win |
| 9 | No scheduled task/job tracking table | Background jobs untracked | Quick win |
| 10 | No API key management table | Blocks external integrations | Medium |

### Top 10 Analytics Opportunities

| # | Opportunity | Business Value | Complexity |
|---|------------|---------------|------------|
| 1 | CSRD gap-to-disclosure completion tracker with timeline | VERY HIGH | Medium |
| 2 | Portfolio climate risk heatmap with drill-down | HIGH | Low (exists partially) |
| 3 | Cross-regulation overlap analyzer (CSRD↔ISSB↔TCFD) | HIGH | Low (data exists) |
| 4 | Peer benchmark percentile ranking by sector | HIGH | Low (3,502 LOC engine exists) |
| 5 | Sentiment-driven early warning dashboard | HIGH | Medium |
| 6 | Regulatory deadline calendar with compliance status | HIGH | Quick win |
| 7 | Entity-level 360° ESG profile aggregation | HIGH | Medium (lineage exists) |
| 8 | Scenario comparison tornado charts | MEDIUM | Low (exists) |
| 9 | Factor contribution waterfall charts | MEDIUM | Low |
| 10 | Automated anomaly detection in reported data | MEDIUM | Medium |

### 3 Foundation Upgrades for Maximum Optionality

1. **Multi-tenancy (org_id + RLS)**: Add org_id to all entity/portfolio tables + enable Supabase Row-Level Security. Unlocks SaaS model.
2. **Workflow state machine**: Add generic workflow_states table (entity_type, entity_id, status, transitioned_by, transitioned_at). Unlocks compliance approval workflows across all modules.
3. **Data import framework**: Add import_jobs table + CSV/Excel parser. Unlocks real data flow into all modules.
