"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-[#666666] text-sm mb-6">
            We sent a password reset link to <span className="text-white">{email}</span>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#888888] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to login */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#555555] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Reset password</h1>
          <p className="text-[#666666] text-sm mb-8">
            Enter your email and we&apos;ll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 text-white placeholder-[#444444] focus:outline-none focus:border-[#444444] focus:ring-1 focus:ring-[#444444] transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-[#e8e8e8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}