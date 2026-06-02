export type NocType =
    | "Internship"
    | "Off Campus Placement"
    | "On Campus Placement";

export type NocStatus =
    | "PENDING_HOD_APPROVAL"
    | "HOD_REJECTED"
    | "PENDING_PRINT"
    | "PRINTED"
    | "ISSUED"
    | "CANCELLED";

export type ApprovalSource =
    | "HOD_APPROVED"
    | "ADMIN_OVERRIDE";

export interface CreateNocRequestPayload {

    noc_type: NocType;

    start_date: string;

    end_date: string;

    company_name: string;

    company_address_1: string;

    company_address_2: string;

    hr_prefix: "Mr." | "Ms.";

    hr_name: string;

    hr_position: string;

}

export interface NocSnapshot {

    student_id: string;

    student_name: string;

    enrollment_no: string;

    institute_email: string;

    institute_name: string;

    course: string;

    semester: number;

    branch: string;

    noc_type: string;

    start_date: string;

    end_date: string;

    company_name: string;

    company_address_1: string;

    company_address_2: string;

    hr_prefix: string;

    hr_name: string;

    hr_position: string;

}
