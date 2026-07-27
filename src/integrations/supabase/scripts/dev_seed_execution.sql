-- ==========================================================
-- DEV SEED : Recruitment Execution Participants
-- Placement Portal V2
--
-- PURPOSE
-- --------
-- Creates 20 fake students and automatically applies them to
-- a selected recruitment execution.
--
-- Change ONLY the execution id below.
-- ==========================================================

DO
$$
DECLARE

    ----------------------------------------------------------------------
    -- CHANGE ONLY THIS
    ----------------------------------------------------------------------

    v_execution_id UUID := 'ed03ec15-1a86-48b4-bfd5-59d4ea9fac63';

    ----------------------------------------------------------------------
    -- Internal Variables
    ----------------------------------------------------------------------

    v_series_id UUID;
    v_opportunity_id UUID;

    v_user_id UUID;
    v_student_id UUID;
    v_application_id UUID;

    v_existing_institute UUID;
    v_existing_degree UUID;
    v_existing_branch UUID;

    i INTEGER;

BEGIN

    ----------------------------------------------------------------------
    -- Validate Execution
    ----------------------------------------------------------------------

    SELECT
        execution.series_id
    INTO
        v_series_id
    FROM recruitment_executions execution
    WHERE execution.execution_id = v_execution_id;

    IF v_series_id IS NULL THEN
        RAISE EXCEPTION
            'Execution % does not exist.',
            v_execution_id;
    END IF;

    ----------------------------------------------------------------------
    -- Find Opportunity
    ----------------------------------------------------------------------

    SELECT
        series.opportunity_id
    INTO
        v_opportunity_id
    FROM recruitment_execution_series series
    WHERE series.series_id = v_series_id;

    IF v_opportunity_id IS NULL THEN
        RAISE EXCEPTION
            'Opportunity not found.';
    END IF;

    ----------------------------------------------------------------------
    -- Find one Academic Mapping
    -- (Used as template for fake students)
    ----------------------------------------------------------------------

    SELECT
        institute_id,
        degree_id,
        branch_id
    INTO
        v_existing_institute,
        v_existing_degree,
        v_existing_branch
    FROM student_academic_details
    WHERE institute_id IS NOT NULL
    LIMIT 1;

    ----------------------------------------------------------------------
    -- Remove previous DEV data
    ----------------------------------------------------------------------

    DELETE FROM recruitment_execution_round_participants
    WHERE execution_participant_id IN
    (
        SELECT execution_participant_id
        FROM recruitment_execution_participants ep
        JOIN student_master sm
            ON sm.student_id = ep.student_id
        WHERE
            ep.execution_id = v_execution_id
        AND
            sm.enrollment_no LIKE 'DEVEXEC%'
    );

    DELETE FROM recruitment_execution_participants
    WHERE execution_id = v_execution_id
    AND student_id IN
    (
        SELECT student_id
        FROM student_master
        WHERE enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM student_opportunity_applications
    WHERE opportunity_id = v_opportunity_id
    AND student_id IN
    (
        SELECT student_id
        FROM student_master
        WHERE enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM student_skill_profile
    WHERE student_id IN
    (
        SELECT student_id
        FROM student_master
        WHERE enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM student_academic_details
    WHERE student_id IN
    (
        SELECT student_id
        FROM student_master
        WHERE enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM student_master
    WHERE enrollment_no LIKE 'IU234123%';

    DELETE FROM user_accounts
    WHERE email_address LIKE 'devexec%@indusuni.ac.in';

    ----------------------------------------------------------------------
    -- Create 20 Fake Students
    ----------------------------------------------------------------------

    FOR i IN 1..20 LOOP

    RAISE NOTICE 'Creating student %', i;

            ------------------------------------------------------------------
        -- Generate IDs
        ------------------------------------------------------------------

        v_user_id := gen_random_uuid();
        v_student_id := gen_random_uuid();
        v_application_id := gen_random_uuid();

        ------------------------------------------------------------------
        -- User Account
        ------------------------------------------------------------------

        INSERT INTO user_accounts
        (
            user_id,
            email_address,
            account_status,
            email_verified,
            created_by_type,
            is_active
        )
        VALUES
        (
            v_user_id,
            lower(
                'devexec' || LPAD(i::text, 2, '0') || '@indusuni.ac.in'
            ),
            'Active',
            TRUE,
            'Auto Generated',
            TRUE
        );

        ------------------------------------------------------------------
        -- Student Master
        ------------------------------------------------------------------

        INSERT INTO student_master
        (
            student_id,
            user_id,
            enrollment_no,
            first_name,
            middle_name,
            last_name,
            institute_email,
            personal_email,
            contact_number,
            alternate_contact_number,
            gender,
            placement_preference,
            placement_status,
            created_by_type,
            is_active
        )
        VALUES
      (
    v_student_id,
    v_user_id,
    'IU234123' || LPAD(i::text, 4, '0'),
    'Execution',
    NULL,
    'Student ' || LPAD(i::text, 2, '0'),
    'devexec' || LPAD(i::text, 2, '0') || '@indusuni.ac.in',
    'devexec.personal' || LPAD(i::text, 2, '0') || '@gmail.com',
    LPAD((9000000000 + i)::text, 10, '0'),
    NULL,
    'Male',
    'Interested',
    'Unplaced',
    'Auto Generated',
    TRUE
);

        ------------------------------------------------------------------
        -- Academic Details
        ------------------------------------------------------------------

        INSERT INTO student_academic_details
        (
            student_id,
            institute_id,
            degree_id,
            branch_id,
            current_semester,
            current_cgpa,
            tenth_percentage,
            twelfth_percentage,
            diploma_percentage,
            active_backlogs,
            year_gap_count,
            graduation_year,
            created_by_type,
            is_active
        )
        VALUES
        (
            v_student_id,
            v_existing_institute,
            v_existing_degree,
            v_existing_branch,
            7,
            ROUND((7.00 + random()*2.5)::numeric,2),
            ROUND((70 + random()*25)::numeric,2),
            ROUND((70 + random()*25)::numeric,2),
            NULL,
            0,
            0,
            2027,
            'Auto Generated',
            TRUE
        );

        ------------------------------------------------------------------
        -- Skill Profile
        ------------------------------------------------------------------

        INSERT INTO student_skill_profile
        (
            student_id,
            technical_skills,
            programming_languages,
            tools_and_technologies,
            certification_count,
            github_url,
            linkedin_url,
            portfolio_url,
            hackathon_count,
            project_count,
            strengths,
            profile_score,
            created_by_type,
            is_active
        )
        VALUES
(
    v_student_id,
    'React, TypeScript, SQL',
    'C, C++, Java, Python',
    'Git, VS Code',
    2,
    'https://github.com/devexec' || LPAD(i::text, 2, '0'),
    'https://linkedin.com/in/devexec' || LPAD(i::text, 2, '0'),
    NULL,
    1,
    3,
    'Problem Solving',
    ROUND((75 + random()*20)::numeric,2),
    'Auto Generated',
    TRUE
);
                ------------------------------------------------------------------
        -- Opportunity Application
        ------------------------------------------------------------------

        INSERT INTO student_opportunity_applications
        (
            application_id,
            opportunity_id,
            student_id,
            application_status
        )
        VALUES
        (
            v_application_id,
            v_opportunity_id,
            v_student_id,
            'Applied'
        );

        ------------------------------------------------------------------
        -- Execution Participant
        ------------------------------------------------------------------

    INSERT INTO recruitment_execution_participants
(
    execution_id,
    application_id,
    student_id
)
VALUES
(
    v_execution_id,
    v_application_id,
    v_student_id
);

RAISE NOTICE 'Completed student %', i;

    END LOOP;

    ----------------------------------------------------------------------
    -- Summary
    ----------------------------------------------------------------------

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Recruitment Execution DEV Seed Completed';
    RAISE NOTICE 'Execution ID : %', v_execution_id;
    RAISE NOTICE 'Opportunity  : %', v_opportunity_id;
    RAISE NOTICE 'Students Created : 20';
    RAISE NOTICE 'Applications Created : 20';
    RAISE NOTICE 'Execution Participants : 20';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';

END;
$$;