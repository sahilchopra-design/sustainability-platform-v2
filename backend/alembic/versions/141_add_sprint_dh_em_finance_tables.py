"""add sprint dh em finance tables

Revision ID: 141
Revises: 140
Create Date: 2026-04-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '141'
down_revision = '140'
branch_labels = None
depends_on = None


def upgrade():
    # EP-DH1: EM Sovereign Climate Debt
    op.create_table(
        'ep_dh1_em_sovereigns',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('region', sa.String(80)),
        sa.Column('gdp_bn', sa.Numeric(12, 2)),
        sa.Column('debt_gdp_pct', sa.Numeric(6, 2)),
        sa.Column('green_bond_issuance_bn', sa.Numeric(10, 3)),
        sa.Column('climate_vulnerability_index', sa.Integer()),
        sa.Column('adaptation_finance_gap_bn', sa.Numeric(10, 3)),
        sa.Column('debt_restructuring_risk', sa.Numeric(4, 2)),
        sa.Column('ndc_ambition', sa.Numeric(4, 2)),
        sa.Column('climate_oda_received_bn', sa.Numeric(10, 3)),
        sa.Column('sovereign_credit_rating', sa.String(20)),
        sa.Column('default_probability_pct', sa.Numeric(6, 2)),
        sa.Column('debt_for_nature_swap_eligible', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DH2: MDB Climate Finance Entities
    op.create_table(
        'ep_dh2_mdb_entities',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('entity_type', sa.String(20)),  # 'MDB' or 'Borrower'
        sa.Column('region', sa.String(80)),
        sa.Column('sector_focus', sa.String(80)),
        # MDB-specific fields
        sa.Column('climate_finance_committed_bn', sa.Numeric(10, 2)),
        sa.Column('mitigation_share_pct', sa.Integer()),
        sa.Column('adaptation_share_pct', sa.Integer()),
        sa.Column('private_capital_mobilized_bn', sa.Numeric(10, 2)),
        sa.Column('capital_adequacy_pct', sa.Numeric(6, 2)),
        # Borrower-specific fields
        sa.Column('mdb_lending_bn', sa.Numeric(10, 3)),
        sa.Column('project_count', sa.Integer()),
        sa.Column('grant_share_pct', sa.Integer()),
        sa.Column('concessionality', sa.Numeric(4, 2)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DH3: JETP Countries
    op.create_table(
        'ep_dh3_jetp_countries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('region', sa.String(80)),
        sa.Column('coal_capacity_gw', sa.Numeric(8, 2)),
        sa.Column('retirement_target_gw', sa.Numeric(8, 2)),
        sa.Column('renewable_target_gw', sa.Numeric(8, 2)),
        sa.Column('pledged_finance_bn', sa.Numeric(10, 2)),
        sa.Column('disbursed_finance_bn', sa.Numeric(10, 2)),
        sa.Column('just_transition_workers_m', sa.Numeric(8, 3)),
        sa.Column('ip_recommendations_count', sa.Integer()),
        sa.Column('implementation_score', sa.Integer()),
        sa.Column('coal_jobs_at_risk_k', sa.Integer()),
        sa.Column('renewable_jobs_created_k', sa.Integer()),
        sa.Column('energy_poverty_risk', sa.Numeric(4, 2)),
        sa.Column('implementation_status', sa.String(20)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DH4: Climate Blended Finance Transactions
    op.create_table(
        'ep_dh4_blended_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('structure_type', sa.String(40)),
        sa.Column('region', sa.String(80)),
        sa.Column('country', sa.String(80)),
        sa.Column('sector', sa.String(60)),
        sa.Column('total_size_m', sa.Numeric(12, 2)),
        sa.Column('public_finance_m', sa.Numeric(12, 2)),
        sa.Column('private_finance_m', sa.Numeric(12, 2)),
        sa.Column('leverage_ratio', sa.Numeric(6, 3)),
        sa.Column('irr_pct', sa.Numeric(6, 2)),
        sa.Column('sdg_impact_score', sa.Numeric(4, 2)),
        sa.Column('climate_impact_mtco2', sa.Numeric(10, 3)),
        sa.Column('gender_lens', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DH5: Loss & Damage Countries (V20 + LDCs)
    op.create_table(
        'ep_dh5_ld_countries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('region', sa.String(80)),
        sa.Column('losses_economic_bn', sa.Numeric(10, 3)),
        sa.Column('losses_non_economic', sa.Numeric(4, 2)),
        sa.Column('climate_attributed_losses_pct', sa.Integer()),
        sa.Column('gcf_access', sa.Boolean(), server_default='false'),
        sa.Column('ld_fund_eligible', sa.Boolean(), server_default='false'),
        sa.Column('adaptation_deficit_bn', sa.Numeric(10, 3)),
        sa.Column('displaced_persons_m', sa.Numeric(8, 3)),
        sa.Column('extreme_event_frequency', sa.Numeric(6, 2)),
        sa.Column('gdp_loss_climate_pct', sa.Numeric(6, 2)),
        sa.Column('insurance_coverage_pct', sa.Numeric(6, 2)),
        sa.Column('human_development_index', sa.Numeric(5, 3)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # EP-DH6: Sovereign Green Bond Issuances
    op.create_table(
        'ep_dh6_sovereign_bonds',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('region', sa.String(80)),
        sa.Column('issuance_year', sa.Integer()),
        sa.Column('size_bn', sa.Numeric(10, 3)),
        sa.Column('currency', sa.String(10)),
        sa.Column('tenor_years', sa.Integer()),
        sa.Column('greenium_bps', sa.Numeric(6, 2)),
        sa.Column('use_of_proceeds', sa.String(80)),
        sa.Column('verifier', sa.String(40)),
        sa.Column('oversubscription', sa.Numeric(6, 2)),
        sa.Column('second_party_opinion', sa.Boolean(), server_default='false'),
        sa.Column('paris_aligned', sa.Boolean(), server_default='false'),
        sa.Column('post_issuance_report', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Indexes for common query patterns
    op.create_index('ix_dh1_region', 'ep_dh1_em_sovereigns', ['region'])
    op.create_index('ix_dh1_rating', 'ep_dh1_em_sovereigns', ['sovereign_credit_rating'])
    op.create_index('ix_dh2_type', 'ep_dh2_mdb_entities', ['entity_type'])
    op.create_index('ix_dh2_region', 'ep_dh2_mdb_entities', ['region'])
    op.create_index('ix_dh3_status', 'ep_dh3_jetp_countries', ['implementation_status'])
    op.create_index('ix_dh4_type', 'ep_dh4_blended_transactions', ['structure_type'])
    op.create_index('ix_dh4_sector', 'ep_dh4_blended_transactions', ['sector'])
    op.create_index('ix_dh5_region', 'ep_dh5_ld_countries', ['region'])
    op.create_index('ix_dh5_ld_eligible', 'ep_dh5_ld_countries', ['ld_fund_eligible'])
    op.create_index('ix_dh6_year', 'ep_dh6_sovereign_bonds', ['issuance_year'])
    op.create_index('ix_dh6_proceeds', 'ep_dh6_sovereign_bonds', ['use_of_proceeds'])
    op.create_index('ix_dh6_paris', 'ep_dh6_sovereign_bonds', ['paris_aligned'])


def downgrade():
    op.drop_index('ix_dh6_paris', table_name='ep_dh6_sovereign_bonds')
    op.drop_index('ix_dh6_proceeds', table_name='ep_dh6_sovereign_bonds')
    op.drop_index('ix_dh6_year', table_name='ep_dh6_sovereign_bonds')
    op.drop_index('ix_dh5_ld_eligible', table_name='ep_dh5_ld_countries')
    op.drop_index('ix_dh5_region', table_name='ep_dh5_ld_countries')
    op.drop_index('ix_dh4_sector', table_name='ep_dh4_blended_transactions')
    op.drop_index('ix_dh4_type', table_name='ep_dh4_blended_transactions')
    op.drop_index('ix_dh3_status', table_name='ep_dh3_jetp_countries')
    op.drop_index('ix_dh2_region', table_name='ep_dh2_mdb_entities')
    op.drop_index('ix_dh2_type', table_name='ep_dh2_mdb_entities')
    op.drop_index('ix_dh1_rating', table_name='ep_dh1_em_sovereigns')
    op.drop_index('ix_dh1_region', table_name='ep_dh1_em_sovereigns')

    op.drop_table('ep_dh6_sovereign_bonds')
    op.drop_table('ep_dh5_ld_countries')
    op.drop_table('ep_dh4_blended_transactions')
    op.drop_table('ep_dh3_jetp_countries')
    op.drop_table('ep_dh2_mdb_entities')
    op.drop_table('ep_dh1_em_sovereigns')
