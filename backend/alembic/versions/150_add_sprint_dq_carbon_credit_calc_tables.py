"""add sprint dq carbon credit calculation tables

Revision ID: dq001
Revises: dp001
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'dq001'
down_revision = 'dp001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ep_dq1_cdm_projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_code', sa.String(), nullable=True),
        sa.Column('methodology', sa.String(), nullable=True),
        sa.Column('annual_er_tco2e', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'ep_dq2_additionality_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('tool_applied', sa.String(), nullable=True),
        sa.Column('result', sa.String(), nullable=True),
        sa.Column('irr', sa.Float(), nullable=True),
        sa.Column('wacc', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'ep_dq3_uncertainty_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('combined_uncertainty_pct', sa.Float(), nullable=True),
        sa.Column('p5_credits', sa.Float(), nullable=True),
        sa.Column('p50_credits', sa.Float(), nullable=True),
        sa.Column('p95_credits', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'ep_dq4_project_lifecycle',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_code', sa.String(), nullable=True),
        sa.Column('stage', sa.String(), nullable=True),
        sa.Column('registry', sa.String(), nullable=True),
        sa.Column('credits_issued', sa.Float(), nullable=True),
        sa.Column('next_milestone', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'ep_dq5_compliance_matrix',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('cdm_status', sa.String(), nullable=True),
        sa.Column('gs_status', sa.String(), nullable=True),
        sa.Column('vcs_status', sa.String(), nullable=True),
        sa.Column('car_status', sa.String(), nullable=True),
        sa.Column('acr_status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table(
        'ep_dq6_audit_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('user_name', sa.String(), nullable=True),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('ep_dq6_audit_events')
    op.drop_table('ep_dq5_compliance_matrix')
    op.drop_table('ep_dq4_project_lifecycle')
    op.drop_table('ep_dq3_uncertainty_results')
    op.drop_table('ep_dq2_additionality_assessments')
    op.drop_table('ep_dq1_cdm_projects')
