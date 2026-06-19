import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/studentService";
import { supabase } from "@/lib/supabase";
import type { StudentMaster } from "@/types/student";
import { documentService } from "@/services/documentService";
import { ResumeSection } from "@/components/ResumeSection";
import { AcademicSection } from "@/components/AcademicSection";
import { academicService } from "@/services/academicService";
import SkillsSection from "@/components/SkillsSection";

type Mode = "view";

export function ProfilePage() {
  const { user } = useAuth();
  const isInstitutionalEmail =
    !!user?.email &&
    /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)?indusuni\.ac\.in$/i.test(
      user.email,
    );
  const [profile, setProfile] = useState<StudentMaster | null>(null);
  const [academicData, setAcademicData] =
    useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<StudentMaster | null>(null);
  const [resumeUrl, setResumeUrl] =
    useState<string | null>(null);
  const hasChanges =
    profile &&
      originalProfile
      ? JSON.stringify(profile) !==
      JSON.stringify(originalProfile)
      : false;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    studentService
      .getProfileByUserId(user.id)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setOriginalProfile(data);
        if (data?.student_id) {
          loadAcademicDetails(
            data.student_id,
          );
        }

        if (data?.student_id) {
          documentService
            .getResume(data.student_id)
            .then((resume: any) => {
              const url =
                resume?.document_metadata
                  ?.storage_url ?? null;

              setResumeUrl(url);
            })
            .catch(console.error);
        }
      })
      .catch((err) => {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load profile",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const loadResume = async (
    studentId: string,
  ) => {
    try {
      const resume: any =
        await documentService.getResume(
          studentId,
        );

      console.log(
        "LATEST RESUME",
        resume,
      );

      const metadata =
        Array.isArray(
          resume?.document_metadata,
        )
          ? resume.document_metadata
            .filter(
              (x: any) => x?.storage_url
            )
            .sort(
              (a: any, b: any) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            )[0]
          : resume?.document_metadata;

      console.log(
        "RESUME RESPONSE",
        JSON.stringify(resume, null, 2)
      );

      console.log(
        "RESUME URL",
        metadata?.storage_url
      );
      setResumeUrl
        (
          metadata?.storage_url ?? null,
        );
    } catch (err) {
      console.error(err);
    }
  };

  const loadAcademicDetails =
    async (
      studentId: string,
    ) => {
      try {
        const data =
          await academicService.getAcademicDetails(
            studentId,
          );

        setAcademicData(data);
      } catch (err) {
        console.error(err);
      }
    };

  const handleProfileSave = async () => {
    if (!profile) return;

    if (!profile.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    if (!profile.last_name.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(profile.contact_number)) {
      setError(
        "Contact number must contain exactly 10 digits."
      );
      return;
    }

    if (
      profile.alternate_contact_number &&
      !/^[0-9]{10}$/.test(
        profile.alternate_contact_number,
      )
    ) {
      setError(
        "Alternate contact number must contain exactly 10 digits."
      );
      return;
    }
    if (
      profile.personal_email &&
      !/^[a-z0-9]+([._%+-]?[a-z0-9]+)*@[a-z0-9-]+\.(com|in|org|edu|net)$/i.test(
        profile.personal_email.trim(),
      )
    ) {
      setError(
        "Please enter a valid personal email address."
      );
      return;
    }

    if (
      profile.middle_name &&
      !/^[A-Za-z]$/.test(
        profile.middle_name.trim(),
      )
    ) {
      setError(
        "Middle name must contain exactly one alphabet character."
      );
      return;
    }

    if (profile.date_of_birth) {
      const selectedDate = new Date(
        profile.date_of_birth,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        setError(
          "Date of birth cannot be in the future."
        );
        return;
      }
    }
    try {
      setError(null);
      setSavingProfile(true);

      const updated =
        await studentService.updateProfile(
          profile.student_id,
          {
            first_name: profile.first_name,
            middle_name: profile.middle_name,
            last_name: profile.last_name,
            personal_email: profile.personal_email,
            contact_number: profile.contact_number,
            alternate_contact_number:
              profile.alternate_contact_number,
            gender: profile.gender,
            date_of_birth: profile.date_of_birth,
            placement_preference:
              profile.placement_preference,
          },
        );

      setProfile(updated);
      setOriginalProfile(updated);
      setError(null);
      setEditing(false);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "";

      if (
        message.includes("chk_contact_number")
      ) {
        setError(
          "Contact number must contain exactly 10 digits."
        );
      } else {
        setError(
          "Failed to update profile."
        );
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {loading && (
        <p className="mt-6">
          Loading...
        </p>
      )}

      {error && (
        <p className="mt-6 text-red-500">
          {error}
        </p>
      )}
      {!loading && !profile && !isInstitutionalEmail && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Institutional Email Required
          </h2>

          <p className="mt-2">
            Please sign in using your official Indus University email address.
          </p>

          <p className="mt-2 text-sm">
            Examples:
            <br />
            abc.it@indusuni.ac.in
            <br />
            xyz.23.cse@iite.indusuni.ac.in
          </p>
        </div>
      )}

      {!loading && !profile && isInstitutionalEmail && (
        <CompleteProfileForm
          authUserId={user?.id ?? ""}
          email={user?.email ?? ""}
          onCreated={() => window.location.assign("/onboarding")}
        />
      )}

      {profile && (
        <>

          <main className="mx-auto max-w-7xl px-6 py-10">
            <div
              className="
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-primary/10
        bg-gradient-to-r
        from-primary
        via-blue-700
        to-cyan-600
        p-8
        text-white
        shadow-xl
    "
            >
              <div className="flex items-center gap-5">
                <div
                  className="
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-3xl
                bg-white/20
                text-3xl
                font-bold
            "
                >
                  {profile?.first_name?.charAt(0) ?? "S"}
                </div>

                <div>
                  <div className="text-sm text-white/80">
                    Student Profile
                  </div>

                  <h1 className="mt-1 text-4xl font-bold tracking-tight">
                    {profile?.first_name} {profile?.last_name}
                  </h1>

                  <div className="mt-2 text-white/80">
                    {profile?.enrollment_no}
                  </div>
                </div>
              </div>
            </div>

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

              <div className="mb-6 flex justify-end gap-2">

                {!editing && (
                  <button
                    onClick={() => {
                      setError(null);
                      setEditing(true);
                    }}
                    className="
  rounded-xl
  bg-primary
  px-5
  py-2.5
  font-medium
  text-white
  transition-all
  hover:shadow-lg
"
                  >
                    Edit Profile
                  </button>
                )}

                {editing && (
                  <>
                    <button
                      onClick={() => {
                        if (originalProfile) {
                          setProfile({
                            ...originalProfile,
                          });
                        }

                        setError(null);
                        setEditing(false);
                      }}
                      className="rounded border px-4 py-2"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleProfileSave}
                      disabled={
                        savingProfile || !hasChanges
                      }
                      className="
  rounded-xl
  bg-primary
  px-5
  py-2.5
  font-medium
  text-white
  transition-all
  hover:shadow-lg
"
                    >
                      {savingProfile
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </>
                )}

              </div>

              <div className="grid gap-8 sm:grid-cols-2">

                <Field
                  label="Enrollment Number"
                  value={profile.enrollment_no}
                />

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      First Name
                    </p>

                    <input
                      className="w-full rounded border p-2"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="First Name"
                    value={profile.first_name}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Middle Name
                    </p>

                    <input
                      maxLength={1}
                      className="w-full rounded border p-2"
                      value={profile.middle_name ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          middle_name: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Middle Name"
                    value={profile.middle_name ?? "-"}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last Name
                    </p>

                    <input
                      className="w-full rounded border p-2"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Last Name"
                    value={profile.last_name}
                  />
                )}

                <Field
                  label="Institute Email"
                  value={profile.institute_email}
                />

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Personal Email
                    </p>

                    <input
                      type="email"
                      className="w-full rounded border p-2"
                      value={profile.personal_email ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          personal_email: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Personal Email"
                    value={profile.personal_email ?? "-"}
                  />
                )}
                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contact Number
                    </p>

                    <input
                      className="w-full rounded border p-2"
                      value={profile.contact_number}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          contact_number:
                            e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Contact Number"
                    value={profile.contact_number}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Alternate Contact
                    </p>

                    <input
                      className="w-full rounded border p-2"
                      value={profile.alternate_contact_number ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          alternate_contact_number:
                            e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Alternate Contact"
                    value={profile.alternate_contact_number ?? "-"}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Gender
                    </p>

                    <select
                      className="w-full rounded border p-2"
                      value={profile.gender ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                ) : (
                  <Field
                    label="Gender"
                    value={profile.gender ?? "-"}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Date Of Birth
                    </p>

                    <input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full rounded border p-2"
                      value={profile.date_of_birth ?? ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <Field
                    label="Date Of Birth"
                    value={profile.date_of_birth ?? "-"}
                  />
                )}

                {editing ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Placement Preference
                    </p>

                    <select
                      className="w-full rounded border p-2"
                      value={profile.placement_preference}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          placement_preference: e.target.value,
                        })
                      }
                    >
                      <option value="Interested">
                        Interested
                      </option>

                      <option value="Not Interested">
                        Not Interested
                      </option>

                      <option value="Higher Studies">
                        Higher Studies
                      </option>

                      <option value="Entrepreneurship">
                        Entrepreneurship
                      </option>
                    </select>
                  </div>
                ) : (
                  <Field
                    label="Placement Preference"
                    value={profile.placement_preference}
                  />
                )}

                <Field
                  label="Placement Status"
                  value={profile.placement_status ?? "-"}
                />
              </div>
            </div>

           <div
  className="
    mt-8
    rounded-3xl
    border
    border-border/50
    bg-white
    p-6
    shadow-sm
  "
>
  <SkillsSection
    studentId={profile.student_id}
  />
</div>

<div
  className="
    mt-8
    rounded-3xl
    border
    border-border/50
    bg-white
    p-6
    shadow-sm
  "
>
  <ResumeSection
    studentId={profile.student_id}
    authUserId={user?.id ?? ""}
    existingUrl={resumeUrl}
    onSaved={() =>
      loadResume(profile.student_id)
    }
  />
</div>

<div
  className="
    mt-8
    rounded-3xl
    border
    border-border/50
    bg-white
    p-6
    shadow-sm
  "
>
  {profile && (
    <AcademicSection
      studentId={profile.student_id}
      existingData={academicData}
      onSaved={() =>
        loadAcademicDetails(profile.student_id)
      }
    />
  )}
</div>
          </main>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-border/50
        bg-slate-50/60
        p-4
      "
    >
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function CompleteProfileForm({
  authUserId,
  email,
  onCreated,
}: {
  authUserId: string;
  email: string;
  onCreated: () => void;
}) {
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [alternateContactNumber, setAlternateContactNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placementPreference, setPlacementPreference] =
    useState("Interested");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const normalizedEnrollment = enrollmentNo
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!/^IU[0-9]{8,13}$/.test(normalizedEnrollment)) {
      setError(
        "Enrollment number must start with IU and contain 8 to 13 digits after it."
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(contactNumber)) {
      setError(
        "Contact number must contain exactly 10 digits."
      );
      return;
    }

    if (personalEmail) {
      const emailValue =
        personalEmail.trim().toLowerCase();

      if (
        !/^[a-z0-9]+([._%+-]?[a-z0-9]+)*@[a-z0-9-]+\.(com|in|org|edu|net)$/i.test(
          emailValue,
        )
      ) {
        setError(
          "Please enter a valid personal email address."
        );
        return;
      }
    }

    if (
      middleName &&
      !/^[A-Za-z]$/.test(
        middleName.trim(),
      )
    ) {
      setError(
        "Middle name must contain exactly one alphabet character."
      );
      return;
    }

    if (dateOfBirth) {
      const selectedDate = new Date(dateOfBirth);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        setError(
          "Date of birth cannot be in the future."
        );
        return;
      }
    }

    if (
      alternateContactNumber &&
      !/^[0-9]{10}$/.test(alternateContactNumber)
    ) {
      setError(
        "Alternate contact number must contain exactly 10 digits."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data: account, error: accountError } =
        await (supabase as any)
          .from("user_accounts")
          .select("user_id")
          .eq("auth_provider_id", authUserId)
          .maybeSingle()
      console.log(
        "ACCOUNT LOOKUP",
        account,
        accountError,
      );

      if (accountError) throw accountError;
      if (!account) {
        setError(
          "User account was not provisioned correctly. Please logout and login again."
        );

        return;
      }

      const { error: insertError } =
        await (supabase as any)
          .from("student_master")
          .insert({
            user_id: account.user_id,
            enrollment_no: normalizedEnrollment,
            first_name: firstName.trim(),
            middle_name: middleName.trim() || null,
            last_name: lastName.trim(),
            institute_email: email,
            personal_email: personalEmail.trim() || null,
            contact_number: contactNumber,
            alternate_contact_number:
              alternateContactNumber || null,
            gender: gender || null,
            date_of_birth: dateOfBirth || null,
            placement_preference: placementPreference,
            created_by_type: "User",
            is_active: true,
          });

      if (insertError) throw insertError;

      onCreated();
    }
    catch (err: any) {
      console.error(
        "PROFILE CREATE ERROR",
        err,
        JSON.stringify(err, null, 2),
      );

      const message = err?.message ?? "";

      if (
        message.includes("chk_enrollment_pattern")
      ) {
        setError(
          "Enrollment number must start with IU followed by numbers only. Example: IU2341230377"
        );
      } else if (
        message.includes("chk_contact_number")
      ) {
        setError(
          "Contact number must contain exactly 10 digits."
        );
      } else if (
        message.includes("student_master_enrollment_no_key")
      ) {
        setError(
          "This enrollment number is already registered."
        );
      } else {
        setError(
          "Unable to create profile. Please try again."
        );
      }
    }
    finally {
      setSaving(false);
    }
  };

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
      <h2 className="mb-4 text-lg font-semibold">
        Complete Your Profile
      </h2>

      {error && (
        <p className="mb-4 text-red-500">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
      >
        <input
          className="rounded border p-2"
          placeholder="Enrollment Number"
          value={enrollmentNo}
          onChange={(e) =>
            setEnrollmentNo(e.target.value)
          }
          required
        />

        <input
          className="rounded border p-2"
          placeholder="First Name"
          value={firstName}
          onChange={(e) =>
            setFirstName(e.target.value)
          }
          required
        />

        <input
          className="rounded border p-2"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) =>
            setLastName(e.target.value)
          }
          required
        />

        <input
          className="rounded border p-2"
          placeholder="Middle Name (Optional)"
          value={middleName}
          onChange={(e) =>
            setMiddleName(e.target.value)
          }
        />

        <input
          className="rounded border p-2"
          placeholder="Personal Email (Optional)"
          value={personalEmail}
          onChange={(e) =>
            setPersonalEmail(e.target.value)
          }
        />

        <input
          className="rounded border p-2"
          placeholder="Contact Number"
          maxLength={10}
          value={contactNumber}
          onChange={(e) =>
            setContactNumber(
              e.target.value.replace(/\D/g, "")
            )
          }
          required
        />

        <input
          className="rounded border p-2"
          placeholder="Alternate Contact Number (Optional)"
          maxLength={10}
          value={contactNumber}
          onChange={(e) =>
            setContactNumber(
              e.target.value.replace(/\D/g, "")
            )
          }
          required
        />

        <select
          className="rounded border p-2"
          value={gender}
          onChange={(e) =>
            setGender(e.target.value)
          }
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          className="rounded border p-2"
          max={new Date().toISOString().split("T")[0]}
          value={dateOfBirth}
          onChange={(e) =>
            setDateOfBirth(e.target.value)
          }
        />

        <select
          className="rounded border p-2"
          value={placementPreference}
          onChange={(e) =>
            setPlacementPreference(e.target.value)
          }
        >
          <option value="Interested">
            Interested
          </option>

          <option value="Not Interested">
            Not Interested
          </option>

          <option value="Higher Studies">
            Higher Studies
          </option>

          <option value="Entrepreneurship">
            Entrepreneurship
          </option>
        </select>

        <button
          type="submit"
          disabled={saving}
          className="
  rounded-xl
  bg-primary
  px-5
  py-2.5
  font-medium
  text-white
  transition-all
  hover:shadow-lg
"
        >
          {saving
            ? "Saving..."
            : "Create Profile"}
        </button>
      </form>
    </div>
  );
}