import type {
  ApplicationAction,
  ApplicationStatus,
  EmployerApplication,
} from "../types/application.types";
import { canMarkReviewing, canReject, canShortlist } from "./status";

export function getAllowedApplicationActions(
  status: ApplicationStatus,
): ApplicationAction[] {
  const actions: ApplicationAction[] = ["view", "change_status"];

  if (canMarkReviewing(status)) actions.splice(1, 0, "review");
  if (canShortlist(status)) actions.push("shortlist");
  if (canReject(status)) actions.push("reject");

  return actions;
}

export function applicationActionLabel(action: ApplicationAction): string {
  switch (action) {
    case "view":
      return "View";
    case "review":
      return "Review";
    case "shortlist":
      return "Shortlist";
    case "reject":
      return "Reject";
    case "change_status":
      return "Change Status";
    default:
      return action;
  }
}

export function isDestructiveAction(action: ApplicationAction): boolean {
  return action === "reject";
}

export type ApplicationActionHandler = (
  action: ApplicationAction,
  application: EmployerApplication,
) => void;
