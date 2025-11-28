"use client";

import { useRouter } from "next/navigation";

type Props = {
  variant?: "ghost" | "solid";
};

export function LogoutButton({ variant = "ghost" }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/simple-logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
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

