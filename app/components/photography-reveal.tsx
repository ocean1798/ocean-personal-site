"use client";

import { useEffect } from "react";

export function PhotographyReveal() {
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-photo-reveal]"),
    );

    if (!("IntersectionObserver" in window)) {
      return;
    }

    document.documentElement.classList.add("photography-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    for (const item of items) {
      observer.observe(item);
    }

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("photography-reveal-ready");
    };
  }, []);

  return null;
}
