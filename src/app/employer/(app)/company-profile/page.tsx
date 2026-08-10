import { redirect } from "next/navigation";

/** Legacy path — Sprint 2 company profile lives at /employer/company. */
export default function Page() {
  redirect("/employer/company");
}
