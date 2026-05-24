import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/studentService";
import { supabase } from "@/lib/supabase";
import type { StudentMaster } from "@/types/student";

type Mode = "view";

export function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    studentService
      .getProfileByUserId(user.id)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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
        {!loading && !profile && (
          <CompleteProfileForm
            authUserId={user?.id ?? ""}
            email={user?.email ?? ""}
            onCreated={() => window.location.reload()}
          />
        )}

        {profile && (
          <div className="mt-6 grid gap-4 rounded border p-6 sm:grid-cols-2">

            <Field
              label="Enrollment Number"
              value={profile.enrollment_no}
            />

            <Field
              label="First Name"
              value={profile.first_name}
            />

            <Field
              label="Middle Name"
              value={profile.middle_name ?? "-"}
            />

            <Field
              label="Last Name"
              value={profile.last_name}
            />

            <Field
              label="Institute Email"
              value={profile.institute_email}
            />

            <Field
              label="Personal Email"
              value={profile.personal_email ?? "-"}
            />

            <Field
              label="Contact Number"
              value={profile.contact_number}
            />

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
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
            enrollment_no: enrollmentNo,
            first_name: firstName,
            last_name: lastName,
            institute_email: email,
            contact_number: contactNumber,
            placement_preference: "Interested",
            created_by_type: "User",
            is_active: true,
          });

      if (insertError) throw insertError;

      onCreated();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to create profile");
    } finally {
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
          placeholder="Contact Number"
          value={contactNumber}
          onChange={(e) =>
            setContactNumber(e.target.value)
          }
          required
        />

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