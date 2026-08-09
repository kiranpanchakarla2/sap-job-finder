import type { ReactNode } from "react";

export default function CandidateLoginLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[430px]">{children}</div>;
}
