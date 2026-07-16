interface Props {
  currentCgpa: number | null;
  currentSemester: number | null;
  graduationYear: number | null;
  activeBacklogs: number | null;
  yearGapCount: number | null;
}

export function ApplicantAcademicCard({
  currentCgpa,
  currentSemester,
  graduationYear,
  activeBacklogs,
  yearGapCount,
}: Props) {
  return (
    <div className="rounded-2xl border p-5">

      <h3 className="mb-4 text-lg font-semibold">
        Academic Profile
      </h3>

      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-xl bg-muted p-4">
          <div className="text-xs uppercase text-muted-foreground">
            CGPA
          </div>
          <div className="mt-2 text-2xl font-bold">
            {currentCgpa ?? "-"}
          </div>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <div className="text-xs uppercase text-muted-foreground">
            Semester
          </div>
          <div className="mt-2 text-2xl font-bold">
            {currentSemester ?? "-"}
          </div>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <div className="text-xs uppercase text-muted-foreground">
            Graduation
          </div>
          <div className="mt-2 text-2xl font-bold">
            {graduationYear ?? "-"}
          </div>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <div className="text-xs uppercase text-muted-foreground">
            Backlogs
          </div>
          <div className="mt-2 text-2xl font-bold">
            {activeBacklogs ?? 0}
          </div>
        </div>

        <div className="col-span-2 rounded-xl bg-muted p-4">
          <div className="text-xs uppercase text-muted-foreground">
            Year Gaps
          </div>
          <div className="mt-2 text-2xl font-bold">
            {yearGapCount ?? 0}
          </div>
        </div>

      </div>

    </div>
  );
}