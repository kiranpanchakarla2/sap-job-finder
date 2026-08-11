"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { talentSearchService } from "../services/talentSearchService";

type TalentCollectionsContextValue = {
  savedIds: Set<string>;
  shortlistedIds: Set<string>;
  isReady: boolean;
  isSaved: (candidateId: string) => boolean;
  isShortlisted: (candidateId: string) => boolean;
  saveCandidate: (candidateId: string) => Promise<boolean>;
  unsaveCandidate: (candidateId: string) => Promise<boolean>;
  toggleSave: (candidateId: string) => Promise<"saved" | "unsaved" | "error">;
  shortlistCandidate: (candidateId: string) => Promise<boolean>;
  removeFromShortlist: (candidateId: string) => Promise<boolean>;
  toggleShortlist: (
    candidateId: string,
  ) => Promise<"shortlisted" | "removed" | "error">;
  reloadCollections: () => Promise<void>;
};

const TalentCollectionsContext =
  createContext<TalentCollectionsContextValue | null>(null);

export function TalentCollectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isReady, setIsReady] = useState(false);

  const reloadCollections = useCallback(async () => {
    const [saved, shortlisted] = await Promise.all([
      talentSearchService.getSavedCandidates(),
      talentSearchService.listShortlistedIds(),
    ]);

    if (saved.success) {
      setSavedIds(new Set(saved.data.ids));
    }
    if (shortlisted.success) {
      setShortlistedIds(new Set(shortlisted.data));
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    void reloadCollections();
  }, [reloadCollections]);

  const saveCandidate = useCallback(async (candidateId: string) => {
    const result = await talentSearchService.saveCandidate(candidateId);
    if (!result.success) return false;
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
    return true;
  }, []);

  const unsaveCandidate = useCallback(async (candidateId: string) => {
    const result = await talentSearchService.removeSavedCandidate(candidateId);
    if (!result.success) return false;
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
    return true;
  }, []);

  const toggleSave = useCallback(
    async (candidateId: string): Promise<"saved" | "unsaved" | "error"> => {
      const currentlySaved = savedIds.has(candidateId);
      if (currentlySaved) {
        const ok = await unsaveCandidate(candidateId);
        return ok ? "unsaved" : "error";
      }
      const ok = await saveCandidate(candidateId);
      return ok ? "saved" : "error";
    },
    [savedIds, saveCandidate, unsaveCandidate],
  );

  const shortlistCandidate = useCallback(async (candidateId: string) => {
    const result = await talentSearchService.shortlistCandidate(candidateId);
    if (!result.success) return false;
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
    return true;
  }, []);

  const removeFromShortlist = useCallback(async (candidateId: string) => {
    const result = await talentSearchService.removeFromShortlist(candidateId);
    if (!result.success) return false;
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      next.delete(candidateId);
      return next;
    });
    return true;
  }, []);

  const toggleShortlist = useCallback(
    async (
      candidateId: string,
    ): Promise<"shortlisted" | "removed" | "error"> => {
      const currentlyShortlisted = shortlistedIds.has(candidateId);
      if (currentlyShortlisted) {
        const ok = await removeFromShortlist(candidateId);
        return ok ? "removed" : "error";
      }
      const ok = await shortlistCandidate(candidateId);
      return ok ? "shortlisted" : "error";
    },
    [shortlistedIds, shortlistCandidate, removeFromShortlist],
  );

  const value = useMemo<TalentCollectionsContextValue>(
    () => ({
      savedIds,
      shortlistedIds,
      isReady,
      isSaved: (candidateId: string) => savedIds.has(candidateId),
      isShortlisted: (candidateId: string) => shortlistedIds.has(candidateId),
      saveCandidate,
      unsaveCandidate,
      toggleSave,
      shortlistCandidate,
      removeFromShortlist,
      toggleShortlist,
      reloadCollections,
    }),
    [
      savedIds,
      shortlistedIds,
      isReady,
      saveCandidate,
      unsaveCandidate,
      toggleSave,
      shortlistCandidate,
      removeFromShortlist,
      toggleShortlist,
      reloadCollections,
    ],
  );

  return createElement(TalentCollectionsContext.Provider, { value }, children);
}

export function useTalentCollections() {
  const context = useContext(TalentCollectionsContext);
  if (!context) {
    throw new Error(
      "useTalentCollections must be used within TalentCollectionsProvider",
    );
  }
  return context;
}
