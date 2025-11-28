"use client";

import { signOut } from "next-auth/react";

type Props = {
  variant?: "ghost" | "solid";
};

export function LogoutButton({ variant = "ghost" }: Props) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={`rounded-lg px-4 py-3 text-base font-bold transition ${
        variant === "solid"
          ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
          : "text-cyan-700 hover:text-cyan-900 hover:bg-cyan-100"
      }`}
    >
      Sign out
    </button>
  );
}

