# Task 8: Infrastructure, Database Architecture, and MLOps Deployment
## Complete System Design for Climate Risk Analytics Platform

---

## Executive Summary

This document provides comprehensive infrastructure specifications for a production-grade Climate Risk Analytics Platform capable of processing 6 million geospatial assets with real-time and batch risk calculations. The architecture leverages Supabase PostgreSQL with PostGIS extensions, MLflow model registry, Celery batch processing, FastAPI/Triton inference services, and Railway containerized microservices deployment.

---

## 1. Supabase PostgreSQL Database Architecture (4x Detail)

### 1.1 Core Database Schema Design

#### 1.1.1 Multi-Tenant Assets Table

```sql
-- EXTENSION SETUP
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS h3;
CREATE EXTENSION IF NOT EXISTS h3_postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CORE TENANT TABLE
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    data_retention_days INTEGER DEFAULT 365,
    max_assets INTEGER DEFAULT 10000,
    allowed_scenarios TEXT[] DEFAULT ARRAY['rcp45', 'rcp85'],
    allowed_time_horizons INTEGER[] DEFAULT ARRAY[2030, 2050, 2100],
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_subscription ON tenants(subscription_tier);

-- CORE ASSETS TABLE (6M+ Records)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    name VARCHAR(500),
    asset_type VARCHAR(50) NOT NULL,
    asset_subtype VARCHAR(100),
    geometry GEOMETRY(POINT, 4326) NOT NULL,
    geometry_3857 GEOMETRY(POINT, 3857) GENERATED ALWAYS AS (
        ST_Transform(geometry, 3857)
    ) STORED,
    h3_index H3INDEX,
    h3_resolution INTEGER DEFAULT 8,
    address JSONB DEFAULT '{}',
    address_search TSVECTOR,
    valuation JSONB DEFAULT '{}',
    replacement_value DECIMAL(15,2),
    insured_value DECIMAL(15,2),
    currency CHAR(3) DEFAULT 'USD',
    construction_year INTEGER,
    floor_area_sqm DECIMAL(10,2),
    num_floors INTEGER,
    occupancy_type VARCHAR(100),
    risk_profile JSONB DEFAULT '{}',
    last_risk_calculation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_tenant_external_id UNIQUE (tenant_id, external_id),
    CONSTRAINT valid_asset_type CHECK (asset_type IN (
        'residential', 'commercial', 'industrial', 
        'infrastructure', 'agricultural', 'mixed_use'
    ))
);

-- SPATIAL INDEXING
CREATE INDEX idx_assets_geom ON assets USING GIST(geometry);
CREATE INDEX idx_assets_geom_3857 ON assets USING GIST(geometry_3857);
CREATE INDEX idx_assets_h3 ON assets USING BTREE(h3_index);
CREATE INDEX idx_assets_tenant_geom ON assets USING GIST(tenant_id, geometry);

-- ATTRIBUTE INDEXING
CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_subtype ON assets(asset_subtype);
CREATE INDEX idx_assets_external_id ON assets(external_id);
CREATE INDEX idx_assets_created_at ON assets(created_at);
CREATE INDEX idx_assets_updated_at ON assets(updated_at);
CREATE INDEX idx_assets_last_calc ON assets(last_risk_calculation);
CREATE INDEX idx_assets_address_search ON assets USING GIN(address_search);
CREATE INDEX idx_assets_valuation ON assets USING GIN(valuation jsonb_path_ops);
CREATE INDEX idx_assets_risk_profile ON assets USING GIN(risk_profile jsonb_path_ops);
CREATE INDEX idx_assets_uncalculated ON assets(tenant_id) 
    WHERE last_risk_calculation IS NULL;

-- TRIGGER FOR H3 INDEX GENERATION
CREATE OR REPLACE FUNCTION generate_h3_index()
RETURNS TRIGGER AS $$
BEGIN
    NEW.h3_index := h3_lat_lng_to_cell(
        ST_Y(NEW.geometry)::double precision,
        ST_X(NEW.geometry)::double precision,
        NEW.h3_resolution
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_h3_index
    BEFORE INSERT OR UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION generate_h3_index();

-- TRIGGER FOR FULL-TEXT SEARCH
CREATE OR REPLACE FUNCTION update_address_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.address_search := to_tsvector('english', 
        COALESCE(NEW.address->>'street', '') || ' ' ||
        COALESCE(NEW.address->>'city', '') || ' ' ||
        COALESCE(NEW.address->>'state', '') || ' ' ||
        COALESCE(NEW.address->>'country', '') || ' ' ||
        COALESCE(NEW.address->>'postal_code', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_address_search
    BEFORE INSERT OR UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_address_search();
```

#### 1.1.2 Climate Risk Scores Table

```sql
-- CLIMATE RISK SCORES TABLE
CREATE TABLE climate_risk_scores (
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    hazard VARCHAR(30) NOT NULL,
    scenario VARCHAR(50) NOT NULL,
    time_horizon INTEGER NOT NULL,
    tail_risk_score DECIMAL(10,6),
    risk_probability DECIMAL(10,6),
    expected_impact DECIMAL(15,2),
    annual_expected_loss DECIMAL(15,2),
    var_95 DECIMAL(15,2),
    var_99 DECIMAL(15,2),
    cvar_95 DECIMAL(15,2),
    cvar_99 DECIMAL(15,2),
    distribution JSONB NOT NULL DEFAULT '{}',
    distribution_type VARCHAR(50) DEFAULT 'empirical',
    model_version VARCHAR(50),
    model_name VARCHAR(100),
    confidence_score DECIMAL(5,4),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (asset_id, hazard, scenario, time_horizon),
    CONSTRAINT valid_hazard CHECK (hazard IN (
        'flood', 'wildfire', 'hurricane', 'tornado', 
        'earthquake', 'drought', 'heat_stress', 'sea_level_rise'
    )),
    CONSTRAINT valid_scenario CHECK (scenario IN (
        'rcp26', 'rcp45', 'rcp60', 'rcp85', 
        'ssp119', 'ssp245', 'ssp370', 'ssp585'
    )),
    CONSTRAINT valid_probability CHECK (risk_probability BETWEEN 0 AND 1),
    CONSTRAINT valid_tail_risk CHECK (tail_risk_score BETWEEN 0 AND 1)
);

-- RISK SCORES INDEXING
CREATE INDEX idx_risk_scores_asset ON climate_risk_scores(asset_id);
CREATE INDEX idx_risk_scores_hazard ON climate_risk_scores(hazard, scenario);
CREATE INDEX idx_risk_scores_horizon ON climate_risk_scores(time_horizon);
CREATE INDEX idx_risk_scores_calculated ON climate_risk_scores(calculated_at);
CREATE INDEX idx_risk_scores_hazard_scenario_horizon 
    ON climate_risk_scores(hazard, scenario, time_horizon);
CREATE INDEX idx_risk_scores_tail_risk ON climate_risk_scores(tail_risk_score);
CREATE INDEX idx_risk_scores_probability ON climate_risk_scores(risk_probability);
CREATE INDEX idx_risk_scores_distribution ON climate_risk_scores 
    USING GIN(distribution jsonb_path_ops);
CREATE INDEX idx_risk_scores_model ON climate_risk_scores(model_version, model_name);
CREATE INDEX idx_risk_scores_high_risk ON climate_risk_scores(asset_id, tail_risk_score)
    WHERE tail_risk_score > 0.7;
```

#### 1.1.3 Stochastic Distribution Schema (JSONB)

```sql
-- DISTRIBUTION SCHEMA VALIDATION FUNCTION
CREATE OR REPLACE FUNCTION validate_distribution_schema()
RETURNS TRIGGER AS $$
DECLARE
    dist_type TEXT;
    required_keys TEXT[];
    dist_keys TEXT[];
BEGIN
    dist_type := NEW.distribution->>'type';
    dist_keys := ARRAY(SELECT jsonb_object_keys(NEW.distribution));
    
    CASE dist_type
        WHEN 'empirical' THEN
            required_keys := ARRAY['type', 'samples', 'percentiles', 'histogram'];
            IF NOT (required_keys <@ dist_keys) THEN
                RAISE EXCEPTION 'Empirical distribution missing required keys: %', 
                    array_to_string(required_keys - dist_keys, ', ');
            END IF;
        WHEN 'parametric' THEN
            required_keys := ARRAY['type', 'family', 'parameters'];
            IF NOT (required_keys <@ dist_keys) THEN
                RAISE EXCEPTION 'Parametric distribution missing required keys: %', 
                    array_to_string(required_keys - dist_keys, ', ');
            END IF;
        WHEN 'mixture' THEN
            required_keys := ARRAY['type', 'components', 'weights'];
            IF NOT (required_keys <@ dist_keys) THEN
                RAISE EXCEPTION 'Mixture distribution missing required keys: %', 
                    array_to_string(required_keys - dist_keys, ', ');
            END IF;
        ELSE
            RAISE EXCEPTION 'Unknown distribution type: %', dist_type;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_distribution_schema
    BEFORE INSERT OR UPDATE ON climate_risk_scores
    FOR EACH ROW
    WHEN (NEW.distribution IS NOT NULL)
    EXECUTE FUNCTION validate_distribution_schema();

-- DISTRIBUTION QUERY FUNCTIONS
CREATE OR REPLACE FUNCTION get_distribution_percentile(dist JSONB, p DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    percentiles JSONB;
BEGIN
    IF dist->>'type' = 'empirical' THEN
        percentiles := dist->'percentiles';
        RETURN (percentiles->>(p::TEXT))::DECIMAL;
    ELSIF dist->>'type' = 'parametric' THEN
        RETURN get_parametric_percentile(dist, p);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_distribution_mean(dist JSONB)
RETURNS DECIMAL AS $$
BEGIN
    IF dist->>'type' = 'empirical' THEN
        RETURN (dist->>'mean')::DECIMAL;
    ELSIF dist->>'type' = 'parametric' THEN
        RETURN calculate_parametric_mean(dist);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 1.2 Partitioning Strategy

```sql
-- PARTITIONING BY H3 GEOGRAPHY
CREATE TABLE climate_risk_scores_partitioned (
    asset_id UUID NOT NULL,
    hazard VARCHAR(30) NOT NULL,
    scenario VARCHAR(50) NOT NULL,
    time_horizon INTEGER NOT NULL,
    tail_risk_score DECIMAL(10,6),
    risk_probability DECIMAL(10,6),
    expected_impact DECIMAL(15,2),
    var_95 DECIMAL(15,2),
    var_99 DECIMAL(15,2),
    distribution JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    h3_cell H3INDEX NOT NULL,
    PRIMARY KEY (asset_id, hazard, scenario, time_horizon, h3_cell)
) PARTITION BY RANGE (h3_cell);

-- Create partitions for H3 resolution 4 cells
CREATE TABLE climate_risk_scores_p_8029fffffff PARTITION OF climate_risk_scores_partitioned
    FOR VALUES FROM ('8029fffffff') TO ('8029ffffffff');

-- TIME-BASED PARTITIONING FOR AUDIT LOGS
CREATE TABLE audit_logs (
    id BIGSERIAL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID
) PARTITION BY RANGE (changed_at);

-- Monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated partition creation
CREATE OR REPLACE FUNCTION create_audit_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'audit_logs_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
    end_date := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;
```

### 1.3 PostGIS Advanced Configuration

```sql
-- POSTGIS SPATIAL FUNCTIONS
CREATE OR REPLACE FUNCTION find_assets_within_radius(
    p_tenant_id UUID,
    p_longitude DECIMAL,
    p_latitude DECIMAL,
    p_radius_meters DECIMAL
)
RETURNS TABLE (asset_id UUID, asset_name VARCHAR, distance_meters DECIMAL, geometry GEOMETRY) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        ST_Distance(
            a.geometry::geography,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        )::DECIMAL as distance_meters,
        a.geometry
    FROM assets a
    WHERE a.tenant_id = p_tenant_id
      AND ST_DWithin(
          a.geometry::geography,
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
          p_radius_meters
      )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION aggregate_risk_by_h3(
    p_tenant_id UUID,
    p_hazard VARCHAR,
    p_scenario VARCHAR,
    p_time_horizon INTEGER,
    p_h3_resolution INTEGER DEFAULT 8
)
RETURNS TABLE (
    h3_cell H3INDEX, asset_count BIGINT, avg_tail_risk DECIMAL,
    max_tail_risk DECIMAL, total_expected_impact DECIMAL, avg_var_95 DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.h3_index as h3_cell,
        COUNT(*)::BIGINT as asset_count,
        AVG(crs.tail_risk_score)::DECIMAL as avg_tail_risk,
        MAX(crs.tail_risk_score)::DECIMAL as max_tail_risk,
        SUM(crs.expected_impact)::DECIMAL as total_expected_impact,
        AVG(crs.var_95)::DECIMAL as avg_var_95
    FROM assets a
    JOIN climate_risk_scores crs ON a.id = crs.asset_id
    WHERE a.tenant_id = p_tenant_id
      AND crs.hazard = p_hazard
      AND crs.scenario = p_scenario
      AND crs.time_horizon = p_time_horizon
      AND a.h3_resolution = p_h3_resolution
    GROUP BY a.h3_index;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 2. Row Level Security (RLS) for Multi-Tenancy (4x Detail)

### 2.1 Core RLS Implementation

```sql
-- RLS CONFIGURATION TABLE
CREATE TABLE rls_policies (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    policy_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    using_expression TEXT NOT NULL,
    check_expression TEXT,
    role_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_name, policy_name)
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
ALTER TABLE climate_risk_scores FORCE ROW LEVEL SECURITY;

-- TENANT ISOLATION POLICIES
CREATE POLICY tenant_isolation_assets ON assets
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', TRUE)::UUID);

CREATE POLICY tenant_isolation_risk_scores ON climate_risk_scores
    FOR ALL
    USING (
        asset_id IN (
            SELECT id FROM assets 
            WHERE tenant_id = current_setting('app.current_tenant', TRUE)::UUID
        )
    );

CREATE POLICY tenant_isolation_tenants ON tenants
    FOR ALL
    USING (id = current_setting('app.current_tenant', TRUE)::UUID);

-- ROLE-BASED ACCESS CONTROL
CREATE ROLE climate_admin;
CREATE ROLE climate_analyst;
CREATE ROLE climate_viewer;
CREATE ROLE climate_service;

GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO climate_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON climate_risk_scores TO climate_admin;
GRANT SELECT ON assets TO climate_analyst;
GRANT SELECT ON climate_risk_scores TO climate_analyst;
GRANT SELECT ON assets TO climate_viewer;
GRANT SELECT ON climate_risk_scores TO climate_viewer;
GRANT SELECT, INSERT, UPDATE ON climate_risk_scores TO climate_service;

CREATE POLICY admin_full_access ON assets
    FOR ALL TO climate_admin
    USING (tenant_id = current_setting('app.current_tenant', TRUE)::UUID)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::UUID);
```

### 2.2 Advanced RLS with Data Sharing

```sql
-- DATA SHARING CONFIGURATION
CREATE TABLE data_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_tenant_id UUID NOT NULL REFERENCES tenants(id),
    shared_with_tenant_id UUID REFERENCES tenants(id),
    share_type VARCHAR(50) NOT NULL,
    portfolio_id UUID,
    region_geometry GEOMETRY(POLYGON, 4326),
    allowed_hazards TEXT[],
    allowed_scenarios TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_data_shares_owner ON data_shares(owner_tenant_id);
CREATE INDEX idx_data_shares_shared ON data_shares(shared_with_tenant_id);

-- SHARED DATA ACCESS POLICY
CREATE POLICY shared_data_access ON assets
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant', TRUE)::UUID
        OR tenant_id IN (
            SELECT owner_tenant_id FROM data_shares
            WHERE shared_with_tenant_id = current_setting('app.current_tenant', TRUE)::UUID
              AND is_active = TRUE
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (share_type = 'all' OR 
                   (share_type = 'region' AND ST_Within(geometry, region_geometry)))
        )
    );

-- BENCHMARK DATA ACCESS
CREATE TABLE benchmark_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_type VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    allowed_tiers TEXT[],
    aggregation_level VARCHAR(50),
    data JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY benchmark_access ON benchmark_datasets
    FOR SELECT
    USING (is_public = TRUE OR
           current_setting('app.current_tier', TRUE)::TEXT = ANY(allowed_tiers));
```

### 2.3 Audit Logging System

```sql
-- AUDIT LOG TABLE
CREATE TABLE audit_logs (
    id BIGSERIAL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_by_email VARCHAR(255),
    tenant_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (changed_at);

-- AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs%ROWTYPE;
BEGIN
    audit_row.table_name := TG_TABLE_NAME;
    audit_row.changed_by := current_setting('app.current_user_id', TRUE)::UUID;
    audit_row.changed_by_email := current_setting('app.current_user_email', TRUE);
    audit_row.tenant_id := current_setting('app.current_tenant', TRUE)::UUID;
    audit_row.session_id := current_setting('app.session_id', TRUE);
    
    IF TG_OP = 'INSERT' THEN
        audit_row.record_id := NEW.id;
        audit_row.operation := 'INSERT';
        audit_row.new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.record_id := NEW.id;
        audit_row.operation := 'UPDATE';
        audit_row.new_data := to_jsonb(NEW);
        audit_row.old_data := to_jsonb(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        audit_row.record_id := OLD.id;
        audit_row.operation := 'DELETE';
        audit_row.old_data := to_jsonb(OLD);
    END IF;
    
    INSERT INTO audit_logs VALUES (audit_row.*);
    
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_assets
    AFTER INSERT OR UPDATE OR DELETE ON assets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ACCESS LOG TABLE
CREATE TABLE access_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    user_email VARCHAR(255),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    query_params JSONB,
    response_status INTEGER,
    duration_ms INTEGER,
    records_accessed INTEGER,
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_access_logs_tenant ON access_logs(tenant_id);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_endpoint ON access_logs(endpoint);
CREATE INDEX idx_access_logs_accessed ON access_logs(accessed_at);
```

---

## 3. MLflow/Weights & Biases Model Registry (4x Detail)

### 3.1 MLflow Configuration

```yaml
# MLflow Tracking Server Configuration
server:
  host: 0.0.0.0
  port: 5000
  workers: 4
  
backend_store:
  type: postgresql
  uri: ${MLFLOW_BACKEND_STORE_URI}
  pool_size: 20
  max_overflow: 10
  
artifact_store:
  type: s3
  bucket: ${MLFLOW_S3_BUCKET}
  region: ${AWS_REGION}
  
default_artifact_root: s3://${MLFLOW_S3_BUCKET}/mlflow-artifacts

model_registry:
  enabled: true
  default_stage: None
  allowed_stage_transitions:
    None: [Staging]
    Staging: [Production, Archived]
    Production: [Archived]
    Archived: [Staging]
```

```python
# MLflow Client Configuration
import os
import mlflow
from mlflow.tracking import MlflowClient
from dataclasses import dataclass
from typing import Optional, Dict, Any, List

@dataclass
class ModelRegistryConfig:
    tracking_uri: str = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    experiment_name: str = "climate-risk-models"
    artifact_location: str = "s3://climate-risk-ml/mlflow-artifacts"
    
class MLflowModelRegistry:
    def __init__(self, config: ModelRegistryConfig = None):
        self.config = config or ModelRegistryConfig()
        mlflow.set_tracking_uri(self.config.tracking_uri)
        self.client = MlflowClient()
        self._ensure_experiment()
    
    def _ensure_experiment(self):
        experiment = mlflow.get_experiment_by_name(self.config.experiment_name)
        if experiment is None:
            mlflow.create_experiment(
                name=self.config.experiment_name,
                artifact_location=self.config.artifact_location
            )
        mlflow.set_experiment(self.config.experiment_name)
    
    def register_model(self, model_path: str, model_name: str, model_version: str,
                       model_signature: Dict[str, Any], metrics: Dict[str, float],
                       params: Dict[str, Any], tags: Dict[str, str], 
                       description: str = "") -> str:
        with mlflow.start_run() as run:
            for key, value in params.items():
                mlflow.log_param(key, value)
            for key, value in metrics.items():
                mlflow.log_metric(key, value)
            for key, value in tags.items():
                mlflow.set_tag(key, value)
            
            mlflow.pyfunc.log_model(
                artifact_path="model",
                python_model=model_path,
                signature=model_signature,
                code_path=["src"],
                pip_requirements="requirements.txt"
            )
            
            model_version = mlflow.register_model(
                model_uri=f"runs:/{run.info.run_id}/model",
                name=model_name,
                tags={"version": model_version, "stage": "None", "description": description}
            )
            return model_version.version
    
    def transition_model_stage(self, model_name: str, version: str, 
                               stage: str, comment: str = ""):
        self.client.transition_model_version_stage(
            name=model_name, version=version, stage=stage,
            archive_existing_versions=(stage == "Production")
        )
        if comment:
            self.client.update_model_version(
                name=model_name, version=version, description=comment
            )
```

### 3.2 Weights & Biases Integration

```python
# Weights & Biases Configuration
import wandb
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

@dataclass
class WandbConfig:
    project: str = "climate-risk-analytics"
    entity: str = "aa-impact"
    tags: List[str] = None
    job_type: str = "training"
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

class WandbExperimentTracker:
    def __init__(self, config: WandbConfig = None):
        self.config = config or WandbConfig()
        self.run = None
    
    def start_run(self, name: str = None, config: Dict[str, Any] = None):
        self.run = wandb.init(
            project=self.config.project,
            entity=self.config.entity,
            name=name,
            tags=self.config.tags,
            job_type=self.config.job_type,
            config=config or {}
        )
        return self.run
    
    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        if self.run:
            wandb.log(metrics, step=step)
    
    def log_model(self, model_path: str, model_name: str,
                  aliases: List[str] = None, metadata: Dict[str, Any] = None):
        if self.run:
            artifact = wandb.Artifact(
                name=model_name, type="model", metadata=metadata or {}
            )
            artifact.add_dir(model_path)
            self.run.log_artifact(artifact, aliases=aliases or ["latest"])
    
    def finish(self):
        if self.run:
            wandb.finish()
```

### 3.3 Model Deployment Triggers

```python
# Automated Model Deployment Pipeline
from typing import Dict, Any, Callable
from dataclasses import dataclass
from enum import Enum
import requests

class DeploymentStage(Enum):
    NONE = "None"
    STAGING = "Staging"
    PRODUCTION = "Production"
    ARCHIVED = "Archived"

@dataclass
class DeploymentConfig:
    staging_threshold: float = 0.85
    production_threshold: float = 0.90
    auto_promote_to_staging: bool = True
    require_approval_for_production: bool = True
    webhook_url: str = None

class ModelDeploymentPipeline:
    def __init__(self, registry, config: DeploymentConfig = None):
        self.registry = registry
        self.config = config or DeploymentConfig()
        self.approvers: Dict[str, Callable] = {}
    
    def evaluate_and_promote(self, model_name: str, version: str,
                             validation_metrics: Dict[str, float]):
        composite_score = self._calculate_composite_score(validation_metrics)
        
        if (composite_score >= self.config.staging_threshold and 
            self.config.auto_promote_to_staging):
            self._promote_to_staging(model_name, version, validation_metrics)
        
        if composite_score >= self.config.production_threshold:
            if self.config.require_approval_for_production:
                self._request_production_approval(model_name, version, validation_metrics)
            else:
                self._promote_to_production(model_name, version, validation_metrics)
    
    def _calculate_composite_score(self, metrics: Dict[str, float]) -> float:
        weights = {"accuracy": 0.25, "precision": 0.20, "recall": 0.20, 
                   "f1_score": 0.20, "auc_roc": 0.15}
        score = sum(metrics.get(k, 0) * w for k, w in weights.items())
        return score / sum(weights.values()) if weights else 0.0
    
    def _promote_to_staging(self, model_name: str, version: str, metrics: Dict[str, float]):
        comment = f"Auto-promoted to staging. Score: {self._calculate_composite_score(metrics):.4f}"
        self.registry.mlflow.transition_model_stage(model_name, version, "Staging", comment)
        self._notify_webhook("staging", model_name, version, metrics)
    
    def _promote_to_production(self, model_name: str, version: str, metrics: Dict[str, float]):
        comment = f"Promoted to production. Score: {self._calculate_composite_score(metrics):.4f}"
        self.registry.mlflow.transition_model_stage(model_name, version, "Production", comment)
        self._notify_webhook("production", model_name, version, metrics)
    
    def _notify_webhook(self, stage: str, model_name: str, version: str, metrics: Dict[str, float]):
        if self.config.webhook_url:
            payload = {"event": "model_promotion", "stage": stage, "model_name": model_name,
                       "version": version, "metrics": metrics}
            requests.post(self.config.webhook_url, json=payload)
```

---

## 4. Batch Processing Architecture (Celery + Redis) (4x Detail)

### 4.1 Celery Configuration

```python
# Celery Application Configuration
import os
from celery import Celery
from kombu import Queue, Exchange

celery_app = Celery('climate_risk')

celery_app.config_from_object({
    'broker_url': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    'broker_connection_retry_on_startup': True,
    'broker_transport_options': {
        'visibility_timeout': 43200,
        'queue_order_strategy': 'priority',
    },
    'result_backend': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    'result_expires': 86400,
    'result_extended': True,
    'task_serializer': 'json',
    'accept_content': ['json', 'pickle'],
    'result_serializer': 'json',
    'task_track_started': True,
    'task_time_limit': 3600,
    'task_soft_time_limit': 3300,
    'worker_prefetch_multiplier': 1,
    'worker_max_tasks_per_child': 100,
    'worker_concurrency': 4,
    'task_default_queue': 'default',
    'task_queues': (
        Queue('default', Exchange('default'), routing_key='default'),
        Queue('high_priority', Exchange('high_priority'), routing_key='high_priority'),
        Queue('risk_calculation', Exchange('risk_calculation'), routing_key='risk_calculation'),
        Queue('data_ingestion', Exchange('data_ingestion'), routing_key='data_ingestion'),
        Queue('reporting', Exchange('reporting'), routing_key='reporting'),
    ),
    'task_routes': {
        'tasks.risk.*': {'queue': 'risk_calculation'},
        'tasks.ingestion.*': {'queue': 'data_ingestion'},
        'tasks.reporting.*': {'queue': 'reporting'},
        'tasks.high_priority.*': {'queue': 'high_priority'},
    },
    'beat_schedule': {
        'overnight-portfolio-run': {
            'task': 'tasks.risk.overnight_portfolio_run',
            'schedule': '0 2 * * *',
            'options': {'queue': 'risk_calculation'}
        },
        'cleanup-old-results': {
            'task': 'tasks.maintenance.cleanup_results',
            'schedule': 3600.0,
        },
    },
})
```

### 4.2 Task Definitions

```python
# Task Definitions
from celery_app import celery_app
from celery.exceptions import MaxRetriesExceededError
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60,
                 autoretry_for=(Exception,), retry_backoff=True,
                 retry_backoff_max=600, retry_jitter=True, queue='risk_calculation')
def calculate_portfolio_risk(self, portfolio_id: str, scenario: str,
                             time_horizon: int, tenant_id: str = None):
    try:
        logger.info(f"Starting portfolio risk calculation: {portfolio_id}")
        if tenant_id:
            set_tenant_context(tenant_id)
        
        assets = get_portfolio_assets(portfolio_id)
        job = group(
            calculate_asset_risk.s(str(asset.id), scenario, time_horizon, tenant_id)
            for asset in assets
        )
        result = job.apply_async()
        results = result.get(timeout=3600)
        
        portfolio_risk = aggregate_portfolio_risk(results)
        store_portfolio_risk_result(portfolio_id, scenario, time_horizon, portfolio_risk)
        
        return {
            'portfolio_id': portfolio_id, 'scenario': scenario,
            'time_horizon': time_horizon, 'assets_processed': len(assets),
            'portfolio_risk': portfolio_risk
        }
    except MaxRetriesExceededError:
        logger.error(f"Max retries exceeded for portfolio: {portfolio_id}")
        notify_failure(portfolio_id, scenario, time_horizon, "max_retries")
        raise
    except Exception as exc:
        logger.error(f"Error calculating portfolio risk: {exc}")
        raise self.retry(exc=exc, countdown=60)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue='risk_calculation')
def calculate_asset_risk(self, asset_id: str, scenario: str, time_horizon: int, tenant_id: str = None):
    try:
        if tenant_id:
            set_tenant_context(tenant_id)
        asset = get_asset(asset_id)
        hazards = ['flood', 'wildfire', 'hurricane', 'heat_stress']
        risk_scores = {}
        for hazard in hazards:
            risk_scores[hazard] = calculate_hazard_risk(
                asset=asset, hazard=hazard, scenario=scenario, time_horizon=time_horizon
            )
        store_asset_risk_scores(asset_id, scenario, time_horizon, risk_scores)
        return {'asset_id': asset_id, 'scenario': scenario, 
                'time_horizon': time_horizon, 'risk_scores': risk_scores}
    except Exception as exc:
        logger.error(f"Error calculating asset risk: {exc}")
        raise self.retry(exc=exc, countdown=30)

@celery_app.task(queue='high_priority')
def overnight_portfolio_run():
    logger.info("Starting overnight portfolio run")
    portfolios = get_active_portfolios()
    scenarios = ['rcp45', 'rcp85']
    time_horizons = [2030, 2050, 2100]
    
    tasks = []
    for portfolio in portfolios:
        for scenario in scenarios:
            for horizon in time_horizons:
                tasks.append(calculate_portfolio_risk.s(
                    portfolio_id=str(portfolio.id), scenario=scenario,
                    time_horizon=horizon, tenant_id=str(portfolio.tenant_id)
                ))
    
    callback = portfolio_run_complete.s()
    chord(group(tasks))(callback)
    logger.info(f"Queued {len(tasks)} portfolio calculations")

@celery_app.task(queue='default')
def portfolio_run_complete(results):
    logger.info(f"Overnight portfolio run completed. Processed {len(results)} portfolios")
    summary = generate_run_summary(results)
    send_notification(subject="Overnight Portfolio Run Complete", body=summary)
    return summary
```

### 4.3 Docker Compose for Celery

```yaml
# Docker Compose for Celery Workers
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru

  celery-worker-default:
    build:
      context: .
      dockerfile: Dockerfile.celery
    command: celery -A celery_app worker -Q default -n default@%h --concurrency=4
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=${DATABASE_URL}
      - MLFLOW_TRACKING_URI=${MLFLOW_TRACKING_URI}
    depends_on:
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 4G

  celery-worker-risk:
    build:
      context: .
      dockerfile: Dockerfile.celery
    command: celery -A celery_app worker -Q risk_calculation -n risk@%h --concurrency=2
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=${DATABASE_URL}
      - CUDA_VISIBLE_DEVICES=0
    runtime: nvidia
    depends_on:
      - redis
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '4'
          memory: 16G
          nvidia.com/gpu: 1

  celery-beat:
    build:
      context: .
      dockerfile: Dockerfile.celery
    command: celery -A celery_app beat -s /tmp/celerybeat-schedule
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    volumes:
      - celery_beat:/tmp

  flower:
    build:
      context: .
      dockerfile: Dockerfile.celery
    command: celery -A celery_app flower --port=5555
    environment:
      - REDIS_URL=redis://redis:6379/0
      - FLOWER_BASIC_AUTH=${FLOWER_AUTH}
    ports:
      - "5555:5555"
    depends_on:
      - redis
      - celery-worker-default

volumes:
  redis_data:
  celery_beat:
```

---

## 5. Real-Time Inference (FastAPI + Triton) (4x Detail)

### 5.1 FastAPI Service

```python
# FastAPI Application
import os
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import redis.asyncio as redis
from prometheus_client import make_asgi_app

class RiskRequest(BaseModel):
    asset_id: str = Field(..., description="UUID of the asset")
    scenario: str = Field(..., description="Climate scenario")
    time_horizon: int = Field(..., description="Time horizon in years")
    hazards: List[str] = Field(default=["flood", "wildfire", "hurricane", "heat_stress"])
    include_distribution: bool = Field(default=False)
    
    @validator('scenario')
    def validate_scenario(cls, v):
        allowed = ['rcp26', 'rcp45', 'rcp60', 'rcp85', 'ssp119', 'ssp245', 'ssp370', 'ssp585']
        if v not in allowed:
            raise ValueError(f"Scenario must be one of {allowed}")
        return v

class RiskResponse(BaseModel):
    asset_id: str
    scenario: str
    time_horizon: int
    calculated_at: datetime
    risk_scores: Dict[str, Any]
    processing_time_ms: float
    model_version: str
    cache_hit: bool

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.Redis.from_url(
        os.getenv('REDIS_URL', 'redis://localhost:6379/0'), decode_responses=True
    )
    app.state.startup_time = datetime.utcnow()
    yield
    await app.state.redis.close()

app = FastAPI(title="Climate Risk Inference API", version="1.0.0", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.mount('/metrics', make_asgi_app())

@app.get('/health')
async def health_check(request: Request):
    uptime = (datetime.utcnow() - request.app.state.startup_time).total_seconds()
    try:
        await request.app.state.redis.ping()
        redis_connected = True
    except:
        redis_connected = False
    return {"status": "healthy", "uptime_seconds": uptime, "redis_connected": redis_connected}

@app.post('/risk/calculate', response_model=RiskResponse)
async def calculate_risk(request: RiskRequest):
    start_time = datetime.utcnow()
    # Implementation would include cache check, inference, and response
    processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
    return RiskResponse(
        asset_id=request.asset_id, scenario=request.scenario,
        time_horizon=request.time_horizon, calculated_at=datetime.utcnow(),
        risk_scores={}, processing_time_ms=processing_time,
        model_version="1.0.0", cache_hit=False
    )
```

### 5.2 NVIDIA Triton Integration

```python
# Triton Inference Client
import numpy as np
from typing import Dict, Any
import tritonclient.grpc.aio as grpcclient
from tritonclient.utils import InferenceServerException

class TritonInferenceClient:
    def __init__(self, url: str = "localhost:8001"):
        self.url = url
        self.client = None
        self.model_versions = {}
        
    async def connect(self):
        self.client = grpcclient.InferenceServerClient(url=self.url)
    
    async def close(self):
        if self.client:
            self.client.close()
    
    async def is_connected(self) -> bool:
        if not self.client:
            return False
        try:
            return await self.client.is_server_ready()
        except:
            return False
    
    async def predict(self, model_name: str, inputs: Dict[str, Any], 
                      model_version: str = "") -> Dict[str, Any]:
        triton_inputs = []
        for name, data in inputs.items():
            if isinstance(data, np.ndarray):
                tensor = grpcclient.InferInput(name, data.shape, self._get_dtype(data))
                tensor.set_data_from_numpy(data)
                triton_inputs.append(tensor)
        
        response = await self.client.infer(
            model_name=model_name, inputs=triton_inputs, model_version=model_version
        )
        
        outputs = {}
        for output in response.get_response().outputs:
            outputs[output.name] = response.as_numpy(output.name)
        return outputs
    
    def _get_dtype(self, arr: np.ndarray) -> str:
        dtype_map = {np.float32: "FP32", np.float64: "FP64", 
                     np.int32: "INT32", np.int64: "INT64"}
        return dtype_map.get(arr.dtype.type, "FP32")
```

### 5.3 Triton Model Configuration

```protobuf
# Triton Model Configuration
name: "climate_risk_model"
platform: "onnxruntime_onnx"
max_batch_size: 64

input [
  { name: "asset_features" data_type: TYPE_FP32 dims: [128] },
  { name: "scenario_embedding" data_type: TYPE_FP32 dims: [16] },
  { name: "time_horizon" data_type: TYPE_INT32 dims: [1] reshape: { shape: [] } }
]

output [
  { name: "risk_scores" data_type: TYPE_FP32 dims: [8] },
  { name: "distribution_params" data_type: TYPE_FP32 dims: [20] },
  { name: "confidence" data_type: TYPE_FP32 dims: [1] reshape: { shape: [] } }
]

instance_group [{ count: 2 kind: KIND_GPU gpus: [0, 1] }]

dynamic_batching {
  preferred_batch_size: [8, 16, 32]
  max_queue_delay_microseconds: 10000
  preserve_ordering: false
  priority_levels: 3
  default_priority_level: 2
}

optimization {
  execution_accelerators {
    gpu_execution_accelerator: [
      { name: "tensorrt" 
        parameters { key: "precision_mode" value: "FP16" }
        parameters { key: "max_workspace_size_bytes" value: "2147483648" } }
    ]
  }
}

version_policy: { latest: { num_versions: 2 } }
```

---

## 6. Railway Microservices Deployment (4x Detail)

### 6.1 Service Decomposition

```yaml
# Railway Service Configuration
services:
  - name: api-gateway
    source: ./services/gateway
    build:
      builder: DOCKERFILE
      dockerfilePath: ./Dockerfile
    ports:
      - port: 8000
        httpSupport: true
    environment:
      - SERVICE_NAME=api-gateway
      - UPSTREAM_SERVICES=risk-service:8001,ingestion-service:8002
    resources:
      cpu: 1
      memory: 2Gi
    replicas: 2

  - name: risk-service
    source: ./services/risk
    build:
      builder: DOCKERFILE
      dockerfilePath: ./Dockerfile.cuda
    ports:
      - port: 8001
    environment:
      - SERVICE_NAME=risk-service
      - DATABASE_URL=${{Postgres.DATABASE_URL}}
      - REDIS_URL=${{Redis.REDIS_URL}}
      - TRITON_URL=triton-inference:8001
      - CUDA_VISIBLE_DEVICES=0
    resources:
      cpu: 4
      memory: 16Gi
      gpu: 1
    replicas: 2

  - name: triton-inference
    source: ./services/inference
    build:
      builder: DOCKERFILE
      dockerfilePath: ./Dockerfile.triton
    ports:
      - port: 8000
      - port: 8001
      - port: 8002
    environment:
      - CUDA_VISIBLE_DEVICES=0
    resources:
      cpu: 4
      memory: 16Gi
      gpu: 1
    volumes:
      - name: model-repository
        mountPath: /models

  - name: celery-worker
    source: ./services/workers
    build:
      builder: DOCKERFILE
      dockerfilePath: ./Dockerfile.celery
    environment:
      - REDIS_URL=${{Redis.REDIS_URL}}
      - DATABASE_URL=${{Postgres.DATABASE_URL}}
      - WORKER_QUEUES=default,risk_calculation,data_ingestion
    resources:
      cpu: 2
      memory: 8Gi
    replicas: 4
```

### 6.2 Dockerfile Specifications

```dockerfile
# Base Dockerfile
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libgeos-dev gdal-bin libgdal-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# CUDA-Enabled Dockerfile
FROM nvidia/cuda:11.8.0-cudnn8-devel-ubuntu22.04 as base

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda PATH=${CUDA_HOME}/bin:${PATH}

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3-pip build-essential libpq-dev libgeos-dev gdal-bin \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
RUN pip install --upgrade pip

WORKDIR /app

RUN pip install --no-cache-dir torch==2.0.1 torchvision torchaudio \
    --index-url https://download.pytorch.org/whl/cu118

RUN pip install --no-cache-dir torch-geometric pyg-lib torch-scatter \
    torch-sparse -f https://data.pyg.org/whl/torch-2.0.0+cu118.html

RUN pip install --no-cache-dir geopandas rasterio xgboost lightgbm scikit-learn

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Triton Inference Server Dockerfile
FROM nvcr.io/nvidia/tritonserver:23.07-py3
COPY model_repository /models
ENV MODEL_REPOSITORY=/models
EXPOSE 8000 8001 8002
CMD ["tritonserver", "--model-repository=/models", "--strict-model-config=false",
     "--http-port=8000", "--grpc-port=8001", "--metrics-port=8002"]
```

---

## 7. GitHub Actions CI/CD Workflows (4x Detail)

### 7.1 Main CI/CD Pipeline

```yaml
# Main CI/CD Workflow
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  PYTHON_VERSION: "3.11"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - run: |
          pip install black isort flake8 mypy
          black --check --diff .
          isort --check-only --diff .
          flake8 . --max-line-length=100
          mypy src/ --ignore-missing-imports

  validate:
    name: Math & Data Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - run: pip install -r requirements.txt
      - run: python scripts/validate_math.py
      - run: python scripts/validate_distributions.py
      - run: python scripts/validate_data.py

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: [lint, validate]
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      - run: pip install -r requirements.txt && pip install pytest pytest-cov
      - run: pytest tests/ --cov=src --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379/0
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build:
    name: Build & Push Images
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        service: [api-gateway, risk-service, celery-worker]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
      - uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    environment:
      name: staging
      url: https://staging.climate-risk.io
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @railway/cli
      - run: |
          railway link --project ${{ secrets.RAILWAY_PROJECT_ID }} --environment staging
          railway up --service api-gateway
          railway up --service risk-service
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    environment:
      name: production
      url: https://climate-risk.io
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @railway/cli
      - run: |
          railway link --project ${{ secrets.RAILWAY_PROJECT_ID }} --environment production
          railway up --service api-gateway
          railway up --service risk-service
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
```

---

## 8. Monitoring and Observability (4x Detail)

### 8.1 Prometheus Configuration

```yaml
# Prometheus Configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'fastapi'
    static_configs:
      - targets: ['api-gateway:8000', 'risk-service:8001']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'celery'
    static_configs:
      - targets: ['flower:5555']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'triton'
    static_configs:
      - targets: ['triton-inference:8002']
    metrics_path: /metrics
```

### 8.2 Prometheus Alert Rules

```yaml
# Prometheus Alert Rules
groups:
  - name: climate-risk-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"

      - alert: CeleryQueueBacklog
        expr: celery_queue_length > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Celery queue backlog detected"
```

### 8.3 Alertmanager Configuration

```yaml
# Alertmanager Configuration
global:
  slack_api_url: '${SLACK_WEBHOOK_URL}'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'default'
    email_configs:
      - to: 'oncall@climate-risk.io'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: critical

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warnings'
        title: 'Climate Risk Warning'
        send_resolved: true
```

---

## Appendix A: Environment Variables Reference

```bash
# Environment Variables Template
DATABASE_URL=postgresql://user:pass@localhost:5432/climate_risk
REDIS_URL=redis://localhost:6379/0
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_S3_BUCKET=climate-risk-ml
WANDB_API_KEY=your-wandb-api-key
TRITON_URL=localhost:8001
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
RAILWAY_TOKEN=your-railway-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PAGERDUTY_SERVICE_KEY=your-pagerduty-key
```

---

## Appendix B: Performance Benchmarks

| Component | Target Metric | SLA |
|-----------|---------------|-----|
| API Response Time (p95) | < 200ms | 99.9% |
| API Response Time (p99) | < 500ms | 99.9% |
| Batch Processing | 100K assets/hour | 99% |
| Database Query (spatial) | < 100ms | 99.9% |
| Model Inference | < 50ms | 99.9% |
| Cache Hit Rate | > 80% | - |
| System Availability | > 99.9% | - |

---

## Generated Files

- `/mnt/okcomputer/output/task8_infrastructure.md` - This comprehensive specification document

---

*Document Version: 1.0.0*
*Author: Agent 7 - Lead Data & MLOps Engineer*
