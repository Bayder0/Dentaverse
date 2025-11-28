"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: formState.email,
      password: formState.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email/password. Please try again.");
      return;
    }

    router.push("/dashboard");
  };

  const createOwner = async () => {
    setIsCreatingOwner(true);
    setSetupStatus(null);
    setError(null);
    
    try {
      const response = await fetch("/api/setup-owner", { method: "POST" });
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus({ type: "success", message: "Owner account created! Now sign in with owner@dentaverse.com / dentaverse2024" });
        setFormState({ email: "owner@dentaverse.com", password: "dentaverse2024" });
      } else {
        setSetupStatus({ type: "error", message: data.error || "Failed to create owner. Check your database connection." });
      }
    } catch (error: any) {
      setSetupStatus({ type: "error", message: `Error: ${error.message}` });
    } finally {
      setIsCreatingOwner(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950/5">
      <div className="w-full bg-cyan-600 text-white text-center py-2 px-4">
        <p className="text-sm font-medium">
          Created and Designed by <span className="font-bold">Bayder Bassim</span>
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
            DentaVerse
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Sign in to the control center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Use the admin/seller credentials you created on the info page.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {setupStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              setupStatus.type === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {setupStatus.message}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-cyan-600 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing you in..." : "Sign in"}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or</span>
            </div>
          </div>
          <button
            type="button"
            onClick={createOwner}
            disabled={isCreatingOwner}
            className="flex w-full items-center justify-center rounded-lg border-2 border-cyan-600 bg-white py-2 text-sm font-semibold text-cyan-600 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingOwner ? "Creating Owner Account..." : "Create Owner Account"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}

