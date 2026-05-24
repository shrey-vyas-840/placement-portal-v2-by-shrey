import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/studentService";
import { supabase } from "@/lib/supabase";
import type { StudentMaster } from "@/types/student";

type Mode = "view";

export function ProfilePage() {
  const { user } = useAuth();
  const isInstitutionalEmail =
    !!user?.email &&
    /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)?indusuni\.ac\.in$/i.test(
      user.email,
    );
  const [profile, setProfile] = useState<StudentMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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

  const handleProfileSave = async () => {
    if (!profile) return;
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
    try {
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

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">
          Student Profile
        </h1>

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
            onCreated={() => window.location.reload()}
          />
        )}

        {profile && (
          <div className="mt-6 rounded border p-6">

            <div className="mb-6 flex justify-end gap-2">

              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded bg-black px-4 py-2 text-white"
                >
                  Edit Profile
                </button>
              )}

              {editing && (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="rounded bg-black px-4 py-2 text-white"
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </>
              )}

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

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
                        contact_number: e.target.value,
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

              <Field
                label="Alternate Contact"
                value={profile.alternate_contact_number ?? "-"}
              />

              <Field
                label="Gender"
                value={profile.gender ?? "-"}
              />

              <Field
                label="Date Of Birth"
                value={profile.date_of_birth ?? "-"}
              />

              <Field
                label="Placement Preference"
                value={profile.placement_preference}
              />

              <Field
                label="Placement Status"
                value={profile.placement_status ?? "-"}
              />
            </div>
          </div>
        )}
      </main>
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
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="font-medium">
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
      setError(null);
      setSavingProfile(true);
      setError("");

      const { data: account, error: accountError } =
        await (supabase as any)
          .from("user_accounts")
          .select("user_id")
          .eq("auth_provider_id", authUserId)
          .single();

      if (accountError) throw accountError;

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
      console.error(err);

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
    <div className="mt-6 rounded border p-6">
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
          value={contactNumber}
          onChange={(e) =>
            setContactNumber(e.target.value)
          }
          required
        />

        <input
          className="rounded border p-2"
          placeholder="Alternate Contact Number (Optional)"
          value={alternateContactNumber}
          onChange={(e) =>
            setAlternateContactNumber(e.target.value)
          }
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
          className="rounded bg-black px-4 py-2 text-white"
        >
          {saving
            ? "Saving..."
            : "Create Profile"}
        </button>
      </form>
    </div>
  );
}