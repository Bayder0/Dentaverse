"use client";

import { useEffect } from "react";

const IGNORED_PATTERNS = [
  "Invalid source map. Only conformant source maps can be used",
  "sourceMapURL could not be parsed",
  "Only plain objects can be passed to Client Components",
  "Functions cannot be passed directly to Client Components",
  "An async function with useActionState was called outside of a transition",
];

export function ConsoleFilter() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const firstArg = args[0];
      if (
        typeof firstArg === "string" &&
        IGNORED_PATTERNS.some((pattern) => firstArg.includes(pattern))
      ) {
        return;
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
