import { generateUuid } from "@/lib/generateUuid";
import { supabase } from "@/lib/supabase";

type AuthContext = {
  authUserId: string;
  appUserId: string;
  email: string;
  roleNames: string[];
};

type ApprovalContext = {
  request: any | null;
  tokenRow: any | null;
  expiresAt: string | null;
  isExpired: boolean;
  identifier: string;
};

function normalizeEmail(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isExpiredAt(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

function buildReviewUrl(token: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/hod/review/${token}`;
  }
  return `/hod/review/${token}`;
}

export const hodService = {
  async getCurrentAuthContext(): Promise<AuthContext> {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const authUser = authData.user;
    if (!authUser) {
      throw new Error("User not logged in.");
    }

    const { data: account, error: accountError } = await (supabase as any)
      .from("user_accounts")
      .select("user_id, email_address")
      .eq("auth_provider_id", authUser.id)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) {
      throw new Error("Account mapping not found.");
    }

    const { data: userRoles, error: userRolesError } = await (supabase as any)
      .from("user_roles")
      .select("role_id")
      .eq("user_id", account.user_id)
      .eq("is_active", true);

    if (userRolesError) throw userRolesError;

    const roleIds = (userRoles ?? []).map((row: any) => row.role_id).filter(Boolean);

    let roleNames: string[] = [];
    if (roleIds.length > 0) {
      const { data: roles, error: rolesError } = await (supabase as any)
        .from("roles")
        .select("role_name")
        .in("role_id", roleIds)
        .eq("is_active", true);

      if (rolesError) throw rolesError;

      roleNames = (roles ?? []).map((row: any) => row.role_name).filter(Boolean);
    }

    return {
      authUserId: authUser.id,
      appUserId: account.user_id,
      email: normalizeEmail(account.email_address ?? authUser.email),
      roleNames,
    };
  },

  async requireHodAccess() {
    const ctx = await this.getCurrentAuthContext();

    const mappedBranches = await this.getMappedBranchesForEmail(ctx.email);

    const hasRoleAccess = ctx.roleNames.includes("Admin") || ctx.roleNames.includes("HOD");

    const hasMappingAccess = mappedBranches.length > 0;

    if (!hasRoleAccess && !hasMappingAccess) {
      throw new Error("Unauthorized");
    }

    return ctx;
  },

  async getMappedBranchesForEmail(email: string) {
    const { data, error } = await (supabase as any)
      .from("branch_hod_mapping")
      .select("*")
      .eq("hod_email", normalizeEmail(email))
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getRequestsByEmailAndStatus(email: string, statuses: string[]) {
    let query = (supabase as any)
      .from("noc_requests")
      .select("*")
      .eq("hod_email", normalizeEmail(email))
      .order("created_at", { ascending: false });

    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in("status", statuses);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data ?? [];
  },

  async getTokenRowsForRequestIds(requestIds: string[]) {
    if (!requestIds.length) return [];

    const { data, error } = await (supabase as any)
      .from("noc_approval_tokens")
      .select("*")
      .in("noc_request_id", requestIds);

    if (error) throw error;
    return data ?? [];
  },

  async getPendingRequests(email: string) {
    const rows = await this.getRequestsByEmailAndStatus(email, ["PENDING_HOD_APPROVAL"]);

    const tokens = await this.getTokenRowsForRequestIds(rows.map((row: any) => row.noc_request_id));

    const tokenMap = new Map<string, any>();
    tokens.forEach((row: any) => tokenMap.set(row.noc_request_id, row));

    return rows.map((row: any) => {
      const tokenRow = tokenMap.get(row.noc_request_id) ?? null;
      const expiresAt = tokenRow?.expires_at ?? row.hod_approval_deadline ?? null;

      return {
        ...row,
        approval_token: tokenRow?.token ?? null,
        approval_token_used_at: tokenRow?.used_at ?? null,
        approval_token_expires_at: expiresAt,
        is_expired: isExpiredAt(expiresAt),
      };
    });
  },

  async getApprovedHistory(email: string) {
    const { data, error } = await (supabase as any)
      .from("noc_requests")
      .select("*")
      .eq("hod_email", normalizeEmail(email))
      .eq("approval_source", "HOD_APPROVED")
      .order("approved_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getRejectedHistory(email: string) {
    const { data, error } = await (supabase as any)
      .from("noc_requests")
      .select("*")
      .eq("hod_email", normalizeEmail(email))
      .eq("status", "HOD_REJECTED")
      .order("rejection_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getDashboardData() {
    const ctx = await this.requireHodAccess();
    const email = ctx.email;

    const [branches, pending, approved, rejected] = await Promise.all([
      this.getMappedBranchesForEmail(email),
      this.getPendingRequests(email),
      this.getApprovedHistory(email),
      this.getRejectedHistory(email),
    ]);

    return {
      email,
      roleNames: ctx.roleNames,
      branches,
      pending,
      approved,
      rejected,
    };
  },

  async createOrRefreshApprovalToken(nocRequestId: string, expiresAt: string) {
    const token = generateUuid();
    const now = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from("noc_approval_tokens")
      .upsert(
        {
          noc_request_id: nocRequestId,
          token,
          expires_at: expiresAt,
          used_at: null,
          action: "HOD_REVIEW",
          created_at: now,
        },
        {
          onConflict: "noc_request_id",
        },
      )
      .select("*")
      .single();

    if (error) throw error;

    return {
      ...data,
      review_url: buildReviewUrl(token),
    };
  },

  async getApprovalContext(identifier: string): Promise<ApprovalContext> {
    const trimmed = (identifier ?? "").trim();

    const { data: tokenRow, error: tokenError } = await (supabase as any)

      .from("noc_approval_tokens")

      .select("*")

      .eq("token", trimmed)

      .maybeSingle();

    if (tokenError) throw tokenError;

    if (!tokenRow) {
      return {
        request: null,

        tokenRow: null,

        expiresAt: null,

        isExpired: true,

        identifier: trimmed,
      };
    }

    const { data: request, error: requestError } = await (supabase as any)

      .from("noc_requests")

      .select("*")

      .eq("noc_request_id", tokenRow.noc_request_id)

      .maybeSingle();

    if (requestError) throw requestError;

    const expiresAt = tokenRow.expires_at ?? request?.hod_approval_deadline ?? null;

    return {
      request: request ?? null,

      tokenRow,

      expiresAt,

      isExpired: isExpiredAt(expiresAt),

      identifier: trimmed,
    };
  },

  async getReviewContext(identifier: string) {
    const ctx = await this.requireHodAccess();
    const reviewContext = await this.getApprovalContext(identifier);

    if (!reviewContext.request) {
      throw new Error("NOC request not found.");
    }

    const requestEmail = normalizeEmail(reviewContext.request.hod_email);
    const isAdmin = ctx.roleNames.includes("Admin");

    if (!isAdmin && requestEmail !== ctx.email) {
      throw new Error("Access denied.");
    }

    return {
      ...reviewContext,
      currentUser: ctx,
    };
  },

  async approveByToken(identifier: string) {
    const ctx = await this.getReviewContext(identifier);

    if (!ctx.request) throw new Error("NOC request not found.");

    if (ctx.request.status !== "PENDING_HOD_APPROVAL") {
      throw new Error("Request already processed.");
    }

    if (ctx.request.status !== "PENDING_HOD_APPROVAL") {
      throw new Error("Request already processed.");
    }
    if (ctx.isExpired) throw new Error("Approval link expired.");
    if (ctx.tokenRow?.used_at) throw new Error("This link has already been used.");

    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("noc_requests")
      .update({
        status: "PENDING_PRINT",
        approval_source: "HOD_APPROVED",
        approved_at: now,
        rejection_reason: null,
        rejected_by: null,
        rejection_at: null,
      })
      .eq("noc_request_id", ctx.request.noc_request_id);

    if (error) throw error;

    if (ctx.tokenRow) {
      const { error: tokenUpdateError } = await (supabase as any)
        .from("noc_approval_tokens")
        .update({
          used_at: now,
          action: "HOD_APPROVED",
        })
        .eq("token_id", ctx.tokenRow.token_id);

      if (tokenUpdateError) throw tokenUpdateError;
    }

    return true;
  },

  async rejectByToken(identifier: string, reason: string) {
    const ctx = await this.getReviewContext(identifier);

    if (!ctx.request) throw new Error("NOC request not found.");
    if (ctx.isExpired) throw new Error("Approval link expired.");
    if (ctx.tokenRow?.used_at) throw new Error("This link has already been used.");

    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("noc_requests")
      .update({
        status: "HOD_REJECTED",
        rejection_reason: reason,
        rejected_by: "HOD",
        rejection_at: now,
      })
      .eq("noc_request_id", ctx.request.noc_request_id);

    if (error) throw error;

    if (ctx.tokenRow) {
      const { error: tokenUpdateError } = await (supabase as any)
        .from("noc_approval_tokens")
        .update({
          used_at: now,
          action: "HOD_REJECTED",
        })
        .eq("token_id", ctx.tokenRow.token_id);

      if (tokenUpdateError) throw tokenUpdateError;
    }

    return true;
  },
};
