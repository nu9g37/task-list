import { BoardColumn } from "./ui/board-column";
import { Sidebar } from "./ui/sidebar";
import { boardColumns, tasks } from "./ui/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                T
              </div>
              <span className="font-bold tracking-tight">Task List</span>
            </div>

            <label className="hidden w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm sm:flex">
              <svg
                aria-hidden="true"
                className="size-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
              <input
                aria-label="Search tasks"
                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search tasks..."
                type="search"
              />
            </label>

            <div className="ml-auto flex items-center gap-3">
              <button
                aria-label="Notifications"
                className="relative grid size-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.97 8.97 0 0 1-2.312 6.022 23.85 23.85 0 0 0 5.455 1.31m5.714 0a24.26 24.26 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <div className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-sm font-bold text-amber-700">
                KP
              </div>
            </div>
          </header>

          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
                <span>Projects</span>
                <span>/</span>
                <span className="text-slate-600">CEDT Internship Portfolio</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Product Development
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Plan, build, and ship the first version of Taskflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  ["KP", "bg-amber-100 text-amber-700"],
                  ["NS", "bg-sky-100 text-sky-700"],
                  ["PT", "bg-emerald-100 text-emerald-700"],
                ].map(([name, color]) => (
                  <div
                    className={`grid size-10 place-items-center rounded-full border-2 border-[#f7f8fc] text-xs font-bold ${color}`}
                    key={name}
                  >
                    {name}
                  </div>
                ))}
                <button
                  aria-label="Add member"
                  className="grid size-10 place-items-center rounded-full border-2 border-[#f7f8fc] bg-slate-200 text-lg text-slate-500"
                  type="button"
                >
                  +
                </button>
              </div>
              <button
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                type="button"
              >
                <span className="text-lg leading-none">+</span>
                Add task
              </button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
            <nav aria-label="Project views" className="flex gap-7">
              <button
                className="border-b-2 border-indigo-600 px-1 pb-4 text-sm font-semibold text-indigo-600"
                type="button"
              >
                Board
              </button>
              <button
                className="px-1 pb-4 text-sm font-medium text-slate-400 transition hover:text-slate-700"
                type="button"
              >
                List
              </button>
              <button
                className="px-1 pb-4 text-sm font-medium text-slate-400 transition hover:text-slate-700"
                type="button"
              >
                Timeline
              </button>
            </nav>
            <button
              className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-500 shadow-sm"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9m-15 0h.008M4.5 12h9m6 0h.008M10.5 18h9m-15 0h.008"
                />
              </svg>
              Filter
            </button>
          </div>

          <div className="grid items-start gap-5 overflow-x-auto pb-6 md:grid-cols-3">
            {boardColumns.map((column) => (
              <BoardColumn
                key={column.status}
                column={column}
                tasks={tasks.filter((task) => task.status === column.status)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
