-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001B
--
-- Core Execution Tables
--
-- Dependencies:
--   001A_execution_types.sql
--
-- ============================================================================
BEGIN;

-- ============================================================================
-- Recruitment Execution Series
--
-- One series exists for every published opportunity.
--
-- Reopening an execution NEVER creates another series.
-- It creates another execution revision inside the same series.
-- ============================================================================

CREATE TABLE recruitment_execution_series
(
    series_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    opportunity_id UUID NOT NULL
        REFERENCES opportunity_master(opportunity_id)
        ON DELETE RESTRICT,

    drive_id UUID NOT NULL
        REFERENCES drive_master(drive_id)
        ON DELETE RESTRICT,

    company_id UUID NOT NULL
        REFERENCES company_master(company_id)
        ON DELETE RESTRICT,

    series_status execution_series_status
        NOT NULL
        DEFAULT 'ACTIVE',

    current_revision_number INTEGER
        NOT NULL
        DEFAULT 1,

    series_snapshot JSONB
        NOT NULL
        DEFAULT '{}'::jsonb,

    created_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_series_opportunity
        UNIQUE(opportunity_id)
);

-- ============================================================================
-- Recruitment Executions
--
-- Every reopen creates a NEW row.
--
-- Previous executions are NEVER modified.
-- ============================================================================

CREATE TABLE recruitment_executions
(
    execution_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    series_id UUID
        NOT NULL
        REFERENCES recruitment_execution_series(series_id)
        ON DELETE RESTRICT,

    revision_number INTEGER
        NOT NULL,

    execution_status execution_status
        NOT NULL
        DEFAULT 'ACTIVE',

    execution_snapshot JSONB
        NOT NULL
        DEFAULT '{}'::jsonb,

    reopened_from_execution_id UUID
        NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    superseded_by_execution_id UUID
        NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    started_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    started_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    finalized_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    finalized_at TIMESTAMPTZ,

    reopen_reason TEXT,

    finalization_notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_revision
        UNIQUE
        (
            series_id,
            revision_number
        )
);

COMMIT;