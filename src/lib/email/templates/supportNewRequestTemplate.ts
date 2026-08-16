/**
 * Internal Support New Request Notification Email Template (Sprint 8F)
 * Sent to the configured internal support team when a new request arrives.
 */

import { siteConfig } from "@/lib/constants";
import { formatCategoryLabel } from "./userConfirmationTemplate";
import { escapeHtml } from "./escapeHtml";

export interface SupportNewRequestTemplateInput {
  userType: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  companyName?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  requestId?: string;
}

export function supportNewRequestTemplate(input: SupportNewRequestTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const categoryLabel = formatCategoryLabel(input.category);
  const userTypeLabel = input.userType.toUpperCase();
  const emailSubject = `[Support Alert - ${userTypeLabel}] ${categoryLabel}: ${input.subject}`;

  const safeUserType = escapeHtml(userTypeLabel);
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeCategory = escapeHtml(categoryLabel);
  const safeCompanyName = input.companyName ? escapeHtml(input.companyName) : null;
  const safeAttachmentName = input.attachmentName ? escapeHtml(input.attachmentName) : null;
  const safeCreatedAt = escapeHtml(input.createdAt);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message);

  const text = `New Contact Us Request Received (${userTypeLabel})

Submitter Details:
--------------------------------------------------
Name: ${input.name}
Email: ${input.email}
User Type: ${input.userType}
Category: ${categoryLabel}
${input.companyName ? `Company: ${input.companyName}\n` : ""}${input.attachmentName ? `Attachment Included: ${input.attachmentName}\n` : ""}Submitted: ${input.createdAt}
--------------------------------------------------

Subject:
${input.subject}

Message:
${input.message}

--------------------------------------------------
SAP Jobs Finder Support Operations
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .header { background: #1e3a8a; padding: 20px 24px; text-align: left; }
    .header-title { color: #ffffff; font-size: 18px; font-weight: 700; margin: 0; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #38bdf8; color: #0f172a; margin-top: 6px; }
    .body { padding: 24px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
    .meta-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .meta-label { font-weight: 600; color: #64748b; width: 120px; }
    .meta-val { color: #0f172a; }
    .message-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .message-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; margin-top: 0; margin-bottom: 8px; }
    .message-body { font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; margin: 0; }
    .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">New Contact Us Inquiry</h1>
      <span class="badge">${safeUserType}</span>
    </div>
    <div class="body">
      <table class="meta-table">
        <tr><td class="meta-label">Name:</td><td class="meta-val"><strong>${safeName}</strong></td></tr>
        <tr><td class="meta-label">Email:</td><td class="meta-val"><a href="mailto:${safeEmail}" style="color: #0284c7;">${safeEmail}</a></td></tr>
        <tr><td class="meta-label">Category:</td><td class="meta-val">${safeCategory}</td></tr>
        ${safeCompanyName ? `<tr><td class="meta-label">Company:</td><td class="meta-val"><strong>${safeCompanyName}</strong></td></tr>` : ""}
        ${safeAttachmentName ? `<tr><td class="meta-label">Attachment:</td><td class="meta-val">📎 ${safeAttachmentName} (Private Bucket)</td></tr>` : ""}
        <tr><td class="meta-label">Submitted:</td><td class="meta-val">${safeCreatedAt}</td></tr>
      </table>

      <div class="message-box">
        <h2 class="message-title">Subject: ${safeSubject}</h2>
        <p class="message-body">${safeMessage}</p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">SAP Jobs Finder Internal Support Notification</p>
    </div>
  </div>
</body>
</html>`;

  return { subject: emailSubject, html, text };
}

