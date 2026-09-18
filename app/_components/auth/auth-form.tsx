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
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

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
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
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

      <label className="block text-sm font-semibold text-slate-700">
        Password
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isSignUp ? "At least 8 characters" : "Your password"}
          required
          type="password"
          value={password}
        />
      </label>

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
