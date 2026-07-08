export const LOCKED_STUDENT_FIELDS = ["enrollment_no", "institute_email"] as const;

export type LockedStudentField = (typeof LOCKED_STUDENT_FIELDS)[number];

export function isStudentFieldLocked(field: string): boolean {
  return LOCKED_STUDENT_FIELDS.includes(field as LockedStudentField);
}
