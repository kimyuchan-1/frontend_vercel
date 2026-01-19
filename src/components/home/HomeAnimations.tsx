'use client'

// Client Component - Handles scroll animations only
import { useInView } from "@/hooks/useInView";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: string;
}

function AnimatedSection({ children, delay = "" }: AnimatedSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${delay} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export function AnimatedFeatures({ children }: { children: ReactNode }) {
  return <AnimatedSection>{children}</AnimatedSection>;
}

export function AnimatedTechStack({ children }: { children: ReactNode }) {
  return <AnimatedSection delay="delay-100">{children}</AnimatedSection>;
}

export function AnimatedCTA({ children }: { children: ReactNode }) {
  return <AnimatedSection>{children}</AnimatedSection>;
}
