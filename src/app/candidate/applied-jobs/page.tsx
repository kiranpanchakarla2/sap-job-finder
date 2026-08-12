import { redirect } from "next/navigation";

/** Legacy Applied Jobs route — Sprint 4 uses /candidate/applications. */
export default function Page() {
  redirect("/candidate/applications");
}
