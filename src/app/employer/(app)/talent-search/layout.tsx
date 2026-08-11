"use client";

import type { ReactNode } from "react";
import { TalentCollectionsProvider } from "@/features/employer-talent-search";

export default function TalentSearchLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <TalentCollectionsProvider>{children}</TalentCollectionsProvider>;
}
