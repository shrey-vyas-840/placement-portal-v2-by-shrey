-- ============================================================================
-- Recruitment Execution Engine
-- Migration 001F
--
-- Support Infrastructure
--
-- Dependencies:
--   001A_execution_types.sql
--   001B_execution_core.sql
--   001C_execution_rounds.sql
--   001D_execution_history.sql
--   001E_execution_final_selection.sql
--
-- ============================================================================
BEGIN;

-- ============================================================================
-- Performance Indexes
-- ============================================================================

CREATE INDEX idx_execution_series_drive
ON recruitment_execution_series(drive_id);

CREATE INDEX idx_execution_series_company
ON recruitment_execution_series(company_id);

CREATE INDEX idx_execution_series_status
ON recruitment_execution_series(series_status);

CREATE INDEX idx_execution_revision_series
ON recruitment_executions(series_id);

CREATE INDEX idx_execution_revision_status
ON recruitment_executions(execution_status);

CREATE INDEX idx_execution_round_execution
ON recruitment_execution_rounds(execution_id);

CREATE INDEX idx_execution_round_order
ON recruitment_execution_rounds(execution_id, round_order);

CREATE INDEX idx_execution_round_role_round
ON recruitment_execution_round_roles(execution_round_id);

CREATE INDEX idx_execution_round_role_role
ON recruitment_execution_round_roles(drive_role_id);

CREATE INDEX idx_execution_participant_execution
ON recruitment_execution_participants(execution_id);

CREATE INDEX idx_execution_participant_student
ON recruitment_execution_participants(student_id);

CREATE INDEX idx_execution_participant_application
ON recruitment_execution_participants(application_id);

CREATE INDEX idx_execution_history_execution
ON recruitment_execution_history(execution_id);

CREATE INDEX idx_execution_history_round
ON recruitment_execution_history(execution_round_id);

CREATE INDEX idx_execution_history_participant
ON recruitment_execution_history(execution_participant_id);

CREATE INDEX idx_execution_history_previous
ON recruitment_execution_history(previous_history_id);

CREATE INDEX idx_execution_history_changed_at
ON recruitment_execution_history(changed_at DESC);

CREATE INDEX idx_execution_final_selection_execution
ON recruitment_execution_final_selection(execution_id);

CREATE INDEX idx_execution_final_selection_participant
ON recruitment_execution_final_selection(execution_participant_id);

CREATE INDEX idx_execution_final_selection_placement
ON recruitment_execution_final_selection(placement_history_id);

-- ============================================================================
-- updated_at Triggers
-- ============================================================================

CREATE TRIGGER trg_execution_series_updated_at
BEFORE UPDATE ON recruitment_execution_series
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_execution_updated_at
BEFORE UPDATE ON recruitment_executions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_execution_round_updated_at
BEFORE UPDATE ON recruitment_execution_rounds
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_execution_participant_updated_at
BEFORE UPDATE ON recruitment_execution_participants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE recruitment_execution_series ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_executions ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_execution_rounds ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_execution_round_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_execution_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_execution_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE recruitment_execution_final_selection ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Temporary Admin Policies
--
-- These match the existing admin pattern in your project.
-- They can be tightened later when RBAC integration is completed.
-- ============================================================================

CREATE POLICY recruitment_execution_series_all
ON recruitment_execution_series
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_executions_all
ON recruitment_executions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_execution_rounds_all
ON recruitment_execution_rounds
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_execution_round_roles_all
ON recruitment_execution_round_roles
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_execution_participants_all
ON recruitment_execution_participants
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_execution_history_all
ON recruitment_execution_history
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY recruitment_execution_final_selection_all
ON recruitment_execution_final_selection
FOR ALL
USING (true)
WITH CHECK (true);

COMMIT;