-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001D
--
-- Participants & Immutable Execution History
--
-- Dependencies:
--   001A_execution_types.sql
--   001B_execution_core.sql
--   001C_execution_rounds.sql
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- Execution Participants
--
-- One row = one application participating in one execution revision.
--
-- This table intentionally contains NO mutable execution state.
-- Current state is always derived from execution history.
-- ============================================================================

CREATE TABLE recruitment_execution_participants
(
    execution_participant_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    application_id UUID NOT NULL
        REFERENCES student_opportunity_applications(application_id)
        ON DELETE RESTRICT,

    student_id UUID NOT NULL
        REFERENCES student_master(student_id)
        ON DELETE RESTRICT,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_participant
        UNIQUE
        (
            execution_id,
            application_id
        )
);

-- ============================================================================
-- Immutable Execution History
--
-- One row =
--     One Participant
--     One Round
--     One Save Action
--
-- Rows are NEVER updated.
-- Rows are NEVER deleted.
--
-- ============================================================================

CREATE TABLE recruitment_execution_history
(
    execution_history_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    execution_round_id UUID NOT NULL
        REFERENCES recruitment_execution_rounds(execution_round_id)
        ON DELETE RESTRICT,

    execution_participant_id UUID NOT NULL
        REFERENCES recruitment_execution_participants(execution_participant_id)
        ON DELETE RESTRICT,

    execution_revision INTEGER NOT NULL,

    history_revision INTEGER NOT NULL,

    attendance_status execution_attendance_status,

    gate_status execution_gate_status,

    progression_status execution_progression_status
        NOT NULL
        DEFAULT 'NONE',

    remarks TEXT,

    previous_history_id UUID
        REFERENCES recruitment_execution_history(execution_history_id)
        ON DELETE RESTRICT,

    change_reason TEXT,

    changed_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    changed_at TIMESTAMPTZ
        NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_history_revision
        UNIQUE
        (
            execution_id,
            execution_round_id,
            execution_participant_id,
            execution_revision,
            history_revision
        )
);

COMMIT;