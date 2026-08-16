/**
 * Email Provider Factory (Sprint 8F)
 * Resolves the active server-side email provider based on environment configuration.
 */

import type { EmailProvider } from "../types";
import { ConsoleEmailProvider } from "./consoleProvider";
import { ResendEmailProvider } from "./resendProvider";

let activeProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const providerType = process.env.EMAIL_PROVIDER?.toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.EMAIL_FROM_ADDRESS?.trim() || "SAP Jobs Finder <notifications@sapjobsfinder.com>";

  if ((providerType === "resend" || (!providerType && resendApiKey)) && resendApiKey) {
    activeProvider = new ResendEmailProvider(resendApiKey, fromAddress);
  } else {
    activeProvider = new ConsoleEmailProvider();
  }

  return activeProvider;
}

export function setEmailProviderForTesting(provider: EmailProvider | null): void {
  activeProvider = provider;
}

export * from "../types";
export * from "./consoleProvider";
export * from "./resendProvider";
