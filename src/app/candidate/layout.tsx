"use client";

import type { ReactNode } from "react";
import { CandidateLayout } from "@/layouts/CandidateLayout";

export default function CandidateRouteLayout({ children }: { children: ReactNode }) {
  return <CandidateLayout>{children}</CandidateLayout>;
}
