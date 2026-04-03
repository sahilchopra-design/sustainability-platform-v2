"""add retirement protocol tables (credits, batches, retirements, beneficiaries, registries, transfers, audit)

Revision ID: 100
Revises: 099
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision = '100'
down_revision = '099'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('cc_credits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)), sa.Column('batch_id', postgresql.UUID(as_uuid=True)),
        sa.Column('serial_start', sa.String(50)), sa.Column('serial_end', sa.String(50)),
        sa.Column('vintage_year', sa.Integer()), sa.Column('quantity_tco2e', sa.Numeric(16,4)),
        sa.Column('credit_type', sa.String(20)), sa.Column('methodology_id', postgresql.UUID(as_uuid=True)),
        sa.Column('registry_id', postgresql.UUID(as_uuid=True)),
        sa.Column('status', sa.String(20)), sa.Column('co_benefits', JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_cred_proj', 'cc_credits', ['project_id'])
    op.create_index('idx_cc_cred_status', 'cc_credits', ['status'])
    op.create_index('idx_cc_cred_vintage', 'cc_credits', ['vintage_year'])

    op.create_table('cc_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True)), sa.Column('batch_ref', sa.String(30)),
        sa.Column('serial_start', sa.String(50)), sa.Column('serial_end', sa.String(50)),
        sa.Column('issuance_date', sa.Date()), sa.Column('verification_body', sa.String(100)),
        sa.Column('verification_date', sa.Date()), sa.Column('total_quantity', sa.Numeric(16,4)),
        sa.Column('available_quantity', sa.Numeric(16,4)), sa.Column('registry_id', postgresql.UUID(as_uuid=True)),
        sa.Column('metadata', JSONB),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_batch_proj', 'cc_batches', ['project_id'])

    op.create_table('cc_beneficiaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('org_name', sa.String(200)), sa.Column('contact_name', sa.String(100)),
        sa.Column('contact_email', sa.String(150)), sa.Column('jurisdiction', sa.String(100)),
        sa.Column('beneficiary_type', sa.String(30)), sa.Column('preferred_registry', sa.String(30)),
        sa.Column('is_public', sa.Boolean(), server_default='true'),
        sa.Column('total_credits_retired', sa.Numeric(16,4), server_default='0'),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))

    op.create_table('cc_registries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('registry_code', sa.String(20)), sa.Column('name', sa.String(100)),
        sa.Column('api_endpoint', sa.String(300)), sa.Column('auth_type', sa.String(30)),
        sa.Column('fee_structure', JSONB), sa.Column('supported_methodologies', JSONB),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))

    op.create_table('cc_retirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('credit_id', postgresql.UUID(as_uuid=True)), sa.Column('beneficiary_id', postgresql.UUID(as_uuid=True)),
        sa.Column('registry_id', postgresql.UUID(as_uuid=True)),
        sa.Column('quantity_tco2e', sa.Numeric(16,4)), sa.Column('retirement_purpose', sa.String(50)),
        sa.Column('retirement_type', sa.String(30)), sa.Column('retirement_date', sa.Date()),
        sa.Column('registry_confirmation_id', sa.String(100)),
        sa.Column('compliance_obligation', sa.String(100)), sa.Column('certificate_url', sa.String(500)),
        sa.Column('status', sa.String(20)), sa.Column('notes', sa.Text()),
        sa.Column('org_id', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_retire_credit', 'cc_retirements', ['credit_id'])
    op.create_index('idx_cc_retire_benef', 'cc_retirements', ['beneficiary_id'])
    op.create_index('idx_cc_retire_status', 'cc_retirements', ['status'])

    op.create_table('cc_transfers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('credit_id', postgresql.UUID(as_uuid=True)),
        sa.Column('from_account', sa.String(100)), sa.Column('to_account', sa.String(100)),
        sa.Column('quantity_tco2e', sa.Numeric(16,4)), sa.Column('transfer_date', sa.Date()),
        sa.Column('authorization_ref', sa.String(100)), sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_xfer_credit', 'cc_transfers', ['credit_id'])

    op.create_table('cc_audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('entity_type', sa.String(30)), sa.Column('entity_id', postgresql.UUID(as_uuid=True)),
        sa.Column('action', sa.String(30)), sa.Column('before_state', JSONB), sa.Column('after_state', JSONB),
        sa.Column('performed_by', sa.String(100)),
        sa.Column('performed_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'))
    op.create_index('idx_cc_audit_entity', 'cc_audit_log', ['entity_type', 'entity_id'])
    op.create_index('idx_cc_audit_action', 'cc_audit_log', ['action'])

def downgrade() -> None:
    op.drop_index('idx_cc_audit_action', table_name='cc_audit_log'); op.drop_index('idx_cc_audit_entity', table_name='cc_audit_log'); op.drop_table('cc_audit_log')
    op.drop_index('idx_cc_xfer_credit', table_name='cc_transfers'); op.drop_table('cc_transfers')
    op.drop_index('idx_cc_retire_status', table_name='cc_retirements'); op.drop_index('idx_cc_retire_benef', table_name='cc_retirements'); op.drop_index('idx_cc_retire_credit', table_name='cc_retirements'); op.drop_table('cc_retirements')
    op.drop_table('cc_registries'); op.drop_table('cc_beneficiaries')
    op.drop_index('idx_cc_batch_proj', table_name='cc_batches'); op.drop_table('cc_batches')
    op.drop_index('idx_cc_cred_vintage', table_name='cc_credits'); op.drop_index('idx_cc_cred_status', table_name='cc_credits'); op.drop_index('idx_cc_cred_proj', table_name='cc_credits'); op.drop_table('cc_credits')
