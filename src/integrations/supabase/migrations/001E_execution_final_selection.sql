-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001E
--
-- Final Selection & Placement Integration
--
-- Dependencies:
--   001A_execution_types.sql
--   001B_execution_core.sql
--   001C_execution_rounds.sql
--   001D_execution_history.sql
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- Final Selection
--
-- One row represents one student finally selected in one execution revision.
--
-- Placement history remains the authoritative placement record.
--
-- This table only links the execution engine with placement history.
-- ============================================================================

CREATE TABLE recruitment_execution_final_selection
(
    execution_selection_id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES recruitment_executions(execution_id)
        ON DELETE RESTRICT,

    execution_participant_id UUID NOT NULL
        REFERENCES recruitment_execution_participants(execution_participant_id)
        ON DELETE RESTRICT,

    drive_role_id UUID NOT NULL
        REFERENCES drive_roles(drive_role_id)
        ON DELETE RESTRICT,

    placement_history_id UUID NULL
        REFERENCES student_placement_history(placement_history_id)
        ON DELETE SET NULL,

    package_lpa NUMERIC NULL,

    placement_type TEXT NULL,

    notes TEXT NULL,

    created_by UUID
        REFERENCES user_accounts(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT now(),

    CONSTRAINT uq_execution_final_selection
        UNIQUE
        (
            execution_id,
            execution_participant_id
        )
);

COMMIT;