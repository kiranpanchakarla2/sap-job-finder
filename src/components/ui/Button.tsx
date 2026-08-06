import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

const variants: Record<ButtonVariant, string> = {
  primary:
    "theme-btn-primary text-button-fg shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-glow)]",
  secondary:
    "bg-button-secondary text-button-secondary-fg border border-border shadow-soft hover:border-primary/30 hover:bg-surface",
  ghost: "bg-transparent text-text/70 hover:text-text hover:bg-text/[0.04]",
  dark: "bg-button-secondary text-button-secondary-fg shadow-lift hover:bg-surface",
};

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonAsButton = SharedProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "theme-btn inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] px-5 py-3 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as Omit<ButtonAsButton, "children" | "variant" | "className">;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
