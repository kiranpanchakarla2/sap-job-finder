export const EMPLOYER_TALENT_SEARCH_ROUTES = {
  root: "/employer/talent-search",
  saved: "/employer/talent-search/saved",
  candidate: (id: string) => `/employer/talent-search/candidates/${id}` as const,
} as const;
