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
    do $$
    DECLARE

        ----------------------------------------------------------------------
        -- CHANGE ONLY THIS
        ----------------------------------------------------------------------

    v_execution_id UUID := '73a3bdbe-483e-4802-a8bc-79d23cb0432e';

    v_student_count INTEGER := 50;

        ----------------------------------------------------------------------
        -- Internal Variables
        ----------------------------------------------------------------------

        v_series_id UUID;
        v_opportunity_id UUID;
        v_drive_id UUID;

        v_drive_role_ids UUID[];
        v_selected_drive_role UUID;

        v_user_id UUID;
        v_student_id UUID;
        v_application_id UUID;

v_current_branch TEXT;

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
        -- Find Drive
        ----------------------------------------------------------------------

        SELECT drive_id
        INTO v_drive_id
        FROM opportunity_master
        WHERE opportunity_id = v_opportunity_id;

        IF v_drive_id IS NULL THEN
            RAISE EXCEPTION
                'Drive not found for Opportunity %',
                v_opportunity_id;
        END IF;

            ----------------------------------------------------------------------
        -- Load Available Roles
        ----------------------------------------------------------------------

        SELECT
            array_agg(drive_role_id ORDER BY drive_role_name)
        INTO
            v_drive_role_ids
        FROM drive_roles
        WHERE drive_id = v_drive_id;

        IF v_drive_role_ids IS NULL
        OR array_length(v_drive_role_ids, 1) IS NULL THEN

            RAISE EXCEPTION
                'No roles found for Drive %',
                v_drive_id;

        END IF;

        ----------------------------------------------------------------------
        -- Remove previous DEV data
        ----------------------------------------------------------------------

DELETE FROM recruitment_execution_history
WHERE execution_participant_id IN
(
    SELECT ep.execution_participant_id
    FROM recruitment_execution_participants ep
    INNER JOIN student_master sm
        ON sm.student_id = ep.student_id
    WHERE sm.enrollment_no LIKE 'IU234123%'
);  

    DELETE FROM recruitment_execution_round_participants
    WHERE execution_participant_id IN
    (
        SELECT ep.execution_participant_id
        FROM recruitment_execution_participants ep
        INNER JOIN student_master sm
            ON sm.student_id = ep.student_id
        WHERE sm.enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM recruitment_execution_participants
    WHERE student_id IN
    (
        SELECT student_id
        FROM student_master
        WHERE enrollment_no LIKE 'IU234123%'
    );

    DELETE FROM student_application_selected_roles
    WHERE application_id IN
    (
        SELECT application_id
        FROM student_opportunity_applications
        WHERE opportunity_id = v_opportunity_id
        AND student_id IN
        (
            SELECT student_id
            FROM student_master
            WHERE enrollment_no LIKE 'IU234123%'
        )
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
        WHERE email_address LIKE 'student%.%@%.indusuni.ac.in';

        ----------------------------------------------------------------------
        -- Create 20 Fake Students
        ----------------------------------------------------------------------

        FOR i IN 1..v_student_count LOOP

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
        'student'
        || LPAD(i::text,4,'0')
        || '.23.cse@iite.indusuni.ac.in'
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
        'IU234123' || LPAD(i::text,4,'0'),
        'Execution',
        NULL,
        'Student ' || LPAD(i::text, 2, '0'),
        'student'
    || LPAD(i::text,4,'0')
    || '.23.cse@iite.indusuni.ac.in',
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
        -- Branch Assignment (IITE B.Tech)
        ------------------------------------------------------------------

        CASE floor(random() * 10)::INTEGER

            WHEN 0 THEN
                v_current_branch := 'Computer Science Engineering';

            WHEN 1 THEN
                v_current_branch := 'Computer Science Engineering';

            WHEN 2 THEN
                v_current_branch := 'Computer Science Engineering';

            WHEN 3 THEN
                v_current_branch := 'Information Technology';

            WHEN 4 THEN
                v_current_branch := 'Electrical Engineering';

            WHEN 5 THEN
                v_current_branch := 'Computer Engineering';

            WHEN 6 THEN
                v_current_branch := 'Computer Engineering';

            WHEN 7 THEN
                v_current_branch := 'Cyber Security';

            WHEN 8 THEN
                v_current_branch := 'Electronics & Communication Engineering';

            ELSE
                v_current_branch := 'Mechanical Engineering';

        END CASE;

            ------------------------------------------------------------------
            -- Academic Details
            ------------------------------------------------------------------

          INSERT INTO student_academic_details
(
    student_id,
    current_semester,
    current_cgpa,
    tenth_percentage,
    twelfth_percentage,
    diploma_percentage,
    active_backlogs,
    year_gap_count,
    graduation_year,
    education_path,
    current_degree_name,
    current_institute_name,
    current_branch_name,
    created_by_type,
    is_active
)
VALUES
(
    v_student_id,
    7,

    CASE
        WHEN random() < 0.70
            THEN ROUND((8.00 + random()*2.00)::numeric,2)
        ELSE
            ROUND((6.50 + random()*1.49)::numeric,2)
    END,

    ROUND((75 + random()*25)::numeric,2),
    ROUND((75 + random()*25)::numeric,2),

    NULL,

    0,
    0,

    2027,

    'HSC',

    'B.Tech',

    'IITE',

    v_current_branch,

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
        'https://github.com/student'
    || LPAD(i::text,4,'0'),
        'https://linkedin.com/in/student'
    || LPAD(i::text,4,'0'),
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
            -- Random Role Selection
            ------------------------------------------------------------------

            v_selected_drive_role :=
                v_drive_role_ids[
                    floor(
                        random() *
                        array_length(v_drive_role_ids,1)
                        + 1
                    )::INTEGER
                ];
            
            ------------------------------------------------------------------
            -- Selected Role
            ------------------------------------------------------------------

            INSERT INTO student_application_selected_roles
            (
                application_id,
                drive_role_id,
                preference_order
            )
            VALUES
            (
                v_application_id,
                v_selected_drive_role,
                1
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
        -- Verify Role Assignments
        ----------------------------------------------------------------------

        IF
        (
            SELECT COUNT(*)
            FROM student_application_selected_roles
            WHERE application_id IN
            (
                SELECT application_id
                FROM student_opportunity_applications
                WHERE opportunity_id = v_opportunity_id
            )
        ) < v_student_count
        THEN

            RAISE EXCEPTION
                'Role assignment verification failed.';

        END IF;

        ----------------------------------------------------------------------
        -- Summary
        ----------------------------------------------------------------------

        RAISE NOTICE '';
        RAISE NOTICE '============================================';
        RAISE NOTICE 'Recruitment Execution DEV Seed Completed';
        RAISE NOTICE 'Execution ID : %', v_execution_id;
        RAISE NOTICE 'Opportunity  : %', v_opportunity_id;
    RAISE NOTICE 'Students Created : %', v_student_count;
    RAISE NOTICE 'Applications Created : %', v_student_count;
    RAISE NOTICE 'Execution Participants : %', v_student_count;
        RAISE NOTICE '============================================';
        RAISE NOTICE '';

    END;
    $$;