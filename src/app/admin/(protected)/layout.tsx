"use client";

import type { ReactNode } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
