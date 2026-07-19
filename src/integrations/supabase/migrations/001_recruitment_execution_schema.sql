-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001
-- Full replacement
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- Execution lifecycle enums
-- --------------------------------------------------------------------------

CREATE TYPE execution_series_status AS ENUM
(
    'ACTIVE',
    'FINALIZED',
    'ARCHIVED'
);

CREATE TYPE execution_status AS ENUM
(
    'ACTIVE',
    'FINALIZED',
    'SUPERSEDED'
);

CREATE TYPE execution_scope AS ENUM
(
    'COMMON',
    'ROLE_SPECIFIC'
);

CREATE TYPE execution_round_status AS ENUM
(
    'DRAFT',
    'READY',
    'IN_PROGRESS',
    'COMPLETED',
    'STALE',
    'LOCKED'
);

CREATE TYPE execution_attendance_status AS ENUM
(
    'PRESENT',
    'ABSENT'
);

CREATE TYPE execution_gate_status AS ENUM
(
    'ALLOWED',
    'RESTRICTED'
);

CREATE TYPE execution_progression_status AS ENUM
(
    'NONE',
    'SHORTLISTED',
    'SELECTED'
);

CREATE TYPE execution_event_type AS ENUM
(
    'EXECUTION_STARTED',
    'ROUND_CREATED',
    'ROUND_SAVED',
    'ROUND_REVISED',
    'ROUND_MARKED_STALE',
    'EXECUTION_FINALIZED',
    'EXECUTION_REOPENED',
    'EXECUTION_ARCHIVED'
);

-- --------------------------------------------------------------------------
-- Recruitment execution series
--
-- One series per published opportunity.
-- Reopen creates a new execution revision under the same series.
-- --------------------------------------------------------------------------

CREATE TABLE recruitment_execution_series
(
    series_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    opportunity_id UUID NOT NULL
        REFERENCES opportunity_master(opportunity_id)
        ON DELETE RESTRICT,

    drive_id UUID NOT NULL
        REFERENCES drive_master(drive_id)
        ON DELETE RESTRICT,

    company_id UUID NOT NULL
        REFERENCES company_master(company_id)
        ON DELETE RESTRICT,

    series_status execution_series_status NOT NULL DEFAULT 'ACTIVE',

    current_revision_number INTEGER NOT NULL DEFAULT 1,

    current_execution_id UUID NULL,

    series_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_recruitment_execution_series_opportunity
        UNIQUE (opportunity_id)
);

CREATE INDEX idx_recruitment_execution_series_drive
    ON recruitment_execution_series(drive_id);

CREATE INDEX idx_recruitment_execution_series_company
    ON recruitment_execution_series(company_id);

CREATE INDEX idx_recruitment_execution_series_status
    ON recruitment_execution_series(series_status);

-- --------------------------------------------------------------------------
-- Recruitment executions
--
-- One row per revision of a recruitment execution.
-- Reopen = insert a new execution row with a higher revision number.
-- --------------------------------------------------------------------------

CREATE TABLE recruitment_executions
(
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    series_id UUID NOT NULL
        REFERENCES recruitment_execution_series(series_id)
        ON DELETE RESTRICT,

    revision_number INTEGER NOT NULL,

    execution_status execution_status NOT NULL DEFAULT 'ACTIVE',

    execution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

    current_round_id UUID NULL,

    reopened_from_execution_id UUID NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    superseded_by_execution_id UUID NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    started_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    finalized_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    finalized_at TIMESTAMPTZ NULL,

    reopen_reason TEXT NULL,

    finalization_notes TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_recruitment_execution_revision
        UNIQUE (series_id, revision_number)
);

CREATE INDEX idx_recruitment_executions_series
    ON recruitment_executions(series_id);

CREATE INDEX idx_recruitment_executions_status
    ON recruitment_executions(execution_status);

CREATE INDEX idx_recruitment_executions_revision
    ON recruitment_executions(revision_number);

    