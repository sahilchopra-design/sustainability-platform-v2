"""add sprint dn supply chain tables

Revision ID: dn001
Revises: dm001
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'dn001'
down_revision = 'dm001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('ep_dn1_supply_chain_emissions', sa.Column('id', sa.Integer(), nullable=False), sa.Column('supplier', sa.String(), nullable=True), sa.Column('tier', sa.Integer(), nullable=True), sa.Column('scope3_emissions', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dn2_procurement_climate_risk', sa.Column('id', sa.Integer(), nullable=False), sa.Column('category', sa.String(), nullable=True), sa.Column('physical_risk', sa.Float(), nullable=True), sa.Column('transition_risk', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dn3_supplier_esg_scorecard', sa.Column('id', sa.Integer(), nullable=False), sa.Column('supplier', sa.String(), nullable=True), sa.Column('esg_score', sa.Float(), nullable=True), sa.Column('sector', sa.String(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dn4_scope3_category_analytics', sa.Column('id', sa.Integer(), nullable=False), sa.Column('category', sa.String(), nullable=True), sa.Column('emissions_mtco2e', sa.Float(), nullable=True), sa.Column('data_quality', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dn5_climate_trade_flow', sa.Column('id', sa.Integer(), nullable=False), sa.Column('corridor', sa.String(), nullable=True), sa.Column('cbam_exposure', sa.Float(), nullable=True), sa.Column('carbon_cost', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dn6_green_procurement', sa.Column('id', sa.Integer(), nullable=False), sa.Column('programme', sa.String(), nullable=True), sa.Column('green_spend_pct', sa.Float(), nullable=True), sa.Column('standard', sa.String(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))

def downgrade():
    op.drop_table('ep_dn6_green_procurement')
    op.drop_table('ep_dn5_climate_trade_flow')
    op.drop_table('ep_dn4_scope3_category_analytics')
    op.drop_table('ep_dn3_supplier_esg_scorecard')
    op.drop_table('ep_dn2_procurement_climate_risk')
    op.drop_table('ep_dn1_supply_chain_emissions')
