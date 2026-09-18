import { redirect } from "next/navigation";
import { AuthForm } from "@/app/_components/auth/auth-form";
import { getCurrentSession } from "@/lib/auth-session";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <div className="grid size-11 place-items-center rounded-2xl bg-indigo-600 font-black text-white">T</div>
        <span className="text-xl font-bold">Tasklist</span>
      </div>
      <p className="text-sm font-semibold text-indigo-600">Welcome back</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in to Tasklist</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Continue where you left off and keep your work moving.
      </p>
      <AuthForm mode="sign-in" />
    </div>
  );
}
