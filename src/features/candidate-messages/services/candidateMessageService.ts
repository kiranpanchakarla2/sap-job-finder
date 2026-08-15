import { createClient } from "@/lib/supabase/client";
import { getLastMessagePreview } from "../lib/format";
import type { ApplicationStatus } from "@/features/candidate-applications/types/application.types";
import type {
  CandidateConversation,
  CandidateMessage,
  CandidateMessageServiceResult,
  StartConversationInput,
} from "../types/message.types";

const ERR = {
  auth: "Please sign in as a candidate to continue.",
  load: "Unable to load conversations.",
  send: "Unable to send message.",
  notFound: "Conversation not found.",
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
      location: string | null;
      work_arrangement: string | null;
      company_id: string;
      company_profiles: {
        id: string;
        company_name: string;
        logo_url: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
      } | null;
    } | null;
    candidate_profiles: {
      id: string;
      user_id: string;
      first_name: string | null;
      last_name: string | null;
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

const CANDIDATE_CONVERSATION_SELECT = `
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
      title,
      location,
      work_arrangement,
      company_id,
      company_profiles (
        id,
        company_name,
        logo_url,
        city,
        state,
        country
      )
    ),
    candidate_profiles (
      id,
      user_id,
      first_name,
      last_name
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

const COMPANY_COLORS = [
  "#2563EB", // blue
  "#7C3AED", // purple
  "#059669", // emerald
  "#D97706", // amber
  "#DC2626", // red
  "#4F46E5", // indigo
  "#0891B2", // cyan
  "#9333EA", // purple-600
];

function getCompanyLogoColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COMPANY_COLORS.length;
  return COMPANY_COLORS[index];
}

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[candidateMessageService] ${context}`, error);
  }
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function requireUser(): Promise<
  CandidateMessageServiceResult<{ userId: string }>
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

function normalizeConversationRow(
  row: Record<string, unknown>,
): ConversationJoinRow {
  const applications = Array.isArray(row.job_applications)
    ? row.job_applications[0]
    : row.job_applications;
  const app = (applications ?? null) as Record<string, unknown> | null;

  const rawJobs = app
    ? Array.isArray(app.jobs)
      ? app.jobs[0]
      : app.jobs
    : null;
  const job = (rawJobs ?? null) as Record<string, unknown> | null;

  const rawCompanies = job
    ? Array.isArray(job.company_profiles)
      ? job.company_profiles[0]
      : job.company_profiles
    : null;

  const rawCandidateProfiles = app
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
          jobs: job
            ? {
                id: job.id as string,
                title: job.title as string,
                location: (job.location as string | null) ?? null,
                work_arrangement: (job.work_arrangement as string | null) ?? null,
                company_id: (job.company_id as string) ?? "",
                company_profiles: (rawCompanies as ConversationJoinRow["job_applications"] extends
                  | null
                  | undefined
                  ? never
                  : NonNullable<
                      NonNullable<ConversationJoinRow["job_applications"]>["jobs"]
                    >["company_profiles"]) ?? null,
              }
            : null,
          candidate_profiles: (rawCandidateProfiles as ConversationJoinRow["job_applications"] extends
            | null
            | undefined
            ? never
            : NonNullable<
                ConversationJoinRow["job_applications"]
              >["candidate_profiles"]) ?? null,
        }
      : null,
    messages: (row.messages as ConversationJoinRow["messages"]) ?? [],
  };
}

function mapConversation(
  row: ConversationJoinRow,
  currentUserId: string,
): CandidateConversation {
  const application = asSingle(row.job_applications);
  const job = asSingle(application?.jobs ?? null);
  const company = asSingle(job?.company_profiles ?? null);
  const candidate = asSingle(application?.candidate_profiles ?? null);

  const companyName = company?.company_name?.trim() || "Company";
  const companyId = company?.id ?? job?.company_id ?? `comp_${row.id}`;
  const companyLogo = companyName.slice(0, 1).toUpperCase() || "C";
  const companyLogoColor = getCompanyLogoColor(companyName);
  const companyLogoUrl = company?.logo_url ?? null;

  const candidateFirstName = candidate?.first_name?.trim() ?? "";
  const candidateLastName = candidate?.last_name?.trim() ?? "";
  const candidateName =
    `${candidateFirstName} ${candidateLastName}`.trim() || "You";

  const rawMessages = [...(row.messages ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const messages: CandidateMessage[] = rawMessages.map((m) => {
    const isMe = m.sender_id === currentUserId;
    return {
      id: m.id,
      conversationId: row.id,
      sender: isMe ? "candidate" : "employer",
      senderName: isMe ? candidateName : companyName,
      content: m.content,
      timestamp: m.created_at,
      read: Boolean(m.read_at) || isMe,
      status: (Boolean(m.read_at) || isMe) ? "read" : "sent",
    };
  });

  const unreadCount = rawMessages.filter(
    (m) => m.sender_id !== currentUserId && m.read_at == null,
  ).length;

  const lastMessage = rawMessages[rawMessages.length - 1];

  let jobLocation = job?.location ?? undefined;
  if (!jobLocation && company?.city) {
    jobLocation = [company.city, company.state, company.country]
      .filter(Boolean)
      .join(", ");
  }

  return {
    id: row.id,
    companyId,
    companyName,
    companyLogo,
    companyLogoColor,
    companyLogoUrl,
    jobId: job?.id ?? "",
    jobTitle: job?.title ?? "SAP Opportunity",
    jobLocation,
    jobWorkMode: job?.work_arrangement ?? undefined,
    applicationId: row.application_id,
    applicationStatus: (application?.status ?? null) as ApplicationStatus | null,
    unreadCount,
    lastMessageAt: lastMessage?.created_at ?? row.updated_at,
    lastMessagePreview: lastMessage
      ? getLastMessagePreview(lastMessage.content)
      : "No messages yet.",
    messages,
  };
}

export const candidateMessageService = {
  async listConversations(
    search = "",
  ): Promise<CandidateMessageServiceResult<CandidateConversation[]>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select(CANDIDATE_CONVERSATION_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      logError("listConversations", error);
      return { success: false, error: ERR.load };
    }

    let conversations = (data ?? []).map((row) =>
      mapConversation(
        normalizeConversationRow(row as Record<string, unknown>),
        auth.data.userId,
      ),
    );

    const query = search.trim().toLowerCase();
    if (query) {
      conversations = conversations.filter((conversation) => {
        const haystack = [
          conversation.companyName,
          conversation.jobTitle,
          conversation.jobLocation ?? "",
          ...conversation.messages.map((m) => m.content),
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
  ): Promise<CandidateMessageServiceResult<CandidateConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select(CANDIDATE_CONVERSATION_SELECT)
      .eq("id", conversationId)
      .maybeSingle();

    if (error || !data) {
      logError("getConversation", error);
      return { success: false, error: ERR.notFound };
    }

    const mapped = mapConversation(
      normalizeConversationRow(data as Record<string, unknown>),
      auth.data.userId,
    );
    return { success: true, data: mapped };
  },

  async markConversationRead(
    conversationId: string,
  ): Promise<CandidateMessageServiceResult<CandidateConversation>> {
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
    }

    return this.getConversation(conversationId);
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<CandidateMessageServiceResult<CandidateConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const trimmed = content.trim();
    if (!trimmed) {
      return { success: false, error: "Cannot send an empty message." };
    }
    if (trimmed.length > 5000) {
      return { success: false, error: "Message exceeds 5,000 characters limit." };
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

  async getUnreadCount(): Promise<CandidateMessageServiceResult<number>> {
    const listResult = await this.listConversations();
    if (!listResult.success) {
      return { success: true, data: 0 };
    }
    const total = listResult.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    return { success: true, data: total };
  },

  async startConversation(
    input: StartConversationInput,
  ): Promise<CandidateMessageServiceResult<CandidateConversation>> {
    const auth = await requireUser();
    if (!auth.success) return auth;

    const trimmed = input.initialMessage.trim();
    if (!trimmed) {
      return { success: false, error: "Message content cannot be empty." };
    }
    if (trimmed.length > 5000) {
      return { success: false, error: "Message exceeds 5,000 characters limit." };
    }

    if (!input.applicationId) {
      return {
        success: false,
        error: "Please apply for the role first before messaging the employer.",
      };
    }

    const supabase = createClient();
    const { data: convData, error: convError } = await supabase.rpc(
      "get_or_create_conversation",
      {
        p_application_id: input.applicationId,
      },
    );

    if (convError || !convData) {
      logError("startConversation get_or_create_conversation", convError);
      return {
        success: false,
        error: convError?.message || "Unable to start conversation with employer.",
      };
    }

    const convId = (convData as { id: string }).id;

    // Send the initial message
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_id: auth.data.userId,
      content: trimmed,
    });

    if (msgError) {
      logError("startConversation insert message", msgError);
      return { success: false, error: ERR.send };
    }

    return this.getConversation(convId);
  },

  subscribeToConversation(
    conversationId: string,
    onChange: () => void,
  ): () => void {
    const supabase = createClient();
    const channel = supabase
      .channel(`candidate-messages:${conversationId}`)
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

  subscribeToAllConversations(onChange: () => void): () => void {
    const supabase = createClient();
    const channel = supabase
      .channel("candidate-messages-all-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
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
