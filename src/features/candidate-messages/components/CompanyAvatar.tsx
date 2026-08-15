"use client";

import { useState } from "react";
import Image from "next/image";

export function CompanyAvatar({
  name,
  logo,
  logoColor = "#7C3AED",
  logoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  logo?: string;
  logoColor?: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];

  const letter = logo || name.slice(0, 1).toUpperCase() || "C";

  if (logoUrl && !imageError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border border-border/80 shadow-soft ${sizeClasses} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-soft ${sizeClasses} ${className}`}
      style={{ backgroundColor: logoColor }}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}
