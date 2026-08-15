import type { ApplicationStatus } from "@/features/candidate-applications/types/application.types";

export type MessageSender = "employer" | "candidate";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type CandidateMessage = {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  status?: MessageStatus;
};

export type CandidateConversation = {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyLogoColor: string;
  companyLogoUrl?: string | null;
  jobId: string;
  jobTitle: string;
  jobLocation?: string;
  jobWorkMode?: string;
  applicationId?: string | null;
  applicationStatus?: ApplicationStatus | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  messages: CandidateMessage[];
};

export type CandidateMessageServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type StartConversationInput = {
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  applicationId?: string;
  applicationStatus?: ApplicationStatus;
  initialMessage: string;
};
