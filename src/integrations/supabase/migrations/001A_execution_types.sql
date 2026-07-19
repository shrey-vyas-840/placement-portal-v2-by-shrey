-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001A
--
-- Purpose:
-- Shared PostgreSQL enum types used by the execution engine.
--
-- Dependencies:
-- None
--
-- Safe to execute independently.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Execution Series Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_series_status AS ENUM
(
    'ACTIVE',
    'FINALIZED',
    'ARCHIVED'
);

COMMENT ON TYPE execution_series_status IS
'Overall lifecycle of an execution series.';

-- ---------------------------------------------------------------------------
-- Execution Revision Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_status AS ENUM
(
    'ACTIVE',
    'FINALIZED',
    'SUPERSEDED'
);

COMMENT ON TYPE execution_status IS
'Lifecycle state of a single execution revision.';

-- ---------------------------------------------------------------------------
-- Round Scope
-- ---------------------------------------------------------------------------

CREATE TYPE execution_scope AS ENUM
(
    'COMMON',
    'ROLE_SPECIFIC'
);

COMMENT ON TYPE execution_scope IS
'COMMON = all participants. ROLE_SPECIFIC = only configured roles.';

-- ---------------------------------------------------------------------------
-- Round Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_round_status AS ENUM
(
    'DRAFT',
    'READY',
    'IN_PROGRESS',
    'COMPLETED',
    'STALE',
    'LOCKED'
);

COMMENT ON TYPE execution_round_status IS
'Operational lifecycle of a recruitment execution round.';

-- ---------------------------------------------------------------------------
-- Attendance Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_attendance_status AS ENUM
(
    'PRESENT',
    'ABSENT'
);

COMMENT ON TYPE execution_attendance_status IS
'Physical attendance recorded during a round.';

-- ---------------------------------------------------------------------------
-- Gate Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_gate_status AS ENUM
(
    'ALLOWED',
    'RESTRICTED'
);

COMMENT ON TYPE execution_gate_status IS
'Administrative eligibility for continuing the execution flow.';

-- ---------------------------------------------------------------------------
-- Progression Status
-- ---------------------------------------------------------------------------

CREATE TYPE execution_progression_status AS ENUM
(
    'NONE',
    'SHORTLISTED',
    'SELECTED'
);

COMMENT ON TYPE execution_progression_status IS
'Progression outcome recorded after a round.';

-- ---------------------------------------------------------------------------
-- Execution Event Types
-- ---------------------------------------------------------------------------

CREATE TYPE execution_event_type AS ENUM
(
    'EXECUTION_STARTED',
    'ROUND_CREATED',
    'ROUND_UPDATED',
    'ROUND_SAVED',
    'ROUND_MARKED_STALE',
    'ROUND_REOPENED',
    'ROUND_LOCKED',
    'EXECUTION_FINALIZED',
    'EXECUTION_REOPENED',
    'EXECUTION_ARCHIVED'
);

COMMENT ON TYPE execution_event_type IS
'High-level execution events used for auditing and future notifications.';

COMMIT;