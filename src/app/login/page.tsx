"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase-client";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShoppingBag } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setLoading(false);
      setError(oauthError.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
            <ShoppingBag className="w-8 h-8 text-white" />
          <span className="text-3xl font-bold text-white tracking-tight">hookit</span>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
          <p className="text-[#666666] text-sm mb-8">Sign in to your store dashboard</p>


          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-12 text-white placeholder-[#444444] focus:outline-none focus:border-[#444444] focus:ring-1 focus:ring-[#444444] transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Forgot password + Footer */}
          <div className="mt-6 pt-6 border-t border-[#222222] space-y-4">
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-[#888888] text-sm hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <p className="text-[#666666] text-sm text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-white font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-[#555555] text-sm hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}