create or replace function finalize_recruitment_execution(
    p_execution_id uuid,
    p_finalized_by uuid,
    p_finalization_notes text,
    p_final_selection_rows jsonb,
    p_placement_history_rows jsonb,
    p_student_ids jsonb
)
returns recruitment_executions
language plpgsql
as
$$
declare
    v_execution recruitment_executions;
begin

    ------------------------------------------------------------
    -- Final Selection Snapshot
    ------------------------------------------------------------

    insert into recruitment_execution_final_selection
    (
        execution_id,
        execution_participant_id,
        application_id,
        student_id
    )
    select
        x.execution_id,
        x.execution_participant_id,
        x.application_id,
        x.student_id
    from jsonb_to_recordset(p_final_selection_rows) as x(
        execution_id uuid,
        execution_participant_id uuid,
        application_id uuid,
        student_id uuid
    )
    on conflict (execution_id, execution_participant_id)
    do update set
        application_id = excluded.application_id,
        student_id = excluded.student_id;

    ------------------------------------------------------------
    -- Placement History
    ------------------------------------------------------------

    insert into student_placement_history
    (
        student_id,
        opportunity_id,
        drive_id,
        company_id,
        company_name,
        package_lpa,
        placement_type,
        placed_at,
        is_current
    )
    select
        x.student_id,
        x.opportunity_id,
        x.drive_id,
        x.company_id,
        x.company_name,
        x.package_lpa,
        x.placement_type,
        x.placed_at,
        x.is_current
    from jsonb_to_recordset(p_placement_history_rows) as x(
        student_id uuid,
        opportunity_id uuid,
        drive_id uuid,
        company_id uuid,
        company_name text,
        package_lpa numeric,
        placement_type text,
        placed_at date,
        is_current boolean
    );

    ------------------------------------------------------------
    -- Student Status
    ------------------------------------------------------------

    update student_master
    set placement_status = 'Placed'
    where student_id in
    (
        select value::uuid
        from jsonb_array_elements_text(p_student_ids)
    );

    ------------------------------------------------------------
    -- Opportunity
    ------------------------------------------------------------

    update opportunity_master
    set
        application_status='Closed',
        visible_to_students=false
    where opportunity_id =
    (
        select opportunity_id
        from recruitment_execution_series s
        join recruitment_executions e
          on e.series_id=s.series_id
        where e.execution_id=p_execution_id
    );

    ------------------------------------------------------------
    -- Execution
    ------------------------------------------------------------

    update recruitment_executions
    set
        execution_status='FINALIZED',
        finalized_by=p_finalized_by,
        finalized_at=now(),
        finalization_notes=p_finalization_notes
    where execution_id=p_execution_id
    returning *
    into v_execution;

    return v_execution;

end;
$$;