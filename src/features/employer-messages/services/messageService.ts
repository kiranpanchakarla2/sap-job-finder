import { createClient } from "@/lib/supabase/client";
import { interviewService } from "@/features/employer-interviews";
import type { ApplicationStatus } from "@/features/employer-applicants";
import { getLastMessagePreview } from "../lib/format";
import type {
  ConversationMessage,
  EmployerConversation,
  MessageServiceResult,
} from "../types/message.types";

const ERR = {
  auth: "Please sign in again to continue.",
  company: "Complete your company profile before messaging candidates.",
  load: "Unable to load conversations.",
  send: "Unable to send message.",
  read: "Unable to mark messages as read.",
} as const;

type ConversationJoinRow = {
  id: string;
  application_id: string;
  created_at: string;
  updated_at: string;
  job_applications: {
    id: string;
    status: string;
    candidate_id: string;
    jobs: {
      id: string;
      title: string;
    } | null;
    candidate_profiles: {
      id: string;
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      profile_photo_url: string | null;
    } | null;
  } | null;
  messages: Array<{
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
  }> | null;
};

const CONVERSATION_SELECT = `
  id,
  application_id,
  created_at,
  updated_at,
  job_applications!inner (
    id,
    status,
    candidate_id,
    jobs (
      id,
      title
    ),
    candidate_profiles (
      id,
      user_id,
      first_name,
      last_name,
      avatar_url,
      profile_photo_url
    )
  ),
  messages (
    id,
    sender_id,
    content,
    created_at,
    read_at
  )
`;

function isAuthSessionMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  return (
    e.name === "AuthSessionMissingError" ||
    (typeof e.message === "string" && e.message.toLowerCase().includes("auth session missing"))
  );
}

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (context === "auth" && isAuthSessionMissing(error)) {
      return;
    }
    console.error(`[messageService] ${context}`, error);
  }
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function requireUser(): Promise<
  MessageServiceResult<{ userId: string }>
> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    logError("auth", error);
    return { success: false, error: ERR.auth };
  }
  return { success: true, data: { userId: user.id } };
}

function mapConversation(
  row: ConversationJoinRow,
  currentUserId: string,
): EmployerConversation {
  const application = asSingle(row.job_applications);
  const job = asSingle(application?.jobs ?? null);
  const candidate = asSingle(application?.candidate_profiles ?? null);
  const first = candidate?.first_name?.trim() ?? "";
  const last = candidate?.last_name?.trim() ?? "";
  const candidateName = `${first} ${last}`.trim() || "Candidate";
  const candidateUserId = candidate?.user_id ?? "";

  const rawMessages = [...(row.messages ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const messages: ConversationMessage[] = rawMessages.map((message) => ({
    id: message.id,
    sender:
      message.sender_id === candidateUserId ? "candidate" : "employer",
    content: message.content,
    timestamp: message.created_at,
    read: Boolean(message.read_at) || message.sender_id === currentUserId,
  }));

  const unreadCount = rawMessages.filter(
    (message) =>
      message.sender_id !== currentUserId && message.read_at == null,
  ).length;

  const lastMessage = rawMessages[rawMessages.length - 1];

  return {
    id: row.id,
    candidateId: candidate?.id ?? application?.candidate_id ?? "",
    candidateName,
    candidateAvatarUrl:
      candidate?.avatar_url ?? candidate?.profile_photo_url ?? null,
    applicationId: row.application_id,
    applicationStatus: (application?.status ?? "new") as ApplicationStatus,
    jobId: job?.id ?? "",
    jobTitle: job?.title ?? "Role",
    interviewId: null,
    messages,
    unreadCount,
    lastMessageAt: lastMessage?.created_at ?? row.updated_at,
  };
}

function normalizeConversationRow(
  row: Record<string, unknown>,
): ConversationJoinRow {
  const applications = Array.isArray(row.job_applications)
    ? row.job_applications[0]
    : row.job_applications;
  const app = (applications ?? null) as Record<string, unknown> | null;
  const jobs = app
    ? Array.isArray(app.jobs)
      ? app.jobs[0]
      : app.jobs
    : null;
  const profiles = app
    ? Array.isArray(app.candidate_profiles)
      ? app.candidate_profiles[0]
      : app.candidate_profiles
    : null;

  return {
    id: row.id as string,
    application_id: row.application_id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    job_applications: app
      ? {
          id: app.id as string,
          status: app.status as string,
          candidate_id: app.candidate_id as string,
          jobs: jobs as ConversationJoinRow["job_applications"] extends
            | null
            | undefined
            ? never
            : NonNullable<ConversationJoinRow["job_applications"]>["jobs"],
          candidate_profiles:
            profiles as ConversationJoinRow["job_applications"] extends
              | null
              | undefined
              ? never
              : NonNullable<
                  ConversationJoinRow["job_applications"]
                >["candidate_profiles"],
        }
      : null,
    messages: (row.messages as ConversationJoinRow["messages"]) ?? [],
  };
}

async function attachInterviewId(
  conversation: EmployerConversation,
): Promise<EmployerConversation> {
  const result = await interviewService.getByApplication(
    conversation.applicationId,
  );
  if (!result.success || !result.data) return conversation;
  if (result.data.status !== "scheduled") return conversation;
  return { ...conversation, interviewId: result.data.id };
}

export const messageService = {
  async listConversations(
    search = "",
  ): Promise<MessageServiceResult<EmployerConversation[]>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      logError("listConversations", error);
      return { success: false, error: ERR.load };
    }

    let conversations = await Promise.all(
      (data ?? []).map(async (row) =>
        attachInterviewId(
          mapConversation(
            normalizeConversationRow(row as Record<string, unknown>),
            auth.data.userId,
          ),
        ),
      ),
    );

    const query = search.trim().toLowerCase();
    if (query) {
      conversations = conversations.filter((conversation) => {
        const haystack = [
          conversation.candidateName,
          conversation.jobTitle,
          ...conversation.messages.map((message) => message.content),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    return { success: true, data: conversations };
  },

  async getConversation(
    conversationId: string,
  ): Promise<MessageServiceResult<EmployerConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .eq("id", conversationId)
      .maybeSingle();

    if (error || !data) {
      logError("getConversation", error);
      return { success: false, error: ERR.load };
    }

    const mapped = await attachInterviewId(
      mapConversation(
        normalizeConversationRow(data as Record<string, unknown>),
        auth.data.userId,
      ),
    );
    return { success: true, data: mapped };
  },

  async getOrCreateForApplication(
    applicationId: string,
  ): Promise<MessageServiceResult<EmployerConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      p_application_id: applicationId,
    });

    if (error || !data) {
      logError("getOrCreateForApplication", error);
      return { success: false, error: ERR.load };
    }

    const created = data as { id: string };
    return this.getConversation(created.id);
  },

  async getByCandidate(
    candidateId: string,
  ): Promise<MessageServiceResult<EmployerConversation | null>> {
    const list = await this.listConversations();
    if (!list.success) return list;
    const match = list.data.find(
      (conversation) => conversation.candidateId === candidateId,
    );
    return { success: true, data: match ?? null };
  },

  async getUnreadCount(): Promise<MessageServiceResult<number>> {
    const auth = await requireUser();
    if (!auth.success) return { success: true, data: 0 };

    const list = await this.listConversations();
    if (!list.success) return { success: true, data: 0 };

    const total = list.data.reduce(
      (sum, conversation) => sum + conversation.unreadCount,
      0,
    );
    return { success: true, data: total };
  },

  async markConversationRead(
    conversationId: string,
  ): Promise<MessageServiceResult<EmployerConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", auth.data.userId)
      .is("read_at", null);

    if (error) {
      logError("markConversationRead", error);
      // Still return conversation even if mark-read fails
    }

    return this.getConversation(conversationId);
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<MessageServiceResult<EmployerConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const trimmed = content.trim();
    if (!trimmed) {
      return { success: false, error: ERR.send };
    }
    if (trimmed.length > 5000) {
      return { success: false, error: "Message is too long." };
    }

    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: auth.data.userId,
      content: trimmed,
    });

    if (error) {
      logError("sendMessage", error);
      return { success: false, error: ERR.send };
    }

    return this.getConversation(conversationId);
  },

  getLastPreview(conversation: EmployerConversation): string {
    const last = conversation.messages[conversation.messages.length - 1];
    return last ? getLastMessagePreview(last.content) : "No messages yet.";
  },

  subscribeToConversation(
    conversationId: string,
    onChange: () => void,
  ): () => void {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          onChange();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
