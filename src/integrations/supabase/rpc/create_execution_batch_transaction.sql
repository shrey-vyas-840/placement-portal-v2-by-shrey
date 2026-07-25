CREATE OR REPLACE FUNCTION public.create_execution_batch_transaction(
    p_execution_id uuid,
    p_creation_mode text,
    p_round_order integer,
    p_round_name text,
    p_scope execution_scope,
    p_stage_number integer,
    p_scheduled_date date,
    p_scheduled_time time,
    p_venue text,
    p_remarks text,
    p_created_by uuid,
    p_role_ids uuid[],
    p_execution_participant_ids uuid[]
)
RETURNS recruitment_execution_rounds
LANGUAGE plpgsql
AS $$
DECLARE
    v_round recruitment_execution_rounds;
BEGIN

    INSERT INTO recruitment_execution_rounds (
        execution_id,
        stage_number,
        round_order,
        round_name,
        scope,
        scheduled_date,
        scheduled_time,
        venue,
        remarks,
        created_by
    )
    VALUES (
        p_execution_id,
        p_stage_number,
        p_round_order,
        p_round_name,
        p_scope,
        p_scheduled_date,
        p_scheduled_time,
        p_venue,
        p_remarks,
        p_created_by
    )
    RETURNING *
    INTO v_round;

    IF p_scope = 'ROLE_SPECIFIC' THEN

        INSERT INTO recruitment_execution_round_roles (
            execution_round_id,
            drive_role_id
        )
        SELECT
            v_round.execution_round_id,
            unnest(p_role_ids);

    END IF;

    INSERT INTO recruitment_execution_round_participants (
        execution_round_id,
        execution_participant_id
    )
    SELECT
        v_round.execution_round_id,
        unnest(p_execution_participant_ids);

    RETURN v_round;

END;
$$;