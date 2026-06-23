import { supabase } from "@/lib/supabase";

export async function getPendingOnboardingDrafts() {
  const { data, error } = await (supabase as any).from("student_onboarding_drafts").select("*");

  console.log("SERVICE DATA", data);

  console.log("SERVICE ERROR", error);

  if (error) {
    throw error;
  }

  return data ?? [];
}
