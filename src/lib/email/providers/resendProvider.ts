/**
 * Resend Transactional Email Provider (Sprint 8F)
 * Communicates with Resend REST API securely from server-side environment.
 */

import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom = "SAP Jobs Finder <notifications@sapjobsfinder.com>") {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from || this.defaultFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        const errorMessage = errorData.message || `Resend API error with status ${response.status}`;
        console.error("[ResendEmailProvider] Failed to send email:", errorMessage);
        return {
          success: false,
          provider: this.name,
          error: errorMessage,
        };
      }

      const data = (await response.json()) as { id?: string };
      return {
        success: true,
        messageId: data.id || `resend_${Date.now()}`,
        provider: this.name,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network error contacting Resend API.";
      console.error("[ResendEmailProvider] Exception sending email:", err);
      return {
        success: false,
        provider: this.name,
        error: errorMessage,
      };
    }
  }
}
