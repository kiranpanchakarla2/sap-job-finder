/**
 * Console Email Provider (Development & Sandbox)
 * Used in local development, testing, and CI environments to safely simulate email delivery.
 */

import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const messageId = `console_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (process.env.NODE_ENV !== "test") {
      console.log(`\n================== [EMAIL SENT via ${this.name.toUpperCase()}] ==================`);
      console.log(`To:       ${message.to}`);
      console.log(`Subject:  ${message.subject}`);
      console.log(`From:     ${message.from || "default"}`);
      console.log(`MessageId:${messageId}`);
      console.log(`----------------------------------------------------------------`);
      console.log(message.text.substring(0, 300) + (message.text.length > 300 ? "..." : ""));
      console.log(`================================================================\n`);
    }

    return {
      success: true,
      messageId,
      provider: this.name,
    };
  }
}
