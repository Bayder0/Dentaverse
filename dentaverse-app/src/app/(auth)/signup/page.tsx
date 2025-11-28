"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    name: "",
    role: "SELLER",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
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
              Create New Account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details to create an account
            </p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Account created successfully! Redirecting to login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-0 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                placeholder="Enter your name"
              />
            </label>

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
                placeholder="your.email@example.com"
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
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                value={formState.role}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, role: event.target.value }))
                }
                required
              >
                <option value="SELLER">Seller</option>
                <option value="OWNER">Owner</option>
              </select>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-cyan-600 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

