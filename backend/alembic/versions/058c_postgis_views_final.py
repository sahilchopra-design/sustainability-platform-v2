"""PostGIS diagnostic views (chain-repair stub)

Revision ID: 058c
Revises: 057_add_eiopa_sfdr_assurance_tables
Create Date: 2026-03-17

NOTE: This file was reconstructed to repair the Alembic revision chain.
The original 058c_postgis_views_final migration was applied to the database
but the file was never committed to git.

Creates:
  vw_postgis_status   — diagnostic view over pg_extension / pg_namespace
                        exposing PostGIS extension name, version, and schema.
                        Referenced by GET /api/v1/spatial/ref/status.
"""
from __future__ import annotations

from alembic import op

# revision identifiers
revision = "058c"
down_revision = "057_add_eiopa_sfdr_assurance_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # vw_postgis_status — PostGIS extension diagnostic view
    # Used by spatial.py → ref_postgis_status() endpoint
    op.execute("""
        CREATE OR REPLACE VIEW vw_postgis_status AS
        SELECT
            e.extname    AS extension,
            e.extversion AS version,
            n.nspname    AS schema
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname IN (
            'postgis',
            'postgis_topology',
            'fuzzystrmatch',
            'postgis_tiger_geocoder',
            'address_standardizer'
        );
    """)

    # vw_spatial_tables — convenience view listing all tables with geometry/geography cols
    op.execute("""
        CREATE OR REPLACE VIEW vw_spatial_tables AS
        SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            c.udt_name          AS geometry_type,
            obj_description(
                (c.table_schema || '.' || c.table_name)::regclass::oid,
                'pg_class'
            )                   AS table_comment
        FROM information_schema.columns c
        WHERE c.udt_name IN ('geometry', 'geography')
          AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY c.table_schema, c.table_name, c.column_name;
    """)

    # vw_spatial_indexes — GIST index inventory (used by ref/spatial-indexes endpoint)
    op.execute("""
        CREATE OR REPLACE VIEW vw_spatial_indexes AS
        SELECT
            n.nspname       AS schema,
            t.relname       AS table_name,
            i.relname       AS index_name,
            a.attname       AS column_name,
            am.amname       AS index_type
        FROM pg_index ix
        JOIN pg_class     t  ON t.oid  = ix.indrelid
        JOIN pg_class     i  ON i.oid  = ix.indexrelid
        JOIN pg_namespace n  ON n.oid  = t.relnamespace
        JOIN pg_am        am ON am.oid = i.relam
        JOIN pg_attribute  a ON a.attrelid = t.oid
            AND a.attnum = ANY(ix.indkey)
        WHERE am.amname = 'gist'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY n.nspname, t.relname, i.relname;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_spatial_indexes;")
    op.execute("DROP VIEW IF EXISTS vw_spatial_tables;")
    op.execute("DROP VIEW IF EXISTS vw_postgis_status;")
