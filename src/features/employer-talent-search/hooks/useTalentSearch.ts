"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEmptyFilters,
  DEFAULT_PAGE_SIZE,
} from "../config/talentSearchFilters";
import {
  buildActiveFilterChips,
  removeFilterChip,
} from "../lib/filterTalent";
import { talentSearchService } from "../services/talentSearchService";
import type {
  ActiveFilterChip,
  TalentSearchFilters,
  TalentSearchResult,
  TalentSearchSort,
  TalentViewMode,
} from "../types/talentSearch.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useTalentSearch() {
  const [filters, setFilters] = useState<TalentSearchFilters>(createEmptyFilters);
  const [sort, setSortState] = useState<TalentSearchSort>("relevance");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<TalentViewMode>("list");
  const [result, setResult] = useState<TalentSearchResult | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState("");

  const load = useCallback(
    async (
      nextFilters: TalentSearchFilters,
      nextSort: TalentSearchSort,
      nextPage: number,
    ) => {
      setStatus("loading");
      setError(null);
      const response = await talentSearchService.searchCandidates({
        filters: nextFilters,
        sort: nextSort,
        page: nextPage,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      if (!response.success) {
        setResult(null);
        setError(response.error);
        setStatus("error");
        return;
      }
      setResult(response.data);
      setPage(response.data.page);
      setStatus("success");
    },
    [],
  );

  useEffect(() => {
    void load(filters, sort, page);
  }, [filters, sort, page, load]);

  const applyKeywordSearch = useCallback(() => {
    setPage(1);
    setFilters((prev) => ({ ...prev, keyword: keywordDraft.trim() }));
  }, [keywordDraft]);

  const updateFilters = useCallback((patch: Partial<TalentSearchFilters>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const replaceFilters = useCallback((next: TalentSearchFilters) => {
    setPage(1);
    setFilters(next);
    setKeywordDraft(next.keyword);
  }, []);

  const clearFilters = useCallback(() => {
    const empty = createEmptyFilters();
    setKeywordDraft("");
    setPage(1);
    setFilters(empty);
  }, []);

  const removeChip = useCallback((chip: ActiveFilterChip) => {
    setPage(1);
    setFilters((prev) => removeFilterChip(prev, chip));
  }, []);

  const setSort = useCallback((next: TalentSearchSort) => {
    setPage(1);
    setSortState(next);
  }, []);

  const chips = useMemo(() => buildActiveFilterChips(filters), [filters]);

  return {
    filters,
    keywordDraft,
    setKeywordDraft,
    applyKeywordSearch,
    updateFilters,
    replaceFilters,
    clearFilters,
    removeChip,
    chips,
    sort,
    setSort,
    page,
    setPage,
    viewMode,
    setViewMode,
    result,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: () => void load(filters, sort, page),
  };
}
