import { useEffect, useState } from "react";
import { academicService } from "@/services/academicService";
import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";

type Props = {
  studentId: string;
  existingData?: any;
  onSaved: () => void;
};

const modernInputClass =
`
w-full
appearance-none
rounded-2xl
border
border-slate-200
bg-slate-50/70
px-4
py-3
pr-10
outline-none
transition-all
duration-200
focus:border-primary
focus:bg-white
focus:ring-4
focus:ring-primary/10
hover:border-primary/40
disabled:bg-slate-50
cursor-pointer
`;

export function AcademicSection({ studentId, existingData, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState<any>(null);

  const [educationPath, setEducationPath] = useState(existingData?.education_path ?? "");

  const [currentDegreeName, setCurrentDegreeName] = useState(
    existingData?.current_degree_level ?? "",
  );

  const [currentInstituteName, setCurrentInstituteName] = useState(
    existingData?.current_institute_name ?? "",
  );

  const [currentBranchName, setCurrentBranchName] = useState(
    existingData?.current_branch_name ?? "",
  );

  const [currentSemester, setCurrentSemester] = useState(
    existingData?.current_semester?.toString() ?? "",
  );

  const [cgpa, setCgpa] = useState(existingData?.current_cgpa?.toString() ?? "");

  const [tenthPercentage, setTenthPercentage] = useState(
    existingData?.tenth_percentage?.toString() ?? "",
  );

  const [twelfthPercentage, setTwelfthPercentage] = useState(
    existingData?.twelfth_percentage?.toString() ?? "",
  );

  const [diplomaPercentage, setDiplomaPercentage] = useState(
    existingData?.diploma_percentage?.toString() ?? "",
  );

  const [gpaInput, setGpaInput] = useState("");

  const [activeBacklogs, setActiveBacklogs] = useState(
    existingData?.active_backlogs?.toString() ?? "0",
  );

  const [yearGapCount, setYearGapCount] = useState(existingData?.year_gap_count?.toString() ?? "0");

  const [graduationYear, setGraduationYear] = useState(
    existingData?.graduation_year?.toString() ?? "",
  );

  const availableDegrees = currentInstituteName
    ? Object.keys(
        ELIGIBILITY_MAPPING[currentInstituteName as keyof typeof ELIGIBILITY_MAPPING] || {},
      )
    : [];

  const availableBranches =
    currentInstituteName && currentDegreeName
      ? (
          ELIGIBILITY_MAPPING[currentInstituteName as keyof typeof ELIGIBILITY_MAPPING] as Record<
            string,
            string[]
          >
        )?.[currentDegreeName] || []
      : [];

  useEffect(() => {
    if (!existingData) {
      setEditing(true);
      return;
    }

    setEditing(false);
    setOriginalData(existingData);

    setEducationPath(existingData.education_path ?? "");

    setCurrentDegreeName(existingData.current_degree_level ?? "");

    setCurrentInstituteName(existingData.current_institute_name ?? "");

    setCurrentBranchName(existingData.current_branch_name ?? "");

    setCurrentSemester(existingData.current_semester?.toString() ?? "");

    setCgpa(existingData.current_cgpa?.toString() ?? "");

    setTenthPercentage(existingData.tenth_percentage?.toString() ?? "");

    setTwelfthPercentage(existingData.twelfth_percentage?.toString() ?? "");

    setDiplomaPercentage(existingData.diploma_percentage?.toString() ?? "");

    setActiveBacklogs(existingData.active_backlogs?.toString() ?? "0");

    setYearGapCount(existingData.year_gap_count?.toString() ?? "0");

    setGraduationYear(existingData.graduation_year?.toString() ?? "");
  }, [existingData]);

  function handleGpaConvert() {
    if (!gpaInput) {
      return;
    }

    const gpa = Number(gpaInput);

    if (Number.isNaN(gpa) || gpa < 0 || gpa > 10) {
      return;
    }

    const converted = (gpa * 9.5).toFixed(2);

    if (educationPath === "HSC") {
      setTwelfthPercentage(converted);
    }

    if (educationPath === "Diploma") {
      setDiplomaPercentage(converted);
    }
  }

  async function handleSave() {
    try {
      setError("");

      if (!educationPath) {
        setError("Education path is required.");
        return;
      }

      if (!currentDegreeName) {
        setError("Current degree is required.");
        return;
      }

      if (!currentInstituteName.trim()) {
        setError("Institute name is required.");
        return;
      }

      if (!currentBranchName.trim()) {
        setError("Branch name is required.");
        return;
      }

      if (!tenthPercentage) {
        setError("10th percentage is required.");
        return;
      }

      if (educationPath === "HSC" && !twelfthPercentage) {
        setError("12th percentage is required.");
        return;
      }

      if (educationPath === "Diploma" && !diplomaPercentage) {
        setError("Diploma percentage is required.");
        return;
      }

      if (Number(cgpa) < 0 || Number(cgpa) > 10) {
        setError("CGPA must be between 0 and 10.");
        return;
      }

      if (Number(tenthPercentage) < 0 || Number(tenthPercentage) > 100) {
        setError("10th percentage must be between 0 and 100.");
        return;
      }

      if (
        educationPath === "HSC" &&
        (Number(twelfthPercentage) < 0 || Number(twelfthPercentage) > 100)
      ) {
        setError("12th percentage must be between 0 and 100.");
        return;
      }

      if (
        educationPath === "Diploma" &&
        (Number(diplomaPercentage) < 0 || Number(diplomaPercentage) > 100)
      ) {
        setError("Diploma percentage must be between 0 and 100.");
        return;
      }

      setSaving(true);

      await academicService.saveAcademicDetails({
        student_id: studentId,

        education_path: educationPath,

        current_degree_level: currentDegreeName,

        current_institute_name: currentInstituteName,

        current_branch_name: currentBranchName,

        current_semester: Number(currentSemester),

        current_cgpa: Number(cgpa),

        tenth_percentage: Number(tenthPercentage),

        twelfth_percentage: educationPath === "HSC" ? Number(twelfthPercentage) : null,

        diploma_percentage: educationPath === "Diploma" ? Number(diplomaPercentage) : null,

        active_backlogs: Number(activeBacklogs),

        year_gap_count: Number(yearGapCount),

        graduation_year: Number(graduationYear),

        created_by_type: "User",

        is_active: true,
      });

      setEditing(false);

      onSaved();

      setError("");
    } catch (err) {
      console.error("ACADEMIC SAVE ERROR", JSON.stringify(err, null, 2));

      setError("Failed to save academic details.");
    } finally {
      setSaving(false);
    }
  }
  if (existingData && !editing) {
    return (
      <div className="mt-6 rounded border p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Academic Details</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Academic records, eligibility information and educational background maintained by the
              student.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="
        rounded-xl
        bg-primary
        px-6
        py-3
        font-medium
        text-white
        transition-all
        hover:shadow-lg
      "
            >
              Edit Academic Details
            </button>
          )}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Education Path
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {educationPath}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Current Degree
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {currentDegreeName}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Institute
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {currentInstituteName}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Branch
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {currentBranchName}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Current CGPA
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {cgpa}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Current Semester
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {currentSemester}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              10th Percentage
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {tenthPercentage}%
            </p>
          </div>

          {educationPath === "HSC" && (
            <div
              className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
            >
              <p
                className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
              >
                12th Percentage
              </p>

              <p
                className="
  mt-2
  font-semibold
  text-foreground
"
              >
                {twelfthPercentage}%
              </p>
            </div>
          )}

          {educationPath === "Diploma" && (
            <div
              className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
            >
              <p
                className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
              >
                Diploma Percentage
              </p>

              <p
                className="
  mt-2
  font-semibold
  text-foreground
"
              >
                {diplomaPercentage}%
              </p>
            </div>
          )}

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Active Backlogs
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {activeBacklogs}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Year Gaps
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {yearGapCount}
            </p>
          </div>

          <div
            className="
    rounded-2xl
    border
    border-border/80
    bg-white
    p-4
    transition-all
    hover:-translate-y-1
    hover:border-primary/40
    hover:shadow-md
  "
          >
            <p
              className="
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Graduation Year
            </p>

            <p
              className="
  mt-2
  font-semibold
  text-foreground
"
            >
              {graduationYear}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="
    mt-6
    rounded-3xl
    border
    border-border/50
    bg-white
    p-8
    shadow-sm
  "
    >
    <div className="mb-8 flex items-start justify-between">
  <div>
    <h2 className="text-2xl font-semibold">
      Academic Details
    </h2>

    <p className="mt-2 text-sm text-muted-foreground">
      Educational qualifications and eligibility information used for placements.
    </p>
  </div>

  <div className="flex gap-3">
    {editing && (
      <>
        <button
          type="button"
          onClick={() => {
            if (originalData) {
              setEducationPath(originalData.education_path ?? "");
              setCurrentDegreeName(originalData.current_degree_level ?? "");
              setCurrentInstituteName(originalData.current_institute_name ?? "");
              setCurrentBranchName(originalData.current_branch_name ?? "");
              setCurrentSemester(originalData.current_semester?.toString() ?? "");
              setCgpa(originalData.current_cgpa?.toString() ?? "");
              setTenthPercentage(originalData.tenth_percentage?.toString() ?? "");
              setTwelfthPercentage(originalData.twelfth_percentage?.toString() ?? "");
              setDiplomaPercentage(originalData.diploma_percentage?.toString() ?? "");
              setActiveBacklogs(originalData.active_backlogs?.toString() ?? "0");
              setYearGapCount(originalData.year_gap_count?.toString() ?? "0");
              setGraduationYear(originalData.graduation_year?.toString() ?? "");
            }

            setEditing(false);
          }}
          className="
            rounded-xl
            border
            border-slate-300
            bg-white
            px-6
            py-3
            font-medium
            transition-all
            hover:bg-slate-50
          "
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="
            rounded-xl
            bg-primary
            px-6
            py-3
            font-medium
            text-white
            transition-all
            hover:shadow-lg
          "
        >
          {saving ? "Saving..." : "Save Academic Details"}
        </button>
      </>
    )}
  </div>
</div>

{error && (
  <p className="mb-6 text-sm text-red-500">
    {error}
  </p>
)}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
       <div className="relative">
  <label
    className="
      mb-2
      block
      text-xs
      uppercase
      tracking-[0.12em]
      text-muted-foreground
    "
  >
    Education Path
  </label>

  <select
            disabled={!editing}
            className={modernInputClass}
            value={educationPath}
            onChange={(e) => {
              const value = e.target.value;

              setEducationPath(value);

              if (value === "HSC") {
                setDiplomaPercentage("");
              }

              if (value === "Diploma") {
                setTwelfthPercentage("");
              }
            }}
          >
            <option value="">Select Education Path</option>

            <option value="HSC">HSC</option>

            <option value="Diploma">Diploma</option>
          </select>
          <div
            className="
      pointer-events-none
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-slate-400
    "
          >
            ▼
          </div>
        </div>

        <div className="relative">
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current Institute
          </label>

          <select
            disabled={!editing}
            className={modernInputClass}
            value={currentInstituteName}
            onChange={(e) => {
              const selectedInstitute = e.target.value;

              setCurrentInstituteName(selectedInstitute);

              setCurrentDegreeName("");

              setCurrentBranchName("");
            }}
          >
            <option value="">Select Institute</option>

            {Object.keys(ELIGIBILITY_MAPPING).map((institute) => (
              <option key={institute} value={institute}>
                {institute}
              </option>
            ))}
          </select>
          <div
            className="
    pointer-events-none
    absolute
    right-4
    top-[70%]
    -translate-y-1/2
    text-slate-400
  "
          >
            ▼
          </div>
        </div>

        <div className="relative">
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current Degree
          </label>

          <select
            disabled={!editing || !currentInstituteName}
            className={modernInputClass}
            value={currentDegreeName}
            onChange={(e) => {
              setCurrentDegreeName(e.target.value);

              setCurrentBranchName("");
            }}
          >
            <option value="">Select Degree</option>

            {availableDegrees.map((degree) => (
              <option key={degree} value={degree}>
                {degree}
              </option>
            ))}
          </select>
          <div
            className="
    pointer-events-none
    absolute
    right-4
    top-[70%]
    -translate-y-1/2
    text-slate-400
  "
          >
            ▼
          </div>
        </div>

        <div className="relative">
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current Branch
          </label>

          <select
            disabled={!editing || !currentInstituteName || !currentDegreeName}
            className={modernInputClass}
            value={currentBranchName}
            onChange={(e) => setCurrentBranchName(e.target.value)}
          >
            <option value="">Select Branch</option>

            {availableBranches.map((branch: string) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <div
            className="
    pointer-events-none
    absolute
    right-4
    top-[70%]
    -translate-y-1/2
    text-slate-400
  "
          >
            ▼
          </div>
        </div>

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            10th Percentage
          </label>

          <input
            disabled={!editing}
            className={modernInputClass}
            value={tenthPercentage}
            onChange={(e) => setTenthPercentage(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>

        {educationPath === "HSC" && (
          <div>
            <label
              className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              12th / Diploma Percentage
            </label>

            <input
              disabled={!editing}
              className={modernInputClass}
              value={twelfthPercentage}
              onChange={(e) => setTwelfthPercentage(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
        )}

        {educationPath === "Diploma" && (
          <div>
            <label
              className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              Diploma Percentage
            </label>

            <input
              disabled={!editing}
              className={modernInputClass}
              value={diplomaPercentage}
              onChange={(e) => setDiplomaPercentage(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
        )}

        {educationPath === "Diploma" && !diplomaPercentage && (
          <div>
            <label
              className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
            >
              GPA to Percentage Converter (Optional)
            </label>

            <div className="flex gap-2">
              <input
                disabled={!editing}
                className={modernInputClass}
                placeholder="Enter GPA"
                value={gpaInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");

                  const parts = value.split(".");

                  if (parts.length > 2) {
                    return;
                  }

                  if (parts[1] && parts[1].length > 2) {
                    return;
                  }

                  if (Number(value) > 10) {
                    return;
                  }

                  if (
                    value.startsWith("10") &&
                    value !== "10" &&
                    value !== "10." &&
                    value !== "10.0" &&
                    value !== "10.00"
                  ) {
                    return;
                  }

                  setGpaInput(value);
                }}
              />

              <button
                type="button"
                onClick={handleGpaConvert}
                className="
  rounded-xl
  bg-primary
  px-5
  py-3
  font-medium
  text-white
  transition-all
  hover:shadow-lg
"
              >
                Convert
              </button>
            </div>
          </div>
        )}

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current Semester
          </label>
          <input
            disabled={!editing}
            className={modernInputClass}
            placeholder="Current Semester"
            value={currentSemester}
            onChange={(e) => setCurrentSemester(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current CGPA
          </label>

          <input
            disabled={!editing}
            className={modernInputClass}
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Current Active Backlogs
          </label>
          <input
            disabled={!editing}
            className={modernInputClass}
            placeholder="Active Backlogs"
            value={activeBacklogs}
            onChange={(e) => setActiveBacklogs(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Year Gap Count
          </label>
          <input
            disabled={!editing}
            className={modernInputClass}
            placeholder="Year Gap Count"
            value={yearGapCount}
            onChange={(e) => setYearGapCount(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div>
          <label
            className="
  mb-2
  block
  text-xs
  uppercase
  tracking-[0.12em]
  text-muted-foreground
"
          >
            Graduation Year
          </label>

          <input
            disabled={!editing}
            className={modernInputClass}
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    </div>
  );
}
