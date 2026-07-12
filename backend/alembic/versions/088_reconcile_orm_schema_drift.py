"""088 — Reconcile ORM ↔ migration schema drift.

The SQLAlchemy models in db/models/ carry 50 columns that no alembic
migration ever created (the production database was patched by hand instead).
A fresh replay of the chain therefore produced tables the application code
cannot query (e.g. POST /api/v1/cbam/seed returned 500 on
cbam_certificate_price.eu_ets_price_eur). This migration adds every drifted
column idempotently — a no-op on databases already patched.

Generated from a live model-vs-database diff during E2E integration testing.
"""
from alembic import op

revision = "088_reconcile_orm_schema_drift"
down_revision = "087"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id text;")
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS request_id text;")
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS module varchar(100);")
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS record_id text;")
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS status varchar(20);")
    op.execute("ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS error_message text;")
    op.execute("ALTER TABLE cbam_certificate_price ADD COLUMN IF NOT EXISTS eu_ets_price_eur double precision;")
    op.execute("ALTER TABLE cbam_certificate_price ADD COLUMN IF NOT EXISTS scenario_name varchar(100);")
    op.execute("ALTER TABLE cbam_compliance_report ADD COLUMN IF NOT EXISTS total_imports_tonnes double precision;")
    op.execute("ALTER TABLE cbam_compliance_report ADD COLUMN IF NOT EXISTS supplier_count integer;")
    op.execute("ALTER TABLE cbam_compliance_report ADD COLUMN IF NOT EXISTS product_count integer;")
    op.execute("ALTER TABLE cbam_compliance_report ADD COLUMN IF NOT EXISTS details json;")
    op.execute("ALTER TABLE cbam_compliance_report ADD COLUMN IF NOT EXISTS created_at timestamptz;")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS supplier_id text;")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS product_category_id text;")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS projection_year integer;")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS scenario_name varchar(100);")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS domestic_carbon_credit_eur double precision;")
    op.execute("ALTER TABLE cbam_cost_projection ADD COLUMN IF NOT EXISTS cost_as_pct_revenue double precision;")
    op.execute("ALTER TABLE cbam_embedded_emissions ADD COLUMN IF NOT EXISTS direct_emissions double precision;")
    op.execute("ALTER TABLE cbam_embedded_emissions ADD COLUMN IF NOT EXISTS indirect_emissions double precision;")
    op.execute("ALTER TABLE cbam_embedded_emissions ADD COLUMN IF NOT EXISTS specific_direct double precision;")
    op.execute("ALTER TABLE cbam_embedded_emissions ADD COLUMN IF NOT EXISTS specific_indirect double precision;")
    op.execute("ALTER TABLE cbam_embedded_emissions ADD COLUMN IF NOT EXISTS specific_total double precision;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS rationale text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS key_endpoints text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS auth_method text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS auth_detail text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS auth_signup_url text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS sample_request text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS sdk_library text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS docs_url text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS integration_notes text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS response_format text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS credentials json;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS cost text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS rate_limit text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS rate_limit_detail text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS data_format text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS update_freq text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS geographic text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS quality_rating text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS batch integer;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS utility text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS assessment_score double precision;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS skip_assessment boolean;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS last_sync_error text;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS est_rows_month integer;")
    op.execute("ALTER TABLE dh_data_sources ADD COLUMN IF NOT EXISTS est_gb_month double precision;")
    # Type drift: model declares price_date as String(10) ("YYYY-MM-DD or
    # "YYYY"), migration 001 created it as DATE — year-only seeds fail with
    # InvalidDatetimeFormat. Convert to varchar(10), preserving existing data.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'cbam_certificate_price'
                  AND column_name = 'price_date' AND data_type = 'date'
            ) THEN
                ALTER TABLE cbam_certificate_price
                    ALTER COLUMN price_date TYPE varchar(10)
                    USING to_char(price_date, 'YYYY-MM-DD');
            END IF;
        END
        $$;
    """)

    # Backfill the renamed EU ETS price column from the legacy migration-001
    # column where the legacy column exists and the new one is empty.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'cbam_certificate_price'
                  AND column_name = 'eu_ets_auction_price_eur'
            ) THEN
                UPDATE cbam_certificate_price
                SET eu_ets_price_eur = eu_ets_auction_price_eur
                WHERE eu_ets_price_eur IS NULL;
            END IF;
        END
        $$;
    """)


    # Migration 002 created fossil_fuel_reserve with quoted mixed-case columns
    # ("proven_reserves_mmBOE" etc.). The stranded-assets service queries them
    # unquoted, which Postgres folds to lowercase — so every dashboard/reserves
    # endpoint 500s on a freshly migrated database. Fold the columns to
    # lowercase (no-op where already lowercase).
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'proven_reserves_mmBOE') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "proven_reserves_mmBOE" TO proven_reserves_mmboe;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'probable_reserves_mmBOE') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "probable_reserves_mmBOE" TO probable_reserves_mmboe;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'possible_reserves_mmBOE') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "possible_reserves_mmBOE" TO possible_reserves_mmboe;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'breakeven_price_USD') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "breakeven_price_USD" TO breakeven_price_usd;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'lifting_cost_USD') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "lifting_cost_USD" TO lifting_cost_usd;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'remaining_capex_USD') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "remaining_capex_USD" TO remaining_capex_usd;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'fossil_fuel_reserve' AND column_name = 'carbon_intensity_kgCO2_per_unit') THEN
                ALTER TABLE fossil_fuel_reserve RENAME COLUMN "carbon_intensity_kgCO2_per_unit" TO carbon_intensity_kgco2_per_unit;
            END IF;
        END $$;
    """)
    # The service also reads/writes fossil_fuel_reserve.user_id, which no
    # migration ever created.
    op.execute("ALTER TABLE fossil_fuel_reserve ADD COLUMN IF NOT EXISTS user_id text;")


def downgrade() -> None:
    # Additive reconciliation — no destructive downgrade.
    pass
