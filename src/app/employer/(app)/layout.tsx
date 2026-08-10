"use client";

import type { ReactNode } from "react";
import { EmployerLayout } from "@/layouts/EmployerLayout";

export default function EmployerAppLayout({ children }: { children: ReactNode }) {
  return <EmployerLayout>{children}</EmployerLayout>;
}
