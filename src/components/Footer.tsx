import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-footer">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:gap-2.5">
          <p className="text-center text-xs font-medium leading-relaxed text-footer-fg sm:text-sm">
            ©️ 2026 SAP Jobs Finder. All Rights Reserved. | Powered by{" "}
            <a
              href="https://www.bridgecoreit.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 rounded-sm font-semibold text-link text-primary underline-offset-2 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-footer"
            >
              BridgecoreIT
              <ExternalLink
                size={11}
                strokeWidth={2}
                className="opacity-70"
                aria-hidden="true"
              />
            </a>
          </p>
          <p className="mx-auto max-w-2xl px-1 text-center text-[10px] leading-relaxed text-muted sm:max-w-3xl sm:text-[11px] sm:leading-6">
            SAP, S/4HANA, and ECC are trademarks of SAP SE. SAP Jobs Finder is an
            independent job platform and is not affiliated with, endorsed by, or
            sponsored by SAP SE.
          </p>
        </div>
      </div>
    </footer>
  );
}
