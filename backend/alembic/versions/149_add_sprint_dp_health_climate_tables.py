"""add sprint dp health climate tables

Revision ID: dp001
Revises: do001
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'dp001'
down_revision = 'do001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('ep_dp1_heat_stress', sa.Column('id', sa.Integer(), nullable=False), sa.Column('city', sa.String(), nullable=True), sa.Column('wbgt_index', sa.Float(), nullable=True), sa.Column('productivity_loss_pct', sa.Float(), nullable=True), sa.Column('adaptation_cost_bn', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dp2_climate_health_risk', sa.Column('id', sa.Integer(), nullable=False), sa.Column('country', sa.String(), nullable=True), sa.Column('mortality_per_100k', sa.Float(), nullable=True), sa.Column('disease_burden_daly', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dp3_air_quality', sa.Column('id', sa.Integer(), nullable=False), sa.Column('region', sa.String(), nullable=True), sa.Column('pm25_ug_m3', sa.Float(), nullable=True), sa.Column('health_cost_bn', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dp4_pandemic_climate', sa.Column('id', sa.Integer(), nullable=False), sa.Column('pathogen', sa.String(), nullable=True), sa.Column('climate_amplification', sa.Float(), nullable=True), sa.Column('economic_loss_bn', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dp5_mental_health_climate', sa.Column('id', sa.Integer(), nullable=False), sa.Column('population', sa.String(), nullable=True), sa.Column('eco_anxiety_index', sa.Float(), nullable=True), sa.Column('insurance_gap_pct', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))
    op.create_table('ep_dp6_wellbeing_returns', sa.Column('id', sa.Integer(), nullable=False), sa.Column('investment', sa.String(), nullable=True), sa.Column('asset_class', sa.String(), nullable=True), sa.Column('wellby_score', sa.Float(), nullable=True), sa.Column('social_roi', sa.Float(), nullable=True), sa.Column('created_at', sa.DateTime(), nullable=True), sa.PrimaryKeyConstraint('id'))

def downgrade():
    op.drop_table('ep_dp6_wellbeing_returns')
    op.drop_table('ep_dp5_mental_health_climate')
    op.drop_table('ep_dp4_pandemic_climate')
    op.drop_table('ep_dp3_air_quality')
    op.drop_table('ep_dp2_climate_health_risk')
    op.drop_table('ep_dp1_heat_stress')
