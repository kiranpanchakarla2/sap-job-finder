import { createClient } from "@/lib/supabase/client";
import {
  mapTalentCandidate,
  mapTalentError,
  mapTalentSearchResult,
  talentErrorMessage,
} from "../lib/mappers";
import type {
  TalentCandidate,
  TalentSearchQuery,
  TalentSearchResult,
  TalentSearchServiceResult,
} from "../types/talentSearch.types";

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[talentSearchService] ${context}`, error);
  }
}

function emptyToNull(values: string[]): string[] | null {
  return values.length ? values : null;
}

export type TalentUsage = {
  used: number;
  limit: number | null;
  periodStart: string | null;
  periodEnd: string | null;
};

/**
 * Talent Search B — Supabase-backed service.
 * All candidate data is returned via SECURITY DEFINER RPCs (safe fields only).
 */
export const talentSearchService = {
  async searchCandidates(
    query: TalentSearchQuery,
  ): Promise<TalentSearchServiceResult<TalentSearchResult>> {
    try {
      const supabase = createClient();
      const { filters, sort, page, pageSize } = query;
      const { data, error } = await supabase.rpc("search_talent_candidates", {
        p_keyword: filters.keyword.trim() || null,
        p_modules: emptyToNull(filters.modules),
        p_skills: emptyToNull(filters.skills),
        p_experience_bands: emptyToNull(filters.experienceBands),
        p_experience_min: filters.experienceMin,
        p_countries: emptyToNull(filters.countries),
        p_location_query: filters.locationQuery.trim() || null,
        p_work_modes: emptyToNull(filters.workModes),
        p_employment_types: emptyToNull(filters.employmentTypes),
        p_availability: emptyToNull(filters.availability),
        p_candidate_status: emptyToNull(filters.candidateStatus),
        p_certifications: emptyToNull(filters.certifications),
        p_languages: emptyToNull(filters.languages),
        p_sort: sort,
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) {
        logError("searchCandidates", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }

      const mapped = mapTalentSearchResult(data);
      if (!mapped) {
        return { success: false, error: talentErrorMessage("GENERIC") };
      }
      return { success: true, data: mapped };
    } catch (error) {
      logError("searchCandidates", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async getCandidate(
    candidateId: string,
  ): Promise<TalentSearchServiceResult<TalentCandidate>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_talent_candidate", {
        p_candidate_id: candidateId,
      });

      if (error) {
        logError("getCandidate", error);
        const code = mapTalentError(error);
        return {
          success: false,
          error: talentErrorMessage(code),
          code,
        };
      }

      const mapped = mapTalentCandidate(data);
      if (!mapped) {
        return {
          success: false,
          error: talentErrorMessage("CANDIDATE_NOT_AVAILABLE"),
          code: "CANDIDATE_NOT_AVAILABLE",
        };
      }
      return { success: true, data: mapped };
    } catch (error) {
      logError("getCandidate", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async getSavedCandidates(): Promise<
    TalentSearchServiceResult<{ items: TalentCandidate[]; ids: string[] }>
  > {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("list_saved_talent_candidates");
      if (error) {
        logError("getSavedCandidates", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }

      const row = (data ?? {}) as { items?: unknown; ids?: unknown };
      const items = Array.isArray(row.items)
        ? row.items
            .map((item) => mapTalentCandidate(item))
            .filter((item): item is TalentCandidate => Boolean(item))
        : [];
      const ids = Array.isArray(row.ids)
        ? row.ids.filter((id): id is string => typeof id === "string")
        : items.map((item) => item.id);

      return { success: true, data: { items, ids } };
    } catch (error) {
      logError("getSavedCandidates", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  /** @deprecated use getSavedCandidates — kept for Talent Search A call sites */
  async getCandidatesByIds(
    ids: string[],
  ): Promise<TalentSearchServiceResult<TalentCandidate[]>> {
    const saved = await this.getSavedCandidates();
    if (!saved.success) return saved;
    const idSet = new Set(ids);
    return {
      success: true,
      data: saved.data.items.filter((item) => idSet.has(item.id)),
    };
  },

  async saveCandidate(
    candidateId: string,
  ): Promise<TalentSearchServiceResult<{ ok: true }>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("save_talent_candidate", {
        p_candidate_id: candidateId,
      });
      if (error) {
        logError("saveCandidate", error);
        const code = mapTalentError(error);
        return { success: false, error: talentErrorMessage(code), code };
      }
      return { success: true, data: { ok: true } };
    } catch (error) {
      logError("saveCandidate", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async removeSavedCandidate(
    candidateId: string,
  ): Promise<TalentSearchServiceResult<{ ok: true }>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("remove_saved_talent_candidate", {
        p_candidate_id: candidateId,
      });
      if (error) {
        logError("removeSavedCandidate", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }
      return { success: true, data: { ok: true } };
    } catch (error) {
      logError("removeSavedCandidate", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async shortlistCandidate(
    candidateId: string,
  ): Promise<TalentSearchServiceResult<{ ok: true }>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("shortlist_talent_candidate", {
        p_candidate_id: candidateId,
      });
      if (error) {
        logError("shortlistCandidate", error);
        const code = mapTalentError(error);
        return { success: false, error: talentErrorMessage(code), code };
      }
      return { success: true, data: { ok: true } };
    } catch (error) {
      logError("shortlistCandidate", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async removeFromShortlist(
    candidateId: string,
  ): Promise<TalentSearchServiceResult<{ ok: true }>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc(
        "remove_shortlisted_talent_candidate",
        { p_candidate_id: candidateId },
      );
      if (error) {
        logError("removeFromShortlist", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }
      return { success: true, data: { ok: true } };
    } catch (error) {
      logError("removeFromShortlist", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async listShortlistedIds(): Promise<TalentSearchServiceResult<string[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "list_shortlisted_talent_candidate_ids",
      );
      if (error) {
        logError("listShortlistedIds", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }
      const ids = Array.isArray(data)
        ? data.filter((id): id is string => typeof id === "string")
        : [];
      return { success: true, data: ids };
    } catch (error) {
      logError("listShortlistedIds", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },

  async getUsage(): Promise<TalentSearchServiceResult<TalentUsage>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_talent_search_usage");
      if (error) {
        logError("getUsage", error);
        return {
          success: false,
          error: talentErrorMessage(mapTalentError(error)),
          code: mapTalentError(error),
        };
      }
      const row = (data ?? {}) as Record<string, unknown>;
      return {
        success: true,
        data: {
          used: typeof row.used === "number" ? row.used : 0,
          limit: typeof row.limit === "number" ? row.limit : null,
          periodStart:
            typeof row.periodStart === "string" ? row.periodStart : null,
          periodEnd: typeof row.periodEnd === "string" ? row.periodEnd : null,
        },
      };
    } catch (error) {
      logError("getUsage", error);
      return { success: false, error: talentErrorMessage("GENERIC") };
    }
  },
};
