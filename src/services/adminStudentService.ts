import { supabase } from "@/lib/supabase";

export const adminStudentService = {
    async getAllStudents() {
        const { data, error } = await (supabase as any)
            .from("student_master")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (error) throw error;

        const students =
            data ?? [];

        const enriched =
            await Promise.all(
                students.map(
                    async (
                        student: any,
                    ) => {
                        const {
                            data: account,
                        } =
                            await (
                                supabase as any
                            )
                                .from(
                                    "user_accounts",
                                )
                                .select(
                                    "auth_provider_id",
                                )
                                .eq(
                                    "user_id",
                                    student.user_id,
                                )
                                .maybeSingle();

                        const percentage =
                            account
                                ?.auth_provider_id
                                ? await this.getStudentCompletion(
                                    account.auth_provider_id,
                                )
                                : 0;

                        return {
                            ...student,
                            completion_percentage:
                                percentage,
                        };
                    },
                ),
            );

        return enriched;
    },

    async getStudentById(
        studentId: string,
    ) {
        const { data: profile, error: profileError } =
            await (supabase as any)
                .from("student_master")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        if (profileError) throw profileError;

        const { data: academics } =
            await (supabase as any)
                .from("student_academic_details")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        const { data: skills } =
            await (supabase as any)
                .from("student_skill_profile")
                .select("*")
                .eq("student_id", studentId)
                .maybeSingle();

        const { data: documents } =
            await (supabase as any)
                .from("student_documents")
                .select(`
      *,
      document_metadata:document_metadata_id (
        document_metadata_id,
        document_name,
        document_type,
        storage_url,
        version_number,
        created_at,
        is_active
      )
    `)
                .eq("student_id", studentId)
                .eq("is_active", true)
                .order("created_at", {
                    ascending: false,
                });

        return {
            profile,
            academics,
            skills,
            documents,
        };
    },

    async getStudentCompletion(
        authUserId: string,
    ) {
        const {
            data: account,
        } = await (supabase as any)
            .from("user_accounts")
            .select("user_id")
            .eq(
                "auth_provider_id",
                authUserId,
            )
            .maybeSingle();

        if (!account) {
            return 0;
        }

        const {
            data: profile,
        } = await (supabase as any)
            .from("student_master")
            .select("*")
            .eq(
                "user_id",
                account.user_id,
            )
            .maybeSingle();

        if (!profile) {
            return 0;
        }

        const {
            data: academics,
        } = await (supabase as any)
            .from(
                "student_academic_details",
            )
            .select("*")
            .eq(
                "student_id",
                profile.student_id,
            )
            .maybeSingle();

        const {
            data: skills,
        } = await (supabase as any)
            .from(
                "student_skill_profile",
            )
            .select("*")
            .eq(
                "student_id",
                profile.student_id,
            )
            .maybeSingle();

        const {
            data: resumeDocuments,
        } = await (supabase as any)
            .from("student_documents")
            .select(`
      *,
      document_metadata (
        storage_url,
        document_type
      )
    `)
            .eq(
                "student_id",
                profile.student_id,
            )
            .eq(
                "is_active",
                true,
            );

        const resume =
            resumeDocuments?.find(
                (doc: any) =>
                    doc.document_metadata
                        ?.document_type ===
                    "Resume",
            );

        const profileComplete =
            !!profile.first_name &&
            !!profile.last_name &&
            !!profile.enrollment_no &&
            !!profile.contact_number;

        const academicsComplete =
            !!academics?.current_cgpa &&
            !!academics?.graduation_year;

        const skillsComplete =
            !!skills?.technical_skills &&
            !!skills?.programming_languages &&
            !!skills?.linkedin_url;

        const resumeComplete =
            !!resume?.document_metadata
                ?.storage_url;

        const completed =
            [
                profileComplete,
                academicsComplete,
                skillsComplete,
                resumeComplete,
            ].filter(Boolean)
                .length;

        return Math.round(
            (completed / 4) * 100,
        );
    },

    async getDashboardMetrics() {
        const [
            studentsResult,
            drivesResult,
            opportunitiesResult,
            applicationsResult,
            attendanceResult,
        ] = await Promise.all([
            (supabase as any)
                .from("student_master")
                .select("student_id, placement_preference, placement_status"),

            (supabase as any)
                .from("drive_master")
                .select("drive_id")
                .eq("is_active", true)
                .eq("is_deleted", false),

            (supabase as any)
                .from("opportunity_master")
                .select("opportunity_id, application_status"),

            (supabase as any)
                .from("student_opportunity_applications")
                .select("application_id, application_status"),

            (supabase as any)
                .from("attendance_records")
                .select("attendance_id"),
        ]);

        const students = studentsResult.data ?? [];
        const drives = drivesResult.data ?? [];
        const opportunities = opportunitiesResult.data ?? [];
        const applications = applicationsResult.data ?? [];
        const attendance = attendanceResult.data ?? [];

        const totalStudents = students.length;
        const interestedStudents = students.filter(
            (s: any) => s.placement_preference === "Interested",
        ).length;

        const unplacedStudents = students.filter(
            (s: any) => s.placement_status === "Unplaced",
        ).length;

        const placedStudents = students.filter(
            (s: any) => s.placement_status === "Placed",
        ).length;

        const totalDrives = drives.length;
        const totalApplications = applications.length;
        const shortlistedApplications = applications.filter(
            (a: any) => a.application_status === "Shortlisted",
        ).length;

        const openOpportunities = opportunities.filter(
            (o: any) => o.application_status === "Open",
        ).length;

        const attendanceRecords = attendance.length;

        return {
            totalStudents,
            interestedStudents,
            unplacedStudents,
            placedStudents,
            totalDrives,
            totalApplications,
            shortlistedApplications,
            openOpportunities,
            attendanceRecords,
        };
    },

    async searchStudents(
        searchTerm: string,
    ) {
        let query =
            (supabase as any)
                .from("student_master")
                .select("*")
                .order("created_at", {
                    ascending: false,
                });

        if (
            searchTerm.trim() &&
            searchTerm.length >= 8
        ) {
            const enrollmentSearch =
                `IU${searchTerm}`;

            query =
                query.ilike(
                    "enrollment_no",
                    `%${enrollmentSearch}%`,
                );
        }

        const { data, error } =
            await query;

        if (error) throw error;

        const students =
            data ?? [];

        const enriched =
            await Promise.all(
                students.map(
                    async (
                        student: any,
                    ) => {
                        const {
                            data: account,
                        } =
                            await (
                                supabase as any
                            )
                                .from(
                                    "user_accounts",
                                )
                                .select(
                                    "auth_provider_id",
                                )
                                .eq(
                                    "user_id",
                                    student.user_id,
                                )
                                .maybeSingle();

                        const percentage =
                            account
                                ?.auth_provider_id
                                ? await this.getStudentCompletion(
                                    account.auth_provider_id,
                                )
                                : 0;

                        return {
                            ...student,
                            completion_percentage:
                                percentage,
                        };
                    },
                ),
            );

        return enriched;
    },

    async getFilterOptions() {
        const {
            data: academics,
        } = await (supabase as any)
            .from(
                "student_academic_details",
            )
            .select(`
                current_institute_name,
                current_branch_name,
                graduation_year
        `);

        const institutes: string[] =
            [
                ...new Set(
                    (academics ?? []).map(
                        (a: any) =>
                            a.current_institute_name,
                    ),
                ),
            ]
                .filter(Boolean) as string[];

        const branches: string[] =
            [
                ...new Set(
                    (academics ?? []).map(
                        (a: any) =>
                            a.current_branch_name,
                    ),
                ),
            ]
                .filter(Boolean) as string[];

        const graduationYears: number[] =
            [
                ...new Set(
                    (academics ?? []).map(
                        (a: any) =>
                            a.graduation_year,
                    ),
                ),
            ]
                .filter(Boolean) as number[];

        return {
            institutes:
                institutes as string[],

            branches:
                branches as string[],

            graduationYears:
                graduationYears as number[],
        };
    },

    async getAcademicMap() {
        const { data, error } =
            await (supabase as any)
                .from(
                    "student_academic_details",
                )
                .select(`
                student_id,
                current_cgpa,
                current_branch_name,
                graduation_year
            `);

        if (error) throw error;

        return data ?? [];
    },

};

