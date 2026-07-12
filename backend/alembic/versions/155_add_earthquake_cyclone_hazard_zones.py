"""Add ref_earthquake_zones and ref_cyclone_zones — new physical hazard layers
for the global physical-risk digital-twin engine.

Revision ID: 155
Revises: modnav01
Create Date: 2026-07-05

Matches the exact column convention of the existing ref_flood_zones /
ref_wildfire_zones / ref_sea_level_zones tables (verified live against the
database, since these predate any tracked migration): zone_id, risk_level,
country_iso3, zone_boundary GEOMETRY(4326), a hazard-specific numeric field,
data_source, created_at. Populated by backend/ingestion/*_grid_ingester.py
jobs from real USGS (earthquake) and NOAA IBTrACS/HURDAT2 (cyclone) data —
see docs/PHYSICAL_CLIMATE_RISK_SOURCES.md.
"""
from alembic import op
import sqlalchemy as sa

revision = "155"
down_revision = "modnav01"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS ref_earthquake_zones (
            id BIGSERIAL PRIMARY KEY,
            zone_id TEXT NOT NULL,
            risk_level TEXT,
            country_iso3 TEXT,
            zone_boundary GEOMETRY(POLYGON, 4326) NOT NULL,
            max_magnitude_50yr NUMERIC,
            event_count_50yr INTEGER,
            data_source TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_ref_earthquake_zones_boundary
            ON ref_earthquake_zones USING GIST(zone_boundary);
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS ref_cyclone_zones (
            id BIGSERIAL PRIMARY KEY,
            zone_id TEXT NOT NULL,
            risk_level TEXT,
            basin TEXT,
            country_iso3 TEXT,
            zone_boundary GEOMETRY(POLYGON, 4326) NOT NULL,
            max_wind_speed_kt NUMERIC,
            track_density_50yr INTEGER,
            data_source TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_ref_cyclone_zones_boundary
            ON ref_cyclone_zones USING GIST(zone_boundary);
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS ref_cyclone_zones;")
    op.execute("DROP TABLE IF EXISTS ref_earthquake_zones;")
