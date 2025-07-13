"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/",
      });
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
      <div className={`bg-[var(--bg-light)] p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md border border-[var(--border)] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 group">
          <img 
            src="/logo.png" 
            alt="EduTrack Logo" 
            className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" 
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mb-1 sm:mb-2 group-hover:text-[var(--primary)]/80 transition-colors duration-300">EduTrack</h1>
          <span className="text-base sm:text-lg text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors duration-300">Create your account</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6 w-full">
          <div className="flex flex-col gap-1 sm:gap-2 group">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1 sm:gap-2 group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1 sm:gap-2 group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="p-3 sm:p-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[var(--primary)] text-[var(--btn-text)] font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
          
          {error && (
            <div className="text-[var(--danger)] text-center text-sm sm:text-base font-semibold mt-2 p-2 sm:p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 animate-fadein">
              {error}
            </div>
          )}
        </form>

        {/* Sign In Link */}
        <div className="mt-6 sm:mt-8 text-center text-[var(--text-muted)] text-sm sm:text-base">
          Already have an account?{' '}
          <Link 
            href="/auth/signin" 
            className="text-[var(--primary)] font-semibold hover:text-[var(--primary)]/80 hover:underline transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 