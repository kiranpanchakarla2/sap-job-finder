export const EMPLOYER_MESSAGE_ROUTES = {
  list: "/employer/messages",
  withCandidate: (candidateId: string) =>
    `/employer/messages?candidate=${encodeURIComponent(candidateId)}` as const,
  withConversation: (conversationId: string) =>
    `/employer/messages?conversation=${encodeURIComponent(conversationId)}` as const,
} as const;
