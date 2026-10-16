"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  CircleNotch,
  Eye,
  EyeSlash,
  LockKey,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import { storeAuthSession } from "@/lib/api";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("The server returned an incomplete login response.");
      }

      storeAuthSession(token, user);
      router.push("/");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setError("Invalid email or password");
      } else if (requestError.response?.data?.message) {
        setError(requestError.response.data.message);
      } else {
        console.error("Sign-in failed:", requestError);
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-zinc-300/40 blur-3xl dark:bg-zinc-800/25" />
        <div className="absolute -bottom-48 -right-36 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-950/20" />
      </div>

      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 shadow-2xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:shadow-black/40">
        <div className="h-1 w-full bg-gradient-to-r from-zinc-300 via-zinc-500 to-zinc-300 dark:from-zinc-800 dark:via-zinc-500 dark:to-zinc-800" />
        <div className="p-6 sm:p-9">
          <header className="mb-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 p-1.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <Image
                  src="/icon.svg"
                  alt="GitHub Analytics logo"
                  width={44}
                  height={44}
                  priority
                  className="h-full w-full rounded-xl"
                />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  GitHub Analytics
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Engineering insights
                </p>
              </div>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Your team&apos;s repositories, pull requests, and activity are
              waiting.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email address
              </label>
              <div className="relative">
                <EnvelopeSimple
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <LockKey
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-3 pl-11 pr-12 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  {showPassword ? (
                    <EyeSlash size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-white dark:text-black dark:shadow-black/20 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
            <LockKey size={14} aria-hidden="true" />
            <span>Your workspace is protected with secure sign-in</span>
          </div>
        </div>
      </section>
    </main>
  );
}
