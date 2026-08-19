import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/admin";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(cleanEmail, password, "super_admin");

      if (!result.success) {
        setError(result.error || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      // Successful super admin login — redirect to admin dashboard or next url
      router.replace(nextParam);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to complete sign in. Please try again.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error font-medium animate-in fade-in"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-text mb-1.5"
        >
          Administrative Email
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Mail size={16} aria-hidden="true" />
          </div>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@bridgecoreit.com"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-xs font-semibold text-text mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Lock size={16} aria-hidden="true" />
          </div>
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-10 py-2.5 text-sm text-text placeholder:text-muted/60 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text transition focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          id="admin-sign-in-btn"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex items-center justify-start max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to SAP Job Finder</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lift">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-soft mb-3">
              <Shield size={24} aria-hidden="true" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/20 mb-2">
              Internal Only
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Super Admin
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in to the internal administration portal.
            </p>
          </div>

          <Suspense fallback={<LoadingSpinner label="Loading admin login..." />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-xs text-muted/70 max-w-md mx-auto">
        <p>This is a restricted enterprise administrative environment.</p>
        <p className="mt-0.5">Unauthorized access attempts are monitored and logged.</p>
      </div>
    </div>
  );
}
