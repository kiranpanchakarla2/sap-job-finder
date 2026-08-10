import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ctaBanners = [
  {
    id: "candidate",
    title: "Become a Candidate",
    description:
      "Create your profile, upload your SAP resume, and apply to thousands of roles across modules and locations.",
    href: "/register/candidate",
    cta: "Register Now",
    variant: "light" as const,
    image: {
      src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=720&q=80",
      alt: "Candidate working on a laptop",
    },
  },
  {
    id: "employer",
    title: "Become an Employer",
    description:
      "Post SAP openings, reach qualified consultants, and manage applicants from one recruiter dashboard.",
    href: "/employer/register",
    cta: "Register Now",
    variant: "primary" as const,
    image: {
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=720&q=80",
      alt: "Employer ready to hire SAP talent",
    },
  },
] as const;

export function DualCtaBanners() {
  return (
    <section className="border-t border-border/60 bg-surface py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:px-8 lg:grid-cols-2 lg:gap-6">
        {ctaBanners.map((banner) => {
          const isPrimary = banner.variant === "primary";

          return (
            <article
              key={banner.id}
              className={`relative flex min-h-[280px] overflow-hidden rounded-[var(--radius-card)] sm:min-h-[300px] ${
                isPrimary
                  ? "bg-gradient-brand text-white shadow-lift"
                  : "border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 shadow-soft"
              }`}
            >
              <div className="relative z-10 flex flex-1 flex-col justify-center p-6 sm:p-8 lg:max-w-[58%]">
                <h3
                  className={`text-2xl font-bold tracking-tight sm:text-[1.65rem] ${
                    isPrimary ? "text-white" : "text-text"
                  }`}
                >
                  {banner.title}
                </h3>
                <p
                  className={`mt-3 max-w-sm text-sm leading-relaxed sm:text-[15px] ${
                    isPrimary ? "text-white/85" : "text-muted"
                  }`}
                >
                  {banner.description}
                </p>
                <Link
                  href={banner.href}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-[var(--radius-control)] bg-card px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  {banner.cta}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>

              <div
                className={`pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-[46%] ${
                  isPrimary ? "opacity-95" : "opacity-100"
                }`}
              >
                <Image
                  src={banner.image.src}
                  alt={banner.image.alt}
                  fill
                  className={`object-cover ${
                    isPrimary
                      ? "object-[center_20%] [mask-image:linear-gradient(to_left,black_55%,transparent)]"
                      : "object-center [mask-image:linear-gradient(to_left,black_62%,transparent)]"
                  }`}
                  sizes="(max-width: 1024px) 46vw, 280px"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
