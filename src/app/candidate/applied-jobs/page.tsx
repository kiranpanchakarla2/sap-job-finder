import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy Applied Jobs route — Sprint 4 uses /candidate/applications. */
export default function Page() {
  redirect("/candidate/applications");
}
