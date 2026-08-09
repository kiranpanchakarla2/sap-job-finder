import type { ReactNode } from "react";
import { FullWidthAuthLayout } from "@/layouts/FullWidthAuthLayout";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <FullWidthAuthLayout>{children}</FullWidthAuthLayout>;
}
