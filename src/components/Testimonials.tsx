"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/constants";

function useVisibleCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setCount(3);
      else if (window.matchMedia("(min-width: 640px)").matches) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function TestimonialCard({
  quote,
  name,
  role,
  avatar,
  avatarColor,
  rating,
}: (typeof testimonials)[number]) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border/60 bg-card p-6 shadow-soft sm:p-7">
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            size={18}
            className="fill-warning text-warning"
            aria-hidden
          />
        ))}
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-muted sm:text-[15px]">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="relative mt-8 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor }}
        >
          {avatar}
        </div>
        <div>
          <p className="font-bold text-text">{name}</p>
          <p className="text-sm text-muted">{role}</p>
        </div>
      </div>

      <Quote
        size={72}
        strokeWidth={1}
        className="pointer-events-none absolute bottom-4 right-4 text-border/80"
        aria-hidden
      />
    </article>
  );
}

export function Testimonials() {
  const visibleCount = useVisibleCount();
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  const visible = testimonials.slice(activeIndex, activeIndex + visibleCount);

  return (
    <section className="border-t border-border/60 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
          Candidate Testimonials
        </h2>

        <div className="relative mt-12">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary shadow-soft transition hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40 sm:-left-5 lg:-left-6"
            aria-label="Previous testimonials"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="grid gap-5 px-8 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-12">
            {visible.map((item) => (
              <TestimonialCard key={item.id} {...item} />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex >= maxIndex}
            className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary shadow-soft transition hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-40 sm:-right-5 lg:-right-6"
            aria-label="Next testimonials"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {testimonials.map((item, i) => {
            const isActive = i >= activeIndex && i < activeIndex + visibleCount;
            const isPrimary = i === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(Math.min(i, maxIndex))}
                className={`h-2 rounded-full transition-all ${
                  isPrimary
                    ? "w-8 bg-primary"
                    : isActive
                      ? "w-2 bg-primary/40"
                      : "w-2 bg-primary/20 hover:bg-primary/35"
                }`}
                aria-label={`Go to testimonial from ${item.name}`}
                aria-current={isPrimary ? "true" : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
