export type MessageSender = "employer" | "candidate";

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  read: boolean;
};

export type EmployerConversation = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatarUrl: string | null;
  applicationId: string;
  applicationStatus:
    | "new"
    | "reviewing"
    | "shortlisted"
    | "interview"
    | "hired"
    | "rejected";
  jobId: string;
  jobTitle: string;
  interviewId: string | null;
  messages: ConversationMessage[];
  unreadCount: number;
  lastMessageAt: string;
};

export type MessageServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
