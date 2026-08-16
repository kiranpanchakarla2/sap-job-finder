/**
 * User Contact Request Confirmation Email Template (Sprint 8F)
 * Sent to the requester (anonymous, candidate, or employer) confirming receipt.
 */

import { siteConfig } from "@/lib/constants";
import { escapeHtml } from "./escapeHtml";

export interface UserConfirmationTemplateInput {
  name: string;
  subject: string;
  category: string;
  createdAt: string;
}

export function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function userConfirmationTemplate(input: UserConfirmationTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = new Date(input.createdAt || Date.now()).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const categoryLabel = formatCategoryLabel(input.category);
  const emailSubject = `We received your message: ${input.subject} — ${siteConfig.name}`;

  const safeName = escapeHtml(input.name);
  const safeSubject = escapeHtml(input.subject);
  const safeCategory = escapeHtml(categoryLabel);
  const safeFormattedDate = escapeHtml(formattedDate);

  const text = `Hi ${input.name},

Thank you for contacting ${siteConfig.name}.

We have received your message and our support team will review it.

Request Details:
--------------------------------------------------
Subject: ${input.subject}
Category: ${categoryLabel}
Submitted: ${formattedDate}
--------------------------------------------------

If we need additional information, we will contact you directly at this email address.

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
    .card { background: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 4px; margin: 24px 0; }
    .card-row { margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { font-weight: 600; color: #475569; display: inline-block; width: 100px; }
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
      <p class="paragraph">Thank you for contacting <strong>${siteConfig.name}</strong>. We have received your inquiry and our support team will review it.</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Subject:</span> <span class="card-value">${safeSubject}</span></div>
        <div class="card-row"><span class="card-label">Category:</span> <span class="card-value">${safeCategory}</span></div>
        <div class="card-row"><span class="card-label">Submitted:</span> <span class="card-value">${safeFormattedDate}</span></div>
      </div>

      <p class="paragraph">If we require any additional information to assist you, we will follow up with you directly at this email address.</p>
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
