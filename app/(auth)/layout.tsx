export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-screen bg-[#f7f8fc] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-indigo-500 font-black">T</div>
          <span className="text-xl font-bold">Tasklist</span>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
            A calmer way to ship
          </p>
          <h2 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
            Turn your plans into progress.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            Keep projects, priorities, and deadlines in one focused workspace.
          </p>
        </div>

        <p className="text-sm text-slate-500">Tasklist · Student workspace</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">{children}</section>
    </main>
  );
}
