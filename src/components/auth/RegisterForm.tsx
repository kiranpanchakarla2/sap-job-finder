"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthDivider, AuthShell } from "@/components/auth/AuthShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

function validateRegister(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!values.name.trim()) errors.name = "Full name is required.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!values.password) errors.password = "Password is required.";
  else if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  if (!values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!values.terms) errors.terms = "Please agree to the Terms to continue.";
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [socialMessage, setSocialMessage] = useState("");

  const clearError = (key: keyof RegisterErrors) => {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRegister({ name, email, password, confirmPassword, terms });
    setErrors(nextErrors);
    setSocialMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
    window.setTimeout(() => router.push("/builder"), 800);
  };

  return (
    <AuthShell
      title="Create Your Account"
      subtitle="Start building better resumes today."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded"
          >
            Sign In
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="text-lg font-semibold text-dark">Account ready</p>
            <p className="mt-1 text-sm text-slate-500">Opening your resume workspace…</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            className="space-y-4"
            noValidate
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AuthInput
              label="Full Name"
              type="text"
              autoComplete="name"
              icon={<UserRound className="h-4 w-4" />}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) clearError("name");
              }}
              error={errors.name}
            />
            <AuthInput
              label="Email"
              type="email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) clearError("email");
              }}
              error={errors.email}
            />
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) clearError("password");
              }}
              error={errors.password}
            />
            <PasswordInput
              label="Confirm Password"
              autoComplete="new-password"
              icon={<Lock className="h-4 w-4" />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) clearError("confirmPassword");
              }}
              error={errors.confirmPassword}
            />

            <AuthCheckbox
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                if (errors.terms) clearError("terms");
              }}
              error={errors.terms}
              label={
                <>
                  I agree to the{" "}
                  <Link href="#" className="font-semibold text-primary hover:text-accent">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="font-semibold text-primary hover:text-accent">
                    Privacy Policy
                  </Link>
                </>
              }
            />

            <div className="pt-1">
              <AuthButton loading={loading}>Create Account</AuthButton>
            </div>

            <AuthDivider />

            <SocialAuthButtons
              onProviderClick={(provider) =>
                setSocialMessage(`${provider[0].toUpperCase()}${provider.slice(1)} sign-up will connect soon.`)
              }
            />

            {socialMessage ? (
              <p className="text-center text-xs font-medium text-slate-500" role="status">
                {socialMessage}
              </p>
            ) : null}
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
