"""add sprint do renewable energy tables

Revision ID: do001
Revises: dn001
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'do001'
down_revision = 'dn001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('ep_do1_solar_projects', sa.Column('id', sa.Integer(), nullable=False), sa.Column('project', sa.String(), nullable=True), sa.Column('capacity_mw', sa.Float(), nullable=True), sa.Column('irr', sa.Float(), nullable=True), sa.Column('lcoe', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_do2_wind_projects', sa.Column('id', sa.Integer(), nullable=False), sa.Column('project', sa.String(), nullable=True), sa.Column('type', sa.String(), nullable=True), sa.Column('capacity_factor', sa.Float(), nullable=True), sa.Column('cfd_strike', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_do3_project_pipeline', sa.Column('id', sa.Integer(), nullable=False), sa.Column('project', sa.String(), nullable=True), sa.Column('technology', sa.String(), nullable=True), sa.Column('stage', sa.String(), nullable=True), sa.Column('capacity_mw', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_do4_energy_lending', sa.Column('id', sa.Integer(), nullable=False), sa.Column('lender', sa.String(), nullable=True), sa.Column('asset_class', sa.String(), nullable=True), sa.Column('commitment_bn', sa.Float(), nullable=True), sa.Column('avg_tenor', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_do5_ppa_contracts', sa.Column('id', sa.Integer(), nullable=False), sa.Column('contract', sa.String(), nullable=True), sa.Column('structure', sa.String(), nullable=True), sa.Column('price_floor', sa.Float(), nullable=True), sa.Column('term_years', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_do6_renewable_assets', sa.Column('id', sa.Integer(), nullable=False), sa.Column('asset', sa.String(), nullable=True), sa.Column('technology', sa.String(), nullable=True), sa.Column('p50_gwh', sa.Float(), nullable=True), sa.Column('degradation_pct', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))

def downgrade():
    op.drop_table('ep_do6_renewable_assets')
    op.drop_table('ep_do5_ppa_contracts')
    op.drop_table('ep_do4_energy_lending')
    op.drop_table('ep_do3_project_pipeline')
    op.drop_table('ep_do2_wind_projects')
    op.drop_table('ep_do1_solar_projects')
