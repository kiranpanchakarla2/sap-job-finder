import { redirect } from "next/navigation";
import { EMPLOYER_JOB_ROUTES } from "@/features/employer-jobs";

/** Legacy route — Post Job now lives at /employer/jobs/new. */
export default function Page() {
  redirect(EMPLOYER_JOB_ROUTES.create);
}
