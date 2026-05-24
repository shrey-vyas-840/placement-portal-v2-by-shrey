import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function CompleteProfilePage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    enrollment_no: "",
    first_name: "",
    last_name: "",
    contact_number: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const { data: account, error: accountError } = await (supabase as any)
        .from("user_accounts")
        .select("user_id")
        .eq("auth_provider_id", user.id)
        .single();

      if (accountError) throw accountError;

      const { error: insertError } = await (supabase as any)
        .from("student_master")
        .insert({
          user_id: account.user_id,
          enrollment_no: form.enrollment_no,
          first_name: form.first_name,
          last_name: form.last_name,
          institute_email: user.email,
          contact_number: form.contact_number,
          placement_preference: "Interested",
          created_by_type: "User",
          is_active: true,
        });

      if (insertError) throw insertError;

      window.location.href = "/profile";
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Complete Your Profile
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 p-3 text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          className="w-full rounded border p-2"
          placeholder="Enrollment Number (Example: IU939292929)"
          value={form.enrollment_no}
          onChange={(e) =>
            setForm({
              ...form,
              enrollment_no: e.target.value,
            })
          }
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="First Name"
          value={form.first_name}
          onChange={(e) =>
            setForm({
              ...form,
              first_name: e.target.value,
            })
          }
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Last Name"
          value={form.last_name}
          onChange={(e) =>
            setForm({
              ...form,
              last_name: e.target.value,
            })
          }
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Contact Number"
          value={form.contact_number}
          onChange={(e) =>
            setForm({
              ...form,
              contact_number: e.target.value,
            })
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white"
        >
          {loading ? "Saving..." : "Create Profile"}
        </button>
      </form>
    </div>
  );
}