"use client";

import { motion, useReducedMotion } from "framer-motion";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 7.2v3.5h4.9c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H9z"
      />
      <path
        fill="#34A853"
        d="M4 10.7l-.6.5-2.1 1.6C2.6 15.5 5.5 17.5 9 17.5c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
      />
      <path
        fill="#4A90E2"
        d="M1.3 5.3C.5 6.8 0 8.3 0 10s.5 3.2 1.3 4.7l2.7-2.1C3.7 11.7 3.5 10.9 3.5 10s.2-1.7.5-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M9 3.5c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.4.8 11.4 0 9 0 5.5 0 2.6 2 1.3 5.3l2.7 2.1C4.9 5 6.8 3.5 9 3.5z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.1 9.4c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.7-2.8-.7C4.2 4.7 2.6 5.7 1.7 7.5.1 11.1 1.3 16.5 3.5 19.2c1.1 1.3 2.3 2.8 4 2.7 1.6-.1 2.2-1 4.1-1s2.4 1 4.1.9c1.7-.1 2.8-1.3 3.8-2.6 1.2-1.6 1.7-3.1 1.7-3.2-.1 0-3.3-1.3-3.3-5.1zM10.8 3.3c.8-1.1 1.4-2.5 1.2-4-1.2.1-2.6.8-3.4 1.9-.8.9-1.4 2.4-1.2 3.8 1.3.1 2.6-.7 3.4-1.7z" />
    </svg>
  );
}

const providers = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "linkedin", label: "Continue with LinkedIn", icon: LinkedInIcon },
  { id: "apple", label: "Continue with Apple", icon: AppleIcon },
] as const;

type SocialAuthButtonsProps = {
  onProviderClick?: (provider: (typeof providers)[number]["id"]) => void;
};

export function SocialAuthButtons({ onProviderClick }: SocialAuthButtonsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const Icon = provider.icon;
        return (
          <motion.button
            key={provider.id}
            type="button"
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => onProviderClick?.(provider.id)}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-dark shadow-soft transition hover:border-primary/20 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Icon />
            {provider.label}
          </motion.button>
        );
      })}
    </div>
  );
}
