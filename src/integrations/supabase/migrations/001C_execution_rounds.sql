-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001C
--
-- Execution Rounds
--
-- Dependencies:
--   001A_execution_types.sql
--   001B_execution_core.sql
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- Execution Rounds
--
-- Immutable round definitions for a single execution revision.
--
-- No mutable execution state is stored here.
-- ============================================================================

CREATE TABLE recruitment_execution_rounds
(
    execution_round_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    round_order INTEGER NOT NULL,

    round_name TEXT NOT NULL,

    scope execution_scope NOT NULL,

    scheduled_date DATE,

    scheduled_time TIME,

    venue TEXT,

    remarks TEXT,

    created_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_round
        UNIQUE
        (
            execution_id,
            round_order
        )
);

-- ============================================================================
-- Round Role Mapping
--
-- COMMON rounds:
--      No rows.
--
-- ROLE_SPECIFIC rounds:
--      One or more mapped drive roles.
-- ============================================================================

CREATE TABLE recruitment_execution_round_roles
(
    execution_round_role_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    execution_round_id UUID NOT NULL
        REFERENCES recruitment_execution_rounds(execution_round_id)
        ON DELETE CASCADE,

    drive_role_id UUID NOT NULL
        REFERENCES drive_roles(drive_role_id)
        ON DELETE RESTRICT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_round_role
        UNIQUE
        (
            execution_round_id,
            drive_role_id
        )
);

COMMIT;