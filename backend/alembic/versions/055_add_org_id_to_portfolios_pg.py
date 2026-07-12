"""Add org_id to portfolios_pg for multi-tenant isolation.

Revision ID: 055
Revises: 054
Create Date: 2026-03-16

Rationale (P0-2):
  Migration 025 created the organisations table and added org_id to users_pg,
  but portfolios_pg (the live portfolio table used by all analytics routes)
  never received an org_id FK.  This migration adds the column so that portfolio
  queries can be scoped per organisation.

  The column is nullable so existing rows are preserved unchanged; a NULL
  org_id means the portfolio is shared / unscoped (legacy rows).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "055"
down_revision = "054"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotent: migration 025 already adds portfolios_pg.org_id behind an
    # IF NOT EXISTS guard, so a fresh replay of the chain reaches this point
    # with the column present. Guard every add the same way.
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'portfolios_pg' AND column_name = 'org_id'
            ) THEN
                ALTER TABLE portfolios_pg ADD COLUMN org_id UUID
                    REFERENCES organisations(id) ON DELETE SET NULL;
            END IF;
        END
        $$;
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_portfolios_pg_org_id ON portfolios_pg (org_id);")

    # Add org_id to assets_pg for asset-level isolation (optional, follows portfolio)
    op.execute("ALTER TABLE assets_pg ADD COLUMN IF NOT EXISTS org_id UUID;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_assets_pg_org_id ON assets_pg (org_id);")

    # Add org_id to analysis_runs_pg for report isolation
    op.execute("ALTER TABLE analysis_runs_pg ADD COLUMN IF NOT EXISTS org_id UUID;")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analysis_runs_pg_org_id ON analysis_runs_pg (org_id);")


def downgrade() -> None:
    op.drop_column("analysis_runs_pg", "org_id")
    op.drop_column("assets_pg", "org_id")
    op.drop_column("portfolios_pg", "org_id")
