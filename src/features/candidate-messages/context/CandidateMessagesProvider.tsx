"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { candidateMessageService } from "../services/candidateMessageService";
import type {
  CandidateConversation,
  StartConversationInput,
} from "../types/message.types";

type CandidateMessagesContextValue = {
  conversations: CandidateConversation[];
  allConversations: CandidateConversation[];
  activeId: string | null;
  activeConversation: CandidateConversation | null;
  search: string;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  unreadCount: number;
  setSearch: (query: string) => void;
  selectConversation: (id: string | null) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  markConversationAsRead: (id: string) => Promise<void>;
  startNewConversation: (input: StartConversationInput) => Promise<CandidateConversation | null>;
  reload: () => Promise<void>;
};

const CandidateMessagesContext =
  createContext<CandidateMessagesContextValue | null>(null);

export function CandidateMessagesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCandidate = Boolean(
    isAuthenticated && user && (user.role === "candidate" || user.role === "admin"),
  );

  const [search, setSearch] = useState("");
  const [allConversations, setAllConversations] = useState<CandidateConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<CandidateConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!isCandidate || !user?.id) {
      setAllConversations([]);
      setIsLoading(false);
      setIsError(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const result = await candidateMessageService.listConversations();
      if (result.success) {
        setAllConversations(result.data);
      } else {
        setIsError(true);
        setError(result.error);
      }
    } catch {
      setIsError(true);
      setError("Unable to load conversations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isCandidate, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void loadConversations();
  }, [authLoading, loadConversations]);

  // Realtime subscription for updates
  useEffect(() => {
    if (!isCandidate || !user?.id) return;

    const unsubscribe = candidateMessageService.subscribeToAllConversations(() => {
      void candidateMessageService.listConversations().then((result) => {
        if (result.success) {
          setAllConversations(result.data);
        }
      });
      if (activeId) {
        void candidateMessageService.getConversation(activeId).then((result) => {
          if (result.success) {
            setActiveConversation(result.data);
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeId, isCandidate, user?.id]);

  // Derive unread count from all conversations
  const unreadCount = useMemo(() => {
    return allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [allConversations]);

  // Filter conversations by search term
  const conversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allConversations;
    return allConversations.filter((c) => {
      const haystack = [
        c.companyName,
        c.jobTitle,
        c.jobLocation ?? "",
        ...c.messages.map((m) => m.content),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [allConversations, search]);

  const markConversationAsRead = useCallback(async (id: string) => {
    const result = await candidateMessageService.markConversationRead(id);
    if (result.success) {
      setAllConversations((prev) =>
        prev.map((c) => (c.id === id ? result.data : c)),
      );
      setActiveConversation((current) =>
        current?.id === id ? result.data : current,
      );
    }
  }, []);

  const selectConversation = useCallback(
    async (id: string | null) => {
      setActiveId(id);
      if (!id) {
        setActiveConversation(null);
        return;
      }

      const match = allConversations.find((c) => c.id === id);
      if (match) {
        setActiveConversation(match);
        if (match.unreadCount > 0) {
          await markConversationAsRead(id);
        }
      } else {
        const result = await candidateMessageService.getConversation(id);
        if (result.success) {
          setActiveConversation(result.data);
          if (result.data.unreadCount > 0) {
            await markConversationAsRead(id);
          }
        }
      }
    },
    [allConversations, markConversationAsRead],
  );

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!activeId) return false;
      const result = await candidateMessageService.sendMessage(activeId, content);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      setActiveConversation(result.data);
      setAllConversations((prev) => [
        result.data,
        ...prev.filter((c) => c.id !== activeId),
      ]);
      toast.success("Message sent.");
      return true;
    },
    [activeId],
  );

  const startNewConversation = useCallback(
    async (input: StartConversationInput): Promise<CandidateConversation | null> => {
      const result = await candidateMessageService.startConversation(input);
      if (!result.success) {
        toast.error(result.error);
        return null;
      }

      const newConv = result.data;
      setAllConversations((prev) => [
        newConv,
        ...prev.filter((c) => c.id !== newConv.id),
      ]);
      setActiveId(newConv.id);
      setActiveConversation(newConv);
      toast.success("Message sent.");
      return newConv;
    },
    [],
  );

  const reload = useCallback(async () => {
    await loadConversations();
    if (activeId) {
      const result = await candidateMessageService.getConversation(activeId);
      if (result.success) {
        setActiveConversation(result.data);
      }
    }
  }, [activeId, loadConversations]);

  const value = useMemo<CandidateMessagesContextValue>(
    () => ({
      conversations,
      allConversations,
      activeId,
      activeConversation,
      search,
      isLoading,
      isError,
      error,
      unreadCount,
      setSearch,
      selectConversation,
      sendMessage,
      markConversationAsRead,
      startNewConversation,
      reload,
    }),
    [
      conversations,
      allConversations,
      activeId,
      activeConversation,
      search,
      isLoading,
      isError,
      error,
      unreadCount,
      setSearch,
      selectConversation,
      sendMessage,
      markConversationAsRead,
      startNewConversation,
      reload,
    ],
  );

  return (
    <CandidateMessagesContext.Provider value={value}>
      {children}
    </CandidateMessagesContext.Provider>
  );
}

export function useCandidateMessages() {
  const ctx = useContext(CandidateMessagesContext);
  if (!ctx) {
    throw new Error(
      "useCandidateMessages must be used within CandidateMessagesProvider",
    );
  }
  return ctx;
}
