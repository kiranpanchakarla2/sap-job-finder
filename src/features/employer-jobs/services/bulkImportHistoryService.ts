import { createClient } from "@/lib/supabase/client";
import type {
  BulkImportDateFilter,
  BulkImportHistoryFilter,
  BulkImportHistoryResponse,
  BulkImportRowRecord,
  BulkImportRowsFilter,
  BulkImportRowsResponse,
  BulkImportSession,
  BulkImportSessionDetails,
} from "../types/bulkUpload.types";

export type BulkImportServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type CompanyContext = {
  userId: string;
  companyId: string;
};

async function requireCompanyContext(): Promise<
  BulkImportServiceResult<CompanyContext>
> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Please sign in again to continue." };
  }

  // Resolve active employer account or company profile
  const { data: account, error: accountError } = await supabase
    .from("employer_accounts")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (account?.company_id) {
    return {
      success: true,
      data: { userId: user.id, companyId: account.company_id },
    };
  }

  // Fallback to company_profiles
  const { data: company, error: companyError } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (company?.id) {
    return {
      success: true,
      data: { userId: user.id, companyId: company.id },
    };
  }

  return {
    success: false,
    error: "Company profile required to access bulk upload history.",
  };
}

function getDateThreshold(filter?: BulkImportDateFilter): string | null {
  if (!filter || filter === "all") return null;
  const now = new Date();
  if (filter === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today.toISOString();
  }
  if (filter === "7days") {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  if (filter === "30days") {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  return null;
}

export const bulkImportHistoryService = {
  /**
   * Fetches paginated, company-scoped bulk upload history.
   */
  async listImportHistory(
    filter: BulkImportHistoryFilter = {}
  ): Promise<BulkImportServiceResult<BulkImportHistoryResponse>> {
    try {
      const ctx = await requireCompanyContext();
      if (!ctx.success) return ctx;

      const supabase = createClient();
      const page = Math.max(1, filter.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("bulk_imports")
        .select(
          "id, company_id, uploaded_by, file_name, file_size, file_type, total_rows, selected_rows, created_count, skipped_count, failed_count, status, created_at, completed_at",
          { count: "exact" }
        )
        .eq("company_id", ctx.data.companyId);

      if (filter.status && filter.status !== "all") {
        query = query.eq("status", filter.status);
      }

      if (filter.search && filter.search.trim()) {
        query = query.ilike("file_name", `%${filter.search.trim()}%`);
      }

      const dateThreshold = getDateThreshold(filter.dateRange);
      if (dateThreshold) {
        query = query.gte("created_at", dateThreshold);
      }

      query = query.order("created_at", { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("[bulkImportHistoryService] listImportHistory error:", error);
        return {
          success: false,
          error: "We couldn't load your bulk upload history. Please try again.",
        };
      }

      const rawRows = (data ?? []) as Array<{
        id: string;
        company_id: string;
        uploaded_by: string;
        file_name: string;
        file_size: number | null;
        file_type: string;
        total_rows: number;
        selected_rows: number;
        created_count: number;
        skipped_count: number;
        failed_count: number;
        status: "processing" | "completed" | "completed_with_warnings" | "failed";
        created_at: string;
        completed_at: string | null;
      }>;

      // Fetch uploader names in batch for records
      const uploaderIds = Array.from(new Set(rawRows.map((r) => r.uploaded_by)));
      const uploaderMap = new Map<string, { name: string; email: string }>();

      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", uploaderIds);

        if (profiles) {
          for (const p of profiles) {
            const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
            uploaderMap.set(p.user_id, {
              name: name || p.email || "Team Member",
              email: p.email || "",
            });
          }
        }
      }

      const items: BulkImportSession[] = rawRows.map((r) => {
        const uploader = uploaderMap.get(r.uploaded_by);
        return {
          id: r.id,
          companyId: r.company_id,
          uploadedBy: r.uploaded_by,
          uploaderName: uploader?.name || (r.uploaded_by === ctx.data.userId ? "You" : "Team Member"),
          uploaderEmail: uploader?.email || null,
          fileName: r.file_name,
          fileSize: r.file_size,
          fileType: r.file_type,
          totalRows: r.total_rows,
          selectedRows: r.selected_rows,
          createdCount: r.created_count,
          skippedCount: r.skipped_count,
          failedCount: r.failed_count,
          status: r.status,
          createdAt: r.created_at,
          completedAt: r.completed_at,
        };
      });

      const totalCount = count ?? items.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      return {
        success: true,
        data: {
          items,
          totalCount,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (err) {
      console.error("[bulkImportHistoryService] unexpected error:", err);
      return {
        success: false,
        error: "An unexpected error occurred while loading history.",
      };
    }
  },

  /**
   * Fetches single import session and all its rows (for details view & reports).
   */
  async getImportDetails(
    importId: string
  ): Promise<BulkImportServiceResult<BulkImportSessionDetails>> {
    try {
      const ctx = await requireCompanyContext();
      if (!ctx.success) return ctx;

      const supabase = createClient();

      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from("bulk_imports")
        .select(
          "id, company_id, uploaded_by, file_name, file_size, file_type, total_rows, selected_rows, created_count, skipped_count, failed_count, status, created_at, completed_at"
        )
        .eq("id", importId)
        .eq("company_id", ctx.data.companyId)
        .maybeSingle();

      if (sessionError || !sessionData) {
        console.error("[bulkImportHistoryService] getImportDetails session error:", sessionError);
        return {
          success: false,
          error: "Bulk import session not found or you do not have permission to view it.",
        };
      }

      // Fetch uploader info
      let uploaderName: string | null = null;
      let uploaderEmail: string | null = null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("user_id", sessionData.uploaded_by)
        .maybeSingle();

      if (profile) {
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
        uploaderName = name || profile.email || "Team Member";
        uploaderEmail = profile.email || null;
      }

      const session: BulkImportSession = {
        id: sessionData.id,
        companyId: sessionData.company_id,
        uploadedBy: sessionData.uploaded_by,
        uploaderName: uploaderName || (sessionData.uploaded_by === ctx.data.userId ? "You" : "Team Member"),
        uploaderEmail,
        fileName: sessionData.file_name,
        fileSize: sessionData.file_size,
        fileType: sessionData.file_type,
        totalRows: sessionData.total_rows,
        selectedRows: sessionData.selected_rows,
        createdCount: sessionData.created_count,
        skippedCount: sessionData.skipped_count,
        failedCount: sessionData.failed_count,
        status: sessionData.status,
        createdAt: sessionData.created_at,
        completedAt: sessionData.completed_at,
      };

      // Fetch all rows for this import session
      const { data: rowsData, error: rowsError } = await supabase
        .from("bulk_import_rows")
        .select("id, bulk_import_id, row_number, job_title, status, reason, job_id, created_at")
        .eq("bulk_import_id", importId)
        .order("row_number", { ascending: true });

      if (rowsError) {
        console.error("[bulkImportHistoryService] getImportDetails rows error:", rowsError);
      }

      const rows: BulkImportRowRecord[] = (rowsData ?? []).map((r) => ({
        id: r.id,
        bulkImportId: r.bulk_import_id,
        rowNumber: r.row_number,
        jobTitle: r.job_title,
        status: r.status as "created" | "skipped" | "failed",
        reason: r.reason,
        jobId: r.job_id,
        createdAt: r.created_at,
      }));

      return {
        success: true,
        data: {
          session,
          rows,
          counts: {
            total: session.totalRows,
            created: session.createdCount,
            skipped: session.skippedCount,
            failed: session.failedCount,
          },
        },
      };
    } catch (err) {
      console.error("[bulkImportHistoryService] unexpected error:", err);
      return {
        success: false,
        error: "An unexpected error occurred while loading import details.",
      };
    }
  },

  /**
   * Fetches paginated/filtered row results for an import session.
   */
  async getImportRows(
    importId: string,
    filter: BulkImportRowsFilter = {}
  ): Promise<BulkImportServiceResult<BulkImportRowsResponse>> {
    try {
      const ctx = await requireCompanyContext();
      if (!ctx.success) return ctx;

      const supabase = createClient();
      const page = Math.max(1, filter.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 25));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Verify parent import belongs to company
      const { data: parentCheck } = await supabase
        .from("bulk_imports")
        .select("id")
        .eq("id", importId)
        .eq("company_id", ctx.data.companyId)
        .maybeSingle();

      if (!parentCheck) {
        return {
          success: false,
          error: "Import session not found or unauthorized.",
        };
      }

      let query = supabase
        .from("bulk_import_rows")
        .select("id, bulk_import_id, row_number, job_title, status, reason, job_id, created_at", {
          count: "exact",
        })
        .eq("bulk_import_id", importId);

      if (filter.status && filter.status !== "all") {
        query = query.eq("status", filter.status);
      }

      if (filter.search && filter.search.trim()) {
        const q = filter.search.trim();
        query = query.or(`job_title.ilike.%${q}%,reason.ilike.%${q}%`);
      }

      query = query.order("row_number", { ascending: true }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("[bulkImportHistoryService] getImportRows error:", error);
        return {
          success: false,
          error: "Unable to load import row results.",
        };
      }

      const items: BulkImportRowRecord[] = (data ?? []).map((r) => ({
        id: r.id,
        bulkImportId: r.bulk_import_id,
        rowNumber: r.row_number,
        jobTitle: r.job_title,
        status: r.status as "created" | "skipped" | "failed",
        reason: r.reason,
        jobId: r.job_id,
        createdAt: r.created_at,
      }));

      const totalCount = count ?? items.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      return {
        success: true,
        data: {
          items,
          totalCount,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (err) {
      console.error("[bulkImportHistoryService] unexpected error:", err);
      return {
        success: false,
        error: "An unexpected error occurred while loading row results.",
      };
    }
  },
};
