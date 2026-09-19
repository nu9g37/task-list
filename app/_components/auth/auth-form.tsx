"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: "/",
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL: "/",
          });

      if (result.error) {
        setError(result.error.message ?? "Unable to continue. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to continue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {isSignUp ? (
        <label className="block text-sm font-semibold text-slate-700">
          Name
          <input
            autoComplete="name"
            autoFocus
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            value={name}
          />
        </label>
      ) : null}

      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input
          autoComplete="email"
          autoFocus={!isSignUp}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="auth-password">Password</label>
        <div className="relative mt-2">
          <input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            id="auth-password"
            minLength={8}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(undefined);
            }}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-3 text-[11px] font-semibold text-slate-500 hover:text-indigo-600"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isSignUp ? (
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="auth-confirm-password">Confirm password</label>
          <div className="relative mt-2">
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              id="auth-confirm-password"
              minLength={8}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError(undefined);
              }}
              placeholder="Enter your password again"
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConfirmPassword}
              className="absolute inset-y-0 right-3 text-[11px] font-semibold text-slate-500 hover:text-indigo-600"
              onClick={() => setShowConfirmPassword((current) => !current)}
              type="button"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {isSignUp ? "Already have an account?" : "New to Tasklist?"}{" "}
        <Link
          className="font-semibold text-indigo-600 hover:text-indigo-700"
          href={isSignUp ? "/sign-in" : "/sign-up"}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
