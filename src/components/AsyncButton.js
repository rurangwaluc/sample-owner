"use client";

import { useEffect, useRef, useState } from "react";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

export default function AsyncButton({
  idleText = "Submit",
  loadingText = "Submitting...",
  successText = "Done",
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
  type = "button",
  successDurationMs = 1200,
}) {
  const [state, setState] = useState("idle");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleClick(e) {
    if (disabled || state === "loading") return;

    try {
      setState("loading");
      await onClick?.(e);
      setState("success");

      timerRef.current = setTimeout(() => {
        setState("idle");
      }, successDurationMs);
    } catch (error) {
      setState("idle");
      throw error;
    }
  }

  const isPrimary = variant === "primary";

  const baseClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

  const variantClass = isPrimary
    ? "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
    : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800";

  let text = idleText;
  if (state === "loading") text = loadingText;
  if (state === "success") text = successText;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || state === "loading"}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {state === "loading" ? <SpinnerIcon /> : null}
      {state === "success" ? <CheckIcon /> : null}
      <span>{text}</span>
    </button>
  );
}
