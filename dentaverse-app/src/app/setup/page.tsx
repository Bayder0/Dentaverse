"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createOwner = async () => {
    setLoading(true);
    setStatus(null);
    
    try {
      const response = await fetch("/api/setup-owner", { method: "POST" });
      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: "success", message: data.message || "Owner user created successfully! Redirecting to login..." });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        const errorMsg = data.error || data.details || "Failed to create owner user";
        setStatus({ type: "error", message: `Error: ${errorMsg}. Make sure your DATABASE_URL is correctly configured.` });
      }
    } catch (error: any) {
      setStatus({ type: "error", message: `Network error: ${error.message}. Check your database connection.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-cyan-900 mb-2">Setup Owner Account</h1>
        <p className="text-cyan-700 mb-6">Click the button below to create the owner user account.</p>
        
        {status && (
          <div className={`mb-4 p-4 rounded-lg ${
            status.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {status.message}
          </div>
        )}

        <button
          onClick={createOwner}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? "Creating..." : "Create Owner User"}
        </button>

        <div className="mt-6 p-4 bg-cyan-50 rounded-lg">
          <p className="text-sm font-semibold text-cyan-900 mb-2">Credentials will be:</p>
          <p className="text-sm text-cyan-700">Email: <strong>owner@dentaverse.com</strong></p>
          <p className="text-sm text-cyan-700">Password: <strong>dentaverse2024</strong></p>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 w-full text-cyan-600 hover:text-cyan-700 font-medium py-2"
        >
          Go to Login →
        </button>
      </div>
    </div>
  );
}

