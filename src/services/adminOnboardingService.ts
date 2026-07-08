import { supabase } from "@/lib/supabase";

export interface OnboardingSearchParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getPendingOnboardingDrafts(params: OnboardingSearchParams = {}) {
  const { search = "", status = "", page = 1, pageSize = 100 } = params;

  let query = (supabase as any).from("student_onboarding_drafts").select("*", { count: "exact" });

  if (status && status !== "ALL") {
    query = query.eq("approval_status", status);
  }

  if (search.trim()) {
    query = query.or(
      [
        `enrollment_no.ilike.%${search}%`,
        `email_address.ilike.%${search}%`,
        `approval_status.ilike.%${search}%`,
      ].join(","),
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    rows: data ?? [],
    totalRows: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    currentPage: page,
  };
}

export async function searchOnboardingStudents(search: string) {
  if (!search.trim()) {
    return [];
  }

  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .or(
      [
        `enrollment_no.ilike.%${search}%`,
        `email_address.ilike.%${search}%`,
      ].join(","),
    )
    .order("updated_at", { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  return data ?? [];
}