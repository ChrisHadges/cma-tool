"use client";

import { useEffect } from "react";

/**
 * IntersectionObserver-based scroll animation hook.
 * Watches all elements with [data-animate] and adds "animate-in" class when visible.
 */
export function useScrollAnimations() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-animate]");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
