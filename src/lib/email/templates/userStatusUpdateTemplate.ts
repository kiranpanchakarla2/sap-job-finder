/**
 * User Status Update Email Template (Sprint 8F)
 * Sent to the requester when their contact request status is updated by support.
 */

import { siteConfig } from "@/lib/constants";
import { escapeHtml } from "./escapeHtml";
import type { ContactRequestStatus } from "@/types/contact";

export interface UserStatusUpdateTemplateInput {
  name: string;
  subject: string;
  oldStatus?: ContactRequestStatus | string;
  newStatus: ContactRequestStatus | string;
  createdAt?: string;
}

export function getStatusUserMessage(newStatus: string, oldStatus?: string): {
  headline: string;
  description: string;
  badgeColor: string;
  badgeBg: string;
} {
  switch (newStatus) {
    case "in_progress":
      if (oldStatus === "closed" || oldStatus === "resolved") {
        return {
          headline: "Your request has been reopened",
          description: "Your support request has been reopened and is being actively reviewed again by our team.",
          badgeColor: "#0284c7",
          badgeBg: "#e0f2fe",
        };
      }
      return {
        headline: "Your request is now in progress",
        description: "Your request is now being reviewed and addressed by our support team.",
        badgeColor: "#0284c7",
        badgeBg: "#e0f2fe",
      };
    case "resolved":
      return {
        headline: "Your request has been resolved",
        description: "Our support team has marked your inquiry as resolved. If your issue is resolved, no further action is required.",
        badgeColor: "#16a34a",
        badgeBg: "#dcfce7",
      };
    case "closed":
      return {
        headline: "Your request has been closed",
        description: "Your support request has been closed. If you need any further assistance, feel free to reach out to us again.",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
      };
    default:
      return {
        headline: `Status update: ${newStatus.replace("_", " ")}`,
        description: `The status of your support inquiry has been updated to "${newStatus.replace("_", " ")}".`,
        badgeColor: "#0284c7",
        badgeBg: "#e0f2fe",
      };
  }
}

export function userStatusUpdateTemplate(input: UserStatusUpdateTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const statusInfo = getStatusUserMessage(input.newStatus, input.oldStatus);
  const emailSubject = `Update on your support request: ${input.subject} — ${siteConfig.name}`;
  const statusLabel = input.newStatus.replace("_", " ").toUpperCase();

  const safeName = escapeHtml(input.name);
  const safeSubject = escapeHtml(input.subject);
  const safeStatusLabel = escapeHtml(statusLabel);
  const safeDescription = escapeHtml(statusInfo.description);

  const text = `Hi ${input.name},

There is an update to your support request with ${siteConfig.name}.

Status Update: ${statusLabel}
${statusInfo.description}

Request Details:
--------------------------------------------------
Subject: ${input.subject}
Current Status: ${statusLabel}
--------------------------------------------------

If you have additional questions or require further support, you can reply directly or submit a new inquiry through our portal.

Regards,
The ${siteConfig.name} Team
${siteConfig.supportEmail}

© 2026 SAP Jobs Finder. All Rights Reserved. Powered by BridgecoreIT.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background: #0f172a; padding: 24px 32px; text-align: left; }
    .header-logo { color: #ffffff; font-size: 20px; font-weight: 700; text-decoration: none; }
    .header-logo span { color: #38bdf8; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .paragraph { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; background: ${statusInfo.badgeBg}; color: ${statusInfo.badgeColor}; margin-bottom: 16px; }
    .card { background: #f1f5f9; border-left: 4px solid ${statusInfo.badgeColor}; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .card-row { margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { font-weight: 600; color: #475569; display: inline-block; width: 110px; }
    .card-value { color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">SAP Jobs <span>Finder</span></div>
    </div>
    <div class="body">
      <h1 class="greeting">Hi ${safeName},</h1>
      <div class="status-badge">${safeStatusLabel}</div>
      <p class="paragraph">${safeDescription}</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Subject:</span> <span class="card-value">${safeSubject}</span></div>
        <div class="card-row"><span class="card-label">Current Status:</span> <span class="card-value"><strong>${safeStatusLabel}</strong></span></div>
      </div>

      <p class="paragraph">If you require further assistance or have follow-up questions, you can contact us again through ${siteConfig.name}.</p>
      <p class="paragraph" style="margin-bottom: 0;">Regards,<br><strong>The ${siteConfig.name} Team</strong></p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">© 2026 SAP Jobs Finder. All Rights Reserved. Powered by BridgecoreIT.</p>
      <p style="margin: 0;">Need immediate help? Reach us at <a href="mailto:${siteConfig.supportEmail}" style="color: #0284c7; text-decoration: none;">${siteConfig.supportEmail}</a></p>
    </div>
  </div>
</body>
</html>`;

  return { subject: emailSubject, html, text };
}
