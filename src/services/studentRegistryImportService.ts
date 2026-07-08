import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import {
  canAccessPortal,
  isInstitutionalEmail,
  normalizeEmail,
} from "@/services/identityPolicyService";

async function resolvePortalUserId(authProviderId: string): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", authProviderId)
    .single();

  if (error || !data?.user_id) {
    throw new Error("Unable to resolve portal user account.");
  }

  return data.user_id;
}

export const REGISTRY_EXPECTED_HEADERS = [
  "Timestamp",
  "Email Address",
  "Enrollment No.",
  "First Name",
  "Last Name",
  "Gender",
  "Date of Birth",
  "Institute Email ID",
  "Personal Email ID",
  "Contact No. (Prefered Whatsapp No.)",
  "Hometown",
  "Current Degree (Pursuing Degree):",
  "Master's Degree - Branch",
  "Bachelor's Degree - Branch",
  "Select Your Preference:",
  "SSC (10th) %",
  "HSC (12th) or Diploma?",
  "% Marks of HSC (12th) or Diploma",
  "Willing to Relocate for placement?",
  "Reason for Opting out?",
  "I hereby declare that .....",
] as const;

type Severity = "error" | "warning";

export interface RegistryIssue {
  severity: Severity;
  rowNumber?: number;
  field?: string;
  message: string;
}

export interface RegistryPreviewRow {
  rowNumber: number;
  sourceTimestamp: string;
  emailAddress: string;
  enrollmentNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  instituteEmailId: string;
  personalEmailId: string | null;
  contactNumber: string;
  hometown: string;
  currentDegree: string;
  mastersDegreeBranch: string | null;
  bachelorsDegreeBranch: string | null;
  placementPreferenceText: string;
  sscPercentage: number | null;
  hscOrDiplomaType: string | null;
  hscOrDiplomaPercentage: number | null;
  willingToRelocate: string | null;
  reasonForOptOut: string | null;
  declarationText: string;
  action: "import" | "skip" | "error";
  issues: RegistryIssue[];
}

export interface RegistryValidationTest {
  label: string;
  passed: boolean;
  note?: string;
}

export interface RegistryValidationReport {
  instituteName: string;
  instituteKey: string;
  fileName: string;
  totalRows: number;
  parsedRows: number;
  duplicateRowsMerged: number;
  importedRowsCount: number;
  skippedOlderRowsCount: number;
  warningCount: number;
  errorCount: number;
  readyToImport: boolean;
  tests: RegistryValidationTest[];
  issues: RegistryIssue[];
  rows: RegistryPreviewRow[];
}

export interface RegistryImportResult {
  insertedOrUpdated: number;
  skipped: number;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeInstituteKey(value: string): string {
  return normalizeText(value).toUpperCase();
}

function normalizeHeader(value: unknown): string {
  return normalizeText(value);
}

function toEmail(value: unknown): string {
  return normalizeEmail(normalizeText(value));
}

function toDigits(value: unknown): string {
  return normalizeText(value).replace(/\D/g, "");
}

function toNumberOrNull(value: unknown): number | null {
  const text = normalizeText(value).replace(/,/g, "");
  if (!text) return null;

  const num = Number(text);
  if (Number.isNaN(num) || !Number.isFinite(num)) return null;

  return Number(num.toFixed(2));
}

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial)) return null;
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const dateInfo = new Date(utcValue);

  if (Number.isNaN(dateInfo.getTime())) return null;
  return dateInfo;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const text = normalizeText(value);
  if (!text) return null;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoString(date: Date): string {
  return date.toISOString();
}

async function loadFirstSheetRows(file: File): Promise<any[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Workbook does not contain any sheet.");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("Unable to read the first worksheet.");
  }

  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as any[][];

  return rows;
}

function addIssue(
  issues: RegistryIssue[],
  severity: Severity,
  message: string,
  rowNumber?: number,
  field?: string,
) {
  issues.push({
    severity,
    rowNumber,
    field,
    message,
  });
}

function isBlankRow(row: any[]): boolean {
  return row.every((cell) => normalizeText(cell) === "");
}

function getAllowedPreference(value: string): "Opt - IN" | "Opt - OUT" | null {
  const normalized = normalizeText(value).replace(/\s+/g, " ").toUpperCase();
  if (normalized === "OPT - IN") return "Opt - IN";
  if (normalized === "OPT - OUT") return "Opt - OUT";
  return null;
}

function getAllowedDegree(value: string): "Master" | "Bachelor" | null {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "MASTER") return "Master";
  if (normalized === "BACHELOR") return "Bachelor";
  return null;
}

function getAllowedGender(value: string): "Male" | "Female" | "Other" | null {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";
  if (normalized === "OTHER") return "Other";
  return null;
}

function getAllowedHscDiploma(value: string): "HSC(12th)" | "Diploma" | null {
  const normalized = normalizeText(value).toUpperCase().replace(/\s+/g, "");
  if (normalized === "HSC(12TH)" || normalized === "HSC12TH") return "HSC(12th)";
  if (normalized === "DIPLOMA") return "Diploma";
  return null;
}

function buildRowSummaryText(row: RegistryPreviewRow): string {
  return [
    row.emailAddress,
    row.enrollmentNo,
    row.firstName,
    row.lastName,
    row.gender,
    row.dateOfBirth,
    row.instituteEmailId,
    row.personalEmailId ?? "",
    row.contactNumber,
    row.hometown,
    row.currentDegree,
    row.mastersDegreeBranch ?? "",
    row.bachelorsDegreeBranch ?? "",
    row.placementPreferenceText,
    row.sscPercentage ?? "",
    row.hscOrDiplomaType ?? "",
    row.hscOrDiplomaPercentage ?? "",
    row.willingToRelocate ?? "",
    row.reasonForOptOut ?? "",
    row.declarationText,
  ].join("|");
}

async function getRegistryRowSignature(row: RegistryPreviewRow): Promise<string> {
  const text = buildRowSummaryText(row);
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getExistingRegistryRows(instituteKey: string) {
  const { data, error } = await (supabase as any)
    .from("student_master_registry")
    .select("registry_id, enrollment_no, institute_email_id, source_timestamp")
    .eq("institute_key", instituteKey)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{
    registry_id: string;
    enrollment_no: string;
    institute_email_id: string;
    source_timestamp: string;
  }>;
}

function compareDates(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

export async function validateRegistryWorkbook(
  file: File,
  instituteName: string,
): Promise<RegistryValidationReport> {
  if (!canAccessPortal((await supabase.auth.getUser()).data.user?.email)) {
    throw new Error("Unauthorized");
  }

  const instituteLabel = normalizeText(instituteName);
  if (!instituteLabel) {
    throw new Error("Institute name is required.");
  }

  const instituteKey = normalizeInstituteKey(instituteLabel);
  const rows = await loadFirstSheetRows(file);

  const report: RegistryValidationReport = {
    instituteName: instituteLabel,
    instituteKey,
    fileName: file.name,
    totalRows: 0,
    parsedRows: 0,
    duplicateRowsMerged: 0,
    importedRowsCount: 0,
    skippedOlderRowsCount: 0,
    warningCount: 0,
    errorCount: 0,
    readyToImport: false,
    tests: [],
    issues: [],
    rows: [],
  };

  if (!rows.length) {
    addIssue(report.issues, "error", "Workbook is empty.");
    report.errorCount = 1;
    report.tests.push({ label: "Sheet read", passed: false, note: "No rows found." });
    return report;
  }

  const headerRow = rows[0].map(normalizeHeader);
  const expectedHeaders = Array.from(REGISTRY_EXPECTED_HEADERS).map(normalizeHeader);

  const headersMatch =
    headerRow.length === expectedHeaders.length &&
    expectedHeaders.every((expected, index) => headerRow[index] === expected);

  report.tests.push({
    label: "Header order",
    passed: headersMatch,
    note: headersMatch
      ? "Headers match the expected sequence."
      : "Header names or order do not match the template.",
  });

  if (!headersMatch) {
    addIssue(report.issues, "error", "Excel headers do not match the expected template exactly.");
    report.errorCount = 1;
    report.readyToImport = false;
    return report;
  }

  const rawRows = rows.slice(1).filter((row) => !isBlankRow(row));
  report.totalRows = rawRows.length;

  const stagedRows: RegistryPreviewRow[] = [];

  for (let index = 0; index < rawRows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rawRows[index];

    const rawTimestamp = row[0];
    const rawEmailAddress = row[1];
    const rawEnrollmentNo = row[2];
    const rawFirstName = row[3];
    const rawLastName = row[4];
    const rawGender = row[5];
    const rawDob = row[6];
    const rawInstituteEmail = row[7];
    const rawPersonalEmail = row[8];
    const rawContact = row[9];
    const rawHometown = row[10];
    const rawCurrentDegree = row[11];
    const rawMasterBranch = row[12];
    const rawBachelorBranch = row[13];
    const rawPreference = row[14];
    const rawSsc = row[15];
    const rawHscDiploma = row[16];
    const rawHscDiplomaMarks = row[17];
    const rawRelocate = row[18];
    const rawReason = row[19];
    const rawDeclaration = row[20];

    const issues: RegistryIssue[] = [];

    const timestamp = toDate(rawTimestamp);
    const emailAddress = toEmail(rawEmailAddress);
    const enrollmentNo = normalizeText(rawEnrollmentNo).toUpperCase().replace(/\s+/g, "");
    const firstName = normalizeText(rawFirstName);
    const lastName = normalizeText(rawLastName);
    const gender = getAllowedGender(normalizeText(rawGender));
    const dob = toDate(rawDob);
    const instituteEmailId = toEmail(rawInstituteEmail);
    const personalEmailId = normalizeText(rawPersonalEmail) ? toEmail(rawPersonalEmail) : null;
    const contactNumber = toDigits(rawContact);
    const hometown = normalizeText(rawHometown);
    const currentDegree = getAllowedDegree(normalizeText(rawCurrentDegree));
    const mastersDegreeBranch = normalizeText(rawMasterBranch) || null;
    const bachelorsDegreeBranch = normalizeText(rawBachelorBranch) || null;
    const placementPreference = getAllowedPreference(normalizeText(rawPreference));
    const sscPercentage = toNumberOrNull(rawSsc);
    const hscOrDiplomaType = normalizeText(rawHscDiploma)
      ? getAllowedHscDiploma(normalizeText(rawHscDiploma))
      : null;
    const hscOrDiplomaPercentage = toNumberOrNull(rawHscDiplomaMarks);
    const willingToRelocate = normalizeText(rawRelocate) || null;
    const reasonForOptOut = normalizeText(rawReason) || null;
    const declarationText = normalizeText(rawDeclaration);

    if (!timestamp)
      addIssue(issues, "error", "Timestamp is missing or invalid.", rowNumber, "Timestamp");
    if (!emailAddress)
      addIssue(issues, "error", "Email Address is missing or invalid.", rowNumber, "Email Address");
    if (!isInstitutionalEmail(emailAddress))
      addIssue(
        issues,
        "error",
        "Email Address must be an indusuni.ac.in email.",
        rowNumber,
        "Email Address",
      );
    if (!enrollmentNo)
      addIssue(issues, "error", "Enrollment No. is missing.", rowNumber, "Enrollment No.");
    if (!/^IU[0-9]+$/.test(enrollmentNo))
      addIssue(
        issues,
        "error",
        "Enrollment No. must follow IU + digits.",
        rowNumber,
        "Enrollment No.",
      );
    if (!firstName) addIssue(issues, "error", "First Name is missing.", rowNumber, "First Name");
    if (!lastName) addIssue(issues, "error", "Last Name is missing.", rowNumber, "Last Name");
    if (!gender)
      addIssue(issues, "error", "Gender must be Male, Female or Other.", rowNumber, "Gender");
    if (!dob)
      addIssue(issues, "error", "Date of Birth is missing or invalid.", rowNumber, "Date of Birth");
    if (dob && dob.getTime() > Date.now())
      addIssue(
        issues,
        "error",
        "Date of Birth cannot be in the future.",
        rowNumber,
        "Date of Birth",
      );
    if (!instituteEmailId)
      addIssue(
        issues,
        "error",
        "Institute Email ID is missing or invalid.",
        rowNumber,
        "Institute Email ID",
      );
    if (!isInstitutionalEmail(instituteEmailId))
      addIssue(
        issues,
        "error",
        "Institute Email ID must be an indusuni.ac.in email.",
        rowNumber,
        "Institute Email ID",
      );
    if (emailAddress && instituteEmailId && emailAddress !== instituteEmailId) {
      addIssue(
        issues,
        "error",
        "Email Address and Institute Email ID must match.",
        rowNumber,
        "Email Address",
      );
    }

    if (
      personalEmailId &&
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(personalEmailId)
    ) {
      addIssue(issues, "error", "Personal Email ID is invalid.", rowNumber, "Personal Email ID");
    }

    if (!contactNumber || contactNumber.length !== 10) {
      addIssue(
        issues,
        "error",
        "Contact No. must contain exactly 10 digits.",
        rowNumber,
        "Contact No.",
      );
    }

    if (!hometown) addIssue(issues, "error", "Hometown is missing.", rowNumber, "Hometown");
    if (!currentDegree)
      addIssue(
        issues,
        "error",
        "Current Degree must be Master or Bachelor.",
        rowNumber,
        "Current Degree",
      );

    if (currentDegree === "Master" && !mastersDegreeBranch) {
      addIssue(
        issues,
        "error",
        "Master's Degree - Branch is required for Master students.",
        rowNumber,
        "Master's Degree - Branch",
      );
    }

    if (currentDegree === "Bachelor" && !bachelorsDegreeBranch) {
      addIssue(
        issues,
        "error",
        "Bachelor's Degree - Branch is required for Bachelor students.",
        rowNumber,
        "Bachelor's Degree - Branch",
      );
    }

    if (!placementPreference) {
      addIssue(
        issues,
        "error",
        "Select Your Preference must be Opt - IN or Opt - OUT.",
        rowNumber,
        "Select Your Preference",
      );
    }

    if (placementPreference === "Opt - IN") {
      if (sscPercentage === null) {
        addIssue(
          issues,
          "error",
          "SSC (10th) % is required for Opt - IN rows.",
          rowNumber,
          "SSC (10th) %",
        );
      }

      if (!hscOrDiplomaType) {
        addIssue(
          issues,
          "error",
          "HSC (12th) or Diploma type is required for Opt - IN rows.",
          rowNumber,
          "HSC (12th) or Diploma?",
        );
      }

      if (hscOrDiplomaPercentage === null) {
        addIssue(
          issues,
          "error",
          "% Marks of HSC (12th) or Diploma is required for Opt - IN rows.",
          rowNumber,
          "% Marks of HSC (12th) or Diploma",
        );
      }

      if (!willingToRelocate) {
        addIssue(
          issues,
          "warning",
          "Willing to Relocate is empty for an Opt - IN row.",
          rowNumber,
          "Willing to Relocate for placement?",
        );
      }

      if (reasonForOptOut) {
        addIssue(
          issues,
          "warning",
          "Reason for Opting out should normally be blank for Opt - IN rows.",
          rowNumber,
          "Reason for Opting out?",
        );
      }
    }

    if (placementPreference === "Opt - OUT") {
      if (!reasonForOptOut) {
        addIssue(
          issues,
          "error",
          "Reason for Opting out is required for Opt - OUT rows.",
          rowNumber,
          "Reason for Opting out?",
        );
      }
    }

    if (!declarationText) {
      addIssue(
        issues,
        "error",
        "Declaration text is missing.",
        rowNumber,
        "I hereby declare that .....",
      );
    } else {
      const declarationOk =
        /placement policy/i.test(declarationText) || /declare/i.test(declarationText);

      if (!declarationOk) {
        addIssue(
          issues,
          "warning",
          "Declaration text does not look complete.",
          rowNumber,
          "I hereby declare that .....",
        );
      }
    }

    const previewRow: RegistryPreviewRow = {
      rowNumber,
      sourceTimestamp: timestamp ? toIsoString(timestamp) : "",
      emailAddress,
      enrollmentNo,
      firstName,
      lastName,
      gender: gender ?? "",
      dateOfBirth: dob ? toDateOnlyString(dob) : "",
      instituteEmailId,
      personalEmailId,
      contactNumber,
      hometown,
      currentDegree: currentDegree ?? "",
      mastersDegreeBranch,
      bachelorsDegreeBranch,
      placementPreferenceText: placementPreference ?? "",
      sscPercentage,
      hscOrDiplomaType,
      hscOrDiplomaPercentage,
      willingToRelocate,
      reasonForOptOut,
      declarationText,
      action: "import",
      issues,
    };

    if (issues.some((item) => item.severity === "error")) {
      previewRow.action = "error";
    }

    stagedRows.push(previewRow);
  }

  report.parsedRows = stagedRows.length;

  const dedupedByEnrollment = new Map<string, RegistryPreviewRow[]>();
  for (const row of stagedRows) {
    if (!dedupedByEnrollment.has(row.enrollmentNo)) {
      dedupedByEnrollment.set(row.enrollmentNo, []);
    }
    dedupedByEnrollment.get(row.enrollmentNo)!.push(row);
  }

  const dedupedRows: RegistryPreviewRow[] = [];
  let duplicateRowsMerged = 0;

  for (const [, group] of dedupedByEnrollment.entries()) {
    if (group.length === 1) {
      dedupedRows.push(group[0]);
      continue;
    }

    duplicateRowsMerged += group.length - 1;

    const sorted = [...group].sort((a, b) => compareDates(a.sourceTimestamp, b.sourceTimestamp));
    const winner = sorted[sorted.length - 1];

    for (const loser of sorted.slice(0, -1)) {
      loser.action = "skip";
      loser.issues.push({
        severity: "warning",
        rowNumber: loser.rowNumber,
        field: "Enrollment No.",
        message: `Duplicate enrollment found in the file. Latest timestamp kept at row ${winner.rowNumber}.`,
      });
    }

    dedupedRows.push(winner);
  }

  report.duplicateRowsMerged = duplicateRowsMerged;
  report.rows = dedupedRows.sort((a, b) => a.rowNumber - b.rowNumber);

  const existingRows = await getExistingRegistryRows(instituteKey);
  const existingEnrollmentMap = new Map(existingRows.map((row) => [row.enrollment_no, row]));
  const existingEmailMap = new Map(
    existingRows.map((row) => [row.institute_email_id.toLowerCase(), row]),
  );

  for (const row of report.rows) {
    if (row.action === "error" || row.action === "skip") {
      continue;
    }

    const existingEnrollment = existingEnrollmentMap.get(row.enrollmentNo);
    const existingEmail = existingEmailMap.get(row.instituteEmailId.toLowerCase());

    if (existingEmail && existingEmail.enrollment_no !== row.enrollmentNo) {
      row.action = "error";
      row.issues.push({
        severity: "error",
        rowNumber: row.rowNumber,
        field: "Institute Email ID",
        message: `Institute Email ID already exists in database for enrollment ${existingEmail.enrollment_no}.`,
      });
    }

    if (existingEnrollment) {
      const incomingTs = new Date(row.sourceTimestamp).getTime();
      const existingTs = new Date(existingEnrollment.source_timestamp).getTime();

      if (existingTs > incomingTs) {
        row.action = "skip";
        row.issues.push({
          severity: "warning",
          rowNumber: row.rowNumber,
          field: "Enrollment No.",
          message:
            "Database already has a newer record for this enrollment. This row will be skipped.",
        });
      } else {
        row.issues.push({
          severity: "warning",
          rowNumber: row.rowNumber,
          field: "Enrollment No.",
          message: "Existing database row will be updated because this row is newer.",
        });
      }
    }
  }

  report.importedRowsCount = report.rows.filter((row) => row.action === "import").length;
  report.skippedOlderRowsCount = report.rows.filter((row) => row.action === "skip").length;
  report.warningCount = report.rows.reduce(
    (sum, row) => sum + row.issues.filter((i) => i.severity === "warning").length,
    0,
  );
  report.errorCount = report.rows.reduce(
    (sum, row) => sum + row.issues.filter((i) => i.severity === "error").length,
    0,
  );

  report.tests.push(
    {
      label: "Enrollment / email / contact validation",
      passed: report.errorCount === 0,
      note:
        report.errorCount === 0
          ? "All hard validations passed."
          : "Some rows still have blocking issues.",
    },
    {
      label: "Duplicate resolution",
      passed: duplicateRowsMerged >= 0,
      note:
        duplicateRowsMerged > 0
          ? `${duplicateRowsMerged} duplicate row(s) were merged by latest timestamp.`
          : "No duplicates inside the file.",
    },
    {
      label: "Database conflict scan",
      passed: true,
      note:
        report.skippedOlderRowsCount > 0
          ? `${report.skippedOlderRowsCount} row(s) are older than the database and will be skipped.`
          : "No older database conflicts found.",
    },
    {
      label: "Ready to push",
      passed: report.errorCount === 0 && report.importedRowsCount > 0,
      note:
        report.errorCount === 0
          ? `${report.importedRowsCount} row(s) are ready for import.`
          : "Fix the blocking issues first.",
    },
  );

  report.readyToImport = report.errorCount === 0 && report.importedRowsCount > 0;

  report.issues = report.rows.flatMap((row) => row.issues);
  return report;
}

export async function importRegistryRows(
  report: RegistryValidationReport,
  authProviderId: string,
): Promise<RegistryImportResult> {
  const rowsToImport = report.rows.filter((row) => row.action === "import");
  const importedByUserId = await resolvePortalUserId(authProviderId);

  if (!rowsToImport.length) {
    return {
      insertedOrUpdated: 0,
      skipped: report.rows.length,
    };
  }

  const payload = rowsToImport.map((row) => ({
    institute_name: report.instituteName,
    institute_key: report.instituteKey,
    source_file_name: report.fileName,
    source_row_number: row.rowNumber,
    source_timestamp: row.sourceTimestamp,
    email_address: row.emailAddress,
    enrollment_no: row.enrollmentNo,
    first_name: row.firstName,
    last_name: row.lastName,
    gender: row.gender,
    date_of_birth: row.dateOfBirth,
    institute_email_id: row.instituteEmailId,
    personal_email_id: row.personalEmailId,
    contact_number: row.contactNumber,
    hometown: row.hometown,
    current_degree: row.currentDegree,
    masters_degree_branch: row.mastersDegreeBranch,
    bachelors_degree_branch: row.bachelorsDegreeBranch,
    placement_preference_text: row.placementPreferenceText,
    ssc_percentage: row.sscPercentage,
    hsc_or_diploma_type: row.hscOrDiplomaType,
    hsc_or_diploma_percentage: row.hscOrDiplomaPercentage,
    willing_to_relocate: row.willingToRelocate,
    reason_for_opt_out: row.reasonForOptOut,
    declaration_text: row.declarationText,
    validation_status: "VALIDATED",
    validation_issues: row.issues,
    imported_by: importedByUserId,
    is_active: true,
  }));

  const { error } = await (supabase as any).from("student_master_registry").upsert(payload, {
    onConflict: "institute_key,enrollment_no",
  });

  if (error) {
    throw error;
  }

  return {
    insertedOrUpdated: payload.length,
    skipped: report.rows.length - payload.length,
  };
}
